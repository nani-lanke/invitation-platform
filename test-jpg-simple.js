const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-quic'] });
  const context = await browser.newContext({ bypassCSP: true, acceptDownloads: true });
  const page = await context.newPage();

  page.on('console', msg => console.log('[CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  let downloadPath = null;
  page.on('download', download => {
    console.log('[DOWNLOAD STARTED]', download.suggestedFilename());
    download.path().then(p => {
      downloadPath = p;
      const dest = path.join(__dirname, `test-long.jpg`);
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
  await page.waitForTimeout(6000);

  // Test long content
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('invitation_draft') || '{}');
    data.message = 'This is a very long message. '.repeat(50);
    data.additionalInformation = 'Additional info. '.repeat(30);
    localStorage.setItem('invitation_draft', JSON.stringify(data));
    location.reload();
  });
  await page.waitForTimeout(5000);

  const btn = await page.$('[data-draft-download-jpg]');
  console.log('[Button exists]', !!btn);
  if (btn) console.log('[Button visible]', await btn.isVisible());

  console.log('Clicking Download JPG...');
  await page.click('[data-draft-download-jpg]');

  // Wait longer for long content
  await page.waitForTimeout(60000);

  await browser.close();
  console.log('Test completed');
})();