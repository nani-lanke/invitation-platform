const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-quic', '--disable-web-security']
  });
  const context = await browser.newContext({
    bypassCSP: true,
    acceptDownloads: true
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('[CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  let downloadPath = null;
  page.on('download', download => {
    console.log('[DOWNLOAD STARTED]', download.suggestedFilename());
    download.path().then(p => {
      downloadPath = p;
      const dest = path.join(__dirname, `test-visible.jpg`);
      fs.copyFileSync(p, dest);
      console.log('[DOWNLOAD COPIED TO]', dest);
      const stats = fs.statSync(dest);
      console.log('[FILE SIZE]', stats.size, 'bytes');
      try {
        const { execSync } = require('child_process');
        const out = execSync(`file "${dest}"`).toString();
        console.log('[FILE TYPE]', out.trim());
      } catch (e) {}
    }).catch(e => console.log('[DOWNLOAD PATH ERR]', e.message));
  });

  await page.goto('http://localhost:8080/create.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);

  const btn = await page.$('[data-draft-download-jpg]');
  console.log('[Button exists]', !!btn);
  if (btn) {
    const visible = await btn.isVisible();
    console.log('[Button visible]', visible);
    const box = await btn.boundingBox();
    console.log('[Button box]', box);
  }

  console.log('Clicking Download JPG...');
  await page.click('[data-draft-download-jpg]');

  // Wait longer to observe
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('Test completed');
})();