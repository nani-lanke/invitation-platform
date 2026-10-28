const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

function createStaticServer(rootDir, port) {
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
  };
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/create.html';
    const filePath = path.join(rootDir, reqPath);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

(async () => {
  const rootDir = path.resolve(__dirname, '..');
  const port = 8878;
  const server = await createStaticServer(rootDir, port);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  await page.goto(`http://localhost:${port}/create.html`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Measure LIVE PREVIEW
  const liveData = await page.evaluate(() => {
    const liveInv = document.querySelector('.preview-stage .invitation');
    const rect = liveInv.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height,
        roundedWidth: Math.round(rect.width),
        roundedHeight: Math.round(rect.height)
    };
  });

  // 2. Perform Export using the exact logic in create.js
  const exportData = await page.evaluate(async () => {
    const liveInv = document.querySelector('.preview-stage .invitation');
    const { html2canvas } = window;

    const liveRootRect = liveInv.getBoundingClientRect();
    const width = Math.round(liveRootRect.width);
    const height = Math.round(liveRootRect.height);

    const canvas = await html2canvas(liveInv, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        scale: 2,
        width: width,
        height: height
    });

    const jpgBase64 = canvas.toDataURL('image/jpeg');
    const pngBase64 = canvas.toDataURL('image/png');

    return {
        dims: { width: canvas.width / 2, height: canvas.height / 2 }, // Since scale is 2
        rawCanvasDims: { width: canvas.width, height: canvas.height }
    };
  });

  console.log('--- DIMENSION CALIBRATION REPORT ---');
  console.log('Live Invitation Rect:', liveData);

  for (let i = 1; i <= 5; i++) {
    const exportData = await page.evaluate(async () => {
        const liveInv = document.querySelector('.preview-stage .invitation');
        const { html2canvas } = window;
        const liveRootRect = liveInv.getBoundingClientRect();
        const canvas = await html2canvas(liveInv, {
            scale: 2,
            width: Math.round(liveRootRect.width),
            height: Math.round(liveRootRect.height)
        });
        return { width: canvas.width / 2, height: canvas.height / 2 };
    });
    console.log(`Export Run ${i}:`, exportData);
  }

  await browser.close();
  server.close();
})();
