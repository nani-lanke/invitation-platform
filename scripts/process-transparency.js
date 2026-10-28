const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const assetsDir = path.resolve(__dirname, '..', 'images', 'invitation-assets', 'telugu-pelli');

  const tasks = [
    { file: 'vinayaka.png', type: 'object', threshold: 35 },
    { file: 'flower-left.png', type: 'object', threshold: 30 },
    { file: 'flower-right.png', type: 'object', threshold: 30 },
    { file: 'flower-top-left.png', type: 'object', threshold: 30 },
    { file: 'flower-top-right.png', type: 'object', threshold: 30 },
    { file: 'temple-left.png', type: 'object', threshold: 30 },
    { file: 'temple-right.png', type: 'object', threshold: 30 },
    { file: 'lake-bottom.png', type: 'lake', threshold: 25 },
    { file: 'frame.png', type: 'frame', threshold: 45 },
    { file: 'elephant-left.png', type: 'object', threshold: 30 },
    { file: 'elephant-right.png', type: 'object', threshold: 30 },
    { file: 'lotus-bottom.png', type: 'object', threshold: 30 }
  ];

  for (const t of tasks) {
    const fPath = path.join(assetsDir, t.file);
    if (!fs.existsSync(fPath)) {
      console.log(`Skipping missing file: ${t.file}`);
      continue;
    }
    const dataUrl = 'data:image/png;base64,' + fs.readFileSync(fPath).toString('base64');

    const resultDataUrl = await page.evaluate(async ({ src, type, threshold }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
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

      if (type === 'frame') {
        // Frame: remove both outside and inside reading area background (black or white)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (isBlackBg) {
            const brightness = Math.max(r, g, b);
            if (brightness < 12) {
              data[i + 3] = 0;
            } else if (brightness < threshold) {
              const alpha = (brightness - 12) / (threshold - 12);
              data[i + 3] = Math.round(alpha * 255);
              const aNorm = Math.max(0.08, alpha);
              data[i] = Math.min(255, Math.max(0, Math.round(r / aNorm)));
              data[i + 1] = Math.min(255, Math.max(0, Math.round(g / aNorm)));
              data[i + 2] = Math.min(255, Math.max(0, Math.round(b / aNorm)));
            } else {
              data[i + 3] = 255;
            }
          } else {
            const diff = Math.max(255 - r, 255 - g, 255 - b);
            if (diff < 12) {
              data[i + 3] = 0;
            } else if (diff < threshold) {
              const alpha = (diff - 12) / (threshold - 12);
              data[i + 3] = Math.round(alpha * 255);
              const aNorm = Math.max(0.08, alpha);
              data[i] = Math.min(255, Math.max(0, Math.round((r - 255 * (1 - aNorm)) / aNorm)));
              data[i + 1] = Math.min(255, Math.max(0, Math.round((g - 255 * (1 - aNorm)) / aNorm)));
              data[i + 2] = Math.min(255, Math.max(0, Math.round((b - 255 * (1 - aNorm)) / aNorm)));
            } else {
              data[i + 3] = 255;
            }
          }
        }
      } else if (type === 'lake') {
        // Lake: soft watercolor water blending with multi-edge dissolution
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const pidx = i / 4;
          const x = pidx % w;
          const y = Math.floor(pidx / w);

          const topFeather = Math.min(1, Math.max(0, y / 80));
          const leftFeather = Math.min(1, Math.max(0, x / 60));
          const rightFeather = Math.min(1, Math.max(0, (w - 1 - x) / 60));
          const edgeFade = topFeather * leftFeather * rightFeather;

          if (isBlackBg) {
            const brightness = Math.max(r, g, b);
            if (brightness < 10) {
              data[i + 3] = 0;
            } else if (brightness < 50) {
              const alpha = ((brightness - 10) / (50 - 10)) * edgeFade;
              data[i + 3] = Math.round(alpha * 255);
              const aNorm = Math.max(0.08, (brightness - 10) / (50 - 10));
              data[i] = Math.min(255, Math.max(0, Math.round(r / aNorm)));
              data[i + 1] = Math.min(255, Math.max(0, Math.round(g / aNorm)));
              data[i + 2] = Math.min(255, Math.max(0, Math.round(b / aNorm)));
            } else {
              data[i + 3] = Math.round(255 * edgeFade);
            }
          } else {
            const diff = Math.max(255 - r, 255 - g, 255 - b);
            if (diff < 10) {
              data[i + 3] = 0;
            } else if (diff < 50) {
              const alpha = ((diff - 10) / (50 - 10)) * edgeFade;
              data[i + 3] = Math.round(alpha * 255);
              const aNorm = Math.max(0.08, (diff - 10) / (50 - 10));
              data[i] = Math.min(255, Math.max(0, Math.round((r - 255 * (1 - aNorm)) / aNorm)));
              data[i + 1] = Math.min(255, Math.max(0, Math.round((g - 255 * (1 - aNorm)) / aNorm)));
              data[i + 2] = Math.min(255, Math.max(0, Math.round((b - 255 * (1 - aNorm)) / aNorm)));
            } else {
              data[i + 3] = Math.round(255 * edgeFade);
            }
          }
        }
      } else {
        // Single object flood fill / background isolation
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

        // Enqueue image borders
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
            } else {
              data[idx + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/png');
    }, { src: dataUrl, type: t.type, threshold: t.threshold });

    const base64Data = resultDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(fPath, Buffer.from(base64Data, 'base64'));
    console.log(`Processed RGBA alpha for ${t.file}: ${Buffer.byteLength(base64Data, 'base64')} bytes`);
  }

  await browser.close();
  console.log('All target assets processed with RGBA alpha transparency.');
})();
