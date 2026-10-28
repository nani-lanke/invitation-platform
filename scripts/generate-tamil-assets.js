const fs = require('fs');
const path = require('path');

const TASKS = [
  {
    prefix: 'Tamil_Thirumanam_Peacock_Left',
    text: 'Single isolated royal South Indian Tamil wedding peacock (Mayil) perched facing right, iridescent sapphire blue neck, emerald and gold feathers, graceful long tail, traditional Tamil wedding stationery motif, isolated on pure white background, centered, full bird visible, realistic.',
    seed: 5829104
  },
  {
    prefix: 'Tamil_Thirumanam_Peacock_Right',
    text: 'Single isolated royal South Indian Tamil wedding peacock (Mayil) perched facing left, iridescent sapphire blue neck, emerald and gold feathers, graceful long tail, traditional Tamil wedding stationery motif, isolated on pure white background, centered, full bird visible, realistic.',
    seed: 6940215
  },
  {
    prefix: 'Tamil_Thirumanam_Gopuram_Arch',
    text: 'Traditional South Indian Dravidian stone temple gopuram entrance arch with ornate carved pillars, authentic Tamil temple kalyana mandapam gateway, antique gold and warm granite details, symmetrical horizontal top arch, isolated on pure white background, high detail.',
    seed: 3105742
  },
  {
    prefix: 'Tamil_Thirumanam_Toran_Top',
    text: 'Traditional South Indian Tamil wedding floral toran garland canopy with fresh fragrant white Madurai Malli jasmine strands, bright yellow and orange marigold garlands, and green mango leaves, horizontal hanging border arrangement, isolated on pure white background.',
    seed: 8492017
  },
  {
    prefix: 'Tamil_Thirumanam_Uruli_Bottom',
    text: 'Traditional South Indian ornate brass Uruli bowl filled with water, floating pink lotus flower, red rose petals and white jasmine buds, with small glowing floating diya oil lamps, isolated on pure white background, centered, full bowl visible, wedding centerpiece.',
    seed: 4729103
  },
  {
    prefix: 'Tamil_Thirumanam_Apex_Murugan',
    text: 'Auspicious sacred Tamil wedding emblem, Lord Murugan divine golden Vel emblem with Tamil Om symbol, antique gold temple filigree jewelry style, auspicious Tamil wedding blessing crest, isolated on pure white background, centered, symmetrical, high detail.',
    seed: 9283741
  }
];

function buildWorkflow(prefix, text, seed) {
  return {
    '4': {
      'class_type': 'UNETLoader',
      'inputs': { 'unet_name': 'flux-2-klein-4b.safetensors', 'weight_dtype': 'default' }
    },
    '5': {
      'class_type': 'CLIPLoader',
      'inputs': { 'clip_name': 'qwen_3_4b.safetensors', 'type': 'flux2', 'device': 'default' }
    },
    '6': {
      'class_type': 'VAELoader',
      'inputs': { 'vae_name': 'flux2-vae.safetensors' }
    },
    '7': {
      'class_type': 'EmptyFlux2LatentImage',
      'inputs': { 'width': 512, 'height': 512, 'batch_size': 1 }
    },
    '8': {
      'class_type': 'Flux2Scheduler',
      'inputs': { 'base_shift': 0.5, 'max_shift': 1.15, 'steps': 8, 'stretch': true, 'terminal': 0.1, 'width': 512, 'height': 512 }
    },
    '9': {
      'class_type': 'KSamplerSelect',
      'inputs': { 'sampler_name': 'euler' }
    },
    '10': {
      'class_type': 'CLIPTextEncode',
      'inputs': {
        'text': text,
        'clip': ['5', 0]
      }
    },
    '11': {
      'class_type': 'ConditioningZeroOut',
      'inputs': { 'conditioning': ['10', 0] }
    },
    '12': {
      'class_type': 'CFGGuider',
      'inputs': { 'model': ['4', 0], 'positive': ['10', 0], 'negative': ['11', 0], 'cfg': 1 }
    },
    '13': {
      'class_type': 'RandomNoise',
      'inputs': { 'noise_seed': seed }
    },
    '14': {
      'class_type': 'SamplerCustomAdvanced',
      'inputs': { 'noise': ['13', 0], 'guider': ['12', 0], 'sampler': ['9', 0], 'sigmas': ['8', 0], 'latent_image': ['7', 0] }
    },
    '15': {
      'class_type': 'VAEDecode',
      'inputs': { 'samples': ['14', 0], 'vae': ['6', 0] }
    },
    '16': {
      'class_type': 'SaveImage',
      'inputs': { 'filename_prefix': prefix, 'images': ['15', 0] }
    }
  };
}

async function run() {
  console.log(`Starting generation of ${TASKS.length} FLUX.2 Klein 4B assets...`);
  const outDir = 'C:/Users/nanil/OneDrive/Desktop/Matey/personal_ai/ComfyUI-master/output';

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i];
    console.log(`\n[${i + 1}/${TASKS.length}] Submitting ${task.prefix}...`);
    const prompt = buildWorkflow(task.prefix, task.text, task.seed);

    const postRes = await fetch('http://127.0.0.1:8188/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const postData = await postRes.json();
    if (postData.error) {
      console.error('Error submitting prompt:', postData.error);
      continue;
    }
    const promptId = postData.prompt_id;
    console.log(`   Prompt ID: ${promptId}. Waiting for completion...`);

    let completed = false;
    for (let attempts = 0; attempts < 90; attempts++) {
      await new Promise(r => setTimeout(r, 2000));
      const histRes = await fetch('http://127.0.0.1:8188/history/' + promptId);
      const histData = await histRes.json();
      if (histData[promptId]) {
        const status = histData[promptId]?.status;
        if (status?.status_str === 'success') {
          const outputs = histData[promptId]?.outputs;
          const imgObj = outputs?.['16']?.images?.[0];
          console.log(`   ✓ Completed successfully: ${imgObj?.filename}`);
        } else {
          console.error('   ✗ Failed status:', status);
        }
        completed = true;
        break;
      }
      process.stdout.write('.');
    }
    if (!completed) {
      console.warn(`\n   Timed out waiting for ${promptId}`);
    }
  }

  console.log('\nAll asset generation tasks completed!');
}

run().catch(console.error);
