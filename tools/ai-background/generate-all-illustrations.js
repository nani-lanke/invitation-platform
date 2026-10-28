/*
 * Batch Generator for FLUX.2 Klein 4B Category Illustrations
 * Generates and saves unique, event-appropriate image illustrations for all 18 invitation categories.
 *
 * Usage:
 *   node tools/ai-background/generate-all-illustrations.js
 */
'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { CATEGORY_ILLUSTRATION_PROMPTS } = require('./illustration-prompts');
const comfy = require('./comfy');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(ROOT, 'images', 'generated-backgrounds');

function seed() {
  return crypto.randomInt(1, 281_474_976_710_655);
}

async function generateIllustration(category, config) {
  const dir = path.join(OUTPUT_DIR, category);
  await fs.mkdir(dir, { recursive: true });

  const outputPath = path.join(dir, 'illustration.png');

  // Check if exists
  try {
    await fs.stat(outputPath);
    console.log(`- Already exists: ${category}/illustration.png`);
    return outputPath;
  } catch {
    // Continue to generation
  }

  console.log(`\n▶ Generating Illustration: ${category} (${config.name})...`);

  try {
    const queued = await comfy.queue({
      prompt: config.prompt,
      negativePrompt: config.negative,
      seed: seed(),
      width: 512,
      height: 512,
      steps: 8
    });

    const image = await comfy.waitForImage(queued.prompt_id, 30 * 60 * 1000);
    const buffer = await comfy.fetchImageBuffer(image);

    await fs.writeFile(outputPath, buffer);
    console.log(`✔ Saved: ${category}/illustration.png (${buffer.length} bytes)`);
    return outputPath;
  } catch (err) {
    console.error(`✖ Failed generation for ${category}: ${err.message}`);
    throw err;
  }
}

async function updateManifest() {
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  let manifest = {};
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    manifest = JSON.parse(content);
  } catch {}

  manifest.illustrations = manifest.illustrations || {};

  for (const category of Object.keys(CATEGORY_ILLUSTRATION_PROMPTS)) {
    manifest.illustrations[category] = `images/generated-backgrounds/${category}/illustration.png`;
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✔ Updated manifest with illustrations: ${path.relative(ROOT, manifestPath)}`);
}

async function main() {
  if (!(await comfy.isAvailable())) {
    console.error(`❌ ComfyUI is not reachable at ${comfy.COMFYUI_URL}.`);
    process.exit(1);
  }

  console.log(`=======================================================`);
  console.log(`InviteAura Category Illustration Generator`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`=======================================================`);

  for (const [category, config] of Object.entries(CATEGORY_ILLUSTRATION_PROMPTS)) {
    try {
      await generateIllustration(category, config);
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
