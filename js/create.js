/* ==========================================================================
   InviteAura — create.js
   The six-step invitation builder on create.html.

   Nothing here talks to a server. The draft lives in localStorage and
   uploaded photos are read with FileReader and kept as data URLs in the
   browser only — they are never transmitted anywhere.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;
  var qs = dom.qs, qsa = dom.qsa, on = dom.on, escapeHtml = dom.escapeHtml;

  var root = null;

  /* ------------------------------------------------------------------
     1. Field visibility per event type
     ------------------------------------------------------------------ */

  /* Who the card is about, which is the only thing that really differs
     between one celebration and the next. A wedding names two people, a
     birthday names one, and a festival or a product launch names none —
     its title is the whole identity. This drives the friendly demo names
     in the live preview only; the form itself is configured below. */
  var NAME_MODE = {
    wedding: 'couple', engagement: 'couple', reception: 'couple',
    birthday: 'person', 'naming-ceremony': 'person', graduation: 'person',
    retirement: 'person', farewell: 'person'
  };

  function nameMode(type) { return NAME_MODE[type] || 'title'; }

  /* ------------------------------------------------------------------
     The Details form, configured per event type.
     One shared form is shown and relabelled to match the occasion — a
     wedding asks for a groom and a bride, a graduation for one graduate,
     a corporate event for the company behind it. A field appears when its
     event type is listed below; an asterisk marks the ones that are
     genuinely required (the title and the date, plus whoever the card is
     about). Everything else is optional, so an invitation can go out
     before the venue is booked.                                  */

  /* Every input that can appear in the Details form. */
  var ALL_FIELDS = ['title', 'hostName', 'groomName', 'groomParents', 'brideName', 'brideParents', 'personName',
    'babyName', 'babyRelation', 'parentsName', 'organization', 'date', 'time', 'venue',
    'address', 'mapsUrl', 'years', 'classCourse', 'department', 'role',
    'yearsOfService', 'eventKind', 'theme', 'phone', 'email', 'message',
    'additionalInformation'];

  /* Which event type shows which fields. 'other' is the fallback. */
  var FIELDS_BY_CATEGORY = {
    wedding: ['title', 'groomName', 'groomParents', 'brideName', 'brideParents', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    engagement: ['title', 'groomName', 'groomParents', 'brideName', 'brideParents', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    reception: ['title', 'groomName', 'groomParents', 'brideName', 'brideParents', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    festival: ['title', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message', 'additionalInformation'],
    birthday: ['title', 'personName', 'years', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'baby-shower': ['title', 'personName', 'babyName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'naming-ceremony': ['title', 'babyName', 'babyRelation', 'parentsName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'house-warming': ['title', 'personName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    anniversary: ['title', 'personName', 'years', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    graduation: ['title', 'personName', 'organization', 'classCourse', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    retirement: ['title', 'personName', 'role', 'yearsOfService', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    farewell: ['title', 'personName', 'role', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    corporate: ['title', 'organization', 'department', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'school-events': ['title', 'organization', 'classCourse', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'college-events': ['title', 'organization', 'department', 'classCourse', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    party: ['title', 'personName', 'theme', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'community-events': ['title', 'organization', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    other: ['title', 'personName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message']
  };

  /* Fields that must be filled in before the wizard lets the host move on. */
  var REQUIRED_BY_CATEGORY = {
    wedding: ['title', 'groomName', 'brideName', 'date', 'time', 'email'],
    engagement: ['title', 'groomName', 'brideName', 'date', 'time', 'email'],
    reception: ['title', 'groomName', 'brideName', 'date', 'time', 'email'],
    festival: ['title', 'date', 'time', 'email'],
    birthday: ['title', 'personName', 'date', 'time', 'email'],
    'baby-shower': ['title', 'personName', 'date', 'time', 'email'],
    'naming-ceremony': ['title', 'babyName', 'babyRelation', 'parentsName', 'date', 'time', 'email'],
    'house-warming': ['title', 'personName', 'date', 'time', 'email'],
    anniversary: ['title', 'personName', 'date', 'time', 'email'],
    graduation: ['title', 'personName', 'date', 'time', 'email'],
    retirement: ['title', 'personName', 'date', 'time', 'email'],
    farewell: ['title', 'personName', 'date', 'time', 'email'],
    corporate: ['title', 'organization', 'date', 'time', 'email'],
    'school-events': ['title', 'organization', 'date', 'time', 'email'],
    'college-events': ['title', 'organization', 'date', 'time', 'email'],
    party: ['title', 'personName', 'date', 'time', 'email'],
    'community-events': ['title', 'organization', 'date', 'time', 'email'],
    other: ['title', 'date', 'time', 'email']
  };

  var BASE_LABELS = {
    title: 'Event title',
    hostName: 'Hosted by',
    groomName: 'Groom’s name',
    groomParents: 'SON OF',
    brideName: 'Bride’s name',
    brideParents: 'DAUGHTER OF',
    personName: 'Name',
    babyName: 'Baby’s name / nickname',
    babyRelation: 'Baby’s relation',
    parentsName: 'Parents’ names',
    organization: 'Organization / Institution',
    date: 'Date',
    time: 'Time',
    venue: 'Venue',
    address: 'Full address',
    mapsUrl: 'Google Maps URL',
    years: 'Years',
    classCourse: 'Degree / Course',
    department: 'Department',
    role: 'Job title / Role',
    yearsOfService: 'Years of service',
    eventKind: 'Event type',
    theme: 'Theme',
    phone: 'Contact number',
    email: 'Contact email',
    message: 'Invitation message',
    additionalInformation: 'Additional information'
  };

  /* Wording that differs by occasion. */
  var FIELD_LABELS = {
    groomName: { wedding: 'Groom’s name', engagement: 'Partner 1’s name' },
    brideName: { wedding: 'Bride’s name', engagement: 'Partner 2’s name' },
    personName: {
      birthday: 'Birthday person’s name',
      'baby-shower': 'Parent / Parents’ names',
      'house-warming': 'Family / Host name',
      anniversary: 'Couple’s name',
      graduation: 'Graduate’s name',
      retirement: 'Retiree’s name',
      farewell: 'Person being honored',
      party: 'Guest of honor / Celebrant'
    },
    babyName: {
      'naming-ceremony': 'Baby’s name'
    },
    organization: {
      corporate: 'Company / Organization name',
      'school-events': 'School name',
      'college-events': 'College / Institution name',
      'community-events': 'Community / Group name',
      graduation: 'Institution name'
    },
    classCourse: {
      graduation: 'Degree / Course',
      'school-events': 'Class / Grade',
      'college-events': 'Course / Class'
    },
    role: {
      retirement: 'Job title / Role',
      farewell: 'Role / Position'
    },
    years: {
      anniversary: 'Years together / Anniversary number',
      birthday: 'Age / birthday number'
    },
    venue: {
      birthday: 'Party venue'
    },
    message: {
      festival: 'Festival message / greeting',
      'baby-shower': 'Shower message',
      'naming-ceremony': 'Ceremony message',
      'house-warming': 'Housewarming message',
      anniversary: 'Anniversary message',
      graduation: 'Graduation message',
      retirement: 'Retirement message',
      farewell: 'Farewell message',
      corporate: 'Event message',
      'school-events': 'Message',
      'college-events': 'Event message',
      party: 'Party message',
      'community-events': 'Community message'
    }
  };

  var FIELD_PLACEHOLDERS = {
    venue: {
      birthday: 'e.g. The Grand Terrace'
    },
    babyName: {
      'naming-ceremony': 'e.g. Baby’s first name'
    },
    organization: {
      corporate: 'e.g. Northwind Technologies',
      'school-events': 'e.g. Greenfield Public School',
      'college-events': 'e.g. City Engineering College',
      'community-events': 'e.g. Lakeview Residents Association',
      graduation: 'e.g. City University'
    }
  };

  function fieldLabel(name, type) {
    var over = FIELD_LABELS[name];
    // Each occasion names its venue ("Shower venue", "Event venue"...).
    if (name === 'venue' && occasionCfg(type)) return occasionCfg(type).venue;
    return (over && over[type]) || BASE_LABELS[name] || name;
  }

  var STEP_TITLE_OVERRIDES = {
    corporate: 'Corporate event details',
    'school-events': 'School event details',
    'college-events': 'College event details',
    'community-events': 'Community event details'
  };

  var TITLE_PLACEHOLDERS = {
    wedding: 'e.g. The Wedding Celebration',
    engagement: 'e.g. Engagement Ceremony',
    reception: 'e.g. Wedding Reception',
    birthday: 'e.g. Turning Six!',
    'baby-shower': 'e.g. Baby Shower',
    'naming-ceremony': 'e.g. Naming Ceremony',
    'house-warming': 'e.g. Griha Pravesh',
    anniversary: 'e.g. 25 Years Together',
    corporate: 'e.g. Annual Partner Summit 2026',
    festival: 'e.g. Diwali Celebration',
    'school-events': 'e.g. School Annual Day 2026',
    retirement: 'e.g. Retirement Felicitation',
    farewell: 'e.g. Farewell Gathering',
    'college-events': 'e.g. College Fest 2026',
    party: 'e.g. House Party',
    'community-events': 'e.g. Community Gathering',
    other: 'e.g. Our Special Event'
  };

  /* Which template categories to surface for the chosen event type. */
  var TEMPLATE_CATEGORY_FOR_EVENT = {
    wedding: 'wedding', engagement: 'engagement', reception: 'reception',
    birthday: 'birthday', 'baby-shower': 'baby-shower', 'naming-ceremony': 'naming-ceremony',
    'house-warming': 'house-warming', anniversary: 'anniversary', graduation: 'graduation',
    retirement: 'retirement', farewell: 'farewell', corporate: 'corporate',
    festival: 'festival', 'school-events': 'school-events',
    'college-events': 'college-events', party: 'party', 'community-events': 'community-events'
  };

  /* ------------------------------------------------------------------
     2. Draft state
     ------------------------------------------------------------------ */

  var DRAFT_KEY = 'draft';

  var state = null;

  function defaultState() {
    return {
      eventType: 'wedding',
      template: 'elegant-floral',
      previewMode: 'card',
      aiBackground: '',
      aiBackgroundAsset: '',
      title: '',
      additionalTitle: 'A BLESSED BEGINNING\nWith the blessings of our parents',
      additionalSubtitle: 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of',
      hostName: '',
      brideName: '',
      brideParents: '',
      groomName: '',
      groomParents: '',
      personName: '',
      babyName: '',
      babyRelation: 'Son',
      parentsName: '',
      organization: '',
      classCourse: '',
      department: '',
      role: '',
      yearsOfService: '',
      eventKind: '',
      theme: '',
      years: '',
      date: '',
      time: '',
      venue: '',
      address: '',
      mapsUrl: '',
      phone: '',
      email: '',
      message: 'Request the pleasure of your company as we begin our life together.\nYour presence would make our day complete.',
      additionalInformation: '',
      photo: '',
      background: '',
      gallery: [],
      venueImage: '',
      music: 'none',
      musicFile: '',
      font: '',
      fontPicked: false,
      colors: null,
      customColors: false,
      animation: 'fade',
      showCountdown: true,
      showMaps: true,
      showGallery: true,
      showBlessings: true,
      blessingsHeading: 'WITH THE BLESSINGS OF',
      blessingsLeftTitle: "Bride's Family",
      blessingsLeftDetails: 'Bride’s Parents & Family',
      blessingsRightTitle: "Groom's Family",
      blessingsRightDetails: 'Groom’s Parents & Family',
      blessingsMessage: 'Your presence and blessings will make our celebration even more special.',
      haldiEnabled: false,
      haldiDate: '',
      haldiTime: '',
      mehndiEnabled: false,
      mehndiDate: '',
      mehndiTime: '',
      ceremonyEnabled: false,
      ceremonyDate: '',
      ceremonyTime: '',
      receptionEnabled: false,
      receptionDate: '',
      receptionTime: '',
      plan: '99',
      hosted: false,
      hostedUrl: '',
      hostingPaid: false,
      hostingPayment: null,
      hostingPaymentId: '',
      invitationId: '',
      filename: '',
      hostedAt: null,
      expiresAt: '',
      hostingStatus: '',
      emailStatus: null,
      step: 1,
      namesSwapped: false,
      updatedAt: null,
      published: false,
      publishedAt: null
    };
  }

  function loadDraft() {
    var saved = IH.store.get(DRAFT_KEY, null);
    var base = defaultState();
    if (saved && typeof saved === 'object') {
      Object.keys(base).forEach(function (k) {
        if (saved[k] !== undefined && saved[k] !== null) base[k] = saved[k];
      });
    }

    /* 'playfair' used to be the default and meant "the design's own font"
       ('cinzel' meant Telugu Pelli's own font). Both now read as no pick. */
    if (saved && !saved.fontPicked && (saved.font === 'playfair' || (saved.font === 'cinzel' && base.template === 'telugu-pelli'))) base.font = '';

    /* Older naming-ceremony drafts kept the baby's name in the shared
       personName field, which is now dedicated to birthdays, graduations
       and the other one-person occasions. A saved naming ceremony moves
       that name into babyName so the form, the preview and the guest card
       all read the same field. Nothing else is touched, so drafts of any
       other occasion keep personName exactly as they saved it. */
    if (base.eventType === 'naming-ceremony' && !base.babyName && base.personName) {
      base.babyName = base.personName;
      base.personName = '';
    }
    /* Relation is a rendering default, never a required real answer — a
       draft saved before the field existed must still announce Son. */
    if (!base.babyRelation) base.babyRelation = 'Son';

    /* Receptions used to name the couple in one field ("Rohan & Ananya");
       they now take Groom and Bride like a wedding, so split the old value. */
    if (base.eventType === 'reception' && base.personName && !base.groomName && !base.brideName) {
      var couple = String(base.personName).split(/\s*(?:&|\band\b)\s*/i).filter(Boolean);
      base.groomName = couple[0] || '';
      base.brideName = couple.slice(1).join(' & ');
      base.personName = '';
    }

    /* Migrate legacy or truncated additional header strings to full standard defaults */
    if (!base.additionalSubtitle ||
        base.additionalSubtitle === 'We joyfully invite you to celebrate the wedding of' ||
        base.additionalSubtitle === 'WITH JOY IN OUR HEARTS' ||
        base.additionalSubtitle === 'WITH JOY IN OUR HEARTS We joyfully invite you to celebrate the wedding of' ||
        base.additionalSubtitle === 'WITH JOY IN OUR HEARTS  We joyfully invite you to celebrate the wedding of') {
      base.additionalSubtitle = 'WITH JOY IN OUR HEARTS\nWe joyfully invite you to celebrate the wedding of';
    }
    if (!base.additionalTitle ||
        base.additionalTitle === 'A BLESSED BEGINNING' ||
        base.additionalTitle === 'With the blessings of our parents' ||
        base.additionalTitle === 'A BLESSED BEGINNING With the blessings of our parents' ||
        base.additionalTitle === 'A BLESSED BEGINNING  With the blessings of our parents') {
      base.additionalTitle = 'A BLESSED BEGINNING\nWith the blessings of our parents';
    }
    if (!base.message) {
      base.message = 'Request the pleasure of your company as we begin our life together.\nYour presence would make our day complete.';
    }
    return base;
  }

  /*
   * Drafts store the generated background's project-relative asset path.
   * Rehydrate that PNG into a data URL when the editor starts so the existing
   * preview, link and publish/export pipelines continue to work unchanged.
   */
  function hydrateAiBackground() {
    if (!state || !state.aiBackgroundAsset) return Promise.resolve();

    if (String(state.aiBackground || '').indexOf('data:image/') === 0) {
      return Promise.resolve();
    }

    return fetch(state.aiBackgroundAsset, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('AI background asset could not be loaded.');
        return response.blob();
      })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () {
            state.aiBackground = reader.result;
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .catch(function (err) {
        /* The project file may have been removed or the editor may be opened
           without Live Server. Keep the saved path so a later generation can
           replace it, but do not break the editor boot. */
        if (window.console) console.warn('InviteAura: could not hydrate AI background —', err);
      });
  }

  function saveDraftSync() {
    state.updatedAt = new Date().toISOString();

    /*
     * AI backgrounds are real project files. Keep the current data URL in
     * runtime state so export/publish validation can still embed it, but
     * store only the small asset path in localStorage. A 3–5 MB PNG should
     * never consume the browser's draft quota.
     */
    var draft = Object.assign({}, state);
    if (state.aiBackgroundAsset) {
      draft.aiBackground = state.aiBackgroundAsset;
    }

    var ok = IH.store.set(DRAFT_KEY, draft);
    var stamp = qs('[data-draft-stamp]', root);
    if (stamp) {
      stamp.textContent = ok
        ? 'Draft saved in this browser · ' + new Date().toLocaleTimeString()
        : 'Draft too large to save — photos are kept for this session only';
    }
    return ok;
  }

  var saveDraft = dom.debounce(saveDraftSync, 500);

  /* ------------------------------------------------------------------
     3. Live preview
     ------------------------------------------------------------------ */

  function previewData() {
    var data = Object.assign({}, state);
    if (!state.customColors) IH.invitation.applyTemplate(data, state.template);
    else data.colors = state.colors;
    data.aiBackground = state.aiBackground || '';

    // Fall back to friendly demo copy so the card never looks broken.
    if (!data.title && !data.brideName && !data.groomName && !data.personName && !data.babyName) {
      data.title = 'Your Event Title';
    }
    if (nameMode(data.eventType) === 'couple') {
      if (!data.brideName && !data.groomName) { data.brideName = 'Bride'; data.groomName = 'Groom'; }
      if (!data.groomParents) data.groomParents = 'Groom’s Parents';
      if (!data.brideParents) data.brideParents = 'Bride’s Parents';
    }
    if (!data.message) {
      /* messageFor arrived with the per-event sample copy; a browser still
         holding an older preview.js must not be broken by asking for it.
         A naming ceremony passes its relation so the sample reads Son or
         Daughter to match the selection. */
      data.message = IH.invitation.messageFor
        ? IH.invitation.messageFor(data.eventType, data.babyRelation)
        : IH.invitation.SAMPLE.message;
    }
    if (!data.venue) data.venue = 'Venue name';
    if (!data.date) {
      var d = new Date(); d.setMonth(d.getMonth() + 3);
      data.date = d.toISOString().slice(0, 10);
      data.time = data.time || '18:30';
    }
    return data;
  }

  /* Set when the entrance animation changes, so the next render plays it. */
  var replayEntrance = false;

  var renderPreview = dom.debounce(function () {
    saveDraftSync();
    var frame = document.getElementById('preview-viewport-frame');
    if (!frame) return;

    if (state.previewMode === 'card') {
      // Card view: Directly mount to the frame
      var mountZone = document.getElementById('invitation-mountzone');
      if (!mountZone) {
        frame.innerHTML = '<div class="invitation-container" id="invitation-mountzone"></div>';
        mountZone = document.getElementById('invitation-mountzone');
      }
      if (mountZone && IH.invitation && IH.invitation.mount) {
        mountZone.classList.toggle('is-still', !replayEntrance);
        replayEntrance = false;
        /* No music player in the editor preview; card.html (Open card ↗)
           reads the saved draft, so the music still plays there. */
        var cardData = previewData();
        cardData.musicFile = '';
        IH.invitation.mount(mountZone, cardData);
      }
    } else {
      // Host view: Load host.html directly in iframe to use exact same webpage design and rendering logic
      var iframe = document.getElementById('host-preview-iframe');
      if (!iframe) {
        frame.innerHTML = '<iframe id="host-preview-iframe" src="host.html" style="width: 100%; height: 100%; border: none; background: #fff;"></iframe>';
        iframe = document.getElementById('host-preview-iframe');
      } else {
        try {
          if (iframe.contentWindow && typeof iframe.contentWindow.location.reload === 'function') {
            iframe.contentWindow.location.reload();
          } else {
            iframe.src = 'host.html';
          }
        } catch (e) {
          iframe.src = 'host.html';
        }
      }
    }
  }, 140);

  /* The guest-facing link and its QR code, shown on the final step.
     After hosting, the link is the published invitation's own public URL
     (generated once, server-side) — everything shares that one address.
     Before hosting, the whole invitation travels inside the URL's
     fragment, so the link works on static hosting with nothing written
     and nothing stored. */
  function paintShareLink() {
    var url = state.hostedUrl || (IH.link ? IH.link.build(previewData()) : location.href);

    var linkOut = qs('[data-share-link]', root);
    if (linkOut) linkOut.textContent = url;

    var qrHost = qs('[data-create-qr]', root);
    if (qrHost) {
      try { qrHost.innerHTML = IH.qr.toSvg(url); }
      catch (err) {
        // Too much data for a QR symbol — the link itself still works.
        qrHost.innerHTML = '<p class="muted" style="font-size:.78rem;max-width:22rem">' +
          'This invitation carries too much detail for a QR code. ' +
          'Use Copy Link or the share buttons instead.</p>';
      }
    }

    var openLink = qs('[data-invite-open]', root);
    if (openLink) openLink.href = url;
  }

  var INVITE_STEP = 6;   // the finished invitation — free download & share
  var PAY_STEP = 7;      // hosting — the optional ₹99 online publish

  /* ------------------------------------------------------------------
     3c. Step 5 — everything that ended up on the card
     ------------------------------------------------------------------ */

  function summaryRows(data) {
    var tpl = IH.data.getTemplate(data.template);
    var d = IH.invitation.formatDate(data.date);
    var photos = (data.gallery ? data.gallery.length : 0) +
                 (data.photo ? 1 : 0) + (data.background ? 1 : 0);
    var sections = [];
    if (data.showCountdown !== false) sections.push('Countdown');
    if (data.showGallery !== false && data.gallery && data.gallery.length) sections.push('Gallery');
    if (data.showMaps !== false && (data.mapsUrl || data.address)) sections.push('View Location');
    /* The programme slots are renamed per occasion on Additional Details
       (Cake Cutting, Ring Ceremony...), so the summary reads those labels;
       a slot whose card is hidden there (Haldi on an engagement) is left out. */
    var celebrations = [];
    var FALLBACK = { haldiEnabled: 'Haldi', mehndiEnabled: 'Mehndi', ceremonyEnabled: 'Wedding', receptionEnabled: 'Reception' };
    Object.keys(FALLBACK).forEach(function (name) {
      if (!data[name]) return;
      var box = root && qs('[name="' + name + '"]', root);
      var card = box && box.closest('.wedding-event-card');
      if (card && card.style.display === 'none') return;
      var span = box && box.parentNode.querySelector('span');
      celebrations.push((span && span.textContent.trim()) || FALLBACK[name]);
    });
    var hasProgramme = data.eventType === 'wedding' || data.eventType === 'engagement' || hasOccasionDetails(data.eventType) ||
      (data.eventType === 'reception' && !!(IH.weddingDesigns && IH.weddingDesigns.applies(data.template)));
    if (hasProgramme && celebrations.length) sections.push('Programme: ' + celebrations.join(', '));

    return [
      ['Occasion', IH.invitation.EVENT_TYPES[data.eventType] && data.eventType !== 'other' ? IH.invitation.EVENT_TYPES[data.eventType].label : 'Event'],
      ['Title', data.title],
      ['Additional title', data.additionalTitle],
      ['Additional subtitle', data.additionalSubtitle],
      ['Hosted by', data.hostName],
      ['Names', data.eventType === 'naming-ceremony'
        ? (data.babyName || data.personName)
        : ((data.namesSwapped ? [data.brideName, data.groomName] : [data.groomName, data.brideName]).filter(Boolean).join(' & ') || data.personName || data.babyName || data.parentsName)],
      ['Groom’s parents', data.groomParents],
      ['Bride’s parents', data.brideParents],
      ['Company / Institution', data.organization],
      ['Department', data.department],
      ['Course / Class', data.classCourse],
      ['Role', data.role],
      ['Years of service', data.yearsOfService],
      ['Event type', data.eventKind],
      ['Theme', data.theme],
      ['Baby name', data.babyName],
      ['Baby relation', data.babyRelation],
      ['Parents', data.parentsName],
      ['Years', data.years],
      ['Date', d.full ? d.weekday + ', ' + d.full : ''],
      ['Time', IH.invitation.formatTime(data.time)],
      ['Venue', data.venue],
      ['Address', data.address],
      ['Phone', data.phone],
      ['Email', data.email],
      ['Additional info', data.additionalInformation],
      ['Template', tpl ? tpl.name : data.template],
      ['Font', data.font],
      ['Photos', photos ? String(photos) : ''],
      ['Sections', sections.join(' · ')]
    ].filter(function (row) { return row[1]; });
  }

  function paintCardSummary(data, result) {
    var body = qs('[data-card-summary]', root);
    if (body) {
      body.innerHTML = summaryRows(data).map(function (row) {
        return '<tr><th scope="row">' + escapeHtml(row[0]) + '</th>' +
               '<td>' + escapeHtml(row[1]) + '</td></tr>';
      }).join('');
    }

    var files = qs('[data-card-files]', root);
    if (!files) return;

    var url = state.hostedUrl || (IH.link ? IH.link.build(data) : '');
    var embedded = (data.gallery || []).filter(function (src) {
      return typeof src === 'string' && src.slice(0, 5) === 'data:';
    }).length + (String(data.photo || '').slice(0, 5) === 'data:' ? 1 : 0) +
      (String(data.background || '').slice(0, 5) === 'data:' ? 1 : 0);

    var hosted = !!state.hostedUrl;

    var rows = [
      hosted
        ? '<li>' + IH.icon('globe', 18) + '<span>Your invitation is online. Guests open it directly from your link.</span></li>'
        : '<li>' + IH.icon('image', 18) + '<span>The <b>card picture (JPG)</b> is the simplest way to send it on WhatsApp.</span></li>',
      '<li>' + IH.icon('file-text', 18) + '<span>The <b>page (.html)</b> keeps the countdown, map and gallery. Guests open it in any browser.</span></li>'
    ];

    if (embedded) {
      rows.push('<li>' + IH.icon('info', 18) + '<span>Your ' + embedded + ' uploaded photo' + (embedded === 1 ? ' is' : 's are') +
        ' included in the downloaded page and in hosting.</span></li>');
    }

    files.innerHTML = rows.join('');
  }

  /* The invitation lives inside its own link, so nothing is written to
     disk. Download .html is offered for hosts who would rather send the
     file itself than a link. */
  function initExport() {
    var exportBox = qs('[data-export-box]', root);
    if (!exportBox || !IH.exportPage) return;

    on(qs('[data-export-download]', exportBox), 'click', saveInvitationPages);

    on(qs('[data-invite-jpg]', root), 'click', function () {
      var jpg = qs('[data-draft-download-jpg]', root);
      if (jpg) jpg.click();
    });
    on(qs('[data-goto-hosting]', root), 'click', function () {
      showStep(7);
      var top = qs('[data-step-panel="7"]', root);
      if (top && top.scrollIntoView) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* Download .html: the host page and the card page, built from the saved
     draft exactly as host.html and card.html show them, under one name —
     the host page in invitation_card/, the card in invitation_card/invitations/. */
  function saveInvitationPages() {
    saveDraftSync();
    var draft = IH.store.get(DRAFT_KEY, null) || state;
    IH.exportPage.saveFiles(draft).then(function (res) {
      var list = res.paths.join(' and ');
      if (res.mode === 'download') {
        IH.toast.success('Saved to your downloads folder. Move them to ' + list + ' (drop _card from the card file).', { title: 'Downloaded' });
      } else {
        IH.toast.success('Saved ' + list + '.', { title: 'Saved' });
      }
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return; // folder picker closed
      IH.toast.error('Could not save the pages: ' + (err && err.message ? err.message : err));
    });
  }

  /* ------------------------------------------------------------------
     3d. Step 6 — publishing the invitation at its own address

     The fragment link works with nothing deployed, but it is long and
     unreadable. A host who owns the repository can instead commit the
     invitation as a folder and hand out a short URL. js/publish.js does
     the packing; this paints the address and the three steps to it.

     The hosted address is generated once, on the server, when the page
     is committed — the browser never builds it, so what is shown here
     before publishing is a placeholder, not a guess at a URL. */
  function paintPublish(data) {
    var box = qs('[data-publish-box]', root);
    if (!box || !IH.publish) return;

    var paid = !!state.hostingPaid;

    /* Hosting is the paid part. Until a ₹99 payment has gone through, the
       publish controls stay out of the way and a short notice offers the
       payment right here. After payment, publishing works exactly as
       before. */
    var gate = qs('[data-publish-gate]', box);
    var controls = qs('[data-publish-controls]', box);
    if (gate) gate.hidden = paid;
    if (controls) controls.hidden = !paid;

    /* Once this invitation has been committed to GitHub, the manual
       button must not fire a second publish for the same invitation. */
    var nowBtn = qs('[data-publish-now]', box);
    if (nowBtn) nowBtn.disabled = !!state.published;

    var where = IH.publish.slug(data);      // the .zip route: a folder per invitation

    var urlOut = qs('[data-publish-url]', box);
    if (urlOut) {
      urlOut.textContent = state.hostedUrl || 'Publishing generates your unique link…';
    }

    /* Publishing renders on the server from the fields alone, so an
       invitation with uploaded photos has to go the .zip way. Saying so
       here beats letting the button fail with a 400. */
    var note = qs('[data-publish-note]', box);
    if (note) {
      /* Uploads go up in pieces ahead of the publish (js/publish.js), so
         the ceiling is the server's per-invitation total of 5 MB; base64
         adds a third, hence about 6.7 MB of data: URL text. Saying so
         before the click beats a rejection after it. */
      var weight = IH.publish.payloadSize(data);
      note.textContent = !IH.publish.hasUploads(data) ? ''
        : weight > 6.7 * 1024 * 1024
          ? 'Your photos and music come to about ' + Math.round(weight / 1024 / 1024 * 10) / 10 +
            ' MB, which is over the publishing limit. Use Download page folder for this one.'
          : 'Your photos and music will be committed alongside the page.';
    }

    var steps = qs('[data-publish-steps]', box);
    if (steps) {
      steps.innerHTML = [
        '<li>' + IH.icon('globe', 18) + '<span><strong>Publish it now</strong> puts your page online again if the first try did not finish.</span></li>',
        '<li>' + IH.icon('download', 18) + '<span><strong>Download page folder</strong> gives you a copy of the page with its photos and music (' +
          escapeHtml(where.file) + ').</span></li>'
      ].join('');
    }
  }

  var publishInFlight = false;

  /* The one path to the server, used by both the ₹99 hosting flow on the
     Hosting step and the manual "Publish it now" button below — so there is
     exactly one call to IH.publish.toServer and exactly one place that
     paints its result. The server decides the filename and the public
     URL; this module only ever displays what it returns. */
  function runPublish(box) {
    if (publishInFlight) return Promise.resolve(null);
    /* The same invitation is never committed twice, even if a second
       request somehow reaches here while a publish is already done. */
    if (state.published) {
      IH.toast.info('This invitation is already published — it was not published twice.', { title: 'Already live' });
      return Promise.resolve(null);
    }
    publishInFlight = true;

    return IH.publish.toServer(previewData(), state.hostingPayment)
      .then(function (result) {
        console.log('[hosting] publish request succeeded', { filename: result.filename, url: result.publicUrl });
        /* The page is committed; confirm the public address actually
           serves it before anyone is told it is live. The rewrite reads
           from GitHub, and GitHub is strongly consistent, so a couple of
           short retries cover any edge propagation lag. */
        var attempts = 0;
        function probe() {
          attempts += 1;
          return fetch(result.publicUrl, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) throw new Error('unreachable');
            return result;
          }).catch(function () {
            if (attempts < 3) {
              return new Promise(function (resolve) {
                setTimeout(function () { resolve(probe()); }, 700 * attempts);
              });
            }
            throw new Error('unreachable');
          });
        }
        return probe();
      })
      .then(function (result) {
        state.hosted = true;
        state.published = true;
        state.publishedAt = new Date().toISOString();
        state.hostedUrl = result.publicUrl || result.url || state.hostedUrl;
        state.invitationId = result.invitationId || '';
        state.filename = result.filename || '';
        state.hostedAt = result.hostedAt || state.hostedAt || new Date().toISOString();
        state.expiresAt = result.expiresAt || '';
        state.hostingStatus = 'active';
        saveDraft();
        paintStepperDone();

        var publishBox = box || qs('[data-publish-box]', root);
        if (publishBox) {
          var holder = qs('[data-publish-result]', publishBox);
          var out = qs('[data-publish-live]', publishBox);
          var open = qs('[data-publish-open]', publishBox);

          if (out) out.textContent = state.hostedUrl;
          if (open) open.href = state.hostedUrl;
          if (holder) holder.hidden = false;

          /* Disable immediately, without waiting for the next paint,
             so a fast second click can never queue a second commit. */
          var nowBtn = qs('[data-publish-now]', publishBox);
          if (nowBtn) nowBtn.disabled = true;
        }

        IH.toast.success(result.count > 1
          ? 'Published — ' + result.count + ' files committed, page and media together.'
          : 'Published. The address is live now.', { title: result.filename });
        IH.confetti(24);
        return result;
      }).catch(function (err) {
        /* A commit that landed but is not being served is still not a
           live invitation — the user is told so rather than congratulated. */
        if (err && err.message === 'unreachable') {
          IH.toast.error('We couldn\'t publish your invitation yet. Please try again.', { title: 'Not live yet' });
        } else {
          IH.toast.error(err.message, { title: 'Not published' });
        }
        throw err;
      }).then(function (result) {
      publishInFlight = false;
      return result;
    }, function (err) {
      publishInFlight = false;
      throw err;
    });
  }

  function initPublish() {
    var box = qs('[data-publish-box]', root);
    if (!box || !IH.publish) return;

    /* The gate notice's button sits on the hosting step itself now, so
       paying is one click away — same payment flow, no navigation. */
    on(qs('[data-publish-pay]', box), 'click', function () {
      startHosting();
      IH.toast.info('Hosting costs ₹99. Pay once to publish your invitation online.');
    });

    on(qs('[data-publish-now]', box), 'click', function (evt) {
      if (state.published) return; // already published — no second commit
      if (!state.hostingPaid) {
        startHosting();
        IH.toast.info('Hosting costs ₹99. Pay once to publish your invitation online.');
        return;
      }
      var btn = evt.currentTarget;
      var label = qs('span', btn);
      var was = label ? label.textContent : '';

      btn.disabled = true;
      if (label) label.textContent = 'Publishing…';

      runPublish(box).catch(function () {}).then(function () {
        btn.disabled = state.published; // stays disabled once it succeeds
        if (label) label.textContent = was;
      });
    });

    on(qs('[data-publish-download]', box), 'click', function () {
      var res = IH.publish.download(previewData());
      IH.toast.success(res.file + ' saved — ' + res.count + ' file' +
        (res.count === 1 ? '' : 's') + ' to unpack at the root of your repository.',
        { title: 'Downloaded' });
    });

    on(qs('[data-publish-copy]', box), 'click', function () {
      var url = state.hostedUrl || '';
      if (!url) {
        IH.toast.info('Publish the invitation first — its unique link appears here.');
        return;
      }
      IH.share.copy(url).then(function () {
        IH.toast.success('Invitation link copied to your clipboard.', { title: 'Copied' });
      }).catch(function () {
        IH.toast.info('Copy this link: ' + url);
      });
    });
  }

  /* ------------------------------------------------------------------
     4. Step 1 — event type tiles
     ------------------------------------------------------------------ */

  var EVENT_CHOICES = [
    'wedding', 'engagement', 'reception', 'birthday', 'baby-shower', 'naming-ceremony',
    'house-warming', 'anniversary', 'graduation', 'retirement', 'farewell', 'corporate',
    'festival', 'school-events', 'college-events', 'party', 'community-events', 'other'
  ];

  /* One soft accent per occasion — tints the tile wash and the glow behind
     its illustration. The illustrations are transparent cut-outs in
     images/event-tiles/, so they sit on the tile instead of a dark square. */
  var EVENT_ACCENTS = {
    'wedding': '#C2185B', 'engagement': '#B8860B', 'reception': '#8E44AD',
    'birthday': '#E8590C', 'baby-shower': '#E77FA8', 'naming-ceremony': '#D97706',
    'house-warming': '#A0522D', 'anniversary': '#B91C3C', 'graduation': '#1E3A8A',
    'retirement': '#2E7D6B', 'farewell': '#7C3AED', 'corporate': '#475569',
    'festival': '#EA580C', 'school-events': '#2563EB', 'college-events': '#0E7490',
    'party': '#9333EA', 'community-events': '#15803D', 'other': '#B45309'
  };

  function buildEventTiles() {
    var host = qs('[data-event-tiles]', root);
    if (!host) return;

    host.innerHTML = EVENT_CHOICES.map(function (key) {
      var meta = IH.invitation.EVENT_TYPES[key];
      var count = IH.data.templates.filter(function (t) { return t.category === key; }).length;
      var catObj = IH.data && IH.data.getCategory ? IH.data.getCategory(key) : null;
      var displayCount = catObj && catObj.displayCount !== undefined ? catObj.displayCount : count;
      var accent = EVENT_ACCENTS[key] || '#C2185B';

      var iconContent = '<span class="option-tile__icon-wrap">' +
        '<img class="option-tile__illus" src="images/event-tiles/' + key + '.png" alt="" width="72" height="72" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\';">' +
        '<span class="option-tile__fallback-icon" style="display:none">' + IH.icon(meta.icon, 28) + '</span>' +
        '</span>';

      return '<label class="option-tile">' +
        '<input type="radio" name="eventType" value="' + key + '"' + (state.eventType === key ? ' checked' : '') + '>' +
        '<span class="option-tile__box option-tile--event" style="--tile-accent:' + accent + '">' +
          iconContent +
          '<span>' + escapeHtml(meta.label) + '</span>' +
          '<small>' + (displayCount ? displayCount + ' template' + (displayCount === 1 ? '' : 's') : 'Any template') + '</small>' +
        '</span>' +
      '</label>';
    }).join('');

    on(host, 'change', function (evt) {
      if (evt.target.name !== 'eventType') return;
      setEventType(evt.target.value);
    });
  }

  function setEventType(type) {
    state.eventType = type;

    // The category background is only for the event tiles; the card keeps its template's own design.
    state.aiBackground = '';
    state.aiBackgroundAsset = '';

    // Move to a template that actually belongs to this event, unless the
    // visitor already picked one deliberately from this category.
    var cat = TEMPLATE_CATEGORY_FOR_EVENT[type];
    var current = IH.data.getTemplate(state.template);
    if (!current || (cat && current.category !== cat)) {
      var match = IH.data.templates.filter(function (t) { return t.category === cat; })[0];
      var fallback = IH.invitation.EVENT_TYPES[type];
      state.template = match ? match.slug : (fallback ? fallback.defaultTemplate : 'minimal-wedding');
      state.customColors = false;
    }
    applyWeddingText();

    applyFieldRules();
    paintEventTemplates();
    buildTemplatePicker();
    syncInputs();
    renderPreview();
    saveDraft();
  }

  /* Fields that belong to one design only (e.g. the Telugu-script names of
     Telugu Pelli). They sit outside ALL_FIELDS, so the category rules above
     never touch them; the value is kept when they are hidden. */
  function applyTemplateFields() {
    var couple = state.eventType === 'wedding' || state.eventType === 'engagement';
    qsa('[data-template-only]', root).forEach(function (field) {
      var on = couple && field.getAttribute('data-template-only') === state.template;
      field.hidden = !on;
      field.style.display = on ? '' : 'none';
    });
    syncCelebrationDetails();
  }

  /* Weddings, engagements, birthdays and the other occasions ask for the invitation
     message on Additional Details; every other category keeps it on Event details. */
  function placeMessageField() {
    var field = qs('[data-message-field]', root);
    var couple = state.eventType === 'wedding' || state.eventType === 'engagement' || hasOccasionDetails(state.eventType);
    var anchor = qs(couple ? '[data-message-slot]' : '[data-message-home]', root);
    if (field && anchor && field.nextSibling !== anchor) anchor.parentNode.insertBefore(field, anchor);
  }

  /* A title that only names another occasion ("wedding", "The Wedding
     Celebration"...) follows the chosen event; a title the host wrote
     themselves is never touched. */
  function syncEventTitle() {
    var type = state.eventType;
    var current = String(state.title || '').trim().toLowerCase();
    if (!current || !TITLE_PLACEHOLDERS[type]) return;
    var generic = {};
    Object.keys(TITLE_PLACEHOLDERS).forEach(function (k) {
      generic[TITLE_PLACEHOLDERS[k].replace(/^e\.g\.\s*/, '').toLowerCase()] = k;
      var meta = IH.invitation.EVENT_TYPES[k];
      if (meta && meta.label) generic[meta.label.toLowerCase()] = k;
    });
    generic['wedding celebration'] = generic['the wedding celebration'] = 'wedding';
    if (generic[current] && generic[current] !== type) {
      /* Couple events get a full title; others simply take the event's name. */
      var meta = IH.invitation.EVENT_TYPES[type];
      state.title = (type === 'wedding' || type === 'engagement' || type === 'reception' || type === 'other' || !meta)
        ? TITLE_PLACEHOLDERS[type].replace(/^e\.g\.\s*/, '') : meta.label;
      var input = qs('[name="title"]', root);
      if (input) input.value = state.title;
    }
  }

  function applyFieldRules() {
    syncEventTitle();
    applyTemplateFields();
    placeMessageField();
    var type = state.eventType;
    var shown = FIELDS_BY_CATEGORY[type] || FIELDS_BY_CATEGORY.other;
    var need = REQUIRED_BY_CATEGORY[type] || REQUIRED_BY_CATEGORY.other;

    ALL_FIELDS.forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (!input) return;
      var field = input.closest('.field');
      if (!field) return;

      var on = shown.indexOf(name) !== -1;
      var required = on && need.indexOf(name) !== -1;

      /* Both, deliberately. The attribute is the honest signal — it takes
         the field out of the accessibility tree too — but it only carries
         `display: none` from the browser's own stylesheet, which any class
         here outranks. An inline style cannot be outranked, so a stale or
         missing stylesheet can never leave a Groom's name sitting on a
         festival invitation. */
      field.hidden = !on;
      field.style.display = on ? '' : 'none';
      input.disabled = !on;

      /* validate.field reads the attribute, so this is what actually
         decides whether a blank value stops the wizard. */
      if (required) input.setAttribute('required', '');
      else input.removeAttribute('required');

      /* The asterisk has to follow, or the form promises one thing and
         enforces another. */
      var star = qs('[data-req]', field);
      if (star) star.hidden = !required;

      /* The label and its data-label (used for validation messages) follow
         the occasion: a graduation card asks for a Graduate's name, an
         engagement for Partner 1 and Partner 2, a school event for a
         School name. */
      var labelNode = qs('.field__label', field);
      if (labelNode) {
        var label = fieldLabel(name, type);
        labelNode.childNodes[0].nodeValue = label + ' ';
        input.setAttribute('data-label', label);
      }

      var placeholder = FIELD_PLACEHOLDERS[name] && FIELD_PLACEHOLDERS[name][type];
      // Remember the page's own placeholder so another occasion gets it back.
      if (!input.hasAttribute('data-placeholder')) input.setAttribute('data-placeholder', input.placeholder || '');
      input.placeholder = placeholder || input.getAttribute('data-placeholder');

      if (name === 'personName') {
        if (type === 'house-warming') {
          input.setAttribute('data-required-message', 'Please enter the family or host name.');
        } else if (type === 'anniversary') {
          input.setAttribute('data-required-message', 'Please enter the couple\'s name.');
        } else if (type === 'party') {
          input.setAttribute('data-required-message', 'Please enter the guest of honor or celebrant\'s name.');
        } else {
          input.removeAttribute('data-required-message');
        }
      }

      if (name === 'organization') {
        if (type === 'corporate') {
          input.setAttribute('data-required-message', 'Please enter the company or organization name.');
        } else if (type === 'school-events') {
          input.setAttribute('data-required-message', 'Please enter the school name.');
        } else if (type === 'college-events') {
          input.setAttribute('data-required-message', 'Please enter the college or institution name.');
        } else if (type === 'community-events') {
          input.setAttribute('data-required-message', 'Please enter the community or group name.');
        } else {
          input.removeAttribute('data-required-message');
        }
      }

      if (name === 'hostName') {
        var hostHint = type === 'wedding'
          ? 'Usually the family or people hosting the wedding.'
          : type === 'naming-ceremony'
            ? 'Usually the family or people hosting the ceremony.'
            : 'Usually the family or people hosting the event.';
        var hostHintNode = qs('.field__hint', field);
        if (hostHintNode) hostHintNode.textContent = hostHint;
      }

      if (name === 'email' && on) {
        input.setAttribute('data-required-message', 'Please enter your email address so we can send the payment confirmation.');
      }

      if (name === 'years' && on) {
        var yearsHint = type === 'birthday'
          ? 'The age the birthday is celebrating — leave blank if you would rather not share it.'
          : 'The number of years — printed on the card as 25th Anniversary.';
        var yearsHintNode = qs('.field__hint', field);
        if (yearsHintNode) yearsHintNode.textContent = yearsHint;
      }

      /* A naming ceremony must name the baby, so the baby-shower hint about
         keeping the name a surprise would contradict the required marker. */
      if (name === 'babyName' && type === 'naming-ceremony') {
        var babyHintNode = qs('.field__hint', field);
        if (babyHintNode) babyHintNode.textContent = 'The little one’s name, as it should appear on the card.';
      }

      /* A field that is now hidden or optional must not keep an error
         from the last event type the host was looking at. */
      if (!on || !required) IH.validate.clearError(input);
    });

    var titleInput = qs('[name="title"]', root);
    if (titleInput) titleInput.placeholder = TITLE_PLACEHOLDERS[type] || TITLE_PLACEHOLDERS.other;

    /* One wedding sentence used to sit in every event's message box, which
       made it a thing to delete rather than a thing to start from. The
       wording now follows the occasion — the copy comes from the same
       per-event samples the previews use, so there is one list, not two. */
    var messageInput = qs('[name="message"]', root);
    if (messageInput && IH.invitation.messageFor) {
      messageInput.placeholder = IH.invitation.messageFor(type, state.babyRelation);
    }

    /* "Event details" is what you write when you do not know which event.
       The wizard does know by now, so the step says so: Wedding details,
       Birthday details, Corporate event details. */
    var stepTitle = qs('#step2-title', root);
    if (stepTitle) {
      var meta = IH.invitation.EVENT_TYPES[type];
      stepTitle.textContent = STEP_TITLE_OVERRIDES[type] ||
        ((meta && type !== 'other') ? meta.label + ' details' : 'Event details');
    }

    syncCelebrationDetails();
  }

  /* The wedding details box (header wording + ceremonies) also serves the
     engagement cards that run on the wedding design engine, relabelled for
     an engagement. Called on event-type and template changes. */
  var CELEBRATION_LABELS = {
    wedding: { heading: 'Wedding celebrations', haldiEnabled: 'Haldi', mehndiEnabled: 'Mehndi', ceremonyEnabled: 'Wedding', receptionEnabled: 'Reception' },
    engagement: { heading: 'Engagement programme', haldiEnabled: 'Haldi', mehndiEnabled: 'Mehndi', ceremonyEnabled: 'Ring Ceremony', receptionEnabled: 'Engagement Lunch / Dinner' },
    reception: { heading: 'Reception programme', haldiEnabled: 'Haldi', mehndiEnabled: 'Mehndi', ceremonyEnabled: 'Welcome & Cocktails', receptionEnabled: 'Dinner & Dance' },
    birthday: { heading: 'Party programme', haldiEnabled: 'Welcome & Games', mehndiEnabled: 'Cake Cutting', ceremonyEnabled: 'Lunch / Dinner', receptionEnabled: 'Music & Dance' }
  };
  var STEP3_INTRO = {
    wedding: 'Special title and subtitle for your wedding invitation header.',
    occasion: 'Header wording, the invitation message and the programme for your invitation.'
  };
  /* Occasions that follow the birthday pattern (OCCASION_DETAILS in js/preview.js). */
  function occasionCfg(type) {
    var all = IH.invitation && IH.invitation.OCCASION_DETAILS;
    return (all && all[type]) || null;
  }
  function hasOccasionDetails(type) { return type === 'birthday' || !!occasionCfg(type); }
  var WEDDING_SUBTITLE_TEXT = 'We joyfully invite you to celebrate the wedding of';
  var ENGAGEMENT_SUBTITLE_TEXT = 'We joyfully invite you to celebrate the engagement of';
  function syncCelebrationDetails() {
    var type = state.eventType;
    /* Every engagement uses Additional Details (header wording, programme,
       invitation message), relabelled for an engagement. */
    // Reception cards on the design engine get the same box, relabelled.
    var receptionWd = type === 'reception' && !!(IH.weddingDesigns && IH.weddingDesigns.applies(state.template));
    var engaged = type === 'engagement' || receptionWd;
    // Birthdays and the other occasions use the same box: header wording, message and a programme.
    var occasion = hasOccasionDetails(type);
    var cfg = occasionCfg(type);
    var isWedding = type === 'wedding' || engaged || occasion;
    var meta = IH.invitation.EVENT_TYPES[type];
    var stepNote = qs('[data-step-btn="3"] .step__text small', root);
    if (stepNote) stepNote.textContent = occasion ? (meta && type !== 'other' ? meta.label : 'Event') + ' details' : receptionWd ? 'Reception details' : engaged ? 'Engagement details' : 'Wedding details';
    var intro = qs('#step3-title + p', root);
    if (intro) intro.textContent = STEP3_INTRO[occasion ? 'occasion' : 'wedding'];
    // The family blessings header belongs to a couple.
    var blessingsTile = qs('[name="showBlessings"]', root);
    blessingsTile = blessingsTile && blessingsTile.closest('.option-tile');
    if (blessingsTile) blessingsTile.style.display = occasion ? 'none' : '';
    var addWeddingBox = qs('[data-additional-details-wedding]', root);
    if (addWeddingBox) {
      addWeddingBox.hidden = !isWedding;
      addWeddingBox.style.display = isWedding ? '' : 'none';
      var addInputs = qsa('input', addWeddingBox);
      addInputs.forEach(function (inp) {
        inp.disabled = !isWedding;
        if (!isWedding) IH.validate.clearError(inp);
      });
      var labels = cfg
        ? { heading: cfg.programme, haldiEnabled: cfg.items[0][0], mehndiEnabled: cfg.items[1][0], ceremonyEnabled: cfg.items[2][0], receptionEnabled: cfg.items[3][0] }
        : Object.assign({}, CELEBRATION_LABELS[type === 'birthday' ? 'birthday' : receptionWd ? 'reception' : engaged ? 'engagement' : 'wedding']);
      var spec = engaged && IH.weddingDesigns.spec(state.template);
      if (spec && spec.mainEvent) labels.ceremonyEnabled = spec.mainEvent; // Roka / Tilak cards
      var heading = qs('.wedding-events-grid', addWeddingBox);
      heading = heading && heading.previousElementSibling;
      if (heading && heading.tagName === 'H3') heading.textContent = labels.heading;
      Object.keys(labels).forEach(function (name) {
        var box = qs('[name="' + name + '"]', addWeddingBox);
        var span = box && box.parentNode.querySelector('span');
        if (span) span.textContent = labels[name];
        var slot = name.replace('Enabled', '');
        qsa('[name="' + slot + 'Date"], [name="' + slot + 'Time"]', addWeddingBox).forEach(function (inp) {
          inp.setAttribute('aria-label', labels[name] + (inp.type === 'date' ? ' date' : ' time'));
        });
        // An engagement has only the ring ceremony and a meal: no Haldi / Mehndi.
        var card = box && box.closest('.wedding-event-card');
        if (card && (name === 'haldiEnabled' || name === 'mehndiEnabled')) card.style.display = engaged ? 'none' : '';
      });
      // Swap only the untouched default sentence; wording the host typed stays.
      var sub = qs('[name="additionalSubtitle"]', addWeddingBox);
      if (sub && typeof state.additionalSubtitle === 'string') {
        // A reception card keeps the wedding sentence (the card words it for a reception).
        var toEng = engaged && !receptionWd;
        var from = toEng ? WEDDING_SUBTITLE_TEXT : ENGAGEMENT_SUBTITLE_TEXT, to = toEng ? ENGAGEMENT_SUBTITLE_TEXT : WEDDING_SUBTITLE_TEXT;
        if (state.additionalSubtitle.indexOf(from) >= 0 && (type === 'engagement' || type === 'wedding' || receptionWd)) {
          state.additionalSubtitle = state.additionalSubtitle.split(from).join(to);
          sub.value = state.additionalSubtitle;
        }
      }
    }
  }

  /* ------------------------------------------------------------------
     5. Step 4 — template picker, colours, fonts
     ------------------------------------------------------------------ */

  /* The same design is offered in two places — beside the occasion on
     step 1, and in full on the Design step. They are separate radio
     groups on purpose: one shared group would let the browser uncheck
     the tile the visitor is looking at because a tile three steps away
     holds the selection. markSelected keeps the two in agreement. */
  function templateTile(t, group) {
    var selected = t.slug === state.template;
    return '<label class="option-tile">' +
      '<input type="radio" name="' + (group || 'template') + '" value="' + escapeHtml(t.slug) + '"' + (selected ? ' checked' : '') + '>' +
      '<span class="option-tile__box" style="padding:10px;gap:8px">' +
        '<img src="' + escapeHtml(t.image) + '" alt="' + escapeHtml(t.name) + '" width="600" height="800" ' +
             'loading="lazy" style="width:100%;border-radius:10px;aspect-ratio:3/4;object-fit:cover">' +
        '<span>' + escapeHtml(t.name) + '</span>' +
      '</span>' +
    '</label>';
  }

  function grid(list, group) {
    return '<div class="option-grid">' + list.map(function (t) {
      return templateTile(t, group);
    }).join('') + '</div>';
  }

  function byPopularity(a, b) { return b.popularity - a.popularity; }

  function templatesFor(type) {
    var cat = TEMPLATE_CATEGORY_FOR_EVENT[type];
    if (!cat) return [];
    return IH.data.templates
      .filter(function (t) { return t.category === cat; });
  }

  /* Checked state without a rebuild, so clicking a tile does not tear the
     grid out from under the pointer. */
  function markSelected() {
    qsa('[name="template"], [name="templateQuick"]', root).forEach(function (input) {
      input.checked = input.value === state.template;
    });
  }

  /* Every route to choosing a design ends here, so a pick from step 1 and
     a pick from the Design step do exactly the same thing. */
  /* Wedding designs each carry their own header and message wording
     (IH.invitation.weddingTextFor). A field is replaced only while it still
     holds sample wording, so text the host typed is never overwritten. */
  var WEDDING_TEXT_FIELDS = ['additionalTitle', 'additionalSubtitle', 'message'];
  function applyWeddingText() {
    var inv = IH.invitation;
    var type = state.eventType;
    if (!inv.weddingTextFor) return false;
    var isOccasionText = function (name) { return !!(inv.isOccasionSampleText && inv.isOccasionSampleText(name, state[name])); };
    var couple = type === 'wedding' || type === 'engagement';
    var occasion = hasOccasionDetails(type) && !!inv.occasionTextFor;
    /* An engagement goes back to the standard wording, which
       syncCelebrationDetails rewords for an engagement. A birthday or other
       occasion takes its own header wording; a reception drops it again. */
    var text = occasion ? inv.occasionTextFor(type, state.template) : type === 'wedding' ? inv.weddingTextFor(state.template) : defaultState(), changed = false;
    WEDDING_TEXT_FIELDS.forEach(function (name) {
      /* A reception also drops a wedding design's own wording ("A garden of
         joy… the wedding of"): only the standard sentence is reworded for a
         reception card, so any other wedding sample would print as is. */
      var sample = couple || occasion
        ? inv.isWeddingSampleText(name, state[name]) || isOccasionText(name)
        : (isOccasionText(name) || (type === 'reception' && inv.isWeddingSampleText(name, state[name]))) && !!String(state[name] || '').trim();
      if (state[name] !== text[name] && sample) {
        state[name] = text[name];
        changed = true;
        var input = root && qs('[name="' + name + '"]', root);
        if (input) input.value = state[name];
      }
    });
    return changed;
  }

  function selectTemplate(slug, announce) {
    if (state.template !== slug) {
      state.aiBackground = '';
      state.aiBackgroundAsset = '';
    }
    state.template = slug;
    state.customColors = false;
    IH.invitation.applyTemplate(state, slug);
    applyWeddingText();
    applyTemplateFields();
    markSelected();
    syncColorInputs();
    renderPreview();
    saveDraft();

    if (announce) {
      var tpl = IH.data.getTemplate(slug);
      if (tpl) IH.toast.success(tpl.name + ' applied to your invitation.');
    }
  }

  /* Step 1 — the designs made for whatever was just chosen, shown right
     there. The Design step still owns colours, fonts and the full
     catalogue; this is only the shortcut that makes the occasion and its
     artwork feel like one decision. */
  var eventTemplatesBound = false;

  function paintEventTemplates() {
    var host = qs('[data-event-templates]', root);
    if (!host) return;

    /* Always painted, never revealed. This used to hide itself until an
       occasion was chosen, which meant the column could sit empty on a
       first visit and only appear after stepping away and back. There is
       always a sensible set to show — the draft opens on a wedding — so
       there is nothing for an empty state to do here. */
    var type = state.eventType || 'wedding';
    var meta = IH.invitation.EVENT_TYPES[type];
    var label = meta ? meta.label.toLowerCase() : 'this occasion';
    var matching = templatesFor(type);
    var capped = false;

    /* "Other" says nothing about what would suit, so rather than list all
       47 here, show the most popular few and leave the rest to Design. */
    if (!matching.length) {
      matching = IH.data.templates.slice().sort(byPopularity).slice(0, 6);
      capped = true;
      label = 'any occasion';
    }

    /* The heading matches the one beside it so the two columns read as a
       pair rather than a section and a footnote. */
    host.innerHTML =
      '<h2 style="font-size:var(--step-2)">Invitation templates</h2>' +
      '<p class="muted" style="margin:var(--space-3) 0 var(--space-5)">' +
        (capped
          ? 'A few designs to start from — the Design step has all ' + IH.data.templates.length + '.'
          : matching.length + ' design' + (matching.length === 1 ? '' : 's') +
            ' made for ' + escapeHtml(label) + '. Pick one now or change it later in Design.') +
      '</p>' +
      grid(matching, 'templateQuick');

    if (eventTemplatesBound) return;
    eventTemplatesBound = true;

    on(host, 'change', function (evt) {
      if (evt.target.name !== 'templateQuick') return;
      selectTemplate(evt.target.value, true);
    });
  }

  var templatePickerBound = false;

  /* Designs made for the chosen event, and only those, in the open. A
     thin category used to be topped up with popular cards from anywhere,
     which is why picking Graduation offered wedding cards: the padding
     was indistinguishable from the real matches. They are still offered —
     one graduation design is a poor choice — but folded away and named,
     so nothing borrowed is mistaken for something intended. */
  function buildTemplatePicker() {
    var host = qs('[data-template-picker]', root);
    if (!host) return;

    var cat = TEMPLATE_CATEGORY_FOR_EVENT[state.eventType];
    var meta = IH.invitation.EVENT_TYPES[state.eventType];
    var label = meta ? meta.label.toLowerCase() : 'this event';

    /* "Other" says nothing about what would suit, so nothing is ranked
       above anything else and the whole catalogue is offered plainly. */
    if (!cat) {
      host.innerHTML = grid(IH.data.templates.slice().sort(byPopularity));
    } else {
      var matching = templatesFor(state.eventType);
      var others = IH.data.templates
        .filter(function (t) { return t.category !== cat; }).sort(byPopularity);

      var html = '';

      if (matching.length) {
        html += '<p class="tpl-group__note">' + matching.length + ' design' +
                (matching.length === 1 ? '' : 's') + ' made for ' + escapeHtml(label) + '.' +
                (matching.length < 4 ? ' Any design below works too.' : '') + '</p>' +
                grid(matching);
      }

      if (others.length) {
        html += '<details class="tpl-more"' + (matching.length ? '' : ' open') + '>' +
          '<summary>' + (matching.length
            ? 'Use a design from another occasion (' + others.length + ')'
            : 'Choose from all ' + others.length + ' designs') + '</summary>' +
          grid(others) +
        '</details>';
      }

      host.innerHTML = html;
    }

    /* Bound once. The picker is rebuilt on every event-type change, and
       re-binding here stacked a fresh handler each time — one click then
       applied the template and toasted several times over. */
    if (templatePickerBound) return;
    templatePickerBound = true;

    on(host, 'change', function (evt) {
      if (evt.target.name !== 'template') return;
      selectTemplate(evt.target.value, true);
    });
  }

  var COLOR_PRESETS = [
    ['Rose & Gold', '#8B2F58', '#B98A2E', '#FDF0F4', '#F6D9E4', '#4A2033'],
    ['Royal Plum', '#FBEFD8', '#E8C27A', '#4C1D3D', '#7A2E52', '#F7E6C8'],
    ['Midnight Violet', '#FFFFFF', '#C9A6F5', '#1B1033', '#4A2B7A', '#EADDFF'],
    ['Kumkum Red', '#FFF3DC', '#F0BE72', '#7B1E22', '#B03A26', '#FCE8C2'],
    ['Sage & Cream', '#33562A', '#7FA35C', '#F6F9F2', '#DDEBCE', '#26401F'],
    ['Ocean Teal', '#FBEED2', '#DCB06A', '#0F2A38', '#1E5163', '#F3DCB0'],
    ['Blush Minimal', '#96334A', '#C08A3E', '#FDF1F0', '#F8DAD6', '#4A2028'],
    ['Charcoal Silver', '#FFFFFF', '#B8C6D6', '#1F242B', '#4C5A69', '#E3ECF5']
  ];

  function buildDesignControls() {
    var swatchHost = qs('[data-color-presets]', root);
    if (swatchHost) {
      swatchHost.innerHTML = COLOR_PRESETS.map(function (p, i) {
        return '<button class="swatch" type="button" data-preset="' + i + '" aria-pressed="false" ' +
          'title="' + escapeHtml(p[0]) + '" aria-label="Apply the ' + escapeHtml(p[0]) + ' palette" ' +
          'style="background:linear-gradient(135deg,' + p[3] + ' 0 50%,' + p[1] + ' 50% 100%)"></button>';
      }).join('');

      on(swatchHost, 'click', function (evt) {
        var btn = evt.target.closest('[data-preset]');
        if (!btn) return;
        var p = COLOR_PRESETS[parseInt(btn.getAttribute('data-preset'), 10)];
        state.customColors = true;
        state.colors = { primary: p[1], secondary: p[2], bg1: p[3], bg2: p[4], ink: p[5] };
        syncColorInputs();
        renderPreview();
        saveDraft();
      });
    }

    ['primary', 'secondary', 'bg1', 'bg2'].forEach(function (key) {
      var input = qs('[data-color="' + key + '"]', root);
      on(input, 'input', function () {
        if (!state.customColors) {
          state.customColors = true;
          IH.invitation.applyTemplate(state, state.template);
        }
        state.colors = state.colors || {};
        state.colors[key] = input.value;
        // Keep the body ink readable against the new background.
        if (key === 'bg1') state.colors.ink = readableInk(input.value);
        syncColorInputs();
        renderPreview();
        saveDraft();
      });
    });

    var resetColors = qs('[data-reset-colors]', root);
    on(resetColors, 'click', function () {
      state.customColors = false;
      IH.invitation.applyTemplate(state, state.template);
      syncColorInputs();
      renderPreview();
      saveDraft();
      IH.toast.info('Colours reset to the template defaults.');
    });

    // Fonts, music, animation and the feature switches
    ['font', 'music', 'animation'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      on(input, 'change', function () {
        state[name] = input.value;
        // A font chosen here is the host's own pick, which loadDraft keeps as is.
        if (name === 'font') state.fontPicked = true;
        /* The preview stays still while typing; picking an animation
           replays it once so the choice can be seen. */
        if (name === 'animation') replayEntrance = true;
        renderPreview();
        saveDraft();
      });
    });

    ['showCountdown', 'showMaps', 'showGallery', 'showBlessings'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (!input) return;
      on(input, 'change', function () {
        state[name] = input.checked;
        renderPreview();
        saveDraft();
      });
    });
  }

  /* Pick near-black or near-white body text for a given background. */
  function readableInk(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#3A1B2B';
    var n = parseInt(m[1], 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.55 ? '#2B1A24' : '#F6E9EF';
  }

  function syncColorInputs() {
    var tpl = IH.data.getTemplate(state.template);
    var c = state.customColors && state.colors ? state.colors : (tpl ? tpl.colors : null);
    if (!c) return;
    ['primary', 'secondary', 'bg1', 'bg2'].forEach(function (key) {
      var input = qs('[data-color="' + key + '"]', root);
      if (input && c[key]) input.value = c[key];
    });
    qsa('[data-preset]', root).forEach(function (btn) {
      var p = COLOR_PRESETS[parseInt(btn.getAttribute('data-preset'), 10)];
      var active = state.customColors && state.colors && state.colors.primary === p[1] && state.colors.bg1 === p[3];
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------------------
     6. Step 3 — media (client-side only)
     ------------------------------------------------------------------ */

  var MAX_DIMENSION = 1400;

  /* Each upload box has its own size, so with every box filled the whole
     invitation stays under 5 MB (4.8 MB). api/_validate.js holds the same
     numbers. A file over its box's size is refused with a message. */
  var SLOT_LIMITS = {
    photo: 500 * 1024,             // Main photo
    venueImage: 100 * 1024,        // Venue photo
    background: 500 * 1024,        // Background image
    gallery: 200 * 1024,           // each of up to 6 gallery photos
    musicFile: 2.5 * 1024 * 1024   // Background music
  };

  function sizeLabel(bytes) {
    return bytes >= 1024 * 1024
      ? Math.round(bytes / 1024 / 1024 * 10) / 10 + ' MB'
      : Math.round(bytes / 1024) + ' KB';
  }

  /* base64 carries 3 bytes in every 4 characters. */
  function dataUrlBytes(src) {
    if (typeof src !== 'string' || src.slice(0, 5) !== 'data:') return 0;
    return Math.floor((src.length - src.indexOf(',') - 1) * 3 / 4);
  }

  /* Audio is stored as read — there is no lossless way to shrink it in a
     browser, and re-encoding music is not something to do behind
     someone's back. So a track over its box's size is refused. */
  function readAudio(file) {
    return new Promise(function (resolve, reject) {
      if (!/^audio\//.test(file.type)) { reject(new Error(file.name + ' is not an audio file.')); return; }
      if (file.size > SLOT_LIMITS.musicFile) {
        reject(new Error(file.name + ' is ' + sizeLabel(file.size) + ' — background music can be up to ' +
                         sizeLabel(SLOT_LIMITS.musicFile) + '. Choose a shorter or smaller track.'));
        return;
      }

      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read ' + file.name + '.')); };
      reader.onload = function () { resolve({ data: reader.result, name: file.name }); };
      reader.readAsDataURL(file);
    });
  }

  /* Re-encode a loaded image, stepping the size and then the quality down
     until it fits `budget`. A phone photo reaches 500 KB at about 1400 px;
     the 100 KB venue box usually lands near 800 px. */
  var FIT_SIZES = [MAX_DIMENSION, 1200, 1000, 800, 640, 480, 360];
  var FIT_QUALITIES = [0.82, 0.7, 0.6, 0.5];

  function fitImage(img, budget) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    for (var i = 0; i < FIT_SIZES.length; i++) {
      var scale = Math.min(1, FIT_SIZES[i] / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (var q = 0; q < FIT_QUALITIES.length; q++) {
        var out = canvas.toDataURL('image/jpeg', FIT_QUALITIES[q]);
        if (dataUrlBytes(out) <= budget) return out;
      }
    }
    return null;
  }

  /* An image already held as a data: URL (e.g. a generated venue photo),
     brought down to its box's size the same way. */
  function fitDataUrl(src, budget) {
    if (dataUrlBytes(src) <= budget) return Promise.resolve(src);
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onerror = function () { reject(new Error('The image could not be decoded.')); };
      img.onload = function () {
        var out = fitImage(img, budget);
        if (out) resolve(out); else reject(new Error('The image could not be made small enough.'));
      };
      img.src = src;
    });
  }

  /* Downscale before storing so a 6 MB phone photo does not blow the
     localStorage quota or stall the preview, and so it fits its box. */
  function readImage(file, budget) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) { reject(new Error(file.name + ' is not an image.')); return; }
      if (file.size > budget) {
        reject(new Error(file.name + ' is ' + sizeLabel(file.size) + ' — this box accepts images up to ' +
                         sizeLabel(budget) + '. Choose a smaller image.'));
        return;
      }

      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read ' + file.name + '.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error(file.name + ' could not be decoded.')); };
        img.onload = function () {
          var scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
          // Kept as-is only in a format api/_validate.js publishes; a BMP, SVG
          // or similar is re-encoded to JPEG so publishing cannot refuse it.
          var keepable = /^data:image\/(jpeg|png|webp|gif|avif);/.test(reader.result);
          if (scale === 1 && file.size <= budget && keepable) { resolve(reader.result); return; }
          var out = fitImage(img, budget);
          if (!out) {
            reject(new Error(file.name + ' could not be made smaller than ' + sizeLabel(budget) + '. Try another photo.'));
            return;
          }
          resolve(out);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* Shows (or clears, with no message) a size/type error under an upload box. */
  function uploadError(zone, msg) {
    var card = zone && zone.closest('.upload-card');
    if (!card) return;
    var el = qs('.upload-card__err', card);
    if (!el) {
      el = document.createElement('p');
      el.className = 'upload-card__err';
      el.setAttribute('role', 'alert');
      card.appendChild(el);
    }
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  function initMedia() {
    // Single-image zones: profile photo and background
    [['photo', '[data-drop-photo]'], ['background', '[data-drop-background]'], ['venueImage', '[data-drop-venue]']].forEach(function (pair) {
      var key = pair[0];
      var zone = qs(pair[1], root);
      if (!zone) return;
      var input = qs('input[type="file"]', zone);
      var out = qs('[data-preview-slot]', zone.parentNode) || qs('[data-preview-slot="' + key + '"]', root);

      function paint() {
        if (!out) return;
        out.innerHTML = state[key]
          ? '<div class="thumb"><img src="' + escapeHtml(state[key]) + '" alt="Selected ' + key + '">' +
            '<button class="thumb__remove" type="button" data-remove-single="' + key + '" ' +
            'aria-label="Remove this image">' + IH.icon('close', 14) + '</button></div>'
          : '';
      }

      function accept(files) {
        if (!files || !files.length) return;
        readImage(files[0], SLOT_LIMITS[key]).then(function (dataUrl) {
          state[key] = dataUrl;
          uploadError(zone, '');
          paint();
          renderPreview();
          saveDraft();
          IH.toast.success('Image added. It stays in your browser — nothing is uploaded.');
        }).catch(function (err) { uploadError(zone, err.message); IH.toast.error(err.message); });
      }

      on(zone, 'click', function (evt) { if (evt.target !== input) input.click(); });
      on(zone, 'keydown', function (evt) {
        if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); input.click(); }
      });
      on(input, 'change', function () { accept(input.files); input.value = ''; });
      on(zone, 'dragover', function (evt) { evt.preventDefault(); zone.classList.add('is-dragging'); });
      on(zone, 'dragleave', function () { zone.classList.remove('is-dragging'); });
      on(zone, 'drop', function (evt) {
        evt.preventDefault();
        zone.classList.remove('is-dragging');
        accept(evt.dataTransfer.files);
      });

      paint();
    });

    // Venue AI image generation using FLUX.2 Klein 4B via local/remote ComfyUI
    var venueGenBtn = qs('[data-generate-venue-image]', root);
    if (venueGenBtn) {
      on(venueGenBtn, 'click', function () {
        venueGenBtn.disabled = true;
        var originalText = venueGenBtn.innerHTML;
        venueGenBtn.innerHTML = IH.icon('spinner', 16) + '<span>Generating...</span>';

        fetch('/api/generate-venue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueName: state.venue,
            address: state.address
          })
        })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (err) { throw new Error(err.error || 'Server error'); });
          }
          return res.json();
        })
        .then(function (json) {
          // A generated venue photo is held to the same 100 KB box as an upload.
          return json.dataUrl
            ? fitDataUrl(json.dataUrl, SLOT_LIMITS.venueImage).then(function (src) { json.dataUrl = src; return json; })
            : json;
        })
        .then(function (json) {
          if (json.dataUrl) {
            state.venueImage = json.dataUrl;
            renderPreview();
            saveDraft();

            // Find and paint the preview slot
            var zone = qs('[data-drop-venue]', root);
            if (zone) {
              var out = qs('[data-preview-slot]', zone.parentNode);
              if (out) {
                out.innerHTML = '<div class="thumb"><img src="' + escapeHtml(state.venueImage) + '" alt="Generated venue">' +
                  '<button class="thumb__remove" type="button" data-remove-single="venueImage" ' +
                  'aria-label="Remove this image">' + IH.icon('close', 14) + '</button></div>';
              }
            }
            IH.toast.success('AI venue image generated successfully.');
          } else {
            throw new Error('No image URL returned.');
          }
        })
        .catch(function (err) {
          IH.toast.error('AI Venue generation failed: ' + err.message);
        })
        .finally(function () {
          venueGenBtn.disabled = false;
          venueGenBtn.innerHTML = originalText;
        });
      });
    }

    /* Background music. state.music keeps the original filename, which is
       what the card and the export name the track by; state.musicFile
       holds the audio itself. */
    var musicZone = qs('[data-drop-music]', root);
    if (musicZone) {
      var musicInput = qs('input[type="file"]', musicZone);
      var musicOut = qs('[data-music-slot]', root);

      var paintMusic = function () {
        if (!musicOut) return;
        musicOut.innerHTML = state.musicFile
          ? '<div class="picked-file">' + IH.icon('music', 18) +
              '<span>' + escapeHtml(state.music || 'Background music') + '</span>' +
              '<button class="btn btn--ghost btn--sm" type="button" data-remove-music>' +
                IH.icon('close', 14) + '<span>Remove</span></button>' +
            '</div>'
          : '';
      };

      var acceptMusic = function (files) {
        if (!files || !files.length) return;
        readAudio(files[0]).then(function (picked) {
          state.musicFile = picked.data;
          state.music = picked.name;
          uploadError(musicZone, '');
          paintMusic();
          renderPreview();
          saveDraft();
          IH.toast.success('Music added. It stays in your browser until you publish or download.');
        }).catch(function (err) { uploadError(musicZone, err.message); IH.toast.error(err.message); });
      };

      on(musicZone, 'click', function (evt) { if (evt.target !== musicInput) musicInput.click(); });
      on(musicZone, 'keydown', function (evt) {
        if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); musicInput.click(); }
      });
      on(musicInput, 'change', function () { acceptMusic(musicInput.files); musicInput.value = ''; });
      on(musicZone, 'dragover', function (evt) { evt.preventDefault(); musicZone.classList.add('is-dragging'); });
      on(musicZone, 'dragleave', function () { musicZone.classList.remove('is-dragging'); });
      on(musicZone, 'drop', function (evt) {
        evt.preventDefault();
        musicZone.classList.remove('is-dragging');
        acceptMusic(evt.dataTransfer.files);
      });

      on(musicOut, 'click', function (evt) {
        if (!evt.target.closest('[data-remove-music]')) return;
        state.musicFile = '';
        state.music = 'none';
        paintMusic();
        renderPreview();
        saveDraft();
      });

      paintMusic();
    }

    // Gallery (multiple)
    var galleryZone = qs('[data-drop-gallery]', root);
    if (galleryZone) {
      var galleryInput = qs('input[type="file"]', galleryZone);
      var galleryOut = qs('[data-gallery-thumbs]', root);

      function paintGallery() {
        if (!galleryOut) return;
        galleryOut.innerHTML = state.gallery.map(function (src, i) {
          return '<div class="thumb"><img src="' + escapeHtml(src) + '" alt="Gallery photo ' + (i + 1) + '">' +
            '<button class="thumb__remove" type="button" data-remove-gallery="' + i + '" ' +
            'aria-label="Remove gallery photo ' + (i + 1) + '">' + IH.icon('close', 14) + '</button></div>';
        }).join('');
      }

      function acceptMany(files) {
        var list = Array.prototype.slice.call(files || []);
        if (!list.length) return;
        var room = 6 - state.gallery.length;
        if (room <= 0) { IH.toast.warning('The gallery holds six photos. Remove one to add another.'); return; }
        if (list.length > room) {
          IH.toast.info('Only the first ' + room + ' photo' + (room === 1 ? '' : 's') + ' were added — the gallery holds six.');
          list = list.slice(0, room);
        }
        var errors = [];
        Promise.all(list.map(function (f) {
          return readImage(f, SLOT_LIMITS.gallery).catch(function (err) { errors.push(err.message); IH.toast.error(err.message); return null; });
        })).then(function (results) {
          uploadError(galleryZone, errors.join(' '));
          // Re-checked here: a second pick made while these were decoding may have filled the gallery.
          results.filter(Boolean).forEach(function (src) { if (state.gallery.length < 6) state.gallery.push(src); });
          paintGallery();
          renderPreview();
          saveDraft();
        });
      }

      on(galleryZone, 'click', function (evt) { if (evt.target !== galleryInput) galleryInput.click(); });
      on(galleryZone, 'keydown', function (evt) {
        if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); galleryInput.click(); }
      });
      on(galleryInput, 'change', function () { acceptMany(galleryInput.files); galleryInput.value = ''; });
      on(galleryZone, 'dragover', function (evt) { evt.preventDefault(); galleryZone.classList.add('is-dragging'); });
      on(galleryZone, 'dragleave', function () { galleryZone.classList.remove('is-dragging'); });
      on(galleryZone, 'drop', function (evt) {
        evt.preventDefault();
        galleryZone.classList.remove('is-dragging');
        acceptMany(evt.dataTransfer.files);
      });

      paintGallery();
      root._paintGallery = paintGallery;
    }

    // Removal, delegated so it survives re-renders
    on(root, 'click', function (evt) {
      var single = evt.target.closest('[data-remove-single]');
      if (single) {
        var key = single.getAttribute('data-remove-single');
        state[key] = '';
        var slot = single.closest('[data-preview-slot]');
        if (slot) slot.innerHTML = '';
        renderPreview();
        saveDraft();
        return;
      }
      var galleryBtn = evt.target.closest('[data-remove-gallery]');
      if (galleryBtn) {
        state.gallery.splice(parseInt(galleryBtn.getAttribute('data-remove-gallery'), 10), 1);
        if (root._paintGallery) root._paintGallery();
        renderPreview();
        saveDraft();
      }
    });
  }

  /* ------------------------------------------------------------------
     7. Text inputs -> state
     ------------------------------------------------------------------ */

  var TEXT_FIELDS = ['title', 'hostName', 'groomName', 'groomParents', 'brideName', 'brideParents', 'personName', 'babyName', 'parentsName',
    'organization', 'classCourse', 'department', 'role', 'yearsOfService', 'eventKind', 'theme',
    'years', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message',
    'additionalInformation', 'additionalTitle', 'additionalSubtitle',
    'haldiDate', 'haldiTime', 'mehndiDate', 'mehndiTime', 'ceremonyDate', 'ceremonyTime', 'receptionDate', 'receptionTime'];

  function initInputs() {
    TEXT_FIELDS.forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (!input) return;

      // Sync DOM from state, or state from DOM if state is empty
      if (state[name] !== undefined && state[name] !== null) {
        input.value = state[name];
      } else if (input.value) {
        state[name] = input.value;
      }

      on(input, 'input', function () {
        state[name] = input.value;
        renderPreview();
        saveDraft();
      });
    });

    /* Quick-fill sample text suggestion chips */
    on(root, 'click', function (evt) {
      var btn = evt.target.closest('[data-fill-target]');
      if (!btn) return;
      var targetId = btn.getAttribute('data-fill-target');
      var text = btn.getAttribute('data-fill-text');
      var input = document.getElementById(targetId);
      if (input && text) {
        input.value = text;
        var fieldName = input.getAttribute('name');
        if (fieldName) state[fieldName] = text;
        if (window.IH && IH.validate && IH.validate.clearError) IH.validate.clearError(input);
        renderPreview();
        saveDraft();
      }
    });

    /* The relation is a dropdown, so it announces its change with a
       change event rather than an input event like the text fields. */
    var relInput = qs('[name="babyRelation"]', root);
    if (relInput) {
      on(relInput, 'change', function () {
        state.babyRelation = relInput.value;
        /* Keep the empty-message hint in step with the selection so a
           naming ceremony never offers "our daughter" copy for a son. */
        var msgInput = qs('[name="message"]', root);
        if (msgInput && !(msgInput.value || '').trim() && IH.invitation.messageFor) {
          msgInput.placeholder = IH.invitation.messageFor(state.eventType, state.babyRelation);
        }
        renderPreview();
        saveDraft();
      });
    }

    initWeddingEvents();

    var swapBtn = qs('[data-swap-names]', root);
    function updateSwapBtnText() {
      if (!swapBtn) return;
      var label = qs('span', swapBtn);
      if (label) {
        label.textContent = state.namesSwapped ? 'Swap Groom & Bride Names' : 'Swap Bride & Groom Names';
      }
      swapBtn.classList.toggle('btn--active', !!state.namesSwapped);
    }

    if (swapBtn) {
      on(swapBtn, 'click', function () {
        state.namesSwapped = !state.namesSwapped;
        updateSwapBtnText();
        saveDraftSync();
        renderPreview();
      });
      // Set initial state
      updateSwapBtnText();
    }
  }

  function initWeddingEvents() {
    ['haldiEnabled', 'mehndiEnabled', 'ceremonyEnabled', 'receptionEnabled'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (!input) return;
      var card = input.closest('.wedding-event-card');
      var fieldsDiv = card ? qs('.wedding-event-fields', card) : null;

      function updateFieldsVisibility() {
        if (fieldsDiv) {
          fieldsDiv.hidden = !input.checked;
          fieldsDiv.style.display = input.checked ? '' : 'none';
        }
      }

      updateFieldsVisibility();

      on(input, 'change', function () {
        state[name] = input.checked;
        updateFieldsVisibility();
        renderPreview();
        saveDraft();
      });
    });
  }

  function syncInputs() {
    TEXT_FIELDS.forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (input && input.value !== state[name]) input.value = state[name] || '';
    });
    var relInput = qs('[name="babyRelation"]', root);
    if (relInput) relInput.value = state.babyRelation || 'Son';
    ['font', 'animation'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (input) input.value = state[name];
    });
    ['showCountdown', 'showMaps', 'showGallery', 'showBlessings'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (input) {
        input.checked = !!state[name];
      }
    });
    ['haldiEnabled', 'mehndiEnabled', 'ceremonyEnabled', 'receptionEnabled'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (input) {
        input.checked = !!state[name];
        var card = input.closest('.wedding-event-card');
        var fieldsDiv = card ? qs('.wedding-event-fields', card) : null;
        if (fieldsDiv) {
          fieldsDiv.hidden = !input.checked;
          fieldsDiv.style.display = input.checked ? '' : 'none';
        }
      }
    });
    var eventInput = qs('[name="eventType"][value="' + state.eventType + '"]', root);
    if (eventInput) eventInput.checked = true;
    var swapBtn = qs('[data-swap-names]', root);
    if (swapBtn) {
      var label = qs('span', swapBtn);
      if (label) {
        label.textContent = state.namesSwapped ? 'Swap Groom & Bride Names' : 'Swap Bride & Groom Names';
      }
      swapBtn.classList.toggle('btn--active', !!state.namesSwapped);
    }
    markSelected();
    syncColorInputs();
  }

  /* ------------------------------------------------------------------
     8. Wizard navigation
     ------------------------------------------------------------------ */

  var TOTAL_STEPS = 7;
  var furthest = 1;

  function panelFor(n) { return qs('[data-step-panel="' + n + '"]', root); }

  /* After a successful hosting payment the last step reads as done too,
     so a finished wizard shows a complete row of checkmarks. Painted on
     every showStep and again the moment a publish succeeds. */
  function paintStepperDone() {
    var last = qs('[data-step-btn="' + TOTAL_STEPS + '"]', root);
    if (last) last.classList.toggle('is-done', state.published);
  }

  function validateStep(n) {
    if (n === 1) {
      if (!state.eventType) { IH.toast.error('Choose the kind of event you are hosting.'); return false; }
      return true;
    }
    if (n === 2) {
      var panel = panelFor(2);
      if (!IH.validate.scope(panel)) {
        IH.toast.error('A few details still need your attention.', { title: 'Check the form' });
        return false;
      }
      return true;
    }
    if (n === 3) {
      var panel3 = panelFor(3);
      if (panel3 && !IH.validate.scope(panel3)) {
        IH.toast.error('A few details still need your attention.', { title: 'Check the form' });
        return false;
      }
      return true;
    }
    return true;
  }

  function goToStep(n, skipValidation) {
    n = Math.max(1, Math.min(TOTAL_STEPS, n));

    if (!skipValidation && n > state.step) {
      for (var s = state.step; s < n; s++) {
        if (!validateStep(s)) { showStep(s); return false; }
      }
    }

    showStep(n);
    return true;
  }

  function showStep(n) {
    state.step = n;
    furthest = Math.max(furthest, n);

    qsa('[data-step-panel]', root).forEach(function (panel) {
      var isActive = parseInt(panel.getAttribute('data-step-panel'), 10) === n;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });

    qsa('[data-step-btn]', root).forEach(function (btn) {
      var idx = parseInt(btn.getAttribute('data-step-btn'), 10);
      btn.classList.toggle('is-active', idx === n);
      btn.classList.toggle('is-done', idx < n);
      btn.setAttribute('aria-current', idx === n ? 'step' : 'false');
      btn.disabled = idx > furthest;
    });

    var fill = qs('[data-step-progress]', root);
    if (fill) fill.style.width = ((n - 1) / (TOTAL_STEPS - 1) * 100) + '%';

    var prev = qs('[data-step-prev]', root);
    var next = qs('[data-step-next]', root);
    if (prev) prev.hidden = n === 1;
    if (next) {
      var label = qs('span', next);
      if (n === TOTAL_STEPS) { next.hidden = true; }
      else {
        next.hidden = false;
        if (label) label.textContent = 'Continue';
      }
    }

    var srOut = qs('[data-step-live]', root);
    if (srOut) srOut.textContent = 'Step ' + n + ' of ' + TOTAL_STEPS;

    var heading = qs('[data-step-panel="' + n + '"] h2', root);
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }

    var stepper = qs('.stepper', root);
    if (stepper) {
      var box = stepper.getBoundingClientRect();
      if (box.top < 0) stepper.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    /* The live preview is only worth its column once there is something
       to look at. On the event step it would show placeholder names, so
       it gives way to the templates for the occasion just chosen. */
    var layout = qs('.create-layout', root);
    var preview = qs('.create-preview', root);
    if (layout) layout.classList.toggle('is-solo', n === 1);
    if (preview) preview.hidden = (n === 1);

    if (n === 1) paintEventTemplates();
    if (n === 5) buildTemplatePicker();
    if (n === INVITE_STEP) {
      /* Reaching the Invitation step is free — the invitation is complete,
         and it can be downloaded or shared as it is. Online hosting stays a
         separate, paid choice on the next step: only a successful ₹99
         payment calls runPublish, never this step on its own. */
      paintShareLink();
      paintCardSummary(previewData());
      IH.confetti(36);
    }
    if (n === PAY_STEP) {
      paintHostingStatus();
      paintPublish(previewData());
    }

    /* After a successful hosting payment the last step reads as done too,
       so a finished wizard shows a complete row of checkmarks. */
    paintStepperDone();
    saveDraft();
  }

  function initWizard() {
    on(qs('[data-step-next]', root), 'click', function () { goToStep(state.step + 1); });
    on(qs('[data-step-prev]', root), 'click', function () { goToStep(state.step - 1, true); });

    qsa('[data-step-btn]', root).forEach(function (btn) {
      on(btn, 'click', function () {
        var idx = parseInt(btn.getAttribute('data-step-btn'), 10);
        if (idx <= state.step) goToStep(idx, true);
        else goToStep(idx);
      });
    });

    // Enter inside a text field advances rather than submitting.
    on(root, 'keydown', function (evt) {
      if (evt.key !== 'Enter') return;
      var t = evt.target;
      if (t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'A') return;
      if (t.matches('.input, .select')) { evt.preventDefault(); goToStep(state.step + 1); }
    });

    var form = qs('[data-create-form]', root);
    on(form, 'submit', function (evt) { evt.preventDefault(); goToStep(state.step + 1); });
  }

  /* ------------------------------------------------------------------
     9. Device switch on the preview column + reset/finish actions
     ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------
     JPG Download button loading state helpers
     ------------------------------------------------------------------ */
  /* Both JPG buttons (the preview's and step 6's "Download card (JPG)")
     show a spinner and "Downloading…" while the capture runs, stay
     disabled, then return to their own icon and label. */
  function setJpgDownloadLoading(isLoading) {
    qsa('[data-draft-download-jpg], [data-invite-jpg]', root).forEach(function (btn) {
      var label = btn.querySelector('span:not(.jpg-download-spinner)');
      var spinner = btn.querySelector('.jpg-download-spinner');
      if (!spinner) {
        spinner = document.createElement('span');
        spinner.className = 'jpg-download-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        btn.insertBefore(spinner, label || null);
      }
      if (label && !label.hasAttribute('data-label')) label.setAttribute('data-label', label.textContent);

      btn.classList.toggle('is-loading', isLoading);
      btn.disabled = isLoading;
      if (isLoading) {
        btn.setAttribute('aria-busy', 'true');
        if (label) label.textContent = 'Downloading…';
      } else {
        btn.removeAttribute('aria-busy');
        if (label) label.textContent = label.getAttribute('data-label');
      }
    });
  }

  /* ------------------------------------------------------------------
     Download JPG — captures the Mobile invitation as a high-quality JPG.
     Always uses the Mobile Preview dimensions (340px) regardless of which device tab is selected.
     If the mobile invitation is already rendered in the Live Preview, clones it.
     Otherwise, renders the mobile invitation off-screen temporarily.
     ------------------------------------------------------------------ */
  /* Helper to find the invitation element in the preview area,
     checking both directly or inside the host-preview iframe. */
  function getInvitationElement() {
    var previewStage = qs('.preview-stage', root);
    if (!previewStage) return null;
    var el = previewStage.querySelector('.invitation');
    if (el) return el;
    var iframe = qs('#host-preview-iframe', root);
    if (iframe && iframe.contentDocument) {
      return iframe.contentDocument.querySelector('.invitation');
    }
    return null;
  }

  /* Helper to poll briefly for the live invitation element if the preview is currently mounting */
  function waitForLiveInvitation(maxWaitMs) {
    var el = getInvitationElement();
    if (el) return Promise.resolve(el);
    var start = Date.now();
    return new Promise(function (resolve) {
      var interval = setInterval(function () {
        var found = getInvitationElement();
        if (found) {
          clearInterval(interval);
          return resolve(found);
        }
        if (Date.now() - start >= (maxWaitMs || 2500)) {
          clearInterval(interval);
          return resolve(null);
        }
      }, 100);
    });
  }

  /* Helper to convert modern CSS color(srgb ...) values into standard rgba(...) format
     that html2canvas 1.4.1 can parse accurately. */
  function srgbToRgba(str) {
    if (!str || typeof str !== 'string') return str;
    if (str.indexOf('color(srgb') === -1) return str;
    return str.replace(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/g, function (_, r, g, b, a) {
      var red = Math.round(parseFloat(r) * 255);
      var green = Math.round(parseFloat(g) * 255);
      var blue = Math.round(parseFloat(b) * 255);
      var alpha = a !== undefined ? parseFloat(a) : 1;
      return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
    });
  }

  /* Wait for fonts in a document to be fully loaded and ready */
  function waitForFonts(doc) {
    if (!doc || !doc.fonts) return Promise.resolve(true);
    return doc.fonts.ready.then(function () {
      var fontsToCheck = [
        'Playfair Display',
        'DM Sans',
        'Great Vibes',
        'Cormorant Garamond',
        'Cinzel',
        'Noto Serif Telugu'
      ];
      var promises = fontsToCheck.map(function (font) {
        return doc.fonts.load('16px "' + font + '"').catch(function () { return true; });
      });
      return Promise.all(promises);
    }).catch(function () { return true; });
  }

  /* Wait for all images inside an element to be complete and decoded */
  function waitForImages(rootEl) {
    var images = rootEl.querySelectorAll('img');
    var promises = [];
    for (var k = 0; k < images.length; k++) {
      var img = images[k];
      if (!img.complete || img.naturalWidth === 0) {
        promises.push(new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }));
      }
      if (img.decode) {
        promises.push(img.decode().catch(function () {}));
      }
    }
    return Promise.all(promises);
  }

  // Ensure html2canvas is loaded
  function ensureHtml2Canvas() {
    if (typeof html2canvas !== 'undefined') {
      return Promise.resolve();
    }
    return loadHtml2Canvas();
  }

  function downloadInvitationAsJPG() {
    console.log('[create] downloadInvitationAsJPG started');
    var btn = qs('[data-draft-download-jpg]', root);
    if (!btn || btn.disabled || btn.classList.contains('is-loading')) return;

    setJpgDownloadLoading(true);

    waitForLiveInvitation(2500).then(function (liveInvitation) {
      if (!liveInvitation) {
        setJpgDownloadLoading(false);
        IH.toast.error('No invitation preview found to download. Please wait a moment and try again.');
        return;
      }

      var data2 = previewData();
      var fileName = IH.exportPage.buildInvitationFilename(data2).replace(/\.html$/, '.jpg');
      var targetDoc = liveInvitation.ownerDocument || document;
      var targetWin = targetDoc.defaultView || window;

      // Scroll target preview window to top before measuring and capturing
      if (targetWin && targetWin.scrollTo) {
        try { targetWin.scrollTo(0, 0); } catch (e) {}
      }

      return Promise.all([
        waitForFonts(targetDoc),
        waitForImages(liveInvitation),
        typeof htmlToImage !== 'undefined' ? Promise.resolve() : ensureHtml2Canvas()
      ]).then(function () {
        // Measure the live invitation element to match the active preview layout exactly (Mobile, Tablet, Desktop, Responsive)
        var rect = liveInvitation.getBoundingClientRect();
        var width = Math.round(rect.width || liveInvitation.offsetWidth || 390);
        var height = Math.round(rect.height || liveInvitation.offsetHeight || 844);

        console.log('[create] Capturing live invitation WYSIWYG:', width, 'x', height);

        return captureInvitationCanvas(liveInvitation, width, height, targetDoc, targetWin);
      }).then(function (canvas) {
        return new Promise(function (resolve) {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
      }).then(function (blob) {
        if (!blob) throw new Error('Could not create JPG blob');
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        a.rel = 'noopener';
        document.body.appendChild(a);
        setTimeout(function () {
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          IH.toast.success('Invitation downloaded as JPG.');
        }, 0);
      });
    }).catch(function (err) {
      console.error('[create] Invitation JPG capture failed:', err);
      IH.toast.error('Unable to download the invitation image. Please try again.');
    }).finally(function () {
      setJpgDownloadLoading(false);
    });
  }

  /* The browser paints the card itself through an SVG foreignObject
     (html-to-image), so mask-image fades, filters, blend modes and card
     boxes come out exactly as in the preview. html2canvas re-implements
     CSS and drops those, so it is kept only as a fallback. */
  function captureInvitationCanvas(liveInvitation, width, height, targetDoc, targetWin) {
    if (typeof htmlToImage === 'undefined') {
      return ensureHtml2Canvas().then(function () {
        return captureWithHtml2Canvas(liveInvitation, width, height, targetWin);
      });
    }
    return getFontEmbedCss(targetDoc).then(function (fontCss) {
      // No backgroundColor option: html-to-image paints it over the card's own
      // parchment. JPG has no alpha, so the rounded corners are flattened onto white here.
      return htmlToImage.toCanvas(liveInvitation, {
        pixelRatio: 2,
        width: width,
        height: height,
        fontEmbedCSS: fontCss,
        // The card is centred with auto margins; keep them out of the capture
        style: { margin: '0' }
      });
    }).then(function (canvas) {
      var flat = document.createElement('canvas');
      flat.width = canvas.width;
      flat.height = canvas.height;
      var ctx = flat.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, flat.width, flat.height);
      ctx.drawImage(canvas, 0, 0);
      return flat;
    }).catch(function (err) {
      console.warn('[create] Native capture failed, falling back to html2canvas:', err);
      return ensureHtml2Canvas().then(function () {
        return captureWithHtml2Canvas(liveInvitation, width, height, targetWin);
      });
    });
  }

  /* The Google Fonts <link> is cross-origin, so its rules cannot be read
     from document.styleSheets. Fetch the CSS directly and inline the font
     files as data URLs — once per page load. Only the Latin, Telugu and
     Tamil subsets are kept; the cards never use the others. */
  var fontEmbedCssPromise = null;
  function getFontEmbedCss(doc) {
    if (fontEmbedCssPromise) return fontEmbedCssPromise;
    var link = (doc && doc.querySelector('link[href*="fonts.googleapis.com/css"]')) ||
               document.querySelector('link[href*="fonts.googleapis.com/css"]');
    if (!link || typeof fetch === 'undefined') return Promise.resolve('');

    var toDataUrl = function (blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    fontEmbedCssPromise = fetch(link.href).then(function (res) { return res.text(); }).then(function (css) {
      var faces = (css.match(/@font-face\s*\{[^}]*\}/g) || []).filter(function (face) {
        return !/unicode-range/.test(face) || /U\+0000-00FF|U\+0C00|U\+0B8/i.test(face);
      });
      return Promise.all(faces.map(function (face) {
        var m = face.match(/url\((https:[^)]+)\)/);
        if (!m) return face;
        return fetch(m[1]).then(function (res) { return res.blob(); }).then(toDataUrl).then(function (dataUrl) {
          return face.replace(m[1], dataUrl);
        }).catch(function () { return ''; });
      }));
    }).then(function (list) {
      return list.join('\n');
    }).catch(function () {
      fontEmbedCssPromise = null;
      return '';
    });
    return fontEmbedCssPromise;
  }

  function captureWithHtml2Canvas(liveInvitation, width, height, targetWin) {
    return html2canvas(liveInvitation, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: 2,
      width: width,
      height: height,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 15000,
      onclone: function (clonedDoc) {
        // Apply accurate computed colors to resolve CSS color-mix() into standard rgba()
        var liveElements = liveInvitation.querySelectorAll('*');
        var clonedLive = clonedDoc.querySelector('.invitation');
        if (!clonedLive) return;

        var rootComp = targetWin.getComputedStyle(liveInvitation);
        if (rootComp.backgroundColor && rootComp.backgroundColor.indexOf('color(srgb') !== -1) {
          clonedLive.style.backgroundColor = srgbToRgba(rootComp.backgroundColor);
        }

        var clonedElements = clonedLive.querySelectorAll('*');
        for (var i = 0; i < liveElements.length && i < clonedElements.length; i++) {
          var orig = liveElements[i];
          var cloned = clonedElements[i];
          var comp = targetWin.getComputedStyle(orig);

          if (comp.backgroundColor && comp.backgroundColor.indexOf('color(srgb') !== -1) {
            cloned.style.backgroundColor = srgbToRgba(comp.backgroundColor);
          }
          if (comp.borderColor && comp.borderColor.indexOf('color(srgb') !== -1) {
            cloned.style.borderColor = srgbToRgba(comp.borderColor);
          }
          if (comp.color && comp.color.indexOf('color(srgb') !== -1) {
            cloned.style.color = srgbToRgba(comp.color);
          }
        }

        // Explicitly sync card container backgrounds and borders
        var cardSelectors = [
          '.invitation__when-unified',
          '.cd-unit',
          '.invitation__venue-section',
          '.invitation__extra',
          '.invitation__when-col',
          '.invitation__couple-cell',
          '.invitation__save-date-box'
        ];
        cardSelectors.forEach(function (sel) {
          var origEls = liveInvitation.querySelectorAll(sel);
          var clonedEls = clonedDoc.querySelectorAll(sel);
          for (var k = 0; k < origEls.length && k < clonedEls.length; k++) {
            var c = targetWin.getComputedStyle(origEls[k]);
            if (c.backgroundColor) clonedEls[k].style.backgroundColor = srgbToRgba(c.backgroundColor);
            if (c.borderColor) clonedEls[k].style.borderColor = srgbToRgba(c.borderColor);
          }
        });
      }
    });
  }

  // html2canvas is loaded via <script defer> in create.html.
  // This function waits for it to be available (handles case where user clicks before defer script executes).
  function loadHtml2Canvas() {
    return new Promise(function (resolve, reject) {
      if (typeof html2canvas !== 'undefined') {
        resolve();
        return;
      }
      // Wait for the defer script to load
      var checkReady = setInterval(function () {
        if (typeof html2canvas !== 'undefined') {
          clearInterval(checkReady);
          resolve();
        }
      }, 50);
      // Timeout fallback
      setTimeout(function () {
        clearInterval(checkReady);
        if (typeof html2canvas === 'undefined') {
          reject(new Error('html2canvas failed to load'));
        }
      }, 5000);
    });
  }

  function renderHostedPreview() {
    var stage = qs('.preview-stage', root);
    var container = qs('[data-create-preview]', root);
    if (!stage || !container) return;

    // Only render hosted preview when hosted mode is active
    if (stage.getAttribute('data-device') !== 'hosted') return;

    // Generate the invitation data
    var data = previewData();
    if (!data) return;

    // Render the FULL Host Page using exportPage.buildHtml (not the card renderer)
    // The result is a complete HTML document, so we render it into an iframe
    try {
      var html = IH.exportPage.buildHtml(data, { skipMainJs: true, up: '../' });
      container.innerHTML = '';
      var iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.background = 'transparent';
      iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
      container.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
    } catch (err) {
      console.error('[create] Failed to render hosted preview:', err);
      container.innerHTML = '<div class="preview-error" style="padding:2rem;text-align:center;color:var(--ink-muted)">' +
        IH.icon('alert-circle', 48) +
        '<p style="margin-top:1rem">Unable to generate hosted preview.</p>' +
        '<p style="font-size:.85rem;margin-top:.5rem">' + escapeHtml(err.message) + '</p></div>';
    }
  }

  var renderHostedPreviewDebounced = dom.debounce(renderHostedPreview, 200);

  function initPreviewColumn() {
    var stage = qs('.preview-stage', root);
    if (IH) IH.exportJpg = downloadInvitationAsJPG;
    qsa('[data-device-btn]', root).forEach(function (btn) {
      on(btn, 'click', function () {
        var w = btn.getAttribute('data-device-btn');
        var frame = document.getElementById('preview-viewport-frame');
        if (frame) {
          frame.style.width = w === '100%' ? '100%' : w + 'px';
          frame.style.height = w === '390' ? '844px' : (w === '768' ? '1024px' : (w === '1366' ? '768px' : (w === '1920' ? '1080px' : '100%')));
        }
        qsa('[data-device-btn]', root).forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
      });
    });

    qsa('[data-view-btn]', root).forEach(function (btn) {
      on(btn, 'click', function () {
        state.previewMode = btn.getAttribute('data-view-btn');
        qsa('[data-view-btn]', root).forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
        renderPreview();
        saveDraft();
      });
    });

    on(qs('[data-draft-reset]', root), 'click', function () {
      if (!window.confirm('Clear this draft and start a new invitation? This cannot be undone.')) return;
      IH.store.remove(DRAFT_KEY);
      state = defaultState();
      furthest = 1;
      applyFieldRules();
      paintEventTemplates();
      buildTemplatePicker();
      syncInputs();
      if (root._paintGallery) root._paintGallery();
      qsa('[data-preview-slot]', root).forEach(function (slot) { slot.innerHTML = ''; });
      showStep(1);
      renderPreview();
      IH.toast.info('Draft cleared. Starting fresh.');
    });

    on(qs('[data-draft-download-jpg]', root), 'click', function () {
      downloadInvitationAsJPG();
    });

    on(qs('[data-draft-download-html]', root), 'click', function () {
      if (!IH.exportPage) return;
      var res = IH.exportPage.download(previewData());
      if (res && res.file) {
        IH.toast.success(res.file + ' saved to your downloads folder.', { title: 'Downloaded' });
      }
    });
  } // close initPreviewColumn

  /* ------------------------------------------------------------------
     10. Hosting — the single ₹99 plan
     ------------------------------------------------------------------ */

  var HOSTING_PRODUCT = 'online-invitation-hosting';
  var HOSTING_AMOUNT = 100;   // paise — decided on the server, never trusted from here

  /* Paint the hosting status on the hosting step. Before payment the
     invitation is "Not hosted yet"; after a successful ₹99 payment and
     publish it becomes "Your invitation is online". */
  function paintHostedEmailStatus(emailStatus) {
    var box = qs('[data-hosted-email-status]', root);
    if (!box) return;
    if (!emailStatus) {
      box.hidden = true;
      return;
    }
    var titleEl = qs('[data-hosted-email-title]', box);
    var msgEl = qs('[data-hosted-email-msg]', box);
    var retryBtn = qs('[data-hosted-email-retry]', box);

    if (emailStatus.accepted || emailStatus.sent) {
      box.hidden = false;
      box.className = 'notice notice--success';
      if (titleEl) titleEl.textContent = '✅ Email Accepted by Mail Server';
      if (msgEl) msgEl.textContent = 'Email accepted by the mail server for ' + (state.email || 'your email') + '. Please check your Inbox and Spam/Junk folder.';
      if (retryBtn) retryBtn.hidden = false;
    } else if (emailStatus.skipped) {
      box.hidden = true;
    } else {
      var reason = emailStatus.reason || emailStatus.error || 'The email could not be delivered by the server';
      box.hidden = false;
      box.className = 'notice notice--warn';
      if (titleEl) titleEl.textContent = '❌ Email Sending Failed';
      if (msgEl) msgEl.textContent = 'Reason: ' + reason + '. The invitation is live online — you can retry sending the email.';
      if (retryBtn) retryBtn.hidden = false;
    }
  }

  /* ISO -> '15 January 2027' in India time; '' when missing or invalid. */
  function liveUntilLabel(iso) {
    var at = Date.parse(iso || '');
    if (!at) return '';
    try {
      return new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
    } catch (e) {
      return new Date(at).toDateString();
    }
  }

  function paintHostingStatus() {
    var status = qs('[data-host-status]', root);
    var note = qs('[data-host-status-note]', root);
    var hosted = !!state.hostingPaid && !!state.hosted;

    if (status) {
      status.textContent = hosted ? 'Your invitation is online' : 'Not hosted yet';
    }
    if (note) {
      note.textContent = hosted
        ? 'Your invitation has been successfully published.'
        : 'Your invitation is saved in this browser and ready to download. Hosting is optional and costs ₹99.';
    }

    /* The success panel on the hosting step: live link, copy, open, share,
       QR, WhatsApp and a downloadable copy of the page. Once published it
       replaces the ₹99 offer and payment summary — the payment area gives
       way to the result. */
    var result = qs('[data-hosted-result]', root);
    if (result) {
      var urlOut = qs('[data-hosted-url]', result);
      var open = qs('[data-hosted-open]', result);
      var url = state.hostedUrl || '';
      if (urlOut) urlOut.textContent = url;
      if (open) open.href = url;
      result.hidden = !(hosted && url);

      /* api/publish returns when the hosted pages are deleted (31 days
         after the event); older drafts have no date and show nothing. */
      var until = qs('[data-hosted-until]', result);
      var untilLabel = liveUntilLabel(state.expiresAt);
      if (until) {
        until.textContent = untilLabel
          ? 'Live until ' + untilLabel + ' (31 days after your event). Download a copy if you want to keep it after that.'
          : '';
        until.hidden = !untilLabel;
      }
    }

    var offer = qs('[data-host-offer]', root);
    var summary = qs('[data-payment-summary]', root);
    if (offer) offer.hidden = hosted;
    if (summary) summary.hidden = hosted;

    if (hosted && state.emailStatus) {
      paintHostedEmailStatus(state.emailStatus);
    }
  }

  function setPaymentStatus(title, msg, type) {
    var box = qs('[data-payment-status]', root);
    if (!box) return;
    if (!title) { box.hidden = true; return; }
    box.hidden = false;
    var kind = 'info';
    if (type === 'warn' || type === 'warning' || type === true) {
      kind = 'warn';
    } else if (type === 'error') {
      kind = 'error';
    } else if (type === 'success') {
      kind = 'success';
    } else if (type === 'info') {
      kind = 'info';
    } else if (typeof title === 'string') {
      if (title.indexOf('❌') !== -1) kind = 'error';
      else if (title.indexOf('✅') !== -1 || title.indexOf('🎉') !== -1) kind = 'success';
      else kind = 'info';
    }
    box.className = 'notice notice--' + kind;
    var t = qs('[data-payment-status-title]', box);
    var m = qs('[data-payment-status-msg]', box);
    if (t) t.textContent = title;
    if (m) m.textContent = msg || '';
  }

  function setHostBtnBusy(busy, label) {
    var btn = qs('[data-host-now]', root);
    if (!btn) return;
    btn.disabled = busy;
    var span = qs('span', btn);
    if (span && label) span.textContent = label;
  }

  /* Load the Razorpay Checkout script lazily, the first time a host asks
     to pay. The key id is public — only the secret stays on the server. */
  function loadRazorpay() {
    return new Promise(function (resolve, reject) {
      if (window.Razorpay) { resolve(window.Razorpay); return; }
      var s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = function () { resolve(window.Razorpay); };
      s.onerror = function () { reject(new Error('The payment gateway could not be loaded. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
  }

  /* POST /api/order — the server decides the price. The client only says
     which product it wants; the amount (₹99 = 9900 paise) is fixed on the
     server so a price can never be edited from this page. */
  function createOrder() {
    return fetch('api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: HOSTING_PRODUCT })
    }).then(function (res) {
      return res.json().catch(function () {
        throw new Error('The server sent back something unreadable.');
      }).then(function (body) {
        if (!res.ok) throw new Error(body.error || 'Could not start the payment.');
        return body;
      });
    });
  }

  /* POST /api/verify — the server re-signs the order and payment ids with
     its secret and compares, so only a genuine Razorpay payment passes. */
  function verifyPayment(details) {
    return fetch('api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    }).then(function (res) {
      return res.json().catch(function () {
        throw new Error('Payment could not be verified.');
      }).then(function (body) {
        if (!res.ok || !body.ok) throw new Error(body.error || 'Payment could not be verified.');
        return body;
      });
    });
  }

  var hostingInFlight = false;

  /* The hosting flow, in one place:
     pay → verify → publish → hosted URL → success panel.
     The button is disabled for the whole run so a double click cannot
     create two orders or open two checkouts. */
  function startHosting() {
    if (hostingInFlight) return;
    /* Duplicate protection: an invitation that is already published must
       never be published again, even though payment already went through. */
    if (state.published) {
      setPaymentStatus('Already published', 'This invitation already has a live link. Open it from the Hosting step.', 'warn');
      IH.toast.info('This invitation is already published — it was not published twice.', { title: 'Already live' });
      return;
    }
    hostingInFlight = true;

    /* 1. 💳 Starting payment... */
    setPaymentStatus('💳 Starting payment...', 'Opening payment gateway...');
    setHostBtnBusy(true, '💳 Starting payment...');
    IH.toast.info('Opening payment gateway...', { title: '💳 Starting payment...' });

    /* Paid but not yet hosted (a publish that failed after payment, or a
       reload before the link was saved): skip straight to publishing so a
       paying host is never asked to pay twice. */
    var paid = state.hostingPaid;

    (paid ? Promise.resolve({}) : createOrder().then(function (order) {
      return loadRazorpay().then(function (Razorpay) {
        return new Promise(function (resolve, reject) {
          var rzp = new Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: 'InviteAura',
            description: 'Online Invitation Hosting — ₹99',
            order_id: order.orderId,
            prefill: {
              name: state.title || state.hostName || '',
              email: state.email || '',
              contact: state.phone || ''
            },
            handler: function (payment) {
              resolve(payment);
            },
            modal: {
              ondismiss: function () { reject(new Error('cancelled')); }
            }
          });
          rzp.on('payment.failed', function (resp) {
            var desc = (resp && resp.error && resp.error.description) || 'Payment failed';
            reject(new Error(desc));
          });
          rzp.open();
        });
      });
    }).then(function (payment) {
      /* 2. 💳 Payment successful */
      setPaymentStatus('💳 Payment successful', 'Payment received. Preparing verification...');
      setHostBtnBusy(true, '💳 Payment successful');
      IH.toast.success('Payment received successfully.', { title: '💳 Payment successful' });

      /* 3. 🔐 Verifying payment... */
      setPaymentStatus('🔐 Verifying payment...', 'Verifying payment signature with server...');
      setHostBtnBusy(true, '🔐 Verifying payment...');

      return verifyPayment({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature
      }).then(function () {
        /* Safe identifiers only — the signature never leaves the server
           /api/verify check. */
        console.log('[hosting] payment verified', {
          orderId: payment.razorpay_order_id,
          paymentId: payment.razorpay_payment_id
        });
        state.hostingPaid = true;
        /* Keep the receipt in the draft so a publish that fails (or a
           reload before the link was saved) can re-publish without a
           second payment — the server re-checks the signature itself. */
        state.hostingPayment = {
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature
        };
        state.hostingPaymentId = payment.razorpay_payment_id;
        saveDraft();

        /* 4. ✅ Payment verified successfully */
        setPaymentStatus('✅ Payment verified successfully', 'Payment confirmed.');
        setHostBtnBusy(true, '✅ Payment verified successfully');
        IH.toast.success('Payment verified successfully.', { title: '✅ Payment verified successfully' });
        return {};
      }).catch(function (verifyErr) {
        setPaymentStatus('❌ Payment verification failed', verifyErr.message || 'Signature verification failed.', 'error');
        IH.toast.error(verifyErr.message || 'Payment verification failed.', { title: '❌ Payment verification failed' });
        throw verifyErr;
      });
    }))
      .then(function () {
        console.log('[hosting] verification done, starting publish');
        /* 5. 📄 Creating invitation */
        setPaymentStatus('📄 Creating invitation', 'Building invitation page and assets...');
        setHostBtnBusy(true, '📄 Creating invitation');
        IH.toast.info('Building invitation page...', { title: '📄 Creating invitation' });

        /* 6. 🌐 Publishing invitation */
        setPaymentStatus('🌐 Publishing invitation', 'Publishing invitation online and verifying public address...');
        setHostBtnBusy(true, '🌐 Publishing invitation');
        IH.toast.info('Publishing invitation online...', { title: '🌐 Publishing invitation' });

        return runPublish(qs('[data-publish-box]', root));
      })
      .then(function (result) {
        if (!result) return;
        state.hosted = true;
        state.hostedUrl = result.publicUrl || result.url || '';
        state.invitationId = result.invitationId || '';
        state.filename = result.filename || '';
        state.hostedAt = result.hostedAt || new Date().toISOString();
        state.expiresAt = result.expiresAt || '';
        state.hostingStatus = 'active';
        state.published = true;
        state.emailStatus = result.email || null;
        saveDraft();

        /* 7. 🔗 Invitation link generated */
        setPaymentStatus('🔗 Invitation link generated', state.hostedUrl);

        /* 8. 📧 Preparing email & 📤 Sending email */
        if (state.email) {
          setPaymentStatus('📧 Preparing email', 'Preparing invitation confirmation email...');
          setPaymentStatus('📤 Sending email', 'Sending email via mail server to ' + state.email + '...');
        }

        /* 9. ✅ Email accepted by mail server / ❌ Email sending failed */
        if (result.email && (result.email.accepted || result.email.sent)) {
          setPaymentStatus('✅ Email accepted by mail server', 'Email accepted by the mail server. Please check Inbox and Spam/Junk.');
          IH.toast.success('Email accepted by the mail server. Please check Inbox and Spam/Junk.', { title: '✅ Email accepted by mail server' });
        } else if (result.email && (result.email.sent === false || result.email.rejected) && !result.email.skipped) {
          var reason = result.email.reason || result.email.error || 'Mail server error';
          setPaymentStatus('❌ Email sending failed', 'Reason: ' + reason, 'warn');
          IH.toast.warning('Email sending failed. Reason: ' + reason, { title: '❌ Email sending failed' });
        }

        /* 10. 🎉 Your invitation is ready! */
        setTimeout(function () {
          var untilLabel = liveUntilLabel(state.expiresAt);
          setPaymentStatus('🎉 Your invitation is ready!', 'Your invitation is live at ' + state.hostedUrl +
            (untilLabel ? ' until ' + untilLabel + '.' : ''));
        }, 1800);

        paintHostingStatus();
        paintShareLink();
        paintStepperDone();
        IH.confetti(36);
        IH.toast.success('Your invitation is live and ready to share!', { title: '🎉 Your invitation is ready!' });
      })
      .catch(function (err) {
        var cancelled = err && err.message === 'cancelled';

        if (state.hostingPaid) {
          /* Payment went through, but publishing did not finish — the
             invitation is still saved and the payment is not wasted. */
          setPaymentStatus(
            '❌ Invitation publishing failed',
            (err.message || 'Publishing could not complete.') + ' Your payment is safe. Click Host My Invitation to retry.',
            'error'
          );
          IH.toast.error(err.message || 'Publishing could not complete.', { title: '❌ Invitation publishing failed' });
        } else if (cancelled) {
          setPaymentStatus('Payment cancelled', 'You can host your invitation anytime.', 'info');
          IH.toast.info('Your invitation is still saved — nothing was charged.', { title: 'Payment cancelled' });
        } else {
          setPaymentStatus('❌ Payment failed', err.message || 'The payment could not be completed.', 'error');
          IH.toast.error(err.message || 'The payment could not be completed.', { title: '❌ Payment failed' });
        }
      })
      .then(function () {
        hostingInFlight = false;
        setHostBtnBusy(false, 'Host My Invitation — ₹99');
      });
  }

  function initHosting() {
    on(qs('[data-host-now]', root), 'click', startHosting);

    /* Retry sending email confirmation without re-publishing or re-paying */
    on(qs('[data-hosted-email-retry]', root), 'click', function () {
      if (!state.hostedUrl || !state.email) {
        IH.toast.error('Invitation URL or customer email is missing.');
        return;
      }
      var btn = qs('[data-hosted-email-retry]', root);
      if (btn) btn.disabled = true;

      setPaymentStatus('📧 Preparing email', 'Preparing confirmation email to ' + state.email + '...');
      setTimeout(function () {
        setPaymentStatus('📤 Sending email', 'Sending email via mail server to ' + state.email + '...');
      }, 300);
      IH.toast.info('Sending confirmation email to ' + state.email + '...', { title: '📤 Sending email' });

      var customerName = IH.exportPage.personName(state) || state.hostName || state.title || 'there';
      var invitationName = IH.exportPage.personName(state) || state.title || 'Your Invitation';

      fetch('api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          invitationUrl: state.hostedUrl,
          invitationName: invitationName,
          customerName: customerName
        })
      })
      .then(function (res) {
        return res.json().catch(function () {
          throw new Error('The server sent an unreadable response.');
        }).then(function (body) {
          if (!res.ok || !body.success || !body.accepted) {
            throw new Error(body.error || 'Failed to send confirmation email.');
          }
          return body;
        });
      })
      .then(function (body) {
        state.emailStatus = {
          sent: true,
          accepted: true,
          rejected: false,
          skipped: false,
          attemptId: body.attemptId,
          messageId: body.messageId
        };
        saveDraft();
        setPaymentStatus('✅ Email accepted by mail server', 'Email accepted by the mail server. Please check Inbox and Spam/Junk.');
        IH.toast.success('Email accepted by the mail server. Please check Inbox and Spam/Junk.', { title: '✅ Email accepted by mail server' });
        paintHostedEmailStatus(state.emailStatus);
      })
      .catch(function (err) {
        state.emailStatus = {
          sent: false,
          accepted: false,
          rejected: false,
          skipped: false,
          reason: err.message,
          error: err.message
        };
        saveDraft();
        setPaymentStatus('❌ Email sending failed', 'Reason: ' + (err.message || 'Unknown error'), 'warn');
        IH.toast.warning('Email sending failed. Reason: ' + (err.message || ''), { title: '❌ Email sending failed' });
        paintHostedEmailStatus(state.emailStatus);
      })
      .then(function () {
        if (btn) btn.disabled = false;
      });
    });

    /* After a successful hosting payment: copy, open, share, WhatsApp,
       QR and download straight from the success panel. Every button uses
       the exact publicUrl the server returned. */
    on(qs('[data-hosted-copy]', root), 'click', function () {
      var url = state.hostedUrl || '';
      IH.share.copy(url).then(function () {
        IH.toast.success('Invitation link copied to your clipboard.', { title: 'Copied' });
      }).catch(function () {
        IH.toast.info('Copy this link: ' + url);
      });
    });

    on(qs('[data-hosted-open]', root), 'click', function (evt) {
      evt.preventDefault();
      var url = state.hostedUrl || '';
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });

    on(qs('[data-hosted-share]', root), 'click', function () {
      var url = state.hostedUrl || '';
      IH.share.native(url, 'You\'re invited!\n\nView the invitation here:\n\n' + url, 'My Invitation').catch(function () {
        IH.share.copy(url).then(function () {
          IH.toast.success('Link copied — paste it anywhere.', { title: 'Copied' });
        });
      });
    });

    on(qs('[data-hosted-whatsapp]', root), 'click', function () {
      var url = state.hostedUrl || '';
      IH.share.open('whatsapp', url, 'You\'re invited!\n\nView the invitation here:');
    });

    on(qs('[data-hosted-qr]', root), 'click', function () {
      IH.qrModal.open(state.hostedUrl || '');
    });

    on(qs('[data-hosted-download]', root), 'click', saveInvitationPages);

    paintHostingStatus();
  }

  /* ------------------------------------------------------------------
     11. Boot
     ------------------------------------------------------------------ */

  function boot() {
    root = qs('[data-create-page]');
    if (!root) return;

    state = loadDraft();

    // ?template=slug pre-selects a design and its matching event type.
    var params = new URLSearchParams(location.search);
    var wanted = params.get('template');
    if (wanted) {
      var tpl = IH.data.getTemplate(wanted);
      if (tpl) {
        state.template = tpl.slug;
        state.customColors = false;
        if (IH.invitation.EVENT_TYPES[tpl.category]) state.eventType = tpl.category;
      } else {
        IH.toast.warning('That template link is not valid, so we opened the default design.');
      }
    }
    if (params.get('event') && IH.invitation.EVENT_TYPES[params.get('event')]) {
      state.eventType = params.get('event');
    }
    /* Apply the link once, then drop it from the address bar: otherwise a
       reload re-applies it and overrides what was chosen since (an
       engagement design opened from the gallery kept turning a wedding
       back into an engagement). */
    if ((wanted || params.get('event')) && window.history && history.replaceState) {
      params.delete('template');
      params.delete('event');
      var rest = params.toString();
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    }
    state.plan = '99';
    applyWeddingText();

    var hadDraft = !!IH.store.get(DRAFT_KEY, null);
    furthest = hadDraft ? Math.max(1, state.step || 1) : 1;

    /* The page is laid out for step 1 before any of this runs — one
       column, no preview — so that it never paints the preview and then
       snatches it away. The cost of that is that showStep is what puts the
       page right, and anything throwing on the way there would leave the
       editor stuck in its opening pose with no preview at all.

       So the parts that build the page are allowed to fail loudly in the
       console without taking the wizard down with them. A stale cached
       script is the usual culprit, which is why the notice says so. */
    try {
      buildEventTiles();
      buildDesignControls();
      paintEventTemplates();
      buildTemplatePicker();
      initInputs();
      initMedia();
      initWizard();
      initPreviewColumn();
      initHosting();
      initExport();
      initPublish();

      applyFieldRules();
      syncInputs();
    } catch (err) {
      if (window.console) console.error('InviteAura: the editor did not fully start —', err);
      if (IH.toast) {
        IH.toast.error('Part of the editor did not load. A hard refresh (Ctrl+F5) usually fixes it.',
          { title: 'Something went wrong' });
      }
    }

    showStep(wanted ? 2 : (state.step || 1));

    // Set view buttons active state
    var btn = qs('[data-view-btn="' + state.previewMode + '"]', root);
    if (btn) {
        qsa('[data-view-btn]', root).forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
    }

    hydrateAiBackground().then(function () {
      renderPreview();
    });

    if (hadDraft && !wanted) {
      IH.toast.info('We restored the draft saved in this browser.', { title: 'Welcome back' });
    }

    if (!IH.store.available) {
      IH.toast.warning('Private browsing is on, so your draft will be lost when you close this tab.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
