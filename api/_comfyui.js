/* ====================================================================
   api/_comfyui.js — ComfyUI FLUX.2 Klein 4B Integration Service

   Manages communication with local or remote ComfyUI server:
   - Uploads sanitized reference images (decorations/frame without text)
   - Builds execution graph for FLUX.2 Klein 4B image-edit workflow
     (models: flux-2-klein-4b.safetensors, qwen_3_4b.safetensors, flux2-vae.safetensors)
   - Queues prompt execution and polls history until completion
   - Downloads generated output image buffer
   ==================================================================== */

'use strict';

const crypto = require('crypto');

const DEFAULT_COMFYUI_URL = 'http://127.0.0.1:8188';

function getComfyUiUrl() {
  return (process.env.COMFYUI_URL || process.env.COMFYUI_HOST || DEFAULT_COMFYUI_URL).replace(/\/+$/, '');
}

/**
 * Check if the ComfyUI server is reachable.
 */
async function isAvailable(timeoutMs) {
  const url = getComfyUiUrl();
  const timeout = timeoutMs || 3000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${url}/system_stats`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.ok;
  } catch (err) {
    clearTimeout(timer);
    return false;
  }
}

/**
 * Upload an image buffer to ComfyUI /upload/image endpoint.
 */
async function uploadImage(imageBuffer, originalFilename) {
  const url = getComfyUiUrl();
  const filename = originalFilename || `ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;

  const boundary = '----WebKitFormBoundary' + crypto.randomBytes(16).toString('hex');
  const CRLF = '\r\n';

  const preBuffer = Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="image"; filename="${filename}"${CRLF}` +
    `Content-Type: image/png${CRLF}${CRLF}`
  );

  const postBuffer = Buffer.from(
    `${CRLF}--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="overwrite"${CRLF}${CRLF}` +
    `true${CRLF}` +
    `--${boundary}--${CRLF}`
  );

  const body = Buffer.concat([preBuffer, imageBuffer, postBuffer]);

  const res = await fetch(`${url}/upload/image`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': String(body.length)
    },
    body: body
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ComfyUI upload failed (${res.status}): ${text || res.statusText}`);
  }

  const result = await res.json();
  return result.name || filename;
}

/**
 * Construct FLUX.2 Klein 4B ComfyUI workflow graph.
 * Uses:
 * - flux-2-klein-4b.safetensors (UNET / Model)
 * - qwen_3_4b.safetensors (Text Encoder / CLIP)
 * - flux2-vae.safetensors (VAE)
 */
function buildFlux2KleinWorkflow(options) {
  const referenceImageName = options.referenceImageName;
  const prompt = options.prompt;
  const negativePrompt = options.negativePrompt || 'text, words, letters, typography, watermark, signature, blurry, noisy, cluttered center, deformed elements, low quality.';
  const seed = options.seed || Math.floor(Math.random() * 1000000000);
  const steps = options.steps || 20;
  const cfg = options.cfg || 3.5;
  const denoise = typeof options.denoise === 'number' ? options.denoise : 0.65;

  return {
    "1": {
      "inputs": {
        "image": referenceImageName,
        "upload": "image"
      },
      "class_type": "LoadImage",
      "_meta": { "title": "Load Reference Image" }
    },
    "2": {
      "inputs": {
        "unet_name": "flux-2-klein-4b.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader",
      "_meta": { "title": "Load FLUX.2 Klein 4B Model" }
    },
    "3": {
      "inputs": {
        "clip_name1": "qwen_3_4b.safetensors",
        "type": "flux"
      },
      "class_type": "DualCLIPLoader",
      "_meta": { "title": "Load Qwen 3.4B Text Encoder" }
    },
    "4": {
      "inputs": {
        "vae_name": "flux2-vae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": { "title": "Load FLUX.2 VAE" }
    },
    "5": {
      "inputs": {
        "text": prompt,
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "Positive Aesthetic Prompt" }
    },
    "6": {
      "inputs": {
        "text": negativePrompt,
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "Negative Prompt" }
    },
    "7": {
      "inputs": {
        "pixels": ["1", 0],
        "vae": ["4", 0]
      },
      "class_type": "VAEEncode",
      "_meta": { "title": "VAE Encode Reference" }
    },
    "8": {
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": denoise,
        "model": ["2", 0],
        "positive": ["5", 0],
        "negative": ["6", 0],
        "latent_image": ["7", 0]
      },
      "class_type": "KSampler",
      "_meta": { "title": "FLUX.2 Klein KSampler" }
    },
    "9": {
      "inputs": {
        "samples": ["8", 0],
        "vae": ["4", 0]
      },
      "class_type": "VAEDecode",
      "_meta": { "title": "VAE Decode Output" }
    },
    "10": {
      "inputs": {
        "filename_prefix": "TeluguPelli_AI_BG",
        "images": ["9", 0]
      },
      "class_type": "SaveImage",
      "_meta": { "title": "Save Generated Background" }
    }
  };
}

/**
 * Queue execution in ComfyUI.
 */
async function queuePrompt(promptWorkflow) {
  const url = getComfyUiUrl();
  const clientId = 'invitation_platform_' + crypto.randomBytes(8).toString('hex');

  const res = await fetch(`${url}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: promptWorkflow,
      client_id: clientId
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ComfyUI prompt queuing failed (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  return {
    promptId: data.prompt_id,
    number: data.number,
    clientId: clientId
  };
}

/**
 * Poll execution history until the task completes.
 */
async function pollHistory(promptId, maxWaitMs) {
  const url = getComfyUiUrl();
  const timeout = maxWaitMs || 120000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const res = await fetch(`${url}/history/${promptId}`);
      if (!res.ok) continue;

      const history = await res.json();
      const run = history[promptId];
      if (!run) continue;

      if (run.status && run.status.status_str === 'error') {
        const errorDetails = (run.status.messages && run.status.messages.length)
          ? JSON.stringify(run.status.messages)
          : 'Unknown ComfyUI node execution error';
        throw new Error(`ComfyUI execution error: ${errorDetails}`);
      }

      if (run.outputs) {
        // Find SaveImage node outputs (typically node "10" or any node with images)
        for (const nodeId of Object.keys(run.outputs)) {
          const nodeOutput = run.outputs[nodeId];
          if (nodeOutput.images && nodeOutput.images.length > 0) {
            return nodeOutput.images[0];
          }
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('ComfyUI execution error')) throw err;
      // transient network poll error; retry next tick
    }
  }

  throw new Error(`Timed out waiting for ComfyUI generation after ${Math.round(timeout / 1000)}s`);
}

/**
 * Download generated image buffer from ComfyUI /view endpoint.
 */
async function fetchImageBuffer(filename, subfolder, type) {
  const url = getComfyUiUrl();
  const params = new URLSearchParams({
    filename: filename,
    subfolder: subfolder || '',
    type: type || 'output'
  });

  const res = await fetch(`${url}/view?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch generated image from ComfyUI (${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * High-level orchestration: generate an AI background from reference buffer + prompt.
 */
async function generateAiBackground(options) {
  const referenceBuffer = options.referenceImageBuffer;
  const prompt = options.prompt;
  const negativePrompt = options.negativePrompt;

  // 1. Check availability
  const available = await isAvailable(3000);
  if (!available) {
    return {
      ok: false,
      available: false,
      error: `ComfyUI server is not reachable at ${getComfyUiUrl()}. Please verify that the ComfyUI FLUX.2 service is running.`
    };
  }

  // 2. Upload reference PNG
  const refImageName = await uploadImage(referenceBuffer, `telugu_pelli_ref_${Date.now()}.png`);

  // 3. Build FLUX.2 Klein workflow
  const workflow = buildFlux2KleinWorkflow({
    referenceImageName: refImageName,
    prompt: prompt,
    negativePrompt: negativePrompt,
    seed: options.seed,
    steps: options.steps || 20,
    cfg: options.cfg || 3.5,
    denoise: options.denoise || 0.65
  });

  // 4. Queue prompt
  const queueResult = await queuePrompt(workflow);

  // 5. Poll history
  const outputMeta = await pollHistory(queueResult.promptId, options.timeoutMs || 120000);

  // 6. Download generated image buffer
  const imageBuffer = await fetchImageBuffer(outputMeta.filename, outputMeta.subfolder, outputMeta.type);

  // 7. Format as base64 data URL
  const mimeType = outputMeta.filename.endsWith('.jpg') || outputMeta.filename.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  return {
    ok: true,
    available: true,
    dataUrl: dataUrl,
    promptId: queueResult.promptId,
    filename: outputMeta.filename
  };
}

module.exports = {
  getComfyUiUrl: getComfyUiUrl,
  isAvailable: isAvailable,
  uploadImage: uploadImage,
  buildFlux2KleinWorkflow: buildFlux2KleinWorkflow,
  queuePrompt: queuePrompt,
  pollHistory: pollHistory,
  fetchImageBuffer: fetchImageBuffer,
  generateAiBackground: generateAiBackground
};
