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
    ['house-warming', 'House Warming', 'home', 'Griha Pravesh invitations that open the door to your new beginning.'],
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
      motif, popularity, addedISO, blurb]
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

    ['Baby Dreams', 'baby-dreams', 'baby-shower', 'free', '#F3F8FF', '#D9E7FA', '#1B3B58', '#28527A', '#6FA3CE', 'cloud', 88, '2026-02-05', 'Drifting clouds and a soft blue sky to announce the shower.'],
    ['Little Prince', 'little-prince', 'baby-shower', 'premium', '#EAF2FB', '#C9DDF3', '#16324F', '#1F4370', '#C08A3E', 'crown', 83, '2026-01-26', 'A tiny gold crown on powder blue for the prince on the way.'],
    ['Little Princess', 'little-princess', 'baby-shower', 'premium', '#FDF0F5', '#F6D4E4', '#4A1B33', '#8C2B58', '#C08A3E', 'crown', 84, '2026-01-26', 'The same crowned arch in blush rose for the princess on the way.'],
    ['Cloud Nine', 'cloud-nine', 'baby-shower', 'free', '#F6F4FD', '#DED7F6', '#2C2054', '#3F2E78', '#8A76C9', 'cloud', 78, '2026-03-14', 'Lavender skies and rounded type — modern, gender-neutral, calm.'],

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
    ['Annual Day', 'annual-day', 'school-events', 'free', '#EEF4FF', '#CFE0FA', '#16294A', '#1F3D74', '#5A82C4', 'book', 73, '2026-03-09', 'A clean school-blue card parents can open and forward in one tap.'],
    ['College Fest', 'college-fest', 'college-events', 'premium', '#160D2B', '#4B1178', '#EEC6FF', '#FFFFFF', '#C77DF0', 'music', 84, '2026-03-22', 'Loud purple, music motifs and room for a three-day line-up.'],
    ['House Party', 'house-party', 'party', 'free', '#170F26', '#43196B', '#FFD6F0', '#FFFFFF', '#F472B6', 'confetti', 79, '2026-03-26', 'Confetti on midnight violet for get-togethers and reunions.'],
    ['Community Meet', 'community-meet', 'community-events', 'free', '#F3F7F4', '#D6E7DC', '#163324', '#1E4736', '#56916C', 'flag', 68, '2026-03-05', 'Neutral, legible and welcoming — built for association notices.'],

    ['Midnight Soiree', 'midnight-soiree', 'reception', 'free', '#0E1330', '#2A2F63', '#DCE2FF', '#FFFFFF', '#8FA0E8', 'lights', 79, '2026-04-02', 'Deep indigo with hanging lights for a reception that runs late.'],
    ['Rose Gold Evening', 'rose-gold-evening', 'reception', 'free', '#3A1C28', '#7A3A4E', '#FBE0E6', '#FFF1F4', '#E0A0B0', 'mandala', 76, '2026-04-08', 'Rose gold on plum — warm, formal and easy to read on a phone.'],
    ['Garden Reception', 'garden-reception', 'reception', 'free', '#12301F', '#2C5C3C', '#DFF2E4', '#FFFFFF', '#8DC79E', 'floral', 73, '2026-04-14', 'Leafy green and ivory for a reception held under open sky.'],
    ['Sangeet Night', 'sangeet-night', 'wedding', 'free', '#2A0E38', '#701F63', '#FFD9F0', '#FFFFFF', '#E88FD0', 'music', 86, '2026-04-05', 'Magenta and gold for the music night before the wedding.'],
    ['Mehendi Morning', 'mehendi-morning', 'wedding', 'free', '#26380C', '#5E7A18', '#F2F7CE', '#FFFFFF', '#C4D468', 'floral', 84, '2026-04-11', 'Fresh henna green with paisley for the mehendi morning.'],
    ['Haldi Sunshine', 'haldi-sunshine', 'wedding', 'free', '#4A3005', '#A87410', '#FFEFC2', '#FFFFFF', '#EBBF4E', 'mandala', 82, '2026-04-17', 'Turmeric yellow and marigold for the haldi ritual.'],
    ['Blessed Beginning', 'blessed-beginning', 'naming-ceremony', 'free', '#3A2410', '#7E5220', '#FBEBD2', '#FFFFFF', '#DDB278', 'hands', 74, '2026-04-03', 'Warm sandalwood tones and folded hands for the naming day.'],
    ['Cradle Song', 'cradle-song', 'naming-ceremony', 'free', '#16324A', '#2E6285', '#DCEEF8', '#FFFFFF', '#8CC2DE', 'cloud', 71, '2026-04-09', 'Soft sky blue and drifting clouds for a gentle naming card.'],
    ['First Name', 'first-name', 'naming-ceremony', 'free', '#3E1428', '#7C2F52', '#FCE2EC', '#FFFFFF', '#E098B4', 'mandala', 69, '2026-04-15', 'Blush rose with a fine mandala for announcing the chosen name.'],
    ['Open Doors', 'open-doors', 'house-warming', 'free', '#1C3326', '#3E6B4C', '#E0F0E6', '#FFFFFF', '#8FC2A2', 'house', 72, '2026-04-06', 'Calm green and a clean roofline for a modern house warming.'],
    ['Honour Roll', 'honour-roll', 'graduation', 'free', '#2A1436', '#5A2C6E', '#F0DEFA', '#FFFFFF', '#C08FD8', 'book', 78, '2026-04-04', 'Academic purple and an open book for convocation day.'],
    ['Cap And Gown', 'cap-and-gown', 'graduation', 'free', '#12261E', '#28513E', '#DDF0E6', '#FFFFFF', '#8AC4A6', 'cap', 75, '2026-04-10', 'Deep green and gold, cut for a formal convocation notice.'],
    ['Bright Future', 'bright-future', 'graduation', 'free', '#0F1F3E', '#254878', '#DCE8FC', '#FFFFFF', '#8AAAE0', 'stars', 72, '2026-04-16', 'Night blue with a scatter of stars for the year they finished.'],
    ['Golden Years', 'golden-years', 'retirement', 'free', '#33280E', '#6E5720', '#F8E6BC', '#FFFFFF', '#DCBB6E', 'leaves', 74, '2026-04-07', 'Antique gold and laurel for a long career closing well.'],
    ['Safe Harbour', 'safe-harbour', 'retirement', 'free', '#102A34', '#245663', '#DBEFF4', '#FFFFFF', '#87BFCE', 'flag', 70, '2026-04-13', 'Sea blue and quiet type for a dignified send-off.'],
    ['With Gratitude', 'with-gratitude', 'retirement', 'free', '#33161C', '#6E3138', '#F8DEDF', '#FFFFFF', '#DC9298', 'leaves', 67, '2026-04-19', 'Warm russet and laurel for a thank-you gathering.'],
    ['Until We Meet', 'until-we-meet', 'farewell', 'free', '#1B2440', '#3A4B7C', '#DFE5FA', '#FFFFFF', '#8E9DD4', 'lights', 73, '2026-04-05', 'Dusk blue and string lights for a last evening together.'],
    ['New Chapter', 'new-chapter', 'farewell', 'free', '#2E1B0E', '#63401F', '#F6E2CE', '#FFFFFF', '#D9A86E', 'book', 70, '2026-04-12', 'Warm paper tones and an open book for someone moving on.'],
    ['Send Off', 'send-off', 'farewell', 'free', '#14302C', '#2C645C', '#D8F0EA', '#FFFFFF', '#84C6BA', 'music', 68, '2026-04-18', 'Teal and a soft melody line for a team send-off.'],
    ['Sports Day', 'sports-day', 'school-events', 'free', '#122C42', '#265C82', '#DAECF8', '#FFFFFF', '#84BADE', 'flag', 76, '2026-04-06', 'Bright field blue and pennants for sports day notices.'],
    ['Prize Giving', 'prize-giving', 'school-events', 'free', '#331E08', '#6E4416', '#F8E4C6', '#FFFFFF', '#DCAE64', 'book', 73, '2026-04-12', 'Warm gold and an open book for prize day and speech day.'],
    ['Science Fair', 'science-fair', 'school-events', 'free', '#101E36', '#22406E', '#DCE6FA', '#FFFFFF', '#88A4DC', 'stars', 70, '2026-04-18', 'Cool navy and constellations for exhibitions and science fairs.'],
    ['Culturals Night', 'culturals-night', 'college-events', 'free', '#1E0C34', '#4E1878', '#EEC8FF', '#FFFFFF', '#C078E8', 'confetti', 82, '2026-04-03', 'Stage purple and confetti for culturals and cultural nights.'],
    ['Tech Symposium', 'tech-symposium', 'college-events', 'free', '#08202C', '#134C60', '#D2EEF8', '#FFFFFF', '#74C2DC', 'geometric', 78, '2026-04-09', 'Circuit teal and clean geometry for symposiums and hackathons.'],
    ['Freshers Party', 'freshers-party', 'college-events', 'free', '#340C22', '#701A4A', '#FCC8E4', '#FFFFFF', '#E874AE', 'balloons', 75, '2026-04-15', 'Hot pink and balloons for freshers and farewell parties.'],
    ['Rooftop Night', 'rooftop-night', 'party', 'free', '#0E1424', '#26314E', '#DCE4F8', '#FFFFFF', '#8898C8', 'lights', 80, '2026-04-04', 'City night blue and warm bulbs for a rooftop get-together.'],
    ['Dinner Party', 'dinner-party', 'party', 'free', '#2E1010', '#66282A', '#F8DCDC', '#FFFFFF', '#DC8E90', 'lights', 74, '2026-04-11', 'Deep claret and candlelight for a sit-down dinner.'],
    ['Pool Party', 'pool-party', 'party', 'free', '#062A38', '#0F5C74', '#CDEEF8', '#FFFFFF', '#68C4E0', 'confetti', 71, '2026-04-17', 'Bright water blue and confetti for a summer pool party.'],
    ['Residents Meet', 'residents-meet', 'community-events', 'free', '#14261C', '#2E5440', '#DCEEE2', '#FFFFFF', '#88BE9C', 'house', 70, '2026-04-07', 'Neutral green and rooflines for association and society notices.'],
    ['Volunteer Drive', 'volunteer-drive', 'community-events', 'free', '#2A1808', '#5E3A14', '#F6E2C8', '#FFFFFF', '#D8A868', 'flag', 67, '2026-04-13', 'Earth tones and pennants for drives, camps and clean-ups.'],
    ['Neighbourhood Fest', 'neighbourhood-fest', 'community-events', 'free', '#301028', '#682452', '#F8D8EE', '#FFFFFF', '#DC8CBC', 'confetti', 65, '2026-04-19', 'Festive plum and confetti for street fairs and colony days.'],
    ['New Year Sparkle', 'new-year-sparkle', 'festival', 'free', '#0B0F26', '#1E2A5E', '#DCE4FF', '#FFFFFF', '#8C9EE0', 'stars', 88, '2026-04-02', 'Midnight blue and fireworks for New Year greetings and parties.'],
    ['Onam Harvest', 'onam-harvest', 'festival', 'free', '#0E2A16', '#22602E', '#E2F4D8', '#FFFFFF', '#96CE7A', 'floral', 83, '2026-04-08', 'Pookalam greens and marigold for Onam wishes and sadhya.'],
    ['Holi Colours', 'holi-colours', 'festival', 'free', '#2A0C34', '#7A1A5E', '#FFD6EE', '#FFFFFF', '#F074C0', 'confetti', 85, '2026-04-14', 'Gulal pinks and scattered colour for Holi invitations.']
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
      keywords: [r[0], cat ? cat.label : '', r[9]].join(' ').toLowerCase()
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
        var top = CATEGORIES.slice().sort(function (a, b) { return b.count - a.count; }).slice(0, 8);
        chipBar.innerHTML =
          '<button class="chip" type="button" data-chip-category="all" aria-pressed="true">' +
            IH.icon('layers', 15) + '<span>All</span><span class="chip__count">' + all.length + '</span>' +
          '</button>' +
          top.map(function (c) {
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

  function mountFeaturedTemplates() {
    qsa('[data-featured-templates]').forEach(function (host) {
      var limit = parseInt(host.getAttribute('data-limit'), 10) || 8;
      var filterCat = host.getAttribute('data-category');
      var list = TEMPLATES.slice();
      if (filterCat) list = list.filter(function (t) { return t.category === filterCat; });
      list.sort(function (a, b) { return b.popularity - a.popularity; });
      host.innerHTML = list.slice(0, limit).map(function (t, i) { return templateCardHTML(t, i < 2); }).join('');
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
