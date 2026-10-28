/* Floral line art for the wedding design engine (js/wedding-designs.js),
   generated with the local FLUX.2 Klein 4B (ComfyUI), in place of the thin
   SVG corner lines. White line art on black is keyed to alpha (luminance)
   and saved in two inks:
     <name>-dark.png   champagne rose-gold, for dark cards
     <name>-light.png  antique gold, for light cards
   Output: images/wedding-lineart/<style>/{corner-top,corner-bottom,side-vine,sprig}-<ink>.png
           images/wedding-lineart/crests/<slug>-<ink>.png
           images/wedding-lineart/manifest.json (model, seed, prompt per asset)
   Raw FLUX outputs are kept in lineart-work/raw/ (resumable).
   Usage: node scripts/generate-wedding-lineart.js [--only=florals|crests] [--redo=name,...] [--names=name,...] */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'wedding-lineart');
const RAW = path.join(ROOT, 'lineart-work', 'raw');
const MANIFEST = path.join(OUT, 'manifest.json');
const COMFY = 'http://127.0.0.1:8188';
const COMFY_OUT = 'C:/Users/nanil/OneDrive/Desktop/Matey/personal_ai/ComfyUI-master/output';
const MODEL = 'flux-2-klein-4b.safetensors';
const LINE = 'elegant fine line art illustration, thin delicate continuous engraved lines, luxury wedding stationery, outline drawing only, no fill, no shading, white lines on a solid pure black background, no text, no letters, no frame, no border';

const FLORA = {
  lotus: 'lotus flowers, lotus buds and lotus leaves with curling stems',
  jasmine: 'jasmine flowers, mango leaves and small temple bells on curling stems',
  marigold: 'marigold flowers, paisley motifs and mango leaves on curling stems',
  rose: 'garden roses, rosebuds and leafy vines',
  blossom: 'peony flowers and cherry blossom branches',
  arabesque: 'Mughal tulips, chinar leaves and arabesque scrolls',
  geometric: 'stylised acacia leaves with woven geometric pattern lines',
  tropical: 'frangipani flowers, hibiscus and palm fronds',
  laurel: 'olive branches, laurel leaves and small wild roses',
  fern: 'fern fronds, wildflowers and leafy branches',
  baroque: 'royal acanthus scrolls, filigree flourishes and small lotus buds',
  deco: 'art deco fan motifs, geometric sunburst lines and stylised palm leaves',
  minimal: 'a single delicate leafy stem with a few small leaves and one small bud'
};
const NO_TEXT = ', absolutely no text, no words, no lettering, no numbers, no labels, no banners, no ribbons with writing';
/* Crest subjects for templates whose blurb names no drawable object, or whose
   first crest came out with lettering or as a filled block. */
const CREST_SUBJECT = {
  'blush-engagement': 'two interlocking engagement rings with a solitaire diamond, framed by a small garland of garden roses',
  'luxury-editorial': 'two crossed fountain pen nibs with a laurel sprig', 'minimal-wedding': 'a single slender olive sprig',
  'quiet-minimal': 'a fine circle with one small leaf', 'type-only': 'an elegant quill feather', 'editorial-ivory': 'a fine laurel wreath',
  'editorial-grid': 'a small geometric diamond with fine leaves', 'gen-z-bold': 'a playful four point star with two small hearts',
  'digital-wedding': 'a vintage camera with a small heart', 'modern-love': 'a slender arch with a single rose', 'modern-monogram': 'two interlaced rings inside a fine diamond',
  'monogram-seal': 'a round wax seal inside a botanical wreath', 'the-two-of-us': 'an infinity loop ribbon', 'gilded-branch': 'a single leafy branch',
  'cinematic-love-story': 'a vintage film reel with a heart', 'golden-celebration': 'an ornate round mandala medallion', 'imperial-gold': 'an ornate filigree crown medallion',
  'champagne-palace': 'two champagne coupes clinking', 'pearl-and-champagne': 'a pearl necklace looped around a champagne coupe', 'velvet-rouge': 'a baroque damask medallion',
  'romance-in-blush': 'an open rose with two buds', 'rosewater-romance': 'a rosewater bottle with roses', 'mountain-vows': 'mountain peaks with pine trees',
  'goa-sunset-vows': 'coconut palms over a setting sun', 'brazilian-tropical': 'monstera and palm leaves', 'botanical-press': 'two pressed fern fronds',
  'destination-voyage': 'a compass rose star with eight points and no letters', 'coorg-kodava': 'a coffee branch with beans and leaves', 'british-regency': 'a laurel wreath with a small crown',
  'italian-rinascimento': 'a Florentine rosette with acanthus scrolls', 'a-family-wedding': 'a family tree with many branches', 'bride-and-groom': 'two wedding rings inside a laurel wreath',
  'groom-and-groom': 'two interlocking rings tied with a square knot', 'our-sons-wedding': 'a family shield with a wheat sheaf', 'parsi-lagan': 'a winged faravahar between two cypress trees',
  'anand-karaj': 'the Sikh Khanda emblem inside a gurdwara arch', 'anand-karaj-ardas': 'a decorated palki canopy with fringe', 'hindu-vivah': 'a havan kund with a sacred fire and a lotus',
  'saat-phere': 'seven small diya lamps in a circle around a sacred fire', 'sangeet-night': 'a dholak drum with a marigold garland', 'sangeet-evening': 'ghungroo bells strung above a dholak drum',
  'mehendi-morning': 'a henna cone with a paisley', 'vidaai-farewell': 'a decorated doli palanquin', 'baraat-procession': 'a decorated horse with a plumed headdress',
  'gopuram-vows': 'a tiered Dravidian temple gopuram tower', 'kasavu-gold-border': 'a brass uruli bowl with floating flowers', 'talambralu-pearls': 'a bowl of pearls and rice grains',
  'marathi-paithani': 'a peacock with flowing tail feathers', 'jewel-of-jaipur': 'a carved jharokha window with a small dome', 'japanese-mizuhiki': 'a mizuhiki knot above a flying crane',
  'mundavalya-pearls': 'strings of pearls hanging from a curved band', 'goan-azulejo': 'an ornate floral tile pattern drawn in outline', 'sindhi-ajrak': 'an eight-pointed star block-print motif',
  'lakefront-love': 'a lake with mountains and a small rowing boat', 'kerala-mangalyam': 'a tall nilavilakku brass oil lamp with a flame', 'caribbean-hibiscus': 'two hibiscus flowers with leaves',
  'beachside-bliss': 'a seashell and a starfish', 'thai-lai-kranok': 'a flame-like kranok scroll', 'nikah-nama': 'an inkpot with a reed pen', 'udaipur-romance': 'a lake palace pavilion with domes',
  'pattachitra-vows': 'a fish and a lotus in folk painting style', 'gamosa-weave': 'a woven floral motif in a diamond', 'indonesian-batik': 'a diagonal parang batik motif inside a diamond',
  'chinese-double-joy': 'a palace lantern between two peonies', 'telangana-bathukamma': 'a tiered bathukamma flower stack', 'vietnamese-lotus': 'a lotus flower resting on still water'
};
const PIECES = {
  'corner-top': { w: 768, h: 768, text: f => 'Ornamental corner decoration for the top-left corner of a wedding invitation, made of ' + f + ', stems flowing along the top edge and down the left edge, empty space in the bottom right, ' },
  'corner-bottom': { w: 768, h: 768, text: f => 'Lush ornamental cluster for the bottom-left corner of a wedding invitation, made of ' + f + ', growing upward from the bottom edge, empty space in the top right, ' },
  'side-vine': { w: 384, h: 1024, text: f => 'Tall slender vertical vine border made of ' + f + ', one climbing stem from bottom to top, ' },
  'sprig': { w: 768, h: 384, text: f => 'A small curved leafy sprig made of ' + f + ', curving gently like a crescent from left to right, horizontal, ' }
};
const INKS = { dark: [[201, 150, 120], [248, 222, 196]], light: [[98, 66, 26], [154, 114, 48]] };

function seedOf(s, n) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 9000000) + 1000000 + n * 7919; }
function workflow(t) {
  return {
    '4': { class_type: 'UNETLoader', inputs: { unet_name: MODEL, weight_dtype: 'default' } },
    '5': { class_type: 'CLIPLoader', inputs: { clip_name: 'qwen_3_4b.safetensors', type: 'flux2', device: 'default' } },
    '6': { class_type: 'VAELoader', inputs: { vae_name: 'flux2-vae.safetensors' } },
    '7': { class_type: 'EmptyFlux2LatentImage', inputs: { width: t.w, height: t.h, batch_size: 1 } },
    '8': { class_type: 'Flux2Scheduler', inputs: { base_shift: 0.5, max_shift: 1.15, steps: 8, stretch: true, terminal: 0.1, width: t.w, height: t.h } },
    '9': { class_type: 'KSamplerSelect', inputs: { sampler_name: 'euler' } },
    '10': { class_type: 'CLIPTextEncode', inputs: { text: t.text, clip: ['5', 0] } },
    '11': { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['10', 0] } },
    '12': { class_type: 'CFGGuider', inputs: { model: ['4', 0], positive: ['10', 0], negative: ['11', 0], cfg: 1 } },
    '13': { class_type: 'RandomNoise', inputs: { noise_seed: t.seed } },
    '14': { class_type: 'SamplerCustomAdvanced', inputs: { noise: ['13', 0], guider: ['12', 0], sampler: ['9', 0], sigmas: ['8', 0], latent_image: ['7', 0] } },
    '15': { class_type: 'VAEDecode', inputs: { samples: ['14', 0], vae: ['6', 0] } },
    '16': { class_type: 'SaveImage', inputs: { filename_prefix: t.prefix, images: ['15', 0] } }
  };
}
async function generate(t) {
  const res = await fetch(COMFY + '/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow(t) }) });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  for (let i = 0; i < 600; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const hist = (await (await fetch(COMFY + '/history/' + data.prompt_id)).json())[data.prompt_id];
    if (!hist) continue;
    const img = hist.outputs && hist.outputs['16'] && hist.outputs['16'].images[0];
    if (!img) throw new Error('Generation failed: ' + JSON.stringify(hist.status));
    return path.join(COMFY_OUT, img.subfolder || '', img.filename);
  }
  throw new Error('Timed out: ' + t.prefix);
}

/* In the page: luminance key -> alpha, tint to both inks, crop to content. */
function keyInPage([src, inks]) {
  return (async () => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, EDGE = 6;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const base = ctx.getImageData(0, 0, W, H).data;
    const alpha = new Float32Array(W * H), tone = new Float32Array(W * H);
    let ink = 0, minX = W, minY = H, maxX = -1, maxY = -1;
    for (let j = 0; j < W * H; j++) {
      const x = j % W, y = (j / W) | 0, i = j * 4;
      const m = (x < EDGE || y < EDGE || x >= W - EDGE || y >= H - EDGE) ? 0 : Math.max(base[i], base[i + 1], base[i + 2]);
      const a = Math.min(1, Math.max(0, (m - 24) / 120));
      alpha[j] = a; tone[j] = Math.min(1, m / 255);
      if (a > 0.1) { ink++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    const out = { coverage: ink / (W * H) };
    if (maxX < 0) return out;
    for (const [name, [lo, hi]] of Object.entries(inks)) {
      const d = ctx.createImageData(W, H), p = d.data;
      for (let j = 0; j < W * H; j++) {
        const i = j * 4, t = tone[j];
        p[i] = lo[0] + (hi[0] - lo[0]) * t; p[i + 1] = lo[1] + (hi[1] - lo[1]) * t; p[i + 2] = lo[2] + (hi[2] - lo[2]) * t;
        p[i + 3] = Math.round(alpha[j] * 255);
      }
      ctx.putImageData(d, 0, 0);
      const o = document.createElement('canvas'); o.width = maxX - minX + 1; o.height = maxY - minY + 1;
      o.getContext('2d').drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
      out[name] = o.toDataURL('image/png');
    }
    out.w = maxX - minX + 1; out.h = maxY - minY + 1;
    return out;
  })();
}

(async () => {
  const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
  const redo = (process.argv.find(a => a.startsWith('--redo=')) || '').slice(7).split(',').filter(Boolean);
  fs.mkdirSync(RAW, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { model: MODEL, assets: {} };
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // The engine decides each template's style and gives its name/blurb for the crest.
  await page.goto(pathToFileURL(path.join(ROOT, 'preview.html')).href);
  await page.waitForLoadState('networkidle');
  const cards = await page.evaluate(() => Object.values(IH.weddingDesigns.all()).map(s => {
    const t = IH.data.getTemplate(s.slug); return { slug: s.slug, style: s.lineArt, name: t.name, blurb: t.blurb };
  }));
  const tasks = [];
  if (only !== 'crests') for (const [style, flora] of Object.entries(FLORA)) for (const [piece, cfg] of Object.entries(PIECES)) {
    tasks.push({ name: style + '/' + piece, w: cfg.w, h: cfg.h, text: cfg.text(flora) + LINE });
  }
  if (only !== 'florals') for (const c of cards) {
    // Never the card's name in the prompt: FLUX writes it out as (garbled) text.
    const subject = CREST_SUBJECT[c.slug] || String(c.blurb || '').split(/\.\s/)[0].slice(0, 120);
    tasks.push({ name: 'crests/' + c.slug, w: 640, h: 640, crest: true,
      text: 'Small symmetrical line-art emblem for a wedding invitation: ' + subject + ', a single centred object, compact, ' + LINE + NO_TEXT });
  }
  const names = (process.argv.find(a => a.startsWith('--names=')) || '').slice(8).split(',').filter(Boolean);
  if (names.length) tasks.splice(0, tasks.length, ...tasks.filter(t => names.includes(t.name)));
  let n = 0;
  for (const t of tasks) {
    n++;
    const rec = manifest.assets[t.name] || {};
    const files = ['dark', 'light'].map(k => path.join(OUT, t.name + '-' + k + '.png'));
    if (rec.ok && files.every(f => fs.existsSync(f)) && !redo.includes(t.name)) continue;
    fs.mkdirSync(path.dirname(files[0]), { recursive: true });
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      const seed = seedOf(t.name + '|' + t.text, attempt + (redo.includes(t.name) ? 3 : 0));
      const raw = path.join(RAW, t.name.replace('/', '__') + '__' + seed + '.png');
      try {
        if (!fs.existsSync(raw)) fs.copyFileSync(await generate({ prefix: 'WLA_' + t.name.replace('/', '_'), w: t.w, h: t.h, seed, text: t.text }), raw);
        const k = await page.evaluate(keyInPage, ['data:image/png;base64,' + fs.readFileSync(raw).toString('base64'), INKS]);
        // Line art, not a filled picture: some ink, but well under half the frame.
        // Crests are outline drawings too: a filled block (tile, cloth, poster) fails.
        if (!k.dark || k.coverage < 0.004 || k.coverage > (t.crest ? 0.26 : 0.42)) { Object.assign(rec, { ok: false, error: 'coverage ' + k.coverage.toFixed(3), seed }); continue; }
        fs.writeFileSync(files[0], Buffer.from(k.dark.split(',')[1], 'base64'));
        fs.writeFileSync(files[1], Buffer.from(k.light.split(',')[1], 'base64'));
        Object.assign(rec, { ok: true, model: MODEL, seed, prompt: t.text, raw: path.relative(ROOT, raw).split(path.sep).join('/'), size: [k.w, k.h], coverage: +k.coverage.toFixed(3) });
        delete rec.error;
        done = true;
      } catch (e) { Object.assign(rec, { ok: false, error: e.message }); }
    }
    manifest.assets[t.name] = rec;
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
    console.log(n + '/' + tasks.length, t.name, rec.ok ? 'ok' : 'FAIL ' + rec.error);
  }
  await browser.close();
})();
