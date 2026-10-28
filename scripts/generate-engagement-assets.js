/* FLUX.2 Klein 4B (local ComfyUI) photos for engagement cards on the design
   engine. Raw outputs go to ai-generated/comfyui-raw/ENG/ (kept in the project).
   Usage: node scripts/generate-engagement-assets.js [slug ...] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { generate } = require('../redesign-100/work/flux');
const ROOT = path.resolve(__dirname, '..');
const REAL = 'photorealistic, premium luxury wedding decor photography, rich true colours, ultra fine detail, no text, no letters, no watermark, no logo, no people';
const ON_WHITE = REAL + ', isolated on a plain pure white background';
const TASKS = {
  'blush-engagement': [
    { file: 'crest.png', w: 768, h: 768, seed: 7310442, key: 'flood',
      text: 'A sparkling solitaire diamond engagement ring standing in an open blush pink velvet ring box, two small blush garden roses and green leaves beside the box, front view, centred, ' + ON_WHITE },
    { file: 'corner-top.png', w: 768, h: 768, seed: 7310443, key: 'flood',
      text: 'Lush spray of fresh blush pink garden roses, soft peonies, white spray roses and eucalyptus leaves spreading from the top-left corner along the top edge and down the left edge, empty space in the bottom right, no ribbons, ' + ON_WHITE },
    { file: 'corner-bottom.png', w: 768, h: 768, seed: 7310444, key: 'flood',
      text: 'Low cluster of fresh blush pink garden roses, peonies, rosebuds and soft green leaves growing upward from the bottom-left corner, empty space in the top right, ' + ON_WHITE },
    { file: 'sprig.png', w: 768, h: 384, seed: 7310445, key: 'flood',
      text: 'A small horizontal sprig of one blush pink rosebud with soft green leaves and tiny white flowers, curving gently, ' + ON_WHITE },
    { file: 'venue.jpg', w: 1152, h: 864, seed: 5521907,
      text: 'Wide photograph of an elegant Indian engagement ring ceremony stage in a hotel ballroom, a soft blush pink and ivory floral arch of garden roses and peonies, a low decorated platform with two ivory chairs, a small table holding a ring tray, hanging crystal lights and candles, warm golden evening light, ' + REAL }
  ]
};
/* Every other engagement card: the same five pieces from its own brief. */
const BRIEFS = require('./engagement-briefs');
function seedOf(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 9000000) + 1000000; }
Object.entries(BRIEFS).filter(([, v]) => Array.isArray(v) && v.length === 3 && v[2]).forEach(([slug, [crest, flora, venue]]) => {
  TASKS[slug] = [
    { file: 'crest.png', w: 768, h: 768, seed: seedOf(slug + 'crest'), key: 'flood',
      text: 'Small premium ornament for the top of an engagement invitation: ' + crest + ', front view, centred, ' + ON_WHITE },
    { file: 'corner-top.png', w: 768, h: 768, seed: seedOf(slug + 'top'), key: 'flood',
      text: 'Lush spray of fresh ' + flora + ' spreading from the top-left corner along the top edge and down the left edge, empty space in the bottom right, no ribbons, no paper, no frame, ' + ON_WHITE },
    { file: 'corner-bottom.png', w: 768, h: 768, seed: seedOf(slug + 'bottom'), key: 'flood',
      text: 'Low cluster of fresh ' + flora + ' growing upward from the bottom-left corner, empty space in the top right, no paper, no frame, ' + ON_WHITE },
    { file: 'sprig.png', w: 768, h: 384, seed: seedOf(slug + 'sprig'), key: 'flood',
      text: 'A small horizontal sprig of ' + flora + ', one small bloom with a few leaves, curving gently, ' + ON_WHITE },
    { file: 'venue.jpg', w: 1152, h: 864, seed: seedOf(slug + 'venue'),
      text: 'Wide photograph of ' + venue + ', engagement ceremony venue decor, warm inviting light, ' + REAL }
  ];
});

/* White-background render -> alpha: flood fill from the border only (white
   petals stay opaque), then crop. Same method as redesign-100/work/gen.js. */
function floodKey(src) {
  return (async () => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, EDGE = 6;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H), p = d.data;
    const onEdge = (x, y) => x < EDGE || y < EDGE || x >= W - EDGE || y >= H - EDGE;
    const samples = [];
    [[EDGE, EDGE], [W - EDGE - 10, EDGE], [EDGE, H - EDGE - 10], [W - EDGE - 10, H - EDGE - 10]].forEach(([sx, sy]) => {
      for (let y = sy; y < sy + 10; y++) for (let x = sx; x < sx + 10; x++) { const i = (y * W + x) * 4; samples.push([p[i], p[i + 1], p[i + 2]]); }
    });
    const bg = [0, 1, 2].map(ch => samples.map(s => s[ch]).sort((a, b) => a - b)[samples.length >> 1]);
    const dist = new Float32Array(W * H);
    for (let j = 0; j < W * H; j++) { const i = j * 4; dist[j] = Math.max(Math.abs(p[i] - bg[0]), Math.abs(p[i + 1] - bg[1]), Math.abs(p[i + 2] - bg[2])); }
    const LO = 10, HI = 46, seen = new Uint8Array(W * H), q = new Int32Array(W * H); let qh = 0, qt = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (onEdge(x, y)) { const j = y * W + x; seen[j] = 1; q[qt++] = j; dist[j] = 0; }
    while (qh < qt) { const j = q[qh++], x = j % W, y = (j / W) | 0;
      for (const n of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1]) if (n >= 0 && !seen[n] && dist[n] < HI) { seen[n] = 1; q[qt++] = n; } }
    let opaque = 0, minX = W, minY = H, maxX = -1, maxY = -1;
    for (let j = 0; j < W * H; j++) {
      const i = j * 4;
      if (!seen[j]) { p[i + 3] = 255; opaque++; }
      else { const a = Math.min(1, Math.max(0, (dist[j] - LO) / (HI - LO))); p[i + 3] = Math.round(a * 255);
        if (a > 0) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.min(255, Math.max(0, (p[i + ch] - bg[ch] * (1 - a)) / a)); }
      if (p[i + 3] > 25) { const x = j % W, y = (j / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    const coverage = +(opaque / (W * H)).toFixed(3);
    if (maxX < 0 || !bg.every(v => v > 200) || coverage < 0.04 || coverage > 0.88) return { ok: false, coverage };
    ctx.putImageData(d, 0, 0);
    const o = document.createElement('canvas'); o.width = maxX - minX + 1; o.height = maxY - minY + 1;
    o.getContext('2d').drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
    return { ok: true, coverage, png: o.toDataURL('image/png') };
  })();
}

(async () => {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const slugs = args.length ? args : Object.keys(TASKS);
  const b = await chromium.launch(); const page = await b.newPage();
  // The manifest is saved after every image, so an interrupted run loses nothing.
  const mf = path.join(ROOT, 'images', 'engagement', 'manifest.json');
  const log = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : {};
  const save = () => fs.writeFileSync(mf, JSON.stringify(log, null, 1));
  for (const slug of slugs) for (let ti = 0; ti < TASKS[slug].length; ti++) { const t = TASKS[slug][ti];
    const dest0 = path.join(ROOT, 'images', 'engagement', slug, t.file);
    if (fs.existsSync(dest0) && !process.argv.includes('--force')) { console.log('skip', slug, t.file); continue; }
    const raw = path.join(ROOT, 'ai-generated', 'comfyui-raw', 'ENG', slug + '__' + t.file.replace(/\.\w+$/, '') + '__' + t.seed + '.png');
    fs.mkdirSync(path.dirname(raw), { recursive: true });
    if (!fs.existsSync(raw)) { const out = await generate({ prefix: 'ENG_' + slug, w: t.w, h: t.h, seed: t.seed, text: t.text }); fs.copyFileSync(out, raw); try { fs.unlinkSync(out); } catch (e) { /* OneDrive lock: collect-comfyui-images.py moves it later */ } }
    const src = 'data:image/png;base64,' + fs.readFileSync(raw).toString('base64');
    if (t.key === 'flood') {
      const k = await page.evaluate(floodKey, src);
      if (!k.ok) {
        t.tries = (t.tries || 0) + 1;
        console.log((t.tries < 3 ? 'retry ' : 'FAIL ') + slug + ' ' + t.file + ' key QA coverage ' + k.coverage);
        if (t.tries < 3) { t.seed += 7919; TASKS[slug].push(t); }
        continue;
      }
      const dest = path.join(ROOT, 'images', 'engagement', slug, t.file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(k.png.split(',')[1], 'base64'));
      log[slug + '/' + t.file] = { model: 'flux-2-klein-4b.safetensors', seed: t.seed, prompt: t.text, raw: path.relative(ROOT, raw).split(path.sep).join('/'), coverage: k.coverage };
      save(); console.log('ok', slug, t.file);
      continue;
    }
    const jpg = await page.evaluate(async s => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); return c.toDataURL('image/jpeg', 0.88); }, src);
    const dest = path.join(ROOT, 'images', 'engagement', slug, t.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(jpg.split(',')[1], 'base64'));
    log[slug + '/' + t.file] = { model: 'flux-2-klein-4b.safetensors', seed: t.seed, prompt: t.text, raw: path.relative(ROOT, raw).split(path.sep).join('/') };
    save(); console.log('ok', slug, t.file);
  }
  save();
  await b.close();
})();
