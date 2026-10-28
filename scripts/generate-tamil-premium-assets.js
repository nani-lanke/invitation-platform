/* Premium-classic Tamil Thirumanam ornaments: FLUX.2 Klein 4B (local ComfyUI)
   gold-foil artwork on black, keyed to transparent PNG by luminance so
   enclosed filigree holes become transparent too.
   Usage: node scripts/generate-tamil-premium-assets.js [--key-only] */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COMFY = 'http://127.0.0.1:8188';
const COMFY_OUT = 'C:/Users/nanil/OneDrive/Desktop/Matey/personal_ai/ComfyUI-master/output';
const DEST = path.resolve(__dirname, '..', 'images', 'invitation-assets', 'tamil-thirumanam');
const STYLE = 'luxury wedding stationery, shiny antique 24k gold foil engraving, embossed metallic gold, fine detailed filigree, flat front view, isolated on solid pure black background, no text, no letters';

const TASKS = [
  {
    prefix: 'Tamil_Premium_Corner', dest: 'premium-corner.png', w: 768, h: 768, seed: 7310452,
    text: 'Ornate South Indian temple style gold filigree corner ornament for the top-left corner of a card, L-shaped, curling paisley and lotus scrollwork, small kalasam motifs, ' + STYLE
  },
  {
    prefix: 'Tamil_Premium_Gopuram', dest: 'premium-gopuram.png', w: 768, h: 768, seed: 2084619,
    text: 'Symmetrical golden Dravidian Tamil temple gopuram tower emblem with kalasam finials on top, framed by an ornate gold arch of lotus filigree, centered crest, ' + STYLE
  },
  {
    prefix: 'Tamil_Premium_Peacock_Lamp', dest: 'premium-peacock-lamp.png', w: 1024, h: 512, seed: 5591037,
    text: 'Symmetrical pair of golden peacocks facing each other with flowing tails, a tall traditional Tamil kuthuvilakku brass oil lamp with lit flames standing in the center between them, wide horizontal composition, ' + STYLE
  },
  {
    prefix: 'Tamil_Premium_Divider', dest: 'premium-divider.png', w: 1024, h: 256, seed: 3907218,
    text: 'Thin elegant horizontal gold filigree divider line with a small lotus flower in the center and tapering paisley scrolls on both sides, symmetrical, ' + STYLE
  }
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
  for (let i = 0; i < 150; i++) {
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

/* Luminance key: black -> transparent, colour un-premultiplied, then cropped to content. */
async function keyToAlpha(page, srcFile, destFile) {
  const src = 'data:image/png;base64,' + fs.readFileSync(srcFile).toString('base64');
  const out = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height); const p = d.data;
    let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
    const EDGE = 8; // VAE leaves a faint frame on the outermost pixels
    for (let i = 0; i < p.length; i += 4) {
      const ex = (i / 4) % c.width, ey = Math.floor(i / 4 / c.width);
      const onEdge = ex < EDGE || ey < EDGE || ex >= c.width - EDGE || ey >= c.height - EDGE;
      const m = onEdge ? 0 : Math.max(p[i], p[i + 1], p[i + 2]);
      const a = Math.min(1, Math.max(0, (m - 18) / 110));
      p[i + 3] = Math.round(a * 255);
      if (a > 0) {
        const k = 255 / Math.max(m, 1) * Math.min(1, m / 128 + 0.35);
        p[i] = Math.min(255, p[i] * k); p[i + 1] = Math.min(255, p[i + 1] * k); p[i + 2] = Math.min(255, p[i + 2] * k);
      }
      if (a > 0.1) {
        const px = (i / 4) % c.width, py = Math.floor(i / 4 / c.width);
        if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py;
      }
    }
    ctx.putImageData(d, 0, 0);
    if (maxX < 0) return c.toDataURL('image/png');
    const o = document.createElement('canvas'); o.width = maxX - minX + 1; o.height = maxY - minY + 1;
    o.getContext('2d').drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
    return o.toDataURL('image/png');
  }, src);
  fs.writeFileSync(destFile, Buffer.from(out.split(',')[1], 'base64'));
}

(async () => {
  const keyOnly = process.argv.includes('--key-only');
  const only = process.argv.find(a => a.startsWith('--only='));
  const tasks = only ? TASKS.filter(t => t.dest.startsWith(only.slice(7))) : TASKS;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const t of tasks) {
    try {
      const raw = keyOnly ? latestOutput(t.prefix) : await generate(t);
      if (!raw) { console.error('✗ No source for ' + t.prefix); continue; }
      await keyToAlpha(page, raw, path.join(DEST, t.dest));
      console.log('✓ ' + t.dest + '  <- ' + path.basename(raw));
    } catch (e) {
      console.error('✗ ' + t.prefix + ': ' + e.message);
    }
  }
  await browser.close();
})();
