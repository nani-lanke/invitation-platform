'use strict';

const comfy = require('../tools/ai-background/comfy');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return json(res, 400, { error: 'The request body was not valid JSON.' });
    }
  }

  const venueName = body && body.venueName;
  const address = body && body.address;

  // Build a highly photorealistic prompt related to the venue location
  let prompt = 'A real photorealistic professional DSLR photography of the actual wedding and celebration venue';
  if (venueName && venueName !== 'Venue name') {
    prompt += `, ${venueName}`;
  }
  if (address) {
    prompt += `, located at ${address}`;
  }
  prompt += ', high-end luxury venue, beautiful wedding decorations, elegant real-world architecture, sharp focus, natural warm lighting, 8k resolution, highly detailed, realistic.';

  try {
    // 1. Check if ComfyUI is available
    const available = await comfy.isAvailable(3000);
    if (!available) {
      return json(res, 503, {
        error: 'AI venue generation service is currently offline. Please ensure ComfyUI is running locally or configured correctly.'
      });
    }

    // 2. Queue the generation (1200x800 for horizontal venue image is perfect!)
    const genResult = await comfy.queue({
      prompt: prompt,
      seed: Math.floor(Math.random() * 0xffffffff),
      width: 1200,
      height: 800,
      steps: 4
    });

    const promptId = genResult.prompt_id || genResult.promptId;
    if (!promptId) {
      return json(res, 502, { error: 'Failed to queue the AI generation task.' });
    }

    // 3. Wait for generated image
    const imageInfo = await comfy.waitForImage(promptId, 90000);

    // 4. Download image buffer
    const buffer = await comfy.fetchImageBuffer(imageInfo);

    // 5. Build base64 dataUrl
    const mimeType = imageInfo.filename && imageInfo.filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return json(res, 200, { dataUrl: dataUrl });
  } catch (err) {
    console.error('AI Venue generation failed:', err);
    return json(res, 500, { error: 'AI generation failed: ' + err.message });
  }
};
