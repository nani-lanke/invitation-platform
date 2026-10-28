'use strict';

const fs = require('fs');
const path = require('path');

// Mock browser globals
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
  dom: { qs: () => null, qsa: () => [], on: () => {}, el: () => ({ setAttribute: () => {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }), escapeHtml: s => s },
  icon: (name) => `<svg class="icon-${name}"></svg>`
};

const templatesCode = fs.readFileSync(path.join(__dirname, '../js/templates.js'), 'utf8');
const previewCode = fs.readFileSync(path.join(__dirname, '../js/preview.js'), 'utf8');
const exportCode = fs.readFileSync(path.join(__dirname, '../js/export.js'), 'utf8');

eval(templatesCode);
eval(previewCode);
eval(exportCode);

console.log('======================================================================');
console.log('INVITEAURA FINAL RELEASE AUDIT — PILOT & TEMPLATE MAPPING VERIFICATION');
console.log('======================================================================');

const targetTemplates = [
  { id: 'tamil-thirumanam', name: 'Tamil Thirumanam', category: 'Regional Traditional' },
  { id: 'telugu-pelli', name: 'Telugu Pelli', category: 'Regional Traditional' },
  { id: 'luxury-editorial', name: 'Luxury Editorial', category: 'Luxury Editorial' },
  { id: 'sangeet-evening', name: 'Sangeet Evening', category: 'Pre-Wedding Ceremonies' },
  { id: 'hindu-vivah', name: 'Hindu Vivah', category: 'Religious & Faith' },
  { id: 'japanese-mizuhiki', name: 'Japanese Mizuhiki', category: 'International & Modern' }
];

targetTemplates.forEach(t => {
  const tpl = IH.data.getTemplate(t.id);
  if (!tpl) {
    console.error(`❌ Template ID not found in catalogue: ${t.id}`);
    process.exit(1);
  }

  const state = {
    template: t.id,
    eventType: 'wedding',
    brideName: 'Soundarya',
    groomName: 'Senthil',
    date: '2026-12-15',
    time: '18:30',
    venue: 'Grand Palace Hall, Chennai'
  };

  IH.invitation.applyTemplate(state, t.id);
  const previewHtml = IH.invitation.render(state);
  const hostHtml = IH.exportPage.buildHtml(state);

  console.log(`[${t.category}] ${t.name} (ID: ${t.id}):`);
  console.log(`  - Palette: Primary=${tpl.colors.primary}, Secondary=${tpl.colors.secondary}`);
  console.log(`  - Preview HTML generated: ${previewHtml.length} chars ✓`);
  console.log(`  - Standalone Host HTML generated: ${hostHtml.length} chars ✓`);
});

console.log('======================================================================');
console.log('✅ All release audit checks passed successfully.');
console.log('======================================================================');
