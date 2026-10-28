/* Builds one motif image per wedding template for the wedding design engine
   (js/wedding-designs.js): images/wedding-motifs/<slug>.svg.
   - Templates whose gallery art (images/templates/<slug>.svg) defines a
     reusable <g id="mo"> get that exact motif, cropped to its own bounds.
   - The rest get a motif drawn from their name/theme (palace dome, lotus,
     moon and stars, palms, deco fan, blossom branch...) in their own colours.
   Usage: node scripts/build-wedding-motifs.js */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'wedding-motifs');
const SKIP = { 'telugu-pelli': 1, 'tamil-thirumanam': 1 }; // bespoke regional designs

function loadTemplates() {
  global.window = global;
  global.IH = { store: { get: (k, d) => d, set() {} }, dom: { qs() {}, qsa() { return []; }, on() {}, el() { return {}; }, escapeHtml: s => s } };
  global.document = { documentElement: {}, addEventListener() {} };
  global.localStorage = { getItem() { return null; }, setItem() {} };
  eval(fs.readFileSync(path.join(ROOT, 'js', 'templates.js'), 'utf8')); // eslint-disable-line no-eval
  return IH.data.templates.filter(t => t.category === 'wedding' && !SKIP[t.slug]);
}

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---- Drawn motifs (viewBox -100 -100 200 200) ---- */
const R = (a) => a * Math.PI / 180;
const DRAW = {
  rosette(c, h) {
    const n = 8 + (h % 3) * 2; let s = '';
    const pointed = (h >> 3) % 2;
    for (let i = 0; i < n; i++) s += pointed ? `<path d="M0 -12 Q16 -46 0 -84 Q-16 -46 0 -12 Z" transform="rotate(${i * 360 / n})" fill="${c.a}" fill-opacity=".14" stroke="${c.a}" stroke-width="1.6"/>` : `<ellipse cx="0" cy="-46" rx="13" ry="34" transform="rotate(${i * 360 / n})" fill="${c.a}" fill-opacity=".14" stroke="${c.a}" stroke-width="1.6"/>`;
    for (let i = 0; i < n; i++) s += `<ellipse cx="0" cy="-26" rx="7" ry="18" transform="rotate(${i * 360 / n + 180 / n})" fill="${c.b}" fill-opacity=".22" stroke="${c.b}" stroke-width="1.2"/>`;
    return s + `<circle r="11" fill="${c.a}"/><circle r="84" fill="none" stroke="${c.a}" stroke-width="1" stroke-dasharray="2 6"/>`;
  },
  lotus(c, h) {
    let s = ''; const n = 5 + (h % 2) * 2;
    for (let i = 0; i < n; i++) { const a = -90 + (i - (n - 1) / 2) * (150 / n); s += `<path d="M0 30 C ${Math.cos(R(a - 14)) * 70} ${30 + Math.sin(R(a - 14)) * 70}, ${Math.cos(R(a + 14)) * 70} ${30 + Math.sin(R(a + 14)) * 70}, 0 30 Z" fill="${c.a}" fill-opacity=".18" stroke="${c.a}" stroke-width="1.6"/>`; }
    if ((h >> 2) % 2) s += `<ellipse cx="-58" cy="62" rx="22" ry="7" fill="${c.b}" fill-opacity=".25" stroke="${c.b}"/><ellipse cx="60" cy="64" rx="18" ry="6" fill="${c.b}" fill-opacity=".25" stroke="${c.b}"/>`;
    if ((h >> 3) % 2) s += `<path d="M-34 -40 Q-40 -60 -30 -72 Q-20 -60 -26 -40 Z M34 -40 Q40 -60 30 -72 Q20 -60 26 -40 Z" fill="${c.a}" fill-opacity=".3" stroke="${c.a}"/>`;
    return s + `<path d="M-70 42 Q0 70 70 42" fill="none" stroke="${c.b}" stroke-width="2"/><path d="M-50 54 Q0 74 50 54" fill="none" stroke="${c.b}" stroke-width="1.2" opacity=".7"/>`;
  },
  palace(c, h) {
    /* Variants: dome (onion / bulb / shikhara), 1-3-5 arches, side chhatris, lake reflection. */
    const dome = h % 3, arches = [1, 3, 5][(h >> 2) % 3], chhatri = (h >> 4) % 2, lake = (h >> 5) % 2;
    const domes = [
      'M-40 -14 Q-46 -60 0 -78 Q46 -60 40 -14 Z',
      'M-36 -14 Q-36 -70 0 -76 Q36 -70 36 -14 Z',
      'M-34 -14 L-24 -50 L-12 -64 L0 -80 L12 -64 L24 -50 L34 -14 Z'
    ];
    let s = '<path d="' + domes[dome] + '" fill="' + c.a + '" fill-opacity=".16" stroke="' + c.a + '" stroke-width="1.8"/>' +
      '<path d="M0 -80 V-94" stroke="' + c.a + '" stroke-width="2"/><circle cy="-96" r="3" fill="' + c.a + '"/>' +
      '<path d="M-66 ' + (lake ? 40 : 70) + ' V-6 H66 V' + (lake ? 40 : 70) + '" fill="none" stroke="' + c.a + '" stroke-width="1.8"/>';
    const base = lake ? 40 : 70, w = 112 / arches;
    for (let i = 0; i < arches; i++) {
      const x0 = -56 + i * w + 3, x1 = x0 + w - 6, mid = (x0 + x1) / 2, big = arches === 1 || i === (arches - 1) / 2;
      s += '<path d="M' + x0.toFixed(1) + ' ' + base + ' V' + (big ? 18 : 26) + ' Q' + x0.toFixed(1) + ' ' + (big ? 2 : 12) + ' ' + mid.toFixed(1) + ' ' + (big ? -4 : 6) + ' Q' + x1.toFixed(1) + ' ' + (big ? 2 : 12) + ' ' + x1.toFixed(1) + ' ' + (big ? 18 : 26) + ' V' + base + '" fill="' + c.b + '" fill-opacity="' + (big ? '.2' : '.08') + '" stroke="' + c.b + '" stroke-width="1.4"/>';
    }
    if (chhatri) s += '<path d="M-78 -6 Q-78 -32 -66 -38 Q-54 -32 -54 -6 M54 -6 Q54 -32 66 -38 Q78 -32 78 -6" fill="' + c.a + '" fill-opacity=".14" stroke="' + c.a + '" stroke-width="1.4"/><path d="M-82 -6 H-50 M50 -6 H82" stroke="' + c.a + '" stroke-width="1.6"/>';
    s += '<path d="M-86 ' + base + ' H86" stroke="' + c.a + '" stroke-width="2"/>';
    if (lake) s += '<path d="M-80 54 H80 M-60 64 H60 M-36 74 H36" stroke="' + c.a + '" stroke-width="1.2" opacity=".55"/><path d="M-30 46 Q0 60 30 46" fill="none" stroke="' + c.b + '" stroke-width="1" opacity=".5"/>';
    return s;
  },
  gopuram(c, h) {
    const tiers = 4 + (h % 3); let s = ''; const H = 150 / (tiers + 1);
    for (let i = 0; i < tiers; i++) {
      const wb = 80 - i * (60 / tiers), wt = 80 - (i + 1) * (60 / tiers), y = 70 - i * H;
      s += '<path d="M' + (-wb) + ' ' + y + ' L' + (-wt) + ' ' + (y - H) + ' H' + wt + ' L' + wb + ' ' + y + ' Z" fill="' + c.a + '" fill-opacity="' + (i % 2 ? '.1' : '.2') + '" stroke="' + c.a + '" stroke-width="1.5"/>';
      for (let k = -1; k <= 1; k++) s += '<path d="M' + (k * wt * 0.55 - 4) + ' ' + (y - 3) + ' V' + (y - H + 6) + ' H' + (k * wt * 0.55 + 4) + ' V' + (y - 3) + '" fill="none" stroke="' + c.b + '" stroke-width="1"/>';
    }
    const top = 70 - tiers * H;
    s += '<path d="M-24 ' + top + ' Q-24 ' + (top - 18) + ' 0 ' + (top - 22) + ' Q24 ' + (top - 18) + ' 24 ' + top + ' Z" fill="' + c.b + '" fill-opacity=".25" stroke="' + c.b + '" stroke-width="1.5"/>';
    for (let k = -1; k <= 1; k++) s += '<path d="M' + k * 12 + ' ' + (top - 18) + ' V' + (top - 30) + '" stroke="' + c.a + '" stroke-width="2"/><circle cx="' + k * 12 + '" cy="' + (top - 32) + '" r="3" fill="' + c.a + '"/>';
    return s + '<path d="M-14 70 V44 Q0 30 14 44 V70" fill="' + c.b + '" fill-opacity=".3" stroke="' + c.b + '" stroke-width="1.4"/><path d="M-92 70 H92" stroke="' + c.a + '" stroke-width="2"/>';
  },
  mirror(c, h) {
    let s = ''; const ring = 6 + (h % 3) * 2;
    for (let i = 0; i < ring; i++) { const a = R(i * 360 / ring), x = Math.cos(a) * 56, y = Math.sin(a) * 56; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="12" fill="' + c.b + '" fill-opacity=".15" stroke="' + c.a + '" stroke-width="1.6"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" fill="#ffffff" fill-opacity=".55" stroke="' + c.a + '"/>'; }
    return s + '<circle r="30" fill="' + c.b + '" fill-opacity=".2" stroke="' + c.a + '" stroke-width="2"/><circle r="16" fill="#ffffff" fill-opacity=".6" stroke="' + c.a + '" stroke-width="1.6"/><circle r="84" fill="none" stroke="' + c.a + '" stroke-width="1" stroke-dasharray="1 5"/>';
  },
  laurel(c, h) {
    let s = `<circle r="44" fill="none" stroke="${c.a}" stroke-width="1.6"/><circle r="38" fill="none" stroke="${c.a}" stroke-width=".8"/>`;
    for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
      const a = 110 + i * 17, x = Math.cos(R(a)) * 62 * side, y = Math.sin(R(a)) * 62;
      s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="12" transform="rotate(${(side > 0 ? -a + 90 : a - 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${c.b}" fill-opacity=".5" stroke="${c.b}" stroke-width="1"/>`;
    }
    return s + `<path d="M-6 -58 L0 -70 L6 -58 Z" fill="${c.a}"/>` + (h % 2 ? `<path d="M-14 62 Q0 74 14 62" fill="none" stroke="${c.a}" stroke-width="1.6"/>` : '');
  },
  fan(c, h) {
    let s = ''; const n = 9 + (h % 3);
    for (let i = 0; i <= n; i++) { const a = 180 + i * 180 / n; s += `<path d="M0 40 L${(Math.cos(R(a)) * 86).toFixed(1)} ${(40 + Math.sin(R(a)) * 86).toFixed(1)}" stroke="${c.a}" stroke-width="${i % 2 ? 1 : 2}"/>`; }
    return s + `<path d="M-86 40 A86 86 0 0 1 86 40" fill="none" stroke="${c.a}" stroke-width="2"/><path d="M-56 40 A56 56 0 0 1 56 40" fill="${c.b}" fill-opacity=".14" stroke="${c.b}" stroke-width="1.4"/><path d="M-26 40 A26 26 0 0 1 26 40 Z" fill="${c.a}"/><path d="M-96 40 H96" stroke="${c.a}" stroke-width="1.4"/>`;
  },
  moon(c, h) {
    const flip = (h >> 2) % 2 ? ' transform="scale(-1 1)"' : '';
    let s = `<g${flip}><path d="M18 -62 A66 66 0 1 0 18 62 A52 52 0 1 1 18 -62 Z" fill="${c.a}" fill-opacity=".22" stroke="${c.a}" stroke-width="1.8"/>`;
    const stars = [[48, -40, 7], [70, 6, 5], [40, 48, 6], [-4, -6, 4], [62, -70, 3]];
    stars.forEach(([x, y, r], i) => { if (i < 3 + (h % 3)) s += `<path d="M${x} ${y - r * 2} L${x + r * .5} ${y - r * .5} L${x + r * 2} ${y} L${x + r * .5} ${y + r * .5} L${x} ${y + r * 2} L${x - r * .5} ${y + r * .5} L${x - r * 2} ${y} L${x - r * .5} ${y - r * .5} Z" fill="${c.b}"/>`; });
    return s + '</g>' + ((h >> 3) % 2 ? `<path d="M-80 70 Q-40 54 0 70 T80 70" fill="none" stroke="${c.b}" stroke-width="1.4" opacity=".6"/>` : `<circle r="94" fill="none" stroke="${c.a}" stroke-width=".8" stroke-dasharray="2 8"/>`);
  },
  palm(c, h) {
    let s = `<path d="M${h % 2 ? 6 : -6} 70 Q0 10 6 -36" fill="none" stroke="${c.a}" stroke-width="3"/>`;
    for (let i = 0; i < 7; i++) { const a = -170 + i * 27; s += `<path d="M6 -36 Q${(6 + Math.cos(R(a)) * 40).toFixed(1)} ${(-46 + Math.sin(R(a)) * 30).toFixed(1)} ${(6 + Math.cos(R(a)) * 70).toFixed(1)} ${(-36 + Math.sin(R(a)) * 50 + 30).toFixed(1)}" fill="none" stroke="${c.b}" stroke-width="3" stroke-linecap="round"/>`; }
    if ((h >> 3) % 2) s += `<path d="M-40 70 Q-46 30 -40 0" fill="none" stroke="${c.a}" stroke-width="2.4"/><path d="M-40 0 Q-60 -10 -76 4 M-40 0 Q-20 -12 -6 2 M-40 0 Q-44 -20 -56 -26" fill="none" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round"/>`;
    if ((h >> 4) % 2) s += `<path d="M44 52 H76 L70 60 H50 Z M60 52 V30 L72 48 Z" fill="${c.a}" fill-opacity=".4" stroke="${c.a}" stroke-width="1.2"/>`;
    return s + `<circle cx="-50" cy="-56" r="18" fill="${c.a}" fill-opacity=".3" stroke="${c.a}" stroke-width="1.4"/><path d="M-90 70 Q-60 56 -30 70 T30 70 T90 70 M-90 84 Q-60 70 -30 84 T30 84 T90 84" fill="none" stroke="${c.a}" stroke-width="1.8"/>`;
  },
  peaks(c, h) {
    return `<circle cx="${h % 2 ? 40 : -40}" cy="-40" r="20" fill="${c.a}" fill-opacity=".28" stroke="${c.a}" stroke-width="1.4"/>` +
      `<path d="M-92 60 L-40 -20 L-8 26 L24 -44 L92 60 Z" fill="${c.b}" fill-opacity=".16" stroke="${c.b}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M14 -28 L24 -44 L34 -28 L28 -22 L22 -30 Z" fill="${c.a}"/><path d="M-96 60 H96" stroke="${c.a}" stroke-width="2"/>`;
  },
  blossom(c, h) {
    let s = `<path d="M-90 60 Q-30 40 0 0 Q30 -40 88 -60" fill="none" stroke="${c.b}" stroke-width="3" stroke-linecap="round"/><path d="M-20 22 Q-30 -2 -12 -20 M30 -30 Q48 -50 70 -40" fill="none" stroke="${c.b}" stroke-width="2"/>`;
    const pts = [[-50, 40], [-12, -20], [24, -12], [64, -48], [-70, 52], [46, -44]].slice(0, 4 + (h % 3));
    const pn = 5 + (h >> 4) % 2;
    pts.forEach(([x, y]) => { for (let i = 0; i < pn; i++) s += `<ellipse cx="${x}" cy="${y - 8}" rx="5" ry="9" transform="rotate(${i * 360 / pn} ${x} ${y})" fill="${c.a}" fill-opacity=".45" stroke="${c.a}" stroke-width="1"/>`; s += `<circle cx="${x}" cy="${y}" r="3" fill="${c.b}"/>`; });
    return (h >> 5) % 2 ? `<g transform="scale(-1 1)">${s}</g>` : s;
  },
  pearls(c, h) {
    let s = '';
    for (let i = 0; i <= 16; i++) { const t = i / 16, x = -86 + t * 172, y = -30 + Math.sin(t * Math.PI) * 64; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 4 === 0 ? 6 : 4}" fill="${c.a}" fill-opacity=".35" stroke="${c.a}" stroke-width="1.2"/>`; }
    return s + `<path d="M0 34 L12 52 L0 76 L-12 52 Z" fill="${c.b}" fill-opacity=".3" stroke="${c.b}" stroke-width="1.6"/><circle cy="${h % 2 ? 86 : 84}" r="5" fill="${c.a}"/>`;
  },
  compass(c, h) {
    return `<circle r="76" fill="none" stroke="${c.a}" stroke-width="1.6"/><circle r="66" fill="none" stroke="${c.a}" stroke-width=".8" stroke-dasharray="3 5"/>` +
      `<path d="M0 -88 L12 -12 L0 0 L-12 -12 Z M0 88 L-12 12 L0 0 L12 12 Z" fill="${c.a}" fill-opacity=".6" stroke="${c.a}"/>` +
      `<path d="M-88 0 L-12 12 L0 0 L-12 -12 Z M88 0 L12 -12 L0 0 L12 12 Z" fill="${c.b}" fill-opacity=".4" stroke="${c.b}"/><circle r="6" fill="${c.a}"/>`;
  },
  monogram(c, h) {
    const sides = 6 + (h % 3) * 2; let pts = '';
    for (let i = 0; i < sides; i++) { const a = R(i * 360 / sides - 90); pts += `${(Math.cos(a) * 78).toFixed(1)},${(Math.sin(a) * 78).toFixed(1)} `; }
    return `<polygon points="${pts}" fill="none" stroke="${c.a}" stroke-width="1.6"/><circle r="58" fill="${c.b}" fill-opacity=".1" stroke="${c.a}" stroke-width="1"/>` +
      `<path d="M-30 -30 L30 30 M30 -30 L-30 30" stroke="${c.a}" stroke-width="1" opacity=".45"/><path d="M-20 0 Q0 -24 20 0 Q0 24 -20 0 Z" fill="${c.a}" fill-opacity=".5" stroke="${c.a}"/>`;
  },
  dunes(c, h) {
    return `<circle cx="${h % 2 ? -30 : 30}" cy="-30" r="26" fill="${c.a}" fill-opacity=".3" stroke="${c.a}" stroke-width="1.4"/>` +
      `<path d="M-96 40 Q-50 4 -6 34 T96 24 V70 H-96 Z" fill="${c.b}" fill-opacity=".2" stroke="${c.b}" stroke-width="2"/><path d="M-96 64 Q-30 40 30 62 T96 56" fill="none" stroke="${c.a}" stroke-width="1.6"/>`;
  },
  heart(c, h) {
    return `<path d="M0 64 C-80 10 -70 -56 -22 -56 C-6 -56 0 -42 0 -34 C0 -42 6 -56 22 -56 C70 -56 80 10 0 64 Z" fill="${c.a}" fill-opacity=".16" stroke="${c.a}" stroke-width="1.8"/>` +
      `<path d="M0 40 C-46 8 -40 -32 -14 -32 C-4 -32 0 -24 0 -18 C0 -24 4 -32 14 -32 C40 -32 46 8 0 40 Z" fill="none" stroke="${c.b}" stroke-width="1.2" stroke-dasharray="${h % 2 ? '3 4' : '0'}"/>`;
  }
};
const THEMES = [
  [/kanchipuram|tanjore|chettinad|temple/, 'gopuram'],
  [/kutch|mirror/, 'mirror'],
  [/palace|maharaja|royal|regal|imperial|durbar|colonnade|court|jaipur|udaipur|nawab|banarasi|tanjore|chettinad/, 'palace'],
  [/lotus|kalamkari|pond|lake/, 'lotus'],
  [/moon|midnight|starlight|noir|black tie|cinematic/, 'moon'],
  [/beach|coastal|goa|tropical|ocean|sunset|paradise/, 'palm'],
  [/mountain/, 'peaks'], [/desert|dune/, 'dunes'],
  [/deco|gatsby|editorial|vogue|grid|letterpress/, 'fan'],
  [/blossom|cherry|sakura|wildflower|watercolor|pastel|garden|bathukamma|kashmir|coorg/, 'blossom'],
  [/pearl|champagne|golden|gold/, 'pearls'],
  [/voyage|destination|european|escape/, 'compass'],
  [/monogram|minimal|modern|type|digital|gen z|story/, 'monogram'],
  [/love|romance|heart|blush|rose/, 'heart'],
  [/floral|peony|rosewater|botanical|kutch|mirror|shehnai|sangeet|mehendi|haldi|traditional|wedding|celebration/, 'rosette']
];
/* Shapes already used (colour ignored), so no two drawn motifs share a drawing. */
const usedShapes = new Set();
function drawnMotif(t) {
  const key = (t.name + ' ' + t.keywords).toLowerCase();
  const kind = (THEMES.find(([re]) => re.test(key)) || [0, 'laurel'])[1];
  const c = { a: t.colors.secondary, b: t.colors.primary };
  let body = '';
  for (let i = 0; i < 64; i++) {
    body = DRAW[kind](c, hash(t.slug + (i ? ':' + i : '')));
    const shape = kind + body.replace(/#[0-9A-Fa-f]{6}/g, 'C');
    if (!usedShapes.has(shape)) { usedShapes.add(shape); break; }
  }
  return { kind, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-104 -104 208 208">${body}</svg>` };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const templates = loadTemplates();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const report = { extracted: 0, drawn: {} };
  for (const t of templates) {
    const src = path.join(ROOT, 'images', 'templates', t.slug + '.svg');
    const svg = fs.existsSync(src) ? fs.readFileSync(src, 'utf8') : '';
    let out = null;
    if (svg.includes('<g id="mo">')) {
      const defs = (svg.match(/<defs>[\s\S]*?<\/defs>/g) || []).join('');
      const doc = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${defs}<use id="u" href="#mo" xlink:href="#mo"/></svg>`;
      await page.setContent(doc);
      const b = await page.evaluate(() => { const r = document.getElementById('u').getBBox(); return [r.x, r.y, r.width, r.height]; });
      if (b[2] > 1 && b[3] > 1) {
        const pad = Math.max(b[2], b[3]) * 0.04;
        out = doc.replace('<svg ', `<svg viewBox="${(b[0] - pad).toFixed(1)} ${(b[1] - pad).toFixed(1)} ${(b[2] + pad * 2).toFixed(1)} ${(b[3] + pad * 2).toFixed(1)}" `).replace(' id="u"', '');
        report.extracted++;
      }
    }
    if (!out) { const d = drawnMotif(t); out = d.svg; report.drawn[d.kind] = (report.drawn[d.kind] || 0) + 1; }
    fs.writeFileSync(path.join(OUT, t.slug + '.svg'), out);
  }
  await browser.close();
  console.log('motifs:', templates.length, JSON.stringify(report));
})();
