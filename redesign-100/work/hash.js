/* SHA-256 of every original project file (excludes redesign-100/ and node_modules/). */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const SKIP = new Set(['redesign-100', 'node_modules', '.git']);
const out = {};
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (d === ROOT && SKIP.has(e.name)) continue;
    if (e.isDirectory()) walk(p); else out[path.relative(ROOT, p).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  }
})(ROOT);
const dest = path.join(__dirname, process.argv[2] || 'hashes-before.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 0));
console.log(Object.keys(out).length, 'files ->', path.basename(dest));
