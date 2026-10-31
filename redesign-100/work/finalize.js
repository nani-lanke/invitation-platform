/* Writes output/manifest.json and output/failure-report.json and runs the
   final verification (counts, duplicates, PDF pages, names/categories,
   before/after hashes of every original file).
   Usage: node redesign-100/work/finalize.js   (after render.js and compile.py) */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const W = __dirname, RD = path.resolve(W, '..'), ROOT = path.resolve(RD, '..'), OUT = path.join(RD, 'output');
const BRIEFS = require('./briefs');
const INV = require('./inventory.json');
const GEN = JSON.parse(fs.readFileSync(path.join(W, 'gen-log.json'), 'utf8'));
const VAL = JSON.parse(fs.readFileSync(path.join(W, 'validation.json'), 'utf8'));
const BEFORE = JSON.parse(fs.readFileSync(path.join(W, 'hashes-before.json'), 'utf8'));
const PROTECTED = ['telugu-pelli', 'tamil-thirumanam'];
const SELECTED = Object.keys(BRIEFS);
const NOT_SELECTED_REASON = s => {
  const t = INV.find(i => i.slug === s);
  if (t.spec && t.spec.family === 'modern') return 'minimal / typographic design whose identity is image-free';
  if (/bride-and|groom-and|our-|my-|a-friends|a-family/.test(s)) return 'relationship-wording card; design is driven by wording, not regional imagery';
  return 'non-South-Asian international design, outside the South Asian visual lineage of the two reference cards';
};

(async () => {
  // Hashes after.
  require('child_process').execFileSync(process.execPath, [path.join(W, 'hash.js'), 'hashes-after.json']);
  const AFTER = JSON.parse(fs.readFileSync(path.join(W, 'hashes-after.json'), 'utf8'));
  const changed = Object.keys(BEFORE).filter(f => AFTER[f] !== BEFORE[f]);
  const added = Object.keys(AFTER).filter(f => !(f in BEFORE));

  // Names / categories / tiers straight from the live catalogue now.
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(ROOT, 'preview.html')).href); await page.waitForLoadState('networkidle');
  const nowCat = await page.evaluate(() => IH.data.templates.filter(t => t.category === 'wedding').map(t => ({ slug: t.slug, name: t.name, tier: t.tier, categoryLabel: t.categoryLabel, motif: t.motif })));
  await browser.close();
  const rowsBySlug = {};
  INV.forEach((t, i) => { (rowsBySlug[t.slug] = rowsBySlug[t.slug] || []).push({ catalogueRow: i, name: t.name, tier: t.tier }); });
  const labelsUnchanged = INV.length === nowCat.length && INV.every((t, i) => nowCat[i].slug === t.slug && nowCat[i].name === t.name && nowCat[i].tier === t.tier && nowCat[i].motif === t.motif);

  const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const invitations = Object.keys(rowsBySlug).map(slug => {
    const t = INV.find(i => i.slug === slug);
    const e = { slug, name: t.name, catalogueRows: rowsBySlug[slug], category: 'wedding', motif: t.motif,
      designSpec: t.spec ? { family: t.spec.family, layout: t.spec.layout, frame: t.spec.frame, venue: t.spec.venue } : 'regional layered design' };
    if (PROTECTED.includes(slug)) {
      e.status = 'PROTECTED_REFERENCE';
      const files = Object.keys(BEFORE).filter(f => f.startsWith('images/invitation-assets/' + slug + '/') || f === 'images/templates/' + slug + '.jpg');
      e.originalFilesChecked = files.length;
      e.originalFilesUnchanged = files.every(f => AFTER[f] === BEFORE[f]);
      return e;
    }
    if (!SELECTED.includes(slug)) {
      e.status = 'NOT_SELECTED'; e.reason = NOT_SELECTED_REASON(slug);
      const files = ['images/wedding-motifs/' + slug + '.svg', 'images/templates/' + slug + '.jpg'].filter(f => f in BEFORE);
      e.originalFilesUnchanged = files.every(f => AFTER[f] === BEFORE[f]);
      return e;
    }
    e.status = 'SELECTED_FOR_REDESIGN';
    e.index = SELECTED.indexOf(slug) + 1;
    const g = GEN[slug] || {}, v = VAL[slug] || {}, dir = 'redesign-100/cards/' + slug + '/';
    const botanical = t.spec.layout === 'botanical';
    const orig = {
      motif: 'images/wedding-motifs/' + slug + '.svg',
      venueImage: 'images/templates/venue-default.jpg',
      galleryThumb: 'images/templates/' + slug + '.jpg',
      renderer: ['js/preview.js', 'js/wedding-designs.js', 'css/style.css']
    };
    e.originalAssets = Object.fromEntries(Object.entries(orig).map(([k, p]) => [k, Array.isArray(p) ? p.map(x => ({ path: x, sha256: BEFORE[x], unchanged: AFTER[x] === BEFORE[x] })) : { path: p, sha256: BEFORE[p] || null, unchanged: AFTER[p] === BEFORE[p] }]));
    const ra = (k, file, action, note) => {
      const p = path.join(ROOT, dir, file);
      return { path: dir + file, action, note, exists: fs.existsSync(p), sha256: fs.existsSync(p) ? sha(p) : null, generator: 'FLUX.2 Klein 4B (local ComfyUI)', seed: g[k] && g[k].seed, prompt: g[k] && g[k].prompt };
    };
    e.redesignedAssets = {
      venue: ra('venue', 'venue.jpg', 'REPLACED', 'replaces the shared generic images/templates/venue-default.jpg in the venue section'),
      crest: ra('crest', 'crest.png', 'REPLACED', botanical ? 'replaces the flat SVG motif used for the two corner sprays' : 'replaces the flat SVG crest motif'),
      motifMapping: { path: dir + 'images/wedding-motifs/' + slug + '.svg', action: 'REPLACED', note: 'renderer motif path under data.assetPrefix; wraps crest.png' },
      footer: ra('footer', 'footer.jpg', 'ADDED', 'regional landscape at the foot of the card, behind text'),
      cornerTL: botanical ? null : ra('corner', 'corner-tl.png', 'REPLACED', 'replaces the inline SVG corner set (top-left)'),
      cornerTR: botanical ? null : Object.assign(ra('corner', 'corner-tr.png', 'REPLACED', 'mirrored copy of corner-tl (top-right)'), {}),
      retained: ['frame border (' + t.spec.frame + ')', 'palette', 'fonts', 'layout (' + t.spec.layout + ')', 'all card text'],
      designData: dir + 'design.json'
    };
    e.render = { renderer: 'redesign-100/render.html -> ../js/preview.js (unmodified), slug=' + slug + '&rd=1', png: v.png ? 'redesign-100/' + v.png : null, beforePng: 'redesign-100/output/before/' + slug + '.png', checks: v.checks, metrics: v.metrics, renderedAt: v.renderedAt };
    e.result = v.ok ? 'SUCCESS' : 'FAILED';
    e.failures = v.failures || ['not rendered'];
    return e;
  });

  const sel = invitations.filter(i => i.status === 'SELECTED_FOR_REDESIGN');
  const ok = sel.filter(i => i.result === 'SUCCESS');
  const pngs = fs.readdirSync(path.join(OUT, 'png')).filter(f => /^\d{3}-.*\.png$/.test(f));
  const pdfFile = path.join(OUT, 'redesigned-invitations-100.pdf');
  const pdfPages = fs.existsSync(pdfFile) ? (fs.readFileSync(pdfFile).toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length : 0;
  const counts = {
    catalogueRows: INV.length, discovered: invitations.length,
    protected: invitations.filter(i => i.status === 'PROTECTED_REFERENCE').length,
    eligible: invitations.length - PROTECTED.length,
    selected: sel.length, notSelected: invitations.filter(i => i.status === 'NOT_SELECTED').length,
    successful: ok.length, failed: sel.length - ok.length
  };
  const verification = {
    exactly100Selected: sel.length === 100,
    noDuplicateSelections: new Set(sel.map(i => i.slug)).size === sel.length,
    protectedUnchanged: invitations.filter(i => i.status === 'PROTECTED_REFERENCE').every(i => i.originalFilesUnchanged),
    unselectedUnchanged: invitations.filter(i => i.status === 'NOT_SELECTED').every(i => i.originalFilesUnchanged),
    namesCategoriesUnchanged: labelsUnchanged,
    originalFilesChanged: changed, originalFilesHashed: Object.keys(BEFORE).length, filesAddedOutsideOutput: added,
    pngCount: pngs.length, pngUnique: new Set(pngs.map(f => f.slice(4))).size, pngMatchesSelection: pngs.length === 100 && sel.every(i => pngs.includes(String(i.index).padStart(3, '0') + '-' + i.slug + '.png')),
    pdfPages, contactSheet: fs.existsSync(path.join(OUT, 'contact-sheet-100.png')),
    allRenderedWithArtwork: ok.length === 100
  };
  const manifest = { generated: new Date().toISOString(), outputDir: 'redesign-100/', counts, verification, invitations };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  const failures = sel.filter(i => i.result !== 'SUCCESS').map(i => ({ slug: i.slug, failures: i.failures }));
  const genFailures = [];
  Object.entries(GEN).forEach(([s, kinds]) => Object.entries(kinds).forEach(([k, r]) => { if (r.redoneAfterReview || r.error) genFailures.push({ slug: s, kind: k, finalOk: r.ok, error: r.error || null, regeneratedAfterVisualReview: r.redoneAfterReview || 0 }); }));
  fs.writeFileSync(path.join(OUT, 'failure-report.json'), JSON.stringify({ generated: manifest.generated, counts, renderOrValidationFailures: failures, generationIssues: genFailures, visualReviewNotes: fs.existsSync(path.join(W, 'review-notes.json')) ? JSON.parse(fs.readFileSync(path.join(W, 'review-notes.json'), 'utf8')) : [] }, null, 1));
  console.log(JSON.stringify({ counts, verification: Object.assign({}, verification, { originalFilesChanged: changed.length, filesAddedOutsideOutput: added.length }) }, null, 1));
})();
