const fs = require('fs');
const path = require('path');

const previewPath = path.join(__dirname, '..', 'js', 'preview.js');
const dataPath = path.join(__dirname, '..', 'js', 'templates.js');
const exportPath = path.join(__dirname, '..', 'js', 'export.js');
const cssPath = path.join(__dirname, '..', 'css', 'style.css');
const assetsDir = path.join(__dirname, '..', 'images', 'invitation-assets', 'telugu-pelli');

const previewCode = fs.readFileSync(previewPath, 'utf8');
const dataCode = fs.readFileSync(dataPath, 'utf8');
const exportCode = fs.readFileSync(exportPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

console.log('======================================================================');
console.log('TELUGU PELLI LAKE PALACE LAYERED DECORATION VALIDATION');
console.log('======================================================================');

// 1. Check every PNG the lake-palace card uses exists (backdrop + content)
const requiredAssets = [
  'tp-pillar-cap.png',
  'tp-pillar-shaft.png',
  'tp-pillar-base.png',
  'tp-canopy-corner.png',
  'tp-toran.png',
  'tp-jasmine-string.png',
  'tp-banana-plant.png',
  'bells-left.png',
  'bells-right.png',
  'tp-foliage-bottom.png',
  'tp-elephant.png',
  'tp-lake-temple.png',
  'tp-ganesha.png',
  'tp-sprig.png',
  'tp-divider.png',
  'tp-temple-side.png',
  'tp-venue-default.jpg',
  'tp-icon-haldi.png',
  'tp-icon-gorintaku.png',
  'tp-icon-mangalsutra.png',
  'tp-icon-kalasam.png'
];

let assetsValid = true;
console.log('1. Checking ' + requiredAssets.length + ' PNG Assets on Disk:');
requiredAssets.forEach(file => {
  const filePath = file.includes('/') ? path.join(__dirname, '..', 'images', file) : path.join(assetsDir, file);
  const exists = fs.existsSync(filePath);
  if (!exists) {
    assetsValid = false;
    console.error(`   ✗ Missing: ${file}`);
  } else {
    const stat = fs.statSync(filePath);
    console.log(`   ✓ Found: ${file} (${stat.size} bytes)`);
  }
});

// 2. JS Syntax Validations
let previewValid = false;
let dataValid = false;
let exportValid = false;

try {
  new Function(previewCode);
  previewValid = true;
  console.log('2. js/preview.js syntax: VALID ✓');
} catch (e) {
  console.error('2. js/preview.js syntax: ERROR ✗', e.message);
}

try {
  new Function(dataCode);
  dataValid = true;
  console.log('3. js/templates.js syntax: VALID ✓');
} catch (e) {
  console.error('3. js/templates.js syntax: ERROR ✗', e.message);
}

try {
  new Function(exportCode);
  exportValid = true;
  console.log('4. js/export.js syntax: VALID ✓');
} catch (e) {
  console.error('4. js/export.js syntax: ERROR ✗', e.message);
}

// 3. Catalogue dynamic execution & metadata check
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
  store: {
    get: () => [],
    set: () => {}
  },
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

const teluguTpl = IH.data.getTemplate('telugu-pelli');
console.log('5. Template Metadata:');
console.log('   - Telugu Pelli found:', !!teluguTpl ? 'PASS ✓' : 'FAIL ✗');

// 4. Live DOM dynamic preview rendering
const renderedTeluguHtml = IH.invitation.render({
  template: 'telugu-pelli',
  eventType: 'wedding',
  brideName: 'Sowmya Reddy',
  groomName: 'Karthik Varma',
  date: '2026-11-28',
  time: '19:00',
  venue: 'Sri Venkateswara Kalyana Mandapam, Hyderabad',
  haldiEnabled: true, mehndiEnabled: true, ceremonyEnabled: true, receptionEnabled: true
});

const rendersCoupleNames = renderedTeluguHtml.includes('Sowmya Reddy') && renderedTeluguHtml.includes('Karthik Varma');
const rendersTeluguColors = renderedTeluguHtml.includes('#FAF5EC') && renderedTeluguHtml.includes('#F5EADB');

// Check every layer / content image is referenced in the rendered HTML
let allLayersRendered = true;
requiredAssets.forEach(asset => {
  const assetPath = asset.includes('/') ? `images/${asset}` : `images/invitation-assets/telugu-pelli/${asset}`;
  const rendered = renderedTeluguHtml.includes(assetPath);
  if (!rendered) {
    allLayersRendered = false;
    console.error(`   ✗ Missing layer in DOM: ${asset}`);
  }
});

// Check CSS rules in style.css and export.js
const layerClassNames = ['.inv-layer--tp-arch', '.inv-layer--tp-pillar']
  .concat(IH.invitation.TELUGU_PELLI_ASSETS.map(a => '.inv-layer--' + a.id))
  .concat(['.tp-palace--left', '.tp-palace--right', '.tp-crest__img', '.tp-event__icon']);

const cssHasBackdrop = cssCode.includes('.invitation__backdrop--telugu-pelli');
const exportHasBackdrop = exportCode.includes('.invitation__backdrop--telugu-pelli');
const cssHasAllLayers = layerClassNames.every(className => {
  return cssCode.includes(className) && exportCode.includes(className);
});

console.log('6. Telugu Pelli Live DOM & CSS Verification:');
console.log('   - Renders couple names correctly:', rendersCoupleNames ? 'PASS ✓' : 'FAIL ✗');
console.log('   - Applies Telugu Pelli palette style vars:', rendersTeluguColors ? 'PASS ✓' : 'FAIL ✗');
console.log('   - All PNG layer images rendered in DOM:', allLayersRendered ? 'PASS ✓' : 'FAIL ✗');
console.log('   - style.css contains all layer rules:', (cssHasBackdrop && cssHasAllLayers) ? 'PASS ✓' : 'FAIL ✗');
console.log('   - export.js contains all layer rules for standalone export:', (exportHasBackdrop && cssHasAllLayers) ? 'PASS ✓' : 'FAIL ✗');

const allPassed = assetsValid && previewValid && dataValid && exportValid && !!teluguTpl &&
                  rendersCoupleNames && rendersTeluguColors && allLayersRendered &&
                  cssHasBackdrop && exportHasBackdrop && cssHasAllLayers;

console.log('======================================================================');
console.log('OVERALL STATUS:', allPassed ? 'ALL VERIFICATIONS PASSED ✓' : 'FAIL ✗');
console.log('======================================================================');
process.exit(allPassed ? 0 : 1);
