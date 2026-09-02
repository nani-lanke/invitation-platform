const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'test-debug');
if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR);

async function runTest() {
  const browser = await chromium.launch({ headless: false }); // Show browser for debugging
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true
  });
  const page = await context.newPage();

  // Collect console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[create]') || text.includes('html2canvas') || text.includes('color') || text.includes('iframe') || text.includes('error') || text.includes('Error')) {
      console.log(`[CONSOLE ${msg.type()}] ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // Navigate to create page
  console.log('Navigating to create.html...');
  await page.goto('file://' + path.join(__dirname, 'create.html'), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Wait for stepper to be ready
  await page.waitForSelector('[data-step-btn="1"]', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Quick fill - just pick event type and continue
  await page.waitForSelector('[data-event-tiles] button', { timeout: 15000 });
  await page.click('[data-event-tiles] button:first-child');
  await page.waitForTimeout(500);
  await page.click('[data-step-next]');
  await page.waitForTimeout(500);

  // Step 2 - fill required fields
  await page.waitForSelector('#f-title', { timeout: 5000 });
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
  await page.waitForSelector('[data-template-picker] button', { timeout: 5000 });
  await page.click('[data-template-picker] button:first-child');
  await page.waitForTimeout(500);
  await page.click('[data-step-next]');
  await page.waitForTimeout(1000);

  // Now on Step 5 - preview should be visible
  console.log('=== Testing Download JPG on MOBILE tab (should work) ===');
  await page.waitForSelector('[data-draft-download-jpg]', { timeout: 5000 });

  // Click mobile tab to ensure we're on mobile
  await page.click('[data-preview-device="mobile"]');
  await page.waitForTimeout(500);

  // Click download
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.click('[data-draft-download-jpg]');
  const download = await downloadPromise;
  const downloadPath = path.join(TEST_DIR, 'test-mobile.jpg');
  await download.saveAs(downloadPath);
  console.log(`[DOWNLOAD COMPLETE] Mobile tab: ${downloadPath} (${fs.statSync(downloadPath).size} bytes)`);

  await page.waitForTimeout(2000);

  // Test 2: Switch to Desktop tab
  console.log('\n=== Testing Download JPG on DESKTOP tab ===');
  await page.click('[data-preview-device="desktop"]');
  await page.waitForTimeout(1000);

  const downloadPromise2 = page.waitForEvent('download', { timeout: 30000 });
  await page.click('[data-draft-download-jpg]');
  try {
    const download2 = await downloadPromise2;
    const downloadPath2 = path.join(TEST_DIR, 'test-desktop.jpg');
    await download2.saveAs(downloadPath2);
    console.log(`[DOWNLOAD COMPLETE] Desktop tab: ${downloadPath2} (${fs.statSync(downloadPath2).size} bytes)`);
  } catch (e) {
    console.log('[DOWNLOAD FAILED] Desktop tab:', e.message);
  }

  await page.waitForTimeout(2000);

  // Test 3: Switch to Hosted tab
  console.log('\n=== Testing Download JPG on HOSTED tab ===');
  await page.click('[data-preview-device="hosted"]');
  await page.waitForTimeout(2000);

  const downloadPromise3 = page.waitForEvent('download', { timeout: 30000 });
  await page.click('[data-draft-download-jpg]');
  try {
    const download3 = await downloadPromise3;
    const downloadPath3 = path.join(TEST_DIR, 'test-hosted.jpg');
    await download3.saveAs(downloadPath3);
    console.log(`[DOWNLOAD COMPLETE] Hosted tab: ${downloadPath3} (${fs.statSync(downloadPath3).size} bytes)`);
  } catch (e) {
    console.log('[DOWNLOAD FAILED] Hosted tab:', e.message);
  }

  await page.waitForTimeout(2000);
  await browser.close();
  console.log('\n=== ALL TESTS COMPLETE ===');
}

runTest().catch(console.error);