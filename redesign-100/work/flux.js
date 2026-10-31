/* Local FLUX.2 Klein 4B via ComfyUI (same workflow as scripts/generate-telugu-reference-assets.js). */
const path = require('path');
const COMFY = 'http://127.0.0.1:8188';
const COMFY_OUT = 'C:/Users/nanil/OneDrive/Desktop/Matey/personal_ai/ComfyUI-master/output';
/* Speed defaults from the Oct 2026 benchmark (RTX 2050 4 GB): 4 steps + fp8 weights = ~35 s/image vs ~66 s.
   Previous behaviour: FLUX_STEPS=8 FLUX_DTYPE=default. */
const STEPS = +process.env.FLUX_STEPS || 4;
const DTYPE = process.env.FLUX_DTYPE || 'fp8_e4m3fn';
function workflow(t) {
  return {
    '4': { class_type: 'UNETLoader', inputs: { unet_name: 'flux-2-klein-4b.safetensors', weight_dtype: DTYPE } },
    '5': { class_type: 'CLIPLoader', inputs: { clip_name: 'qwen_3_4b.safetensors', type: 'flux2', device: 'default' } },
    '6': { class_type: 'VAELoader', inputs: { vae_name: 'flux2-vae.safetensors' } },
    '7': { class_type: 'EmptyFlux2LatentImage', inputs: { width: t.w, height: t.h, batch_size: 1 } },
    '8': { class_type: 'Flux2Scheduler', inputs: { base_shift: 0.5, max_shift: 1.15, steps: STEPS, stretch: true, terminal: 0.1, width: t.w, height: t.h } },
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
  for (let i = 0; i < 1800; i++) {
    await new Promise(r => setTimeout(r, 500));
    const hist = (await (await fetch(COMFY + '/history/' + data.prompt_id)).json())[data.prompt_id];
    if (!hist) continue;
    const img = hist.outputs && hist.outputs['16'] && hist.outputs['16'].images[0];
    if (!img) throw new Error('Generation failed: ' + JSON.stringify(hist.status));
    return path.join(COMFY_OUT, img.subfolder || '', img.filename);
  }
  throw new Error('Timed out: ' + t.prefix);
}
module.exports = { generate, COMFY_OUT };
if (require.main === module) {
  const t0 = Date.now();
  generate({ prefix: 'RD100_test', w: 1152, h: 864, seed: 11, text: 'Photograph of a traditional Kerala wedding venue, a wooden nalukettu courtyard with brass nilavilakku lamps, jasmine and marigold garlands, banana plants, warm golden daylight, photorealistic, no text' })
    .then(f => console.log(f, ((Date.now() - t0) / 1000).toFixed(1) + 's')).catch(e => console.error(e.message));
}
