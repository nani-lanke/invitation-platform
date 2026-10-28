/*
 * Category Illustration Prompts for FLUX.2 Klein 4B
 * Generates transparent/isolated vector-like or watercolor illustrations for each event category.
 */
'use strict';

const ILLUSTRATION_STYLE = 'isolated single centerpiece object illustration, elegant hand-painted watercolor with gold foil outlines, luxury sticker-style asset, dark rich aesthetic, transparent or very dark background, centered, high detail, no text, no words';
const NEGATIVE_PROMPT = 'white square background, flat clip art, cheap cartoon, 3d render, plastic, photograph, human face, text, letters, watermarks, bad quality, borders, frames';

const CATEGORY_ILLUSTRATION_PROMPTS = {
  'wedding': {
    name: 'Wedding Illustration',
    prompt: `Two ornate traditional Indian royal wedding rings resting on golden lotus petals with soft marigold accents, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'engagement': {
    name: 'Engagement Illustration',
    prompt: `A sparkling diamond engagement ring placed inside an elegant delicate floral wreath with gold leaves, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'reception': {
    name: 'Reception Illustration',
    prompt: `Two elegant crystal champagne glasses making a toast with sparkling effervescence and golden celebration lights, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'birthday': {
    name: 'Birthday Illustration',
    prompt: `A beautiful multi-tier celebration birthday cake with lit candles, golden swirls, and festive macaron toppings, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'baby-shower': {
    name: 'Baby Shower Illustration',
    prompt: `A charming vintage pastel baby rattle and soft knit booties surrounded by gentle stars and clouds, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'naming-ceremony': {
    name: 'Naming Ceremony Illustration',
    prompt: `A traditional Indian carved wooden baby cradle (jhula) draped with marigold and jasmine garlands, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'house-warming': {
    name: 'Housewarming Illustration',
    prompt: `A traditional Indian decorated house entrance with an ornate door, brass diya lamp, and auspicious kalash, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'anniversary': {
    name: 'Anniversary Illustration',
    prompt: `A heart-shaped wreath of blooming dark red roses intertwined with golden ribbons and two interlocking bands, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'graduation': {
    name: 'Graduation Illustration',
    prompt: `A classic black graduation mortarboard cap with a golden tassel resting atop a rolled diploma tied with a red ribbon, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'retirement': {
    name: 'Retirement Illustration',
    prompt: `An antique golden pocket watch with an open face and delicate chain alongside a golden laurel branch, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'farewell': {
    name: 'Farewell Illustration',
    prompt: `An elegant wrapped luxury gift box tied with a flourishing golden satin bow, surrounded by gentle celebratory sparkles, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'corporate': {
    name: 'Corporate Illustration',
    prompt: `A gleaming modern geometric corporate award trophy with brushed gold and crystalline elements, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'festival': {
    name: 'Festival Illustration',
    prompt: `An ornate traditional brass diya oil lamp glowing brightly with radiant warm flames and floral marigold petals, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'school-events': {
    name: 'School Event Illustration',
    prompt: `A neat stack of vintage leather-bound books topped with an antique brass school handbell, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'college-events': {
    name: 'College Event Illustration',
    prompt: `A vibrant celebratory collegiate emblem featuring acoustic guitar and graduation cap with festive dynamic energy, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'party': {
    name: 'Party Illustration',
    prompt: `A cluster of metallic gold and deep jewel-tone party balloons with fluttering confetti ribbons and sparkles, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'community-events': {
    name: 'Community Event Illustration',
    prompt: `A stylized flourishing golden community tree symbolizing unity and family, surrounded by gentle connecting rings, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'other': {
    name: 'General Celebration Illustration',
    prompt: `A radiant multi-pointed golden celebration star bursting with brilliant festive light and delicate sparks, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'haldi': {
    name: 'Haldi Ceremony',
    prompt: `Traditional Indian haldi ceremony arrangement with turmeric paste bowl, fresh yellow marigold flowers, and auspicious turmeric leaves, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'mehndi': {
    name: 'Mehndi Ceremony',
    prompt: `Traditional intricate mehndi henna cone with delicate floral mandala patterns and lotus motifs, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'wedding-ceremony': {
    name: 'Wedding Ceremony',
    prompt: `Traditional Indian wedding mandap with floral pillars, sacred fire altar, and auspicious wedding decorations, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  },
  'wedding-reception': {
    name: 'Wedding Reception',
    prompt: `Elegant wedding reception stage with lush floral arrangements, decorative warm lighting, and champagne elements, ${ILLUSTRATION_STYLE}.`,
    negative: NEGATIVE_PROMPT
  }
};

module.exports = { CATEGORY_ILLUSTRATION_PROMPTS };
