'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { getAssetPrompt } = require('./prompts');
const comfy = require('./comfy');

const ROOT = path.resolve(__dirname, '../..');
const ASSETS_ROOT = path.join(ROOT, 'images', 'invitation-assets');

function seed() {
  return crypto.randomInt(1, 281_474_976_710_655);
}

async function fetchJobAndSave(promptId, template, assetName) {
  const dir = path.join(ASSETS_ROOT, template);
  await fs.mkdir(dir, { recursive: true });
  const outputPath = path.join(dir, `${assetName}.png`);

  console.log(`[${assetName}] Waiting for in-flight job ${promptId}...`);
  const image = await comfy.waitForImage(promptId, 30 * 60 * 1000);
  const buffer = await comfy.fetchImageBuffer(image);
  await fs.writeFile(outputPath, buffer);
  console.log(`[${assetName}] ✔ Saved in-flight asset: ${path.relative(ROOT, outputPath)} (${buffer.length} bytes)`);
  return outputPath;
}

async function generateAsset(template, assetName, steps = 4) {
  const config = getAssetPrompt(template, assetName);
  const dir = path.join(ASSETS_ROOT, template);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${config.asset || assetName}.png`;
  const outputPath = path.join(dir, filename);

  console.log(`\n▶ [${assetName}] Starting generation (${config.width}x${config.height}, steps=${steps})...`);
  console.log(`  Prompt: ${config.prompt.slice(0, 90)}...`);

  const queued = await comfy.queue({
    prompt: config.prompt,
    negativePrompt: config.negative,
    seed: seed(),
    width: config.width,
    height: config.height,
    steps
  });

  console.log(`  ComfyUI job: ${queued.prompt_id}`);

  const image = await comfy.waitForImage(queued.prompt_id, 30 * 60 * 1000);
  const buffer = await comfy.fetchImageBuffer(image);

  await fs.writeFile(outputPath, buffer);
  console.log(`✔ [${assetName}] Saved isolated asset: ${path.relative(ROOT, outputPath)} (${buffer.length} bytes)`);
  return outputPath;
}

async function run() {
  const template = 'telugu-pelli';
  const remainingAssets = [
    'temple-right',
    'lake-bottom',
    'lotus-bottom',
    'bells-left',
    'bells-right',
    'frame'
  ];

  // 1. Check if in-flight temple-left exists or needs fetching
  try {
    const templeLeftPath = path.join(ASSETS_ROOT, template, 'temple-left.png');
    const exists = await fs.stat(templeLeftPath).then(() => true).catch(() => false);
    if (!exists) {
      await fetchJobAndSave('1ae5121d-a588-4500-b801-a1015bfddeac', template, 'temple-left');
    } else {
      console.log('temple-left.png already exists on disk.');
    }
  } catch (err) {
    console.log(`In-flight temple-left job error or retry needed: ${err.message}`);
    console.log('Regenerating temple-left...');
    await generateAsset(template, 'temple-left', 4);
  }

  // 2. Generate the rest sequentially
  for (const assetName of remainingAssets) {
    const assetPath = path.join(ASSETS_ROOT, template, `${assetName}.png`);
    const exists = await fs.stat(assetPath).then(() => true).catch(() => false);
    if (exists) {
      console.log(`✔ [${assetName}] Already exists, skipping.`);
      continue;
    }

    let attempts = 0;
    while (attempts < 2) {
      try {
        attempts++;
        await generateAsset(template, assetName, 4);
        break;
      } catch (err) {
        console.error(`✖ [${assetName}] Error on attempt ${attempts}: ${err.message}`);
        if (attempts >= 2) throw err;
      }
    }
  }

  console.log('\n=============================================');
  console.log('ALL 14 TELUGU PELLI ASSETS SUCCESSFULLY GENERATED');
  console.log('=============================================');
}

run().catch(err => {
  console.error('\nFatal error in batch runner:', err);
  process.exit(1);
});
