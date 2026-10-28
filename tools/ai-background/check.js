/*
 * Verify the local AI background pipeline.
 */
'use strict';

require('dotenv').config()

const { isAvailable, COMFYUI_URL } = require('./comfy');

(async () => {
  const ok = await isAvailable();
  console.log(`ComfyUI: ${COMFYUI_URL}`);
  if (!ok) {
    console.error('❌ ComfyUI is not reachable.');
    process.exit(1);
  }
  console.log('✅ ComfyUI is reachable.');
  console.log('✅ Local AI background generator is ready.');
})();
