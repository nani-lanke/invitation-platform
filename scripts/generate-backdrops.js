/* Painted paper for the backdrop cards (FLUX.2 Klein 4B, local ComfyUI): per card
   paper.jpg (a plain painted paper texture, safe to stretch over any card
   length) and venue.jpg, from scripts/backdrop-briefs.js. The decoration is
   separate layers (top garland, bottom cluster, side vines) made by
   node scripts/generate-engagement-decor.js --set=backdrops.
   The paper colour is measured into images/backdrops/manifest.json (paper).
   Output: images/backdrops/<slug>/, raw renders in ai-generated/comfyui-raw/BACKDROPS/.
   Usage: node scripts/generate-backdrops.js [slug ...] [--force]
   then:  node scripts/build-backdrop-rows.js */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { generate } = require('../redesign-100/work/flux');
const B = require('./backdrop-briefs');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'backdrops');
const RAW = path.join(ROOT, 'ai-generated', 'comfyui-raw', 'BACKDROPS');
const MF = path.join(OUT, 'manifest.json');
const NO = 'no text, no letters, no numbers, no watermark, no logo, no people';
function seedOf(s, n) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 9000000) + 1000000 + n * 7919; }
function bgText(r) {
  const [, , tone, paper] = r;
  return tone === 'dark'
    ? 'A sheet of plain empty smooth ' + paper + ' card stock with a very subtle fine linen texture and a soft gentle vignette, completely blank, evenly lit, flat top view, filling the whole image edge to edge, ' + NO
    : 'A sheet of plain empty ' + paper + ' hand made watercolour paper with a soft subtle watercolour wash texture, completely blank, evenly lit, flat top view, filling the whole image edge to edge, ' + NO;
}
/* In the page: the centre's median colour and how busy it is; the JPEG. */
function measure(src) {
  return (async () => {
    const i = new Image(); i.src = src; await i.decode();
    const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    const W = c.width, H = c.height, d = x.getImageData(Math.round(W * 0.3), Math.round(H * 0.35), Math.round(W * 0.4), Math.round(H * 0.3)).data;
    const ch = [[], [], []]; let busy = 0, n = 0;
    for (let k = 0; k < d.length; k += 16) { ch[0].push(d[k]); ch[1].push(d[k + 1]); ch[2].push(d[k + 2]); n++; }
    const med = ch.map(a => a.slice().sort((p, q) => p - q)[a.length >> 1]);
    for (let k = 0; k < n; k++) if (Math.max(Math.abs(ch[0][k] - med[0]), Math.abs(ch[1][k] - med[1]), Math.abs(ch[2][k] - med[2])) > 28) busy++;
    const hex = '#' + med.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    return { paper: hex, busy: +(busy / n).toFixed(3), jpg: c.toDataURL('image/jpeg', 0.9) };
  })();
}
async function jpeg(page, raw) {
  return page.evaluate(async s => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); return c.toDataURL('image/jpeg', 0.88); },
    'data:image/png;base64,' + fs.readFileSync(raw).toString('base64'));
}

(async () => {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), force = process.argv.includes('--force');
  const slugs = args.length ? args : Object.keys(B);
  const log = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, 'utf8')) : {};
  const save = () => fs.writeFileSync(MF, JSON.stringify(log, null, 1));
  fs.mkdirSync(RAW, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage();
  for (const slug of slugs) {
    const r = B[slug]; if (!r) { console.log('unknown', slug); continue; }
    const dir = path.join(OUT, slug); fs.mkdirSync(dir, { recursive: true });
    const bgDest = path.join(dir, 'paper.jpg');
    if (force || !fs.existsSync(bgDest) || !(log[slug] && log[slug].paperFile)) {
      let done = false;
      for (let attempt = 0; attempt < (+process.env.ATTEMPTS || 3) && !done; attempt++) {
        const seed = seedOf(slug + 'paper', attempt), text = bgText(r), raw = path.join(RAW, slug + '__paper__' + seed + '.png');
        if (!fs.existsSync(raw)) { const o = await generate({ prefix: 'BD_' + slug, w: 768, h: 1024, seed, text }); fs.copyFileSync(o, raw); try { fs.unlinkSync(o); } catch (e) {} }
        const m = await page.evaluate(measure, 'data:image/png;base64,' + fs.readFileSync(raw).toString('base64'));
        // The centre must be plain enough to carry text.
        if (m.busy > 0.12 && attempt < (+process.env.ATTEMPTS || 3) - 1) { console.log('retry', slug, 'busy centre', m.busy); continue; }
        fs.writeFileSync(bgDest, Buffer.from(m.jpg.split(',')[1], 'base64'));
        log[slug] = Object.assign(log[slug] || {}, { model: 'flux-2-klein-4b.safetensors', seed, prompt: text, raw: path.relative(ROOT, raw).split(path.sep).join('/'), paper: m.paper, busy: m.busy, paperFile: 'paper.jpg' });
        save(); console.log('ok', slug + '/paper.jpg', m.paper, 'busy', m.busy); done = true;
      }
    }
    const venueDest = path.join(dir, 'venue.jpg');
    if (force || !fs.existsSync(venueDest)) {
      const seed = seedOf(slug + 'venue', 0), raw = path.join(RAW, slug + '__venue__' + seed + '.png');
      const text = 'Wide photograph of ' + r[7] + ', celebration venue decor, no people, warm inviting light, photorealistic, rich true colours, ultra fine detail, ' + NO;
      if (!fs.existsSync(raw)) { const o = await generate({ prefix: 'BD_' + slug, w: 1152, h: 864, seed, text }); fs.copyFileSync(o, raw); try { fs.unlinkSync(o); } catch (e) {} }
      fs.writeFileSync(venueDest, Buffer.from((await jpeg(page, raw)).split(',')[1], 'base64'));
      log[slug] = Object.assign(log[slug] || {}, { venue: { seed, prompt: text } });
      save(); console.log('ok', slug + '/venue.jpg');
    }
  }
  save(); await b.close();
})();
