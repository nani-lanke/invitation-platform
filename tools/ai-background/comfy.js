/*
 * Native FLUX.2 Klein 4B text-to-image client.
 *
 * ComfyUI graph:
 * UNETLoader
 *   + Qwen CLIPLoader
 *   + Flux2Scheduler
 *   + CFGGuider
 *   + SamplerCustomAdvanced
 *   + VAEDecode
 *   + SaveImage
 *
 * This client is designed for:
 *   Invitation Platform
 *       -> AI Background Server
 *       -> ComfyUI
 *       -> FLUX.2 Klein 4B
 */

'use strict';

const crypto = require('crypto');

const DEFAULT_COMFYUI_URL = 'http://127.0.0.1:8188';

const COMFYUI_URL = (
  process.env.COMFYUI_URL || DEFAULT_COMFYUI_URL
).replace(/\/+$/, '');

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1536;
const DEFAULT_STEPS = 4;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 1500;


/**
 * Sleep helper.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Make a request to ComfyUI.
 */
async function request(path, options = {}) {
  const response = await fetch(COMFYUI_URL + path, options);

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `ComfyUI ${response.status}: ${text.slice(0, 1200)}`
    );
  }

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `ComfyUI returned invalid JSON from ${path}: ${text.slice(0, 1200)}`
    );
  }
}


/**
 * Check whether ComfyUI is reachable.
 */
async function isAvailable(timeoutMs = 3000) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(
      `${COMFYUI_URL}/system_stats`,
      {
        signal: controller.signal
      }
    );

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}


/**
 * Build the native FLUX.2 Klein 4B ComfyUI workflow.
 *
 * Important:
 * The model filenames must match the files installed
 * in the ComfyUI model directories.
 */
function buildWorkflow({
  prompt,
  negativePrompt = '',
  seed,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  steps = DEFAULT_STEPS
}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('A valid prompt is required.');
  }

  const safeWidth = Math.max(64, Math.floor(width));
  const safeHeight = Math.max(64, Math.floor(height));
  const safeSteps = Math.max(1, Math.floor(steps));

  const safeSeed =
    Number.isFinite(Number(seed))
      ? Number(seed)
      : Math.floor(Math.random() * 0xffffffff);

  /*
   * FLUX.2 Klein 4B model.
   */
  const workflow = {
    '4': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'flux-2-klein-4b.safetensors',
        weight_dtype: 'default'
      }
    },

    /*
     * Qwen 3 4B text encoder used by FLUX.2.
     */
    '5': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'qwen_3_4b.safetensors',
        type: 'flux2',
        device: 'default'
      }
    },

    /*
     * FLUX.2 VAE.
     */
    '6': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'flux2-vae.safetensors'
      }
    },

    /*
     * Empty latent canvas.
     */
    '7': {
      class_type: 'EmptyFlux2LatentImage',
      inputs: {
        width: safeWidth,
        height: safeHeight,
        batch_size: 1
      }
    },

    /*
     * FLUX.2 scheduler.
     */
    '8': {
      class_type: 'Flux2Scheduler',
      inputs: {
        base_shift: 0.5,
        max_shift: 1.15,
        steps: safeSteps,
        stretch: true,
        terminal: 0.1,
        width: safeWidth,
        height: safeHeight
      }
    },

    /*
     * Euler sampler.
     */
    '9': {
      class_type: 'KSamplerSelect',
      inputs: {
        sampler_name: 'euler'
      }
    },

    /*
     * Main positive prompt.
     */
    '10': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['5', 0]
      }
    },

    /*
     * FLUX.2 Klein workflow uses zeroed conditioning
     * for the negative side rather than a separate
     * negative CLIP prompt.
     */
    '11': {
      class_type: 'ConditioningZeroOut',
      inputs: {
        conditioning: ['10', 0]
      }
    },

    /*
     * CFG guider.
     */
    '12': {
      class_type: 'CFGGuider',
      inputs: {
        model: ['4', 0],
        positive: ['10', 0],
        negative: ['11', 0],
        cfg: 1.0
      }
    },

    /*
     * Random seed.
     */
    '13': {
      class_type: 'RandomNoise',
      inputs: {
        noise_seed: safeSeed
      }
    },

    /*
     * Main FLUX.2 sampling node.
     */
    '14': {
      class_type: 'SamplerCustomAdvanced',
      inputs: {
        noise: ['13', 0],
        guider: ['12', 0],
        sampler: ['9', 0],
        sigmas: ['8', 0],
        latent_image: ['7', 0]
      }
    },

    /*
     * Decode latent into image.
     */
    '15': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['14', 0],
        vae: ['6', 0]
      }
    },

    /*
     * Save generated image inside ComfyUI output directory.
     */
    '16': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: 'InviteAura_AI_Background',
        images: ['15', 0]
      }
    }
  };

  return workflow;
}


/**
 * Queue a FLUX.2 Klein generation job.
 */
async function queue({
  prompt,
  negativePrompt = '',
  seed,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  steps = DEFAULT_STEPS
}) {
  const workflow = buildWorkflow({
    prompt,
    negativePrompt,
    seed,
    width,
    height,
    steps
  });

  const clientId = `inviteaura_${crypto
    .randomBytes(8)
    .toString('hex')}`;

  return request('/prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId
    })
  });
}


/**
 * Wait until ComfyUI finishes the generation.
 *
 * Returns the first generated image metadata object.
 */
async function waitForImage(
  promptId,
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  if (!promptId) {
    throw new Error('ComfyUI prompt ID is required.');
  }

  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    await sleep(POLL_INTERVAL_MS);

    let history;

    try {
      history = await request(
        `/history/${encodeURIComponent(promptId)}`
      );
    } catch {
      /*
       * ComfyUI can briefly fail while the job is still running.
       * Continue polling instead of failing immediately.
       */
      continue;
    }

    const run = history[promptId];

    if (!run) {
      continue;
    }

    /*
     * ComfyUI execution failure.
     */
    if (
      run.status &&
      run.status.status_str === 'error'
    ) {
      throw new Error(
        `ComfyUI execution failed: ${JSON.stringify(
          run.status.messages || run.status
        )}`
      );
    }

    /*
     * Look through the outputs for an image.
     */
    for (const output of Object.values(run.outputs || {})) {
      if (
        output &&
        Array.isArray(output.images) &&
        output.images.length > 0
      ) {
        return output.images[0];
      }
    }

    /*
     * If ComfyUI reports success but no image was produced,
     * continue briefly in case output metadata is still being written.
     */
  }

  throw new Error(
    `Timed out waiting for ComfyUI job ${promptId}`
  );
}


/**
 * Download a generated image from ComfyUI.
 */
async function fetchImageBuffer(image) {
  if (!image || !image.filename) {
    throw new Error(
      'Invalid ComfyUI image metadata.'
    );
  }

  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || '',
    type: image.type || 'output'
  });

  const response = await fetch(
    `${COMFYUI_URL}/view?${params.toString()}`
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');

    throw new Error(
      `ComfyUI image download failed: ${response.status} ${text.slice(
        0,
        500
      )}`
    );
  }

  return Buffer.from(
    await response.arrayBuffer()
  );
}


/**
 * Get ComfyUI system information.
 *
 * Useful for diagnostics.
 */
async function getSystemStats() {
  return request('/system_stats');
}


/**
 * Get queue status.
 *
 * Useful for monitoring batch generation.
 */
async function getQueue() {
  return request('/queue');
}


/**
 * Export public API.
 */
module.exports = {
  COMFYUI_URL,

  isAvailable,

  getSystemStats,

  getQueue,

  buildWorkflow,

  queue,

  waitForImage,

  fetchImageBuffer
};