/* ==========================================================================
   InviteHub — create.js
   The five-step invitation builder on create.html.

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
     its title is the whole identity. Everything downstream reads from
     here, so adding an event type means adding one line. */
  var NAME_MODE = {
    wedding: 'couple', engagement: 'couple', reception: 'couple', anniversary: 'couple',
    birthday: 'person', 'naming-ceremony': 'person', graduation: 'person',
    retirement: 'person', farewell: 'person'
  };

  function nameMode(type) { return NAME_MODE[type] || 'title'; }

  /* show  — is the field on screen at all for this event
     need  — is it required

     Only what the card cannot do without is required: whoever it is
     about, and when it happens. A venue can be "to be confirmed", an
     invitation can go out before the hall is booked, and the card renders
     perfectly well without one — so it is asked for, not demanded. */
  var FIELD_RULES = {
    groomName:  function (mode) { return { show: mode === 'couple', need: mode === 'couple' }; },
    brideName:  function (mode) { return { show: mode === 'couple', need: mode === 'couple' }; },
    personName: function (mode) { return { show: mode === 'person', need: mode === 'person' }; },
    years:      function (mode, type) { return { show: type === 'anniversary', need: false }; },
    title:      function (mode) { return { show: true, need: mode === 'title' }; },
    hostName:   function ()     { return { show: true, need: false }; },
    date:       function ()     { return { show: true, need: true }; },
    venue:      function ()     { return { show: true, need: false }; }
  };

  var PERSON_LABELS = {
    birthday: 'Birthday person',
    'naming-ceremony': 'Baby’s name',
    graduation: 'Graduate’s name',
    retirement: 'Retiring person',
    farewell: 'Person being farewelled'
  };

  var TITLE_PLACEHOLDERS = {
    wedding: 'e.g. The Wedding Celebration',
    engagement: 'e.g. Engagement Ceremony',
    reception: 'e.g. Wedding Reception',
    birthday: 'e.g. Turning Six!',
    'baby-shower': 'e.g. Baby Shower',
    'naming-ceremony': 'e.g. Namakarana Ceremony',
    'house-warming': 'e.g. Griha Pravesh',
    anniversary: 'e.g. 25 Years Together',
    corporate: 'e.g. Annual Partner Summit 2026',
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
      years: '',
      date: '',
      time: '',
      venue: '',
      address: '',
      mapsUrl: '',
      phone: '',
      email: '',
      message: '',
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
      showRsvp: true,
      showMaps: true,
      showGallery: true,
      plan: '7',
      step: 1,
      updatedAt: null
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
    if (!data.title && !data.brideName && !data.groomName && !data.personName) {
      data.title = 'Your Event Title';
    }
    if (nameMode(data.eventType) === 'couple') {
      if (!data.brideName && !data.groomName) { data.brideName = 'Bride'; data.groomName = 'Groom'; }
    }
    if (!data.message) {
      /* messageFor arrived with the per-event sample copy; a browser still
         holding an older preview.js must not be broken by asking for it. */
      data.message = IH.invitation.messageFor
        ? IH.invitation.messageFor(data.eventType)
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
    if (stage) IH.invitation.mount(stage, data);
  }, 140);

  /* The guest-facing link and its QR code, shown on the final step.
     The whole invitation travels inside the URL's fragment, so the link
     works on static hosting with nothing written and nothing stored. */
  function paintShareLink() {
    var url = IH.link ? IH.link.build(previewData()) : location.href;

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

  var PAY_STEP = 5;    // plan choice - test mode, nothing is charged
  var DONE_STEP = 6;   // the finished link, sharing and QR

  /* ------------------------------------------------------------------
     3c. Step 6 — everything that ended up on the card
     ------------------------------------------------------------------ */

  function summaryRows(data) {
    var tpl = IH.data.getTemplate(data.template);
    var d = IH.invitation.formatDate(data.date);
    var photos = (data.gallery ? data.gallery.length : 0) +
                 (data.photo ? 1 : 0) + (data.background ? 1 : 0);
    var sections = [];
    if (data.showCountdown !== false) sections.push('Countdown');
    if (data.showGallery !== false && data.gallery && data.gallery.length) sections.push('Gallery');
    if (data.showMaps !== false && (data.mapsUrl || data.address)) sections.push('Directions');
    if (data.showRsvp !== false) sections.push('RSVP');

    return [
      ['Occasion', IH.invitation.EVENT_TYPES[data.eventType] ? IH.invitation.EVENT_TYPES[data.eventType].label : 'Event'],
      ['Title', data.title],
      ['Hosted by', data.hostName],
      ['Names', [data.groomName, data.brideName].filter(Boolean).join(' & ') || data.personName],
      ['Date', d.full ? d.weekday + ', ' + d.full : ''],
      ['Time', IH.invitation.formatTime(data.time)],
      ['Venue', data.venue],
      ['Address', data.address],
      ['Phone', data.phone],
      ['Email', data.email],
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

    var url = IH.link ? IH.link.build(data) : '';
    var embedded = (data.gallery || []).filter(function (src) {
      return typeof src === 'string' && src.slice(0, 5) === 'data:';
    }).length + (String(data.photo || '').slice(0, 5) === 'data:' ? 1 : 0) +
      (String(data.background || '').slice(0, 5) === 'data:' ? 1 : 0);

    var rows = [
      '<li>' + IH.icon('link', 18) + '<span>Your invitation travels inside its own link — ' +
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
    exportBox = qs('[data-export-box]', root);
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
     the packing; this paints the address and the three steps to it. */
  function paintPublish(data) {
    var box = qs('[data-publish-box]', root);
    if (!box || !IH.publish) return;

    var where = IH.publish.slug(data);      // the .zip route: a folder per invitation
    var served = IH.publish.page(data);     // the server route: one file per invitation

    var urlOut = qs('[data-publish-url]', box);
    if (urlOut) urlOut.textContent = served.url;

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
        '<li>' + IH.icon('globe', 18) + '<span><strong>Publish it now</strong> writes <code>' +
          escapeHtml(served.path) + '</code> into the repository and the address works ' +
          'straight away. Needs the Vercel deployment — GitHub Pages cannot run it.</span></li>',
        '<li>' + IH.icon('download', 18) + '<span><strong>Download page folder</strong> gives you ' +
          '<code>' + escapeHtml(where.file) + '</code> plus your photos and music, named to match ' +
          'it, to unpack at the root of your repository and push yourself. This is the one that ' +
          'keeps your uploads.</span></li>',
        '<li>' + IH.icon('zap', 18) + '<span>Either way it becomes a real page, so WhatsApp and ' +
          'Facebook can show a preview of it — which the link above can never do.</span></li>'
      ].join('');
    }
  }

  function initPublish() {
    var box = qs('[data-publish-box]', root);
    if (!box || !IH.publish) return;

    on(qs('[data-publish-now]', box), 'click', function (evt) {
      var btn = evt.currentTarget;
      var label = qs('span', btn);
      var was = label ? label.textContent : '';

      btn.disabled = true;
      if (label) label.textContent = 'Publishing…';

      IH.publish.toServer(previewData()).then(function (result) {
        var holder = qs('[data-publish-result]', box);
        var out = qs('[data-publish-live]', box);
        var open = qs('[data-publish-open]', box);

        if (out) out.textContent = result.url;
        if (open) open.href = result.url;
        if (holder) holder.hidden = false;

        IH.toast.success(result.count > 1
          ? 'Published — ' + result.count + ' files committed, page and media together.'
          : 'Published. The address is live now.', { title: result.file });
        IH.confetti(24);
      }).catch(function (err) {
        IH.toast.error(err.message, { title: 'Not published' });
      }).then(function () {
        btn.disabled = false;
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
      var url = IH.publish.slug(previewData()).url;
      IH.share.copy(url).then(function () {
        IH.toast.success('Address copied — it works once you have pushed the folder.', { title: 'Copied' });
      }).catch(function () {
        IH.toast.info('Copy this address: ' + url);
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
    var mode = nameMode(type);

    Object.keys(FIELD_RULES).forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (!input) return;
      var field = input.closest('.field');
      if (!field) return;

      var rule = FIELD_RULES[name](mode, type);

      /* Both, deliberately. The attribute is the honest signal — it takes
         the field out of the accessibility tree too — but it only carries
         `display: none` from the browser's own stylesheet, which any class
         here outranks. An inline style cannot be outranked, so a stale or
         missing stylesheet can never leave a Groom's name sitting on a
         festival invitation. */
      field.hidden = !rule.show;
      field.style.display = rule.show ? '' : 'none';
      input.disabled = !rule.show;

      /* validate.field reads the attribute, so this is what actually
         decides whether a blank value stops the wizard. */
      if (rule.need && rule.show) input.setAttribute('required', '');
      else input.removeAttribute('required');

      /* The asterisk has to follow, or the form promises one thing and
         enforces another. */
      var star = qs('[data-req]', field);
      if (star) star.hidden = !(rule.need && rule.show);

      /* A field that is now hidden or optional must not keep an error
         from the last event type the host was looking at. */
      if (!rule.show || !rule.need) IH.validate.clearError(input);
    });

    var personInput = qs('[name="personName"]', root);
    if (personInput) {
      var labelNode = qs('.field__label', personInput.closest('.field'));
      if (labelNode) labelNode.childNodes[0].nodeValue = (PERSON_LABELS[type] || 'Name of the person') + ' ';
      personInput.placeholder = 'As it should appear on the card';
    }

    /* "Event details" is what you write when you do not know which event.
       The wizard does know by now, so the step says so: Wedding details,
       Birthday details, House Warming details. */
    var stepTitle = qs('#step2-title', root);
    if (stepTitle) {
      var meta = IH.invitation.EVENT_TYPES[type];
      stepTitle.textContent = (meta && type !== 'other')
        ? meta.label + ' details'
        : 'Event details';
    }

    var titleInput = qs('[name="title"]', root);
    if (titleInput) titleInput.placeholder = TITLE_PLACEHOLDERS[type] || TITLE_PLACEHOLDERS.other;

    /* One wedding sentence used to sit in every event's message box, which
       made it a thing to delete rather than a thing to start from. The
       wording now follows the occasion — the copy comes from the same
       per-event samples the previews use, so there is one list, not two. */
    var messageInput = qs('[name="message"]', root);
    if (messageInput && IH.invitation.messageFor) {
      messageInput.placeholder = IH.invitation.messageFor(type);
    }

    var hostInput = qs('[name="hostName"]', root);
    if (hostInput) {
      hostInput.placeholder = type === 'corporate'
        ? 'e.g. Northwind Technologies'
        : 'e.g. Both families';
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

    ['showCountdown', 'showRsvp', 'showMaps', 'showGallery'].forEach(function (name) {
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

  var TEXT_FIELDS = ['title', 'hostName', 'brideName', 'groomName', 'personName', 'years', 'date', 'time',
    'venue', 'address', 'mapsUrl', 'phone', 'email', 'message'];

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
  }

  function syncInputs() {
    TEXT_FIELDS.forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (input && input.value !== state[name]) input.value = state[name] || '';
    });
    ['font', 'animation'].forEach(function (name) {
      var input = qs('[name="' + name + '"]', root);
      if (input) input.value = state[name];
    });
    ['showCountdown', 'showRsvp', 'showMaps', 'showGallery'].forEach(function (name) {
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
        if (label) label.textContent = n === PAY_STEP ? 'Make Me Payment' : 'Continue';
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
    if (n === DONE_STEP) {
      /* "Make Me Payment" lands here. Test mode: no gateway, no charge —
         the click simply writes the page and its images, then shows the
         link, the sharing options and the QR code. */
      paintShareLink();
      paintCardSummary(previewData());
      paintPublish(previewData());
      IH.confetti(36);
    }
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

  function initPreviewColumn() {
    var stage = qs('.preview-stage', root);
    qsa('[data-preview-device]', root).forEach(function (btn) {
      on(btn, 'click', function () {
        var mode = btn.getAttribute('data-preview-device');
        if (stage) stage.setAttribute('data-device', mode);
        qsa('[data-preview-device]', root).forEach(function (other) {
          other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
        });
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

    on(qs('[data-draft-print]', root), 'click', function () { window.print(); });
  }

  /* ------------------------------------------------------------------
     10. Plan selection (demo only)
     ------------------------------------------------------------------ */

  function initPlans() {
    qsa('[data-plan-pick]', root).forEach(function (btn) {
      on(btn, 'click', function () {
        state.plan = btn.getAttribute('data-plan-pick');
        qsa('[data-plan-card]', root).forEach(function (card) {
          card.classList.toggle('is-selected', card.getAttribute('data-plan-card') === state.plan);
        });
        var out = qs('[data-plan-summary]', root);
        var price = btn.getAttribute('data-plan-price');
        if (out) out.textContent = state.plan + '-day plan · ' + IH.config.currency + price;
        saveDraft();
        IH.toast.info('Noted — your invitation page is already created either way. Plans only cover hosting it at a permanent link.', { title: 'Nothing to pay' });
      });
      if (btn.getAttribute('data-plan-pick') === state.plan) {
        var card = btn.closest('[data-plan-card]');
        if (card) card.classList.add('is-selected');
      }
    });
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
    if (params.get('plan')) state.plan = params.get('plan');

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
      initPlans();
      initExport();
      initPublish();

      applyFieldRules();
      syncInputs();
    } catch (err) {
      if (window.console) console.error('InviteHub: the editor did not fully start —', err);
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
