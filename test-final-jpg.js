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

  console.log('=== COMPREHENSIVE JPG DOWNLOAD TEST ===\n');

  // TEST 1: Initial state
  console.log('--- TEST 1: Initial Page Load ---');
  const btn = await page.$('[data-draft-download-jpg]');
  if (btn) {
    const hasIsLoading = await btn.evaluate(el => el.classList.contains('is-loading'));
    const isDisabled = await btn.evaluate(el => el.disabled);
    const btnText = await btn.$eval('.btn-text', el => el.textContent);
    const spinnerDisplay = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).display);
    const icon = await btn.$('i[data-icon]');
    const iconDisplay = icon ? await icon.evaluate(el => window.getComputedStyle(el).display) : 'NOT_FOUND';

    console.log('Button text:', btnText);
    console.log('is-loading class:', hasIsLoading);
    console.log('disabled:', isDisabled);
    console.log('spinner display:', spinnerDisplay);
    console.log('icon display:', iconDisplay);

    const test1Pass = btnText === 'Download JPG' && !hasIsLoading && !isDisabled && spinnerDisplay === 'none' && iconDisplay !== 'none';
    console.log('TEST 1:', test1Pass ? '✅ PASS' : '❌ FAIL');
  }

  // TEST 2: Click and immediate loading state
  console.log('\n--- TEST 2: Click Download (Loading State) ---');
  if (btn) {
    await btn.click();
    await page.waitForTimeout(200); // Give time for state to apply

    const hasIsLoading2 = await btn.evaluate(el => el.classList.contains('is-loading'));
    const isDisabled2 = await btn.evaluate(el => el.disabled);
    const btnText2 = await btn.$eval('.btn-text', el => el.textContent);
    const spinnerDisplay2 = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).display);
    const icon2 = await btn.$('i[data-icon]');
    const iconDisplay2 = icon2 ? await icon2.evaluate(el => window.getComputedStyle(el).display) : 'NOT_FOUND';

    console.log('Button text:', btnText2);
    console.log('is-loading class:', hasIsLoading2);
    console.log('disabled:', isDisabled2);
    console.log('spinner display:', spinnerDisplay2);
    console.log('icon display:', iconDisplay2);

    // Check animation is running
    const spinnerAnim = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).animationName);
    console.log('spinner animation:', spinnerAnim);

    const test2Pass = btnText2 === 'Downloading JPG...' && hasIsLoading2 && isDisabled2 && spinnerDisplay2 !== 'none' && iconDisplay2 === 'none' && spinnerAnim === 'jpg-download-spin';
    console.log('TEST 2:', test2Pass ? '✅ PASS' : '❌ FAIL');
  }

  // TEST 3: Wait for download to fail/complete and check restoration
  console.log('\n--- TEST 3: After Download Completes/Fails ---');
  await page.waitForTimeout(8000); // Wait for download attempt to complete

  if (btn) {
    const hasIsLoading3 = await btn.evaluate(el => el.classList.contains('is-loading'));
    const isDisabled3 = await btn.evaluate(el => el.disabled);
    const btnText3 = await btn.$eval('.btn-text', el => el.textContent);
    const spinnerDisplay3 = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).display);
    const icon3 = await btn.$('i[data-icon]');
    const iconDisplay3 = icon3 ? await icon3.evaluate(el => window.getComputedStyle(el).display) : 'NOT_FOUND';

    console.log('Button text:', btnText3);
    console.log('is-loading class:', hasIsLoading3);
    console.log('disabled:', isDisabled3);
    console.log('spinner display:', spinnerDisplay3);
    console.log('icon display:', iconDisplay3);

    const test3Pass = btnText3 === 'Download JPG' && !hasIsLoading3 && !isDisabled3 && spinnerDisplay3 === 'none' && iconDisplay3 !== 'none';
    console.log('TEST 3:', test3Pass ? '✅ PASS' : '❌ FAIL');
  }

  // TEST 4: Second download
  console.log('\n--- TEST 4: Second Download ---');
  if (btn) {
    await btn.click();
    await page.waitForTimeout(200);

    const hasIsLoading4 = await btn.evaluate(el => el.classList.contains('is-loading'));
    const isDisabled4 = await btn.evaluate(el => el.disabled);
    const btnText4 = await btn.$eval('.btn-text', el => el.textContent);
    const spinnerDisplay4 = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).display);
    const icon4 = await btn.$('i[data-icon]');
    const iconDisplay4 = icon4 ? await icon4.evaluate(el => window.getComputedStyle(el).display) : 'NOT_FOUND';

    console.log('Button text:', btnText4);
    console.log('is-loading class:', hasIsLoading4);
    console.log('disabled:', isDisabled4);
    console.log('spinner display:', spinnerDisplay4);
    console.log('icon display:', iconDisplay4);

    const spinnerAnim4 = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).animationName);
    console.log('spinner animation:', spinnerAnim4);

    const test4Pass = btnText4 === 'Downloading JPG...' && hasIsLoading4 && isDisabled4 && spinnerDisplay4 !== 'none' && iconDisplay4 === 'none' && spinnerAnim4 === 'jpg-download-spin';
    console.log('TEST 4:', test4Pass ? '✅ PASS' : '❌ FAIL');

    // Wait for second download to complete
    console.log('\nWaiting for second download to complete...');
    await page.waitForTimeout(8000);

    const hasIsLoading5 = await btn.evaluate(el => el.classList.contains('is-loading'));
    const btnText5 = await btn.$eval('.btn-text', el => el.textContent);
    const spinnerDisplay5 = await btn.$eval('.jpg-download-spinner', el => window.getComputedStyle(el).display);
    console.log('After 2nd download - is-loading:', hasIsLoading5, 'text:', btnText5, 'spinner:', spinnerDisplay5);
    const test5Pass = btnText5 === 'Download JPG' && !hasIsLoading5 && spinnerDisplay5 === 'none';
    console.log('TEST 5 (restore after 2nd):', test5Pass ? '✅ PASS' : '❌ FAIL');
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
  await browser.close();
})();