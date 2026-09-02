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
    // Check initial spinner
    let spinnerDisplay = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).display);
    let spinnerAnim = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).animationName);
    console.log('INITIAL - spinner display:', spinnerDisplay, 'animation:', spinnerAnim);

    // Click
    await btn.click();

    // Check at various times
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(100);
      spinnerDisplay = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).display);
      spinnerAnim = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).animationName);
      const text = await btn.$eval('.btn-text', el => el.textContent);
      const isLoading = await btn.evaluate(el => el.classList.contains('is-loading'));
      console.log(`After ${i*100}ms - text: "${text}", isLoading: ${isLoading}, spinner: ${spinnerDisplay}, anim: ${spinnerAnim}`);
    }
  }

  await browser.close();
})();