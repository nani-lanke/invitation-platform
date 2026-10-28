/* Decoration style per card, read from OCCASION_ROWS in js/wedding-designs.js
   (so the briefs files never drift from the engine). */
const fs = require('fs'), path = require('path');
module.exports = function stylesFor(category) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'wedding-designs.js'), 'utf8');
  const start = src.indexOf("'" + category + "': [") >= 0 ? src.indexOf("'" + category + "': [") : src.indexOf(category + ': [');
  const block = src.slice(start, src.indexOf(']\n    ]', start) + 2);
  const out = {};
  for (const m of block.matchAll(/\['([a-z0-9-]+)', \d+, '[a-z]+', '[a-z]+', '[a-z]+', '[^']*', '([a-z]+)'/g)) out[m[1]] = m[2];
  return out;
};
