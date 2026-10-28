const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Lightweight static file server for local testing
function createStaticServer(rootDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/create.html';
    const filePath = path.join(rootDir, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  const rootDir = path.resolve(__dirname, '..');
  const port = 8877;
  const server = await createStaticServer(rootDir, port);
  console.log(`Local test server running at http://localhost:${port}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.exposeFunction('saveExportedJpg', async (base64Data) => {
    const buffer = Buffer.from(base64Data, 'base64');
    const outPath = path.resolve(__dirname, '..', 'exported-jpg-verify.jpg');
    fs.writeFileSync(outPath, buffer);
    console.log('Saved exported-jpg-verify.jpg successfully (' + buffer.length + ' bytes)');
  });

  await page.addInitScript(() => {
    const orig = URL.createObjectURL;
    URL.createObjectURL = function (blob) {
      const res = orig(blob);
      console.log('[InitScript] URL.createObjectURL called, size:', blob ? blob.size : 0);
      if (blob && blob.size > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const base64data = reader.result.split(',')[1];
            window.saveExportedJpg(base64data);
          }
        };
        reader.readAsDataURL(blob);
      }
      return res;
    };
  });

  await page.goto(`http://localhost:${port}/create.html`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take live preview screenshot
  const liveInv = await page.$('.preview-stage .invitation');
  if (liveInv) {
    await liveInv.screenshot({ path: path.resolve(__dirname, '..', 'live-preview-screenshot.png') });
    console.log('Saved live-preview-screenshot.png');
  }

  const downloadBtn = page.locator('[data-draft-download-jpg]');
  await downloadBtn.click();

  await page.waitForTimeout(45000);
  await browser.close();
  server.close();
})();
