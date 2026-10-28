/* Creative briefs for the housewarming cards on the wedding design engine.
   [crest object, decoration for the frame pieces, venue scene (empty home, no people)]
   Used by scripts/generate-engagement-decor.js --set=house-warming (FLUX.2 Klein 4B).
   Never put numbers or words in a prompt: FLUX writes them out as garbled text. */
module.exports = {
  'new-beginnings': ['a small white ceramic model house with a green door and a tiny plant', 'green leaves, white daisies and small potted herbs', 'an empty bright new home living room with plants, white walls and morning sunlight'],
  'golden-threshold': ['a small brass diya on a decorated doorstep with kumkum dots', 'orange marigolds, mango leaf torans and brass diyas', 'an empty Indian home entrance at dusk with a marigold toran, brass lamps and a rangoli on the threshold'],
  'modern-nest': ['a small matte grey ceramic model house with a round window', 'white tulips, eucalyptus and small succulents', 'an empty modern minimal apartment living room with grey sofas, plants and large windows'],
  'open-doors': ['a small arched wooden front door ornament with a brass knocker', 'deep green leaves, white roses and ivy', 'an empty elegant home entrance with open double wooden doors, potted plants and warm lights'],
  'keys-to-happiness': ['a pair of crossed vintage gold house keys tied with a ribbon', 'ivory roses, gold leaves and small gold keys', 'an empty luxury new home foyer with a gold chandelier, marble floor and fresh flowers'],
  'our-new-nest': ['a small woven bird nest with tiny eggs on a twig', 'white blossoms, olive twigs and small green leaves', 'an empty cosy Scandinavian living room with a sofa, plants and soft daylight'],
  'botanical-welcome': ['a small green front door ornament wrapped in leaves', 'monstera leaves, ferns and white flowers', 'an empty plant filled new home veranda with ferns, monstera and wooden furniture'],
  'shubh-griha-pravesh': ['a small brass kalash with mango leaves and a coconut beside a decorated doorway', 'orange and yellow marigolds, mango leaves and red roses', 'an empty traditional Indian home entrance decorated with marigold torans, a kalash and a petal rangoli'],
  'new-home-new-blessings': ['a small teal and gold paisley shaped home ornament', 'yellow marigolds, white jasmine and mango leaves', 'an empty festive Indian living room decorated for a griha pravesh with flowers and brass lamps'],
  'vastu-harmony': ['a small round engraved brass plate with a lit diya and flower petals', 'orange marigolds, tulsi leaves and brass bells', 'an empty bright Indian pooja room with brass lamps, flowers and a decorated altar'],
  'fresh-beginning': ['a small pale blue front door ornament with a white wreath', 'pale blue hydrangeas, white roses and soft greenery', 'an empty fresh pale blue and white home entrance with a wreath on the door and potted plants'],
  'rustic-farmhouse': ['a small wooden farmhouse model with a red roof and wheat', 'golden wheat, sunflowers and cotton stems', 'an empty rustic farmhouse porch with wooden rocking chairs, lanterns and sunflowers'],
  'city-nest': ['a small brass house key on a tiny city skyline keyring', 'white roses, eucalyptus and small succulents', 'an empty city apartment balcony at dusk with plants, fairy lights and a skyline view'],
  'villa-dreams': ['a small white villa model with a blue arched door', 'bougainvillea, white roses and olive leaves', 'an empty luxury villa poolside terrace with arches, lounge chairs and bougainvillea'],
  'garden-housewarming': ['a small garden arch ornament covered in climbing roses', 'climbing roses, ivy and small white flowers', 'an empty home garden party with a rose arch, fairy lights and a long table'],
  'blooms-and-bricks': ['a small red brick house model with pink roses climbing', 'pink roses, peonies and soft green leaves', 'an empty charming brick cottage entrance with climbing pink roses and potted flowers'],
  'boho-home': ['a small macrame wall hanging with a wooden ring and dried flowers', 'dried pampas grass, terracotta flowers and palm leaves', 'an empty boho living room with rattan chairs, macrame, pampas grass and floor cushions'],
  'nordic-nest': ['a small white Scandinavian wooden house ornament with a pine sprig', 'white flowers, pine sprigs and soft grey eucalyptus', 'an empty Nordic minimal living room with white wood, wool throws and candles'],
  'mediterranean-home': ['a small white arched window ornament with a blue shutter and lemons', 'lemons, olive branches and white bougainvillea', 'an empty Mediterranean whitewashed courtyard with blue doors, lemon trees and terracotta pots'],
  'tropical-hideaway': ['a small wooden tropical hut ornament with palm leaves', 'monstera, palm fronds and pink hibiscus', 'an empty tropical home veranda with palm plants, rattan furniture and lanterns'],
  'royal-residence': ['a small ornate gold royal crest ornament with purple jewels', 'deep purple roses, gold leaves and orchids', 'an empty royal mansion grand hall with a chandelier, velvet sofas and gold mirrors'],
  'gold-and-ivory': ['a small ornate gold door ornament with ivory panels', 'ivory roses, white orchids and gold leaves', 'an empty elegant ivory and gold living room with a chandelier and fresh white flowers'],
  'champagne-housewarming': ['two crystal champagne coupes clinking with sparkles', 'white roses, champagne roses and gold leaves', 'an empty chic new home lounge set up for a party with a champagne tower and candles'],
  'watercolor-home': ['a small soft lilac ceramic model house with a round window', 'lilac flowers, lavender and soft white blooms', 'an empty dreamy pastel lilac living room with flowers and soft daylight'],
  'our-family-home': ['a small wooden family home model with a tree beside it', 'peach roses, cream flowers and olive branches', 'an empty warm family dining room with a long wooden table, flowers and family photos'],
  'home-and-heart': ['a small red ceramic heart shaped house ornament', 'red and pink roses with soft greenery', 'an empty cosy warm living room decorated with roses, candles and cushions'],
  'new-home-party': ['a small model house surrounded by colourful confetti and balloons', 'colourful balloons, streamers and small confetti', 'an empty new home living room decorated for a party with balloons and streamers'],
  'home-blessing': ['a small brass kalash with mango leaves and flowers', 'orange marigolds, white jasmine and mango leaves', 'an empty Indian home living room decorated for a griha pravesh puja with flowers, a kalash and lamps'],
  'a-place-to-call-home': ['a small globe shaped ornament with a tiny house on top', 'white flowers, eucalyptus and small green leaves', 'an empty welcoming home living room with plants, a sofa and warm light']
};
module.exports.STYLES = require('./occasion-styles')('house-warming');
module.exports.LABEL = 'a housewarming';
module.exports.REAL = 'photorealistic, premium home celebration decor photography, rich true colours, ultra fine detail, no text, no letters, no numbers, no watermark, no logo, no people';
module.exports.FREE = ', the whole arrangement fully visible with a wide empty white margin on every side, not touching the edges of the image, no vase, no table, no frame, ' + module.exports.REAL + ', isolated on a plain pure white background';
module.exports.PIECE_TEXT = {
  bouquet: f => 'A small compact arrangement of ' + f + ', floating in the middle of the image, leaning slightly to the right, small in the frame',
  cluster: f => 'A low wide compact arrangement of ' + f + ', wider than tall, flat bottom, gently rounded top',
  garland: f => 'A long horizontal garland of ' + f + ' draping in a gentle downward curve, both ends free and visible',
  wreath: f => 'A round wreath of ' + f + ' with a large empty white centre',
  vine: f => 'A tall slender vertical hanging strand of ' + f + ' from top to bottom, narrow'
};
module.exports.EXTRA = ['crest'];
