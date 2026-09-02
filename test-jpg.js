const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDownloadJPG(name, setupFn) {
  const browser = await chromium.launch({ headless: true, args: ['--disable-quic'] });
  const context = await browser.newContext({ acceptDownloads: true });
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
      // Use file command to verify
      const { execSync } = require('child_process');
      try {
        const out = execSync(`file "${dest}"`).toString();
        console.log('[FILE TYPE]', out.trim());
      } catch (e) {}
    }).catch(e => console.log('[DOWNLOAD PATH ERR]', e.message));
  });

  await page.goto('http://localhost:64610/create.html', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);

  // Quick fill the wizard to reach step 5
  // Step 1 - pick event type
  await page.waitForSelector('[data-event-tiles] input[type="radio"]', { timeout: 15000 });
  await page.click('[data-event-tiles] input[type="radio"]:first-child');
  await page.waitForTimeout(500);
  await page.click('[data-step-next]');
  await page.waitForTimeout(500);

  // Step 2 - fill required fields
  await page.waitForSelector('#f-title', { timeout: 10000 });
  await page.fill('#f-title', 'Test Wedding');
  await page.fill('#f-groom', 'John');
  await page.fill('#f-bride', 'Jane');
  await page.fill('#f-date', '2026-12-25');
  await page.fill('#f-email', 'test@example.com');
  await page.click('[data-step-next]');
  await page.waitForTimeout(500);

  // Step 3 - skip media
  await page.click('[data-step-next]');
  await page.waitForTimeout(500);

  // Step 4 - pick template
  await page.waitForSelector('[data-template-picker] input[type="radio"]', { timeout: 10000 });
  await page.click('[data-template-picker] input[type="radio"]:first-child');
  await page.waitForTimeout(500);
  await page.click('[data-step-next]');
  await page.waitForTimeout(2000);

  // Now on Step 5 - preview should be visible
  await page.waitForSelector('[data-draft-download-jpg]', { timeout: 30000 });

  if (setupFn) await setupFn(page);

  const btn = await page.$('[data-draft-download-jpg]');
  console.log('[Button exists]', !!btn);
  if (btn) console.log('[Button visible]', await btn.isVisible());

  console.log('Clicking Download JPG...');
  await page.click('[data-draft-download-jpg]');
  await page.waitForTimeout(60000);
  await browser.close();

  return downloadPath;
}

(async () => {
  // Test 1: Default (with photos from localStorage)
  console.log('\n=== TEST 1: Default with photos ===');
  await testDownloadJPG('default', async (page) => {
    // Page already has data from localStorage
  });

  // Test 2: Without photos
  console.log('\n=== TEST 2: Without photos ===');
  await testDownloadJPG('no-photo', async (page) => {
    // Clear photo field if possible
    await page.evaluate(() => {
      localStorage.removeItem('invitation_draft');
      location.reload();
    });
    await page.waitForTimeout(3000);
  });

  // Test 3: Long content (scrollable)
  console.log('\n=== TEST 3: Long content ===');
  await testDownloadJPG('long', async (page) => {
    await page.evaluate(() => {
      // Inject long content
      const data = JSON.parse(localStorage.getItem('invitation_draft') || '{}');
      data.message = 'This is a very long message. '.repeat(50);
      data.additionalInformation = 'Additional info. '.repeat(30);
      localStorage.setItem('invitation_draft', JSON.stringify(data));
      location.reload();
    });
    await page.waitForTimeout(3000);
  });

  // Test 4: Mobile preview tab selected
  console.log('\n=== TEST 4: Mobile preview tab ===');
  await testDownloadJPG('mobile', async (page) => {
    await page.click('[data-preview-device="mobile"]');
    await page.waitForTimeout(1000);
  });

  // Test 5: Desktop preview tab selected (should still capture mobile)
  console.log('\n=== TEST 5: Desktop preview tab ===');
  await testDownloadJPG('desktop', async (page) => {
    await page.click('[data-preview-device="desktop"]');
    await page.waitForTimeout(1000);
  });

  // Test 6: Hosted preview tab selected
  console.log('\n=== TEST 6: Hosted preview tab ===');
  await testDownloadJPG('hosted', async (page) => {
    await page.click('[data-preview-device="hosted"]');
    await page.waitForTimeout(1000);
  });

  console.log('\n=== ALL TESTS COMPLETE ===');
})();