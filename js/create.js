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
    wedding: 'couple', engagement: 'couple',
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
  var ALL_FIELDS = ['title', 'hostName', 'groomName', 'brideName', 'personName',
    'babyName', 'babyRelation', 'parentsName', 'organization', 'date', 'time', 'venue',
    'address', 'mapsUrl', 'years', 'classCourse', 'department', 'role',
    'yearsOfService', 'eventKind', 'theme', 'phone', 'email', 'message',
    'additionalInformation'];

  /* Which event type shows which fields. 'other' is the fallback. */
  var FIELDS_BY_CATEGORY = {
    wedding: ['title', 'hostName', 'groomName', 'brideName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    engagement: ['title', 'hostName', 'groomName', 'brideName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    reception: ['title', 'hostName', 'personName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    festival: ['title', 'hostName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'message', 'additionalInformation'],
    birthday: ['title', 'hostName', 'personName', 'years', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'baby-shower': ['title', 'hostName', 'personName', 'babyName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'naming-ceremony': ['title', 'hostName', 'babyName', 'babyRelation', 'parentsName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'house-warming': ['title', 'hostName', 'personName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    anniversary: ['title', 'hostName', 'personName', 'years', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    graduation: ['title', 'hostName', 'personName', 'organization', 'classCourse', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    retirement: ['title', 'hostName', 'personName', 'role', 'yearsOfService', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    farewell: ['title', 'hostName', 'personName', 'role', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    corporate: ['title', 'hostName', 'organization', 'department', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'school-events': ['title', 'hostName', 'organization', 'classCourse', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'college-events': ['title', 'hostName', 'organization', 'department', 'classCourse', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    party: ['title', 'hostName', 'personName', 'theme', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    'community-events': ['title', 'hostName', 'organization', 'eventKind', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'],
    other: ['title', 'hostName', 'personName', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message']
  };

  /* Fields that must be filled in before the wizard lets the host move on. */
  var REQUIRED_BY_CATEGORY = {
    wedding: ['title', 'groomName', 'brideName', 'date', 'email'],
    engagement: ['title', 'groomName', 'brideName', 'date', 'email'],
    reception: ['title', 'personName', 'date', 'email'],
    festival: ['title', 'date', 'email'],
    birthday: ['title', 'personName', 'date', 'email'],
    'baby-shower': ['title', 'personName', 'date', 'email'],
    'naming-ceremony': ['title', 'babyName', 'babyRelation', 'parentsName', 'date', 'email'],
    'house-warming': ['title', 'personName', 'date', 'email'],
    anniversary: ['title', 'personName', 'date', 'email'],
    graduation: ['title', 'personName', 'date', 'email'],
    retirement: ['title', 'personName', 'date', 'email'],
    farewell: ['title', 'personName', 'date', 'email'],
    corporate: ['title', 'organization', 'date', 'email'],
    'school-events': ['title', 'organization', 'date', 'email'],
    'college-events': ['title', 'organization', 'date', 'email'],
    party: ['title', 'personName', 'date', 'email'],
    'community-events': ['title', 'organization', 'date', 'email'],
    other: ['title', 'date', 'email']
  };

  var BASE_LABELS = {
    title: 'Event title',
    hostName: 'Hosted by',
    groomName: 'Groom’s name',
    brideName: 'Bride’s name',
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
      reception: 'Couple’s name / Guest of honor',
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
      title: '',
      hostName: '',
      brideName: '',
      groomName: '',
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
      message: '',
      additionalInformation: '',
      photo: '',
      background: '',
      gallery: [],
      music: 'none',
      musicFile: '',
      font: 'playfair',
      colors: null,
      customColors: false,
      animation: 'fade',
      showCountdown: true,
      showMaps: true,
      showGallery: true,
      plan: '99',
      hosted: false,
      hostedUrl: '',
      hostingPaid: false,
      hostingPayment: null,
      hostingPaymentId: '',
      invitationId: '',
      filename: '',
      hostedAt: null,
      hostingStatus: '',
      step: 1,
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
    return base;
  }

  var saveDraft = dom.debounce(function () {
    state.updatedAt = new Date().toISOString();
    var ok = IH.store.set(DRAFT_KEY, state);
    var stamp = qs('[data-draft-stamp]', root);
    if (stamp) {
      stamp.textContent = ok
        ? 'Draft saved in this browser · ' + new Date().toLocaleTimeString()
        : 'Draft too large to save — photos are kept for this session only';
    }
  }, 500);

  /* ------------------------------------------------------------------
     3. Live preview
     ------------------------------------------------------------------ */

  function previewData() {
    var data = Object.assign({}, state);
    if (!state.customColors) IH.invitation.applyTemplate(data, state.template);
    else data.colors = state.colors;

    // Fall back to friendly demo copy so the card never looks broken.
    if (!data.title && !data.brideName && !data.groomName && !data.personName && !data.babyName) {
      data.title = 'Your Event Title';
    }
    if (nameMode(data.eventType) === 'couple') {
      if (!data.brideName && !data.groomName) { data.brideName = 'Bride'; data.groomName = 'Groom'; }
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

  var renderPreview = dom.debounce(function () {
    var data = previewData();

    var stage = qs('[data-create-preview]', root);
    var previewStage = qs('.preview-stage', root);
    var device = previewStage ? previewStage.getAttribute('data-device') : 'mobile';

    if (device === 'hosted') {
      // In hosted mode, update the iframe preview
      renderHostedPreviewDebounced();
    } else if (stage) {
      // Mobile/Desktop mode - use regular card preview
      IH.invitation.mount(stage, data);
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

  var INVITE_STEP = 5;   // the finished invitation — free download & share
  var PAY_STEP = 6;      // hosting — the optional ₹99 online publish

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

    return [
      ['Occasion', IH.invitation.EVENT_TYPES[data.eventType] ? IH.invitation.EVENT_TYPES[data.eventType].label : 'Event'],
      ['Title', data.title],
      ['Hosted by', data.hostName],
      ['Names', data.eventType === 'naming-ceremony'
        ? (data.babyName || data.personName)
        : ([data.groomName, data.brideName].filter(Boolean).join(' & ') || data.personName || data.babyName || data.parentsName)],
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
        ? '<li>' + IH.icon('globe', 18) + '<span>Your invitation is hosted online at its own public ' +
          'address — guests open it directly, and WhatsApp shows a preview of it.</span></li>'
        : '<li>' + IH.icon('link', 18) + '<span>Your invitation travels inside its own link — ' +
          'nothing is stored on a server, so it works the moment your site is live.</span></li>',
      '<li>' + IH.icon('zap', 18) + '<span>Link length: ' + url.length +
        ' characters' + (url.length > 2000 ? ' — long, but WhatsApp and email carry it fine' : '') +
        '</span></li>'
    ];

    if (embedded) {
      rows.push('<li>' + IH.icon('image', 18) + '<span><strong>' + embedded + ' uploaded photo' +
        (embedded === 1 ? '' : 's') + ' cannot travel in the link.</strong> ' +
        'Use <em>Download .html</em> below to get a file with the photos inside, or commit them to ' +
        'your repository and pick them from there.</span></li>');
    }

    files.innerHTML = rows.join('');
  }

  /* The invitation lives inside its own link, so nothing is written to
     disk. Download .html is offered for hosts who would rather send the
     file itself than a link. */
  function initExport() {
    var exportBox = qs('[data-export-box]', root);
    if (!exportBox || !IH.exportPage) return;

    on(qs('[data-export-download]', exportBox), 'click', function () {
      var res = IH.exportPage.download(previewData());
      IH.toast.success(res.file + ' saved to your downloads folder.', { title: 'Downloaded' });
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
      /* Uploads now publish too, but the request has a ceiling: Vercel
         refuses a body over 4.5 MB, and base64 adds a third. Saying so
         before the click beats a rejection after it. */
      var weight = IH.publish.payloadSize(data);
      note.textContent = !IH.publish.hasUploads(data) ? ''
        : weight > 4 * 1024 * 1024
          ? 'Your photos and music come to about ' + Math.round(weight / 1024 / 1024 * 10) / 10 +
            ' MB, which is over the publishing limit. Use Download page folder for this one.'
          : 'Your photos and music will be committed alongside the page.';
    }

    var steps = qs('[data-publish-steps]', box);
    if (steps) {
      steps.innerHTML = [
        '<li>' + IH.icon('globe', 18) + '<span><strong>Publish it now</strong> renders the page on the ' +
          'server, commits it to <code>' + escapeHtml(where.dir) + '/</code> and returns your unique ' +
          'public link (<code>&lt;name&gt;-&lt;id&gt;.html</code>). Needs the Vercel deployment — ' +
          'GitHub Pages cannot run it.</span></li>',
        '<li>' + IH.icon('download', 18) + '<span><strong>Download page folder</strong> gives you ' +
          '<code>' + escapeHtml(where.file) + '</code> plus your photos and music, named to match ' +
          'it, to unpack at the root of your repository and push yourself. This is the one that ' +
          'keeps your uploads.</span></li>',
        '<li>' + IH.icon('zap', 18) + '<span>Either way it becomes a real page, so WhatsApp and ' +
          'Facebook can show a preview of it — which the link above can never do.</span></li>'
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

  function buildEventTiles() {
    var host = qs('[data-event-tiles]', root);
    if (!host) return;

    host.innerHTML = EVENT_CHOICES.map(function (key) {
      var meta = IH.invitation.EVENT_TYPES[key];
      var count = IH.data.templates.filter(function (t) { return t.category === key; }).length;
      return '<label class="option-tile">' +
        '<input type="radio" name="eventType" value="' + key + '"' + (state.eventType === key ? ' checked' : '') + '>' +
        '<span class="option-tile__box">' +
          IH.icon(meta.icon, 28) +
          '<span>' + escapeHtml(meta.label) + '</span>' +
          '<small>' + (count ? count + ' template' + (count === 1 ? '' : 's') : 'Any template') + '</small>' +
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

    applyFieldRules();
    paintEventTemplates();
    buildTemplatePicker();
    syncInputs();
    renderPreview();
    saveDraft();
  }

  function applyFieldRules() {
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
      if (placeholder) input.placeholder = placeholder;

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
      .filter(function (t) { return t.category === cat; })
      .sort(byPopularity);
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
  function selectTemplate(slug, announce) {
    state.template = slug;
    state.customColors = false;
    IH.invitation.applyTemplate(state, slug);
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
        if (name === 'animation') {
          var stage = qs('[data-create-preview]', root);
          if (stage) { stage.classList.remove('animate-fade-in', 'animate-pop'); void stage.offsetWidth;
            stage.classList.add(input.value === 'pop' ? 'animate-pop' : 'animate-fade-in'); }
        }
        renderPreview();
        saveDraft();
      });
    });

    ['showCountdown', 'showMaps', 'showGallery'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
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
  var MAX_FILE_BYTES = 8 * 1024 * 1024;

  /* Audio is stored as read — there is no lossless way to shrink it in a
     browser, and re-encoding music is not something to do behind
     someone's back. The 8 MB ceiling is what keeps it sane. */
  function readAudio(file) {
    return new Promise(function (resolve, reject) {
      if (!/^audio\//.test(file.type)) { reject(new Error(file.name + ' is not an audio file.')); return; }
      if (file.size > MAX_FILE_BYTES) { reject(new Error(file.name + ' is larger than 8 MB.')); return; }

      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read ' + file.name + '.')); };
      reader.onload = function () { resolve({ data: reader.result, name: file.name }); };
      reader.readAsDataURL(file);
    });
  }

  /* Downscale before storing so a 6 MB phone photo does not blow the
     localStorage quota or stall the preview. */
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) { reject(new Error(file.name + ' is not an image.')); return; }
      if (file.size > MAX_FILE_BYTES) { reject(new Error(file.name + ' is larger than 8 MB.')); return; }

      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read ' + file.name + '.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error(file.name + ' could not be decoded.')); };
        img.onload = function () {
          var scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
          if (scale === 1 && file.size < 400 * 1024) { resolve(reader.result); return; }
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function initMedia() {
    // Single-image zones: profile photo and background
    [['photo', '[data-drop-photo]'], ['background', '[data-drop-background]']].forEach(function (pair) {
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
        readImage(files[0]).then(function (dataUrl) {
          state[key] = dataUrl;
          paint();
          renderPreview();
          saveDraft();
          IH.toast.success('Image added. It stays in your browser — nothing is uploaded.');
        }).catch(function (err) { IH.toast.error(err.message); });
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
          paintMusic();
          renderPreview();
          saveDraft();
          IH.toast.success('Music added. It stays in your browser until you publish or download.');
        }).catch(function (err) { IH.toast.error(err.message); });
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
        Promise.all(list.map(function (f) {
          return readImage(f).catch(function (err) { IH.toast.error(err.message); return null; });
        })).then(function (results) {
          results.filter(Boolean).forEach(function (src) { state.gallery.push(src); });
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

  var TEXT_FIELDS = ['title', 'hostName', 'groomName', 'brideName', 'personName', 'babyName', 'parentsName',
    'organization', 'classCourse', 'department', 'role', 'yearsOfService', 'eventKind', 'theme',
    'years', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone', 'email', 'message',
    'additionalInformation'];

  function initInputs() {
    TEXT_FIELDS.forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (!input) return;
      on(input, 'input', function () {
        state[name] = input.value;
        renderPreview();
        saveDraft();
      });
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
    ['showCountdown', 'showMaps', 'showGallery'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (input) input.checked = !!state[name];
    });
    var eventInput = qs('[name="eventType"][value="' + state.eventType + '"]', root);
    if (eventInput) eventInput.checked = true;
    markSelected();
    syncColorInputs();
  }

  /* ------------------------------------------------------------------
     8. Wizard navigation
     ------------------------------------------------------------------ */

  var TOTAL_STEPS = 6;
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
    if (n === 4) buildTemplatePicker();
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
  function setJpgDownloadLoading(isLoading) {
    var btn = qs('[data-draft-download-jpg]', root);
    if (!btn) return;

    if (isLoading) {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      btn.setAttribute('aria-disabled', 'true');
      btn.disabled = true;
      // Change button text to "Downloading JPG..."
      var btnText = btn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Downloading JPG...';
    } else {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('aria-disabled');
      btn.disabled = false;
      // Restore original button text
      var btnText = btn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Download JPG';
    }
  }

  /* ------------------------------------------------------------------
     Download JPG — captures the Mobile invitation as a high-quality JPG.
     Always uses the Mobile Preview dimensions (340px) regardless of which device tab is selected.
     If the mobile invitation is already rendered in the Live Preview, clones it.
     Otherwise, renders the mobile invitation off-screen temporarily.
     ------------------------------------------------------------------ */
  function downloadInvitationAsJPG() {
    var btn = qs('[data-draft-download-jpg]', root);
    // Prevent multiple clicks
    if (!btn || btn.disabled || btn.classList.contains('is-loading')) return;

    setJpgDownloadLoading(true);

    var data = previewData();
    var previewStage = qs('.preview-stage[data-device="mobile"]', root);
    var source = null;
    var tempContainer = null;
    var tempStage = null;
    var tempMountPoint = null;
    var captureRoot = null;

    try {
      // Check if mobile invitation is already rendered in the Live Preview
      if (previewStage) {
        source = previewStage.querySelector('.invitation');
      }

      // If not rendered (e.g., user is on Desktop/Hosted tab), render it off-screen temporarily
      if (!source) {
        tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-100000px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '340px';
        tempContainer.style.zIndex = '-1';
        tempContainer.style.pointerEvents = 'none';
        tempContainer.style.opacity = '0';

        tempStage = document.createElement('div');
        tempStage.className = 'preview-stage';
        tempStage.setAttribute('data-device', 'mobile');
        tempStage.style.width = '340px';
        tempStage.style.minHeight = 'auto';
        tempStage.style.padding = '0';
        tempStage.style.border = 'none';
        tempStage.style.background = 'transparent';
        tempStage.style.overflow = 'visible';
        tempStage.style.boxShadow = 'none';

        tempMountPoint = document.createElement('div');
        tempMountPoint.setAttribute('data-create-preview', '');
        tempMountPoint.style.width = '100%';

        tempStage.appendChild(tempMountPoint);
        tempContainer.appendChild(tempStage);
        document.body.appendChild(tempContainer);

        // Render the mobile invitation
        IH.invitation.mount(tempMountPoint, data);
        source = tempMountPoint.querySelector('.invitation');

        if (!source) {
          throw new Error('Failed to render invitation for download.');
        }
      }

      // Get source dimensions for the capture
      var rect = source.getBoundingClientRect();
      var width = Math.ceil(source.scrollWidth || rect.width);
      var height = Math.ceil(source.scrollHeight || rect.height);

      // Create an invisible off-screen capture container
      captureRoot = document.createElement('div');
      captureRoot.style.position = 'fixed';
      captureRoot.style.left = '-100000px';
      captureRoot.style.top = '0';
      captureRoot.style.width = width + 'px';
      captureRoot.style.height = height + 'px';
      captureRoot.style.background = 'transparent';
      captureRoot.style.pointerEvents = 'none';
      captureRoot.style.zIndex = '-1';
      captureRoot.style.overflow = 'visible';

      // Clone the invitation
      var clone = source.cloneNode(true);
      captureRoot.appendChild(clone);
      document.body.appendChild(captureRoot);

      // Clean up temporary rendering container if we created one
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.remove();
        tempContainer = null;
      }

      // Helper to copy all computed styles from source to clone recursively
      function copyComputedStyles(sourceNode, cloneNode) {
        var computed = window.getComputedStyle(sourceNode);
        for (var i = 0; i < computed.length; i++) {
          var property = computed[i];
          var value = computed.getPropertyValue(property);
          var priority = computed.getPropertyPriority(property);
          if (value) {
            cloneNode.style.setProperty(property, value, priority);
          }
        }
        // Recursively copy styles for all children
        var sourceChildren = sourceNode.children;
        var cloneChildren = cloneNode.children;
        for (var j = 0; j < sourceChildren.length; j++) {
          if (cloneChildren[j]) {
            copyComputedStyles(sourceChildren[j], cloneChildren[j]);
          }
        }
      }

      // Apply computed styles to the clone so html2canvas captures resolved values
      copyComputedStyles(source, clone);

      // Wait for fonts
      function waitForFonts() {
        return document.fonts ? document.fonts.ready : Promise.resolve();
      }

      // Wait for all images in the clone to load
      function waitForImages(root) {
        var images = root.querySelectorAll('img');
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

      // Do the capture
      function doCapture() {
        return html2canvas(clone, {
          backgroundColor: null,
          useCORS: true,
          allowTaint: false,
          logging: false,
          scale: 2,
          width: width,
          height: height,
          windowWidth: width,
          windowHeight: height,
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 15000
        });
      }

      // Generate filename
      var data2 = previewData();
      var fileName = IH.exportPage.buildInvitationFilename(data2).replace(/\.html$/, '.jpg');

      // Execute capture pipeline
      var promise = Promise.all([waitForFonts(), waitForImages(clone), ensureHtml2Canvas()])
        .then(function () {
          // Wait for browser paint
          return new Promise(function (resolve) { requestAnimationFrame(resolve); })
            .then(function () { return new Promise(function (resolve) { requestAnimationFrame(resolve); }); })
            .then(function () { return new Promise(function (resolve) { setTimeout(resolve, 100); }); });
        })
        .then(doCapture)
        .then(function (canvas) {
          var blobPromise = new Promise(function (resolve) {
            canvas.toBlob(resolve, 'image/jpeg', 0.95);
          });
          return blobPromise.then(function (blob) {
            if (!blob) throw new Error('Could not create JPG');
            return blob;
          });
        })
        .then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.style.display = 'none';
          a.rel = 'noopener';
          document.body.appendChild(a);
          // Use setTimeout to ensure the anchor is in the DOM before clicking
          setTimeout(function () {
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            IH.toast.success('Invitation downloaded as JPG.');
          }, 0);
        })
        .catch(function (err) {
          console.error('[create] Invitation JPG capture failed:', err);
          IH.toast.error('Unable to download the invitation image. Please try again.');
        })
        .finally(function () {
          // Always clean up - this runs AFTER the entire Promise chain completes
          if (captureRoot && captureRoot.parentNode) {
            captureRoot.remove();
          }
          if (tempContainer && tempContainer.parentNode) {
            tempContainer.remove();
          }
          // Always restore button state
          setJpgDownloadLoading(false);
        });

      return promise;
    } catch (err) {
      // Synchronous errors (e.g., failed to render invitation)
      console.error('[create] Invitation JPG capture failed:', err);
      IH.toast.error('Unable to download the invitation image. Please try again.');
      // Clean up on synchronous error
      if (captureRoot && captureRoot.parentNode) {
        captureRoot.remove();
      }
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.remove();
      }
      setJpgDownloadLoading(false);
    }
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
    qsa('[data-preview-device]', root).forEach(function (btn) {
      on(btn, 'click', function () {
        var mode = btn.getAttribute('data-preview-device');
        if (stage) stage.setAttribute('data-device', mode);
        qsa('[data-preview-device]', root).forEach(function (other) {
          other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
        });

        // Handle hosted preview mode
        if (mode === 'hosted') {
          // Render full Host Page via exportPage.buildHtml into iframe
          var container = qs('[data-create-preview]', root);
          if (container) {
            // Clear any existing content
            container.innerHTML = '';
          }
          renderHostedPreviewDebounced();
        } else {
          // Mobile/Desktop mode - use regular card preview
          var container = qs('[data-create-preview]', root);
          if (container) {
            container.innerHTML = '';
            // Re-render the card preview
            renderPreview();
          }
        }
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

    if (emailStatus.sent) {
      box.hidden = false;
      box.className = 'notice notice--success';
      if (titleEl) titleEl.textContent = '✅ Confirmation Email Sent';
      if (msgEl) msgEl.textContent = 'An invitation confirmation email was sent to ' + (state.email || 'your email') + '.';
      if (retryBtn) retryBtn.hidden = false;
    } else if (emailStatus.skipped) {
      box.hidden = true;
    } else {
      box.hidden = false;
      box.className = 'notice notice--warn';
      if (titleEl) titleEl.textContent = '❌ Email Delivery Issue';
      if (msgEl) msgEl.textContent = 'The invitation is online, but the email could not be sent' + (emailStatus.reason ? ' (' + emailStatus.reason + ')' : '') + '. You can retry sending it.';
      if (retryBtn) retryBtn.hidden = false;
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
      /* 2. ✅ Payment successful */
      setPaymentStatus('✅ Payment successful', 'Payment received. Preparing verification...');
      setHostBtnBusy(true, '✅ Payment successful');
      IH.toast.success('Payment received successfully.', { title: '✅ Payment successful' });

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
        setPaymentStatus('✅ Payment verified successfully', 'Payment confirmed. Starting publishing...');
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
        /* 5. 📄 Creating your invitation... */
        setPaymentStatus('📄 Creating your invitation...', 'Building invitation page and publishing to server...');
        setHostBtnBusy(true, '📄 Creating your invitation...');
        IH.toast.info('Publishing your invitation online...', { title: '📄 Creating your invitation...' });
        return runPublish(qs('[data-publish-box]', root));
      })
      .then(function (result) {
        if (!result) return;
        state.hosted = true;
        state.hostedUrl = result.publicUrl || result.url || '';
        state.invitationId = result.invitationId || '';
        state.filename = result.filename || '';
        state.hostedAt = result.hostedAt || new Date().toISOString();
        state.hostingStatus = 'active';
        state.published = true;
        state.emailStatus = result.email || null;
        saveDraft();

        /* 6. ✅ Invitation created successfully */
        setPaymentStatus('✅ Invitation created successfully', 'Invitation published and verified.');
        IH.toast.success('Invitation created successfully.', { title: '✅ Invitation created successfully' });

        /* 7. 🔗 Invitation link generated */
        setPaymentStatus('🔗 Invitation link generated', state.hostedUrl);
        IH.toast.info(state.hostedUrl, { title: '🔗 Invitation link generated' });

        /* 8. 📧 Sending invitation email... */
        if (state.email) {
          setPaymentStatus('📧 Sending invitation email...', 'Delivering confirmation email to ' + state.email + '...');
        }

        /* 9. ✅ Invitation email sent successfully / ❌ Invitation email could not be sent */
        if (result.email && result.email.sent) {
          setPaymentStatus('✅ Invitation email sent successfully', 'Sent to ' + (state.email || 'your email'));
          IH.toast.success('Confirmation email sent to ' + (state.email || 'your email') + '.', { title: '✅ Invitation email sent successfully' });
        } else if (result.email && result.email.sent === false && !result.email.skipped) {
          setPaymentStatus('❌ Invitation email could not be sent', result.email.reason || 'Email delivery failed (invitation remains live online).', 'warn');
          IH.toast.warn('Confirmation email could not be delivered: ' + (result.email.reason || '') + '. Your invitation is still live online.', { title: '❌ Invitation email could not be sent' });
        }

        /* 10. 🎉 Your invitation is ready! */
        setTimeout(function () {
          setPaymentStatus('🎉 Your invitation is ready!', 'Your invitation is live at ' + state.hostedUrl);
        }, 1200);

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
      setPaymentStatus('📧 Sending invitation email...', 'Retrying confirmation email to ' + state.email + '...');
      IH.toast.info('Sending confirmation email to ' + state.email + '...', { title: '📧 Sending invitation email...' });

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
          if (!res.ok || !body.success) {
            throw new Error(body.error || 'Failed to send confirmation email.');
          }
          return body;
        });
      })
      .then(function () {
        state.emailStatus = { sent: true, skipped: false };
        saveDraft();
        setPaymentStatus('✅ Invitation email sent successfully', 'Sent to ' + state.email);
        IH.toast.success('Confirmation email sent to ' + state.email + '!', { title: '✅ Invitation email sent successfully' });
        paintHostedEmailStatus(state.emailStatus);
      })
      .catch(function (err) {
        state.emailStatus = { sent: false, skipped: false, reason: err.message };
        saveDraft();
        setPaymentStatus('❌ Invitation email could not be sent', err.message || 'Failed to send email.', 'warn');
        IH.toast.warn('Could not send confirmation email: ' + (err.message || ''), { title: '❌ Invitation email could not be sent' });
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

    on(qs('[data-hosted-download]', root), 'click', function () {
      var res = IH.exportPage.download(previewData());
      IH.toast.success(res.file + ' saved to your downloads folder.', { title: 'Downloaded' });
    });

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
    state.plan = '99';

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
    renderPreview();

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
