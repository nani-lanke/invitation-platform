/* Copies the "Telugu Pelli: lake palace layout" block at the end of
   css/style.css into js/export.js as minified strings, between the
   BEGIN/END marker comments, so the exported card matches Preview.
   Usage: node scripts/sync-telugu-export-css.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS = path.join(ROOT, 'css', 'style.css');
const EXPORT = path.join(ROOT, 'js', 'export.js');
const START = '/* ===== Telugu Pelli: lake palace layout';
const BEGIN = '      /* BEGIN Telugu Pelli lake palace (generated from css/style.css) */';
const END = '      /* END Telugu Pelli lake palace */';
const ANCHOR = "      '@media(prefers-reduced-motion:reduce){',";

const css = fs.readFileSync(CSS, 'utf8');
const at = css.indexOf(START);
if (at < 0) throw new Error('Telugu block not found in style.css');
const rules = css.slice(at)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};:,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .split('}').map(r => r.trim()).filter(Boolean).map(r => r + '}');
const lines = rules.map(r => "      '" + r.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "',");

let js = fs.readFileSync(EXPORT, 'utf8');
const block = [BEGIN, ...lines, END].join('\n') + '\n';
const b = js.indexOf(BEGIN), e = js.indexOf(END);
if (b >= 0 && e > b) {
  js = js.slice(0, b) + block + js.slice(e + END.length + 1);
} else {
  const a = js.indexOf(ANCHOR);
  if (a < 0) throw new Error('Insert anchor not found in export.js');
  js = js.slice(0, a) + block + js.slice(a);
}
fs.writeFileSync(EXPORT, js);
console.log('synced ' + rules.length + ' rules into js/export.js');
