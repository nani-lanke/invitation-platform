/* Generates the redesign artwork for the 100 selected invitations with the
   local FLUX.2 Klein 4B (ComfyUI) and writes each card's working copy to
   redesign-100/cards/<slug>/. Resumable: raw FLUX outputs are kept in
   work/raw and reused. Usage: node redesign-100/work/gen.js [--only=a,b] [--force=kind] */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { generate } = require('./flux');
const BRIEFS = require('./briefs');
const INV = require('./inventory.json');

const OUT = path.resolve(__dirname, '..', 'cards');
const RAW = path.join(__dirname, 'raw');
const LOG = path.join(__dirname, 'gen-log.json');
fs.mkdirSync(RAW, { recursive: true });

const REAL = 'photorealistic, premium luxury wedding decor photography, rich true colours, ultra fine detail, no text, no letters, no watermark, no logo, no people';
const ON_WHITE = REAL + ', isolated on a plain pure white background';
const TIME_RE = /dawn|dusk|sunset|sunrise|night|twilight|golden hour|morning|evening|afternoon|light/;
const VENUE_SIZE = { split: [1152, 864], stack: [1216, 688], framed: [864, 1152] };

function lum(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 1;
  const n = parseInt(m[1], 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function seedOf(s, n) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 9000000) + 1000000 + n * 7919; }

/* A brief ending in ' @dark' is a white subject: render it on a plain dark
   background so the key keeps the white object opaque. */
const ON_DARK = REAL + ', isolated on a plain solid dark charcoal grey background';
function onBg(text) { return /@dark$/.test(text) ? [text.replace(/\s*@dark$/, ''), ON_DARK, 'dark'] : [text, ON_WHITE, 'light']; }
function tasksFor(t) {
  let [venue, crest, flora, scene] = BRIEFS[t.slug];
  const [crestT, crestBg, crestTone] = onBg(crest), [floraT, floraBg, floraTone] = onBg(flora);
  crest = crestT; flora = floraT;
  const dark = lum(t.colors.bg1) < 0.2;
  const botanical = t.spec.layout === 'botanical';
  const vs = VENUE_SIZE[t.spec.venue] || VENUE_SIZE.split;
  const light = TIME_RE.test(scene) ? '' : (dark ? ', deep evening twilight with warm lamp glow' : ', soft warm golden daylight with a pale hazy sky');
  const list = [
    { kind: 'venue', w: vs[0], h: vs[1], key: 'none', ext: 'jpg',
      text: 'Wide photograph of ' + venue + ', wedding venue interior and decor, warm inviting light, ' + REAL },
    { kind: 'crest', w: 640, h: 640, key: 'flood', ext: 'png', bg: botanical ? floraTone : crestTone,
      text: botanical
        ? 'Elegant real fresh flower spray of ' + flora + ', arranged diagonally, ' + floraBg
        : 'Small premium ornament for the top of a wedding invitation: ' + crest + ', front view, centred, symmetrical, ' + crestBg },
    { kind: 'footer', w: 1216, h: 448, key: 'none', ext: 'jpg',
      text: 'Wide panoramic landscape photograph of ' + scene + light + ', calm serene composition, the sky above fading smoothly into soft plain haze, ' + REAL }
  ];
  if (!botanical) list.push({ kind: 'corner', w: 640, h: 832, key: 'flood', ext: 'png',
    text: 'Real fresh flower arrangement spreading from the top-left: a lush compact cluster of ' + flora + (/string|strand|garland/.test(flora) ? ' with a few flower strings hanging straight down' : ', no ribbons, no strings, no stems hanging') + ', no paper, no frame, no border lines, ' + ON_WHITE });
  return list;
}

/* Keys a white-background render to alpha (flood fill from the border only,
   so white petals stay opaque) and crops to content; same method as
   scripts/generate-telugu-reference-assets.js. Returns coverage stats too. */
function keyInPage([src, flip]) {
  return (async () => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H); const p = d.data;
    const EDGE = 6;
    const onEdge = (x, y) => x < EDGE || y < EDGE || x >= W - EDGE || y >= H - EDGE;
    const samples = [];
    [[EDGE, EDGE], [W - EDGE - 10, EDGE], [EDGE, H - EDGE - 10], [W - EDGE - 10, H - EDGE - 10]].forEach(([sx, sy]) => {
      for (let y = sy; y < sy + 10; y++) for (let x = sx; x < sx + 10; x++) { const i = (y * W + x) * 4; samples.push([p[i], p[i + 1], p[i + 2]]); }
    });
    const bg = [0, 1, 2].map(ch => samples.map(s => s[ch]).sort((a, b) => a - b)[samples.length >> 1]);
    const dist = new Float32Array(W * H);
    for (let j = 0; j < W * H; j++) { const i = j * 4; dist[j] = Math.max(Math.abs(p[i] - bg[0]), Math.abs(p[i + 1] - bg[1]), Math.abs(p[i + 2] - bg[2])); }
    const LO = 10, HI = 46;
    const seen = new Uint8Array(W * H); const queue = new Int32Array(W * H); let qh = 0, qt = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (onEdge(x, y)) { const j = y * W + x; seen[j] = 1; queue[qt++] = j; dist[j] = 0; }
    while (qh < qt) {
      const j = queue[qh++]; const x = j % W, y = (j / W) | 0;
      const nb = [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1];
      for (const n of nb) if (n >= 0 && !seen[n] && dist[n] < HI) { seen[n] = 1; queue[qt++] = n; }
    }
    let opaque = 0;
    for (let j = 0; j < W * H; j++) {
      const i = j * 4;
      if (!seen[j]) { p[i + 3] = 255; opaque++; continue; }
      const a = Math.min(1, Math.max(0, (dist[j] - LO) / (HI - LO)));
      p[i + 3] = Math.round(a * 255);
      if (a > 0) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.min(255, Math.max(0, (p[i + ch] - bg[ch] * (1 - a)) / a));
    }
    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let j = 0; j < W * H; j++) if (p[j * 4 + 3] > 25) { const x = j % W, y = (j / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    ctx.putImageData(d, 0, 0);
    const bgLight = bg.every(v => v > 200);
    if (maxX < 0) return { ok: false, coverage: 0, bgLight };
    const o = document.createElement('canvas'); o.width = maxX - minX + 1; o.height = maxY - minY + 1;
    o.getContext('2d').drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
    const out = { ok: true, coverage: opaque / (W * H), bgLight, w: o.width, h: o.height, png: o.toDataURL('image/png') };
    if (flip) {
      const f = document.createElement('canvas'); f.width = o.width; f.height = o.height;
      const fx = f.getContext('2d'); fx.translate(o.width, 0); fx.scale(-1, 1); fx.drawImage(o, 0, 0);
      out.flipped = f.toDataURL('image/png');
    }
    return out;
  })();
}

async function toJpeg(page, file, dest) {
  const src = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  const jpg = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/jpeg', 0.9);
  }, src);
  fs.writeFileSync(dest, Buffer.from(jpg.split(',')[1], 'base64'));
}
const b64 = s => Buffer.from(s.split(',')[1], 'base64');

(async () => {
  const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
  const force = (process.argv.find(a => a.startsWith('--force=')) || '').slice(8).split(',').filter(Boolean);
  /* --redo=slug:kind,... regenerates individual assets rejected in visual review. */
  const redo = (process.argv.find(a => a.startsWith('--redo=')) || '').slice(7).split(',').filter(Boolean);
  redo.forEach(r => { const s = r.split(':')[0]; if (!only.includes(s)) only.push(s); });
  const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : {};
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const slugs = Object.keys(BRIEFS).filter(s => !only.length || only.includes(s));
  let n = 0;
  for (const slug of slugs) {
    n++;
    const t = INV.find(i => i.slug === slug);
    const dir = path.join(OUT, slug); fs.mkdirSync(path.join(dir, 'images', 'wedding-motifs'), { recursive: true });
    log[slug] = log[slug] || {};
    for (const task of tasksFor(t)) {
      const rec = log[slug][task.kind] || {};
      const dest = path.join(dir, task.kind + '.' + task.ext);
      if (rec.ok && fs.existsSync(dest) && !force.includes(task.kind) && !redo.includes(slug + ':' + task.kind)) continue;
      if (redo.includes(slug + ':' + task.kind)) rec.redoneAfterReview = (rec.redoneAfterReview || 0) + 1;
      let done = false;
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        const seed = seedOf(slug + task.kind, attempt);
        const rawFile = path.join(RAW, slug + '__' + task.kind + '__' + seed + '_' + seedOf(task.text, 0).toString(36) + '.png');
        try {
          if (!fs.existsSync(rawFile)) {
            const t0 = Date.now();
            const f = await generate({ prefix: 'RD100_' + slug + '_' + task.kind, w: task.w, h: task.h, seed, text: task.text });
            fs.copyFileSync(f, rawFile);
            rec.seconds = Math.round((Date.now() - t0) / 1000);
          }
          if (task.key === 'none') {
            await toJpeg(page, rawFile, dest);
            Object.assign(rec, { ok: true, seed, raw: path.relative(OUT, rawFile), prompt: task.text, size: [task.w, task.h] });
            done = true;
          } else {
            const src = 'data:image/png;base64,' + fs.readFileSync(rawFile).toString('base64');
            const k = await page.evaluate(keyInPage, [src, task.kind === 'corner']);
            // QA: background must be white-ish, subject between 4% and 88% of the frame.
            const pass = k.ok && (task.bg === 'dark' || k.bgLight) && k.coverage > 0.04 && k.coverage < 0.88;
            Object.assign(rec, { seed, raw: path.relative(OUT, rawFile), prompt: task.text, size: [task.w, task.h], coverage: +(k.coverage || 0).toFixed(3), bgLight: k.bgLight });
            if (!pass) { rec.ok = false; rec.error = 'key QA failed (coverage ' + rec.coverage + ', bgLight ' + k.bgLight + ')'; continue; }
            fs.writeFileSync(dest, b64(k.png));
            if (k.flipped) fs.writeFileSync(path.join(dir, 'corner-tr.png'), b64(k.flipped));
            if (task.kind === 'corner') fs.renameSync(dest, path.join(dir, 'corner-tl.png')), fs.copyFileSync(path.join(dir, 'corner-tl.png'), dest);
            if (task.kind === 'crest') {
              // The renderer maps the motif to <assetPrefix>images/wedding-motifs/<slug>.svg,
              // so the redesigned crest is wrapped as that file in the card's own folder.
              fs.writeFileSync(path.join(dir, 'images', 'wedding-motifs', slug + '.svg'),
                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + k.w + ' ' + k.h + '" width="' + k.w + '" height="' + k.h + '">' +
                '<image width="' + k.w + '" height="' + k.h + '" href="' + k.png + '" xlink:href="' + k.png + '"/></svg>');
            }
            rec.ok = true; delete rec.error; rec.dims = [k.w, k.h];
            done = true;
          }
        } catch (e) { rec.ok = false; rec.error = e.message; }
      }
      log[slug][task.kind] = rec;
      fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
      console.log(n + '/' + slugs.length, slug, task.kind, rec.ok ? 'ok' : 'FAIL ' + rec.error, rec.seconds ? rec.seconds + 's' : '');
    }
  }
  await browser.close();
})();
