const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.setViewportSize({ width: 1200, height: 800 });
  const filePath = 'file:///' + path.resolve(__dirname, 'create.html').replace(/\\/g, '/');
  await page.goto(filePath);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const btn = await page.$('[data-draft-download-jpg]');
  if (btn) {
    // Check initial text
    const initialText = await btn.$eval('.btn-text', el => el.textContent);
    console.log('Initial text:', initialText);

    // Click and check immediately
    await btn.click();

    // Check after small delay
    await page.waitForTimeout(50);
    const textAfter50 = await btn.$eval('.btn-text', el => el.textContent);
    console.log('Text after 50ms:', textAfter50);

    await page.waitForTimeout(200);
    const textAfter200 = await btn.$eval('.btn-text', el => el.textContent);
    console.log('Text after 200ms:', textAfter200);

    await page.waitForTimeout(500);
    const textAfter500 = await btn.$eval('.btn-text', el => el.textContent);
    console.log('Text after 500ms:', textAfter500);
  }

  await browser.close();
})();