/* Creative briefs for the baby shower cards on the wedding design engine.
   [crest object, decoration for the frame pieces, venue scene (empty, no people)]
   Used by scripts/generate-engagement-decor.js --set=baby-shower (FLUX.2 Klein 4B).
   Never put numbers or words in a prompt: FLUX writes them out as garbled text. */
module.exports = {
  'baby-dreams': ['a small fluffy white cloud with a tiny pale blue crescent moon', 'pale blue and white balloons with small fluffy white clouds', 'an empty pastel blue baby shower setup with cloud decor, white balloons and a dessert table'],
  'little-prince': ['a small gold prince crown with pale blue velvet and pearls', 'powder blue roses, white hydrangeas and small gold crowns', 'an empty powder blue and gold royal baby shower hall with drapes, a throne chair and a cake table'],
  'little-princess': ['a small sparkling rose gold princess tiara with pink jewels', 'blush pink roses, pink peonies and small gold stars', 'an empty blush pink princess baby shower setup with tulle drapes, roses and a cake table'],
  'cloud-nine': ['a fluffy lavender cloud with three small silver stars', 'lavender and lilac balloons with small fluffy clouds', 'an empty lavender baby shower lounge with cloud decor, lilac balloons and soft lights'],
  'little-miracle': ['a glowing pale gold crescent moon with tiny golden stars', 'lilac roses, soft white flowers and tiny gold stars', 'an empty celestial baby shower setup with lilac drapes, a moon backdrop and fairy lights'],
  'bundle-of-joy': ['a soft cream knitted baby blanket bundle tied with a blush bow', 'cream and blush roses with soft baby breath flowers', 'an empty warm cream and blush baby shower setup with a floral arch and a dessert table'],
  'twinkle-twinkle-little-one': ['a cluster of three plush honey yellow stars', 'honey yellow and sky blue star shaped balloons', 'an empty storybook baby shower setup with hanging yellow stars, sky blue drapes and a cake table'],
  'welcome-baby': ['a white porcelain stork carrying a small lilac bundle', 'lilac and purple hydrangeas with white roses', 'an empty elegant lilac baby shower hall with a floral arch and a welcome table'],
  'tiny-toes-big-dreams': ['a pair of tiny knitted sage green baby booties', 'sage green eucalyptus, white roses and small white flowers', 'an empty sage green baby shower garden setup with eucalyptus garlands and a dessert table'],
  'our-little-sunshine': ['a smiling plush sun toy with golden rays', 'sunflowers, yellow roses and small orange blooms', 'an empty sunny yellow baby shower garden party with sunflowers and a dessert table'],
  'baby-bliss': ['a small pale blue hot air balloon toy with a white basket', 'pale blue and blush balloons with small fluffy clouds', 'an empty dreamy pale blue baby shower setup with balloons, clouds and a cake table'],
  'once-upon-a-baby': ['a small rose pink storybook castle with turrets', 'dusty rose roses, wisteria and tiny gold stars', 'an empty fairytale baby shower setup with a castle backdrop, rose drapes and fairy lights'],
  'little-star': ['a glowing indigo and gold plush star', 'indigo and gold star shaped balloons with tiny sparkles', 'an empty starry indigo baby shower setup with hanging gold stars and soft lights'],
  'sweetest-arrival': ['a small vintage cream baby pram with a peach canopy', 'peach roses, cream ranunculus and soft greenery', 'an empty peach and cream baby shower setup with a vintage pram, flowers and a dessert table'],
  'hello-little-one': ['a single small white heart shaped ceramic ornament', 'white tulips, soft greenery and small white flowers', 'an empty minimal modern baby shower setup with white flowers, a clean table and soft daylight'],
  'teddys-welcome': ['a soft honey brown teddy bear holding a small blush heart', 'beige and blush balloons with small plush teddy bears', 'an empty teddy bear baby shower setup with plush bears, beige balloons and a cake table'],
  'elephant-parade': ['a cute pale blue baby elephant toy with a small gold star', 'pale blue and white balloons with small plush elephants', 'an empty baby elephant themed baby shower with pale blue balloons and a dessert table'],
  'little-lamb': ['a fluffy white plush baby lamb', 'white cotton flowers, soft greenery and small white blooms', 'an empty soft white and sage little lamb baby shower setup with cotton flowers and a cake table'],
  'bumble-baby': ['a cute plush bumble bee with tiny wings', 'yellow daisies, honeycomb pieces and small plush bees', 'an empty honey yellow bumble bee baby shower setup with daisies and a honey dessert table'],
  'butterfly-kisses': ['a pair of pink and lilac butterflies on a small flower', 'pink butterflies, blush roses and small lilac flowers', 'an empty butterfly garden baby shower with pink flowers, butterflies and a cake table'],
  'garden-of-wishes': ['a small glass jar of dandelion wishes with green leaves', 'white daisies, wildflowers and soft green leaves', 'an empty garden baby shower with wildflowers, a white pergola and a long table'],
  'rainbow-blessing': ['a soft pastel felt rainbow on two small clouds', 'pastel rainbow coloured balloons in a gentle arc', 'an empty pastel rainbow baby shower setup with a balloon arch and a dessert table'],
  'pink-petals': ['a small round posy of pink roses and pink peonies', 'pink roses, pink peonies and scattered rose petals', 'an empty pink floral baby shower setup with a rose wall and a dessert table'],
  'blue-dream': ['a small white and pale blue toy sailboat', 'pale blue hydrangeas, white roses and small sea shells', 'an empty nautical pale blue baby shower with a sailboat theme, white drapes and a cake table'],
  'royal-heir': ['a small ornate gold and purple velvet royal crown', 'deep purple roses, plum dahlias and gold leaves', 'an empty royal purple and gold baby shower hall with velvet drapes, chandeliers and a throne'],
  'luxe-gold': ['a small gold rattle with a pearl handle', 'ivory roses, white orchids and gold leaves', 'an empty luxury black and gold baby shower lounge with gold balloons and candles'],
  'boho-bloom': ['a small woven macrame dreamcatcher with dried flowers', 'dried pampas grass, terracotta roses and bunny tails', 'an empty boho baby shower setup with pampas grass, rattan chairs and a macrame backdrop'],
  'minimal-moon': ['a small smooth white ceramic crescent moon', 'white cosmos flowers and soft grey eucalyptus', 'an empty minimal white baby shower with a crescent moon backdrop and white flowers'],
  'twin-blessing': ['a pair of tiny white knitted baby booties side by side', 'white and blush roses with soft baby breath flowers', 'an empty twin baby shower setup with two cribs, blush flowers and a dessert table']
};
module.exports.STYLES = require('./occasion-styles')('baby-shower');
module.exports.LABEL = 'a baby shower';
/* Baby shower wording: soft nursery decor and flowers; no "&" sprig. */
module.exports.REAL = 'photorealistic, premium baby shower decor photography, soft pastel true colours, ultra fine detail, no text, no letters, no numbers, no watermark, no logo, no people';
module.exports.FREE = ', the whole arrangement fully visible with a wide empty white margin on every side, not touching the edges of the image, no vase, no table, no frame, ' + module.exports.REAL + ', isolated on a plain pure white background';
module.exports.PIECE_TEXT = {
  // Balloons drawn "diagonally" run off the canvas; a small floating bunch stays inside it.
  bouquet: f => 'A small compact bunch of ' + f + ', floating in the middle of the image, leaning slightly to the right, small in the frame',
  cluster: f => 'A low wide compact arrangement of ' + f + ', wider than tall, flat bottom, gently rounded top',
  garland: f => 'A long horizontal garland of ' + f + ' draping in a gentle downward curve, both ends free and visible',
  wreath: f => 'A round wreath of ' + f + ' with a large empty white centre',
  vine: f => 'A tall slender vertical hanging strand of ' + f + ' from top to bottom, narrow'
};
module.exports.EXTRA = ['crest'];
