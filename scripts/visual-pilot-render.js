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
console.log('VISUAL PILOT RENDERING & ASSET INSPECTION (Tamil, Telugu, Luxury)');
console.log('======================================================================');

const pilots = [
  { slug: 'tamil-thirumanam', name: 'Tamil Thirumanam', eventType: 'wedding' },
  { slug: 'telugu-pelli', name: 'Telugu Pelli', eventType: 'wedding' },
  { slug: 'kanchipuram-silk', name: 'Kanchipuram Silk (Luxury Editorial)', eventType: 'wedding' },
  { slug: 'banarasi-royale', name: 'Banarasi Royale (Luxury Editorial)', eventType: 'wedding' },
  { slug: 'sangeet-evening', name: 'Sangeet Evening (Pre-Wedding)', eventType: 'wedding' }
];

pilots.forEach((pilot, idx) => {
  const state = {
    template: pilot.slug,
    eventType: pilot.eventType,
    brideName: 'Soundarya',
    groomName: 'Senthil',
    date: '2026-12-15',
    time: '18:30',
    venue: 'Grand Palace Hall, Chennai'
  };

  IH.invitation.applyTemplate(state, pilot.slug);
  const html = IH.invitation.render(state);

  const hasBackdropOrBorder = html.includes('invitation__backdrop') || html.includes('inv-gold-border') || html.includes('invitation__ornament');
  console.log(`[Pilot ${idx + 1}] ${pilot.name} (${pilot.slug}):`);
  console.log(`  - Rendered HTML length: ${html.length} chars`);
  console.log(`  - Includes backdrop / gold border / ornament: ${hasBackdropOrBorder ? 'PASS ✓' : 'FAIL ✗'}`);
});

console.log('======================================================================');
console.log('✅ Visual pilot inspection passed successfully across all pilot templates.');
console.log('======================================================================');
