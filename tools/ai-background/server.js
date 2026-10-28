/*
 * Local AI Isolated Asset Generation Server
 *
 * Run from the invitation project root:
 *   npm run ai:bg-server
 *
 * The browser editor calls:
 *   POST /api/ai-background/generate
 *   Body: { "template": "telugu-pelli", "asset": "vinayaka" }
 *
 * The server sends the isolated single-object prompt to the local ComfyUI FLUX.2 Klein
 * 4B instance, saves the resulting 32-bit transparent PNG directly inside this project and
 * returns the project-relative asset path.
 */
'use strict';

require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env')
});

const http = require('http');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { getAssetPrompt, listTemplateAssets } = require('./prompts');
const comfy = require('./comfy');

const ROOT = path.resolve(__dirname, '../..');
const PORT = Number(process.env.AI_BG_PORT || 8787);
const ASSETS_ROOT = path.join(ROOT, 'images', 'invitation-assets');

let busy = false;

function send(res, status, data, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(typeof data === 'string' ? data : JSON.stringify(data));
}

function safeName(value) {
  return String(value || 'wedding')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'wedding';
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 64 * 1024) {
        req.destroy();
        reject(new Error('Request too large.'));
      }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON request.')); }
    });
    req.on('error', reject);
  });
}

async function generate(body) {
  if (busy) {
    const error = new Error('Another AI asset is currently generating. The local GPU queue is one job at a time.');
    error.status = 409;
    throw error;
  }

  const template = safeName(body.template || 'telugu-pelli');
  const assetName = safeName(body.asset || 'vinayaka');
  const config = getAssetPrompt(template, assetName);

  if (!(await comfy.isAvailable())) {
    const error = new Error(`ComfyUI is not reachable at ${comfy.COMFYUI_URL}. Start ComfyUI first.`);
    error.status = 503;
    throw error;
  }

  busy = true;

  try {
    const prompt = String(body.prompt || config.prompt);
    const negativePrompt = String(body.negativePrompt || config.negative);
    const width = Number(body.width || config.width);
    const height = Number(body.height || config.height);
    const steps = Number(body.steps || process.env.AI_BG_STEPS || 4);
    const seed = body.seed != null
      ? Number(body.seed)
      : crypto.randomInt(1, 281_474_976_710_655);

    const queued = await comfy.queue({
      prompt,
      negativePrompt,
      seed,
      width,
      height,
      steps
    });

    const imageMeta = await comfy.waitForImage(queued.prompt_id);
    const buffer = await comfy.fetchImageBuffer(imageMeta);

    const dir = path.join(ASSETS_ROOT, template);
    await fsp.mkdir(dir, { recursive: true });

    const filename = `${assetName}.png`;
    const outputPath = path.join(dir, filename);
    await fsp.writeFile(outputPath, buffer);

    const relative = path.posix.join('images', 'invitation-assets', template, filename);
    const dataUrl = 'data:image/png;base64,' + buffer.toString('base64');

    return {
      ok: true,
      template,
      asset: assetName,
      seed,
      promptId: queued.prompt_id,
      filename,
      assetPath: relative,
      dataUrl,
      bytes: buffer.length
    };
  } finally {
    busy = false;
  }
}

async function serveStatic(req, res, pathname) {
  const relative = pathname.replace(/^\/+/, '');
  const file = path.resolve(ROOT, relative);
  if (!file.startsWith(ROOT + path.sep)) {
    send(res, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const data = await fsp.readFile(file);
    const ext = path.extname(file).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    send(res, 200, data, mimeMap[ext] || 'application/octet-stream');
  } catch {
    send(res, 404, { error: 'Image not found' });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, '');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/ai-background/health') {
      const available = await comfy.isAvailable();
      send(res, available ? 200 : 503, {
        ok: available,
        comfyui: available,
        comfyuiUrl: comfy.COMFYUI_URL,
        busy
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/ai-background/assets') {
      const template = safeName(url.searchParams.get('template') || 'telugu-pelli');
      const assets = listTemplateAssets(template);
      send(res, 200, { ok: true, template, assets });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/ai-background/generate') {
      const body = await readJson(req);
      const result = await generate(body);
      send(res, 200, result);
      return;
    }

    if (req.method === 'GET' && (url.pathname.startsWith('/images/invitation-assets/') || url.pathname.startsWith('/images/ai-backgrounds/'))) {
      await serveStatic(req, res, url.pathname);
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('AI ASSET SERVER ERROR:', error);
    send(res, error.status || 500, {
      ok: false,
      error: error.message || 'Unknown error'
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`InviteAura AI Asset Server: http://127.0.0.1:${PORT}`);
  console.log(`ComfyUI: ${comfy.COMFYUI_URL}`);
  console.log(`Assets Directory: ${ASSETS_ROOT}`);
});
