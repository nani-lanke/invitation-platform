/* Copies css/wedding-host.css into js/export.js (hosted-page stylesheet)
   between the BEGIN/END wedding design engine host markers, right after the
   Telugu Pelli host block. Usage: node scripts/sync-wedding-host-css.js */
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const f = 'js/export.js';
let lines = fs.readFileSync(f, 'utf8').split('\n');
const BEGIN = "      /* BEGIN wedding design engine host (generated from css/wedding-host.css) */";
const END = "      /* END wedding design engine host */";
const b = lines.indexOf(BEGIN), e = lines.indexOf(END);
if (b >= 0 && e > b) lines.splice(b, e - b + 1);
const css = fs.readFileSync('css/wedding-host.css', 'utf8').trim().split('\n')
  .filter(l => !/^\/\*|^   /.test(l))
  .map(l => "      '" + l.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "',");
const anchor = lines.indexOf("      /* END Telugu Pelli host page */");
if (anchor < 0) throw new Error('anchor not found');
lines.splice(anchor + 1, 0, BEGIN, ...css, END);
fs.writeFileSync(f, lines.join('\n'));
console.log('inserted', css.length, 'rules');
