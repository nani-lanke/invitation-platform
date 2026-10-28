/*
 * Full Invitation Background Prompt Library for FLUX.2 Klein 4B
 * Covers all supported event categories with luxury styling.
 */
'use strict';

const LUXURY_STYLE = 'refined hand-painted watercolor and fine botanical illustration style, elegant luxury stationery, antique champagne-gold delicate linework, soft watercolor shading, subtle watercolor texture, soft natural lighting, graceful timeless premium appearance';
const NEGATIVE_PROMPT = 'CGI, 3D render, plastic, realistic photo, photograph, cartoon art, clipart, stickers, game graphics, flat vector, dark black outlines, text, typography, letters, words, names, dates, venue, UI, buttons, logos, watermarks, low quality';

const CATEGORY_BACKGROUND_PROMPTS = {
  'wedding': {
    name: 'Royal Indian Wedding Background',
    prompt: `Royal Indian wedding invitation card background, elegant traditional temple arches, intricate gold filigree borders, soft floral mandalas, warm ivory parchment texture, luxury gold and maroon accents, vertical orientation, ${LUXURY_STYLE}. Absolutely no text, no names, no dates.`,
    negative: NEGATIVE_PROMPT
  },
  'engagement': {
    name: 'Romantic Engagement Background',
    prompt: `Elegant engagement invitation card background, romantic interlocking gold rings motif, soft pastel blush and ivory floral decorations, subtle watercolor roses, champagne gold borders, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'reception': {
    name: 'Luxury Reception Background',
    prompt: `Luxurious evening reception invitation card background, sparkling string lights and fairy lights, sophisticated gold borders, deep navy and warm gold tones, elegant floral arrangements, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'birthday': {
    name: 'Festive Birthday Background',
    prompt: `Festive birthday celebration invitation card background, colorful elegant balloons, subtle confetti, festive decorative elements, soft celebratory pastel and gold tones, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'baby-shower': {
    name: 'Gentle Baby Shower Background',
    prompt: `Gentle baby shower invitation card background, soft pastel clouds, cute decorative baby elements, pastel pink and blue floral accents, tender and warm atmosphere, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'naming-ceremony': {
    name: 'Traditional Naming Ceremony Background',
    prompt: `Traditional Indian baby naming ceremony Namakarana invitation background, cultural motifs, auspicious lamps, soft floral and traditional patterns, ivory and gold tones, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'house-warming': {
    name: 'Traditional Housewarming Background',
    prompt: `Traditional Indian housewarming Griha Pravesh invitation background, decorated auspicious entrance, brass lamps, floral garlands of marigold and mango leaves, warm welcoming atmosphere, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'anniversary': {
    name: 'Romantic Anniversary Background',
    prompt: `Romantic anniversary invitation card background, golden jubilee ornaments, romantic floral wreaths, jubilee gold accents, elegant celebration motifs, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'graduation': {
    name: 'Academic Graduation Background',
    prompt: `Elegant graduation celebration invitation card background, classic academic laurel wreath, subtle certificate and cap motifs, crisp premium parchment, sophisticated navy and gold tones, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'retirement': {
    name: 'Dignified Retirement Background',
    prompt: `Dignified retirement celebration invitation card background, tasteful floral decorations, sophisticated typography-free background, serene and warm aesthetic, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'farewell': {
    name: 'Tasteful Farewell Background',
    prompt: `Tasteful farewell event invitation background, elegant celebration background, warm floral elements, graceful composition, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'corporate': {
    name: 'Professional Corporate Background',
    prompt: `Professional, minimal, premium corporate event invitation background, sleek geometric gold hairline rules, sophisticated executive color palette, clean negative space, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'festival': {
    name: 'Festive Celebration Background',
    prompt: `Culturally appropriate festive celebration invitation background, traditional lights and decorative motifs, vibrant yet elegant festival colors, warm golden glow, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'school-events': {
    name: 'Cheerful School Event Background',
    prompt: `Colorful, cheerful, age-appropriate school event invitation background, playful yet elegant artistic elements, bright welcoming pastel and primary colors, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'college-events': {
    name: 'Modern College Event Background',
    prompt: `Modern youth-oriented celebration invitation card background, vibrant dynamic abstract art elements, stylish contemporary design, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'party': {
    name: 'Lively Party Background',
    prompt: `Colorful, lively, contemporary party background, festive sparkling elements, celebratory ambiance, stylish design, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'community-events': {
    name: 'Welcoming Community Event Background',
    prompt: `Welcoming cultural and community celebration invitation artwork background, warm gathering symbols, harmonious and inclusive design, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  },
  'other': {
    name: 'Versatile Elegant Background',
    prompt: `Versatile, elegant, neutral invitation artwork background, fine classic borders, premium paper texture, soft lighting, vertical orientation, ${LUXURY_STYLE}. Absolutely no text.`,
    negative: NEGATIVE_PROMPT
  }
};

function getCategoryBackgroundPrompt(category) {
  const key = String(category || 'wedding').toLowerCase();
  return CATEGORY_BACKGROUND_PROMPTS[key] || CATEGORY_BACKGROUND_PROMPTS['wedding'];
}

module.exports = {
  CATEGORY_BACKGROUND_PROMPTS,
  getCategoryBackgroundPrompt
};
