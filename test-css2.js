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
    // Check initial DOM
    const initialDOM = await page.evaluate(() => {
      const btn = document.querySelector('[data-draft-download-jpg]');
      return {
        btnInnerHTML: btn.innerHTML,
        spinner: btn.querySelector('.jpg-download-spinner') ? 'FOUND' : 'NOT FOUND',
        btnText: btn.querySelector('.btn-text') ? 'FOUND' : 'NOT FOUND',
        icon: btn.querySelector('[data-icon]') ? 'FOUND' : 'NOT FOUND',
      };
    });
    console.log('INITIAL DOM:', initialDOM);

    // Click and check
    await btn.click();
    await page.waitForTimeout(200);

    const afterClickDOM = await page.evaluate(() => {
      const btn = document.querySelector('[data-draft-download-jpg]');
      const spinner = btn.querySelector('.jpg-download-spinner');
      const btnText = btn.querySelector('.btn-text');
      const icon = btn.querySelector('[data-icon]');
      return {
        btnClasses: Array.from(btn.classList),
        spinner: spinner ? 'FOUND' : 'NOT FOUND',
        spinnerDisplay: spinner ? window.getComputedStyle(spinner).display : 'N/A',
        spinnerAnimationName: spinner ? window.getComputedStyle(spinner).animationName : 'N/A',
        btnText: btnText ? 'FOUND' : 'NOT FOUND',
        btnTextDisplay: btnText ? window.getComputedStyle(btnText).display : 'N/A',
        btnTextContent: btnText ? btnText.textContent : 'N/A',
        icon: icon ? 'FOUND' : 'NOT FOUND',
        iconDisplay: icon ? window.getComputedStyle(icon).display : 'N/A',
      };
    });
    console.log('AFTER CLICK DOM:', afterClickDOM);
  }

  await browser.close();
})();