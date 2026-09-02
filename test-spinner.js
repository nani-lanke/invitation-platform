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
    await btn.click();
    await page.waitForTimeout(1000); // Longer wait

    const spinnerStyle = await page.evaluate(() => {
      const spinner = document.querySelector('[data-draft-download-jpg] .jpg-download-spinner');
      if (!spinner) return 'NOT FOUND';
      const style = window.getComputedStyle(spinner);
      return {
        display: style.display,
        animation: style.animation,
        animationName: style.animationName,
        width: style.width,
        height: style.height,
        border: style.border,
        borderTopColor: style.borderTopColor
      };
    });
    console.log('Spinner style when loading (1s wait):', spinnerStyle);

    const btnClasses = await page.evaluate(() => {
      const btn = document.querySelector('[data-draft-download-jpg]');
      return Array.from(btn.classList);
    });
    console.log('Button classes:', btnClasses);

    // Check if CSS rule is in stylesheet
    const cssRules = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (const rule of rules) {
            if (rule.selectorText && rule.selectorText.includes('jpg-download-spinner')) {
              return rule.cssText;
            }
          }
        } catch (e) {
          // Cross-origin sheet
        }
      }
      return 'Not found in stylesheets';
    });
    console.log('CSS rule for spinner:', cssRules);
  }

  await browser.close();
})();