/* ==========================================================================
   InviteHub — preview.js
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
      '<path d="M18 56h20M42 56h20" stroke-linecap="round" opacity=".45"/></svg>'
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

  /* Default demo content, used by the sample invitation and as editor seed. */
  var SAMPLE = {
    eventType: 'wedding',
    template: 'elegant-floral',
    title: 'The Wedding Celebration',
    hostName: 'Both Families',
    brideName: 'Bride',
    groomName: 'Groom',
    personName: '',
    date: '2026-12-25',
    time: '18:30',
    venue: 'Grand Palace Hall',
    address: 'Anna Salai, Chennai, Tamil Nadu 600002',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Chennai',
    phone: '0000000000',
    email: 'hello@example.com',
    message: 'Request the pleasure of your company as we begin our life together. Your presence would make our day complete.',
    photo: '',
    music: 'none',
    musicFile: '',
    font: 'playfair',
    showCountdown: true,
    showRsvp: true,
    showMaps: true
  };

  function headlineFor(data) {
    var type = data.eventType || 'other';
    if (type === 'wedding' || type === 'engagement') {
      if (data.groomName && data.brideName) {
        return escapeHtml(data.groomName) + '<span class="amp">&amp;</span>' + escapeHtml(data.brideName);
      }
      return escapeHtml(data.groomName || data.brideName || data.title || 'Our Special Day');
    }
    /* A reception or anniversary names the couple in one field — but a
       saved draft may still carry the older Groom/Bride pair. */
    if (type === 'reception' || type === 'anniversary') {
      if (data.personName) return escapeHtml(data.personName);
      if (data.groomName && data.brideName) {
        return escapeHtml(data.groomName) + '<span class="amp">&amp;</span>' + escapeHtml(data.brideName);
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

  IH.invitation = {
    EVENT_TYPES: EVENT_TYPES,
    SAMPLE: SAMPLE,

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
      var fonts = GOOGLE_FONTS[data.font] || GOOGLE_FONTS.playfair;
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
        parts.push('background-image:linear-gradient(160deg, ' + c.bg1 + 'D9, ' + c.bg2 + 'D9), url(' + data.background + ')');
        parts.push('background-size:cover');
        parts.push('background-position:center');
      }
      return parts.join(';');
    },

    /* Full invitation markup. Returns a string so it can be dropped
       into a modal, the editor stage or a standalone page alike. */
    render: function (input) {
      var data = Object.assign({}, SAMPLE, input || {});
      var type = EVENT_TYPES[data.eventType] ? data.eventType : 'other';
      var meta = EVENT_TYPES[type];
      var d = formatDate(data.date);
      var time = formatTime(data.time);
      var ornament = ORNAMENTS[meta.motif] || ORNAMENTS.floral;
      var html = [];

      html.push('<article class="invitation invitation--' + type + '" style="' + this.styleVars(data) + '" ' +
        'aria-label="' + escapeHtml(meta.label) + ' invitation preview">');


      html.push('<div class="invitation__ornament">' + ornament + '</div>');

      /* The top line names who is hosting. The Hosted by field leads for
         every occasion now, with the organisation behind an institutional
         event as the fallback, so corporate cards no longer lose it. */
      var orgName = data.organization;
      var hostLine = data.hostName || orgName;
      html.push('<p class="invitation__kicker">' + escapeHtml(hostLine || meta.kicker) + '</p>');

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
      if (data.hostName) detail('Organization', data.organization);
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
        html.push('<div class="invitation__when">' +
          '<div><small>' + escapeHtml(d.weekday || 'Date') + '</small>' +
            '<div class="invitation__when-date">' + escapeHtml(d.full || 'Date to be announced') + '</div></div>' +
          '<div class="invitation__when-sep" aria-hidden="true"></div>' +
          '<div><small>Time</small><div class="invitation__when-date">' + escapeHtml(time || '—') + '</div></div>' +
        '</div>');
      }

      if (data.venue || data.address) {
        html.push('<div class="invitation__venue">' +
          (data.venue ? '<strong>' + escapeHtml(data.venue) + '</strong>' : '') +
          (data.address ? '<span>' + escapeHtml(data.address) + '</span>' : '') +
        '</div>');
      }

      if (data.showCountdown !== false && data.date && IH.countdown) {
        html.push(IH.countdown.markup(toDateTime(data.date, data.time)));
      }

      if (data.additionalInformation) {
        html.push('<div class="invitation__extra"><small>Additional information</small>' +
          '<p>' + escapeHtml(data.additionalInformation) + '</p></div>');
      }

      var actions = [];
      if (data.showMaps !== false && (data.mapsUrl || data.address)) {
        var mapHref = data.mapsUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.address));
        actions.push('<a class="inv-btn inv-btn--solid" href="' + escapeHtml(mapHref) + '" target="_blank" rel="noopener noreferrer">' +
          IH.icon('map-pin', 15) + '<span>Directions</span></a>');
      }
      if (data.showRsvp !== false) {
        actions.push('<button class="inv-btn" type="button" data-soon="RSVP collection arrives with the full version of InviteHub.">' +
          IH.icon('user-check', 15) + '<span>RSVP</span></button>');
      }
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

      html.push('<p class="invitation__footer">Created with InviteHub</p>');

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
                '<div class="device-switch" role="group" aria-label="Preview device">' +
                  '<button type="button" data-device="mobile" aria-pressed="true" aria-label="Mobile preview">' + IH.icon('smartphone', 17) + '</button>' +
                  '<button type="button" data-device="desktop" aria-pressed="false" aria-label="Desktop preview">' + IH.icon('monitor', 17) + '</button>' +
                '</div>' +
                '<button class="btn btn--ghost btn--sm" type="button" data-fullscreen aria-label="Toggle full screen">' + IH.icon('maximize', 17) + '</button>' +
              '</div>' +
              '<div class="preview-frame" data-device="mobile" data-preview-frame></div>' +
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
        target.style.transform = zoom === 1 ? '' : 'scale(' + zoom + ')';
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

    qsa('[data-device]', scope).forEach(function (btn) {
      on(btn, 'click', function () {
        var mode = btn.getAttribute('data-device');
        frame.setAttribute('data-device', mode);
        qsa('[data-device]', scope).forEach(function (other) {
          other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
        });
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
    var sample = Object.assign({}, SAMPLE, sampleForCategory(tpl.category), {
      eventType: eventType,
      template: tpl.slug
    });
    IH.invitation.applyTemplate(sample, tpl.slug);
    if (frame) IH.invitation.mount(frame, sample);

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

  /* Realistic sample copy per category so previews never look like lorem ipsum. */
  function sampleForCategory(category) {
    switch (category) {
      case 'birthday':
        return { title: 'Turning Six!', personName: 'The Birthday Child', hostName: 'The parents invite you', date: '2026-09-12', time: '16:00',
          venue: 'The Play Loft', address: 'Velachery, Chennai 600042',
          message: 'Cake, games and a whole lot of noise. Come celebrate with us!' };
      case 'baby-shower':
        return { title: 'Baby Shower', personName: 'Our Little One', hostName: 'The Family', date: '2026-10-04', time: '11:00',
          venue: 'Rose Garden Banquet', address: 'Adyar, Chennai 600020',
          message: 'Join us for a morning of blessings as we welcome our little one.' };
      case 'naming-ceremony':
        return { title: 'Namakarana', babyName: 'Our Baby Girl', babyRelation: 'Daughter', parentsName: 'The Family', hostName: 'The Parents', date: '2026-08-30', time: '09:30',
          venue: 'Sri Krishna Kalyana Mandapam', address: 'Mylapore, Chennai 600004',
          message: 'With the blessings of our elders, we name our daughter. Please join us.' };
      case 'house-warming':
        return { title: 'Griha Pravesh', personName: '', hostName: 'The Family', date: '2026-07-18', time: '07:30',
          venue: 'Plot 42, Lakeview Enclave', address: 'Sholinganallur, Chennai 600119',
          message: 'We have built a home. Please come and bless it with your presence.' };
      case 'anniversary':
        return { brideName: 'Bride', groomName: 'Groom', years: '25', title: '25 Years Together', hostName: 'With love, the family',
          date: '2026-11-08', time: '19:00', venue: 'Ocean Pearl Hall', address: 'Besant Nagar, Chennai 600090',
          message: 'Twenty-five years ago we said yes. Celebrate the silver year with us.' };
      case 'corporate':
        return { title: 'Annual Partner Summit 2026', hostName: 'Northwind Technologies', personName: '',
          date: '2026-09-24', time: '10:00', venue: 'ITC Grand Chola, Ballroom 2', address: 'Guindy, Chennai 600032',
          message: 'A full day of product keynotes, partner sessions and networking. Seats are limited.' };
      case 'festival':
        return { title: 'Diwali Celebration', hostName: 'Lovely [Name] Family', personName: '',
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
        return { brideName: 'Bride', groomName: 'Groom', title: 'Engagement Ceremony', hostName: 'Together with their families',
          date: '2026-08-22', time: '11:00', venue: 'Hotel Saravana Bhavan Hall', address: 'Anna Nagar, Chennai 600040',
          message: 'Two families, one promise. Please join us as the couple exchange rings.' };
      case 'reception':
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

    document.title = tpl.name + ' — Invitation Template Preview | InviteHub';
    var metaDesc = qs('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', tpl.name + ' — ' + tpl.blurb + ' Preview and personalise it free on InviteHub.');

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
          data = Object.assign(data, sampleForCategory(tpl.category), {
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
