/* ==========================================================================
   wedding-designs.js — one distinct card design per wedding template.

   Every wedding template (except the bespoke regional ones, Telugu Pelli and
   Tamil Thirumanam) gets a design spec built from its own name and theme:
   layout, frame, date style, section headings, font pairing, how the names
   are set, venue and ceremony layouts. Specs are assigned in catalogue
   order and no two templates share the same combination. Each card also
   carries the template's own palette and its own motif
   (images/wedding-motifs/<slug>.svg, see scripts/build-wedding-motifs.js).

   Text colours follow the background: titles, body text and lines are
   chosen for contrast against the card's own (or the host's custom) colours.
   ========================================================================== */
(function () {
  'use strict';

  var IH = window.IH = window.IH || {};
  var SKIP = { 'telugu-pelli': 1, 'tamil-thirumanam': 1 };

  var LAYOUTS = ['royal', 'classic', 'arch', 'editorial', 'botanical', 'monogram'];
  var FRAMES = ['vine', 'double', 'beads', 'deco', 'kolam', 'arch', 'hairline', 'band'];
  var DATES = ['pill', 'medallion', 'stack', 'ribbon', 'line'];
  var HEADINGS = ['rules', 'diamond', 'caps', 'flourish'];
  var NAMES = ['row', 'stack'];
  var VENUES = ['split', 'stack', 'framed'];
  var EVENTS = ['cards', 'timeline', 'columns'];

  /* Display / body / script font pairings (all loaded from Google Fonts). */
  var FONTS = [
    { display: "'Great Vibes', cursive", body: "'Cormorant Garamond', Georgia, serif", caps: "'Cormorant Garamond', Georgia, serif", script: true },
    { display: "'Cinzel', Georgia, serif", body: "'Cormorant Garamond', Georgia, serif", caps: "'Cinzel', Georgia, serif" },
    { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif", caps: "'DM Sans', system-ui, sans-serif" },
    { display: "'Parisienne', cursive", body: "'Marcellus', Georgia, serif", caps: "'Marcellus', Georgia, serif", script: true },
    { display: "'Bodoni Moda', Georgia, serif", body: "'Josefin Sans', system-ui, sans-serif", caps: "'Josefin Sans', system-ui, sans-serif" },
    { display: "'Allura', cursive", body: "'Libre Baskerville', Georgia, serif", caps: "'Libre Baskerville', Georgia, serif", script: true },
    { display: "'Marcellus', Georgia, serif", body: "'Cormorant Garamond', Georgia, serif", caps: "'Marcellus', Georgia, serif" },
    { display: "'Libre Baskerville', Georgia, serif", body: "'Josefin Sans', system-ui, sans-serif", caps: "'Josefin Sans', system-ui, sans-serif", italic: true },
    /* Playful pairings for the kids' birthday cards. */
    { display: "'Fredoka', system-ui, sans-serif", body: "'Nunito', system-ui, sans-serif", caps: "'Fredoka', system-ui, sans-serif" },
    { display: "'Pacifico', cursive", body: "'Nunito', system-ui, sans-serif", caps: "'Nunito', system-ui, sans-serif" }
  ];

  /* Theme families decide which options suit a template. */
  var FAMILIES = [
    { name: 'modern', re: /minimal|modern|editorial|quiet|contemporary|letterpress|gen z|digital|story card|type only|monogram|grid|civil|two of us|vogue/,
      layouts: ['editorial', 'monogram', 'classic'], frames: ['hairline', 'double', 'band', 'deco'], fonts: [4, 7, 2, 6], heads: ['caps', 'rules', 'diamond'] },
    { name: 'royal', re: /palace|royal|regal|imperial|maharaja|durbar|noir|velvet|gatsby|deco|champagne|midnight|black tie|jewel|banarasi|awadhi|udaipur|jaipur|shehnai|golden|luxe|gilded|colonnade|court|cinematic|pearl|luxury/,
      layouts: ['royal', 'arch', 'monogram', 'classic'], frames: ['vine', 'double', 'deco', 'band', 'arch'], fonts: [0, 1, 3, 6, 4], heads: ['rules', 'diamond', 'flourish'] },
    { name: 'botanical', re: /floral|garden|blossom|peony|rose|wildflower|watercolor|pastel|botanical|blush|moonlit|lotus|sampaguita|hibiscus|chinar|bloom/,
      layouts: ['botanical', 'classic', 'arch', 'royal'], frames: ['vine', 'beads', 'arch', 'hairline'], fonts: [0, 3, 5, 2], heads: ['flourish', 'rules', 'caps'] },
    { name: 'destination', re: /coastal|mountain|voyage|beach|goa|tropical|desert|lake|european|konkan|escape|sunset/,
      layouts: ['botanical', 'editorial', 'arch', 'classic'], frames: ['hairline', 'beads', 'double', 'arch'], fonts: [3, 2, 7, 5], heads: ['caps', 'flourish', 'rules'] },
    { name: 'personal', re: /bride|groom|son|daughter|brother|sister|friend|family|love story/,
      layouts: ['classic', 'botanical', 'monogram', 'royal', 'editorial'], frames: ['double', 'vine', 'beads', 'hairline'], fonts: [0, 5, 2, 3], heads: ['flourish', 'rules', 'caps'] },
    { name: 'heritage', re: /./,
      layouts: ['classic', 'arch', 'royal', 'botanical'], frames: ['kolam', 'band', 'double', 'beads', 'arch', 'vine'], fonts: [1, 0, 6, 5, 3], heads: ['diamond', 'rules', 'flourish'] }
  ];

  /* Templates that follow the user's reference card (royal frame, vine
     corners, three-cell date pill, ruled headings, venue beside details,
     ceremony cards). Each keeps its own palette and motif and gets a
     different font pairing (value = FONTS index), so none is a copy. */
  var REFERENCE_STYLE = { 'velvet-rouge': 0, 'regal-maroon': 1, 'royal-wedding': 3, 'maharaja-palace': 6, 'imperial-gold': 4 };

  /* Engagement templates moved onto the engine, one at a time (user request,
     starting with Blush Engagement). Each gives its full spec; venueDefault is
     its own FLUX.2 Klein 4B venue photo (scripts/generate-engagement-assets.js). */
  var ENGAGEMENT_DESIGNS = {
    'blush-engagement': { family: 'botanical', layout: 'engagement', frame: 'arch', date: 'stack', heading: 'rules', font: 0, names: 'row', venue: 'split', events: 'cards',
      lineArt: 'rose', decor: 'images/engagement/blush-engagement/', decorStyle: 'corners', venueDefault: 'images/engagement/blush-engagement/venue.jpg' }
  };
  /* Floral decoration per card (same map as scripts/engagement-briefs.js STYLES):
     corners | diagonal | garland | wreath | vines | luxury (gold filigree + gold-accent florals). */
  var ENGAGEMENT_DECOR = {};
  [['corners', 'rose-gold-engagement floral-engagement romantic-engagement'],
   ['diagonal', 'ring-of-promise sunset-engagement starry-engagement moonlight-engagement celestial-engagement cocktail-engagement engagement-dinner'],
   ['garland', 'roka-ceremony tilak-ceremony traditional-engagement cultural-engagement heritage-engagement family-engagement intimate-engagement'],
   ['wreath', 'ring-ceremony elegant-ring-ceremony pearl-engagement vintage-engagement botanical-engagement intercultural-engagement international-engagement'],
   ['vines', 'modern-engagement minimal-engagement contemporary-engagement garden-engagement beach-engagement destination-engagement'],
   ['luxury', 'classic-engagement royal-ring-ceremony golden-engagement sapphire-engagement emerald-engagement luxury-engagement palace-engagement grand-engagement-celebration candlelight-engagement']
  ].forEach(function (g) { g[1].split(' ').forEach(function (slug) { ENGAGEMENT_DECOR[slug] = g[0]; }); });
  /* The other engagement cards: [slug, font (FONTS index), frame, date, heading, title (script|caps), main event]
     All share the engagement layout and length; each has its own FLUX art in images/engagement/<slug>/. */
  [
    ['modern-engagement', 4, 'hairline', 'stack', 'caps'], ['classic-engagement', 1, 'double', 'medallion', 'rules'],
    ['ring-of-promise', 3, 'deco', 'stack', 'diamond'], ['ring-ceremony', 5, 'hairline', 'medallion', 'flourish'],
    ['roka-ceremony', 0, 'band', 'stack', 'rules', 'Roka|Ceremony', 'Roka Ceremony'], ['tilak-ceremony', 6, 'kolam', 'medallion', 'diamond', 'Tilak|Ceremony', 'Tilak Ceremony'],
    ['royal-ring-ceremony', 1, 'band', 'stack', 'rules'], ['elegant-ring-ceremony', 3, 'arch', 'medallion', 'flourish'],
    ['golden-engagement', 6, 'deco', 'stack', 'diamond'], ['rose-gold-engagement', 0, 'arch', 'medallion', 'flourish'],
    ['emerald-engagement', 1, 'double', 'stack', 'rules'], ['sapphire-engagement', 4, 'deco', 'medallion', 'caps'],
    ['pearl-engagement', 5, 'beads', 'stack', 'rules'], ['floral-engagement', 3, 'double', 'medallion', 'flourish'],
    ['garden-engagement', 0, 'beads', 'stack', 'flourish'], ['luxury-engagement', 6, 'band', 'medallion', 'diamond'],
    ['minimal-engagement', 4, 'hairline', 'stack', 'caps'], ['contemporary-engagement', 2, 'hairline', 'medallion', 'caps'],
    ['romantic-engagement', 5, 'arch', 'stack', 'flourish'], ['candlelight-engagement', 1, 'double', 'medallion', 'rules', 'Engagement|Candlelight Evening'],
    ['sunset-engagement', 3, 'arch', 'stack', 'rules'], ['starry-engagement', 4, 'deco', 'medallion', 'diamond', 'Engagement|Under the Stars'],
    ['heritage-engagement', 6, 'kolam', 'stack', 'diamond'], ['beach-engagement', 3, 'hairline', 'medallion', 'caps', 'Engagement|By the Sea'],
    ['destination-engagement', 1, 'double', 'stack', 'rules'], ['engagement-dinner', 0, 'band', 'medallion', 'rules', 'Engagement|Dinner'],
    ['cocktail-engagement', 2, 'deco', 'stack', 'caps', 'Engagement|Cocktail Evening'], ['intimate-engagement', 5, 'beads', 'medallion', 'flourish'],
    ['grand-engagement-celebration', 6, 'band', 'stack', 'diamond', 'Engagement|Grand Celebration'], ['family-engagement', 3, 'double', 'medallion', 'rules'],
    ['traditional-engagement', 1, 'kolam', 'stack', 'diamond', 'Sagai|Ring Ceremony'], ['cultural-engagement', 6, 'kolam', 'medallion', 'rules'],
    ['intercultural-engagement', 4, 'double', 'stack', 'caps'], ['international-engagement', 1, 'band', 'medallion', 'rules'],
    ['vintage-engagement', 5, 'double', 'stack', 'flourish'], ['botanical-engagement', 0, 'beads', 'medallion', 'flourish'],
    ['moonlight-engagement', 3, 'hairline', 'stack', 'diamond', 'Engagement|By Moonlight'], ['palace-engagement', 1, 'band', 'medallion', 'rules'],
    ['celestial-engagement', 4, 'deco', 'stack', 'caps', 'Engagement|Celestial Evening']
  ].forEach(function (r) {
    var dir = 'images/engagement/' + r[0] + '/';
    ENGAGEMENT_DESIGNS[r[0]] = { family: 'engagement', layout: 'engagement', frame: r[2], date: r[3], heading: r[4], font: r[1], names: 'row', venue: 'split', events: 'cards',
      lineArt: 'rose', decor: dir, decorStyle: ENGAGEMENT_DECOR[r[0]] || 'corners', venueDefault: dir + 'venue.jpg', title: r[5] || null, mainEvent: r[6] || null };
  });
  /* Reception cards: [slug, font, frame, date, heading, title, decoration style]; art in images/reception/<slug>/. */
  [
    ['grand-reception', 1, 'hairline', 'stack', 'rules', 'Reception|Wedding Celebration', 'luxury'],
    ['evening-reception', 4, 'double', 'medallion', 'caps', 'Reception|Wedding Celebration', 'diagonal'],
    ['midnight-soiree', 6, 'deco', 'stack', 'diamond', 'Midnight Soirée|Wedding Reception', 'diagonal'],
    ['rose-gold-evening', 0, 'band', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'corners'],
    ['garden-reception', 2, 'arch', 'stack', 'rules', 'Reception|In the Garden', 'vines'],
    ['reception-evening', 6, 'beads', 'medallion', 'caps', 'Reception|Wedding Celebration', 'diagonal'],
    ['after-party', 3, 'kolam', 'stack', 'diamond', 'After Party|Music & Dance', 'diagonal'],
    ['wedding-brunch', 2, 'hairline', 'medallion', 'flourish', 'Wedding Brunch|Morning After', 'vines'],
    ['grand-luxury-reception', 4, 'double', 'stack', 'rules', 'Reception|Wedding Celebration', 'luxury'],
    ['royal-palace-reception', 1, 'band', 'medallion', 'caps', 'Reception|Wedding Celebration', 'luxury'],
    ['modern-minimal-reception', 2, 'band', 'stack', 'diamond', 'Reception|Wedding Celebration', 'vines'],
    ['classic-elegant-reception', 4, 'band', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'luxury'],
    ['luxury-ballroom-reception', 1, 'beads', 'stack', 'rules', 'Reception|Wedding Celebration', 'luxury'],
    ['garden-evening-reception', 5, 'kolam', 'medallion', 'caps', 'Reception|Wedding Celebration', 'wreath'],
    ['beach-reception', 7, 'hairline', 'stack', 'diamond', 'Reception|By the Sea', 'vines'],
    ['rooftop-reception', 4, 'double', 'medallion', 'flourish', 'Reception|On the Rooftop', 'vines'],
    ['hotel-reception', 6, 'deco', 'stack', 'rules', 'Reception|Wedding Celebration', 'luxury'],
    ['resort-reception', 1, 'kolam', 'medallion', 'caps', 'Reception|Wedding Celebration', 'garland'],
    ['candlelight-reception', 1, 'arch', 'stack', 'diamond', 'Reception|Wedding Celebration', 'luxury'],
    ['floral-reception', 3, 'beads', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'corners'],
    ['black-gold-reception', 4, 'kolam', 'stack', 'rules', 'Reception|Wedding Celebration', 'luxury'],
    ['rose-gold-reception', 0, 'hairline', 'medallion', 'caps', 'Reception|Wedding Celebration', 'corners'],
    ['champagne-reception', 6, 'double', 'stack', 'diamond', 'Reception|Wedding Celebration', 'luxury'],
    ['crystal-reception', 0, 'deco', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'wreath'],
    ['vintage-reception', 0, 'band', 'stack', 'rules', 'Reception|Wedding Celebration', 'corners'],
    ['boho-reception', 2, 'arch', 'medallion', 'caps', 'Reception|Wedding Celebration', 'vines'],
    ['contemporary-reception', 7, 'beads', 'stack', 'diamond', 'Reception|Wedding Celebration', 'vines'],
    ['romantic-evening-reception', 0, 'kolam', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'corners'],
    ['moonlight-reception', 4, 'hairline', 'stack', 'rules', 'Reception|By Moonlight', 'diagonal'],
    ['starry-night-reception', 6, 'double', 'medallion', 'caps', 'Reception|Under the Stars', 'diagonal'],
    ['sunset-reception', 3, 'deco', 'stack', 'diamond', 'Reception|At Sunset', 'diagonal'],
    ['lotus-garden-reception', 6, 'kolam', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'garland'],
    ['palace-courtyard-reception', 1, 'arch', 'stack', 'rules', 'Reception|Wedding Celebration', 'garland'],
    ['luxury-dinner-reception', 1, 'band', 'medallion', 'caps', 'Reception|Grand Dinner', 'luxury'],
    ['cocktail-reception', 4, 'kolam', 'stack', 'diamond', 'Reception|Cocktail Evening', 'diagonal'],
    ['traditional-celebration-reception', 1, 'kolam', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'garland'],
    ['cultural-heritage-reception', 0, 'double', 'stack', 'rules', 'Reception|Wedding Celebration', 'garland'],
    ['international-reception', 5, 'deco', 'medallion', 'caps', 'Reception|Wedding Celebration', 'wreath'],
    ['tropical-reception', 7, 'band', 'stack', 'diamond', 'Reception|Wedding Celebration', 'vines'],
    ['winter-evening-reception', 3, 'arch', 'medallion', 'flourish', 'Reception|A Winter Evening', 'wreath'],
    ['luxury-maroon-reception', 6, 'beads', 'stack', 'rules', 'Reception|Wedding Celebration', 'luxury'],
    ['emerald-garden-reception', 0, 'kolam', 'medallion', 'caps', 'Reception|Wedding Celebration', 'wreath'],
    ['sapphire-evening-reception', 1, 'hairline', 'stack', 'diamond', 'Reception|Wedding Celebration', 'luxury'],
    ['pearl-white-reception', 5, 'double', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'wreath'],
    ['lavender-romance-reception', 5, 'deco', 'stack', 'rules', 'Reception|Wedding Celebration', 'corners'],
    ['terracotta-sunset-reception', 3, 'band', 'medallion', 'caps', 'Reception|Wedding Celebration', 'diagonal'],
    ['heritage-gold-reception', 6, 'arch', 'stack', 'diamond', 'Reception|Wedding Celebration', 'luxury'],
    ['celestial-reception', 6, 'beads', 'medallion', 'flourish', 'Reception|Wedding Celebration', 'diagonal']
  ].forEach(function (r) {
    var dir = 'images/reception/' + r[0] + '/';
    ENGAGEMENT_DESIGNS[r[0]] = { family: 'reception', layout: 'engagement', frame: r[2], date: r[3], heading: r[4], font: r[1], names: 'row', venue: 'split', events: 'cards',
      lineArt: 'rose', decor: dir, decorStyle: r[6], venueDefault: dir + 'venue.jpg', title: r[5], mainEvent: null };
  });
  /* Birthday cards: [slug, font, frame, date, heading, title (script|caps), decoration style, sample age, audience];
     art in images/birthday/<slug>/ (scripts/birthday-briefs.js). The age, when given, replaces the script word. */
  [
    ['kids-birthday', 8, 'band', 'stack', 'rules', 'Party Time|Birthday Bash', 'corners', 6, 'kid'],
    ['princess-birthday', 3, 'arch', 'medallion', 'flourish', 'Princess|Royal Birthday Party', 'corners', 5, 'kid'],
    ['space-birthday', 8, 'deco', 'stack', 'diamond', 'Blast Off|Space Birthday Party', 'diagonal', 7, 'kid'],
    ['first-birthday', 9, 'beads', 'medallion', 'flourish', 'Little One|First Birthday', 'corners', 1, 'baby'],
    ['neon-nights', 4, 'hairline', 'stack', 'caps', 'Neon Nights|Birthday Party', 'diagonal', 24, 'adult'],
    ['teddy-bear-birthday', 8, 'double', 'medallion', 'rules', 'Beary Happy|Birthday Picnic', 'corners', 2, 'baby'],
    ['dinosaur-adventure', 8, 'band', 'stack', 'diamond', 'Roar|Dino Birthday Adventure', 'vines', 5, 'kid'],
    ['jungle-party', 9, 'hairline', 'medallion', 'rules', 'Wild One|Jungle Birthday Party', 'vines', 4, 'kid'],
    ['rainbow-birthday', 9, 'arch', 'stack', 'flourish', 'Over the Rainbow|Birthday Party', 'corners', 4, 'kid'],
    ['little-explorer', 8, 'double', 'medallion', 'caps', 'Explorer|Birthday Adventure', 'vines', 6, 'kid'],
    ['under-the-sea-birthday', 9, 'beads', 'stack', 'rules', 'Under the Sea|Birthday Splash', 'wreath', 5, 'kid'],
    ['cute-animal-party', 8, 'arch', 'medallion', 'flourish', 'Party Animals|Birthday Party', 'corners', 3, 'kid'],
    ['toyland-celebration', 8, 'band', 'medallion', 'diamond', 'Toyland|Birthday Celebration', 'garland', 4, 'kid'],
    ['fairy-tale-birthday', 3, 'arch', 'stack', 'flourish', 'Once Upon a Time|Fairy Tale Birthday', 'wreath', 6, 'kid'],
    ['magical-unicorn', 9, 'beads', 'medallion', 'flourish', 'Magical|Unicorn Birthday Party', 'corners', 6, 'kid'],
    ['superhero-birthday', 8, 'deco', 'stack', 'caps', 'Hero Time|Superhero Birthday', 'diagonal', 7, 'kid'],
    ['pirate-adventure', 8, 'double', 'medallion', 'rules', 'Ahoy|Pirate Birthday Adventure', 'garland', 7, 'kid'],
    ['farmyard-birthday', 8, 'band', 'stack', 'flourish', 'Down on the Farm|Birthday Party', 'garland', 3, 'kid'],
    ['safari-birthday', 9, 'hairline', 'stack', 'rules', 'Safari|Birthday Adventure', 'vines', 5, 'kid'],
    ['little-artist', 9, 'beads', 'medallion', 'caps', 'Little Artist|Art Party Birthday', 'garland', 6, 'kid'],
    ['birthday-vibes', 9, 'arch', 'stack', 'flourish', 'Birthday Vibes|Let\'s Celebrate', 'corners', 22, 'adult'],
    ['purple-party', 4, 'beads', 'medallion', 'caps', 'Purple Party|Birthday Celebration', 'garland', 16, 'teen'],
    ['neon-party', 2, 'deco', 'medallion', 'diamond', 'Glow Party|Neon Birthday', 'diagonal', 15, 'teen'],
    ['music-night', 1, 'hairline', 'stack', 'rules', 'Music Night|Birthday Celebration', 'diagonal', 28, 'adult'],
    ['disco-dreams', 4, 'deco', 'stack', 'diamond', 'Disco Dreams|Birthday Party', 'diagonal', 30, 'adult'],
    ['starry-birthday', 3, 'double', 'medallion', 'flourish', 'Starry Night|Birthday Celebration', 'diagonal', 12, 'teen'],
    ['social-celebration', 2, 'hairline', 'stack', 'caps', 'Celebrate|Birthday Get-Together', 'vines', 32, 'adult'],
    ['trendy-birthday', 4, 'band', 'medallion', 'rules', 'Cheers|Birthday Celebration', 'garland', 26, 'adult'],
    ['retro-party', 9, 'double', 'stack', 'diamond', 'Groovy|Retro Birthday Party', 'diagonal', 35, 'adult'],
    ['street-style-birthday', 2, 'deco', 'medallion', 'caps', 'Street Party|Birthday Bash', 'diagonal', 19, 'teen'],
    ['floral-elegance', 0, 'arch', 'stack', 'flourish', 'Birthday|An Elegant Celebration', 'corners', 30, 'adult'],
    ['rose-garden', 5, 'beads', 'medallion', 'rules', 'Rose Garden|Birthday Luncheon', 'wreath', 45, 'adult'],
    ['butterfly-birthday', 3, 'arch', 'medallion', 'flourish', 'Butterfly|Birthday Garden Party', 'wreath', 8, 'kid'],
    ['blush-celebration', 5, 'double', 'stack', 'caps', 'Celebrate|Birthday in Blush', 'corners', 27, 'adult'],
    ['pink-champagne', 0, 'band', 'medallion', 'diamond', 'Pink Champagne|Birthday Soirée', 'corners', 30, 'adult'],
    ['lavender-dreams', 3, 'hairline', 'stack', 'flourish', 'Lavender Dreams|Birthday Celebration', 'wreath', 21, 'adult'],
    ['pearl-birthday', 5, 'beads', 'medallion', 'rules', 'Pearls & Grace|Birthday Celebration', 'wreath', 60, 'senior'],
    ['elegant-bloom', 0, 'double', 'stack', 'caps', 'In Bloom|Birthday Luncheon', 'wreath', 35, 'adult'],
    ['luxury-rose-gold', 6, 'arch', 'medallion', 'diamond', 'Birthday|Rose Gold Soirée', 'corners', 40, 'adult'],
    ['garden-soiree', 3, 'hairline', 'medallion', 'flourish', 'Garden Soirée|Birthday Evening', 'vines', 33, 'adult'],
    ['classic-gentleman', 1, 'double', 'stack', 'rules', 'A Gentleman\'s|Birthday Celebration', 'luxury', 45, 'adult'],
    ['black-and-gold-birthday', 4, 'band', 'medallion', 'diamond', 'Black & Gold|Birthday Celebration', 'luxury', 40, 'adult'],
    ['royal-navy-birthday', 1, 'hairline', 'medallion', 'caps', 'Royal|Birthday Celebration', 'luxury', 35, 'adult'],
    ['midnight-gentleman', 7, 'deco', 'stack', 'rules', 'Midnight|Birthday Soirée', 'luxury', 42, 'adult'],
    ['adventure-birthday', 2, 'band', 'stack', 'diamond', 'Adventure|Birthday Camp-Out', 'wreath', 10, 'kid'],
    ['sports-birthday', 8, 'double', 'medallion', 'caps', 'Game On|Sports Birthday Party', 'garland', 9, 'kid'],
    ['racing-birthday', 8, 'deco', 'stack', 'diamond', 'Ready Set Go|Racing Birthday', 'diagonal', 8, 'kid'],
    ['vintage-gentleman', 7, 'double', 'medallion', 'flourish', 'Vintage|Birthday Celebration', 'luxury', 55, 'senior'],
    ['modern-masculine', 4, 'hairline', 'stack', 'caps', 'Birthday|A Modern Celebration', 'vines', 38, 'adult'],
    ['golden-birthday', 1, 'band', 'medallion', 'rules', 'Golden|Birthday Celebration', 'luxury', 50, 'adult'],
    ['silver-celebration', 6, 'beads', 'stack', 'diamond', 'Silver|Birthday Celebration', 'wreath', 25, 'adult'],
    ['champagne-glow', 0, 'double', 'medallion', 'flourish', 'Champagne|Birthday Celebration', 'luxury', 30, 'adult'],
    ['minimal-birthday', 2, 'hairline', 'stack', 'caps', 'Birthday|A Simple Celebration', 'vines', 29, 'adult'],
    ['modern-luxury', 4, 'deco', 'medallion', 'diamond', 'Luxe|Birthday Celebration', 'luxury', 40, 'adult'],
    ['black-velvet', 5, 'arch', 'stack', 'flourish', 'Velvet Night|Birthday Soirée', 'luxury', 36, 'adult'],
    ['emerald-elegance', 1, 'double', 'medallion', 'rules', 'Emerald|Birthday Dinner', 'luxury', 45, 'adult'],
    ['sunset-celebration', 3, 'band', 'stack', 'flourish', 'Sunset|Birthday Celebration', 'diagonal', 28, 'adult'],
    ['tropical-birthday', 9, 'hairline', 'medallion', 'caps', 'Aloha|Tropical Birthday Party', 'vines', 25, 'adult'],
    ['rustic-birthday', 7, 'beads', 'stack', 'rules', 'Rustic|Birthday Gathering', 'garland', 37, 'adult'],
    ['boho-birthday', 5, 'arch', 'medallion', 'flourish', 'Boho|Birthday Celebration', 'garland', 27, 'adult'],
    ['botanical-birthday', 6, 'beads', 'stack', 'diamond', 'Botanical|Birthday Brunch', 'vines', 31, 'adult'],
    ['celestial-birthday', 3, 'deco', 'medallion', 'flourish', 'Celestial|Birthday Evening', 'diagonal', 33, 'adult'],
    ['midnight-stars', 6, 'hairline', 'stack', 'caps', 'Midnight Stars|Birthday Party', 'diagonal', 17, 'teen'],
    ['grand-birthday', 1, 'band', 'medallion', 'rules', 'Grand|Birthday Celebration', 'luxury', 60, 'senior'],
    ['sweet-16', 9, 'arch', 'stack', 'flourish', 'Sweet Sixteen|Birthday Party', 'corners', 16, 'teen'],
    ['18th-birthday', 4, 'deco', 'medallion', 'diamond', 'Coming of Age|Birthday Celebration', 'diagonal', 18, 'teen'],
    ['21st-birthday', 0, 'double', 'stack', 'rules', 'Cheers|Birthday Celebration', 'luxury', 21, 'adult'],
    ['25th-birthday', 3, 'beads', 'medallion', 'caps', 'Quarter Century|Birthday Celebration', 'wreath', 25, 'adult'],
    ['30th-birthday', 5, 'band', 'stack', 'diamond', 'Thirty & Thriving|Birthday Celebration', 'luxury', 30, 'adult'],
    ['40th-birthday', 1, 'arch', 'medallion', 'rules', 'Fabulous|Birthday Celebration', 'luxury', 40, 'adult'],
    ['50th-birthday', 6, 'double', 'stack', 'flourish', 'Golden Jubilee|Birthday Celebration', 'luxury', 50, 'adult'],
    ['60th-birthday', 1, 'kolam', 'medallion', 'diamond', 'Shashti Poorthi|Birthday Celebration', 'garland', 60, 'senior'],
    ['70th-birthday', 7, 'beads', 'stack', 'rules', 'Bhima Ratha Shanti|Birthday Celebration', 'luxury', 70, 'senior'],
    ['80th-birthday', 6, 'kolam', 'medallion', 'flourish', 'Sathabhishekam|Birthday Celebration', 'garland', 80, 'senior']
  ].forEach(function (r) {
    var dir = 'images/birthday/' + r[0] + '/';
    ENGAGEMENT_DESIGNS[r[0]] = { family: 'birthday', layout: 'engagement', frame: r[2], date: r[3], heading: r[4], font: r[1], names: 'solo', venue: 'split', events: 'cards',
      lineArt: 'rose', decor: dir, decorStyle: r[6], venueDefault: dir + 'venue.jpg', title: r[5], mainEvent: null, sampleAge: r[7], audience: r[8] };
  });
  /* Baby shower, naming ceremony, housewarming and anniversary cards, the
     birthday way: [slug, font, frame, date, heading, title (script|caps),
     decoration style, sample years (anniversary)]; art in images/<category>/<slug>/
     (scripts/<category>-briefs.js, FLUX.2 Klein 4B). */
  var OCCASION_ROWS = {
    'baby-shower': [
      ['baby-dreams', 9, 'beads', 'stack', 'flourish', 'Oh Baby|Baby Shower', 'corners'],
      ['little-prince', 1, 'band', 'medallion', 'rules', 'Little Prince|Baby Shower', 'wreath'],
      ['little-princess', 3, 'arch', 'medallion', 'flourish', 'Little Princess|Baby Shower', 'corners'],
      ['cloud-nine', 8, 'hairline', 'stack', 'caps', 'Cloud Nine|Baby Shower', 'garland'],
      ['little-miracle', 5, 'deco', 'medallion', 'diamond', 'Little Miracle|Baby Shower', 'diagonal'],
      ['bundle-of-joy', 9, 'double', 'stack', 'rules', 'Bundle of Joy|Baby Shower', 'corners'],
      ['twinkle-twinkle-little-one', 8, 'beads', 'medallion', 'flourish', 'Twinkle Twinkle|Baby Shower', 'diagonal'],
      ['welcome-baby', 0, 'band', 'stack', 'diamond', 'Welcome Baby|Baby Shower', 'garland'],
      ['tiny-toes-big-dreams', 8, 'hairline', 'medallion', 'rules', 'Tiny Toes|Baby Shower', 'vines'],
      ['our-little-sunshine', 9, 'arch', 'stack', 'caps', 'Little Sunshine|Baby Shower', 'corners'],
      ['baby-bliss', 3, 'beads', 'medallion', 'flourish', 'Baby Bliss|Baby Shower', 'diagonal'],
      ['once-upon-a-baby', 0, 'arch', 'stack', 'flourish', 'Once Upon a Baby|Baby Shower', 'wreath'],
      ['little-star', 5, 'deco', 'stack', 'diamond', 'Little Star|Baby Shower', 'diagonal'],
      ['sweetest-arrival', 2, 'double', 'medallion', 'rules', 'Sweetest Arrival|Baby Shower', 'corners'],
      ['hello-little-one', 4, 'hairline', 'stack', 'caps', 'Hello Little One|Baby Shower', 'vines'],
      ['teddys-welcome', 8, 'band', 'medallion', 'rules', 'Teddy’s Welcome|Baby Shower', 'garland'],
      ['elephant-parade', 9, 'beads', 'stack', 'rules', 'Elephant Parade|Baby Shower', 'garland'],
      ['little-lamb', 3, 'double', 'medallion', 'flourish', 'Little Lamb|Baby Shower', 'wreath'],
      ['bumble-baby', 8, 'kolam', 'stack', 'caps', 'Bumble Baby|Baby Shower', 'corners'],
      ['butterfly-kisses', 5, 'arch', 'medallion', 'flourish', 'Butterfly Kisses|Baby Shower', 'wreath'],
      ['garden-of-wishes', 0, 'vine', 'stack', 'flourish', 'Garden of Wishes|Baby Shower', 'vines'],
      ['rainbow-blessing', 9, 'band', 'medallion', 'caps', 'Rainbow Blessing|Baby Shower', 'corners'],
      ['pink-petals', 3, 'beads', 'stack', 'rules', 'Pink Petals|Baby Shower', 'corners'],
      ['blue-dream', 2, 'hairline', 'medallion', 'diamond', 'Blue Dream|Baby Shower', 'diagonal'],
      ['royal-heir', 1, 'band', 'stack', 'rules', 'Royal Heir|Baby Shower', 'luxury'],
      ['luxe-gold', 4, 'deco', 'medallion', 'diamond', 'Luxe Gold|Baby Shower', 'luxury'],
      ['boho-bloom', 5, 'arch', 'stack', 'flourish', 'Boho Bloom|Baby Shower', 'garland'],
      ['minimal-moon', 4, 'hairline', 'stack', 'caps', 'Hello Moon|Baby Shower', 'vines'],
      ['twin-blessing', 0, 'double', 'medallion', 'flourish', 'Double Blessing|Twin Baby Shower', 'wreath']
    ],
    'naming-ceremony': [
      ['naming-ceremony', 1, 'kolam', 'medallion', 'diamond', 'Namakarana|Naming Ceremony', 'garland'],
      ['blessed-beginning', 6, 'band', 'stack', 'rules', 'Blessed Beginning|Naming Ceremony', 'luxury'],
      ['cradle-song', 3, 'hairline', 'medallion', 'flourish', 'Cradle Song|Naming Ceremony', 'diagonal'],
      ['first-name', 1, 'deco', 'stack', 'diamond', 'First Name|Naming Ceremony', 'luxury'],
      ['a-name-filled-with-love', 5, 'arch', 'medallion', 'flourish', 'Filled With Love|Naming Ceremony', 'corners'],
      ['our-little-blessing', 0, 'beads', 'stack', 'rules', 'Little Blessing|Naming Ceremony', 'wreath'],
      ['a-beautiful-beginning', 3, 'vine', 'medallion', 'flourish', 'Beautiful Beginning|Naming Ceremony', 'vines'],
      ['welcome-to-our-family', 2, 'double', 'stack', 'caps', 'Welcome Home|Naming Ceremony', 'garland'],
      ['a-name-to-cherish', 1, 'band', 'medallion', 'rules', 'A Name to Cherish|Naming Ceremony', 'luxury'],
      ['little-one-big-blessings', 9, 'beads', 'stack', 'flourish', 'Big Blessings|Naming Ceremony', 'diagonal'],
      ['the-naming-celebration', 6, 'kolam', 'medallion', 'diamond', 'Naamkaran|Naming Ceremony', 'garland'],
      ['blessed-with-a-beautiful-name', 0, 'vine', 'stack', 'flourish', 'Beautiful Name|Naming Ceremony', 'wreath'],
      ['a-new-chapter-begins', 4, 'hairline', 'medallion', 'caps', 'A New Chapter|Naming Ceremony', 'vines'],
      ['our-precious-little-star', 5, 'deco', 'stack', 'diamond', 'Little Star|Naming Ceremony', 'diagonal'],
      ['sacred-naming-day', 1, 'kolam', 'stack', 'rules', 'Sacred Naming|Naming Ceremony', 'luxury'],
      ['moonlit-blessing', 3, 'hairline', 'stack', 'flourish', 'Moonlit Blessing|Naming Ceremony', 'diagonal'],
      ['cherished-beginning', 0, 'arch', 'medallion', 'flourish', 'Cherished|Naming Ceremony', 'corners'],
      ['a-grand-arrival', 4, 'deco', 'medallion', 'diamond', 'A Grand Arrival|Naming Ceremony', 'luxury'],
      ['tiny-blessings', 9, 'double', 'stack', 'rules', 'Tiny Blessings|Naming Ceremony', 'corners'],
      ['the-name-day', 2, 'band', 'medallion', 'caps', 'The Name Day|Naming Ceremony', 'garland'],
      ['first-words-of-welcome', 8, 'beads', 'medallion', 'rules', 'Warm Welcome|Naming Ceremony', 'corners'],
      ['blessings-of-home', 5, 'vine', 'stack', 'flourish', 'Blessings of Home|Naming Ceremony', 'vines'],
      ['aurora-naming', 3, 'arch', 'stack', 'flourish', 'Aurora|Naming Ceremony', 'diagonal'],
      ['golden-name', 6, 'deco', 'stack', 'diamond', 'Golden Name|Naming Ceremony', 'luxury'],
      ['paisley-blessing', 1, 'kolam', 'medallion', 'rules', 'Paisley Blessing|Naming Ceremony', 'garland'],
      ['little-crown', 3, 'beads', 'medallion', 'flourish', 'Little Crown|Naming Ceremony', 'wreath'],
      ['heirloom-naming', 7, 'double', 'stack', 'rules', 'Heirloom|Naming Ceremony', 'wreath'],
      ['a-quiet-blessing', 4, 'hairline', 'stack', 'caps', 'A Quiet Blessing|Naming Ceremony', 'vines'],
      ['starlight-naming', 6, 'hairline', 'medallion', 'diamond', 'Starlight|Naming Ceremony', 'diagonal']
    ],
    'house-warming': [
      ['new-beginnings', 2, 'hairline', 'stack', 'caps', 'New Beginnings|Housewarming', 'vines'],
      ['golden-threshold', 1, 'band', 'medallion', 'diamond', 'Griha Pravesh|Housewarming Ceremony', 'luxury'],
      ['modern-nest', 4, 'double', 'stack', 'caps', 'Modern Nest|Housewarming', 'vines'],
      ['open-doors', 6, 'arch', 'medallion', 'rules', 'Open Doors|Housewarming', 'wreath'],
      ['keys-to-happiness', 4, 'deco', 'stack', 'diamond', 'Keys to Happiness|Housewarming', 'luxury'],
      ['our-new-nest', 7, 'hairline', 'medallion', 'caps', 'Our New Nest|Housewarming', 'vines'],
      ['botanical-welcome', 0, 'vine', 'stack', 'flourish', 'Botanical Welcome|Housewarming', 'corners'],
      ['shubh-griha-pravesh', 1, 'kolam', 'medallion', 'diamond', 'Shubh Griha Pravesh|Housewarming Ceremony', 'garland'],
      ['new-home-new-blessings', 6, 'kolam', 'stack', 'rules', 'New Blessings|Griha Pravesh', 'garland'],
      ['vastu-harmony', 1, 'band', 'stack', 'diamond', 'Vastu Harmony|Griha Pravesh', 'garland'],
      ['fresh-beginning', 2, 'beads', 'medallion', 'caps', 'Fresh Beginning|Housewarming', 'corners'],
      ['rustic-farmhouse', 7, 'double', 'stack', 'rules', 'Rustic Farmhouse|Housewarming', 'garland'],
      ['city-nest', 4, 'hairline', 'stack', 'caps', 'City Nest|Housewarming', 'vines'],
      ['villa-dreams', 6, 'arch', 'medallion', 'rules', 'Villa Dreams|Housewarming', 'wreath'],
      ['garden-housewarming', 0, 'vine', 'medallion', 'flourish', 'Garden Party|Housewarming', 'wreath'],
      ['blooms-and-bricks', 3, 'beads', 'stack', 'flourish', 'Blooms & Bricks|Housewarming', 'corners'],
      ['boho-home', 5, 'arch', 'stack', 'flourish', 'Boho Home|Housewarming', 'garland'],
      ['nordic-nest', 4, 'hairline', 'medallion', 'caps', 'Nordic Nest|Housewarming', 'vines'],
      ['mediterranean-home', 3, 'arch', 'stack', 'rules', 'Mediterranean Home|Housewarming', 'vines'],
      ['tropical-hideaway', 7, 'deco', 'medallion', 'diamond', 'Tropical Hideaway|Housewarming', 'diagonal'],
      ['royal-residence', 1, 'band', 'medallion', 'rules', 'Royal Residence|Housewarming', 'luxury'],
      ['gold-and-ivory', 6, 'double', 'stack', 'diamond', 'Gold & Ivory|Housewarming', 'luxury'],
      ['champagne-housewarming', 4, 'deco', 'medallion', 'caps', 'Cheers|Housewarming Party', 'luxury'],
      ['watercolor-home', 5, 'beads', 'stack', 'flourish', 'Watercolour Home|Housewarming', 'corners'],
      ['our-family-home', 0, 'double', 'medallion', 'flourish', 'Our Family Home|Housewarming', 'wreath'],
      ['home-and-heart', 3, 'arch', 'medallion', 'flourish', 'Home & Heart|Housewarming', 'corners'],
      ['new-home-party', 8, 'band', 'stack', 'caps', 'New Home Party|Housewarming', 'diagonal'],
      ['home-blessing', 6, 'kolam', 'medallion', 'rules', 'Home Blessing|Griha Pravesh', 'garland'],
      ['a-place-to-call-home', 2, 'hairline', 'stack', 'caps', 'A Place to Call Home|Housewarming', 'vines']
    ],
    anniversary: [
      ['floral-anniversary', 0, 'vine', 'medallion', 'flourish', 'Happy Anniversary|Anniversary', 'corners', 10],
      ['silver-jubilee', 1, 'band', 'stack', 'diamond', 'Silver Jubilee|Anniversary', 'luxury', 25],
      ['golden-jubilee', 6, 'kolam', 'medallion', 'rules', 'Golden Jubilee|Anniversary', 'luxury', 50],
      ['forever-yours', 3, 'arch', 'stack', 'flourish', 'Forever Yours|Anniversary', 'corners', 5],
      ['anniversary-laurel', 1, 'double', 'medallion', 'rules', 'Laurel of Love|Anniversary', 'luxury', 30],
      ['vow-renewal', 5, 'arch', 'stack', 'flourish', 'Vow Renewal|Anniversary', 'wreath', 20],
      ['ruby-anniversary', 6, 'band', 'medallion', 'diamond', 'Ruby|Anniversary', 'luxury', 40],
      ['pearl-anniversary', 5, 'beads', 'stack', 'flourish', 'Pearl|Anniversary', 'wreath', 30],
      ['diamond-anniversary', 4, 'deco', 'medallion', 'diamond', 'Diamond|Anniversary', 'luxury', 60],
      ['emerald-anniversary', 1, 'hairline', 'stack', 'rules', 'Emerald|Anniversary', 'luxury', 55],
      ['sapphire-anniversary', 6, 'deco', 'stack', 'caps', 'Sapphire|Anniversary', 'luxury', 45],
      ['rose-anniversary', 0, 'band', 'medallion', 'flourish', 'Rose|Anniversary', 'diagonal', 15],
      ['golden-love', 3, 'kolam', 'stack', 'diamond', 'Golden Love|Anniversary', 'luxury', 50],
      ['eternal-love', 0, 'double', 'medallion', 'flourish', 'Eternal Love|Anniversary', 'wreath', 35],
      ['forever-together', 4, 'hairline', 'stack', 'caps', 'Forever Together|Anniversary', 'diagonal', 20],
      ['years-of-love', 2, 'beads', 'medallion', 'rules', 'Years of Love|Anniversary', 'garland', 15],
      ['love-through-the-years', 7, 'double', 'stack', 'rules', 'Through the Years|Anniversary', 'garland', 40],
      ['still-in-love', 3, 'arch', 'medallion', 'flourish', 'Still in Love|Anniversary', 'corners', 12],
      ['our-forever', 5, 'vine', 'stack', 'flourish', 'Our Forever|Anniversary', 'wreath', 7],
      ['timeless-love', 6, 'deco', 'medallion', 'diamond', 'Timeless Love|Anniversary', 'luxury', 30],
      ['ever-after', 3, 'hairline', 'medallion', 'flourish', 'Happily Ever After|Anniversary', 'diagonal', 10],
      ['together-forever', 2, 'band', 'stack', 'caps', 'Together Forever|Anniversary', 'diagonal', 25],
      ['endless-romance', 0, 'beads', 'stack', 'flourish', 'Endless Romance|Anniversary', 'corners', 18],
      ['our-love-story', 7, 'hairline', 'medallion', 'rules', 'Our Love Story|Anniversary', 'vines', 15],
      ['memories-and-love', 5, 'double', 'stack', 'flourish', 'Memories & Love|Anniversary', 'garland', 35],
      ['romantic-anniversary', 0, 'arch', 'medallion', 'flourish', 'Romantic Evening|Anniversary', 'corners', 10],
      ['luxury-anniversary', 1, 'deco', 'stack', 'diamond', 'Luxury|Anniversary', 'luxury', 25],
      ['garden-anniversary', 3, 'vine', 'stack', 'flourish', 'Garden of Love|Anniversary', 'vines', 20],
      ['candlelight-anniversary', 6, 'band', 'medallion', 'rules', 'Candlelight|Anniversary', 'luxury', 40],
      ['evening-anniversary', 4, 'hairline', 'stack', 'caps', 'An Evening of Love|Anniversary', 'diagonal', 25],
      ['dinner-anniversary', 1, 'double', 'medallion', 'diamond', 'Anniversary Dinner|Celebration', 'luxury', 30],
      ['family-anniversary-celebration', 2, 'beads', 'stack', 'rules', 'Family Celebration|Anniversary', 'garland', 50],
      ['classic-anniversary', 1, 'kolam', 'medallion', 'rules', 'Classic|Anniversary', 'luxury', 40],
      ['modern-anniversary', 4, 'deco', 'stack', 'caps', 'Modern Love|Anniversary', 'diagonal', 10],
      ['minimal-anniversary', 2, 'hairline', 'medallion', 'caps', 'Simply Us|Anniversary', 'vines', 5],
      ['royal-anniversary', 1, 'band', 'stack', 'diamond', 'Royal|Anniversary', 'luxury', 50],
      ['vintage-anniversary', 7, 'double', 'medallion', 'flourish', 'Vintage Love|Anniversary', 'wreath', 45],
      ['heritage-anniversary', 6, 'kolam', 'stack', 'diamond', 'Heritage|Anniversary', 'garland', 60],
      ['cultural-anniversary', 0, 'kolam', 'medallion', 'rules', 'Saath Saath|Anniversary', 'garland', 35],
      ['celebration-of-love', 3, 'beads', 'stack', 'flourish', 'Celebration of Love|Anniversary', 'corners', 20]
    ],
    /* Graduation ... community events: [slug, font, frame, date, heading, title,
       decoration style, sample title]; written by scripts/build-occasion-rows.js. */
    /* EVENT_ROWS START */
    graduation: [
      ['graduation-day', 1, 'band', 'medallion', 'flourish', 'Graduation Day|Celebration', 'wreath', 'Class of 2026'],
      ['honour-roll', 2, 'double', 'stack', 'flourish', 'Honour Roll|Convocation', 'diagonal', 'Convocation 2026'],
      ['cap-and-gown', 1, 'band', 'medallion', 'diamond', 'Cap & Gown|Convocation', 'vines', 'Convocation Day'],
      ['bright-future', 7, 'deco', 'medallion', 'flourish', 'Bright Future|Graduation', 'corners', 'Class of 2026'],
      ['class-of-2026', 2, 'double', 'stack', 'flourish', 'Class Of|Graduation', 'diagonal', 'Class of 2026'],
      ['proud-graduate', 4, 'band', 'medallion', 'rules', 'Proud Graduate|Celebration', 'luxury', 'Bachelor of Engineering'],
      ['graduation-celebration', 2, 'beads', 'stack', 'flourish', 'Hooray|Graduation Party', 'corners', 'Class of 2026'],
      ['commencement-ceremony', 1, 'double', 'stack', 'caps', 'Commencement|Ceremony', 'luxury', 'Commencement 2026'],
      ['the-next-chapter', 4, 'band', 'stack', 'flourish', 'The Next Chapter|Graduation', 'luxury', 'Master of Business Administration'],
      ['finally-graduated', 6, 'deco', 'medallion', 'diamond', 'Finally|Graduated', 'vines', 'Class of 2026'],
      ['degree-and-dreams', 6, 'hairline', 'medallion', 'diamond', 'Degree & Dreams|Graduation', 'wreath', 'Bachelor of Arts'],
      ['future-is-bright', 7, 'deco', 'medallion', 'flourish', 'Future Is Bright|Graduation', 'corners', 'Class of 2026'],
      ['cap-and-gown-2026', 1, 'double', 'medallion', 'caps', 'Convocation|Ceremony', 'wreath', 'Convocation 2026'],
      ['graduation-party', 2, 'beads', 'medallion', 'flourish', 'Grad Party|Let’s Celebrate', 'garland', 'Graduation Party'],
      ['senior-celebration', 3, 'hairline', 'stack', 'caps', 'Seniors|Celebration', 'diagonal', 'Senior Celebration 2026'],
      ['academic-achievement', 1, 'double', 'medallion', 'rules', 'First Class|Honours', 'luxury', 'Master of Science'],
      ['journey-complete', 6, 'band', 'stack', 'diamond', 'Journey Complete|Graduation', 'diagonal', 'Bachelor of Commerce'],
      ['new-beginnings-grad', 3, 'vine', 'stack', 'caps', 'New Beginnings|Graduation', 'wreath', 'Class of 2026'],
      ['cheers-to-the-graduate', 7, 'deco', 'stack', 'caps', 'Cheers|To the Graduate', 'luxury', 'Graduation Toast'],
      ['diploma-day', 6, 'band', 'medallion', 'caps', 'Diploma Day|Ceremony', 'vines', 'Diploma Ceremony 2026'],
      ['graduation-gala', 6, 'double', 'medallion', 'diamond', 'Graduation|Gala Night', 'luxury', 'Graduation Ball 2026'],
      ['honors-and-achievement', 6, 'band', 'stack', 'diamond', 'Summa Cum Laude|Honours', 'luxury', 'With Highest Honours'],
      ['class-valedictorian', 0, 'deco', 'stack', 'diamond', 'Valedictorian|Celebration', 'luxury', 'Valedictorian 2026'],
      ['college-graduation', 1, 'arch', 'medallion', 'flourish', 'College Days|Graduation', 'vines', 'B.Tech Class of 2026'],
      ['high-school-graduation', 2, 'beads', 'medallion', 'flourish', 'Last Bell|Graduation', 'diagonal', 'Class of 2026'],
      ['university-graduation', 4, 'deco', 'stack', 'flourish', 'University|Graduation', 'vines', 'Master of Technology'],
      ['graduation-brunch', 0, 'hairline', 'stack', 'caps', 'Graduation|Brunch', 'wreath', 'Graduation Brunch'],
      ['graduation-open-house', 4, 'deco', 'medallion', 'diamond', 'Open House|Graduation', 'corners', 'Graduation Open House'],
      ['walk-the-stage', 0, 'hairline', 'medallion', 'flourish', 'Walk the Stage|Graduation', 'vines', 'Class of 2026']
    ],
    retirement: [
      ['retirement-honour', 6, 'band', 'medallion', 'caps', 'With Honour|Retirement', 'vines', 'A Life Well Served'],
      ['golden-years', 2, 'arch', 'stack', 'flourish', 'Golden Years|Retirement', 'diagonal', 'A Golden Farewell'],
      ['safe-harbour', 6, 'hairline', 'medallion', 'flourish', 'Safe Harbour|Retirement', 'corners', 'Smooth Sailing Ahead'],
      ['with-gratitude', 2, 'arch', 'stack', 'diamond', 'With Gratitude|Retirement', 'wreath', 'Thank You for Everything'],
      ['cheers-to-retirement', 1, 'deco', 'medallion', 'rules', 'Cheers|To Retirement', 'luxury', 'Here’s to You'],
      ['new-chapter-retirement', 4, 'band', 'stack', 'diamond', 'A New Chapter|Retirement', 'diagonal', 'The Next Chapter Begins'],
      ['happy-retirement', 3, 'double', 'stack', 'diamond', 'Happy Retirement|Celebration', 'corners', 'Happy Retirement'],
      ['retirement-celebration', 7, 'band', 'stack', 'diamond', 'Retirement|Celebration Dinner', 'luxury', 'A Celebration of Service'],
      ['farewell-to-work', 4, 'hairline', 'stack', 'caps', 'Last Day|At Work', 'diagonal', 'Farewell to the Office'],
      ['golden-years-2026', 4, 'deco', 'stack', 'rules', 'Golden Years|Begin', 'luxury', 'The Golden Years'],
      ['time-to-relax', 2, 'arch', 'stack', 'diamond', 'Time to Relax|Retirement', 'wreath', 'Rest Well Earned'],
      ['freedom-begins', 2, 'hairline', 'medallion', 'caps', 'Freedom Begins|Retirement', 'diagonal', 'No More Mondays'],
      ['retirement-party', 4, 'double', 'stack', 'flourish', 'Retirement|Party', 'corners', 'Retirement Party'],
      ['the-next-adventure', 7, 'band', 'stack', 'caps', 'Next Adventure|Retirement', 'vines', 'Adventure Awaits'],
      ['years-of-memories', 1, 'double', 'medallion', 'caps', 'Years of Memories|Retirement', 'wreath', 'Thirty Years of Memories'],
      ['goodbye-and-good-luck', 4, 'beads', 'stack', 'rules', 'Good Luck|Retirement', 'garland', 'Goodbye & Good Luck'],
      ['work-ends-life-begins', 1, 'hairline', 'stack', 'flourish', 'Life Begins|Retirement', 'corners', 'Work Ends, Life Begins'],
      ['retirement-brunch', 5, 'arch', 'medallion', 'flourish', 'Retirement|Brunch', 'vines', 'Retirement Brunch'],
      ['a-lifetime-of-achievement', 7, 'band', 'stack', 'rules', 'Lifetime|Of Achievement', 'luxury', 'A Lifetime of Achievement']
    ],
    farewell: [
      ['farewell-evening', 4, 'beads', 'medallion', 'flourish', 'Farewell|Evening', 'diagonal', 'Farewell Evening'],
      ['until-we-meet', 6, 'band', 'medallion', 'diamond', 'Until We Meet|Farewell', 'wreath', 'One Last Evening'],
      ['new-chapter', 4, 'hairline', 'stack', 'rules', 'A New Chapter|Farewell', 'corners', 'On to New Pages'],
      ['send-off', 3, 'double', 'medallion', 'caps', 'Send-Off|Farewell', 'diagonal', 'Team Send-Off'],
      ['until-we-meet-again', 3, 'deco', 'stack', 'diamond', 'Until We Meet Again|Farewell', 'corners', 'Until We Meet Again'],
      ['goodbye-with-love', 2, 'arch', 'medallion', 'flourish', 'With Love|Farewell', 'vines', 'Goodbye with Love'],
      ['a-fond-farewell', 0, 'vine', 'medallion', 'flourish', 'A Fond Farewell|Celebration', 'wreath', 'A Fond Farewell'],
      ['see-you-on-the-other-side', 6, 'band', 'stack', 'diamond', 'See You|On the Other Side', 'luxury', 'Farewell Party'],
      ['new-journey-begins', 4, 'arch', 'stack', 'flourish', 'New Journey|Begins', 'vines', 'A New Journey Begins'],
      ['farewell-and-best-wishes', 7, 'deco', 'stack', 'flourish', 'Best Wishes|Farewell', 'luxury', 'With Best Wishes'],
      ['cheers-to-new-beginnings', 4, 'band', 'medallion', 'flourish', 'Cheers|To New Beginnings', 'luxury', 'Cheers to New Beginnings'],
      ['until-our-paths-cross-again', 4, 'deco', 'stack', 'flourish', 'Paths Cross|Again', 'vines', 'Until Our Paths Cross Again'],
      ['goodbye-dear-friend', 6, 'double', 'stack', 'rules', 'Dear Friend|Farewell', 'wreath', 'Goodbye, Dear Friend'],
      ['memories-we-keep', 2, 'arch', 'stack', 'rules', 'Memories|We Keep', 'corners', 'Memories We Keep'],
      ['one-chapter-ends', 2, 'band', 'medallion', 'caps', 'One Chapter Ends|Farewell', 'vines', 'Another Begins'],
      ['a-beautiful-goodbye', 3, 'arch', 'stack', 'rules', 'Beautiful Goodbye|Farewell', 'wreath', 'A Beautiful Goodbye'],
      ['wishing-you-the-best', 5, 'vine', 'medallion', 'diamond', 'Wishing You|The Best', 'vines', 'Wishing You the Best'],
      ['goodbye-for-now', 2, 'deco', 'medallion', 'rules', 'Goodbye for Now|Farewell', 'diagonal', 'See You Soon'],
      ['new-adventures-await', 7, 'double', 'medallion', 'flourish', 'Adventures Await|Farewell', 'corners', 'New Adventures Await'],
      ['friends-forever', 4, 'arch', 'stack', 'flourish', 'Friends Forever|Farewell', 'wreath', 'Friends Forever'],
      ['bon-voyage', 1, 'hairline', 'stack', 'caps', 'Bon Voyage|Farewell', 'vines', 'Bon Voyage'],
      ['safe-travels', 6, 'band', 'medallion', 'caps', 'Safe Travels|Farewell', 'diagonal', 'Safe Travels'],
      ['goodbye-teacher', 6, 'arch', 'stack', 'flourish', 'Dear Teacher|Farewell', 'corners', 'Thank You, Teacher'],
      ['farewell-classmates', 2, 'band', 'medallion', 'caps', 'Dear Classmates|Farewell', 'wreath', 'Class Farewell'],
      ['graduation-goodbye', 7, 'hairline', 'stack', 'flourish', 'Graduation|Goodbye', 'diagonal', 'College Farewell'],
      ['farewell-seniors', 2, 'beads', 'stack', 'diamond', 'Farewell|Seniors', 'corners', 'Senior Farewell Party'],
      ['goodbye-colleague', 4, 'arch', 'medallion', 'flourish', 'Dear Colleague|Farewell', 'diagonal', 'Office Farewell'],
      ['thank-you-for-everything', 4, 'deco', 'stack', 'flourish', 'Thank You|For Everything', 'vines', 'Thank You for Everything'],
      ['farewell-to-a-wonderful-leader', 7, 'double', 'stack', 'diamond', 'A Wonderful Leader|Farewell', 'luxury', 'Farewell to Our Leader'],
      ['farewell-dear-family', 0, 'vine', 'medallion', 'flourish', 'Dear Family|Farewell', 'vines', 'Family Farewell'],
      ['memories-forever', 7, 'deco', 'stack', 'caps', 'Memories|Forever', 'diagonal', 'Memories Forever'],
      ['a-toast-to-your-next-adventure', 4, 'beads', 'medallion', 'caps', 'A Toast|To Your Next Adventure', 'corners', 'A Toast to You']
    ],
    corporate: [
      ['corporate-event', 6, 'hairline', 'medallion', 'flourish', 'You’re Invited|Corporate Event', 'vines', 'Annual Partner Summit'],
      ['product-launch', 6, 'deco', 'medallion', 'rules', 'Launch|Product Unveiling', 'corners', 'The Launch Event'],
      ['annual-summit', 5, 'hairline', 'medallion', 'diamond', 'Annual Summit|Conference', 'wreath', 'Annual Summit 2026'],
      ['team-offsite', 2, 'deco', 'stack', 'rules', 'Team Offsite|Let’s Go', 'diagonal', 'Team Offsite 2026'],
      ['corporate-gala', 6, 'band', 'medallion', 'flourish', 'Gala Evening|Black Tie', 'luxury', 'Annual Corporate Gala'],
      ['business-conference', 7, 'double', 'medallion', 'flourish', 'Conference|Keynote & Panels', 'diagonal', 'Business Conference 2026'],
      ['annual-general-meeting', 4, 'deco', 'stack', 'rules', 'General Meeting|Annual', 'vines', 'Annual General Meeting'],
      ['company-anniversary', 4, 'double', 'stack', 'caps', 'Milestone|Company Anniversary', 'diagonal', 'Twenty-Five Years of Excellence'],
      ['corporate-dinner', 4, 'band', 'medallion', 'flourish', 'Corporate|Dinner', 'luxury', 'Annual Corporate Dinner'],
      ['executive-dinner', 1, 'deco', 'medallion', 'rules', 'Executive|Dinner', 'luxury', 'Leadership Dinner'],
      ['business-networking', 1, 'band', 'stack', 'flourish', 'Networking|Evening', 'vines', 'Business Networking Evening'],
      ['leadership-summit', 6, 'double', 'medallion', 'rules', 'Leadership|Summit', 'luxury', 'Leadership Summit 2026'],
      ['industry-summit', 7, 'band', 'stack', 'flourish', 'Industry|Summit', 'diagonal', 'Industry Conclave 2026'],
      ['corporate-awards-night', 4, 'deco', 'medallion', 'caps', 'Awards Night|Excellence', 'luxury', 'Annual Awards Night'],
      ['employee-appreciation', 7, 'hairline', 'stack', 'rules', 'Thank You|Team Appreciation', 'wreath', 'Employee Appreciation Day'],
      ['team-celebration', 9, 'deco', 'medallion', 'caps', 'Celebrate|All Hands', 'corners', 'All Hands Celebration'],
      ['office-opening', 7, 'hairline', 'stack', 'flourish', 'Grand Opening|New Office', 'wreath', 'New Office Inauguration'],
      ['new-branch-opening', 1, 'deco', 'medallion', 'rules', 'New Branch|Opening', 'diagonal', 'New Branch Opening'],
      ['grand-opening', 6, 'arch', 'stack', 'caps', 'Grand Opening|Doors Open', 'vines', 'Grand Opening'],
      ['business-workshop', 4, 'hairline', 'medallion', 'rules', 'Workshop|Hands-On', 'wreath', 'Business Strategy Workshop'],
      ['professional-seminar', 2, 'double', 'stack', 'diamond', 'Seminar|Knowledge Session', 'diagonal', 'Professional Seminar'],
      ['corporate-retreat', 0, 'vine', 'stack', 'flourish', 'Retreat|Recharge', 'wreath', 'Corporate Retreat'],
      ['company-family-day', 9, 'double', 'stack', 'diamond', 'Family Day|Fun for All', 'garland', 'Company Family Day'],
      ['client-appreciation', 6, 'band', 'medallion', 'flourish', 'With Thanks|Client Appreciation', 'corners', 'Client Appreciation Evening'],
      ['partner-meet', 6, 'arch', 'stack', 'flourish', 'Partner Meet|Alliances', 'diagonal', 'Partner Meet 2026'],
      ['investor-meet', 1, 'double', 'medallion', 'diamond', 'Investor Meet|Growth', 'luxury', 'Investor Day 2026'],
      ['press-conference', 7, 'arch', 'stack', 'diamond', 'Press Meet|Announcement', 'corners', 'Press Conference'],
      ['business-breakfast', 2, 'hairline', 'stack', 'rules', 'Breakfast|Briefing', 'diagonal', 'Business Breakfast'],
      ['corporate-cocktail-evening', 0, 'band', 'stack', 'rules', 'Cocktail Evening|Corporate', 'luxury', 'Corporate Cocktail Evening'],
      ['year-end-celebration', 9, 'beads', 'medallion', 'flourish', 'Year End|Celebration', 'diagonal', 'Year-End Celebration']
    ],
    festival: [
      ['festival-celebration', 5, 'band', 'stack', 'flourish', 'Festive|Celebration', 'garland', 'Festival Celebration'],
      ['diwali-lights', 5, 'kolam', 'medallion', 'diamond', 'Diwali|Festival of Lights', 'luxury', 'Diwali Celebration'],
      ['pongal-harvest', 1, 'beads', 'medallion', 'rules', 'Pongal|Harvest Festival', 'garland', 'Pongal Celebration'],
      ['christmas-joy', 5, 'hairline', 'medallion', 'diamond', 'Christmas|Season of Joy', 'vines', 'Christmas Celebration'],
      ['eid-mubarak', 1, 'beads', 'stack', 'flourish', 'Eid Mubarak|Celebration', 'garland', 'Eid Mubarak'],
      ['navratri-nights', 1, 'band', 'stack', 'caps', 'Navratri|Nine Nights', 'luxury', 'Navratri Garba Night'],
      ['new-year-sparkle', 6, 'arch', 'stack', 'flourish', 'New Year|Celebration', 'wreath', 'New Year’s Eve'],
      ['onam-harvest', 5, 'beads', 'medallion', 'flourish', 'Onam|Harvest Festival', 'garland', 'Onam Celebration'],
      ['holi-colours', 2, 'hairline', 'stack', 'diamond', 'Holi|Festival of Colours', 'corners', 'Holi Celebration'],
      ['diya-rangoli', 1, 'kolam', 'medallion', 'flourish', 'Deepavali|Rangoli Lights', 'garland', 'Deepavali Celebration'],
      ['deepavali-mandala', 3, 'beads', 'stack', 'caps', 'Deepavali|Grand Greetings', 'garland', 'Grand Deepavali'],
      ['marigold-diyas', 3, 'kolam', 'medallion', 'diamond', 'Deepavali|Lamps & Marigolds', 'garland', 'Deepavali Celebration'],
      ['diya-lanterns', 1, 'band', 'stack', 'rules', 'Diwali|Lanterns', 'luxury', 'Diwali Night'],
      ['golden-lamps', 6, 'kolam', 'medallion', 'caps', 'Diwali|Golden Lamps', 'garland', 'Diwali Evening'],
      ['halo-lamps', 1, 'beads', 'stack', 'rules', 'Diwali|Moonlit Lamp', 'garland', 'Diwali Night'],
      ['lamp-border', 3, 'band', 'stack', 'rules', 'Deepavali|Royal Greetings', 'garland', 'Deepavali Celebration'],
      ['diyas-below', 3, 'kolam', 'medallion', 'diamond', 'Deepavali|Evergreen Lights', 'garland', 'Deepavali Celebration'],
      ['holi-rang', 9, 'double', 'medallion', 'flourish', 'Holi|Rang Barse', 'diagonal', 'Holi Celebration'],
      ['gulal-splash', 9, 'beads', 'stack', 'rules', 'Holi|Gulal Splash', 'garland', 'Holi Party'],
      ['holi-hearts', 3, 'hairline', 'medallion', 'diamond', 'Holi|Colours of Love', 'corners', 'Holi Celebration'],
      ['garba-nights', 3, 'kolam', 'medallion', 'diamond', 'Garba|Nights', 'garland', 'Garba Night'],
      ['navratri-peacock', 3, 'beads', 'stack', 'caps', 'Navratri|Celebration', 'luxury', 'Navratri Celebration'],
      ['navratri-mandala', 1, 'kolam', 'medallion', 'diamond', 'Navratri|Nine Nights', 'garland', 'Navratri Celebration'],
      ['vijayadashami', 5, 'band', 'medallion', 'flourish', 'Vijayadashami|Dussehra', 'luxury', 'Dussehra Celebration'],
      ['dussehra-crown', 0, 'deco', 'stack', 'flourish', 'Dussehra|Victory of Good', 'luxury', 'Dussehra Celebration'],
      ['ganpati-bappa', 3, 'band', 'stack', 'rules', 'Ganesh Chaturthi|Ganpati Bappa', 'garland', 'Ganesh Chaturthi'],
      ['ganesh-aarti', 6, 'beads', 'medallion', 'flourish', 'Ganesh Aarti|Puja', 'luxury', 'Ganesh Chaturthi Puja'],
      ['krishna-janmashtami', 5, 'band', 'medallion', 'diamond', 'Janmashtami|Celebration', 'garland', 'Krishna Janmashtami'],
      ['raksha-bandhan', 5, 'beads', 'stack', 'flourish', 'Raksha Bandhan|Celebration', 'luxury', 'Raksha Bandhan'],
      ['rakhi-festoon', 5, 'kolam', 'stack', 'rules', 'Rakhi|Celebration', 'garland', 'Rakhi Celebration'],
      ['karwa-chauth', 5, 'beads', 'medallion', 'rules', 'Karwa Chauth|Moonrise', 'garland', 'Karwa Chauth'],
      ['maha-shivratri', 1, 'kolam', 'medallion', 'caps', 'Maha Shivratri|Sacred Night', 'garland', 'Maha Shivratri'],
      ['shivratri-trishul', 6, 'band', 'medallion', 'diamond', 'Shivratri|Vigil', 'luxury', 'Shivratri Puja'],
      ['ram-navami', 5, 'beads', 'stack', 'caps', 'Ram Navami|Blessings', 'garland', 'Ram Navami'],
      ['ram-navami-mandala', 6, 'kolam', 'stack', 'diamond', 'Ram Navami|Celebration', 'garland', 'Ram Navami Celebration'],
      ['durga-puja', 1, 'band', 'stack', 'flourish', 'Durga Puja|Celebration', 'garland', 'Durga Puja'],
      ['durga-puja-mandala', 3, 'kolam', 'medallion', 'flourish', 'Durga Puja|Pujo', 'garland', 'Durga Puja Celebration'],
      ['lakshmi-puja', 5, 'band', 'stack', 'rules', 'Lakshmi Puja|Blessings', 'garland', 'Lakshmi Puja'],
      ['saraswati-puja', 5, 'beads', 'medallion', 'flourish', 'Saraswati Puja|Learning', 'garland', 'Saraswati Puja'],
      ['basant-panchami', 3, 'kolam', 'stack', 'caps', 'Basant Panchami|Spring', 'garland', 'Basant Panchami'],
      ['onam-pookalam', 1, 'band', 'stack', 'flourish', 'Onam|Pookalam', 'garland', 'Onam Celebration'],
      ['onam-sadhya', 3, 'kolam', 'medallion', 'diamond', 'Onam|Sadhya', 'luxury', 'Onam Sadhya'],
      ['onam-waves', 5, 'beads', 'medallion', 'caps', 'Onam|Backwaters', 'garland', 'Onam Celebration'],
      ['thai-pongal', 1, 'kolam', 'medallion', 'caps', 'Thai Pongal|Harvest', 'garland', 'Thai Pongal'],
      ['pongal-sun', 5, 'band', 'medallion', 'rules', 'Surya Pongal|Harvest Sun', 'garland', 'Pongal Celebration'],
      ['baisakhi', 3, 'beads', 'medallion', 'flourish', 'Baisakhi|Harvest', 'garland', 'Baisakhi Celebration'],
      ['lohri-bonfire', 3, 'kolam', 'stack', 'caps', 'Lohri|Bonfire Night', 'garland', 'Lohri Celebration'],
      ['makar-sankranti', 3, 'band', 'stack', 'flourish', 'Sankranti|Kite Festival', 'luxury', 'Makar Sankranti'],
      ['kite-sky', 5, 'kolam', 'medallion', 'diamond', 'Uttarayan|Kites', 'garland', 'Kite Festival'],
      ['ugadi', 1, 'beads', 'medallion', 'caps', 'Ugadi|New Year', 'garland', 'Ugadi Celebration'],
      ['gudi-padwa', 6, 'kolam', 'medallion', 'flourish', 'Gudi Padwa|New Year', 'luxury', 'Gudi Padwa'],
      ['vishu', 1, 'beads', 'stack', 'rules', 'Vishu|New Year', 'garland', 'Vishu Celebration'],
      ['bihu-dance', 3, 'band', 'stack', 'flourish', 'Bihu|Spring Festival', 'garland', 'Bihu Celebration'],
      ['chhath-puja', 6, 'kolam', 'medallion', 'flourish', 'Chhath Puja|Sun Worship', 'garland', 'Chhath Puja'],
      ['akshaya-tritiya', 1, 'beads', 'stack', 'flourish', 'Akshaya Tritiya|Prosperity', 'garland', 'Akshaya Tritiya'],
      ['teej-festival', 5, 'band', 'stack', 'rules', 'Teej|Monsoon Festival', 'garland', 'Teej Celebration'],
      ['mahavir-jayanti', 5, 'beads', 'medallion', 'caps', 'Mahavir Jayanti|Ahimsa', 'garland', 'Mahavir Jayanti'],
      ['buddha-purnima', 3, 'hairline', 'medallion', 'caps', 'Buddha Purnima|Vesak', 'corners', 'Buddha Purnima'],
      ['rath-yatra', 5, 'band', 'stack', 'diamond', 'Rath Yatra|Chariot Festival', 'garland', 'Rath Yatra'],
      ['hornbill-festival', 1, 'double', 'stack', 'flourish', 'Hornbill|Festival', 'luxury', 'Hornbill Festival'],
      ['eid-crescent', 2, 'band', 'medallion', 'rules', 'Eid|Mubarak', 'corners', 'Eid al-Fitr'],
      ['eid-lantern', 1, 'hairline', 'stack', 'rules', 'Eid|Lanterns', 'wreath', 'Eid Mubarak'],
      ['eid-al-adha', 1, 'band', 'medallion', 'rules', 'Eid al-Adha|Mubarak', 'corners', 'Eid al-Adha'],
      ['ramadan-kareem', 6, 'double', 'stack', 'rules', 'Ramadan|Kareem', 'diagonal', 'Iftar Gathering'],
      ['ramadan-lantern', 2, 'arch', 'stack', 'flourish', 'Ramadan|Mubarak', 'wreath', 'Iftar Evening'],
      ['star-of-bethlehem', 6, 'deco', 'medallion', 'caps', 'Christmas|Guiding Star', 'diagonal', 'Christmas Eve Service'],
      ['christmas-pine', 3, 'hairline', 'medallion', 'flourish', 'Christmas|Cosy Pine', 'vines', 'Christmas Get-Together'],
      ['christmas-bells', 4, 'deco', 'stack', 'rules', 'Christmas|Golden Bells', 'corners', 'Christmas Celebration'],
      ['candy-cane-christmas', 8, 'double', 'stack', 'diamond', 'Christmas|Candy Cane Cheer', 'garland', 'Christmas Party'],
      ['easter-joy', 0, 'hairline', 'medallion', 'caps', 'Easter|Sunday Blessings', 'wreath', 'Easter Sunday'],
      ['easter-flowers', 5, 'arch', 'stack', 'rules', 'Easter|Spring Blooms', 'corners', 'Easter Brunch'],
      ['good-friday', 2, 'hairline', 'stack', 'diamond', 'Good Friday|Reflection', 'wreath', 'Good Friday Service'],
      ['hanukkah-menorah', 7, 'band', 'medallion', 'caps', 'Hanukkah|Festival of Lights', 'diagonal', 'Hanukkah Celebration'],
      ['hanukkah-night', 1, 'arch', 'stack', 'caps', 'Chanukah|Starry Night', 'wreath', 'Chanukah Evening'],
      ['passover-seder', 4, 'hairline', 'stack', 'rules', 'Passover|Seder', 'diagonal', 'Passover Seder'],
      ['rosh-hashanah', 4, 'beads', 'medallion', 'rules', 'Rosh Hashanah|New Year', 'garland', 'Rosh Hashanah Dinner'],
      ['yom-kippur', 7, 'band', 'stack', 'flourish', 'Yom Kippur|Reflection', 'diagonal', 'Yom Kippur Break-Fast'],
      ['vesak-day', 1, 'double', 'medallion', 'flourish', 'Vesak|Enlightenment', 'vines', 'Vesak Day'],
      ['lunar-new-year', 0, 'hairline', 'medallion', 'rules', 'Lunar New Year|Prosperity', 'corners', 'Lunar New Year Dinner'],
      ['spring-festival', 5, 'vine', 'medallion', 'diamond', 'Spring Festival|Good Fortune', 'vines', 'Spring Festival'],
      ['nowruz', 2, 'arch', 'stack', 'flourish', 'Nowruz|New Day', 'wreath', 'Nowruz Celebration'],
      ['nowruz-bloom', 2, 'vine', 'medallion', 'diamond', 'Nowruz|Spring Bloom', 'corners', 'Nowruz Gathering'],
      ['orthodox-christmas', 2, 'band', 'stack', 'caps', 'Orthodox Christmas|Holy Eve', 'vines', 'Orthodox Christmas Eve'],
      ['orthodox-easter', 5, 'hairline', 'medallion', 'rules', 'Pascha|Orthodox Easter', 'wreath', 'Orthodox Easter'],
      ['purim', 9, 'double', 'medallion', 'diamond', 'Purim|Celebration', 'garland', 'Purim Party'],
      ['new-year-clock', 3, 'beads', 'medallion', 'diamond', 'New Year’s Eve|Countdown', 'corners', 'New Year’s Eve Party'],
      ['valentine-love', 4, 'deco', 'stack', 'caps', 'Valentine’s|Day of Love', 'garland', 'Valentine’s Evening'],
      ['valentine-roses', 6, 'arch', 'medallion', 'caps', 'Valentine’s|Roses', 'diagonal', 'Valentine’s Dinner'],
      ['st-patricks-day', 1, 'deco', 'stack', 'flourish', 'St Patrick’s|Day', 'corners', 'St Patrick’s Day'],
      ['halloween-pumpkin', 9, 'hairline', 'medallion', 'flourish', 'Halloween|Jack-o’-Lantern', 'garland', 'Halloween Night'],
      ['halloween-party', 3, 'beads', 'stack', 'rules', 'Halloween|Party', 'diagonal', 'Halloween Party'],
      ['thanksgiving-feast', 6, 'band', 'medallion', 'flourish', 'Thanksgiving|Feast', 'corners', 'Thanksgiving Dinner'],
      ['thanksgiving-harvest', 2, 'hairline', 'medallion', 'diamond', 'Thanksgiving|Harvest', 'garland', 'Thanksgiving Gathering'],
      ['carnival-rio', 9, 'beads', 'medallion', 'diamond', 'Carnival|Rio', 'diagonal', 'Carnival Night'],
      ['mardi-gras', 8, 'hairline', 'stack', 'flourish', 'Mardi Gras|Festivities', 'garland', 'Mardi Gras Party'],
      ['oktoberfest', 2, 'deco', 'stack', 'rules', 'Oktoberfest|Prost', 'diagonal', 'Oktoberfest Party'],
      ['cinco-de-mayo', 3, 'kolam', 'stack', 'flourish', 'Cinco de Mayo|Fiesta', 'garland', 'Fiesta Night'],
      ['bastille-day', 2, 'double', 'stack', 'caps', 'Bastille Day|Fête', 'diagonal', 'Bastille Day Soirée'],
      ['australia-day', 9, 'hairline', 'stack', 'diamond', 'Australia Day|Celebration', 'garland', 'Australia Day BBQ'],
      ['canada-day', 0, 'vine', 'medallion', 'rules', 'Canada Day|Celebration', 'corners', 'Canada Day Party'],
      ['independence-day', 9, 'beads', 'stack', 'diamond', 'Fourth of July|Celebration', 'garland', 'Fourth of July BBQ'],
      ['boxing-day', 3, 'double', 'stack', 'caps', 'Boxing Day|Gathering', 'diagonal', 'Boxing Day Brunch'],
      ['mothers-day', 4, 'deco', 'stack', 'rules', 'Mother’s Day|With Love', 'corners', 'Mother’s Day Brunch'],
      ['fathers-day', 4, 'band', 'stack', 'caps', 'Father’s Day|With Love', 'wreath', 'Father’s Day Lunch'],
      ['grandparents-day', 3, 'arch', 'medallion', 'rules', 'Grandparents’ Day|With Love', 'vines', 'Grandparents’ Day'],
      ['womens-day', 3, 'vine', 'stack', 'diamond', 'Women’s Day|Celebrating Her', 'wreath', 'Women’s Day Celebration'],
      ['earth-day', 0, 'hairline', 'stack', 'rules', 'Earth Day|Act Green', 'corners', 'Earth Day Drive'],
      ['environment-day', 2, 'arch', 'medallion', 'diamond', 'Environment Day|Go Green', 'vines', 'World Environment Day'],
      ['friendship-day', 4, 'hairline', 'stack', 'caps', 'Friendship Day|Together', 'garland', 'Friendship Day Meet'],
      ['world-music-day', 5, 'vine', 'medallion', 'rules', 'Music Day|Play On', 'corners', 'World Music Day'],
      ['childrens-day', 9, 'hairline', 'stack', 'caps', 'Children’s Day|Fun & Joy', 'garland', 'Children’s Day'],
      ['babys-first-festival', 8, 'beads', 'stack', 'caps', 'Baby’s First|Festival', 'corners', 'Baby’s First Festival'],
      ['babys-first-diwali', 8, 'double', 'stack', 'flourish', 'Baby’s First|Diwali', 'diagonal', 'Baby’s First Diwali'],
      ['babys-first-christmas', 8, 'hairline', 'stack', 'caps', 'Baby’s First|Christmas', 'corners', 'Baby’s First Christmas'],
      ['babys-first-eid', 8, 'beads', 'medallion', 'rules', 'Baby’s First|Eid', 'garland', 'Baby’s First Eid'],
      ['babys-first-holi', 8, 'hairline', 'stack', 'diamond', 'Baby’s First|Holi', 'diagonal', 'Baby’s First Holi'],
      ['family-celebration', 3, 'vine', 'medallion', 'caps', 'Family|Celebration', 'vines', 'Family Celebration'],
      ['family-reunion', 3, 'hairline', 'stack', 'flourish', 'Family|Reunion', 'wreath', 'Family Reunion'],
      ['kids-festival', 9, 'double', 'stack', 'caps', 'Kids Festival|Fun Day', 'diagonal', 'Kids’ Festival'],
      ['school-celebration', 4, 'beads', 'medallion', 'rules', 'School|Celebration', 'corners', 'School Celebration'],
      ['community-celebration', 5, 'band', 'stack', 'flourish', 'Community|Celebration', 'garland', 'Community Festival'],
      ['cultural-day', 6, 'beads', 'medallion', 'caps', 'Cultural Day|Celebration', 'luxury', 'Cultural Day'],
      ['food-festival', 4, 'hairline', 'stack', 'caps', 'Food Festival|Feast', 'garland', 'Food Festival'],
      ['summer-festival', 3, 'beads', 'medallion', 'rules', 'Summer Festival|Sunshine', 'diagonal', 'Summer Festival'],
      ['kids-carnival', 8, 'hairline', 'stack', 'diamond', 'Kids Carnival|Fun Fair', 'garland', 'Kids’ Carnival'],
      ['christmas-eve', 1, 'deco', 'stack', 'caps', 'Christmas Eve|Magic', 'corners', 'Christmas Eve Dinner']
    ],
    'school-events': [
      ['school-annual-day', 9, 'hairline', 'medallion', 'diamond', 'Annual Day|Celebration', 'corners', 'School Annual Day'],
      ['school-sports-day', 3, 'double', 'medallion', 'diamond', 'Sports Day|Annual Meet', 'diagonal', 'Annual Sports Meet'],
      ['school-cultural-day', 1, 'band', 'medallion', 'rules', 'Cultural Day|Celebration', 'garland', 'School Cultural Day'],
      ['school-annual-function', 3, 'beads', 'stack', 'caps', 'Annual Function|An Evening of Stars', 'corners', 'Annual Function'],
      ['school-graduation-ceremony', 0, 'band', 'medallion', 'diamond', 'Graduation|Ceremony', 'luxury', 'Class XII Graduation'],
      ['school-farewell', 6, 'arch', 'stack', 'flourish', 'Farewell|To Our Seniors', 'corners', 'Senior Farewell'],
      ['school-foundation-day', 6, 'hairline', 'stack', 'flourish', 'Foundation Day|Celebration', 'wreath', 'School Foundation Day'],
      ['school-founders-day', 2, 'deco', 'medallion', 'caps', 'Founders’ Day|In Honour', 'vines', 'Founders’ Day'],
      ['school-open-house', 2, 'double', 'stack', 'caps', 'Open House|Welcome', 'wreath', 'School Open House'],
      ['parent-teacher-meeting', 6, 'band', 'medallion', 'caps', 'Parent Teacher|Meeting', 'diagonal', 'Parent Teacher Meeting'],
      ['school-science-exhibition', 4, 'hairline', 'stack', 'rules', 'Science|Exhibition', 'corners', 'Science Exhibition'],
      ['school-art-exhibition', 2, 'deco', 'medallion', 'diamond', 'Art Exhibition|Young Masters', 'diagonal', 'Art Exhibition'],
      ['school-talent-show', 6, 'double', 'stack', 'diamond', 'Talent Show|Showtime', 'wreath', 'School Talent Show'],
      ['school-music-concert', 2, 'hairline', 'medallion', 'caps', 'Music Concert|Annual', 'corners', 'School Music Concert'],
      ['school-dance-performance', 9, 'beads', 'stack', 'flourish', 'Dance|Performance', 'diagonal', 'Annual Dance Recital'],
      ['school-prize-distribution', 6, 'band', 'stack', 'caps', 'Prize Day|Distribution', 'luxury', 'Prize Distribution Day'],
      ['school-awards-ceremony', 6, 'deco', 'stack', 'flourish', 'Awards|Ceremony', 'luxury', 'Annual Awards Ceremony'],
      ['school-independence-day', 3, 'band', 'stack', 'caps', 'Independence Day|Celebration', 'garland', 'Independence Day Assembly'],
      ['school-republic-day', 6, 'beads', 'medallion', 'caps', 'Republic Day|Celebration', 'garland', 'Republic Day Celebration'],
      ['school-teachers-day', 7, 'deco', 'stack', 'rules', 'Teachers’ Day|With Thanks', 'corners', 'Teachers’ Day'],
      ['school-childrens-day', 9, 'double', 'medallion', 'flourish', 'Children’s Day|Fun & Joy', 'garland', 'Children’s Day Celebration'],
      ['school-orientation-day', 2, 'beads', 'medallion', 'rules', 'Orientation|Welcome', 'diagonal', 'Orientation Day'],
      ['school-welcome-ceremony', 0, 'hairline', 'stack', 'caps', 'Welcome|Ceremony', 'vines', 'Welcome Ceremony'],
      ['school-graduation-party', 9, 'beads', 'medallion', 'diamond', 'Graduation|Party', 'garland', 'Graduation Party']
    ],
    'college-events': [
      ['college-fest', 9, 'double', 'stack', 'flourish', 'College Fest|Three Days Live', 'garland', 'Rhythm 2026'],
      ['culturals-night', 5, 'beads', 'stack', 'rules', 'Culturals|Night', 'garland', 'Cultural Night'],
      ['tech-symposium', 1, 'double', 'stack', 'flourish', 'Tech Symposium|Innovate', 'wreath', 'National Tech Symposium'],
      ['freshers-party', 4, 'hairline', 'stack', 'rules', 'Freshers|Party', 'garland', 'Freshers’ Party'],
      ['college-annual-day', 2, 'deco', 'medallion', 'caps', 'Annual Day|College', 'corners', 'College Annual Day'],
      ['grand-college-fest', 2, 'double', 'stack', 'diamond', 'Grand Fest|Campus Festival', 'diagonal', 'Grand Campus Fest'],
      ['freshers-welcome', 9, 'deco', 'medallion', 'flourish', 'Welcome|Freshers', 'garland', 'Freshers’ Welcome'],
      ['college-farewell-party', 2, 'beads', 'stack', 'rules', 'Farewell|Party', 'diagonal', 'College Farewell'],
      ['graduation-ceremony', 1, 'hairline', 'medallion', 'rules', 'Graduation|Ceremony', 'vines', 'Graduation Ceremony 2026'],
      ['convocation-ceremony', 4, 'double', 'stack', 'rules', 'Convocation|Ceremony', 'luxury', 'Annual Convocation'],
      ['orientation-day', 4, 'deco', 'medallion', 'rules', 'Orientation|Day', 'luxury', 'Orientation Day'],
      ['freshers-orientation', 3, 'double', 'stack', 'caps', 'Orientation|Freshers', 'diagonal', 'Freshers’ Orientation'],
      ['alumni-meet', 5, 'vine', 'medallion', 'caps', 'Alumni Meet|Homecoming', 'corners', 'Alumni Meet 2026'],
      ['alumni-reunion', 2, 'band', 'medallion', 'caps', 'Reunion|Alumni', 'vines', 'Alumni Reunion'],
      ['cultural-fest', 3, 'kolam', 'stack', 'diamond', 'Cultural Fest|Celebration', 'garland', 'Cultural Fest 2026'],
      ['college-sports-day', 6, 'band', 'medallion', 'diamond', 'Sports Day|Annual Meet', 'diagonal', 'Annual Sports Day'],
      ['inter-college-sports-meet', 4, 'deco', 'stack', 'caps', 'Sports Meet|Inter-College', 'luxury', 'Inter-College Sports Meet'],
      ['college-tech-fest', 6, 'double', 'medallion', 'caps', 'Tech Fest|Code & Create', 'luxury', 'Tech Fest 2026'],
      ['hackathon', 7, 'hairline', 'medallion', 'caps', 'Hackathon|Build Overnight', 'vines', 'Forty-Eight Hour Hackathon'],
      ['science-exhibition', 2, 'deco', 'medallion', 'rules', 'Science|Exhibition', 'garland', 'Department Science Exhibition'],
      ['college-art-exhibition', 4, 'hairline', 'stack', 'diamond', 'Art Exhibition|Students', 'diagonal', 'Student Art Exhibition'],
      ['music-festival', 3, 'beads', 'medallion', 'diamond', 'Music Festival|Campus', 'corners', 'Campus Music Festival'],
      ['college-dance-night', 4, 'deco', 'stack', 'caps', 'Dance Night|College', 'diagonal', 'College Dance Night'],
      ['talent-show', 1, 'double', 'medallion', 'diamond', 'Talent Show|Auditions Open', 'corners', 'Open Talent Show'],
      ['college-debate-competition', 2, 'band', 'stack', 'diamond', 'Debate|Competition', 'wreath', 'Inter-College Debate'],
      ['quiz-competition', 6, 'arch', 'stack', 'rules', 'Quiz|Finals', 'diagonal', 'Grand Quiz Finals'],
      ['seminar', 2, 'deco', 'stack', 'diamond', 'Seminar|Series', 'vines', 'Campus Seminar Series'],
      ['guest-lecture', 5, 'arch', 'medallion', 'flourish', 'Guest Lecture|Distinguished', 'wreath', 'Distinguished Guest Lecture'],
      ['workshop', 4, 'hairline', 'stack', 'flourish', 'Workshop|Hands-On', 'diagonal', 'Skills Workshop'],
      ['career-fair', 0, 'band', 'stack', 'diamond', 'Career Fair|Opportunities', 'luxury', 'Annual Career Fair'],
      ['placement-drive', 6, 'arch', 'stack', 'diamond', 'Placement|Drive', 'vines', 'Campus Placement Drive'],
      ['college-awards-night', 0, 'band', 'medallion', 'rules', 'Awards Night|College', 'luxury', 'College Awards Night'],
      ['student-achievement-ceremony', 0, 'double', 'stack', 'rules', 'Achievement|Ceremony', 'luxury', 'Student Achievement Ceremony'],
      ['college-foundation-day', 0, 'band', 'medallion', 'caps', 'Foundation Day|College', 'luxury', 'College Foundation Day'],
      ['college-club-event', 4, 'arch', 'medallion', 'rules', 'Club Day|Open House', 'diagonal', 'Clubs Open House'],
      ['college-graduation-party', 4, 'beads', 'medallion', 'flourish', 'Graduation|Party', 'garland', 'Graduation Party']
    ],
    party: [
      ['house-party', 9, 'deco', 'medallion', 'caps', 'House Party|Let’s Celebrate', 'corners', 'House Party'],
      ['rooftop-night', 3, 'double', 'stack', 'rules', 'Rooftop|Night', 'garland', 'Rooftop Night'],
      ['dinner-party', 7, 'band', 'medallion', 'diamond', 'Dinner Party|An Evening', 'luxury', 'Dinner Party'],
      ['pool-party', 2, 'double', 'stack', 'caps', 'Pool Party|Summer Splash', 'diagonal', 'Pool Party'],
      ['birthday-party', 3, 'beads', 'stack', 'caps', 'Birthday|Bash', 'corners', 'Birthday Bash'],
      ['surprise-party', 3, 'double', 'stack', 'caps', 'Surprise|Shh It’s a Secret', 'garland', 'Surprise Party'],
      ['cocktail-party', 0, 'band', 'medallion', 'rules', 'Cocktails|Party', 'luxury', 'Cocktail Party'],
      ['garden-fete', 2, 'vine', 'stack', 'flourish', 'Garden Fete|Celebration', 'wreath', 'Garden Fete'],
      ['beach-party', 9, 'hairline', 'medallion', 'diamond', 'Beach Party|Sun & Sand', 'corners', 'Beach Party'],
      ['family-party', 9, 'beads', 'medallion', 'flourish', 'Family|Get-Together', 'garland', 'Family Get-Together'],
      ['friends-party', 3, 'deco', 'medallion', 'flourish', 'Friends|Get-Together', 'diagonal', 'Friends Night'],
      ['dance-party', 3, 'hairline', 'medallion', 'caps', 'Dance|All Night', 'corners', 'Dance Party'],
      ['music-party', 0, 'double', 'stack', 'rules', 'Music Night|Party', 'luxury', 'Music Night'],
      ['karaoke-party', 9, 'deco', 'medallion', 'diamond', 'Karaoke|Night', 'garland', 'Karaoke Night'],
      ['game-night', 4, 'hairline', 'stack', 'flourish', 'Game Night|Play On', 'corners', 'Game Night'],
      ['movie-night', 4, 'double', 'stack', 'flourish', 'Movie Night|Now Showing', 'diagonal', 'Movie Night'],
      ['pajama-party', 8, 'hairline', 'medallion', 'caps', 'Pajama Party|Sleepover', 'corners', 'Pajama Party'],
      ['bbq-party', 2, 'double', 'stack', 'diamond', 'BBQ|Backyard Party', 'garland', 'Backyard BBQ'],
      ['picnic-party', 2, 'arch', 'medallion', 'diamond', 'Picnic|In the Park', 'vines', 'Picnic in the Park'],
      ['brunch-party', 3, 'vine', 'stack', 'caps', 'Brunch|Weekend', 'corners', 'Weekend Brunch'],
      ['tea-party', 0, 'arch', 'stack', 'flourish', 'Tea Party|Afternoon', 'wreath', 'Afternoon Tea Party'],
      ['lunch-party', 4, 'deco', 'stack', 'caps', 'Lunch|With Friends', 'diagonal', 'Lunch with Friends'],
      ['dinner-celebration', 1, 'double', 'medallion', 'diamond', 'Dinner|Celebration', 'luxury', 'Dinner Celebration'],
      ['anniversary-party', 4, 'deco', 'medallion', 'flourish', 'Anniversary|Party', 'luxury', 'Anniversary Party'],
      ['engagement-party', 2, 'double', 'medallion', 'flourish', 'Engagement|Party', 'garland', 'Engagement Party'],
      ['graduation-bash', 4, 'deco', 'stack', 'caps', 'Graduation|Bash', 'diagonal', 'Graduation Bash'],
      ['welcome-party', 4, 'hairline', 'medallion', 'rules', 'Welcome|Party', 'garland', 'Welcome Party'],
      ['farewell-party', 0, 'band', 'medallion', 'diamond', 'Farewell|Party', 'luxury', 'Farewell Party'],
      ['welcome-home-party', 3, 'double', 'stack', 'diamond', 'Welcome Home|Party', 'diagonal', 'Welcome Home'],
      ['holiday-party', 2, 'beads', 'medallion', 'diamond', 'Holiday|Party', 'corners', 'Holiday Party'],
      ['christmas-party', 3, 'arch', 'stack', 'flourish', 'Christmas|Party', 'vines', 'Christmas Party'],
      ['new-year-party', 7, 'deco', 'medallion', 'diamond', 'New Year|Party', 'luxury', 'New Year’s Eve Party'],
      ['halloween-bash', 4, 'hairline', 'medallion', 'diamond', 'Halloween|Bash', 'corners', 'Halloween Night'],
      ['masquerade-party', 1, 'band', 'medallion', 'diamond', 'Masquerade|Ball', 'luxury', 'Masquerade Ball'],
      ['disco-party', 0, 'deco', 'medallion', 'flourish', 'Disco|Fever', 'luxury', 'Disco Night'],
      ['retro-bash', 2, 'hairline', 'stack', 'rules', 'Retro|Bash', 'diagonal', 'Seventies Night'],
      ['neon-bash', 1, 'deco', 'stack', 'diamond', 'Neon|Glow Party', 'luxury', 'Neon Glow Party'],
      ['elegant-black-tie-party', 1, 'double', 'medallion', 'caps', 'Black Tie|Soirée', 'luxury', 'Black Tie Soirée'],
      ['luxury-celebration', 6, 'deco', 'medallion', 'flourish', 'Luxury|Celebration', 'luxury', 'Luxury Celebration'],
      ['kids-party', 8, 'hairline', 'medallion', 'caps', 'Kids Party|Fun Time', 'garland', 'Kids Party'],
      ['teen-party', 2, 'double', 'stack', 'diamond', 'Teen Party|Hangout', 'corners', 'Teen Hangout'],
      ['celebration-party', 2, 'beads', 'medallion', 'flourish', 'Celebrate|Party Time', 'garland', 'Celebration Party']
    ],
    'community-events': [
      ['community-gathering', 4, 'deco', 'stack', 'flourish', 'Gathering|Community', 'vines', 'Residents Association Meet'],
      ['neighborhood-celebration', 7, 'band', 'medallion', 'rules', 'Neighbourhood|Celebration', 'luxury', 'Neighbourhood Celebration'],
      ['community-festival', 4, 'double', 'stack', 'caps', 'Festival|Community', 'corners', 'Community Festival'],
      ['local-cultural-festival', 6, 'kolam', 'medallion', 'rules', 'Cultural Festival|Local', 'garland', 'Local Cultural Festival'],
      ['community-picnic', 5, 'vine', 'stack', 'rules', 'Picnic|Community', 'wreath', 'Community Picnic'],
      ['neighborhood-bbq', 4, 'double', 'medallion', 'rules', 'BBQ|Neighbourhood', 'garland', 'Neighbourhood BBQ'],
      ['community-fair', 8, 'beads', 'stack', 'flourish', 'Fair|Community', 'diagonal', 'Community Fair'],
      ['charity-fundraiser', 2, 'deco', 'medallion', 'diamond', 'Fundraiser|Charity', 'garland', 'Charity Fundraiser Gala'],
      ['charity-walk', 5, 'vine', 'medallion', 'flourish', 'Charity Walk|Together', 'wreath', 'Charity Walk'],
      ['community-clean-up', 3, 'arch', 'stack', 'diamond', 'Clean-Up|Drive', 'corners', 'Community Clean-Up Drive'],
      ['tree-planting-day', 0, 'vine', 'medallion', 'flourish', 'Tree Planting|Day', 'vines', 'Tree Planting Day'],
      ['local-food-festival', 2, 'hairline', 'stack', 'flourish', 'Food Festival|Local', 'wreath', 'Local Food Festival'],
      ['community-sports-day', 9, 'double', 'medallion', 'flourish', 'Sports Day|Community', 'diagonal', 'Community Sports Day'],
      ['family-community-day', 9, 'hairline', 'stack', 'caps', 'Family Day|Community', 'corners', 'Family Community Day'],
      ['senior-community-gathering', 0, 'arch', 'stack', 'rules', 'Seniors|Gathering', 'vines', 'Seniors’ Get-Together'],
      ['community-volunteer-day', 7, 'hairline', 'medallion', 'rules', 'Volunteer Day|Community', 'corners', 'Community Volunteer Day'],
      ['cultural-heritage-celebration', 1, 'kolam', 'medallion', 'rules', 'Heritage|Celebration', 'garland', 'Cultural Heritage Day'],
      ['community-awareness-event', 6, 'hairline', 'stack', 'rules', 'Awareness|Community', 'vines', 'Community Awareness Drive'],
      ['community-appreciation-day', 7, 'band', 'stack', 'caps', 'Appreciation|Day', 'luxury', 'Community Appreciation Day']
    ]
    /* EVENT_ROWS END */
  };
  Object.keys(OCCASION_ROWS).forEach(function (cat) {
    OCCASION_ROWS[cat].forEach(function (r) {
      var dir = 'images/' + cat + '/' + r[0] + '/';
      ENGAGEMENT_DESIGNS[r[0]] = { family: cat, layout: 'engagement', frame: r[2], date: r[3], heading: r[4], font: r[1], names: 'solo', venue: 'split', events: 'cards',
        lineArt: 'rose', decor: dir, decorStyle: r[6], venueDefault: dir + 'venue.jpg', title: r[5], mainEvent: null, sampleYears: typeof r[7] === 'number' ? r[7] : null, sampleTitle: typeof r[7] === 'string' ? r[7] : null };
    });
  });
  /* Backdrop cards (the generated-backgrounds look): a painted FLUX.2 Klein 4B
     background with an illustrated border and a plain centre, the text on top.
     Art in images/backdrops/<slug>/ (scripts/backdrop-briefs.js, generate-backdrops.js).
     [slug, category, font, date, heading, title, extra]; written by scripts/build-backdrop-rows.js.
     Weddings keep their engine spec and only take the backdrop (BACKDROP_WEDDING). */
  var BACKDROP_ROWS = [
    /* BACKDROP_ROWS START */
    ["watercolor-blush-wedding", "wedding", 2, "stack", "caps", "", null],
    ["midnight-gold-wedding", "wedding", 0, "stack", "diamond", "", null],
    ["jasmine-temple-wedding", "wedding", 5, "medallion", "rules", "", null],
    ["watercolor-promise-engagement", "engagement", 3, "stack", "rules", "Engagement|Ring Ceremony", null],
    ["emerald-gold-engagement", "engagement", 1, "medallion", "diamond", "Engagement|Ring Ceremony", null],
    ["lavender-mist-engagement", "engagement", 3, "medallion", "flourish", "Engagement|In Bloom", null],
    ["marigold-roka", "engagement", 5, "stack", "caps", "Roka|Ceremony", "Roka Ceremony"],
    ["starlit-velvet-engagement", "engagement", 1, "stack", "diamond", "Engagement|Under the Stars", null],
    ["champagne-watercolor-reception", "reception", 0, "stack", "rules", "Reception|Wedding Celebration", null],
    ["noir-gold-reception", "reception", 1, "medallion", "diamond", "Reception|Evening Soirée", null],
    ["teal-garden-reception", "reception", 6, "stack", "rules", "Reception|Garden Evening", null],
    ["watercolor-balloons-birthday", "birthday", 8, "stack", "diamond", "Hooray|Birthday Party", [5,"kid"]],
    ["golden-sparkle-birthday", "birthday", 6, "medallion", "rules", "Celebrate|Birthday Soirée", [30,"adult"]],
    ["floral-garden-birthday", "birthday", 6, "stack", "flourish", "In Full Bloom|Birthday Celebration", [50,"adult"]],
    ["space-adventure-birthday", "birthday", 0, "stack", "flourish", "Blast Off|Space Birthday Party", [7,"kid"]],
    ["watercolor-clouds-shower", "baby-shower", 2, "stack", "rules", "Oh Baby|Baby Shower", null],
    ["blush-blooms-shower", "baby-shower", 5, "medallion", "flourish", "Sweet Baby|Baby Shower", null],
    ["teddy-garden-shower", "baby-shower", 6, "stack", "flourish", "Teddy Love|Baby Shower", null],
    ["godh-bharai-blessings", "baby-shower", 3, "stack", "flourish", "Godh Bharai|Baby Shower", null],
    ["watercolor-cradle-naming", "naming-ceremony", 2, "medallion", "flourish", "Little Blessing|Naming Ceremony", null],
    ["golden-lotus-naming", "naming-ceremony", 1, "stack", "rules", "Namakarana|Naming Ceremony", null],
    ["mint-leaves-naming", "naming-ceremony", 5, "stack", "caps", "A Sweet Name|Naming Ceremony", null],
    ["starry-moon-naming", "naming-ceremony", 0, "medallion", "caps", "Twinkle Star|Naming Ceremony", null],
    ["watercolor-home-garden", "house-warming", 0, "stack", "flourish", "Home Sweet Home|Housewarming", null],
    ["golden-toran-griha", "house-warming", 1, "stack", "caps", "Griha Pravesh|Housewarming Ceremony", null],
    ["sage-door-housewarming", "house-warming", 2, "stack", "diamond", "Open Doors|Housewarming", null],
    ["kolam-welcome-housewarming", "house-warming", 3, "medallion", "diamond", "Shubh Aarambh|Griha Pravesh", null],
    ["watercolor-roses-anniversary", "anniversary", 5, "medallion", "flourish", "Happy Anniversary|Anniversary", 10],
    ["silver-moonlight-anniversary", "anniversary", 4, "stack", "caps", "Silver Jubilee|Anniversary", 25],
    ["golden-vines-anniversary", "anniversary", 6, "stack", "flourish", "Golden Jubilee|Anniversary", 50],
    ["peony-love-anniversary", "anniversary", 6, "medallion", "diamond", "Still in Love|Anniversary", 15],
    ["pearl-lace-anniversary", "anniversary", 3, "stack", "rules", "Pearl|Anniversary", 30],
    ["watercolor-laurel-graduation", "graduation", 2, "stack", "flourish", "Congratulations|Graduation", "Class of 2027"],
    ["navy-gold-convocation", "graduation", 4, "stack", "flourish", "Convocation|Ceremony", "Convocation 2027"],
    ["confetti-grad-party", "graduation", 6, "stack", "caps", "Grad Party|Celebration", "Graduation Party"],
    ["maroon-scroll-graduation", "graduation", 0, "medallion", "flourish", "Proud Graduate|Celebration", "Master of Science"],
    ["watercolor-sunset-retirement", "retirement", 0, "medallion", "caps", "Happy Retirement|Celebration", "The Next Adventure"],
    ["golden-laurel-retirement", "retirement", 0, "medallion", "rules", "With Honour|Retirement", "A Life Well Served"],
    ["garden-bloom-retirement", "retirement", 2, "medallion", "diamond", "Time to Bloom|Retirement", "Time to Relax"],
    ["coastal-breeze-retirement", "retirement", 2, "medallion", "caps", "Smooth Sailing|Retirement", "Smooth Sailing Ahead"],
    ["vintage-clock-retirement", "retirement", 0, "stack", "rules", "Time Well Spent|Retirement", "Thirty Years of Service"],
    ["watercolor-paper-planes", "farewell", 5, "medallion", "diamond", "Bon Voyage|Farewell", "Farewell Party"],
    ["starry-road-farewell", "farewell", 7, "stack", "diamond", "Until We Meet Again|Farewell", "One Last Evening"],
    ["blossom-goodbye-farewell", "farewell", 2, "stack", "rules", "Fond Farewell|Celebration", "With Best Wishes"],
    ["golden-toast-farewell", "farewell", 1, "medallion", "flourish", "Cheers|To New Beginnings", "Farewell Dinner"],
    ["watercolor-skyline-corporate", "corporate", 3, "stack", "diamond", "Summit|Annual Conference", "Annual Business Summit"],
    ["navy-gold-gala-corporate", "corporate", 6, "stack", "rules", "Gala Night|Corporate", "Annual Corporate Gala"],
    ["emerald-geometric-corporate", "corporate", 0, "stack", "caps", "Leadership|Forum", "Leadership Forum 2027"],
    ["watercolor-diya-festival", "festival", 5, "stack", "rules", "Deepavali|Festival of Lights", "Deepavali Celebration"],
    ["watercolor-christmas", "festival", 6, "stack", "rules", "Merry Christmas|Celebration", "Christmas Get-Together"],
    ["golden-eid-arch", "festival", 4, "stack", "caps", "Eid Mubarak|Celebration", "Eid Mubarak"],
    ["watercolor-crayons-school", "school-events", 5, "stack", "caps", "Annual Day|Celebration", "School Annual Day"],
    ["chalkboard-school-event", "school-events", 4, "stack", "diamond", "Science Fair|Exhibition", "Science Exhibition"],
    ["sports-pennant-school", "school-events", 3, "stack", "diamond", "Sports Day|Annual Meet", "Annual Sports Meet"],
    ["neon-fest-college", "college-events", 4, "stack", "rules", "Fest Night|Campus Festival", "Campus Fest 2027"],
    ["watercolor-campus-college", "college-events", 0, "stack", "rules", "Alumni Meet|Homecoming", "Alumni Meet 2027"],
    ["circuit-tech-college", "college-events", 0, "stack", "flourish", "Tech Fest|Innovate", "Tech Fest 2027"],
    ["watercolor-confetti-party", "party", 2, "stack", "rules", "Let’s Party|Celebration", "Weekend Party"],
    ["disco-night-party", "party", 0, "medallion", "caps", "Disco Night|Party", "Disco Night"],
    ["tropical-fiesta-party", "party", 3, "stack", "diamond", "Tropical|Fiesta", "Tropical Fiesta"],
    ["watercolor-neighbourhood", "community-events", 5, "medallion", "caps", "Neighbourhood|Get-Together", "Neighbourhood Get-Together"],
    ["green-earth-community", "community-events", 0, "medallion", "diamond", "Go Green|Community Drive", "Tree Planting Drive"],
    ["marigold-cultural-community", "community-events", 0, "medallion", "diamond", "Cultural Evening|Community", "Cultural Evening"],
    ["charity-hearts-community", "community-events", 0, "stack", "flourish", "Give Back|Charity", "Charity Fundraiser"],
    ["picnic-day-community", "community-events", 2, "stack", "diamond", "Picnic Day|Community", "Community Picnic Day"]
    /* BACKDROP_ROWS END */
  ];
  var BACKDROP_WEDDING = {};
  BACKDROP_ROWS.forEach(function (r) {
    var dir = 'images/backdrops/' + r[0] + '/', cat = r[1], x = r[6];
    if (cat === 'wedding') { BACKDROP_WEDDING[r[0]] = dir; return; }
    ENGAGEMENT_DESIGNS[r[0]] = { family: cat, layout: 'engagement', frame: 'hairline', date: r[3], heading: r[4], font: r[2],
      names: cat === 'engagement' || cat === 'reception' ? 'row' : 'solo', venue: 'split', events: 'cards',
      lineArt: 'rose', decor: dir, decorStyle: 'backdrop', venueDefault: dir + 'venue.jpg', title: r[5] || null,
      mainEvent: cat === 'engagement' && typeof x === 'string' ? x : null,
      sampleAge: cat === 'birthday' && x ? x[0] : null, audience: cat === 'birthday' && x ? x[1] : null,
      sampleYears: typeof x === 'number' ? x : null, sampleTitle: cat !== 'engagement' && typeof x === 'string' ? x : null };
  });
  /* Engagement wording and ceremony names (the editor's defaults are the wedding ones). */
  var WEDDING_SUBTITLE = 'We joyfully invite you to celebrate the wedding of';
  var ENGAGEMENT_SUBTITLE = 'We joyfully invite you to celebrate the engagement of';
  /* A real engagement has the ring ceremony and a lunch or dinner, nothing more. */
  var ENGAGEMENT_EVENTS = { wedding: 'Ring Ceremony', reception: 'Engagement Dinner' };
  /* Wording per occasion for cards beyond weddings (engagement, reception, ...). */
  var OCCASIONS = {
    engagement: { subtitle: ENGAGEMENT_SUBTITLE, saveDate: 'Save the date for our engagement', programme: 'The engagement programme', title: 'Engagement|Ring Ceremony',
      events: { wedding: 'Ring Ceremony', reception: 'meal' } },
    reception: { subtitle: 'We joyfully invite you to celebrate the wedding reception of', saveDate: 'Save the date for our reception', programme: 'The reception programme', title: 'Reception|Dinner & Celebration',
      events: { wedding: 'Welcome & Cocktails', reception: 'Dinner & Dance' } },
    birthday: { subtitle: 'Please join us to celebrate the birthday of', saveDate: 'Save the date', programme: '', title: 'Happy Birthday|Birthday Celebration', events: {} },
    /* One-name occasions (occasionBody): who the card names, the closing words. */
    'baby-shower': { subtitle: 'Please join us for a baby shower in honour of', saveDate: 'Save the date', title: 'Oh Baby|Baby Shower', events: {},
      fallbackName: 'The Parents-to-be', message: 'With love and blessings', closing: ['Your blessings mean the world', 'We can’t wait to welcome our little one with you.'] },
    'naming-ceremony': { subtitle: 'Please join us for the naming ceremony of', saveDate: 'Save the date', title: 'Namakarana|Naming Ceremony', events: {},
      fallbackName: 'Our Little One', message: 'Bless our little one', closing: ['Your blessings mean the world', 'Please join us to shower our little one with love.'] },
    'house-warming': { subtitle: 'Please join us as we step into our new home', saveDate: 'Save the date', title: 'Griha Pravesh|Housewarming', events: {},
      fallbackName: 'The Family', message: 'Bless our new home', closing: ['Your presence makes it home', 'We look forward to welcoming you to our new home.'] },
    anniversary: { subtitle: 'Please join us to celebrate the anniversary of', saveDate: 'Save the date', title: 'Happy Anniversary|Anniversary', events: {},
      fallbackName: 'The Happy Couple', message: 'A journey of love', closing: ['Your presence is the best gift', 'Thank you for being part of our journey.'] },
    /* Graduation ... community events. nameFrom 'title': the event's own name leads
       the card (a summit, a festival); details: fields shown under the name. */
    graduation: { subtitle: 'Please join us to celebrate the graduation of', saveDate: 'Save the date', title: 'Graduation|Celebration', events: {},
      fallbackName: 'The Graduate', message: 'Hard work, rewarded', details: ['classCourse', 'organization'], closing: ['Your presence means the world', 'Thank you for being part of this journey.'] },
    retirement: { subtitle: 'Please join us to honour the retirement of', saveDate: 'Save the date', title: 'Happy Retirement|Celebration', events: {},
      fallbackName: 'Our Colleague', message: 'With gratitude', details: ['role'], years: 'yearsOfService', closing: ['Thank you for the memories', 'Join us in wishing a happy retirement.'] },
    farewell: { subtitle: 'Please join us to bid farewell to', saveDate: 'Save the date', title: 'Farewell|Celebration', events: {},
      fallbackName: 'Our Colleague', message: 'Thank you for the memories', details: ['role'], closing: ['Until we meet again', 'Come and share one more evening of memories.'] },
    corporate: { subtitle: 'We are pleased to invite you to', saveDate: 'Save the date', title: 'You’re Invited|Corporate Event', events: {}, nameFrom: 'title',
      fallbackName: 'Our Event', message: 'About the event', details: ['organization', 'eventKind', 'department'], closing: ['We look forward to welcoming you', 'Kindly confirm your attendance.'] },
    festival: { subtitle: 'Please join us to celebrate', saveDate: 'Save the date', title: 'Festive|Celebration', events: {}, nameFrom: 'title',
      fallbackName: 'The Festival', message: 'Festive wishes', details: [], closing: ['Wishing you joy and light', 'Celebrate with us and make it brighter.'] },
    'school-events': { subtitle: 'We cordially invite you to', saveDate: 'Save the date', title: 'You’re Invited|School Event', events: {}, nameFrom: 'title',
      fallbackName: 'Our School Event', message: 'About the event', details: ['organization', 'eventKind', 'classCourse'], closing: ['Your presence will inspire our students', 'We look forward to seeing you.'] },
    'college-events': { subtitle: 'We cordially invite you to', saveDate: 'Save the date', title: 'You’re Invited|College Event', events: {}, nameFrom: 'title',
      fallbackName: 'Campus Event', message: 'About the event', details: ['organization', 'eventKind', 'department'], closing: ['Be there, be part of it', 'See you on campus.'] },
    party: { subtitle: 'Please join us for', saveDate: 'Save the date', title: 'Let’s Party|Celebration', events: {}, nameFrom: 'title',
      fallbackName: 'The Party', message: 'Join the fun', details: ['theme'], honoree: 'personName', closing: ['The more, the merrier', 'We can’t wait to celebrate with you.'] },
    'community-events': { subtitle: 'We warmly invite you to', saveDate: 'Save the date', title: 'Gathering|Community', events: {}, nameFrom: 'title',
      fallbackName: 'Community Gathering', message: 'About the event', details: ['organization', 'eventKind'], closing: ['Together we make it special', 'Everyone is welcome, bring a neighbour.'] }
  };
  function engagementMealTitle(time) { return /^(0\d|1[0-5]):/.test(time || '') ? 'Engagement Lunch' : 'Engagement Dinner'; }

  /* Floral line art in place of the thin corner lines (user's plum reference
     card): corner vines, bottom clusters, side vines, sprigs beside the "&"
     and a fine line-art crest of the template's own symbol. Generated with
     FLUX.2 Klein 4B by scripts/generate-wedding-lineart.js into
     images/wedding-lineart/<style>/ and images/wedding-lineart/crests/.
     The florals are shared by theme (first match wins); each is stored in two
     inks: "-dark" (champagne, for dark cards) and "-light" (antique gold). */
  var LINEART_STYLES = [
    ['deco', /deco|gatsby|noir|black tie|cinematic|midnight|luxe/],
    ['minimal', /minimal|type only|editorial|grid|quiet|letterpress|story card|digital|gen z|monogram|civil|two of us|modern|contemporary|gilded/],
    ['blossom', /japan|korea|chinese|sakura|cherry|mizuhiki|dancheong|vietnam|thai|indonesia|batik|filipino|sampaguita/],
    ['arabesque', /nikah|morocc|zellige|persian|boteh|kashmir|chinar|awadhi|nawab|lucknow|chikankari|mughal|truck|sindhi|ajrak|mudejar|spanish/],
    ['geometric', /adire|kente|habesha|ethiopia|nigeria|ghana|african/],
    ['tropical', /coastal|beach|goa|tropical|konkan|caribbean|hibiscus|brazil|palm|ocean|lagoon/],
    ['laurel', /italian|french|greek|british|regency|european|tuscan|christian|rose window|rinascimento|destination|voyage|parsi/],
    ['fern', /mountain|botanical|fern|wildflower|garden party|lakefront|lake|rustic|press|desert/],
    ['marigold', /punjab|phulkari|gujarat|toran|bandhani|kutch|marathi|paithani|mundavalya|haldi|mehendi|mehndi|sangeet|baraat|jaimala|vidaai|anand|sikh|bengal|alpona|shankha|odia|pattachitra|mithila|madhubani|assam|gamosa|nepal|bangladesh|jamdani|pakistan|mexic|papel/],
    ['jasmine', /tamil|telugu|kerala|kasavu|kalasam|gopuram|mysore|madhuve|kanchipuram|tanjore|chettinad|andhra|kalamkari|telangana|coorg|talambralu|sri lanka|poruwa|south indian/],
    ['baroque', /royal|palace|maharaja|durbar|regal|imperial|velvet|jharokha|jaipur|udaipur|rajasthan|haveli|banarasi|shehnai|golden|champagne|pearl|colonnade|court/],
    ['rose', /rose|blush|romance|floral|peony|watercolor|pastel|moonlit|bride|groom|love|daughter|son|sister|brother|friend|family|blossom|bloom/],
    ['lotus', /./]
  ];
  /* Where a template's keywords point to the wrong flora. */
  var LINEART_OVERRIDE = {
    'udaipur-romance': 'baroque', 'imperial-gold': 'baroque', 'champagne-palace': 'baroque',
    'mundavalya-pearls': 'marigold', 'lucknawi-chikankari': 'arabesque', 'desert-romance': 'arabesque',
    'lotus-garden': 'lotus', 'peony-bloom-card': 'rose', 'moonlit-florals': 'rose'
  };
  function lineArtStyle(key, slug) {
    if (LINEART_OVERRIDE[slug]) return LINEART_OVERRIDE[slug];
    for (var i = 0; i < LINEART_STYLES.length; i++) if (LINEART_STYLES[i][1].test(key)) return LINEART_STYLES[i][0];
    return 'lotus';
  }

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pick(list, h, shift) { return list[(h >>> shift) % list.length]; }

  var SPECS = null;
  function buildSpecs() {
    SPECS = {};
    var used = {};
    var list = (IH.data && IH.data.templates) || [];
    list.forEach(function (t) {
      if (SKIP[t.slug] || SPECS[t.slug]) return;
      var eng = OCCASIONS[t.category] && ENGAGEMENT_DESIGNS[t.slug];
      if (eng) {
        spec = {};
        Object.keys(eng).forEach(function (k) { spec[k] = eng[k]; });
        sig = [spec.layout, spec.frame, spec.date, spec.heading, spec.font, spec.names, spec.venue, spec.events].join('|') + '|engagement';
        used[sig] = t.slug; spec.slug = t.slug; spec.signature = sig; spec.occasion = t.category; SPECS[t.slug] = spec;
        return;
      }
      if (t.category !== 'wedding') return;
      var key = (t.name + ' ' + (t.keywords || '')).toLowerCase();
      var fam = FAMILIES.filter(function (f) { return f.re.test(key); })[0];
      var spec, sig;
      var ref = REFERENCE_STYLE[t.slug];
      if (ref !== undefined) {
        spec = { family: fam.name, layout: 'royal', frame: 'vine', date: 'pill', heading: 'rules', font: ref, names: 'row', venue: 'split', events: 'cards' };
        sig = [spec.layout, spec.frame, spec.date, spec.heading, spec.font, spec.names, spec.venue, spec.events].join('|');
        used[sig] = t.slug; spec.slug = t.slug; spec.signature = sig; spec.lineArt = lineArtStyle(key, t.slug); SPECS[t.slug] = spec;
        return;
      }
      for (var i = 0; i < 400; i++) {
        var h = hash(t.slug + (i ? '#' + i : ''));
        spec = {
          family: fam.name,
          layout: pick(fam.layouts, h, 0),
          frame: pick(fam.frames, h, 3),
          date: pick(DATES, h, 6),
          heading: pick(fam.heads, h, 9),
          font: pick(fam.fonts, h, 12),
          names: pick(NAMES, h, 15),
          venue: pick(VENUES, h, 17),
          events: pick(EVENTS, h, 20)
        };
        if (spec.layout === 'royal') { spec.names = 'row'; } // the royal layout centres a medallion between the names
        if (spec.layout === 'monogram') { spec.names = 'stack'; }
        sig = [spec.layout, spec.frame, spec.date, spec.heading, spec.font, spec.names, spec.venue, spec.events].join('|');
        if (!used[sig]) break;
      }
      used[sig] = t.slug;
      spec.slug = t.slug;
      spec.signature = sig;
      spec.lineArt = lineArtStyle(key, t.slug);
      if (BACKDROP_WEDDING[t.slug]) {
        spec.decor = BACKDROP_WEDDING[t.slug]; spec.decorStyle = 'backdrop'; spec.frame = 'hairline';
        spec.venueDefault = spec.decor + 'venue.jpg';
      }
      SPECS[t.slug] = spec;
    });
  }

  function specFor(slug) {
    if (!SPECS) buildSpecs();
    return SPECS[slug] || null;
  }

  /* ---- Colour: text follows the background ------------------------------ */
  function rgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lum(hex) {
    var c = rgb(hex); if (!c) return 1;
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function rgba(hex, a) { var c = rgb(hex) || [0, 0, 0]; return 'rgba(' + c.join(',') + ',' + a + ')'; }
  function best(bg, candidates, min) {
    for (var i = 0; i < candidates.length; i++) if (rgb(candidates[i]) && contrast(candidates[i], bg) >= min) return candidates[i];
    return lum(bg) < 0.3 ? '#FFF8EC' : '#2A1A14';
  }
  function palette(colors) {
    var bg = colors.bg1, dark = lum(bg) < 0.3;
    var title = best(bg, [colors.primary, colors.secondary, colors.ink], 3.2);
    var ink = best(bg, [colors.ink, colors.primary], 4.5);
    var accent = best(bg, [colors.secondary, colors.primary, colors.ink], 2.2);
    return {
      dark: dark,
      vars: '--wd-title:' + title + ';--wd-ink:' + ink + ';--wd-accent:' + accent +
        ';--wd-line:' + rgba(accent, 0.55) + ';--wd-soft:' + rgba(accent, 0.18) +
        ';--wd-card:' + (dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)') +
        ';--wd-card-line:' + rgba(accent, dark ? 0.45 : 0.4)
    };
  }

  /* ---- Ornament artwork -------------------------------------------------- */
  var CORNERS = {
    vine: '<path d="M4 4 C30 6 46 18 54 40 M4 4 C6 30 18 46 40 54"/><path d="M22 10 c6-8 16-8 20-2 c-6 6-14 6-20 2z M10 22 c-8 6-8 16-2 20 c6-6 6-14 2-20z M38 20 c8-4 16 0 16 8 c-8 2-14-2-16-8z M20 38 c-4 8 0 16 8 16 c2-8-2-14-8-16z"/>' +
      '<circle cx="54" cy="40" r="4"/><circle cx="40" cy="54" r="4"/><path d="M50 30 c4-4 10-4 12 0 M30 50 c-4 4-4 10 0 12"/>',
    deco: '<path d="M4 4 H60 M4 4 V60 M12 12 H48 M12 12 V48 M20 20 H36 M20 20 V36"/><path d="M4 4 L26 26"/><circle cx="26" cy="26" r="3"/>',
    kolam: '<circle cx="10" cy="10" r="2.6"/><circle cx="26" cy="10" r="2"/><circle cx="10" cy="26" r="2"/><circle cx="42" cy="10" r="1.6"/><circle cx="10" cy="42" r="1.6"/><circle cx="26" cy="26" r="2"/>' +
      '<path d="M10 10 C18 2 26 2 26 10 C26 18 18 26 10 26 C2 26 2 18 10 10 Z M26 10 C34 2 42 4 42 10 M10 26 C2 34 4 42 10 42 M26 26 C34 30 34 40 26 42 C18 40 18 30 26 26"/>',
    hairline: '<path d="M4 18 V4 H18 M10 24 V10 H24"/>'
  };
  function cornerSet(kind) {
    var art = CORNERS[kind]; if (!art) return '';
    var svg = function (pos) {
      return '<svg class="wd-corner wd-corner--' + pos + '" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true" focusable="false">' + art + '</svg>';
    };
    return svg('tl') + svg('tr') + svg('bl') + svg('br');
  }

  var EVENT_ICONS = {
    haldi: '<path d="M4 12 H20 C20 17 16.5 20 12 20 C7.5 20 4 17 4 12 Z"/><path d="M8 12 C8 9 10 8 12 8 C14 8 16 9 16 12"/><path d="M15 6 L18 3"/>',
    mehndi: '<path d="M7 21 C5 15 6 9 12 3 C18 9 19 15 17 21 Z"/><path d="M12 6 V20 M12 10 L9 8 M12 13 L15 11 M12 16 L9 14"/>',
    wedding: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M14 6 L15 4 L16 6 L15 7.5 Z"/>',
    reception: '<path d="M7 3 H11 L10.4 9 C10.2 10.6 9 11.5 9 11.5 C9 11.5 7.8 10.6 7.6 9 Z M9 11.5 V20 M7 20 H11"/><path d="M14 3 H18 L17.4 9 C17.2 10.6 16 11.5 16 11.5 C16 11.5 14.8 10.6 14.6 9 Z M16 11.5 V20 M14 20 H18"/>'
  };
  // Birthday programme (Additional Details reuses the four ceremony slots).
  EVENT_ICONS.games = '<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11 V15 M6 13 H10"/><circle cx="15.5" cy="12" r="0.8"/><circle cx="17.5" cy="14" r="0.8"/>';
  EVENT_ICONS.cake = '<path d="M4 21 H20 V14 C20 12.9 19.1 12 18 12 H6 C4.9 12 4 12.9 4 14 Z"/><path d="M4 16 C6 17.5 8 17.5 10 16 C12 14.5 14 14.5 16 16 C18 17.5 19 17 20 16"/><path d="M12 12 V8"/><path d="M12 4.5 C13 5.5 13 6.5 12 7 C11 6.5 11 5.5 12 4.5 Z"/>';
  EVENT_ICONS.meal = '<circle cx="12" cy="13" r="6"/><path d="M3 4 V9 C3 10 4 11 5 11 V20 M5 4 V9 M7 4 V9 C7 10 6 11 5 11"/><path d="M20 20 V4 C18.5 5 18 7 18 10 C18 11 19 12 20 12"/>';
  EVENT_ICONS.music = '<path d="M9 18 V5 L20 3 V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>';
  // Programme icons for the other occasions (OCCASION_DETAILS in js/preview.js).
  EVENT_ICONS.diya = '<path d="M3 13 C3 17 7 19 12 19 C17 19 21 17 21 13 Z"/><path d="M21 13 L22.5 11.5"/><path d="M12 10.5 C10.5 9 11 6.5 12 4 C13 6.5 13.5 9 12 10.5 Z"/>';
  EVENT_ICONS.gift = '<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13 V21 H19 V13 M12 9 V21"/><path d="M12 9 C10 9 7 8.5 7 6.5 C7 4.5 10 5 12 9 C14 5 17 4.5 17 6.5 C17 8.5 14 9 12 9 Z"/>';
  EVENT_ICONS.mic = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11 C5 15 8 17.5 12 17.5 C16 17.5 19 15 19 11 M12 17.5 V21 M8.5 21 H15.5"/>';
  EVENT_ICONS.award = '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.8 L7 21 L12 18.5 L17 21 L15.5 13.8"/><path d="M12 6 L12.9 8 L15 8.2 L13.4 9.6 L13.9 11.7 L12 10.6 L10.1 11.7 L10.6 9.6 L9 8.2 L11.1 8 Z"/>';
  EVENT_ICONS.camera = '<path d="M3 8 H7 L9 5 H15 L17 8 H21 V19 H3 Z"/><circle cx="12" cy="13" r="3.5"/>';
  EVENT_ICONS.home = '<path d="M3 11 L12 3 L21 11"/><path d="M5 9.5 V21 H19 V9.5"/><path d="M10 21 V15 H14 V21"/>';
  EVENT_ICONS.badge = '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4 V2.5 H15 V4"/><circle cx="12" cy="11" r="2.5"/><path d="M8 17.5 C8.5 15.5 10 14.5 12 14.5 C14 14.5 15.5 15.5 16 17.5"/>';
  EVENT_ICONS.star = '<path d="M12 3 L14.6 8.6 L20.6 9.2 L16 13.3 L17.4 19.3 L12 16.1 L6.6 19.3 L8 13.3 L3.4 9.2 L9.4 8.6 Z"/>';
  var BIRTHDAY_EVENTS = [
    { on: 'haldiEnabled', date: 'haldiDate', time: 'haldiTime', title: 'Welcome & Games', icon: 'games' },
    { on: 'mehndiEnabled', date: 'mehndiDate', time: 'mehndiTime', title: 'Cake Cutting', icon: 'cake' },
    { on: 'ceremonyEnabled', date: 'ceremonyDate', time: 'ceremonyTime', title: 'Lunch / Dinner', icon: 'meal' },
    { on: 'receptionEnabled', date: 'receptionDate', time: 'receptionTime', title: 'Music & Dance', icon: 'music' }
  ];
  /* The party programme the host switched on, in running order. */
  function birthdayEvents(data) {
    return BIRTHDAY_EVENTS.filter(function (e) { return data[e.on]; }).map(function (e) {
      return { title: e.title, date: data[e.date] || data.date, time: data[e.time], icon: e.icon };
    });
  }

  // Programme pictures: photo-real FLUX cut-outs (scripts/generate-event-icons.js),
  // one per EVENT_ICONS kind. `pre` is where images/ lives.
  function eventIconSrc(kind, pre) { return (pre || '') + 'images/event-icons/' + (EVENT_ICONS[kind] ? kind : 'star') + '.png'; }
  function eventIcon(kind, pre) {
    return '<img class="wd-event__icon wd-event__icon--photo" src="' + eventIconSrc(kind, pre) + '" alt="" aria-hidden="true" loading="lazy">';
  }

  /* ---- Markup ------------------------------------------------------------ */
  function headingHtml(spec, text, icon, ctx) {
    var mark = '';
    if (spec.heading === 'rules' && icon) mark = '<span class="wd-heading__icon">' + ctx.icon(icon, 16) + '</span>';
    if (spec.heading === 'diamond') mark = '<span class="wd-heading__gem" aria-hidden="true"></span>';
    return '<h3 class="wd-heading wd-heading--' + spec.heading + '"><span class="wd-heading__line" aria-hidden="true"></span>' +
      mark + '<span class="wd-heading__text">' + ctx.esc(text) + '</span>' + (spec.heading === 'diamond' ? mark : '') +
      '<span class="wd-heading__line" aria-hidden="true"></span></h3>';
  }

  function splitLines(text) {
    var parts = String(text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    return parts;
  }

  function motifUrl(data, spec) {
    return ((data && data.assetPrefix) || '') + 'images/wedding-motifs/' + spec.slug + '.svg';
  }

  /* Floral line art for a card (see LINEART_STYLES), in the ink that suits
     its background. `prefix` is where images/ lives (assetPrefix on the card,
     "up" on the host page). Copies made for the redesigned collection
     (data.rdCollection) carry their own artwork, so they get none. */
  function lineArt(data, spec, prefix) {
    if (!spec || !spec.lineArt || (data && data.rdCollection)) return null;
    var tpl = IH.data && IH.data.getTemplate ? IH.data.getTemplate(spec.slug) : null;
    var ink = palette((data && data.colors) || (tpl && tpl.colors) || {}).dark ? 'dark' : 'light';
    var pre = prefix != null ? prefix : ((data && data.assetPrefix) || '');
    if (spec.decor) {
      // Engagement cards: FLUX photo florals and a ring-box crest instead of gold line art.
      var ink0 = palette((data && data.colors) || (tpl && tpl.colors) || {}).dark ? 'dark' : 'light';
      return { ink: 'photo', photo: true, style: spec.decorStyle || 'corners',
        piece: function (name) { return pre + spec.decor + name + '.png'; }, crest: pre + spec.decor + 'crest.png', bd: pre + spec.decor + 'paper.jpg',
        // Luxury cards: gold baroque filigree for the corners (FLUX line art).
        gold: function (name) { return pre + 'images/wedding-lineart/baroque/' + name + '-' + ink0 + '.png'; } };
    }
    var base = pre + 'images/wedding-lineart/';
    return {
      ink: ink,
      piece: function (name) { return base + spec.lineArt + '/' + name + '-' + ink + '.png'; },
      crest: base + 'crests/' + spec.slug + '-' + ink + '.png'
    };
  }
  function lineArtImg(src, cls) {
    return '<img class="wd-la ' + cls + '" src="' + src + '" alt="" aria-hidden="true" onerror="this.style.display=\'none\'">';
  }
  /* Corner vines, bottom clusters and side vines (right-hand copies mirrored in CSS). */
  function lineArtFrame(la) {
    if (la.photo) {
      var P = la.piece, st = la.style;
      // Backdrop: the painted paper, then individual cut-outs: a top garland, side vines
      // (again, flipped, near the foot) and a bottom cluster, each at its own shape.
      if (st === 'backdrop') return '<div class="wd-bd" style="background-image:url(&quot;' + la.bd + '&quot;)"></div>' +
        lineArtImg(P('garland'), 'wd-la--garland') + lineArtImg(P('vine'), 'wd-la--vl') + lineArtImg(P('vine'), 'wd-la--vr') +
        lineArtImg(P('vine'), 'wd-la--vl wd-la--foot') + lineArtImg(P('vine'), 'wd-la--vr wd-la--foot') + lineArtImg(P('cluster'), 'wd-la--cluster');
      if (st === 'diagonal') return lineArtImg(P('bouquet'), 'wd-la--tl wd-la--bq') + lineArtImg(P('bouquet'), 'wd-la--br wd-la--bq wd-la--flip') +
        lineArtImg(P('cluster'), 'wd-la--bl wd-la--cl-sm');
      if (st === 'garland') return lineArtImg(P('garland'), 'wd-la--garland') + lineArtImg(P('cluster'), 'wd-la--cluster');
      if (st === 'wreath') return lineArtImg(P('cluster'), 'wd-la--bl wd-la--cl-sm') + lineArtImg(P('cluster'), 'wd-la--br wd-la--cl-sm');
      if (st === 'vines') return lineArtImg(P('vine'), 'wd-la--vl') + lineArtImg(P('vine'), 'wd-la--vr');
      if (st === 'luxury') return lineArtImg(la.gold('corner-top'), 'wd-la--tl wd-la--gold') + lineArtImg(la.gold('corner-top'), 'wd-la--tr wd-la--gold') +
        lineArtImg(la.gold('corner-bottom'), 'wd-la--bl wd-la--gold') + lineArtImg(la.gold('corner-bottom'), 'wd-la--br wd-la--gold') +
        lineArtImg(P('cluster'), 'wd-la--cluster');
      return lineArtImg(P('bouquet'), 'wd-la--tl wd-la--bq') + lineArtImg(P('bouquet'), 'wd-la--tr wd-la--bq') +
        lineArtImg(P('cluster'), 'wd-la--bl wd-la--cl-sm') + lineArtImg(P('cluster'), 'wd-la--br wd-la--cl-sm');
    }
    return lineArtImg(la.piece('corner-top'), 'wd-la--tl') + lineArtImg(la.piece('corner-top'), 'wd-la--tr') +
      lineArtImg(la.piece('corner-bottom'), 'wd-la--bl') + lineArtImg(la.piece('corner-bottom'), 'wd-la--br') +
      lineArtImg(la.piece('side-vine'), 'wd-la--l') + lineArtImg(la.piece('side-vine'), 'wd-la--r');
  }

  function initials(name) { return String(name || '').trim().charAt(0).toUpperCase() || '·'; }

  /* The date block in the template's own style (shared with the host page). */
  function dateInner(spec, d, time, esc) {
    var wk = (d.weekday || '').toUpperCase(), mon = (d.month || '').toUpperCase();
    var dateHtml;
    if (spec.date === 'pill') {
      dateHtml = '<div class="wd-cell"><small>' + esc(wk) + '</small><b>' + esc(d.day) + '</b></div>' +
        '<div class="wd-cell"><small>' + esc(mon) + '</small><b>' + esc(d.year) + '</b></div>' +
        (time ? '<div class="wd-cell"><small>AT</small><b class="wd-cell__time">' + esc(time) + '</b></div>' : '');
    } else if (spec.date === 'medallion') {
      dateHtml = '<small>' + esc(mon) + '</small><span class="wd-medal"><b>' + esc(d.day) + '</b></span><small>' + esc(d.year) + '</small>' +
        '<p class="wd-date__meta">' + esc(wk) + (time ? ' &middot; ' + esc(time) : '') + '</p>';
    } else if (spec.date === 'stack') {
      dateHtml = '<p class="wd-date__meta">' + esc(wk) + '</p><b class="wd-date__big">' + esc(d.day) + '</b>' +
        '<p class="wd-date__month">' + esc(mon) + ' ' + esc(d.year) + '</p>' + (time ? '<p class="wd-date__meta">' + esc(time) + '</p>' : '');
    } else if (spec.date === 'ribbon') {
      dateHtml = '<span>' + esc(wk) + '</span><i></i><span>' + esc(d.day + ' ' + (d.month || '') + ' ' + d.year) + '</span>' + (time ? '<i></i><span>' + esc(time) + '</span>' : '');
    } else {
      dateHtml = '<p class="wd-date__meta">' + esc(wk) + '</p><div class="wd-date__row"><span>' + esc(mon.slice(0, 3)) + '</span><b>' + esc(d.day) +
        '</b><span>' + esc(d.year) + '</span></div>' + (time ? '<p class="wd-date__meta">' + esc(time) + '</p>' : '');
    }
    return dateHtml;
  }

  function render(data, d, time, ctx) {
    var spec = specFor(data.template);
    var esc = ctx.esc;
    var html = [];
    var la = lineArt(data, spec);
    // The line-art crest falls back to the original SVG motif if it is missing.
    // Birthday cards have no SVG motif, so a missing crest is simply hidden.
    // Backdrop cards: the painted border is the decoration, no crest.
    var motif = la && la.style === 'backdrop' ? ''
      : la && (spec.occasion === 'birthday' || (OCCASIONS[spec.occasion] && OCCASIONS[spec.occasion].closing))
      ? '<img class="wd-motif wd-motif--la" src="' + esc(la.crest) + '" alt="" aria-hidden="true" onerror="this.style.display=\'none\'">'
      : la
      ? '<img class="wd-motif wd-motif--la" src="' + esc(la.crest) + '" alt="" aria-hidden="true" onerror="this.onerror=null;this.src=\'' + esc(motifUrl(data, spec)) + '\'">'
      : '<img class="wd-motif" src="' + esc(motifUrl(data, spec)) + '" alt="" aria-hidden="true" onerror="this.style.display=\'none\'">';

    /* Crest / side notes */
    if (spec.layout === 'monogram') {
      var a = initials(data.namesSwapped ? data.brideName : data.groomName);
      var b = initials(data.namesSwapped ? data.groomName : data.brideName);
      html.push('<div class="wd-monogram">' + motif + '<span class="wd-monogram__letters">' + esc(a) + '<i>&amp;</i>' + esc(b) + '</span></div>');
    } else if (spec.layout !== 'botanical') {
      // Wreath cards: the crest sits inside a floral wreath.
      html.push(la && la.photo && la.style === 'wreath'
        ? '<div class="wd-crest wd-crest--wreath"><img class="wd-crest__wreath" src="' + esc(la.piece('wreath')) + '" alt="" aria-hidden="true" onerror="this.style.display=\'none\'">' + motif + '</div>'
        : '<div class="wd-crest">' + motif + '</div>');
    }
    if (spec.layout === 'royal') {
      html.push('<p class="wd-note wd-note--right" aria-hidden="true">Good People<br>Beautiful Places<br>Brighter Tomorrows<br><span>&#9829;</span></p>');
      html.push('<p class="wd-note wd-note--left" aria-hidden="true">Two Souls<br>One Beautiful<br>Journey<br><span>&#9829;</span></p>');
    }

    if (spec.occasion === 'birthday') return html.join('') + birthdayBody(data, d, time, ctx, spec);
    if (OCCASIONS[spec.occasion] && OCCASIONS[spec.occasion].closing) return html.join('') + occasionBody(data, d, time, ctx, spec);

    var engaged = !!OCCASIONS[spec.occasion] || data.eventType === 'engagement';
    var occ = OCCASIONS[spec.occasion] || OCCASIONS.engagement;
    var t1 = splitLines(data.additionalTitle);
    if (t1.length) {
      html.push('<p class="invitation__additional-title wd-eyebrow">' + esc(t1[0]) + '</p>');
      if (t1[1]) html.push('<p class="wd-lead">' + esc(t1.slice(1).join(' ')) + '</p>');
    }
    var t2 = splitLines(engaged ? String(data.additionalSubtitle || '').split(WEDDING_SUBTITLE).join(occ.subtitle) : data.additionalSubtitle);
    if (t2.length) {
      html.push(t2.length > 1 ? headingHtml(spec, t2[0], null, ctx) : '');
      html.push('<p class="invitation__additional-subtitle wd-lead">' + esc(t2.length > 1 ? t2.slice(1).join(' ') : t2[0]) + '</p>');
    }

    if (data.photo) {
      html.push('<img class="invitation__photo wd-photo" src="' + esc(data.photo) + '" alt="Photo of the couple" width="128" height="128">');
    }

    /* Names */
    // Reception cards take Groom/Bride like a wedding; an older draft may still name the couple in one field ("Rohan & Ananya").
    var pn = spec.occasion === 'reception' && data.personName && !data.groomName && !data.brideName ? String(data.personName).split(/\s*(?:&|\band\b)\s*/i) : null;
    if (pn && pn.length >= 2) { data = Object.assign({}, data, { groomName: pn[0], brideName: pn.slice(1).join(' & ') }); }
    var left = { name: data.groomName || 'Groom', parents: data.groomParents || 'Groom’s Parents', rel: 'Son of' };
    var right = { name: data.brideName || 'Bride', parents: data.brideParents || 'Bride’s Parents', rel: 'Daughter of' };
    if (data.namesSwapped) { var sw = left; left = right; right = sw; }
    var person = function (p, side) {
      // Engagement cards name the families in the blessings section, not as "Son of / Daughter of".
      return '<div class="wd-person wd-person--' + side + '"><h2 class="invitation__person-name wd-name">' + esc(p.name) + '</h2>' +
        (p.parents && !engaged ? '<p class="wd-parents"><span>' + p.rel + '</span>' + esc(p.parents) + '</p>' : '') + '</div>';
    };
    // Leaf sprigs either side of the "&" (line-art cards).
    // Backdrop cards have no sprig beside the "&" (their decoration is the painted layers).
    var sprigs = la && la.style !== 'backdrop' ? [lineArtImg(esc(la.piece('sprig')), 'wd-la-sprig wd-la-sprig--l'), lineArtImg(esc(la.piece('sprig')), 'wd-la-sprig wd-la-sprig--r')] : ['', ''];
    var amp = spec.layout === 'royal'
      ? '<div class="wd-amp wd-amp--medallion' + (la ? ' wd-amp--la' : '') + '">' + sprigs[0] + '<span>&amp;</span>' + sprigs[1] + '</div>'
      : '<div class="wd-amp' + (la ? ' wd-amp--la' : '') + '">' + sprigs[0] + '<span>&amp;</span>' + sprigs[1] + '</div>';
    html.push('<div class="invitation__couple wd-couple wd-couple--' + spec.names + '">' + person(left, 'left') + amp + person(right, 'right') + '</div>');

    /* Engagement: the occasion itself, set large under the names. */
    if (engaged) {
      var engTitle = String(spec.title || occ.title).split('|');
      html.push('<div class="wd-eng-title"><span class="wd-eng-title__script">' + esc(engTitle[0]) + '</span><span class="wd-eng-title__caps">' + esc(engTitle[1] || '') + '</span></div>');
    }

    /* Date */
    if (d.full || time) {
      html.push(headingHtml(spec, engaged ? occ.saveDate : 'Save the date', 'calendar', ctx));
      html.push('<div class="invitation__when-unified wd-date wd-date--' + spec.date + '">' + dateInner(spec, d, time, esc) + '</div>');
    }

    /* Message + countdown */
    if (data.message) {
      html.push(headingHtml(spec, 'A new chapter begins', 'heart', ctx));
      html.push('<p class="invitation__message wd-message">' + esc(data.message) + '</p>');
    }
    if (data.showCountdown !== false && data.date && IH.countdown) {
      html.push(IH.countdown.markup(ctx.toDateTime(data.date, data.time), 'wd-countdown', data.eventType));
    }

    /* Venue */
    if (data.venue || data.address) {
      var mapsUrl = ctx.mapsUrl(data);
      var pre = (data && data.assetPrefix) || '';
      var photo = data.venueImage || pre + (spec.venueDefault || 'images/templates/venue-default.jpg');
      html.push(headingHtml(spec, 'The celebration venue', 'map-pin', ctx));
      html.push('<div class="wd-venue wd-venue--' + spec.venue + '">' +
        '<figure class="wd-venue__photo"><img src="' + esc(photo) + '" alt="' + esc(data.venue || 'Venue') + '" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'' + esc(pre) + 'images/templates/wedding-day-mandap.svg\'"></figure>' +
        '<div class="wd-venue__info">' +
          (data.venue ? '<p class="invitation__venue-name wd-venue__name">' + esc(data.venue) + '</p>' : '') +
          (data.address ? '<p class="invitation__venue-address wd-venue__address">' + esc(data.address) + '</p>' : '') +
          (mapsUrl ? '<a class="wd-venue__map invitation__maps-btn" href="' + esc(mapsUrl) + '" target="_blank" rel="noopener noreferrer">' +
            ctx.icon('map-pin', 14) + '<span>View on Google Maps</span></a>' : '') +
        '</div></div>');
    }

    /* Ceremonies */
    var events = [
      { on: data.haldiEnabled, title: 'Haldi', date: data.haldiDate, time: data.haldiTime, icon: 'haldi' },
      { on: data.mehndiEnabled, title: 'Mehndi', date: data.mehndiDate, time: data.mehndiTime, icon: 'mehndi' },
      { on: data.ceremonyEnabled, title: 'Wedding Ceremony', date: data.ceremonyDate, time: data.ceremonyTime, icon: 'wedding' },
      { on: data.receptionEnabled, title: 'Reception', date: data.receptionDate, time: data.receptionTime, icon: 'reception' }
    ].filter(function (e) { return e.on; });
    if (engaged) {
      events = events.filter(function (e) { return ENGAGEMENT_EVENTS[e.icon]; });
      events.forEach(function (e) {
        var t = occ.events[e.icon];
        e.title = t === 'meal' ? engagementMealTitle(e.time) : (e.icon === 'wedding' && spec.mainEvent) || t;
      });
    }
    if (events.length) {
      html.push(headingHtml(spec, engaged ? occ.programme : 'Our wedding celebrations', 'sparkles', ctx));
      html.push('<div class="wd-events wd-events--' + spec.events + ' wd-events--n' + events.length + '">' + events.map(function (e) {
        var ed = ctx.formatDate(e.date);
        var when = ed.full ? ed.weekday + ', ' + ed.day + ' ' + ed.month.slice(0, 3) + ' ' + ed.year : '';
        return '<div class="wd-event">' + eventIcon(e.icon, pre) + '<strong class="wd-event__title">' + esc(e.title) + '</strong>' +
          (when ? '<span class="wd-event__date">' + esc(when) + '</span>' : '') +
          (e.time ? '<span class="wd-event__time">' + esc(ctx.formatTime(e.time)) + '</span>' : '') + '</div>';
      }).join('') + '</div>');
    }
    return html.join('');
  }

  /* 1st, 2nd, 3rd, 11th ... 25th. */
  function ordinal(value) {
    var n = parseInt(value, 10);
    if (!n || n < 1) return '';
    var t = n % 100;
    return n + ((t >= 11 && t <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
  }

  /* Birthday cards: one name, the age and the party title in place of the
     couple, families and ceremonies (host line, theme word, "Turning N"). */
  function birthdayTitle(spec, years, esc) {
    var t = String(spec.title || OCCASIONS.birthday.title).split('|');
    var n = parseInt(years, 10);
    return '<div class="wd-eng-title wd-bday-title' + (t[0].length > 12 ? ' wd-eng-title--long' : '') + '">' +
      '<span class="wd-eng-title__script">' + esc(t[0]) + '</span>' +
      (n > 0 ? '<span class="wd-bday-age"><small>Turning</small><b>' + esc(String(n)) + '</b></span>' : '') +
      '<span class="wd-eng-title__caps">' + esc(n > 0 ? ordinal(n) + ' ' + (t[1] || 'Birthday') : (t[1] || '')) + '</span></div>';
  }
  function birthdayBody(data, d, time, ctx, spec) {
    var esc = ctx.esc, html = [];
    // Header wording from Additional Details; an older draft falls back to its host line.
    var t1 = splitLines(data.additionalTitle);
    if (t1.length) {
      html.push('<p class="invitation__additional-title wd-eyebrow">' + esc(t1[0]) + '</p>');
      if (t1[1]) html.push('<p class="wd-lead">' + esc(t1.slice(1).join(' ')) + '</p>');
    } else if (data.hostName) {
      html.push('<p class="invitation__additional-title wd-eyebrow">' + esc(data.hostName) + '</p>');
    }
    var t2 = splitLines(data.additionalSubtitle);
    if (t2.length > 1) html.push(headingHtml(spec, t2[0], null, ctx));
    html.push('<p class="invitation__additional-subtitle wd-lead">' + esc(t2.length > 1 ? t2.slice(1).join(' ') : t2[0] || OCCASIONS.birthday.subtitle) + '</p>');
    if (data.photo) html.push('<img class="invitation__photo wd-photo" src="' + esc(data.photo) + '" alt="Photo of the birthday person" width="128" height="128">');
    html.push('<div class="invitation__couple wd-couple wd-couple--solo"><div class="wd-person"><h2 class="invitation__person-name wd-name">' +
      esc(data.personName || 'The Birthday Star') + '</h2></div></div>');
    html.push(birthdayTitle(spec, data.years, esc));
    if (data.title) html.push('<p class="wd-lead wd-bday-tagline">' + esc(data.title) + '</p>');
    if (d.full || time) {
      html.push(headingHtml(spec, 'Save the date', 'calendar', ctx));
      html.push('<div class="invitation__when-unified wd-date wd-date--' + spec.date + '">' + dateInner(spec, d, time, esc) + '</div>');
    }
    if (data.message) {
      html.push(headingHtml(spec, 'Join the celebration', 'heart', ctx));
      html.push('<p class="invitation__message wd-message">' + esc(data.message) + '</p>');
    }
    if (data.showCountdown !== false && data.date && IH.countdown) {
      html.push(IH.countdown.markup(ctx.toDateTime(data.date, data.time), 'wd-countdown', data.eventType));
    }
    html.push(soloVenue(data, spec, ctx, 'The party venue'));
    html.push(soloEvents(birthdayEvents(data), spec, ctx, 'The party programme', data.assetPrefix));
    return html.join('');
  }

  /* Venue photo beside its details, and the programme cards (birthday and the other one-name occasions). */
  function soloVenue(data, spec, ctx, title) {
    if (!data.venue && !data.address) return '';
    var esc = ctx.esc, mapsUrl = ctx.mapsUrl(data);
    var pre = (data && data.assetPrefix) || '';
    var photo = data.venueImage || pre + (spec.venueDefault || 'images/templates/venue-default.jpg');
    return headingHtml(spec, title, 'map-pin', ctx) +
      '<div class="wd-venue wd-venue--' + spec.venue + '">' +
        '<figure class="wd-venue__photo"><img src="' + esc(photo) + '" alt="' + esc(data.venue || 'Venue') + '" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'' + esc(pre) + 'images/templates/venue-default.jpg\'"></figure>' +
        '<div class="wd-venue__info">' +
          (data.venue ? '<p class="invitation__venue-name wd-venue__name">' + esc(data.venue) + '</p>' : '') +
          (data.address ? '<p class="invitation__venue-address wd-venue__address">' + esc(data.address) + '</p>' : '') +
          (mapsUrl ? '<a class="wd-venue__map invitation__maps-btn" href="' + esc(mapsUrl) + '" target="_blank" rel="noopener noreferrer">' +
            ctx.icon('map-pin', 14) + '<span>View on Google Maps</span></a>' : '') +
        '</div></div>';
  }
  function soloEvents(events, spec, ctx, title, pre) {
    if (!events || !events.length) return '';
    var esc = ctx.esc;
    return headingHtml(spec, title, 'sparkles', ctx) +
      '<div class="wd-events wd-events--' + spec.events + ' wd-events--n' + events.length + '">' + events.map(function (e) {
        var ed = ctx.formatDate(e.date);
        var when = ed.full ? ed.weekday + ', ' + ed.day + ' ' + ed.month.slice(0, 3) + ' ' + ed.year : '';
        return '<div class="wd-event">' + eventIcon(e.icon, pre) + '<strong class="wd-event__title">' + esc(e.title) + '</strong>' +
          (when ? '<span class="wd-event__date">' + esc(when) + '</span>' : '') +
          (e.time ? '<span class="wd-event__time">' + esc(ctx.formatTime(e.time)) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
  }

  /* Baby shower, naming ceremony, housewarming and anniversary: the birthday
     layout with the occasion's own name line (the parents-to-be, the baby,
     the family, the couple) and title; an anniversary shows its years. */
  function occasionTitle(spec, data, esc) {
    var occ = OCCASIONS[spec.occasion] || {};
    var t = String(spec.title || occ.title || '').split('|');
    var anniv = spec.occasion === 'anniversary';
    // Anniversary: its years; retirement: years of service (badge only).
    var n = anniv ? parseInt(data.years, 10) : occ.years ? parseInt(data[occ.years], 10) : 0;
    return '<div class="wd-eng-title wd-bday-title wd-occ-title' + (t[0].length > 12 ? ' wd-eng-title--long' : '') + '">' +
      '<span class="wd-eng-title__script">' + esc(t[0]) + '</span>' +
      (n > 0 ? '<span class="wd-bday-age"><b>' + esc(String(n)) + '</b><small>Years</small></span>' : '') +
      '<span class="wd-eng-title__caps">' + esc(n > 0 && anniv ? ordinal(n) + ' ' + (t[1] || 'Anniversary') : (t[1] || '')) + '</span></div>';
  }
  /* An event-named card whose name already holds the title's script word
     ("Masquerade Ball" + "Masquerade|Ball") skips the decorative title. */
  function titleInName(data, spec) {
    var occ = OCCASIONS[spec.occasion] || {};
    var script = String(spec.title || occ.title || '').split('|')[0].toLowerCase().replace(/[’']/g, '');
    return occ.nameFrom === 'title' && !!script && String(data.title || '').toLowerCase().replace(/[’']/g, '').indexOf(script) >= 0;
  }
  /* The line under the name: course and institution, role, event kind ... */
  function occasionDetail(data, spec) {
    var occ = OCCASIONS[spec.occasion] || {};
    var bits = (occ.details || []).map(function (k) { return String(data[k] || '').trim(); }).filter(Boolean);
    if (occ.honoree && data[occ.honoree]) bits.unshift('In honour of ' + data[occ.honoree]);
    return bits.join(' · ');
  }
  function occasionName(data, spec, esc) {
    var occ = OCCASIONS[spec.occasion] || {}, name;
    if (spec.occasion === 'naming-ceremony') name = data.babyName || data.personName;
    else if (spec.occasion === 'baby-shower') name = data.personName || data.babyName;
    else if (occ.nameFrom === 'title') name = data.title;
    else name = data.personName;
    name = String(name || occ.fallbackName || '');
    // A couple (anniversary, parents-to-be) gets the card's ampersand between the names.
    var inner = /^(anniversary|baby-shower)$/.test(spec.occasion) ? coupleInner(name, esc) : esc(name);
    return '<div class="invitation__couple wd-couple wd-couple--solo"><div class="wd-person"><h2 class="invitation__person-name wd-name">' + inner + '</h2></div></div>';
  }
  /* "Rohan & Ananya": each name stays whole, the "&" in the card's accent. */
  function coupleInner(name, esc) {
    var parts = String(name || '').split(/\s*&\s*/);
    return parts.length === 2 && parts[0] && parts[1]
      ? '<span class="wd-occ-n">' + esc(parts[0]) + '</span> <span class="wd-occ-amp">&amp;</span> <span class="wd-occ-n">' + esc(parts[1]) + '</span>' : esc(name);
  }
  /* The small line above the name: "Our Son" for the baby being named,
     "Parents-to-be" over a baby shower couple. */
  function occasionNameLabel(data, spec) {
    if (spec.occasion === 'naming-ceremony' && (data.babyName || data.personName)) {
      return 'Our ' + (/daughter/i.test(String(data.babyRelation || '')) ? 'Daughter' : 'Son');
    }
    if (spec.occasion === 'baby-shower' && data.personName && /&/.test(data.personName)) return 'Parents-to-be';
    return '';
  }
  /* The line under the name: the baby's parents, or the awaited baby's name. */
  function occasionNameAfter(data, spec, esc) {
    if (spec.occasion === 'naming-ceremony' && data.parentsName) {
      var relation = /daughter/i.test(String(data.babyRelation || '')) ? 'Daughter' : 'Son';
      return '<p class="wd-parents wd-occ-parents"><span>' + relation + ' of</span><b>' + coupleInner(data.parentsName, esc) + '</b></p>';
    }
    if (spec.occasion === 'baby-shower' && data.babyName && data.personName) {
      return '<p class="wd-lead wd-occ-note wd-occ-awaiting">Awaiting ' + esc(data.babyName) + '</p>';
    }
    return '';
  }
  function occasionBody(data, d, time, ctx, spec) {
    var esc = ctx.esc, html = [], occ = OCCASIONS[spec.occasion], cfg = ctx.occasion || {};
    var t1 = splitLines(data.additionalTitle);
    if (t1.length) {
      html.push('<p class="invitation__additional-title wd-eyebrow">' + esc(t1[0]) + '</p>');
      if (t1[1]) html.push('<p class="wd-lead">' + esc(t1.slice(1).join(' ')) + '</p>');
    } else if (data.hostName) {
      html.push('<p class="invitation__additional-title wd-eyebrow">' + esc(data.hostName) + '</p>');
    }
    var t2 = splitLines(data.additionalSubtitle);
    if (t2.length > 1) html.push(headingHtml(spec, t2[0], null, ctx));
    html.push('<p class="invitation__additional-subtitle wd-lead">' + esc(t2.length > 1 ? t2.slice(1).join(' ') : t2[0] || occ.subtitle) + '</p>');
    if (data.photo) html.push('<img class="invitation__photo wd-photo" src="' + esc(data.photo) + '" alt="Photo" width="128" height="128">');
    var label = occasionNameLabel(data, spec);
    if (label) html.push('<p class="wd-eyebrow wd-occ-relation">' + esc(label) + '</p>');
    html.push(occasionName(data, spec, esc));
    html.push(occasionNameAfter(data, spec, esc));
    var detail = occasionDetail(data, spec);
    if (detail) html.push('<p class="wd-lead wd-occ-note">' + esc(detail) + '</p>');
    if (!titleInName(data, spec)) html.push(occasionTitle(spec, data, esc));
    // An event-named card already shows its title as the name.
    if (data.title && occ.nameFrom !== 'title') html.push('<p class="wd-lead wd-bday-tagline">' + esc(data.title) + '</p>');
    if (d.full || time) {
      html.push(headingHtml(spec, occ.saveDate || 'Save the date', 'calendar', ctx));
      html.push('<div class="invitation__when-unified wd-date wd-date--' + spec.date + '">' + dateInner(spec, d, time, esc) + '</div>');
    }
    if (data.message) {
      var msg = spec.occasion === 'naming-ceremony' && ctx.genderize ? ctx.genderize(data.message, data.babyRelation) : data.message;
      html.push(headingHtml(spec, cfg.message || occ.message, 'heart', ctx));
      html.push('<p class="invitation__message wd-message">' + esc(msg) + '</p>');
    }
    if (data.showCountdown !== false && data.date && IH.countdown) {
      html.push(IH.countdown.markup(ctx.toDateTime(data.date, data.time), 'wd-countdown', data.eventType));
    }
    html.push(soloVenue(data, spec, ctx, cfg.venue || 'The venue'));
    html.push(soloEvents(ctx.occasionEvents ? ctx.occasionEvents(data) : [], spec, ctx, cfg.programme || 'The programme', data.assetPrefix));
    return html.join('');
  }

  /* The decorative frame layer, placed first in the card. */
  function frame(data) {
    var spec = specFor(data.template);
    var la = lineArt(data, spec);
    // Line-art cards: floral corners and side vines replace the thin corner lines and sprays.
    if (la) return '<div class="wd-frame wd-frame--la' + (la.photo ? ' wd-frame--photo' : '') + '" aria-hidden="true">' + lineArtFrame(la) + '</div>';
    var inner = '';
    if (spec.frame === 'vine' || spec.frame === 'deco' || spec.frame === 'kolam' || spec.frame === 'hairline') inner = cornerSet(spec.frame);
    if (spec.layout === 'botanical') {
      var src = ((data && data.assetPrefix) || '') + 'images/wedding-motifs/' + spec.slug + '.svg';
      inner += '<img class="wd-spray wd-spray--tl" src="' + src + '" alt="" onerror="this.style.display=\'none\'">' +
        '<img class="wd-spray wd-spray--br" src="' + src + '" alt="" onerror="this.style.display=\'none\'">';
    }
    return '<div class="wd-frame" aria-hidden="true">' + inner + '</div>';
  }

  /* Classes and CSS variables for the <article>. */
  function articleAttrs(data, colors) {
    var spec = specFor(data.template);
    var pal = palette(colors);
    var cls = ' invitation--wd wd-l-' + spec.layout + ' wd-fr-' + spec.frame + ' wd-fam-' + spec.family + (pal.dark ? ' wd-dark' : ' wd-light');
    var useFont = !data.font;
    var f = FONTS[spec.font];
    var vars = pal.vars + (useFont ? ';--wd-display:' + f.display + ';--wd-body:' + f.body + ';--wd-caps:' + f.caps : '') +
      ';--wd-name-size:' + (f.script ? '1.18' : f.italic ? '0.92' : '0.86');
    if (spec.decorStyle && !data.rdCollection) cls += ' wd-dec-' + spec.decorStyle;
    if (f.italic) cls += ' wd-italic';
    if (f.script) cls += ' wd-script';
    return { cls: cls, vars: vars, spec: spec };
  }

  IH.weddingDesigns = {
    applies: function (slug) { return !!specFor(slug); },
    spec: specFor,
    all: function () { if (!SPECS) buildSpecs(); return SPECS; },
    render: render,
    frame: frame,
    heading: headingHtml,
    dateInner: dateInner,
    corners: cornerSet,
    motifUrl: motifUrl,
    lineArt: lineArt,
    lineArtFrame: lineArtFrame,
    /* Engagement cards on the engine: wording, ceremony names, default venue photo. */
    engagementText: function (text) { return String(text == null ? '' : text).split(WEDDING_SUBTITLE).join(ENGAGEMENT_SUBTITLE); },
    ENGAGEMENT_EVENTS: ENGAGEMENT_EVENTS,
    OCCASIONS: OCCASIONS,
    occasionText: function (spec, text) { var o = spec && OCCASIONS[spec.occasion]; return o ? String(text == null ? '' : text).split(WEDDING_SUBTITLE).join(o.subtitle) : text; },
    engagementMealTitle: engagementMealTitle,
    birthdayTitle: birthdayTitle,
    birthdayEvents: birthdayEvents,
    occasionTitle: occasionTitle,
    occasionDetail: occasionDetail,
    occasionNameLabel: occasionNameLabel,
    occasionNameAfter: occasionNameAfter,
    coupleInner: coupleInner,
    titleInName: titleInName,
    isOneName: function (spec) { return !!(spec && OCCASIONS[spec.occasion] && OCCASIONS[spec.occasion].closing); },
    eventIconSvg: function (kind) { return EVENT_ICONS[kind] || ''; },
    eventIconSrc: eventIconSrc,
    articleAttrs: articleAttrs,
    palette: palette,
    FONTS: FONTS
  };
})();
