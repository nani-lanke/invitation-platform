/*
 * AI isolated single-object asset generator.
 *
 * ARCHITECTURAL PRINCIPLE:
 * - Generates ONE isolated, 32-bit transparent PNG decorative asset at a time.
 * - Saves each asset to images/invitation-assets/<template>/<asset>.png.
 *
 * Examples:
 *   # Generate a single specific asset
 *   npm run ai:bg-generate -- --template telugu-pelli --asset vinayaka
 *
 *   # Generate all assets for a template
 *   npm run ai:bg-generate -- --template telugu-pelli --all
 */
'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { getAssetPrompt, listTemplateAssets } = require('./prompts');
const comfy = require('./comfy');

const ROOT = path.resolve(__dirname, '../..');
const ASSETS_ROOT = path.join(ROOT, 'images', 'invitation-assets');

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function seed() {
  return crypto.randomInt(1, 281_474_976_710_655);
}

async function generateSingleAsset(template, assetName, steps) {
  const config = getAssetPrompt(template, assetName);
  const dir = path.join(ASSETS_ROOT, template);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${config.asset || assetName}.png`;
  const outputPath = path.join(dir, filename);

  console.log(`\n▶ Generating asset: ${template} / ${assetName} (${config.width}x${config.height})`);
  console.log(`  Prompt: ${config.prompt.slice(0, 100)}...`);

  const queued = await comfy.queue({
    prompt: config.prompt,
    negativePrompt: config.negative,
    seed: seed(),
    width: config.width,
    height: config.height,
    steps
  });

  console.log(`  ComfyUI job: ${queued.prompt_id}`);

  const image = await comfy.waitForImage(queued.prompt_id);
  const buffer = await comfy.fetchImageBuffer(image);

  await fs.writeFile(outputPath, buffer);
  console.log(`✔ Saved isolated asset: ${path.relative(ROOT, outputPath)} (${buffer.length} bytes)`);

  return outputPath;
}

async function main() {
  const template = String(arg('template', 'telugu-pelli')).toLowerCase();
  const asset = arg('asset', null);
  const all = hasFlag('all') || (!asset && !arg('asset', null));
  const steps = Number(arg('steps', process.env.AI_BG_STEPS || 4));

  if (!(await comfy.isAvailable())) {
    throw new Error(`ComfyUI is not reachable at ${comfy.COMFYUI_URL}. Start it first.`);
  }

  const assetsToGenerate = asset ? [asset] : (all ? listTemplateAssets(template) : ['vinayaka']);

  console.log(`=======================================================`);
  console.log(`InviteAura Isolated Asset Generator`);
  console.log(`Template: ${template}`);
  console.log(`Assets:   ${assetsToGenerate.join(', ')}`);
  console.log(`Output:   images/invitation-assets/${template}/`);
  console.log(`=======================================================`);

  let succeeded = 0;
  for (const assetName of assetsToGenerate) {
    try {
      await generateSingleAsset(template, assetName, steps);
      succeeded++;
    } catch (err) {
      console.error(`✖ Failed to generate ${assetName}: ${err.message}`);
    }
  }

  console.log(`\nDone. Successfully generated ${succeeded}/${assetsToGenerate.length} asset(s).`);
}

main().catch(error => {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
});
