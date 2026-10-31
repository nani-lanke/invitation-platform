/* Renders every selected card twice with the project's own renderer
   (redesign-100/render.html): the original, and the redesigned working copy.
   Saves output/png/<nnn>-<slug>.png (3x) and output/before/<slug>.png and
   writes work/validation.json with per-card checks.
   Usage: node redesign-100/work/render.js [--only=a,b] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const BRIEFS = require('./briefs');
const RD = path.resolve(__dirname, '..');
const PNG = path.join(RD, 'output', 'png'), BEFORE = path.join(RD, 'output', 'before');
fs.mkdirSync(PNG, { recursive: true }); fs.mkdirSync(BEFORE, { recursive: true });
const VAL = path.join(__dirname, 'validation.json');

async function load(page, slug, rd) {
  await page.goto(pathToFileURL(path.join(RD, 'render.html')).href + '?slug=' + encodeURIComponent(slug) + (rd ? '&rd=1' : ''));
  await page.waitForFunction(() => window.RD_RENDERED === true, null, { timeout: 20000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const imgs = [...document.querySelectorAll('#host img')];
    imgs.forEach(i => { i.loading = 'eager'; });
    await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  });
  await page.waitForTimeout(400);
}

/* Visible card text, minus the live countdown digits. */
const cardText = () => {
  const a = document.querySelector('#host .invitation').cloneNode(true);
  a.querySelectorAll('[class*="countdown"]').forEach(n => n.remove());
  return a.innerText.replace(/\s+/g, ' ').trim();
};

(async () => {
  const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
  const val = fs.existsSync(VAL) ? JSON.parse(fs.readFileSync(VAL, 'utf8')) : {};
  const slugs = Object.keys(BRIEFS);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 1200 }, deviceScaleFactor: 3 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let idx = 0; idx < slugs.length; idx++) {
    const slug = slugs[idx];
    if (only.length && !only.includes(slug)) continue;
    const num = String(idx + 1).padStart(3, '0');
    const r = { slug, index: idx + 1, checks: {}, failures: [] };
    errors.length = 0;
    try {
      if (!fs.existsSync(path.join(RD, 'cards', slug, 'design.js'))) throw new Error('no design.js (artwork incomplete)');
      await load(page, slug, false);
      const before = await page.evaluate(cardText);
      await page.locator('#host .invitation').screenshot({ path: path.join(BEFORE, slug + '.png'), scale: 'css' });

      await load(page, slug, true);
      const after = await page.evaluate(cardText);
      const c = await page.evaluate(async () => {
        const d = window.RD_DESIGN, art = document.querySelector('#host .invitation');
        const out = { isWd: art.classList.contains('invitation--wd'), rdCard: art.classList.contains('rd-card') };
        const motif = art.querySelector('.wd-motif') || art.querySelector('.wd-spray');
        out.motifSrc = motif ? motif.getAttribute('src') : null;
        out.motifLoaded = !!motif && motif.complete && motif.naturalWidth > 0 && getComputedStyle(motif).display !== 'none';
        const v = art.querySelector('.wd-venue__photo img');
        out.venueSrc = v ? v.getAttribute('src') : null;
        out.venueLoaded = !!v && v.complete && v.naturalWidth > 0;
        if (v) {
          const box = v.getBoundingClientRect();
          out.venueCrop = +Math.abs(1 - (box.width / box.height) / (v.naturalWidth / v.naturalHeight)).toFixed(3);
        }
        const fr = art.querySelector('.wd-frame');
        out.frameBg = getComputedStyle(fr).backgroundImage;
        out.footerBg = getComputedStyle(fr, '::after').backgroundImage;
        // Every CSS-layer image must actually load.
        const urls = (out.frameBg + ' ' + out.footerBg).match(/url\("([^"]+)"\)/g) || [];
        out.layerUrls = urls.map(u => u.slice(5, -2));
        out.layersLoaded = (await Promise.all(out.layerUrls.map(u => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = u; })))).every(Boolean);
        // Text must not overflow the card or be clipped horizontally.
        const ar = art.getBoundingClientRect();
        out.overflow = [...art.querySelectorAll('h1,h2,h3,p,strong,span,b,small')].filter(n => {
          const b = n.getBoundingClientRect(); return b.width && (b.left < ar.left - 1 || b.right > ar.right + 1);
        }).length;
        out.width = Math.round(ar.width); out.height = Math.round(ar.height);
        const o = window.RD_ORIGINAL_DATA;
        const txt = art.innerText;
        out.textMissing = ['groomName', 'brideName', 'groomParents', 'brideParents', 'venue', 'address']
          .filter(k => o[k] && txt.indexOf(o[k]) < 0);
        out.expected = { base: d.base, images: d.images };
        return out;
      });
      const base = 'cards/' + slug + '/';
      r.checks = {
        rendererCard: c.isWd && c.rdCard,
        crestMapped: c.motifSrc === base + 'images/wedding-motifs/' + slug + '.svg' && c.motifLoaded,
        venueMapped: c.venueSrc === base + 'venue.jpg' && c.venueLoaded,
        venueCropOk: c.venueCrop === undefined ? false : c.venueCrop < 0.12,
        footerMapped: c.footerBg.indexOf(base + 'footer.jpg') >= 0,
        cornersMapped: c.expected.images.cornerTL ? c.frameBg.indexOf(base + 'corner-tl.png') >= 0 && c.frameBg.indexOf(base + 'corner-tr.png') >= 0 : 'n/a (botanical: crest used as corner sprays)',
        layersLoaded: c.layersLoaded,
        textUnchanged: before === after,
        importantTextPresent: c.textMissing.length === 0,
        noHorizontalOverflow: c.overflow === 0,
        noScriptErrors: errors.length === 0
      };
      r.metrics = { venueCrop: c.venueCrop, width: c.width, height: c.height, layerUrls: c.layerUrls };
      Object.entries(r.checks).forEach(([k, v]) => { if (v === false) r.failures.push(k); });
      if (c.textMissing.length) r.failures.push('missing text: ' + c.textMissing.join(','));
      if (errors.length) r.failures.push('script errors: ' + errors.join(' | '));
      const file = path.join(PNG, num + '-' + slug + '.png');
      await page.locator('#host .invitation').screenshot({ path: file });
      r.png = path.relative(RD, file).split(path.sep).join('/');
      r.renderedAt = new Date().toISOString();
    } catch (e) { r.failures.push('render error: ' + e.message); }
    r.ok = r.failures.length === 0;
    val[slug] = r;
    fs.writeFileSync(VAL, JSON.stringify(val, null, 1));
    console.log(num, slug, r.ok ? 'OK' : 'FAIL ' + r.failures.join('; '));
  }
  await browser.close();
})();
