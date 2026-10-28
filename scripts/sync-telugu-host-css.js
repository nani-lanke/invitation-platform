/* Copies css/telugu-pelli-host.css into js/export.js (host-page stylesheet)
   between the BEGIN/END Telugu Pelli host page markers.
   Usage: node scripts/sync-telugu-host-css.js */
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const f = 'js/export.js';
let lines = fs.readFileSync(f, 'utf8').split('\n');
const BEGIN = "      /* BEGIN Telugu Pelli host page (lake palace) */";
const END = "      /* END Telugu Pelli host page */";
// Drop the old 14-layer hero / landscape rules (Telugu only) and any earlier copy of this block.
const drop = /^\s*'\.site-host--telugu-pelli \.site-hero-layer--|^\s*'\.site-landscape__(lake|temple-left|temple-right|elephant-left|elephant-right|lotus)\{|^\s*'\.site-landscape--telugu-pelli/;
const b = lines.indexOf(BEGIN), e = lines.indexOf(END);
if (b >= 0 && e > b) lines.splice(b, e - b + 1);
const before = lines.length;
lines = lines.filter(l => !drop.test(l));
console.log('removed', before - lines.length);
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'telugu-pelli-host.css'), 'utf8').trim().split('\n')
  .map(l => "      '" + l.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "',");
const hdr = lines.findIndex(l => l.includes('body.site-host--regional{'));
const mq = lines.findIndex((l, i) => i > hdr && l.includes("'/* Media Queries */',"));
if (hdr < 0 || mq < 0) throw new Error('anchor not found');
lines.splice(mq, 0, BEGIN, ...css, END);
fs.writeFileSync(f, lines.join('\n'));
console.log('inserted', css.length, 'rules at line', mq + 1);
