/* ==========================================================================
   InviteAura — preview.js
   Two things live here:
     1. IH.invitation — the invitation renderer shared by the preview page,
        the preview modal and the live editor on create.html.
     2. The preview.html page controller (zoom, device switch, fullscreen).
   ========================================================================== */

(function (window, document) {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;
  var qs = dom.qs, qsa = dom.qsa, on = dom.on, escapeHtml = dom.escapeHtml;

  /* ==================================================================
     PART 1 — Invitation renderer
     ================================================================== */

  /* Event types drive both the wording and the visual variant. */
  var EVENT_TYPES = {
    wedding:           { label: 'Wedding',          icon: 'rings',           kicker: 'Together with their families', motif: 'floral',   defaultTemplate: 'elegant-floral' },
    engagement:        { label: 'Engagement',       icon: 'rings',           kicker: 'Engagement Ceremony',          motif: 'rings',    defaultTemplate: 'modern-engagement' },
    reception:         { label: 'Reception',        icon: 'sparkles',        kicker: 'Wedding Reception',            motif: 'sparkles', defaultTemplate: 'grand-reception' },
    birthday:          { label: 'Birthday',         icon: 'cake',            kicker: 'You are invited to',           motif: 'balloons', defaultTemplate: 'kids-birthday' },
    'baby-shower':     { label: 'Baby Shower',      icon: 'baby',            kicker: 'Baby Shower',                  motif: 'cloud',    defaultTemplate: 'baby-dreams' },
    'naming-ceremony': { label: 'Naming Ceremony',  icon: 'praying-hands',   kicker: 'Namakarana Ceremony',          motif: 'lotus',    defaultTemplate: 'naming-ceremony' },
    'house-warming':   { label: 'Housewarming',     icon: 'home',            kicker: 'Griha Pravesh',                motif: 'lotus',    defaultTemplate: 'new-beginnings' },
    anniversary:       { label: 'Anniversary',      icon: 'gift',            kicker: 'Wedding Anniversary',          motif: 'laurel',   defaultTemplate: 'floral-anniversary' },
    graduation:        { label: 'Graduation',       icon: 'graduation-cap',  kicker: 'Graduation Day',               motif: 'laurel',   defaultTemplate: 'graduation-day' },
    retirement:        { label: 'Retirement',       icon: 'leaf',            kicker: 'Retirement Felicitation',      motif: 'laurel',   defaultTemplate: 'retirement-honour' },
    farewell:          { label: 'Farewell',         icon: 'users',           kicker: 'Farewell',                     motif: 'sparkles', defaultTemplate: 'farewell-evening' },
    corporate:         { label: 'Corporate',        icon: 'briefcase',       kicker: 'You are invited',              motif: 'chevron',  defaultTemplate: 'corporate-event' },
    festival:          { label: 'Festival',         icon: 'flame',           kicker: 'Festival Greetings',           motif: 'lotus',    defaultTemplate: 'festival-celebration' },
    'school-events':   { label: 'School Event',     icon: 'book-open',       kicker: 'School Event',                 motif: 'chevron',  defaultTemplate: 'school-annual-day' },
    'college-events':  { label: 'College Event',    icon: 'music',           kicker: 'College Event',                motif: 'chevron',  defaultTemplate: 'college-fest' },
    party:             { label: 'Party',            icon: 'party-popper',    kicker: 'Come celebrate',               motif: 'sparkles', defaultTemplate: 'house-party' },
    'community-events':{ label: 'Community Event',  icon: 'flag',            kicker: 'Community Gathering',          motif: 'chevron',  defaultTemplate: 'community-gathering' },
    other:             { label: 'Other',            icon: 'sparkles',        kicker: 'You are invited',              motif: 'floral',   defaultTemplate: 'minimal-wedding' }
  };

  /* Decorative header ornaments, drawn inline so they inherit the card colour. */
  var ORNAMENTS = {
    floral: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
      '<circle cx="40" cy="40" r="6"/>' +
      '<g stroke-linecap="round">' +
      '<path d="M40 34c-4-6-4-12 0-18 4 6 4 12 0 18zM40 46c4 6 4 12 0 18-4-6-4-12 0-18z"/>' +
      '<path d="M34 40c-6-4-12-4-18 0 6 4 12 4 18 0zM46 40c6 4 12 4 18 0-6-4-12-4-18 0z"/>' +
      '<path d="M35.8 35.8c-2.6-6.6-6.8-10.8-13.4-13.4 2.6 6.6 6.8 10.8 13.4 13.4zM44.2 44.2c2.6 6.6 6.8 10.8 13.4 13.4-2.6-6.6-6.8-10.8-13.4-13.4z"/>' +
      '<path d="M44.2 35.8c6.6-2.6 10.8-6.8 13.4-13.4-6.6 2.6-10.8 6.8-13.4 13.4zM35.8 44.2c-6.6 2.6-10.8 6.8-13.4 13.4 6.6-2.6 10.8-6.8 13.4-13.4z"/>' +
      '</g></svg>',
    rings: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="32" cy="46" r="17"/><circle cx="48" cy="46" r="17"/>' +
      '<path d="M48 29l4 6h-8z" fill="currentColor" stroke="none"/>' +
      '<path d="M14 20h12M54 20h12" stroke-linecap="round" opacity=".5"/></svg>',
    balloons: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      '<ellipse cx="26" cy="28" rx="12" ry="15" fill="currentColor" opacity=".22"/>' +
      '<ellipse cx="26" cy="28" rx="12" ry="15"/>' +
      '<ellipse cx="52" cy="24" rx="11" ry="14" fill="currentColor" opacity=".14"/>' +
      '<ellipse cx="52" cy="24" rx="11" ry="14"/>' +
      '<path d="M26 43c4 8-2 12 0 22M52 38c-4 8 2 12 0 20" stroke-linecap="round"/></svg>',
    cloud: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      '<path d="M22 48a10 10 0 0 1 1.4-19.9A15 15 0 0 1 52 30a9 9 0 0 1 6 18z" fill="currentColor" opacity=".16"/>' +
      '<path d="M22 48a10 10 0 0 1 1.4-19.9A15 15 0 0 1 52 30a9 9 0 0 1 6 18z"/>' +
      '<path d="M30 58v4M40 60v6M50 58v4" stroke-linecap="round" opacity=".65"/></svg>',
    lotus: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path d="M40 20c6 10 6 22 0 34-6-12-6-24 0-34z"/>' +
      '<path d="M40 54c-9 0-17-6-20-16 10-2 17 4 20 16zM40 54c9 0 17-6 20-16-10-2-17 4-20 16z"/>' +
      '<path d="M40 54c-7-3-11-10-11-19 7 3 11 10 11 19zM40 54c7-3 11-10 11-19-7 3-11 10-11 19z"/>' +
      '<path d="M16 58h48" stroke-linecap="round" opacity=".5"/></svg>',
    laurel: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path d="M40 66C24 62 16 50 18 32M40 66c16-4 24-16 22-34" stroke-linecap="round"/>' +
      '<g fill="currentColor" opacity=".55" stroke="none">' +
      '<ellipse cx="21" cy="38" rx="5" ry="2.6" transform="rotate(-35 21 38)"/>' +
      '<ellipse cx="24" cy="48" rx="5" ry="2.6" transform="rotate(-20 24 48)"/>' +
      '<ellipse cx="30" cy="57" rx="5" ry="2.6" transform="rotate(-8 30 57)"/>' +
      '<ellipse cx="59" cy="38" rx="5" ry="2.6" transform="rotate(35 59 38)"/>' +
      '<ellipse cx="56" cy="48" rx="5" ry="2.6" transform="rotate(20 56 48)"/>' +
      '<ellipse cx="50" cy="57" rx="5" ry="2.6" transform="rotate(8 50 57)"/>' +
      '</g><circle cx="40" cy="22" r="5"/></svg>',
    sparkles: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path d="M40 16l4.6 12.4L57 33l-12.4 4.6L40 50l-4.6-12.4L23 33l12.4-4.6z" fill="currentColor" opacity=".3"/>' +
      '<path d="M40 16l4.6 12.4L57 33l-12.4 4.6L40 50l-4.6-12.4L23 33l12.4-4.6z"/>' +
      '<path d="M60 50l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM18 52l1.6 4 4 1.6-4 1.6L18 63l-1.6-4-4-1.6 4-1.6z" fill="currentColor" opacity=".55" stroke="none"/></svg>',
    chevron: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M14 46h52" stroke-linecap="round"/>' +
      '<path d="M26 34l14-14 14 14" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M18 56h20M42 56h20" stroke-linecap="round" opacity=".45"/></svg>',
    'palace-arch': '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
      '<path d="M12 62h56M16 62V38c0-14 10-24 24-24s24 10 24 24v24" stroke-linecap="round"/>' +
      '<path d="M22 62V40c0-10 8-18 18-18s18 8 18 18v22" stroke-linecap="round"/>' +
      '<path d="M40 10v4M40 8c1.5 0 3 1.5 3 3 0 1.5-1.5 3-3 3s-3-1.5-3-3c0-1.5 1.5-3 3-3z" fill="currentColor" stroke="none"/>' +
      '<circle cx="40" cy="38" r="4" fill="currentColor" opacity=".5"/>' +
      '<path d="M28 62V46c0-6 5-11 12-11s12 5 12 11v16" stroke-linecap="round" opacity=".6"/></svg>',
    kolam: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<circle cx="40" cy="40" r="14" stroke="currentColor" stroke-width="1.2"/>' +
      '<path d="M40 12v56M12 40h56M20 20l40 40M20 60l40-40" stroke-linecap="round" opacity=".6"/>' +
      '<circle cx="40" cy="40" r="4" fill="currentColor"/></svg>'
  };

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function formatDate(value) {
    var d = IH.countdown ? IH.countdown.parse(value) : new Date(value);
    if (!d || isNaN(d.getTime())) return { full: '', day: '', month: '', year: '', weekday: '' };
    return {
      full: d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(),
      day: String(d.getDate()),
      month: MONTHS[d.getMonth()],
      year: String(d.getFullYear()),
      weekday: WEEKDAYS[d.getDay()]
    };
  }

  function formatTime(value) {
    if (!value) return '';
    var m = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return String(value);
    var h = parseInt(m[1], 10);
    var mins = m[2];
    var period = h >= 12 ? 'PM' : 'AM';
    var display = h % 12;
    if (display === 0) display = 12;
    return display + ':' + mins + ' ' + period;
  }

  /* Combine date + time into the ISO-ish value the countdown understands. */
  function toDateTime(date, time) {
    if (!date) return '';
    return time ? date + 'T' + time : date;
  }

  /* Single quotes on purpose: these land inside a style="…" attribute, and
     double quotes would close it early and drop both font variables. */
  var GOOGLE_FONTS = {
    playfair: { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
    /* Regional defaults, used when no heading font is picked. */
    telugu: { display: "'Playfair Display', 'Noto Serif Telugu', Georgia, serif", body: "'Cormorant Garamond', 'Noto Serif Telugu', 'DM Sans', serif" },
    cinzel: { display: "'Cinzel', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
    tamil: { display: "'Cinzel', 'Noto Serif Tamil', Georgia, serif", body: "'Cormorant Garamond', 'Noto Serif Tamil', 'DM Sans', serif" },
    cormorant: { display: "'Cormorant Garamond', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
    dmsans: { display: "'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
    greatvibes: { display: "'Great Vibes', 'Playfair Display', cursive", body: "'DM Sans', system-ui, sans-serif" }
  };

  /* ------------------------------------------------------------------
     Gender-aware wording for naming ceremonies.
     A naming ceremony announces the baby by relation, so any gender
     wording in the message ("we name our daughter", "bless our son",
     "welcome our little girl" …) has to follow the Baby's relation
     field the host picked — never a word frozen into the copy when the
     card was written. Only genuinely gendered words are swapped and
     only for this event type, so neutral phrasing is left untouched.
     ------------------------------------------------------------------ */

  /* female -> male, applied when Baby's relation is Son */
  var FEMALE_TO_MALE = [
    ['daughter', 'son'], ['daughters', 'sons'],
    ['girl', 'boy'], ['girls', 'boys'],
    ['princess', 'prince'], ['princesses', 'princes'],
    ['she', 'he'], ['her', 'his'], ['herself', 'himself']
  ];

  /* male -> female, applied when Baby's relation is Daughter */
  var MALE_TO_FEMALE = [
    ['son', 'daughter'], ['sons', 'daughters'],
    ['boy', 'girl'], ['boys', 'girls'],
    ['prince', 'princess'], ['princes', 'princesses'],
    ['he', 'she'], ['him', 'her'], ['his', 'her'], ['himself', 'herself']
  ];

  function genderizeText(text, relation) {
    if (!text) return text;
    var isDaughter = /daughter/i.test(String(relation || ''));
    var pairs = isDaughter ? MALE_TO_FEMALE : FEMALE_TO_MALE;
    var map = {};
    var words = pairs.map(function (p) { map[p[0]] = p[1]; return p[0]; });
    var re = new RegExp('\\b(' + words.join('|') + ')\\b', 'gi');
    return String(text).replace(re, function (match) {
      var replacement = map[match.toLowerCase()];
      if (!replacement) return match;
      /* Mirror the capitalisation of the original word. */
      if (match === match.toUpperCase() && replacement.length > 1) return replacement.toUpperCase();
      if (match.charAt(0) === match.charAt(0).toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  /**
   * Generate Google Maps URL with priority: mapsUrl > address
   * @param {Object} data - Invitation data containing mapsUrl, address
   * @returns {string} Google Maps URL
   */
  function getMapsUrl(data) {
    if (data.mapsUrl) {
      return data.mapsUrl;
    }
    if (data.address) {
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.address);
    }
    return '';
  }

  /* Default demo content, used by the sample invitation and as editor seed. */
  var SAMPLE = {
    eventType: 'wedding',
    template: 'elegant-floral',
    title: 'The Wedding Celebration',
    additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
    additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
    hostName: 'Both Families',
    brideName: 'Bride',
    groomName: 'Groom',
    groomParents: 'Groom’s Parents',
    brideParents: 'Bride’s Parents',
    personName: '',
    date: '2026-12-25',
    time: '18:30',
    venue: 'Grand Palace Hall',
    address: 'Anna Salai, Chennai, Tamil Nadu 600002',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Chennai',
    phone: '0000000000',
    email: 'hello@example.com',
    message: 'Request the pleasure of your company as we begin our life together.\nYour presence would make our day complete.',
    photo: '',
    music: 'none',
    musicFile: '',
    font: '',
    showCountdown: true,
    showMaps: true
  };

  /* ------------------------------------------------------------------
     Wedding wording per design. Each set fills Additional title,
     Additional subtitle and Invitation message; a design gets the set
     that matches its name and keywords (regional, religious, royal,
     floral, modern), and designs with no clear theme spread over the
     general sets so neighbouring cards read differently.
     ------------------------------------------------------------------ */
  var WEDDING_TEXT = {
    blessed: { title: 'A BLESSED BEGINNING\nWith the blessings of our parents', subtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
      message: 'Request the pleasure of your company as we begin our life together.\nYour presence would make our day complete.' },
    hindu: { title: 'SHUBH VIVAH\nWith the blessings of Lord Ganesha and our elders', subtitle: 'AN AUSPICIOUS UNION\nWe cordially invite you to the sacred wedding of',
      message: 'Kindly grace the occasion and bless the couple as they take the seven sacred vows.\nYour blessings mean the world to us.' },
    south: { title: 'SUBHA MUHURTHAM\nWith the divine blessings of our family deity', subtitle: 'A SACRED BEGINNING\nWe request your gracious presence at the marriage of',
      message: 'Please join us with your family and bless the couple on this auspicious day.\nYour presence will make the celebration complete.' },
    telugu: { title: 'SHUBHA LEKHA\nWith the blessings of Sri Venkateswara Swamy and our elders', subtitle: 'PELLI PILUPU\nWe warmly invite you to the wedding of',
      message: 'We seek your blessings as two families come together in a sacred bond.\nKindly attend with your family and friends.' },
    tamil: { title: 'THIRUMANA AZHAIPPU\nWith the blessings of the Almighty and our elders', subtitle: 'A SACRED UNION\nWe cordially invite you to the marriage of',
      message: 'Kindly grace the wedding with your presence and shower your blessings on the couple.\nWe look forward to welcoming you.' },
    bengali: { title: 'SHUBHO BIBAHO\nWith the blessings of Maa Durga and our elders', subtitle: 'A BOND FOR A LIFETIME\nWe request the honour of your presence at the wedding of',
      message: 'Join us to celebrate love, tradition and togetherness.\nYour presence will make our joy complete.' },
    kerala: { title: 'MANGALYAM\nWith the blessings of Guruvayurappan and our families', subtitle: 'A NEW JOURNEY BEGINS\nWe warmly invite you to the wedding of',
      message: 'We would be honoured to have you with us on this beautiful day.\nPlease come and bless the couple.' },
    north: { title: 'SHUBH LAGAN\nWith the blessings of our elders', subtitle: 'VIVAH SAMAROH\nWe cordially invite you to the wedding ceremony of',
      message: 'Please join us for the rituals, the music and the feast as two families become one.\nYour presence is our greatest gift.' },
    sikh: { title: 'ANAND KARAJ\nWith the grace of Waheguru and the blessings of our elders', subtitle: 'A BLISSFUL UNION\nWe request the pleasure of your company at the Anand Karaj of',
      message: 'Kindly join us at the Gurdwara to witness the sacred Laavan and bless the couple.\nLangar will follow the ceremony.' },
    muslim: { title: 'BISMILLAH IR-RAHMAN IR-RAHIM\nWith the blessings of Allah and our families', subtitle: 'NIKAH CEREMONY\nWe request the honour of your presence at the Nikah of',
      message: 'Kindly join us and remember the couple in your duas as they begin their life together.\nYour presence will be our honour.' },
    christian: { title: 'TWO HEARTS, ONE LOVE\nTogether with their families', subtitle: 'HOLY MATRIMONY\nWe request the honour of your presence at the marriage of',
      message: 'Please join us as we exchange our vows before God, family and friends.\nA reception will follow the ceremony.' },
    royal: { title: 'A ROYAL CELEBRATION\nWith the blessings of our honoured elders', subtitle: 'THE GRAND WEDDING\nWe graciously invite you to the royal wedding of',
      message: 'Kindly grace the festivities with your gracious presence.\nAn evening of grandeur, music and celebration awaits.' },
    floral: { title: 'LOVE IN FULL BLOOM\nWith the blessings of our parents', subtitle: 'A GARDEN OF JOY\nWe would love you to celebrate the wedding of',
      message: 'Join us among the flowers as we say "I do" and begin our forever.\nYour presence will make our day bloom.' },
    modern: { title: 'TOGETHER FOREVER\nWith love, our families invite you', subtitle: 'SAVE THE DATE\nPlease join us for the wedding of',
      message: 'We can\'t wait to celebrate with the people we love most.\nCome for the vows, stay for the party.' },
    romantic: { title: 'HAPPILY EVER AFTER\nWith the love and blessings of our families', subtitle: 'OUR FOREVER BEGINS\nYou are warmly invited to the wedding of',
      message: 'Two hearts, one love and a lifetime of memories begin here.\nWe would be delighted to celebrate with you.' },
    classic: { title: 'THE BEGINNING OF FOREVER\nTogether with their families', subtitle: 'WITH GREAT JOY\nWe request the pleasure of your company at the wedding of',
      message: 'Please join us for a day of love, laughter and happily ever after.\nYour presence would mean so much to us.' }
  };
  /* First match wins, so specific traditions come before general styles. */
  var WEDDING_THEMES = [
    ['sikh', /anand|karaj|sikh|gurdwara|punjab/],
    ['muslim', /nikah|muslim|islam|walima|urdu/],
    ['christian', /christian|church|chapel|catholic|holy|cross/],
    ['telugu', /telugu|pelli|andhra|talambralu|tirupati|kalasam/],
    ['tamil', /tamil|thirumanam|gopuram|kanchipuram|madurai|chettinad/],
    ['kerala', /kerala|kasavu|malayal|guruvayur|kodava|coorg/],
    ['bengali', /bengal|alpona|shankha|pola|bibaho|gamosa|assam/],
    ['north', /rajasthan|gujarat|bandhani|marwari|jaipur|udaipur|leheriya|lehariya|sindhi|ajrak|kashmir|phulkari/],
    ['south', /south indian|kalyanam|kannada|karnataka|mysore|kolam|banana/],
    ['royal', /royal|palace|regal|maharaj|king|queen|heritage|mughal|velvet|gold/],
    ['hindu', /hindu|vivah|mandap|ganesh|kalash|shubh|mangal|sacred|saptapadi|temple|lotus|diya|jain|parsi/],
    ['floral', /floral|flower|bloom|rose|blossom|garden|botanic|lavender|peony|wildflower|sakura|cherry|petal|lily|orchid|watercolor|watercolour/],
    ['modern', /modern|minimal|geometric|deco|monochrome|contemporary|chic|neon|beach|boho|marble/]
  ];
  var WEDDING_GENERAL = ['blessed', 'romantic', 'classic'];

  function weddingTextFor(slug) {
    var tpl = IH.data && IH.data.getTemplate ? IH.data.getTemplate(slug) : null;
    var base = String(slug || '').replace(/^rd-/, '');
    var hay = (base + ' ' + (tpl ? tpl.name + ' ' + (tpl.keywords || '') : '')).toLowerCase().replace(/-/g, ' ');
    var key = null;
    for (var i = 0; i < WEDDING_THEMES.length && !key; i++) if (WEDDING_THEMES[i][1].test(hay)) key = WEDDING_THEMES[i][0];
    if (!key) {
      var h = 0;
      for (var c = 0; c < base.length; c++) h = (h * 31 + base.charCodeAt(c)) >>> 0;
      key = WEDDING_GENERAL[h % WEDDING_GENERAL.length];
    }
    var set = WEDDING_TEXT[key];
    return { additionalTitle: set.title, additionalSubtitle: set.subtitle, message: set.message, theme: key };
  }

  /* Birthday header wording (Additional Details): the title's second line
     follows the card's audience, so it comes from the per-design sample. */
  var BIRTHDAY_SUBTITLE = 'A DAY TO REMEMBER\nPlease join us to celebrate the birthday of';
  var BIRTHDAY_TEXT_FIELDS = ['additionalTitle', 'additionalSubtitle', 'message'];
  function birthdayTextFor(slug) {
    var s = sampleForCategoryBase('birthday', slug);
    return { additionalTitle: s.additionalTitle, additionalSubtitle: s.additionalSubtitle, message: s.message };
  }
  /* True when a birthday field still holds any design's sample wording. */
  function isBirthdaySampleText(field, value) {
    var v = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    if (!v) return true;
    var slugs = (IH.data && IH.data.templates ? IH.data.templates : []).filter(function (t) { return t.category === 'birthday'; }).map(function (t) { return t.slug; });
    return slugs.concat(['']).some(function (slug) {
      return String(birthdayTextFor(slug)[field] || '').replace(/\s+/g, ' ').trim() === v;
    });
  }

  /* The other occasions follow the birthday pattern: no Hosted by, an
     occasion-named venue, and Additional Details with header wording, the
     invitation message and a four-item programme. The programme reuses the
     four ceremony slots (haldi / mehndi / ceremony / reception), in order.
     icon names are EVENT_ICONS in js/wedding-designs.js. */
  var OCCASION_DETAILS = {
    'baby-shower': { venue: 'Shower venue', title: 'A LITTLE ONE IS ON THE WAY', subtitle: 'BABY SHOWER\nPlease join us for a baby shower in honour of', message: 'With love and blessings',
      programme: 'Shower programme', items: [['Welcome & Games', 'games'], ['Godh Bharai & Blessings', 'diya'], ['Lunch / Dinner', 'meal'], ['Gifts & Wishes', 'gift']] },
    'naming-ceremony': { venue: 'Ceremony venue', title: 'WITH THE BLESSINGS OF GOD', subtitle: 'NAMING CEREMONY\nPlease join us for the naming ceremony of', message: 'Bless our little one',
      programme: 'Ceremony programme', items: [['Puja & Rituals', 'diya'], ['Naming Ceremony', 'star'], ['Blessings & Photos', 'camera'], ['Lunch', 'meal']] },
    'house-warming': { venue: 'New home / Venue', title: 'GRIHA PRAVESH', subtitle: 'A NEW BEGINNING\nPlease join us as we step into our new home', message: 'Bless our new home',
      programme: 'Housewarming programme', items: [['Griha Pravesh Puja', 'diya'], ['Home Tour', 'home'], ['Lunch / Dinner', 'meal'], ['Get-together', 'music']] },
    anniversary: { venue: 'Celebration venue', title: 'CELEBRATING LOVE', subtitle: 'YEARS OF TOGETHERNESS\nPlease join us to celebrate the anniversary of', message: 'A journey of love',
      programme: 'Anniversary programme', items: [['Welcome Drinks', 'reception'], ['Cake Cutting', 'cake'], ['Dinner', 'meal'], ['Music & Dance', 'music']] },
    graduation: { venue: 'Ceremony venue', title: 'A PROUD MILESTONE', subtitle: 'GRADUATION\nPlease join us to celebrate the graduation of', message: 'Hard work, rewarded',
      programme: 'Graduation programme', items: [['Graduation Ceremony', 'award'], ['Photo Session', 'camera'], ['Lunch / Dinner', 'meal'], ['Celebration Party', 'music']] },
    retirement: { venue: 'Party venue', title: 'A LIFE WELL SERVED', subtitle: 'HAPPY RETIREMENT\nPlease join us to honour the retirement of', message: 'With gratitude',
      programme: 'Retirement programme', items: [['Welcome', 'reception'], ['Speeches & Tributes', 'mic'], ['Lunch / Dinner', 'meal'], ['Memories & Photos', 'camera']] },
    farewell: { venue: 'Farewell venue', title: 'A FOND FAREWELL', subtitle: 'WITH BEST WISHES\nPlease join us to bid farewell to', message: 'Thank you for the memories',
      programme: 'Farewell programme', items: [['Welcome', 'reception'], ['Speeches & Memories', 'mic'], ['Lunch / Dinner', 'meal'], ['Send-off & Gifts', 'gift']] },
    corporate: { venue: 'Event venue', title: 'YOU ARE INVITED', subtitle: 'CORPORATE EVENT\nWe are pleased to invite you to', message: 'About the event',
      programme: 'Event agenda', items: [['Registration', 'badge'], ['Keynote & Sessions', 'mic'], ['Networking', 'reception'], ['Lunch / Dinner', 'meal']] },
    festival: { venue: 'Celebration venue', title: 'FESTIVE GREETINGS', subtitle: 'JOIN THE CELEBRATIONS\nPlease join us to celebrate', message: 'Festive wishes',
      programme: 'Festival programme', items: [['Puja & Prayers', 'diya'], ['Cultural Programme', 'music'], ['Lunch / Dinner', 'meal'], ['Fireworks & Fun', 'star']] },
    'school-events': { venue: 'School / Event venue', title: 'YOU ARE INVITED', subtitle: 'SCHOOL EVENT\nWe cordially invite you to', message: 'About the event',
      programme: 'Event programme', items: [['Inauguration', 'diya'], ['Cultural Programme', 'music'], ['Prize Distribution', 'award'], ['Vote of Thanks', 'mic']] },
    'college-events': { venue: 'College / Event venue', title: 'YOU ARE INVITED', subtitle: 'COLLEGE EVENT\nWe cordially invite you to', message: 'About the event',
      programme: 'Event programme', items: [['Inauguration', 'diya'], ['Events & Competitions', 'star'], ['Prize Distribution', 'award'], ['DJ Night', 'music']] },
    party: { venue: 'Party venue', title: 'LET’S PARTY', subtitle: 'GOOD TIMES AHEAD\nPlease join us for', message: 'Join the fun',
      programme: 'Party programme', items: [['Welcome Drinks', 'reception'], ['Games & Fun', 'games'], ['Dinner', 'meal'], ['Music & Dance', 'music']] },
    'community-events': { venue: 'Event venue', title: 'COMMUNITY GATHERING', subtitle: 'ALL ARE WELCOME\nWe warmly invite you to', message: 'About the event',
      programme: 'Event programme', items: [['Welcome', 'reception'], ['Meeting & Discussion', 'mic'], ['Cultural Programme', 'music'], ['Lunch / Dinner', 'meal']] },
    other: { venue: 'Event venue', title: 'YOU ARE INVITED', subtitle: 'JOIN US\nPlease join us for', message: 'About the event',
      programme: 'Event programme', items: [['Welcome', 'reception'], ['Main Event', 'star'], ['Lunch / Dinner', 'meal'], ['Celebrations', 'music']] }
  };
  var PROGRAMME_SLOTS = ['haldi', 'mehndi', 'ceremony', 'reception'];

  /* Sample header wording and message for an occasion; the title's second
     line is the occasion's sample host line. */
  function occasionTextFor(type, slug) {
    if (type === 'birthday') return birthdayTextFor(slug);
    var cfg = OCCASION_DETAILS[type];
    if (!cfg) return null;
    var s = sampleForCategoryBase(type, slug) || {};
    /* Never the wedding sentence ("as we begin our life together") on another occasion. */
    var message = s.message || 'We would be delighted to have you join us.';
    return { additionalTitle: cfg.title + (s.hostName ? '\n' + s.hostName : ''), additionalSubtitle: cfg.subtitle, message: message };
  }
  /* True when a field still holds any occasion's sample wording. */
  function isOccasionSampleText(field, value) {
    var v = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    if (!v) return true;
    if (isBirthdaySampleText(field, value)) return true;
    // Each design's own sample wording counts too (per-card hosts on the design engine).
    var tpls = IH.data && IH.data.templates ? IH.data.templates : [];
    return Object.keys(OCCASION_DETAILS).some(function (type) {
      var slugs = tpls.filter(function (t) { return t.category === type; }).map(function (t) { return t.slug; });
      return slugs.concat([undefined]).some(function (slug) {
        return String(occasionTextFor(type, slug)[field] || '').replace(/\s+/g, ' ').trim() === v;
      });
    });
  }
  /* The programme items the host switched on, in running order. */
  function occasionEvents(data) {
    var cfg = OCCASION_DETAILS[data.eventType];
    if (!cfg) return [];
    return PROGRAMME_SLOTS.map(function (slot, i) {
      return data[slot + 'Enabled'] ? { title: cfg.items[i][0], icon: cfg.items[i][1], date: data[slot + 'Date'] || data.date, time: data[slot + 'Time'] } : null;
    }).filter(Boolean);
  }

  /* "LINE ONE\nLine two" -> ['LINE ONE', 'Line two'], blank lines dropped. */
  function splitText(text) {
    return String(text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* True when a field still holds sample wording (any set's, or empty), so
     switching design may replace it; anything the host typed stays. */
  function isWeddingSampleText(field, value) {
    var v = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    if (!v) return true;
    var prop = field === 'additionalTitle' ? 'title' : field === 'additionalSubtitle' ? 'subtitle' : 'message';
    return Object.keys(WEDDING_TEXT).some(function (k) {
      var s = WEDDING_TEXT[k][prop].replace(/\s+/g, ' ').trim();
      return v === s || v === s.replace('celebrate the wedding of', 'celebrate the engagement of');
    });
  }

  function headlineFor(data) {
    var type = data.eventType || 'other';
    if (type === 'wedding' || type === 'engagement' || (type === 'reception' && (data.groomName || data.brideName))) {
      if (data.groomName && data.brideName) {
        var g = data.groomName;
        var b = data.brideName;
        if (data.namesSwapped) {
          return escapeHtml(b) + '<span class="amp">&amp;</span>' + escapeHtml(g);
        }
        return escapeHtml(g) + '<span class="amp">&amp;</span>' + escapeHtml(b);
      }
      return escapeHtml(data.groomName || data.brideName || data.title || 'Our Special Day');
    }
    /* An anniversary names the couple in one field (a reception did too,
       before it took Groom/Bride like a wedding). */
    if (type === 'reception' || type === 'anniversary') {
      if (data.personName) return escapeHtml(data.personName);
      if (data.groomName && data.brideName) {
        var g = data.groomName;
        var b = data.brideName;
        if (data.namesSwapped) {
          return escapeHtml(b) + '<span class="amp">&amp;</span>' + escapeHtml(g);
        }
        return escapeHtml(g) + '<span class="amp">&amp;</span>' + escapeHtml(b);
      }
      return escapeHtml(data.groomName || data.brideName || data.title || EVENT_TYPES[type].label);
    }
    if (type === 'birthday' || type === 'naming-ceremony' || type === 'graduation' ||
        type === 'retirement' || type === 'farewell' || type === 'house-warming') {
      /* A naming ceremony names the baby, so the baby name leads the
         headline. personName is the fallback for older drafts that kept
         the name in the shared one-person field. */
      if (type === 'naming-ceremony') {
        return escapeHtml(data.babyName || data.personName || data.title || EVENT_TYPES[type].label);
      }
      return escapeHtml(data.personName || data.title || EVENT_TYPES[type].label);
    }
    /* A baby shower is about the baby, though the form also asks for the
       parents. Whichever the host filled in leads. */
    if (type === 'baby-shower') {
      return escapeHtml(data.babyName || data.personName || data.title || EVENT_TYPES[type].label);
    }
    return escapeHtml(data.title || EVENT_TYPES[type].label);
  }

  /* 1st, 2nd, 3rd, 25th — and 11th/12th/13th, which break the pattern. */
  function ordinal(value) {
    var n = parseInt(value, 10);
    if (!n || n < 1) return '';
    var teens = n % 100;
    var suffix = (teens >= 11 && teens <= 13)
      ? 'th'
      : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return n + suffix;
  }

  function subheadFor(data) {
    var type = data.eventType || 'other';
    if (type === 'birthday') {
      return data.title && data.personName ? escapeHtml(data.title) : 'is turning one year more!';
    }
    /* An anniversary is defined by which one it is, so the number goes
       directly under the names rather than being left for the host to
       work into the title themselves. */
    if (type === 'anniversary') {
      var nth = ordinal(data.years);
      if (nth) return escapeHtml(nth + ' Anniversary');
      return data.title ? escapeHtml(data.title) : '';
    }
    if (type === 'wedding' && data.title) return escapeHtml(data.title);
    /* A baby shower leads with the baby's name in the main title; the
       occasion title the host typed belongs in the subtitle, in the same
       slot a wedding title uses. Kept separate from the name above so the
       one never swallows the other. */
    if (type === 'baby-shower' && data.title) return escapeHtml(data.title);
    if (type === 'house-warming' && data.title && data.personName) return escapeHtml(data.title);
    /* A naming ceremony announces the baby by name; the occasion title the
       host typed sits in the same ceremony-title slot underneath, so the
       Event title is never dropped. */
    if (type === 'naming-ceremony' && data.title) return escapeHtml(data.title);
    return '';
  }

  /* Centralized Telugu Pelli Layer Configuration
     Each entry defines an independent decorative PNG layer with its target file,
     z-index layer stack position, opacity, and semantic role. */
  /* Telugu pelli set (FLUX.2 Klein 4B, see
     scripts/generate-telugu-reference-assets.js). Right-hand copies of the
     corner florals, lotus clusters and pillars are mirrored by CSS. The
     pillars are built from cap/shaft/base slices so they run the full card
     height without stretching. The koneru temples, Ganesha crest, sprigs,
     dividers and event icons sit in the content flow (teluguPelliContent). */
  var TELUGU_PELLI_ASSETS = [
    { id: 'tp-pillar-left', pillar: true, zIndex: 1, role: 'architecture' },
    { id: 'tp-pillar-right', pillar: true, zIndex: 1, role: 'architecture' },
    { id: 'tp-lake-temple', file: 'tp-lake-temple.png', zIndex: 1, role: 'landscape' },
    { id: 'tp-banana-left', file: 'tp-banana-plant.png', zIndex: 2, role: 'pandiri' },
    { id: 'tp-banana-right', file: 'tp-banana-plant.png', zIndex: 2, role: 'pandiri' },
    { id: 'tp-toran', file: 'tp-toran.png', zIndex: 3, role: 'mamidi-thoranam' },
    { id: 'tp-jasmine-left', file: 'tp-jasmine-string.png', zIndex: 4, role: 'malle-poolu' },
    { id: 'tp-jasmine-right', file: 'tp-jasmine-string.png', zIndex: 4, role: 'malle-poolu' },
    { id: 'tp-canopy-left', file: 'tp-canopy-corner.png', zIndex: 5, role: 'floral' },
    { id: 'tp-canopy-right', file: 'tp-canopy-corner.png', zIndex: 5, role: 'floral' },
    { id: 'tp-bells-left', file: 'bells-left.png', zIndex: 6, role: 'bells' },
    { id: 'tp-bells-right', file: 'bells-right.png', zIndex: 6, role: 'bells' },
    { id: 'tp-foliage-bottom', file: 'tp-foliage-bottom.png', zIndex: 5, role: 'foliage' },
    { id: 'tp-elephant-left', file: 'tp-elephant.png', zIndex: 6, role: 'ceremonial' },
    { id: 'tp-elephant-right', file: 'tp-elephant.png', zIndex: 6, role: 'ceremonial' }
  ];

  /* Faint chukkala muggu (dot rangoli) set behind the date block: a 5x5 dot
     grid wound with petal loops inside a ring of dots. */
  var TELUGU_MUGGU = (function () {
    var s = '<svg class="tp-muggu" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">' +
      '<g fill="none" stroke="#A9803A" stroke-width="1.6">';
    for (var a = 0; a < 360; a += 45) {
      s += '<ellipse cx="0" cy="-48" rx="15" ry="34" transform="rotate(' + a + ')"/>';
    }
    s += '<circle r="22"/><circle r="88" stroke-dasharray="2 7" stroke-linecap="round"/></g><g fill="#A9803A">';
    for (var x = -2; x <= 2; x++) for (var y = -2; y <= 2; y++) {
      if (Math.abs(x) + Math.abs(y) <= 3) s += '<circle cx="' + (x * 9) + '" cy="' + (y * 9) + '" r="1.8"/>';
    }
    for (var b = 22.5; b < 360; b += 45) {
      var rad = b * Math.PI / 180;
      s += '<circle cx="' + (Math.sin(rad) * 70).toFixed(1) + '" cy="' + (-Math.cos(rad) * 70).toFixed(1) + '" r="2.6"/>';
    }
    return s + '</g></svg>';
  })();

  /* Regional wedding designs that share this layered layout. Each keeps the
     same file set in its own asset folder; only the regional blessing words
     and the optional native-script name fields differ. */
  var REGIONAL_DESIGNS = {
    'telugu-pelli': { dir: 'telugu-pelli', lang: 'te',
      greeting: ['శ్రీరస్తు', 'శుభమస్తు', 'అవిఘ్నమస్తు'] },
    'tamil-thirumanam': { dir: 'tamil-thirumanam', lang: 'ta',
      greeting: ['ஸ்ரீரஸ்து', 'சுபமஸ்து', 'அவிக்னமஸ்து'] }
  };

  /* Relative luminance below ~0.35 reads as a dark background. */
  function isDarkColor(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return false;
    var n = parseInt(m[1], 16);
    var lin = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    var L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    return L < 0.35;
  }

  function regionalOf(data) {
    return REGIONAL_DESIGNS[data && data.template] || REGIONAL_DESIGNS['telugu-pelli'];
  }

  function teluguAsset(data, file) {
    return ((data && data.assetPrefix) || '') + 'images/invitation-assets/' + regionalOf(data).dir + '/' + file;
  }

  function teluguImg(data, file, cls) {
    return '<img src="' + escapeHtml(teluguAsset(data, file)) + '" class="' + cls + '" alt="" aria-hidden="true" ' +
      'onerror="this.style.display=\'none\'">';
  }

  function teluguDivider(data) {
    return '<div class="tp-divider" aria-hidden="true">' + teluguImg(data, 'tp-divider.png', 'tp-divider__img') + '</div>';
  }

  function teluguHeading(data, text) {
    return '<h3 class="tp-heading"><span class="tp-heading__line" aria-hidden="true"></span>' +
      '<span class="tp-heading__text">' + escapeHtml(text) + '</span>' +
      '<span class="tp-heading__line" aria-hidden="true"></span></h3>';
  }

  /* Telugu Pelli wedding body: blessing line, script names, date block,
     venue between two lake palaces and the ceremony columns. Same data and
     features (photo, countdown, maps link) as the generic wedding body. */
  function teluguPelliContent(data, d, time) {
    var html = [];
    var heart = '<span class="tp-heart" aria-hidden="true">&#9829;</span>';
    var kicker = data.additionalTitle || 'With the blessings of our parents';
    var intro = data.additionalSubtitle || 'Together with their families\nwe joyfully invite you to celebrate the wedding of';
    if (data.eventType === 'engagement') intro = intro.replace(/celebrate the wedding of/i, 'celebrate the engagement of');

    html.push('<div class="tp-crest">' + teluguImg(data, 'tp-ganesha.png', 'tp-crest__img') + '</div>');
    var region = regionalOf(data);
    html.push('<p class="tp-greeting" lang="' + region.lang + '">' +
      region.greeting.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</p>');
    html.push('<p class="invitation__additional-title tp-kicker">' + escapeHtml(kicker) + '</p>');
    html.push('<p class="invitation__additional-subtitle tp-intro">' + escapeHtml(intro) + '</p>');

    if (data.photo) {
      html.push('<img class="invitation__photo" src="' + escapeHtml(data.photo) + '" alt="Photo of the hosts" width="128" height="128">');
    }

    var first = escapeHtml(data.groomName || 'Groom');
    var second = escapeHtml(data.brideName || 'Bride');
    var nativeName = function (v) {
      return v ? '<p class="tp-name-te" lang="' + region.lang + '">' + escapeHtml(v) + '</p>' : '';
    };
    var firstTe = '';
    var secondTe = '';
    if (data.namesSwapped) {
      var t = first; first = second; second = t;
      t = firstTe; firstTe = secondTe; secondTe = t;
    }
    /* Pasupu (turmeric) and kumkuma dots, as dabbed on Telugu invitation cards. */
    var pasupuKumkuma = '<span class="tp-pk" aria-hidden="true"><i class="tp-pk__pasupu"></i><i class="tp-pk__kumkuma"></i></span>';
    html.push('<div class="invitation__couple tp-couple">' +
      '<p class="tp-aside tp-aside--left" aria-hidden="true">Good<br>people<br>beautiful<br>places<br>brighter<br>tomorrows<br>' + heart + '</p>' +
      '<h2 class="invitation__person-name tp-name">' + first + '</h2>' + firstTe +
      '<div class="tp-amp">' + teluguImg(data, 'tp-sprig.png', 'tp-sprig tp-sprig--left') +
        '<span class="amp">&amp;</span>' + teluguImg(data, 'tp-sprig.png', 'tp-sprig tp-sprig--right') + '</div>' +
      '<h2 class="invitation__person-name tp-name">' + second + '</h2>' + secondTe +
      '<p class="tp-aside tp-aside--right" aria-hidden="true">A new<br>chapter<br>begins&hellip;<br><span class="tp-heart tp-heart--outline">&#9825;</span></p>' +
    '</div>');
    html.push('<p class="tp-tagline">Two souls ' + pasupuKumkuma + ' One beautiful journey</p>');

    if (d.full || time) {
      html.push('<div class="invitation__when-unified tp-date">' + TELUGU_MUGGU +
        '<div class="tp-date__weekday"><span class="tp-date__rule"></span>' + escapeHtml((d.weekday || 'Day').toUpperCase()) + '<span class="tp-date__rule"></span></div>' +
        '<div class="tp-date__row">' +
          '<span class="tp-date__month">' + escapeHtml((d.month || 'Month').slice(0, 3).toUpperCase()) + '</span>' +
          '<span class="tp-date__day">' + escapeHtml(d.day || '—') + '</span>' +
          '<span class="tp-date__year">' + escapeHtml(d.year || '—') + '</span>' +
        '</div>' +
        (time ? '<div class="tp-date__time">' + escapeHtml(time) + ' onwards</div>' : '') +
      '</div>');
    }

    if (data.showCountdown !== false && data.date && IH.countdown) {
      html.push(IH.countdown.markup(toDateTime(data.date, data.time), '', data.eventType));
    }

    if (data.venue || data.address) {
      var mapsUrl = getMapsUrl(data);
      html.push(teluguDivider(data));
      /* The host's venue photo, or a traditional kalyana mandapam when none
         has been added. The venue image stays editable in the editor. */
      var venuePhoto = data.venueImage || teluguAsset(data, 'tp-venue-default.jpg');
      /* Side by side: venue photo left, details right, with the temple
         vignette as a soft backdrop behind the details. */
      html.push('<div class="tp-venue tp-venue--side">' +
        '<figure class="tp-venue-photo"><img src="' + escapeHtml(venuePhoto) + '" alt="' +
          escapeHtml(data.venue || 'Wedding venue') + '" loading="lazy" onerror="this.closest(\'figure\').style.display=\'none\'"></figure>' +
        teluguImg(data, 'tp-temple-side.png', 'tp-palace tp-palace--left') +
        teluguImg(data, 'tp-temple-side.png', 'tp-palace tp-palace--right') +
        '<div class="tp-venue__body">' +
          '<div class="tp-venue__title">' + IH.icon('map-pin', 16) + ' <span>' + (data.eventType === 'engagement' ? 'Engagement Ceremony' : 'Wedding Ceremony') + '</span></div>' +
          (data.venue ? '<div class="invitation__venue-name tp-venue__name"><strong>' + escapeHtml(data.venue) + '</strong></div>' : '') +
          (data.address ? '<div class="invitation__venue-address tp-venue__address">' + escapeHtml(data.address) + '</div>' : '') +
          (mapsUrl ? '<a class="tp-venue__map invitation__maps-btn" href="' + escapeHtml(mapsUrl) + '" target="_blank" rel="noopener noreferrer">View location</a>' : '') +
        '</div>' +
      '</div>');
      html.push(teluguDivider(data));
    }

    /* With the blessings block shown, the message closes the card there. */
    if (data.message && data.showBlessings === false) {
      html.push('<p class="invitation__message tp-message">' + escapeHtml(data.message) + '</p>');
    }

    var events = [
      { enabled: data.haldiEnabled, title: 'Haldi', date: data.haldiDate, time: data.haldiTime, icon: 'tp-icon-haldi.png' },
      { enabled: data.mehndiEnabled, title: 'Mehndi', date: data.mehndiDate, time: data.mehndiTime, icon: 'tp-icon-gorintaku.png' },
      { enabled: data.ceremonyEnabled, title: 'Wedding Ceremony', date: data.ceremonyDate, time: data.ceremonyTime, icon: 'tp-icon-mangalsutra.png' },
      { enabled: data.receptionEnabled, title: 'Reception', date: data.receptionDate, time: data.receptionTime, icon: 'tp-icon-kalasam.png' }
    ].filter(function (e) { return e.enabled; });
    var isEngagement = data.eventType === 'engagement';
    if (isEngagement) {
      events = events.filter(function (e) { return e.icon === 'tp-icon-mangalsutra.png' || e.icon === 'tp-icon-kalasam.png'; });
      events.forEach(function (e) { e.title = e.icon === 'tp-icon-mangalsutra.png' ? 'Ring Ceremony' : (/^(0\d|1[0-5]):/.test(e.time || '') ? 'Engagement Lunch' : 'Engagement Dinner'); });
    }

    if (events.length) {
      html.push(teluguHeading(data, isEngagement ? 'Engagement Celebrations' : 'Wedding Celebrations'));
      html.push('<div class="tp-events tp-events--' + events.length + '">');
      events.forEach(function (e) {
        var ed = formatDate(e.date);
        var when = ed.full ? (ed.weekday + ', ' + ed.day + ' ' + ed.month.slice(0, 3) + ' ' + ed.year) : '';
        html.push('<div class="tp-event">' +
          teluguImg(data, e.icon, 'tp-event__icon') +
          '<strong class="tp-event__title">' + escapeHtml(e.title) + '</strong>' +
          (when ? '<span class="tp-event__date">' + escapeHtml(when) + '</span>' : '') +
          (e.time ? '<span class="tp-event__time">' + escapeHtml(formatTime(e.time)) + '</span>' : '') +
        '</div>');
      });
      html.push('</div>');
      html.push(teluguDivider(data));
    }
    return html.join('');
  }

  function teluguPelliBackdrop(data) {
    var prefix = (data && data.assetPrefix) || '';
    var arch = '<svg class="inv-layer inv-layer--tp-arch" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 120 V44 H120 C134 44 140 36 150 26 C160 14 176 8 188 8 Q194 0 200 0 Q206 0 212 8 C224 8 240 14 250 26 C260 36 266 44 280 44 H400 V120" ' +
      'fill="none" stroke="#E4D6BC" stroke-width="7"/>' +
      '<path d="M0 120 V44 H120 C134 44 140 36 150 26 C160 14 176 8 188 8 Q194 0 200 0 Q206 0 212 8 C224 8 240 14 250 26 C260 36 266 44 280 44 H400 V120" ' +
      'fill="none" stroke="#C9A961" stroke-width="1" transform="translate(0 7)"/></svg>';
    var layers = TELUGU_PELLI_ASSETS.map(function (asset) {
      if (asset.pillar) {
        var url = function (f) { return 'url(\'' + escapeHtml(teluguAsset(data, f)) + '\')'; };
        return '<div class="inv-layer inv-layer--tp-pillar inv-layer--' + escapeHtml(asset.id) + '" style="background-image:' +
          url('tp-pillar-cap.png') + ',' + url('tp-pillar-base.png') + ',' + url('tp-pillar-shaft.png') + '"></div>';
      }
      return '<img src="' + escapeHtml(teluguAsset(data, asset.file)) + '" ' +
        'class="inv-layer inv-layer--' + escapeHtml(asset.id) + '" alt="" ' +
        'onerror="this.style.display=\'none\'">';
    });
    return '<div class="invitation__backdrop invitation__backdrop--regional invitation__backdrop--' +
      escapeHtml(regionalOf(data).dir) + '" aria-hidden="true">' +
      arch + layers.join('') +
    '</div>';
  }


  IH.invitation = {
    EVENT_TYPES: EVENT_TYPES,
    SAMPLE: SAMPLE,
    TELUGU_PELLI_ASSETS: TELUGU_PELLI_ASSETS,
    TELUGU_MUGGU: TELUGU_MUGGU,
    REGIONAL_DESIGNS: REGIONAL_DESIGNS,
    weddingTextFor: weddingTextFor,
    isWeddingSampleText: isWeddingSampleText,
    BIRTHDAY_TEXT_FIELDS: BIRTHDAY_TEXT_FIELDS,
    birthdayTextFor: birthdayTextFor,
    isBirthdaySampleText: isBirthdaySampleText,
    OCCASION_DETAILS: OCCASION_DETAILS,
    occasionTextFor: occasionTextFor,
    isOccasionSampleText: isOccasionSampleText,
    occasionEvents: occasionEvents,
    isDarkColor: isDarkColor,

    /* The wording that suits one occasion suits no other, so the sample
       copy is kept per event type. The editor borrows the message from
       here rather than keeping a second list that would drift from it. */
    messageFor: function (eventType, relation) {
      var sample = sampleForCategory(eventType);
      var message = (sample && sample.message) || SAMPLE.message;
      if (eventType === 'naming-ceremony') return genderizeText(message, relation);
      return message;
    },
    formatDate: formatDate,
    formatTime: formatTime,
    toDateTime: toDateTime,
    headline: headlineFor,
    subhead: subheadFor,
    genderize: genderizeText,
    GOOGLE_FONTS: GOOGLE_FONTS,

    /* Merge a template's palette into an invitation data object. */
    applyTemplate: function (data, templateSlug) {
      var tpl = IH.data && IH.data.getTemplate(templateSlug || data.template);
      if (!tpl) return data;
      data.template = tpl.slug;
      data.colors = {
        primary: tpl.colors.primary,
        secondary: tpl.colors.secondary,
        bg1: tpl.colors.bg1,
        bg2: tpl.colors.bg2,
        ink: tpl.colors.ink
      };
      return data;
    },

    styleVars: function (data) {
      var tpl = IH.data && IH.data.getTemplate(data.template);
      var c = data.colors || (tpl ? tpl.colors : null) || {
        primary: '#8B2F58', secondary: '#B98A2E', bg1: '#FDF0F4', bg2: '#F6D9E4', ink: '#4A2033'
      };
      /* No font picked = the design's own font; a pick always wins. */
      var fontKey = data.font || (data.template === 'telugu-pelli' ? 'telugu' : (data.template === 'tamil-thirumanam' ? 'tamil' : 'playfair'));
      var fonts = GOOGLE_FONTS[fontKey] || GOOGLE_FONTS.playfair;
      var parts = [
        '--inv-primary:' + c.primary,
        '--inv-secondary:' + c.secondary,
        '--inv-bg1:' + c.bg1,
        '--inv-bg2:' + c.bg2,
        '--inv-ink:' + c.ink,
        '--inv-font-display:' + fonts.display,
        '--inv-font-body:' + fonts.body
      ];
      if (data.background) {
        /* Telugu Pelli carries its own layered artwork, so an uploaded
           background sits under a heavier veil there to keep text clear. */
        var veil = REGIONAL_DESIGNS[data.template] ? 'F5' : 'D9';
        parts.push('background-image:linear-gradient(160deg, ' + c.bg1 + veil + ', ' + c.bg2 + veil + '), url(' + data.background + ')');
        parts.push('background-size:cover');
        parts.push('background-position:center');
      }
      return parts.join(';');
    },

    /* Full invitation markup. Returns a string so it can be dropped
       into a modal, the editor stage or a standalone page alike. */
    render: function (input) {
      var data = Object.assign({}, SAMPLE, input || {});
      /* The default subtitle names the occasion: an engagement never says "wedding". */
      if (data.eventType === 'engagement' && typeof data.additionalSubtitle === 'string') {
        data.additionalSubtitle = data.additionalSubtitle.replace(/celebrate the wedding of/i, 'celebrate the engagement of');
      }
      var type = EVENT_TYPES[data.eventType] ? data.eventType : 'other';
      var meta = EVENT_TYPES[type];
      var d = formatDate(data.date);
      var time = formatTime(data.time);
      var ornament = ORNAMENTS[meta.motif] || ORNAMENTS.floral;
      var html = [];

      var tplSlug = data.template || '';
      /* Regional designs share the "regional" layout classes. Tamil Thirumanam
         drops its old tpl class, whose maroon premium-classic rules would
         otherwise override the shared layout. */
      var isRegional = !!REGIONAL_DESIGNS[tplSlug];
      var tplClass = tplSlug && tplSlug !== 'tamil-thirumanam' ? ' invitation--tpl-' + escapeHtml(tplSlug) : '';
      if (isRegional) {
        tplClass += ' invitation--regional invitation--regional-' + escapeHtml(tplSlug);
        /* Text colours follow the background: a dark palette (template default
           or the host's own colours) switches to light gold/ivory text. */
        var regTpl = IH.data && IH.data.getTemplate ? IH.data.getTemplate(tplSlug) : null;
        var regBg = (data.colors && data.colors.bg1) || (regTpl && regTpl.colors && regTpl.colors.bg1);
        if (isDarkColor(regBg)) tplClass += ' invitation--regional-dark';
      }
      /* Every other wedding template gets its own design from the wedding
         design engine (js/wedding-designs.js): layout, frame, fonts, motif
         and text colours that follow its background. */
      var WD = IH.weddingDesigns;
      // Baby shower, naming ceremony, housewarming and anniversary only on their own designs.
      var wdOn = !isRegional && !!WD && WD.applies(tplSlug) && (type === 'wedding' || type === 'engagement' || type === 'reception' || type === 'birthday' ||
        (WD.isOneName(WD.spec(tplSlug)) && WD.spec(tplSlug).occasion === type));
      var wdStyle = '';
      if (wdOn) {
        var wdTpl = IH.data && IH.data.getTemplate ? IH.data.getTemplate(tplSlug) : null;
        var wdAttrs = WD.articleAttrs(data, data.colors || (wdTpl && wdTpl.colors) || {});
        tplClass += wdAttrs.cls;
        wdStyle = ';' + wdAttrs.vars;
      }
      /* Entrance animation: plays once as the card appears. */
      var enterClass = data.animation === 'none' ? '' : ' invitation--enter-' + (data.animation === 'pop' ? 'pop' : 'fade');
      /* A picked heading font also replaces the regional designs' own name script. */
      if (data.font) enterClass += ' invitation--font-picked';
      html.push('<article class="invitation invitation--' + type + tplClass + enterClass + '" style="' + this.styleVars(data) + wdStyle + '" ' +
        'aria-label="' + escapeHtml(meta.label) + ' invitation preview">');

      if (isRegional) {
        html.push(teluguPelliBackdrop(data));
      } else if (wdOn) {
        html.push(WD.frame(data));
      }

      /* No generic category background layer: every template carries its own
         design, which that image would cover (older drafts may still hold one). */

      var tpl = IH.data && IH.data.getTemplate ? IH.data.getTemplate(tplSlug) : null;
      var ornament = (tpl && tpl.motif && ORNAMENTS[tpl.motif]) || ORNAMENTS[data.motif] || ORNAMENTS[meta.motif] || ORNAMENTS.floral;
      if (tplSlug !== 'telugu-pelli' && tplSlug !== 'tamil-thirumanam' && !wdOn) {
        html.push('<div class="invitation__ornament">' + ornament + '</div>');
      }

      /* The top line names who is hosting. The Hosted by field leads for
      every occasion now, with the organisation behind an institutional
      event as the fallback, so corporate cards no longer lose it. */
      var orgName = data.organization;
      var hostLine = data.hostName || orgName;

      var wdCtx = { esc: escapeHtml, icon: IH.icon, toDateTime: toDateTime, mapsUrl: getMapsUrl, formatDate: formatDate, formatTime: formatTime,
        occasion: OCCASION_DETAILS[type], occasionEvents: occasionEvents, genderize: genderizeText };
      if ((type === 'wedding' || type === 'engagement') && isRegional) {
        html.push(teluguPelliContent(data, d, time));
      } else if (wdOn) {
        html.push(WD.render(data, d, time, wdCtx));
      } else if (type === 'wedding' || type === 'engagement') {
        /* Wedding card strict 9-element order:
           1. Additional title
           2. Additional subtitle
           3. Main photo
           4. Groom's name and Bride's name
           5. SON OF and DAUGHTER OF
           6. Date and time
           7. Invitation message
           8. Countdown
           9. Venue, Full address and Google Maps URL */

        // 1. Additional title
        if (data.additionalTitle) {
          html.push('<p class="invitation__additional-title">' + escapeHtml(data.additionalTitle) + '</p>');
        }

        // 2. Additional subtitle
        if (data.additionalSubtitle) {
          html.push('<p class="invitation__additional-subtitle">' + escapeHtml(data.additionalSubtitle) + '</p>');
        }

        // 3. Main photo
        if (data.photo) {
          html.push('<img class="invitation__photo" src="' + escapeHtml(data.photo) + '" alt="Photo of the hosts" width="128" height="128">');
        }

        // 4 & 5. Groom’s name and Bride’s name + SON OF and DAUGHTER OF
        var groom = escapeHtml(data.groomName || 'Groom');
        var bride = escapeHtml(data.brideName || 'Bride');
        var groomParents = data.groomParents || 'Groom’s Parents';
        var brideParents = data.brideParents || 'Bride’s Parents';
        var leftName = groom, leftParents = groomParents, leftRelation = 'Son', leftClass = 'groom';
        var rightName = bride, rightParents = brideParents, rightRelation = 'Daughter', rightClass = 'bride';

        if (data.namesSwapped) {
          leftName = bride; leftParents = brideParents; leftRelation = 'Daughter'; leftClass = 'bride';
          rightName = groom; rightParents = groomParents; rightRelation = 'Son'; rightClass = 'groom';
        }

        var swappedClass = data.namesSwapped ? ' invitation__couple--swapped' : '';
        html.push('<div class="invitation__couple' + swappedClass + '">');
        html.push('  <div class="invitation__person invitation__person--left invitation__person--' + leftClass + '">');
        html.push('    <h2 class="invitation__person-name">' + leftName + '</h2>');
        if (leftParents) {
          html.push('    <p class="invitation__person-parents"><span>' + leftRelation + ' of</span><strong>' + escapeHtml(leftParents) + '</strong></p>');
        }
        html.push('  </div>');
        html.push('  <div class="invitation__couple-sep"><span class="amp">&amp;</span></div>');
        html.push('  <div class="invitation__person invitation__person--right invitation__person--' + rightClass + '">');
        html.push('    <h2 class="invitation__person-name">' + rightName + '</h2>');
        if (rightParents) {
          html.push('    <p class="invitation__person-parents"><span>' + rightRelation + ' of</span><strong>' + escapeHtml(rightParents) + '</strong></p>');
        }
        html.push('  </div>');
        html.push('</div>');

        // 6. Date and time
        if (d.full || time) {
          html.push('<div class="invitation__save-date">' + IH.icon('calendar', 18) + ' <span>SAVE THE DATE</span></div>');
          html.push('<div class="invitation__when-unified">' +
            '<div class="invitation__when-unified-date">' + escapeHtml((d.weekday || 'Day').toUpperCase() + ', ' + (d.day || '—') + ' ' + (d.month || 'Month').toUpperCase() + ' ' + (d.year || '—')) + '</div>' +
            '<div class="invitation__when-unified-time">' + escapeHtml(time || '—') + '</div>' +
          '</div>');
        }

        // 7. Invitation message
        if (data.message) {
          html.push('<div class="invitation__rule" aria-hidden="true">' + IH.icon('sparkles', 16) + '</div>');
          html.push('<div class="invitation__chapter-title">' + IH.icon('heart', 16) + ' <span>A NEW CHAPTER BEGINS</span></div>');
          html.push('<p class="invitation__message">' + escapeHtml(data.message) + '</p>');
        }

        // 8. countdown
        if (data.showCountdown !== false && data.date && IH.countdown) {
          html.push(IH.countdown.markup(toDateTime(data.date, data.time), '', data.eventType));
        }

        // 9. Venue , Full address and Google Maps URL
        if (data.venue || data.address) {
          var mapsUrl = getMapsUrl(data);
          html.push('<div class="invitation__venue-title">' + IH.icon('map-pin', 18) + ' <span>CELEBRATION VENUE</span></div>');

          html.push('<div class="invitation__venue-section">');

          var venueImgSrc = data.venueImage || 'images/templates/venue-default.jpg';
          html.push('<img class="invitation__venue-img" src="' + escapeHtml(venueImgSrc) + '" onerror="this.onerror=null; this.src=\'images/templates/wedding-day-mandap.svg\';" alt="Venue">');

          html.push('<div class="invitation__venue-info">' +
            (data.venue ? '<div class="invitation__venue-name"><strong>' + escapeHtml(data.venue) + '</strong></div>' : '') +
            (data.address ? '<div class="invitation__venue-address">' + escapeHtml(data.address) + '</div>' : '') +
            (mapsUrl ? '<a class="inv-btn inv-btn--outline inv-btn--sm invitation__maps-btn" href="' + escapeHtml(mapsUrl) + '" target="_blank" rel="noopener noreferrer">' +
              IH.icon('map-pin', 14) + '<span>View Location</span></a>' : '') +
          '</div>');

          html.push('</div>');
        }

        // Wedding celebrations
        var events = [
          { enabled: data.haldiEnabled, title: 'HALDI', date: data.haldiDate, time: data.haldiTime, image: 'images/ceremony-icons/haldi.png', fallback: 'images/templates/haldi-ceremony.svg' },
          { enabled: data.mehndiEnabled, title: 'MEHNDI', date: data.mehndiDate, time: data.mehndiTime, image: 'images/ceremony-icons/mehndi.png', fallback: 'images/templates/mehendi-ceremony.svg' },
          { enabled: data.ceremonyEnabled, title: 'WEDDING', date: data.ceremonyDate, time: data.ceremonyTime, image: 'images/ceremony-icons/wedding.png', fallback: 'images/templates/wedding-day-mandap.svg' },
          { enabled: data.receptionEnabled, title: 'RECEPTION', date: data.receptionDate, time: data.receptionTime, image: 'images/ceremony-icons/reception.png', fallback: 'images/templates/reception-evening.svg' }
        ].filter(function(e) { return e.enabled; });
        /* An engagement has a ring ceremony and a meal, not wedding rituals. */
        var isEngagement = type === 'engagement';
        if (isEngagement) {
          events = events.filter(function (e) { return e.title === 'WEDDING' || e.title === 'RECEPTION'; });
          events.forEach(function (e) { e.title = e.title === 'WEDDING' ? 'RING CEREMONY' : (/^(0\d|1[0-5]):/.test(e.time || '') ? 'Engagement Lunch' : 'Engagement Dinner').toUpperCase(); });
        }

        if (events.length > 0) {
          html.push('<div class="invitation__events-title">' + IH.icon('calendar', 18) + ' <span>' + (isEngagement ? 'ENGAGEMENT CELEBRATIONS' : 'WEDDING CELEBRATIONS') + '</span></div>');
          html.push('<div class="invitation__events-grid">');
          events.forEach(function(e) {
            var ed = formatDate(e.date);
            var et = formatTime(e.time);
            var displayTitle = e.title;

            html.push('<div class="invitation__event-card">' +
              (e.image ? '<img class="invitation__event-img" src="' + escapeHtml(e.image) + '" onerror="this.onerror=null; this.src=\'' + escapeHtml(e.fallback) + '\';" alt="' + escapeHtml(displayTitle) + '">' : '') +
              '<strong class="invitation__event-title">' + escapeHtml(displayTitle) + '</strong>' +
              '<span class="invitation__event-weekday">' + escapeHtml(ed.weekday || '') + '</span>' +
              '<span class="invitation__event-date">' + escapeHtml(ed.full || '') + '</span>' +
              '<span class="invitation__event-time">' + escapeHtml(et || '') + '</span>' +
              '</div>');
          });
          html.push('</div>');
        }
      } else {
        /* Occasions with Additional Details: the header wording replaces the
           host line (an older draft without it keeps the host line). */
        var occ = OCCASION_DETAILS[type];
        var occTitle = occ ? splitText(data.additionalTitle) : [];
        var occSub = occ ? splitText(data.additionalSubtitle) : [];
        if (occTitle.length) {
          html.push('<p class="invitation__kicker">' + escapeHtml(occTitle[0]) + '</p>');
          if (occTitle[1]) html.push('<p class="invitation__lead">' + escapeHtml(occTitle.slice(1).join(' ')) + '</p>');
        } else {
          html.push('<p class="invitation__kicker">' + escapeHtml(hostLine || meta.kicker) + '</p>');
        }
        if (occSub.length > 1) html.push('<div class="invitation__chapter-title">' + IH.icon('sparkles', 16) + ' <span>' + escapeHtml(occSub[0]) + '</span></div>');
        if (occSub.length) html.push('<p class="invitation__lead">' + escapeHtml(occSub.length > 1 ? occSub.slice(1).join(' ') : occSub[0]) + '</p>');

        if (data.photo) {
          html.push('<img class="invitation__photo" src="' + escapeHtml(data.photo) + '" alt="Photo of the hosts" width="128" height="128">');
        }

        html.push('<h2 class="invitation__names">' + headlineFor(data) + '</h2>');

        var sub = subheadFor(data);
        if (sub) html.push('<p class="invitation__kicker invitation__subhead">' + sub + '</p>');

        /* A naming ceremony introduces the baby by relationship as well as by
           name: "OUR DAUGHTER" above the name, then "Daughter of <parents>"
           underneath it. Each value stays in its own field — the relation is
           never copied from anywhere, and the parents' names never fall back
           to the host's. */
        if (type === 'naming-ceremony') {
          var relation = /daughter/i.test(String(data.babyRelation || '')) ? 'Daughter' : 'Son';
          if (data.babyName || data.personName) {
            html.push('<p class="invitation__relation-kicker">OUR ' + relation.toUpperCase() + '</p>');
            if (data.parentsName) {
              html.push('<p class="invitation__relation"><span>' + relation + ' of</span>' +
                '<strong>' + escapeHtml(data.parentsName) + '</strong></p>');
            }
          }
        }

        html.push('<div class="invitation__rule" aria-hidden="true">' + IH.icon('sparkles', 16) + '</div>');

        /* A naming ceremony announces the baby by relation, so its message
           is genderised to match the selected Baby's relation — Son or
           Daughter — wherever a gendered word appears. Other occasions keep
           the copy exactly as typed. */
        if (data.message) {
          html.push('<div class="invitation__chapter-title">' + IH.icon('heart', 16) + ' <span>' + escapeHtml(occ ? occ.message.toUpperCase() : 'A NEW CHAPTER BEGINS') + '</span></div>');
          var message = type === 'naming-ceremony'
            ? genderizeText(data.message, data.babyRelation)
            : data.message;
          html.push('<p class="invitation__message">' + escapeHtml(message) + '</p>');
        }

        /* Optional category extras — the institution behind the event, the
           degree or class, the role, the theme and so on. Kept out of the
           way until the host actually fills one in, so a default card looks
           exactly as it always did. When the organisation is already the
           top line, it is not repeated here. */
        var details = [];
        function detail(label, value) {
          if (value) details.push('<p><strong>' + escapeHtml(label) + ':</strong> ' + escapeHtml(value) + '</p>');
        }
        // Shown here unless the organisation is already the top line.
        if (data.hostName || occTitle.length) detail('Organization', data.organization);
        detail('Department', data.department);
        detail('Course / Class', data.classCourse);
        detail('Role', data.role);
        detail('Years of service', data.yearsOfService);
        detail('Event type', data.eventKind);
        detail('Theme', data.theme);
        /* Baby shower: the baby's name leads as the main title, so it is
           not repeated here; the "Parent / Parents' name" field (personName)
           fills the Parents line instead. */
        if (type === 'baby-shower') {
          detail('Parents', data.personName);
        } else if (type !== 'naming-ceremony') {
          detail('Baby name', data.babyName);
        }
        /* A naming ceremony announces the baby and its parents in the
           dedicated relationship block above, so a second "Parents: …"
           line here would only repeat it. */
        if (type !== 'naming-ceremony') {
          detail('Parents', data.parentsName);
        }
        if (data.years) {
          if (type === 'birthday') detail('Age', data.years);
          if (type === 'anniversary') detail('Years together', data.years);
        }
        if (details.length) {
          html.push('<div class="invitation__extra"><small>Details</small>' + details.join('') + '</div>');
        }

        if (d.full || time) {
          html.push('<div class="invitation__save-date">' + IH.icon('calendar', 18) + ' <span>SAVE THE DATE</span></div>');
          html.push('<div class="invitation__when-unified">' +
            '<div class="invitation__when-unified-date">' + escapeHtml((d.weekday || 'Day').toUpperCase() + ', ' + (d.day || '—') + ' ' + (d.month || 'Month').toUpperCase() + ' ' + (d.year || '—')) + '</div>' +
            '<div class="invitation__when-unified-time">' + escapeHtml(time || '—') + '</div>' +
          '</div>');
        }

        if (data.venue || data.address) {
          var mapsUrl = getMapsUrl(data);
          html.push('<div class="invitation__venue-title">' + IH.icon('map-pin', 18) + ' <span>' + escapeHtml(occ ? occ.venue.toUpperCase() : 'CELEBRATION VENUE') + '</span></div>');
          html.push('<div class="invitation__venue">' +
            (data.venue ? '<div class="invitation__venue-name"><strong>' + escapeHtml(data.venue) + '</strong></div>' : '') +
            (data.address ? '<div class="invitation__venue-address">' + escapeHtml(data.address) + '</div>' : '') +
            (mapsUrl ? '<a class="inv-btn inv-btn--outline inv-btn--sm invitation__maps-btn" href="' + escapeHtml(mapsUrl) + '" target="_blank" rel="noopener noreferrer">' +
              IH.icon('map-pin', 14) + '<span>View Location</span></a>' : '') +
          '</div>');
        }

        if (data.showCountdown !== false && data.date && IH.countdown) {
          html.push(IH.countdown.markup(toDateTime(data.date, data.time), '', data.eventType));
        }

        // The programme from Additional Details, drawn with the design engine's icons.
        var occEvents = occasionEvents(data);
        if (occEvents.length) {
          var iconSrc = IH.weddingDesigns && IH.weddingDesigns.eventIconSrc;
          html.push('<div class="invitation__events-title">' + IH.icon('calendar', 18) + ' <span>' + escapeHtml(occ.programme.toUpperCase()) + '</span></div>');
          html.push('<div class="invitation__events-grid">');
          occEvents.forEach(function (e) {
            var ed = formatDate(e.date);
            html.push('<div class="invitation__event-card">' +
              (iconSrc ? '<img class="invitation__event-img" src="' + iconSrc(e.icon) + '" alt="" aria-hidden="true" loading="lazy">' : '') +
              '<strong class="invitation__event-title">' + escapeHtml(e.title) + '</strong>' +
              '<span class="invitation__event-weekday">' + escapeHtml(ed.weekday || '') + '</span>' +
              '<span class="invitation__event-date">' + escapeHtml(ed.full || '') + '</span>' +
              '<span class="invitation__event-time">' + escapeHtml(formatTime(e.time) || '') + '</span>' +
              '</div>');
          });
          html.push('</div>');
        }
      }

      if (data.additionalInformation) {
        html.push('<div class="invitation__extra"><small>Additional information</small>' +
          '<p>' + escapeHtml(data.additionalInformation) + '</p></div>');
      }

      /* Photo gallery — the invitation card shows up to six photos in a responsive
         grid. The card preview is narrower, so it caps at three and the rest
         are reachable by scrolling. Only the host's uploads appear. */
      if (data.showGallery !== false && data.gallery && data.gallery.length) {
        html.push('<div class="invitation__gallery-title">' + IH.icon('image', 18) + ' <span>PHOTO GALLERY</span></div>');
        var items = data.gallery.slice(0, 6).map(function (src) {
          return '<li><img src="' + escapeHtml(src) + '" alt="Gallery photo" loading="lazy"></li>';
        }).join('');
        /* The grid pattern follows the number of photos (1-6). */
        html.push('<ul class="invitation__gallery invitation__gallery--n' + Math.min(6, data.gallery.length) + '">' + items + '</ul>');
      }

      /* Blessings section */
      var bGroomParents = data.groomParents || 'Groom’s Parents';
      var bBrideParents = data.brideParents || 'Bride’s Parents';
      var teluguWedding = isRegional && (type === 'wedding' || type === 'engagement');
      if (wdOn && type === 'reception') { bGroomParents = data.groomParents; bBrideParents = data.brideParents; }
      /* Birthday cards on the design engine have no families block, only a warm closing. */
      if (wdOn && type === 'birthday') {
        html.push('<div class="invitation__blessings wd-bday-closing"><div class="wd-closing"><span class="wd-closing__heart" aria-hidden="true">' + IH.icon('heart', 16) + '</span>' +
          '<p class="invitation__blessings-subheading wd-closing__title">Your presence is the best gift</p>' +
          '<p class="invitation__blessings-msg wd-closing__msg">We can&rsquo;t wait to celebrate with you.</p></div></div>');
      } else if (wdOn && WD.isOneName(WD.spec(tplSlug))) {
        // Baby shower, naming ceremony, housewarming, anniversary: the occasion's own closing words.
        var wdClose = WD.OCCASIONS[type].closing;
        html.push('<div class="invitation__blessings wd-bday-closing"><div class="wd-closing"><span class="wd-closing__heart" aria-hidden="true">' + IH.icon('heart', 16) + '</span>' +
          '<p class="invitation__blessings-subheading wd-closing__title">' + escapeHtml(wdClose[0]) + '</p>' +
          '<p class="invitation__blessings-msg wd-closing__msg">' + escapeHtml(wdClose[1]) + '</p></div></div>');
      } else if ((type === 'wedding' || type === 'engagement' || type === 'reception') && data.showBlessings !== false && (bGroomParents || bBrideParents)) {
        html.push('<div class="invitation__blessings">');
        html.push(teluguWedding ? teluguHeading(data, 'With the blessings of')
          : wdOn ? WD.heading(WD.spec(tplSlug), 'With the blessings of our families', 'users', wdCtx)
          : '<h3 class="invitation__blessings-heading">WITH THE BLESSINGS OF</h3>');

        html.push('<div class="invitation__blessings-grid">');

        var leftBlessingTitle = data.namesSwapped ? "Bride's Family" : "Groom's Family";
        var leftBlessingParents = data.namesSwapped ? bBrideParents : bGroomParents;
        var rightBlessingTitle = data.namesSwapped ? "Groom's Family" : "Bride's Family";
        var rightBlessingParents = data.namesSwapped ? bGroomParents : bBrideParents;

        if (leftBlessingParents) {
          html.push('<div class="invitation__blessings-side">');
          html.push('<strong>' + leftBlessingTitle + '</strong>');
          html.push('<p>' + escapeHtml(leftBlessingParents) + ' and Family</p>');
          html.push('</div>');
        }

        if (leftBlessingParents && rightBlessingParents) {
          html.push('<div class="invitation__blessings-divider"></div>');
        }

        if (rightBlessingParents) {
          html.push('<div class="invitation__blessings-side">');
          html.push('<strong>' + rightBlessingTitle + '</strong>');
          html.push('<p>' + escapeHtml(rightBlessingParents) + ' and Family</p>');
          html.push('</div>');
        }
        html.push('</div>');
        if (teluguWedding) {
          html.push(teluguDivider(data));
          html.push('<p class="invitation__message invitation__blessings-msg tp-closing">' +
            escapeHtml(data.message || 'Your presence and blessings will make our celebration even more special.') + '</p>');
        } else if (wdOn) {
          html.push('<div class="wd-closing"><span class="wd-closing__heart" aria-hidden="true">' + IH.icon('heart', 16) + '</span>' +
            '<p class="invitation__blessings-subheading wd-closing__title">Your blessings mean the world</p>' +
            '<p class="invitation__blessings-msg wd-closing__msg">We look forward to celebrating this special day with you.</p></div>');
        } else {
          html.push('<div class="invitation__blessings-ornament-bottom">' + IH.icon('heart', 16) + '</div>');
          html.push('<p class="invitation__blessings-subheading" style="font-weight:700;margin-top:var(--space-2);letter-spacing:1px;font-size:1.15rem;">YOUR BLESSINGS MEAN THE WORLD</p>');
          html.push('<p class="invitation__blessings-msg" style="margin-top:var(--space-1);font-size:0.9rem;opacity:0.9;">We look forward to celebrating this special day with you.</p>');
        }
        html.push('</div>');
      }

      var actions = [];
      if (data.phone) {
        actions.push('<a class="inv-btn" href="tel:' + escapeHtml(String(data.phone).replace(/\s/g, '')) + '">' +
          IH.icon('phone', 15) + '<span>Call Host</span></a>');
      }
      actions.push('<button class="inv-btn" type="button" data-share-invitation>' +
        IH.icon('share', 15) + '<span>Share</span></button>');

      if (actions.length) html.push('<div class="invitation__actions">' + actions.join('') + '</div>');

      /* A real player, not a note saying which song was chosen. Browsers
         refuse to start audio a visitor did not ask for, so autoplay is
         not on the table — and would be unwelcome anyway on a card that
         might be opened in a quiet room. The controls are the feature. */
      if (data.musicFile) {
        html.push('<div class="invitation__music">' +
          '<audio controls preload="none" src="' + escapeHtml(data.musicFile) + '">' +
            'Your browser cannot play this audio.' +
          '</audio>' +
          (data.music && data.music !== 'none'
            ? '<span class="invitation__music-name">' + escapeHtml(data.music) + '</span>'
            : '') +
        '</div>');
      }

      html.push('<p class="invitation__footer">Created with InviteAura</p>');

      html.push('</article>');
      return html.join('');
    },

    /* Render into a host element and (re)start its countdown. */
    mount: function (host, data) {
      if (!host) return;
      host.innerHTML = this.render(data);
      if (IH.countdown) IH.countdown.mount(host);
      return host;
    }
  };

  /* ==================================================================
     PART 2 — Preview modal (usable from any page)
     ================================================================== */

  function ensurePreviewModal() {
    var modal = qs('#template-preview-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'template-preview-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'template-preview-title');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="modal__dialog">' +
        '<div class="modal__header">' +
          '<div>' +
            '<h2 id="template-preview-title">Template preview</h2>' +
            '<p class="muted" data-preview-category style="font-size:var(--step--1)"></p>' +
          '</div>' +
          '<button class="modal__close" type="button" data-modal-close aria-label="Close preview">' + IH.icon('close', 21) + '</button>' +
        '</div>' +
        '<div class="modal__body">' +
          '<div class="preview-layout">' +
            '<div>' +
              '<div class="preview-controls" role="group" aria-label="Preview controls">' +
                '<button class="btn btn--ghost btn--sm" type="button" data-zoom="-1" aria-label="Zoom out">' + IH.icon('zoom-out', 17) + '</button>' +
                '<span class="zoom-level" data-zoom-level aria-live="polite">100%</span>' +
                '<button class="btn btn--ghost btn--sm" type="button" data-zoom="1" aria-label="Zoom in">' + IH.icon('zoom-in', 17) + '</button>' +
                '<button class="btn btn--ghost btn--sm" type="button" data-zoom="0" aria-label="Reset zoom">' + IH.icon('rotate-ccw', 17) + '</button>' +
                '<button class="btn btn--ghost btn--sm" type="button" data-fullscreen aria-label="Toggle full screen">' + IH.icon('maximize', 17) + '</button>' +
              '</div>' +
              '<div class="preview-frame" data-device="card" data-preview-frame></div>' +
            '</div>' +
            '<div>' +
              '<div class="preview-meta__title">' +
                '<div><h3 data-preview-name></h3><p class="muted" data-preview-blurb style="font-size:var(--step--1)"></p></div>' +
                '<span data-preview-badge></span>' +
              '</div>' +
              '<ul class="preview-specs" data-preview-features></ul>' +
              '<div class="btn-group">' +
                '<a class="btn btn--primary btn--block" data-preview-use href="create.html">' + IH.icon('wand', 18) + '<span>Use This Template</span></a>' +
                '<button class="btn btn--secondary btn--block" type="button" data-preview-fav>' + IH.icon('heart', 18) + '<span>Save to favourites</span></button>' +
                '<a class="btn btn--ghost btn--block" data-preview-full href="preview.html">' + IH.icon('external-link', 18) + '<span>Open full preview page</span></a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    on(modal, 'mousedown', function (evt) { if (evt.target === modal) IH.modal.close(modal); });
    wirePreviewControls(modal);
    return modal;
  }

  /* Zoom / device / fullscreen behaviour, shared by the modal and the page. */
  function wirePreviewControls(scope) {
    var frame = qs('[data-preview-frame]', scope);
    if (!frame) return;
    var levelOut = qs('[data-zoom-level]', scope);
    var zoom = 1;
    var MIN = 0.5, MAX = 2.5, STEP = 0.25;

    function applyZoom() {
      zoom = Math.min(MAX, Math.max(MIN, Math.round(zoom * 100) / 100));
      var target = qs('.invitation, .preview-frame__img', frame);
      if (target) {
        target.style.transformOrigin = 'top center';
        // The individual `scale` property, not `transform`: the card's entrance
        // animation (fill-mode both) holds `transform` and would override it.
        target.style.scale = zoom === 1 ? '' : String(zoom);
        target.style.marginBottom = zoom > 1 ? ((zoom - 1) * 100) + '%' : '';
      }
      if (levelOut) levelOut.textContent = Math.round(zoom * 100) + '%';
    }

    qsa('[data-zoom]', scope).forEach(function (btn) {
      on(btn, 'click', function () {
        var dir = parseInt(btn.getAttribute('data-zoom'), 10);
        if (dir === 0) zoom = 1; else zoom += dir * STEP;
        applyZoom();
      });
    });

    var fsBtn = qs('[data-fullscreen]', scope);
    on(fsBtn, 'click', function () {
      var doc = document;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        (doc.exitFullscreen || doc.webkitExitFullscreen || function () {}).call(doc);
      } else {
        var req = frame.requestFullscreen || frame.webkitRequestFullscreen;
        if (req) {
          req.call(frame).catch(function () {
            IH.toast.warning('Your browser blocked full screen for this element.');
          });
        } else {
          IH.toast.warning('Full screen is not supported in this browser.');
        }
      }
    });

    // Ctrl/Cmd + scroll to zoom, matching design-tool muscle memory.
    on(frame, 'wheel', function (evt) {
      if (!evt.ctrlKey && !evt.metaKey) return;
      evt.preventDefault();
      zoom += evt.deltaY < 0 ? STEP : -STEP;
      applyZoom();
    }, { passive: false });

    scope._applyZoom = applyZoom;
    scope._resetZoom = function () { zoom = 1; applyZoom(); };
  }

  function fillPreview(scope, tpl) {
    if (!tpl) return;

    var badgeOut = qs('[data-preview-badge]', scope);
    var featOut = qs('[data-preview-features]', scope);
    var frame = qs('[data-preview-frame]', scope);
    var titleOut = qs('#template-preview-title', scope);

    if (titleOut) titleOut.textContent = tpl.name;

    // The name and category can appear more than once on the page (page
    // heading plus detail column), so fill every occurrence, not just the first.
    qsa('[data-preview-name]', scope).forEach(function (n) { n.textContent = tpl.name; });
    qsa('[data-preview-category]', scope).forEach(function (n) {
      n.textContent = tpl.categoryLabel + ' template';
    });
    qsa('[data-preview-blurb]', scope).forEach(function (n) { n.textContent = tpl.blurb; });

    // No tier badge: every design is the same in that respect, so saying so
    // on each one added a word without adding a distinction.
    if (badgeOut) badgeOut.innerHTML = '';

    if (featOut) {
      featOut.innerHTML = tpl.features.map(function (f) {
        return '<li>' + IH.icon('check-circle', 18) + '<span>' + escapeHtml(f) + '</span></li>';
      }).join('');
    }

    // Sample data rendered in this template's palette and event type.
    var eventType = EVENT_TYPES[tpl.category] ? tpl.category : 'other';
    var sample = Object.assign({}, SAMPLE, sampleForCategory(tpl.category, tpl.slug), {
      eventType: eventType,
      template: tpl.slug
    });
    IH.invitation.applyTemplate(sample, tpl.slug);

    if (frame) {
      frame.innerHTML = '';
      var inner = document.createElement('div');
      frame.appendChild(inner);
      IH.invitation.mount(inner, sample);
    }

    var useBtn = qs('[data-preview-use]', scope);
    if (useBtn) useBtn.setAttribute('href', 'create.html?template=' + encodeURIComponent(tpl.slug));
    var fullBtn = qs('[data-preview-full]', scope);
    if (fullBtn) fullBtn.setAttribute('href', 'preview.html?template=' + encodeURIComponent(tpl.slug));

    var favBtn = qs('[data-preview-fav]', scope);
    if (favBtn) {
      favBtn.setAttribute('data-fav', tpl.slug);
      favBtn.setAttribute('data-fav-name', tpl.name);
      var label = qs('span', favBtn);
      var refresh = function () {
        var saved = IH.favorites.has(tpl.slug);
        if (label) label.textContent = saved ? 'Saved to favourites' : 'Save to favourites';
      };
      refresh();
      document.addEventListener('ih:favchange', refresh);
    }
    IH.favorites.sync();
    if (scope._resetZoom) scope._resetZoom();
  }

  /* Realistic sample copy per category so previews never look like lorem
     ipsum. Wedding designs also carry their own header and message wording. */
  function sampleForCategory(category, slug) {
    var sample = sampleForCategoryBase(category, slug);
    // The other occasions carry their own header wording (OCCASION_DETAILS).
    if (OCCASION_DETAILS[category]) {
      var occText = occasionTextFor(category, slug);
      return Object.assign(sample, { additionalTitle: occText.additionalTitle, additionalSubtitle: occText.additionalSubtitle });
    }
    if (category !== 'wedding') return sample;
    var text = weddingTextFor(slug);
    return Object.assign(sample, { additionalTitle: text.additionalTitle, additionalSubtitle: text.additionalSubtitle, message: text.message });
  }

  /* Graduation ... community events on the design engine: the card's own
     sample title, and a person or host that suits the category. */
  var EVENT_SAMPLES = {
    graduation: { people: ['Graduate Name'], hostName: 'Proudly hosted by the family',
      organization: 'Anna University', classCourse: 'B.E. Computer Science', time: '17:00', venue: 'Grand Convention Hall', address: 'Guindy, Chennai 600025',
      message: 'Years of hard work, one proud moment. Please join us to celebrate this milestone.' },
    retirement: { people: ['Retiree Name'], hostName: 'With gratitude, your colleagues',
      role: 'Senior Manager, Southern Railway', yearsOfService: '35', time: '18:30', venue: 'Officers Club', address: 'Egmore, Chennai 600008',
      message: 'After years of dedicated service, it is time to celebrate. Join us to say thank you.' },
    farewell: { people: ['Colleague Name'], hostName: 'From all of us at the team',
      role: 'Team Lead', time: '19:00', venue: 'The Terrace Café', address: 'Nungambakkam, Chennai 600034',
      message: 'One last evening together before the next chapter begins. Come share the memories.' },
    corporate: { hostName: 'Northwind Technologies', organization: 'Northwind Technologies', time: '10:00', venue: 'ITC Grand Chola, Ballroom', address: 'Guindy, Chennai 600032',
      message: 'An evening of insights, conversations and celebration. We look forward to your presence.' },
    festival: { hostName: 'With love, the family', time: '18:30', venue: 'Our Home', address: 'T. Nagar, Chennai 600017',
      message: 'Good food, warm wishes and the joy of the season. Please come and celebrate with us.' },
    'school-events': { hostName: 'Greenfield Public School', organization: 'Greenfield Public School', time: '10:00', venue: 'School Auditorium', address: 'Porur, Chennai 600116',
      message: 'Parents, guardians and well-wishers are warmly invited to share this special day with our students.' },
    'college-events': { hostName: 'Students’ Union', organization: 'Madras Institute of Technology', time: '16:00', venue: 'Open Air Theatre', address: 'Chromepet, Chennai 600044',
      message: 'Events, energy and the whole campus together. Be there and be part of it.' },
    party: { hostName: 'Your Hosts', time: '20:00', venue: 'Sea Breeze, Apartment 12B', address: 'ECR, Chennai 600119',
      message: 'Good music, great food and even better company. Come as you are.' },
    'community-events': { hostName: 'Lakeview Residents Welfare Association', organization: 'Lakeview Residents Welfare Association', time: '10:00', venue: 'Community Hall', address: 'Pallikaranai, Chennai 600100',
      message: 'Neighbours, families and friends are all welcome. Let us come together and make it special.' }
  };
  function eventSampleFor(category, slug) {
    var cfg = EVENT_SAMPLES[category];
    var spec = cfg && IH.weddingDesigns && IH.weddingDesigns.applies(slug) && IH.weddingDesigns.spec(slug);
    if (!spec || spec.occasion !== category) return null;
    var h = 0;
    for (var i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    // A tagline that only repeats the card's script title is left out.
    var title = spec.sampleTitle || '';
    if (cfg.people && title.toLowerCase() === String(spec.title || '').split('|')[0].toLowerCase()) title = '';
    var s = { title: title, personName: cfg.people ? cfg.people[h % cfg.people.length] : '', date: '2027-03-13' };
    ['hostName', 'organization', 'classCourse', 'role', 'yearsOfService', 'time', 'venue', 'address', 'message'].forEach(function (k) { if (cfg[k]) s[k] = cfg[k]; });
    return s;
  }

  function sampleForCategoryBase(category, slug) {
    var ev = eventSampleFor(category, slug);
    if (ev) return ev;
    switch (category) {
      case 'wedding':
        if (slug === 'tamil-thirumanam') {
          return {
            additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
            additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
            brideName: 'Bride',
            groomName: 'Groom',
            brideParents: 'Bride’s Parents',
            groomParents: 'Groom’s Parents',
            haldiEnabled: true, haldiDate: '2026-11-14', haldiTime: '10:00',
            mehndiEnabled: true, mehndiDate: '2026-11-14', mehndiTime: '17:00',
            ceremonyEnabled: true, ceremonyDate: '2026-11-15', ceremonyTime: '09:00',
            receptionEnabled: true, receptionDate: '2026-11-15', receptionTime: '19:00',
            title: 'Thirumanam Invitation',
            hostName: 'Together with their families',
            date: '2026-11-15',
            time: '09:00',
            venue: 'Rani Meyyammai Hall',
            address: 'Egmore, Chennai, Tamil Nadu 600008',
            message: 'With the blessings of our elders and the almighty, we invite you to grace the auspicious occasion of our marriage.'
          };
        }
        if (slug === 'telugu-pelli') {
          return {
            additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
            additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
            brideName: 'Bride',
            groomName: 'Groom',
            haldiEnabled: true, haldiDate: '2026-12-09', haldiTime: '09:00',
            mehndiEnabled: true, mehndiDate: '2026-12-09', mehndiTime: '17:00',
            ceremonyEnabled: true, ceremonyDate: '2026-12-10', ceremonyTime: '10:30',
            receptionEnabled: true, receptionDate: '2026-12-10', receptionTime: '19:00',
            brideParents: 'Bride’s Parents',
            groomParents: 'Groom’s Parents',
            title: 'Pachani Pelli Sambaram',
            hostName: 'Together with their families',
            date: '2026-12-10',
            time: '10:30',
            venue: 'Sri Venkateswara Kalyana Mandapam',
            address: 'Banjara Hills, Hyderabad, Telangana 500034',
            message: 'We seek your blessings and warm presence as two souls unite in holy matrimony.'
          };
        }
        if (slug === 'kasavu-gold-border') {
          return {
            additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
            additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
            brideName: 'Bride',
            groomName: 'Groom',
            title: 'Wedding Ceremony',
            hostName: 'Together with their families',
            date: '2026-12-28',
            time: '10:00',
            venue: 'Le Meridien Convention Centre',
            address: 'Maradu, Kochi, Kerala 682304',
            message: 'We warmly invite you and your family to join us on our wedding day and shower your blessings on us.'
          };
        }
        if (slug === 'bengali-alpona') {
          return {
            additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
            additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
            brideName: 'Bride',
            groomName: 'Groom',
            title: 'Subho Bibaho',
            hostName: 'Together with their families',
            date: '2026-11-20',
            time: '19:00',
            venue: 'Swabhumi Heritage Plaza',
            address: 'EM Bypass, Kolkata, West Bengal 700054',
            message: 'We request the honour of your presence at our wedding ceremony to celebrate love, tradition, and togetherness.'
          };
        }
        if (slug === 'bandhani-bloom') {
          return {
            additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
            additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
            brideName: 'Bride',
            groomName: 'Groom',
            title: 'Vivah Utsav',
            hostName: 'Together with their families',
            date: '2026-12-05',
            time: '18:30',
            venue: 'Toran Banquet & Lawns',
            address: 'SG Highway, Ahmedabad, Gujarat 380054',
            message: 'Request the pleasure of your company as we tie the sacred knot and embark on our new journey together.'
          };
        }
        /* Sample cards never show real-looking names: always Groom & Bride. */
        var couple = ['Groom', 'Bride'];
        return {
          additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
          additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
          brideName: couple[1],
          groomName: couple[0],
          groomParents: 'Groom’s Parents',
          brideParents: 'Bride’s Parents',
          haldiEnabled: true, haldiDate: '2026-12-24', haldiTime: '10:00',
          mehndiEnabled: true, mehndiDate: '2026-12-24', mehndiTime: '17:00',
          ceremonyEnabled: true, ceremonyDate: '2026-12-25', ceremonyTime: '10:30',
          receptionEnabled: true, receptionDate: '2026-12-25', receptionTime: '18:30',
          title: 'The Wedding Celebration',
          hostName: 'Together with their families',
          date: '2026-12-25',
          time: '18:30',
          venue: 'Grand Palace Hall',
          address: 'Anna Salai, Chennai, Tamil Nadu 600002',
          message: 'Request the pleasure of your company as we begin our life together.\nYour presence would make our day complete.'
        };
      case 'birthday':
        /* Birthday cards on the design engine: a person and an age that suit the card. */
        var bSpec = IH.weddingDesigns && IH.weddingDesigns.applies(slug) && IH.weddingDesigns.spec(slug);
        if (bSpec && bSpec.occasion === 'birthday') {
          var B_PEOPLE = {
            baby: { host: 'Proud parents invite you', venue: 'The Little Garden Hall', address: 'Adyar, Chennai 600020',
              message: 'Our little one turns a year older! Join us for cake, smiles and a lot of love.' },
            kid: { host: 'The parents invite you', venue: 'The Play Loft', address: 'Velachery, Chennai 600042',
              message: 'Cake, games and a whole lot of fun. Come celebrate with us!' },
            teen: { host: 'You are invited', venue: 'Skyline Lounge', address: 'Nungambakkam, Chennai 600034',
              message: 'Music, food and the best people. Let us make it a night to remember!' },
            adult: { host: 'You are invited', venue: 'The Grand Terrace', address: 'Anna Nagar, Chennai 600040',
              message: 'Good food, great company and plenty of laughs. Join us for an evening to celebrate!' },
            senior: { host: 'With love, the family', venue: 'Sri Krishna Kalyana Mandapam', address: 'Mylapore, Chennai 600004',
              message: 'With gratitude for a life well lived, we invite you to share this joyous milestone with us.' }
          };
          var bp = B_PEOPLE[bSpec.audience] || B_PEOPLE.adult;
          // Placeholder name only; the person types their own.
          return { title: '', personName: 'Name', hostName: bp.host, years: bSpec.sampleAge, date: '2027-03-20',
            time: bSpec.audience === 'kid' || bSpec.audience === 'baby' ? '16:00' : bSpec.audience === 'senior' ? '11:00' : '19:30',
            venue: bp.venue, address: bp.address, message: bp.message,
            additionalTitle: 'LET’S CELEBRATE\n' + bp.host, additionalSubtitle: BIRTHDAY_SUBTITLE };
        }
        return { title: 'Turning Six!', personName: 'The Birthday Child', hostName: 'The parents invite you', date: '2026-09-12', time: '16:00',
          venue: 'The Play Loft', address: 'Velachery, Chennai 600042',
          message: 'Cake, games and a whole lot of noise. Come celebrate with us!',
          additionalTitle: 'LET’S CELEBRATE\nThe parents invite you', additionalSubtitle: BIRTHDAY_SUBTITLE };
      case 'baby-shower':
      case 'naming-ceremony':
      case 'house-warming':
      case 'anniversary':
        /* Cards on the design engine: a name (couple, baby, family) that suits the card. */
        var oSpec = IH.weddingDesigns && IH.weddingDesigns.applies(slug) && IH.weddingDesigns.spec(slug);
        if (oSpec && oSpec.occasion === category) {
          var ho = 0;
          for (var oj = 0; oj < slug.length; oj++) ho = (ho * 31 + slug.charCodeAt(oj)) >>> 0;
          // Placeholder roles, never real-looking names.
          var oc = ['Mother', 'Father'];
          if (category === 'baby-shower') {
            return { title: '', personName: 'Mom-to-be & Dad-to-be', babyName: '', hostName: 'With love, the family', date: '2027-01-17', time: '11:00',
              venue: 'Rose Garden Banquet', address: 'Adyar, Chennai 600020',
              message: 'A little one is on the way! Join us for an afternoon of games, blessings and sweet treats.' };
          }
          if (category === 'naming-ceremony') {
            var girl = /princess|crown|cherished|filled-with-love|petal/.test(slug) || (!/prince|heir/.test(slug) && ho % 2 === 0);
            return { title: '', babyName: 'Baby Name', babyRelation: girl ? 'Daughter' : 'Son', parentsName: oc[0] + ' & ' + oc[1],
              hostName: 'With love, the family', date: '2027-02-07', time: '10:00', venue: 'Sri Krishna Kalyana Mandapam', address: 'Mylapore, Chennai 600004',
              message: girl ? 'With the blessings of our elders, we name our daughter. Please join us.' : 'With the blessings of our elders, we name our son. Please join us.' };
          }
          if (category === 'house-warming') {
            return { title: '', personName: 'Family Name', hostName: 'With love and gratitude', date: '2027-01-24', time: '08:30',
              venue: 'Plot 42, Lakeview Enclave', address: 'Sholinganallur, Chennai 600119',
              message: 'We have built a home. Please come and bless it with your presence.' };
          }
          var yrs = oSpec.sampleYears || 25;
          return { title: '', personName: 'Husband & Wife', years: String(yrs), hostName: 'With love, the family', date: '2027-02-20', time: '19:00',
            venue: 'Ocean Pearl Hall', address: 'Besant Nagar, Chennai 600090',
            message: yrs >= 40 ? 'A lifetime of love, laughter and togetherness. Please join us to celebrate this blessed milestone.'
              : 'Years of love and laughter, and many more to come. Please join us for an evening of celebration.' };
        }
        if (category === 'naming-ceremony') {
          return { title: 'Namakarana', babyName: 'Our Baby Girl', babyRelation: 'Daughter', parentsName: 'The Family', hostName: 'The Parents', date: '2026-08-30', time: '09:30',
            venue: 'Sri Krishna Kalyana Mandapam', address: 'Mylapore, Chennai 600004',
            message: 'With the blessings of our elders, we name our daughter. Please join us.' };
        }
        if (category === 'house-warming') {
          return { title: 'Griha Pravesh', personName: '', hostName: 'The Family', date: '2026-07-18', time: '07:30',
            venue: 'Plot 42, Lakeview Enclave', address: 'Sholinganallur, Chennai 600119',
            message: 'We have built a home. Please come and bless it with your presence.' };
        }
        if (category === 'anniversary') {
          return { brideName: 'Bride', groomName: 'Groom', years: '25', title: '25 Years Together', hostName: 'With love, the family',
            date: '2026-11-08', time: '19:00', venue: 'Ocean Pearl Hall', address: 'Besant Nagar, Chennai 600090',
            message: 'Twenty-five years ago we said yes. Celebrate the silver year with us.' };
        }
        return { title: 'Baby Shower', personName: 'Our Little One', hostName: 'The Family', date: '2026-10-04', time: '11:00',
          venue: 'Rose Garden Banquet', address: 'Adyar, Chennai 600020',
          message: 'Join us for a morning of blessings as we welcome our little one.' };
      case 'corporate':
        return { title: 'Annual Partner Summit 2026', hostName: 'Northwind Technologies', personName: '',
          date: '2026-09-24', time: '10:00', venue: 'ITC Grand Chola, Ballroom 2', address: 'Guindy, Chennai 600032',
          message: 'A full day of product keynotes, partner sessions and networking. Seats are limited.' };
      case 'festival':
        return { title: 'Diwali Celebration', hostName: 'With love, the family', personName: '',
          date: '2026-11-07', time: '18:00', venue: 'Our Home', address: 'T. Nagar, Chennai 600017',
          message: 'Lamps, sweets and good company. Wishing you a bright and joyful festival.',
          additionalInformation: 'Please bring a small dish to share.' };
      case 'graduation':
        return { title: 'Class of 2026', personName: 'The Graduate', hostName: 'Proudly hosted by the family',
          date: '2026-06-20', time: '17:00', venue: 'College Auditorium', address: 'Guindy, Chennai 600025',
          message: 'Four years, one degree and a lot of coffee. Come celebrate the finish line.' };
      case 'retirement':
        return { title: 'A Life Well Served', personName: 'Our Colleague', hostName: 'The team at Southern Rail',
          date: '2026-05-29', time: '18:00', venue: 'Officers Club', address: 'Egmore, Chennai 600008',
          message: 'Thirty-eight years of service. Join us as we say thank you.' };
      case 'farewell':
        return { title: 'Farewell Evening', personName: 'Our Colleague', hostName: 'From all of us at Studio 9',
          date: '2026-04-30', time: '19:30', venue: 'The Terrace Cafe', address: 'Nungambakkam, Chennai 600034',
          message: 'One last evening together before the next chapter begins.' };
      case 'school-events':
        return { title: 'School Annual Day 2026', hostName: 'Greenfield Matriculation School', personName: '',
          date: '2026-12-12', time: '17:00', venue: 'School Grounds', address: 'Porur, Chennai 600116',
          message: 'Music, dance and prize distribution. Parents and guardians are warmly invited.' };
      case 'college-events':
        return { title: 'Rhythm 2026', hostName: 'Students Union', personName: '',
          date: '2026-10-16', time: '16:00', venue: 'Open Air Theatre', address: 'Taramani, Chennai 600113',
          message: 'Three days. Twenty events. One campus. Get your passes early.' };
      case 'party':
        return { title: 'House Party', hostName: 'The Hosts', personName: '',
          date: '2026-06-06', time: '20:00', venue: 'Apartment 12B, Sea Breeze', address: 'ECR, Chennai 600119',
          message: 'Music, food and friends. Bring nothing but yourself.' };
      case 'community-events':
        return { title: 'Residents Association Meet', hostName: 'Lakeview Residents Welfare Association', personName: '',
          date: '2026-05-10', time: '10:00', venue: 'Community Hall', address: 'Pallikaranai, Chennai 600100',
          message: 'Agenda: maintenance review, security update and the summer plan. All residents welcome.' };
      case 'engagement':
        /* Engagement cards on the wedding design engine show family blessings
           and the engagement ceremonies too, so their sample carries them. */
        if (IH.weddingDesigns && IH.weddingDesigns.applies(slug)) {
          /* Sample cards never show real-looking names: always Groom & Bride. */
          var ec = ['Groom', 'Bride'];
          return {
            additionalTitle: 'TWO HEARTS, ONE PROMISE\nTogether with their families',
            additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe request the pleasure of your company at the engagement of',
            brideName: ec[1], groomName: ec[0],
            groomParents: 'Groom’s Parents', brideParents: 'Bride’s Parents',
            ceremonyEnabled: true, ceremonyDate: '2027-02-14', ceremonyTime: '11:00',
            receptionEnabled: true, receptionDate: '2027-02-14', receptionTime: '13:00',
            title: 'Engagement Ceremony', hostName: 'Together with their families',
            date: '2027-02-14', time: '11:00', venue: 'Hotel Saravana Bhavan Hall', address: 'Anna Nagar, Chennai 600040',
            message: 'Two families, one promise. Please join us as the couple exchange rings.'
          };
        }
        return { brideName: 'Bride', groomName: 'Groom', title: 'Engagement Ceremony', hostName: 'Together with their families',
          date: '2026-08-22', time: '11:00', venue: 'Hotel Saravana Bhavan Hall', address: 'Anna Nagar, Chennai 600040',
          message: 'Two families, one promise. Please join us as the couple exchange rings.' };
      case 'reception':
        /* Reception cards on the wedding design engine: couple, hosts, programme. */
        if (IH.weddingDesigns && IH.weddingDesigns.applies(slug)) {
          var rc = ['Groom', 'Bride'];
          return {
            additionalTitle: 'JUST MARRIED\nTogether with their families',
            additionalSubtitle: 'AN EVENING TO CELEBRATE\nWe joyfully invite you to celebrate the wedding of',
            personName: rc[0] + ' & ' + rc[1], groomName: rc[0], brideName: rc[1],
            groomParents: 'Groom’s Parents', brideParents: 'Bride’s Parents',
            ceremonyEnabled: true, ceremonyDate: '2027-01-24', ceremonyTime: '18:30',
            receptionEnabled: true, receptionDate: '2027-01-24', receptionTime: '20:00',
            title: 'Wedding Reception', hostName: 'Together with their families',
            date: '2027-01-24', time: '18:30', venue: 'Grand Palace Hall', address: 'Anna Salai, Chennai 600002',
            message: 'Dinner, music and celebration. Join us for an evening in honour of the newlyweds.'
          };
        }
        return { brideName: 'Bride', groomName: 'Groom', title: 'Wedding Reception', hostName: 'Together with their families',
          date: '2026-12-26', time: '19:00', venue: 'Grand Palace Hall', address: 'Anna Salai, Chennai 600002',
          message: 'Dinner, music and celebration. Join us the evening after the wedding.' };
      default:
        return {};
    }
  }

  IH.previewModal = {
    open: function (slug) {
      var tpl = IH.data.getTemplate(slug);
      if (!tpl) { IH.toast.error('That template could not be found.'); return; }
      var modal = ensurePreviewModal();
      fillPreview(modal, tpl);
      IH.modal.open(modal);
    }
  };

  /* Clicking Preview anywhere opens the modal; the link still works
     without JS because it points at preview.html. */
  function initPreviewLinks() {
    document.addEventListener('click', function (evt) {
      var link = evt.target.closest && evt.target.closest('[data-preview]');
      if (!link) return;
      if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.button === 1) return;
      evt.preventDefault();
      IH.previewModal.open(link.getAttribute('data-preview'));
    });
  }

  /* ==================================================================
     PART 3 — preview.html page controller
     ================================================================== */

  function initPreviewPage() {
    var page = qs('[data-preview-page]');
    if (!page) return;

    var params = new URLSearchParams(location.search);
    var slug = params.get('template') || 'elegant-floral';
    var tpl = IH.data.getTemplate(slug);

    if (!tpl) {
      var frame = qs('[data-preview-frame]', page);
      if (frame) {
        frame.innerHTML = '<div class="empty-state">' + IH.icon('alert-circle', 56) +
          '<h3>Template not found</h3><p>“' + escapeHtml(slug) + '” is not in the catalogue.</p>' +
          '<a class="btn btn--primary" href="templates.html">' + IH.icon('layers', 18) + '<span>Browse all templates</span></a></div>';
      }
      var t = qs('[data-preview-name]', page);
      if (t) t.textContent = 'Template not found';
      return;
    }

    document.title = tpl.name + ' — Invitation Template Preview | InviteAura';
    var metaDesc = qs('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', tpl.name + ' — ' + tpl.blurb + ' Preview and personalise it free on InviteAura.');

    wirePreviewControls(page);
    fillPreview(page, tpl);

    var crumb = qs('[data-preview-crumb]', page);
    if (crumb) {
      crumb.innerHTML = '<a href="templates.html?category=' + encodeURIComponent(tpl.category) + '">' +
        escapeHtml(tpl.categoryLabel) + '</a>';
    }

    // Thumbnail of the printed card, alongside the live invitation.
    var thumb = qs('[data-preview-thumb]', page);
    if (thumb) {
      thumb.innerHTML = '<img class="preview-frame__img" src="' + escapeHtml(tpl.image) + '" ' +
        'alt="' + escapeHtml(tpl.name) + ' card artwork" width="600" height="800" data-eager>';
    }

    var specTable = qs('[data-preview-specs]', page);
    if (specTable) {
      specTable.innerHTML =
        '<tr><th scope="row">Category</th><td>' + escapeHtml(tpl.categoryLabel) + '</td></tr>' +
        '<tr><th scope="row">Orientation</th><td>Portrait 3:4</td></tr>' +
        '<tr><th scope="row">Best for</th><td>Mobile sharing &amp; WhatsApp</td></tr>' +
        '<tr><th scope="row">Added</th><td>' + escapeHtml(formatDate(tpl.added).full) + '</td></tr>';
    }

    // "More like this"
    var related = qs('[data-preview-related]', page);
    if (related) {
      var others = IH.data.templates
        .filter(function (t) { return t.category === tpl.category && t.slug !== tpl.slug; })
        .concat(IH.data.templates.filter(function (t) { return t.category !== tpl.category; }))
        .slice(0, 4);
      related.innerHTML = others.map(function (t) { return IH.render.templateCardHTML(t); }).join('');
      IH.favorites.sync();
      IH.observeReveal(qsa('.template-card', related));
    }
  }

  /* ==================================================================
     Boot
     ================================================================== */

  function boot() {
    initPreviewLinks();
    initPreviewPage();

    // Any element with data-sample-invitation renders the demo card.
    qsa('[data-sample-invitation]').forEach(function (host) {
      var slug = host.getAttribute('data-sample-invitation');
      var data = Object.assign({}, SAMPLE);
      if (slug && slug !== 'true') {
        var tpl = IH.data.getTemplate(slug);
        if (tpl) {
          data = Object.assign(data, sampleForCategory(tpl.category, tpl.slug), {
            eventType: EVENT_TYPES[tpl.category] ? tpl.category : 'other'
          });
          IH.invitation.applyTemplate(data, slug);
        }
      }

      IH.invitation.mount(host, data);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
