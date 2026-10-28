const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const srcDir = 'C:/Users/nanil/OneDrive/Desktop/Matey/personal_ai/ComfyUI-master/output';
  const outDir = path.resolve(__dirname, '..', 'images', 'invitation-assets', 'tamil-thirumanam');

  const tasks = [
    { src: 'Tamil_Thirumanam_Gopuram_Arch_00001_.png', dest: 'gopuram-arch.png', threshold: 35 },
    { src: 'Tamil_Thirumanam_Toran_Top_00001_.png', dest: 'toran-top.png', threshold: 35 },
    { src: 'Tamil_Thirumanam_Apex_Murugan_00001_.png', dest: 'apex-murugan.png', threshold: 35 },
    { src: 'Tamil_Thirumanam_Pillar_Left_00001_.png', dest: 'pillar-left.png', threshold: 30 },
    { src: 'Tamil_Thirumanam_Pillar_Right_00001_.png', dest: 'pillar-right.png', threshold: 30 },
    { src: 'Tamil_Thirumanam_Garland_Left_00001_.png', dest: 'garland-left.png', threshold: 30 },
    { src: 'Tamil_Thirumanam_Garland_Right_00001_.png', dest: 'garland-right.png', threshold: 30 },
    { src: 'Tamil_Thirumanam_Kuthuvilakku_00001_.png', dest: 'kuthuvilakku-left.png', threshold: 30 },
    { src: 'Tamil_Thirumanam_Kuthuvilakku_00001_.png', dest: 'kuthuvilakku-right.png', threshold: 30, flip: true },
    { src: 'Tamil_Thirumanam_Peacock_Left_00001_.png', dest: 'peacock-left.png', threshold: 32 },
    { src: 'Tamil_Thirumanam_Peacock_Right_00001_.png', dest: 'peacock-right.png', threshold: 32 },
    { src: 'Tamil_Thirumanam_Uruli_Bottom_00001_.png', dest: 'uruli-bottom.png', threshold: 35 }
  ];

  console.log('Processing transparency for Tamil Thirumanam assets...');

  for (const t of tasks) {
    const fPath = path.join(srcDir, t.src);
    if (!fs.existsSync(fPath)) {
      console.error(`✗ Source missing: ${t.src}`);
      continue;
    }

    const dataUrl = 'data:image/png;base64,' + fs.readFileSync(fPath).toString('base64');

    const resultDataUrl = await page.evaluate(async ({ src, threshold, flip }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (flip) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, 0, 0);

      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample corner pixels to auto-detect whether background is black or white
      const cornerIndices = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
      let avgBrightness = 0;
      for (const cIdx of cornerIndices) {
        avgBrightness += (data[cIdx] + data[cIdx + 1] + data[cIdx + 2]) / 3;
      }
      avgBrightness /= cornerIndices.length;
      const isBlackBg = avgBrightness < 60;

      // Single object flood fill / background isolation from perimeter
      const visited = new Uint8Array(w * h);
      const queue = [];

      function isBg(x, y) {
        const idx = (y * w + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (isBlackBg) {
          return Math.max(r, g, b) < threshold;
        } else {
          return Math.max(255 - r, 255 - g, 255 - b) < threshold;
        }
      }

      // Enqueue all 4 image borders
      for (let x = 0; x < w; x++) {
        if (isBg(x, 0) && !visited[0 * w + x]) { queue.push(x, 0); visited[0 * w + x] = 1; }
        if (isBg(x, h - 1) && !visited[(h - 1) * w + x]) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
      }
      for (let y = 0; y < h; y++) {
        if (isBg(0, y) && !visited[y * w + 0]) { queue.push(0, y); visited[y * w + 0] = 1; }
        if (isBg(w - 1, y) && !visited[y * w + (w - 1)]) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
      }

      let qHead = 0;
      while (qHead < queue.length) {
        const cx = queue[qHead++];
        const cy = queue[qHead++];
        const neighbors = [
          [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
        ];
        for (let k = 0; k < 4; k++) {
          const nx = neighbors[k][0];
          const ny = neighbors[k][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nidx = ny * w + nx;
            if (!visited[nidx] && isBg(nx, ny)) {
              visited[nidx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      // Apply alpha based on flood filled background + edge anti-aliasing
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const pidx = y * w + x;
          const idx = pidx * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];

          if (visited[pidx]) {
            if (isBlackBg) {
              const brightness = Math.max(r, g, b);
              if (brightness < 10) {
                data[idx + 3] = 0;
              } else {
                const alpha = (brightness - 10) / (threshold - 10);
                data[idx + 3] = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
                const aNorm = Math.max(0.08, Math.min(1, alpha));
                data[idx] = Math.min(255, Math.max(0, Math.round(r / aNorm)));
                data[idx + 1] = Math.min(255, Math.max(0, Math.round(g / aNorm)));
                data[idx + 2] = Math.min(255, Math.max(0, Math.round(b / aNorm)));
              }
            } else {
              const diff = Math.max(255 - r, 255 - g, 255 - b);
              if (diff < 10) {
                data[idx + 3] = 0;
              } else {
                const alpha = (diff - 10) / (threshold - 10);
                data[idx + 3] = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
                const aNorm = Math.max(0.08, Math.min(1, alpha));
                data[idx] = Math.min(255, Math.max(0, Math.round((r - 255 * (1 - aNorm)) / aNorm)));
                data[idx + 1] = Math.min(255, Math.max(0, Math.round((g - 255 * (1 - aNorm)) / aNorm)));
                data[idx + 2] = Math.min(255, Math.max(0, Math.round((b - 255 * (1 - aNorm)) / aNorm)));
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/png');
    }, { src: dataUrl, threshold: t.threshold, flip: !!t.flip });

    const base64Data = resultDataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(outDir, t.dest);
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
    const stat = fs.statSync(outPath);
    console.log(`✓ Generated: ${t.dest} (${stat.size} bytes)`);
  }

  await browser.close();
  console.log('Finished processing all Tamil Thirumanam assets!');
})();
