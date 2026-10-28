'use strict';

async function diagnose() {
  const url = 'http://127.0.0.1:8188';
  console.log('Querying ComfyUI stats and object info...');

  try {
    const statsRes = await fetch(`${url}/system_stats`);
    const stats = await statsRes.json();
    console.log('System Stats:', JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('Failed to get system_stats:', err.message);
  }

  try {
    const infoRes = await fetch(`${url}/object_info`);
    const info = await infoRes.json();
    const nodesToCheck = ['UNETLoader', 'CLIPLoader', 'VAELoader', 'EmptyFlux2LatentImage', 'Flux2Scheduler', 'SamplerCustomAdvanced', 'LoadImage'];
    console.log('\nChecking ComfyUI custom/core nodes:');
    for (const node of nodesToCheck) {
      if (info[node]) {
        console.log(`  ✅ ${node}: available`);
      } else {
        console.log(`  ❌ ${node}: MISSING or unknown`);
      }
    }
  } catch (err) {
    console.error('Failed to get object_info:', err.message);
  }
}

diagnose();
