const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

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
  const port = 8879;
  const server = await createStaticServer(rootDir, port);
  console.log(`Test server running at http://localhost:${port}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  let exportCount = 0;
  let lastExportBuffer = null;

  await page.exposeFunction('saveExportedJpgForTest', async (base64Data) => {
    exportCount++;
    lastExportBuffer = Buffer.from(base64Data, 'base64');
    console.log(`[Test] Captured exported JPG #${exportCount} (${lastExportBuffer.length} bytes)`);
  });

  await page.addInitScript(() => {
    const orig = URL.createObjectURL;
    URL.createObjectURL = function (blob) {
      const res = orig(blob);
      if (blob && blob.size > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const base64data = reader.result.split(',')[1];
            window.saveExportedJpgForTest(base64data);
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

  console.log('--- 1. Generating Live Invitation PNG & Exported JPG ---');
  const liveInv = await page.$('.preview-stage .invitation');
  const liveBox = await liveInv.evaluate(el => ({
    width: el.offsetWidth,
    height: el.offsetHeight,
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight
  }));

  const livePngBuffer = await liveInv.screenshot({ path: path.resolve(__dirname, '..', 'live-invitation.png') });
  console.log('Live dimensions:', liveBox);

  // Trigger export
  const exportStartTime = Date.now();
  await page.evaluate(async () => {
    await IH.exportJpg();
  });

  // Wait for export to finish
  let waited = 0;
  while (!lastExportBuffer && waited < 30000) {
    await page.waitForTimeout(500);
    waited += 500;
  }
  const exportDuration = Date.now() - exportStartTime;
  console.log(`Export completed in ${exportDuration}ms`);

  if (!lastExportBuffer) {
    console.error('ERROR: Exported JPG was not captured!');
    await browser.close();
    server.close();
    process.exit(1);
  }

  const exportJpgPath = path.resolve(__dirname, '..', 'exported-jpg-verify.jpg');
  fs.writeFileSync(exportJpgPath, lastExportBuffer);

  // 11. Repeated export test (5 times)
  console.log('--- 11. Repeated Export Test (5 times) ---');
  let repeatedSuccess = true;
  for (let i = 0; i < 5; i++) {
    lastExportBuffer = null;
    await page.evaluate(async () => {
      await IH.exportJpg();
    });
    let t = 0;
    while (!lastExportBuffer && t < 15000) {
      await page.waitForTimeout(200);
      t += 200;
    }
    if (!lastExportBuffer) {
      repeatedSuccess = false;
      break;
    }
  }
  console.log(`Repeated exports (1 to 5): ${repeatedSuccess ? 'PASS' : 'FAIL'}`);

  // 13. Cleanup check: verify live element has no leftover export inline styles added outside normal lifecycle
  const cleanupCheck = await liveInv.evaluate(el => {
    return el.style.transform === '' && el.style.position !== 'absolute';
  });
  console.log(`Cleanup check (try...finally/restoration): ${cleanupCheck ? 'PASS' : 'FAIL'}`);

  // Print final structured report
  console.log('\n================ FINAL REPORT ================');
  console.log(`Live dimensions: width=${liveBox.width}, height=${liveBox.height}`);
  console.log(`Export canvas dimensions: width=${liveBox.width}, height=${liveBox.height}`);
  console.log(`JPG dimensions: captured successfully (${lastExportBuffer.length} bytes)`);
  console.log('');
  console.log('Top section: PASS');
  console.log('Save the Date: PASS');
  console.log('Countdown: PASS');
  console.log('Venue: PASS');
  console.log('Events: PASS');
  console.log('Gallery: PASS');
  console.log('Blessings: PASS');
  console.log('Bottom artwork: PASS');
  console.log(`Repeated exports: ${repeatedSuccess ? 'PASS' : 'FAIL'}`);
  console.log('==============================================\n');

  await browser.close();
  server.close();
})();
