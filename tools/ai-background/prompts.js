/*
 * AI isolated single-object prompt library used by the local FLUX.2 Klein generator.
 *
 * ARCHITECTURAL RULE:
 * - NEVER generate one complete invitation background or composite card.
 * - NEVER combine multiple decorative elements into one image.
 * - Every generation produces ONE isolated, 32-bit transparent PNG decorative asset.
 * - Website dynamically layers individual PNG assets over solid parchment HTML/CSS.
 *
 * LUXURY STYLE SPECIFICATION:
 * - Refined hand-painted watercolor & fine botanical illustration style
 * - Traditional South Indian temple architecture & antique champagne-gold ornamental details
 * - Muted natural green foliage, soft blush pink and ivory flowers, restrained maroon accents
 * - Delicate watercolor shading, soft natural lighting, graceful, timeless, premium appearance
 * - NEVER: CGI, 3D render, cartoon art, clipart, stickers, game graphics, photo cutouts, text, UI
 */
'use strict';

const LUXURY_STYLE_TAGS = `refined hand-painted watercolor and fine botanical illustration style, elegant luxury Indian wedding stationery, antique champagne-gold delicate linework, soft watercolor shading, subtle watercolor texture, delicate botanical forms, soft natural lighting, graceful timeless premium appearance`;

const BASE_NEGATIVE = `CGI, 3D render, 3D rendering, plastic, realistic photo, photograph, photo cutout, cartoon art, clipart, stickers, game graphics, flat vector, dark black outlines, text, typography, letters, words, names, dates, venue, UI, buttons, logos, watermarks, low quality`;

const ASSET_PROMPTS = {
  // =========================================================================
  // TELUGU PELLI INDIVIDUAL ASSET PROMPTS (14-LAYER MODULAR SYSTEM)
  // =========================================================================
  'telugu-pelli/vinayaka': {
    name: 'Telugu Pelli - Lord Vinayaka Emblem',
    template: 'telugu-pelli',
    asset: 'vinayaka',
    width: 768,
    height: 768,
    prompt: `Full-body traditional Lord Vinayaka devotional illustration for a premium Telugu South Indian wedding invitation, complete figure fully visible from crown to bottom ornaments, centered symmetrical pose, elegant traditional Indian gold ornaments, warm antique gold, ivory, muted red and subtle green accents, refined hand-painted watercolor and fine Indian wedding stationery illustration, realistic traditional devotional artwork, soft natural shading, sophisticated premium appearance, isolated on completely transparent RGBA background.`,
    negative: `cropped figure, cut off head, cut off feet, partial body, flowers surrounding Vinayaka, floral background, leaves, temple, landscape, frame, text, letters, watermark, people, cartoon, CGI, 3D render, clipart, sticker, photographic cutout.`
  },

  'telugu-pelli/elephant-left': {
    name: 'Telugu Pelli - Ceremonial Wedding Elephant Left',
    template: 'telugu-pelli',
    asset: 'elephant-left',
    width: 768,
    height: 768,
    prompt: `Premium hand-painted ceremonial Indian wedding elephant for a luxury South Indian Telugu wedding invitation lower-left corner. Elegant ivory elephant with natural anatomy, standing in a natural graceful pose facing inward toward the center (facing right), wearing a traditional South Indian ceremonial muted green and antique-gold caparison cloth with refined temple motifs and delicate ornamental details. Warm ivory skin, muted green and champagne-gold decoration, luxury Indian wedding stationery appearance, soft watercolor and fine botanical illustration style, ${LUXURY_STYLE_TAGS}, full elephant visible, no cropping, completely transparent RGBA alpha background, 32-bit PNG format. Isolated single elephant, no rider, no mahout, no background, no landscape, no ground, no pedestal, no second elephant, no text, no watermark, no cartoon, no CGI, no photographic cutout.`,
    negative: `${BASE_NEGATIVE}, cropped, cut off limbs, rider, mahout, second elephant, background, landscape, pedestal, ground, trees, temple, frame, dark background`
  },

  'telugu-pelli/elephant-right': {
    name: 'Telugu Pelli - Ceremonial Wedding Elephant Right',
    template: 'telugu-pelli',
    asset: 'elephant-right',
    width: 768,
    height: 768,
    prompt: `Premium hand-painted ceremonial Indian wedding elephant for a luxury South Indian Telugu wedding invitation lower-right corner. Elegant ivory elephant with natural anatomy, standing in a natural graceful pose facing inward toward the center (facing left), wearing a traditional South Indian ceremonial muted green and antique-gold caparison cloth with refined temple motifs and delicate ornamental details. Warm ivory skin, muted green and champagne-gold decoration, luxury Indian wedding stationery appearance, soft watercolor and fine botanical illustration style, ${LUXURY_STYLE_TAGS}, full elephant visible, no cropping, completely transparent RGBA alpha background, 32-bit PNG format. Isolated single elephant, no rider, no mahout, no background, no landscape, no ground, no pedestal, no second elephant, no text, no watermark, no cartoon, no CGI, no photographic cutout.`,
    negative: `${BASE_NEGATIVE}, cropped, cut off limbs, rider, mahout, second elephant, background, landscape, pedestal, ground, trees, temple, frame, dark background`
  },

  'telugu-pelli/flower-top-left': {
    name: 'Telugu Pelli - Floral Corner Top Left',
    template: 'telugu-pelli',
    asset: 'flower-top-left',
    width: 768,
    height: 768,
    prompt: `Individual premium South Indian Telugu wedding floral canopy corner arrangement for upper-left corner. Realistic cream-white blossoms, delicate blush pink flowers, fresh jasmine strands, muted natural green mango leaves, detailed botanical textures, ${LUXURY_STYLE_TAGS}, isolated floral arrangement, completely transparent alpha background, 32-bit PNG format. Absolutely no frame, no background, no text, no Vinayaka, no elephants.`,
    negative: `${BASE_NEGATIVE}, frame, background, vinayaka, elephant, temple, solid background, white background`
  },

  'telugu-pelli/flower-top-right': {
    name: 'Telugu Pelli - Floral Corner Top Right',
    template: 'telugu-pelli',
    asset: 'flower-top-right',
    width: 768,
    height: 768,
    prompt: `Individual premium South Indian Telugu wedding floral canopy corner arrangement for upper-right corner. Realistic cream-white blossoms, delicate blush pink flowers, fresh jasmine strands, muted natural green mango leaves, detailed botanical textures, ${LUXURY_STYLE_TAGS}, isolated floral arrangement, completely transparent alpha background, 32-bit PNG format. Absolutely no frame, no background, no text, no Vinayaka, no elephants.`,
    negative: `${BASE_NEGATIVE}, frame, background, vinayaka, elephant, temple, solid background, white background`
  },

  'telugu-pelli/flower-left': {
    name: 'Telugu Pelli - Floral Side Left',
    template: 'telugu-pelli',
    asset: 'flower-left',
    width: 512,
    height: 1024,
    prompt: `Individual premium hand-painted watercolor floral cascading branch for the left side border of a luxury South Indian Telugu Pelli wedding invitation. Elongated vertical cascading floral arrangement with elegant soft ivory blossoms, delicate blush pink petals, subtle light peach tones, blooming jasmine buds, and natural muted sage-green leaves gracefully flowing downward along the left margin. Refined botanical illustration with fine watercolor brushwork, realistic flower centers with subtle golden stamen details, natural organic curves, soft natural lighting, graceful luxury Indian wedding stationery aesthetic. Beautifully balanced spacing between blossoms, leaves, and slender stems, curving inward slightly toward center. Entire floral branch fully contained inside canvas with no cut-off petals, leaves or stems, isolated on pure solid white background. Absolutely no background scenery, no frame, no borders, no vase, no ribbons, no text, no letters, no people, no architecture, no cartoon, no 3D render, no CGI.`,
    negative: `${BASE_NEGATIVE}, vase, pot, ribbon, tie, bouquet wrap, frame, border, temple, elephant, person, couple, landscape, dark background, black background, oversaturated colors, neon, cropped flowers, cut off stems, text, watermark`
  },

  'telugu-pelli/flower-right': {
    name: 'Telugu Pelli - Floral Side Right',
    template: 'telugu-pelli',
    asset: 'flower-right',
    width: 512,
    height: 1024,
    prompt: `Individual premium hand-painted watercolor floral cascading branch for the right side border of a luxury South Indian Telugu Pelli wedding invitation. Elongated vertical cascading floral arrangement with elegant soft ivory blossoms, delicate blush pink petals, subtle light peach tones, blooming jasmine buds, and natural muted sage-green leaves gracefully flowing downward along the right margin. Refined botanical illustration with fine watercolor brushwork, realistic flower centers with subtle golden stamen details, natural organic curves, soft natural lighting, graceful luxury Indian wedding stationery aesthetic. Beautifully balanced spacing between blossoms, leaves, and slender stems, curving inward slightly toward center. Matching pair with left side floral branch in style, scale, palette, and botanical detail. Entire floral branch fully contained inside canvas with no cut-off petals, leaves or stems, isolated on pure solid white background. Absolutely no background scenery, no frame, no borders, no vase, no ribbons, no text, no letters, no people, no architecture, no cartoon, no 3D render, no CGI.`,
    negative: `${BASE_NEGATIVE}, vase, pot, ribbon, tie, bouquet wrap, frame, border, temple, elephant, person, couple, landscape, dark background, black background, oversaturated colors, neon, cropped flowers, cut off stems, text, watermark`
  },

  'telugu-pelli/temple-left': {
    name: 'Telugu Pelli - Temple Mandapam Pavilion Left',
    template: 'telugu-pelli',
    asset: 'temple-left',
    width: 640,
    height: 768,
    prompt: `Individual premium hand-painted watercolor South Indian Dravidian stone temple mandapam pavilion for the lower-left corner of a luxury Telugu Pelli wedding invitation. Authentic traditional South Indian carved sandstone and ivory granite stone pillars with delicate temple relief carvings, ornate Dravidian stepped tiered roof canopy with subtle antique champagne-gold finial kalasham details, graceful stone arches, surrounded at the base by lush muted sage-green tropical palm fronds, banana leaves, and delicate blooming jasmine and temple flowers. Facing inward slightly toward the right center of the card. Refined watercolor and fine botanical architectural illustration style, soft natural shading, delicate antique champagne-gold linework, ${LUXURY_STYLE_TAGS}, isolated standalone pavilion fully contained within canvas, pure solid white background. Absolutely no people, no couple, no text, no letters, no frame, no borders, no modern buildings, no cartoon, no 3D render, no CGI.`,
    negative: `${BASE_NEGATIVE}, modern building, gazebo, fantasy castle, people, couple, bride, groom, text, typography, letters, words, cartoon, CGI, 3D render, sticker, dark background, black background, frame, border, cropped top, cut off pillars`
  },

  'telugu-pelli/temple-right': {
    name: 'Telugu Pelli - Temple Mandapam Pavilion Right',
    template: 'telugu-pelli',
    asset: 'temple-right',
    width: 640,
    height: 768,
    prompt: `Individual premium hand-painted watercolor South Indian Dravidian stone temple mandapam pavilion for the lower-right corner of a luxury Telugu Pelli wedding invitation. Authentic traditional South Indian carved sandstone and ivory granite stone pillars with delicate temple relief carvings, ornate Dravidian stepped tiered roof canopy with subtle antique champagne-gold finial kalasham details, graceful stone arches, surrounded at the base by lush muted sage-green tropical palm fronds, banana leaves, and delicate blooming jasmine and temple flowers. Facing inward slightly toward the left center of the card. Matching pair with left temple pavilion in scale, architectural style, palette, and watercolor craftsmanship. Refined watercolor and fine botanical architectural illustration style, soft natural shading, delicate antique champagne-gold linework, ${LUXURY_STYLE_TAGS}, isolated standalone pavilion fully contained within canvas, pure solid white background. Absolutely no people, no couple, no text, no letters, no frame, no borders, no modern buildings, no cartoon, no 3D render, no CGI.`,
    negative: `${BASE_NEGATIVE}, modern building, gazebo, fantasy castle, people, couple, bride, groom, text, typography, letters, words, cartoon, CGI, 3D render, sticker, dark background, black background, frame, border, cropped top, cut off pillars`
  },

  'telugu-pelli/lake-bottom': {
    name: 'Telugu Pelli - Panoramic Temple-Lake Landscape Scene',
    template: 'telugu-pelli',
    asset: 'lake-bottom',
    width: 1024,
    height: 576,
    prompt: `Wide horizontal panoramic South Indian temple-lake landscape decorative artwork for the bottom section of a luxury Telugu Pelli wedding invitation. Detailed traditional South Indian Dravidian carved stone temple towers, elegant pavilions, chhatris, and gopuram architecture along the distant lake shore. Refined watercolor and fine hand-painted Indian wedding stationery illustration style with delicate antique-gold and warm beige architectural accents. Calm, sophisticated pale muted teal and ivory reflective water with realistic subtle temple reflections. Naturally shaped blooming pink lotus flowers and green lily pads scattered delicately in the foreground water. Soft natural green foliage, palms, and fine botanical details. Palette of soft ivory, sage green, muted teal, antique champagne gold, and blush pink. Balanced symmetry, soft atmospheric depth, clean edges, premium wedding stationery quality, cohesive lighting and fine paper texture. Isolated standalone decorative illustration on pure solid white background dissolving smoothly at upper edge.`,
    negative: `${BASE_NEGATIVE}, black background, neon cyan, bright turquoise glow, cartoon, 3D game-art, excessive fantasy effects, floating objects, people, elephants, text, letters, names, dates, wedding invitation wording, UI, borders, frames, watermarks, harsh contrast`
  },

  'telugu-pelli/mandapam-courtyard': {
    name: 'Telugu Pelli - Panoramic Temple-Lake Landscape',
    template: 'telugu-pelli',
    asset: 'mandapam-courtyard',
    width: 1024,
    height: 640,
    prompt: `Wide panoramic South Indian temple-lake landscape for the bottom 20% of a luxury Telugu wedding invitation. Elegant traditional South Indian temple pavilions on both sides, distant temple towers, lush muted green tropical foliage, palm trees, flowering plants, a calm pale blue-green lake with soft watercolor reflections, lotus leaves and several delicate pink lotus flowers. The scene gradually fades naturally into the warm ivory invitation background with soft organic feathered edges. Palette of warm ivory, muted green, antique champagne gold, pale blue-green water and soft pink lotus flowers. One continuous hand-painted wedding stationery illustration, wide horizontal composition, soft atmospheric depth, elegant realistic watercolor illustration, premium Indian wedding invitation aesthetic, ${LUXURY_STYLE_TAGS}, transparent background outside artwork. No text, no UI, no watermark, no hard rectangular image boundary, no blue rectangle, no CGI, no cartoon, no people.`,
    negative: `${BASE_NEGATIVE}, hard rectangular boundary, hard rectangle, solid blue block, sharp borders, frame, people, text, UI, watermark, modern buildings, cartoon, CGI, sticker appearance, dark background, high contrast`
  },

  'telugu-pelli/lotus': {
    name: 'Telugu Pelli - Blooming Lotus',
    template: 'telugu-pelli',
    asset: 'lotus',
    width: 512,
    height: 512,
    prompt: `Single isolated botanical cluster of blooming soft blush pink Indian lotus flowers and lush muted green lily pads for lower centerpiece. Delicate hand-painted watercolor lotus blossoms with soft gradient petals, golden center stamens, green lily pad leaves, ${LUXURY_STYLE_TAGS}, on plain solid white background. Isolated floral cluster, no water, no background, no text, no frame.`,
    negative: `${BASE_NEGATIVE}, background, frame, temple, elephant, solid background, dark background`
  },

  'telugu-pelli/lotus-bottom': {
    name: 'Telugu Pelli - Blooming Lotus Bottom',
    template: 'telugu-pelli',
    asset: 'lotus-bottom',
    width: 512,
    height: 512,
    prompt: `Single isolated botanical cluster of blooming soft blush pink Indian lotus flowers and lush muted green lily pads for lower centerpiece. Delicate hand-painted watercolor lotus blossoms with soft gradient petals, golden center stamens, green lily pad leaves, ${LUXURY_STYLE_TAGS}, on plain solid white background. Isolated floral cluster, no water, no background, no text, no frame.`,
    negative: `${BASE_NEGATIVE}, background, frame, temple, elephant, solid background, dark background`
  },

  'telugu-pelli/frame': {
    name: 'Telugu Pelli - Refined Antique Champagne-Gold Ornamental Frame',
    template: 'telugu-pelli',
    asset: 'frame',
    width: 1024,
    height: 1536,
    prompt: `Pure solid antique champagne-gold ornamental architectural border frame for a luxury South Indian Telugu Pelli wedding invitation. Substantial solid gold decorative border mouldings, ornate South Indian Dravidian stone temple pillar carvings along the left and right borders, solid gold filigree corner brackets with traditional paisley and floral relief ornaments, elegant top and bottom horizontal gold moldings. Clean, large, completely empty wide open rectangular center cutout for invitation text, completely hollow white center. Symmetrical tall portrait rectangular frame proportions (1024x1536), polished antique champagne gold metallic luster, refined hand-painted watercolor and fine Indian wedding stationery illustration style on pure solid white background with completely empty white center and white exterior. Absolutely no deity, no Lord Vinayaka, no Ganesha, no idol, no crest, no statue, no letters, no words, no text, no typography, no quotes, no blessings.`,
    negative: `${BASE_NEGATIVE}, ganesha, vinayaka, deity, god, idol, statue, crest, medallion, emblem, text, typography, letters, words, font, script, handwriting, phrases, quotes, blessings, together with our families, bride, groom, wireframe, thin wire, thin lines, hairline border, sketch, disconnected lines, solid center fill, colored center, cream rectangle in center, couple, people, faces, elephants, flowers in center, temple scene in center, floating objects, dark background, black background`
  },

  'telugu-pelli/bells-left': {
    name: 'Telugu Pelli - Hanging Brass Bells Left',
    template: 'telugu-pelli',
    asset: 'bells-left',
    width: 384,
    height: 768,
    prompt: `Traditional suspended South Indian hanging temple bells for upper-left margin. Ornate antique brass bells suspended on delicate champagne-gold beaded chains at staggered heights, realistic metal luster and intricate engraving, ${LUXURY_STYLE_TAGS}, isolated hanging bells, completely transparent alpha background, 32-bit PNG format. Absolutely no background, no flowers, no frame, no text.`,
    negative: `${BASE_NEGATIVE}, background, flowers, frame, temple, elephant, solid background, white background`
  },

  'telugu-pelli/bells-right': {
    name: 'Telugu Pelli - Hanging Brass Bells Right',
    template: 'telugu-pelli',
    asset: 'bells-right',
    width: 384,
    height: 768,
    prompt: `Traditional suspended South Indian hanging temple bells for upper-right margin. Ornate antique brass bells suspended on delicate champagne-gold beaded chains at staggered heights, realistic metal luster and intricate engraving, ${LUXURY_STYLE_TAGS}, isolated hanging bells, completely transparent alpha background, 32-bit PNG format. Absolutely no background, no flowers, no frame, no text.`,
    negative: `${BASE_NEGATIVE}, background, flowers, frame, temple, elephant, solid background, white background`
  },
  'ceremonies/haldi': {
    name: 'Ceremony - Haldi',
    template: 'ceremonies',
    asset: 'haldi',
    width: 512,
    height: 512,
    prompt: `Minimalist hand-painted watercolor illustration of a small brass bowl filled with vibrant yellow turmeric paste surrounded by marigold petals, elegant, isolated on white background, ${LUXURY_STYLE_TAGS}`,
    negative: `${BASE_NEGATIVE}`
  },
  'ceremonies/mehndi': {
    name: 'Ceremony - Mehndi',
    template: 'ceremonies',
    asset: 'mehndi',
    width: 512,
    height: 512,
    prompt: `Minimalist hand-painted watercolor illustration of a henna cone with intricate floral mehndi design patterns, elegant, isolated on white background, ${LUXURY_STYLE_TAGS}`,
    negative: `${BASE_NEGATIVE}`
  },
  'ceremonies/wedding-ceremony': {
    name: 'Ceremony - Wedding Ceremony',
    template: 'ceremonies',
    asset: 'wedding-ceremony',
    width: 512,
    height: 512,
    prompt: `Minimalist hand-painted watercolor illustration of a traditional Indian mandap arch with flowers and a small sacred fire, elegant, isolated on white background, ${LUXURY_STYLE_TAGS}`,
    negative: `${BASE_NEGATIVE}`
  },
  'ceremonies/reception': {
    name: 'Ceremony - Reception',
    template: 'ceremonies',
    asset: 'reception',
    width: 512,
    height: 512,
    prompt: `Minimalist hand-painted watercolor illustration of two elegant crystal champagne glasses with golden celebration lights, elegant, isolated on white background, ${LUXURY_STYLE_TAGS}`,
    negative: `${BASE_NEGATIVE}`
  },

  // =========================================================================
  // TAMIL THIRUMANAM INDIVIDUAL ASSET PROMPTS (FLUX.2 Klein 4B AI-Generated)
  // =========================================================================
  'tamil-thirumanam/apex-murugan': {
    name: 'Tamil Thirumanam - Lord Murugan Vel Emblem',
    template: 'tamil-thirumanam',
    asset: 'apex-murugan',
    width: 768,
    height: 768,
    prompt: `Traditional sacred Lord Murugan Vel and Peacock emblem for a luxury Tamil Thirumanam wedding invitation, symmetrical centered golden vel spear with intricate antique temple engravings, warm antique gold and ruby red accents, refined hand-painted watercolor and fine South Indian wedding stationery illustration, soft natural lighting, sophisticated premium appearance, isolated on completely transparent RGBA background.`,
    negative: `${BASE_NEGATIVE}, text, letters, watermark, people, cartoon, CGI, 3D render, clipart, sticker.`
  },
  'tamil-thirumanam/gopuram-arch': {
    name: 'Tamil Thirumanam - Dravidian Gopuram Arch',
    template: 'tamil-thirumanam',
    asset: 'gopuram-arch',
    width: 1024,
    height: 576,
    prompt: `Ornate South Indian Dravidian temple gopuram arch cornice for top center of a luxury Tamil Thirumanam wedding invitation, carved stone and antique gold ornamentation, traditional temple motifs, hand-painted watercolor illustration style, soft natural lighting, isolated on transparent background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  },
  'tamil-thirumanam/pillar-left': {
    name: 'Tamil Thirumanam - Temple Pillar Left',
    template: 'tamil-thirumanam',
    asset: 'pillar-left',
    width: 512,
    height: 1024,
    prompt: `Ornate carved South Indian temple stone pillar for left margin of luxury Tamil Thirumanam wedding invitation, antique champagne-gold highlights, hand-painted watercolor architectural illustration, isolated on white background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  },
  'tamil-thirumanam/pillar-right': {
    name: 'Tamil Thirumanam - Temple Pillar Right',
    template: 'tamil-thirumanam',
    asset: 'pillar-right',
    width: 512,
    height: 1024,
    prompt: `Ornate carved South Indian temple stone pillar for right margin of luxury Tamil Thirumanam wedding invitation, antique champagne-gold highlights, hand-painted watercolor architectural illustration, isolated on white background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  },
  'tamil-thirumanam/uruli-bottom': {
    name: 'Tamil Thirumanam - Traditional Brass Uruli Centerpiece',
    template: 'tamil-thirumanam',
    asset: 'uruli-bottom',
    width: 768,
    height: 512,
    prompt: `Traditional South Indian brass uruli bowl filled with water, floating jasmine flowers, rose petals, and lit floating oil wick lamps (diya) for the lower center of a luxury Tamil Thirumanam wedding invitation, polished antique brass luster, hand-painted watercolor botanical illustration, isolated on transparent alpha background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  },
  'tamil-thirumanam/kuthuvilakku-left': {
    name: 'Tamil Thirumanam - Kuthuvilakku Lamp Left',
    template: 'tamil-thirumanam',
    asset: 'kuthuvilakku-left',
    width: 384,
    height: 768,
    prompt: `Traditional South Indian ceremonial brass Kuthuvilakku standing oil lamp for lower-left corner of a luxury Tamil Thirumanam wedding invitation, polished antique brass with warm flame, hand-painted watercolor illustration, isolated on transparent background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  },
  'tamil-thirumanam/kuthuvilakku-right': {
    name: 'Tamil Thirumanam - Kuthuvilakku Lamp Right',
    template: 'tamil-thirumanam',
    asset: 'kuthuvilakku-right',
    width: 384,
    height: 768,
    prompt: `Traditional South Indian ceremonial brass Kuthuvilakku standing oil lamp for lower-right corner of a luxury Tamil Thirumanam wedding invitation, polished antique brass with warm flame, hand-painted watercolor illustration, isolated on transparent background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  },
  'tamil-thirumanam/peacock-left': {
    name: 'Tamil Thirumanam - Royal Peacock Left',
    template: 'tamil-thirumanam',
    asset: 'peacock-left',
    width: 512,
    height: 512,
    prompt: `Majestic Indian peacock gracefully perched and facing inward toward center for lower-left of a luxury Tamil Thirumanam wedding invitation, vibrant iridescent blue and turquoise feathers, antique gold ornamental details, hand-painted watercolor illustration, isolated on transparent background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  },
  'tamil-thirumanam/peacock-right': {
    name: 'Tamil Thirumanam - Royal Peacock Right',
    template: 'tamil-thirumanam',
    asset: 'peacock-right',
    width: 512,
    height: 512,
    prompt: `Majestic Indian peacock gracefully perched and facing inward toward center for lower-right of a luxury Tamil Thirumanam wedding invitation, vibrant iridescent blue and turquoise feathers, antique gold ornamental details, hand-painted watercolor illustration, isolated on transparent background.`,
    negative: `${BASE_NEGATIVE}, text, letters, people, cartoon, CGI, 3D render`
  }
};

const TEMPLATE_ASSETS = {
  'tamil-thirumanam': [
    'apex-murugan',
    'gopuram-arch',
    'pillar-left',
    'pillar-right',
    'uruli-bottom',
    'kuthuvilakku-left',
    'kuthuvilakku-right',
    'peacock-left',
    'peacock-right'
  ],
  'ceremonies': [
    'haldi',
    'mehndi',
    'wedding-ceremony',
    'reception'
  ]
};

function fallbackAssetPrompt(template, asset) {
  const tTitle = String(template || 'South Indian')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  const aTitle = String(asset || 'Decorative Asset')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return {
    name: `${tTitle} - ${aTitle}`,
    template: template || 'wedding',
    asset: asset || 'asset',
    width: 768,
    height: 768,
    prompt: `Create an isolated single decorative ${aTitle} element for a luxury ${tTitle} wedding invitation. Authentic traditional cultural craftsmanship, ${LUXURY_STYLE_TAGS}, isolated single object, completely transparent alpha background, 32-bit PNG format. Absolutely no text, no frame, no other objects, no solid background.`,
    negative: `${BASE_NEGATIVE}, background, frame, other objects, white background`
  };
}

function getAssetPrompt(template, asset) {
  if (!asset && typeof template === 'string' && template.includes('/')) {
    const parts = template.split('/');
    template = parts[0];
    asset = parts[1];
  }
  const key = `${template}/${asset}`;
  return ASSET_PROMPTS[key] || fallbackAssetPrompt(template, asset);
}

// Backwards compatibility helper
function getPrompt(keyOrTemplate, asset) {
  if (asset) return getAssetPrompt(keyOrTemplate, asset);
  if (typeof keyOrTemplate === 'string' && keyOrTemplate.includes('/')) {
    return getAssetPrompt(keyOrTemplate);
  }
  const defaultAsset = (TEMPLATE_ASSETS[keyOrTemplate] && TEMPLATE_ASSETS[keyOrTemplate][0]) || 'vinayaka';
  return getAssetPrompt(keyOrTemplate, defaultAsset);
}

function listTemplateAssets(template) {
  return TEMPLATE_ASSETS[template] || ['vinayaka', 'frame', 'flower-top-left', 'flower-top-right'];
}

module.exports = {
  ASSET_PROMPTS,
  PROMPTS: ASSET_PROMPTS,
  TEMPLATE_ASSETS,
  getAssetPrompt,
  getPrompt,
  listTemplateAssets
};
