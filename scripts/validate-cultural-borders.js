const fs = require('fs');
const path = require('path');

const previewPath = path.join(__dirname, '..', 'js', 'preview.js');
const dataPath = path.join(__dirname, '..', 'js', 'templates.js');
const exportPath = path.join(__dirname, '..', 'js', 'export.js');
const cssPath = path.join(__dirname, '..', 'css', 'style.css');

const previewCode = fs.readFileSync(previewPath, 'utf8');
const dataCode = fs.readFileSync(dataPath, 'utf8');
const exportCode = fs.readFileSync(exportPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

console.log('======================================================================');
console.log('5 CULTURAL WEDDING BORDERS & CATALOGUE INTEGRITY TEST');
console.log('======================================================================');

// 1. Syntax Validations
try {
  new Function(previewCode);
  console.log('1. js/preview.js syntax: VALID ✓');
} catch (e) {
  console.error('1. js/preview.js syntax: ERROR ✗', e.message);
  process.exit(1);
}

try {
  new Function(dataCode);
  console.log('2. js/templates.js syntax: VALID ✓');
} catch (e) {
  console.error('2. js/templates.js syntax: ERROR ✗', e.message);
  process.exit(1);
}

try {
  new Function(exportCode);
  console.log('3. js/export.js syntax: VALID ✓');
} catch (e) {
  console.error('3. js/export.js syntax: ERROR ✗', e.message);
  process.exit(1);
}

// 2. Setup mock environment
global.window = global;
global.document = {
  documentElement: {},
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.IH = {
  store: { get: () => [], set: () => {} },
  dom: {
    qs: () => null,
    qsa: () => [],
    on: () => {},
    el: () => ({ setAttribute: () => {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }),
    escapeHtml: (s) => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '')
  },
  icon: (name, size) => `<svg class="icon icon--${name}" width="${size || 20}" height="${size || 20}"></svg>`
};

eval(dataCode);
eval(previewCode);
eval(exportCode);

const totalTemplates = IH.data.templates.length;
const totalWeddings = IH.data.templates.filter(t => t.category === 'wedding').length;

console.log('4. Catalogue Metrics:');
console.log('   - Total templates:', totalTemplates, totalTemplates >= 796 ? '✓ (' + totalTemplates + ')' : '✗');
console.log('   - Total wedding templates:', totalWeddings, totalWeddings >= 150 ? '✓ (' + totalWeddings + ')' : '✗');

const targetTemplates = [
  { slug: 'tamil-thirumanam', name: 'Tamil Thirumanam', culture: 'Tamil Traditional' },
  { slug: 'telugu-pelli', name: 'Telugu Pelli', culture: 'Telugu Traditional' },
  { slug: 'kasavu-gold-border', name: 'Kasavu Gold Border', culture: 'Kerala Kasavu' },
  { slug: 'bengali-alpona', name: 'Bengali Alpona', culture: 'Bengali Alpona' },
  { slug: 'bandhani-bloom', name: 'Bandhani Bloom', culture: 'Bandhani Festive' }
];

let allFound = true;
let allRendered = true;

targetTemplates.forEach(t => {
  const tpl = IH.data.getTemplate(t.slug);
  if (!tpl) {
    console.error(`   - Missing template: ${t.slug} ✗`);
    allFound = false;
    return;
  }
  console.log(`   - Template found: ${tpl.name} (${tpl.slug}) - Category: ${tpl.category} ✓`);

  const rendered = IH.invitation.render({
    template: t.slug,
    eventType: 'wedding',
    brideName: 'Ananya',
    groomName: 'Aditya',
    date: '2026-11-28',
    time: '19:00',
    venue: 'Royal Palace Grand Ballroom'
  });

  const hasClass = rendered.includes(`invitation--tpl-${t.slug}`);
  const hasNames = rendered.includes('Ananya') && rendered.includes('Aditya');
  if (!hasClass || !hasNames) {
    console.error(`   - Render error for ${t.slug} ✗`);
    allRendered = false;
  } else {
    console.log(`   - Render verified: ${t.slug} includes .invitation--tpl-${t.slug} and couple names ✓`);
  }
});

console.log('======================================================================');
console.log('STATUS:', allFound && allRendered && totalTemplates >= 796 && totalWeddings >= 150 ? 'ALL METRICS PASS ✓' : 'FAIL ✗');
console.log('======================================================================');
