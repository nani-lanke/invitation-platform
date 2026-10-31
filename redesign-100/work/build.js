/* Writes cards/<slug>/design.json + design.js (the redesigned working copy's
   image mappings) for every selected card whose artwork is complete. */
const fs = require('fs'), path = require('path');
const BRIEFS = require('./briefs');
const INV = require('./inventory.json');
const LOG = JSON.parse(fs.readFileSync(path.join(__dirname, 'gen-log.json'), 'utf8'));
const CARDS = path.resolve(__dirname, '..', 'cards');
let ok = 0, missing = [];
for (const slug of Object.keys(BRIEFS)) {
  const t = INV.find(i => i.slug === slug), l = LOG[slug] || {};
  const botanical = t.spec.layout === 'botanical';
  const need = ['venue', 'crest', 'footer'].concat(botanical ? [] : ['corner']);
  const bad = need.filter(k => !(l[k] && l[k].ok));
  if (bad.length) { missing.push(slug + ':' + bad.join('+')); continue; }
  const d = {
    slug, name: t.name, base: 'cards/' + slug + '/',
    spec: { layout: t.spec.layout, frame: t.spec.frame, venue: t.spec.venue, family: t.spec.family },
    images: Object.assign({ venue: 'venue.jpg', crest: 'crest.png', motif: 'images/wedding-motifs/' + slug + '.svg', footer: 'footer.jpg' },
      botanical ? {} : { cornerTL: 'corner-tl.png', cornerTR: 'corner-tr.png' }),
    replaces: {
      venueImage: 'images/templates/venue-default.jpg',
      motif: 'images/wedding-motifs/' + slug + '.svg',
      corners: botanical ? null : 'inline SVG corner set (' + t.spec.frame + ')',
      footer: null
    },
    prompts: Object.fromEntries(need.map(k => [k, { prompt: l[k].prompt, seed: l[k].seed, raw: l[k].raw }]))
  };
  fs.writeFileSync(path.join(CARDS, slug, 'design.json'), JSON.stringify(d, null, 1));
  fs.writeFileSync(path.join(CARDS, slug, 'design.js'), 'window.RD_DESIGN = ' + JSON.stringify(d) + ';\n');
  ok++;
}
console.log('designs', ok, 'incomplete', missing.length, missing.slice(0, 10).join(' '));
