/* Writes the backdrop cards (scripts/backdrop-briefs.js) into
   js/templates.js (catalogue rows) and js/wedding-designs.js (BACKDROP_ROWS),
   each between its BACKDROP_ROWS markers. The card colours follow the paper
   colour measured from each generated background
   (images/backdrops/manifest.json, written by scripts/generate-backdrops.js);
   before the art exists a colour per paper word is used.
   Usage: node scripts/build-backdrop-rows.js */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const B = require('./backdrop-briefs');
const MF = path.join(ROOT, 'images', 'backdrops', 'manifest.json');
const mf = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, 'utf8')) : {};
const START = '/* BACKDROP_ROWS START */', END = '/* BACKDROP_ROWS END */';

const PAPER = [[/navy/, '#0F1B33'], [/emerald/, '#0E2A1E'], [/black/, '#141210'], [/plum/, '#2A1436'], [/maroon/, '#4A0E1E'], [/teal/, '#0E2E34'],
  [/purple/, '#22103A'], [/espresso/, '#2E1B0E'], [/chalkboard/, '#1F3328'], [/blush/, '#FBEFF0'], [/lavender/, '#F3EEF8'], [/sky/, '#EEF5FB'],
  [/mint/, '#EEF7F1'], [/sage/, '#EEF2EA'], [/champagne/, '#F8F0E3'], [/ivory/, '#FBF7EE'], [/white/, '#FAFAF7'], [/./, '#FBF6EE']];
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))).toString(16).padStart(2, '0')).join('').toUpperCase(); }
const q = s => JSON.stringify(s);

const tplRows = [], engRows = [];
for (const [slug, r] of Object.entries(B)) {
  const [name, cat, tone, paper, title, extra, border] = r;
  const bg = (mf[slug] && mf[slug].paper) || PAPER.find(([re]) => re.test(paper))[1];
  const dark = tone === 'dark';
  const ink = dark ? '#F6E7C8' : '#3A2A20', primary = dark ? '#F1D69A' : '#6E3A2A', secondary = dark ? '#C9A24D' : '#A8803A';
  const blurb = 'A painted FLUX border of ' + border.split(',')[0] + ' around a plain ' + paper + ' centre.';
  tplRows.push('    [' + [name, slug, cat, 'premium', bg, shade(bg, dark ? 1.18 : 0.96), ink, primary, secondary, dark ? 'sparkle' : 'floral'].map(q).join(', ') +
    ', ' + (80 + hash(slug) % 12) + ',"2026-10-26", ' + q(blurb) + ', ' + q(cat.replace(/-/g, ' ') + ' backdrop painted watercolour ' + paper) + '],');
  const h = hash(slug);
  const font = (dark ? [1, 4, 6, 7, 0] : cat === 'birthday' && extra && extra[1] === 'kid' ? [8, 9] : [0, 3, 5, 2, 6])[h % (dark ? 5 : cat === 'birthday' && extra && extra[1] === 'kid' ? 2 : 5)];
  engRows.push('    [' + [q(slug), q(cat), font, q(['stack', 'medallion'][(h >>> 5) % 2]), q(['flourish', 'rules', 'caps', 'diamond'][(h >>> 9) % 4]), q(title), JSON.stringify(extra)].join(', ') + ']');
}

function splice(file, text, indent) {
  let src = fs.readFileSync(file, 'utf8');
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a < 0 || b < 0 || src.indexOf(START, a + 1) >= 0) throw new Error('BACKDROP_ROWS markers missing or duplicated in ' + file);
  src = src.slice(0, a + START.length) + '\n' + text + '\n' + indent + src.slice(b);
  fs.writeFileSync(file, src);
}
splice(path.join(ROOT, 'js', 'templates.js'), tplRows.join('\n'), '    ');
splice(path.join(ROOT, 'js', 'wedding-designs.js'), engRows.join(',\n'), '    ');
console.log('backdrop rows written:', tplRows.length, '(measured colours:', Object.keys(mf).filter(s => mf[s].paper).length + ')');
