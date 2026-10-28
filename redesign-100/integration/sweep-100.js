/* Opens every one of the 100 redesigned cards on the preview page and checks
   that each image on the card loads from images/redesign-100/<slug>/.
   Usage: node redesign-100/integration/sweep-100.js [baseUrl] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8099/';
const DATA = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'js', 'redesign-collection-data.js'), 'utf8').replace(/^[\s\S]*?DATA = /, '').replace(/;\s*$/, ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  const bad = []; let ok = 0;
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  for (const c of DATA.cards) {
    await p.goto(BASE + 'preview.html?template=' + c.slug); await p.waitForLoadState('networkidle');
    const r = await p.evaluate(async base => {
      const inv = [...document.querySelectorAll('.invitation')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
      const imgs = [...inv.querySelectorAll('img')]; imgs.forEach(i => { i.loading = 'eager'; });
      await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(res => { i.onload = i.onerror = res; setTimeout(res, 8000); })));
      const rd = imgs.filter(i => (i.getAttribute('src') || '').includes('images/redesign-100/' + base + '/'));
      return { rdCard: inv.classList.contains('rd-card'), rdImgs: rd.length, broken: imgs.filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src')) };
    }, c.base);
    const expected = c.corners ? 5 : 3; // crest(+sprays), venue, footer, 2 corners
    if (r.rdCard && r.rdImgs >= expected && !r.broken.length) ok++; else bad.push(c.slug + ' ' + JSON.stringify(r));
  }
  console.log('cards ok', ok, '/', DATA.cards.length, 'problems', bad.length); bad.slice(0, 10).forEach(x => console.log(' ', x));
  await b.close();
})();
