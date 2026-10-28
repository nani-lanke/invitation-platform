/* Creative briefs for the naming ceremony cards on the wedding design engine.
   [crest object, decoration for the frame pieces, venue scene (empty, no people)]
   Used by scripts/generate-engagement-decor.js --set=naming-ceremony (FLUX.2 Klein 4B).
   Never put numbers or words in a prompt: FLUX writes them out as garbled text. */
module.exports = {
  'naming-ceremony': ['a small polished brass kalash with mango leaves and a coconut', 'orange marigolds, white jasmine strings and mango leaves', 'an empty traditional Indian naming ceremony hall with a decorated wooden cradle, marigold garlands and brass lamps'],
  'blessed-beginning': ['a small ornate gold oil lamp diya with a glowing flame', 'deep orange marigolds, gold leaves and small brass bells', 'an empty rich brown and gold naming ceremony hall with a carved wooden cradle, brass lamps and marigold drapes'],
  'cradle-song': ['a small white wooden baby cradle with a tiny crescent moon above', 'white roses, pale blue hydrangeas and tiny silver stars', 'an empty night blue naming ceremony nursery with a white cradle, soft star lights and white drapes'],
  'first-name': ['a small ornate gold mandala medallion with a ruby centre', 'deep magenta roses, gold leaves and pink orchids', 'an empty plum and gold naming ceremony hall with a decorated cradle, chandeliers and floral drapes'],
  'a-name-filled-with-love': ['a small blush pink satin heart tied with a ribbon', 'blush roses, pink carnations and baby breath flowers', 'an empty blush pink naming ceremony setup with a floral cradle, heart decor and soft lights'],
  'our-little-blessing': ['a pair of small golden cupped hands holding a tiny flower', 'cream roses, white jasmine and soft green leaves', 'an empty cream and gold naming ceremony hall with a flower decked cradle and brass lamps'],
  'a-beautiful-beginning': ['a small watercolour style posy of sage leaves and white blooms', 'white garden roses, eucalyptus and sage green leaves', 'an empty sage green garden naming ceremony with a white cradle, floral arch and soft daylight'],
  'welcome-to-our-family': ['a small golden family tree ornament with tiny leaves', 'peach roses, cream flowers and olive branches', 'an empty warm family naming ceremony living room with a decorated cradle, flowers and family photo frames'],
  'a-name-to-cherish': ['a small jewelled gold crown with purple amethysts', 'deep purple orchids, plum roses and gold leaves', 'an empty royal purple naming ceremony hall with a velvet cradle, gold chandeliers and drapes'],
  'little-one-big-blessings': ['a small plush pale blue crescent moon with a gold star', 'pale blue and white balloons with tiny gold stars', 'an empty pale blue naming ceremony setup with a white cradle, moon and star decor and balloons'],
  'the-naming-celebration': ['a small brass kalash decorated with red kumkum and mango leaves', 'red roses, orange marigolds and mango leaf torans', 'an empty deep red traditional naming ceremony hall with a carved cradle, marigold torans and brass lamps'],
  'blessed-with-a-beautiful-name': ['a small round wreath of green leaves with a white flower', 'white roses, olive leaves and soft green ferns', 'an empty green botanical naming ceremony with a white cradle under a leafy arch'],
  'a-new-chapter-begins': ['a small open storybook with a pressed flower', 'white ranunculus, soft greenery and small white blooms', 'an empty minimal ivory naming ceremony setup with a white cradle, books and soft daylight'],
  'our-precious-little-star': ['a glowing plush gold star with a soft halo', 'periwinkle blue flowers, white roses and tiny gold stars', 'an empty periwinkle naming ceremony nursery with a cradle and hanging gold stars'],
  'sacred-naming-day': ['a small brass diya on a colourful rangoli pattern of petals', 'orange marigolds, red rose petals and brass diyas', 'an empty traditional naming ceremony courtyard with a petal rangoli, a wooden cradle and brass lamps'],
  'moonlit-blessing': ['a thick polished silver crescent moon ornament with a small star, large in the frame', 'white moonflowers, silver leaves and tiny stars', 'an empty moonlit teal naming ceremony setup with a white cradle, lanterns and silver drapes'],
  'cherished-beginning': ['a small blush rose with scattered pink petals', 'blush pink roses, rose petals and soft greenery', 'an empty blush rose naming ceremony setup with a floral cradle and pink drapes'],
  'a-grand-arrival': ['a small gold arch ornament with tiny confetti sparkles', 'white orchids, gold leaves and small gold sparkles', 'an empty grand midnight blue naming ceremony hall with a golden arch, a decorated cradle and chandeliers'],
  'tiny-blessings': ['a pair of tiny white baby footprints made of soft clay', 'pale blue and white flowers with soft baby breath', 'an empty soft blue naming ceremony nursery with a white cradle, clouds and flowers'],
  'the-name-day': ['a small golden sun shaped brass ornament', 'yellow marigolds, mango leaves and white jasmine', 'an empty bright naming ceremony courtyard with a wooden cradle, marigolds and morning sunlight'],
  'first-words-of-welcome': ['a soft brown teddy bear holding a small cream balloon', 'beige balloons, cream roses and small plush teddy bears', 'an empty cosy naming ceremony room with a cradle, teddy bears and beige balloons'],
  'blessings-of-home': ['a small olive branch with tiny white blossoms', 'olive branches, white blossoms and dried grasses', 'an empty rustic home naming ceremony with a wooden cradle, olive branches and warm light'],
  'aurora-naming': ['a small soft lilac and aqua watercolour swirl shaped glass ornament', 'lilac and aqua flowers with soft white blooms', 'an empty dreamy lilac and aqua naming ceremony setup with a white cradle and soft drapes'],
  'golden-name': ['a small gold sparkle star burst ornament', 'ivory roses, gold leaves and small gold sparkles', 'an empty black and gold luxury naming ceremony lounge with a gold cradle and candles'],
  'paisley-blessing': ['a small ornate teal and gold paisley shaped ornament', 'teal blue flowers, gold leaves and white jasmine', 'an empty teal and gold naming ceremony hall with a decorated cradle and paisley drapes'],
  'little-crown': ['a small sparkling pink and gold baby tiara', 'pink roses, peonies and small gold crowns', 'an empty pink princess naming ceremony setup with a white cradle and pink flowers'],
  'heirloom-naming': ['a small antique gold medallion with paisley engraving', 'ivory roses, dried flowers and antique brass leaves', 'an empty vintage heirloom naming ceremony room with an antique wooden cradle and lace'],
  'a-quiet-blessing': ['a single small sprig of white jasmine with two leaves', 'white jasmine, soft green leaves and tiny white flowers', 'an empty serene minimal naming ceremony setup with a white cradle and soft daylight'],
  'starlight-naming': ['a cluster of three small glowing silver and gold stars', 'white flowers, silver leaves and tiny glowing stars', 'an empty starry midnight blue naming ceremony setup with a cradle, fairy lights and star decor']
};
module.exports.STYLES = require('./occasion-styles')('naming-ceremony');
module.exports.LABEL = 'a naming ceremony';
module.exports.REAL = 'photorealistic, premium Indian ceremony decor photography, rich true colours, ultra fine detail, no text, no letters, no numbers, no watermark, no logo, no people';
module.exports.FREE = ', the whole arrangement fully visible with a wide empty white margin on every side, not touching the edges of the image, no vase, no table, no frame, ' + module.exports.REAL + ', isolated on a plain pure white background';
module.exports.PIECE_TEXT = {
  bouquet: f => 'A small compact arrangement of ' + f + ', floating in the middle of the image, leaning slightly to the right, small in the frame',
  cluster: f => 'A low wide compact arrangement of ' + f + ', wider than tall, flat bottom, gently rounded top',
  garland: f => 'A long horizontal garland of ' + f + ' draping in a gentle downward curve, both ends free and visible',
  wreath: f => 'A round wreath of ' + f + ' with a large empty white centre',
  vine: f => 'A tall slender vertical hanging strand of ' + f + ' from top to bottom, narrow'
};
module.exports.EXTRA = ['crest'];
