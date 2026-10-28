/*
 * Batch Generator for FLUX.2 Klein 4B Wedding Ceremony Icons
 * Generates and saves unique, high-quality PNG illustrations with transparent backgrounds.
 *
 * Usage:
 *   node tools/ai-background/generate-ceremonies.js
 */
'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const comfy = require('./comfy');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(ROOT, 'images', 'ceremony-icons');

const STYLE_PROMPT = 'photorealistic close-up, luxury wedding photography, high-end commercial photo, studio lighting, hyperrealistic, extremely detailed, elegant, isolated on pure white background, centered, high quality, square canvas, complete centerpiece object visible';
const NEGATIVE_PROMPT = 'cartoon, illustration, vector, digital art, line art, painting, drawing, sketch, 3d render, plastic, dark background, black background, text, words, logo, watermark, bad quality, blurry, cropped elements';

const PROMPTS = {
  'haldi': {
    name: 'Haldi Ceremony Icon',
    prompt: `Photorealistic close-up of a traditional brass bowl filled with bright yellow turmeric paste, surrounded by fresh yellow and orange marigold flowers, real turmeric roots, and green leaves, natural lighting, realistic materials and textures, ${STYLE_PROMPT}.`
  },
  'mehndi': {
    name: 'Mehndi Ceremony Icon',
    prompt: `Photorealistic close-up of hands with highly detailed, intricate traditional Indian Mehndi patterns, detailed henna artwork with realistic skin texture, soft natural lighting, ${STYLE_PROMPT}.`
  },
  'wedding': {
    name: 'Wedding Ceremony Icon',
    prompt: `Traditional Hindu marriage homam kund (sacred fire pit) with rising golden-orange sacred flames, realistic brass pit, traditional wedding ritual details, realistic metal and firelight, ${STYLE_PROMPT}.`
  },
  'reception': {
    name: 'Wedding Reception Icon',
    prompt: `Photorealistic image of a luxurious Indian wedding reception floral arch adorned with fresh red and pink roses, orchids, and jasmine flowers, warm decorative lighting and natural shadows, ${STYLE_PROMPT}.`
  }
};

function seed() {
  return crypto.randomInt(1, 281_474_976_710_655);
}

async function generateIcon(key, config) {
  const outputPath = path.join(OUTPUT_DIR, `${key}.png`);

  // Check if exists
  try {
    await fs.stat(outputPath);
    console.log(`- Already exists: images/ceremony-icons/${key}.png`);
    return outputPath;
  } catch {
    // Continue to generation
  }

  console.log(`\n▶ Generating ${config.name}...`);

  const queued = await comfy.queue({
    prompt: config.prompt,
    negativePrompt: NEGATIVE_PROMPT,
    seed: seed(),
    width: 512,
    height: 512,
    steps: 8
  });

  const image = await comfy.waitForImage(queued.prompt_id, 10 * 60 * 1000);
  const buffer = await comfy.fetchImageBuffer(image);

  await fs.writeFile(outputPath, buffer);
  console.log(`✔ Saved: images/ceremony-icons/${key}.png (${buffer.length} bytes)`);
  return outputPath;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`=======================================================`);
  console.log(`InviteAura Ceremony Icon Generator`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`=======================================================`);

  if (!(await comfy.isAvailable())) {
    console.log(`⚠️ ComfyUI is not reachable at ${comfy.COMFYUI_URL || 'http://127.0.0.1:8188'}.`);
    console.log(`Skipping actual AI generation and using fallbacks.`);
    return;
  }

  for (const [key, config] of Object.entries(PROMPTS)) {
    try {
      await generateIcon(key, config);
    } catch (err) {
      console.error(`✖ Failed generation for ${key}: ${err.message}`);
    }
  }

  console.log(`\nDone.`);
}

main().catch(err => {
  console.error(`Fatal error:`, err);
});
