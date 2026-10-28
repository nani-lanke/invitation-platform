/* Shared FLUX wording for the later occasion briefs (graduation ... community events).
   Each category file lists per card: [title 'Script|Caps', sample title, crest object,
   decoration for the frame pieces, venue scene (empty, no people)].
   build(rows, category, label, real) returns the module shape that
   scripts/generate-engagement-decor.js expects (brief = [crest, decoration, venue]),
   plus TITLES for scripts/build-occasion-rows.js.
   Never put numbers or words in a prompt: FLUX writes them out as garbled text. */
module.exports = function build(rows, category, label, real) {
  const out = { TITLES: {} };
  for (const [slug, r] of Object.entries(rows)) { out[slug] = [r[2], r[3], r[4]]; out.TITLES[slug] = [r[0], r[1]]; }
  try { out.STYLES = require('./occasion-styles')(category); } catch (e) { out.STYLES = {}; }
  out.LABEL = label;
  out.REAL = 'photorealistic, premium ' + real + ' photography, rich true colours, ultra fine detail, no text, no letters, no numbers, no watermark, no logo, no people';
  out.FREE = ', the whole arrangement fully visible with a wide empty white margin on every side, not touching the edges of the image, no vase, no table, no frame, ' + out.REAL + ', isolated on a plain pure white background';
  out.PIECE_TEXT = {
    bouquet: f => 'A small compact arrangement of ' + f + ', floating in the middle of the image, leaning slightly to the right, small in the frame',
    cluster: f => 'A low wide compact arrangement of ' + f + ', wider than tall, flat bottom, gently rounded top',
    garland: f => 'A long horizontal garland of ' + f + ' draping in a gentle downward curve, both ends free and visible',
    wreath: f => 'A round wreath of ' + f + ' with a large empty white centre',
    vine: f => 'A tall slender vertical hanging strand of ' + f + ' from top to bottom, narrow'
  };
  out.EXTRA = ['crest'];
  return out;
};
