const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDownloadJPG(name, setupFn) {
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
      const dest = path.join(__dirname, `test-${name}.jpg`);
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

  if (setupFn) await setupFn(page);

  const btn = await page.$('[data-draft-download-jpg]');
  console.log('[Button exists]', !!btn);
  if (btn) console.log('[Button visible]', await btn.isVisible());

  console.log('Clicking Download JPG...');
  await page.click('[data-draft-download-jpg]');

  // Wait for download
  await page.waitForTimeout(30000);

  await browser.close();

  return downloadPath;
}

(async () => {
  // Test 1: Default (with photos from localStorage) - Mobile tab
  console.log('\n=== TEST 1: Default with photos (Mobile tab) ===');
  await testDownloadJPG('1-mobile', async (page) => {
    await page.click('[data-preview-device="mobile"]');
    await page.waitForTimeout(1000);
  });

  // Test 2: Without photos
  console.log('\n=== TEST 2: Without photos ===');
  await testDownloadJPG('2-no-photo', async (page) => {
    await page.evaluate(() => {
      localStorage.removeItem('invitation_draft');
      location.reload();
    });
    await page.waitForTimeout(5000);
  });

  // Test 3: Long content
  console.log('\n=== TEST 3: Long content ===');
  await testDownloadJPG('3-long', async (page) => {
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('invitation_draft') || '{}');
      data.message = 'This is a very long message. '.repeat(50);
      data.additionalInformation = 'Additional info. '.repeat(30);
      localStorage.setItem('invitation_draft', JSON.stringify(data));
      location.reload();
    });
    await page.waitForTimeout(5000);
  });

  // Test 4: Desktop tab selected
  console.log('\n=== TEST 4: Desktop tab selected ===');
  await testDownloadJPG('4-desktop', async (page) => {
    await page.click('[data-preview-device="desktop"]');
    await page.waitForTimeout(1000);
  });

  // Test 5: Hosted tab selected
  console.log('\n=== TEST 5: Hosted tab selected ===');
  await testDownloadJPG('5-hosted', async (page) => {
    await page.click('[data-preview-device="hosted"]');
    await page.waitForTimeout(2000);
  });

  console.log('\n=== ALL TESTS COMPLETE ===');
})();