/* Backdrop cards (the generated-backgrounds look): a painted FLUX.2 Klein 4B
   card background with an illustrated border and an empty centre, the text on
   top. Per card: [name, category, tone, paper, title 'Script|Caps', extra,
   border subjects, venue scene (empty, no people)].
   tone 'light' | 'dark' sets the ink; paper is the plain centre colour.
   extra: engagement main event | birthday [age, audience] | anniversary years
   | event categories' sample title | null.
   Used by scripts/build-backdrop-rows.js and scripts/generate-backdrops.js.
   Never put numbers or words in a prompt: FLUX writes them out as garbled text. */
module.exports = {
  // Wedding (150 -> 153)
  'watercolor-blush-wedding': ['Blush Watercolour Wedding', 'wedding', 'light', 'warm cream', '', null, 'soft watercolour blush pink peonies, garden roses and eucalyptus with fine gold sparkles', 'an empty garden wedding mandap decorated with pink flowers and fairy lights'],
  'midnight-gold-wedding': ['Midnight Gold Mandap', 'wedding', 'dark', 'deep midnight navy', '', null, 'gold foil marigolds, lotus flowers and small brass bells', 'an empty grand palace wedding hall with gold chandeliers and marigold garlands'],
  'jasmine-temple-wedding': ['Jasmine Temple Arch', 'wedding', 'light', 'soft ivory', '', null, 'watercolour jasmine strings, mango leaves and a delicate gold temple arch outline', 'an empty South Indian kalyana mandapam decorated with jasmine and banana leaves'],
  // Engagement (40 -> 45)
  'watercolor-promise-engagement': ['Watercolour Promise', 'engagement', 'light', 'warm cream', 'Engagement|Ring Ceremony', null, 'watercolour blush roses and sage leaves with tiny gold sparkles', 'an empty elegant engagement lounge with blush roses and candles'],
  'emerald-gold-engagement': ['Emerald & Gold Promise', 'engagement', 'dark', 'deep emerald green', 'Engagement|Ring Ceremony', null, 'gold foil roses, gold leaves and fine gold geometric lines', 'an empty luxurious emerald and gold banquet hall with crystal chandeliers'],
  'lavender-mist-engagement': ['Lavender Mist Engagement', 'engagement', 'light', 'pale lavender', 'Engagement|In Bloom', null, 'watercolour lavender sprigs, lilac wisteria and small white flowers', 'an empty garden terrace with lavender flowers, white chairs and fairy lights'],
  'marigold-roka': ['Marigold Roka', 'engagement', 'light', 'warm ivory', 'Roka|Ceremony', 'Roka Ceremony', 'watercolour orange marigolds, red roses, mango leaves and small brass bells', 'an empty Indian home courtyard decorated with marigold garlands and brass lamps'],
  'starlit-velvet-engagement': ['Starlit Velvet Engagement', 'engagement', 'dark', 'deep plum', 'Engagement|Under the Stars', null, 'gold stars, a crescent moon and fine gold vines', 'an empty rooftop terrace at night with fairy lights under a starry sky'],
  // Reception (48 -> 51)
  'champagne-watercolor-reception': ['Champagne Watercolour Reception', 'reception', 'light', 'soft champagne', 'Reception|Wedding Celebration', null, 'watercolour champagne roses, gold leaves and soft golden bokeh dots', 'an empty elegant reception hall with champagne flowers and warm lights'],
  'noir-gold-reception': ['Noir Gold Soirée', 'reception', 'dark', 'deep black', 'Reception|Evening Soirée', null, 'gold art deco fans, gold lines and glowing string lights', 'an empty black and gold art deco ballroom with chandeliers'],
  'teal-garden-reception': ['Teal Garden Lights', 'reception', 'dark', 'deep teal', 'Reception|Garden Evening', null, 'hanging fairy lights, white flowers and green vines', 'an empty garden reception at night with fairy lights and white flowers'],
  // Birthday (74 -> 78)
  'watercolor-balloons-birthday': ['Watercolour Balloons', 'birthday', 'light', 'warm cream', 'Hooray|Birthday Party', [5, 'kid'], 'watercolour pastel balloons, bunting flags and confetti stars', 'an empty bright kids party room with pastel balloons and a cake table'],
  'golden-sparkle-birthday': ['Golden Sparkle Birthday', 'birthday', 'dark', 'deep black', 'Celebrate|Birthday Soirée', [30, 'adult'], 'gold confetti, champagne glasses and gold streamers', 'an empty chic black and gold lounge with a champagne tower and candles'],
  'floral-garden-birthday': ['Floral Garden Birthday', 'birthday', 'light', 'soft ivory', 'In Full Bloom|Birthday Celebration', [50, 'adult'], 'watercolour wildflowers, garden roses and butterflies', 'an empty garden party with a long table, flowers and lanterns'],
  'space-adventure-birthday': ['Space Adventure', 'birthday', 'dark', 'deep navy blue', 'Blast Off|Space Birthday Party', [7, 'kid'], 'cartoon rockets, colourful planets and twinkling stars', 'an empty kids party room decorated with planets, stars and rocket balloons'],
  // Baby shower (29 -> 33)
  'watercolor-clouds-shower': ['Watercolour Clouds', 'baby-shower', 'light', 'pale sky blue', 'Oh Baby|Baby Shower', null, 'watercolour soft clouds, tiny stars and a small hot air balloon', 'an empty baby shower room with soft blue balloons, clouds and a dessert table'],
  'blush-blooms-shower': ['Blush Blooms Shower', 'baby-shower', 'light', 'soft blush pink', 'Sweet Baby|Baby Shower', null, 'watercolour blush roses, baby breath flowers and tiny hearts', 'an empty blush pink baby shower setup with roses and a cake table'],
  'teddy-garden-shower': ['Teddy Garden', 'baby-shower', 'light', 'warm cream', 'Teddy Love|Baby Shower', null, 'watercolour teddy bears, balloons and soft greenery', 'an empty garden baby shower with teddy bears, balloons and a dessert table'],
  'godh-bharai-blessings': ['Godh Bharai Blessings', 'baby-shower', 'light', 'warm ivory', 'Godh Bharai|Baby Shower', null, 'watercolour orange marigolds, glass bangles, mango leaves and small diyas', 'an empty Indian hall decorated for a godh bharai with marigolds, a swing and brass lamps'],
  // Naming ceremony (29 -> 33)
  'watercolor-cradle-naming': ['Watercolour Cradle', 'naming-ceremony', 'light', 'warm cream', 'Little Blessing|Naming Ceremony', null, 'a watercolour flower cradle, small stars and a crescent moon', 'an empty naming ceremony room with a flower decorated cradle and soft lights'],
  'golden-lotus-naming': ['Golden Lotus Naming', 'naming-ceremony', 'dark', 'deep maroon', 'Namakarana|Naming Ceremony', null, 'gold lotus flowers, glowing diyas and temple bells', 'an empty Indian ceremony hall with a decorated cradle, lotus flowers and brass lamps'],
  'mint-leaves-naming': ['Mint Leaves Naming', 'naming-ceremony', 'light', 'pale mint', 'A Sweet Name|Naming Ceremony', null, 'watercolour mint leaves, small white flowers and tiny birds', 'an empty bright room with a white cradle, green leaves and white flowers'],
  'starry-moon-naming': ['Starry Moon Naming', 'naming-ceremony', 'dark', 'deep navy blue', 'Twinkle Star|Naming Ceremony', null, 'a gold crescent moon, gold stars and soft clouds', 'an empty nursery themed room with a cradle under star lights'],
  // Housewarming (29 -> 33)
  'watercolor-home-garden': ['Watercolour Home Garden', 'house-warming', 'light', 'warm cream', 'Home Sweet Home|Housewarming', null, 'watercolour potted plants, climbing flowers and a small cottage', 'an empty bright new home living room with plants and flowers'],
  'golden-toran-griha': ['Golden Toran', 'house-warming', 'dark', 'deep maroon', 'Griha Pravesh|Housewarming Ceremony', null, 'gold mango leaf torans, marigolds and brass lamps', 'an empty Indian home entrance with a marigold toran, rangoli and brass lamps'],
  'sage-door-housewarming': ['Sage Front Door', 'house-warming', 'light', 'pale sage green', 'Open Doors|Housewarming', null, 'watercolour green wreaths, a front door and soft greenery', 'an empty welcoming home entrance with a wreath on the door and potted plants'],
  'kolam-welcome-housewarming': ['Kolam Welcome', 'house-warming', 'light', 'soft ivory', 'Shubh Aarambh|Griha Pravesh', null, 'watercolour rangoli kolam patterns, marigolds and a brass kalash', 'an empty South Indian home threshold with a kolam, marigolds and a kalash'],
  // Anniversary (40 -> 45)
  'watercolor-roses-anniversary': ['Watercolour Roses Anniversary', 'anniversary', 'light', 'warm cream', 'Happy Anniversary|Anniversary', 10, 'watercolour red and pink roses with gold leaves', 'an empty romantic dinner setting with roses and candles'],
  'silver-moonlight-anniversary': ['Silver Moonlight', 'anniversary', 'dark', 'deep navy blue', 'Silver Jubilee|Anniversary', 25, 'silver roses, silver leaves and silver stars', 'an empty elegant navy and silver banquet hall with chandeliers'],
  'golden-vines-anniversary': ['Golden Vines', 'anniversary', 'dark', 'deep black', 'Golden Jubilee|Anniversary', 50, 'gold vines, gold roses and gold laurel leaves', 'an empty grand black and gold banquet hall with candles and roses'],
  'peony-love-anniversary': ['Peony Love', 'anniversary', 'light', 'soft blush pink', 'Still in Love|Anniversary', 15, 'watercolour pink peonies, small hearts and gold sparkles', 'an empty romantic garden table with peonies and candles'],
  'pearl-lace-anniversary': ['Pearl Lace', 'anniversary', 'light', 'soft ivory', 'Pearl|Anniversary', 30, 'pearl strings, white lace flowers and soft gold accents', 'an empty ivory and pearl themed banquet room with white flowers'],
  // Graduation (29 -> 33)
  'watercolor-laurel-graduation': ['Watercolour Laurel', 'graduation', 'light', 'warm cream', 'Congratulations|Graduation', 'Class of 2027', 'watercolour laurel leaves, graduation caps and small gold stars', 'an empty university lawn set for a graduation celebration'],
  'navy-gold-convocation': ['Navy Gold Convocation', 'graduation', 'dark', 'deep navy blue', 'Convocation|Ceremony', 'Convocation 2027', 'gold laurel wreaths, graduation caps and gold stars', 'an empty convocation hall with navy and gold drapes'],
  'confetti-grad-party': ['Confetti Grad Party', 'graduation', 'light', 'warm cream', 'Grad Party|Celebration', 'Graduation Party', 'colourful confetti, balloons and graduation caps', 'an empty backyard graduation party with balloons and string lights'],
  'maroon-scroll-graduation': ['Maroon Scroll', 'graduation', 'dark', 'deep maroon', 'Proud Graduate|Celebration', 'Master of Science', 'gold diploma scrolls, quills and laurel leaves', 'an empty elegant academic dinner hall with maroon and gold decor'],
  // Retirement (19 -> 24)
  'watercolor-sunset-retirement': ['Watercolour Sunset', 'retirement', 'light', 'warm cream', 'Happy Retirement|Celebration', 'The Next Adventure', 'a watercolour sunset, palm trees and flying birds', 'an empty seaside terrace at sunset with lanterns'],
  'golden-laurel-retirement': ['Golden Laurel Retirement', 'retirement', 'dark', 'deep emerald green', 'With Honour|Retirement', 'A Life Well Served', 'gold laurel branches and gold leaves', 'an empty dignified banquet hall with emerald drapes and chandeliers'],
  'garden-bloom-retirement': ['Garden Bloom', 'retirement', 'light', 'soft ivory', 'Time to Bloom|Retirement', 'Time to Relax', 'watercolour garden flowers, a watering can and butterflies', 'an empty garden veranda with flowers and a tea table'],
  'coastal-breeze-retirement': ['Coastal Breeze', 'retirement', 'light', 'pale sky blue', 'Smooth Sailing|Retirement', 'Smooth Sailing Ahead', 'watercolour seashells, gentle waves and small sailboats', 'an empty seaside clubhouse terrace overlooking the sea'],
  'vintage-clock-retirement': ['Vintage Clock', 'retirement', 'dark', 'deep espresso brown', 'Time Well Spent|Retirement', 'Thirty Years of Service', 'gold vintage clocks, keys and leaves', 'an empty classic club lounge with leather chairs and brass lamps'],
  // Farewell (32 -> 36)
  'watercolor-paper-planes': ['Watercolour Paper Planes', 'farewell', 'light', 'warm cream', 'Bon Voyage|Farewell', 'Farewell Party', 'watercolour paper planes, soft clouds and dotted trails', 'an empty bright café decorated with paper planes and balloons'],
  'starry-road-farewell': ['Starry Road', 'farewell', 'dark', 'deep navy blue', 'Until We Meet Again|Farewell', 'One Last Evening', 'silver stars and a winding road under a night sky', 'an empty rooftop terrace at night with string lights'],
  'blossom-goodbye-farewell': ['Blossom Goodbye', 'farewell', 'light', 'soft blush pink', 'Fond Farewell|Celebration', 'With Best Wishes', 'watercolour cherry blossoms and drifting petals', 'an empty café garden under cherry blossom trees with tables'],
  'golden-toast-farewell': ['Golden Toast', 'farewell', 'dark', 'deep black', 'Cheers|To New Beginnings', 'Farewell Dinner', 'gold champagne glasses, confetti and stars', 'an empty elegant black and gold dining room with candles'],
  // Corporate (30 -> 33)
  'watercolor-skyline-corporate': ['Watercolour Skyline', 'corporate', 'light', 'soft white', 'Summit|Annual Conference', 'Annual Business Summit', 'a watercolour city skyline, fine blue geometric lines and soft gold', 'an empty modern conference hall with a stage and screens'],
  'navy-gold-gala-corporate': ['Navy Gold Gala', 'corporate', 'dark', 'deep navy blue', 'Gala Night|Corporate', 'Annual Corporate Gala', 'gold art deco lines and geometric patterns', 'an empty black tie gala ballroom with gold lights'],
  'emerald-geometric-corporate': ['Emerald Geometric', 'corporate', 'dark', 'deep emerald green', 'Leadership|Forum', 'Leadership Forum 2027', 'gold geometric hexagons and fine lines', 'an empty leadership forum auditorium with emerald lighting'],
  // Festival (126 -> 129)
  'watercolor-diya-festival': ['Watercolour Diyas', 'festival', 'light', 'warm cream', 'Deepavali|Festival of Lights', 'Deepavali Celebration', 'watercolour glowing diyas, orange marigolds and rangoli patterns', 'an empty Indian home courtyard at night glowing with diyas and a rangoli'],
  'watercolor-christmas': ['Watercolour Christmas', 'festival', 'light', 'soft white', 'Merry Christmas|Celebration', 'Christmas Get-Together', 'watercolour pine branches, red berries, ornaments and snowflakes', 'an empty cosy living room with a Christmas tree and fireplace'],
  'golden-eid-arch': ['Golden Eid Arch', 'festival', 'dark', 'deep navy blue', 'Eid Mubarak|Celebration', 'Eid Mubarak', 'gold lanterns, crescent moons and arabesque arches', 'an empty courtyard at night with brass lanterns and arches'],
  // School events (24 -> 27)
  'watercolor-crayons-school': ['Watercolour Crayons', 'school-events', 'light', 'warm cream', 'Annual Day|Celebration', 'School Annual Day', 'watercolour crayons, pencils, stars and paper planes', 'an empty school auditorium stage with colourful decorations'],
  'chalkboard-school-event': ['Chalkboard', 'school-events', 'dark', 'dark green chalkboard', 'Science Fair|Exhibition', 'Science Exhibition', 'white chalk drawings of stars, books, atoms and apples', 'an empty school exhibition hall with project tables'],
  'sports-pennant-school': ['Sports Pennants', 'school-events', 'light', 'soft white', 'Sports Day|Annual Meet', 'Annual Sports Meet', 'watercolour pennant flags, medals, footballs and stars', 'an empty school sports ground with a track and pennants'],
  // College events (36 -> 39)
  'neon-fest-college': ['Neon Fest', 'college-events', 'dark', 'deep purple', 'Fest Night|Campus Festival', 'Campus Fest 2027', 'glowing neon music notes, guitars and stage lights', 'an empty open air college fest stage with purple lights'],
  'watercolor-campus-college': ['Watercolour Campus', 'college-events', 'light', 'warm cream', 'Alumni Meet|Homecoming', 'Alumni Meet 2027', 'a watercolour university building, trees and laurel leaves', 'an empty heritage college courtyard with lanterns'],
  'circuit-tech-college': ['Circuit Tech', 'college-events', 'dark', 'deep dark teal', 'Tech Fest|Innovate', 'Tech Fest 2027', 'glowing teal circuit lines and metal gears', 'an empty tech fest arena with screens and teal lights'],
  // Party (42 -> 45)
  'watercolor-confetti-party': ['Watercolour Confetti', 'party', 'light', 'warm cream', 'Let’s Party|Celebration', 'Weekend Party', 'watercolour balloons, confetti and curly streamers', 'an empty living room decorated for a party with balloons'],
  'disco-night-party': ['Disco Night', 'party', 'dark', 'deep black', 'Disco Night|Party', 'Disco Night', 'mirror disco balls, neon stars and light beams', 'an empty disco dance floor with a mirror ball and neon lights'],
  'tropical-fiesta-party': ['Tropical Fiesta', 'party', 'light', 'soft white', 'Tropical|Fiesta', 'Tropical Fiesta', 'watercolour palm leaves, pink hibiscus and pineapples', 'an empty tropical poolside party with palms and lanterns'],
  // Community events (19 -> 24)
  'watercolor-neighbourhood': ['Watercolour Neighbourhood', 'community-events', 'light', 'warm cream', 'Neighbourhood|Get-Together', 'Neighbourhood Get-Together', 'watercolour row houses, trees and bunting flags', 'an empty residential street decorated with bunting and fairy lights'],
  'green-earth-community': ['Green Earth', 'community-events', 'light', 'pale mint', 'Go Green|Community Drive', 'Tree Planting Drive', 'watercolour green leaves, young saplings and a small globe', 'an empty green park ready for tree planting'],
  'marigold-cultural-community': ['Marigold Cultural Evening', 'community-events', 'dark', 'deep maroon', 'Cultural Evening|Community', 'Cultural Evening', 'gold marigold garlands, diyas and mandalas', 'an empty cultural stage with marigold garlands and brass lamps'],
  'charity-hearts-community': ['Hearts of Charity', 'community-events', 'light', 'soft ivory', 'Give Back|Charity', 'Charity Fundraiser', 'watercolour hearts, helping hands and small flowers', 'an empty elegant fundraiser hall with round tables and flowers'],
  'picnic-day-community': ['Community Picnic Day', 'community-events', 'light', 'warm cream', 'Picnic Day|Community', 'Community Picnic Day', 'watercolour picnic baskets, wild flowers and bunting', 'an empty sunny park with picnic blankets and baskets']
};
