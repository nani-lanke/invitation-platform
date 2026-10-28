// Renders the live preview of the layered-PNG templates and saves a 3:4
// gallery thumbnail, so the template card matches what Preview shows.
// Usage: node scripts/generate-card-thumbs.js [slug ...]
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

/* --wedding renders every wedding template (regional + design-engine cards). */
const WEDDING = process.argv.includes('--wedding');
/* --as-preview keeps every section, so the thumbnail is the top 3:4 of the card exactly as Preview shows it. */
const AS_PREVIEW = process.argv.includes('--as-preview');
const ARGS = process.argv.slice(2).filter(a => a !== '--wedding' && a !== '--as-preview');
const SLUGS = ARGS.length ? ARGS : ['telugu-pelli', 'tamil-thirumanam'];
const ROOT = path.resolve(__dirname, '..');
const W = 420, H = 560; // 3:4, captured at 2x -> 840x1120

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 2 });
  if (WEDDING) {
    await page.goto(pathToFileURL(path.join(ROOT, 'preview.html')).href);
    await page.waitForLoadState('networkidle');
    SLUGS.length = 0;
    (await page.evaluate(() => IH.data.templates.filter(t => t.category === 'wedding').map(t => t.slug)))
      .forEach(s => { if (SLUGS.indexOf(s) < 0) SLUGS.push(s); });
  }
  for (const slug of SLUGS) {
    await page.goto(pathToFileURL(path.join(ROOT, 'preview.html')).href + '?template=' + slug);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.evaluate(({ W, H, AS_PREVIEW }) => {
      const inv = [...document.querySelectorAll('.invitation')]
        .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
      inv.id = 'thumb-target';
      if (AS_PREVIEW) {
        Object.assign(inv.style, { width: W + 'px', maxWidth: 'none', margin: '0' });
        inv.parentElement.style.cssText += ';width:' + W + 'px;height:' + H + 'px;overflow:hidden;max-width:none';
        inv.parentElement.id = 'thumb-target'; inv.removeAttribute('id');
        inv.parentElement.scrollIntoView();
        return;
      }
      // Keep only the cover content; the long body sections are dropped so
      // the top canopy and the bottom lake/elephant art both fit in 3:4.
      const keep = ['invitation__backdrop', 'invitation__additional-subtitle',
        'invitation__couple', 'invitation__when-unified',
        // wedding design engine cards (js/wedding-designs.js)
        'wd-frame', 'wd-crest', 'wd-monogram', 'invitation__additional-title', 'wd-lead', 'wd-bday-title'];
      [...inv.children].forEach(c => {
        if (!keep.some(k => c.classList.contains(k))) c.style.display = 'none';
      });
      Object.assign(inv.style, { width: W + 'px', height: H + 'px', minHeight: '0', maxWidth: 'none', margin: '0', overflow: 'hidden' });
      // Design-engine cards: keep the first section heading and centre the cover vertically.
      if (inv.classList.contains('invitation--wd')) {
        const h = inv.querySelector('.wd-heading'); if (h) h.style.display = '';
        // A bottom floral/balloon cluster would sit on the date: leave the date out of the thumbnail.
        const when = inv.querySelector(':scope > .invitation__when-unified');
        if (when && inv.querySelector('.wd-la--cluster')) when.style.display = 'none';
        const kids = [...inv.children].filter(c => c.style.display !== 'none' && !c.classList.contains('wd-frame'));
        const top = kids[0].getBoundingClientRect().top, bottom = kids[kids.length - 1].getBoundingClientRect().bottom;
        const pad = parseFloat(getComputedStyle(inv).paddingTop), spare = H - (bottom - top) - pad * 2;
        if (spare > 0) inv.style.paddingTop = (pad + spare / 2) + 'px';
      }
      inv.scrollIntoView();
    }, { W, H, AS_PREVIEW });
    await page.waitForTimeout(800);
    // Redesign-collection cards (rd-<base>) keep their thumbnail beside their own art.
    const out = slug.startsWith('rd-')
      ? path.join(ROOT, 'images', 'redesign-100', slug.slice(3), 'thumb.jpg')
      : path.join(ROOT, 'images', 'templates', slug + '.jpg');
    await page.locator('#thumb-target').screenshot({ path: out, type: 'jpeg', quality: 88 });
    console.log('saved', path.relative(ROOT, out));
  }
  await browser.close();
})();
