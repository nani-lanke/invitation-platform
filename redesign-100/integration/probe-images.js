/* Probes image loading on the gallery collection, preview modal, preview page and categories page. */
const { chromium } = require('playwright');
const path = require('path'), { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..', '..');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  for (const [label, base] of [['http', 'http://127.0.0.1:8099/'], ['file', pathToFileURL(ROOT).href + '/']]) {
    const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
    const failed = []; const errs = [];
    p.on('requestfailed', r => failed.push(r.url().replace(base, '')));
    p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().replace(base, '')); });
    p.on('pageerror', e => errs.push(e.message));
    const imgStats = sel => p.evaluate(sel => { const im = [...document.querySelectorAll(sel)]; im.forEach(i => i.loading = 'eager');
      return { total: im.length, broken: im.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')).slice(0, 5) }; }, sel);
    await p.goto(base + 'templates.html?collection=redesign-100'); await p.waitForTimeout(3000);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(2000);
    console.log(label, 'gallery collection imgs', JSON.stringify(await imgStats('[data-redesign-collection] img')));
    console.log(label, 'gallery main imgs', JSON.stringify(await imgStats('[data-template-grid] img')));
    // preview modal from a collection card
    await p.evaluate(() => { const b = document.querySelector('[data-redesign-collection] [data-preview]'); if (b) { b.scrollIntoView(); b.click(); } });
    await p.waitForTimeout(2500);
    console.log(label, 'modal imgs', JSON.stringify(await imgStats('#template-preview-modal img')));
    await p.screenshot({ path: path.join(SP, 'probe-' + label + '-modal.png') });
    await p.goto(base + 'preview.html?template=rd-kalasam-blessing'); await p.waitForTimeout(3000);
    console.log(label, 'preview page imgs', JSON.stringify(await imgStats('.invitation img')));
    await p.screenshot({ path: path.join(SP, 'probe-' + label + '-preview.png'), fullPage: false });
    await p.goto(base + 'categories.html'); await p.waitForTimeout(3000);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1500);
    console.log(label, 'categories imgs', JSON.stringify(await imgStats('main img')));
    await p.screenshot({ path: path.join(SP, 'probe-' + label + '-categories.png'), fullPage: false });
    await p.goto(base + 'templates.html?category=wedding'); await p.waitForTimeout(3000);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1500);
    console.log(label, 'wedding category imgs', JSON.stringify(await imgStats('[data-template-grid] img')));
    console.log(label, 'failed requests', JSON.stringify([...new Set(failed)].slice(0, 15)), 'errors', JSON.stringify(errs.slice(0, 5)));
    await p.close();
  }
  await b.close();
})();
