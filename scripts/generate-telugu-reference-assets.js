/* Telugu Pelli "lake palace" card layers: FLUX.2 Klein 4B (local ComfyUI).
   Every decoration is its own transparent PNG, positioned by CSS.
   key 'gold'  -> gold artwork on black, luminance keyed (filigree holes open).
   key 'flood' -> watercolour on a plain background; only background connected
                  to the image border is removed, so white petals stay opaque.
   Usage: node scripts/generate-telugu-reference-assets.js [--key-only] [--only=tp-x] */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COMFY = 'http://127.0.0.1:8188';
const COMFY_OUT = 'C:/Users/nanil/OneDrive/Desktop/Matey/personal_ai/ComfyUI-master/output';
/* --set=tamil writes the Tamil Thirumanam set (same file names) into its own folder. */
const SET = (process.argv.find(a => a.startsWith('--set=')) || '--set=telugu').slice(6);
const DEST = path.resolve(__dirname, '..', 'images', 'invitation-assets', SET === 'tamil' ? 'tamil-thirumanam' : 'telugu-pelli');
const REAL = 'photorealistic, premium royal classic South Indian wedding decor, luxury editorial product photography, soft warm studio lighting, rich true colors, ultra fine detail, no text, no letters, no border';
const ON_WHITE = REAL + ', isolated on a plain pure white background';
const GOLD = 'fine antique champagne gold foil line art, elegant thin engraved lines, wedding stationery, flat front view, isolated on solid pure black background, no text, no letters';

const TASKS = [
  /* Telugu (Andhra / Telangana) wedding motifs only, photorealistic:
     temple pillars, gopuram temples by a koneru pond, mamidi thoranam,
     malle poolu and banti (marigold) strings, arati chettu at the pandiri. */
  { prefix: 'TPR_Pillar', dest: 'tp-pillar.png', w: 384, h: 1344, seed: 6618402, key: 'solid',
    text: 'Single tall royal ivory white marble pillar from a South Indian palace kalyana mandapam, richly carved ornate capital with curved potika brackets and gold leaf inlay at the top, long perfectly plain smooth round polished marble shaft, carved square plinth base with gold band at the bottom, full height straight front orthographic view, ' + REAL + ', isolated on a plain flat light grey background' },
  { prefix: 'TPR_Venue_Default', dest: 'tp-venue-default.jpg', w: 1216, h: 832, seed: 3184406, key: 'none',
    text: 'Photograph of a traditional Telugu wedding kalyana mandapam venue in Andhra Pradesh: a carved stone South Indian temple-style mandapam hall with granite pillars and a small gopuram behind, entrance decorated with fresh marigold garlands, mango leaf thoranam and banana plants, a decorated wedding stage with jasmine strings inside, surrounded by greenery and coconut palms, warm soft golden daylight, ' + REAL },
  { prefix: 'TPR_Temple_Side', dest: 'tp-temple-side.png', w: 768, h: 640, seed: 6620158, key: 'flood',
    text: 'Photograph of a small carved South Indian Dravidian temple gopuram tower framed by coconut palms beside a calm temple pond with stone steps, same warm soft golden daylight and gentle haze, compact composition, the scene softly vignetted and fading into pure white at all edges, ' + ON_WHITE },
  { prefix: 'TPR_Lake_Temple', dest: 'tp-lake-temple.png', w: 1216, h: 640, seed: 4402617, key: 'none',
    text: 'Wide panoramic photograph of a serene South Indian temple lake at golden hour: several carved Dravidian gopuram temple towers and stone mandapams along the far shore, calm water with soft reflections, pink lotus flowers and lily pads in the foreground water, coconut palms, the sky above fading smoothly into plain soft cream white, ' + REAL },
  { prefix: 'TPR_Lotus_Front', dest: 'tp-foliage-bottom.png', w: 1216, h: 384, seed: 5129346, key: 'flood',
    text: 'Low wide horizontal foreground border of fresh real green lotus leaves with dew drops and a few blooming pink lotus flowers and buds rising up, long wide strip, ' + ON_WHITE },
  { prefix: 'TPR_Canopy_Corner', dest: 'tp-canopy-corner.png', w: 768, h: 1024, seed: 9045173, key: 'flood',
    text: 'Real fresh flower decoration for the top-left corner of a royal Telugu wedding card: lush cluster of orange and golden yellow marigold flowers, white jasmine buds and glossy green mango leaves, with long strings of fresh white jasmine flowers and marigolds hanging straight down, ' + ON_WHITE },
  { prefix: 'TPR_Toran', dest: 'tp-toran.png', w: 1216, h: 320, seed: 5560913, key: 'flood',
    text: 'Real traditional Telugu mamidi thoranam doorway hanging: a straight horizontal cotton string with about twenty small fresh glossy green mango leaves hanging straight down side by side at even spacing, a small orange marigold flower tied between every two leaves, symmetrical, wide long strip, ' + ON_WHITE },
  { prefix: 'TPR_Jasmine_String', dest: 'tp-jasmine-string.png', w: 384, h: 1152, seed: 6633091, key: 'flood',
    text: 'Single long vertical hanging garland string of fresh real white jasmine flowers malle poolu with a few orange marigold flowers and small green leaves, ending in a small golden tassel, ' + ON_WHITE },
  { prefix: 'TPR_Banana_Plant', dest: 'tp-banana-plant.png', w: 640, h: 1024, seed: 1736520, key: 'flood',
    text: 'Real young banana plant arati chettu with large fresh glossy green leaves and a bunch of green bananas, tied with a marigold garland as at the entrance of a Telugu wedding pandiri, full plant standing upright, ' + ON_WHITE },
  { prefix: 'TPR_Elephant', dest: 'tp-elephant.png', w: 896, h: 768, seed: 8571034, key: 'flood-shadow',
    text: 'Real majestic royal Indian elephant standing facing right, adorned with a rich maroon velvet caparison embroidered with gold zari, gold ornaments on the forehead and anklets, side view full body, ' + ON_WHITE },
  { prefix: 'TPR_Mango_Sprig', dest: 'tp-sprig.png', w: 512, h: 512, seed: 2780314, key: 'flood',
    text: 'Small elegant real sprig of three slender fresh glossy green mango leaves on a thin stem with two tiny white jasmine buds, diagonal, ' + ON_WHITE },
  { prefix: 'TPR_Icon_Haldi', dest: 'tp-icon-haldi.png', w: 512, h: 512, seed: 4419027, key: 'flood',
    text: 'Small polished brass bowl filled with yellow turmeric paste, a few fresh turmeric roots and a mango leaf beside it, ' + ON_WHITE },
  { prefix: 'TPR_Ganesha', dest: 'tp-ganesha.png', w: 640, h: 640, seed: 3305861, key: 'flood',
    text: 'Small polished 24k gold relief emblem of Lord Ganesha seated, finely detailed embossed gold, front view, symmetrical, ' + ON_WHITE },
  { prefix: 'TPR_Icon_Gorintaku', dest: 'tp-icon-gorintaku.png', w: 512, h: 512, seed: 9921534, key: 'flood',
    text: 'Small polished brass bowl of fresh green ground henna gorintaku paste with a sprig of fresh green henna leaves beside it, ' + ON_WHITE },
  { prefix: 'TPR_Icon_Mangalsutra', dest: 'tp-icon-mangalsutra.png', w: 512, h: 512, seed: 6051288, key: 'flood',
    text: 'Real Telugu mangalsutram jewellery: a turmeric yellow sacred thread with two small round polished gold discs pendant and small gold beads, laid flat, symmetrical, ' + ON_WHITE },
  { prefix: 'TPR_Icon_Kalasam', dest: 'tp-icon-kalasam.png', w: 512, h: 512, seed: 1290475, key: 'flood',
    text: 'Real polished brass purna kumbham kalasam pot with fresh mango leaves and a coconut on top, two small lit brass diya oil lamps beside it, ' + ON_WHITE },
  { prefix: 'TP_Divider', dest: 'tp-divider.png', w: 1024, h: 256, seed: 1187402, key: 'gold',
    text: 'Small thin horizontal divider ornament: a tiny lotus bud in the center with delicate short scrolls on both sides, symmetrical, very thin lines, ' + GOLD }
];

/* Tamil Thirumanam: Tamil Nadu motifs only, same photoreal style and file names. */
const TAMIL_TASKS = [
  { prefix: 'TTR_Pillar', dest: 'tp-pillar.png', w: 384, h: 1344, seed: 7731905, key: 'solid',
    text: 'Single tall royal ivory white marble pillar from a Tamil Nadu temple kalyana mandapam, richly carved Nayak style capital with curved pushpa potika brackets and gold leaf inlay at the top, long perfectly plain smooth round polished marble shaft, carved square plinth base with gold band at the bottom, full height straight front orthographic view, ' + REAL + ', isolated on a plain flat light grey background' },
  { prefix: 'TTR_Toran', dest: 'tp-toran.png', w: 1216, h: 320, seed: 4108822, key: 'flood',
    text: 'Real traditional Tamil wedding thoranam: a straight horizontal string of fresh woven tender coconut palm leaf (thennai olai) ornaments and glossy green mango leaves hanging straight down side by side at even spacing, small orange kanakambaram and white jasmine flower bunches between them, symmetrical, wide long strip, ' + ON_WHITE },
  { prefix: 'TTR_Canopy_Corner', dest: 'tp-canopy-corner.png', w: 768, h: 1024, seed: 5290417, key: 'flood',
    text: 'Real fresh flower decoration for the top-left corner of a royal Tamil wedding card: lush cluster of white jasmine malligai, orange kanakambaram flowers, deep red roses and glossy green mango leaves, with long strings of fresh jasmine and kanakambaram hanging straight down, ' + ON_WHITE },
  { prefix: 'TTR_Jasmine_String', dest: 'tp-jasmine-string.png', w: 384, h: 1152, seed: 2861734, key: 'flood',
    text: 'Single long vertical hanging garland string of fresh real white jasmine malligai flowers braided with orange kanakambaram flowers and a few red rose buds, ending in a small golden tassel, ' + ON_WHITE },
  { prefix: 'TTR_Elephant', dest: 'tp-elephant.png', w: 896, h: 768, seed: 9017423, key: 'flood-shadow',
    text: 'Real majestic Tamil Nadu temple elephant standing facing right, forehead painted with a sacred namam mark and ornate patterns, brass bells hanging at its neck, a rich red velvet caparison embroidered with gold zari, gold anklets, side view full body, ' + ON_WHITE },
  { prefix: 'TTR_Lake_Temple', dest: 'tp-lake-temple.png', w: 1216, h: 640, seed: 6684021, key: 'none',
    text: 'Wide panoramic photograph of a Madurai style temple tank teppakulam at golden hour: a stone mandapam pavilion in the centre of calm water, tall colourful Tamil Dravidian gopuram towers covered in painted sculptures along the far shore, stone steps, pink lotus flowers and lily pads in the foreground water, coconut palms, the sky above fading smoothly into plain soft cream white, ' + REAL },
  { prefix: 'TTR_Temple_Side', dest: 'tp-temple-side.png', w: 768, h: 640, seed: 3349172, key: 'flood',
    text: 'Photograph of a tall colourful Tamil Nadu temple gopuram tower covered in painted sculptures framed by coconut palms beside a calm temple tank with stone steps, warm soft golden daylight and gentle haze, compact composition, the scene softly vignetted and fading into pure white at all edges, ' + ON_WHITE },
  { prefix: 'TTR_Venue_Default', dest: 'tp-venue-default.jpg', w: 1216, h: 832, seed: 8124590, key: 'none',
    text: 'Photograph of a traditional Tamil wedding kalyana mandapam venue in Tamil Nadu: a carved stone temple-style mandapam with granite pillars and a colourful gopuram behind, entrance decorated with banana trees, thennai olai coconut leaf thoranam, jasmine and marigold garlands and a white rice-flour kolam on the floor, a decorated manavarai wedding stage inside, warm soft golden daylight, ' + REAL },
  { prefix: 'TTR_Icon_Nalangu', dest: 'tp-icon-haldi.png', w: 512, h: 512, seed: 4470915, key: 'flood',
    text: 'Small polished brass plate for the Tamil nalangu ritual holding a mound of turmeric paste, sandalwood paste and red kumkum, a betel leaf and a jasmine flower beside it, ' + ON_WHITE },
  { prefix: 'TTR_Icon_Maruthani', dest: 'tp-icon-gorintaku.png', w: 512, h: 512, seed: 2209371, key: 'flood',
    text: 'Small polished brass bowl of fresh green ground maruthani henna paste with a sprig of fresh green henna leaves beside it, ' + ON_WHITE },
  { prefix: 'TTR_Icon_Thali', dest: 'tp-icon-mangalsutra.png', w: 512, h: 512, seed: 7193304, key: 'flood',
    text: 'Real Tamil thirumangalyam thali jewellery: a gold thali pendant with traditional engraved motif on a turmeric yellow sacred thread with small gold beads, laid flat, symmetrical, ' + ON_WHITE },
  { prefix: 'TTR_Icon_Kuthuvilakku', dest: 'tp-icon-kalasam.png', w: 512, h: 768, seed: 5562088, key: 'flood',
    text: 'Real polished brass Tamil kuthuvilakku tall oil lamp with five lit flames, decorated with a small jasmine garland, ' + ON_WHITE }
];

function buildWorkflow(t) {
  return {
    '4': { class_type: 'UNETLoader', inputs: { unet_name: 'flux-2-klein-4b.safetensors', weight_dtype: 'default' } },
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
  const res = await fetch(COMFY + '/prompt', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: buildWorkflow(t) })
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  for (let i = 0; i < 200; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const hist = (await (await fetch(COMFY + '/history/' + data.prompt_id)).json())[data.prompt_id];
    if (!hist) continue;
    const img = hist.outputs && hist.outputs['16'] && hist.outputs['16'].images[0];
    if (!img) throw new Error('Generation failed: ' + JSON.stringify(hist.status));
    return path.join(COMFY_OUT, img.subfolder || '', img.filename);
  }
  throw new Error('Timed out: ' + t.prefix);
}

function latestOutput(prefix) {
  const files = fs.readdirSync(COMFY_OUT).filter(f => f.startsWith(prefix + '_') && f.endsWith('.png')).sort();
  return files.length ? path.join(COMFY_OUT, files[files.length - 1]) : null;
}

/* Runs in the page: keys the image to alpha and crops it to its content. */
function keyInPage([src, mode]) {
  return (async () => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H); const p = d.data;
    const EDGE = 6; // VAE leaves a faint frame on the outermost pixels
    const onEdge = (x, y) => x < EDGE || y < EDGE || x >= W - EDGE || y >= H - EDGE;

    if (mode === 'gold') {
      for (let i = 0; i < p.length; i += 4) {
        const x = (i / 4) % W, y = Math.floor(i / 4 / W);
        const m = onEdge(x, y) ? 0 : Math.max(p[i], p[i + 1], p[i + 2]);
        const a = Math.min(1, Math.max(0, (m - 18) / 110));
        p[i + 3] = Math.round(a * 255);
        if (a > 0) {
          // Recolour onto an antique-gold ramp so thin lines read on parchment.
          const t = Math.min(1, m / 255);
          p[i] = 122 + (196 - 122) * t; p[i + 1] = 86 + (156 - 86) * t; p[i + 2] = 30 + (78 - 30) * t;
        }
      }
    } else {
      // Background colour = median of the four corner patches.
      const samples = [];
      [[EDGE, EDGE], [W - EDGE - 10, EDGE], [EDGE, H - EDGE - 10], [W - EDGE - 10, H - EDGE - 10]].forEach(([sx, sy]) => {
        for (let y = sy; y < sy + 10; y++) for (let x = sx; x < sx + 10; x++) {
          const i = (y * W + x) * 4; samples.push([p[i], p[i + 1], p[i + 2]]);
        }
      });
      const bg = [0, 1, 2].map(ch => samples.map(s => s[ch]).sort((a, b) => a - b)[samples.length >> 1]);
      const dist = new Float32Array(W * H);
      for (let j = 0; j < W * H; j++) {
        const i = j * 4;
        dist[j] = Math.max(Math.abs(p[i] - bg[0]), Math.abs(p[i + 1] - bg[1]), Math.abs(p[i + 2] - bg[2]));
      }
      const LO = 10, HI = 46;
      const seen = new Uint8Array(W * H); const queue = new Int32Array(W * H); let qh = 0, qt = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (onEdge(x, y)) { const j = y * W + x; seen[j] = 1; queue[qt++] = j; dist[j] = 0; }
      }
      while (qh < qt) {
        const j = queue[qh++]; const x = j % W, y = (j / W) | 0;
        const nb = [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1];
        for (const n of nb) if (n >= 0 && !seen[n] && dist[n] < HI) { seen[n] = 1; queue[qt++] = n; }
      }
      const orig = mode === 'solid' ? new Uint8ClampedArray(p) : null;
      for (let j = 0; j < W * H; j++) {
        const i = j * 4;
        if (!seen[j]) { p[i + 3] = 255; continue; }
        const a = Math.min(1, Math.max(0, (dist[j] - LO) / (HI - LO)));
        p[i + 3] = Math.round(a * 255);
        if (a > 0) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.min(255, Math.max(0, (p[i + ch] - bg[ch] * (1 - a)) / a));
      }
      if (mode === 'flood-shadow') {
        // Studio shots leave a pale grey ground shadow under the subject that
        // is too dark to key with the background. Clear pale, unsaturated
        // pixels in the bottom band only (the white tusks sit higher up).
        // Lower 45% (between the legs), but not the right-hand tusk area; the
        // bottom 14% across the full width.
        for (let y = Math.floor(H * 0.55); y < H; y++) for (let x = 0; x < W; x++) {
          if (y < H * 0.86 && x > W * 0.76) continue;
          const i = (y * W + x) * 4;
          const mx = Math.max(p[i], p[i + 1], p[i + 2]), mn = Math.min(p[i], p[i + 1], p[i + 2]);
          if (mn > 150 && mx - mn < 26) p[i + 3] = 0;
        }
      }
      if (mode === 'solid') {
        // A pale column is close to the backdrop colour, so the key leaves the
        // shaft see-through. Rows clearly narrower than the widest row (the
        // shaft, not the capital or plinth) are refilled solid between their
        // outer edges with the original pixels.
        const span = [];
        let maxW = 0;
        for (let y = 0; y < H; y++) {
          let l = -1, r = -1;
          for (let x = 0; x < W; x++) if (p[(y * W + x) * 4 + 3] > 200) { if (l < 0) l = x; r = x; }
          span.push([l, r]); if (l >= 0) maxW = Math.max(maxW, r - l);
        }
        for (let y = 0; y < H; y++) {
          const [l, r] = span[y];
          if (l < 0 || r - l > maxW * 0.62) continue;
          for (let x = l; x <= r; x++) {
            const i = (y * W + x) * 4;
            p[i] = orig[i]; p[i + 1] = orig[i + 1]; p[i + 2] = orig[i + 2]; p[i + 3] = 255;
          }
        }
      }
    }

    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let j = 0; j < W * H; j++) if (p[j * 4 + 3] > 25) {
      const x = j % W, y = (j / W) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    ctx.putImageData(d, 0, 0);
    if (maxX < 0) return c.toDataURL('image/png');
    const o = document.createElement('canvas'); o.width = maxX - minX + 1; o.height = maxY - minY + 1;
    o.getContext('2d').drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
    return o.toDataURL('image/png');
  })();
}

async function keyToAlpha(page, srcFile, destFile, mode) {
  if (mode === 'none') { // full scene (no keying); a .jpg destination is re-encoded as JPEG
    if (!destFile.endsWith('.jpg')) { fs.copyFileSync(srcFile, destFile); return; }
    const png = 'data:image/png;base64,' + fs.readFileSync(srcFile).toString('base64');
    const jpg = await page.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/jpeg', 0.86);
    }, png);
    fs.writeFileSync(destFile, Buffer.from(jpg.split(',')[1], 'base64'));
    return;
  }
  const src = 'data:image/png;base64,' + fs.readFileSync(srcFile).toString('base64');
  const out = await page.evaluate(keyInPage, [src, mode]);
  fs.writeFileSync(destFile, Buffer.from(out.split(',')[1], 'base64'));
}

/* The pillar is split into cap / shaft / base so CSS can stack them down a
   card of any height. The shaft is the longest run of rows whose opaque
   width stays constant (the plain column); a thin slice from its middle is
   tiled, so nothing visibly repeats. */
async function slicePillar(page, file) {
  const src = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  const parts = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c0 = document.createElement('canvas'); c0.width = W; c0.height = H;
    const x0 = c0.getContext('2d'); x0.drawImage(img, 0, 0);
    const d = x0.getImageData(0, 0, W, H).data;
    const width = [];
    for (let y = 0; y < H; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) { if (l < 0) l = x; r = x; }
      width.push(l < 0 ? 0 : r - l);
    }
    let best = [0, 0], s = 0;
    for (let y = 1; y <= H; y++) {
      if (y === H || Math.abs(width[y] - width[s]) > 4 || width[y] === 0) {
        if (y - s > best[1] - best[0]) best = [s, y];
        s = y;
      }
    }
    const mid = Math.round((best[0] + best[1]) / 2);
    const cuts = { cap: [0, best[0] + 6], shaft: [mid - 6, mid + 6], base: [best[1] - 6, H] };
    const out = { cuts: cuts };
    for (const k of ['cap', 'shaft', 'base']) {
      const c = document.createElement('canvas'); c.width = W; c.height = cuts[k][1] - cuts[k][0];
      c.getContext('2d').drawImage(img, 0, cuts[k][0], W, c.height, 0, 0, W, c.height);
      out[k] = c.toDataURL('image/png');
    }
    return out;
  }, src);
  console.log('  pillar cuts', JSON.stringify(parts.cuts));
  delete parts.cuts;
  for (const k of Object.keys(parts)) {
    fs.writeFileSync(path.join(DEST, 'tp-pillar-' + k + '.png'), Buffer.from(parts[k].split(',')[1], 'base64'));
  }
}

(async () => {
  const keyOnly = process.argv.includes('--key-only');
  const only = process.argv.find(a => a.startsWith('--only='));
  const names = only ? only.slice(7).split(',') : null;
  const set = SET === 'tamil' ? TAMIL_TASKS : TASKS;
  const tasks = names ? set.filter(t => names.some(n => t.dest.startsWith(n))) : set;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const t of tasks) {
    try {
      const raw = keyOnly ? latestOutput(t.prefix) : await generate(t);
      if (!raw) { console.error('✗ No source for ' + t.prefix); continue; }
      await keyToAlpha(page, raw, path.join(DEST, t.dest), t.key);
      if (t.dest === 'tp-pillar.png') await slicePillar(page, path.join(DEST, t.dest));
      console.log('✓ ' + t.dest + '  <- ' + path.basename(raw));
    } catch (e) {
      console.error('✗ ' + t.prefix + ': ' + e.message);
    }
  }
  await browser.close();
})();
