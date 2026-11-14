/* Photo-real programme images (FLUX.2 Klein 4B, local ComfyUI) that replace the
   gold line-art event icons (EVENT_ICONS in js/wedding-designs.js) on every card.
   Each object is rendered on white, keyed to alpha (scripts/key-free.js) and
   downscaled to SIZE px on its longer side.
   Output: images/event-icons/<kind>.png, manifest images/event-icons/manifest.json
   Raw FLUX output: ai-generated/comfyui-raw/EVENT-ICONS/
   Usage: node scripts/generate-event-icons.js [kind ...] [--force] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { generate } = require('../redesign-100/work/flux');
const { keyFree } = require('./key-free');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'event-icons');
const RAW = path.join(ROOT, 'ai-generated', 'comfyui-raw', 'EVENT-ICONS');
const MF = path.join(OUT, 'manifest.json');
const SIZE = 256, ATTEMPTS = +process.env.ATTEMPTS || 4;
const STYLE = ', a single compact object centred in the frame, front three-quarter view, photorealistic premium product photography, soft even studio light, rich true colours, ultra fine detail, ' +
  'the whole object fully visible with a wide empty white margin on every side, not touching the edges of the image, no text, no letters, no numbers, no watermark, no logo, no people, no hands, no cast shadow, isolated on a plain pure white background';
const KINDS = {
  haldi: 'A polished engraved brass bowl filled with smooth yellow turmeric paste on a small brass plate, with orange marigold flowers, fresh turmeric roots and green mango leaves',
  mehndi: 'A small brass bowl of fresh green henna paste with two henna cones beside it, a few green henna leaves and white jasmine flowers',
  wedding: 'A pair of shining gold wedding rings with a small diamond, resting together on a small round red velvet cushion with a few red rose petals',
  reception: 'Two elegant crystal champagne flutes with gold rims filled with sparkling champagne, gently clinking together, a small white rose at their base',
  games: 'A small cheerful pile of party games: a colourful wooden spinning top, two red dice and a bright toy gamepad',
  cake: 'A small two-tier celebration cake with smooth white frosting, pastel sugar flowers and a single lit candle on top, on a gold cake stand',
  meal: 'An elegant gourmet dinner plate on fine white porcelain with a gold rim, beautifully plated food, a polished silver fork and knife beside it',
  music: 'A shiny polished golden brass saxophone standing upright',
  diya: 'A traditional lit brass oil diya lamp with a warm glowing flame, resting on a few orange marigold petals',
  gift: 'A luxury gift box wrapped in rich deep red paper tied with a large gold satin ribbon bow',
  mic: 'A classic vintage chrome stage microphone on a short black desk stand',
  award: 'A shiny polished gold trophy cup with two handles on a black marble base',
  camera: 'A vintage film camera with a silver body, black leather trim and a large glass lens',
  home: 'A small charming miniature model house with a red tiled roof, white walls and warm glowing windows',
  badge: 'A conference lanyard with a navy blue strap and a plain blank white name badge card in a clear holder',
  star: 'A glossy polished gold metallic star ornament with a soft sparkle',
  // Pictures that say what the programme title says (2026-11-14).
  stage: 'An ornate royal two-seater Indian wedding reception sofa in deep red velvet with a carved gold frame, decorated with garlands of white jasmine and red roses',
  cradle: 'A traditional Indian carved wooden baby cradle decorated with orange marigold garlands and soft white cushions inside',
  gradcap: 'A black graduation mortarboard cap with a gold tassel resting on a rolled diploma scroll tied with a red ribbon',
  crackers: 'A festive bundle of colourful Diwali firework rockets and a lit golden sparkler throwing bright sparks',
  dj: 'A modern black DJ turntable controller with two round decks and glowing coloured buttons, a pair of headphones resting on top',
  bouquet: 'A welcoming bouquet of fresh red roses, white lilies and pink carnations wrapped in cream paper and tied with a gold ribbon',
  mandap: 'A small traditional Indian wedding mandap with four carved golden pillars draped in red and white flower garlands and marigolds, a sacred homam fire burning in a square brass havan kund at its centre, brass kalash pots at the corners',
  // Cartoon, never photo-real people (user, 2026-11-14). mandap.png is a 256px copy of images/ceremony-icons/wedding.png.
  couple: 'A cute 3D animated cartoon illustration of a bride and groom standing close together smiling, big round brown eyes, rosy cheeks, the bride in a white lace off-shoulder wedding gown with a long veil holding a bouquet of pink and white roses, the groom in a black tuxedo with a bow tie and a white rose boutonniere, half-length portrait, behind them a round wedding arch of pink and white roses with soft pink drapes, pastel colours, soft warm light, charming storybook animation film style',
  'thali': 'A Tamil wedding thali: a gold mangalyam pendant on a thick yellow turmeric thread, laid on a brass plate with turmeric roots, betel leaves, a coconut and white jasmine flowers',
  'nilavilakku': 'A tall Kerala brass nilavilakku oil lamp with lit wicks, beside a brass para measure filled with rice paddy and a spray of golden coconut flowers, on a green banana leaf',
  'chooda': 'A set of Punjabi bridal red and ivory chooda bangles stacked together with golden kalire ornaments hanging from them, resting on a folded pink phulkari cloth with marigold flowers',
  'topor': 'A Bengali wedding white sholapith topor groom crown and a white bridal mukut tiara, with red and white shankha pola bangles and a small pot of red sindoor beside them',
  'chori': 'A Gujarati wedding chori: four stacks of brightly painted clay pots with green mango leaves and a coconut on top, joined by marigold garlands, a small sacred fire in a brass vessel at the centre',
  'mundavalya': 'A Maharashtrian wedding set: two strings of white pearl mundavalya with gold beads, green glass bangles and a pearl nath nose ring, arranged on a folded purple and gold paithani silk cloth',
  'safa': 'A royal Rajasthani groom red and gold bandhani safa turban with a jewelled kalgi brooch and feather, beside a pearl necklace and a small ornate sword, on a red velvet cushion',
  'horse': 'A beautiful white wedding mare standing calmly, dressed for an Indian baraat in a richly embroidered red and gold saddle cloth, gold tassels and a jewelled headpiece',
  'varmala': 'Two thick Indian wedding varmala garlands of red roses and white tuberose flowers with gold tassels, laid together in a circle on a brass plate',
  'doli': 'A traditional Indian bridal doli palanquin of carved wood painted red and gold, with red silk curtains, gold tassels and marigold garlands',
  'nikah': 'An ornate silver tray holding two gold wedding rings on green velvet, a small crystal attar perfume bottle, red roses, and a silver bowl of dates',
  'bells': 'Two silver wedding bells tied together with a large white satin ribbon bow, decorated with white roses and green leaves',
  'lotus': 'A brass bowl of floating pink lotus flowers with small lit candles, beside a polished brass oil lamp and white jasmine garlands',
  'sake': 'A Japanese wedding san-san-kudo set: three stacked red lacquer sake cups and a gold sake pourer decorated with gold and silver mizuhiki cord knots, on a small black lacquer tray',
  'ducks': 'A pair of traditional Korean wooden wedding ducks painted in bright colours, tied together with red and blue silk cloth',
  'tea': 'A Chinese wedding tea ceremony set: a red porcelain teapot with gold patterns and two matching lidded cups on a red lacquer tray, with red dates and lotus seeds',
  'roka': 'An Indian roka shagun thali: a decorated silver plate holding a coconut wrapped in red cloth, a box of sweets, dry fruits, a small bowl of red kumkum and marigold flowers',
  'tilak': 'An Indian tilak ceremony thali: a brass plate with a small bowl of red kumkum, a bowl of rice grains, a lit diya lamp, a coconut and marigold flowers',
  'couple-indian': 'A cute 3D animated cartoon illustration of an Indian bride and groom standing close together smiling, big round brown eyes, rosy cheeks, the bride in a red and gold bridal lehenga with a red dupatta over her head and gold jewellery, the groom in a cream and gold sherwani with a red safa turban, half-length portrait, behind them a reception stage arch of red roses and marigolds with warm fairy lights, soft warm light, charming storybook animation film style',
  'couple-south': 'A cute 3D animated cartoon illustration of a South Indian bride and groom standing close together smiling, big round brown eyes, rosy cheeks, the bride in a red and gold kanchipuram silk saree with jasmine flowers in her hair and gold temple jewellery, the groom in a cream silk shirt and a white veshti with a gold border, half-length portrait, behind them a reception stage arch of jasmine garlands, marigolds and banana leaves with brass lamps, soft warm light, charming storybook animation film style',
  'couple-brides': 'A cute 3D animated cartoon illustration of two brides standing close together smiling, big round brown eyes, rosy cheeks, one bride in a white lace wedding gown with a veil holding a bouquet of pink roses, the other bride in a cream satin wedding gown with flowers in her hair, half-length portrait, behind them a round wedding arch of pink and white roses with soft pink drapes, pastel colours, soft warm light, charming storybook animation film style',
  'couple-grooms': 'A cute 3D animated cartoon illustration of two grooms standing close together smiling, big round brown eyes, rosy cheeks, one groom in a black tuxedo with a bow tie, the other groom in a navy blue suit with a white rose boutonniere, half-length portrait, behind them a round wedding arch of white roses and green leaves with soft cream drapes, pastel colours, soft warm light, charming storybook animation film style',
  // Per-design pictures for the other categories (ART_SWAP in js/wedding-designs.js).
  gulal: 'Five small brass bowls heaped with bright Holi gulal colour powders in pink, yellow, green, blue and orange, arranged on a brass plate with a few marigold flowers',
  dandiya: 'A pair of crossed Navratri dandiya sticks wrapped in bright red, yellow and green cloth with mirror work and gold tassels',
  modak: 'A brass plate piled with white steamed modak sweets, decorated with red hibiscus flowers and green durva grass',
  matki: 'A decorated clay dahi handi pot painted in bright colours, hung with marigold garlands, with a bamboo flute and a peacock feather resting against it',
  rakhi: 'A Raksha Bandhan thali: a silver plate with two ornate rakhi threads with beads, a small diya lamp, a bowl of red kumkum, rice grains and Indian sweets',
  pongalpot: 'A decorated clay Pongal pot overflowing with boiling sweet rice, tied with turmeric leaves, standing beside sugarcane stalks and a kolam of rice flour',
  kite: 'Three colourful Indian paper kites in red, yellow and blue with a wooden spool of kite string',
  pookalam: 'A round Onam pookalam flower carpet of concentric rings of orange, yellow, white and red flower petals with a small brass lamp at its centre',
  sadhya: 'A traditional South Indian feast served on a fresh green banana leaf: white rice, sambar, several colourful vegetable curries, papadam, banana chips and payasam in a small bowl',
  bonfire: 'A festive Lohri bonfire of stacked wooden logs with bright flames, with popcorn, peanuts and sweets in small baskets beside it',
  lantern: 'An ornate golden Ramadan fanous lantern with coloured glass panels and a warm glowing candle inside, beside a small gold crescent moon ornament and a bowl of dates',
  candles: 'Three lit ivory pillar candles of different heights on a round gold tray, decorated with white flowers and green leaves',
  xmastree: 'A small decorated Christmas tree with red and gold baubles, warm fairy lights and a gold star on top, with a few wrapped presents beneath it',
  eastereggs: 'A wicker Easter basket filled with brightly painted Easter eggs, with yellow tulips and a pastel ribbon bow',
  menorah: 'A polished gold Hanukkah menorah with nine lit blue and white candles',
  redlantern: 'Two round red Chinese New Year paper lanterns with gold tassels hanging from a branch of pink plum blossom',
  hearts: 'A bunch of glossy red heart-shaped balloons tied with gold ribbon above a small bouquet of red roses',
  pumpkin: 'A carved orange Halloween jack-o-lantern pumpkin glowing from inside, with two small pumpkins and autumn leaves beside it',
  toys: 'A soft brown teddy bear with a blue bow sitting beside colourful plain wooden building blocks and two pastel balloons',
  rocket: 'A shiny red and white toy space rocket standing upright with a small toy astronaut and two little planets beside it',
  dino: 'A friendly green toy dinosaur wearing a small colourful party hat, standing beside tropical jungle leaves',
  unicorn: 'A plush white toy unicorn with a pastel rainbow mane, a golden horn and a small sparkly tiara',
  football: 'A round soccer ball with black pentagons and white hexagons, with a gold trophy cup and a whistle on a ribbon beside it',
  balloons: 'An elegant bunch of gold, white and champagne balloons tied together with long gold ribbons',
  babygift: 'A wicker baby gift basket holding a soft white teddy bear, a pair of knitted cream baby booties, a baby bottle and a rattle, tied with a cream satin bow',
  babyblue: 'A wicker baby gift basket holding a soft teddy bear with a blue bow, a pair of knitted pastel blue baby booties, a baby bottle and a rattle, tied with a blue satin bow',
  babypink: 'A wicker baby gift basket holding a soft teddy bear with a pink bow, a pair of knitted pastel pink baby booties, a baby bottle and a rattle, tied with a pink satin bow',
  babymoon: 'A baby nursery mobile of a soft plush crescent moon with a sleeping teddy bear on it and small hanging gold stars and white clouds',
  toran: 'A carved wooden Indian front door decorated with a toran of green mango leaves and marigold flowers, with a brass kalash pot topped by a coconut on the doorstep and a rangoli in front',
  keys: 'A set of shiny golden house keys on a ring with a small house-shaped keychain, tied with a red satin ribbon bow',
  villa: 'A miniature model of a grand white two-storey villa with tall columns, balconies, a red tiled roof and warm glowing windows',
  cottage: 'A miniature model of a cosy cottage with a thatched roof, climbing roses on the walls, a small flower garden and a white picket fence',
  cakesilver: 'A two-tier anniversary cake with smooth white frosting, silver ribbon bands, silver sugar pearls and white sugar roses, on a silver cake stand',
  cakegold: 'A two-tier anniversary cake with smooth ivory frosting, gold leaf details, gold ribbon bands and golden sugar roses, on a gold cake stand',
  cakerose: 'A two-tier anniversary cake with smooth blush pink frosting covered in deep red sugar roses and rose petals, on a gold cake stand',
  brunch: 'A brunch tray with a stack of golden pancakes topped with berries, a croissant, a glass of orange juice and a white cup of coffee, with a small vase of flowers',
  diploma: 'A rolled cream diploma scroll tied with a maroon ribbon and a gold wax seal, resting beside a small gold laurel wreath',
  suitcase: 'A vintage brown leather travel suitcase with colourful blank travel stickers, a small desk globe and a toy paper plane beside it',
  books: 'A neat stack of three colourful hardcover books with a shiny red apple on top and two sharpened pencils beside them',
  ribbon: 'A wide red satin grand opening ribbon tied in a large bow with a pair of ceremonial golden scissors laid across it',
  laptop: 'A slim modern silver laptop open with a plain glowing blank blue screen, a spiral notebook, a pen and a cup of coffee beside it',
  science: 'A brass and black laboratory microscope beside a glass conical flask of blue liquid, a test tube rack with coloured liquids and a small model of an atom',
  palette: 'A wooden artist palette with bright dabs of oil paint, three paint brushes and a small blank canvas on a mini easel',
  beachball: 'A bright striped inflatable beach ball beside a pink flamingo pool float, a pair of sunglasses and a tropical drink with a paper umbrella',
  bbq: 'A small round black barbecue grill with skewers of grilled vegetables and paneer and corn on the cob cooking over glowing coals',
  popcorn: 'A red and white striped box overflowing with popcorn beside a black film clapperboard and a reel of film',
  mask: 'An ornate Venetian masquerade mask in gold and black with purple feathers and jewels on a gold handle',
  sapling: 'A young green tree sapling growing from a mound of rich soil in a small burlap sack, with a small garden trowel and a green watering can beside it',
  charity: 'A clear glass donation jar filled with coins with a red heart on its front, tied with a red ribbon',
  ringemerald: 'A pair of gold engagement rings, one set with a large green emerald, resting together on a small round emerald green velvet cushion with white rose petals',
  ringsapphire: 'A pair of white gold engagement rings, one set with a large blue sapphire, resting together on a small round navy blue velvet cushion with white rose petals',
  ringpearl: 'A pair of gold engagement rings, one set with a lustrous white pearl, resting together on a small round ivory satin cushion with white pearls and rose petals',
  ringrose: 'A pair of rose gold engagement rings with a small pink diamond, resting together on a small round blush pink velvet cushion with pink rose petals',
  medal: 'A small shiny round gold winner medal with a laurel wreath design, lying flat with its short red and blue ribbon neatly folded beside it'
};
function seedOf(s, n) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 9000000) + 1000000 + n * 7919; }

/* In the page: shrink the keyed cut-out to `size` px on its longer side. */
function shrink([src, size]) {
  return (async () => {
    const img = new Image(); img.src = src; await img.decode();
    const k = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  })();
}

(async () => {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const force = process.argv.includes('--force');
  const kinds = args.length ? args : Object.keys(KINDS);
  const log = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, 'utf8')) : {};
  const save = () => fs.writeFileSync(MF, JSON.stringify(log, null, 1));
  fs.mkdirSync(RAW, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage();
  for (const kind of kinds) {
    const dest = path.join(OUT, kind + '.png');
    if (!KINDS[kind]) { console.log('unknown', kind); continue; }
    if (fs.existsSync(dest) && !force) { console.log('skip', kind); continue; }
    let done = false;
    for (let n = 0; n < ATTEMPTS && !done; n++) {
      // `couple` is the one picture with people in it.
      const seed = seedOf(kind, n), text = KINDS[kind] + (/^couple/.test(kind) ? ', one compact scene centred in the frame, the whole scene fully visible with a wide empty white margin on every side, not touching the edges of the image, not photorealistic, no text, no letters, no watermark, no logo, no cast shadow, isolated on a plain pure white background' : STYLE);
      const raw = path.join(RAW, kind + '__' + seed + '.png');
      if (!fs.existsSync(raw)) {
        const out = await generate({ prefix: 'EVT_' + kind, w: 768, h: 768, seed, text });
        fs.copyFileSync(out, raw); try { fs.unlinkSync(out); } catch (e) { /* OneDrive lock; collected later */ }
      }
      const k = await page.evaluate(keyFree, ['data:image/png;base64,' + fs.readFileSync(raw).toString('base64'), 0.03]);
      if (!k.ok) { console.log('retry', kind, JSON.stringify({ coverage: k.coverage, touch: k.touch, bgOk: k.bgOk })); continue; }
      const png = await page.evaluate(shrink, [k.png, SIZE]);
      fs.writeFileSync(dest, Buffer.from(png.split(',')[1], 'base64'));
      log[kind] = { model: 'flux-2-klein-4b.safetensors', seed, prompt: text, raw: path.relative(ROOT, raw).split(path.sep).join('/'), coverage: k.coverage, edgeTouch: k.touch };
      save(); console.log('ok', kind); done = true;
    }
    if (!done) console.log('FAIL', kind);
  }
  save(); await b.close();
})();
