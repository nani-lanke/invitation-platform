/* The backdrop cards' individual layers for scripts/generate-engagement-decor.js
   --set=backdrops (FLUX.2 Klein 4B): a top garland, a bottom cluster and a side
   vine per card, each a separate cut-out in the card's painted style, laid over
   the card's paper (paper.jpg from scripts/generate-backdrops.js).
   Built from scripts/backdrop-briefs.js: [crest (unused), decoration, venue]. */
const SRC = require('./backdrop-briefs');
const out = { STYLES: {} };
for (const [slug, r] of Object.entries(SRC)) {
  const look = r[2] === 'dark' ? 'in luxurious shining metallic gold foil with rich jewel tones' : 'in delicate soft hand painted watercolour';
  out[slug] = ['', r[6] + ', ' + look, r[7]];
  out.STYLES[slug] = 'backdrop';
}
out.LABEL = 'an invitation';
out.REAL = 'premium illustrated invitation card artwork, ultra fine detail, no text, no letters, no numbers, no watermark, no logo, no people';
out.FREE = ', the whole piece fully visible with a wide empty white margin on every side, not touching the edges of the image, no frame, no paper edge, ' + out.REAL + ', isolated on a plain pure white background';
out.PIECE_TEXT = {
  // Short and centred: a long garland tends to run off the canvas (edge-touch check).
  garland: f => 'A short horizontal decorative garland of ' + f + ', draping in a gentle downward curve, small and centred in the image, both ends free and well inside the image',
  cluster: f => 'A low wide compact decorative arrangement of ' + f + ', wider than tall, flat bottom, gently rounded top',
  vine: f => 'A tall slender vertical trailing vine of ' + f + ', from top to bottom, narrow'
};
out.EXTRA = [];
module.exports = out;
