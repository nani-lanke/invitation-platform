/*
 * Batch Generator for FLUX.2 Klein 4B Invitation Backgrounds
 * Generates and saves unique, event-appropriate artwork for all 18 invitation categories.
 *
 * Usage:
 *   node tools/ai-background/generate-all-backgrounds.js
 */
'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { CATEGORY_BACKGROUND_PROMPTS } = require('./background-prompts');
const comfy = require('./comfy');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(ROOT, 'images', 'generated-backgrounds');

function seed() {
  return crypto.randomInt(1, 281_474_976_710_655);
}

async function generateBackground(category, config) {
  const dir = path.join(OUTPUT_DIR, category);
  await fs.mkdir(dir, { recursive: true });

  const outputPath = path.join(dir, 'background.png');

  // Check if exists
  try {
    await fs.stat(outputPath);
    console.log(`- Already exists: ${category}`);
    return outputPath;
  } catch {
    // Continue to generation
  }

  console.log(`\n▶ Generating: ${category} (${config.name})...`);

  try {
    const queued = await comfy.queue({
      prompt: config.prompt,
      negativePrompt: config.negative,
      seed: seed(),
      width: 768,   // Suitable for invitation aspect ratio
      height: 1024,
      steps: 8      // Balanced for FLUX.2 Klein 4B
    });

    const image = await comfy.waitForImage(queued.prompt_id, 30 * 60 * 1000);
    const buffer = await comfy.fetchImageBuffer(image);

    await fs.writeFile(outputPath, buffer);
    console.log(`✔ Saved: ${category}/background.png (${buffer.length} bytes)`);
    return outputPath;
  } catch (err) {
    console.error(`✖ Failed generation for ${category}: ${err.message}`);
    throw err;
  }
}

async function updateManifest() {
  const manifest = {};
  for (const category of Object.keys(CATEGORY_BACKGROUND_PROMPTS)) {
    manifest[category] = `images/generated-backgrounds/${category}/background.png`;
  }

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✔ Updated manifest: ${path.relative(ROOT, manifestPath)}`);
}

async function main() {
  if (!(await comfy.isAvailable())) {
    console.error(`❌ ComfyUI is not reachable at ${comfy.COMFYUI_URL}.`);
    process.exit(1);
  }

  console.log(`=======================================================`);
  console.log(`InviteAura AI Background Batch Generator`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`=======================================================`);

  for (const [category, config] of Object.entries(CATEGORY_BACKGROUND_PROMPTS)) {
    try {
      await generateBackground(category, config);
    } catch (err) {
      // Continue next category on failure
    }
  }

  await updateManifest();
  console.log(`\nDone.`);
}

main().catch(error => {
  console.error(`\n❌ Fatal: ${error.message}`);
  process.exit(1);
});
