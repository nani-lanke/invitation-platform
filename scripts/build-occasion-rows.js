/* Writes the engine rows for the later occasions (graduation ... community
   events) into OCCASION_ROWS in js/wedding-designs.js, between the
   EVENT_ROWS markers. Titles and sample titles come from
   scripts/<category>-briefs.js; font, frame, date, heading and decoration
   style are picked from each template's palette and theme (seeded by slug,
   so reruns give the same rows). Usage: node scripts/build-occasion-rows.js */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CATS = ['graduation', 'retirement', 'farewell', 'corporate', 'festival', 'school-events', 'college-events', 'party', 'community-events'];
const FILE = path.join(ROOT, 'js', 'wedding-designs.js');
const START = '/* EVENT_ROWS START */', END = '/* EVENT_ROWS END */';

const tsrc = fs.readFileSync(path.join(ROOT, 'js', 'templates.js'), 'utf8');
const TPL = {};
for (const m of tsrc.matchAll(/\["([^"]+)", "([a-z0-9-]+)", "([a-z-]+)", "\w+", "(#\w{6})", "#\w+", "#\w+", "#\w+", "#\w+", "([\w-]+)", \d+,\s*"[\d-]+", "([^"]*)"(?:, "([^"]*)")?/g))
  TPL[m[2]] = { name: m[1], cat: m[3], bg: m[4], key: (m[1] + ' ' + m[5] + ' ' + m[6] + ' ' + (m[7] || '')).toLowerCase() };

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function lum(hex) { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; }
const pick = (list, h, s) => list[(h >>> s) % list.length];

const THEMES = [
  ['kids', /\bkids?\b|child|pajama|baby|carnival|cupcake|balloons?\b.*bright|multicolor/, { fonts: [8, 9], frames: ['beads', 'double', 'hairline'], styles: ['corners', 'garland', 'diagonal'] }],
  ['luxe', /gala|black|luxury|executive|investor|awards|cocktail|valedictorian|summa|honou?rs|commencement|champagne|coupe|cheers|leader|achievement|masquerade|elegant|royal|crown|candelabra|bow tie|bowtie|martini|dinner/, { dark: true, fonts: [1, 4, 6, 7, 0], frames: ['band', 'deco', 'double'], styles: ['luxury'] }],
  ['indian', /diya|diwali|deepavali|pongal|onam|navratri|garba|ganesh|ganpati|puja|rakhi|raksha|shiv|ram navami|durga|lakshmi|saraswati|basant|baisakhi|lohri|sankranti|kite|ugadi|gudi|vishu|bihu|chhath|akshaya|teej|mahavir|rath|dussehra|vijaya|karwa|janmashtami|marigold|mandala|rangoli|paisley|independence day assembly|tricolour|ashoka|cultural/, { fonts: [1, 6, 3, 5], frames: ['kolam', 'band', 'beads'], styles: ['garland', 'garland', 'luxury'] }],
  ['nature', /garden|tree|earth|environment|picnic|botanical|sprig|sage|relax|retreat|brunch|tea\b|teacup|sapling|planting|clean-up|recycl|walk|spring|nowruz|easter|blossom|floral|leaf|forest|pine/, { fonts: [0, 3, 5, 2], frames: ['vine', 'hairline', 'arch'], styles: ['vines', 'wreath', 'corners'] }],
  ['fun', /party|bash|confetti|balloon|disco|neon|holi|gulal|freshers|teen|fest\b|festival|dance|karaoke|music|game|movie|pool|beach|bbq|grill|halloween|pumpkin|retro|fun|fair|celebration/, { fonts: [2, 4, 9, 3], frames: ['hairline', 'double', 'beads', 'deco'], styles: ['diagonal', 'corners', 'garland'] }],
  ['formal', /./, { fonts: [1, 2, 4, 6, 7], frames: ['double', 'band', 'arch', 'hairline', 'deco'], styles: ['corners', 'wreath', 'diagonal', 'vines'] }]
];
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

const blocks = [];
for (const cat of CATS) {
  const B = require('./' + cat + '-briefs');
  let prev = {};
  const rows = Object.keys(B.TITLES).map(slug => {
    const t = TPL[slug] || { key: slug, bg: '#ffffff' };
    const dark = lum(t.bg) < 0.35, h = hash(slug);
    const th = THEMES.find(([, re, o]) => re.test(t.key + ' ' + slug.replace(/-/g, ' ')) && (!o.dark || dark))[2];
    let style = pick(th.styles, h, 3), frame = pick(th.frames, h, 7);
    if (style === prev.style && th.styles.length > 1) style = th.styles[(th.styles.indexOf(style) + 1) % th.styles.length];
    if (frame === prev.frame) frame = th.frames[(th.frames.indexOf(frame) + 1) % th.frames.length];
    prev = { style, frame };
    const font = pick(th.fonts, h, 11), date = pick(['stack', 'medallion'], h, 13), heading = pick(['flourish', 'rules', 'caps', 'diamond'], h, 15);
    const [title, sample] = B.TITLES[slug];
    return '      [' + [q(slug), font, q(frame), q(date), q(heading), q(title), q(style), q(sample)].join(', ') + ']';
  });
  blocks.push('    ' + (/-/.test(cat) ? q(cat) : cat) + ': [\n' + rows.join(',\n') + '\n    ]');
}

let src = fs.readFileSync(FILE, 'utf8');
const a = src.indexOf(START), b = src.indexOf(END);
if (a < 0 || b < 0 || src.indexOf(START, a + 1) >= 0) throw new Error('EVENT_ROWS markers missing or duplicated');
src = src.slice(0, a + START.length) + '\n' + blocks.join(',\n') + '\n    ' + src.slice(b);
fs.writeFileSync(FILE, src);
console.log('rows written:', CATS.map(c => c + ' ' + Object.keys(require('./' + c + '-briefs').TITLES).length).join(', '));
