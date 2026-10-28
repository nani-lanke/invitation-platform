const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  // 1. Test Live Preview across templates using actual css/style.css
  await page.goto('file:///' + path.resolve(__dirname, '..', 'preview.html').replace(/\\/g, '/'));
  await page.waitForTimeout(1000);

  const templatesToTest = [
    { id: 'telugu-pelli', name: 'Telugu Pelli' },
    { id: 'classic-royal', name: 'Classic Royal' },
    { id: 'tamil-thirumanam', name: 'Tamil Thirumanam' },
    { id: 'kanchipuram-silk', name: 'Kanchipuram Silk' }
  ];

  const results = [];

  for (const tpl of templatesToTest) {
    await page.evaluate((templateId) => {
      const frame = document.querySelector('[data-preview-frame]');
      IH.invitation.mount(frame, {
        eventType: 'wedding',
        template: templateId,
        brideName: 'Aishwarya',
        groomName: 'Aditya',
        additionalTitle: 'TOGETHER WITH THEIR FAMILIES',
        additionalSubtitle: 'Request the honor of your presence\nat the auspicious wedding ceremony of',
        message: 'Two lives, two hearts, joined together in friendship, united forever in love.',
        haldiEnabled: true, haldiDate: '2026-11-27', haldiTime: '10:00',
        mehndiEnabled: true, mehndiDate: '2026-11-27', mehndiTime: '15:00',
        ceremonyEnabled: true, ceremonyDate: '2026-11-28', ceremonyTime: '10:00',
        receptionEnabled: true, receptionDate: '2026-11-28', receptionTime: '19:00',
        showBlessings: true
      });
    }, tpl.id);

    await page.waitForTimeout(600);

    const metrics = await page.evaluate(() => {
      const getFs = (sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).fontSize : 'NOT_FOUND';
      };

      const card = document.querySelector('.invitation');
      const cardRect = card ? card.getBoundingClientRect() : null;
      const grid = document.querySelector('.invitation__events-grid');
      const gridRect = grid ? grid.getBoundingClientRect() : null;
      const gridCols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;

      return {
        blessingsSubheading: getFs('.invitation__blessings-subheading'),
        additionalSubtitle: getFs('.invitation__additional-subtitle'),
        message: getFs('.invitation__message'),
        eventTitle: getFs('.invitation__event-title'),
        eventWeekday: getFs('.invitation__event-weekday'),
        eventDate: getFs('.invitation__event-date'),
        eventTime: getFs('.invitation__event-time'),
        cardWidth: cardRect ? cardRect.width : 0,
        gridWidth: gridRect ? gridRect.width : 0,
        gridColumnsCount: gridCols,
        eventTitlesFit: Array.from(document.querySelectorAll('.invitation__event-title')).map(el => ({
          text: el.textContent,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          fits: el.scrollWidth <= el.clientWidth + 1
        }))
      };
    });

    results.push({ template: tpl.name, metrics });

    const cardHandle = await page.$('.invitation');
    if (cardHandle) {
      await cardHandle.screenshot({ path: path.resolve(__dirname, '..', `verify-1x4-${tpl.id}.png`) });
    }
  }

  console.log('--- LIVE PREVIEW 1x4 VERIFICATION RESULTS ---');
  let allPassed = true;

  results.forEach(r => {
    console.log(`\nTemplate: ${r.template}`);
    const m = r.metrics;
    console.log(`- Blessings Subheading: ${m.blessingsSubheading} (Expected: 18.4px / 1.15rem)`);
    console.log(`- Additional Subtitle:  ${m.additionalSubtitle} (Expected: 18.4px / 1.15rem)`);
    console.log(`- Invitation Message:   ${m.message} (Expected: 18.4px / 1.15rem)`);
    console.log(`- Event Columns Count:  ${m.gridColumnsCount} (Expected: 4 columns in 1 row)`);
    console.log(`- Event Grid Width:     ${m.gridWidth.toFixed(1)}px (Card Width: ${m.cardWidth.toFixed(1)}px)`);
    console.log(`- Event Title Font:     ${m.eventTitle} (Expected: 13px)`);
    console.log(`- Event Weekday Font:   ${m.eventWeekday} (Expected: 12px)`);
    console.log(`- Event Date Font:      ${m.eventDate} (Expected: 12px)`);
    console.log(`- Event Time Font:      ${m.eventTime} (Expected: 12px)`);

    const typographyOk = (
      m.blessingsSubheading === '18.4px' &&
      m.additionalSubtitle === '18.4px' &&
      m.message === '18.4px' &&
      m.eventTitle === '13px' &&
      m.eventWeekday === '12px' &&
      m.eventDate === '12px' &&
      m.eventTime === '12px' &&
      m.gridColumnsCount === 4
    );

    const allTitlesFit = m.eventTitlesFit.every(t => t.fits);
    console.log(`- Typography & 1x4 Grid: ${typographyOk ? 'PASSED' : 'FAILED'}`);
    console.log(`- Event titles fit check: ${allTitlesFit ? 'PASSED' : 'FAILED'}`);

    if (!typographyOk || !allTitlesFit) allPassed = false;
  });

  // 2. Test Standalone Export HTML
  console.log('\n--- STANDALONE EXPORT 1x4 VERIFICATION ---');
  await page.addScriptTag({ path: path.resolve(__dirname, '..', 'js', 'export.js') });

  const exportHtml = await page.evaluate(() => {
    const data = {
      eventType: 'wedding',
      template: 'classic-royal',
      brideName: 'Aishwarya',
      groomName: 'Aditya',
      additionalTitle: 'TOGETHER WITH THEIR FAMILIES',
      additionalSubtitle: 'Request the honor of your presence\nat the auspicious wedding ceremony of',
      message: 'Two lives, two hearts, joined together in friendship, united forever in love.',
      haldiEnabled: true, haldiDate: '2026-11-27', haldiTime: '10:00',
      mehndiEnabled: true, mehndiDate: '2026-11-27', mehndiTime: '15:00',
      ceremonyEnabled: true, ceremonyDate: '2026-11-28', ceremonyTime: '10:00',
      receptionEnabled: true, receptionDate: '2026-11-28', receptionTime: '19:00',
      showBlessings: true
    };
    return IH.exportPage.buildCardHtml(data);
  });

  const exportPage = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  await exportPage.setContent(exportHtml);
  await exportPage.waitForTimeout(600);

  const exportMetrics = await exportPage.evaluate(() => {
    const getFs = (sel) => {
      const el = document.querySelector(sel);
      return el ? window.getComputedStyle(el).fontSize : 'NOT_FOUND';
    };
    const grid = document.querySelector('.invitation__events-grid');
    return {
      blessingsSubheading: getFs('.invitation__blessings-subheading'),
      additionalSubtitle: getFs('.invitation__additional-subtitle'),
      message: getFs('.invitation__message'),
      eventTitle: getFs('.invitation__event-title'),
      eventWeekday: getFs('.invitation__event-weekday'),
      eventDate: getFs('.invitation__event-date'),
      eventTime: getFs('.invitation__event-time'),
      gridColumnsCount: grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0
    };
  });

  console.log(`- Export Blessings Subheading: ${exportMetrics.blessingsSubheading} (Expected: 18.4px)`);
  console.log(`- Export Additional Subtitle:  ${exportMetrics.additionalSubtitle} (Expected: 18.4px)`);
  console.log(`- Export Invitation Message:   ${exportMetrics.message} (Expected: 18.4px)`);
  console.log(`- Export Event Columns Count:  ${exportMetrics.gridColumnsCount} (Expected: 4)`);
  console.log(`- Export Event Title Font:     ${exportMetrics.eventTitle} (Expected: 13px)`);
  console.log(`- Export Event Weekday Font:   ${exportMetrics.eventWeekday} (Expected: 12px)`);
  console.log(`- Export Event Date Font:      ${exportMetrics.eventDate} (Expected: 12px)`);
  console.log(`- Export Event Time Font:      ${exportMetrics.eventTime} (Expected: 12px)`);

  const exportOk = (
    exportMetrics.blessingsSubheading === '18.4px' &&
    exportMetrics.additionalSubtitle === '18.4px' &&
    exportMetrics.message === '18.4px' &&
    exportMetrics.eventTitle === '13px' &&
    exportMetrics.eventWeekday === '12px' &&
    exportMetrics.eventDate === '12px' &&
    exportMetrics.eventTime === '12px' &&
    exportMetrics.gridColumnsCount === 4
  );

  console.log(`- Export Checks: ${exportOk ? 'PASSED' : 'FAILED'}`);

  await browser.close();

  if (allPassed && exportOk) {
    console.log('\n>>> ALL 1x4 CHECKS PASSED: 100% VERIFIED ACROSS PREVIEW AND EXPORT! <<<');
  } else {
    console.error('\n>>> SOME 1x4 CHECKS FAILED! <<<');
    process.exit(1);
  }
})();
