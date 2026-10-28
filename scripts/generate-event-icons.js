/* Photo-real programme images (FLUX.2 Klein 4B, local ComfyUI) that replace the
   gold line-art event icons (EVENT_ICONS in js/wedding-designs.js) on every card.
   Each object is rendered on white, keyed to alpha (scripts/key-free.js) and
   downscaled to SIZE px on its longer side.
   Output: images/event-icons/<kind>.png, manifest images/event-icons/manifest.json
   Raw FLUX output: ai-generated/comfyui-raw/EVENT-ICONS/
   Usage: node scripts/generate-event-icons.js [kind ...] [--force] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { generate } = require('../redesign-100/work/flux');
const { keyFree } = require('./key-free');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'event-icons');
const RAW = path.join(ROOT, 'ai-generated', 'comfyui-raw', 'EVENT-ICONS');
const MF = path.join(OUT, 'manifest.json');
const SIZE = 256, ATTEMPTS = +process.env.ATTEMPTS || 4;
const STYLE = ', a single compact object centred in the frame, front three-quarter view, photorealistic premium product photography, soft even studio light, rich true colours, ultra fine detail, ' +
  'the whole object fully visible with a wide empty white margin on every side, not touching the edges of the image, no text, no letters, no numbers, no watermark, no logo, no people, no hands, no cast shadow, isolated on a plain pure white background';
const KINDS = {
  haldi: 'A polished engraved brass bowl filled with smooth yellow turmeric paste on a small brass plate, with orange marigold flowers, fresh turmeric roots and green mango leaves',
  mehndi: 'A small brass bowl of fresh green henna paste with two henna cones beside it, a few green henna leaves and white jasmine flowers',
  wedding: 'A pair of shining gold wedding rings with a small diamond, resting together on a small round red velvet cushion with a few red rose petals',
  reception: 'Two elegant crystal champagne flutes with gold rims filled with sparkling champagne, gently clinking together, a small white rose at their base',
  games: 'A small cheerful pile of party games: a colourful wooden spinning top, two red dice and a bright toy gamepad',
  cake: 'A small two-tier celebration cake with smooth white frosting, pastel sugar flowers and a single lit candle on top, on a gold cake stand',
  meal: 'An elegant gourmet dinner plate on fine white porcelain with a gold rim, beautifully plated food, a polished silver fork and knife beside it',
  music: 'A shiny polished golden brass saxophone standing upright',
  diya: 'A traditional lit brass oil diya lamp with a warm glowing flame, resting on a few orange marigold petals',
  gift: 'A luxury gift box wrapped in rich deep red paper tied with a large gold satin ribbon bow',
  mic: 'A classic vintage chrome stage microphone on a short black desk stand',
  award: 'A shiny polished gold trophy cup with two handles on a black marble base',
  camera: 'A vintage film camera with a silver body, black leather trim and a large glass lens',
  home: 'A small charming miniature model house with a red tiled roof, white walls and warm glowing windows',
  badge: 'A conference lanyard with a navy blue strap and a plain blank white name badge card in a clear holder',
  star: 'A glossy polished gold metallic star ornament with a soft sparkle'
};
function seedOf(s, n) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 9000000) + 1000000 + n * 7919; }

/* In the page: shrink the keyed cut-out to `size` px on its longer side. */
function shrink([src, size]) {
  return (async () => {
    const img = new Image(); img.src = src; await img.decode();
    const k = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  })();
}

(async () => {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const force = process.argv.includes('--force');
  const kinds = args.length ? args : Object.keys(KINDS);
  const log = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, 'utf8')) : {};
  const save = () => fs.writeFileSync(MF, JSON.stringify(log, null, 1));
  fs.mkdirSync(RAW, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage();
  for (const kind of kinds) {
    const dest = path.join(OUT, kind + '.png');
    if (!KINDS[kind]) { console.log('unknown', kind); continue; }
    if (fs.existsSync(dest) && !force) { console.log('skip', kind); continue; }
    let done = false;
    for (let n = 0; n < ATTEMPTS && !done; n++) {
      const seed = seedOf(kind, n), text = KINDS[kind] + STYLE;
      const raw = path.join(RAW, kind + '__' + seed + '.png');
      if (!fs.existsSync(raw)) {
        const out = await generate({ prefix: 'EVT_' + kind, w: 768, h: 768, seed, text });
        fs.copyFileSync(out, raw); try { fs.unlinkSync(out); } catch (e) { /* OneDrive lock; collected later */ }
      }
      const k = await page.evaluate(keyFree, ['data:image/png;base64,' + fs.readFileSync(raw).toString('base64'), 0.03]);
      if (!k.ok) { console.log('retry', kind, JSON.stringify({ coverage: k.coverage, touch: k.touch, bgOk: k.bgOk })); continue; }
      const png = await page.evaluate(shrink, [k.png, SIZE]);
      fs.writeFileSync(dest, Buffer.from(png.split(',')[1], 'base64'));
      log[kind] = { model: 'flux-2-klein-4b.safetensors', seed, prompt: text, raw: path.relative(ROOT, raw).split(path.sep).join('/'), coverage: k.coverage, edgeTouch: k.touch };
      save(); console.log('ok', kind); done = true;
    }
    if (!done) console.log('FAIL', kind);
  }
  save(); await b.close();
})();
