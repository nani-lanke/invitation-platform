/* Floral decoration for the engagement cards (FLUX.2 Klein 4B, local ComfyUI).
   Every piece is a free-standing arrangement with clear margins (never cut
   off by the canvas), keyed to alpha with white petals kept, and softly
   feathered at its edges. Pieces depend on the card's style
   (scripts/engagement-briefs.js STYLES):
     corners  bouquet + cluster          diagonal  bouquet + cluster
     garland  garland + cluster          wreath    wreath + cluster
     vines    vine                       luxury    cluster (gold accents; corners are gold line art)
   plus crest.png and sprig.png for every card (re-keyed from their raw
   render first; regenerated with margins if the object touches the edge).
   Output: images/engagement/<slug>/<piece>.png, manifest images/engagement/manifest.json
   Raw FLUX output: ai-generated/comfyui-raw/ENG/
   Usage: node scripts/generate-engagement-decor.js [slug ...] [--force=piece,...] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { generate } = require('../redesign-100/work/flux');
/* --set=reception (etc.) uses scripts/<set>-briefs.js and images/<set>/. */
const SET = (process.argv.find(a => a.startsWith('--set=')) || '--set=engagement').slice(6);
const B = require('./' + SET + '-briefs');
const ROOT = path.resolve(__dirname, '..');
/* DECOR_SANDBOX=<dir> (outside the project) sends pieces, raw renders and the manifest there for test runs. */
const SANDBOX = process.env.DECOR_SANDBOX && path.resolve(process.env.DECOR_SANDBOX);
if (SANDBOX && !path.relative(ROOT, SANDBOX).startsWith('..')) throw new Error('DECOR_SANDBOX must be outside ' + ROOT);
const OUT = SANDBOX ? path.join(SANDBOX, 'images', SET) : path.join(ROOT, 'images', SET);
const RAW = SANDBOX ? path.join(SANDBOX, 'raw', SET.toUpperCase()) : path.join(ROOT, 'ai-generated', 'comfyui-raw', SET === 'engagement' ? 'ENG' : SET.toUpperCase());
const MF = path.join(OUT, 'manifest.json');
/* A briefs file may override the wording (birthday: party decor, no sprig). */
const REAL = B.REAL || 'photorealistic, premium luxury wedding decor photography, rich true colours, ultra fine detail, no text, no letters, no watermark, no logo, no people';
const FREE = B.FREE || ', the whole arrangement fully visible with a wide empty white margin on every side, not touching the edges of the image, no vase, no ribbon, no paper, no frame, ' + REAL + ', isolated on a plain pure white background';
const PIECES = {
  bouquet: { w: 768, h: 768, text: f => 'An elegant sweeping corner spray of fresh ' + f + ', arranged diagonally from the upper left towards the lower right, loose and airy' },
  cluster: { w: 1024, h: 640, text: f => 'A low wide compact floral arrangement of fresh ' + f + ', wider than tall, flat bottom, gently rounded top' },
  garland: { w: 1216, h: 448, text: f => 'A long horizontal floral garland swag of fresh ' + f + ' draping in a gentle downward curve, both ends free and visible' },
  wreath: { w: 768, h: 768, text: f => 'A round floral wreath of fresh ' + f + ' with a large empty white centre' },
  vine: { w: 448, h: 1152, text: f => 'A tall slender vertical cascade of fresh ' + f + ' hanging from top to bottom, narrow' },
  crest: { w: 768, h: 768, text: c => 'Small premium ornament for the top of ' + (B.LABEL || 'an ' + SET.replace('-', ' ')) + ' invitation: ' + c + ', front view, centred, compact' },
  sprig: { w: 768, h: 384, text: f => 'A small horizontal sprig of ' + f + ', one small bloom with a few leaves, curving gently' }
};
const STYLE_PIECES = { corners: ['bouquet', 'cluster'], diagonal: ['bouquet', 'cluster'], garland: ['garland', 'cluster'], wreath: ['wreath', 'cluster'], vines: ['vine'], luxury: ['cluster'], backdrop: ['garland', 'cluster', 'vine'] };
function text0(t) { return String(t || '').length.toString(36); }
function seedOf(s, n) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 9000000) + 1000000 + n * 7919; }

const { keyFree } = require('./key-free');

(async () => {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const force = (process.argv.find(a => a.startsWith('--force=')) || '').slice(8).split(',').filter(Boolean);
  const slugs = args.length ? args : Object.keys(B.STYLES);
  const log = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, 'utf8')) : {};
  const save = () => fs.writeFileSync(MF, JSON.stringify(log, null, 1));
  fs.mkdirSync(RAW, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage();
  if (process.argv.includes('--rekey')) {
    for (const slug of slugs) for (const [key, rec] of Object.entries(log)) {
      if (!key.startsWith(slug + '/') || !key.endsWith('.png') || !rec.raw || !fs.existsSync(path.join(ROOT, rec.raw))) continue;
      const piece = key.split('/')[1].replace('.png', '');
      const k = await page.evaluate(keyFree, ['data:image/png;base64,' + fs.readFileSync(path.join(ROOT, rec.raw)).toString('base64'), piece === 'crest' ? 0.03 : 0.06]);
      if (!k.png) { console.log('rekey FAIL', key); continue; }
      fs.writeFileSync(path.join(OUT, key), Buffer.from(k.png.split(',')[1], 'base64'));
      console.log('rekeyed', key);
    }
    await b.close(); return;
  }
  for (const slug of slugs) {
    const brief = slug === 'blush-engagement' ? B.BLUSH : B[slug];
    const style = B.STYLES[slug];
    const flora = brief[1] + (style === 'luxury' ? ', with gold-dipped leaves and fine gold accents' : '');
    // The venue photo (a full scene, no keying) when the card has none yet.
    const venueDest = path.join(OUT, slug, 'venue.jpg');
    if (!fs.existsSync(venueDest) && brief[2]) {
      const seed = seedOf(slug + 'venue' + text0(brief[2]), 0), raw = path.join(RAW, slug + '__venue__' + seed + '.png');
      const text = 'Wide photograph of ' + brief[2] + ', celebration venue decor, no people, warm inviting light, ' + REAL;
      if (!fs.existsSync(raw)) { const out = await generate({ prefix: 'ENG_' + slug, w: 1152, h: 864, seed, text }); fs.copyFileSync(out, raw); try { fs.unlinkSync(out); } catch (e) {} }
      const jpg = await page.evaluate(async s => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); return c.toDataURL('image/jpeg', 0.88); }, 'data:image/png;base64,' + fs.readFileSync(raw).toString('base64'));
      fs.mkdirSync(path.dirname(venueDest), { recursive: true });
      fs.writeFileSync(venueDest, Buffer.from(jpg.split(',')[1], 'base64'));
      log[slug + '/venue.jpg'] = { model: 'flux-2-klein-4b.safetensors', seed, prompt: text, raw: path.relative(ROOT, raw).split(path.sep).join('/') };
      save(); console.log('ok', slug + '/venue.jpg');
    }
    for (const piece of STYLE_PIECES[style].concat(B.EXTRA || ['crest', 'sprig'])) {
      const key = slug + '/' + piece + '.png', dest = path.join(OUT, slug, piece + '.png');
      const rec = log[key];
      if (rec && rec.free && fs.existsSync(dest) && !force.includes(piece)) continue;
      const cfg = PIECES[piece];
      let done = false;
      for (let attempt = 0; attempt < (+process.env.ATTEMPTS || 4) && !done; attempt++) {
        // crest/sprig: first try re-keying the existing raw render (no new image needed).
        const old = attempt === 0 && (piece === 'crest' || piece === 'sprig') && rec && rec.raw;
        const seed = seedOf(slug + piece, attempt);
        const text = ((B.PIECE_TEXT && B.PIECE_TEXT[piece]) || cfg.text)(piece === 'crest' ? brief[0] : flora) + FREE;
        const raw = old ? path.join(ROOT, old) : path.join(RAW, slug + '__' + piece + '__' + seed + '.png');
        if (!fs.existsSync(raw)) {
          const out = await generate({ prefix: 'ENG_' + slug, w: cfg.w, h: cfg.h, seed, text });
          fs.copyFileSync(out, raw); try { fs.unlinkSync(out); } catch (e) { /* OneDrive lock; collected later */ }
        }
        const k = await page.evaluate(keyFree, ['data:image/png;base64,' + fs.readFileSync(raw).toString('base64'), piece === 'crest' ? 0.03 : 0.06]);
        if (!k.ok) { console.log('retry', key, JSON.stringify({ coverage: k.coverage, touch: k.touch, bgOk: k.bgOk })); continue; }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, Buffer.from(k.png.split(',')[1], 'base64'));
        log[key] = { model: 'flux-2-klein-4b.safetensors', seed: old ? rec.seed : seed, prompt: old ? rec.prompt : text,
          raw: path.relative(ROOT, raw).split(path.sep).join('/'), coverage: k.coverage, edgeTouch: k.touch, free: true, style };
        save(); console.log('ok', key, old ? '(re-keyed)' : '');
        done = true;
      }
      if (!done) console.log('FAIL', key);
    }
  }
  save(); await b.close();
})();
