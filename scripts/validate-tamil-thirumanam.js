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
console.log('TAMIL THIRUMANAM REGIONAL INVITATION VALIDATION');
console.log('======================================================================');

// 1. JS & CSS Syntax Validations
let previewValid = false;
let dataValid = false;
let exportValid = false;

try {
  new Function(previewCode);
  previewValid = true;
  console.log('1. js/preview.js syntax: VALID ✓');
} catch (e) {
  console.error('1. js/preview.js syntax: ERROR ✗', e.message);
}

try {
  new Function(dataCode);
  dataValid = true;
  console.log('2. js/templates.js syntax: VALID ✓');
} catch (e) {
  console.error('2. js/templates.js syntax: ERROR ✗', e.message);
}

try {
  new Function(exportCode);
  exportValid = true;
  console.log('3. js/export.js syntax: VALID ✓');
} catch (e) {
  console.error('3. js/export.js syntax: ERROR ✗', e.message);
}

// 2. Catalogue dynamic execution & metadata check
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

const tamilTpl = IH.data.getTemplate('tamil-thirumanam');
console.log('4. Template Metadata:');
console.log('   - Tamil Thirumanam found:', !!tamilTpl ? 'PASS ✓' : 'FAIL ✗');
console.log('   - Uses kolam motif:', tamilTpl && tamilTpl.motif === 'kolam' ? 'PASS ✓' : 'FAIL ✗');

// 3. Live DOM dynamic preview rendering
const renderedTamilHtml = IH.invitation.render({
  template: 'tamil-thirumanam',
  eventType: 'wedding',
  brideName: 'Soundarya',
  groomName: 'Senthil Kumar',
  date: '2026-12-15',
  time: '09:30',
  venue: 'Sri Meenakshi Sundareswarar Thirumana Mandapam, Madurai',
  haldiEnabled: true, mehndiEnabled: true, ceremonyEnabled: true, receptionEnabled: true
});

const rendersCoupleNames = renderedTamilHtml.includes('Soundarya') && renderedTamilHtml.includes('Senthil Kumar');
const rendersTamilColors = renderedTamilHtml.includes('#F8F2E4') || renderedTamilHtml.includes('#762D3A') || renderedTamilHtml.includes('#C49A45') || renderedTamilHtml.includes('#7A1428') || renderedTamilHtml.includes('#F3D082') || renderedTamilHtml.includes('#FFF3DE');
/* Shared regional layout (same as Telugu Pelli) with the Tamil asset folder, Tamil blessing words and Tamil-script names. */
const rendersBackdrop = renderedTamilHtml.includes('invitation__backdrop--tamil-thirumanam') && renderedTamilHtml.includes('inv-layer--tp-toran') &&
  renderedTamilHtml.includes('images/invitation-assets/tamil-thirumanam/tp-') && renderedTamilHtml.includes('சுபமஸ்து') &&
  !renderedTamilHtml.includes('invitation--tpl-tamil-thirumanam');
const assetDir = path.join(__dirname, '..', 'images', 'invitation-assets', 'tamil-thirumanam');
const missingAssets = (renderedTamilHtml.match(/invitation-assets\/tamil-thirumanam\/[^'")]+/g) || [])
  .map(s => s.split('/').pop()).filter((v, i, a) => a.indexOf(v) === i).filter(f => !fs.existsSync(path.join(assetDir, f)));
if (missingAssets.length) console.error('   ✗ Missing Tamil assets:', missingAssets.join(', '));

// Check CSS rules in style.css and export.js
const cssHasRules = cssCode.includes('.invitation.invitation--regional') && cssCode.includes('.invitation__backdrop--regional');
const exportHasRules = exportCode.includes('.invitation.invitation--regional') && exportCode.includes('.site-host--regional');

console.log('5. Tamil Thirumanam Classic Invitation Verification:');
console.log('   - Renders couple names correctly:', rendersCoupleNames ? 'PASS ✓' : 'FAIL ✗');
console.log('   - Applies Tamil Thirumanam palette style vars:', rendersTamilColors ? 'PASS ✓' : 'FAIL ✗');
console.log('   - Renders regional layered backdrop + Tamil words/names:', rendersBackdrop ? 'PASS ✓' : 'FAIL ✗');
console.log('   - All referenced Tamil images exist on disk:', missingAssets.length ? 'FAIL ✗' : 'PASS ✓');
console.log('   - style.css contains classic rules:', cssHasRules ? 'PASS ✓' : 'FAIL ✗');
console.log('   - export.js contains classic rules:', exportHasRules ? 'PASS ✓' : 'FAIL ✗');

const allPassed = previewValid && dataValid && exportValid && !!tamilTpl &&
                  tamilTpl.motif === 'kolam' && rendersCoupleNames && rendersTamilColors &&
                  rendersBackdrop && !missingAssets.length && cssHasRules && exportHasRules;

console.log('======================================================================');
console.log('OVERALL STATUS:', allPassed ? 'ALL VERIFICATIONS PASSED ✓' : 'FAIL ✗');
console.log('======================================================================');
process.exit(allPassed ? 0 : 1);
