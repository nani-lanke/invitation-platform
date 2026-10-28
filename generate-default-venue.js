'use strict';

const fs = require('fs');
const path = require('path');
const comfy = require('./tools/ai-background/comfy');

const PROMPT = "Create an ultra-realistic professional architectural photograph of a luxurious Indian wedding venue, a grand traditional Indian wedding palace or premium wedding mahal in Chennai, Tamil Nadu. Show a magnificent palace entrance with detailed traditional Indian architecture, elegant carved pillars, a beautiful grand entrance, warm golden architectural lighting, tasteful floral decorations, landscaped gardens, and a welcoming wedding atmosphere. Capture the venue during golden hour transitioning into early evening, with realistic shadows, natural colors, intricate architectural details, and professional high-end wedding photography quality. Wide horizontal composition, straight architectural perspective, realistic photography, cinematic but natural lighting, premium luxury wedding venue, exceptionally detailed and photorealistic.";

async function run() {
  console.log('Checking ComfyUI availability...');
  const available = await comfy.isAvailable(3000);
  if (!available) {
    console.error('Error: ComfyUI is not available on ' + comfy.COMFYUI_URL);
    process.exit(1);
  }

  console.log('Queueing prompt with FLUX.2 Klein 4B in ComfyUI...');
  try {
    const res = await comfy.queue({
      prompt: PROMPT,
      seed: 42, // deterministic seed for reproducible high quality
      width: 1200,
      height: 800,
      steps: 4
    });

    const promptId = res.prompt_id || res.promptId;
    if (!promptId) {
      console.error('Error: Failed to queue generation (no prompt ID returned)');
      process.exit(1);
    }

    console.log('Task queued. Prompt ID:', promptId);
    console.log('Waiting for FLUX.2 Klein 4B image generation (polling ComfyUI)...');

    const imageInfo = await comfy.waitForImage(promptId, 300000); // 5 min timeout
    console.log('Image generated successfully! File name:', imageInfo.filename);

    console.log('Downloading image buffer...');
    const buffer = await comfy.fetchImageBuffer(imageInfo);

    const outDir = path.join(__dirname, 'images', 'templates');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(outDir, 'venue-default.jpg');
    fs.writeFileSync(outPath, buffer);
    console.log('Success! Saved default venue image to:', outPath);
  } catch (err) {
    console.error('Generation failed:', err);
    process.exit(1);
  }
}

run();
