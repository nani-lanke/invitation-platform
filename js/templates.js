/* ==========================================================================
   InviteHub — templates.js
   Catalogue data (categories + templates) and the gallery controller
   (search, filter, sort, favourites, "load more").

   The data access layer is deliberately promise-based. Swapping the local
   arrays for a Supabase query later means rewriting only IH.data.fetch*,
   not a single line of rendering or filtering code.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;
  var qs = dom.qs, qsa = dom.qsa, on = dom.on, el = dom.el, escapeHtml = dom.escapeHtml;

  /* ------------------------------------------------------------------
     1. Categories
     ------------------------------------------------------------------ */

  var CATEGORIES = [
    ['wedding', 'Wedding', 'heart', 'Timeless designs for the biggest day — from grand royal frames to quiet minimal type.'],
    ['engagement', 'Engagement', 'rings', 'Announce the promise with elegant ring motifs and soft romantic palettes.'],
    ['reception', 'Reception', 'sparkles', 'Evening-ready layouts with string lights, gold foil and celebration energy.'],
    ['birthday', 'Birthday', 'cake', 'Playful cards for every age — balloons, crowns, rockets and neon nights.'],
    ['baby-shower', 'Baby Shower', 'baby', 'Pastel clouds and gentle type to welcome the little one on the way.'],
    ['naming-ceremony', 'Naming Ceremony', 'praying-hands', 'Traditional Namakarana designs to invite blessings for your baby.'],
    ['house-warming', 'Housewarming', 'home', 'Griha Pravesh invitations that open the door to your new beginning.'],
    ['anniversary', 'Anniversary', 'gift', 'Mark one year or fifty with florals, laurels and jubilee gold.'],
    ['graduation', 'Graduation', 'graduation-cap', 'Celebrate the class of the year with crisp, confident academic layouts.'],
    ['retirement', 'Retirement', 'leaf', 'Warm, dignified cards for a life well served and a chapter well closed.'],
    ['farewell', 'Farewell', 'users', 'Send-off invitations for colleagues, seniors and friends moving on.'],
    ['corporate', 'Corporate', 'briefcase', 'Structured, on-brand invites for launches, summits and annual meets.'],
    ['festival', 'Festival', 'flame', 'Diwali, Pongal, Eid, Christmas and Navratri greetings in full colour.'],
    ['school-events', 'School Events', 'book-open', 'Annual days, sports meets and prize distributions made shareable.'],
    ['college-events', 'College Events', 'music', 'Fests, symposiums and cultural nights with bold campus energy.'],
    ['party', 'Party', 'party-popper', 'House parties, get-togethers and reunions — casual and fun.'],
    ['community-events', 'Community Events', 'flag', 'Association meets, drives and local gatherings everyone can open.']
  ].map(function (row) {
    return { slug: row[0], label: row[1], icon: row[2], description: row[3], image: 'images/categories/' + row[0] + '.svg' };
  });

  /* ------------------------------------------------------------------
     2. Templates
     Row shape:
     [name, slug, category, tier, bg1, bg2, ink, primary, secondary,
      motif, popularity, addedISO, blurb, tags?]
     `tags` is optional: it feeds the gallery search so a visitor can type
     "tamil", "nikah" or "art deco" and reach the right design.
     ------------------------------------------------------------------ */

  var TEMPLATE_ROWS = [
    ['Royal Wedding', 'royal-wedding', 'wedding', 'premium', '#4C1D3D', '#7A2E52', '#F7E6C8', '#FBEFD8', '#E8C27A', 'mandala', 98, '2026-01-12', 'A deep plum and gold mandala frame built for grand traditional weddings.'],
    ['Elegant Floral', 'elegant-floral', 'wedding', 'free', '#FDF0F4', '#F6D9E4', '#4A2033', '#8B2F58', '#B98A2E', 'floral', 95, '2026-02-02', 'Hand-drawn rosettes on blush paper — the most-used free wedding card.'],
    ['Traditional Wedding', 'traditional-wedding', 'wedding', 'premium', '#7B1E22', '#B03A26', '#FCE8C2', '#FFF3DC', '#F0BE72', 'diya', 93, '2026-01-20', 'Kumkum red with lamp motifs for a classic South Indian Shubh Vivah.'],
    ['Minimal Wedding', 'minimal-wedding', 'wedding', 'free', '#FAF8F5', '#EDE7DE', '#3A342C', '#23201A', '#8A7A5E', 'geometric', 88, '2026-03-04', 'Quiet ivory paper, wide letter-spacing and nothing else in the way.'],
    ['Modern Love', 'modern-love', 'wedding', 'premium', '#1B1033', '#4A2B7A', '#EADDFF', '#FFFFFF', '#C9A6F5', 'arch', 91, '2026-02-18', 'A midnight violet arch for couples who want contemporary, not classic.'],
    ['Golden Celebration', 'golden-celebration', 'wedding', 'premium', '#2B2113', '#6E5220', '#F6DFA5', '#FBEFCB', '#E0B252', 'mandala', 90, '2026-01-28', 'Antique gold on espresso — reads beautifully on a phone at night.'],

    ['Modern Engagement', 'modern-engagement', 'engagement', 'free', '#F7F2FB', '#E4D8F6', '#33244A', '#4A2B7A', '#9A6DD6', 'rings', 86, '2026-02-24', 'Interlocked rings and airy lilac space for a relaxed ring ceremony.'],
    ['Classic Engagement', 'classic-engagement', 'engagement', 'premium', '#2E1F3C', '#5B3A63', '#F2E3CE', '#FBF1E2', '#DCB27E', 'rings', 84, '2026-01-16', 'Aubergine and champagne — formal without feeling stiff.'],
    ['Ring Of Promise', 'ring-of-promise', 'engagement', 'premium', '#0F2A38', '#1E5163', '#F3DCB0', '#FBEED2', '#DCB06A', 'rings', 80, '2026-03-11', 'Deep teal with brushed gold rings for an evening engagement.'],
    ['Blush Engagement', 'blush-engagement', 'engagement', 'free', '#FDF1F0', '#F8DAD6', '#4A2028', '#96334A', '#C08A3E', 'floral', 82, '2026-02-09', 'Soft blush florals that photograph well on any screen.'],

    ['Grand Reception', 'grand-reception', 'reception', 'premium', '#171326', '#3D2A5C', '#F3D9A8', '#FBEDD0', '#DDB264', 'lights', 87, '2026-01-30', 'Hanging string lights over a deep night sky for the reception party.'],
    ['Evening Reception', 'evening-reception', 'reception', 'free', '#0E1B2E', '#27456B', '#EDDDC4', '#FBF2E2', '#D9B47C', 'lights', 79, '2026-03-01', 'Navy and warm gold — a calm, elegant evening invitation.'],

    ['Kids Birthday', 'kids-birthday', 'birthday', 'free', '#FFF6E5', '#FFE0B8', '#4A2410', '#B5401A', '#E08A1E', 'balloons', 96, '2026-02-14', 'Bright balloons and a big friendly headline kids actually get excited about.'],
    ['Princess Birthday', 'princess-birthday', 'birthday', 'premium', '#FDEFF7', '#F7CFE6', '#4A1633', '#8E2465', '#C08A3E', 'crown', 92, '2026-01-22', 'Pink, crowned and sparkling — the classic princess party card.'],
    ['Space Birthday', 'space-birthday', 'birthday', 'premium', '#0B1030', '#2B1E63', '#D6E2FF', '#FFFFFF', '#8FB4FF', 'stars', 89, '2026-02-27', 'Rockets, stars and deep space for a countdown-to-blast-off party.'],
    ['First Birthday', 'first-birthday', 'birthday', 'free', '#EFF9F6', '#CBEDE3', '#123F34', '#14614F', '#3E9E86', 'cloud', 90, '2026-03-08', 'Soft mint clouds for the very first birthday — gentle and photo-friendly.'],
    ['Neon Nights', 'neon-nights', 'birthday', 'premium', '#120B22', '#3A1060', '#C9F7EC', '#7DF9E0', '#F472B6', 'confetti', 85, '2026-03-19', 'Neon mint on violet-black for teen and grown-up birthday bashes.'],
    ['Teddy Bear Birthday', 'teddy-bear-birthday', 'birthday', 'premium', '#F7EFE2', '#E8D8BC', '#3A2A18', '#8A5A2E', '#C9A878', 'bow', 86, '2027-02-02', 'Warm cream and honey with a bow-topped tier for a teddy-bear tea party.', 'birthday teddy bear baby kids warm cream honey cute cuddly celebration'],
    ['Dinosaur Adventure', 'dinosaur-adventure', 'birthday', 'free', '#EFF6EC', '#D8E8CF', '#20341E', '#4E7A3E', '#A8C48E', 'egg', 88, '2027-02-02', 'Fresh greens and a fossil-egg arch for a roaring dinosaur party.', 'birthday dinosaur jurassic adventure kids roar green prehistoric'],
    ['Jungle Party', 'jungle-party', 'birthday', 'free', '#F2F8E8', '#DFEAC6', '#1E3A22', '#2E6E3E', '#C9B858', 'hibiscus', 84, '2027-02-03', 'Leafy swags and jungle blooms for a wild, playful birthday fete.', 'birthday jungle safari animals wild green leaves party kids'],
    ['Rainbow Birthday', 'rainbow-birthday', 'birthday', 'free', '#FDF4F0', '#F8E0D0', '#3A2430', '#E86E4E', '#4E9EBE', 'rainbow', 90, '2027-02-03', 'Bursting rainbow rays on cream for a cheerful, colorful birthday.', 'birthday rainbow colorful bright kids cheerful make a wish'],
    ['Little Explorer', 'little-explorer', 'birthday', 'free', '#F5F3E8', '#E4DFC6', '#2E3620', '#5E7A2E', '#B0A46E', 'globe', 85, '2027-02-04', 'Sage and terracotta with a globe emblem for a curious explorer.', 'birthday explorer adventure globe kids map travel curious'],
    ['Under The Sea Birthday', 'under-the-sea-birthday', 'birthday', 'free', '#EDF7FA', '#D2EAF2', '#0E3A4A', '#1E6E8A', '#7FC4D8', 'wave', 86, '2027-02-04', 'Teal waves and aqua foam for an underwater ocean birthday.', 'birthday under the sea ocean waves teal aqua kids splash'],
    ['Cute Animal Party', 'cute-animal-party', 'birthday', 'free', '#FCF2EC', '#F6DFD2', '#3E2418', '#C96E4E', '#E8B08A', 'heart', 83, '2027-02-05', 'Peach and cream with hearts strung in rows for a cuddly animal party.', 'birthday cute animal critters kids peach hearts cuddly party'],
    ['Toyland Celebration', 'toyland-celebration', 'birthday', 'free', '#FBF1EC', '#F2DDC8', '#3A2418', '#C05A3E', '#E8B45E', 'giftStack', 82, '2027-02-05', 'Bookended gift stacks in red and gold for a toy-box birthday.', 'birthday toyland toys gifts red gold kids playful celebration'],
    ['Fairy Tale Birthday', 'fairy-tale-birthday', 'birthday', 'premium', '#F7F1FC', '#EADCF6', '#33264A', '#7A4E9E', '#C9A8DE', 'star5', 89, '2027-02-06', 'A lavender circle of stars for a storybook fairy-tale birthday.', 'birthday fairy tale princess castle stars lavender kids storybook'],
    ['Magical Unicorn', 'magical-unicorn', 'birthday', 'premium', '#FDF1F8', '#F8DCEB', '#4A1633', '#B04E8E', '#E8C0DA', 'sparkle', 91, '2027-02-06', 'Pastel pink and lavender sparkle for a magical unicorn celebration.', 'birthday unicorn magical sparkle pink lavender girls kids rainbow'],
    ['Superhero Birthday', 'superhero-birthday', 'birthday', 'free', '#F0F4F8', '#DCE6F0', '#1E304A', '#C0402E', '#4E6E9E', 'starPoly', 87, '2027-02-07', 'A shield medallion in red and blue for a caped crusader birthday.', 'birthday superhero hero cape action boys red blue comic'],
    ['Pirate Adventure', 'pirate-adventure', 'birthday', 'free', '#F3F0E6', '#E0DAC6', '#3A2A1E', '#8A5A2E', '#C9A86E', 'sun', 84, '2027-02-07', 'Nautical cream and sand with a sun emblem for a pirate treasure hunt.', 'birthday pirate adventure treasure ship ocean kids ahoy'],
    ['Farmyard Birthday', 'farmyard-birthday', 'birthday', 'free', '#FBF6E8', '#F0E4BE', '#3A2E14', '#8A7A1E', '#D9B44E', 'sunflower', 81, '2027-02-08', 'Sunflower corners in golden yellow for a cheerful farmyard party.', 'birthday farm farmyard animals sunflower yellow barn kids'],
    ['Safari Birthday', 'safari-birthday', 'birthday', 'free', '#F6F1E4', '#E6DCC0', '#3A301E', '#7A5A2E', '#B0A46E', 'tree', 83, '2027-02-08', 'Sandy tones with a tree emblem for a safari adventure birthday.', 'birthday safari animals adventure sand tree wild kids'],
    ['Little Artist', 'little-artist', 'birthday', 'free', '#FBF6F0', '#F0E0CE', '#3A2A22', '#C05E4E', '#4E9E8E', 'dotsRing', 82, '2027-02-09', 'A paint-palette tile grid in warm tones for the little artist at home.', 'birthday artist paint palette creative art kids colors craft'],
    ['Birthday Vibes', 'birthday-vibes', 'birthday', 'free', '#FDF1F4', '#F6D8DE', '#4A1E2E', '#C05E8E', '#E8A8BE', 'balloon', 85, '2027-02-09', 'Ribbons and balloons in rose for a feel-good teen birthday.', 'birthday vibes teen young balloons rose good vibes celebration'],
    ['Purple Party', 'purple-party', 'birthday', 'free', '#F4EFFC', '#E0D6F2', '#2E2450', '#6E4E9E', '#B0A0D8', 'mandala', 84, '2027-02-10', 'A violet mandala at the center for a bold purple birthday bash.', 'birthday purple party violet bold teen young celebration'],
    ['Neon Party', 'neon-party', 'birthday', 'premium', '#120B22', '#3A1060', '#C9F7EC', '#7DF9E0', '#F472B6', 'firework', 90, '2027-02-10', 'Neon firework bursts on violet-black for a glowing teen bash.', 'birthday neon party glow bright teen dark party lights'],
    ['Music Night', 'music-night', 'birthday', 'premium', '#1A1420', '#3A2A44', '#F0E8F2', '#C9A85E', '#9A8EBE', 'musicNote', 86, '2027-02-11', 'A candelabra with music notes for a black-tie music night birthday.', 'birthday music night notes party dance teen young dark luxury'],
    ['Disco Dreams', 'disco-dreams', 'birthday', 'premium', '#221030', '#5E3A78', '#F2E8F8', '#F0C86E', '#9E8EE8', 'mirrorBall', 87, '2027-02-11', 'String lights and a mirror ball for a retro disco dream birthday.', 'birthday disco dreams mirror ball party lights dance retro'],
    ['Starry Birthday', 'starry-birthday', 'birthday', 'free', '#0E1630', '#1E3A6E', '#E8ECF8', '#8FB4FF', '#D9C86E', 'crescentMoon', 85, '2027-02-12', 'Classic columns under a crescent moon for a starry-night birthday.', 'birthday starry stars moon night navy blue teen young dream'],
    ['Social Celebration', 'social-celebration', 'birthday', 'free', '#F6F4F0', '#E4E0D8', '#2E2A26', '#8A7A6E', '#C0B8AE', 'dove', 83, '2027-02-12', 'Neutral stone tones with a dove for a grown-up social celebration.', 'birthday social party friends people neutral stone young adult'],
    ['Trendy Birthday', 'trendy-birthday', 'birthday', 'free', '#FDF6EC', '#F2E4CE', '#4A2E1E', '#C08A4E', '#E0C0A0', 'feather', 82, '2027-02-13', 'Fine rules with a feather accent for a trendy, aesthetic birthday.', 'birthday trendy aesthetic feather cream modern young celebration'],
    ['Retro Party', 'retro-party', 'birthday', 'free', '#F8EFE4', '#EADAC6', '#4A2E22', '#C06E2E', '#8A9E4E', 'candyCane', 84, '2027-02-13', 'Retro stripes on a medallion for a throwback party vibe.', 'birthday retro 90s vintage throwback stripes old school fun'],
    ['Street Style Birthday', 'street-style-birthday', 'birthday', 'free', '#221C18', '#40301E', '#F0E8D8', '#E8B44E', '#C96E4E', 'sun', 83, '2027-02-14', 'A street-art sun on dark panels for a bold urban birthday.', 'birthday street style urban graffiti bold dark young cool'],
    ['Floral Elegance', 'floral-elegance', 'birthday', 'premium', '#FDF3F5', '#F6DEE4', '#4A1E2E', '#A84E6E', '#E0B08A', 'rose', 89, '2027-02-14', 'Symmetrical roses in blush and gold for an elegant floral birthday.', 'birthday floral rose elegance blush gold women girls elegant'],
    ['Rose Garden', 'rose-garden', 'birthday', 'free', '#FBF6F0', '#F0E0D0', '#4A2E26', '#B0646E', '#D9A8A0', 'blossom', 87, '2027-02-15', 'A ring of blossoms in dusty rose for a garden-rose birthday.', 'birthday rose garden blossom flowers dusty rose women girls'],
    ['Butterfly Birthday', 'butterfly-birthday', 'birthday', 'free', '#F6F0FC', '#E4DAF2', '#332650', '#7A5AB0', '#C9B0DE', 'feather', 85, '2027-02-15', 'Lavender tiers with feather-wing accents for a butterfly birthday.', 'birthday butterfly wings lavender girls elegant flutter celebration'],
    ['Blush Celebration', 'blush-celebration', 'birthday', 'free', '#FDF2F2', '#F6DCDE', '#4A1E2A', '#C07090', '#E8B8C0', 'lotus', 84, '2027-02-16', 'Fine rules and a blush lotus for a soft romantic birthday.', 'birthday blush romantic soft lotus women girls elegant'],
    ['Pink Champagne', 'pink-champagne', 'birthday', 'premium', '#FDF1EF', '#F4D8D2', '#4A2026', '#B04E5E', '#E8B8A8', 'coupe', 88, '2027-02-16', 'Raised coupe glasses in pink champagne for a sparkling celebration.', 'birthday champagne pink bubbles toast women girls sparkling luxury'],
    ['Lavender Dreams', 'lavender-dreams', 'birthday', 'free', '#F6F1FC', '#E2D8F0', '#2E2450', '#6E4E9E', '#C9B8DE', 'candle', 84, '2027-02-17', 'Rows of lavender candles for a dreamy, calm birthday.', 'birthday lavender dreams candles purple calm women girls'],
    ['Pearl Birthday', 'pearl-birthday', 'birthday', 'free', '#FBF8F2', '#EEE4D8', '#3A2E24', '#9A7A5E', '#D9C0A8', 'dove', 85, '2027-02-17', 'Pearl bands and a dove in ivory for a timeless celebration.', 'birthday pearl ivory dove timeless women classic elegant'],
    ['Elegant Bloom', 'elegant-bloom', 'birthday', 'free', '#FBF6F0', '#EFE2D0', '#4A2E1E', '#C09A6E', '#E8D0B8', 'blossom', 83, '2027-02-18', 'A cream blossom emblem for an elegant, understated birthday.', 'birthday bloom blossom cream elegant women girls understated'],
    ['Luxury Rose Gold', 'luxury-rose-gold', 'birthday', 'premium', '#FBF1EE', '#F3DCD6', '#4A2030', '#B05E5E', '#E0B8A8', 'sparkle', 90, '2027-02-18', 'Rose-gold gates with a sparkle for a luxe feminine birthday.', 'birthday luxury rose gold sparkle premium women girls glam'],
    ['Garden Soirée', 'garden-soiree', 'birthday', 'free', '#F6F8F0', '#E2E8D0', '#2E3A28', '#C98E2E', '#9AA88A', 'marigold', 84, '2027-02-19', 'Marigold swags on sage for an elegant garden soirée birthday.', 'birthday garden soiree marigold sage outdoor evening women'],
    ['Classic Gentleman', 'classic-gentleman', 'birthday', 'premium', '#F5F2EC', '#E4DED2', '#2E2A26', '#8A6E4E', '#C0B8A8', 'clock', 86, '2027-02-19', 'A shield medallion with a timepiece for a distinguished gentleman.', 'birthday classic gentleman distinguished men clock timeless'],
    ['Black & Gold Birthday', 'black-and-gold-birthday', 'birthday', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#FBEDCB', '#DCB264', 'fleurDeLis', 91, '2027-02-20', 'Gold fleur-de-lis on black tiles for a black-tie birthday.', 'birthday black gold men sophisticated luxury formal noir'],
    ['Royal Navy Birthday', 'royal-navy-birthday', 'birthday', 'free', '#0E2A4E', '#1E4E8E', '#E8F0FA', '#7FB0F0', '#E8C05E', 'crown', 88, '2027-02-20', 'Royal-navy columns with a gold crown for a regal birthday.', 'birthday navy royal blue crown gold men regal celebration'],
    ['Midnight Gentleman', 'midnight-gentleman', 'birthday', 'premium', '#101622', '#222E44', '#E8EAF0', '#9AAEBE', '#C9B85E', 'star5', 87, '2027-02-21', 'Stars over midnight charcoal for a sophisticated evening birthday.', 'birthday midnight gentleman night stars men evening sophisticated'],
    ['Adventure Birthday', 'adventure-birthday', 'birthday', 'free', '#F0F4EA', '#DCE4CC', '#20381E', '#3E6E2E', '#A8BE8E', 'pineTree', 84, '2027-02-21', 'A pine-tree emblem on forest green for an outdoor adventure birthday.', 'birthday adventure outdoors pine forest men explorer journey'],
    ['Sports Birthday', 'sports-birthday', 'birthday', 'free', '#F0F4F8', '#DCE6F0', '#16304A', '#2E5E8E', '#E86E4E', 'sun', 85, '2027-02-22', 'A sports sunburst in navy and red for an athletic birthday.', 'birthday sports game score athletic men boys navy red'],
    ['Racing Birthday', 'racing-birthday', 'birthday', 'free', '#16141A', '#2E2A38', '#F0E8DA', '#E84E3E', '#E8B44E', 'rays', 86, '2027-02-22', 'Speed rays in black and red for a racing-inspired birthday.', 'birthday racing speed cars fast men boys throttle red'],
    ['Vintage Gentleman', 'vintage-gentleman', 'birthday', 'free', '#F3ECDC', '#E2D4BC', '#3A2C1C', '#6E5232', '#A88860', 'book', 83, '2027-02-23', 'A sepia candelabra with a book for a vintage gentleman birthday.', 'birthday vintage gentleman sepia classic book men heritage'],
    ['Modern Masculine', 'modern-masculine', 'birthday', 'free', '#F0F0EC', '#DEDEDA', '#222220', '#5E5E58', '#9E9E96', 'dotsRing', 82, '2027-02-23', 'A charcoal border with ring accents for a modern masculine birthday.', 'birthday modern masculine minimal charcoal men clean bold'],
    ['Golden Birthday', 'golden-birthday', 'birthday', 'premium', '#2C2011', '#7A5A1E', '#F8E3AC', '#FCF0CE', '#E0B252', 'sparkle', 90, '2027-02-24', 'A full gold mandala with sparkles for a gilded birthday celebration.', 'birthday golden gold sparkle luxury premium celebration'],
    ['Silver Celebration', 'silver-celebration', 'birthday', 'free', '#1F242B', '#4C5A69', '#E3ECF5', '#FFFFFF', '#B8C6D6', 'crescentMoon', 86, '2027-02-24', 'Haloed rings and a silver moon on charcoal for a sleek celebration.', 'birthday silver moon sleek cool charcoal celebration universal'],
    ['Champagne Glow', 'champagne-glow', 'birthday', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#8A6A28', '#C9A85E', 'coupe', 87, '2027-02-25', 'Champagne coupes on a golden medallion for a glowing birthday.', 'birthday champagne glow bubbles golden warm celebration luxury'],
    ['Minimal Birthday', 'minimal-birthday', 'birthday', 'free', '#FAFAF8', '#EDEDEA', '#2A2A28', '#4A4A46', '#9A9A92', 'rings', 81, '2027-02-25', 'A single ring and fine rules for a pared-back minimal birthday.', 'birthday minimal simple clean rings modern neutral universal'],
    ['Modern Luxury', 'modern-luxury', 'birthday', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#FBEDCB', '#DCB264', 'fleurDeLis', 89, '2027-02-26', 'A modern gate with gold fleur-de-lis for a signature luxury birthday.', 'birthday modern luxury fleur de lis gold black premium chic'],
    ['Black Velvet', 'black-velvet', 'birthday', 'premium', '#0B0B0E', '#22222C', '#EFE2E8', '#F0C8D8', '#C9A85E', 'sparkle', 88, '2027-02-26', 'Velvet black tiers with golden sparkles for a glamorous night.', 'birthday black velvet glamorous stars rich luxury celebration'],
    ['Emerald Elegance', 'emerald-elegance', 'birthday', 'premium', '#0E2A1E', '#1E5C3E', '#E8E4BC', '#FBF6DC', '#C9B868', 'leaf', 87, '2027-02-27', 'An emerald ring of leaves with champagne gold for refined elegance.', 'birthday emerald green gold leaves elegant rich premium'],
    ['Sunset Celebration', 'sunset-celebration', 'birthday', 'free', '#FDE8DC', '#F5C8B8', '#3E1E16', '#E86A4E', '#F0B05E', 'sun', 85, '2027-02-27', 'Sunset rays in coral and gold for a warm evening celebration.', 'birthday sunset golden hour coral warm celebration universal'],
    ['Tropical Birthday', 'tropical-birthday', 'birthday', 'free', '#0E3A3E', '#1E6E6E', '#F0E8E0', '#E86E5E', '#7FC4B8', 'hibiscus', 86, '2027-02-28', 'Hibiscus blooms on tropical teal for a paradise birthday.', 'birthday tropical island hibiscus teal paradise celebration'],
    ['Rustic Birthday', 'rustic-birthday', 'birthday', 'free', '#F3E9DC', '#E0CFB4', '#3A2416', '#8A4E2E', '#C08A5E', 'wheat', 83, '2027-02-28', 'Wheat and terracotta for a rustic, farmhouse-style birthday.', 'birthday rustic wheat terracotta cozy earthy farmhouse'],
    ['Boho Birthday', 'boho-birthday', 'birthday', 'free', '#F5E8DC', '#E4CFB8', '#3A2416', '#B06A2E', '#D9B45E', 'feather', 84, '2027-03-01', 'Feather ribbons in terracotta and mustard for a boho celebration.', 'birthday boho bohemian feather terracotta mustard free spirit'],
    ['Botanical Birthday', 'botanical-birthday', 'birthday', 'free', '#F0F6EC', '#DCE8D0', '#24341E', '#4E7A3E', '#9ABE8E', 'leaf', 84, '2027-03-01', 'Botanical leaves in sage and green for a fresh, organic birthday.', 'birthday botanical leaves green sage organic fresh celebration'],
    ['Celestial Birthday', 'celestial-birthday', 'birthday', 'premium', '#101A30', '#1E386E', '#E8EAF8', '#9AB0F0', '#D9C86E', 'crescentMoon', 86, '2027-03-02', 'A celestial circle of moon and stars on deep midnight blue.', 'birthday celestial moon stars cosmic midnight astrology dreamy'],
    ['Midnight Stars', 'midnight-stars', 'birthday', 'free', '#0B1030', '#2B1E63', '#D6E2FF', '#FFFFFF', '#8FB4FF', 'starPoly', 85, '2027-03-02', 'A starlit emblem on deep indigo for a midnight star celebration.', 'birthday midnight stars starlit indigo night celebration'],
    ['Grand Birthday', 'grand-birthday', 'birthday', 'premium', '#3E0A12', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'firecracker', 88, '2027-03-03', 'Burgundy candle rows with firecracker sparks for a grand affair.', 'birthday grand celebration burgundy gold firecracker lavish'],
    ['Sweet 16', 'sweet-16', 'birthday', 'premium', '#FDF1F6', '#F6D8E6', '#4A1633', '#B04E7E', '#E8C0DA', 'crown', 92, '2027-03-03', 'A crowned flourish in pink and gold for a sweet-sixteen debut.', 'birthday sweet 16 sweet sixteen sixteenth crown pink debut milestone'],
    ['18th Birthday', '18th-birthday', 'birthday', 'premium', '#0B0B0E', '#22222C', '#EFE2D8', '#E8B44E', '#8A8A9E', 'rays', 93, '2027-03-04', 'Golden rays between dark columns for a dramatic coming-of-age.', 'birthday 18th eighteen adult milestone coming of age gold milestone'],
    ['21st Birthday', '21st-birthday', 'birthday', 'premium', '#16304A', '#2E5E8E', '#F0F4FA', '#8FB4E8', '#D9C86E', 'stein', 91, '2027-03-04', 'Navy and gold with raised glasses for a twenty-first toast.', 'birthday 21st twenty one legal milestone toast navy gold'],
    ['25th Birthday', '25th-birthday', 'birthday', 'premium', '#1F242B', '#4C5A69', '#E3ECF5', '#FFFFFF', '#B8C6D6', 'sparkle', 90, '2027-03-05', 'Silver tiles with a golden sparkle for a quarter-century milestone.', 'birthday 25th twenty five quarter century silver milestone'],
    ['30th Birthday', '30th-birthday', 'birthday', 'premium', '#2C2011', '#7A5A1E', '#F8E3AC', '#FCF0CE', '#E0B252', 'sun', 89, '2027-03-05', 'A radiant gold sun mandala for a shining thirtieth birthday.', 'birthday 30th thirty milestone golden sun celebration'],
    ['40th Birthday', '40th-birthday', 'birthday', 'premium', '#3E0A12', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'starPoly', 90, '2027-03-06', 'Haloed stars in burgundy and gold for a fabulous fortieth.', 'birthday 40th forty milestone burgundy gold fabulous'],
    ['50th Birthday', '50th-birthday', 'birthday', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#FBEDCB', '#DCB264', 'mandala', 92, '2027-03-06', 'A grand gold gate with a mandala for a golden fiftieth jubilee.', 'birthday 50th fifty golden jubilee milestone gold luxury'],
    ['60th Birthday', '60th-birthday', 'birthday', 'premium', '#0E1330', '#2A2F63', '#F0E0BC', '#FFEDC4', '#D9B45E', 'sparkle', 91, '2027-03-07', 'A diamond chandelier with gold sparkles for a sixtieth milestone.', 'birthday 60th sixty diamond milestone chandelier gold'],
    ['70th Birthday', '70th-birthday', 'birthday', 'premium', '#2A1440', '#5C2A7A', '#F3D9A0', '#FBEDCB', '#D9B45E', 'star5', 90, '2027-03-07', 'A regal medallion in purple and gold for a seventieth celebration.', 'birthday 70th seventy milestone purple gold regal'],
    ['80th Birthday', '80th-birthday', 'birthday', 'premium', '#2C2011', '#7A5A1E', '#F8E3AC', '#FCF0CE', '#E0B252', 'starPoly', 89, '2027-03-08', 'A golden flourish of stars for an unforgettable eightieth birthday.', 'birthday 80th eighty milestone golden stars legacy'],


    ['Baby Dreams', 'baby-dreams', 'baby-shower', 'free', '#F3F8FF', '#D9E7FA', '#1B3B58', '#28527A', '#6FA3CE', 'cloud', 88, '2026-02-05', 'Drifting clouds and a soft blue sky to announce the shower.'],
    ['Little Prince', 'little-prince', 'baby-shower', 'premium', '#EAF2FB', '#C9DDF3', '#16324F', '#1F4370', '#C08A3E', 'crown', 83, '2026-01-26', 'A tiny gold crown on powder blue for the prince on the way.'],
    ['Little Princess', 'little-princess', 'baby-shower', 'premium', '#FDF0F5', '#F6D4E4', '#4A1B33', '#8C2B58', '#C08A3E', 'crown', 84, '2026-01-26', 'The same crowned arch in blush rose for the princess on the way.'],
    ['Cloud Nine', 'cloud-nine', 'baby-shower', 'free', '#F6F4FD', '#DED7F6', '#2C2054', '#3F2E78', '#8A76C9', 'cloud', 78, '2026-03-14', 'Lavender skies and rounded type — modern, gender-neutral, calm.'],

    ['Little Miracle', 'little-miracle', 'baby-shower', 'premium', '#F3F0FB', '#DCD4F2', '#3E2E6E', '#6A54B8', '#E8C86A', 'moon', 90, '2026-08-15', 'A crescent moon circled by soft halo rings and golden stars — a watercolour celestial card for the miracle on the way.', 'baby shower little miracle celestial moon stars watercolour premium gender neutral elegant'],
    ['A Bundle of Joy', 'bundle-of-joy', 'baby-shower', 'premium', '#FBF4EC', '#F0E0CE', '#5A3A24', '#C08A5E', '#E8A8BE', 'bundle', 89, '2026-08-16', 'A wrapped swaddle bundle tied with a blush bow — warm cream paper and a single heart for the joy to come.', 'baby shower bundle of joy swaddle wrapped gift cream blush cute neutral'],
    ['Twinkle Twinkle Little One', 'twinkle-twinkle-little-one', 'baby-shower', 'premium', '#FDF5E8', '#F6E2BE', '#4A3A1E', '#C9A85E', '#8FB4E8', 'stars', 91, '2026-08-17', 'A nursery-rhyme sky of big stars linked by a fine swag — storybook charm in honey and sky blue.', 'baby shower twinkle twinkle little star nursery rhyme stars storybook honey sky blue'],
    ['Welcome Baby', 'welcome-baby', 'baby-shower', 'premium', '#F6F3FA', '#E4DCF2', '#3A2A54', '#7A5EB8', '#C9B45E', 'stork', 88, '2026-08-18', 'A classic banner arch with a dangling pennant and a tiny welcome sign — a gracious, traditional greeting.', 'baby shower welcome baby banner arch pennant traditional purple gold elegant'],
    ['Tiny Toes & Big Dreams', 'tiny-toes-big-dreams', 'baby-shower', 'premium', '#EFF6F0', '#D9EBDD', '#24523E', '#3E8A5E', '#C9A85E', 'footprint', 87, '2026-08-19', 'A trail of tiny footprints climbing toward a dream star on sage green — small feet, enormous plans.', 'baby shower tiny toes big dreams footprints dream sage green gender neutral'],
    ['Our Little Sunshine', 'our-little-sunshine', 'baby-shower', 'premium', '#FFF6E0', '#F8E3AE', '#5A4A14', '#E8AE3E', '#E86E4E', 'sun', 90, '2026-08-20', 'A smiling sun in gold rings with cheerful rays — a bright, welcoming card for a ray of sunshine.', 'baby shower our little sunshine smiling sun golden rays cheerful bright'],
    ['Baby Bliss', 'baby-bliss', 'baby-shower', 'premium', '#F0F8FC', '#D8ECF5', '#225A78', '#4E9EBE', '#E8A8BE', 'cloud', 85, '2026-08-21', 'Soft blue clouds drifting over a blush balloon — dreamy, airy and full of bliss.', 'baby shower baby bliss clouds balloons pastel blue blush dreamy airy'],
    ['Once Upon a Baby', 'once-upon-a-baby', 'baby-shower', 'premium', '#FBF2F7', '#F0DCE8', '#5A2E4E', '#B06A9E', '#D9B45E', 'castle', 86, '2026-08-22', 'A storybook castle with a star above and banners flying — every great story begins with a baby.', 'baby shower once upon a baby storybook castle fairytale banners rose gold'],
    ['Little Star', 'little-star', 'baby-shower', 'premium', '#F4F6FF', '#DFE4F8', '#3A46A8', '#6A7AD0', '#E8C86A', 'star', 89, '2026-08-23', 'One great five-point star inside twin halos, scattered with sparkles — for the brightest star in the sky.', 'baby shower little star sparkle halo indigo gold bright elegant premium'],
    ['Sweetest Arrival', 'sweetest-arrival', 'baby-shower', 'premium', '#FDF1EC', '#F5DCD0', '#6E3A2A', '#C9705E', '#8FB4E8', 'stroller', 84, '2026-08-24', 'A graceful baby carriage with a round wheel and light trim — a classic card for the sweetest arrival.', 'baby shower sweetest arrival carriage stroller pram classic warm cute'],
    ['Hello Little One', 'hello-little-one', 'baby-shower', 'premium', '#FBF8F4', '#EEE6DC', '#3A322A', '#5E5648', '#C9A85E', 'arch', 83, '2026-08-25', 'A clean arch with a single heart and a thin gold line — minimal, modern and quietly joyful.', 'baby shower hello little one minimal modern arch charcoal cream simple elegant'],
    ["Teddy's Welcome", 'teddys-welcome', 'baby-shower', 'premium', '#F7EFE2', '#E8D8BC', '#3A2A18', '#8A5A2E', '#E8A8BE', 'teddy', 88, '2026-08-26', 'A cuddly teddy bear holding a small heart under a blush balloon — a soft, huggable welcome.', 'baby shower teddy teddy bear welcome cuddly honey cream heart cute'],
    ['Elephant Parade', 'elephant-parade', 'baby-shower', 'premium', '#EFF6FA', '#D8E9F2', '#1E4A66', '#3E7AA0', '#E8C86A', 'elephant', 85, '2026-08-27', 'A gentle baby elephant with a golden star on its back — sweet, playful and utterly lovable.', 'baby shower elephant parade elephant gentle star blue playful cute'],
    ['Little Lamb', 'little-lamb', 'baby-shower', 'premium', '#F6F7F4', '#E2E6DE', '#3A3A34', '#6E7A8E', '#E8A8BE', 'lamb', 82, '2026-08-28', 'A fluffy little lamb made of soft wool clouds — innocent, serene and perfect for a quiet welcome.', 'baby shower little lamb lamb sheep fluffy wool soft serene classic'],
    ['Bumble Baby', 'bumble-baby', 'baby-shower', 'premium', '#FDF6E8', '#F4E6C4', '#5A4A14', '#E8AE3E', '#6E9EBE', 'bee', 83, '2026-08-29', 'A honey bee circling a dotted hive of gold with tiny friends — busy making the world sweeter.', 'baby shower bumble bee honey hive yellow sweet playful modern'],
    ['Butterfly Kisses', 'butterfly-kisses', 'baby-shower', 'premium', '#FBF1F5', '#F2DCEC', '#5A2E52', '#B06AA8', '#8FB4E8', 'butterfly', 84, '2026-08-30', 'Two open butterfly wings with blossom hearts — flutters of love for the little one on the way.', 'baby shower butterfly kisses butterfly wings blossom lilac romantic girl'],
    ['Garden of Wishes', 'garden-of-wishes', 'baby-shower', 'premium', '#F6F8F0', '#E2E8D4', '#2E4A2E', '#4E8A5E', '#C9A85E', 'floral', 86, '2026-08-31', 'A wreath of garden leaves around a green bloom — a botanical card full of wishes and blessings.', 'baby shower garden of wishes botanical wreath leaves floral green elegant'],
    ['Rainbow Blessing', 'rainbow-blessing', 'baby-shower', 'premium', '#FDF5F0', '#F5E2D4', '#5A3226', '#E86E4E', '#4E9EBE', 'rainbow', 87, '2026-09-01', 'A layered rainbow arcing between two puffy clouds with a star above — every colour of joy.', 'baby shower rainbow blessing rainbow clouds colourful joyful bright gender neutral'],
    ['Pink Petals', 'pink-petals', 'baby-shower', 'premium', '#FDF1F5', '#F5DBE8', '#5A2040', '#C06A9E', '#E8C0DA', 'rose', 85, '2026-09-02', 'A full-blown rose of layered petals with a golden centre — soft, romantic and unmistakably feminine.', 'baby shower pink petals rose flower petals blush romantic girl'],
    ['Blue Dream', 'blue-dream', 'baby-shower', 'premium', '#EAF4FC', '#CBE2F5', '#16324F', '#1F4370', '#E8C86A', 'boat', 84, '2026-09-03', 'A little paper boat sailing under a crescent moon and stars — a dreamy card for a baby boy.', 'baby shower blue dream paper boat moon stars navy blue boy dreamy'],
    ['Royal Heir', 'royal-heir', 'baby-shower', 'premium', '#2A1440', '#5C2A7A', '#F3D9A0', '#D9B45E', '#C9A8DE', 'crown', 88, '2026-09-04', 'A jewelled crown with pearls on deep royal purple — a majestic welcome for a little prince or princess.', 'baby shower royal heir crown royal purple gold pearl luxury regal'],
    ['Luxe Gold', 'luxe-gold', 'baby-shower', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#C9A8DE', 'gold', 89, '2026-09-05', 'A black-and-gold card with a crescent moon, chevrons and glittering stars — for a celebration in full glamour.', 'baby shower luxe gold black gold luxury glamour premium elegant moon'],
    ['Boho Bloom', 'boho-bloom', 'baby-shower', 'premium', '#F5E8DC', '#E4CFB8', '#4A2C1C', '#B06A2E', '#8AA8A0', 'boho', 82, '2026-09-06', 'Feathered pampas grass framing a golden bloom — a free-spirited boho card in warm earth tones.', 'baby shower boho bloom pampas feather earth tones terracotta boho modern'],
    ['Minimal Moon', 'minimal-moon', 'baby-shower', 'premium', '#FAFAF8', '#ECECE8', '#2A2A28', '#4A4A46', '#C9A85E', 'moon', 81, '2026-09-07', 'A single crescent moon inside one quiet circle with a tiny heart below — pared-back and perfectly serene.', 'baby shower minimal moon minimal minimalist monochrome simple elegant modern'],
    ['Twin Blessing', 'twin-blessing', 'baby-shower', 'premium', '#F6F4F8', '#E2DEE8', '#3A344E', '#7A6AA0', '#C9B45E', 'twins', 86, '2026-09-08', 'Two doves bowing toward a shared heart beneath a star — double the love for twins on the way.', 'baby shower twin blessing twins doves two hearts double love lavender gold'],

    ['New Beginnings', 'new-beginnings', 'house-warming', 'free', '#F6F9F2', '#DDEBCE', '#26401F', '#33562A', '#7FA35C', 'house', 81, '2026-02-11', 'Fresh green leaves around a simple house outline for Griha Pravesh.'],
    ['Golden Threshold', 'golden-threshold', 'house-warming', 'premium', '#2A2012', '#6B5223', '#F7E1A8', '#FBEFCB', '#DCAF52', 'diya', 79, '2026-01-18', 'Lit lamps at the doorway — traditional, warm and formal.'],
    ['Modern Nest', 'modern-nest', 'house-warming', 'premium', '#EFF3F6', '#D3DEE7', '#1B2C3A', '#22384A', '#6E8CA3', 'house', 76, '2026-03-06', 'Cool slate and clean geometry for an apartment-warming.'],

    ['Floral Anniversary', 'floral-anniversary', 'anniversary', 'free', '#FBF2F6', '#F2D7E6', '#451A2F', '#7C2B54', '#C08A3E', 'floral', 85, '2026-02-20', 'Rose florals and gold rules for any anniversary year.'],
    ['Silver Jubilee', 'silver-jubilee', 'anniversary', 'premium', '#1F242B', '#4C5A69', '#E3ECF5', '#FFFFFF', '#B8C6D6', 'geometric', 77, '2026-01-14', 'Brushed silver on charcoal, built specifically for the 25th.'],
    ['Golden Jubilee', 'golden-jubilee', 'anniversary', 'premium', '#2C2011', '#7A5A1E', '#F8E3AC', '#FCF0CE', '#E0B252', 'mandala', 80, '2026-01-14', 'Full gold mandala treatment to mark fifty years together.'],
    ['Forever Yours', 'forever-yours', 'anniversary', 'free', '#FFF3F1', '#FAD9D2', '#4A1E17', '#93342A', '#C08A3E', 'leaves', 74, '2026-03-16', 'Terracotta and olive leaves — understated and romantic.'],

    ['Corporate Event', 'corporate-event', 'corporate', 'free', '#F2F5F9', '#D8E1EC', '#10263C', '#17324F', '#4A7BA8', 'briefcase', 82, '2026-02-06', 'A neutral, left-aligned layout that sits comfortably next to any logo.'],
    ['Product Launch', 'product-launch', 'corporate', 'premium', '#0B1220', '#1D3A63', '#CFE2FA', '#FFFFFF', '#7FB2F0', 'geometric', 86, '2026-03-02', 'High-contrast midnight blue for a launch that needs to feel like news.'],
    ['Annual Summit', 'annual-summit', 'corporate', 'premium', '#101A17', '#1F4A3C', '#C9EFDC', '#FFFFFF', '#6FCFA4', 'briefcase', 75, '2026-02-22', 'Forest green and structured type for conferences and summits.'],
    ['Team Offsite', 'team-offsite', 'corporate', 'free', '#FFF7EC', '#FBE3C4', '#4A2C0C', '#8A4A12', '#C98A2E', 'flag', 71, '2026-03-21', 'Warm and informal — for the offsite that is not a board meeting.'],
    ['Corporate Gala', 'corporate-gala', 'corporate', 'premium', '#120D0A', '#2E2418', '#E8C27A', '#E8C27A', '#F6DCA8', 'coupe', 88, '2027-07-01', 'Twin coupe glasses under a brass star for a formal black-tie corporate evening.', 'corporate gala evening formal black tie celebration dinner party luxury brass'],
    ['Business Conference', 'business-conference', 'corporate', 'premium', '#0E1B33', '#1E3A6E', '#A9BBF0', '#A9BBF0', '#C6D2F8', 'podium', 86, '2027-07-02', 'A podium microphone on midnight blue for your keynote and panel day.', 'business conference keynote speaker podium corporate event summit meeting'],
    ['Annual General Meeting', 'annual-general-meeting', 'corporate', 'premium', '#0E2A1E', '#1E5C3E', '#E4D9A8', '#E4D9A8', '#F0E8C4', 'gavel', 74, '2027-07-03', 'The gavel motif for AGMs, board reviews and annual statutory meets.', 'annual general meeting agm board gavel corporate statutory review shareholders'],
    ['Company Anniversary', 'company-anniversary', 'corporate', 'premium', '#3E0A12', '#7A1E2A', '#F0BE72', '#F0BE72', '#F8D6A0', 'laurel', 81, '2027-07-04', 'A laurel-wrapped 25 for milestone anniversaries in burgundy and gold.', 'company anniversary milestone years celebration corporate laurel gold'],
    ['Corporate Dinner', 'corporate-dinner', 'corporate', 'premium', '#101622', '#222E44', '#D8C87E', '#D8C87E', '#E4D6A0', 'candle', 78, '2027-07-05', 'Candlelit fine dining under a navy sky for elegant corporate banquets.', 'corporate dinner banquet fine dining candle corporate gala night'],
    ['Executive Dinner', 'executive-dinner', 'corporate', 'premium', '#2E0A0E', '#5C1A22', '#F2C49A', '#F2C49A', '#F8DCC0', 'candelabra', 76, '2027-07-06', 'A candelabra in wine red for intimate evenings with leadership.', 'executive dinner leadership evening candelabra wine corporate hosts'],
    ['Business Networking', 'business-networking', 'corporate', 'premium', '#0B1B3A', '#1E3E6E', '#A9BCE8', '#A9BCE8', '#C4D2F0', 'network', 83, '2027-07-07', 'A connected-node motif for mixers, meetups and networking hours.', 'business networking mixer meetup connections corporate professionals grow'],
    ['Leadership Summit', 'leadership-summit', 'corporate', 'premium', '#101A17', '#1F4A3C', '#BFE8D2', '#BFE8D2', '#D8F2E4', 'summit', 85, '2027-07-08', 'Layered peaks over a rising sun for executive and leadership summits.', 'leadership summit executive conference mountain peak corporate vision'],
    ['Industry Summit', 'industry-summit', 'corporate', 'premium', '#1F242B', '#4C5A69', '#D3DEE8', '#D3DEE8', '#E4ECF2', 'gears', 79, '2027-07-09', 'Interlocking gears in slate for sector-wide industry conclaves.', 'industry summit conclave sector gears corporate association conference'],
    ['Corporate Awards Night', 'corporate-awards-night', 'corporate', 'premium', '#120D0A', '#2E2418', '#F0CE8A', '#F0CE8A', '#F8E0B0', 'trophy', 84, '2027-07-10', 'A gold trophy on black for annual awards and recognition ceremonies.', 'corporate awards night recognition trophy ceremony excellence winners'],
    ['Employee Appreciation', 'employee-appreciation', 'corporate', 'premium', '#EFF6F0', '#D9E8DD', '#3E8A5E', '#3E8A5E', '#6AAE84', 'heart', 82, '2027-07-11', 'A gentle heart in soft green for appreciation days and team thank-yous.', 'employee appreciation thank you team recognition green heartfelt'],
    ['Team Celebration', 'team-celebration', 'corporate', 'premium', '#0E2A3A', '#1E5470', '#A8D8E8', '#A8D8E8', '#C8E8F4', 'circle', 80, '2027-07-12', 'A ring of teammates circling the centre for all-hands celebrations.', 'team celebration all hands success corporate win together festive'],
    ['Office Opening', 'office-opening', 'corporate', 'premium', '#F4F7F8', '#DEE6EA', '#2E4A5E', '#2E4A5E', '#54708A', 'building', 87, '2027-07-13', 'A clean building line for office inaugurations and new spaces.', 'office opening inauguration building corporate new workspace launch'],
    ['New Branch Opening', 'new-branch-opening', 'corporate', 'premium', '#0E2A3E', '#1E4E78', '#8FB4F0', '#8FB4F0', '#B0C8F6', 'pin', 77, '2027-07-14', 'A radiating map pin for the launch of a new branch or store.', 'new branch opening store launch map pin corporate expansion location'],
    ['Grand Opening', 'grand-opening', 'corporate', 'premium', '#1E1612', '#3A2A1E', '#E8C080', '#E8C080', '#F2D6A8', 'ribbon', 89, '2027-07-15', 'A ribbon and arch to announce doors officially open.', 'grand opening ribbon cut inauguration corporate celebrate open'],
    ['Business Workshop', 'business-workshop', 'corporate', 'premium', '#0E3A2A', '#1C6042', '#B8E8C8', '#B8E8C8', '#D4F2E0', 'whiteboard', 72, '2027-07-16', 'A whiteboard with rising bars for hands-on corporate workshops.', 'business workshop training whiteboard learning corporate skills session'],
    ['Professional Seminar', 'professional-seminar', 'corporate', 'premium', '#F2F5F9', '#D8E1EC', '#17324F', '#17324F', '#3E5A76', 'lectern', 75, '2027-07-17', 'A lectern and mic for expert-led seminars and knowledge sessions.', 'professional seminar lecture expert knowledge speaker corporate session'],
    ['Corporate Retreat', 'corporate-retreat', 'corporate', 'premium', '#12261E', '#28513E', '#A8DCBE', '#A8DCBE', '#C8ECD8', 'forest', 79, '2027-07-18', 'Pines and peaks for off-site retreats that recharge the team.', 'corporate retreat offsite team mountains forest recharge nature'],
    ['Company Family Day', 'company-family-day', 'corporate', 'premium', '#F7EDE0', '#E8D4BC', '#8A5A2E', '#8A5A2E', '#AC7A48', 'home', 73, '2027-07-19', 'A house and sun for family fun days hosted by the company.', 'company family day fun families team picnic corporate home kids'],
    ['Client Appreciation', 'client-appreciation', 'corporate', 'premium', '#0E1B2E', '#1E3A5E', '#E8D9A8', '#E8D9A8', '#F2E8C4', 'handshake', 78, '2027-07-20', 'A laurel and heart of thanks for client appreciation evenings.', 'client appreciation thank you clients partners corporate gratitude evening'],
    ['Partner Meet', 'partner-meet', 'corporate', 'premium', '#1E1E2C', '#3A3A4E', '#D8D0C0', '#D8D0C0', '#EAE4D8', 'link', 71, '2027-07-21', 'Two interlocked links for partner meets and alliance gatherings.', 'partner meet alliance partnership corporate links collaboration'],
    ['Investor Meet', 'investor-meet', 'corporate', 'premium', '#0B0B0F', '#22222C', '#E8C27A', '#E8C27A', '#F6DCA8', 'chart', 82, '2027-07-22', 'An ascending bar chart on black for investor updates and pitches.', 'investor meet pitch investors funding corporate finance growth'],
    ['Press Conference', 'press-conference', 'corporate', 'premium', '#232020', '#4A3A28', '#E0C890', '#E0C890', '#ECDCAE', 'mic', 80, '2027-07-23', 'A microphone and camera frame for media briefings and announcements.', 'press conference media announcement press corporate journalists news'],
    ['Business Breakfast', 'business-breakfast', 'corporate', 'premium', '#FBF6EC', '#EFE2C8', '#8A6A28', '#8A6A28', '#AC8C48', 'coffee', 70, '2027-07-24', 'A steaming coffee cup for morning briefings and power breakfasts.', 'business breakfast morning briefing coffee corporate meeting networking'],
    ['Corporate Cocktail Evening', 'corporate-cocktail-evening', 'corporate', 'premium', '#120B22', '#2A1E4E', '#C9B0E8', '#C9B0E8', '#E0D0F2', 'martini', 76, '2027-07-25', 'A martini in twilight violet for upscale corporate cocktail hours.', 'corporate cocktail evening drinks networking social corporate twilight'],
    ['Year-End Celebration', 'year-end-celebration', 'corporate', 'premium', '#0E2A1E', '#1E5C3E', '#E8DCA8', '#E8DCA8', '#F2EAC4', 'clock', 88, '2027-07-26', 'A clock with sparkles to close the year and toast what is next.', 'year end celebration new year corporate team toast wrap up festive'],

    ['Festival Celebration', 'festival-celebration', 'festival', 'free', '#FFF2E0', '#FBD9A8', '#4A2308', '#9A4310', '#C98A2E', 'diya', 89, '2026-02-01', 'A general-purpose festival greeting that suits almost any occasion.'],
    ['Diwali Lights', 'diwali-lights', 'festival', 'premium', '#2A1206', '#7C3209', '#FFD79A', '#FFE9C4', '#E8A94E', 'diya', 94, '2026-01-10', 'Rows of diyas glowing on deep amber for Deepavali greetings.'],
    ['Pongal Harvest', 'pongal-harvest', 'festival', 'premium', '#FDF6E0', '#F4DFA4', '#4A3308', '#7A5410', '#C09A2E', 'leaves', 81, '2026-01-08', 'Sugarcane and turmeric tones for Thai Pongal wishes.'],
    ['Christmas Joy', 'christmas-joy', 'festival', 'free', '#0E2A22', '#1D5540', '#EDE0BC', '#FBF2D6', '#D9B463', 'gift', 83, '2026-03-24', 'Pine green with a wrapped gift and warm gold lettering.'],
    ['Eid Mubarak', 'eid-mubarak', 'festival', 'premium', '#0D2438', '#1A4C6B', '#F1D9A4', '#FBEFD0', '#D9B463', 'mandala', 87, '2026-02-16', 'Geometric night-blue mandala with a crescent-inspired frame.'],
    ['Navratri Nights', 'navratri-nights', 'festival', 'premium', '#33113D', '#8A1F5E', '#FCD9A0', '#FEEDCC', '#E8A94E', 'mandala', 78, '2026-03-12', 'Magenta and marigold for nine nights of garba and dandiya.'],

    ['Graduation Day', 'graduation-day', 'graduation', 'free', '#101B33', '#26406E', '#E4D5A8', '#FBF2D8', '#C9A85E', 'cap', 80, '2026-02-28', 'Navy and gold academic styling for the class of the year.'],
    ['Farewell Evening', 'farewell-evening', 'farewell', 'free', '#221A2E', '#4A3663', '#E6D2F0', '#FFFFFF', '#B08FD0', 'music', 72, '2026-03-18', 'A soft, slightly nostalgic card for send-offs and last days.'],
    ['Retirement Honour', 'retirement-honour', 'retirement', 'premium', '#1E2A22', '#3F5E48', '#E8DBA6', '#F8F0CE', '#C9B063', 'leaves', 70, '2026-02-26', 'Laurel leaves and deep green for a dignified retirement felicitation.'],
    ['Naming Ceremony', 'naming-ceremony', 'naming-ceremony', 'premium', '#FFF6EC', '#F8DFC0', '#4A2810', '#8A4718', '#C98A2E', 'hands', 76, '2026-01-24', 'A Namakarana arch with folded hands and space for the chosen name.'],
    ['College Fest', 'college-fest', 'college-events', 'premium', '#160D2B', '#4B1178', '#EEC6FF', '#FFFFFF', '#C77DF0', 'music', 84, '2026-03-22', 'Loud purple, music motifs and room for a three-day line-up.'],
    ['House Party', 'house-party', 'party', 'free', '#170F26', '#43196B', '#FFD6F0', '#FFFFFF', '#F472B6', 'confetti', 79, '2026-03-26', 'Confetti on midnight violet for get-togethers and reunions.', 'house party get together reunion friends celebration'],
    /* --- Community Events collection -------------------------------------
       Association meets, drives, festivals and local gatherings. No
       wedding-specific fields — event title, host, date, venue, RSVP.
       ------------------------------------------------------------------ */
    ['Community Gathering', 'community-gathering', 'community-events', 'premium', '#FBF1E7', '#EFD9BE', '#4A2E1E', '#C05A2E', '#D9B45E', 'gathering', 88, '2026-08-14', 'Warm terracotta rings that draw every neighbour into the circle.', 'community community gathering meet neighbors together welcome circle association'],
    ['Neighborhood Celebration', 'neighborhood-celebration', 'community-events', 'premium', '#0E1B3E', '#1E3A6E', '#F2E6C8', '#8FB4E8', '#E8C05E', 'houses', 86, '2026-08-15', 'A royal blue skyline of rooftops for a whole block coming out to celebrate.', 'neighborhood neighbourhood celebration residents houses block party streets welcome'],
    ['Community Festival', 'community-festival', 'community-events', 'premium', '#EAF6F0', '#CFE8DC', '#123A2E', '#E86E4E', '#3E8A6A', 'festoon', 92, '2026-08-16', 'Festive bunting in teal and coral for the liveliest day of the year.', 'community festival bunting festive flags fun everyone welcome celebration'],
    ['Local Cultural Festival', 'local-cultural-festival', 'community-events', 'premium', '#3E0A12', '#7A1E2A', '#FBD9A8', '#E8A94E', '#C9A85E', 'mandala', 87, '2026-08-17', 'A burgundy mandala in gold for a cultural festival rooted in tradition.', 'local cultural festival mandala culture tradition heritage regional arts'],
    ['Community Picnic', 'community-picnic', 'community-events', 'premium', '#F0F6EA', '#D8E4C4', '#1E3A24', '#4E7A3E', '#E8C86A', 'picnic', 85, '2026-08-18', 'Emerald lawns, a picnic blanket and the whole community under one sun.', 'community picnic outdoor park family blanket grass basket lawn fun'],
    ['Neighborhood BBQ', 'neighborhood-bbq', 'community-events', 'premium', '#1E1612', '#3A2A1E', '#F6E2C8', '#E86E3E', '#E8B44E', 'grill', 83, '2026-08-19', 'Smoke, flame and good company — a charcoal card for the neighbourhood barbecue.', 'neighborhood neighbourhood bbq barbecue grill fire smoke cookout food friends'],
    ['Community Fair', 'community-fair', 'community-events', 'premium', '#EAF4FC', '#CDE2F5', '#16324F', '#2E6EA8', '#E8A85E', 'tent', 89, '2026-08-20', 'Sky-blue tents and pennants for a fair the whole family can enjoy.', 'community fair tent carnival games stalls family fun rides market'],
    ['Charity Fundraiser', 'charity-fundraiser', 'community-events', 'premium', '#0E1B33', '#1E3A6E', '#F2D9A8', '#C9A85E', '#E8C86A', 'helping-hands', 90, '2026-08-21', 'Helping hands hold a heart of gold for the fundraiser that gives back.', 'charity fundraiser fundraising donation helping hands heart give support cause'],
    ['Charity Walk', 'charity-walk', 'community-events', 'premium', '#F0F7F6', '#D4E8E4', '#123A3E', '#2E6E6E', '#E8C86A', 'footprints', 84, '2026-08-22', 'Footprints on a teal path for a charity walk that moves people together.', 'charity walk charity walkathon run path footprints fundraising cause awareness'],
    ['Community Clean-Up', 'community-clean-up', 'community-events', 'premium', '#F4F1E8', '#DDD9C4', '#24341E', '#3E6E2E', '#B0A46E', 'recycling', 82, '2026-08-23', 'Recycling rings and forest green for the community clean-up.', 'community clean-up cleanup recycle environment green drive street sweep'],
    ['Tree Planting Day', 'tree-planting-day', 'community-events', 'premium', '#0E2A1E', '#1E5C3E', '#E8DFB4', '#8AC49A', '#C9B45E', 'sapling', 85, '2026-08-24', 'A sapling rooted in gold for a tree-planting day that grows hope.', 'tree planting day plantation sapling environment green roots nature climate'],
    ['Local Food Festival', 'local-food-festival', 'community-events', 'premium', '#FDF3D8', '#F0E0A8', '#1E2A3E', '#2E4A7A', '#C98A2E', 'food', 88, '2026-08-25', 'Mustard and navy cutlery for a local food festival worth the walk.', 'local food festival food cuisine tasting culinary market stalls eat together'],
    ['Community Sports Day', 'community-sports-day', 'community-events', 'premium', '#FDF0E8', '#F6D4BE', '#3E2418', '#E86E4E', '#F0B05E', 'sports', 84, '2026-08-26', 'Coral courts and a golden trophy for community sports day.', 'community sports day sports tournament match games athletic players relay'],
    ['Family Community Day', 'family-community-day', 'community-events', 'premium', '#F4F0FA', '#E2D8F0', '#332650', '#7A5AA0', '#C9A85E', 'family', 86, '2026-08-27', 'Plum family silhouettes under one roof for a day for every generation.', 'family community day family fun generations together park children parents grandparents'],
    ['Senior Community Gathering', 'senior-community-gathering', 'community-events', 'premium', '#F0F4EC', '#DCE4D0', '#24341E', '#4E7A5E', '#C9B45E', 'botanical', 81, '2026-08-28', 'A sage wreath of thanks for a seniors’ gathering full of gentle warmth.', 'senior community gathering seniors elders gathering tea warmth welcome community'],
    ['Community Volunteer Day', 'community-volunteer-day', 'community-events', 'premium', '#101C33', '#1E3A66', '#EADDF8', '#C9A85E', '#8FB4E8', 'hands-star', 87, '2026-08-29', 'Joined hands and a golden star for the community volunteer day.', 'community volunteer day volunteer volunteering service hands help give back'],
    ['Cultural Heritage Celebration', 'cultural-heritage-celebration', 'community-events', 'premium', '#2A0E16', '#5C1E2A', '#F3D9A8', '#E0B252', '#D9A8B8', 'paisley', 89, '2026-08-30', 'A burgundy arch of paisley honouring a living cultural heritage.', 'cultural heritage celebration heritage culture tradition celebration community festival'],
    ['Community Awareness Event', 'community-awareness-event', 'community-events', 'premium', '#EEF6F0', '#D2E8DC', '#16324A', '#3E8A9E', '#E8A85E', 'megaphone', 80, '2026-08-31', 'A clear-voice megaphone in mint and sky for the awareness event.', 'community awareness event awareness campaign megaphone cause talk discussion information'],
    ['Community Appreciation Day', 'community-appreciation-day', 'community-events', 'premium', '#1A1614', '#3A2E24', '#F3D9A0', '#C9A85E', '#E8C0DA', 'award', 88, '2026-09-01', 'Champagne ribbons and gold for a day that says thank you, neighbours.', 'community appreciation day appreciation thank you gratitude neighbours recognition'],

    /* --- School Events collection -----------------------------------------
       Annual days, sports meets, graduations, prize days and every school
       milestone. No wedding fields — event title, school/host, date, venue.
       ------------------------------------------------------------------ */
    ['School Annual Day', 'school-annual-day', 'school-events', 'premium', '#0E1B33', '#2A4A7C', '#F2D9A8', '#E8C05E', '#8FB4E8', 'curtain', 91, '2026-09-02', 'Curtains up and stage lights on for the school’s biggest night of the year.', 'school annual day stage curtain spotlight celebration performance'],
    ['School Sports Day', 'school-sports-day', 'school-events', 'premium', '#122C42', '#265C82', '#DAECF8', '#FFFFFF', '#84BADE', 'trophy', 89, '2026-09-03', 'Pennants flying and the trophy polished for the school sports meet.', 'school sports day sports meet trophy pennants games athletics field'],
    ['School Cultural Day', 'school-cultural-day', 'school-events', 'premium', '#3E0A12', '#7A1E2A', '#FBD9A8', '#E8A94E', '#D9A8B8', 'bunting', 87, '2026-09-04', 'Bunting, music and marigolds for the day the school celebrates culture.', 'school cultural day culture bunting music dance arts heritage celebration'],
    ['School Annual Function', 'school-annual-function', 'school-events', 'premium', '#0E2A1E', '#1E5C3E', '#E8DFB4', '#E8C86A', '#8AC49A', 'star', 90, '2026-09-05', 'A star-spangled evening of performances to close the school year.', 'school annual function evening performance stage star celebration programme'],
    ['School Graduation Ceremony', 'school-graduation-ceremony', 'school-events', 'premium', '#101B33', '#26406E', '#E4D5A8', '#C9A85E', '#8AAAE0', 'cap', 92, '2026-09-06', 'Caps, gowns and gold laurels for the school graduation ceremony.', 'school graduation ceremony cap gown laurel class convocation awards'],
    ['School Farewell', 'school-farewell', 'school-events', 'premium', '#F7EDE0', '#E8D4BC', '#3A2416', '#8A5A2E', '#C9A85E', 'candle', 82, '2026-09-07', 'A candle lit for the seniors leaving the school, in warm honey tones.', 'school farewell seniors goodbye candle send off leaving school'],
    ['School Foundation Day', 'school-foundation-day', 'school-events', 'premium', '#12261E', '#28513E', '#DDF0E6', '#C9B45E', '#8AC49A', 'building', 84, '2026-09-08', 'The school building and a torch for the day the school was founded.', 'school foundation day building torch heritage anniversary founding'],
    ['School Founders Day', 'school-founders-day', 'school-events', 'premium', '#F5E8DC', '#E4CFB8', '#3A2416', '#B06A2E', '#C9A85E', 'seal', 83, '2026-09-09', 'A seal and olive branches honouring the founders of the school.', 'school founders day seal founders olive branch honour legacy crest'],
    ['School Open House', 'school-open-house', 'school-events', 'premium', '#EAF4FC', '#CDE2F5', '#16324F', '#2E6EA8', '#E8A85E', 'door', 81, '2026-09-10', 'An open door and bright classrooms for the school open house.', 'school open house door classrooms admission welcome parents visit'],
    ['Parent Teacher Meeting', 'parent-teacher-meeting', 'school-events', 'premium', '#F4F7F8', '#DEE6EA', '#22323E', '#2E4A5E', '#C08A3E', 'apple', 80, '2026-09-11', 'An apple, a pencil and open lines of conversation for the PTM.', 'parent teacher meeting ptm parents teachers apple pencil discussion'],
    ['School Science Exhibition', 'school-science-exhibition', 'school-events', 'premium', '#101E36', '#22406E', '#DCE6FA', '#7FC4D8', '#E8C86A', 'atom', 88, '2026-09-12', 'Atoms, flasks and bright ideas for the school science exhibition.', 'school science exhibition science atom flask experiment discovery innovation'],
    ['School Art Exhibition', 'school-art-exhibition', 'school-events', 'premium', '#F4F0FA', '#E2D8F0', '#332650', '#7A5AA0', '#E8A85E', 'palette', 85, '2026-09-13', 'A palette of young masters on the gallery wall for the art exhibition.', 'school art exhibition art palette gallery canvas paint creativity students'],
    ['School Talent Show', 'school-talent-show', 'school-events', 'premium', '#FDF0E8', '#F6D4BE', '#3E2418', '#E86E4E', '#F0B05E', 'mic', 86, '2026-09-14', 'A microphone and a spotlight for the school talent show night.', 'school talent show talent microphone stage performance star audition'],
    ['School Music Concert', 'school-music-concert', 'school-events', 'premium', '#1A1420', '#3A2A44', '#F0E8F2', '#C9A85E', '#9A8EBE', 'treble', 84, '2026-09-15', 'A treble clef and golden notes for the school music concert.', 'school music concert music treble notes orchestra band performance'],
    ['School Dance Performance', 'school-dance-performance', 'school-events', 'premium', '#FDF1F5', '#F5DBE8', '#4A1633', '#B04E7E', '#E8C0DA', 'dancer', 83, '2026-09-16', 'A dancer in mid-turn under the lights for the school dance performance.', 'school dance performance dance dancer movement stage rhythm recital'],
    ['School Prize Distribution', 'school-prize-distribution', 'school-events', 'premium', '#0E1B33', '#1E3A6E', '#F2D9A8', '#C9A85E', '#8FB4E8', 'trophy', 88, '2026-09-17', 'Trophies and gold ribbons for the school prize distribution day.', 'school prize distribution prize trophy ribbon awards winners ceremony'],
    ['School Awards Ceremony', 'school-awards-ceremony', 'school-events', 'premium', '#3E0A12', '#7A1E2A', '#FBD9A8', '#E8A94E', '#D9A8B8', 'medal', 89, '2026-09-18', 'Medals and laurels for the school awards ceremony of the year.', 'school awards ceremony medal laurel achievement honour recognition'],
    ['School Independence Day', 'school-independence-day', 'school-events', 'premium', '#0E1B33', '#1E3A6E', '#F2D9A8', '#E86E4E', '#3E8A6A', 'flag', 87, '2026-09-19', 'The tricolour and a torch for the school Independence Day assembly.', 'school independence day independence flag tricolour national patriotic'],
    ['School Republic Day', 'school-republic-day', 'school-events', 'premium', '#FBF6EC', '#EFE2C8', '#4A2E1E', '#C05A2E', '#2E4A7A', 'wheel', 85, '2026-09-20', 'The Ashoka wheel and saffron light for the school Republic Day.', 'school republic day republic ashoka wheel saffron national patriotic'],
    ['School Teachers Day', 'school-teachers-day', 'school-events', 'premium', '#FBF3E8', '#EFDFC4', '#4A2C18', '#C96E3E', '#8A5A2E', 'apple', 86, '2026-09-21', 'An apple and a chalkboard thanking the teachers who shaped us.', 'school teachers day teachers day apple chalkboard gratitude thank you'],
    ['School Children’s Day', 'school-childrens-day', 'school-events', 'premium', '#EAF6FC', '#CDE8F5', '#16324F', '#2E9EBE', '#E86E4E', 'balloons', 82, '2026-09-22', 'Balloons and a bright sun for the school Children’s Day celebration.', 'school childrens day children balloons sun fun joy celebration kids'],
    ['School Orientation Day', 'school-orientation-day', 'school-events', 'premium', '#EFF6F0', '#D9E8DD', '#24523E', '#3E8A5E', '#C9B45E', 'compass', 79, '2026-09-23', 'A compass and a warm welcome for new students on orientation day.', 'school orientation day orientation compass welcome new students guidance'],
    ['School Welcome Ceremony', 'school-welcome-ceremony', 'school-events', 'premium', '#F0F4EC', '#DCE4D0', '#24341E', '#4E7A5E', '#C9B45E', 'wreath', 80, '2026-09-24', 'A sage wreath of welcome for new families and fresh beginnings.', 'school welcome ceremony welcome wreath new families students beginning'],
    ['School Graduation Party', 'school-graduation-party', 'school-events', 'premium', '#1A1614', '#3A2E24', '#F3D9A0', '#C9A85E', '#E8C0DA', 'confetti', 90, '2026-09-25', 'Caps off and confetti in the air for the school graduation party.', 'school graduation party graduation cap confetti celebration fun party'],

    ['Midnight Soiree', 'midnight-soiree', 'reception', 'free', '#0E1330', '#2A2F63', '#DCE2FF', '#FFFFFF', '#8FA0E8', 'lights', 79, '2026-04-02', 'Deep indigo with hanging lights for a reception that runs late.'],
    ['Rose Gold Evening', 'rose-gold-evening', 'reception', 'free', '#3A1C28', '#7A3A4E', '#FBE0E6', '#FFF1F4', '#E0A0B0', 'mandala', 76, '2026-04-08', 'Rose gold on plum — warm, formal and easy to read on a phone.'],
    ['Garden Reception', 'garden-reception', 'reception', 'free', '#12301F', '#2C5C3C', '#DFF2E4', '#FFFFFF', '#8DC79E', 'floral', 73, '2026-04-14', 'Leafy green and ivory for a reception held under open sky.'],
    ['Sangeet Night', 'sangeet-night', 'wedding', 'free', '#2A0E38', '#701F63', '#FFD9F0', '#FFFFFF', '#E88FD0', 'music', 86, '2026-04-05', 'Magenta and gold for the music night before the wedding.'],
    ['Mehendi Morning', 'mehendi-morning', 'wedding', 'free', '#26380C', '#5E7A18', '#F2F7CE', '#FFFFFF', '#C4D468', 'floral', 84, '2026-04-11', 'Fresh henna green with paisley for the mehendi morning.'],
    ['Haldi Sunshine', 'haldi-sunshine', 'wedding', 'free', '#4A3005', '#A87410', '#FFEFC2', '#FFFFFF', '#EBBF4E', 'mandala', 82, '2026-04-17', 'Turmeric yellow and marigold for the haldi ritual.'],
    ['Blessed Beginning', 'blessed-beginning', 'naming-ceremony', 'free', '#3A2410', '#7E5220', '#FBEBD2', '#FFFFFF', '#DDB278', 'hands', 74, '2026-04-03', 'Warm sandalwood tones and folded hands for the naming day.'],
    ['Cradle Song', 'cradle-song', 'naming-ceremony', 'free', '#16324A', '#2E6285', '#DCEEF8', '#FFFFFF', '#8CC2DE', 'cloud', 71, '2026-04-09', 'Soft sky blue and drifting clouds for a gentle naming card.'],
    ['First Name', 'first-name', 'naming-ceremony', 'free', '#3E1428', '#7C2F52', '#FCE2EC', '#FFFFFF', '#E098B4', 'mandala', 69, '2026-04-15', 'Blush rose with a fine mandala for announcing the chosen name.'],

    ['A Name Filled With Love', 'a-name-filled-with-love', 'naming-ceremony', 'premium', '#FDF1F5', '#F5DBE6', '#4A1B33', '#8C2B58', '#E8C0DA', 'heart-ribbon', 90, '2026-09-09', 'A blush rose card with a heart-and-ribbon emblem for the name chosen with love.', 'naming ceremony a name filled with love heart ribbon blush rose girl feminine traditional elegant'],
    ['Our Little Blessing', 'our-little-blessing', 'naming-ceremony', 'premium', '#FDF6EC', '#F2E2C6', '#4A2E10', '#8A5A1E', '#D9B45E', 'blessing-hands', 91, '2026-09-10', 'Folded hands and a lotus beneath a warm cream arch for the naming day.', 'naming ceremony our little blessing folded hands lotus indian traditional namakarana warm cream gold'],
    ['A Beautiful Beginning', 'a-beautiful-beginning', 'naming-ceremony', 'premium', '#F2F7F0', '#DDE8D2', '#2E3A28', '#4E7A3E', '#C9B45E', 'watercolor-floral', 89, '2026-09-11', 'A watercolour floral arch on sage green for the first chapter of a new life.', 'naming ceremony a beautiful beginning watercolour floral arch sage green gender neutral botanical elegant'],
    ['Welcome to Our Family', 'welcome-to-our-family', 'naming-ceremony', 'premium', '#FBF3E8', '#EFDFC4', '#4A2C18', '#8A5A2E', '#C9A85E', 'family-tree', 87, '2026-09-12', 'A family tree with many branches on warm tan for grandparents and extended family.', 'naming ceremony welcome to our family family tree grandparents extended family warm tan traditional'],
    ['A Name to Cherish', 'a-name-to-cherish', 'naming-ceremony', 'premium', '#2A1440', '#5C2A7A', '#F3D9A0', '#D9B45E', '#C9A8DE', 'jewel-crown', 93, '2026-09-13', 'A jewelled crown on deep royal purple for a majestic, memorable naming day.', 'naming ceremony a name to cherish jewel crown royal purple gold luxury regal premium'],
    ['Little One, Big Blessings', 'little-one-big-blessings', 'naming-ceremony', 'premium', '#EAF4FC', '#CBE2F5', '#16324F', '#1F4370', '#E8C86A', 'star-moon', 88, '2026-09-14', 'A crescent moon and stars on sky blue for a baby boy\'s naming celebration.', 'naming ceremony little one big blessings moon stars sky blue boy celestial dreamy'],
    ['The Naming Celebration', 'the-naming-celebration', 'naming-ceremony', 'premium', '#7B1E22', '#B03A26', '#FCE8C2', '#FFF3DC', '#F0BE72', 'kalash', 92, '2026-09-15', 'A kalash with mango leaves in kumkum red and gold for a grand Namakarana.', 'naming ceremony the naming celebration kalash mango leaves indian traditional maroon gold namakarana'],
    ['Blessed With a Beautiful Name', 'blessed-with-a-beautiful-name', 'naming-ceremony', 'premium', '#EFF6F0', '#D9E8DD', '#24523E', '#3E8A5E', '#C9A85E', 'botanical-wreath', 90, '2026-09-16', 'A botanical wreath on soft sage for a gender-neutral blessing of the name.', 'naming ceremony blessed with a beautiful name botanical wreath sage green gender neutral elegant'],
    ['A New Chapter Begins', 'a-new-chapter-begins', 'naming-ceremony', 'premium', '#FAF8F5', '#EDE7DE', '#3A342C', '#23201A', '#8A7A5E', 'open-book', 85, '2026-09-17', 'An open book and fine rules on ivory for a modern, understated naming day.', 'naming ceremony a new chapter begins open book ivory charcoal modern minimal simple'],
    ['Our Precious Little Star', 'our-precious-little-star', 'naming-ceremony', 'premium', '#F4F6FF', '#DFE4F8', '#3A46A8', '#6A7AD0', '#E8C86A', 'star-halo', 89, '2026-09-18', 'A great five-point star in halo rings on indigo for a bright and happy naming day.', 'naming ceremony our precious little star star halo indigo gold bright premium gender neutral'],
    ['Sacred Naming Day', 'sacred-naming-day', 'naming-ceremony', 'premium', '#2E1206', '#8A3A0E', '#FFD9A8', '#FFE9C8', '#E8A94E', 'diya-rangoli', 86, '2026-09-19', 'A lit diya over rangoli lines for a sacred and traditional naming ceremony.', 'naming ceremony sacred naming day diya rangoli south asian traditional auspicious warm'],
    ['Moonlit Blessing', 'moonlit-blessing', 'naming-ceremony', 'premium', '#0F2A38', '#1E5163', '#F3DCB0', '#FBEED2', '#DCB06A', 'crescent-moon', 84, '2026-09-20', 'A crescent moon with stars in deep teal and gold — a calm, universal naming card.', 'naming ceremony moonlit blessing crescent moon teal gold middle eastern universal serene'],
    ['Cherished Beginning', 'cherished-beginning', 'naming-ceremony', 'premium', '#FDF1F5', '#F5DBE8', '#5A2040', '#C06A9E', '#E8C0DA', 'rose-petal', 87, '2026-09-21', 'A full-blown rose with falling petals in blush pink for a baby girl\'s naming.', 'naming ceremony cherished beginning rose petals blush pink girl feminine romantic traditional'],
    ['A Grand Arrival', 'a-grand-arrival', 'naming-ceremony', 'premium', '#171326', '#3D2A5C', '#F3D9A8', '#FBEDD0', '#DDB264', 'arch-confetti', 88, '2026-09-22', 'A golden arch with confetti over a deep night sky for a grand family celebration.', 'naming ceremony a grand arrival arch confetti night sky gold large family celebration premium'],
    ['Tiny Blessings', 'tiny-blessings', 'naming-ceremony', 'premium', '#F0F8FC', '#D8ECF5', '#225A78', '#4E9EBE', '#E8A8BE', 'baby-feet', 83, '2026-09-23', 'Two tiny footprints and a soft cloud on pastel blue for a sweet, intimate ceremony.', 'naming ceremony tiny blessings baby feet footprints pastel blue intimate small sweet'],
    ['The Name Day', 'the-name-day', 'naming-ceremony', 'premium', '#FDF6EC', '#F2E4CE', '#4A2E1E', '#C08A4E', '#E0C0A0', 'geometric-sun', 82, '2026-09-24', 'A modern geometric sunburst in terracotta and cream for contemporary families.', 'naming ceremony the name day geometric sunburst terracotta modern families contemporary minimal'],
    ['First Words of Welcome', 'first-words-of-welcome', 'naming-ceremony', 'premium', '#F7EFE2', '#E8D8BC', '#3A2A18', '#8A5A2E', '#E8A8BE', 'teddy-balloon', 81, '2026-09-25', 'A cuddly teddy under a blush balloon for a baby illustration naming card.', 'naming ceremony first words of welcome teddy balloon baby illustration honey cream cute'],
    ['Blessings of Home', 'blessings-of-home', 'naming-ceremony', 'premium', '#F5E8DC', '#E4CFB8', '#4A2C1C', '#B06A2E', '#8AA8A0', 'botanical-branch', 85, '2026-09-26', 'A botanical branch on warm earth tones for a home blessing of the little one.', 'naming ceremony blessings of home botanical branch terracotta earth tones family home'],
    ['Aurora Naming', 'aurora-naming', 'naming-ceremony', 'premium', '#F6F4FD', '#DED7F6', '#2C2054', '#3F2E78', '#8A76C9', 'watercolor-waves', 86, '2026-09-27', 'Watercolour waves in lavender and violet for a modern, gender-neutral naming.', 'naming ceremony aurora naming watercolour waves lavender violet modern gender neutral international'],
    ['Golden Name', 'golden-name', 'naming-ceremony', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#C9A8DE', 'chevron-sparkle', 92, '2026-09-28', 'Black and gold with chevrons and sparkles for a luxury naming celebration.', 'naming ceremony golden name black gold luxury glamour premium elegant sparkle'],
    ['Paisley Blessing', 'paisley-blessing', 'naming-ceremony', 'premium', '#0E3A4A', '#186478', '#F6E2B8', '#C4442E', '#DFB05E', 'paisley', 84, '2026-09-29', 'Paisley in turquoise and saffron for a South Asian and Middle Eastern inspired card.', 'naming ceremony paisley blessing paisley turquoise saffron south asian middle eastern cultural'],
    ['Little Crown', 'little-crown', 'naming-ceremony', 'premium', '#FDF0F5', '#F6D4E4', '#4A1B33', '#8C2B58', '#C08A3E', 'tiara', 85, '2026-09-30', 'A delicate tiara in blush and gold for a baby girl\'s royal naming day.', 'naming ceremony little crown tiara blush gold girl princess royal feminine'],
    ['Heirloom Naming', 'heirloom-naming', 'naming-ceremony', 'premium', '#F3ECDC', '#E2D4BC', '#3A2C1C', '#6E5232', '#A88860', 'paisley-medallion', 80, '2026-10-01', 'A sepia paisley medallion for a traditional ceremony honouring grandparents.', 'naming ceremony heirloom naming paisley medallion sepia heritage grandparents traditional'],
    ['A Quiet Blessing', 'a-quiet-blessing', 'naming-ceremony', 'premium', '#FAFAF8', '#ECECE8', '#2A2A28', '#4A4A46', '#C9A85E', 'single-sprig', 79, '2026-10-02', 'A single sprig on pure ivory for the simplest, most intimate naming ceremony.', 'naming ceremony a quiet blessing single sprig ivory minimal simple intimate understated'],
    ['Starlight Naming', 'starlight-naming', 'naming-ceremony', 'premium', '#0B1030', '#2B1E63', '#D6E2FF', '#FFFFFF', '#8FB4FF', 'scattered-stars', 88, '2026-10-03', 'Scattered stars over midnight indigo for a dreamy, gender-neutral naming night.', 'naming ceremony starlight naming scattered stars midnight indigo gender neutral modern dreamy'],
    ['Open Doors', 'open-doors', 'house-warming', 'free', '#1C3326', '#3E6B4C', '#E0F0E6', '#FFFFFF', '#8FC2A2', 'house', 72, '2026-04-06', 'Calm green and a clean roofline for a modern house warming.'],

    ['Keys to Happiness', 'keys-to-happiness', 'house-warming', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#C9A8DE', 'crossed-keys', 93, '2026-10-04', 'Two crossed golden keys on espresso black for a modern luxury housewarming.', 'house warming keys to happiness crossed keys gold black luxury modern premium new home'],
    ['Our New Nest', 'our-new-nest', 'house-warming', 'premium', '#FAFAF8', '#ECECE8', '#2A2A28', '#4A4A46', '#C9A85E', 'nest-house', 88, '2026-10-05', 'A single-line house in a clean circle on ivory for a minimal elegant welcome.', 'house warming our new nest minimal elegant ivory charcoal single line modern clean simple'],
    ['Botanical Welcome', 'botanical-welcome', 'house-warming', 'premium', '#EFF6F0', '#D9E8DD', '#24523E', '#3E8A5E', '#C9A85E', 'botanical-door', 87, '2026-10-06', 'A door framed by botanical leaves in sage for a fresh, natural housewarming.', 'house warming botanical welcome door leaves sage green botanical organic fresh'],
    ['Shubh Griha Pravesh', 'shubh-griha-pravesh', 'house-warming', 'premium', '#7B1E22', '#B03A26', '#FCE8C2', '#FFF3DC', '#F0BE72', 'kalash-door', 94, '2026-10-07', 'A kalash and mango leaves before a grand doorway in kumkum red and gold.', 'house warming shubh griha pravesh kalash mango leaves indian traditional maroon gold auspicious'],
    ['New Home, New Blessings', 'new-home-new-blessings', 'house-warming', 'premium', '#0E3A4A', '#186478', '#F6E2B8', '#C4442E', '#DFB05E', 'paisley-home', 86, '2026-10-08', 'Paisley borders around a house emblem in turquoise and saffron for South Asian families.', 'house warming new home new blessings paisley turquoise saffron south asian traditional'],
    ['Vastu Harmony', 'vastu-harmony', 'house-warming', 'premium', '#FDF6EC', '#F2E4CE', '#4A2E1E', '#C08A4E', '#E0C0A0', 'vastu-diamond', 84, '2026-10-09', 'A vastu compass of diamonds and leaves on warm cream for an auspicious ceremony.', 'house warming vastu harmony vastu compass diamond auspicious indian traditional elegant'],
    ['A Fresh Beginning', 'fresh-beginning', 'house-warming', 'premium', '#EAF4FC', '#CBE2F5', '#16324F', '#1F4370', '#C08A3E', 'open-door', 85, '2026-10-10', 'An open door with a sunburst above in navy and gold for a contemporary Western welcome.', 'house warming a fresh beginning open door sunburst navy gold contemporary western modern'],
    ['Rustic Farmhouse', 'rustic-farmhouse', 'house-warming', 'premium', '#F3E9DC', '#E0CFB4', '#3A2416', '#8A4E2E', '#C08A5E', 'wheat-house', 83, '2026-10-11', 'Wheat sheaves flanking a farmhouse roofline in terracotta and cream for a rustic welcome.', 'house warming rustic farmhouse wheat terracotta cream rustic country homestead cozy'],
    ['City Nest', 'city-nest', 'house-warming', 'premium', '#EFF3F6', '#D3DEE7', '#1B2C3A', '#22384A', '#6E8CA3', 'skyline-key', 82, '2026-10-12', 'A key over a modern skyline in cool slate for an apartment housewarming.', 'house warming city nest apartment skyline key slate modern urban contemporary'],
    ['Villa Dreams', 'villa-dreams', 'house-warming', 'premium', '#0E2A3E', '#1E4E78', '#E8F0FA', '#7FB0F0', '#E8C05E', 'villa-arch', 89, '2026-10-13', 'An arched villa doorway in royal blue and gold for a luxury villa housewarming.', 'house warming villa dreams villa arch royal blue gold luxury premium elegant'],
    ['Garden Housewarming', 'garden-housewarming', 'house-warming', 'premium', '#F0F6EC', '#DCE8D0', '#24341E', '#4E7A3E', '#E8A8BE', 'garden-arch', 84, '2026-10-14', 'An arch of garden blooms and leaves for an outdoor garden housewarming party.', 'house warming garden housewarming arch blooms leaves garden outdoor floral party'],
    ['Blooms & Bricks', 'blooms-and-bricks', 'house-warming', 'premium', '#FDF1F5', '#F5DBE8', '#5A2040', '#C06A9E', '#E8C0DA', 'rose-house', 86, '2026-10-15', 'A rose vine growing around a house silhouette in blush for floral elegance.', 'house warming blooms and bricks rose vine house blush pink floral elegance romantic'],
    ['Boho Home', 'boho-home', 'house-warming', 'premium', '#F5E8DC', '#E4CFB8', '#4A2C1C', '#B06A2E', '#8AA8A0', 'boho-door', 82, '2026-10-16', 'A pampas-framed doorway in terracotta and mustard for a free-spirited boho home.', 'house warming boho home pampas doorway terracotta mustard bohemian free spirit'],
    ['Nordic Nest', 'nordic-nest', 'house-warming', 'premium', '#F4F7F8', '#DEE6EA', '#22323E', '#2E4A5E', '#9AB0BE', 'nordic-house', 81, '2026-10-17', 'A clean Scandinavian house in cool grey-blue for a minimal Nordic welcome.', 'house warming nordic nest scandinavian grey blue minimal clean scandi modern'],
    ['Mediterranean Home', 'mediterranean-home', 'house-warming', 'premium', '#F6FAFD', '#DCEAF4', '#123A5E', '#1A5484', '#E8A85E', 'mediterranean-arch', 85, '2026-10-18', 'A whitewashed arch with a terracotta sun in Aegean blue for Mediterranean charm.', 'house warming mediterranean home arch whitewash aegean blue terracotta sun coastal'],
    ['Tropical Hideaway', 'tropical-hideaway', 'house-warming', 'premium', '#0C3226', '#1A5C3E', '#F6E8C8', '#E0A02E', '#8AC49A', 'tropical-leaf', 86, '2026-10-19', 'Monstera leaves around a house medallion in tropical teal and gold.', 'house warming tropical hideaway monstera leaves teal gold tropical island paradise'],
    ['Royal Residence', 'royal-residence', 'house-warming', 'premium', '#2A1440', '#5C2A7A', '#F3D9A0', '#D9B45E', '#C9A8DE', 'royal-crest', 92, '2026-10-20', 'A jewelled crest above a house emblem in royal purple and gold for luxury.', 'house warming royal residence crest royal purple gold luxury regal premium'],
    ['Gold & Ivory', 'gold-and-ivory', 'house-warming', 'premium', '#FDF6EC', '#F2E4CE', '#4A3A1E', '#8A6A28', '#C9A85E', 'gold-door', 90, '2026-10-21', 'A gold keyhole on ivory with fine laurel lines for a classic gold-and-ivory card.', 'house warming gold and ivory keyhole ivory gold classic elegant refined timeless'],
    ['Champagne Housewarming', 'champagne-housewarming', 'house-warming', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#E8C0DA', 'champagne-glasses', 88, '2026-10-22', 'Two raised coupe glasses in black and champagne for a glamorous celebration.', 'house warming champagne housewarming coupe glasses black champagne glamour luxury party'],
    ['Watercolor Home', 'watercolor-home', 'house-warming', 'premium', '#F6F4FD', '#DED7F6', '#2C2054', '#3F2E78', '#8A76C9', 'watercolor-house', 83, '2026-10-23', 'A watercolour house in soft lavender washes for a dreamy artistic welcome.', 'house warming watercolor home watercolour house lavender violet artistic dreamy soft'],
    ['Our Family Home', 'our-family-home', 'house-warming', 'premium', '#FBF3E8', '#EFDFC4', '#4A2C18', '#8A5A2E', '#C9A85E', 'family-house', 87, '2026-10-24', 'A house under a family tree on warm tan for grandparents and extended family.', 'house warming our family home family tree warm tan grandparents extended family traditional'],
    ['Home & Heart', 'home-and-heart', 'house-warming', 'premium', '#FDF1EF', '#F4D8D2', '#4A2026', '#B04E5E', '#E8B8A8', 'heart-house', 85, '2026-10-25', 'A house with a heart above it in soft rose for a couple\'s first home together.', 'house warming home and heart heart rose blush couple newlyweds first home romantic'],
    ['New Home Party', 'new-home-party', 'house-warming', 'premium', '#FFF6E5', '#FFE0B8', '#4A2410', '#B5401A', '#E08A1E', 'confetti-house', 80, '2026-10-26', 'Confetti and a house emblem in bright party colours for a casual housewarming bash.', 'house warming new home party confetti bright casual party fun celebration friends'],
    ['Home Blessing', 'home-blessing', 'house-warming', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#8A6A28', '#C9A85E', 'blessing-house', 82, '2026-10-27', 'A lit candle and a house in ivory and gold for a religious home-blessing ceremony.', 'house warming home blessing candle prayer ceremony religious ivory gold sacred'],
    ['A Place to Call Home', 'a-place-to-call-home', 'house-warming', 'premium', '#F7F4EE', '#E6DFD2', '#33302A', '#5A4E3C', '#9A8A66', 'globe-house', 81, '2026-10-28', 'A house within a globe ring in warm neutral tones for an international neutral welcome.', 'house warming a place to call home globe international neutral universal modern minimal'],
    ['Honour Roll', 'honour-roll', 'graduation', 'free', '#2A1436', '#5A2C6E', '#F0DEFA', '#FFFFFF', '#C08FD8', 'book', 78, '2026-04-04', 'Academic purple and an open book for convocation day.'],
    ['Cap And Gown', 'cap-and-gown', 'graduation', 'free', '#12261E', '#28513E', '#DDF0E6', '#FFFFFF', '#8AC4A6', 'cap', 75, '2026-04-10', 'Deep green and gold, cut for a formal convocation notice.'],
    ['Bright Future', 'bright-future', 'graduation', 'free', '#0F1F3E', '#254878', '#DCE8FC', '#FFFFFF', '#8AAAE0', 'stars', 72, '2026-04-16', 'Night blue with a scatter of stars for the year they finished.'],
    ['Class of 2026', 'class-of-2026', 'graduation', 'premium', '#0E1B33', '#2A4A7C', '#F2D9A8', '#C9A85E', '#8AAAE0', 'cap', 97, '2027-03-10', 'Navy and gold academic styling with a classic mortarboard for the class of the year.', 'graduation class of 2026 cap navy gold academic mortarboard classic'],
    ['Proud Graduate', 'proud-graduate', 'graduation', 'premium', '#2A1440', '#5C2A7A', '#F0E0C8', '#D9B45E', '#C9A6F5', 'seal', 95, '2027-03-11', 'A gold medallion on royal purple to mark the moment the degree was won.', 'graduation proud graduate medallion royal purple gold premium convocation'],
    ['Graduation Celebration', 'graduation-celebration', 'graduation', 'premium', '#FFF6E5', '#FFE0B8', '#4A2410', '#B5401A', '#C9A85E', 'confetti', 93, '2027-03-12', 'Confetti, coral and mustard for a bright and joyful graduation party.', 'graduation celebration confetti coral mustard party bright fun'],
    ['Commencement Ceremony', 'commencement-ceremony', 'graduation', 'premium', '#4A0E1E', '#8A1E34', '#FBE0C4', '#E8A85E', '#F0BE72', 'laurel', 91, '2027-03-13', 'A laurel-wreathed panel in burgundy and cream for a formal ceremony.', 'graduation commencement ceremony laurel burgundy cream formal panel'],
    ['The Next Chapter', 'the-next-chapter', 'graduation', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#E8C0DA', 'book', 89, '2027-03-14', 'An open book under chevrons on near-black for someone turning the page.', 'graduation next chapter book chevron dark gold editorial modern'],
    ['Finally Graduated', 'finally-graduated', 'graduation', 'premium', '#FAFAF8', '#ECECE8', '#2A2A28', '#C9A85E', '#4A4A46', 'cap', 88, '2027-03-15', 'A minimal ivory card with a single gold cap — done at last.', 'graduation finally graduated minimal ivory gold simple clean cap'],
    ['Degree & Dreams', 'degree-and-dreams', 'graduation', 'premium', '#1A0F33', '#3A1E6B', '#EADDFF', '#C9A6F5', '#F2D9A8', 'moon', 87, '2027-03-16', 'A crescent moon, stars and an open book on deep violet for dreamers.', 'graduation degree and dreams moon stars book violet dreamy celestial'],
    ['Future Is Bright', 'future-is-bright', 'graduation', 'premium', '#12261E', '#28513E', '#DDF0E6', '#C9A85E', '#8AC4A6', 'sun', 86, '2027-03-17', 'A rising sun in emerald and gold for the dawn after the degree.', 'graduation future is bright sunrise emerald gold hopeful optimistic'],
    ['Cap & Gown', 'cap-and-gown-2026', 'graduation', 'premium', '#0E2A3A', '#1E5470', '#E8DFB4', '#C9A85E', '#8AC4D8', 'laurel', 85, '2027-03-18', 'A laurel wreath around a mortarboard in oxford blue for convocation.', 'graduation cap and gown oxford blue laurel convocation classic university'],
    ['Graduation Party', 'graduation-party', 'graduation', 'premium', '#FFF0E5', '#FFD9BE', '#4A2E1E', '#B5401A', '#C9A85E', 'confetti', 84, '2027-03-19', 'Pizza, music and confetti — a warm party card for the graduate.', 'graduation party pizza music confetti casual celebration friends'],
    ['Senior Celebration', 'senior-celebration', 'graduation', 'premium', '#0E2A1E', '#1E5C40', '#E8DFB4', '#C9A85E', '#8AC4A6', 'laurel', 83, '2027-03-20', 'Deep green laurel and gold for honouring the seniors of the year.', 'graduation senior celebration laurel deep green gold honour yearbook'],
    ['Academic Achievement', 'academic-achievement', 'graduation', 'premium', '#101C30', '#1E3A5E', '#E8DCA8', '#C9A85E', '#8E9DD4', 'book', 82, '2027-03-21', 'First-class honours in navy and champagne — an editorial academic card.', 'graduation academic achievement honours book navy champagne editorial distinction'],
    ['Journey Complete', 'journey-complete', 'graduation', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#C9A85E', '#8A6A28', 'scroll', 81, '2027-03-22', 'An ivory and champagne scroll for a journey that ended exactly as planned.', 'graduation journey complete scroll ivory champagne elegant complete'],
    ['New Beginnings', 'new-beginnings-grad', 'graduation', 'premium', '#EFF6F0', '#D9E8DD', '#24523E', '#3E8A5E', '#C9A85E', 'arch', 79, '2027-03-23', 'A sage arch and gold star for the fresh start that begins after graduation.', 'graduation new beginnings arch sage green star fresh start botanical'],
    ['Cheers to the Graduate', 'cheers-to-the-graduate', 'graduation', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#E8C0DA', 'coupe', 77, '2027-03-24', 'Two clinking coupe glasses on black and champagne — raise a glass.', 'graduation cheers to the graduate coupe glasses champagne toast celebrate'],
    ['Diploma Day', 'diploma-day', 'graduation', 'premium', '#0F1F3E', '#254878', '#DCE8FC', '#C9A85E', '#8AAAE0', 'scroll', 76, '2027-03-25', 'A formal navy and gold certificate card for the day the diploma arrives.', 'graduation diploma day certificate navy gold formal official scroll'],
    ['Graduation Gala', 'graduation-gala', 'graduation', 'premium', '#0B0B0F', '#2E2418', '#F3D9A0', '#DCB264', '#C9A6F5', 'sparkle', 74, '2027-03-26', 'Sparks and a gold seal on black for a black-tie graduation ball.', 'graduation gala sparkle black gold black tie ball glamour evening'],
    ['Honors & Achievement', 'honors-and-achievement', 'graduation', 'premium', '#1A0F33', '#4A2B7A', '#EADDFF', '#C9A85E', '#C9A6F5', 'laurel', 73, '2027-03-27', 'Summa cum laude in royal purple — for the highest honours.', 'graduation honors and achievement summa cum laude laurel royal purple highest honours'],
    ['Class Valedictorian', 'class-valedictorian', 'graduation', 'premium', '#3E0A12', '#7A1E2A', '#FBE0C4', '#E8A85E', '#F0BE72', 'seal', 71, '2027-03-28', 'A burgundy seal for the valedictorian who came first in the class.', 'graduation valedictorian seal burgundy first in class honour speech'],
    ['College Graduation', 'college-graduation', 'graduation', 'premium', '#0E1B2E', '#1E4A6E', '#EDDDC4', '#8AC4D8', '#C9A85E', 'geometric', 70, '2027-03-29', 'A modern geometric ring in navy and mint for the college years ending.', 'graduation college geometric navy mint modern rings degree'],
    ['High School Graduation', 'high-school-graduation', 'graduation', 'premium', '#FDF6EC', '#F2E4CE', '#3A2A18', '#1E4A6E', '#C08A3E', 'confetti', 69, '2027-03-30', 'Bright confetti and navy cap for the last bell and the adventure ahead.', 'graduation high school confetti cap bright school memories adventure'],
    ['University Graduation', 'university-graduation', 'graduation', 'premium', '#232020', '#4A3A28', '#F2E0BC', '#C9A85E', '#8E9DD4', 'arch', 68, '2027-03-31', 'A charcoal arch and gold cap for the postgraduate chapter beginning.', 'graduation university arch charcoal gold masters doctorate postgraduate convocation'],
    ['Graduation Brunch', 'graduation-brunch', 'graduation', 'premium', '#F6F0FD', '#E4DAF2', '#3E2E6E', '#8A76C9', '#C9A85E', 'floral', 67, '2027-04-01', 'Lavender blooms and mimosas for a Sunday-morning graduation brunch.', 'graduation brunch lavender floral mimosas sunday morning garden'],
    ['Graduation Open House', 'graduation-open-house', 'graduation', 'premium', '#F5E8DC', '#E4CFB8', '#3A2416', '#B06A2E', '#8A5A2E', 'house', 66, '2027-04-02', 'A warm tan house banner for an open house — drop in and say congrats.', 'graduation open house banner warm tan home drop in congratulations'],
    ['Walk the Stage', 'walk-the-stage', 'graduation', 'premium', '#0B1030', '#2B1E63', '#D6E2FF', '#C9A85E', '#8FB4FF', 'stars', 65, '2027-04-03', 'A gold spotlight and scattered stars for the walk across the stage.', 'graduation walk the stage spotlight stars midnight gold take the bow'],
    ['Golden Years', 'golden-years', 'retirement', 'free', '#33280E', '#6E5720', '#F8E6BC', '#FFFFFF', '#DCBB6E', 'leaves', 74, '2026-04-07', 'Antique gold and laurel for a long career closing well.'],
    ['Safe Harbour', 'safe-harbour', 'retirement', 'free', '#102A34', '#245663', '#DBEFF4', '#FFFFFF', '#87BFCE', 'flag', 70, '2026-04-13', 'Sea blue and quiet type for a dignified send-off.'],
    ['With Gratitude', 'with-gratitude', 'retirement', 'free', '#33161C', '#6E3138', '#F8DEDF', '#FFFFFF', '#DC9298', 'leaves', 67, '2026-04-19', 'Warm russet and laurel for a thank-you gathering.'],
    ['Cheers to Retirement', 'cheers-to-retirement', 'retirement', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#E8C0DA', 'coupe', 90, '2027-04-05', 'Clinking champagne coupes on espresso black for a luxurious toast to retirement.', 'retirement cheers champagne coupe toast black gold luxury premium celebration'],
    ['New Chapter', 'new-chapter-retirement', 'retirement', 'premium', '#0E1B33', '#2A4A7C', '#F2D9A8', '#C9A85E', '#8AAAE0', 'book', 89, '2027-04-06', 'An open book beneath a rising sun in navy and gold for the chapter that begins now.', 'retirement new chapter long service career book rising sun navy gold celebrate'],
    ['Happy Retirement', 'happy-retirement', 'retirement', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#B06A2E', '#C9A85E', 'balloon', 88, '2027-04-07', 'Warm beige balloons in terracotta and gold for a friendly, joyful send-off.', 'retirement happy balloons warm beige terracotta party farewell cheerful'],
    ['Retirement Celebration', 'retirement-celebration', 'retirement', 'premium', '#4A0E1E', '#8A1E34', '#FBE0C4', '#E8A85E', '#F0BE72', 'laurel', 87, '2027-04-08', 'A laurel-wreathed panel in burgundy and champagne for a formal retirement dinner.', 'retirement celebration dinner laurel burgundy champagne formal elegant honour'],
    ['Farewell to Work', 'farewell-to-work', 'retirement', 'premium', '#16324A', '#2E6285', '#DCEEF8', '#8CC2DE', '#C9A85E', 'clock', 86, '2027-04-09', 'A clock in slate blue for the office farewell and the last day of the working years.', 'retirement farewell work office clock slate blue colleagues party'],
    ['Golden Years', 'golden-years-2026', 'retirement', 'premium', '#0F1F3E', '#254878', '#F3D9A0', '#C9A85E', '#8AAAE0', 'sun', 85, '2027-04-10', 'A gold sunburst and stars on deep blue for the golden years finally arriving.', 'retirement golden years sun stars deep blue gold luxury new'],
    ['Time to Relax', 'time-to-relax', 'retirement', 'premium', '#EFF6F0', '#D9E8DD', '#24523E', '#3E8A5E', '#C9A85E', 'moon', 84, '2027-04-11', 'A calm moon on sage green for the long rest that has been so well earned.', 'retirement relax rest sage green moon calm quiet slow peaceful'],
    ['Freedom Begins', 'freedom-begins', 'retirement', 'premium', '#0E3A4A', '#186478', '#F6E2B8', '#DFB05E', '#8AC4D8', 'plane', 83, '2027-04-12', 'A rising horizon with birds and a plane in teal and gold for freedom from the 9 to 5.', 'retirement freedom travel adventure horizon plane birds teal gold'],
    ['Retirement Party', 'retirement-party', 'retirement', 'premium', '#FFF0E5', '#FFD9BE', '#4A2E1E', '#B5401A', '#C9A85E', 'confetti', 82, '2027-04-13', 'Confetti and coupe glasses in coral and mustard for a bright retirement party.', 'retirement party confetti coupe coral mustard fun celebration friends'],
    ['The Next Adventure', 'the-next-adventure', 'retirement', 'premium', '#0E2A3A', '#1E5470', '#E8DFB4', '#C9A85E', '#8AC4D8', 'suitcase', 81, '2027-04-14', 'A suitcase beneath a paper plane for the new adventure retirement unlocks.', 'retirement new adventure travel suitcase plane journey exploration'],
    ['Years of Memories', 'years-of-memories', 'retirement', 'premium', '#FAFAF8', '#ECECE8', '#2A2A28', '#C9A85E', '#4A4A46', 'frame', 80, '2027-04-15', 'Framed memories in ivory and charcoal for a lifetime of photographs and stories.', 'retirement memories frames ivory charcoal minimal editorial photos story'],
    ['Goodbye & Good Luck', 'goodbye-and-good-luck', 'retirement', 'premium', '#F5E8DC', '#E4CFB8', '#3A2416', '#B06A2E', '#8A5A2E', 'balloon', 79, '2027-04-16', 'A terracotta hot-air balloon with stars for a warm goodbye and good luck wishes.', 'retirement goodbye good luck hot air balloon terracotta warm send off'],
    ['Work Ends, Life Begins', 'work-ends-life-begins', 'retirement', 'premium', '#0E2A1E', '#1E5C40', '#E8DFB4', '#C9A85E', '#8AC4A6', 'sun', 78, '2027-04-17', 'A sunset horizon in deep green and gold as the working life gives way to a new one.', 'retirement work ends life begins sunset green gold new beginning'],
    ['Retirement Brunch', 'retirement-brunch', 'retirement', 'premium', '#F6F0FD', '#E4DAF2', '#3E2E6E', '#8A76C9', '#C9A85E', 'coffee', 77, '2027-04-18', 'A steaming coffee cup in lavender for a gentle Sunday-morning retirement brunch.', 'retirement brunch coffee lavender pastel morning garden mimosas'],
    ['A Lifetime of Achievement', 'a-lifetime-of-achievement', 'retirement', 'premium', '#12261E', '#28513E', '#DDF0E6', '#C9A85E', '#8AC4A6', 'seal', 76, '2027-04-19', 'A medal seal within laurel in emerald and gold for a career achievement celebrated.', 'retirement career achievement lifetime medal laurel emerald gold honour'],
    ['Until We Meet', 'until-we-meet', 'farewell', 'free', '#1B2440', '#3A4B7C', '#DFE5FA', '#FFFFFF', '#8E9DD4', 'lights', 73, '2026-04-05', 'Dusk blue and string lights for a last evening together.'],
    ['New Chapter', 'new-chapter', 'farewell', 'free', '#2E1B0E', '#63401F', '#F6E2CE', '#FFFFFF', '#D9A86E', 'book', 70, '2026-04-12', 'Warm paper tones and an open book for someone moving on.'],
    ['Send Off', 'send-off', 'farewell', 'free', '#14302C', '#2C645C', '#D8F0EA', '#FFFFFF', '#84C6BA', 'music', 68, '2026-04-18', 'Teal and a soft melody line for a team send-off.'],
    ['Until We Meet Again', 'until-we-meet-again', 'farewell', 'premium', '#0A1128', '#1E2A54', '#E6E9FF', '#B9C4F0', '#C9A85E', 'road', 95, '2027-04-20', 'An open road beneath the stars in midnight blue and silver for a heartfelt farewell celebration.', 'farewell until we meet again road stars midnight silver celebrate'],
    ['Goodbye With Love', 'goodbye-with-love', 'farewell', 'premium', '#F7E4E2', '#E8C6C0', '#5A2E38', '#B06A7A', '#C9A85E', 'heart', 94, '2027-04-21', 'A minimal heart framed by blossom sprigs in dusty rose and warm beige for a loving gathering.', 'farewell goodbye with love heart rose beige friends gathering'],
    ['A Fond Farewell', 'a-fond-farewell', 'farewell', 'premium', '#EFF6F0', '#D7E8DC', '#24523E', '#3E8A5E', '#C9A85E', 'sprig', 93, '2027-04-22', 'Botanical sprigs and a small heart in emerald and cream for a gentle, fond farewell.', 'farewell a fond farewell botanical emerald cream elegant'],
    ['See You On The Other Side', 'see-you-on-the-other-side', 'farewell', 'premium', '#141414', '#2E2A24', '#F3D9A0', '#DCB264', '#E8C0DA', 'coupe', 92, '2027-04-23', 'Clinking champagne coupes on charcoal with champagne gold for an elegant farewell party.', 'farewell see you on the other side coupe party champagne dark'],
    ['New Journey Begins', 'new-journey-begins', 'farewell', 'premium', '#0E3A4A', '#176476', '#F6E2B8', '#DFB05E', '#8AC4D8', 'road', 91, '2027-04-24', 'A rising sun over the open road in teal and gold for the journey that begins now.', 'farewell new journey begins travel road sun teal gold'],
    ['Farewell & Best Wishes', 'farewell-and-best-wishes', 'farewell', 'premium', '#4A0E1E', '#7A1E34', '#FBE0C4', '#E8A85E', '#F0BE72', 'ribbon', 90, '2027-04-25', 'An elegant ribbon bow in burgundy and champagne gold carrying every best wish.', 'farewell best wishes ribbon burgundy champagne best'],
    ['Cheers To New Beginnings', 'cheers-to-new-beginnings', 'farewell', 'premium', '#1A150D', '#3A2E18', '#F3D9A0', '#DCB264', '#C9A85E', 'coupe', 89, '2027-04-26', 'Confetti and coupe glasses in luxury dark gold for a joyful toast to new beginnings.', 'farewell cheers new beginnings coupe confetti party toast'],
    ['Until Our Paths Cross Again', 'until-our-paths-cross-again', 'farewell', 'premium', '#0D1226', '#2A2F63', '#DCE2FF', '#8FA0E8', '#C9A85E', 'path', 88, '2027-04-27', 'Two abstract paths that cross beneath silver stars in midnight blue for a hopeful goodbye.', 'farewell until our paths cross again paths midnight silver'],
    ['Goodbye, Dear Friend', 'goodbye-dear-friend', 'farewell', 'premium', '#FFF0E5', '#FBD4C4', '#5A2E22', '#E07A5A', '#B06A9E', 'heart', 87, '2027-04-28', 'Minimal hearts in soft peach and rose for a warm goodbye to a dear friend.', 'farewell goodbye dear friend hearts peach rose friends'],
    ['Memories We Keep', 'memories-we-keep', 'farewell', 'premium', '#2A1440', '#5C2A7A', '#EADDFF', '#C9A6F5', '#F2D9A8', 'frame', 86, '2027-04-29', 'Framed memories with blossom sprigs in plum and lavender for stories we treasure.', 'farewell memories we keep frames plum lavender memories'],
    ['One Chapter Ends', 'one-chapter-ends', 'farewell', 'premium', '#2E1B0E', '#5C3A1A', '#F6E2CE', '#D9A86E', '#C9A85E', 'pages', 85, '2027-04-30', 'A closing page beneath a new one in warm brown and gold for new beginnings.', 'farewell one chapter ends new beginnings pages brown gold'],
    ['A Beautiful Goodbye', 'a-beautiful-goodbye', 'farewell', 'premium', '#F5E8DC', '#E4CFB8', '#3A2416', '#B06A2E', '#8A5A2E', 'sprig', 84, '2027-05-01', 'Blossom sprigs around a warm heart in terracotta and cream for a lovely send-off.', 'farewell a beautiful goodbye flowers terracotta cream warm'],
    ['Wishing You The Best', 'wishing-you-the-best', 'farewell', 'premium', '#EFF6F0', '#DCE8D2', '#24523E', '#5A8A6A', '#C9A85E', 'sun', 83, '2027-05-02', 'A calm sun over leafy sprigs in sage and ivory carrying every good wish.', 'farewell wishing you the best sun sage ivory best wishes'],
    ['Goodbye For Now', 'goodbye-for-now', 'farewell', 'premium', '#F0F4FB', '#D8E4F5', '#2E3E5C', '#5A82C4', '#B06A9E', 'balloon', 82, '2027-05-03', 'Soft balloons and stars in pastel lavender for a cheerful, see-you-soon party.', 'farewell goodbye for now balloons pastel lavender party'],
    ['New Adventures Await', 'new-adventures-await', 'farewell', 'premium', '#0F1F3E', '#254878', '#F3D9A0', '#C9A85E', '#8AAAE0', 'plane', 81, '2027-05-04', 'A paper plane above a compass in travel navy and gold for the adventure ahead.', 'farewell new adventures await travel plane compass navy gold'],
    ['Friends Forever', 'friends-forever', 'farewell', 'premium', '#FDF1F5', '#F0DAE4', '#5A2040', '#C06A9E', '#E8C0DA', 'heart', 80, '2027-05-05', 'A minimal heart with gentle lines in dusty pink for friends who stay close forever.', 'farewell friends forever hearts pink friends friendship'],
    ['Bon Voyage', 'bon-voyage', 'farewell', 'premium', '#0C3A4A', '#1A6480', '#E6F4F8', '#8AC4D8', '#F2D9A8', 'plane', 79, '2027-05-06', 'A paper plane sailing through clouds in deep teal and gold for a travel send-off.', 'farewell bon voyage travel plane clouds teal gold'],
    ['Safe Travels', 'safe-travels', 'farewell', 'premium', '#EAF4FC', '#CDE4F2', '#123A4A', '#2E6285', '#8CC2DE', 'plane', 78, '2027-05-07', 'A paper plane over soft clouds in sky blue for a cheerful safe-travels goodbye.', 'farewell safe travels plane clouds sky blue travel'],
    ['Goodbye Teacher', 'goodbye-teacher', 'farewell', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#C08A3E', '#8A5A2E', 'book', 77, '2027-05-08', 'An open book with pencils in warm paper tones for a heartfelt school farewell.', 'farewell goodbye teacher school book pencils classroom'],
    ['Farewell Classmates', 'farewell-classmates', 'farewell', 'premium', '#EEF4FF', '#CFE0FA', '#16294A', '#1F3D74', '#5A82C4', 'book', 76, '2027-05-09', 'An open book and stars in bright school blue for a classmates send-off.', 'farewell classmates school book stars blue class'],
    ['Graduation Goodbye', 'graduation-goodbye', 'farewell', 'premium', '#101B33', '#26406E', '#E4D5A8', '#C9A85E', '#8AAAE0', 'cap', 75, '2027-05-10', 'A graduation cap with stars in navy and gold for a proud college farewell.', 'farewell graduation goodbye college cap navy gold'],
    ['Farewell Seniors', 'farewell-seniors', 'farewell', 'premium', '#160D2B', '#4B1178', '#EEC6FF', '#C77DF0', '#F2D9A8', 'cap', 74, '2027-05-11', 'A graduation cap with confetti in college purple for a senior farewell party.', 'farewell seniors college cap confetti purple party'],
    ['Goodbye Colleague', 'goodbye-colleague', 'farewell', 'premium', '#EFF3F6', '#D3DEE7', '#1B2C3A', '#22384A', '#6E8CA3', 'briefcase', 73, '2027-05-12', 'A briefcase with a clock in corporate slate for a professional office farewell.', 'farewell goodbye colleague office briefcase corporate slate'],
    ['Thank You For Everything', 'thank-you-for-everything', 'farewell', 'premium', '#F2F5F9', '#D8E1EC', '#10263C', '#17324F', '#4A7BA8', 'ribbon', 72, '2027-05-13', 'A ribbon and hearts in professional blue thanking a colleague for everything.', 'farewell thank you for everything workplace ribbon blue'],
    ['Farewell To A Wonderful Leader', 'farewell-to-a-wonderful-leader', 'farewell', 'premium', '#0B1220', '#1D3A63', '#CFE2FA', '#7FB2F0', '#C9A85E', 'laurel', 71, '2027-05-14', 'A laurel wreath around a medal seal in formal navy and gold honouring a leader.', 'farewell leader laurel professional formal navy gold honour'],
    ['Farewell Dear Family', 'farewell-dear-family', 'farewell', 'premium', '#F7EDE0', '#E8D4BC', '#3A2416', '#8A5A2E', '#C9A85E', 'door', 70, '2027-05-15', 'An open door with blossom sprigs in warm family tones for a loved family goodbye.', 'farewell dear family family door warm home gathering'],
    ['Memories Forever', 'memories-forever', 'farewell', 'premium', '#FAF5EC', '#EBDFC8', '#4A3A1E', '#B08A4A', '#8A6A28', 'frame', 69, '2027-05-16', 'Framed memories with hearts in soft gold for a family that keeps them forever.', 'farewell memories forever family frames gold hearts'],
    ['A Toast To Your Next Adventure', 'a-toast-to-your-next-adventure', 'farewell', 'premium', '#FFF6EC', '#F8DFC0', '#4A2810', '#C98A2E', '#B06A9E', 'coupe', 68, '2027-05-17', 'Coupe glasses and stars in champagne for raising a toast to the next adventure.', 'farewell toast next adventure coupe champagne party'],
    ['Culturals Night', 'culturals-night', 'college-events', 'free', '#1E0C34', '#4E1878', '#EEC8FF', '#FFFFFF', '#C078E8', 'confetti', 82, '2026-04-03', 'Stage purple and confetti for culturals and cultural nights.'],
    ['Tech Symposium', 'tech-symposium', 'college-events', 'free', '#08202C', '#134C60', '#D2EEF8', '#FFFFFF', '#74C2DC', 'geometric', 78, '2026-04-09', 'Circuit teal and clean geometry for symposiums and hackathons.'],
    ['Freshers Party', 'freshers-party', 'college-events', 'free', '#340C22', '#701A4A', '#FCC8E4', '#FFFFFF', '#E874AE', 'balloons', 75, '2026-04-15', 'Hot pink and balloons for freshers and farewell parties.'],
    ['College Annual Day', 'college-annual-day', 'college-events', 'premium', '#14213D', '#2A3A6E', '#F5E7C6', '#C9A85E', '#8FA8D8', 'laurel', 95, '2027-06-28', 'Laurel and stars in navy and gold for the annual day celebration of the whole college.', 'college annual day laurel stars navy gold auditorium celebration'],
    ['Grand College Fest', 'grand-college-fest', 'college-events', 'premium', '#2A1050', '#5A1E8A', '#E8E0FF', '#B388FF', '#39D0C0', 'confetti', 94, '2027-06-29', 'Confetti and a microphone in college purple and teal for a two-day campus festival.', 'college fest grand festival confetti mic purple teal music ground'],
    ['Freshers Welcome', 'freshers-welcome', 'college-events', 'premium', '#0E3A5C', '#1E6E96', '#EAF6FF', '#FF8A70', '#7FD0E0', 'balloon', 93, '2027-06-30', 'Balloons and an upward arrow in sky blue and coral to welcome the new batch to campus.', 'freshers welcome new batch balloons arrow sky coral orientation'],
    ['College Farewell Party', 'college-farewell-party', 'college-events', 'premium', '#4A0E1E', '#8E1E38', '#FDE4C8', '#E8B060', '#C9A85E', 'notes', 92, '2027-07-01', 'Music notes and stars in crimson and gold for a heartfelt college farewell party.', 'college farewell party music notes crimson gold memories seniors'],
    ['Graduation Ceremony', 'graduation-ceremony', 'college-events', 'premium', '#0E3A2A', '#1E6E4E', '#E8F6EA', '#C9A85E', '#7FD0A8', 'gradcap', 91, '2027-07-02', 'A graduation cap with gold tassel in emerald for the ceremony honouring the graduating class.', 'graduation ceremony cap emerald gold class of tassel honour'],
    ['Convocation Ceremony', 'convocation-ceremony', 'college-events', 'premium', '#101C3A', '#24345C', '#F5EBD8', '#CBB27E', '#8FA8D8', 'scroll', 90, '2027-07-03', 'A rolled scroll and academic seal in navy and champagne for the formal convocation.', 'convocation ceremony scroll seal degree navy champagne formal'],
    ['Orientation Day', 'orientation-day', 'college-events', 'premium', '#1A2E5C', '#2E4E8A', '#F0F4FF', '#FF8C42', '#8FA8D8', 'compass', 89, '2027-07-04', 'A compass in royal blue and orange to help freshers find their way around campus.', 'orientation day compass royal orange campus welcome guide'],
    ['Freshers Orientation', 'freshers-orientation', 'college-events', 'premium', '#0E3A4C', '#1E6E88', '#EAF8FF', '#2AC4A8', '#7FD0E0', 'arrow', 88, '2027-07-05', 'An arrow and sparkle in sky and teal for the freshers orientation programme.', 'freshers orientation arrow sparkle sky teal welcome programme'],
    ['Alumni Meet', 'alumni-meet', 'college-events', 'premium', '#12261A', '#2A4E34', '#EAF2E4', '#C9A85E', '#7FA88A', 'building', 87, '2027-07-06', 'A university building beneath laurel in forest green and gold for the alumni meet.', 'alumni meet building laurel forest green gold homecoming'],
    ['Alumni Reunion', 'alumni-reunion', 'college-events', 'premium', '#3A1020', '#6E2440', '#F0E4E8', '#C9C4BE', '#E8B060', 'handshake', 86, '2027-07-07', 'A handshake motif in burgundy and silver for the alumni reunion gathering.', 'alumni reunion handshake burgundy silver old friends reconnect'],
    ['Cultural Fest', 'cultural-fest', 'college-events', 'premium', '#5A1220', '#9E2A3C', '#FDF0D8', '#E8B23E', '#C9A85E', 'notes', 85, '2027-07-08', 'Music notes and blossom sprigs in crimson and mustard for the cultural fest.', 'cultural fest music notes crimson mustard dance tradition'],
    ['College Sports Day', 'college-sports-day', 'college-events', 'premium', '#0E3A2E', '#1E6E54', '#F2F8F4', '#FFFFFF', '#7FD0A8', 'trophy', 84, '2027-07-09', 'A trophy with flame accents in emerald and white for the annual sports day.', 'college sports day trophy flame emerald white athletics meet'],
    ['Inter College Sports Meet', 'inter-college-sports-meet', 'college-events', 'premium', '#16284E', '#2A4680', '#F4F0E0', '#C9A85E', '#B0C4E8', 'medal', 83, '2027-07-10', 'A medal and laurel in royal blue and gold for the inter-college sports meet.', 'inter college sports meet medal laurel royal gold championship'],
    ['College Tech Fest', 'college-tech-fest', 'college-events', 'premium', '#0A0A0A', '#1A2E14', '#E8F8E8', '#39FF8C', '#B388FF', 'circuit', 82, '2027-07-11', 'Circuit lines and gears in black and neon green for the campus tech fest.', 'college tech fest circuit gear black neon green innovation'],
    ['Hackathon', 'hackathon', 'college-events', 'premium', '#1E0E3A', '#3A1E6E', '#ECF0E8', '#8CFF39', '#B388FF', 'laptop', 81, '2027-07-12', 'A laptop with code lines in violet and lime for the 48-hour hackathon.', 'hackathon laptop code violet lime overnight build'],
    ['Science Exhibition', 'science-exhibition', 'college-events', 'premium', '#0E2E34', '#1E545C', '#E8F6F4', '#C0D8D8', '#7FD0C4', 'atom', 80, '2027-07-13', 'An atom and lab flask in teal and silver for the department science exhibition.', 'science exhibition atom flask teal silver projects discover'],
    ['College Art Exhibition', 'college-art-exhibition', 'college-events', 'premium', '#5A1E10', '#9E3A1E', '#FDF0DC', '#E8B23E', '#E8C86E', 'brush', 79, '2027-07-14', 'A paint brush and camera in terracotta and mustard for the student art exhibition.', 'college art exhibition brush camera terracotta mustard gallery'],
    ['Music Festival', 'music-festival', 'college-events', 'premium', '#3A1440', '#6E2A80', '#F6E8F8', '#E8B060', '#B388FF', 'notes', 78, '2027-07-15', 'Music notes and stars in plum and gold for the campus music festival.', 'music festival notes plum gold bands open mic campus'],
    ['College Dance Night', 'college-dance-night', 'college-events', 'premium', '#3A0E3A', '#7A1E6E', '#FDE8FA', '#FF6EE8', '#B388FF', 'notes', 77, '2027-07-16', 'Music notes and sparkles in magenta and violet for the college dance night.', 'college dance night notes magenta violet dance music'],
    ['Talent Show', 'talent-show', 'college-events', 'premium', '#14213D', '#2A3A6E', '#F8E8F4', '#FF8AC8', '#8FA8D8', 'star', 76, '2027-07-17', 'A star over the microphone in navy and pink for the open talent show auditions.', 'talent show star mic navy pink auditions perform'],
    ['College Debate Competition', 'college-debate-competition', 'college-events', 'premium', '#1A1A1A', '#363636', '#F5EBD8', '#C9A85E', '#8A8A8A', 'podium', 75, '2027-07-18', 'A lectern podium in charcoal and gold for the inter-college debate competition.', 'college debate competition podium charcoal gold championship argue'],
    ['Quiz Competition', 'quiz-competition', 'college-events', 'premium', '#0E3A44', '#1E6E7A', '#EAF8F4', '#FF8C42', '#7FD0C4', 'trophy', 74, '2027-07-19', 'A trophy with a question mark in teal and orange for the quiz finals.', 'quiz competition trophy question teal orange brain'],
    ['Seminar', 'seminar', 'college-events', 'premium', '#101C3A', '#24345C', '#ECF0F8', '#C0C8D8', '#8FA8D8', 'podium', 73, '2027-07-20', 'A podium and open book in navy and silver for the campus seminar series.', 'seminar podium book navy silver talk ideas'],
    ['Guest Lecture', 'guest-lecture', 'college-events', 'premium', '#12261A', '#2A4E34', '#F4F0E0', '#C9A85E', '#7FA88A', 'book', 72, '2027-07-21', 'An open book framed by sprigs in forest green and gold for the guest lecture.', 'guest lecture book forest green gold speaker industry'],
    ['Workshop', 'workshop', 'college-events', 'premium', '#1A2A34', '#2E4E60', '#F4F0E0', '#E8A83E', '#8FA8C8', 'gear', 71, '2027-07-22', 'A gear and laptop in slate and amber for the hands-on skills workshop.', 'workshop gear laptop slate amber hands on skills'],
    ['Career Fair', 'career-fair', 'college-events', 'premium', '#1A2E5C', '#2E4E8A', '#F0F6FF', '#7FD0E8', '#C0D8F0', 'briefcase', 70, '2027-07-23', 'A briefcase before office buildings in royal blue and sky for the career fair.', 'career fair briefcase recruiters jobs companies royal sky'],
    ['Placement Drive', 'placement-drive', 'college-events', 'premium', '#0E1628', '#22304E', '#EEF2F8', '#C0C8D8', '#8FA8D8', 'handshake', 69, '2027-07-24', 'A handshake with a briefcase in navy and silver for the on-campus placement drive.', 'placement drive handshake briefcase navy silver recruitment'],
    ['College Awards Night', 'college-awards-night', 'college-events', 'premium', '#0E0E0E', '#26221A', '#F5EBD8', '#DCB264', '#E8E0D0', 'trophy', 68, '2027-07-25', 'A gold trophy and stars on black for the annual college awards night.', 'college awards night trophy gold black prize ceremony'],
    ['Student Achievement Ceremony', 'student-achievement-ceremony', 'college-events', 'premium', '#4A0E1E', '#8E1E38', '#FDF0E0', '#F5E7C6', '#E8B060', 'medal', 67, '2027-07-26', 'A medal within laurel in crimson and cream for the student achievement ceremony.', 'student achievement ceremony medal laurel crimson cream toppers'],
    ['College Foundation Day', 'college-foundation-day', 'college-events', 'premium', '#3A1020', '#6E2440', '#F5ECD8', '#CBB27E', '#D8C0A8', 'torch', 66, '2027-07-27', 'A torch beside university buildings in burgundy and champagne for foundation day.', 'college foundation day torch building burgundy champagne anniversary'],
    ['College Club Event', 'college-club-event', 'college-events', 'premium', '#1E0E3A', '#3A1E6E', '#F0E8F8', '#39D0C0', '#B388FF', 'shield', 65, '2027-07-28', 'A shield and stars in violet and teal for the college clubs open house.', 'college club event shield violet teal open house clubs'],
    ['College Graduation Party', 'college-graduation-party', 'college-events', 'premium', '#0E3A5C', '#1E6E96', '#F5EBD8', '#E8B060', '#C9A85E', 'confetti', 64, '2027-07-29', 'Confetti, a graduation cap and balloons in sky and gold for the graduation party.', 'college graduation party confetti cap balloons sky gold celebrate'],
    ['Rooftop Night', 'rooftop-night', 'party', 'free', '#0E1424', '#26314E', '#DCE4F8', '#FFFFFF', '#8898C8', 'lights', 80, '2026-04-04', 'City night blue and warm bulbs for a rooftop get-together.', 'rooftop party night city lights get together'],
    ['Dinner Party', 'dinner-party', 'party', 'free', '#2E1010', '#66282A', '#F8DCDC', '#FFFFFF', '#DC8E90', 'lights', 74, '2026-04-11', 'Deep claret and candlelight for a sit-down dinner.', 'dinner party sit down dinner table celebration'],
    ['Pool Party', 'pool-party', 'party', 'free', '#062A38', '#0F5C74', '#CDEEF8', '#FFFFFF', '#68C4E0', 'confetti', 71, '2026-04-17', 'Bright water blue and confetti for a summer pool party.', 'pool party swimming summer water celebration'],
    ['Birthday Party', 'birthday-party', 'party', 'premium', '#FFF3E0', '#FFD9A8', '#4A3010', '#E07A3E', '#C9A85E', 'cake', 95, '2027-05-18', 'Cake and candles in warm coral and peach for a joyful birthday bash.', 'birthday bash cake candles celebration'],
    ['Surprise Party', 'surprise-party', 'party', 'premium', '#2A1440', '#5C2A7A', '#EADDFF', '#C9A6F5', '#F2D9A8', 'gift', 94, '2027-05-19', 'Gifts and stars in plum and lavender for a surprise reveal.', 'surprise reveal gift celebration'],
    ['Cocktail Party', 'cocktail-party', 'party', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#DCB264', '#E8C0DA', 'coupe', 93, '2027-05-20', 'Coupe glasses and gold on black for a cocktail evening.', 'cocktail drinks evening celebration'],
    ['Garden Party', 'garden-fete', 'party', 'premium', '#EFF6F0', '#D7E8DC', '#24523E', '#3E8A5E', '#C9A85E', 'floral', 92, '2027-05-21', 'Sun and botanical sprigs in emerald and cream for a garden fete.', 'garden fete floral outdoor spring'],
    ['Beach Party', 'beach-party', 'party', 'premium', '#0E3A4A', '#176476', '#F6E2B8', '#DFB05E', '#8AC4D8', 'palm', 91, '2027-05-22', 'Palms and a bright sun in teal and gold for a beach party.', 'beach summer seaside celebration'],
    ['Family Party', 'family-party', 'party', 'premium', '#F5E8DC', '#E4CFB8', '#3A2416', '#B06A2E', '#8A5A2E', 'house', 90, '2027-05-23', 'A home and hearts in terracotta and cream for a family gathering.', 'family gathering home reunion'],
    ['Friends Party', 'friends-party', 'party', 'premium', '#F7E4E2', '#E8C6C0', '#5A2E38', '#B06A7A', '#C9A85E', 'balloons', 89, '2027-05-24', 'Balloons and hearts in dusty rose for friends getting together.', 'friends gathering celebration'],
    ['Dance Party', 'dance-party', 'party', 'premium', '#221030', '#5E3A78', '#F2E8F8', '#F0C86E', '#9E8EE8', 'disco', 88, '2027-05-25', 'A disco ball and beams in purple and pink for dancing the night away.', 'dance disco nightclub party'],
    ['Music Party', 'music-party', 'party', 'premium', '#101E3C', '#2A3A6E', '#E4EAFE', '#A9BBF0', '#E8D9A8', 'music', 87, '2027-05-26', 'Music notes and sparkle in royal blue and silver for a tunes night.', 'music tunes live celebration'],
    ['Karaoke Party', 'karaoke-party', 'party', 'premium', '#3A0E22', '#6E1E4A', '#FBE0EC', '#E874AE', '#F0C86E', 'mic', 86, '2027-05-27', 'A microphone and stars in magenta and purple for singing your heart out.', 'karaoke sing singing mic'],
    ['Game Night', 'game-night', 'party', 'premium', '#141414', '#2E2A24', '#F3D9A0', '#DCB264', '#8AB4E8', 'gamepad', 85, '2027-05-28', 'A gamepad in charcoal and gold for board and screen game night.', 'game night board games fun party'],
    ['Movie Night', 'movie-night', 'party', 'premium', '#0F1F3E', '#254878', '#F3D9A0', '#C9A85E', '#8AAAE0', 'popcorn', 84, '2027-06-01', 'Popcorn and a film reel in navy and gold for movie night.', 'movie night film cinema party'],
    ['Pajama Party', 'pajama-party', 'party', 'premium', '#F0F4FB', '#D8E4F5', '#2E3E5C', '#5A82C4', '#B06A9E', 'moon', 83, '2027-06-02', 'A moon and stars in pastel lavender for pajamas and pillows.', 'pajama slumber sleepover night'],
    ['BBQ Party', 'bbq-party', 'party', 'premium', '#2E1B0E', '#5C3A1A', '#F6E2CE', '#D9A86E', '#E07A3E', 'flame', 82, '2027-06-03', 'Flames and grill lines in warm brown and gold for a backyard BBQ.', 'bbq barbecue grill backyard'],
    ['Picnic Party', 'picnic-party', 'party', 'premium', '#EFF6F0', '#DCE8D2', '#24523E', '#5A8A6A', '#C9A85E', 'basket', 81, '2027-06-04', 'A basket and sun in sage and ivory for a picnic in the park.', 'picnic park outdoor summer'],
    ['Brunch Party', 'brunch-party', 'party', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#C08A3E', '#B06A9E', 'teacup', 80, '2027-06-05', 'A teacup and sprigs in champagne and ivory for weekend brunch.', 'brunch coffee weekend morning'],
    ['Tea Party', 'tea-party', 'party', 'premium', '#FDF1F5', '#F0DAE4', '#5A2040', '#C06A9E', '#C9A85E', 'teacup', 79, '2027-06-06', 'A teacup and flowers in rose and champagne for a classic tea party.', 'tea afternoon classic elegant'],
    ['Lunch Party', 'lunch-party', 'party', 'premium', '#F8EFE2', '#EADAC6', '#4A2E16', '#8A4E1E', '#C08A50', 'plate', 78, '2027-06-07', 'A place setting in cream and brown for lunch with friends.', 'lunch midday friends'],
    ['Dinner Celebration', 'dinner-celebration', 'party', 'premium', '#4A0E1E', '#7A1E34', '#FBE0C4', '#E8A85E', '#F0BE72', 'candle', 77, '2027-06-08', 'Candles and gold in burgundy for a formal dinner celebration.', 'dinner formal celebration elegant party'],
    ['Anniversary Party', 'anniversary-party', 'party', 'premium', '#4A2033', '#8A4E5E', '#F6E0E8', '#DC92A8', '#E8C0A8', 'heart', 76, '2027-06-09', 'Coupes and hearts in rose and champagne for an anniversary party.', 'anniversary love celebration years'],
    ['Engagement Party', 'engagement-party', 'party', 'premium', '#0D2438', '#1A4C6B', '#F1D9A4', '#D9B463', '#8FB4E8', 'ring', 75, '2027-06-10', 'A ring and stars in navy and gold for an engagement party.', 'engagement ring proposal love'],
    ['Graduation Party', 'graduation-bash', 'party', 'premium', '#101B33', '#26406E', '#E4D5A8', '#C9A85E', '#8AAAE0', 'cap', 74, '2027-06-11', 'A graduation cap and confetti in navy and gold for the graduate.', 'graduation grad cap school'],
    ['Welcome Party', 'welcome-party', 'party', 'premium', '#0C3A4A', '#1A6480', '#E6F4F8', '#8AC4D8', '#F2D9A8', 'house', 73, '2027-06-12', 'A house and sun in teal and ivory for welcoming someone new.', 'welcome new housewarming family'],
    ['Farewell Party', 'farewell-party', 'party', 'premium', '#1A150D', '#3A2E18', '#F3D9A0', '#DCB264', '#E8C0DA', 'coupe', 72, '2027-06-13', 'Coupes and stars in dark gold for a farewell party toast.', 'farewell goodbye toast send off'],
    ['Welcome Home Party', 'welcome-home-party', 'party', 'premium', '#F7EDE0', '#E8D4BC', '#3A2416', '#8A5A2E', '#C9A85E', 'door', 71, '2027-06-14', 'A door and hearts in warm brown for a welcome-home gathering.', 'welcome home housewarming'],
    ['Holiday Party', 'holiday-party', 'party', 'premium', '#0E2A22', '#1D5540', '#EDE0BC', '#D9B463', '#C08A3E', 'lights', 70, '2027-06-15', 'Fairy lights and a star in deep green and gold for a holiday party.', 'holiday season festive'],
    ['Christmas Party', 'christmas-party', 'party', 'premium', '#0B2A1E', '#1E5C3E', '#F4E8D0', '#D9B463', '#E87A6E', 'tree', 69, '2027-06-16', 'A tree and star in pine and gold for a festive Christmas party.', 'christmas xmas festive tree'],
    ['New Year Party', 'new-year-party', 'party', 'premium', '#0B0F26', '#1E2A5E', '#DCE4FF', '#C9A85E', '#9E8EE8', 'firework', 68, '2027-06-17', 'Fireworks and a coupe in midnight and silver for New Year.', 'new year newyear countdown midnight'],
    ['Halloween Party', 'halloween-bash', 'party', 'premium', '#2A1206', '#7C3209', '#FFD79A', '#E8A94E', '#8A76C9', 'pumpkin', 67, '2027-06-18', 'A pumpkin and stars in orange and plum for a spooky Halloween night.', 'halloween spooky costume october'],
    ['Masquerade Party', 'masquerade-party', 'party', 'premium', '#1E0C34', '#4E1878', '#EEC8FF', '#C078E8', '#E8C86E', 'mask', 66, '2027-06-19', 'A mask and sparkle in plum and gold for a masquerade party.', 'masquerade mask ball elegant'],
    ['Disco Party', 'disco-party', 'party', 'premium', '#120B22', '#3A1060', '#C9F7EC', '#7DF9E0', '#F472B6', 'disco', 65, '2027-06-20', 'A disco ball in black and neon for getting your groove on.', 'disco dance groove retro'],
    ['Retro Party', 'retro-bash', 'party', 'premium', '#F8EFE4', '#EADAC6', '#4A2E22', '#C06E2E', '#8A9E4E', 'starburst', 64, '2027-06-21', 'A retro starburst in mustard and teal for the 70s.', 'retro 70s vintage starburst'],
    ['Neon Party', 'neon-bash', 'party', 'premium', '#120B22', '#2A0E4A', '#E0F7FF', '#39FFC0', '#F472B6', 'geometric', 63, '2027-06-22', 'Neon geometric shapes in violet-black and green for glowing after dark.', 'neon glow glowing night'],
    ['Elegant Black-Tie Party', 'elegant-black-tie-party', 'party', 'premium', '#0B0B0B', '#26221A', '#F3D9A0', '#DCB264', '#E8E0D0', 'bowtie', 62, '2027-06-23', 'A bow tie and coupe in black and gold for an elegant black-tie party.', 'black tie formal elegant luxury'],
    ['Luxury Celebration', 'luxury-celebration', 'party', 'premium', '#33161C', '#6E3138', '#F8DEDF', '#DC9298', '#E8C86E', 'coupe', 61, '2027-06-24', 'Coupes and sparkle in burgundy and gold for a luxury celebration.', 'luxury grand celebration elegant party'],
    ['Kids Party', 'kids-party', 'party', 'premium', '#FFF6E5', '#FFE0B8', '#4A2410', '#E07A3E', '#5A82C4', 'balloons', 60, '2027-06-25', 'Balloons and confetti in bright multicolor for a kids party.', 'kids children fun games'],
    ['Teen Party', 'teen-party', 'party', 'premium', '#160D2B', '#4B1178', '#EEC6FF', '#C77DF0', '#7DF9E0', 'geometric', 59, '2027-06-26', 'Neon geometry in purple and pink for a teen hangout.', 'teen teens hangout music'],
    ['Celebration Party', 'celebration-party', 'party', 'premium', '#3E0A16', '#7A1E2A', '#FBD9A8', '#E8A94E', '#F0BE72', 'confetti', 58, '2027-06-27', 'Confetti and fireworks in red and gold for any celebration.', 'celebration party festive fun'],
    ['New Year Sparkle', 'new-year-sparkle', 'festival', 'free', '#0B0F26', '#1E2A5E', '#DCE4FF', '#FFFFFF', '#8C9EE0', 'stars', 88, '2026-04-02', 'Midnight blue and fireworks for New Year greetings and parties.'],
    ['Onam Harvest', 'onam-harvest', 'festival', 'free', '#0E2A16', '#22602E', '#E2F4D8', '#FFFFFF', '#96CE7A', 'floral', 83, '2026-04-08', 'Pookalam greens and marigold for Onam wishes and sadhya.'],
    ['Holi Colours', 'holi-colours', 'festival', 'free', '#2A0C34', '#7A1A5E', '#FFD6EE', '#FFFFFF', '#F074C0', 'confetti', 85, '2026-04-14', 'Gulal pinks and scattered colour for Holi invitations.'],
    ['Diya Rangoli', 'diya-rangoli', 'festival', 'free', '#2A1206', '#7C3209', '#FFD79A', '#FFE9C4', '#E8A94E', 'rangoli', 91, '2026-08-15', 'A dotted floor rangoli glowing under the lights for Deepavali wishes.', 'diwali deepavali rangoli diya festival lights india'],
    ['Deepavali Mandala', 'deepavali-mandala', 'festival', 'free', '#1B0F33', '#4A1E6B', '#F3D9A0', '#FBEDCB', '#DCB264', 'mandala', 90, '2026-08-16', 'A full gold mandala with a diya at its heart for grand Diwali greetings.', 'diwali deepavali mandala gold festival india'],
    ['Marigold Diyas', 'marigold-diyas', 'festival', 'free', '#3E0A16', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'diya', 88, '2026-08-17', 'Marigold garlands strung above a glowing row of diyas for Deepavali.', 'diwali deepavali marigold garland diya festival india'],
    ['Diya Lanterns', 'diya-lanterns', 'festival', 'free', '#0E2A3A', '#1E5470', '#FBE0B4', '#FFF0D2', '#DFAE4E', 'diya', 87, '2026-08-18', 'Lanterns and lamps hanging together over a calm teal night for Diwali.', 'diwali deepavali lantern diya teal festival india'],
    ['Golden Lamps', 'golden-lamps', 'festival', 'free', '#261A0A', '#6B4A14', '#F7E1A8', '#FBEFCB', '#DCAF52', 'diyaCluster', 89, '2026-08-19', 'A burst of gold rays behind a cluster of lamps for Diwali evenings.', 'diwali deepavali lamp gold rays festival india'],
    ['Halo Lamps', 'halo-lamps', 'festival', 'free', '#0E1440', '#232B78', '#E3D9A8', '#FBEFD0', '#C9A85E', 'diya', 84, '2026-08-20', 'A moonlit halo circling a single lamp — quiet and luminous for Diwali.', 'diwali deepavali halo lamp night festival india'],
    ['Lamp Border', 'lamp-border', 'festival', 'free', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'diyaCluster', 83, '2026-08-21', 'A regal maroon panel with lamps and flowers for Deepavali greetings.', 'diwali deepavali border maroon lamps festival india'],
    ['Diyas Below', 'diyas-below', 'festival', 'free', '#0E1B14', '#24502E', '#E8DFB4', '#FBF2D2', '#C9B063', 'diyaCluster', 82, '2026-08-22', 'A row of lit diyas along the foot of an evergreen card for Deepavali.', 'diwali deepavali diya row bottom festival india'],
    ['Holi Rang', 'holi-rang', 'festival', 'free', '#2A0C34', '#7A1A5E', '#FFD6EE', '#F2E0C4', '#F074C0', 'gulal', 90, '2026-08-23', 'Powder puffs bursting with gulal colour for the festival of Holi.', 'holi rang gulal colour powder festival india'],
    ['Gulal Splash', 'gulal-splash', 'festival', 'free', '#0E1424', '#3A2A5E', '#FFD6EC', '#FFE9F4', '#F4A4C8', 'gulal', 88, '2026-08-24', 'A scattering of pink and violet gulal within a clean ring for Holi.', 'holi gulal pink violet colour splash festival india'],
    ['Holi Hearts', 'holi-hearts', 'festival', 'free', '#300A26', '#6E1A4A', '#FFD8EC', '#FFF0F6', '#F48AB8', 'gulal', 85, '2026-08-25', 'Colourful powder bursts scattered across a deep berry sky for Holi.', 'holi colour powder festival love india'],
    ['Garba Nights', 'garba-nights', 'festival', 'free', '#33113D', '#8A1F5E', '#FCD9A0', '#FEEDCC', '#E8A94E', 'mandala', 87, '2026-08-26', 'A dandiya mandala over a music note band for nine nights of garba.', 'navratri garba dandiya music dance festival india'],
    ['Navratri Peacock', 'navratri-peacock', 'festival', 'free', '#1A0F3E', '#4A2080', '#F6DCA8', '#FBEDCE', '#DFB055', 'peacock', 82, '2026-08-27', 'A peacock fan with lotus bookends for the nine nights of Navratri.', 'navratri peacock lotus goddess garba festival india'],
    ['Navratri Mandala', 'navratri-mandala', 'festival', 'free', '#0E2A1E', '#1E5C40', '#E8DFA8', '#FBF2CC', '#C9B45E', 'mandala', 79, '2026-08-28', 'A green and gold mandala halo for nine nights of devotion and dance.', 'navratri mandala goddess shakti nine nights festival india'],
    ['Vijayadashami', 'vijayadashami', 'festival', 'free', '#261008', '#6B2A0E', '#F6DFA5', '#FBEFCB', '#E0B252', 'firework', 84, '2026-08-29', 'Bursts of gold above a Dussehra celebration of good over evil.', 'dussehra vijayadashami victory firework festival india'],
    ['Dussehra Crown', 'dussehra-crown', 'festival', 'free', '#3E0A12', '#7A1E2A', '#FBE0BE', '#FFF0D8', '#E8A83E', 'crown', 80, '2026-08-30', 'A royal crown in a shield for the triumph of good over evil.', 'dussehra vijayadashami crown victory festival india'],
    ['Ganpati Bappa', 'ganpati-bappa', 'festival', 'free', '#0E3A2E', '#1E6048', '#F8E2B8', '#FFF2D6', '#DFB055', 'omSymbol', 92, '2026-08-31', 'Marigold garlands and the sacred Om for Ganesh Chaturthi welcome.', 'ganesh ganesh chaturthi ganpati om marigold festival india'],
    ['Ganesh Aarti', 'ganesh-aarti', 'festival', 'free', '#5A1408', '#A83A12', '#FCE6BE', '#FFF2D8', '#EFBE68', 'thali', 86, '2026-09-01', 'An aarti thali with lamp and marigold for Ganesh Chaturthi puja.', 'ganesh chaturthi aarti thali diya puja festival india'],
    ['Krishna Janmashtami', 'krishna-janmashtami', 'festival', 'free', '#12304A', '#1E5C7E', '#F0E4C8', '#FBF2DC', '#C9AC6E', 'peacock', 83, '2026-09-02', 'A peacock feather among branches for the birthday of Lord Krishna.', 'janmashtami krishna peacock birth festival india'],
    ['Raksha Bandhan', 'raksha-bandhan', 'festival', 'free', '#2A1230', '#6E1E5A', '#F6D8EC', '#FFF0F6', '#D9A8C8', 'rakhi', 89, '2026-09-03', 'A rakhi thread bracelet at the heart of a violet ring of protection.', 'raksha bandhan rakhi sibling thread bond festival india'],
    ['Rakhi Festoon', 'rakhi-festoon', 'festival', 'free', '#3E0A1E', '#8A1E4A', '#FBD8E6', '#FFEEF6', '#E898B8', 'rakhi', 81, '2026-09-04', 'A decorated panel with the sacred thread at its centre for Rakhi.', 'rakhi raksha bandhan thread rose festival india'],
    ['Karwa Chauth', 'karwa-chauth', 'festival', 'free', '#0E1434', '#1E2E6E', '#E4D9A8', '#FBF0D0', '#C9A85E', 'crescentMoon', 84, '2026-09-05', 'The crescent moon over a quiet night for Karwa Chauth wishes.', 'karwa chauth karva moon fast festival india'],
    ['Maha Shivratri', 'maha-shivratri', 'festival', 'free', '#12261E', '#28513E', '#E8DFB4', '#FBF2D6', '#C9B063', 'trishul', 85, '2026-09-06', 'The trishul inside a temple arch for the great night of Shiva.', 'maha shivratri shiva trishul night festival india'],
    ['Shivratri Trishul', 'shivratri-trishul', 'festival', 'free', '#260A1E', '#6E1A4A', '#F6DCE8', '#FBEEF4', '#E0A8C0', 'trishul', 78, '2026-09-07', 'A mauve trishul emblem for Maha Shivratri vigils and pujas.', 'maha shivratri shiva trishul om festival india'],
    ['Ram Navami', 'ram-navami', 'festival', 'free', '#3E1A08', '#7A3A12', '#FBE0C4', '#FFF0DC', '#E0A868', 'bow', 80, '2026-09-08', 'Lord Ram’s bow framed between pillars for Ram Navami blessings.', 'ram navami ram bow birth festival india'],
    ['Ram Navami Mandala', 'ram-navami-mandala', 'festival', 'free', '#0E2A3A', '#1E546E', '#E8DFC0', '#FBF2DC', '#C9AC6E', 'mandala', 76, '2026-09-09', 'A serene mandala over lotus petals for Ram Navami celebrations.', 'ram navami mandala lotus jai shri ram festival india'],
    ['Durga Puja', 'durga-puja', 'festival', 'free', '#3E0A12', '#8A1E2A', '#FBE0C0', '#FFF0D8', '#E8A83E', 'conch', 88, '2026-09-10', 'The conch and the golden burst of a Durga Puja pandal greeting.', 'durga puja durga pujo conch goddess festival india bengal'],
    ['Durga Puja Mandala', 'durga-puja-mandala', 'festival', 'free', '#260A2E', '#6E1A56', '#F6DCE8', '#FBEEF4', '#E0A8C8', 'lotus', 83, '2026-09-11', 'Lotus bookends around a deep purple emblem for Durga Puja.', 'durga puja durga pujo lotus goddess festival india'],
    ['Lakshmi Puja', 'lakshmi-puja', 'festival', 'free', '#2A1206', '#7C3209', '#FFD79A', '#FFE9C4', '#E8A94E', 'kalash', 85, '2026-09-12', 'The kalash of plenty for Lakshmi Puja on the Diwali night of wealth.', 'lakshmi puja laxmi kalash prosperity wealth festival india'],
    ['Saraswati Puja', 'saraswati-puja', 'festival', 'free', '#0E2A22', '#24523E', '#E8E4BC', '#FBF4DA', '#C9B468', 'feather', 81, '2026-09-13', 'A quill among greens for the goddess of learning and the arts.', 'saraswati puja knowledge quill goddess festival india'],
    ['Basant Panchami', 'basant-panchami', 'festival', 'free', '#4A3A05', '#9A7A14', '#FDE8A8', '#FFF2D0', '#E8BE4E', 'blossom', 79, '2026-09-14', 'Yellow blossoms for the first day of spring — Basant Panchami.', 'basant panchami vasant spring yellow blossom festival india'],
    ['Onam Pookalam', 'onam-pookalam', 'festival', 'free', '#0E2A16', '#22602E', '#E2F4D8', '#FFF4DC', '#96CE7A', 'rangoli', 87, '2026-09-15', 'A pookalam of flowers in the greens and golds of a Kerala Onam.', 'onam pookalam kerala sadhya flower festival india'],
    ['Onam Sadhya', 'onam-sadhya', 'festival', 'free', '#12263A', '#1E4A6E', '#E8E0BC', '#FBF4D8', '#C9B05E', 'kalash', 82, '2026-09-16', 'A cool blue halo around the harvest kalash for Onam greetings.', 'onam sadhya kalash kerala harvest festival india'],
    ['Onam Waves', 'onam-waves', 'festival', 'free', '#0E3A2A', '#1C6042', '#F4E4B8', '#FFF2D4', '#D9B055', 'peacock', 78, '2026-09-17', 'Waves of the backwaters under a peacock fan for Onam in Kerala.', 'onam kerala vallam backwater peacock festival india'],
    ['Thai Pongal', 'thai-pongal', 'festival', 'free', '#3E2A05', '#8A5E10', '#FDE4A0', '#FFF0C8', '#E8B44E', 'kalash', 84, '2026-09-18', 'The pongal pot glowing gold for the Tamil harvest festival.', 'pongal thai pongal pot harvest tamil festival india'],
    ['Pongal Sun', 'pongal-sun', 'festival', 'free', '#5A3A05', '#A87814', '#FDE0A0', '#FFEFC8', '#E8B44E', 'sun', 80, '2026-09-19', 'The sun of Surya Pongal rising over harvest waves in gold.', 'pongal sun surya harvest tamil festival india'],
    ['Baisakhi', 'baisakhi', 'festival', 'free', '#0E3A2E', '#1E604A', '#F8E2B8', '#FFF2D6', '#DFB055', 'wheat', 83, '2026-09-20', 'Wheat sheaves between pillars for the Punjabi harvest festival.', 'baisakhi vaisakhi wheat punjab harvest festival india'],
    ['Lohri Bonfire', 'lohri-bonfire', 'festival', 'free', '#260A08', '#6E1A0E', '#F6DCA8', '#FBEDCE', '#DFA85E', 'havan', 82, '2026-09-21', 'The sacred bonfire of Lohri with the first glow of the new harvest.', 'lohri bonfire fire punjab winter festival india'],
    ['Makar Sankranti', 'makar-sankranti', 'festival', 'free', '#0E2A3A', '#1E5470', '#E8E0C0', '#FBF4DA', '#C9B05E', 'kite', 85, '2026-09-22', 'A kite against a sunny sky for Makar Sankranti and Uttarayan.', 'makar sankranti sankranti kite uttarayan festival india'],
    ['Kite Sky', 'kite-sky', 'festival', 'free', '#12304A', '#2A5C7E', '#E8E4CC', '#FBF6E0', '#D9BE6E', 'kite', 81, '2026-09-23', 'Kites scattered across a bright sky for the Sankranti kite festival.', 'sankranti kite patang sky festival india'],
    ['Ugadi', 'ugadi', 'festival', 'free', '#2E1A08', '#6E3A12', '#F6E0BC', '#FBEFD6', '#DFA868', 'kalash', 79, '2026-09-24', 'The new-year kalash with marigold accents for Ugadi in Telugu homes.', 'ugadi telugu new year kalash festival india andhra'],
    ['Gudi Padwa', 'gudi-padwa', 'festival', 'free', '#0E3A1E', '#1E6B32', '#E8E0B0', '#FBF4D4', '#C9B45E', 'toran', 78, '2026-09-25', 'The festive toran under an arch for the Marathi new year of Gudi Padwa.', 'gudi padwa marathi new year toran festival india maharashtra'],
    ['Vishu', 'vishu', 'festival', 'free', '#0E3A2A', '#1E6048', '#F4E4B4', '#FFF2D4', '#D9B055', 'lotus', 77, '2026-09-26', 'The auspicious lotus of Vishukkani for the Malayalam new year.', 'vishu kerala malayalam new year vishukkani festival india'],
    ['Bihu Dance', 'bihu-dance', 'festival', 'free', '#3E0A1E', '#8A1E46', '#FBE0C4', '#FFF0D8', '#E0A868', 'musicNote', 76, '2026-09-27', 'Bihu music notes over a peacock fan for the Assamese spring festival.', 'bihu assam bohag dance music festival india northeast'],
    ['Chhath Puja', 'chhath-puja', 'festival', 'free', '#2E1A08', '#7A4A10', '#FBE0A8', '#FFF0D0', '#E8B44E', 'sun', 82, '2026-09-28', 'The rising sun of Chhath Puja greeted on the riverbank at dawn.', 'chhath puja sun bihar jharkhand river festival india'],
    ['Akshaya Tritiya', 'akshaya-tritiya', 'festival', 'free', '#0E2A1E', '#1E5C40', '#E8E0B4', '#FBF4D8', '#C9B45E', 'kalash', 80, '2026-09-29', 'The kalash of plenty framed in green and gold for Akshaya Tritiya.', 'akshaya tritiya kalash auspicious gold festival india'],
    ['Teej Festival', 'teej-festival', 'festival', 'free', '#0E2A1E', '#2A5E3E', '#F2E4BC', '#FBF4D6', '#D9B868', 'blossom', 75, '2026-09-30', 'Blossoms and monsoon greens for the women’s festival of Teej.', 'teej monsoon swing women rajasthan festival india'],
    ['Mahavir Jayanti', 'mahavir-jayanti', 'festival', 'free', '#F6F4EA', '#E8E2CE', '#3A3220', '#7A6A3A', '#B89A5E', 'lotus', 74, '2026-10-01', 'A calm ivory and gold panel with the lotus of ahimsa for Mahavir Jayanti.', 'mahavir jayanti jain ahimsa lotus peace festival india'],
    ['Buddha Purnima', 'buddha-purnima', 'festival', 'free', '#FDF6EC', '#F2E2C8', '#3A2A10', '#8A5A1E', '#B8892E', 'lotus', 78, '2026-10-02', 'The lotus and the Bodhi tree on warm paper for Vesak greetings.', 'buddha purnima vesak buddhist lotus bodhi festival'],
    ['Rath Yatra', 'rath-yatra', 'festival', 'free', '#0E2A3A', '#1E4E6E', '#F0E0BC', '#FBF2D6', '#D9B45E', 'chariotWheel', 77, '2026-10-03', 'The chariot wheel of Jagannath between temple pillars for Rath Yatra.', 'rath yatra jagannath chariot puri festival india odisha'],
    ['Hornbill Festival', 'hornbill-festival', 'festival', 'free', '#2E1008', '#6E2A0E', '#F6DCC0', '#FBECD8', '#DFA468', 'feather', 75, '2026-10-04', 'Hornbill feathers under a warm sky for Nagaland’s grandest festival.', 'hornbill festival nagaland northeast tribal feathers india'],
    ['Eid Crescent', 'eid-crescent', 'festival', 'free', '#0D2438', '#1A4C6B', '#F1D9A4', '#FBEFD0', '#D9B463', 'crescentMoon', 89, '2026-10-05', 'A slender crescent inside a navy arch for Eid al-Fitr greetings.', 'eid eid al fitr mubarak crescent moon islam'],
    ['Eid Lantern', 'eid-lantern', 'festival', 'free', '#0E2A3E', '#1A4C66', '#F2DCAE', '#FBEED0', '#D9B25E', 'lantern', 87, '2026-10-06', 'Fawanees lanterns swinging across the top for Eid Mubarak wishes.', 'eid al fitr lantern fanoos islam ramadan mubarak'],
    ['Eid al-Adha', 'eid-al-adha', 'festival', 'free', '#12301E', '#1E5C36', '#F0E4B8', '#FBF2D2', '#D9B868', 'crescentStar', 84, '2026-10-07', 'A crescent and star inside an evergreen border for Bakra Eid.', 'eid al adha bakra eid azha islam mubarak qurbani'],
    ['Ramadan Kareem', 'ramadan-kareem', 'festival', 'free', '#101C30', '#1E3A5E', '#E8DCA8', '#FBF0CC', '#C9B25E', 'crescentStar', 86, '2026-10-08', 'Geometric tile work framing a crescent for the holy month of Ramadan.', 'ramadan kareem crescent islam fasting month'],
    ['Ramadan Lantern', 'ramadan-lantern', 'festival', 'free', '#0E0E30', '#1E1E6E', '#E8E0AE', '#FBF2D0', '#C9B45E', 'lantern', 85, '2026-10-09', 'A glowing fanous lantern for Ramadan Mubarak and Laylat al-Qadr.', 'ramadan lantern fanous islam mubarak night'],
    ['Star of Bethlehem', 'star-of-bethlehem', 'festival', 'free', '#0B1B26', '#1A3E5C', '#F0DFAE', '#FBF0CC', '#D9B45E', 'star5', 88, '2026-10-10', 'The guiding star over a deep Christmas night sky.', 'christmas bethlehem star nativity jesus merry'],
    ['Christmas Pine', 'christmas-pine', 'festival', 'free', '#0E2A22', '#1D5540', '#EDE0BC', '#FBF2D6', '#D9B463', 'pineTree', 84, '2026-10-11', 'A tall pine with scattered branches for a cosy Christmas greeting.', 'christmas pine tree winter forest merry'],
    ['Christmas Bells', 'christmas-bells', 'festival', 'free', '#260A0E', '#6E1A26', '#F6DCC4', '#FBECD8', '#DFA46E', 'bell', 82, '2026-10-12', 'Golden bells with holly bookends for a rich Christmas greeting.', 'christmas bells holly golden merry'],
    ['Candy Cane Christmas', 'candy-cane-christmas', 'festival', 'free', '#2E0A1E', '#6E1A42', '#FCE0F0', '#FFF0F8', '#E8A0C4', 'candyCane', 79, '2026-10-13', 'A candy cane on a confetti-pink night sky for holiday cheer.', 'christmas candy cane sweet kids merry'],
    ['Easter Joy', 'easter-joy', 'festival', 'free', '#FDF6F0', '#F4E0D2', '#4A2A1A', '#8A3A22', '#C08A3E', 'egg', 83, '2026-10-14', 'A decorated egg on warm cream paper for Easter Sunday blessings.', 'easter egg risen christ christian spring'],
    ['Easter Flowers', 'easter-flowers', 'festival', 'free', '#F6F0FD', '#E0D8F4', '#2E2044', '#5A3E8A', '#9A6EC4', 'egg', 78, '2026-10-15', 'An easter egg inside a lilac ring of spring flowers.', 'easter egg spring flowers lilac christian'],
    ['Good Friday', 'good-friday', 'festival', 'free', '#120A26', '#2E1A4E', '#E6E0C8', '#FBF4DA', '#C9B06A', 'cross', 76, '2026-10-16', 'A quiet cross in a shield for a solemn Good Friday observance.', 'good friday cross christian lent solemn'],
    ['Hanukkah Menorah', 'hanukkah-menorah', 'festival', 'free', '#0E2A3A', '#1E4E6E', '#F0E0B8', '#FBF2D4', '#D9B45E', 'menorah', 81, '2026-10-17', 'The menorah above a Star of David for the eight nights of Hanukkah.', 'hanukkah menorah chanukah jewish lights star of david'],
    ['Hanukkah Night', 'hanukkah-night', 'festival', 'free', '#0E1424', '#1E2A5E', '#E4D8A8', '#FBF0CC', '#C9A85E', 'menorah', 76, '2026-10-18', 'The menorah glowing under a starry Chanukah night sky.', 'hanukkah chanukah menorah starry night jewish'],
    ['Passover Seder', 'passover-seder', 'festival', 'free', '#F8F3E8', '#E8DFC8', '#3A2E1A', '#6E5A28', '#A8843A', 'starOfDavid', 77, '2026-10-19', 'A Star of David on warm ivory for the Passover Seder table.', 'passover pesach seder jewish star of david matzah'],
    ['Rosh Hashanah', 'rosh-hashanah', 'festival', 'free', '#2E1A0A', '#7A4A1A', '#F6E0B8', '#FBEFD4', '#DFA868', 'pomegranate', 78, '2026-10-20', 'The pomegranate — a sign of abundance — for the Jewish New Year.', 'rosh hashanah shana tova jewish new year pomegranate apple honey'],
    ['Yom Kippur', 'yom-kippur', 'festival', 'free', '#F4F0E8', '#E4DCC8', '#3A3220', '#6E5E32', '#9A8442', 'starOfDavid', 72, '2026-10-21', 'Geometric panels with the Star of David for a reflective Yom Kippur.', 'yom kippur jewish fast atonement star of david'],
    ['Vesak Day', 'vesak-day', 'festival', 'free', '#0E3A2A', '#1E6048', '#E8E4B8', '#FBF6D8', '#C9B45E', 'lotus', 79, '2026-10-22', 'The lotus of enlightenment in the deep green of a Vesak greeting.', 'vesak buddha purnima lotus buddhist enlightenment'],
    ['Lunar New Year', 'lunar-new-year', 'festival', 'free', '#3E0A0E', '#8A1E1E', '#FBE0B4', '#FFF0D4', '#EFC062', 'lanternRow', 90, '2026-10-23', 'Rows of red lanterns for the Lunar New Year and Spring Festival.', 'lunar new year chinese new year spring festival lantern red'],
    ['Spring Festival', 'spring-festival', 'festival', 'free', '#260A30', '#6E1A5E', '#F6E0C4', '#FBEFD8', '#DFA868', 'koi', 84, '2026-10-24', 'A koi fish swimming under a lantern for a prosperous new year.', 'lunar new year koi fish lantern prosperity fortune'],
    ['Nowruz', 'nowruz', 'festival', 'free', '#0E3A3E', '#1E6068', '#F4E4B8', '#FFF2D4', '#D9B055', 'sun', 80, '2026-10-25', 'The new-year sun rising in turquoise for Nowruz and spring.', 'nowruz persian iranian new year spring sun'],
    ['Nowruz Bloom', 'nowruz-bloom', 'festival', 'free', '#0E2A1E', '#2A5C3E', '#F2E4BE', '#FBF4DA', '#D9B868', 'blossom', 76, '2026-10-26', 'Blossoms of the haft-seen for the celebration of Nowruz.', 'nowruz haft seen persian blossom spring new year'],
    ['Orthodox Christmas', 'orthodox-christmas', 'festival', 'free', '#0B1B26', '#1A3E5C', '#F0DFAE', '#FBF0CC', '#D9B45E', 'church', 78, '2026-10-27', 'A church silhouette under winter stars for Orthodox Christmas Eve.', 'orthodox christmas russian church stars nativity'],
    ['Orthodox Easter', 'orthodox-easter', 'festival', 'free', '#2E0A1E', '#6E1A42', '#F8DCE8', '#FBEFF4', '#E898B8', 'egg', 75, '2026-10-28', 'A red egg within a halo of light for Pascha — Orthodox Easter.', 'orthodox easter pascha egg christos anesti'],
    ['Purim', 'purim', 'festival', 'free', '#3E0A2E', '#8A1E5E', '#FBE0E8', '#FFF0F4', '#E8A0C4', 'crown', 73, '2026-10-29', 'A crown under festive bunting for the merry festival of Purim.', 'purim jewish carnival crown megillah festive'],
    ['New Year Clock', 'new-year-clock', 'festival', 'free', '#0B0F26', '#1E2A5E', '#DCE4FF', '#FFFFFF', '#8C9EE0', 'clock', 88, '2026-10-30', 'A midnight clock in a halo of light for New Year’s Eve greetings.', 'new year clock midnight countdown celebration'],
    ['Valentine Love', 'valentine-love', 'festival', 'free', '#2E0A1E', '#8A1E4A', '#FCE0EC', '#FFF0F6', '#E8A0C0', 'heart', 90, '2026-10-31', 'A heart inside a ring of sparkles for Valentine’s Day greetings.', 'valentine’s day love heart romantic celebration'],
    ['Valentine Roses', 'valentine-roses', 'festival', 'free', '#3E0A12', '#8A1E2A', '#FBE0D0', '#FFF0E8', '#E8A878', 'rose', 86, '2026-11-01', 'Roses and sprays for a romantic Valentine’s Day invitation.', 'valentine’s day rose bouquet romantic love'],
    ['St Patrick’s Day', 'st-patricks-day', 'festival', 'free', '#0E3A22', '#1E6B3E', '#E4F4C8', '#F6FFE0', '#7AB85E', 'shamrock', 81, '2026-11-02', 'A green shamrock emblem for St Patrick’s Day parades and pints.', 'st patrick’s day shamrock irish green luck'],
    ['Halloween Pumpkin', 'halloween-pumpkin', 'festival', 'free', '#120A1E', '#2E1A4E', '#F6E0C0', '#FFE8B0', '#E8A84E', 'pumpkin', 87, '2026-11-03', 'A carved jack-o’-lantern glowing against a midnight sky.', 'halloween pumpkin jack o lantern spooky october'],
    ['Halloween Party', 'halloween-party', 'festival', 'free', '#1E0A14', '#4A1E2E', '#FFD8C8', '#FFE8D8', '#E89068', 'pumpkin', 83, '2026-11-04', 'A pumpkin under a sky of stars for Halloween party invitations.', 'halloween pumpkin party trick or treat'],
    ['Thanksgiving Feast', 'thanksgiving-feast', 'festival', 'free', '#3E2208', '#8A4E10', '#FBE0AE', '#FFF0CE', '#E8AE4E', 'turkey', 84, '2026-11-05', 'A turkey and wheat for the autumn harvest of Thanksgiving.', 'thanksgiving turkey feast harvest america'],
    ['Thanksgiving Harvest', 'thanksgiving-harvest', 'festival', 'free', '#2E1808', '#7A3E12', '#F6E0BE', '#FBEFD6', '#DFA868', 'pumpkin', 80, '2026-11-06', 'A pumpkin with wheat bookends for a warm Thanksgiving table.', 'thanksgiving harvest pumpkin wheat gratitude'],
    ['Carnival Rio', 'carnival-rio', 'festival', 'free', '#0E1424', '#3A2A6E', '#FCE0F0', '#FFF0F6', '#F4A4C8', 'musicNote', 82, '2026-11-07', 'Music notes and confetti sparkle for the Rio Carnival parade.', 'carnival rio samba brazil parade celebration'],
    ['Mardi Gras', 'mardi-gras', 'festival', 'free', '#2E0A1E', '#8A1E5E', '#FCE0F0', '#FFF0F8', '#E8A8CC', 'mask', 79, '2026-11-08', 'A carnival mask in purple and pink for Mardi Gras festivities.', 'mardi gras carnival mask new orleans celebration'],
    ['Oktoberfest', 'oktoberfest', 'festival', 'free', '#2E1A08', '#7A4A12', '#F8E0B8', '#FFF0D0', '#DFB05E', 'stein', 78, '2026-11-09', 'A beer stein with wheat bookends for the Munich beer festival.', 'oktoberfest stein beer munich bavaria prost'],
    ['Cinco de Mayo', 'cinco-de-mayo', 'festival', 'free', '#0E2A5A', '#1E4A8C', '#FCE2B0', '#FFF0D0', '#F0AE3E', 'marigold', 79, '2026-11-10', 'Marigold festoons in cobalt blue for Cinco de Mayo fiestas.', 'cinco de mayo mexico fiesta marigold celebration'],
    ['Bastille Day', 'bastille-day', 'festival', 'free', '#0E2A5A', '#1E4A8C', '#FCE2B0', '#FFF0D2', '#F0B83E', 'fleurDeLis', 77, '2026-11-11', 'The fleur-de-lis framed by pillars for France’s national day.', 'bastille day france paris fleur de lis national'],
    ['Australia Day', 'australia-day', 'festival', 'free', '#0B1B3A', '#1E3E6E', '#F4E4B8', '#FFF2D4', '#D9BE5E', 'sun', 74, '2026-11-12', 'The rising sun over the Southern Cross for Australia Day.', 'australia day australia sun southern cross celebration'],
    ['Canada Day', 'canada-day', 'festival', 'free', '#2E0A0E', '#8A1E22', '#FCE0DC', '#FFF0EE', '#E8A8A4', 'mapleLeaf', 75, '2026-11-13', 'The maple leaf in its flag red for Canada Day on the first of July.', 'canada day maple leaf canadian celebration'],
    ['Independence Day', 'independence-day', 'festival', 'free', '#0B1B3A', '#1E3E6E', '#F4E4B0', '#FFF0CC', '#E0BE4E', 'star5', 83, '2026-11-14', 'Stars and a fireworks burst for the Fourth of July celebrations.', 'independence day july 4th usa america fireworks stars'],
    ['Boxing Day', 'boxing-day', 'festival', 'free', '#2E0A1E', '#7A1A4A', '#FCE0F0', '#FFF0F8', '#E8A0CC', 'giftStack', 73, '2026-11-15', 'A stack of wrapped gifts for Boxing Day gatherings and sales.', 'boxing day gifts presents christmas holiday'],
    ['Mother’s Day', 'mothers-day', 'festival', 'free', '#3E1428', '#8A2E52', '#FCE0E8', '#FFF0F4', '#E8A8BC', 'rose', 82, '2026-11-16', 'Roses for the mother who means the world on Mother’s Day.', 'mother’s day mum rose flower love'],
    ['Father’s Day', 'fathers-day', 'festival', 'free', '#12261E', '#28513E', '#E8E0B4', '#FBF4D8', '#C9B45E', 'heart', 78, '2026-11-17', 'A heart in a shield for the father who is always there.', 'father’s day dad father love gratitude'],
    ['Grandparents’ Day', 'grandparents-day', 'festival', 'free', '#2E2410', '#6E5A20', '#F6E4B4', '#FBF0CE', '#DFB868', 'tree', 74, '2026-11-18', 'A family tree over a heart for Grandparents’ Day celebrations.', 'grandparents’ day family tree love roots'],
    ['Women’s Day', 'womens-day', 'festival', 'free', '#3E0A2E', '#8A1E5E', '#FCE0F0', '#FFF0F6', '#E8A0CC', 'blossom', 80, '2026-11-19', 'Blossoms for International Women’s Day on the eighth of March.', 'international women’s day blossom women celebration equality'],
    ['Earth Day', 'earth-day', 'festival', 'free', '#0E3A2E', '#1E6048', '#E8E8BC', '#FBF6D8', '#8AC4A6', 'globe', 79, '2026-11-20', 'The globe within a green ring for Earth Day awareness and action.', 'earth day planet globe environment sustainability'],
    ['Environment Day', 'environment-day', 'festival', 'free', '#0E2A1E', '#2A5C3E', '#E8E8B8', '#F8F6D8', '#8AC49A', 'leaf', 75, '2026-11-21', 'A single leaf rising like a tree for World Environment Day.', 'environment day leaf green sustainability world'],
    ['Friendship Day', 'friendship-day', 'festival', 'free', '#0E2A3A', '#1E5470', '#F0E4C0', '#FBF2D8', '#D9B868', 'heart', 81, '2026-11-22', 'A heart under bunting for Friendship Day greetings to your circle.', 'friendship day friends heart bunting celebration'],
    ['World Music Day', 'world-music-day', 'festival', 'free', '#120A26', '#3A1A5E', '#E8DCF8', '#F8F0FF', '#B08FD0', 'musicNote', 72, '2026-11-23', 'Music notes for World Music Day concerts and street performances.', 'world music day music note concert celebration'],
    ['Children’s Day', 'childrens-day', 'festival', 'free', '#0E2A5A', '#2A5C8A', '#E8E8F8', '#FFFFFF', '#8AC4E8', 'balloon', 78, '2026-11-24', 'Balloons under bright bunting for Children’s Day at school or home.', 'children’s day kids balloon fun celebration'],
    ['Baby’s First Festival', 'babys-first-festival', 'festival', 'free', '#F6F0FD', '#E0D8F4', '#3A2A54', '#6E4A9A', '#B08FE0', 'heart', 77, '2026-11-25', 'A soft heart under bunting for a baby’s very first festival season.', 'baby’s first festival kids family celebration'],
    ['Baby’s First Diwali', 'babys-first-diwali', 'festival', 'free', '#2E1206', '#8A3A0E', '#FFD9A8', '#FFE9C8', '#E8A94E', 'diya', 84, '2026-11-26', 'Lamps and lanterns to welcome a baby’s first Deepavali.', 'baby’s first diwali diya deepavali little one family'],
    ['Baby’s First Christmas', 'babys-first-christmas', 'festival', 'free', '#0E2A22', '#1D5540', '#F0E4BC', '#FBF4DA', '#D9B868', 'giftStack', 83, '2026-11-27', 'Gifts and stars for the first Christmas with a little one.', 'baby’s first christmas gift stars family'],
    ['Baby’s First Eid', 'babys-first-eid', 'festival', 'free', '#0D2438', '#1A4C6B', '#F2E0B4', '#FBEED4', '#D9B868', 'crescentStar', 80, '2026-11-28', 'A gentle crescent for a baby’s very first Eid Mubarak.', 'baby’s first eid crescent islam family'],
    ['Baby’s First Holi', 'babys-first-holi', 'festival', 'free', '#2E0A2E', '#8A1E5E', '#FFD8EC', '#FFF0F6', '#F4A0C4', 'gulal', 79, '2026-11-29', 'Soft gulal puffs for a baby’s first festival of colours.', 'baby’s first holi gulal colour family'],
    ['Family Celebration', 'family-celebration', 'festival', 'free', '#0E2A1E', '#2A5C3E', '#E8E4B4', '#FBF6D8', '#8AC49A', 'tree', 76, '2026-11-30', 'One tree with many branches for a family celebration of any kind.', 'family celebration tree together reunion'],
    ['Family Reunion', 'family-reunion', 'festival', 'free', '#2E2410', '#6E5A20', '#F6E4B4', '#FBF0CE', '#DFB868', 'tree', 75, '2026-12-01', 'A family tree with golden bookends for a reunion weekend.', 'family reunion tree roots gathering relatives'],
    ['Kids Festival', 'kids-festival', 'festival', 'free', '#0E2A5A', '#2A4E8A', '#F0E4F8', '#FFFFFF', '#8AA8E0', 'cupcake', 78, '2026-12-02', 'A cupcake under bunting for school and community kids’ festivals.', 'kids festival children cupcake fun school'],
    ['School Celebration', 'school-celebration', 'festival', 'free', '#12263A', '#2A4E6E', '#E8E4CC', '#FBF6E0', '#8AA8C4', 'book', 74, '2026-12-03', 'An open book between pillars for a school celebration or annual day.', 'school celebration book students annual day'],
    ['Community Celebration', 'community-celebration', 'festival', 'free', '#2E1808', '#7A4A12', '#F8E0B8', '#FFF0D0', '#DFB05E', 'marigold', 72, '2026-12-04', 'Marigold garlands for a community festival that belongs to everyone.', 'community celebration marigold garland neighbourhood festival'],
    ['Cultural Day', 'cultural-day', 'festival', 'free', '#1A0F3E', '#4A2080', '#F6DCA8', '#FBEDCE', '#DFB055', 'peacock', 73, '2026-12-05', 'A peacock above music notes for cultural day performances.', 'cultural day peacock diversity performance school'],
    ['Food Festival', 'food-festival', 'festival', 'free', '#2E1A08', '#7A4A12', '#F8E0B4', '#FFF0CC', '#DFB05E', 'thali', 76, '2026-12-06', 'A served thali inside a warm ring for food festivals and tastings.', 'food festival thali feast tasting culinary'],
    ['Summer Festival', 'summer-festival', 'festival', 'free', '#0E3A4A', '#2A6B7A', '#F0E4C0', '#FBF4DA', '#D9B868', 'sun', 74, '2026-12-07', 'A bright sun over gentle waves for summer festivals and fairs.', 'summer festival sun waves outdoor fair'],
    ['Kids Carnival', 'kids-carnival', 'festival', 'free', '#2E0A2E', '#7A1E5E', '#FCE0F0', '#FFF0F6', '#F4A0C8', 'balloon', 77, '2026-12-08', 'Balloons scattered across a cheerful sky for a kids’ carnival.', 'kids carnival balloon games fun fair'],
    ['Christmas Eve', 'christmas-eve', 'festival', 'free', '#0E2A22', '#1D5540', '#F0E4BC', '#FBF4DA', '#D9B868', 'giftStack', 82, '2026-12-09', 'Gifts under bunting for the magic of Christmas Eve at home.', 'christmas eve gift santa family'],

    /* --- Wedding collection -------------------------------------------------
       Regional, religious, international, per-function, per-host, premium-style
       and modern designs. These rows carry a 14th column of search tags; the
       rows above predate it and simply leave it out. --------------------- */
    ['Tamil Thirumanam', 'tamil-thirumanam', 'wedding', 'free', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'kolam', 94, '2026-05-04', 'A pulli kolam lattice in maroon and gold, drawn the way it is chalked at the doorway on the morning of a Tamil wedding.', 'tamil nadu south indian thirumanam kolam chennai madurai regional'],
    ['Kalasam Blessing', 'kalasam-blessing', 'wedding', 'free', '#FDF4E3', '#F5E0BC', '#5A2A12', '#8A3B14', '#B8862F', 'kalasam', 88, '2026-05-06', 'The purna kumbham — pot, mango leaves and coconut — set inside a sandalwood arch for an auspicious South Indian muhurtham.', 'south indian kalasam kumbham muhurtham temple traditional regional'],
    ['Gopuram Vows', 'gopuram-vows', 'wedding', 'free', '#7A1410', '#A83218', '#FCE6C0', '#FFF2DA', '#EFC069', 'gopuram', 86, '2026-05-08', 'A tiered Dravidian gopuram rising under the names, in the kumkum red and gold of a temple kalyanam.', 'south indian temple gopuram dravidian kalyanam regional tamil'],
    ['Telugu Pelli', 'telugu-pelli', 'wedding', 'free', '#FCF3D8', '#F2E0A4', '#4A3A0C', '#7A5E10', '#B08A22', 'jasmine', 90, '2026-05-10', 'Strands of malli poolu falling across turmeric-toned paper for a Telugu pelli.', 'telugu andhra telangana pelli jasmine malli hyderabad regional'],
    ['Talambralu Pearls', 'talambralu-pearls', 'wedding', 'free', '#FBF1EC', '#F0DCD2', '#4A2A20', '#8A4A34', '#B98A5E', 'talambralu', 82, '2026-05-12', 'The basinga and the shower of pearled rice, framed like a portrait mount in pearl and rose.', 'telugu talambralu basinga pearls muhurtham andhra regional'],
    ['Kerala Mangalyam', 'kerala-mangalyam', 'wedding', 'free', '#FDF8EC', '#F3E8CE', '#3E3418', '#6E5A1E', '#A88A2E', 'nilavilakku', 87, '2026-05-14', 'The bell-metal nilavilakku at the centre of an ivory card, lit the way it is before a Kerala mangalyam.', 'kerala malayali mangalyam nilavilakku lamp nair kochi regional'],
    ['Kasavu Gold Border', 'kasavu-gold-border', 'wedding', 'free', '#0E3A2A', '#1B5C42', '#F6E4B8', '#FFF4D8', '#DCB055', 'kasavu', 83, '2026-05-16', 'Zari temple-point borders woven top and bottom, in the deep green and kasavu gold of a Kerala mundu.', 'kerala kasavu zari saree malayali sadya green gold regional'],
    ['Mysore Madhuve', 'mysore-madhuve', 'wedding', 'free', '#F6E9CE', '#EBD6A8', '#5A1A18', '#8A241E', '#B4842A', 'mysore-arch', 84, '2026-05-18', 'A cusped Mysore arch under a ribbed dome, in sandalwood and kumkum for a Kannada madhuve.', 'kannada karnataka mysore madhuve sandalwood bangalore regional'],
    ['Punjabi Phulkari', 'punjabi-phulkari', 'wedding', 'free', '#7A0F3C', '#B01B4C', '#FFE2B0', '#FFF0D2', '#F2A62E', 'phulkari', 92, '2026-05-20', 'Phulkari darn stitch worked across the whole card in magenta and marigold floss, with a clear plaque for the names.', 'punjabi punjab phulkari embroidery vivah amritsar ludhiana regional'],
    ['Bengali Alpona', 'bengali-alpona', 'wedding', 'free', '#FDF7EF', '#F6E6D6', '#7A1220', '#A31A24', '#B8862F', 'alpona', 89, '2026-05-22', 'An alpona lotus with curling tendrils, drawn in rice paste on the courtyard floor of a Bengali biye.', 'bengali bengal biye alpona kolkata lotus regional'],
    ['Shankha Pola', 'shankha-pola', 'wedding', 'free', '#8A1220', '#B42433', '#FDF0E2', '#FFF6EC', '#E8B266', 'shankha', 81, '2026-05-24', 'The conch and the red-and-white bangles of a Bengali bride, set on a crest in sindoor red.', 'bengali shankha pola conch bangles biye ashirbad regional'],
    ['Gujarati Toran', 'gujarati-toran', 'wedding', 'free', '#0E4A34', '#1C6B48', '#FDECC8', '#FFF6DE', '#E8B44E', 'toran', 85, '2026-05-26', 'A beaded toran with mirrorwork and bells hung below the names, in the green and gold of a Gujarati lagna.', 'gujarati gujarat lagna toran mirrorwork ahmedabad regional'],
    ['Bandhani Bloom', 'bandhani-bloom', 'wedding', 'free', '#FDEAF2', '#F7CFE0', '#5A1230', '#A01A52', '#C4802A', 'bandhani', 80, '2026-05-28', 'Tie-dyed bandhani rosettes scattered edge to edge in rose and gold, the way a Gujarati odhani is dotted.', 'gujarati rajasthani bandhani bandhej tie dye odhani vivah regional'],
    ['Marathi Paithani', 'marathi-paithani', 'wedding', 'free', '#0C3A32', '#1A5C4C', '#F8E2B4', '#FFF2D4', '#DCA83E', 'paithani', 86, '2026-05-30', 'The Paithani peacock and its zari border, in the deep green and gold of a Maharashtrian nauvari.', 'marathi maharashtra paithani peacock vivah pune mumbai regional'],
    ['Mundavalya Pearls', 'mundavalya-pearls', 'wedding', 'free', '#FBF6F0', '#EFE4D6', '#4A2430', '#7A2C42', '#A88450', 'mundavalya', 78, '2026-06-01', 'Pearl mundavalya strings tied across a quiet pearl-white card, for a Marathi ceremony that keeps things restrained.', 'marathi mundavalya pearls maharashtra shubh vivah minimal regional'],
    ['Rajasthani Jharokha', 'rajasthani-jharokha', 'wedding', 'free', '#14265E', '#2A3F8C', '#FBE0C0', '#FFF0D8', '#E8A83E', 'jharokha', 91, '2026-06-03', 'A carved haveli jharokha in royal blue and gold, the balcony a Rajasthani bride watches the baraat from.', 'rajasthani rajasthan jharokha haveli udaipur jaipur royal regional'],
    ['Haveli Jaali', 'haveli-jaali', 'wedding', 'free', '#F6E2D2', '#E8C6AC', '#5C2A18', '#8A3E1E', '#B0742E', 'jaali', 82, '2026-06-05', 'Pierced sandstone jaali worked into a full border, in the pink-city tones of a Rajasthani haveli.', 'rajasthani jaali lattice sandstone haveli jaipur pink city regional'],
    ['Assamese Biya', 'assamese-biya', 'wedding', 'free', '#FFFBF4', '#F4E9DC', '#8A1A20', '#A82228', '#B4823A', 'japi', 76, '2026-06-07', 'The bamboo japi and gamosa weave on ivory, for an Assamese biya in the Brahmaputra valley.', 'assamese assam biya japi gamosa guwahati northeast regional'],
    ['Gamosa Weave', 'gamosa-weave', 'wedding', 'free', '#7A1218', '#A32026', '#FDF2E4', '#FFF8EE', '#E2B074', 'gamosa', 72, '2026-06-09', 'The red end-border of a hand-woven gamosa running down both sides of the card, offered the way the cloth itself is.', 'assamese gamosa weave handloom assam biya juron regional'],
    ['Odia Bahaghara', 'odia-bahaghara', 'wedding', 'free', '#F6DC94', '#E8BE58', '#5A1410', '#8A1E14', '#A8681E', 'konark', 79, '2026-06-11', 'The Konark chariot wheel at full size on Jagannath yellow, for an Odia bahaghara.', 'odia odisha bahaghara konark wheel puri jagannath regional'],
    ['Pattachitra Vows', 'pattachitra-vows', 'wedding', 'free', '#2A1608', '#52300F', '#F6DCA8', '#FBEDCA', '#D9A64E', 'pattachitra', 74, '2026-06-13', 'Scrolling pattachitra vine borders top and bottom, painted the way palm-leaf scrolls are in Raghurajpur.', 'odia pattachitra scroll painting odisha bahaghara folk regional'],
    ['Sindhi Ajrak', 'sindhi-ajrak', 'wedding', 'free', '#12233F', '#24406E', '#F4D8C6', '#C4442E', '#D98A5E', 'ajrak', 73, '2026-06-15', 'Ajrak block print in indigo and madder, repeated across the card as it is stamped on the cloth.', 'sindhi sindh ajrak block print indigo madder shadi regional'],
    ['Goan Azulejo', 'goan-azulejo', 'wedding', 'free', '#F4F8FC', '#D8E6F2', '#12345E', '#1A4A80', '#3E7AB0', 'azulejo', 81, '2026-06-17', 'Blue-and-white azulejo tiles from a Goan verandah, laid as a full field behind the names.', 'goan goa azulejo tiles portuguese catholic nuptial regional'],
    ['Konkan Coast', 'konkan-coast', 'wedding', 'free', '#0E3A3E', '#1E6068', '#FBE6CE', '#E07A3E', '#E8A468', 'coconut-palm', 77, '2026-06-19', 'Coconut palms leaning over a Konkan shoreline, in sea teal and laterite orange.', 'konkani konkan coastal mangalore goa palm beach regional'],
    ['Kashmiri Chinar', 'kashmiri-chinar', 'wedding', 'free', '#34180E', '#66301A', '#F6DCB4', '#C4531E', '#DFA24E', 'chinar', 80, '2026-06-21', 'Chinar leaves falling across walnut and saffron, painted the way Kashmiri papier-mache is.', 'kashmiri kashmir chinar leaf saffron walnut srinagar regional'],
    ['Nepali Bihe', 'nepali-bihe', 'wedding', 'free', '#6E0F16', '#C1440E', '#FFE8C0', '#FFF4DC', '#F2B23C', 'pagoda', 75, '2026-06-23', 'A tiered Newari pagoda with its hanging bells, in crimson and saffron for a Nepali bihe.', 'nepali nepal bihe pagoda newari kathmandu temple regional'],
    ['Mithila Vivah', 'mithila-vivah', 'wedding', 'free', '#F7E7C6', '#E9CE99', '#3A2008', '#A8341A', '#7A4A12', 'madhubani', 78, '2026-06-25', 'Madhubani fish and lotus in hatched line work, the pairing painted on a Mithila kohbar wall.', 'mithila madhubani bihar maithili folk art fish lotus vivah regional'],
    ['Lucknawi Chikankari', 'lucknawi-chikankari', 'wedding', 'free', '#F4FAF6', '#DCEDE2', '#24423A', '#2E5A4A', '#8AA894', 'chikankari', 79, '2026-06-27', 'Chikankari shadow-work butis on mint white, as fine and as quiet as the Awadhi embroidery itself.', 'lucknow awadhi chikankari embroidery shaadi minimal white regional'],
    ['Hindu Vivah', 'hindu-vivah', 'wedding', 'free', '#7A1E10', '#B24A18', '#FCE4B8', '#FFF2D6', '#EFBE68', 'havan', 93, '2026-06-29', 'The sacred fire in its havan kund with a lotus above it, for the ceremony where the vows are taken before Agni.', 'hindu vivah havan agni fire pheras sanatan religious ceremony'],
    ['Anand Karaj', 'anand-karaj', 'wedding', 'free', '#0E3A5A', '#1A5C7E', '#FBE2B4', '#FFF2D8', '#E8B855', 'khanda', 90, '2026-07-01', 'The Khanda set inside a gurdwara arch, for the four lavan of a Sikh Anand Karaj.', 'sikh anand karaj khanda gurdwara lavan punjabi religious'],
    ['Nikah Ceremony', 'nikah-ceremony', 'wedding', 'free', '#0C2A3E', '#17506E', '#F2DCAE', '#FBEED0', '#D9B25E', 'khatam', 91, '2026-07-03', 'Khatam eight-point geometry worked into a full border, the way it is cut into a mosque screen.', 'muslim islamic nikah walima khatam geometry mehr religious'],
    ['Christian Wedding', 'christian-wedding', 'wedding', 'free', '#F6F3FA', '#DFD8EE', '#2A2044', '#4A3272', '#8A6EB4', 'rose-window', 88, '2026-07-05', 'A stained-glass rose window under a plain cross, with two doves on the sill.', 'christian catholic church wedding matrimony rose window cross religious'],
    ['Jain Vivah', 'jain-vivah', 'wedding', 'free', '#FDF6EA', '#F2E2C6', '#3A2A10', '#7A5418', '#A88434', 'ahimsa', 76, '2026-07-07', 'The ahimsa hand with its wheel of restraint, in the ivory and gold of a Jain ceremony.', 'jain vivah ahimsa derasar shwetambar digambar religious'],
    ['Buddhist Union', 'buddhist-union', 'wedding', 'free', '#5A2410', '#8E4418', '#FBE0B0', '#FFF0D2', '#E8AE58', 'dharmachakra', 74, '2026-07-09', 'The dharma wheel resting on a lotus throne, flanked by endless knots, in monastic saffron.', 'buddhist dharma wheel lotus endless knot saffron religious'],
    ['Parsi Lagan', 'parsi-lagan', 'wedding', 'free', '#123A4E', '#1E5E76', '#F6E0BC', '#FFF2DA', '#DDB268', 'faravahar', 71, '2026-07-11', 'The winged faravahar between two cypress trees, for a Parsi lagan held at dusk.', 'parsi zoroastrian lagan faravahar cypress ashirwad religious'],
    ['Interfaith Union', 'interfaith-union', 'wedding', 'free', '#F7F4EE', '#E6DFD2', '#33302A', '#5A4E3C', '#9A8A66', 'two-arches', 77, '2026-07-13', 'Two arches meeting as one doorway, with a botanical sprig where they overlap — no single tradition takes the lead.', 'interfaith mixed faith blended union neutral secular religious'],
    ['Civil Ceremony', 'civil-ceremony', 'wedding', 'free', '#F4F5F7', '#E2E5EA', '#1E2530', '#33404F', '#7A8798', 'civil-knot', 79, '2026-07-15', 'Two plain rings and a reef knot on cool grey — a registry-office card with no religious mark on it at all.', 'civil secular registry courthouse non religious humanist minimal'],
    ['Japanese Mizuhiki', 'japanese-mizuhiki', 'wedding', 'free', '#FBF7F2', '#EAE0D4', '#2E2A26', '#8C2F2A', '#A8865C', 'mizuhiki', 86, '2026-07-17', 'A mizuhiki knot tied above a crane, with asanoha marks on washi-toned paper.', 'japanese japan mizuhiki crane shinto kekkon washi international'],
    ['Korean Dancheong', 'korean-dancheong', 'wedding', 'free', '#0E2E4A', '#1C5578', '#F6E0C0', '#FFF2DC', '#E0A85E', 'dancheong', 80, '2026-07-19', 'Dancheong eave banding above and below a pair of mandarin ducks — the Korean sign of a marriage that lasts.', 'korean korea dancheong hanbok pyebaek mandarin duck international'],
    ['Chinese Double Joy', 'chinese-double-joy', 'wedding', 'free', '#7A0F16', '#B01E22', '#FCE0B4', '#FFF2D8', '#EFC062', 'peony-lantern', 88, '2026-07-21', 'A palace lantern between peonies and cloud scrolls, in the vermilion and gold of a Chinese wedding.', 'chinese china hunli peony lantern tea ceremony red gold international'],
    ['Filipino Sampaguita', 'filipino-sampaguita', 'wedding', 'free', '#F8F5EE', '#E8E0CE', '#2A3A2E', '#3E6A4A', '#A08A4E', 'sampaguita', 78, '2026-07-23', 'Sampaguita blooms strung above piña-weave banding, the way the garland is offered at a Filipino kasalan.', 'filipino philippines kasalan sampaguita barong pina international'],
    ['Thai Lai Kranok', 'thai-lai-kranok', 'wedding', 'free', '#2E1440', '#5E2468', '#F8DEA8', '#FFF0CE', '#E4B052', 'kranok', 76, '2026-07-25', 'Lai kranok flame scrollwork rising inside a temple arch, with a phuang malai garland beneath.', 'thai thailand kranok phuang malai buddhist rod nam sang international'],
    ['Indonesian Batik', 'indonesian-batik', 'wedding', 'free', '#2A1A0E', '#5A3A18', '#F4E0BC', '#C4732E', '#D9A45E', 'batik', 77, '2026-07-27', 'The parang diagonal of a batik cloth repeated across the card in soga brown and cream.', 'indonesian indonesia batik parang javanese pernikahan international'],
    ['Vietnamese Lotus', 'vietnamese-lotus', 'wedding', 'free', '#F9F2EE', '#EEDCD2', '#7A2018', '#A8301E', '#B4823E', 'vn-lotus', 75, '2026-07-29', 'The lotus of a Dong Ho print resting on still water, above a bamboo rail.', 'vietnamese vietnam le cuoi lotus ao dai dong ho international'],
    ['Pakistani Truck Art', 'pakistani-truck-art', 'wedding', 'free', '#0E3A4E', '#1A6076', '#FBDCA4', '#E0552E', '#EFA644', 'truck-art', 82, '2026-07-31', 'A truck-art panel — scalloped arch, painted rosette and hanging chains — in the colours that cover a Karachi lorry.', 'pakistani pakistan truck art shaadi barat walima folk international'],
    ['Bangladeshi Jamdani', 'bangladeshi-jamdani', 'wedding', 'free', '#0E3A2E', '#1C6048', '#F8E2B8', '#C4342E', '#DCA84E', 'jamdani', 76, '2026-08-02', 'Jamdani butis woven into a full border around a water-lily, in the green and red of a Dhaka wedding.', 'bangladeshi bangladesh jamdani biye gaye holud dhaka international'],
    ['Sri Lankan Poruwa', 'sri-lankan-poruwa', 'wedding', 'free', '#FDF6E6', '#F2E2BE', '#4A2A0E', '#8A4A16', '#B0842E', 'punkalasa', 74, '2026-08-04', 'The Kandyan punkalasa, pot of plenty, standing on the poruwa platform where the couple exchange their vows.', 'sri lankan sinhala kandyan poruwa punkalasa colombo international'],
    ['Italian Rinascimento', 'italian-rinascimento', 'wedding', 'free', '#F7F1E4', '#E8DAC0', '#3A2A18', '#6E4A20', '#A88440', 'renaissance', 85, '2026-08-06', 'A Florentine rosette between acanthus scrolls and olive sprigs, on Tuscan stone tones.', 'italian italy matrimonio tuscany renaissance olive amalfi international'],
    ['French Fleur de Lis', 'french-fleur-de-lis', 'wedding', 'free', '#F4F5FA', '#DFE2EE', '#22283E', '#3A4468', '#8A7A4E', 'fleur', 84, '2026-08-08', 'A fleur-de-lis held inside an art-nouveau iron scroll, in Parisian grey-blue and antique brass.', 'french france mariage fleur de lis paris provence chateau international'],
    ['Greek Meander', 'greek-meander', 'wedding', 'free', '#F6FAFD', '#DCEAF4', '#123A5E', '#1A5484', '#3E86B4', 'meander', 81, '2026-08-09', 'The meander key border framing an olive branch, in Aegean blue and whitewash.', 'greek greece gamos meander olive santorini aegean stefana international'],
    ['Spanish Mudejar', 'spanish-mudejar', 'wedding', 'free', '#6E1418', '#A82A22', '#FBE2BE', '#FFF0D4', '#E8B058', 'mudejar', 80, '2026-08-10', 'A mudéjar star tile above a folding fan, in Sevillian red and gold.', 'spanish spain boda mudejar seville flamenco andalusia international'],
    ['British Regency', 'british-regency', 'wedding', 'free', '#12332A', '#1E5442', '#F0E4C8', '#FBF2DC', '#C9AC6E', 'heraldic', 83, '2026-08-11', 'A laurel crest above letterpress rules, in the bottle green and warm brass of an English country wedding.', 'british england uk regency laurel crest countryside international'],
    ['Nigerian Adire', 'nigerian-adire', 'wedding', 'free', '#101C4A', '#22357A', '#F2E2C4', '#E8A62E', '#D9B468', 'adire', 82, '2026-05-05', 'Adire indigo resist — rings, combs and stitched squares — repeated the way the cloth is dyed in Abeokuta.', 'nigerian nigeria adire yoruba igbeyawo aso ebi indigo international'],
    ['Ghanaian Kente', 'ghanaian-kente', 'wedding', 'free', '#1A1206', '#4A3208', '#F8DC8C', '#C4281E', '#E0B22E', 'kente', 79, '2026-05-07', 'Kente strip weave running down both sides with an adinkra knot at the centre, in Ashanti gold, green and red.', 'ghanaian ghana kente adinkra ashanti ayeforo knocking international'],
    ['Moroccan Zellige', 'moroccan-zellige', 'wedding', 'free', '#0E3A3E', '#1A6068', '#F6E0B4', '#C4472E', '#DFA84E', 'zellige', 84, '2026-05-09', 'A zellige star with riad lanterns hung either side, in Marrakech teal and terracotta.', 'moroccan morocco zellige riad marrakech lantern zafaf international'],
    ['Mexican Papel Picado', 'mexican-papel-picado', 'wedding', 'free', '#0E2A5A', '#1E4A8C', '#FCE2B0', '#E8542E', '#F0AE3E', 'papel-picado', 85, '2026-05-11', 'Papel picado banners strung over marigolds, in the cobalt and cempasúchil orange of a Mexican fiesta.', 'mexican mexico boda papel picado marigold talavera fiesta international'],
    ['Brazilian Tropical', 'brazilian-tropical', 'wedding', 'free', '#0C3226', '#1A5C3E', '#F6E8C8', '#E0A02E', '#8AC49A', 'tropical', 78, '2026-05-13', 'Monstera and palm leaves falling across the card above a Portuguese tile band.', 'brazilian brazil casamento tropical monstera rio praia international'],
    ['Caribbean Hibiscus', 'caribbean-hibiscus', 'wedding', 'free', '#06333E', '#0E6072', '#FDE8CE', '#E86A3E', '#F0AE7A', 'hibiscus', 80, '2026-05-15', 'Hibiscus blooms over a two-line sea, in turquoise water and sunset coral.', 'caribbean island beach hibiscus jamaica trinidad tropical international'],
    ['Persian Boteh', 'persian-boteh', 'wedding', 'free', '#0E3A4A', '#186478', '#F6E2B8', '#C4442E', '#DFB05E', 'boteh', 79, '2026-05-17', 'Boteh paisleys turning around a tile rosette, in the turquoise and saffron of an Iranian sofreh aghd.', 'persian iranian aroosi boteh paisley sofreh aghd turquoise international'],
    ['Ethiopian Habesha', 'ethiopian-habesha', 'wedding', 'free', '#FDF8EE', '#F0E4D0', '#5A1A16', '#8A2A18', '#B4863A', 'habesha', 73, '2026-05-19', 'A habesha cross above woven tibeb banding, on the natural white of a hand-spun kemis.', 'ethiopian ethiopia habesha serg tibeb kemis melse international'],
    ['Ring Ceremony', 'ring-ceremony', 'engagement', 'free', '#FBF6F4', '#EDDFDA', '#3A2A2E', '#7A4450', '#B08A72', 'rings-pair', 88, '2026-05-21', 'Two bands crossing under a solitaire, on the quietest paper in the collection.', 'engagement ring ceremony sagai proposal betrothal function'],
    ['Roka Ceremony', 'roka-ceremony', 'engagement', 'free', '#FDF2E2', '#F4DEB8', '#5A2E10', '#8A4414', '#B4842E', 'sagan-thali', 80, '2026-05-23', 'The shagun thali — coconut, envelope and coins — framed for the first formal meeting of the two families.', 'roka shagun sagan thali engagement north indian punjabi function'],
    ['Tilak Ceremony', 'tilak-ceremony', 'engagement', 'free', '#7A1E08', '#B04A12', '#FCE6C0', '#FFF2D8', '#EFBE68', 'tilak', 76, '2026-05-25', 'The tilak, the rice and the kalash on a small plate, for the morning the groom is marked.', 'tilak teeka ceremony groom blessing north indian bihari function'],
    ['Royal Ring Ceremony', 'royal-ring-ceremony', 'engagement', 'premium', '#3E0A12', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'crown', 92, '2026-12-30', 'A crowned emblem with gilded flourishes for a majestic ring ceremony.', 'engagement royal ring ceremony crown burgundy gold luxury premium diamond'],
    ['Elegant Ring Ceremony', 'elegant-ring-ceremony', 'engagement', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#8A6A28', '#C9A85E', 'rings', 89, '2026-12-30', 'An arch of champagne and ivory with interlocked rings at its heart.', 'engagement ring ceremony elegant champagne ivory gold classic diamond'],
    ['Golden Engagement', 'golden-engagement', 'engagement', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#FBEDCB', '#DCB264', 'rings', 90, '2026-12-31', 'A full gold mandala framing the rings for a gilded, unforgettable card.', 'engagement golden gold mandala rings luxury black celebration diamond'],
    ['Rose Gold Engagement', 'rose-gold-engagement', 'engagement', 'free', '#FDF1EE', '#F8DCD6', '#5A2632', '#B04A5E', '#E0A0A8', 'heart', 88, '2026-12-31', 'A rose-gold arch with a heart emblem in blush for a soft romantic card.', 'engagement rose gold blush heart romantic arch soft'],
    ['Emerald Engagement', 'emerald-engagement', 'engagement', 'free', '#0E2A1E', '#1E5C3E', '#E8E4BC', '#FBF6DC', '#C9B868', 'leaf', 86, '2027-01-01', 'An emerald wreath of leaves and gold for a lush, garden-touched card.', 'engagement emerald gold leaf wreath garden botanical'],
    ['Sapphire Engagement', 'sapphire-engagement', 'engagement', 'free', '#0B1B3A', '#1E3E6E', '#F0E0BC', '#FBEFD0', '#D9B45E', 'sparkle', 87, '2027-01-01', 'A sapphire circle framed with gold sparkle for a deep, cool-toned card.', 'engagement sapphire gold sparkle circle deep elegant diamond'],
    ['Pearl Engagement', 'pearl-engagement', 'engagement', 'free', '#FCFAF5', '#EFE6D4', '#4A3C26', '#8A6E38', '#C0A878', 'dove', 84, '2027-01-02', 'Fine rules and a dove in pearl and bronze for a quiet, classic card.', 'engagement pearl bronze dove white classic minimal'],
    ['Floral Engagement', 'floral-engagement', 'engagement', 'free', '#4A1E2E', '#8A3A4E', '#FCE0E4', '#FFF0F2', '#E8A8B4', 'rose', 87, '2027-01-02', 'Symmetrical rose sprays in dusty rose and burgundy for a floral card.', 'engagement floral roses dusty rose blooms romantic'],
    ['Garden Engagement', 'garden-engagement', 'engagement', 'free', '#F6F8F0', '#E4E8D4', '#2E3A28', '#5C6E48', '#9AA88A', 'blossom', 85, '2027-01-03', 'Scalloped garlands of blossom in sage and ivory for an open-air card.', 'engagement garden blossom garland sage ivory outdoor'],
    ['Luxury Engagement', 'luxury-engagement', 'engagement', 'premium', '#2A1F3C', '#5B3A63', '#F2E3CE', '#FBF1E2', '#DCB27E', 'chandelier', 91, '2027-01-03', 'A hanging chandelier over plum and champagne for a luxurious card.', 'engagement luxury chandelier plum champagne glamour premium'],
    ['Minimal Engagement', 'minimal-engagement', 'engagement', 'free', '#F7F6F2', '#E4E2DA', '#2A2A28', '#4A4A46', '#9A9A90', 'rings', 82, '2027-01-04', 'A geometric tile border with clean rings for a pared-back, modern card.', 'engagement minimal clean rings geometric ivory charcoal modern diamond'],
    ['Contemporary Engagement', 'contemporary-engagement', 'engagement', 'free', '#0E1B2E', '#1E3A5E', '#EDE0C8', '#FAF3E0', '#D9C79E', 'rings', 86, '2027-01-04', 'A two-tier composition in navy and ivory for a contemporary statement.', 'engagement contemporary modern navy ivory rings bold'],
    ['Romantic Engagement', 'romantic-engagement', 'engagement', 'premium', '#3A2A54', '#6E4A8A', '#F3E0D2', '#FBEEDF', '#D9B45E', 'heart', 90, '2027-01-05', 'Haloed hearts in mauve and gold for a deeply romantic celebration.', 'engagement romantic hearts mauve gold love halo'],
    ['Candlelight Engagement', 'candlelight-engagement', 'engagement', 'free', '#3E0A12', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'candle', 85, '2027-01-05', 'Rows of glowing candles over burgundy for a warm, intimate evening.', 'engagement candlelight candles warm intimate burgundy'],
    ['Sunset Engagement', 'sunset-engagement', 'engagement', 'free', '#F8EFE2', '#EAD6B8', '#4A2E16', '#8A4E1E', '#C08A50', 'sun', 84, '2027-01-06', 'Wave bands and a low sunset sun in terracotta and cream for warm skies.', 'engagement sunset golden hour sun terracotta warm'],
    ['Moonlight Engagement', 'moonlight-engagement', 'engagement', 'free', '#0E1330', '#2A2F63', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'crescentMoon', 86, '2027-01-06', 'A crescent moon over a midnight-blue starfield for a serene evening.', 'engagement moonlight crescent moon midnight blue serene'],
    ['Starry Engagement', 'starry-engagement', 'engagement', 'free', '#0E1B2E', '#1E3A5E', '#F0E0BC', '#FBEFD0', '#D9B45E', 'star5', 87, '2027-01-07', 'String lights and a field of stars across navy for a twinkling card.', 'engagement starry stars navy gold string lights night'],
    ['Palace Engagement', 'palace-engagement', 'engagement', 'premium', '#2A1440', '#5C2A7A', '#F3D9A0', '#FBEDCB', '#D9B45E', 'fleurDeLis', 89, '2027-01-07', 'Palace gates framing the fleur-de-lis in royal purple and gold.', 'engagement palace royal fleur de lis purple gold luxury'],
    ['Heritage Engagement', 'heritage-engagement', 'engagement', 'free', '#0E2A16', '#22602E', '#E2F4D8', '#FFF4DC', '#96CE7A', 'mandala', 87, '2027-01-08', 'A medallion shield in deep green and gold celebrating heritage and love.', 'engagement heritage mandala deep green gold traditional medallion'],
    ['Beach Engagement', 'beach-engagement', 'engagement', 'free', '#F0F6FA', '#D8E6F0', '#2A3A4E', '#4E6E8A', '#9AB4CE', 'wave', 83, '2027-01-08', 'Bookend waves in powder blue and silver for a breezy seaside card.', 'engagement beach waves powder blue silver seaside'],
    ['Destination Engagement', 'destination-engagement', 'engagement', 'free', '#0B1B3A', '#1E3E6E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'globe', 85, '2027-01-09', 'Classic columns around a globe in sapphire and silver for a travel card.', 'engagement destination travel globe columns sapphire silver'],
    ['Engagement Dinner', 'engagement-dinner', 'engagement', 'free', '#2A1F3C', '#5B3A63', '#F2E3CE', '#FBF1E2', '#DCB27E', 'coupe', 86, '2027-01-09', 'Candles and a raised coupe under plum and champagne for a dinner card.', 'engagement dinner candelabra coupe toast plum champagne evening'],
    ['Cocktail Engagement', 'cocktail-engagement', 'engagement', 'free', '#0E1B2E', '#1E3A5E', '#EDE0C8', '#FAF3E0', '#D9C79E', 'sparkle', 84, '2027-01-10', 'Music notes, sparkle and a coupe for a lively cocktail-hour card.', 'engagement cocktail drinks music sparkle navy ivory party'],
    ['Intimate Engagement', 'intimate-engagement', 'engagement', 'free', '#FDF1EE', '#F8DCD6', '#5A2632', '#B04A5E', '#E0A0A8', 'heart', 83, '2027-01-10', 'A ribbon banner and heart emblem for a small, close-family gathering.', 'engagement intimate small family ribbon heart blush'],
    ['Grand Celebration', 'grand-engagement-celebration', 'engagement', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#FBEDCB', '#DCB264', 'sparkle', 91, '2027-01-11', 'Gold rays bursting behind sparkle on dramatic black for a grand card.', 'engagement grand celebration rays gold black dramatic premium'],
    ['Family Engagement', 'family-engagement', 'engagement', 'free', '#F8EFE2', '#EAD6B8', '#4A2E16', '#8A4E1E', '#C08A50', 'tree', 82, '2027-01-11', 'A central tree of many branches for a card that honours both families.', 'engagement family tree branches terracotta cream together'],
    ['Traditional Engagement', 'traditional-engagement', 'engagement', 'free', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'kalash', 88, '2027-01-12', 'A row of lamps beneath a kalash for a classic, ritual-rich ceremony.', 'engagement traditional kalash lamps maroon ceremony rituals indian'],
    ['Cultural Engagement', 'cultural-engagement', 'engagement', 'free', '#4A1018', '#7A1E2A', '#F3D9A0', '#FBEDCB', '#D9B45E', 'mandala', 87, '2027-01-12', 'Scalloped bands around a gold mandala honouring deep cultural roots.', 'engagement cultural mandala maroon gold heritage traditional'],
    ['Intercultural Engagement', 'intercultural-engagement', 'engagement', 'free', '#4A1E2E', '#8A3A4E', '#F3E0D2', '#FBEEDF', '#D9B45E', 'rings', 86, '2027-01-13', 'Interlocking rings under hanging light for a union of two traditions.', 'engagement intercultural multicultural two worlds rings celebration'],
    ['International Engagement', 'international-engagement', 'engagement', 'free', '#0E2A1E', '#1E5C3E', '#E8E4BC', '#FBF6DC', '#C9B868', 'globe', 84, '2027-01-13', 'A full decorative border around a globe in emerald and champagne.', 'engagement international globe world emerald champagne border'],
    ['Celestial Engagement', 'celestial-engagement', 'engagement', 'premium', '#0E1330', '#2A2F63', '#F0E0BC', '#FFEDC4', '#D9B45E', 'crescentStar', 88, '2027-01-14', 'A crescent-and-star emblem with raised toasts in midnight and gold.', 'engagement celestial stars moon midnight gold premium dreamy'],
    ['Vintage Engagement', 'vintage-engagement', 'engagement', 'free', '#FCFAF5', '#EFE6D4', '#5A4A36', '#8A6E38', '#C0A878', 'feather', 82, '2027-01-14', 'A feather medallion in sepia tones for a vintage, heirloom-style card.', 'engagement vintage feather sepia classic heirloom ivory'],
    ['Botanical Engagement', 'botanical-engagement', 'engagement', 'free', '#F6F8F0', '#E4E8D4', '#2E3A28', '#5C6E48', '#9AA88A', 'blossom', 85, '2027-01-15', 'Interlocked rings over a blossom emblem in fresh sage and ivory.', 'engagement botanical blossom sage ivory rings fresh'],
    ['Mehendi Ceremony', 'mehendi-ceremony', 'wedding', 'free', '#1E3A0C', '#3E6E16', '#F2F6CE', '#8AB42E', '#C4D468', 'mehndi-cone', 90, '2026-05-27', 'A henna cone trailing paisley across deep leaf green, for the afternoon before everything begins.', 'mehendi mehndi henna paisley function bride pre wedding'],
    ['Haldi Ceremony', 'haldi-ceremony', 'wedding', 'free', '#4A3200', '#B8860B', '#FFF0C4', '#FFF8E2', '#F2C64E', 'haldi-pot', 89, '2026-05-29', 'The turmeric bowl and its applicators between marigold heads, in the yellow the whole morning turns.', 'haldi turmeric pithi ubtan marigold function pre wedding'],
    ['Sangeet Evening', 'sangeet-evening', 'wedding', 'free', '#2A0C46', '#68168E', '#FBD8F4', '#FFF0FC', '#E88FD8', 'ghungroo', 91, '2026-05-31', 'Ghungroo bells strung above a dholak, for the night both families finally perform.', 'sangeet dance music dholak ghungroo function pre wedding'],
    ['Baraat Procession', 'baraat-procession', 'wedding', 'free', '#0E2A6E', '#2450A8', '#FBDCA8', '#FFF0CE', '#EFB43E', 'baraat', 85, '2026-06-02', 'The ghodi under her plumed canopy, waiting for the band to start.', 'baraat ghodi procession horse band groom function wedding day'],
    ['Jaimala Exchange', 'jaimala-exchange', 'wedding', 'free', '#FDF2F4', '#F6DCE2', '#5A1A2A', '#96304A', '#C08A44', 'varmala', 83, '2026-06-04', 'Two varmala held ready — the moment before the garlands are exchanged.', 'jaimala varmala garland exchange stage function wedding day'],
    ['Saat Phere', 'saat-phere', 'wedding', 'free', '#6E1408', '#A83A10', '#FCE2B0', '#FFF0D2', '#EFBA5E', 'saptapadi', 87, '2026-06-06', 'Seven steps marked around the sacred fire, one for each vow taken that night.', 'phere saptapadi seven steps agni fire vows function wedding day'],
    ['Nikah Nama', 'nikah-nama', 'wedding', 'free', '#F7F6F0', '#E6E4D6', '#1E3A32', '#2E5A4A', '#8A8250', 'nikahnama', 84, '2026-06-08', 'The nikahnama and the qalam, with arabesque corners — the contract at the centre of the day.', 'nikah nikahnama contract qalam walima muslim function'],
    ['Anand Karaj Ardas', 'anand-karaj-ardas', 'wedding', 'free', '#F6F2E4', '#E6DEC2', '#1E3A5A', '#2A5480', '#A8863E', 'palki', 82, '2026-06-10', 'The palki canopy with its rumala fringe, for the morning of the four lavan.', 'anand karaj palki ardas lavan langar sikh gurdwara function'],
    ['Wedding Day', 'wedding-day-mandap', 'wedding', 'free', '#FDF4EC', '#F2DFCC', '#5A2418', '#8A3A1E', '#B4823A', 'mandap', 92, '2026-06-12', 'A four-post mandap under a draped canopy, drawn for the ceremony itself rather than the parties around it.', 'wedding day mandap ceremony muhurtham vows function main'],
    ['Reception Evening', 'reception-evening', 'reception', 'free', '#0E1226', '#26305E', '#F2E2BE', '#FFF2D8', '#D9B468', 'coupe', 88, '2026-06-14', 'Two coupes raised under a string of bulbs, for the evening after the ceremony is done.', 'reception dinner evening party coupe lights function'],
    ['After Party', 'after-party', 'reception', 'free', '#120A24', '#3A1060', '#EAD8FF', '#C77DF0', '#8AF0DC', 'afterparty', 79, '2026-06-16', 'A mirror ball throwing beams across a poster-sized card, for whoever is still standing at midnight.', 'after party late night club dj mirror ball function modern'],
    ['Vidaai Farewell', 'vidaai-farewell', 'wedding', 'free', '#3A2438', '#6E4468', '#F6E2E8', '#FFF2F4', '#D9A8B8', 'doli', 74, '2026-06-18', 'The doli and a handful of rice thrown back over a shoulder, in the muted plum of a goodbye.', 'vidaai bidaai farewell doli departure bride family function'],
    ['Wedding Brunch', 'wedding-brunch', 'reception', 'free', '#FBF8F0', '#EDE6D6', '#33302A', '#7A6A4A', '#A89460', 'brunch', 76, '2026-06-20', 'A cup, a sprig and a folded napkin, laid out left-aligned for the slowest event of the weekend.', 'brunch morning after breakfast farewell casual function'],
    ['Grand Luxury Reception', 'grand-luxury-reception', 'reception', 'premium', '#0E0B07', '#2A1F10', '#F3D9A0', '#FBEDCB', '#DCB264', 'crown', 92, '2026-12-10', 'A crowned emblem with gilded flourishes for a truly grand reception.', 'reception grand luxury gold crown dinner celebration evening function'],
    ['Royal Palace Reception', 'royal-palace-reception', 'reception', 'premium', '#0E1B2E', '#1E3A5E', '#F0E0BC', '#FBEFD0', '#D9B45E', 'fleurDeLis', 90, '2026-12-10', 'Palace gates framing the fleur-de-lis for a regal, ballroom-inspired card.', 'reception royal palace ballroom fleur de lis navy gold celebration function'],
    ['Modern Minimal Reception', 'modern-minimal-reception', 'reception', 'free', '#FBF7EE', '#ECE0C8', '#3A2E1C', '#6E5528', '#A8843A', 'rings', 85, '2026-12-11', 'A tidy tile grid with interlocking rings for a pared-back, contemporary look.', 'reception modern minimal clean rings ivory bronze function celebration'],
    ['Classic Elegant Reception', 'classic-elegant-reception', 'reception', 'free', '#3E0A12', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'rose', 88, '2026-12-11', 'An arched rose emblem over burgundy and gold for timeless elegance.', 'reception classic elegant rose burgundy gold evening celebration function'],
    ['Luxury Ballroom', 'luxury-ballroom-reception', 'reception', 'premium', '#3A1C28', '#7A3A4E', '#FBE0E6', '#FFF1F4', '#E0A0B0', 'chandelier', 89, '2026-12-12', 'A hanging chandelier over rose gold tones for a glamorous ballroom card.', 'reception ballroom chandelier luxury rose gold glamour celebration function'],
    ['Garden Evening Reception', 'garden-evening-reception', 'reception', 'free', '#12301F', '#2C5C3C', '#DFF2E4', '#FFFFFF', '#8DC79E', 'leaf', 84, '2026-12-12', 'A wreath of leaves in sage and cream for a reception under open sky.', 'reception garden evening leaves sage cream outdoor celebration function'],
    ['Beach Reception', 'beach-reception', 'reception', 'free', '#0B1B3A', '#1E3E6E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'wave', 83, '2026-12-13', 'Rolling waves in sapphire and silver for a seaside reception toast.', 'reception beach waves sapphire silver seaside toast celebration function'],
    ['Rooftop Reception', 'rooftop-reception', 'reception', 'free', '#0E1330', '#2A2F63', '#DCE2FF', '#FFFFFF', '#8FA0E8', 'bulb', 87, '2026-12-13', 'A warm string of bulbs across a midnight sky for an urban rooftop party.', 'reception rooftop string lights city night celebration function'],
    ['Hotel Reception', 'hotel-reception', 'reception', 'free', '#0E1B2E', '#1E3A5E', '#F0E0BC', '#FBEFD0', '#D9B45E', 'coupe', 86, '2026-12-14', 'Classic columns and a raised coupe for a grand hotel ballroom evening.', 'reception hotel ballroom columns coupe navy gold celebration function'],
    ['Resort Reception', 'resort-reception', 'reception', 'free', '#0E2A1E', '#1E5C3E', '#E8E4BC', '#FBF6DC', '#C9B868', 'hibiscus', 84, '2026-12-14', 'Hibiscus blooms strung across emerald and champagne for a resort fete.', 'reception resort tropical hibiscus emerald celebration function'],
    ['Candlelight Reception', 'candlelight-reception', 'reception', 'free', '#3E0A12', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'candle', 85, '2026-12-15', 'Rows of glowing candles over burgundy for a warm, intimate reception.', 'reception candlelight candles warm intimate burgundy celebration function'],
    ['Floral Reception', 'floral-reception', 'reception', 'free', '#4A1E2E', '#8A3A4E', '#FCE0E4', '#FFF0F2', '#E8A8B4', 'rose', 86, '2026-12-15', 'Symmetrical rose sprays in dusty rose and burgundy for a floral card.', 'reception floral roses dusty rose garden blooms celebration function'],
    ['Black & Gold Reception', 'black-gold-reception', 'reception', 'premium', '#0E0B07', '#2A1F10', '#F3D9A0', '#FBEDCB', '#DCB264', 'sparkle', 90, '2026-12-16', 'Gold rays bursting behind a sparkle on dramatic black for a bold statement.', 'reception black gold sparkle dramatic bold celebration function'],
    ['Rose Gold Reception', 'rose-gold-reception', 'reception', 'free', '#3A1C28', '#7A3A4E', '#FBE0E6', '#FFF1F4', '#E0A0B0', 'rose', 87, '2026-12-16', 'An arch of rose gold with a single rose at its heart for a soft, glam card.', 'reception rose gold plum arch rose soft glam celebration function'],
    ['Champagne Reception', 'champagne-reception', 'reception', 'premium', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#8A6A28', '#C9A85E', 'coupe', 88, '2026-12-17', 'Two raised coupes catching golden light for a champagne-coloured toast.', 'reception champagne toast coupe ivory gold celebration function'],
    ['Crystal Reception', 'crystal-reception', 'reception', 'free', '#0B1B3A', '#1E3E6E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'snowflake', 82, '2026-12-17', 'Haloed crystal snowflakes in sapphire and silver for a frosty chic card.', 'reception crystal snowflake sapphire silver icy celebration function'],
    ['Vintage Reception', 'vintage-reception', 'reception', 'free', '#FBF7EE', '#ECE0C8', '#3A2E1C', '#6E5528', '#A8843A', 'feather', 81, '2026-12-18', 'A feather medallion in sepia tones for a vintage, heirloom-style reception.', 'reception vintage feather sepia classic heirloom celebration function'],
    ['Boho Reception', 'boho-reception', 'reception', 'free', '#3E2208', '#8A4E10', '#FBE0AE', '#FFF0CE', '#E8AE4E', 'blossom', 82, '2026-12-18', 'Scalloped garlands of blossom over terracotta for a relaxed boho fete.', 'reception boho blossom garland terracotta earthy celebration function'],
    ['Contemporary Reception', 'contemporary-reception', 'reception', 'free', '#161A24', '#2A3040', '#EFE2BE', '#FFF2D8', '#CDA95E', 'rings', 84, '2026-12-19', 'Fine gold rules framing interlocking rings on charcoal for a modern card.', 'reception contemporary modern minimal rings charcoal gold celebration function'],
    ['Romantic Evening Reception', 'romantic-evening-reception', 'reception', 'premium', '#4A1E2E', '#8A3A4E', '#FCE0E4', '#FFF0F2', '#E8A8B4', 'heart', 89, '2026-12-19', 'Haloed hearts in dusty rose for a deeply romantic reception evening.', 'reception romantic hearts love dusty rose celebration function'],
    ['Moonlight Reception', 'moonlight-reception', 'reception', 'free', '#0E1330', '#2A2F63', '#DCE2FF', '#FFFFFF', '#8FA0E8', 'crescentMoon', 86, '2026-12-20', 'A crescent moon on midnight blue for a serene, moonlit celebration.', 'reception moonlight crescent moon midnight blue dance celebration function'],
    ['Starry Night Reception', 'starry-night-reception', 'reception', 'free', '#0E1330', '#2A2F63', '#DCE2FF', '#FFFFFF', '#8FA0E8', 'star5', 87, '2026-12-20', 'A field of stars across midnight blue for a twinkling night-time card.', 'reception starry night stars midnight blue twinkle celebration function'],
    ['Sunset Reception', 'sunset-reception', 'reception', 'free', '#3E2208', '#8A4E10', '#FBE0AE', '#FFF0CE', '#E8AE4E', 'sun', 85, '2026-12-21', 'Scalloped bands framing a low sunset sun in terracotta and gold.', 'reception sunset golden hour sun terracotta celebration function'],
    ['Lotus Garden Reception', 'lotus-garden-reception', 'reception', 'free', '#0E2A16', '#22602E', '#E2F4D8', '#FFF4DC', '#96CE7A', 'lotus', 84, '2026-12-21', 'Bookend lotuses in deep green and gold for a serene garden reception.', 'reception lotus garden deep green gold serene celebration function'],
    ['Palace Courtyard Reception', 'palace-courtyard-reception', 'reception', 'premium', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'peacock', 88, '2026-12-22', 'A peacock mandala under maroon and champagne for a palace courtyard card.', 'reception palace courtyard peacock mandala maroon celebration function'],
    ['Luxury Dinner Reception', 'luxury-dinner-reception', 'reception', 'premium', '#0E2A1E', '#1E5C3E', '#E8E4BC', '#FBF6DC', '#C9B868', 'candle', 87, '2026-12-22', 'An emerald candelabra glinting with champagne for a fine-dining evening.', 'reception luxury dinner candelabra emerald champagne celebration function'],
    ['Cocktail Reception', 'cocktail-reception', 'reception', 'free', '#0E1B2E', '#1E3A5E', '#F0E0BC', '#FBEFD0', '#D9B45E', 'musicNote', 86, '2026-12-23', 'Music notes and a raised coupe for a lively cocktail-hour reception.', 'reception cocktail drinks music notes navy gold celebration function'],
    ['Traditional Celebration Reception', 'traditional-celebration-reception', 'reception', 'free', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'rangoli', 89, '2026-12-23', 'A rangoli medallion in maroon and champagne honouring a traditional evening.', 'reception traditional heritage rangoli maroon rituals celebration function'],
    ['Cultural Heritage Reception', 'cultural-heritage-reception', 'reception', 'free', '#2A1808', '#5C2A0E', '#F3D9A0', '#FBE8C4', '#D9B45E', 'mandala', 87, '2026-12-24', 'A gold mandala with festive bunting celebrating rich cultural heritage.', 'reception cultural heritage mandala gold bunting celebration function'],
    ['International Reception', 'international-reception', 'reception', 'free', '#0B1B3A', '#1E3E6E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'globe', 83, '2026-12-24', 'A globe framed in sapphire and silver for an international love story.', 'reception international globe world sapphire silver celebration function'],
    ['Tropical Reception', 'tropical-reception', 'reception', 'free', '#0E2A3A', '#1E5470', '#FBE0B4', '#FFF0D2', '#DFAE4E', 'hibiscus', 82, '2026-12-25', 'Hibiscus strung across teal and gold for a bright, island-style fete.', 'reception tropical hibiscus teal island bright celebration function'],
    ['Winter Evening Reception', 'winter-evening-reception', 'reception', 'free', '#0E1B2E', '#27456B', '#E8F0F8', '#FFFFFF', '#AEC6E8', 'snowflake', 83, '2026-12-25', 'A two-tier snowflake card in ice blue for a cosy winter reception.', 'reception winter snow snowflake ice blue cosy celebration function'],
    ['Luxury Maroon Reception', 'luxury-maroon-reception', 'reception', 'premium', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'rose', 88, '2026-12-26', 'Gilded corners around a maroon rose for a rich, regal celebration.', 'reception maroon gold rose rich regal celebration function'],
    ['Emerald Garden Reception', 'emerald-garden-reception', 'reception', 'free', '#0E2A16', '#22602E', '#E2F4D8', '#FFF4DC', '#96CE7A', 'leaf', 85, '2026-12-26', 'An emerald wreath lit with gold for a lush garden reception under stars.', 'reception emerald garden leaves gold lush celebration function'],
    ['Sapphire Evening Reception', 'sapphire-evening-reception', 'reception', 'free', '#0B1B3A', '#1E3E6E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'sparkle', 86, '2026-12-27', 'Sapphire fields scattered with sparkle for a cool, elegant evening.', 'reception sapphire sparkle silver elegant night celebration function'],
    ['Pearl White Reception', 'pearl-white-reception', 'reception', 'free', '#FCFAF5', '#EFE6D4', '#4A3C26', '#8A6E38', '#C0A878', 'dove', 84, '2026-12-27', 'A pearl-white card with a dove emblem for a gentle, classic celebration.', 'reception pearl white dove soft classic celebration function'],
    ['Lavender Romance Reception', 'lavender-romance-reception', 'reception', 'free', '#2A2050', '#5A3E8A', '#F0E8FC', '#FFFFFF', '#B49AD8', 'blossom', 85, '2026-12-28', 'Symmetrical lavender blossoms for a dreamy, romantic evening card.', 'reception lavender blossoms romance purple dreamy celebration function'],
    ['Terracotta Sunset Reception', 'terracotta-sunset-reception', 'reception', 'free', '#3E2208', '#8A4E10', '#FBE0AE', '#FFF0CE', '#E8AE4E', 'sun', 84, '2026-12-28', 'Sun and waves in terracotta for a warm sunset-hued celebration.', 'reception terracotta sunset sun warm earthy celebration function'],
    ['Heritage Gold Reception', 'heritage-gold-reception', 'reception', 'premium', '#2A1808', '#5C2A0E', '#F3D9A0', '#FBE8C4', '#D9B45E', 'crown', 87, '2026-12-29', 'A crowned gold medallion steeped in heritage for a lasting keepsake card.', 'reception heritage gold crown medallion heirloom celebration function'],
    ['Celestial Reception', 'celestial-reception', 'reception', 'premium', '#0E1330', '#2A2F63', '#F0E0BC', '#FFEDC4', '#D9B45E', 'crescentStar', 86, '2026-12-29', 'A crescent-and-star emblem framed in midnight and gold for a celestial card.', 'reception celestial stars moon midnight gold celebration function'],
    ['Bride & Groom', 'bride-and-groom', 'wedding', 'free', '#FBF7F0', '#EDE3D2', '#3A2C1E', '#6E4E2A', '#A88A50', 'rings-classic', 90, '2026-06-22', 'The classic pairing — two bands inside a laurel, with room for both families above the names.', 'bride groom couple classic traditional him her people'],
    ['Bride & Bride', 'bride-and-bride', 'wedding', 'free', '#FDF2F6', '#F4DAE6', '#4A1E36', '#8A2E58', '#C08A5E', 'twin-blooms', 82, '2026-06-24', 'Two blooms opening from one shared stem — a card written for two brides rather than adapted for them.', 'bride bride lesbian lgbtq same sex two brides queer people'],
    ['Groom & Groom', 'groom-and-groom', 'wedding', 'free', '#12283A', '#1E4A66', '#EFE0C4', '#FBF0DA', '#C9A468', 'twin-bands', 81, '2026-06-26', 'Two bands woven through a square knot in slate and brass — structural rather than floral.', 'groom groom gay lgbtq same sex two grooms queer people'],
    ['The Two Of Us', 'the-two-of-us', 'wedding', 'free', '#F6F6F4', '#E4E6E2', '#26302C', '#3E5248', '#8A9A8E', 'infinity', 84, '2026-06-28', 'One continuous ribbon with no beginning, for a couple marrying on their own terms.', 'couple elopement intimate small partners two of us people'],
    ['Our Son’s Wedding', 'our-sons-wedding', 'wedding', 'free', '#1E3218', '#3A5C28', '#F0E6C4', '#FBF4DE', '#C9B064', 'wheat-crest', 78, '2026-06-30', 'A family shield with a wheat sheaf, worded from the parents rather than the couple.', 'son wedding parents family host blessings people'],
    ['Our Daughter’s Wedding', 'our-daughters-wedding', 'wedding', 'free', '#FBF2F2', '#F0DCDA', '#4A2226', '#8A343A', '#B4845E', 'rose-cartouche', 79, '2026-07-02', 'A rose spray inside an oval cartouche, framed the way a family portrait is.', 'daughter wedding parents family host blessings people'],
    ['My Brother’s Wedding', 'my-brothers-wedding', 'wedding', 'free', '#12303A', '#1E5464', '#EFE2C6', '#2E7A8E', '#C9A868', 'rope-knot', 73, '2026-07-04', 'Two rope loops locked together, for the sibling doing the inviting.', 'brother sibling wedding family invite bhai people'],
    ['My Sister’s Wedding', 'my-sisters-wedding', 'wedding', 'free', '#3A1C42', '#6E3468', '#F6E2F0', '#FFF0FA', '#D9A8CE', 'mirror-fans', 74, '2026-07-06', 'Two mirrored fans opening from one point, in plum and orchid.', 'sister sibling wedding family invite behen didi people'],
    ['A Friend’s Wedding', 'a-friends-wedding', 'wedding', 'free', '#0E1A2E', '#22406E', '#E4EEFC', '#7FB2F0', '#F0C86E', 'confetti-arc', 76, '2026-07-08', 'An arc of confetti thrown across a poster-format card — informal, and meant to be forwarded.', 'friend wedding informal group chat invite squad people'],
    ['A Family Wedding', 'a-family-wedding', 'wedding', 'free', '#F6F4EA', '#E4E0CE', '#2A3220', '#4A5A32', '#96A05E', 'family-tree', 77, '2026-07-10', 'One tree with many branches, for the wedding the whole family hosts between them.', 'family wedding relatives clan together tree joint people'],
    ['Anniversary Laurel', 'anniversary-laurel', 'anniversary', 'free', '#2A2412', '#5E5220', '#F6E6B4', '#FBF2D2', '#DCBB68', 'laurel-years', 80, '2026-07-12', 'An open laurel wreath left deliberately empty at the centre, so the number can sit there.', 'anniversary laurel years jubilee celebration people'],
    ['Vow Renewal', 'vow-renewal', 'anniversary', 'free', '#F7F4FA', '#E6E0EE', '#2E2440', '#4E3E68', '#9A86BE', 'renewal', 75, '2026-07-14', 'The same two rings, tied again with a ribbon — for saying it a second time and meaning it more.', 'vow renewal recommitment anniversary second time people'],
    ['Ruby Anniversary', 'ruby-anniversary', 'anniversary', 'premium', '#3A0A12', '#7A1A24', '#FBE0C4', '#FDF1DC', '#E8A83E', 'heart', 89, '2027-01-16', 'A ruby-red flourish with a heart emblem to mark forty years together.', 'anniversary ruby 40th ruby anniversary forty years love celebration couple milestone'],
    ['Pearl Anniversary', 'pearl-anniversary', 'anniversary', 'free', '#FCFAF5', '#EDE4D4', '#4A3A24', '#8A6E3E', '#C0A878', 'dove', 86, '2027-01-16', 'Scalloped pearl bands with a dove for a soft thirtieth-anniversary card.', 'anniversary pearl 30th pearl anniversary thirty years dove celebration couple milestone'],
    ['Diamond Anniversary', 'diamond-anniversary', 'anniversary', 'premium', '#0E1330', '#2A2F63', '#F0E0BC', '#FFEDC4', '#D9B45E', 'sparkle', 92, '2027-01-17', 'Geometric tiles crowned with gold sparkle for a diamond sixtieth.', 'anniversary diamond 60th diamond anniversary sixty years gold celebration couple milestone'],
    ['Emerald Anniversary', 'emerald-anniversary', 'anniversary', 'premium', '#0E2A1E', '#1E5C3E', '#E8E4BC', '#FBF6DC', '#C9B868', 'leaf', 88, '2027-01-17', 'An emerald wreath of leaves and champagne gold for fifty-five years.', 'anniversary emerald 55th emerald anniversary fifty five years wreath couple milestone'],
    ['Sapphire Anniversary', 'sapphire-anniversary', 'anniversary', 'premium', '#0B1B3A', '#1E3E6E', '#F0E0BC', '#FBEFD0', '#D9B45E', 'rings', 90, '2027-01-18', 'Haloed rings in sapphire and gold celebrating forty-five years.', 'anniversary sapphire 45th sapphire anniversary rings halo forty five couple milestone'],
    ['Rose Anniversary', 'rose-anniversary', 'anniversary', 'free', '#4A1E2E', '#8A3A4E', '#FCE0E4', '#FFF0F2', '#E8A8B4', 'rose', 84, '2027-01-18', 'Symmetrical roses in dusty rose and burgundy for a first-anniversary card.', 'anniversary rose 1st first anniversary roses romantic blooms celebration couple milestone'],
    ['Golden Love', 'golden-love', 'anniversary', 'premium', '#2C2011', '#7A5A1E', '#F8E3AC', '#FCF0CE', '#E0B252', 'mandala', 91, '2027-01-19', 'A full gold mandala to mark fifty years of golden love.', 'anniversary golden 50th fifty years gold mandala jubilee celebration couple milestone'],
    ['Eternal Love', 'eternal-love', 'anniversary', 'free', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#8A6A28', '#C9A85E', 'rings', 85, '2027-01-19', 'Bookended rings in champagne and cream for a love that never ends.', 'anniversary eternal love rings champagne cream forever celebration couple'],
    ['Forever Together', 'forever-together', 'anniversary', 'free', '#0E1B2E', '#1E3A5E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'rings', 87, '2027-01-20', 'Two interlocked rings in navy and silver for a steadfast anniversary.', 'anniversary forever together rings navy silver couple celebration love'],
    ['Years Of Love', 'years-of-love', 'anniversary', 'free', '#F8EFE2', '#EAD6B8', '#4A2E16', '#8A4E1E', '#C08A50', 'rings', 82, '2027-01-20', 'Warm beige bands with rings to celebrate a fifth anniversary.', 'anniversary 5th five years rings warm beige celebration couple love milestone'],
    ['Love Through The Years', 'love-through-the-years', 'anniversary', 'free', '#F8EFE2', '#EAD6B8', '#4A2E16', '#8A4E1E', '#C08A50', 'clock', 84, '2027-01-21', 'A two-tier clock in terracotta and cream marking ten years of love.', 'anniversary 10th ten years clock time terracotta celebration couple love milestone'],
    ['Still In Love', 'still-in-love', 'anniversary', 'free', '#FDF1EE', '#F8DCD6', '#5A2632', '#B04A5E', '#E0A0A8', 'heart', 86, '2027-01-21', 'A rose-gold ribbon and heart for a couple still very much in love.', 'anniversary still in love ribbon heart rose gold romantic couple celebration'],
    ['Our Forever', 'our-forever', 'anniversary', 'free', '#F7F2FC', '#E6DAF2', '#33264A', '#5A3E8A', '#9A86BE', 'rings', 85, '2027-01-22', 'A lavender circle framing rings for fifteen years of togetherness.', 'anniversary 15th fifteen years lavender pearl rings couple celebration love milestone'],
    ['Timeless Love', 'timeless-love', 'anniversary', 'premium', '#2A1F3C', '#5B3A63', '#F2E3CE', '#FBF1E2', '#DCB27E', 'chandelier', 88, '2027-01-22', 'A plum chandelier and rose gold for an anniversary that feels timeless.', 'anniversary timeless chandelier plum rose gold luxury couple celebration love'],
    ['Ever After', 'ever-after', 'anniversary', 'free', '#0E1330', '#2A2F63', '#F0E0BC', '#FFEDC4', '#D9B45E', 'star5', 87, '2027-01-23', 'A field of stars over midnight blue and gold for every year after.', 'anniversary ever after stars midnight gold romantic couple celebration love'],
    ['Together Forever', 'together-forever', 'anniversary', 'free', '#0E1B2E', '#1E3A5E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'bulb', 83, '2027-01-23', 'Warm string lights across navy and silver for a bright, lasting love.', 'anniversary together forever string lights navy silver celebration couple love'],
    ['Endless Romance', 'endless-romance', 'anniversary', 'free', '#FDF1EE', '#F8DCD6', '#5A2632', '#B04A5E', '#E0A0A8', 'heart', 86, '2027-01-24', 'Soft rays bursting from a heart in blush and rose gold.', 'anniversary endless romance heart blush rays romantic couple celebration love'],
    ['Our Love Story', 'our-love-story', 'anniversary', 'free', '#F6F8F0', '#E4E8D4', '#2E3A28', '#5C6E48', '#9AA88A', 'book', 85, '2027-01-24', 'A sage border and open book for a love story still being written.', 'anniversary love story book sage ivory chapters couple celebration romance'],
    ['Memories & Love', 'memories-and-love', 'anniversary', 'free', '#F8EFE2', '#EAD6B8', '#4A2E16', '#8A4E1E', '#C08A50', 'tree', 82, '2027-01-25', 'A growing tree of many branches in terracotta for shared memories.', 'anniversary memories love tree growth terracotta family celebration couple'],
    ['Romantic Anniversary', 'romantic-anniversary', 'anniversary', 'premium', '#FDF1EE', '#F8DCD6', '#5A2632', '#B04A5E', '#E0A0A8', 'heart', 87, '2027-01-25', 'An arched heart emblem in rose gold and blush for a romantic card.', 'anniversary romantic heart arch blush rose gold couple celebration love'],
    ['Luxury Anniversary', 'luxury-anniversary', 'anniversary', 'premium', '#120D0A', '#2E2418', '#F3D9A0', '#FBEDCB', '#DCB264', 'fleurDeLis', 90, '2027-01-26', 'Black and gold gates with the fleur-de-lis for a formal celebration.', 'anniversary luxury black gold fleur de lis premium elegant couple celebration'],
    ['Garden Anniversary', 'garden-anniversary', 'anniversary', 'free', '#F6F8F0', '#E4E8D4', '#2E3A28', '#5C6E48', '#9AA88A', 'blossom', 84, '2027-01-26', 'Scalloped garlands of blossom in sage and ivory for a garden fete.', 'anniversary garden blossom garland sage outdoor celebration couple love'],
    ['Candlelight Anniversary', 'candlelight-anniversary', 'anniversary', 'free', '#3E0A12', '#7A1E2A', '#FBD9A8', '#FDE8C4', '#E8A94E', 'candle', 86, '2027-01-27', 'Rows of candles over burgundy and gold for a warm anniversary dinner.', 'anniversary candlelight candles burgundy warm intimate celebration couple'],
    ['Evening Anniversary', 'evening-anniversary', 'anniversary', 'free', '#0E1B2E', '#1E3A5E', '#E8ECF8', '#FFFFFF', '#9AB0D8', 'crescentMoon', 85, '2027-01-27', 'Classic columns under a crescent moon in navy and silver.', 'anniversary evening moonlight columns navy silver dance couple celebration'],
    ['Dinner Anniversary', 'dinner-anniversary', 'anniversary', 'free', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'coupe', 86, '2027-01-28', 'A maroon candelabra and a raised coupe for an anniversary dinner.', 'anniversary dinner candelabra coupe maroon champagne toast couple celebration'],
    ['Family Anniversary Celebration', 'family-anniversary-celebration', 'anniversary', 'free', '#FBF6EC', '#EFE2C8', '#4A3A1E', '#8A6A28', '#C9A85E', 'heart', 83, '2027-01-28', 'Hearts strung across champagne for a family-wide anniversary party.', 'anniversary family celebration hearts champagne generations couple celebration'],
    ['Classic Anniversary', 'classic-anniversary', 'anniversary', 'premium', '#2C2011', '#7A5A1E', '#F8E3AC', '#FCF0CE', '#E0B252', 'crown', 88, '2027-01-29', 'A crowned gold medallion for a classic twenty-fifth anniversary.', 'anniversary classic 25th twenty five crown medallion gold celebration couple milestone'],
    ['Modern Anniversary', 'modern-anniversary', 'anniversary', 'free', '#161A24', '#2A3040', '#EFE2BE', '#FFF2D8', '#CDA95E', 'rings', 84, '2027-01-29', 'An arch in charcoal and gold with rings for a contemporary look.', 'anniversary modern contemporary arch charcoal gold minimal couple celebration'],
    ['Minimal Anniversary', 'minimal-anniversary', 'anniversary', 'free', '#F0F6FA', '#D8E6F0', '#2A3A4E', '#4E6E8A', '#9AB4CE', 'rings', 81, '2027-01-30', 'Fine powder-blue rules and rings for a pared-back, minimal card.', 'anniversary minimal clean rings powder blue simple couple celebration love'],
    ['Royal Anniversary', 'royal-anniversary', 'anniversary', 'premium', '#2A1440', '#5C2A7A', '#F3D9A0', '#FBEDCB', '#D9B45E', 'crown', 89, '2027-01-30', 'A royal purple toast with a crown for a regal anniversary evening.', 'anniversary royal crown purple gold toast celebration couple luxury'],
    ['Vintage Anniversary', 'vintage-anniversary', 'anniversary', 'free', '#F7F0E4', '#E8D9C2', '#4A3826', '#7A5E3E', '#A88860', 'feather', 82, '2027-01-31', 'A feather medallion in sepia for a vintage, heirloom-style card.', 'anniversary vintage feather sepia classic heirloom couple celebration'],
    ['Heritage Anniversary', 'heritage-anniversary', 'anniversary', 'premium', '#5C0F1F', '#8C1E30', '#FBE6C4', '#FFF3DE', '#E4B45C', 'kalash', 88, '2027-01-31', 'A row of lamps beneath a kalash honouring seventy years of heritage.', 'anniversary heritage 70th seventy years kalash lamps traditional couple milestone'],
    ['Cultural Anniversary', 'cultural-anniversary', 'anniversary', 'free', '#4A1E0A', '#8A3A10', '#FBE0B4', '#FFF0D2', '#E8B45E', 'peacock', 85, '2027-02-01', 'A peacock emblem in saffron and champagne for a culturally rich card.', 'anniversary cultural peacock saffron heritage traditional couple celebration'],
    ['Celebration Of Love', 'celebration-of-love', 'anniversary', 'free', '#F8EFE2', '#EAD6B8', '#4A2E16', '#8A4E1E', '#C08A50', 'heart', 86, '2027-02-01', 'Warm geometric tiles around a heart for a joyful celebration of love.', 'anniversary celebration love heart warm beige geometric couple party'],
    ['Royal Durbar', 'royal-durbar', 'wedding', 'free', '#2A0F3E', '#54206E', '#F6DCA8', '#FBEDCE', '#DFB055', 'damask-crown', 89, '2026-07-16', 'A crown over a damask cartouche, repeated into a full border in imperial purple and old gold.', 'royal regal crown damask imperial palace grand luxury style'],
    ['Luxe Noir', 'luxe-noir', 'wedding', 'free', '#0B0B0D', '#22222A', '#EFE2C0', '#FBF2DC', '#C9A85E', 'luxe-rays', 91, '2026-07-18', 'A fine sunburst on near-black with a single gold bar — the most expensive-looking card in the set.', 'luxury luxe black gold noir premium formal black tie style'],
    ['Velvet Rouge', 'velvet-rouge', 'wedding', 'free', '#3E0A16', '#701426', '#F6D8C4', '#FBEADE', '#D9A070', 'velvet-damask', 86, '2026-07-20', 'Baroque damask repeated edge to edge in oxblood, with the names on a clear velvet plaque.', 'velvet damask baroque oxblood rich deep red opulent style'],
    ['Gilded Branch', 'gilded-branch', 'wedding', 'free', '#141410', '#33301E', '#F2E4BE', '#FBF2D8', '#D9B45E', 'gilded-leaf', 87, '2026-07-22', 'A single gilded branch running up the right edge, with the names set flush left against it.', 'gold gilded leaf branch foil metallic editorial luxe style'],
    ['Editorial Ivory', 'editorial-ivory', 'wedding', 'free', '#FBFAF6', '#EAE8E0', '#1E1E1C', '#3A3A34', '#8A8878', 'rule-stack', 88, '2026-07-24', 'Rules of shifting weight and a hard left margin — a fashion masthead rather than an invitation.', 'editorial magazine masthead ivory typographic modern clean style'],
    ['Quiet Minimal', 'quiet-minimal', 'wedding', 'free', '#FAFAF8', '#EDEDEA', '#2A2A28', '#4A4A46', '#9A9A92', 'hairline', 85, '2026-07-26', 'One line, one dot, and a great deal of paper left alone.', 'minimal minimalist simple clean white space quiet plain style'],
    ['Contemporary Arch', 'contemporary-arch', 'wedding', 'free', '#F6EFE8', '#E6D8CC', '#3A2A24', '#B4644A', '#C98A6E', 'soft-arch', 84, '2026-07-28', 'Nested arches in terracotta and clay — the shape every contemporary venue is building right now.', 'contemporary modern arch terracotta clay minimal warm style'],
    ['Romance In Blush', 'romance-in-blush', 'wedding', 'free', '#FDF3F3', '#F6DCDC', '#5A2A32', '#9A3E4E', '#C08A72', 'rose-spray', 87, '2026-07-30', 'Open roses falling from two corners across blush paper, in the softest palette in the collection.', 'romantic romance blush rose soft pink love pretty style'],
    ['Peony Bloom', 'peony-bloom-card', 'wedding', 'free', '#FBF4F8', '#F2DCE8', '#4A2038', '#8E2E5A', '#B4844E', 'peony-bloom', 86, '2026-08-01', 'One peony drawn fully open, four rings of petals deep, centred like a medallion.', 'floral peony flower bloom garden botanical feminine style'],
    ['Botanical Press', 'botanical-press', 'wedding', 'free', '#F4F6EE', '#DFE6D6', '#26321E', '#3E5230', '#7A9060', 'fern-press', 83, '2026-08-03', 'Two pressed fern fronds running down each side, laid out like a herbarium sheet.', 'botanical fern pressed herbarium green natural foliage style'],
    ['Vintage Letterpress', 'vintage-letterpress', 'wedding', 'free', '#F6F0E2', '#E4DAC2', '#33291A', '#5A4626', '#967A44', 'letterpress', 82, '2026-08-05', 'A Victorian printer’s ornament inside a double rule, set the way a letterpress shop would have.', 'vintage letterpress victorian antique retro classic print style'],
    ['Deco Gatsby', 'deco-gatsby', 'wedding', 'free', '#0E1418', '#1E3038', '#EFD9A4', '#FBEECA', '#D9B45E', 'deco-fan', 88, '2026-08-07', 'A stepped deco fan over chevron banding, in the emerald and gold of a 1920s ballroom.', 'art deco gatsby 1920s geometric chevron jazz age style'],
    ['Palace Colonnade', 'palace-colonnade', 'wedding', 'free', '#F6E8D2', '#E8CFA8', '#4A2A14', '#7A421A', '#A87A32', 'palace-dome', 85, '2026-08-08', 'A ribbed dome above a colonnade, in the sandstone and gold of a heritage palace venue.', 'palace heritage dome colonnade grand venue fort majestic style'],
    ['Garden Party', 'garden-party', 'wedding', 'free', '#EEF4EA', '#D6E4CE', '#254028', '#3E6E3E', '#8AA870', 'garden-gate', 84, '2026-08-09', 'A wrought-iron gate with roses climbing it, for a wedding held on the lawn.', 'garden outdoor lawn roses gate green party daytime style'],
    ['Coastal Vows', 'coastal-vows', 'wedding', 'free', '#EAF4F8', '#CDE4EE', '#123A4A', '#1E6076', '#5AA0B8', 'wave-shell', 86, '2026-08-10', 'A scallop shell above two lines of surf, in sea glass and driftwood tones.', 'beach coastal sea ocean shell shore seaside destination style'],
    ['Mountain Vows', 'mountain-vows', 'wedding', 'free', '#14262E', '#26454E', '#E4EDE8', '#F6FBF8', '#8AB0A4', 'pine-ridge', 82, '2026-08-11', 'A ridge line with pines and a low sun behind it, in slate and pine green.', 'mountain hills pine ridge alpine outdoor adventure style'],
    ['Destination Voyage', 'destination-voyage', 'wedding', 'free', '#0E2A3A', '#1A4A62', '#F2E2C2', '#FBF0D8', '#D9B06E', 'compass', 87, '2026-08-12', 'A compass rose over a dotted route, for the wedding everyone has to fly to.', 'destination travel abroad compass voyage passport resort style'],
    ['Gen Z Bold', 'gen-z-bold', 'wedding', 'free', '#0E0F1A', '#241E4E', '#F2ECFF', '#B4F04E', '#F472B6', 'blob-stack', 84, '2026-06-21', 'Soft blobs and a four-point star under poster type — loud, lowercase and completely unbothered.', 'gen z bold fun playful lowercase neon poster young modern'],
    ['Digital Wedding', 'digital-wedding', 'wedding', 'free', '#0A1220', '#12324E', '#DCEEFC', '#4EC9F0', '#8AA8C4', 'screen-frame', 80, '2026-06-23', 'A screen with a play mark and a signal arc, for the ceremony half the guest list will watch on a laptop.', 'digital virtual online zoom livestream remote hybrid modern'],
    ['Story Card', 'story-card', 'wedding', 'free', '#FDF2F6', '#F6DCE8', '#33203A', '#E0468A', '#B47ACE', 'story-ring', 82, '2026-06-25', 'A story ring with a heart inside it, built to be screenshot and reposted rather than printed.', 'social media instagram story reels share screenshot modern'],
    ['Modern Romance', 'modern-romance', 'wedding', 'free', '#FBF6F4', '#EEDCD8', '#2E2226', '#A8485A', '#C98A94', 'soft-heart', 86, '2026-06-27', 'A single unbroken line drawing a heart, with nothing else on the card to compete with it.', 'modern romance heart line art simple contemporary love modern'],
    ['Type Only', 'type-only', 'wedding', 'free', '#F4F4F2', '#E2E2DE', '#141414', '#33332E', '#8A8A82', 'type-bar', 83, '2026-06-29', 'Three bars set like a masthead under enormous type — the whole design is the typography.', 'typography type only text minimal swiss grotesk bold modern'],
    ['Monogram Seal', 'monogram-seal', 'wedding', 'free', '#F7F5F0', '#E8E4DA', '#2A2620', '#5A5044', '#A2957E', 'mono-ring', 85, '2026-07-01', 'A double ring broken for the initials, sized like a wax seal at the top of an otherwise empty card.', 'monogram initials seal crest letters simple elegant modern'],
    ['Editorial Grid', 'editorial-grid', 'wedding', 'free', '#F2F3F1', '#DEE0DC', '#16181A', '#2E3236', '#7A8288', 'grid-marks', 84, '2026-07-03', 'Crop marks and a visible baseline grid, left exactly as the designer set it.', 'editorial grid contemporary swiss layout crop marks modern']
  ];

  /* The tier column still sits in TEMPLATE_ROWS[3] so the rows keep their
     shape, but nothing reads it any more: every design is free to download
     and carries the full feature set. Payment applies to publishing a
     shareable link, not to the artwork. */
  var FEATURES_ALL = [
    'Live countdown timer', 'Google Maps directions', 'Mobile & desktop ready',
    'One-tap WhatsApp share', 'Photo gallery', 'Background music',
    'RSVP collection', 'QR code for print', 'Custom fonts & colours'
  ];

  var CATEGORY_INDEX = {};
  CATEGORIES.forEach(function (cat) { CATEGORY_INDEX[cat.slug] = cat; });

  var TEMPLATES = TEMPLATE_ROWS.map(function (r) {
    var cat = CATEGORY_INDEX[r[2]];
    return {
      id: r[1],
      name: r[0],
      slug: r[1],
      category: r[2],
      categoryLabel: cat ? cat.label : r[2],
      tier: r[3],
      colors: { bg1: r[4], bg2: r[5], ink: r[6], primary: r[7], secondary: r[8] },
      motif: r[9],
      popularity: r[10],
      added: r[11],
      blurb: r[12],
      image: 'images/templates/' + r[1] + '.svg',
      // Every design ships with every feature — nothing is held back per card.
      features: FEATURES_ALL,
      keywords: [r[0], cat ? cat.label : '', r[9], r[13] || ''].join(' ').toLowerCase()
    };
  });

  // Count per category, derived rather than hard-coded so it can never drift.
  CATEGORIES.forEach(function (cat) {
    cat.count = TEMPLATES.filter(function (t) { return t.category === cat.slug; }).length;
  });

  /* ------------------------------------------------------------------
     3. Data access layer (the future backend seam)
     ------------------------------------------------------------------ */

  IH.data = {
    categories: CATEGORIES,
    templates: TEMPLATES,

    fetchCategories: function () { return Promise.resolve(CATEGORIES.slice()); },
    fetchTemplates: function () { return Promise.resolve(TEMPLATES.slice()); },
    fetchTemplate: function (slug) {
      return Promise.resolve(TEMPLATES.filter(function (t) { return t.slug === slug; })[0] || null);
    },

    getCategory: function (slug) { return CATEGORY_INDEX[slug] || null; },
    getTemplate: function (slug) {
      for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].slug === slug) return TEMPLATES[i];
      return null;
    },
    stats: function () {
      return {
        templates: TEMPLATES.length,
        categories: CATEGORIES.length,
        free: TEMPLATES.length,
        premium: 0
      };
    }
  };

  /* ------------------------------------------------------------------
     4. Favourites (localStorage-backed)
     ------------------------------------------------------------------ */

  IH.favorites = {
    KEY: 'favorites',
    all: function () {
      var list = IH.store.get(this.KEY, []);
      return Array.isArray(list) ? list : [];
    },
    has: function (slug) { return this.all().indexOf(slug) !== -1; },
    toggle: function (slug) {
      var list = this.all();
      var idx = list.indexOf(slug);
      if (idx === -1) list.push(slug); else list.splice(idx, 1);
      IH.store.set(this.KEY, list);
      this.sync();
      document.dispatchEvent(new CustomEvent('ih:favchange', { detail: { slug: slug, active: idx === -1, count: list.length } }));
      return idx === -1;
    },
    count: function () { return this.all().length; },
    /* Keep every rendered heart button in sync with storage. */
    sync: function () {
      var list = this.all();
      qsa('[data-fav]').forEach(function (btn) {
        var active = list.indexOf(btn.getAttribute('data-fav')) !== -1;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.setAttribute('aria-label', (active ? 'Remove ' : 'Save ') + (btn.getAttribute('data-fav-name') || 'template') + (active ? ' from favourites' : ' to favourites'));
      });
      qsa('[data-fav-count]').forEach(function (n) {
        n.textContent = list.length;
        n.hidden = list.length === 0;
      });
    }
  };

  /* ------------------------------------------------------------------
     5. Card renderers
     ------------------------------------------------------------------ */

  /* No tier badge. Every design carried the same "Free" label, which told a
     visitor nothing except that the word was there — a distinction only
     reads as one when something else is different. Payment applies to
     publishing a link, not to the artwork, and the pricing page says so. */
  function templateCardHTML(t, eager) {
    return '' +
      '<article class="template-card" data-template="' + escapeHtml(t.slug) + '" data-reveal="zoom">' +
        '<div class="template-card__media">' +
          '<img src="' + escapeHtml(t.image) + '" width="600" height="800" ' +
               (eager ? 'data-eager fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" ' +
               'alt="' + escapeHtml(t.name + ' — ' + t.categoryLabel + ' invitation template') + '">' +
          '<button class="fav-btn" type="button" data-fav="' + escapeHtml(t.slug) + '" ' +
                  'data-fav-name="' + escapeHtml(t.name) + '" aria-pressed="false" ' +
                  'aria-label="Save ' + escapeHtml(t.name) + ' to favourites">' + IH.icon('heart', 19) + '</button>' +
          '<div class="template-card__overlay">' +
            '<a class="btn btn--glass btn--sm" href="preview.html?template=' + encodeURIComponent(t.slug) + '" ' +
               'data-preview="' + escapeHtml(t.slug) + '">' + IH.icon('eye', 17) + '<span>Preview</span></a>' +
            '<a class="btn btn--primary btn--sm" href="create.html?template=' + encodeURIComponent(t.slug) + '">' +
               IH.icon('wand', 17) + '<span>Use This Template</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="template-card__body">' +
          '<div>' +
            '<h3>' + escapeHtml(t.name) + '</h3>' +
            '<p class="template-card__cat">' + escapeHtml(t.categoryLabel) + '</p>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function categoryCardHTML(cat) {
    return '' +
      '<article class="category-card" data-reveal="zoom">' +
        '<div class="category-card__media">' +
          '<img src="' + escapeHtml(cat.image) + '" width="640" height="440" loading="lazy" decoding="async" ' +
               'alt="' + escapeHtml(cat.label) + ' invitation designs">' +
          '<span class="category-card__count">' + cat.count + ' template' + (cat.count === 1 ? '' : 's') + '</span>' +
        '</div>' +
        '<div class="category-card__body">' +
          '<h3>' + escapeHtml(cat.label) + '</h3>' +
          '<p>' + escapeHtml(cat.description) + '</p>' +
          '<a class="btn btn--secondary btn--sm" href="templates.html?category=' + encodeURIComponent(cat.slug) + '">' +
            '<span>Browse ' + escapeHtml(cat.label) + '</span>' + IH.icon('arrow-right', 17) +
          '</a>' +
        '</div>' +
      '</article>';
  }

  IH.render = { templateCardHTML: templateCardHTML, categoryCardHTML: categoryCardHTML };

  /* ------------------------------------------------------------------
     6. Gallery controller
     ------------------------------------------------------------------ */

  function initGallery() {
    var grid = qs('[data-template-grid]');
    if (!grid) return;

    var searchInput = qs('[data-tpl-search]');
    var searchWrap = searchInput ? searchInput.closest('.search-field') : null;
    var clearBtn = qs('[data-tpl-search-clear]');
    var categorySelect = qs('[data-tpl-category]');
    var sortSelect = qs('[data-tpl-sort]');
    var chipBar = qs('[data-tpl-chips]');
    var countOut = qs('[data-tpl-count]');
    var resetBtn = qs('[data-tpl-reset]');
    var moreBtn = qs('[data-tpl-more]');
    var favOnlyBtn = qs('[data-tpl-fav-only]');

    var PAGE = parseInt(grid.getAttribute('data-page-size'), 10) || 12;
    var state = { q: '', category: 'all', sort: 'popular', favOnly: false, shown: PAGE };
    var all = [];

    /* --- URL <-> state (so filtered views are linkable & bookmarkable) --- */

    function readUrl() {
      var p = new URLSearchParams(location.search);
      if (p.get('category')) state.category = p.get('category');
      if (p.get('q')) state.q = p.get('q');
      if (p.get('sort')) state.sort = p.get('sort');
      if (p.get('favorites') === '1') state.favOnly = true;
    }

    function writeUrl() {
      var p = new URLSearchParams();
      if (state.q) p.set('q', state.q);
      if (state.category !== 'all') p.set('category', state.category);
      if (state.sort !== 'popular') p.set('sort', state.sort);
      if (state.favOnly) p.set('favorites', '1');
      var qsStr = p.toString();
      try {
        history.replaceState(null, '', location.pathname + (qsStr ? '?' + qsStr : ''));
      } catch (err) {
        // Some browsers refuse replaceState on file:// — filtering still works,
        // the view just is not linkable.
      }
    }

    /* --- filtering --- */

    function apply() {
      var term = state.q.trim().toLowerCase();
      var favs = IH.favorites.all();

      var list = all.filter(function (t) {
        if (state.category !== 'all' && t.category !== state.category) return false;
        if (state.favOnly && favs.indexOf(t.slug) === -1) return false;
        if (!term) return true;
        return t.keywords.indexOf(term) !== -1 || t.blurb.toLowerCase().indexOf(term) !== -1;
      });

      list.sort(function (a, b) {
        switch (state.sort) {
          case 'newest': return a.added < b.added ? 1 : a.added > b.added ? -1 : 0;
          case 'name': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          default: return b.popularity - a.popularity;
        }
      });

      return list;
    }

    function paint() {
      var list = apply();
      var visible = list.slice(0, state.shown);

      if (!list.length) {
        grid.innerHTML =
          '<div class="empty-state">' +
            IH.icon('search', 56) +
            '<h3>No templates match those filters</h3>' +
            '<p>Try a different keyword, or clear the filters to see all ' + all.length + ' designs.</p>' +
            '<button class="btn btn--primary" type="button" data-tpl-reset-inline>' +
              IH.icon('rotate-ccw', 18) + '<span>Clear all filters</span>' +
            '</button>' +
          '</div>';
      } else {
        grid.innerHTML = visible.map(function (t, i) { return templateCardHTML(t, i < 4); }).join('');
      }

      if (countOut) {
        countOut.innerHTML = list.length
          ? 'Showing <strong>' + visible.length + '</strong> of <strong>' + list.length + '</strong> template' + (list.length === 1 ? '' : 's')
          : 'No results';
      }

      if (moreBtn) {
        var remaining = list.length - visible.length;
        moreBtn.hidden = remaining <= 0;
        var label = qs('span', moreBtn);
        if (label) label.textContent = 'Load ' + Math.min(remaining, PAGE) + ' more';
      }

      IH.favorites.sync();
      IH.observeReveal(qsa('.template-card', grid));
      document.dispatchEvent(new CustomEvent('ih:galleryrender', { detail: { total: list.length, shown: visible.length } }));
    }

    function update(resetPage) {
      if (resetPage !== false) state.shown = PAGE;
      writeUrl();
      syncControls();
      paint();
    }

    function syncControls() {
      if (searchInput && searchInput.value !== state.q) searchInput.value = state.q;
      if (searchWrap) searchWrap.classList.toggle('has-value', !!state.q);
      if (categorySelect) categorySelect.value = state.category;
      if (sortSelect) sortSelect.value = state.sort;
      if (favOnlyBtn) {
        favOnlyBtn.setAttribute('aria-pressed', state.favOnly ? 'true' : 'false');
        favOnlyBtn.classList.toggle('is-active', state.favOnly);
      }
      qsa('[data-chip-category]', chipBar).forEach(function (chip) {
        var active = chip.getAttribute('data-chip-category') === state.category;
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
        chip.classList.toggle('is-active', active);
      });
    }

    /* --- build controls --- */

    function buildControls() {
      if (categorySelect) {
        categorySelect.innerHTML = '<option value="all">All categories</option>' +
          CATEGORIES.map(function (c) {
            return '<option value="' + escapeHtml(c.slug) + '">' + escapeHtml(c.label) + ' (' + c.count + ')</option>';
          }).join('');
      }

      if (chipBar) {
        /* Every category gets a chip so nothing is hidden on small screens.
           Order by count (most used first), but never slice — the bar wraps
           naturally, so this scales to 20, 50 or more categories. */
        var cats = CATEGORIES.slice().sort(function (a, b) { return b.count - a.count; });
        chipBar.innerHTML =
          '<button class="chip" type="button" data-chip-category="all" aria-pressed="true">' +
            IH.icon('layers', 15) + '<span>All</span><span class="chip__count">' + all.length + '</span>' +
          '</button>' +
          cats.map(function (c) {
            return '<button class="chip" type="button" data-chip-category="' + escapeHtml(c.slug) + '" aria-pressed="false">' +
              IH.icon(c.icon, 15) + '<span>' + escapeHtml(c.label) + '</span>' +
              '<span class="chip__count">' + c.count + '</span></button>';
          }).join('');
      }
    }

    /* --- events --- */

    on(searchInput, 'input', dom.debounce(function () {
      state.q = searchInput.value;
      update();
    }, 200));

    on(searchInput, 'keydown', function (evt) {
      if (evt.key === 'Escape' && state.q) { state.q = ''; update(); searchInput.focus(); }
    });

    on(clearBtn, 'click', function () { state.q = ''; update(); if (searchInput) searchInput.focus(); });
    on(categorySelect, 'change', function () { state.category = categorySelect.value; update(); });
    on(sortSelect, 'change', function () { state.sort = sortSelect.value; update(); });

    on(favOnlyBtn, 'click', function () {
      state.favOnly = !state.favOnly;
      if (state.favOnly && !IH.favorites.count()) {
        state.favOnly = false;
        IH.toast.info('Tap the heart on any template to save it here first.', { title: 'No favourites yet' });
        return;
      }
      update();
    });

    on(chipBar, 'click', function (evt) {
      var chip = evt.target.closest('[data-chip-category]');
      if (!chip) return;
      state.category = chip.getAttribute('data-chip-category');
      update();
    });

    on(moreBtn, 'click', function () {
      state.shown += PAGE;
      update(false);
      // Move focus to the first newly added card for keyboard users.
      var cards = qsa('.template-card', grid);
      var next = cards[state.shown - PAGE];
      if (next) { next.setAttribute('tabindex', '-1'); next.focus({ preventScroll: true }); }
    });

    function resetAll() {
      state.q = ''; state.category = 'all'; state.sort = 'popular'; state.favOnly = false;
      update();
    }
    on(resetBtn, 'click', resetAll);
    on(grid, 'click', function (evt) {
      if (evt.target.closest('[data-tpl-reset-inline]')) resetAll();
    });

    document.addEventListener('ih:favchange', function () {
      if (state.favOnly) paint();
    });

    /* --- go --- */

    readUrl();
    IH.data.fetchTemplates().then(function (list) {
      all = list;
      buildControls();
      update();
    });
  }

  /* ------------------------------------------------------------------
     7. Static mounts used across pages
     ------------------------------------------------------------------ */

  function mountCategoryGrids() {
    qsa('[data-category-grid]').forEach(function (host) {
      var limit = parseInt(host.getAttribute('data-limit'), 10) || CATEGORIES.length;
      var list = CATEGORIES.slice();
      if (host.getAttribute('data-sort') === 'count') list.sort(function (a, b) { return b.count - a.count; });
      host.innerHTML = list.slice(0, limit).map(categoryCardHTML).join('');
      IH.observeReveal(qsa('.category-card', host));
    });
  }

  /* Balanced, duplicate-free selection for "across all categories" strips.
     The count is shared out across categories in proportion to how many
     templates each holds (largest-remainder, so the total is exact), then
     the most-used designs from each category are taken. A slug seen once is
     never emitted twice, even if a template is ever listed in two category
     queries. */
  function selectBalancedTemplates(list, n) {
    var byCat = {};
    var seen = {};
    list.forEach(function (t) {
      if (seen[t.slug]) return;
      seen[t.slug] = true;
      (byCat[t.category] = byCat[t.category] || []).push(t);
    });

    var cats = Object.keys(byCat);
    var total = 0;
    cats.forEach(function (c) { total += byCat[c].length; });
    if (!total) return [];

    var quotas = {};
    var base = 0;
    var remainders = [];
    cats.forEach(function (c) {
      var exact = n * byCat[c].length / total;
      quotas[c] = Math.floor(exact);
      base += quotas[c];
      remainders.push({ c: c, r: exact - Math.floor(exact) });
    });
    remainders.sort(function (a, b) { return b.r - a.r; });
    for (var i = 0; i < n - base && i < remainders.length; i++) quotas[remainders[i].c] += 1;

    var pick = [];
    cats.forEach(function (c) {
      var q = quotas[c] || 0;
      if (!q) return;
      var sorted = byCat[c].slice().sort(function (a, b) { return b.popularity - a.popularity; });
      pick = pick.concat(sorted.slice(0, q));
    });
    pick.sort(function (a, b) { return b.popularity - a.popularity; });
    return pick;
  }

  function mountFeaturedTemplates() {
    qsa('[data-featured-templates]').forEach(function (host) {
      var limit = parseInt(host.getAttribute('data-limit'), 10) || 8;
      var filterCat = host.getAttribute('data-category');
      var list = TEMPLATES.slice();
      if (filterCat) list = list.filter(function (t) { return t.category === filterCat; });
      if (host.hasAttribute('data-balanced')) {
        list = selectBalancedTemplates(list, limit);
      } else {
        list.sort(function (a, b) { return b.popularity - a.popularity; });
        list = list.slice(0, limit);
      }
      host.innerHTML = list.map(function (t, i) { return templateCardHTML(t, i < 2); }).join('');
      IH.favorites.sync();
      IH.observeReveal(qsa('.template-card', host));
    });
  }

  function mountStats() {
    var s = IH.data.stats();
    qsa('[data-stat]').forEach(function (n) {
      var key = n.getAttribute('data-stat');
      if (s[key] !== undefined) n.textContent = s[key] + (n.hasAttribute('data-stat-plus') ? '+' : '');
    });
  }

  /* Favourite buttons work anywhere on the site via delegation. */
  function initFavoriteDelegation() {
    document.addEventListener('click', function (evt) {
      var btn = evt.target.closest && evt.target.closest('[data-fav]');
      if (!btn) return;
      evt.preventDefault();
      var slug = btn.getAttribute('data-fav');
      var added = IH.favorites.toggle(slug);
      var tpl = IH.data.getTemplate(slug);
      var name = tpl ? tpl.name : 'Template';
      if (added) IH.toast.success(name + ' saved to your favourites.', { title: 'Added' });
      else IH.toast.info(name + ' removed from your favourites.');
    });
  }

  /* ------------------------------------------------------------------
     8. Boot
     ------------------------------------------------------------------ */

  function boot() {
    initFavoriteDelegation();
    mountCategoryGrids();
    mountFeaturedTemplates();
    mountStats();
    initGallery();
    IH.favorites.sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
