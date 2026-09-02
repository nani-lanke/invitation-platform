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
    // Click and check
    await btn.click();
    await page.waitForTimeout(200);

    // Check computed styles directly
    const styles = await page.evaluate(() => {
      const btn = document.querySelector('[data-draft-download-jpg]');
      const spinner = btn.querySelector('.jpg-download-spinner');
      const btnText = btn.querySelector('.btn-text');
      const icon = btn.querySelector('[data-icon]');

      const spinnerStyle = window.getComputedStyle(spinner);
      const btnTextStyle = window.getComputedStyle(btnText);
      const iconStyle = window.getComputedStyle(icon);
      const btnStyle = window.getComputedStyle(btn);

      // Check if animation is in stylesheet
      let animationInSheet = false;
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (const rule of rules) {
            if (rule.selectorText && rule.selectorText.includes('jpg-download-spinner')) {
              console.log('Found rule:', rule.cssText);
              animationInSheet = true;
            }
            if (rule.name === 'jpg-download-spin') {
              console.log('Found keyframe:', rule.name);
            }
          }
        } catch (e) {
          // Cross-origin
        }
      }

      return {
        btnClasses: Array.from(btn.classList),
        spinner: {
          display: spinnerStyle.display,
          animationName: spinnerStyle.animationName,
          animationDuration: spinnerStyle.animationDuration,
          animationIterationCount: spinnerStyle.animationIterationCount,
          animationTimingFunction: spinnerStyle.animationTimingFunction,
          width: spinnerStyle.width,
          height: spinnerStyle.height,
          border: spinnerStyle.border,
          borderTopColor: spinnerStyle.borderTopColor
        },
        btnText: {
          display: btnTextStyle.display,
          text: btnText.textContent
        },
        icon: {
          display: iconStyle.display
        },
        btn: {
          cursor: btnStyle.cursor,
          pointerEvents: btnStyle.pointerEvents
        },
        animationInSheet
      };
    });
    console.log('Styles:', JSON.stringify(styles, null, 2));
  }

  await browser.close();
})();