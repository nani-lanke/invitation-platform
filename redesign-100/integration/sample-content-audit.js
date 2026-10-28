/* Audits the sample (placeholder) content each redesigned card shows in the
   gallery preview, and compares it with the original card's sample.
   Nothing is changed; the report lists what may mislead.
   Usage: node redesign-100/integration/sample-content-audit.js (site at :8099) */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8099/';
const DATA = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'js', 'redesign-collection-data.js'), 'utf8').replace(/^[\s\S]*?DATA = /, '').replace(/;\s*$/, ''));
/* Where each design's identity is rooted (only designs tied to a region outside Tamil Nadu). */
const REGION = {
  'talambralu-pearls': 'Andhra Pradesh', 'kerala-mangalyam': 'Kerala', 'kasavu-gold-border': 'Kerala', 'mysore-madhuve': 'Karnataka', 'punjabi-phulkari': 'Punjab',
  'bengali-alpona': 'West Bengal', 'shankha-pola': 'West Bengal', 'gujarati-toran': 'Gujarat', 'bandhani-bloom': 'Gujarat/Rajasthan', 'marathi-paithani': 'Maharashtra',
  'mundavalya-pearls': 'Maharashtra', 'rajasthani-jharokha': 'Rajasthan', 'haveli-jaali': 'Rajasthan', 'assamese-biya': 'Assam', 'gamosa-weave': 'Assam',
  'odia-bahaghara': 'Odisha', 'pattachitra-vows': 'Odisha', 'sindhi-ajrak': 'Sindh', 'goan-azulejo': 'Goa', 'konkan-coast': 'Konkan coast', 'kashmiri-chinar': 'Kashmir',
  'nepali-bihe': 'Nepal', 'mithila-vivah': 'Mithila (Bihar)', 'lucknawi-chikankari': 'Lucknow', 'andhra-kalamkari': 'Andhra Pradesh', 'telangana-bathukamma': 'Telangana',
  'coorg-kodava': 'Coorg (Karnataka)', 'kutch-mirrorwork': 'Kutch (Gujarat)', 'banarasi-royale': 'Varanasi', 'awadhi-nawab': 'Lucknow', 'kashmir-garden': 'Kashmir',
  'jewel-of-jaipur': 'Jaipur', 'udaipur-romance': 'Udaipur', 'maharaja-palace': 'Rajasthan', 'anand-karaj': 'Punjab / Sikh', 'anand-karaj-ardas': 'Punjab / Sikh',
  'pakistani-truck-art': 'Pakistan', 'bangladeshi-jamdani': 'Bangladesh', 'sri-lankan-poruwa': 'Sri Lanka', 'goa-sunset-vows': 'Goa', 'desert-romance': 'Thar desert'
};
const KNOWN_REAL = ['Le Meridien', 'Swabhumi'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const grab = async slug => {
    await p.goto(BASE + 'preview.html?template=' + slug); await p.waitForLoadState('networkidle');
    return p.evaluate(() => {
      const inv = [...document.querySelectorAll('.invitation')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
      const t = s => { const e = inv.querySelector(s); return e ? e.textContent.trim() : ''; };
      return { names: [...inv.querySelectorAll('.wd-name')].map(e => e.textContent.trim()), parents: [...inv.querySelectorAll('.wd-parents')].map(e => e.textContent.trim()),
        venue: t('.wd-venue__name'), address: t('.wd-venue__address') };
    });
  };
  const rows = [];
  for (const c of DATA.cards) {
    const rd = await grab(c.slug), orig = await grab(c.base);
    const flags = [];
    if (/Suresh Sharma|Ramesh Kumar|Sharma|Verma/.test(rd.parents.join(' '))) flags.push('placeholder family names');
    if (rd.venue === 'Grand Palace Hall') flags.push('placeholder venue name "Grand Palace Hall"');
    if (/Chennai/.test(rd.address) && REGION[c.base]) flags.push('sample address in Chennai on a ' + REGION[c.base] + ' design');
    if (KNOWN_REAL.some(k => (orig.venue + rd.venue).includes(k))) flags.push('original sample names a real venue (' + orig.venue + ')');
    const differs = JSON.stringify(rd) !== JSON.stringify(orig);
    if (differs) flags.push('gallery sample differs from the original card (' + (orig.venue !== rd.venue ? 'venue/address' : 'couple names') + ') because the sample text is chosen per template id');
    rows.push({ slug: c.slug, base: c.base, group: c.group, sample: rd, originalSample: orig, flags });
  }
  await b.close();
  const summary = {};
  rows.forEach(r => r.flags.forEach(f => { const k = f.replace(/ \(.*\)| on a .* design/, ''); summary[k] = (summary[k] || 0) + 1; }));
  const out = { generated: new Date().toISOString(), note: 'Sample text only; the host replaces it in the editor (names, parents, venue, address, date, time, message are all editable fields). Nothing was changed.', summary, cards: rows };
  fs.writeFileSync(path.join(__dirname, 'sample-content-report.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(summary, null, 1));
  rows.filter(r => r.flags.some(f => /real venue|differs/.test(f))).forEach(r => console.log(r.slug, '|', r.flags.join(' ; ')));
})();
