const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..', '..');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(pathToFileURL(path.join(ROOT, 'preview.html')).href); await p.waitForLoadState('networkidle');
  const list = await p.evaluate(() => IH.data.templates.filter(t => t.category === 'wedding').map(t => {
    const s = IH.weddingDesigns.spec(t.slug);
    return { slug: t.slug, name: t.name, tier: t.tier, motif: t.motif, blurb: t.blurb, colors: t.colors, keywords: t.keywords, spec: s };
  }));
  fs.writeFileSync(path.join(__dirname, 'inventory.json'), JSON.stringify(list, null, 1));
  console.log(list.length, new Set(list.map(t => t.slug)).size);
  await b.close();
})();
