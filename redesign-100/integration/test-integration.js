/* Live-site tests for the optional Redesigned Collection.
   Needs the site served at http://127.0.0.1:8099 (python -m http.server 8099).
   Usage: node redesign-100/integration/test-integration.js
   Writes results.json and screenshots next to this file. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8099/';
const OUT = __dirname;
const SHOTS = path.join(OUT, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const REPS = { regional: 'kalasam-blessing', rituals: 'hindu-vivah', royal: 'maharaja-palace', 'south-asian': 'sri-lankan-poruwa', botanical: 'lotus-garden', botanicalLayout: 'kerala-mangalyam' };
const ORIGINALS = ['telugu-pelli', 'tamil-thirumanam', 'kalasam-blessing', 'luxury-editorial', 'minimal-wedding', 'japanese-mizuhiki'];
const results = { startedAt: new Date().toISOString(), tests: [] };
function record(name, ok, details) { results.tests.push({ name, ok: !!ok, details }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(details).slice(0, 400))); }

const NO_COLLECTION = route => route.abort();
const ROLLBACK = async route => {
  const res = await route.fetch();
  route.fulfill({ response: res, body: (await res.text()).replace('var ENABLED = true;', 'var ENABLED = false;') });
};
async function ctx(browser, mode, viewport) {
  const c = await browser.newContext({ viewport: viewport || { width: 1366, height: 900 }, acceptDownloads: true });
  if (mode === 'without') await c.route(/redesign-collection(-data)?\.js/, NO_COLLECTION);
  if (mode === 'rollback') await c.route(/redesign-collection\.js/, ROLLBACK);
  // Stable screenshots: freeze the countdown.
  await c.addInitScript(() => { window.__errors = []; window.addEventListener('error', e => window.__errors.push(e.message)); });
  return c;
}
async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  });
  await page.waitForTimeout(300);
}
/* Largest card on the page + facts about its artwork. */
const cardFacts = () => {
  const inv = [...document.querySelectorAll('.invitation')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  if (!inv) return null;
  const img = sel => { const i = inv.querySelector(sel); return i ? { src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 } : null; };
  return {
    cls: inv.className, rd: inv.classList.contains('rd-card'),
    crest: img('.wd-motif') || img('.wd-spray'), venue: img('.wd-venue__photo img'),
    cornerTL: img('.rd-corner--tl'), cornerTR: img('.rd-corner--tr'), footer: img('.rd-footer'),
    svgCorners: inv.querySelectorAll('.wd-corner').length,
    text: inv.innerText.replace(/\d+\s*(DAYS|HOURS|MINUTES|SECONDS)/gi, '').replace(/\s+/g, ' ').trim()
  };
};
const cardHtml = () => {
  const inv = [...document.querySelectorAll('.invitation')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  if (!inv) return null;
  const c = inv.cloneNode(true); c.querySelectorAll('[class*="countdown"]').forEach(n => n.remove());
  return c.outerHTML;
};
function artworkOk(f, base, corners) {
  const dir = 'images/redesign-100/' + base + '/';
  return f && f.rd && f.crest && f.crest.src.endsWith(dir + 'crest.webp') && f.crest.ok &&
    f.venue && f.venue.src.endsWith(dir + 'venue.webp') && f.venue.ok && f.footer && f.footer.ok &&
    (!corners || (f.cornerTL && f.cornerTL.ok && f.cornerTR && f.cornerTR.ok && f.svgCorners === 0));
}

(async () => {
  const DATA = JSON.parse(fs.readFileSync(path.resolve(OUT, '..', '..', 'js', 'redesign-collection-data.js'), 'utf8').replace(/^[\s\S]*?REDESIGN_COLLECTION_DATA = /, '').replace(/;\s*$/, ''));
  const CARD = Object.fromEntries(DATA.cards.map(c => [c.base, c]));
  const browser = await chromium.launch();

  /* 1. Gallery: original grid identical with and without the collection. */
  {
    const grab = async mode => {
      const c = await ctx(browser, mode); const p = await c.newPage();
      await p.goto(BASE + 'templates.html'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
      const r = await p.evaluate(() => {
        const g = document.querySelector('[data-template-grid]');
        const sec = document.querySelector('[data-redesign-collection]');
        return { n: g.querySelectorAll('.template-card').length, html: g.innerHTML.length + ':' + [...g.querySelectorAll('[data-template]')].map(e => e.dataset.template).join(','),
          section: !!sec, open: sec ? sec.querySelector('details').open : null, painted: sec ? sec.querySelectorAll('.template-card').length : 0, errors: window.__errors };
      });
      await c.close(); return r;
    };
    const w = await grab('with'), wo = await grab('without');
    record('gallery: original grid unchanged by the collection', w.n === wo.n && w.html === wo.html && w.n > 0, { with: w.n, without: wo.n });
    record('gallery: collection shown below the original gallery, open with all 100 cards', w.section && w.open === true && w.painted === 100 && !wo.section, { section: w.section, open: w.open, painted: w.painted });
    record('gallery: no script errors', !w.errors.length, w.errors);
  }
  /* 1b. Categories page: one extra card linking to the collection; originals unchanged. */
  {
    const grab = async mode => { const c = await ctx(browser, mode); const p = await c.newPage(); await p.goto(BASE + 'categories.html'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
      await p.evaluate(() => { const c = document.querySelector('[data-rd-category]'); if (c) c.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(1500);
      const r = await p.evaluate(() => { const cards = [...document.querySelectorAll('[data-category-grid] .category-card')]; const rd = document.querySelector('[data-rd-category]');
        return { orig: cards.filter(c => !c.hasAttribute('data-rd-category')).map(c => c.querySelector('h3').textContent + '|' + c.querySelector('a').getAttribute('href')).join(','),
          rd: rd ? { href: rd.querySelector('a').getAttribute('href'), img: rd.querySelector('img').naturalWidth > 0 } : null }; });
      await c.close(); return r; };
    const w = await grab('with'), wo = await grab('without');
    record('categories: original category cards unchanged', w.orig === wo.orig && w.orig.length > 0, {});
    record('categories: Redesigned Collection card links to the collection', w.rd && w.rd.href === 'templates.html?collection=redesign-100' && w.rd.img, w.rd);
  }
  /* 2. Gallery collection view: all 100 cards, distinct, thumbnails load. */
  {
    const c = await ctx(browser, 'with'); const p = await c.newPage();
    await p.goto(BASE + 'templates.html?collection=redesign-100'); await settle(p);
    const r = await p.evaluate(() => {
      const sec = document.querySelector('[data-redesign-collection]');
      const cards = [...sec.querySelectorAll('.template-card')];
      return { n: cards.length, slugs: cards.map(c => c.dataset.template), names: cards.map(c => c.querySelector('h3').textContent),
        groups: [...sec.querySelectorAll('.rd-collection__group')].map(h => h.textContent),
        thumbsOk: cards.length > 0 && cards.every(c => { const i = c.querySelector('img'); return i.complete && i.naturalWidth > 0; }),
        links: cards.length > 0 && cards.every(c => c.querySelector('a[href^="create.html?template=rd-"]') && c.querySelector('a[href^="preview.html?template=rd-"]')) };
    });
    record('gallery: 100 redesigned cards, all distinct rd-* ids', r.n === 100 && new Set(r.slugs).size === 100 && r.slugs.every(s => s.startsWith('rd-')), { n: r.n, groups: r.groups });
    record('gallery: thumbnails load and Preview/Use links target rd-* ids', r.thumbsOk && r.links, { thumbsOk: r.thumbsOk, links: r.links });
    record('gallery: names keep the original design name + "(Redesigned)"', r.names.length === 100 && r.names.includes('Kalasam Blessing (Redesigned)') && r.names.every(n => / \(Redesigned\)$/.test(n)), r.names.slice(0, 3));
    await p.locator('[data-redesign-collection]').screenshot({ path: path.join(SHOTS, 'gallery-collection.png') }).catch(() => {});
    await p.setViewportSize({ width: 1366, height: 900 });
    await p.screenshot({ path: path.join(SHOTS, 'gallery-collection-viewport.png') });
    // Preview modal from a collection card.
    await p.evaluate(() => { const b = document.querySelector('[data-redesign-collection] [data-preview]'); b.scrollIntoView(); b.click(); });
    await p.waitForTimeout(1500);
    const modal = await p.evaluate(() => { const m = document.querySelector('#template-preview-modal'); if (!m || m.getAttribute('aria-hidden') === 'true') return null;
      const inv = m.querySelector('.invitation'); return { rd: !!inv && inv.classList.contains('rd-card'), title: (m.querySelector('#template-preview-title') || {}).textContent }; });
    record('gallery: preview modal renders the redesigned card', modal && modal.rd, modal);
    await c.close();
  }
  /* 3. Preview page for one card per design category. */
  for (const [group, base] of Object.entries(REPS)) {
    const c = await ctx(browser, 'with'); const p = await c.newPage();
    await p.goto(BASE + 'preview.html?template=rd-' + base); await settle(p);
    const f = await p.evaluate(cardFacts);
    const name = await p.evaluate(() => document.body.innerText.includes('(Redesigned)'));
    record('preview: ' + group + ' (rd-' + base + ') loads its artwork + name', artworkOk(f, base, CARD[base].corners) && name, { f: f && Object.assign({}, f, { text: undefined }), name });
    const inv = p.locator('.invitation').first();
    await p.evaluate(() => { const i = [...document.querySelectorAll('.invitation')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]; i.id = 'rd-shot'; });
    await p.locator('#rd-shot').screenshot({ path: path.join(SHOTS, 'preview-' + base + '.png') });
    await c.close();
  }
  /* 4. Originals (both protected references, a redesigned card's original,
        and unselected cards): identical markup and pixels with/without. */
  for (const slug of ORIGINALS) {
    const shot = async mode => {
      const c = await ctx(browser, mode); const p = await c.newPage();
      await p.goto(BASE + 'preview.html?template=' + slug); await settle(p);
      await p.addStyleTag({ content: '[class*="countdown"]{visibility:hidden!important}' });
      const html = await p.evaluate(cardHtml);
      await p.evaluate(() => { const i = [...document.querySelectorAll('.invitation')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]; i.id = 'rd-shot'; });
      const png = await p.locator('#rd-shot').screenshot();
      await c.close(); return { html, png };
    };
    const a = await shot('with'), b = await shot('without');
    record('original unchanged: ' + slug, a.html === b.html && Buffer.compare(a.png, b.png) === 0, { sameHtml: a.html === b.html, samePixels: Buffer.compare(a.png, b.png) === 0 });
  }
  /* 5. Editor: open a redesigned card, pick another from the picker, edit fields, devices, host view, JPG. */
  for (const base of ['kalasam-blessing', 'kerala-mangalyam']) {
    const c = await ctx(browser, 'with'); const p = await c.newPage();
    await p.goto(BASE + 'create.html?template=rd-' + base); await settle(p); await p.waitForTimeout(800);
    let f = await p.evaluate(cardFacts);
    const draft = await p.evaluate(() => IH.store.get('draft', null));
    record('editor: rd-' + base + ' opens with its artwork', artworkOk(f, base, CARD[base].corners) && draft && draft.template === 'rd-' + base, { template: draft && draft.template });
    const picker = await p.evaluate(() => { const g = document.querySelector('[data-template-picker] .option-grid'); if (!g) return null;
      const vals = [...g.querySelectorAll('input[name="template"]')].map(i => i.value);
      const pairs = vals.filter((v, i) => v.startsWith('rd-') && vals[i - 1] === v.slice(3)).length;
      return { n: vals.filter(v => v.startsWith('rd-')).length, pairs, note: (g.previousElementSibling || {}).textContent, separate: !!document.querySelector('[data-rd-picker]'),
        checked: (g.querySelector('input:checked') || {}).value }; });
    record('editor: all 100 redesigned cards sit next to their originals in the wedding Template grid', picker && picker.n === 100 && picker.pairs === 100 && !picker.separate && picker.checked === 'rd-' + base, picker);
    if (base === 'kalasam-blessing') {
      // Pick a different redesigned card from the picker.
      await p.evaluate(() => { const i = document.querySelector('[data-template-picker] input[value="rd-maharaja-palace"]'); i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); });
      await p.waitForTimeout(1200);
      f = await p.evaluate(cardFacts);
      const d2 = await p.evaluate(() => IH.store.get('draft', null).template);
      record('editor: selecting another redesigned card loads its artwork', d2 === 'rd-maharaja-palace' && artworkOk(f, 'maharaja-palace', true), { template: d2 });
      // Original cards in the picker are still there and selectable.
      const origCount = await p.evaluate(() => [...document.querySelectorAll('[data-template-picker] input[name="template"]')].filter(i => !i.value.startsWith('rd-')).length);
      record('editor: original designs still listed in the picker', origCount > 0, { originalRadios: origCount });
      // Edit text fields.
      await p.evaluate(() => {
        const set = (n, v) => { const el = document.querySelector('[name="' + n + '"]'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
        set('venue', 'Test Venue Hall'); set('brideName', 'Testbride');
      });
      await p.waitForTimeout(1200);
      f = await p.evaluate(cardFacts);
      record('editor: venue and name edits render on the redesigned card', f.text.includes('Test Venue Hall') && f.text.includes('Testbride') && f.rd, { rd: f.rd });
    }
    // Desktop editor (this context) and a real 390x844 mobile editor.
    const devCheck = () => {
      const i = document.querySelector('#preview-viewport-frame .invitation'); if (!i) return { ok: false };
      const ir = i.getBoundingClientRect(), n = i.querySelector('.wd-note--left'), k = i.querySelector('.rd-corner--tl');
      const nb = n && getComputedStyle(n).display !== 'none' ? n.getBoundingClientRect() : null, kb = k ? k.getBoundingClientRect() : null;
      return { ok: i.classList.contains('rd-card') && ir.width > 200 && ir.right <= window.innerWidth + 1, cardW: Math.round(ir.width), vw: window.innerWidth,
        cornerClearsNote: !(nb && kb) || kb.bottom <= nb.top };
    };
    {
      const r = await p.evaluate(devCheck);
      await p.locator('#preview-viewport-frame').screenshot({ path: path.join(SHOTS, 'editor-' + base + '-desktop.png') });
      record('editor: desktop preview (' + base + ')', r.ok && r.cornerClearsNote, r);
      const m = await c.newPage(); await m.setViewportSize({ width: 390, height: 844 });
      await m.goto(BASE + 'create.html?template=' + (await p.evaluate(() => IH.store.get('draft', null).template))); await settle(m); await m.waitForTimeout(800);
      const rm = await m.evaluate(devCheck);
      await m.evaluate(() => document.getElementById('preview-viewport-frame').scrollIntoView());
      await m.screenshot({ path: path.join(SHOTS, 'editor-' + base + '-mobile.png'), fullPage: false });
      const hs = await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      record('editor: mobile 390px preview (' + base + ')', rm.ok && rm.cornerClearsNote && hs, Object.assign(rm, { noHorizontalScroll: hs }));
      await m.close();
    }
    // JPG export.
    if (await p.locator('[data-draft-download-jpg]').count()) {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }).catch(e => null), p.locator('[data-draft-download-jpg]').first().click({ force: true })]);
      if (dl) { const file = path.join(SHOTS, 'export-' + base + '.jpg'); await dl.saveAs(file); record('editor: JPG export (' + base + ')', fs.statSync(file).size > 50000, { file: path.basename(file), bytes: fs.statSync(file).size }); }
      else record('editor: JPG export (' + base + ')', false, 'no download event');
    }
    // Hosted page (host.html renders the saved draft).
    const hp = await c.newPage(); await hp.setViewportSize({ width: 1366, height: 900 });
    await hp.goto(BASE + 'host.html'); await hp.waitForTimeout(1500); await settle(hp);
    const draftNow = await hp.evaluate(() => IH.store ? null : null);
    const host = await hp.evaluate(() => {
      const crest = document.querySelector('.site-wd-crest img'); const land = document.querySelector('.rd-host-landscape img');
      const venue = document.querySelector('.site-venue__media'); const corners = document.querySelectorAll('.rd-corner');
      return { body: document.body.className, crest: crest && crest.getAttribute('src'), crestOk: !!crest && crest.naturalWidth > 0, land: !!land && land.naturalWidth > 0,
        venue: venue && venue.style.backgroundImage, corners: corners.length, cornersOk: [...corners].every(i => i.naturalWidth > 0) };
    });
    const hb = base === 'kalasam-blessing' ? 'maharaja-palace' : base;
    record('host page: redesigned artwork (' + hb + ')', /site-host--wd/.test(host.body) && host.crest && host.crest.endsWith('images/redesign-100/' + hb + '/crest.webp') && host.crestOk && host.land && host.corners === (CARD[hb].corners ? 2 : 0) && host.cornersOk && (host.venue === null || /redesign-100\/.*venue\.webp/.test(host.venue)), host);
    await hp.screenshot({ path: path.join(SHOTS, 'host-' + hb + '-top.png') });
    await hp.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await hp.waitForTimeout(500);
    await hp.screenshot({ path: path.join(SHOTS, 'host-' + hb + '-bottom.png') });
    await hp.setViewportSize({ width: 390, height: 844 }); await hp.evaluate(() => window.scrollTo(0, 0)); await hp.waitForTimeout(500);
    await hp.screenshot({ path: path.join(SHOTS, 'host-' + hb + '-mobile.png') });
    const errs = await p.evaluate(() => window.__errors);
    record('editor: no script errors (' + base + ')', !errs.length, errs);
    await c.close();
  }
  /* 6. Protected references in the editor: identical with/without. */
  for (const slug of ['telugu-pelli', 'tamil-thirumanam']) {
    const grab = async mode => { const c = await ctx(browser, mode); const p = await c.newPage(); await p.goto(BASE + 'create.html?template=' + slug); await settle(p); await p.waitForTimeout(800); const h = await p.evaluate(cardHtml); await c.close(); return h; };
    const a = await grab('with'), b = await grab('without');
    record('editor: protected ' + slug + ' unchanged', a && a === b, { same: a === b });
  }
  /* 7. Rollback: ENABLED=false hides the collection and maps rd-* to the original. */
  {
    const c = await ctx(browser, 'rollback'); const p = await c.newPage();
    await p.goto(BASE + 'templates.html?collection=redesign-100'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(500);
    const sec = await p.evaluate(() => !!document.querySelector('[data-redesign-collection]'));
    await p.goto(BASE + 'create.html?template=rd-kalasam-blessing'); await settle(p); await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({ picker: !!document.querySelector('[data-rd-tile], [data-rd-picker]'), template: IH.store.get('draft', null).template }));
    const f = await p.evaluate(cardFacts);
    record('rollback: collection hidden, rd-* link falls back to the original design', !sec && !r.picker && r.template === 'kalasam-blessing' && f && !f.rd && /wd-l-/.test(f.cls), { section: sec, picker: r.picker, template: r.template, rd: f && f.rd });
    await c.close();
  }
  await browser.close();
  results.finishedAt = new Date().toISOString();
  results.passed = results.tests.filter(t => t.ok).length; results.failed = results.tests.length - results.passed;
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  console.log('passed', results.passed, 'failed', results.failed);
})();
