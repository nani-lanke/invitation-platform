/* ====================================================================
   export.js — the invitation as a single downloadable file

   The site is deployed to GitHub Pages, which is static hosting: nothing
   can write a file when a host finishes their invitation. Sharing is
   therefore done with a link that carries its own contents (js/link.js).

   This module covers the other route — building one self-contained .html
   the host can download and send as an attachment, or commit into
   invitation_card/ to publish it at its own URL. Photos stay embedded as
   data URLs so the file works anywhere on its own.

   Public surface:
     IH.exportPage.personName(state)  -> 'John Doe'
     IH.exportPage.fileName(state)    -> 'Rahul_Priya_15-08-2026_1830.html'
     IH.exportPage.baseName(state)    -> 'Rahul_Priya_15-08-2026_1830'
     IH.exportPage.buildInvitationFilename(state) -> 'Rahul_Priya_15-08-2026_1830.html'
     IH.exportPage.buildHtml(state, opts) -> full document as a string
     IH.exportPage.download(state)    -> triggers a browser download

   fileName() is the one canonical filename generator. js/publish.js and
   api/_validate.js both ask for the same name here, so Download .html,
   the .zip and the GitHub commit all use the exact same filename.

   opts.up is how far the page sits below the site root, as a path prefix
   ('../' for invitation_card/Name.html, '../../../' for a page nested in
   invitation_card/Names/Date/). js/publish.js uses it for the second form.
   ==================================================================== */

(function () {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;

  var FOLDER = 'invitation_card';
  /* Download .html writes the host page to invitation_card/ and the card
     page, under the same name, to invitation_card/invitations/. */
  var SAVE_DIR = 'invitations';
  var MAX_BASE = 60;
  var s = function (v) { return String(v == null ? '' : v).trim(); };

  /* "Download image" button shared by the host page and the card page:
     saves the invitation (data-target) as a JPG with html2canvas. */
  /* html2canvas-pro: same API, but reads modern CSS colours (color-mix,
     color()) that the designs use and html2canvas 1.4.1 rejects. */
  var HTML2CANVAS = 'https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js';
  var DL_BTN_CSS = [
    '.site-dl-btn{position:fixed;right:20px;bottom:20px;z-index:900;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.9);background:rgba(22,18,28,.86);color:#fff;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 0 0 1px rgba(0,0,0,.35),0 12px 30px rgba(0,0,0,.35);cursor:pointer;transition:transform .2s ease,opacity .2s ease}',
    '.site-dl-btn--stack{bottom:84px}',
    '.site-dl-btn:hover{transform:scale(1.08)}',
    '.site-dl-btn svg{width:22px;height:22px}',
    '.site-dl-btn.is-busy{opacity:.6;pointer-events:none}'
  ].join('\n');
  var DL_SCRIPT = [
    '  // --- Download image ---',
    '  (function () {',
    '    var btn = document.getElementById("site-dl-btn");',
    '    if (!btn) return;',
    '    btn.addEventListener("click", function () {',
    '      var target = document.querySelector(btn.getAttribute("data-target"));',
    '      if (!target || !window.html2canvas) return;',
    '      btn.classList.add("is-busy");',
    '      html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff",',
    '        ignoreElements: function (el) { return el.id === "site-dl-btn" || el.id === "site-music-btn"; } })',
    '        .then(function (canvas) {',
    '          var a = document.createElement("a");',
    '          a.href = canvas.toDataURL("image/jpeg", 0.92);',
    '          a.download = btn.getAttribute("data-file") || "invitation.jpg";',
    '          document.body.appendChild(a); a.click(); a.remove();',
    '        })',
    '        .catch(function (err) { console.error("Download image failed", err); })',
    '        .then(function () { btn.classList.remove("is-busy"); });',
    '    });',
    '  })();'
  ].join('\n');

  function dlButton(state, target, stacked) {
    return '<button id="site-dl-btn" class="site-dl-btn' + (stacked ? ' site-dl-btn--stack' : '') + '" type="button"' +
      ' aria-label="Download invitation image" title="Download image"' +
      ' data-target="' + target + '" data-file="' + fileName(state).replace(/\.html$/, '.jpg') + '">' +
      '<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>' +
      '</button>';
  }

  /* ------------------------------------------------------------------
     1. Naming
     ------------------------------------------------------------------ */

  /* The human name the file is named after, in priority order. */
  function personName(state) {
    if (!state) return '';
    var s = function (v) { return String(v == null ? '' : v).trim(); };

    /* Couple occasions name the file after the couple, even if a leftover
       personName from another occasion is still in the draft. */
    var coupleType = state.eventType === 'wedding' || state.eventType === 'engagement' || state.eventType === 'reception';
    if (s(state.personName) && !(coupleType && s(state.groomName) && s(state.brideName))) return s(state.personName);

    /* A naming ceremony names the baby, so the file follows the baby when
       personName is empty (or already moved aside for the baby). */
    if (s(state.babyName)) return s(state.babyName);

    /* Groom first, matching the order the card itself prints the names. */
    var bride = s(state.brideName), groom = s(state.groomName);
    if (state.namesSwapped) {
      if (bride && groom) return bride + ' and ' + groom;
    } else {
      if (bride && groom) return groom + ' and ' + bride;
    }
    if (bride || groom) return bride || groom;

    if (s(state.hostName)) return s(state.hostName);
    if (s(state.title)) return s(state.title);
    return '';
  }

  /* 'John Doe' -> 'John_Doe'. Anything a filesystem could choke on goes. */
  function safeBase(name) {
    var raw = String(name || '');
    if (raw.normalize) raw = raw.normalize('NFKD');

    var base = raw
      .replace(/[̀-ͯ]/g, '')  // drop accents left behind by NFKD
      .replace(/&/g, ' ')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/^[_-]+|[_-]+$/g, '')
      .slice(0, MAX_BASE);

    return base || 'Invitation';
  }

  /* ------------------------------------------------------------------
     The one canonical filename generator.

     Every route out of the editor — Download .html, the .zip, and the
     server commit — asks these functions for the name, so an invitation
     has exactly one name everywhere it goes. The occasion's eventType
     picks the field the name comes from (a wedding names the couple, a
     birthday the birthday person, a school event the school, a festival
     its title); the date always reads DD-MM-YYYY and the time, when
     present, HHMM in 24-hour form. No other file in the site builds a
     filename of its own.
     ------------------------------------------------------------------ */

  function categoryName(state) {
    var type = String((state && state.eventType) || '').toLowerCase();
    var couple = (state && state.namesSwapped ? [s(state.brideName), s(state.groomName)] : [s(state.groomName), s(state.brideName)]).filter(Boolean).join(' ');

    switch (type) {
      case 'wedding':
      case 'engagement':
      case 'reception':
        return couple;
      case 'birthday':
      case 'baby-shower':
      case 'house-warming':
      case 'anniversary':
      case 'graduation':
      case 'retirement':
      case 'farewell':
      case 'party':
        return s(state.personName);
      case 'naming-ceremony':
        return s(state.parentsName);
      case 'corporate':
      case 'school-events':
      case 'college-events':
      case 'community-events':
        return s(state.organization);
      default:                // festival, other, or a category not listed
        return s(state.title);
    }
  }

  /* Required fields are checked before a host reaches Done, so a category
     component is normally always present. If one is missing anyway (an old
     draft, a direct API call), fall back through the other name fields in
     the same order the card prints them, then to 'Invitation'. */
  function fallbackName(state) {
    return s(state.personName) || s(state.babyName) || s(state.parentsName) ||
      ((state && state.namesSwapped) ? [s(state.brideName), s(state.groomName)] : [s(s(state.groomName)), s(state.brideName)]).filter(Boolean).join(' ') ||
      s(state.organization) || s(state.hostName) || s(state.title);
  }

  /* 'YYYY-MM-DD' -> 'DD-MM-YYYY'. The form stores an ISO date; filenames
     read the day first. */
  function datePart(state) {
    var d = String((state && state.date) || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
    return d.slice(8, 10) + '-' + d.slice(5, 7) + '-' + d.slice(0, 4);
  }

  /* '18:30' -> '1830'. The form stores 24-hour HH:MM, so 6:30 PM comes
     out as 1830, and an all-day invitation simply leaves the time off. */
  function timePart(state) {
    var t = String((state && state.time) || '');
    return /^\d{2}:\d{2}$/.test(t) ? t.replace(':', '') : '';
  }

  /* The stem the page and every one of its assets share, e.g.
     'Rahul_Priya_15-08-2026_1830'. */
  function baseName(state) {
    var parts = [safeBase(categoryName(state) || fallbackName(state) || 'Invitation')];
    var date = datePart(state);
    if (date) parts.push(date);
    // Only couple occasions add the time; the others are named after the name and the date.
    var withTime = state && (state.eventType === 'wedding' || state.eventType === 'engagement' || state.eventType === 'reception');
    var time = withTime ? timePart(state) : '';
    if (time) parts.push(time);
    return parts.join('_');
  }

  /* The complete canonical filename, extension included. */
  function buildInvitationFilename(state) {
    return baseName(state) + '.html';
  }

  function fileName(state) {
    return buildInvitationFilename(state);
  }

  /* ------------------------------------------------------------------
     2. Document builder
     ------------------------------------------------------------------ */

  function esc(v) {
    return dom.escapeHtml(String(v == null ? '' : v));
  }

  /* Text placed inside <script> must not be able to close the tag. */
  function escScript(v) {
    return String(v).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  }

  function eventLabel(state) {
    var meta = IH.invitation && IH.invitation.EVENT_TYPES[state.eventType];
    return meta && state.eventType !== 'other' ? meta.label : 'Event';
  }

  function metaDescription(state) {
    var who = personName(state);
    var when = state.date ? IH.invitation.formatDate(state.date).full : '';
    return [
      who ? 'You are invited to ' + who + '’s ' + eventLabel(state).toLowerCase() : 'You are invited',
      when ? ' on ' + when : '',
      state.venue ? ' at ' + state.venue : '',
      '.'
    ].join('');
  }

  /* The page carries its own settings so it can be re-opened or migrated
     later. Images are already embedded in the markup above, so they are
     left out here rather than stored twice. */
  function leanState(state) {
    var lean = {};
    Object.keys(state).forEach(function (key) {
      if (key === 'photo' || key === 'background' || key === 'gallery' || key === 'venueImage') return;
      /* Private to the host: the email is only for the payment confirmation
         and the receipt only for re-publishing. Guests can read this JSON in
         the page source, and nothing on the page uses either. */
      if (key === 'email' || key === 'hostingPayment' || key === 'hostingPaymentId' || key === 'emailStatus') return;
      lean[key] = state[key];
    });
    lean.photoCount = (state.gallery ? state.gallery.length : 0) +
      (state.photo ? 1 : 0) + (state.background ? 1 : 0) + (state.venueImage ? 1 : 0);
    lean.generatedAt = new Date().toISOString();
    return lean;
  }

  /* ------------------------------------------------------------------
     2b. Photos â†’ real files in invitation_card/images/
     ------------------------------------------------------------------ */

  /* One folder per kind of asset, beside the page rather than under it,
     so every invitation's photos land together. */
  var MAIN_DIR = 'main_image';
  var BG_DIR = 'background_image';
  var GALLERY_DIR = 'sample_images';
  var MUSIC_DIR = 'background_music';
  var ASSET_DIRS = [MAIN_DIR, BG_DIR, GALLERY_DIR, MUSIC_DIR];

  var MIME_EXT = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif'
  };

  function isDataUrl(v) {
    return typeof v === 'string' && v.slice(0, 11) === 'data:image/';
  }

  function extFor(dataUrl) {
    var m = /^data:([^;,]+)[;,]/.exec(dataUrl);
    return MIME_EXT[(m && m[1] || '').toLowerCase()] || 'png';
  }

  /* Returns a state whose image fields point at relative file paths, plus
     the list of files that belong beside the page. Every name is built from
     the same stem as the page, so an invitation's assets stay recognisably
     its own however many share the folder. */
  function extractAssets(state, stem) {
    var base = stem === undefined ? baseName(state) : String(stem);
    var assets = [];
    var out = {};
    Object.keys(state).forEach(function (k) { out[k] = state[k]; });

    function take(dataUrl, dir, suffix) {
      if (!isDataUrl(dataUrl)) return dataUrl;
      var path = dir + '/' + base + '_' + suffix + '.' + extFor(dataUrl);
      assets.push({ path: path, data: dataUrl });
      return path;
    }

    out.photo = take(state.photo, MAIN_DIR, 'image');
    out.background = take(state.background, BG_DIR, 'background');
    out.venueImage = take(state.venueImage, MAIN_DIR, 'venue');
    out.gallery = (state.gallery || []).map(function (src, i) {
      return take(src, GALLERY_DIR, 'image' + (i + 1));
    });

    return { state: out, assets: assets };
  }

  /* An image the host picked out of the repository is written as a path
     from the site root ('images/hero/card-baby.svg'), which is wrong once
     the page is sitting inside invitation_card/. Everything else already
     resolves: data: URLs and absolute URLs carry no context, and the
     asset folders are deliberately relative — they sit beside the page. */
  function resolvePaths(state, up) {
    function fix(src) {
      if (typeof src !== 'string' || !src) return src;
      if (/^(data:|https?:|\/\/|\/|\.\.?\/)/.test(src)) return src;
      for (var i = 0; i < ASSET_DIRS.length; i++) {
        if (src.slice(0, ASSET_DIRS[i].length + 1) === ASSET_DIRS[i] + '/') return src;
      }
      return up + src;
    }

    var out = {};
    Object.keys(state).forEach(function (k) { out[k] = state[k]; });
    out.photo = fix(state.photo);
    out.background = fix(state.background);
    out.venueImage = fix(state.venueImage);
    out.musicFile = fix(state.musicFile);
    if (state.gallery) out.gallery = state.gallery.map(fix);

    return out;
  }

  /* ------------------------------------------------------------------
     2c. Palette resolution — same as the card renderer uses
     ------------------------------------------------------------------ */

  /* '#RRGGBB' (or '#RGB') -> 'rgba(r,g,b,a)' so gradients can be built
     from a template's palette without a canvas. */
  function rgba(hex, alpha) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(40,20,40,' + alpha + ')';
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* The same palette resolution the card renderer uses: the template the
     host chose, or their custom colours, then the default wedding palette. */
  function paletteFor(state) {
    var tpl = IH.data && IH.data.getTemplate ? IH.data.getTemplate(state.template) : null;
    var c = state.colors || (tpl && tpl.colors) ||
      (state.template === 'telugu-pelli'
        ? { primary: '#7A1C28', secondary: '#B8860B', bg1: '#FAF5EC', bg2: '#F5EADB', ink: '#3D2E1E' }
        : (state.template === 'tamil-thirumanam'
          ? { primary: '#762D3A', secondary: '#C49A45', bg1: '#F8F2E4', bg2: '#FFF9ED', ink: '#59473B' }
          : { primary: '#8B2F58', secondary: '#C9871F', bg1: '#FDF0F4', bg2: '#F6D9E4', ink: '#3A1B2B' }));
    var fontKey = state.font || (state.template === 'telugu-pelli' ? 'telugu' : (state.template === 'tamil-thirumanam' ? 'tamil' : 'playfair'));
    var fonts = (IH.invitation && IH.invitation.GOOGLE_FONTS &&
      IH.invitation.GOOGLE_FONTS[fontKey]) ||
      (state.template === 'telugu-pelli'
        ? { display: "'Cinzel', 'Noto Serif Telugu', Georgia, serif", body: "'Cormorant Garamond', 'Noto Serif Telugu', 'DM Sans', serif" }
        : (state.template === 'tamil-thirumanam'
          ? { display: "'Cinzel', 'Noto Serif Tamil', Georgia, serif", body: "'Cormorant Garamond', 'Noto Serif Tamil', 'DM Sans', serif" }
          : { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" }));
    return {
      primary: c.primary, secondary: c.secondary, bg1: c.bg1, bg2: c.bg2, ink: c.ink,
      display: fonts.display, body: fonts.body
    };
  }

  function eventMeta(state) {
    var type = String(state.eventType || 'other');
    return (IH.invitation && IH.invitation.EVENT_TYPES &&
      IH.invitation.EVENT_TYPES[type]) ||
      { label: 'Event', kicker: 'You are invited' };
  }

  function brandText(state) {
    var type = String(state.eventType || '');
    if (type === 'wedding' || type === 'engagement' || type === 'reception' || type === 'anniversary') {
      var g = String(state.groomName || '').trim(), b = String(state.brideName || '').trim();
      if (state.namesSwapped) {
        var tmp = g; g = b; b = tmp;
      }
      if (g && b) return g + ' & ' + b;
      if (g || b) return g || b;
    }
    return String(state.personName || state.babyName || state.title || state.hostName || '').trim();
  }

  /* ------------------------------------------------------------------
     2d. The invitation card stylesheet (reused from css/style.css lines 1444-1804)
     This mirrors the .invitation component exactly so the hosted page
     matches the editor preview 1:1.
     ------------------------------------------------------------------ */

  function invitationCss(p) {
    return [
      ':root{',
      '  --inv-p:' + p.primary + ';',
      '  --inv-s:' + p.secondary + ';',
      '  --inv-b1:' + p.bg1 + ';',
      '  --inv-b2:' + p.bg2 + ';',
      '  --inv-ink:' + p.ink + ';',
      '  --inv-fd:' + p.display + ';',
      '  --inv-fb:' + p.body + ';',
      '}',
      'html{scroll-behavior:smooth}',
      'body{margin:0;font-family:var(--inv-fb);color:var(--inv-ink);background:linear-gradient(160deg,var(--inv-b1),var(--inv-b2));min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box}',
      'img{max-width:100%;display:block}',
      'a{text-decoration:none;color:inherit}',
      'button{font:inherit;cursor:pointer}',
      'h1,h2,h3{margin:0}',
      '.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
      '',
      '/* Invitation card — identical to css/style.css .invitation component */',
      '.invitation{',
      '  --inv-primary:var(--inv-p);',
      '  --inv-secondary:var(--inv-s);',
      '  --inv-bg1:var(--inv-b1);',
      '  --inv-bg2:var(--inv-b2);',
      '  --inv-ink:var(--inv-ink);',
      '  --inv-font-display:var(--inv-fd);',
      '  --inv-font-body:var(--inv-fb);',
      '',
      '  position:relative;',
      '  width:100%;',
      '  max-width:420px;',
      '  margin-inline:auto;',
      '  padding:clamp(1.4rem,6%,2.5rem) 12% clamp(1.25rem,5%,2rem);',
      '  border-radius:var(--r-xl,1rem);',
      '  background:linear-gradient(160deg,var(--inv-bg1),var(--inv-bg2));',
      '  color:var(--inv-ink);',
      '  font-family:var(--inv-font-body);',
      '  text-align:center;',
      '  overflow:hidden;',
      '  overflow-wrap:break-word;',
      '  box-shadow:0 24px 48px -12px rgba(20,10,25,.25),0 0 0 1px rgba(139,47,88,.08);',
      '  isolation:isolate;',
      '  container-type:inline-size;',
      '  container-name:invite;',
      '}',
      '',
      '@supports not (container-type:inline-size){',
      '  .invitation__ornament svg{width:clamp(46px,14vw,70px);height:clamp(46px,14vw,70px)}',
      '  .invitation__kicker{font-size:clamp(.62rem,.56rem+.4vw,.74rem);letter-spacing:.2em;text-indent:.2em}',
      '  .invitation__names{font-size:clamp(1.5rem,1rem+4.2vw,2.9rem)}',
      '}',
      '',
      '.invitation::before{',
      '  content:"";',
      '  position:absolute;',
      '  inset:clamp(9px,3.2cqi,14px);',
      '  border:1px solid color-mix(in srgb,var(--inv-primary) 30%,transparent);',
      '  border-radius:var(--r-lg,.75rem);',
      '  pointer-events:none;',
      '  z-index:0;',
      '}',
      '',
      '.invitation>*{position:relative;z-index:10}',
      '',
      '.invitation__ornament{',
      '  display:flex;',
      '  justify-content:center;',
      '  margin-bottom:clamp(.6rem,3.5cqi,1rem);',
      '  color:var(--inv-secondary);',
      '}',
      '.invitation__ornament svg{',
      '  width:clamp(46px,17cqi,70px);',
      '  height:clamp(46px,17cqi,70px);',
      '}',
      '',
      '.invitation__kicker{',
      '  font-size:clamp(.6rem,3.1cqi,.74rem);',
      '  font-weight:600;',
      '  letter-spacing:clamp(.14em,.8cqi,.28em);',
      '  text-indent:clamp(.14em,.8cqi,.28em);',
      '  text-transform:none;',
      '  color:color-mix(in srgb,var(--inv-ink) 68%,transparent);',
      '  margin-bottom:var(--space-3,1rem);',
      '  max-width:100%;',
      '  text-wrap:balance;',
      '}',
      '',
      '.invitation__additional-title{',
      '  font-family:var(--inv-font-display);',
      '  font-size:1.15rem;',
      '  font-weight:700;',
      '  letter-spacing:clamp(.18em,1cqi,.32em);',
      '  text-indent:clamp(.18em,1cqi,.32em);',
      '  color:var(--inv-secondary);',
      '  margin-top:calc(clamp(1.2rem,5cqi,2.2rem) + 25px);',
      '  margin-bottom:var(--space-2,.5rem);',
      '  max-width:100%;',
      '  text-wrap:balance;',
      '  white-space:pre-line;',
      '}',
      '',
      '.invitation__additional-subtitle{',
      '  font-family:var(--inv-font-body);',
      '  font-size:1.15rem;',
      '  font-style:italic;',
      '  font-weight:500;',
      '  letter-spacing:clamp(.04em,.25cqi,.08em);',
      '  color:#000000;',
      '  margin-bottom:var(--space-3,1rem);',
      '  max-width:100%;',
      '  text-wrap:balance;',
      '  white-space:pre-line;',
      '}',
      '',
      '.invitation__names{',
      '  font-family:var(--inv-font-display);',
      '  font-size:clamp(1.45rem,11cqi,2.9rem);',
      '  font-weight:700;',
      '  line-height:1.1;',
      '  color:var(--inv-primary);',
      '  margin-bottom:var(--space-3,1rem);',
      '  max-width:100%;',
      '  overflow-wrap:break-word;',
      '  hyphens:auto;',
      '  text-wrap:balance;',
      '}',
      '',
      '.invitation__names .amp{display:block;font-family:var(--font-script,"Great Vibes",cursive);font-size:.62em;font-weight:400;color:var(--inv-secondary);line-height:1.4}',
      '',
      '.invitation__couple{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:start;justify-content:center;gap:0 clamp(6px,2cqi,14px);margin-bottom:var(--space-3,1rem);width:100%}',
      '.invitation__person{display:contents}',
      '.invitation__person--left .invitation__person-name,.invitation__person:first-child .invitation__person-name{grid-column:1;grid-row:1}',
      '.invitation__person--right .invitation__person-name,.invitation__person:last-child .invitation__person-name{grid-column:3;grid-row:1}',
      '.invitation__person--left .invitation__person-parents,.invitation__person:first-child .invitation__person-parents{grid-column:1;grid-row:2}',
      '.invitation__person--right .invitation__person-parents,.invitation__person:last-child .invitation__person-parents{grid-column:3;grid-row:2}',
      '.invitation__couple:not(.invitation__couple--swapped) .invitation__person--groom .invitation__person-name{grid-column:1;grid-row:1;text-align:right}',
      '.invitation__couple:not(.invitation__couple--swapped) .invitation__person--bride .invitation__person-name{grid-column:3;grid-row:1;text-align:left}',
      '.invitation__couple:not(.invitation__couple--swapped) .invitation__person--groom .invitation__person-parents{grid-column:1;grid-row:2;text-align:right}',
      '.invitation__couple:not(.invitation__couple--swapped) .invitation__person--bride .invitation__person-parents{grid-column:3;grid-row:2;text-align:left}',
      '.invitation__couple--swapped .invitation__person--bride .invitation__person-name{grid-column:1;grid-row:1;text-align:left}',
      '.invitation__couple--swapped .invitation__person--groom .invitation__person-name{grid-column:3;grid-row:1;text-align:right}',
      '.invitation__couple--swapped .invitation__person--bride .invitation__person-parents{grid-column:1;grid-row:2;text-align:left}',
      '.invitation__couple--swapped .invitation__person--groom .invitation__person-parents{grid-column:3;grid-row:2;text-align:right}',
      '.invitation__person-name{font-family:var(--inv-font-display);font-size:clamp(0.95rem,5.2cqi,1.6rem);font-weight:700;line-height:1.15;color:var(--inv-primary);margin:0;overflow-wrap:break-word;hyphens:auto;text-wrap:balance}',
      '.invitation__person--groom .invitation__person-name{font-size:clamp(1.05rem,5.7cqi,1.76rem);text-align:right}',
      '.invitation__person--groom .invitation__person-parents{font-size:clamp(1rem,3.3cqi,1.23rem);text-align:right;color:#000000}',
      '.invitation__person--groom .invitation__person-parents span,.invitation__person--groom .invitation__person-parents strong{color:#000000;opacity:1}',
      '.invitation__person--bride .invitation__person-name{font-size:clamp(1.05rem,5.7cqi,1.76rem);text-align:left}',
      '.invitation__person--bride .invitation__person-parents{font-size:clamp(1rem,3.3cqi,1.23rem);text-align:left;color:#000000}',
      '.invitation__person--bride .invitation__person-parents span,.invitation__person--bride .invitation__person-parents strong{color:#000000;opacity:1}',
      '.invitation__couple-sep{grid-column:2;grid-row:1;flex:none;display:flex;align-items:center;justify-content:center;align-self:center;margin-inline:clamp(14px,3cqi,24px);font-family:var(--font-script,"Great Vibes",cursive);font-size:clamp(1.1rem,5cqi,1.8rem);font-weight:400;color:var(--inv-secondary);line-height:1}',
      '.invitation__person-parents{margin-top:clamp(4px,1.2cqi,8px);font-size:clamp(0.68rem,2.2cqi,0.82rem);line-height:1.35;color:color-mix(in srgb,var(--inv-ink) 80%,transparent)}',
      '.invitation__person-parents span{display:block;font-size:0.72em;text-transform:uppercase;letter-spacing:clamp(0.08em,0.4cqi,0.14em);opacity:0.75;margin-bottom:2px;font-weight:600}',
      '.invitation__person-parents strong{display:block;font-weight:600;color:var(--inv-ink)}',
      '',
      '.invitation__subhead{',
      '  letter-spacing:clamp(.05em,.3cqi,.1em);',
      '  text-indent:clamp(.05em,.3cqi,.1em);',
      '}',
      '',
      '.invitation__rule{display:flex;align-items:center;justify-content:center;gap:10px;margin:var(--space-4,1.5rem) 0;color:var(--inv-secondary)}',
      '.invitation__rule::before,.invitation__rule::after{content:"";height:1px;width:52px;background:currentColor;opacity:.55}',
      '.invitation__rule svg{width:16px;height:16px}',
      '',
      '.invitation__save-date, .invitation__chapter-title, .invitation__venue-title{display:flex;align-items:center;justify-content:center;gap:var(--space-2,.5rem);font-family:var(--inv-font-display);font-size:1.15rem;font-weight:700;color:var(--inv-primary);margin-bottom:var(--space-3,1rem);letter-spacing:0.05em;text-transform:uppercase}',
      '.invitation__save-date{margin-left:15%;margin-right:15%}',
      '.invitation__message{font-size:1.15rem;line-height:1.75;color:color-mix(in srgb,var(--inv-ink) 82%,transparent);margin-bottom:var(--space-5,2rem);white-space:pre-line}',
      '.invitation__events-title{display:flex;align-items:center;justify-content:center;gap:1rem;font-size:1.15rem;font-weight:700;color:var(--inv-primary,var(--maroon,#7A1C28));margin-top:var(--space-4,1.5rem);margin-bottom:var(--space-4,1.5rem);text-transform:uppercase;letter-spacing:0.1em}',
      '.invitation__events-grid{display:flex;justify-content:center;align-items:stretch;width:100%;margin-bottom:var(--space-4,1.5rem);padding:14px 2px;border:1px solid color-mix(in srgb,var(--inv-primary) 20%,transparent);border-radius:var(--r-md,.5rem);background:color-mix(in srgb,var(--inv-primary) 5%,transparent);box-sizing:border-box}',
      '.invitation__event-card{flex:0 0 25%;width:25%;max-width:25%;box-sizing:border-box;background:transparent;border:none;border-right:1px solid color-mix(in srgb,var(--inv-primary) 15%,transparent);border-radius:0;box-shadow:none;padding:4px 1px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-width:0;overflow-wrap:normal;word-break:normal;transition:transform var(--t-fast,.15s) var(--ease,.25s)}',
      '.invitation__event-card:last-child{border-right:none}',
      '.invitation__event-card:hover{transform:translateY(-2px)}',
      '.invitation__event-img{width:46px;height:46px;object-fit:contain;margin-bottom:6px;background:transparent;transition:transform .3s ease}',
      '.invitation__event-card:hover .invitation__event-img{transform:scale(1.08)}',
      // Programme icons (inline SVG) and the header lead line of the other occasions.
      '.invitation__event-icon{padding:8px;color:var(--inv-primary)}',
      '.invitation__lead{font-style:italic;font-size:clamp(.85rem,3.6cqi,1rem);color:color-mix(in srgb,var(--inv-ink) 82%,transparent);margin:0 0 var(--space-3,1rem);max-width:100%;text-wrap:balance}',
      '.invitation__event-title{display:block;font-size:10.5px;font-weight:700;margin-bottom:3px;color:var(--inv-primary);text-transform:uppercase;letter-spacing:0;width:100%;line-height:1.2;white-space:nowrap}',
      '.invitation__event-weekday{display:block;font-size:10.5px;font-weight:600;color:var(--inv-ink);line-height:1.3;width:100%;margin-bottom:2px}',
      '.invitation__event-date{display:block;font-size:10.5px;color:var(--inv-ink);line-height:1.3;width:100%;margin-bottom:2px}',
      '.invitation__event-time{display:block;font-size:10.5px;color:var(--inv-ink);opacity:0.9;line-height:1.3;width:100%}',
      '.invitation__blessings-heading{font-family:var(--inv-font-display);font-size:1.15rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--inv-primary);margin-bottom:var(--space-3,1rem);display:flex;align-items:center;justify-content:center;gap:12px}',
      '.invitation__blessings-subheading{font-size:1.15rem;font-weight:700;margin-top:var(--space-2,0.5rem);letter-spacing:1px;text-align:center}',
      '.invitation__gallery-title{display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.15rem;font-weight:700;color:var(--inv-secondary);margin-top:var(--space-6,2.5rem);margin-bottom:var(--space-3,1rem);text-transform:uppercase;letter-spacing:0.05em;text-align:center}',
      '',
      '.invitation__when{display:grid;grid-template-columns:repeat(3,1fr);align-items:stretch;gap:clamp(6px,1.8cqi,10px);margin-bottom:var(--space-5,2rem)}',
      '.invitation__when-col{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(8px,2.2cqi,12px) clamp(4px,1.2cqi,8px);border-radius:var(--r-md,.5rem);background:color-mix(in srgb,var(--inv-primary) 8%,transparent);border:1px solid color-mix(in srgb,var(--inv-primary) 22%,transparent);box-shadow:0 2px 6px -2px color-mix(in srgb,var(--inv-primary) 10%,transparent)}',
      '.invitation__when-date{font-family:var(--inv-font-display);font-size:clamp(1.05rem,3.8cqi,1.45rem);font-weight:700;line-height:1.15;color:var(--inv-primary);white-space:nowrap}',
      '.invitation__when-sep{display:none}',
      '.invitation__when small{display:block;font-size:clamp(.6rem,1.8cqi,.72rem);letter-spacing:.14em;text-transform:uppercase;opacity:.75;margin-bottom:3px;white-space:nowrap}',
      '.invitation__when-unified{display:flex;flex-direction:column;align-items:center;justify-content:center;width:80%;margin-inline:auto;padding:calc(var(--space-3,.75rem) * 0.8) var(--space-3,.75rem);margin-bottom:var(--space-5,2rem);border-radius:var(--r-md,.5rem);border:1px solid color-mix(in srgb,var(--inv-primary) 30%,transparent);background:color-mix(in srgb,var(--inv-primary) 5%,transparent);text-align:center;gap:var(--space-1,.25rem)}',
      '.invitation__when-unified-date{font-family:var(--inv-font-display);font-size:1.1rem;font-weight:700;color:var(--inv-primary)}',
      '.invitation__when-unified-time{font-family:var(--inv-font-display);font-size:1rem;color:var(--inv-primary);opacity:0.85}',
      '',
      '.invitation__venue{margin-bottom:var(--space-5,2rem);display:flex;flex-direction:column;gap:var(--space-3,1rem);align-items:center;text-align:center}',
      '.invitation__venue-info{display:flex;flex-direction:column;gap:var(--space-2,.5rem);flex-grow:1;align-items:center;text-align:center}',
      '.invitation__venue-name{font-family:var(--inv-font-display);font-size:1.15rem;color:var(--inv-primary)}',
      '.invitation__venue-address{font-size:1.08rem;opacity:.8;line-height:1.45;text-align:center}',
      '.invitation__maps-btn{display:inline-flex;align-items:center;justify-content:center;align-self:center;margin-inline:auto;gap:var(--space-2,.5rem);padding:var(--space-2,.5rem) var(--space-3,.75rem);border-radius:var(--r-pill,999px);border:1px solid color-mix(in srgb,var(--inv-ink) 20%,transparent);background:transparent;color:var(--inv-primary);font-weight:600;font-size:.85rem;transition:all var(--t-fast,.15s) var(--ease,.25s)}',
      '.invitation__maps-btn svg{width:14px;height:14px;flex-shrink:0}',
      '.invitation__maps-btn:hover{background:color-mix(in srgb,var(--inv-primary) 12%,transparent);color:var(--inv-primary);border-color:var(--inv-primary)}',
      '',
      '.invitation__photo{width:128px;height:128px;margin:0 auto var(--space-4,1.5rem);border-radius:50%;object-fit:cover;border:3px solid color-mix(in srgb,var(--inv-secondary) 60%,transparent);box-shadow:0 12px 28px -12px rgba(0,0,0,.4)}',
      '',
      '.invitation__gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:var(--space-2,.5rem);margin-bottom:var(--space-5,2rem);padding:0 var(--space-2,.5rem);max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--inv-primary) transparent}',
      '.invitation__gallery::-webkit-scrollbar{height:6px}',
      '.invitation__gallery::-webkit-scrollbar-track{background:transparent}',
      '.invitation__gallery::-webkit-scrollbar-thumb{background:var(--inv-primary);border-radius:var(--r-pill,999px)}',
      '.invitation__gallery li{list-style:none}',
      '.invitation__gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r-sm,.25rem);border:2px solid color-mix(in srgb,var(--inv-secondary) 40%,transparent);transition:transform var(--t-base,.2s) var(--ease,.25s),box-shadow var(--t-base,.2s) var(--ease,.25s)}',
      '.invitation__gallery img:hover{transform:scale(1.05);box-shadow:0 8px 20px -8px rgba(0,0,0,.3);z-index:1}',
      '',
      '.invitation__music{display:grid;justify-items:center;gap:6px;margin-bottom:var(--space-5,2rem)}',
      '.invitation__music audio{width:100%;max-width:320px;height:38px}',
      '.invitation__music-name{font-size:.72rem;letter-spacing:.04em;opacity:.75;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '',
      '.inv-btn{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:9px 16px;border-radius:var(--r-pill,999px);border:1px solid color-mix(in srgb,var(--inv-primary) 40%,transparent);background:transparent;color:var(--inv-primary);font-size:.82rem;font-weight:600;text-decoration:none;transition:all var(--t-base,.2s) var(--ease,.25s)}',
      '.inv-btn svg{width:15px;height:15px}',
      '.inv-btn:hover{background:var(--inv-primary);color:var(--inv-bg1);transform:translateY(-2px)}',
      '.inv-btn--solid{background:var(--inv-primary);color:var(--inv-bg1);border-color:transparent}',
      '.inv-btn--solid:hover{filter:brightness(1.12)}',
      '.inv-btn--outline{border-color:color-mix(in srgb,var(--inv-ink) 20%,transparent)}',
      '.inv-btn--outline:hover{background:color-mix(in srgb,var(--inv-primary) 12%,transparent);border-color:var(--inv-primary)}',
      '.inv-btn--sm{min-height:32px;padding:6px 12px;font-size:.8rem}',
      '.inv-btn--sm svg{width:14px;height:14px}',
      '',
      '.invitation__actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
      '.invitation__actions .inv-btn{/* Uses base .inv-btn styles */}',
      '',
      '.invitation__footer{margin-top:var(--space-5,2rem);padding-top:var(--space-4,1.5rem);border-top:1px solid color-mix(in srgb,var(--inv-primary) 18%,transparent);font-size:.75rem;opacity:.72}',
      '',
      '/* Per-event design variants */',
      '.invitation--birthday{--inv-font-display:var(--inv-fb);border-radius:var(--r-2xl,1.5rem)}',
      '.invitation--birthday::before{border-style:dashed;border-width:2px;border-radius:var(--r-xl,1rem)}',
      '.invitation--birthday .invitation__names{letter-spacing:-.02em;text-transform:none;font-weight:700}',
      '.invitation--birthday .invitation__names .amp{text-transform:none}',
      '.invitation--birthday .invitation__kicker{letter-spacing:.18em}',
      '.invitation--birthday .invitation__countdown .cd-unit{border-radius:var(--r-lg,.75rem)}',
      '',
      '.invitation--baby-shower{border-radius:200px 200px var(--r-xl,1rem) var(--r-xl,1rem);padding-top:var(--space-8,4rem)}',
      '.invitation--baby-shower::before{border-radius:190px 190px var(--r-lg,.75rem) var(--r-lg,.75rem)}',
      '.invitation--baby-shower .invitation__names{font-style:italic}',
      '',
      '.invitation--house-warming,.invitation--naming-ceremony{border-radius:var(--r-xl,1rem)}',
      '.invitation--house-warming::before,.invitation--naming-ceremony::before{border-radius:180px 180px var(--r-lg,.75rem) var(--r-lg,.75rem);inset:14px 14px 14px}',
      '.invitation--house-warming .invitation__kicker,.invitation--naming-ceremony .invitation__kicker{letter-spacing:.32em}',
      '',
      '.invitation--naming-ceremony .invitation__relation-kicker{font-size:clamp(.6rem,3.1cqi,.74rem);font-weight:600;letter-spacing:clamp(.14em,.8cqi,.28em);text-indent:clamp(.14em,.8cqi,.28em);text-transform:uppercase;color:var(--inv-secondary);margin-bottom:4px}',
      '.invitation--naming-ceremony .invitation__relation{font-family:var(--inv-font-display);font-size:clamp(1rem,4.2cqi,1.3rem);font-weight:600;line-height:1.3;color:color-mix(in srgb,var(--inv-ink) 80%,transparent);margin-bottom:var(--space-3,1rem)}',
      '.invitation--naming-ceremony .invitation__relation span{display:block}',
      '.invitation--naming-ceremony .invitation__relation strong{display:block;color:var(--inv-primary);font-weight:700}',
      '',
      '.invitation--corporate{--inv-font-display:var(--inv-fb);border-radius:var(--r-md,.5rem);text-align:center}',
      '.invitation--corporate::before{border-radius:var(--r-sm,.25rem);border-width:0 0 0 3px;inset:0 0 0 0;border-left-color:var(--inv-secondary)}',
      '.invitation--corporate .invitation__ornament{justify-content:center}',
      '.invitation--corporate .invitation__ornament svg{width:44px;height:44px}',
      '.invitation--corporate .invitation__names{font-size:clamp(1.5rem,1rem+2.4vw,2.1rem);letter-spacing:-.02em}',
      '.invitation--corporate .invitation__rule{justify-content:center}',
      '.invitation--corporate .invitation__rule::before{display:none}',
      '.invitation--corporate .invitation__actions{justify-content:center}',
      '.invitation--corporate .invitation__photo{margin:0 auto var(--space-4,1.5rem);border-radius:var(--r-lg,.75rem)}',
      '',
      '.invitation--anniversary::before{inset:12px;border-width:3px;border-style:double}',
      '',
      '.invitation--festival{background:radial-gradient(120% 90% at 50% 0%,var(--inv-bg2),var(--inv-bg1))}',
      '.invitation--festival::before{border-radius:50%/6%;border-width:2px;inset:10px}',
      '.invitation--festival .invitation__names{font-style:italic}',
      '',
      '.invitation--engagement::before{inset:12px;border-width:2px}',
      '',
      /* Cultural Wedding Decorative Borders */
      '.invitation--tpl-tamil-thirumanam{background:linear-gradient(180deg, #7A1428 0%, #5C0F1F 100%);padding:clamp(4.6rem,15cqi,6.2rem) 10% clamp(5.8rem,18cqi,8.5rem) 10%;--inv-font-display:\'Cinzel\',\'Noto Serif Tamil\',\'Playfair Display\',Georgia,serif;--inv-font-body:\'Cormorant Garamond\',\'Noto Serif Tamil\',\'DM Sans\',serif;font-weight:600;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam::before{inset:clamp(8px,2.8cqi,13px);border:clamp(3px,0.9cqi,4px) solid #C49A45;border-radius:calc(var(--r-xl,1rem) - 4px);box-shadow:inset 0 0 0 2px rgba(255,255,255,0.95),inset 0 0 0 clamp(4px,1.2cqi,6px) #A7792D,inset 0 0 0 clamp(6px,1.8cqi,8px) rgba(196,154,69,0.6),0 0 16px rgba(196,154,69,0.28)}',
      '.invitation--tpl-tamil-thirumanam::after{content:"";position:absolute;inset:clamp(14px,4.8cqi,20px);border:1px solid rgba(196,154,69,0.55);border-radius:calc(var(--r-lg,0.75rem) - 4px);pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg width=\'32\' height=\'32\' viewBox=\'0 0 32 32\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M16 2L18.5 10.5L27 13L18.5 15.5L16 24L13.5 15.5L5 13L13.5 10.5L16 2Z\' fill=\'%23C49A45\' fill-opacity=\'0.5\'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg width=\'32\' height=\'32\' viewBox=\'0 0 32 32\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M16 2L18.5 10.5L27 13L18.5 15.5L16 24L13.5 15.5L5 13L13.5 10.5L16 2Z\' fill=\'%23C49A45\' fill-opacity=\'0.5\'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg width=\'32\' height=\'32\' viewBox=\'0 0 32 32\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M16 2L18.5 10.5L27 13L18.5 15.5L16 24L13.5 15.5L5 13L13.5 10.5L16 2Z\' fill=\'%23C49A45\' fill-opacity=\'0.5\'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg width=\'32\' height=\'32\' viewBox=\'0 0 32 32\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M16 2L18.5 10.5L27 13L18.5 15.5L16 24L13.5 15.5L5 13L13.5 10.5L16 2Z\' fill=\'%23C49A45\' fill-opacity=\'0.5\'/%3E%3C/svg%3E");background-position:top left,top right,bottom left,bottom right;background-repeat:no-repeat;background-size:clamp(26px,8.5cqi,38px) clamp(26px,8.5cqi,38px)}',
      '.invitation--tpl-tamil-thirumanam .invitation__person-name{font-size:clamp(1.22rem,5.2cqi,1.72rem);font-weight:700;letter-spacing:0.03em;color:#FFFFFF;line-height:1.25;white-space:normal;word-break:normal;overflow-wrap:normal;hyphens:none;text-shadow:0 2px 4px rgba(0,0,0,0.85)}',
      '.invitation--tpl-tamil-thirumanam .invitation__person--groom .invitation__person-name{text-align:right}',
      '.invitation--tpl-tamil-thirumanam .invitation__person--groom .invitation__person-parents{font-size:clamp(0.93rem,3.3cqi,1.17rem);text-align:right;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__person--groom .invitation__person-parents span,.invitation--tpl-tamil-thirumanam .invitation__person--groom .invitation__person-parents strong{color:#FFFFFF;opacity:1}',
      '.invitation--tpl-tamil-thirumanam .invitation__person--bride .invitation__person-name{text-align:left}',
      '.invitation--tpl-tamil-thirumanam .invitation__person--bride .invitation__person-parents{font-size:clamp(0.93rem,3.3cqi,1.17rem);text-align:left;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__person--bride .invitation__person-parents span,.invitation--tpl-tamil-thirumanam .invitation__person--bride .invitation__person-parents strong{color:#FFFFFF;opacity:1}',
      '.invitation--tpl-tamil-thirumanam .invitation__person-parents{font-size:clamp(0.93rem,3.3cqi,1.17rem);margin-top:4px;line-height:1.35;white-space:normal;font-weight:600;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__person-parents span{font-weight:700;opacity:1;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__person-parents strong{font-weight:700;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__couple{gap:0 4px}',
      '.invitation--tpl-tamil-thirumanam .invitation__couple-sep{margin-inline:clamp(6px,1.5cqi,12px)}',
      '.invitation--tpl-tamil-thirumanam .invitation__couple-sep .amp{color:#FFFFFF;font-size:clamp(1.3rem,5.2cqi,1.8rem);line-height:1;font-weight:700}',
      '.invitation--tpl-tamil-thirumanam .invitation__photo{width:clamp(105px,25cqi,135px);height:clamp(105px,25cqi,135px);margin:0.8rem auto 1.2rem;border-radius:50%;object-fit:cover;border:3px solid #FFFFFF;box-shadow:0 0 0 3px #5C0F1F,0 0 0 5.5px #C49A45,0 8px 24px rgba(0,0,0,0.5)}',
      '.invitation--tpl-tamil-thirumanam .invitation__additional-title{color:#FFFFFF;font-size:1.18rem;letter-spacing:0.16em;margin-top:0.8rem;margin-bottom:0.4rem;line-height:1.45;font-weight:700}',
      '.invitation--tpl-tamil-thirumanam .invitation__additional-subtitle{font-size:1.15rem;margin-bottom:0.8rem;line-height:1.4;font-weight:600;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__save-date{font-weight:700;color:#FFFFFF;letter-spacing:0.14em}',
      '.invitation--tpl-tamil-thirumanam .invitation__when-unified{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);border-radius:var(--r-xl,1rem);box-shadow:0 8px 24px rgba(0,0,0,0.45);padding:clamp(18px,4.5cqi,26px);margin-top:0.6rem;margin-bottom:var(--space-5)}',
      '.invitation--tpl-tamil-thirumanam .invitation__when-unified-date{font-size:clamp(0.96rem,4.2cqi,1.3rem);letter-spacing:0.06em;font-weight:700;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__when-unified-time{font-size:clamp(0.86rem,3.6cqi,1.05rem);letter-spacing:0.08em;font-weight:600;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__chapter-title{font-weight:700;color:#FFFFFF;letter-spacing:0.12em}',
      '.invitation--tpl-tamil-thirumanam .invitation__message{font-size:1.15rem;line-height:1.65;white-space:pre-line;font-weight:600;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__countdown{gap:10px;margin-bottom:var(--space-6)}',
      '.invitation--tpl-tamil-thirumanam .invitation__countdown .cd-unit{background:linear-gradient(145deg, rgba(80,12,26,0.88), rgba(45,6,14,0.96));border:1.2px solid rgba(255,255,255,0.45);border-radius:var(--r-md,.5rem);box-shadow:0 4px 12px rgba(0,0,0,0.4);padding:10px 4px}',
      '.invitation--tpl-tamil-thirumanam .invitation__countdown .cd-value{color:#FFFFFF;font-weight:700}',
      '.invitation--tpl-tamil-thirumanam .invitation__countdown .cd-label{color:#FFFFFF;letter-spacing:0.14em;font-weight:600}',
      '.invitation--tpl-tamil-thirumanam .invitation__venue-title{font-weight:700;color:#FFFFFF;letter-spacing:0.14em}',
      '.invitation--tpl-tamil-thirumanam .invitation__venue{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);border-radius:var(--r-xl,1rem);box-shadow:0 8px 24px rgba(0,0,0,0.45);padding:clamp(18px,4.5cqi,26px);margin-top:0.6rem;margin-bottom:var(--space-6)}',
      '.invitation--tpl-tamil-thirumanam .invitation__venue img{border-radius:var(--r-lg,.75rem);border:1.5px solid rgba(255,255,255,0.4);box-shadow:0 6px 18px rgba(0,0,0,0.5)}',
      '.invitation--tpl-tamil-thirumanam .invitation__venue-name strong{font-weight:700;color:#FFFFFF;font-size:1.25rem}',
      '.invitation--tpl-tamil-thirumanam .invitation__venue-address{font-size:1.05rem;font-weight:600;color:#FFFFFF;opacity:0.95;line-height:1.5;text-align:center}',
      '.invitation--tpl-tamil-thirumanam .invitation__maps-btn{align-self:center;margin-inline:auto;justify-content:center;background:linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12));border:1.5px solid #FFFFFF;color:#FFFFFF;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.4);padding:var(--space-2) var(--space-4)}',
      '.invitation--tpl-tamil-thirumanam .invitation__events-title{color:#FFFFFF;font-weight:700;letter-spacing:0.14em}',
      '.invitation--tpl-tamil-thirumanam .invitation__events-title::before,.invitation--tpl-tamil-thirumanam .invitation__events-title::after{background:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__events-grid{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);border-radius:var(--r-xl,1rem);box-shadow:0 8px 24px rgba(0,0,0,0.45);margin-bottom:var(--space-6)}',
      '.invitation--tpl-tamil-thirumanam .invitation__event-card{border-right:1px solid rgba(255,255,255,0.25);padding:8px 2px}',
      '.invitation--tpl-tamil-thirumanam .invitation__event-card:last-child{border-right:none}',
      '.invitation--tpl-tamil-thirumanam .invitation__event-title{color:#FFFFFF;font-weight:700}',
      '.invitation--tpl-tamil-thirumanam .invitation__event-weekday{color:#FFFFFF;font-weight:600;font-size:9.5px;line-height:1.2}',
      '.invitation--tpl-tamil-thirumanam .invitation__event-date{color:#FFFFFF;font-weight:600;font-size:9px;line-height:1.2}',
      '.invitation--tpl-tamil-thirumanam .invitation__event-time{color:#FFFFFF;font-weight:700;font-size:9.5px;line-height:1.2;margin-top:2px}',
      '.invitation--tpl-tamil-thirumanam .invitation__gallery-title{color:#FFFFFF;font-weight:700;letter-spacing:0.14em}',
      '.invitation--tpl-tamil-thirumanam .invitation__gallery img{border-radius:var(--r-md,.5rem);border:1.5px solid rgba(255,255,255,0.45);box-shadow:0 6px 16px rgba(0,0,0,0.5)}',
      '.invitation--tpl-tamil-thirumanam .invitation__blessings-heading{font-weight:700;color:#FFFFFF;letter-spacing:0.16em}',
      '.invitation--tpl-tamil-thirumanam .invitation__blessings-side strong{font-weight:700;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__blessings-side p{font-weight:600;color:#FFFFFF}',
      '.invitation--tpl-tamil-thirumanam .invitation__blessings-subheading{font-weight:700!important;color:#FFFFFF!important;letter-spacing:0.14em}',
      '.invitation--tpl-tamil-thirumanam .invitation__blessings-msg{font-weight:500!important;color:#FFFFFF!important;opacity:0.95!important}',
      '.invitation--tpl-tamil-thirumanam .invitation__actions .inv-btn{background:linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12));border:1.5px solid #FFFFFF;color:#FFFFFF;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.4)}',
      '.invitation--tpl-tamil-thirumanam .invitation__brand{margin-top:var(--space-4);margin-bottom:clamp(2rem,6cqi,3.5rem);font-size:0.74rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.8)}',
      '.invitation__backdrop{position:absolute;inset:0;pointer-events:none;z-index:0!important;overflow:hidden;border-radius:inherit}',
      '',
      '.invitation--tpl-telugu-pelli{background:var(--inv-bg1,#FAF5EC);padding:clamp(4.6rem,15cqi,6.2rem) 12% 1.25rem 12%;--inv-font-display:\'Playfair Display\',\'Noto Serif Telugu\',Georgia,serif;--inv-font-body:\'Cormorant Garamond\',\'Noto Serif Telugu\',\'DM Sans\',serif;font-weight:600}',
      '.invitation--tpl-telugu-pelli::before{inset:clamp(8px,2.8cqi,13px);border:clamp(3px,0.9cqi,4px) solid #B8860B;border-radius:calc(var(--r-xl,1rem) - 4px);box-shadow:inset 0 0 0 2px rgba(250,245,236,0.95),inset 0 0 0 clamp(4px,1.2cqi,6px) #D4AF37,inset 0 0 0 clamp(6px,1.8cqi,8px) rgba(184,134,11,0.6),0 0 16px rgba(184,134,11,0.28)}',
      '.invitation--tpl-telugu-pelli::after{content:"";position:absolute;inset:clamp(14px,4.8cqi,20px);border:1px solid rgba(184,134,11,0.42);border-radius:calc(var(--r-lg,.75rem) - 4px);pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cpath d=%27M3,3 L24,3 M3,3 L3,24 M3,12 C10,12 12,10 12,3 M3,18 C16,18 18,16 18,3 M8,8 Q16,4 16,16 Q4,16 8,8 Z%27 stroke=%27%23B8860B%27 stroke-width=%271.2%27 opacity=%270.92%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.6%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%23B8860B%27/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,1) translate(-44,0)%27%3E%3Cpath d=%27M3,3 L24,3 M3,3 L3,24 M3,12 C10,12 12,10 12,3 M3,18 C16,18 18,16 18,3 M8,8 Q16,4 16,16 Q4,16 8,8 Z%27 stroke=%27%23B8860B%27 stroke-width=%271.2%27 opacity=%270.92%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.6%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%23B8860B%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(1,-1) translate(0,-44)%27%3E%3Cpath d=%27M3,3 L24,3 M3,3 L3,24 M3,12 C10,12 12,10 12,3 M3,18 C16,18 18,16 18,3 M8,8 Q16,4 16,16 Q4,16 8,8 Z%27 stroke=%27%23B8860B%27 stroke-width=%271.2%27 opacity=%270.92%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.6%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%23B8860B%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,-1) translate(-44,-44)%27%3E%3Cpath d=%27M3,3 L24,3 M3,3 L3,24 M3,12 C10,12 12,10 12,3 M3,18 C16,18 18,16 18,3 M8,8 Q16,4 16,16 Q4,16 8,8 Z%27 stroke=%27%23B8860B%27 stroke-width=%271.2%27 opacity=%270.92%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.6%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%23B8860B%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%23B8860B%27/%3E%3C/g%3E%3C/svg%3E");background-position:top left,top right,bottom left,bottom right;background-repeat:no-repeat;background-size:clamp(26px,8.5cqi,38px) clamp(26px,8.5cqi,38px)}',
      '',
      '.invitation--tpl-telugu-pelli .invitation__person-name{font-size:clamp(1.1rem,5.2cqi,1.87rem);font-weight:700;letter-spacing:0.03em;color:#7A1C28;line-height:1.2;white-space:normal;word-break:normal;overflow-wrap:normal;hyphens:none}',
      '.invitation--tpl-telugu-pelli .invitation__footer{margin-bottom:46cqi}',
      '.invitation--tpl-telugu-pelli .invitation__person--groom .invitation__person-name{text-align:right}',
      '.invitation--tpl-telugu-pelli .invitation__person--groom .invitation__person-parents{font-size:clamp(0.93rem,3.3cqi,1.17rem);text-align:right;color:#000000}',
      '.invitation--tpl-telugu-pelli .invitation__person--groom .invitation__person-parents span,.invitation--tpl-telugu-pelli .invitation__person--groom .invitation__person-parents strong{color:#000000;opacity:1}',
      '.invitation--tpl-telugu-pelli .invitation__person--bride .invitation__person-name{text-align:left}',
      '.invitation--tpl-telugu-pelli .invitation__person--bride .invitation__person-parents{font-size:clamp(0.93rem,3.3cqi,1.17rem);text-align:left;color:#000000}',
      '.invitation--tpl-telugu-pelli .invitation__person--bride .invitation__person-parents span,.invitation--tpl-telugu-pelli .invitation__person--bride .invitation__person-parents strong{color:#000000;opacity:1}',
      '.invitation--tpl-telugu-pelli .invitation__person-parents{font-size:clamp(0.93rem,3.3cqi,1.17rem);margin-top:4px;line-height:1.35;white-space:normal;font-weight:600;color:#000000}',
      '.invitation--tpl-telugu-pelli .invitation__person-parents span{font-weight:700;opacity:1;color:#000000}',
      '.invitation--tpl-telugu-pelli .invitation__person-parents strong{font-weight:700;color:#000000}',
      '.invitation--tpl-telugu-pelli .invitation__couple{gap:0 4px}',
      '.invitation--tpl-telugu-pelli .invitation__couple-sep .amp{color:#B8860B;font-size:clamp(1.2rem,4.8cqi,1.6rem);line-height:1;font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__additional-title{color:#7A1C28;font-size:1.15rem;letter-spacing:0.14em;margin-top:calc(0.8rem + 25px);margin-bottom:0.4rem;line-height:1.45;font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__additional-subtitle{font-size:1.15rem;margin-bottom:0.8rem;line-height:1.4;font-weight:600;color:#000000}',
      '.invitation--tpl-telugu-pelli .invitation__save-date{font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__when-unified-date{font-size:clamp(0.92rem,4cqi,1.25rem);letter-spacing:0.05em;font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__when-unified-time{font-size:clamp(0.82rem,3.4cqi,1rem);letter-spacing:0.08em;font-weight:700;opacity:0.95}',
      '.invitation--tpl-telugu-pelli .invitation__chapter-title{font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__message{font-size:1.15rem;line-height:1.65;white-space:pre-line;font-weight:600;color:#3D2E1E}',
      '.invitation--tpl-telugu-pelli .invitation__venue-title{font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__venue-name strong{font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__venue-address{font-size:clamp(0.95rem,3.53cqi,1.10rem);font-weight:600;color:#3D2E1E;opacity:0.95;line-height:1.45;text-align:center}',
      '.invitation--tpl-telugu-pelli .invitation__maps-btn{align-self:center;margin-inline:auto;justify-content:center}',
      '.invitation--tpl-telugu-pelli .invitation__blessings-heading{font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__blessings-side strong{font-weight:700}',
      '.invitation--tpl-telugu-pelli .invitation__blessings-side p{font-weight:600;color:#3D2E1E}',
      '.invitation--tpl-telugu-pelli .invitation__blessings-subheading{font-weight:700!important}',
      '.invitation--tpl-telugu-pelli .invitation__blessings-msg{font-weight:600!important;color:#3D2E1E!important;opacity:0.95!important}',
      '',
      '.invitation--tpl-kasavu-gold-border::before{inset:clamp(7px,2.6cqi,12px);border:3px double #DCB055;border-radius:calc(var(--r-xl,1rem) - 3px);box-shadow:inset 0 0 0 1.5px rgba(220,176,85,0.7),inset 0 0 0 4px rgba(14,58,42,0.9),inset 0 0 0 5.5px #DCB055,0 0 10px rgba(220,176,85,0.22)}',
      '.invitation--tpl-kasavu-gold-border::after{content:"";position:absolute;inset:clamp(15px,5cqi,22px);border:1px solid rgba(220,176,85,0.48);border-radius:calc(var(--r-lg,.75rem) - 4px);pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cpath d=%27M2,2 L24,2 M2,2 L2,24 M2,7 L7,2 M2,13 L13,2 M2,19 L19,2 M2,25 L25,2%27 stroke=%27%23DCB055%27 stroke-width=%271.2%27 opacity=%270.88%27/%3E%3Crect x=%272%27 y=%272%27 width=%275%27 height=%275%27 fill=%27%23DCB055%27 opacity=%270.75%27/%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%23DCB055%27/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,1) translate(-44,0)%27%3E%3Cpath d=%27M2,2 L24,2 M2,2 L2,24 M2,7 L7,2 M2,13 L13,2 M2,19 L19,2 M2,25 L25,2%27 stroke=%27%23DCB055%27 stroke-width=%271.2%27 opacity=%270.88%27/%3E%3Crect x=%272%27 y=%272%27 width=%275%27 height=%275%27 fill=%27%23DCB055%27 opacity=%270.75%27/%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%23DCB055%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(1,-1) translate(0,-44)%27%3E%3Cpath d=%27M2,2 L24,2 M2,2 L2,24 M2,7 L7,2 M2,13 L13,2 M2,19 L19,2 M2,25 L25,2%27 stroke=%27%23DCB055%27 stroke-width=%271.2%27 opacity=%270.88%27/%3E%3Crect x=%272%27 y=%272%27 width=%275%27 height=%275%27 fill=%27%23DCB055%27 opacity=%270.75%27/%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%23DCB055%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,-1) translate(-44,-44)%27%3E%3Cpath d=%27M2,2 L24,2 M2,2 L2,24 M2,7 L7,2 M2,13 L13,2 M2,19 L19,2 M2,25 L25,2%27 stroke=%27%23DCB055%27 stroke-width=%271.2%27 opacity=%270.88%27/%3E%3Crect x=%272%27 y=%272%27 width=%275%27 height=%275%27 fill=%27%23DCB055%27 opacity=%270.75%27/%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%23DCB055%27/%3E%3C/g%3E%3C/svg%3E");background-position:top left,top right,bottom left,bottom right;background-repeat:no-repeat;background-size:clamp(24px,8cqi,34px) clamp(24px,8cqi,34px)}',
      '',
      '.invitation--tpl-bengali-alpona::before{inset:clamp(8px,2.8cqi,13px);border:1.5px solid #B8862F;border-radius:calc(var(--r-xl,1rem) - 4px);box-shadow:inset 0 0 0 2px rgba(253,247,239,0.95),inset 0 0 0 3px rgba(122,18,32,0.35),0 0 8px rgba(184,134,47,0.18)}',
      '.invitation--tpl-bengali-alpona::after{content:"";position:absolute;inset:clamp(14px,4.8cqi,20px);border:1px solid rgba(122,18,32,0.28);border-radius:calc(var(--r-lg,.75rem) - 4px);pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cpath d=%27M3,3 C12,3 22,8 22,18 C22,25 13,25 9,19 C6,14 14,9 18,3 M3,3 L3,24 M3,3 L24,3%27 stroke=%27%23B8862F%27 stroke-width=%271.2%27 opacity=%270.9%27/%3E%3Cpath d=%27M7,7 C11,11 16,11 16,16%27 stroke=%27%237A1220%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.5%27 fill=%27%23B8862F%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%237A1220%27/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,1) translate(-44,0)%27%3E%3Cpath d=%27M3,3 C12,3 22,8 22,18 C22,25 13,25 9,19 C6,14 14,9 18,3 M3,3 L3,24 M3,3 L24,3%27 stroke=%27%23B8862F%27 stroke-width=%271.2%27 opacity=%270.9%27/%3E%3Cpath d=%27M7,7 C11,11 16,11 16,16%27 stroke=%27%237A1220%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.5%27 fill=%27%23B8862F%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%237A1220%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(1,-1) translate(0,-44)%27%3E%3Cpath d=%27M3,3 C12,3 22,8 22,18 C22,25 13,25 9,19 C6,14 14,9 18,3 M3,3 L3,24 M3,3 L24,3%27 stroke=%27%23B8862F%27 stroke-width=%271.2%27 opacity=%270.9%27/%3E%3Cpath d=%27M7,7 C11,11 16,11 16,16%27 stroke=%27%237A1220%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.5%27 fill=%27%23B8862F%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%237A1220%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,-1) translate(-44,-44)%27%3E%3Cpath d=%27M3,3 C12,3 22,8 22,18 C22,25 13,25 9,19 C6,14 14,9 18,3 M3,3 L3,24 M3,3 L24,3%27 stroke=%27%23B8862F%27 stroke-width=%271.2%27 opacity=%270.9%27/%3E%3Cpath d=%27M7,7 C11,11 16,11 16,16%27 stroke=%27%237A1220%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3Ccircle cx=%273%27 cy=%273%27 r=%272%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%271.5%27 fill=%27%23B8862F%27/%3E%3Ccircle cx=%2720%27 cy=%273%27 r=%271%27 fill=%27%237A1220%27/%3E%3Ccircle cx=%273%27 cy=%2720%27 r=%271%27 fill=%27%237A1220%27/%3E%3C/g%3E%3C/svg%3E");background-position:top left,top right,bottom left,bottom right;background-repeat:no-repeat;background-size:clamp(26px,8.5cqi,38px) clamp(26px,8.5cqi,38px)}',
      '',
      '.invitation--tpl-bandhani-bloom::before{inset:clamp(8px,2.8cqi,13px);border:2px dashed #C4802A;border-radius:calc(var(--r-xl,1rem) - 4px);box-shadow:inset 0 0 0 2px rgba(253,234,242,0.95),inset 0 0 0 3px rgba(196,128,42,0.4),0 0 8px rgba(196,128,42,0.18)}',
      '.invitation--tpl-bandhani-bloom::after{content:"";position:absolute;inset:clamp(14px,4.8cqi,20px);border:1px solid rgba(90,18,48,0.3);border-radius:calc(var(--r-lg,.75rem) - 4px);pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Ccircle cx=%277%27 cy=%277%27 r=%273.5%27 stroke=%27%23C4802A%27 stroke-width=%271.2%27/%3E%3Ccircle cx=%277%27 cy=%277%27 r=%271.5%27 fill=%27%235A1230%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%271.8%27 stroke=%27%23C4802A%27 stroke-width=%270.9%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%270.8%27 fill=%27%235A1230%27/%3E%3Cpath d=%27M2,2 L22,2 M2,2 L2,22%27 stroke=%27%23C4802A%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,1) translate(-44,0)%27%3E%3Ccircle cx=%277%27 cy=%277%27 r=%273.5%27 stroke=%27%23C4802A%27 stroke-width=%271.2%27/%3E%3Ccircle cx=%277%27 cy=%277%27 r=%271.5%27 fill=%27%235A1230%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%271.8%27 stroke=%27%23C4802A%27 stroke-width=%270.9%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%270.8%27 fill=%27%235A1230%27/%3E%3Cpath d=%27M2,2 L22,2 M2,2 L2,22%27 stroke=%27%23C4802A%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(1,-1) translate(0,-44)%27%3E%3Ccircle cx=%277%27 cy=%277%27 r=%273.5%27 stroke=%27%23C4802A%27 stroke-width=%271.2%27/%3E%3Ccircle cx=%277%27 cy=%277%27 r=%271.5%27 fill=%27%235A1230%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%271.8%27 stroke=%27%23C4802A%27 stroke-width=%270.9%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%270.8%27 fill=%27%235A1230%27/%3E%3Cpath d=%27M2,2 L22,2 M2,2 L2,22%27 stroke=%27%23C4802A%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2744%27 height=%2744%27 viewBox=%270 0 44 44%27 fill=%27none%27%3E%3Cg transform=%27scale(-1,-1) translate(-44,-44)%27%3E%3Ccircle cx=%277%27 cy=%277%27 r=%273.5%27 stroke=%27%23C4802A%27 stroke-width=%271.2%27/%3E%3Ccircle cx=%277%27 cy=%277%27 r=%271.5%27 fill=%27%235A1230%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%2718%27 cy=%277%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%272.2%27 stroke=%27%23C4802A%27 stroke-width=%271%27/%3E%3Ccircle cx=%277%27 cy=%2718%27 r=%270.9%27 fill=%27%23C4802A%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%271.8%27 stroke=%27%23C4802A%27 stroke-width=%270.9%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%270.8%27 fill=%27%235A1230%27/%3E%3Cpath d=%27M2,2 L22,2 M2,2 L2,22%27 stroke=%27%23C4802A%27 stroke-width=%271%27 opacity=%270.8%27/%3E%3C/g%3E%3C/svg%3E");background-position:top left,top right,bottom left,bottom right;background-repeat:no-repeat;background-size:clamp(26px,8.5cqi,38px) clamp(26px,8.5cqi,38px)}',
      '',
      '.invitation__backdrop{position:absolute;inset:0;pointer-events:none;z-index:0!important;overflow:hidden;border-radius:inherit}',
      '.invitation--tpl-telugu-pelli .invitation__ornament{display:none!important}',
      '.invitation__backdrop--telugu-pelli{position:absolute;inset:0;pointer-events:none;user-select:none;overflow:hidden;border-radius:inherit;z-index:0!important}',
      '.invitation__backdrop--telugu-pelli .inv-layer{position:absolute;pointer-events:none;user-select:none;-webkit-user-drag:none;object-fit:contain}',
      '.inv-layer--lake-bottom{bottom:0;left:0;right:0;width:100%;height:auto;aspect-ratio:1024/576;object-fit:cover;object-position:center bottom;z-index:1;opacity:0.88;-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,1) 0%,rgba(0,0,0,0.95) 55%,rgba(0,0,0,0) 100%);mask-image:linear-gradient(to top,rgba(0,0,0,1) 0%,rgba(0,0,0,0.95) 55%,rgba(0,0,0,0) 100%)}',
      '.inv-layer--temple-left{bottom:0;left:0;width:clamp(176px,39cqi,252px);height:auto;z-index:2;opacity:0.92}',
      '.inv-layer--temple-right{bottom:0;right:0;width:clamp(176px,39cqi,252px);height:auto;z-index:2;opacity:0.92}',
      '.inv-layer--frame{top:0;left:0;right:0;width:100%;height:auto;z-index:3;opacity:0.92;-webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 45%,rgba(0,0,0,0) 55%);mask-image:linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 45%,rgba(0,0,0,0) 55%)}',
      '.invitation__backdrop--telugu-pelli .inv-layer--flower-left{top:30cqi;left:0.5%;width:30%;height:auto;z-index:6;opacity:0.95}',
      '.invitation__backdrop--telugu-pelli .inv-layer--flower-right{top:30cqi;right:0.5%;width:30%;height:auto;z-index:6;opacity:0.95}',
      '.invitation__backdrop--telugu-pelli .inv-layer--flower-top-left{top:0;left:-1%;width:46.5%;height:auto;z-index:5}',
      '.invitation__backdrop--telugu-pelli .inv-layer--flower-top-right{top:0;right:0;width:45%;height:auto;z-index:5}',
      '.inv-layer--bells-left{top:clamp(44px,9.5cqi,70px);left:clamp(8px,2.2cqi,18px);width:clamp(34px,7.8cqi,50px);height:auto;z-index:6}',
      '.inv-layer--bells-right{top:clamp(44px,9.5cqi,70px);right:clamp(8px,2.2cqi,18px);width:clamp(34px,7.8cqi,50px);height:auto;z-index:6}',
      '.inv-layer--lotus-bottom{bottom:0;left:50%;transform:translateX(-50%);width:clamp(76px,17cqi,120px);height:auto;z-index:7;opacity:0.95}',
      '.inv-layer--vinayaka{top:clamp(10px,2.5cqi,22px);left:50%;transform:translateX(-50%);width:clamp(42px,9cqi,62px);height:auto;z-index:10;opacity:1}',
      '.inv-layer--elephant-left{top:auto!important;bottom:0;left:clamp(0px,0.5cqi,6px);width:clamp(165px,35cqi,232px);height:auto;z-index:4}',
      '.inv-layer--elephant-right{top:auto!important;bottom:0;right:clamp(0px,0.5cqi,6px);width:clamp(165px,35cqi,232px);height:auto;z-index:4}',
      '',
      '.invitation__backdrop--tamil-thirumanam{position:absolute;inset:0;pointer-events:none;user-select:none;overflow:hidden;border-radius:inherit;z-index:0!important}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer{position:absolute;pointer-events:none;user-select:none;-webkit-user-drag:none;object-fit:contain}',
      '.inv-layer--toran-top{width:92%;height:auto;left:4%;top:0%;z-index:3;opacity:0.95}',
      '.inv-layer--gopuram-arch{width:62%;height:auto;left:19%;top:1%;z-index:3;opacity:0.94;filter:drop-shadow(0 0.4vw 1.2vw rgba(106,27,41,0.25))}',
      '.inv-layer--pillar-left{width:18%;height:auto;left:0%;bottom:0%;z-index:4;opacity:0.95;object-position:bottom left}',
      '.inv-layer--pillar-right{width:18%;height:auto;right:0%;bottom:0%;z-index:4;opacity:0.95;object-position:bottom right}',
      '.inv-layer--flower-top-left{width:28%;height:auto;left:0%;top:0%;z-index:5;opacity:0.95}',
      '.inv-layer--flower-top-right{width:28%;height:auto;right:0%;top:0%;z-index:5;opacity:0.95}',
      '.inv-layer--garland-left{width:8%;height:auto;left:1%;top:0%;z-index:5;opacity:0.95}',
      '.inv-layer--garland-right{width:8%;height:auto;right:1%;top:0%;z-index:5;opacity:0.95}',
      '.inv-layer--uruli-bottom{width:32%;height:auto;left:34%;bottom:1%;z-index:6;opacity:0.98}',
      '.inv-layer--kuthuvilakku-left{width:15%;height:auto;left:2%;bottom:0%;z-index:6;opacity:0.98}',
      '.inv-layer--kuthuvilakku-right{width:15%;height:auto;right:2%;bottom:0%;z-index:6;opacity:0.98}',
      '.inv-layer--peacock-left{width:22%;height:auto;left:5%;bottom:1.5%;z-index:6;opacity:0.98}',
      '.inv-layer--peacock-right{width:22%;height:auto;right:5%;bottom:1.5%;z-index:6;opacity:0.98}',
      '.inv-layer--apex-murugan{width:7.5%;height:auto;left:46.25%;top:1%;z-index:10;opacity:1}',
      '',,
      '.invitation__ai-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;z-index:0;pointer-events:none;border-radius:inherit;opacity:0.96}',
      '',
      '.invitation__countdown{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:var(--space-5,2rem)}',
      '.invitation__countdown .cd-unit{padding:10px 4px;border-radius:var(--r-md,.5rem);background:color-mix(in srgb,var(--inv-primary) 10%,transparent);border:1px solid color-mix(in srgb,var(--inv-primary) 18%,transparent)}',
      '.invitation__countdown .cd-value{display:block;font-family:var(--inv-font-display);font-size:1.5rem;font-weight:700;line-height:1.1;color:var(--inv-primary);font-variant-numeric:tabular-nums}',
      '.invitation__countdown .cd-label{font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;opacity:.72}',
      '',
      '.invitation__extra{margin-bottom:var(--space-5,2rem);padding:var(--space-3,1rem);border:1px solid color-mix(in srgb,var(--inv-primary) 22%,transparent);border-radius:var(--r-md,.5rem);background:color-mix(in srgb,var(--inv-primary) 6%,transparent)}',
      '.invitation__extra small{display:block;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;opacity:.7;margin-bottom:4px}',
      '.invitation__extra p{margin:0;font-size:.88rem;line-height:1.7;color:color-mix(in srgb,var(--inv-ink) 82%,transparent)}',
      '',
      /* Tamil Thirumanam premium classic (mirrors css/style.css) */
      '.invitation--tpl-tamil-thirumanam{--tt-gold: #E2B865;--tt-gold-deep: #B8893A;--tt-ivory: #FBEFD9;background: radial-gradient(ellipse 85% 38% at 50% 14%,rgba(226,184,101,0.20),transparent 70%),radial-gradient(ellipse 90% 30% at 50% 100%,rgba(226,184,101,0.14),transparent 70%),url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'36\' height=\'36\' viewBox=\'0 0 36 36\'%3E%3Cg fill=\'%23E2B865\' fill-opacity=\'0.07\'%3E%3Cpath d=\'M18 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2z\'/%3E%3Ccircle cx=\'0\' cy=\'0\' r=\'1.4\'/%3E%3Ccircle cx=\'36\' cy=\'0\' r=\'1.4\'/%3E%3Ccircle cx=\'0\' cy=\'36\' r=\'1.4\'/%3E%3Ccircle cx=\'36\' cy=\'36\' r=\'1.4\'/%3E%3C/g%3E%3C/svg%3E"),linear-gradient(180deg,#74112A 0%,#5A0C1D 55%,#430815 100%);padding: clamp(9.5rem,37cqi,13rem) 8% clamp(9rem,36cqi,12.5rem) 8%;color: var(--tt-ivory)}',
      '.invitation--tpl-tamil-thirumanam::before{border: 1.5px solid var(--tt-gold);box-shadow: inset 0 0 0 4px rgba(90,12,29,0.9),inset 0 0 0 5px var(--tt-gold-deep),0 0 18px rgba(226,184,101,0.25)}',
      '.invitation--tpl-tamil-thirumanam::after{border-color: rgba(226,184,101,0.35);background-image: none}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--corner-tl,.invitation__backdrop--tamil-thirumanam .inv-layer--corner-tr,.invitation__backdrop--tamil-thirumanam .inv-layer--corner-bl,.invitation__backdrop--tamil-thirumanam .inv-layer--corner-br{width: min(24%,130px);height: auto;z-index: 3;filter: drop-shadow(0 2px 3px rgba(0,0,0,0.45))}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--corner-tl{top: 3.6cqi;left: 3.6cqi}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--corner-tr{top: 3.6cqi;right: 3.6cqi;transform: scaleX(-1)}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--corner-bl{bottom: 3.6cqi;left: 3.6cqi;transform: scaleY(-1)}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--corner-br{bottom: 3.6cqi;right: 3.6cqi;transform: scale(-1,-1)}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--gopuram-crest{width: min(30%,150px);height: auto;left: 50%;translate: -50% 0;top: min(6cqi,28px);z-index: 5;filter: drop-shadow(0 0 14px rgba(226,184,101,0.35)) drop-shadow(0 3px 4px rgba(0,0,0,0.5))}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--peacock-lamp{width: min(64%,330px);height: auto;left: 50%;translate: -50% 0;bottom: min(7cqi,30px);z-index: 5;filter: drop-shadow(0 0 12px rgba(226,184,101,0.3)) drop-shadow(0 3px 4px rgba(0,0,0,0.5))}',
      '.invitation--tpl-tamil-thirumanam .invitation__rule--tamil{display: flex;justify-content: center;margin: var(--space-5) auto var(--space-3)}',
      '.invitation--tpl-tamil-thirumanam .invitation__rule--tamil::before,.invitation--tpl-tamil-thirumanam .invitation__rule--tamil::after{display: none}',
      '.invitation--tpl-tamil-thirumanam .invitation__rule--tamil img{width: 78%;max-width: 340px;height: auto}',
      '.invitation--tpl-tamil-thirumanam .invitation__additional-title,.invitation--tpl-tamil-thirumanam .invitation__save-date,.invitation--tpl-tamil-thirumanam .invitation__chapter-title,.invitation--tpl-tamil-thirumanam .invitation__venue-title,.invitation--tpl-tamil-thirumanam .invitation__events-title,.invitation--tpl-tamil-thirumanam .invitation__gallery-title,.invitation--tpl-tamil-thirumanam .invitation__blessings-heading,.invitation--tpl-tamil-thirumanam .invitation__blessings-subheading{color: var(--tt-gold) !important;text-shadow: 0 1px 2px rgba(0,0,0,0.55)}',
      '.invitation--tpl-tamil-thirumanam .invitation__additional-title{font-size: clamp(0.82rem,3.4cqi,1.02rem);letter-spacing: 0.2em;line-height: 1.6}',
      '.invitation--tpl-tamil-thirumanam .invitation__additional-subtitle{color: var(--tt-ivory)}',
      '.invitation--tpl-tamil-thirumanam .invitation__chapter-title svg,.invitation--tpl-tamil-thirumanam .invitation__save-date svg,.invitation--tpl-tamil-thirumanam .invitation__venue-title svg{color: var(--tt-gold)}',
      '.invitation--tpl-tamil-thirumanam .invitation__person-name{font-size: clamp(1.1rem,4.7cqi,1.6rem);padding-inline: 2px;color: #F6D58E;background: linear-gradient(180deg,#FFF0C2 0%,#F2CD7C 45%,#C9963F 100%);-webkit-background-clip: text;background-clip: text;-webkit-text-fill-color: transparent;text-shadow: none;filter: drop-shadow(0 2px 2px rgba(0,0,0,0.6))}',
      '.invitation--tpl-tamil-thirumanam .invitation__couple-sep .amp{color: var(--tt-gold);text-shadow: 0 0 10px rgba(226,184,101,0.45)}',
      '.invitation--tpl-tamil-thirumanam .invitation__person-parents span{color: var(--tt-gold)}',
      '.invitation--tpl-tamil-thirumanam .invitation__person-parents,.invitation--tpl-tamil-thirumanam .invitation__person-parents strong,.invitation--tpl-tamil-thirumanam .invitation__message,.invitation--tpl-tamil-thirumanam .invitation__venue-address,.invitation--tpl-tamil-thirumanam .invitation__blessings-side p,.invitation--tpl-tamil-thirumanam .invitation__blessings-msg{color: var(--tt-ivory) !important}',
      '.invitation--tpl-tamil-thirumanam .invitation__when-unified,.invitation--tpl-tamil-thirumanam .invitation__venue,.invitation--tpl-tamil-thirumanam .invitation__venue-section,.invitation--tpl-tamil-thirumanam .invitation__events-grid{background: rgba(58,7,18,0.35);border: 1px solid var(--tt-gold);border-radius: 4px;box-shadow: inset 0 0 0 3px rgba(58,7,18,0.6),inset 0 0 0 4px rgba(226,184,101,0.45)}',
      '.invitation--tpl-tamil-thirumanam .invitation__when-unified-date,.invitation--tpl-tamil-thirumanam .invitation__venue-name strong,.invitation--tpl-tamil-thirumanam .invitation__event-title{color: var(--tt-gold);text-shadow: 0 1px 2px rgba(0,0,0,0.5)}',
      '.invitation--tpl-tamil-thirumanam .invitation__when-unified-time,.invitation--tpl-tamil-thirumanam .invitation__event-weekday,.invitation--tpl-tamil-thirumanam .invitation__event-date,.invitation--tpl-tamil-thirumanam .invitation__event-time{color: var(--tt-ivory)}',
      '.invitation--tpl-tamil-thirumanam .invitation__event-card{border-right-color: rgba(226,184,101,0.35)}',
      '.invitation--tpl-tamil-thirumanam .invitation__countdown .cd-unit{background: transparent;border: 1px solid rgba(226,184,101,0.7);border-radius: 4px;box-shadow: none}',
      '.invitation--tpl-tamil-thirumanam .invitation__countdown .cd-value{color: var(--tt-ivory)}',
      '.invitation--tpl-tamil-thirumanam .invitation__countdown .cd-label{color: var(--tt-gold)}',
      '.invitation--tpl-tamil-thirumanam .invitation__venue img,.invitation--tpl-tamil-thirumanam .invitation__venue-img,.invitation--tpl-tamil-thirumanam .invitation__gallery img{border: 1px solid var(--tt-gold);border-radius: 3px}',
      '.invitation--tpl-tamil-thirumanam .invitation__photo{border-color: var(--tt-gold);box-shadow: 0 0 0 3px #5A0C1D,0 0 0 4.5px var(--tt-gold-deep),0 10px 24px rgba(0,0,0,0.55)}',
      '.invitation--tpl-tamil-thirumanam .invitation__maps-btn,.invitation--tpl-tamil-thirumanam .invitation__actions .inv-btn{background: linear-gradient(180deg,#F0CF86 0%,#C9963F 100%);border: 1px solid #F6DFA6;color: #4A0914;box-shadow: 0 4px 12px rgba(0,0,0,0.4)}',
      '.invitation--tpl-tamil-thirumanam .invitation__events-title::before,.invitation--tpl-tamil-thirumanam .invitation__events-title::after,.invitation--tpl-tamil-thirumanam .invitation__blessings-divider{background: var(--tt-gold)}',
      '.invitation--tpl-tamil-thirumanam .invitation__brand{color: rgba(226,184,101,0.75);margin-bottom: 0}',
      '',
      /* BEGIN Telugu Pelli lake palace (generated from css/style.css) */
      '.invitation.invitation--regional{--rg-title:#7A1C28;--rg-ink:#3D2E1E;--rg-gold:#8A6A2F;--rg-line:#B8913F;--rg-card:rgba(255,252,245,0.6);--rg-card-line:rgba(184,145,63,0.45);background:radial-gradient(ellipse at 50% 38%,color-mix(in srgb,var(--inv-bg1,#FAF5EC) 70%,#fff) 0%,var(--inv-bg1,#FAF5EC) 62%,var(--inv-bg2,#F5EADB) 100%);padding:2.3rem 12% 1.25rem;color:var(--rg-ink);font-weight:500}',
      '.invitation.invitation--regional::before,.invitation.invitation--regional::after{display:none}',
      '.invitation.invitation--regional>:not(.invitation__backdrop):not(.invitation__ai-bg){position:relative;z-index:1}',
      '.invitation__backdrop--regional .inv-layer--tp-arch{top:0.55rem;left:6.5%;width:87%;height:auto;aspect-ratio:400 / 120;z-index:1}',
      '.invitation__backdrop--regional .inv-layer--tp-pillar{top:20cqi;bottom:30cqi;width:18%;height:auto;z-index:1;filter:drop-shadow(2px 3px 4px rgba(92,62,24,0.35));background-repeat:no-repeat,no-repeat,repeat-y;background-position:center top,center bottom,center top;background-size:100% auto,100% auto,100% auto}',
      '.invitation__backdrop--regional .inv-layer--tp-pillar-left{left:-2.5%}',
      '.invitation__backdrop--regional .inv-layer--tp-pillar-right{right:-2.5%;transform:scaleX(-1)}',
      '.invitation__backdrop--regional .inv-layer--tp-banana-left{bottom:4cqi;left:-5%;width:21%;height:auto;z-index:2}',
      '.invitation__backdrop--regional .inv-layer--tp-banana-right{bottom:4cqi;right:-5%;width:21%;height:auto;z-index:2;transform:scaleX(-1)}',
      '.invitation__backdrop--regional .inv-layer--tp-toran{top:0.35rem;left:14%;width:72%;height:auto;z-index:3}',
      '.invitation__backdrop--regional .inv-layer--tp-jasmine-left{top:34cqi;left:3%;width:8%;height:auto;z-index:4}',
      '.invitation__backdrop--regional .inv-layer--tp-jasmine-right{top:34cqi;right:3%;width:8%;height:auto;z-index:4;transform:scaleX(-1)}',
      '.invitation__backdrop--regional .inv-layer--tp-canopy-left{top:0;left:-5%;width:29%;height:auto;z-index:5}',
      '.invitation__backdrop--regional .inv-layer--tp-canopy-right{top:0;right:-5%;width:29%;height:auto;z-index:5;transform:scaleX(-1)}',
      '.invitation__backdrop--regional .inv-layer--tp-bells-left{top:12cqi;left:17%;width:12%;height:auto;z-index:6}',
      '.invitation__backdrop--regional .inv-layer--tp-bells-right{top:12cqi;right:17%;width:12%;height:auto;z-index:6}',
      '.invitation__backdrop--regional .inv-layer--tp-foliage-bottom{bottom:-1px;left:20%;width:60%;height:auto;z-index:5}',
      '.invitation__backdrop--regional .inv-layer--tp-elephant-left{bottom:1.5cqi;left:1%;width:24%;height:auto;z-index:6}',
      '.invitation__backdrop--regional .inv-layer--tp-elephant-right{bottom:1.5cqi;right:1%;width:24%;height:auto;z-index:6;transform:scaleX(-1)}',
      '.invitation__backdrop--regional .inv-layer--tp-lake-temple{bottom:0;left:8%;width:84%;height:auto;z-index:1;opacity:0.9;-webkit-mask-image:linear-gradient(to top,#000 0%,#000 45%,transparent 92%),linear-gradient(90deg,transparent 0%,#000 12%,#000 88%,transparent 100%);-webkit-mask-composite:source-in;mask-composite:intersect;mask-image:linear-gradient(to top,#000 0%,#000 45%,transparent 92%),linear-gradient(90deg,transparent 0%,#000 12%,#000 88%,transparent 100%)}',
      '.invitation--regional .tp-crest{margin:9cqi auto 0.5rem}',
      '.invitation--regional .tp-crest__img{display:block;width:15cqi;height:auto;margin:0 auto}',
      '.invitation.invitation--regional .tp-kicker{font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.56rem,2.6cqi,0.78rem);font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:var(--rg-gold);margin:0 0 0.45rem;line-height:1.6;white-space:pre-line}',
      '.invitation.invitation--regional .tp-intro{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:clamp(0.92rem,4.2cqi,1.18rem);font-weight:600;color:var(--rg-ink);margin:0 0 0.35rem;line-height:1.35;white-space:pre-line}',
      '.invitation.invitation--regional .tp-couple{display:block;position:relative;margin:0.2rem 0 0.4rem;text-align:center}',
      '.invitation.invitation--regional .tp-name{font-family:\'Great Vibes\',\'Playfair Display\',cursive;font-weight:400;font-size:clamp(2.7rem,18cqi,4.6rem);line-height:1.05;letter-spacing:0;color:var(--rg-title);text-align:center;margin:0;white-space:normal;word-break:normal}',
      '.invitation--regional .tp-amp{display:flex;align-items:center;justify-content:center;gap:3cqi;margin:-0.35rem 0 -0.5rem}',
      '.invitation.invitation--regional .tp-amp .amp{font-family:\'Great Vibes\',cursive;font-size:clamp(1.7rem,10cqi,2.7rem);color:var(--rg-title);font-weight:400;line-height:1}',
      '.invitation--regional .tp-sprig{width:min(10cqi,60px);height:auto;transform:rotate(48deg)}',
      '.invitation--regional .tp-sprig--left{transform:scaleX(-1) rotate(48deg)}',
      '.invitation--regional .tp-aside{position:absolute;margin:0;color:var(--rg-gold);text-align:center}',
      '.invitation--regional .tp-aside--left{left:1%;top:12%;width:22%;white-space:nowrap;font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.4rem,1.95cqi,0.6rem);letter-spacing:0.2em;line-height:2;text-transform:uppercase}',
      '.invitation--regional .tp-aside--right{right:0;top:36%;width:22%;white-space:nowrap;font-family:\'Great Vibes\',cursive;font-size:clamp(0.85rem,4.4cqi,1.3rem);line-height:1.15;transform:rotate(-12deg)}',
      '.invitation--regional .tp-heart{color:var(--rg-gold);font-size:0.9em}',
      '@container invite (min-width:480px){.invitation--regional .tp-aside--left{left:8%}',
      '.invitation--regional .tp-aside--right{right:6%}',
      '.invitation--regional-tamil-thirumanam .tp-aside--left{left:12%}',
      '.invitation--regional-tamil-thirumanam .tp-aside--right{right:9%}',
      '.invitation--regional .tp-heart--outline{display:inline-block;margin-top:0.3em}',
      '.invitation.invitation--regional .tp-greeting{font-family:\'Noto Serif Telugu\',\'Noto Serif Tamil\',\'Cormorant Garamond\',serif;font-size:clamp(0.95rem,4.6cqi,1.3rem);font-weight:600;color:var(--rg-title);letter-spacing:0.04em;line-height:1.5;margin:0 0 0.3rem}',
      '.invitation.invitation--regional .tp-greeting{display:flex;justify-content:center;align-items:baseline;gap:5cqi;white-space:nowrap}',
      '.invitation.invitation--regional .tp-greeting span{font-size:clamp(0.74rem,3.7cqi,1.05rem)}',
      '.invitation.invitation--regional .tp-greeting span:nth-child(2){font-size:clamp(0.92rem,4.6cqi,1.3rem)}',
      '.invitation.invitation--regional .tp-name-te{font-family:\'Noto Serif Telugu\',\'Noto Serif Tamil\',serif;font-size:clamp(0.8rem,3.9cqi,1.1rem);font-weight:500;color:var(--rg-gold);line-height:1.4;margin:0.1rem 0 0.2rem}',
      '.invitation--regional .tp-name-te + .tp-amp{margin-top:0}',
      '.invitation.invitation--regional .invitation__gallery-title{font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.62rem,3.1cqi,0.9rem);font-weight:700;letter-spacing:0.22em;color:var(--rg-title);margin:1rem 0 0.8rem}',
      '.invitation.invitation--regional .invitation__gallery-title svg{width:1.2em;height:1.2em;color:var(--rg-gold)}',
      '.invitation--regional .tp-pk{display:inline-flex;gap:0.3em;margin:0 0.5em;vertical-align:0.05em}',
      '.invitation--regional .tp-pk i{width:0.62em;height:0.62em;border-radius:50%;display:block}',
      '.invitation--regional .tp-pk__pasupu{background:radial-gradient(circle at 35% 35%,#F7D25A,#D99A0B)}',
      '.invitation--regional .tp-pk__kumkuma{background:radial-gradient(circle at 35% 35%,#E2475E,#A30F2B)}',
      '.invitation.invitation--regional .invitation__photo{margin:0.7rem auto 0.4rem}',
      '.invitation--regional .tp-tagline{font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.5rem,2.35cqi,0.7rem);letter-spacing:0.24em;text-transform:uppercase;color:var(--rg-gold);margin:0.5rem 0 0.9rem}',
      '.invitation.invitation--regional .tp-date{position:relative;z-index:0;background:none;border:0;box-shadow:none;padding:0.4rem 0;margin:0 auto 0.9rem;max-width:none}',
      '.invitation--regional .tp-muggu{position:absolute;left:50%;top:50%;width:46cqi;height:auto;transform:translate(-50%,-50%);opacity:0.16;z-index:-1;pointer-events:none}',
      '.invitation--regional .tp-date__weekday,.invitation--regional .tp-date__row,.invitation--regional .tp-date__time{font-family:\'Cinzel\',Georgia,serif;color:var(--rg-ink);text-transform:uppercase}',
      '.invitation--regional .tp-date__weekday{display:flex;align-items:center;justify-content:center;gap:3cqi;font-size:clamp(0.72rem,3.5cqi,1rem);letter-spacing:0.22em;font-weight:600}',
      '.invitation--regional .tp-date__rule{width:16cqi;height:1px;background:linear-gradient(90deg,transparent,var(--rg-line))}',
      '.invitation--regional .tp-date__rule:last-child{background:linear-gradient(90deg,var(--rg-line),transparent)}',
      '.invitation--regional .tp-date__row{display:flex;align-items:center;justify-content:center;margin:0.2rem 0}',
      '.invitation--regional .tp-date__month,.invitation--regional .tp-date__year{font-size:clamp(0.9rem,4.6cqi,1.3rem);letter-spacing:0.14em;font-weight:600;padding:0 4.5cqi}',
      '.invitation--regional .tp-date__day{font-size:clamp(2rem,11cqi,3.1rem);font-weight:600;color:var(--rg-title);line-height:1;padding:0 4.5cqi;border-left:1.5px solid var(--rg-title);border-right:1.5px solid var(--rg-title)}',
      '.invitation--regional .tp-date__time{font-size:clamp(0.66rem,3.2cqi,0.92rem);letter-spacing:0.16em;font-weight:600}',
      '.invitation.invitation--regional .invitation__countdown{gap:2cqi;margin:0.2rem auto 0.4rem}',
      '.invitation.invitation--regional .invitation__countdown .cd-unit{background:var(--rg-card);border:1px solid var(--rg-card-line);box-shadow:none;border-radius:6px;padding:0.35rem 0.2rem}',
      '.invitation.invitation--regional .invitation__countdown .cd-value{font-family:\'Cinzel\',Georgia,serif;color:var(--rg-title);font-size:clamp(0.9rem,4.6cqi,1.3rem)}',
      '.invitation.invitation--regional .invitation__countdown .cd-label{font-family:\'Cinzel\',Georgia,serif;color:var(--rg-gold);font-size:clamp(0.42rem,2cqi,0.58rem);letter-spacing:0.14em}',
      '.invitation--regional .tp-divider{margin:0.7rem auto;line-height:0;text-align:center}',
      '.invitation--regional .tp-divider__img{display:block;width:50cqi;height:auto;margin:0 auto}',
      '.invitation--regional .tp-venue-photo{margin:0.4rem auto 0.5rem;width:64%;padding:1.2cqi;background:#FFFDF8;border:1.5px solid #C9A961;border-radius:14px;box-shadow:inset 0 0 0 3px #FFFDF8,inset 0 0 0 4px rgba(201,169,97,0.45),0 6px 18px rgba(92,62,24,0.14)}',
      '.invitation--regional .tp-venue-photo img{display:block;width:100%;aspect-ratio:3 / 2;object-fit:cover;border-radius:10px}',
      '.invitation--regional .tp-venue{position:relative;margin:0.3rem 0;min-height:30cqi;display:flex;align-items:center;justify-content:center}',
      '.invitation--regional .tp-palace{position:absolute;top:50%;width:35%;height:auto;z-index:0;opacity:0.92;transform:translateY(-50%)}',
      '.invitation--regional .tp-palace--left{left:-11%;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 38%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 38%,transparent 100%)}',
      '.invitation--regional .tp-palace--right{right:-11%;transform:translateY(-50%) scaleX(-1);-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 38%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 38%,transparent 100%)}',
      '.invitation--regional .tp-venue__body{position:relative;z-index:1;max-width:48%;text-align:center}',
      '.invitation--regional .tp-venue__title{white-space:nowrap;margin:0 -10cqi 0.15rem}',
      '.invitation--regional .tp-venue__title{display:flex;align-items:center;justify-content:center;gap:6px;color:var(--rg-title);font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.6rem,2.9cqi,0.85rem);font-weight:700;letter-spacing:0.12em;text-transform:uppercase}',
      '.invitation--regional .tp-venue__title svg{flex:none;width:1.2em;height:1.2em}',
      '.invitation.invitation--regional .tp-venue__name{line-height:1.25;margin-bottom:0.2rem}',
      '.invitation.invitation--regional .tp-venue__name strong{display:block;line-height:1.3}',
      '.invitation.invitation--regional .tp-venue__name strong{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:clamp(0.95rem,4.4cqi,1.2rem);font-weight:700;color:var(--rg-ink)}',
      '.invitation.invitation--regional .tp-venue__address{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:clamp(0.82rem,3.7cqi,1.02rem);font-weight:600;line-height:1.3;color:var(--rg-ink)}',
      '.invitation.invitation--regional .tp-venue--side{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:3.5cqi;align-items:center;min-height:0;margin:0.4rem 0}',
      '.invitation.invitation--regional .tp-venue--side .tp-venue-photo{width:auto;margin:0;position:relative;z-index:1}',
      '.invitation.invitation--regional .tp-venue--side .tp-venue__body{max-width:none;text-align:center}',
      '.invitation.invitation--regional .tp-venue--side .tp-venue__name,.invitation.invitation--regional .tp-venue--side .tp-venue__address{text-align:center;margin-inline:auto}',
      '.invitation.invitation--regional .tp-venue--side .tp-venue__title{justify-content:center;margin:0 0 0.2rem;white-space:normal}',
      '.invitation.invitation--regional .tp-venue--side .tp-palace--left{display:none}',
      '.invitation.invitation--regional .tp-venue--side .tp-palace--right{right:-12%;width:62%;opacity:0.22}',
      '.invitation--regional .tp-venue__map{display:inline-block;margin-top:0.3rem;font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.5rem,2.3cqi,0.66rem);letter-spacing:0.16em;text-transform:uppercase;color:var(--rg-gold);text-decoration:underline;text-underline-offset:3px}',
      '.invitation.invitation--regional .tp-message{font-style:italic;margin:0.6rem 0}',
      '.invitation--regional .tp-heading{display:flex;align-items:center;justify-content:center;gap:3cqi;margin:0.9rem 0 0.8rem}',
      '.invitation--regional .tp-heading__text{font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.62rem,3.1cqi,0.9rem);font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:var(--rg-title);white-space:nowrap}',
      '.invitation--regional .tp-heading__line{flex:1;max-width:18cqi;height:1px;background:linear-gradient(90deg,transparent,var(--rg-line))}',
      '.invitation--regional .tp-heading__line:last-child{background:linear-gradient(90deg,var(--rg-line),transparent)}',
      '.invitation--regional .tp-events{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;margin:0 -6cqi}',
      '.invitation--regional .tp-event{display:flex;flex-direction:column;align-items:center;gap:1px;padding:0 1.2cqi;text-align:center}',
      '.invitation--regional .tp-event + .tp-event{border-left:1px solid var(--rg-card-line)}',
      '.invitation--regional .tp-event__icon{width:14cqi;height:12cqi;object-fit:contain;margin-bottom:0.3rem}',
      '.invitation--regional .tp-event__title{font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.48rem,2.3cqi,0.68rem);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--rg-title);line-height:1.3;min-height:2.6em;display:flex;align-items:center}',
      '.invitation--regional .tp-event__date,.invitation--regional .tp-event__time{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:clamp(0.68rem,3cqi,0.9rem);font-weight:600;line-height:1.25;color:var(--rg-ink)}',
      '.invitation--regional .invitation__blessings{margin:0.4rem 0 0.6rem}',
      '.invitation--regional .invitation__blessings-grid{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:3cqi;margin-bottom:0.2rem}',
      '.invitation.invitation--regional .invitation__blessings-side strong{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:clamp(0.92rem,4cqi,1.15rem);color:var(--rg-title)}',
      '.invitation.invitation--regional .invitation__blessings-side p{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:clamp(0.82rem,3.6cqi,1rem);color:var(--rg-ink);font-weight:600}',
      '.invitation--regional .invitation__blessings-divider{width:1px;height:40px;background:var(--rg-line);opacity:0.6}',
      '.invitation.invitation--regional .invitation__blessings-side strong{display:block;margin-bottom:2px}',
      '.invitation.invitation--regional .invitation__blessings-side p{margin:0;line-height:1.35}',
      '.invitation.invitation--regional .tp-closing{font-family:\'Cormorant Garamond\',Georgia,serif;font-style:italic;font-size:clamp(0.9rem,4cqi,1.15rem) !important;line-height:1.4;color:var(--rg-ink) !important;opacity:1 !important;margin:0 auto;max-width:92%}',
      '.invitation.invitation--regional .invitation__footer{margin:1.2rem 0 54cqi;border-top:0}',
      '.invitation.invitation--regional-dark{--rg-title:#F3D58A;--rg-ink:#FBEFD9;--rg-gold:#E4B45C;--rg-line:#D9B45F;--rg-card:rgba(40,4,14,0.38);--rg-card-line:rgba(228,180,92,0.55)}',
      '.invitation--regional-dark .tp-muggu g[stroke]{stroke:#E4B45C}',
      '.invitation--regional-dark .tp-muggu g[fill]:not([fill="none"]){fill:#E4B45C}',
      '.invitation--regional-dark .tp-muggu{opacity:0.22}',
      '.invitation.invitation--regional-dark .invitation__footer{color:rgba(251,239,217,0.75)}',
      '.invitation.invitation--regional-dark .inv-btn{color:#FBEFD9;border-color:rgba(228,180,92,0.6);background:rgba(40,4,14,0.3)}',
      '.invitation--regional-dark .tp-venue-photo{background:#3A0812;border-color:#D9B45F;box-shadow:inset 0 0 0 3px #3A0812,inset 0 0 0 4px rgba(228,180,92,0.55),0 8px 22px rgba(0,0,0,0.35)}',
      '.invitation__backdrop--tamil-thirumanam .inv-layer--tp-pillar,.invitation__backdrop--tamil-thirumanam .inv-layer--tp-arch{display:none}',
      '.invitation.invitation--regional-tamil-thirumanam{background:radial-gradient(ellipse at 50% 30%,rgba(255,214,140,0.16) 0%,transparent 55%),repeating-linear-gradient(115deg,rgba(255,255,255,0.025) 0 2px,transparent 2px 7px),linear-gradient(180deg,var(--inv-bg1,#7A1428) 0%,var(--inv-bg2,#5C0F1F) 100%)}',
      '.invitation.invitation--regional-tamil-thirumanam::before{display:block;content:"";position:absolute;inset:1.4%;z-index:0;pointer-events:none;border:2px solid #D9B45F;border-radius:16px;box-shadow:inset 0 0 0 4px rgba(58,8,18,0.9),inset 0 0 0 5.5px rgba(228,180,92,0.75)}',
      '.invitation.invitation--regional-tamil-thirumanam::after{display:block;content:"";position:absolute;top:3.2%;bottom:3.2%;left:2.6%;right:2.6%;z-index:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'22\' viewBox=\'0 0 14 22\'%3E%3Cpath d=\'M7 2 L12.5 12 H1.5 Z\' fill=\'%23E4B45C\' opacity=\'.85\'/%3E%3Ccircle cx=\'7\' cy=\'17\' r=\'1.7\' fill=\'%23E4B45C\' opacity=\'.85\'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'22\' viewBox=\'0 0 14 22\'%3E%3Cpath d=\'M7 2 L12.5 12 H1.5 Z\' fill=\'%23E4B45C\' opacity=\'.85\'/%3E%3Ccircle cx=\'7\' cy=\'17\' r=\'1.7\' fill=\'%23E4B45C\' opacity=\'.85\'/%3E%3C/svg%3E");background-repeat:repeat-y,repeat-y;background-position:left top,right top;background-size:3.4% auto,3.4% auto}',
      '.invitation--regional-tamil-thirumanam .inv-layer--tp-jasmine-left{left:3.5%;width:7%}',
      '.invitation--regional-tamil-thirumanam .inv-layer--tp-jasmine-right{right:3.5%;width:7%}',
      '.invitation.invitation--regional-tamil-thirumanam .tp-greeting{gap:3cqi}',
      '.invitation.invitation--regional-tamil-thirumanam .tp-greeting span{font-size:clamp(0.6rem,3.1cqi,0.95rem)}',
      '.invitation.invitation--regional-tamil-thirumanam .tp-greeting span:nth-child(2){font-size:clamp(0.72rem,3.8cqi,1.15rem)}',
      '.invitation.invitation--regional-tamil-thirumanam .tp-kicker{letter-spacing:0.14em}',
      '.invitation.invitation--regional-tamil-thirumanam .tp-name{font-family:\'Cinzel\',\'Playfair Display\',Georgia,serif;font-weight:700;text-transform:uppercase;font-size:clamp(1.55rem,10cqi,2.9rem);letter-spacing:0.08em;line-height:1.15;text-shadow:0 1px 0 rgba(58,8,18,0.6),0 0 18px rgba(228,180,92,0.25)}',
      '.invitation.invitation--regional-tamil-thirumanam .tp-amp .amp{font-family:\'Cinzel\',Georgia,serif;font-weight:700;font-size:clamp(1.2rem,7cqi,2rem)}',
      '.invitation--regional-tamil-thirumanam .tp-amp{margin:0.2rem 0}',
      '.invitation--regional-tamil-thirumanam .tp-name-te{margin:0.15rem 0 0.35rem}',
      '.invitation--regional-tamil-thirumanam .tp-aside--right{font-family:\'Cinzel\',Georgia,serif;font-size:clamp(0.4rem,1.95cqi,0.6rem);letter-spacing:0.2em;line-height:2;text-transform:uppercase;transform:none}',
      '.invitation--regional-tamil-thirumanam .tp-date__day{display:inline-flex;align-items:center;justify-content:center;width:19cqi;height:19cqi;margin:0 3cqi;padding:0;border:1.5px solid var(--rg-line);border-radius:50%;box-shadow:0 0 0 3px rgba(58,8,18,0.6),0 0 0 4.5px rgba(228,180,92,0.6);color:var(--rg-title);background:radial-gradient(circle,rgba(228,180,92,0.16),transparent 70%)}',
      '.invitation--regional-tamil-thirumanam .tp-date__month,.invitation--regional-tamil-thirumanam .tp-date__year{padding:0}',
      '.invitation--regional-tamil-thirumanam .tp-venue-photo{border-radius:50% 50% 14px 14px / 34% 34% 14px 14px}',
      '.invitation--regional-tamil-thirumanam .tp-venue-photo img{border-radius:50% 50% 10px 10px / 34% 34% 10px 10px;aspect-ratio:4 / 3}',
      '.invitation--regional-tamil-thirumanam .tp-events{gap:2cqi;margin:0 -4cqi}',
      '.invitation--regional-tamil-thirumanam .tp-event{border:1px solid var(--rg-card-line);border-radius:12px;background:var(--rg-card);padding:2.2cqi 1cqi 2.6cqi}',
      '.invitation--regional-tamil-thirumanam .tp-event + .tp-event{border-left:1px solid var(--rg-card-line)}',
      '.invitation--regional-tamil-thirumanam .invitation__blessings-grid{background:var(--rg-card);border:1px solid var(--rg-card-line);border-radius:14px;padding:3cqi 2cqi}',
      '.invitation.invitation--wd{--wd-display-f:var(--wd-display,var(--inv-font-display));--wd-body-f:var(--wd-body,var(--inv-font-body));--wd-caps-f:var(--wd-caps,var(--wd-body-f));padding:2.4rem 11% 1.6rem;color:var(--wd-ink);font-family:var(--wd-body-f);background:radial-gradient(440px 380px at 50% 0,color-mix(in srgb,var(--inv-bg1) 80%,#fff 20%) 0%,transparent 100%),linear-gradient(170deg,var(--inv-bg1),var(--inv-bg2))}',
      '.invitation.invitation--wd::before,.invitation.invitation--wd::after{display:none}',
      '.invitation.invitation--wd>:not(.wd-frame):not(.invitation__ai-bg):not(.wd-note){position:relative;z-index:1}',
      '.invitation.invitation--wd>.wd-note{position:absolute;z-index:1}',
      '.wd-frame{position:absolute;inset:0;pointer-events:none;z-index:0;border-radius:inherit;overflow:hidden;color:var(--wd-accent)}',
      '.wd-frame::before{content:"";position:absolute;inset:2.6%;border-radius:14px;border:1px solid var(--wd-line)}',
      '.wd-fr-double .wd-frame::before{box-shadow:inset 0 0 0 4px transparent,inset 0 0 0 5px var(--wd-line);border-width:1.5px}',
      '.wd-fr-band .wd-frame::before{inset:0;border:7px solid var(--wd-soft);border-radius:inherit;box-shadow:inset 0 0 0 8px transparent,inset 0 0 0 9px var(--wd-line)}',
      '.wd-fr-hairline .wd-frame::before{border-radius:0;inset:3.4%}',
      '.wd-fr-arch .wd-frame::before{inset:3% 4% 2.5%;border-radius:48% 48% 14px 14px / 16% 16% 14px 14px;border-width:1.5px;box-shadow:inset 0 0 0 5px transparent,inset 0 0 0 6px var(--wd-soft)}',
      '.wd-fr-beads .wd-frame::before{border:0;padding:5px;background:radial-gradient(circle,var(--wd-accent) 1.4px,transparent 1.9px) 0 0 / 9px 9px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}',
      '.wd-fr-kolam .wd-frame::before{border-style:dashed}',
      '.wd-fr-deco .wd-frame::before{border-radius:4px;box-shadow:inset 0 0 0 3px transparent,inset 0 0 0 4px var(--wd-line)}',
      '.wd-corner{position:absolute;width:17%;height:auto;opacity:0.85}',
      '.wd-corner--tl{top:1.2%;left:1.6%}',
      '.wd-corner--tr{top:1.2%;right:1.6%;transform:scaleX(-1)}',
      '.wd-corner--bl{bottom:1%;left:1.6%;transform:scaleY(-1)}',
      '.wd-corner--br{bottom:1%;right:1.6%;transform:scale(-1,-1)}',
      '.wd-fr-vine .wd-corner{width:24%}',
      '.wd-fr-hairline .wd-corner{width:9%}',
      '.wd-spray{position:absolute;width:40%;height:auto;opacity:0.4}',
      '.wd-spray--tl{top:-3%;left:-8%;transform:rotate(-18deg)}',
      '.wd-spray--br{bottom:-2%;right:-8%;transform:rotate(160deg)}',
      '.wd-dark .wd-spray{opacity:0.26}',
      '.wd-crest{display:flex;justify-content:center;margin:0 auto 0.6rem}',
      '.wd-crest .wd-motif{width:27cqi;height:27cqi;object-fit:contain}',
      '.wd-l-royal .wd-crest .wd-motif{width:20cqi;height:20cqi}',
      '.wd-l-editorial .wd-crest{justify-content:flex-start}',
      '.wd-l-editorial .wd-crest .wd-motif{width:18cqi;height:18cqi}',
      '.wd-l-arch .wd-crest .wd-motif{width:24cqi;height:24cqi}',
      '.wd-monogram{position:relative;width:34cqi;height:34cqi;margin:0 auto 0.8rem;display:grid;place-items:center}',
      '.wd-monogram .wd-motif{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0.4}',
      '.wd-monogram__letters{position:relative;font-family:var(--wd-display-f);color:var(--wd-title);font-size:clamp(1.4rem,9cqi,2.6rem);line-height:1;display:flex;align-items:center;gap:1.4cqi}',
      '.wd-monogram__letters i{font-style:normal;font-size:0.5em;color:var(--wd-accent)}',
      '.wd-note{position:absolute;margin:0;font-family:var(--wd-caps-f);font-size:clamp(0.5rem,2.5cqi,0.72rem);letter-spacing:0.12em;line-height:1.7;color:var(--wd-accent);text-align:center;opacity:0.9}',
      '.wd-note--right{top:40cqi;right:3%}',
      '.wd-note--left{top:40cqi;left:3%;font-family:var(--wd-display-f);font-size:clamp(0.6rem,3cqi,0.95rem);letter-spacing:0.02em;line-height:1.25}',
      '@container invite (max-width:440px){.wd-note{display:none}',
      '@container invite (min-width:441px){.invitation.invitation--wd:has(>.wd-note)>.invitation__additional-title,.invitation.invitation--wd:has(>.wd-note)>.invitation__additional-subtitle,.invitation.invitation--wd:has(>.wd-note)>.wd-lead,.invitation.invitation--wd:has(>.wd-note)>.wd-heading{max-width:62%;margin-left:auto;margin-right:auto}',
      '.invitation.invitation--wd>.wd-note{max-width:21%}',
      '.invitation.invitation--wd .wd-eyebrow{font-family:var(--wd-caps-f);font-size:clamp(0.56rem,2.6cqi,0.78rem);letter-spacing:0.24em;text-transform:uppercase;color:var(--wd-accent);margin:0 0 0.2rem;font-weight:600;white-space:normal}',
      '.invitation.invitation--wd .wd-lead{font-family:var(--wd-body-f);font-size:clamp(0.82rem,3.7cqi,1.08rem);color:var(--wd-ink);margin:0 0 0.5rem;line-height:1.4;white-space:normal}',
      '.wd-l-editorial .invitation__additional-title,.wd-l-editorial .wd-lead{text-align:left}',
      '.wd-italic .wd-name{font-style:italic}',
      '.wd-photo{margin:0.4rem auto 0.6rem;border:2px solid var(--wd-accent)}',
      '.wd-heading{display:flex;align-items:center;justify-content:center;gap:2.4cqi;margin:1.1rem 0 0.6rem;color:var(--wd-accent);font-weight:600}',
      '.wd-heading__text{font-family:var(--wd-caps-f);font-size:clamp(0.56rem,2.7cqi,0.8rem);letter-spacing:0.24em;text-transform:uppercase;white-space:normal;text-align:center;min-width:0;max-width:78%;line-height:1.5}',
      '.wd-heading__line{min-width:4cqi}',
      '@container invite (max-width:300px){.wd-heading__text{letter-spacing:0.14em}',
      '.wd-heading{gap:1.6cqi}',
      '.wd-heading__line{flex:1;max-width:22cqi;height:1px;background:linear-gradient(90deg,transparent,var(--wd-line))}',
      '.wd-heading__line:last-child{background:linear-gradient(90deg,var(--wd-line),transparent)}',
      '.wd-heading__icon{display:inline-flex;color:var(--wd-accent)}',
      '.wd-heading__gem{width:6px;height:6px;background:var(--wd-accent);transform:rotate(45deg);flex:none}',
      '.wd-heading--caps .wd-heading__line{display:none}',
      '.wd-heading--caps .wd-heading__text{padding-bottom:4px;border-bottom:1px solid var(--wd-line)}',
      '.wd-heading--flourish .wd-heading__text{font-family:var(--wd-display-f);text-transform:none;letter-spacing:0.02em;font-size:clamp(0.95rem,4.6cqi,1.35rem);font-weight:400;color:var(--wd-title)}',
      '.wd-l-editorial .wd-heading{justify-content:flex-start}',
      '.wd-l-editorial .wd-heading__line:first-child{display:none}',
      '.invitation.invitation--wd .wd-couple{display:flex;align-items:center;justify-content:center;gap:2cqi;margin:0.5rem 0 0.4rem}',
      '.invitation.invitation--wd .wd-couple--stack{flex-direction:column;gap:0.1rem}',
      '.wd-person{flex:1;min-width:0;text-align:center}',
      '.wd-couple--row .wd-person--left{text-align:right}',
      '.wd-couple--row .wd-person--right{text-align:left}',
      '.invitation.invitation--wd .wd-name{font-family:var(--wd-display-f);color:var(--wd-title);font-size:calc(clamp(1.5rem,9.5cqi,2.9rem) * var(--wd-name-size,1));line-height:1.08;margin:0;font-weight:400;letter-spacing:0.01em;word-break:normal;overflow-wrap:anywhere;text-align:inherit}',
      '.invitation.invitation--wd .wd-couple--stack .wd-name{font-size:calc(clamp(1.8rem,12cqi,3.4rem) * var(--wd-name-size,1))}',
      '.wd-parents{margin:0.25rem 0 0;font-family:var(--wd-body-f);font-size:clamp(0.62rem,2.8cqi,0.82rem);color:var(--wd-ink);letter-spacing:0.06em;text-transform:uppercase;line-height:1.35}',
      '.wd-parents span{display:block;color:var(--wd-accent);font-size:0.86em;letter-spacing:0.16em}',
      '.wd-amp{flex:none;color:var(--wd-accent);font-family:var(--wd-display-f);font-size:clamp(1.2rem,7cqi,2.1rem);line-height:1}',
      '.wd-amp--medallion{width:14cqi;height:14cqi;display:grid;place-items:center;border:1px solid var(--wd-line);border-radius:50%;box-shadow:0 0 0 4px var(--wd-soft)}',
      '.wd-amp--medallion span{font-size:clamp(1rem,6cqi,1.8rem)}',
      '.wd-l-editorial .wd-couple--stack{align-items:flex-start}',
      '.wd-l-editorial .wd-couple--stack .wd-person{text-align:left}',
      '.invitation.invitation--wd .wd-date{background:none;border:0;box-shadow:none;padding:0;margin:0.2rem auto 0.4rem;max-width:none;width:auto;color:var(--wd-ink)}',
      '.invitation.invitation--wd .wd-date--pill,.invitation.invitation--wd .wd-date--ribbon,.invitation.invitation--wd .wd-date--medallion{flex-direction:row}',
      '.wd-date small{display:block;font-family:var(--wd-caps-f);font-size:clamp(0.5rem,2.3cqi,0.7rem);letter-spacing:0.2em;color:var(--wd-accent)}',
      '.wd-date b{font-family:var(--wd-caps-f);color:var(--wd-title);font-weight:600}',
      '.invitation.invitation--wd .wd-date--pill{display:flex;align-items:stretch;justify-content:center;border:1px solid var(--wd-line);border-radius:999px;padding:0.55rem 0.4rem;background:var(--wd-card);width:88%}',
      '.wd-cell{flex:1;text-align:center;padding:0 1cqi}',
      '.wd-cell + .wd-cell{border-left:1px solid var(--wd-line)}',
      '.wd-cell b{display:block;font-size:clamp(1rem,6cqi,1.8rem);line-height:1.15}',
      '.wd-cell b.wd-cell__time{font-size:clamp(0.8rem,4.2cqi,1.2rem)}',
      '.invitation.invitation--wd .wd-date--medallion{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:3cqi}',
      '.wd-medal{width:19cqi;height:19cqi;display:grid;place-items:center;border:1.5px solid var(--wd-accent);border-radius:50%;box-shadow:0 0 0 4px var(--wd-soft)}',
      '.wd-medal b{font-size:clamp(1.3rem,8cqi,2.4rem)}',
      '.wd-date__meta{flex-basis:100%;margin:0.2rem 0 0;font-family:var(--wd-caps-f);font-size:clamp(0.56rem,2.6cqi,0.78rem);letter-spacing:0.2em;color:var(--wd-ink)}',
      '.wd-date--stack .wd-date__big{display:block;font-family:var(--wd-display-f);font-size:clamp(2.6rem,17cqi,5rem);line-height:1}',
      '.wd-date__month{margin:0.1rem 0;font-family:var(--wd-caps-f);letter-spacing:0.28em;font-size:clamp(0.62rem,3cqi,0.9rem);color:var(--wd-title)}',
      '.invitation.invitation--wd .wd-date--ribbon{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:2cqi;padding:0.55rem 1rem;background:var(--wd-soft);border-top:1px solid var(--wd-line);border-bottom:1px solid var(--wd-line);font-family:var(--wd-caps-f);font-size:clamp(0.58rem,2.8cqi,0.82rem);letter-spacing:0.16em;text-transform:uppercase}',
      '.wd-date--ribbon i{width:4px;height:4px;background:var(--wd-accent);transform:rotate(45deg)}',
      '.wd-date__row{display:flex;align-items:center;justify-content:center;font-family:var(--wd-caps-f)}',
      '.wd-date__row span{font-size:clamp(0.8rem,4.2cqi,1.2rem);letter-spacing:0.16em;padding:0 4cqi}',
      '.wd-date__row b{font-size:clamp(1.7rem,10cqi,2.9rem);padding:0 4cqi;border-left:1px solid var(--wd-line);border-right:1px solid var(--wd-line)}',
      '.wd-l-editorial .wd-date--stack,.wd-l-editorial .wd-date--line{text-align:left}',
      '.wd-l-editorial .wd-date__row{justify-content:flex-start}',
      '.wd-l-editorial .wd-date__row span:first-child{padding-left:0}',
      '.invitation.invitation--wd .wd-message{font-family:var(--wd-body-f);font-size:clamp(0.82rem,3.7cqi,1.05rem);line-height:1.55;color:var(--wd-ink);margin:0 0 0.6rem;font-style:normal}',
      '.wd-l-editorial .wd-message{text-align:left}',
      '.invitation.invitation--wd .invitation__countdown{gap:2cqi;margin:0.5rem auto 0.2rem}',
      '.invitation.invitation--wd .invitation__countdown .cd-unit{background:var(--wd-card);border:1px solid var(--wd-card-line);box-shadow:none;border-radius:10px}',
      '.invitation.invitation--wd .invitation__countdown .cd-value{color:var(--wd-title);font-family:var(--wd-caps-f)}',
      '.invitation.invitation--wd .invitation__countdown .cd-label{color:var(--wd-accent);letter-spacing:0.14em}',
      '.wd-venue{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:3.5cqi;align-items:center;text-align:center}',
      '.wd-venue__photo{margin:0;padding:1.2cqi;border:1px solid var(--wd-line);border-radius:12px;background:var(--wd-card)}',
      '.wd-venue__photo img{display:block;width:100%;aspect-ratio:4 / 3;object-fit:cover;border-radius:9px}',
      '.wd-venue--stack .wd-venue__photo{border-radius:4px}',
      '.wd-venue--stack .wd-venue__photo img{aspect-ratio:1 / 1;border-radius:2px}',
      '.wd-venue--framed .wd-venue__photo{border-radius:50% 50% 12px 12px / 30% 30% 12px 12px}',
      '.wd-venue--framed .wd-venue__photo img{border-radius:50% 50% 9px 9px / 30% 30% 9px 9px;aspect-ratio:3 / 4}',
      '.invitation.invitation--wd .wd-venue__name{margin:0;font-family:var(--wd-caps-f);font-size:clamp(0.9rem,4.4cqi,1.25rem);color:var(--wd-title);font-weight:600;line-height:1.25;text-align:inherit}',
      '.invitation.invitation--wd .wd-venue__address{margin:0.2rem 0 0.5rem;font-family:var(--wd-body-f);font-size:clamp(0.74rem,3.3cqi,0.95rem);color:var(--wd-ink);line-height:1.4;text-align:inherit}',
      '.invitation.invitation--wd .wd-venue__map{display:inline-flex;align-items:center;gap:6px;padding:0.35rem 0.85rem;border:1px solid var(--wd-line);border-radius:999px;color:var(--wd-title);font-family:var(--wd-caps-f);font-size:clamp(0.58rem,2.7cqi,0.8rem);letter-spacing:0.06em;text-decoration:none;background:var(--wd-card)}',
      '.wd-venue__map svg{color:var(--wd-accent);flex:none}',
      '.invitation.invitation--wd .wd-venue__map{white-space:nowrap}',
      '@container invite (max-width:290px){.invitation.invitation--wd .wd-venue__map{padding:0.3rem 0.6rem;letter-spacing:0}',
      '.wd-venue{gap:2.5cqi}',
      '.wd-events{display:grid;gap:2cqi;margin:0 -3cqi}',
      '.wd-events--cards{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:1.4cqi}',
      '.wd-events--cards.wd-events--n1{grid-template-columns:minmax(0,60%);justify-content:center}',
      '.wd-event{display:flex;flex-direction:column;align-items:center;gap:1px;padding:2.2cqi 1.2cqi;text-align:center}',
      '.wd-events--cards .wd-event{border:1px solid var(--wd-card-line);border-radius:12px;background:var(--wd-card)}',
      '.wd-events--columns{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:0}',
      '.wd-events--columns .wd-event + .wd-event{border-left:1px solid var(--wd-line)}',
      '.wd-events--timeline{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:0;border-top:1px solid var(--wd-line);border-bottom:1px solid var(--wd-line)}',
      '.wd-events--timeline .wd-event + .wd-event{border-left:1px solid var(--wd-line)}',
      '.wd-event__icon{width:7.5cqi;height:7.5cqi;min-width:22px;min-height:22px;color:var(--wd-accent);margin-bottom:0.25rem}',
      '.wd-event__icon--photo{width:15cqi;height:11cqi;min-width:52px;min-height:40px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.18))}',
      '.wd-event__title{font-family:var(--wd-caps-f);font-size:clamp(0.5rem,2.4cqi,0.72rem);letter-spacing:0.12em;text-transform:uppercase;color:var(--wd-title);font-weight:700;line-height:1.3}',
      '.wd-event__date,.wd-event__time{font-family:var(--wd-body-f);font-size:clamp(0.62rem,2.8cqi,0.82rem);color:var(--wd-ink);line-height:1.3}',
      '.invitation.invitation--wd .invitation__gallery-title{color:var(--wd-accent);font-family:var(--wd-caps-f);letter-spacing:0.2em}',
      '.invitation.invitation--wd .invitation__blessings{margin:0.4rem 0}',
      '.invitation.invitation--wd .invitation__blessings-grid{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:3cqi}',
      '.invitation.invitation--wd .invitation__blessings-side strong{display:block;font-family:var(--wd-caps-f);color:var(--wd-title);font-size:clamp(0.82rem,3.8cqi,1.1rem)}',
      '.invitation.invitation--wd .invitation__blessings-side p{color:var(--wd-ink);font-family:var(--wd-body-f);font-size:clamp(0.72rem,3.2cqi,0.92rem);margin:0}',
      '.invitation.invitation--wd .invitation__blessings-divider{width:1px;height:40px;background:var(--wd-line);opacity:1}',
      '.wd-closing{margin-top:0.8rem}',
      '.wd-closing__heart{display:inline-flex;color:var(--wd-accent)}',
      '.invitation.invitation--wd .wd-closing__title{margin:0.3rem 0 0.15rem;font-family:var(--wd-caps-f);letter-spacing:0.2em;text-transform:uppercase;font-size:clamp(0.56rem,2.7cqi,0.8rem);color:var(--wd-accent);font-weight:600}',
      '.invitation.invitation--wd .wd-closing__msg{margin:0;font-family:var(--wd-body-f);font-style:italic;color:var(--wd-ink);font-size:clamp(0.78rem,3.5cqi,1rem);opacity:1}',
      '.invitation.invitation--wd .inv-btn{color:var(--wd-title);border-color:var(--wd-line);background:var(--wd-card)}',
      '.invitation.invitation--wd .invitation__footer{color:var(--wd-ink);opacity:0.7;border-top-color:var(--wd-line)}',
      '.invitation .invitation__gallery[class*="invitation__gallery--n"] img{object-fit:contain;padding:3px;background:color-mix(in srgb,var(--inv-ink,#000) 6%,transparent)}',
      '.invitation .invitation__gallery--n1{grid-template-columns:1fr}',
      '.invitation .invitation__gallery--n1 img{aspect-ratio:4 / 3}',
      '.invitation .invitation__gallery--n2{grid-template-columns:repeat(2,minmax(0,1fr))}',
      '.invitation .invitation__gallery--n2 img{aspect-ratio:1}',
      '.invitation .invitation__gallery--n3{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);grid-auto-rows:27cqi}',
      '.invitation .invitation__gallery--n3 li:first-child{grid-row:span 2}',
      '.invitation .invitation__gallery--n3 li{height:100%}',
      '.invitation .invitation__gallery--n3 img{height:100%;aspect-ratio:auto}',
      '.invitation .invitation__gallery--n4{grid-template-columns:repeat(2,minmax(0,1fr))}',
      '.invitation .invitation__gallery--n4 img{aspect-ratio:1}',
      '.invitation .invitation__gallery--n5{grid-template-columns:repeat(6,minmax(0,1fr))}',
      '.invitation .invitation__gallery--n5 li{grid-column:span 2}',
      '.invitation .invitation__gallery--n5 li:nth-child(-n+2){grid-column:span 3}',
      '.invitation .invitation__gallery--n5 li:nth-child(-n+2) img{aspect-ratio:4 / 3}',
      '.invitation .invitation__gallery--n5 li:nth-child(n+3) img{aspect-ratio:1}',
      '.wd-frame--la .wd-la{position:absolute;height:auto;pointer-events:none;opacity:0.96}',
      '.wd-la--tl,.wd-la--tr{top:1%;width:auto;max-width:30%;max-height:max(34cqi,110px)}',
      '.wd-la--tl{left:1.4%}',
      '.wd-la--tr{right:1.4%;transform:scaleX(-1)}',
      '.wd-la--bl,.wd-la--br{bottom:0.6%;width:auto;max-width:30%;max-height:38cqi}',
      '.wd-la--bl{left:1%}',
      '.wd-la--br{right:1%;transform:scaleX(-1)}',
      '.wd-la--l,.wd-la--r{top:44%;width:auto;max-width:8%;max-height:30cqi}',
      '.wd-la--l{left:0.8%}',
      '.wd-la--r{right:0.8%;transform:scaleX(-1)}',
      '.wd-amp--la{position:relative}',
      '.wd-la-sprig{position:absolute;width:11cqi;height:auto;pointer-events:none}',
      '.wd-couple--row .wd-la-sprig{top:96%;width:7cqi}',
      '.wd-couple--row .wd-la-sprig--l{right:50%;transform:scaleX(-1)}',
      '.wd-couple--row .wd-la-sprig--r{left:50%}',
      '.wd-couple--stack .wd-la-sprig{top:50%;width:13cqi}',
      '.wd-couple--stack .wd-la-sprig--l{right:115%;transform:translateY(-50%) scaleX(-1)}',
      '.wd-couple--stack .wd-la-sprig--r{left:115%;transform:translateY(-50%)}',
      '.invitation.invitation--wd.wd-l-botanical:has(>.wd-frame--la),.invitation.invitation--wd.wd-l-editorial:has(>.wd-frame--la){padding-top:calc(2.4rem + 12%)}',
      '@container invite (max-width:380px){.wd-la--tl,.wd-la--tr{max-width:24%;max-height:26cqi}',
      '.invitation.invitation--wd:has(>.wd-frame--la)::after{content:"";display:block;position:static;inset:auto;width:auto;height:22cqi;margin:0;background:none;border:0;transform:none;opacity:1;pointer-events:none}',
      '.share-choice{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--space-4)}',
      '.share-choice__card{position:relative;display:flex;flex-direction:column;gap:var(--space-3);padding:var(--space-5);border:1px solid var(--border);border-radius:var(--r-xl);background:var(--surface);box-shadow:var(--shadow-sm)}',
      '.share-choice__card--featured{border-color:color-mix(in srgb,var(--primary) 45%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 12%,transparent),var(--shadow-md)}',
      '.share-choice__card h3{font-size:var(--step-1);margin:0}',
      '.share-choice__card>p{margin:0;color:var(--fg-muted);font-size:var(--step--1);line-height:1.55}',
      '.share-choice__tag{align-self:flex-start;padding:3px 12px;border-radius:var(--r-pill);font-size:.74rem;font-weight:700;letter-spacing:.04em;background:color-mix(in srgb,var(--primary) 14%,transparent);color:var(--primary)}',
      '.share-choice__list{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:var(--step--1)}',
      '.share-choice__list li{display:flex;gap:8px;align-items:flex-start}',
      '.share-choice__list svg{flex:none;margin-top:2px;color:var(--success)}',
      '.share-choice__actions{margin-top:auto;display:flex;flex-wrap:wrap;gap:var(--space-2)}',
      '.share-choice__actions .btn{flex:1 1 auto;justify-content:center}',
      '.step-subtitle{font-size:var(--step-1);margin:var(--space-6) 0 var(--space-3)}',
      '.compare-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:var(--r-lg)}',
      '.compare-table{width:100%;border-collapse:collapse;font-size:var(--step--1)}',
      '.compare-table th,.compare-table td{padding:10px 14px;border-bottom:1px solid var(--border);text-align:center}',
      '.compare-table tbody th{text-align:left;font-weight:600;color:var(--fg)}',
      '.compare-table thead th{background:var(--surface-2);font-weight:700}',
      '.compare-table tr:last-child th,.compare-table tr:last-child td{border-bottom:0}',
      '.compare-table td:last-child{color:var(--primary);font-weight:700}',
      '.step-more{margin-top:var(--space-5);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--space-3) var(--space-4);background:var(--surface)}',
      '.step-more>summary{cursor:pointer;font-weight:600;font-size:var(--step--1)}',
      '.flow-steps{list-style:none;counter-reset:flow;margin:0;padding:0;display:grid;gap:var(--space-3)}',
      '.flow-steps li{counter-increment:flow;position:relative;padding:var(--space-3) var(--space-4) var(--space-3) 3.4rem;border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);display:grid;gap:2px}',
      '.flow-steps li::before{content:counter(flow);position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);width:2rem;height:2rem;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#fff;background:var(--primary)}',
      '.flow-steps b{font-size:var(--step-0)}',
      '.flow-steps span{color:var(--fg-muted);font-size:var(--step--1)}',
      '.plan__secure{display:flex;align-items:center;justify-content:center;gap:6px;margin:var(--space-3) 0 0;font-size:.76rem;color:var(--fg-muted);text-align:center}',
      '.pay-methods{margin-top:var(--space-5);padding:var(--space-4);border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface)}',
      '.pay-methods__title{margin:0 0 var(--space-3);font-weight:700}',
      '.pay-methods ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--space-3)}',
      '.pay-methods li{display:grid;gap:2px;padding:var(--space-3);border-radius:var(--r-md);background:var(--surface-2)}',
      '.pay-methods li b{color:var(--primary)}',
      '.pay-methods li span{font-size:.8rem;color:var(--fg-muted)}',
      '.faq-mini{display:grid;gap:var(--space-2)}',
      '.faq-mini details{border:1px solid var(--border);border-radius:var(--r-md);padding:var(--space-3) var(--space-4);background:var(--surface)}',
      '.faq-mini summary{cursor:pointer;font-weight:600;font-size:var(--step--1)}',
      '.faq-mini p{margin:var(--space-2) 0 0;color:var(--fg-muted);font-size:var(--step--1);line-height:1.6}',
      '.notice[hidden],.hosted-result[hidden],.pricing-grid[hidden]{display:none !important}',
      '.wd-l-engagement .wd-crest{margin-bottom:0.2rem}',
      '.wd-l-engagement .wd-crest .wd-motif{width:36cqi;height:30cqi;filter:drop-shadow(0 4px 10px rgba(80,30,40,0.18))}',
      '.wd-frame--photo .wd-la{opacity:1}',
      '.wd-frame--photo .wd-la--tl,.wd-frame--photo .wd-la--tr{max-width:36%;max-height:max(36cqi,120px);top:0}',
      '.wd-frame--photo .wd-la--tl{left:0}',
      '.wd-frame--photo .wd-la--tr{right:0}',
      '.wd-frame--photo .wd-la--bl,.wd-frame--photo .wd-la--br{max-width:34%;max-height:32cqi;bottom:0}',
      '.wd-frame--photo .wd-la--bl{left:0}',
      '.wd-frame--photo .wd-la--br{right:0}',
      '.wd-l-engagement .wd-couple--stack .wd-name{font-size:calc(clamp(2rem,13cqi,3.6rem) * var(--wd-name-size,1))}',
      '.wd-l-engagement .wd-couple--stack .wd-la-sprig{width:15cqi}',
      '.wd-l-engagement .wd-couple--row{column-gap:3cqi}',
      '.wd-l-engagement .wd-couple--row .wd-amp span{font-size:clamp(1.1rem,6cqi,1.8rem)}',
      '.wd-eng-title{display:flex;flex-direction:column;align-items:center;width:fit-content;max-width:100%;margin:0.9rem auto 1.2rem;line-height:1.1;text-align:center}',
      '.wd-eng-title__script{font-family:var(--wd-display-f);color:var(--wd-accent);font-size:clamp(1.6rem,9cqi,2.5rem);letter-spacing:0.02em}',
      '.wd-eng-title__caps{margin-top:0.6rem;padding:0.35rem 1.1rem;font-family:var(--wd-caps-f);font-size:clamp(0.58rem,2.6cqi,0.78rem);letter-spacing:0.32em;text-transform:uppercase;color:var(--wd-title);border-top:1px solid var(--wd-line);border-bottom:1px solid var(--wd-line)}',
      '.wd-l-engagement .wd-date--stack .wd-date__big{font-size:clamp(3rem,20cqi,5.4rem)}',
      '@container invite (max-width:380px){.wd-frame--photo .wd-la--tl,.wd-frame--photo .wd-la--tr{max-width:30%;max-height:30cqi}',
      '.wd-frame--photo .wd-la{max-height:none;opacity:1}',
      '.wd-frame--photo .wd-la--bq{width:36%;max-width:none;top:-2%}',
      '.wd-frame--photo .wd-la--tl.wd-la--bq{left:-6%}',
      '.wd-frame--photo .wd-la--tr.wd-la--bq{right:-6%;transform:scaleX(-1)}',
      '.wd-frame--photo .wd-la--br.wd-la--flip{top:auto;bottom:-3%;right:-6%;transform:rotate(180deg)}',
      '.wd-frame--photo .wd-la--cl-sm{width:40%;max-width:none;bottom:-2%}',
      '.wd-frame--photo .wd-la--bl.wd-la--cl-sm{left:-5%}',
      '.wd-frame--photo .wd-la--br.wd-la--cl-sm{right:-5%;transform:scaleX(-1)}',
      '.wd-frame--photo .wd-la--garland{top:-2%;left:50%;width:104%;max-width:none;transform:translateX(-50%)}',
      '.wd-frame--photo .wd-la--cluster{bottom:-2%;left:50%;width:62%;max-width:none;max-height:34cqi;object-fit:contain;transform:translateX(-50%)}',
      '.wd-frame--photo .wd-la--vl,.wd-frame--photo .wd-la--vr{top:3%;width:17%;max-width:none}',
      '.wd-frame--photo .wd-la--vl{left:-3%}',
      '.wd-frame--photo .wd-la--vr{right:-3%;transform:scaleX(-1)}',
      '.wd-frame--photo .wd-la--gold{top:1%;width:auto;max-width:30%;max-height:max(34cqi,110px);opacity:0.95}',
      '.wd-frame--photo .wd-la--bl.wd-la--gold,.wd-frame--photo .wd-la--br.wd-la--gold{top:auto;bottom:0.6%;max-height:34cqi}',
      '.wd-crest--wreath{position:relative;width:62cqi;height:56cqi;margin:0 auto 0.2rem;display:grid;place-items:center}',
      '.wd-crest__wreath{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}',
      '.wd-l-engagement .wd-crest--wreath .wd-motif{position:relative;width:28cqi;height:26cqi}',
      '.invitation.invitation--wd.wd-dec-garland{padding-top:calc(2.4rem + 13%)}',
      '.invitation.invitation--wd.wd-dec-corners,.invitation.invitation--wd.wd-dec-diagonal{padding-top:calc(2.4rem + 10%)}',
      '.invitation.invitation--wd.wd-dec-vines{padding-left:15%;padding-right:15%}',
      '.invitation.invitation--wd.wd-dec-garland::after,.invitation.invitation--wd.wd-dec-luxury::after{height:40cqi !important}',
      '.invitation.invitation--wd.wd-dec-corners::after,.invitation.invitation--wd.wd-dec-wreath::after{height:28cqi !important}',
      '.invitation.invitation--wd.wd-dec-diagonal::after{height:38cqi !important}',
      '.wd-couple--solo{display:flex;justify-content:center;text-align:center}',
      '.wd-couple--solo .wd-person{text-align:center}',
      '.wd-l-engagement .wd-couple--solo .wd-name{font-size:calc(clamp(2.4rem,16cqi,4.4rem) * var(--wd-name-size,1));line-height:1.1;overflow-wrap:anywhere}',
      '.wd-bday-title .wd-eng-title__script{font-size:clamp(1.6rem,9.5cqi,2.8rem)}',
      '.wd-bday-title.wd-eng-title--long .wd-eng-title__script{font-size:clamp(1.4rem,8cqi,2.4rem)}',
      '.wd-eng-title--long .wd-eng-title__script{font-size:clamp(1.7rem,10cqi,3rem);text-align:center}',
      '.wd-bday-title{margin-top:0.2rem}',
      '.wd-bday-age{display:flex;flex-direction:column;align-items:center;justify-content:center;width:24cqi;height:24cqi;max-width:120px;max-height:120px;margin:0.6rem auto 0.1rem;border-radius:50%;border:1.5px solid var(--wd-line);box-shadow:inset 0 0 0 4px var(--wd-soft);background:var(--wd-card)}',
      '.wd-bday-age small{font-family:var(--wd-caps-f);font-size:clamp(0.5rem,2.2cqi,0.66rem);letter-spacing:0.26em;text-transform:uppercase;color:var(--wd-ink)}',
      '.wd-bday-age b{font-family:var(--wd-display-f);font-size:clamp(1.9rem,11cqi,3rem);line-height:1;color:var(--wd-title);font-weight:600}',
      '.wd-script .wd-bday-age b{font-family:var(--wd-caps-f)}',
      '.invitation.invitation--wd .wd-bday-tagline{font-style:italic;margin-top:-0.3rem}',
      '.wd-bday-closing{margin-top:1rem}',
      '.wd-fam-birthday .wd-frame--photo .wd-la--bq{width:29%;top:-1%}',
      '.wd-occ-amp{display:inline-block;margin:0 0.18em;font-family:var(--wd-display-f);color:var(--wd-accent);font-size:0.72em}',
      '.wd-script .wd-occ-amp{font-family:var(--wd-caps-f);font-size:0.5em;vertical-align:0.25em}',
      '.invitation.invitation--wd .wd-occ-relation{margin-bottom:-0.2rem}',
      '.invitation.invitation--wd .wd-occ-parents{text-align:center;margin:0.1rem auto 0.4rem}',
      '.invitation.invitation--wd .wd-occ-note{font-style:italic;margin-top:-0.2rem}',
      '.wd-occ-title .wd-bday-age small{margin-top:0.15rem}',
      '.invitation.invitation--wd .wd-occ-parents{text-transform:none;letter-spacing:0.02em;margin:0.35rem auto 0.2rem}',
      '.invitation.invitation--wd .wd-occ-parents>span{font-style:italic;text-transform:none;letter-spacing:0.06em;margin-bottom:0.1rem;font-size:clamp(0.7rem,3.2cqi,0.9rem)}',
      '.invitation.invitation--wd .wd-occ-parents b{display:block;font-family:var(--wd-display-f);font-weight:600;font-size:clamp(1.05rem,5.4cqi,1.45rem);color:var(--wd-title);line-height:1.2}',
      '.invitation.invitation--wd .wd-occ-parents b .wd-occ-n{display:inline-block;white-space:nowrap;font-style:normal;letter-spacing:0;color:inherit;margin:0;font-size:1em}',
      '.invitation.invitation--wd .wd-occ-parents b .wd-occ-amp{display:inline-block;margin:0 0.2em;font-style:normal;letter-spacing:0;color:var(--wd-accent);font-size:0.85em}',
      '.wd-fam-baby-shower .wd-occ-title,.wd-fam-naming-ceremony .wd-occ-title{margin-top:1.4rem}',
      '.wd-fam-baby-shower .wd-frame--photo .wd-la--bq{width:29%;top:-1%}',
      '.invitation.invitation--wd .invitation__countdown{grid-template-columns:repeat(4,minmax(0,1fr))}',
      '@container (max-width:360px){.invitation.invitation--wd .invitation__countdown .cd-label{letter-spacing:0.02em;font-size:0.5rem}',
      '.wd-occ-n{display:inline-block;white-space:nowrap}',
      '.wd-l-engagement.wd-fam-anniversary .wd-couple--solo .wd-name{font-size:calc(clamp(1.9rem,10.5cqi,3.4rem) * var(--wd-name-size,1));overflow-wrap:normal}',
      '.invitation.invitation--wd.wd-dec-backdrop{background:var(--inv-bg1);padding-top:calc(2.4rem + 12cqi)}',
      '.wd-frame--photo .wd-bd{position:absolute;inset:0;background-size:cover;background-position:center;pointer-events:none}',
      '.wd-dec-backdrop .wd-frame--photo .wd-la--vl,.wd-dec-backdrop .wd-frame--photo .wd-la--vr{top:14cqi;width:15%}',
      '.wd-dec-backdrop .wd-frame--photo .wd-la--foot{top:auto;bottom:18cqi}',
      '.wd-dec-backdrop .wd-frame--photo .wd-la--vl.wd-la--foot{transform:scaleY(-1)}',
      '.wd-dec-backdrop .wd-frame--photo .wd-la--vr.wd-la--foot{transform:scale(-1,-1)}',
      /* END Telugu Pelli lake palace */
      /* Entrance animation (mirrors css/style.css) */
      '@keyframes ih-card-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
      '@keyframes ih-card-pop{0%{opacity:0;transform:scale(.88)}70%{opacity:1;transform:scale(1.02)}100%{opacity:1;transform:none}}',
      '.invitation--enter-fade{animation:ih-card-fade .9s cubic-bezier(.22,.61,.36,1) both}',
      '.invitation--enter-pop{animation:ih-card-pop .7s cubic-bezier(.34,1.4,.64,1) both}',
      '.invitation.invitation--regional.invitation--font-picked .tp-name{font-family:var(--inv-font-display)}',
      '@media(prefers-reduced-motion:reduce){',
      '  html{scroll-behavior:auto}',
      '  *,*::before,*::after{transition:none!important;animation:none!important}',
      '}'
    ].join('\n');
  }

  /* ------------------------------------------------------------------
     Complete Host Page stylesheet (matches lovely-and-nani reference)
     ------------------------------------------------------------------ */

  function siteHostPageCss(p) {
    return [
      ':root{',
      '  --site-p:' + p.primary + ';',
      '  --site-s:' + p.secondary + ';',
      '  --site-b1:' + p.bg1 + ';',
      '  --site-b2:' + p.bg2 + ';',
      '  --site-ink:' + p.ink + ';',
      '  --site-fd:' + p.display + ';',
      '  --site-fb:' + p.body + ';',
      '}',
      'html{scroll-behavior:smooth}',
      '[id]{scroll-margin-top:72px}',
      'body{margin:0;font-family:var(--site-fb);color:var(--site-ink);background:var(--site-b1);line-height:1.6;overflow-x:hidden}',
      'img{max-width:100%;display:block}',
      'a{text-decoration:none;color:inherit}',
      'button{font:inherit;cursor:pointer}',
      'h1,h2,h3{margin:0}',
      '.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
      '.site-container{width:min(100% - 48px,1200px);margin-inline:auto}',
      '',
      '/* Nav */',
      '.site-nav{position:sticky;top:0;z-index:100;background:color-mix(in srgb,var(--site-b1) 88%,transparent);-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);border-bottom:1px solid color-mix(in srgb,var(--site-ink) 10%,transparent);transition:box-shadow .3s ease}',
      '.site-nav.is-scrolled{box-shadow:0 10px 28px rgba(20,10,25,.08)}',
      '.site-nav__inner{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:64px;width:min(100% - 48px,1200px);margin-inline:auto}',
      '.site-nav__brand{font-family:var(--site-fd);font-size:1.22rem;font-weight:700;color:var(--site-p);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}',
      '.site-nav__menu{display:flex;align-items:center;gap:4px}',
      '.site-nav__link{padding:8px 14px;border-radius:999px;font-size:.9rem;font-weight:600;color:var(--site-ink);opacity:.8;transition:all .2s ease}',
      '.site-nav__link:hover{opacity:1;background:color-mix(in srgb,var(--site-p) 12%,transparent);color:var(--site-p)}',
      '.site-nav__burger{display:none;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;border:1px solid color-mix(in srgb,var(--site-ink) 14%,transparent);background:transparent;color:var(--site-ink)}',
      '.site-nav__burger svg{width:22px;height:22px}',
      '',
      '/* Hero */',
      '.site-hero{position:relative;min-height:100svh;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;background-size:cover;background-position:center;isolation:isolate}',
      '.site-hero__shade{position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(20,10,25,.32),rgba(20,10,25,.62));pointer-events:none}',
      '.site-hero__inner{position:relative;z-index:1;max-width:900px;width:100%;padding:96px 24px;display:grid;justify-items:center}',
      '.site-hero__photo{width:132px;height:132px;object-fit:cover;border-radius:50%;border:4px solid rgba(255,255,255,.75);box-shadow:0 18px 50px rgba(0,0,0,.35);margin-bottom:26px}',
      '.site-hero__kicker{text-transform:uppercase;letter-spacing:.24em;font-size:.78rem;font-weight:700;color:rgba(255,255,255,.92)}',
      '.site-hero__additional-title{font-family:var(--site-fd);letter-spacing:.28em;font-size:clamp(.8rem,1.8vw,1.1rem);font-weight:700;color:var(--site-s);margin-top:12px;margin-bottom:4px;text-wrap:balance;white-space:pre-line}',
      '.site-hero__additional-subtitle{font-family:var(--site-fb);font-style:italic;letter-spacing:.06em;font-size:clamp(.75rem,1.5vw,.95rem);font-weight:500;color:rgba(255,255,255,.88);margin-bottom:12px;text-wrap:balance;white-space:pre-line}',
      '.site-hero__names{font-family:var(--site-fd);font-weight:700;font-size:clamp(2.6rem,9vw,6.2rem);line-height:1.02;margin:18px 0 6px;text-wrap:balance}',
      '.site-hero__names .amp{display:block;font-size:.6em;font-weight:600;line-height:1.7;color:var(--site-s)}',
      '.site-hero__couple{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:start;justify-content:center;gap:0 clamp(8px,2vw,18px);margin:18px 0 6px;width:100%}',
      '.site-hero__person{display:contents}',
      '.site-hero__person--left .site-hero__person-name,.site-hero__person:first-child .site-hero__person-name{grid-column:1;grid-row:1;text-align:right}',
      '.site-hero__person--right .site-hero__person-name,.site-hero__person:last-child .site-hero__person-name{grid-column:3;grid-row:1;text-align:left}',
      '.site-hero__person--left .site-hero__person-parents,.site-hero__person:first-child .site-hero__person-parents{grid-column:1;grid-row:2;text-align:right}',
      '.site-hero__person--right .site-hero__person-parents,.site-hero__person:last-child .site-hero__person-parents{grid-column:3;grid-row:2;text-align:left}',
      '.site-hero__couple:not(.site-hero__couple--swapped) .site-hero__person--groom .site-hero__person-name{grid-column:1;grid-row:1;text-align:right}',
      '.site-hero__couple:not(.site-hero__couple--swapped) .site-hero__person--bride .site-hero__person-name{grid-column:3;grid-row:1;text-align:left}',
      '.site-hero__couple:not(.site-hero__couple--swapped) .site-hero__person--groom .site-hero__person-parents{grid-column:1;grid-row:2;text-align:right}',
      '.site-hero__couple:not(.site-hero__couple--swapped) .site-hero__person--bride .site-hero__person-parents{grid-column:3;grid-row:2;text-align:left}',
      '.site-hero__couple--swapped .site-hero__person--bride .site-hero__person-name{grid-column:1;grid-row:1;text-align:right}',
      '.site-hero__couple--swapped .site-hero__person--groom .site-hero__person-name{grid-column:3;grid-row:1;text-align:left}',
      '.site-hero__couple--swapped .site-hero__person--bride .site-hero__person-parents{grid-column:1;grid-row:2;text-align:right}',
      '.site-hero__couple--swapped .site-hero__person--groom .site-hero__person-parents{grid-column:3;grid-row:2;text-align:left}',
      '.site-hero__person-name{font-family:var(--site-fd);font-weight:700;font-size:clamp(2rem,6.5vw,4.5rem);line-height:1.08;margin:0;overflow-wrap:break-word;hyphens:auto;text-wrap:balance}',
      '.site-hero__couple-sep{grid-column:2;grid-row:1;flex:none;display:flex;align-items:center;justify-content:center;align-self:flex-start;padding-top:clamp(0.2rem,1vw,0.6rem);font-size:clamp(1.6rem,4vw,3rem);font-weight:400;color:var(--site-s);line-height:1.2}',
      '.site-hero__person-parents{margin-top:8px;font-size:clamp(.78rem,1.4vw,.92rem);line-height:1.35;color:rgba(255,255,255,.9)}',
      '.site-hero__person-parents span{display:block;font-size:.74em;text-transform:uppercase;letter-spacing:.12em;opacity:.8;margin-bottom:2px;font-weight:600}',
      '.site-hero__person-parents strong{display:block;font-weight:600;color:#fff}',
      '.site-hero__sub{font-family:var(--site-fd);font-size:clamp(1.1rem,2.6vw,1.7rem);color:rgba(255,255,255,.94)}',
      '.site-hero__when{margin-top:16px;letter-spacing:.14em;font-size:.92rem;text-transform:uppercase;opacity:.92}',
      '.site-hero__cta{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:34px}',
      '.site-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:999px;font-weight:700;font-size:.95rem;border:1px solid transparent;transition:transform .2s ease,box-shadow .2s ease;color:#fff}',
      '.site-btn svg{width:17px;height:17px}',
      '.site-btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(0,0,0,.22)}',
      '.site-btn--light{background:#fff;color:var(--site-p)}',
      '.site-btn--ghost{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.4)}',
      '.site-btn--solid{background:var(--site-p);color:#fff}',
      '.site-btn--soft{background:color-mix(in srgb,var(--site-p) 11%,transparent);color:var(--site-p)}',
      '',
      '/* Sections */',
      '.site-section{padding:88px 0;scroll-margin-top:72px}',
      '.site-section--alt{background:color-mix(in srgb,var(--site-b2) 40%,var(--site-b1))}',
      '.site-title{text-align:center;margin-bottom:52px}',
      '.site-title__eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:.74rem;font-weight:700;color:var(--site-p)}',
      '.site-title h2{font-family:var(--site-fd);font-size:clamp(2rem,5vw,3.1rem);margin:12px 0 14px;color:var(--site-ink)}',
      '.site-title p{max-width:640px;margin:0 auto;color:color-mix(in srgb,var(--site-ink) 72%,transparent);font-size:1.02rem}',
      '',
      '/* Story */',
      '.site-story{max-width:820px;margin:0 auto;text-align:center}',
      '.site-story p{font-family:var(--site-fd);font-size:clamp(1.25rem,2.8vw,1.75rem);line-height:1.85;color:var(--site-ink);white-space:pre-line}',
      '',
      '/* Details */',
      '.site-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}',
      '.site-detail{background:rgba(255,255,255,.72);border:1px solid color-mix(in srgb,var(--site-ink) 10%,transparent);border-radius:20px;padding:30px 22px;text-align:center}',
      '.site-detail svg{width:26px;height:26px;color:var(--site-p)}',
      '.site-detail small{display:block;text-transform:uppercase;letter-spacing:.16em;font-size:.7rem;font-weight:700;color:color-mix(in srgb,var(--site-p) 85%,#000);margin:12px 0 6px}',
      '.site-detail strong{font-family:var(--site-fd);font-size:1.18rem;line-height:1.45}',
      '',
      '/* Gallery */',
      '.site-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;grid-auto-flow:dense}',
      '.site-gallery__item{position:relative;margin:0;overflow:hidden;border-radius:18px;aspect-ratio:1;cursor:zoom-in;background:color-mix(in srgb,var(--site-p) 14%,var(--site-b1))}',
      '.site-gallery__item img{width:100%;height:100%;object-fit:contain;transition:transform .6s ease}',
      '.site-gallery__item:hover img,.site-gallery__item:focus-visible img{transform:scale(1.07)}',
      '.site-gallery__item:focus-visible{outline:3px solid var(--site-p);outline-offset:2px}',
      '.site-gallery__zoom{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(180deg,transparent,rgba(20,10,25,.45));opacity:0;transition:opacity .3s ease;color:#fff}',
      '.site-gallery__zoom span{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.25);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-size:1.4rem;line-height:1}',
      '.site-gallery__item:hover .site-gallery__zoom,.site-gallery__item:focus-visible .site-gallery__zoom{opacity:1}',
      /* Gallery pattern per photo count; 6 photos keep the original wide-first mosaic. */
      '.site-gallery.site-gallery--n1{grid-template-columns:1fr;max-width:860px;margin-inline:auto}',
      '.site-gallery.site-gallery--n1 .site-gallery__item{grid-column:auto;grid-row:auto;aspect-ratio:16/9}',
      '.site-gallery.site-gallery--n2{grid-template-columns:repeat(2,1fr);max-width:980px;margin-inline:auto}',
      '.site-gallery.site-gallery--n2 .site-gallery__item{grid-column:auto;grid-row:auto;aspect-ratio:1}',
      '.site-gallery.site-gallery--n3{grid-template-columns:2fr 1fr;grid-template-rows:repeat(2,1fr)}',
      '.site-gallery.site-gallery--n3 .site-gallery__item{grid-column:auto;grid-row:auto}',
      '.site-gallery.site-gallery--n3 .site-gallery__item:first-child{grid-row:span 2;aspect-ratio:auto}',
      '.site-gallery.site-gallery--n4{grid-template-columns:repeat(3,1fr)}',
      '.site-gallery.site-gallery--n4 .site-gallery__item{grid-column:auto;grid-row:auto}',
      '.site-gallery.site-gallery--n4 .site-gallery__item:first-child{grid-column:1/-1;aspect-ratio:21/9}',
      '.site-gallery.site-gallery--n5{grid-template-columns:repeat(6,1fr)}',
      '.site-gallery.site-gallery--n5 .site-gallery__item{grid-column:span 2;grid-row:auto}',
      '.site-gallery.site-gallery--n5 .site-gallery__item:nth-child(-n+2){grid-column:span 3;aspect-ratio:4/3}',
      '@media(max-width:920px){',
      '  .site-gallery.site-gallery--n1{grid-template-columns:1fr}',
      '  .site-gallery.site-gallery--n1 .site-gallery__item{aspect-ratio:4/3}',
      '  .site-gallery.site-gallery--n3{grid-template-columns:repeat(2,1fr);grid-template-rows:none}',
      '  .site-gallery.site-gallery--n3 .site-gallery__item:first-child{grid-column:1/-1;grid-row:auto;aspect-ratio:16/10}',
      '  .site-gallery.site-gallery--n4{grid-template-columns:repeat(2,1fr)}',
      '  .site-gallery.site-gallery--n4 .site-gallery__item:first-child{grid-column:auto;aspect-ratio:1}',
      '  .site-gallery.site-gallery--n5{grid-template-columns:repeat(2,1fr)}',
      '  .site-gallery.site-gallery--n5 .site-gallery__item,.site-gallery.site-gallery--n5 .site-gallery__item:nth-child(-n+2){grid-column:auto;aspect-ratio:1}',
      '  .site-gallery.site-gallery--n5 .site-gallery__item:first-child{grid-column:1/-1;aspect-ratio:16/10}',
      '}',
      '',
      '/* Countdown */',
      '.site-count-section{background:linear-gradient(135deg,var(--site-p),color-mix(in srgb,var(--site-p) 58%,var(--site-b2)));color:#fff}',
      '.site-count-section .site-title h2{color:#fff}',
      '.site-count-section .site-title p{color:rgba(255,255,255,.86)}',
      '.site-count .invitation__countdown{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;max-width:820px;margin:0 auto}',
      '.site-count .cd-unit{display:grid;gap:6px;justify-items:center;padding:26px 14px;border:1px solid rgba(255,255,255,.22);border-radius:18px;background:rgba(255,255,255,.08);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
      '.site-count .cd-value{font-family:var(--site-fd);font-size:clamp(2rem,5vw,3.4rem);font-weight:700;line-height:1;transition:transform .3s ease}',
      /* Counting up after the event: pink digits; the default design's
         translucent boxes turn white so pink stays readable on its band. */
      '.site-count .invitation__countdown.is-since .cd-unit{background:#fff}',
      '.site-count .invitation__countdown.is-since .cd-value{color:#E0407B!important}',
      '.site-count .invitation__countdown.is-since .cd-label{color:#5A3D4A}',
      '.site-count .cd-value.is-ticking{transform:scale(1.08)}',
      '.site-count .cd-label{text-transform:uppercase;letter-spacing:.16em;font-size:.66rem;opacity:.9}',
      '',
      '/* Venue */',
      '.site-venue{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:stretch}',
      '.site-venue__card{background:rgba(255,255,255,.75);border:1px solid color-mix(in srgb,var(--site-ink) 10%,transparent);border-radius:24px;padding:42px;display:flex;flex-direction:column;gap:14px;justify-content:center}',
      '.site-venue__card h3{font-family:var(--site-fd);font-size:2rem}',
      '.site-venue__card p{margin:0;color:color-mix(in srgb,var(--site-ink) 78%,transparent);line-height:1.8}',
      '.site-venue__when{margin-top:6px}',
      '.site-venue__media{min-height:360px;border-radius:24px;background-size:cover;background-position:center;position:relative;display:grid;place-items:center;overflow:hidden;background:linear-gradient(160deg,var(--site-p),var(--site-b2))}',
      '.site-venue__media[style*="background-image"]{background-size:cover;background-position:center;background-repeat:no-repeat}',
      '.site-venue__media::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,10,25,.2),rgba(20,10,25,.55))}',
      '.site-venue__media-link{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;background:#fff;color:var(--site-p);font-weight:700}',
      '.site-venue__media-link svg{width:17px;height:17px}',
      '',
      '/* Actions */',
      '.site-actions{text-align:center}',
      '.site-actions .site-title{margin-bottom:36px}',
      '.site-actions__row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}',
      '',
      '/* Footer */',
      '.site-footer{background:color-mix(in srgb,var(--site-ink) 90%,#000);color:rgba(255,255,255,.86);text-align:center;padding:56px 24px}',
      '.site-footer__names{font-family:var(--site-fd);font-size:2rem;color:#fff;margin-bottom:8px}',
      '.site-footer p{margin:0;font-size:.86rem;color:rgba(255,255,255,.62)}',
      '.site-footer a{color:rgba(255,255,255,.9);text-decoration:underline;text-underline-offset:2px}',
      '',
      '/* Music */',
      '.site-music-btn{position:fixed;right:20px;bottom:20px;z-index:900;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.9);background:rgba(22,18,28,.86);color:#fff;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 0 0 1px rgba(0,0,0,.35),0 12px 30px rgba(0,0,0,.35);transition:transform .2s ease}',
      '.site-music-btn:hover{transform:scale(1.08)}',
      '.site-music-btn svg{width:22px;height:22px}',
      '.site-music-btn.is-playing svg{animation:site-spin 3s linear infinite}',
      DL_BTN_CSS,
      '@keyframes site-spin{to{transform:rotate(360deg)}}',
      '',
      '/* Lightbox */',
      '.site-lightbox{position:fixed;inset:0;z-index:1500;display:none;align-items:center;justify-content:center;background:rgba(10,6,12,.92);padding:24px}',
      '.site-lightbox.is-open{display:flex}',
      '.site-lightbox__img{max-width:min(92vw,1080px);max-height:82vh;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.5)}',
      '.site-lightbox__btn{position:absolute;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font-size:1.6rem;line-height:1}',
      '.site-lightbox__close{top:20px;right:20px}',
      '.site-lightbox__prev{left:16px;top:50%;transform:translateY(-50%)}',
      '.site-lightbox__next{right:16px;top:50%;transform:translateY(-50%)}',
      '.site-lightbox__count{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.75);font-size:.85rem}',
      '',
      '/* Toasts (rendered by IH.toast) */',
      '.toast-region{position:fixed;z-index:2000;left:50%;bottom:24px;transform:translateX(-50%);display:grid;gap:10px;width:min(92vw,420px);pointer-events:none}',
      '.toast{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:14px;background:#1c1220;color:#fff;font-size:.9rem;box-shadow:0 14px 34px rgba(0,0,0,.3);border-left:4px solid var(--site-s);transition:opacity .2s ease,transform .2s ease}',
      '.toast--error{border-left-color:#e05252}',
      '.toast__icon{flex:none;margin-top:2px}',
      '.toast__icon svg{width:16px;height:16px}',
      '.toast__title{font-weight:700;margin-bottom:2px}',
      '.toast__msg{opacity:.9;line-height:1.5}',
      '.toast__close{margin-left:auto;background:none;border:0;color:inherit;opacity:.7;padding:2px;flex:none}',
      '.toast__close svg{width:15px;height:15px}',
      '.toast.is-leaving{opacity:0;transform:translateY(6px)}',
      '',
      '@media(min-width:900px){',
      '  .site-gallery__item--wide{grid-column:span 2;grid-row:span 2}',
      '}',
      '@media(max-width:920px){',
      '  .site-nav__menu{position:absolute;top:100%;left:0;right:0;display:none;flex-direction:column;align-items:stretch;gap:2px;padding:10px;background:var(--site-b1);border-bottom:1px solid color-mix(in srgb,var(--site-ink) 10%,transparent);box-shadow:0 18px 34px rgba(0,0,0,.08)}',
      '  .site-nav__menu.is-open{display:flex}',
      '  .site-nav__link{padding:14px 16px;border-radius:12px}',
      '  .site-nav__burger{display:inline-flex}',
      '  .site-gallery{grid-template-columns:repeat(2,1fr);gap:12px}',
      '  .site-count .invitation__countdown{grid-template-columns:repeat(2,1fr);gap:12px}',
      '  .site-venue{grid-template-columns:1fr;gap:24px}',
      '  .site-venue__media{min-height:260px}',
      '}',
      '@media(max-width:560px){',
      '  .site-container{width:min(100% - 32px,1200px)}',
      '  .site-section{padding:64px 0}',
      '  .site-hero__inner{padding:72px 20px}',
      '  .site-gallery{grid-template-columns:repeat(2,1fr)}',
      '  .site-venue__card{padding:28px 22px}',
      '}',
      '@media(prefers-reduced-motion:reduce){',
      '  html{scroll-behavior:auto}',
      '  *,*::before,*::after{transition:none!important;animation:none!important}',
      '}',
      '',
      '/* ==================================================================',
      '   TELUGU PELLI BESPOKE HOST PAGE STYLING',
      '   Authentic traditional South Indian wedding theme matching the card:',
      '   Warm antique ivory parchment, deep royal maroon, temple gold,',
      '   Cinzel & Cormorant Garamond typography, 14-layer decorative motifs,',
      '   Auspicious Celebrations grid, Family Blessings & Ceremonial Landscape.',
      '   ================================================================== */',
      'body.site-host--regional{',
      '  --site-p:#7A1C28;',
      '  --site-s:#B8860B;',
      '  --site-b1:#FAF5EC;',
      '  --site-b2:#F5EADB;',
      '  --site-ink:#3D2E1E;',
      '  --site-fd:\'Cinzel\',\'Playfair Display\',\'Noto Serif Telugu\',Georgia,serif;',
      '  --site-fb:\'Cormorant Garamond\',\'Noto Serif Telugu\',\'DM Sans\',serif;',
      '  background:var(--site-b1);',
      '  color:var(--site-ink);',
      '  font-family:var(--site-fb);',
      '}',
      '.site-host--regional .site-container{width:min(100% - 48px,1180px);margin-inline:auto}',
      '',
      '/* Telugu Pelli Nav */',
      '.site-host--regional .site-nav{background:rgba(250,245,236,.94);border-bottom:1.5px solid rgba(184,134,11,.35);box-shadow:0 4px 18px rgba(184,134,11,.08)}',
      '.site-host--regional .site-nav__brand{font-family:var(--site-fd);font-weight:700;color:#7A1C28;letter-spacing:.06em}',
      '.site-host--regional .site-nav__link{color:#3D2E1E;font-weight:700;letter-spacing:.04em}',
      '.site-host--regional .site-nav__link:hover{background:rgba(184,134,11,.14);color:#7A1C28}',
      '.site-host--regional .site-nav__burger{border-color:#B8860B;color:#7A1C28}',
      '',
      '/* Telugu Pelli Hero */',
      '.site-host--regional .site-hero{position:relative;min-height:100svh;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--site-ink);background:radial-gradient(ellipse at 50% 25%,#FFFFFF 0%,#FAF5EC 55%,#F5EADB 100%);border-bottom:2px solid #B8860B;overflow:hidden}',
      '.site-host--regional .site-hero__shade{display:none!important}',
      '.site-host--regional .site-hero__inner{position:relative;z-index:10;max-width:960px;width:100%;padding:clamp(70px,10vw,120px) 24px clamp(50px,7vw,90px);display:grid;justify-items:center}',
      '',
      '/* Telugu Pelli Hero Decorative Layers */',
      '.site-host--regional .site-hero__backdrop{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1}',
      '.site-host--regional .site-hero-layer{position:absolute;pointer-events:none;user-select:none;-webkit-user-drag:none}',
      '',
      '/* Telugu Pelli Hero Apex Emblem */',
      '.site-host--regional .site-hero__apex{margin-bottom:clamp(10px,1.8vw,16px);display:inline-flex;justify-content:center;align-items:center;z-index:11}',
      '.site-host--regional .site-hero__apex-img{width:clamp(54px,7.5vw,80px);height:auto;filter:drop-shadow(0 4px 12px rgba(184,134,11,.35))}',
      '',
      '/* Telugu Pelli Hero Typography */',
      '.site-host--regional .site-hero__additional-title{font-family:var(--site-fd);letter-spacing:.18em;font-size:clamp(.95rem,2vw,1.3rem);font-weight:700;color:#7A1C28;text-transform:uppercase;margin-top:4px;margin-bottom:6px}',
      '.site-host--regional .site-hero__additional-subtitle{font-family:var(--site-fb);font-style:italic;letter-spacing:.04em;font-size:clamp(1.05rem,2.1vw,1.4rem);font-weight:600;color:#3D2E1E;opacity:.95;margin-bottom:14px;line-height:1.4}',
      '.site-host--regional .site-hero__person-name{font-family:var(--site-fd);font-weight:700;font-size:clamp(2.3rem,6.5vw,4.6rem);line-height:1.06;color:#7A1C28;letter-spacing:.02em;text-shadow:0 1px 2px rgba(122,28,40,.06)}',
      '.site-host--regional .site-hero__couple-sep{font-size:clamp(1.8rem,4.5vw,3.4rem);color:#B8860B;line-height:1.1}',
      '.site-host--regional .site-hero__couple-sep .amp{font-family:var(--site-fd);font-size:clamp(1.8rem,4.5vw,3.4rem);color:#B8860B;text-shadow:0 0 14px rgba(212,175,55,.45);font-weight:700}',
      '.site-host--regional .site-hero__person-parents{font-family:var(--site-fb);font-size:clamp(.95rem,1.8vw,1.22rem);color:#3D2E1E;margin-top:6px;font-weight:600}',
      '.site-host--regional .site-hero__person-parents span{color:#B8860B;font-weight:700;font-size:.78em;letter-spacing:.16em;text-transform:uppercase;opacity:1}',
      '.site-host--regional .site-hero__person-parents strong{color:#241A10;font-weight:700;font-size:1.08em}',
      '.site-host--regional .site-hero__sub{font-family:var(--site-fd);font-size:clamp(1.1rem,2.4vw,1.55rem);font-weight:700;color:#7A1C28;letter-spacing:.1em;margin-top:14px}',
      '.site-host--regional .site-hero__when{background:#FFFDF9;border:1.5px solid #B8860B;border-radius:999px;padding:9px 24px;color:#7A1C28;font-family:var(--site-fd);font-weight:700;font-size:clamp(.82rem,1.7vw,1rem);letter-spacing:.12em;text-transform:uppercase;box-shadow:inset 0 0 0 1.5px rgba(212,175,55,.35),0 4px 14px rgba(184,134,11,.14);margin-top:20px;display:inline-block}',
      '.site-host--regional .site-btn--ghost{background:#FFFDF9;border:1.5px solid #B8860B;color:#7A1C28;font-weight:700;box-shadow:0 4px 14px rgba(184,134,11,.12)}',
      '.site-host--regional .site-btn--ghost:hover{background:#7A1C28;color:#FFF3DE;border-color:#B8860B}',
      '.site-host--regional .site-btn--soft{background:#7A1C28;color:#FFF3DE;border:1.5px solid #B8860B;font-weight:700;box-shadow:0 4px 14px rgba(122,28,40,.25)}',
      '.site-host--regional .site-btn--soft:hover{background:#5E141D;color:#FFF3DE}',
      '',
      '/* Sections Styling */',
      '.site-host--regional .site-section{padding:84px 0}',
      '.site-host--regional .site-section--alt{background:color-mix(in srgb,var(--site-b2) 32%,var(--site-b1))}',
      '.site-host--regional .site-title__eyebrow{color:#B8860B;font-weight:700;letter-spacing:.22em;font-size:.78rem}',
      '.site-host--regional .site-title h2{font-family:var(--site-fd);color:#7A1C28;font-size:clamp(2rem,4.5vw,3rem)}',
      '.site-host--regional .site-title p{font-family:var(--site-fb);font-size:1.15rem;color:#3D2E1E;opacity:.9}',
      '',
      '/* Story */',
      '.site-host--regional .site-story{background:#FFFDF9;border:1.5px solid #B8860B;border-radius:24px;padding:clamp(28px,5vw,48px);box-shadow:inset 0 0 0 2px #FAF5EC,inset 0 0 0 3.5px rgba(212,175,55,.32),0 8px 24px rgba(184,134,11,.1);max-width:860px;margin:0 auto}',
      '.site-host--regional .site-story p{font-family:var(--site-fb);font-size:clamp(1.2rem,2.4vw,1.55rem);line-height:1.85;color:#3D2E1E;font-weight:600}',
      '',
      '/* Celebrations Grid */',
      '.site-celebrations-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;max-width:1040px;margin:0 auto}',
      '.site-celebration-card{background:#FFFDF9;border:1.5px solid #B8860B;border-radius:20px;padding:28px 18px;text-align:center;box-shadow:inset 0 0 0 2px #FAF5EC,inset 0 0 0 3.5px rgba(212,175,55,.3),0 6px 20px rgba(184,134,11,.1);display:flex;flex-direction:column;align-items:center;transition:transform .25s ease,box-shadow .25s ease}',
      '.site-celebration-card:hover{transform:translateY(-4px);box-shadow:inset 0 0 0 2px #FAF5EC,inset 0 0 0 3.5px rgba(212,175,55,.45),0 12px 28px rgba(184,134,11,.18)}',
      '.site-celebration-card__img{width:68px;height:68px;object-fit:contain;margin-bottom:12px}',
      '.site-celebration-card__title{font-family:var(--site-fd);font-size:1.2rem;font-weight:700;color:var(--site-p);letter-spacing:.1em;margin-bottom:4px}',
      '.site-celebration-card__weekday{font-family:var(--site-fb);font-size:1.02rem;color:var(--site-ink);font-weight:600}',
      '.site-celebration-card__date{font-family:var(--site-fb);font-size:.96rem;color:var(--site-p);font-weight:700;margin-top:2px}',
      '.site-celebration-card__time{font-family:var(--site-fb);font-size:.96rem;color:var(--site-s);font-weight:700;margin-top:2px}',
      '',
      '/* Event Details */',
      '.site-host--regional .site-detail{background:#FFFDF9;border:1.5px solid #B8860B;box-shadow:inset 0 0 0 2px #FAF5EC,inset 0 0 0 3.5px rgba(212,175,55,.3),0 6px 20px rgba(184,134,11,.08);border-radius:20px}',
      '.site-host--regional .site-detail svg{color:#B8860B}',
      '.site-host--regional .site-detail small{color:#7A1C28;font-weight:700;letter-spacing:.18em}',
      '.site-host--regional .site-detail strong{color:#241A10;font-family:var(--site-fb);font-size:1.22rem;font-weight:700}',
      '',
      '/* Countdown */',
      '.site-host--regional .site-count-section{background:var(--site-b1);border-top:1.5px solid rgba(184,134,11,.35);border-bottom:1.5px solid rgba(184,134,11,.35);color:var(--site-ink)}',
      '.site-host--regional .site-count-section .site-title h2{color:#7A1C28}',
      '.site-host--regional .site-count-section .site-title p{color:var(--site-ink);opacity:.85}',
      '.site-host--regional .site-count .cd-unit{background:#FFFDF9;border:1.5px solid #B8860B;box-shadow:inset 0 0 0 2px #FAF5EC,inset 0 0 0 3.5px rgba(212,175,55,.3),0 8px 22px rgba(184,134,11,.12);border-radius:18px}',
      '.site-host--regional .site-count .cd-value{color:#7A1C28}',
      '.site-host--regional .site-count .cd-label{color:#B8860B;font-weight:700;letter-spacing:.16em}',
      '',
      '/* Venue */',
      '.site-host--regional .site-venue__card{background:#FFFDF9;border:1.5px solid #B8860B;box-shadow:inset 0 0 0 2px #FAF5EC,inset 0 0 0 3.5px rgba(212,175,55,.3),0 8px 24px rgba(184,134,11,.1)}',
      '.site-host--regional .site-venue__card h3{color:#7A1C28;font-family:var(--site-fd)}',
      '.site-host--regional .site-venue__media-link{background:#7A1C28;color:#FFF3DE;border:1.5px solid #B8860B;box-shadow:0 4px 14px rgba(122,28,40,.25)}',
      '.site-host--regional .site-venue__media{border:2px solid #B8860B;box-shadow:0 8px 24px rgba(184,134,11,.12)}',
      '',
      '/* Family Blessings */',
      '.site-blessings-card{background:#FFFDF9;border:1.5px solid #B8860B;border-radius:24px;padding:clamp(32px,5vw,52px) clamp(20px,4vw,40px);max-width:820px;margin:0 auto;text-align:center;box-shadow:inset 0 0 0 2px #FAF5EC,inset 0 0 0 3.5px rgba(212,175,55,.3),0 8px 26px rgba(184,134,11,.12)}',
      '.site-blessings-grid{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:clamp(16px,3vw,36px);margin-bottom:20px}',
      '.site-blessings-side strong{display:block;font-family:var(--site-fd);font-size:1.22rem;color:var(--site-p);margin-bottom:6px;letter-spacing:.05em}',
      '.site-blessings-side p{margin:0;font-family:var(--site-fb);font-size:1.15rem;color:var(--site-ink);font-weight:600}',
      '.site-blessings-divider{width:1px;height:56px;background:linear-gradient(to bottom,transparent,#B8860B,transparent)}',
      '.site-blessings-ornament{color:#B8860B;display:flex;justify-content:center;margin-bottom:10px}',
      '.site-blessings-subheading{font-family:var(--site-fd);font-size:1.15rem;font-weight:700;color:var(--site-p);letter-spacing:.08em;margin:0 0 4px}',
      '.site-blessings-msg{font-family:var(--site-fb);font-size:1.02rem;color:var(--site-ink);opacity:.88;margin:0}',
      '',
      '/* Grand Ceremonial Landscape */',
      '',
      '/* Footer */',
      '.site-host--regional .site-footer{background:#23120E;border-top:2px solid #B8860B;color:#FAF5EC;padding:56px 24px}',
      '.site-host--regional .site-footer__names{font-family:var(--site-fd);color:#D4AF37;font-size:clamp(2rem,4vw,2.8rem);letter-spacing:.04em;margin-bottom:10px}',
      '.site-host--regional .site-footer p{color:rgba(250,245,236,.72);font-size:.95rem}',
      '.site-host--regional .site-footer a{color:#D4AF37}',
      '',
      /* BEGIN Telugu Pelli host page (lake palace) */
      '/* Telugu Pelli host page: same layers as the card (pillars, mamidi thoranam, marigold/jasmine, bells, gold Ganesha, temple lake). */',
      '.site-host--regional .site-hero{background:radial-gradient(ellipse at 50% 30%,#FFFDF8 0%,#F8F0E2 60%,#EFE3CD 100%)!important;overflow:hidden}',
      '.site-host--regional .site-hero__inner{padding:clamp(118px,13vw,190px) clamp(58px,10vw,150px) clamp(56px,7vw,96px)}',
      '.site-host--regional .tp-host-pillar{top:clamp(84px,10vw,150px);bottom:0;width:clamp(46px,6.6vw,104px);z-index:1;background-repeat:no-repeat,no-repeat,repeat-y;background-position:center top,center bottom,center top;background-size:100% auto;filter:drop-shadow(2px 4px 6px rgba(92,62,24,.3))}',
      '.site-host--regional .tp-host-pillar--left{left:clamp(-6px,-.2vw,0px)}',
      '.site-host--regional .tp-host-pillar--right{right:clamp(-6px,-.2vw,0px);transform:scaleX(-1)}',
      '.site-host--regional .tp-host-toran{top:0;left:50%;transform:translateX(-50%);width:min(74%,980px);height:auto;z-index:3}',
      '.site-host--regional .tp-host-canopy{top:0;width:clamp(96px,15vw,240px);height:auto;z-index:5}',
      '.site-host--regional .tp-host-canopy--left{left:-1.5%}',
      '.site-host--regional .tp-host-canopy--right{right:-1.5%;transform:scaleX(-1)}',
      '.site-host--regional .tp-host-jasmine{top:clamp(150px,20vw,330px);width:clamp(26px,3.4vw,54px);height:auto;z-index:4}',
      '.site-host--regional .tp-host-jasmine--left{left:clamp(10px,1.8vw,30px)}',
      '.site-host--regional .tp-host-jasmine--right{right:clamp(10px,1.8vw,30px);transform:scaleX(-1)}',
      '.site-host--regional .tp-host-bells{top:clamp(34px,4.4vw,66px);width:clamp(28px,3.6vw,54px);height:auto;z-index:6}',
      '.site-host--regional .tp-host-bells--left{left:clamp(92px,14.5vw,232px)}',
      '.site-host--regional .tp-host-bells--right{right:clamp(92px,14.5vw,232px)}',
      '.site-host--regional .site-hero__apex-img{width:clamp(64px,7.5vw,104px);height:auto;filter:drop-shadow(0 6px 14px rgba(160,116,46,.35))}',
      '.site-host--regional .tp-host-greeting{font-family:\'Noto Serif Telugu\',serif;font-size:clamp(1.15rem,2.1vw,1.55rem);font-weight:600;color:#7A1C28;letter-spacing:.04em;margin:0 0 10px}',
      '.site-host--regional .tp-host-greeting{display:flex;justify-content:center;align-items:baseline;gap:clamp(16px,4vw,56px);white-space:nowrap}',
      '.site-host--regional .tp-host-greeting span{font-size:clamp(.95rem,1.8vw,1.3rem)}',
      '.site-host--regional .tp-host-greeting span:nth-child(2){font-size:clamp(1.15rem,2.1vw,1.55rem)}',
      '.site-host--regional .site-hero__additional-title{font-size:clamp(.72rem,1.3vw,.95rem);letter-spacing:.24em;color:#8A6A2F;white-space:pre-line}',
      '.site-host--regional .site-hero__additional-subtitle{white-space:pre-line}',
      '.site-host--regional .site-hero__person-name{font-family:\'Great Vibes\',\'Playfair Display\',cursive;font-weight:400;font-size:clamp(3rem,7.4vw,6.2rem);line-height:1.08;letter-spacing:0;text-shadow:none}',
      '.site-host--regional .site-hero__person{display:flex;flex-direction:column;grid-row:1}',
      '.site-host--regional .site-hero__person--left{grid-column:1;align-items:flex-end;text-align:right}',
      '.site-host--regional .site-hero__person--right{grid-column:3;align-items:flex-start;text-align:left}',
      '.site-host--regional .site-hero__couple-sep{grid-column:2;grid-row:1;align-self:start;padding-top:clamp(.6rem,1.6vw,1.4rem)}',
      '.site-host--regional .tp-host-name-te{font-family:\'Noto Serif Telugu\',serif;font-size:clamp(.95rem,1.7vw,1.25rem);font-weight:500;color:#8A6A2F;margin:0 0 4px}',
      '.site-host--regional .site-hero__couple-sep{display:flex;align-items:center;justify-content:center;gap:clamp(4px,1vw,12px)}',
      '.site-host--regional .site-hero__couple-sep .amp{font-family:\'Great Vibes\',cursive;font-weight:400;color:#7A1C28;text-shadow:none;font-size:clamp(2.2rem,4.6vw,3.6rem)}',
      '.site-host--regional .tp-host-sprig{width:clamp(28px,3.6vw,54px);height:auto;transform:rotate(48deg)}',
      '.site-host--regional .tp-host-sprig--left{transform:scaleX(-1) rotate(48deg)}',
      '.site-host--regional .tp-host-tagline{font-family:\'Cinzel\',Georgia,serif;font-size:clamp(.62rem,1.15vw,.86rem);letter-spacing:.26em;text-transform:uppercase;color:#8A6A2F;margin:18px 0 14px}',
      '.site-host--regional .tp-host-pk{display:inline-flex;gap:.3em;margin:0 .5em;vertical-align:.05em}',
      '.site-host--regional .tp-host-pk i{display:block;width:.66em;height:.66em;border-radius:50%}',
      '.site-host--regional .tp-host-pk__pasupu{background:radial-gradient(circle at 35% 35%,#F7D25A,#D99A0B)}',
      '.site-host--regional .tp-host-pk__kumkuma{background:radial-gradient(circle at 35% 35%,#E2475E,#A30F2B)}',
      '.site-host--regional .site-blessings-ornament .tp-host-pk{font-size:1.3rem}',
      '.site-host--regional .tp-host-date{position:relative;z-index:0;margin:4px auto 22px;padding:8px 0;font-family:\'Cinzel\',Georgia,serif;color:#3D2E1E;text-transform:uppercase}',
      '.site-host--regional .tp-host-date .tp-muggu{position:absolute;left:50%;top:50%;width:clamp(170px,22vw,300px);height:auto;transform:translate(-50%,-50%);opacity:.16;z-index:-1;pointer-events:none}',
      '.site-host--regional .tp-host-date__weekday{display:flex;align-items:center;justify-content:center;gap:clamp(10px,1.6vw,20px);font-size:clamp(.82rem,1.5vw,1.12rem);letter-spacing:.24em;font-weight:600}',
      '.site-host--regional .tp-host-date__rule{width:clamp(40px,8vw,120px);height:1px;background:linear-gradient(90deg,transparent,#B8913F)}',
      '.site-host--regional .tp-host-date__rule:last-child{background:linear-gradient(90deg,#B8913F,transparent)}',
      '.site-host--regional .tp-host-date__row{display:flex;align-items:center;justify-content:center;margin:6px 0}',
      '.site-host--regional .tp-host-date__side{font-size:clamp(1.05rem,2.1vw,1.6rem);letter-spacing:.14em;font-weight:600;padding:0 clamp(14px,2.4vw,30px)}',
      '.site-host--regional .tp-host-date__day{font-size:clamp(2.6rem,5.2vw,4rem);font-weight:600;color:#7A1C28;line-height:1;padding:0 clamp(14px,2.4vw,30px);border-left:1.5px solid #7A1C28;border-right:1.5px solid #7A1C28}',
      '.site-host--regional .tp-host-date__time{font-size:clamp(.8rem,1.4vw,1.05rem);letter-spacing:.18em;font-weight:600}',
      '.site-host--regional .site-title h2::after{content:"";display:block;width:clamp(170px,22vw,290px);height:clamp(12px,1.5vw,18px);margin:12px auto 0;background:var(--tp-divider) center/contain no-repeat}',
      '.site-host--regional .site-celebrations-grid{grid-template-columns:repeat(4,minmax(0,1fr))}',
      '.site-host--regional .site-celebration-card__img{width:clamp(64px,7vw,84px);height:clamp(64px,7vw,84px)}',
      '.site-landscape--regional{position:relative;width:100%;height:clamp(230px,32vw,470px);overflow:hidden;background:var(--site-b1);pointer-events:none;user-select:none}',
      '.site-landscape--regional img{position:absolute;pointer-events:none;user-select:none;-webkit-user-drag:none}',
      '.site-landscape--regional .tp-host-land__lake{left:0;bottom:0;width:100%;height:100%;object-fit:cover;object-position:center 68%;z-index:1;-webkit-mask-image:linear-gradient(to top,#000 0%,#000 55%,transparent 100%);mask-image:linear-gradient(to top,#000 0%,#000 55%,transparent 100%)}',
      '.site-landscape--regional .tp-host-land__banana{bottom:3%;width:clamp(88px,13vw,210px);height:auto;z-index:2}',
      '.site-landscape--regional .tp-host-land__banana--left{left:-1.5%}',
      '.site-landscape--regional .tp-host-land__banana--right{right:-1.5%;transform:scaleX(-1)}',
      '.site-landscape--regional .tp-host-land__lotus{bottom:-2px;left:14%;width:72%;height:auto;z-index:3}',
      '.site-landscape--regional .tp-host-land__elephant{bottom:2%;width:clamp(112px,18vw,300px);height:auto;z-index:4}',
      '.site-landscape--regional .tp-host-land__elephant--left{left:1%}',
      '.site-landscape--regional .tp-host-land__elephant--right{right:1%;transform:scaleX(-1)}',
      '@media(max-width:900px){',
      '  .site-host--regional .site-celebrations-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-width:620px}',
      '}',
      '@media(max-width:640px){',
      '  .site-host--regional .site-hero__inner{padding:clamp(104px,30vw,130px) 52px 44px}',
      '  .site-host--regional .tp-host-jasmine{top:clamp(120px,34vw,150px)}',
      '  .site-host--regional .site-hero__couple{display:flex;flex-direction:column;align-items:center;gap:0}',
      '  .site-host--regional .site-hero__person{align-items:center;text-align:center}',
      '  .site-host--regional .site-hero__person-name,.site-host--regional .site-hero__person-parents{text-align:center!important}',
      '  .site-host--regional .site-hero__couple-sep{padding-top:0;margin:2px 0;align-self:center}',
      '  .site-host--regional .site-hero__additional-title{letter-spacing:.14em}',
      '}',
      '/* Tamil Thirumanam host: its own maroon Kanchipuram-silk look with light gold/ivory text (no marble pillars). */',
      'body.site-host--regional-tamil-thirumanam{--site-b1:#6E1224;--site-b2:#4E0B19;--site-ink:#FBEFD9;--site-p:#F3D58A;--site-s:#E4B45C;background:#5C0F1F;color:#FBEFD9}',
      '.site-host--regional-tamil-thirumanam .tp-host-pillar{display:none}',
      '.site-host--regional-tamil-thirumanam .site-hero{background:radial-gradient(ellipse at 50% 30%,rgba(255,214,140,.16) 0%,transparent 55%),repeating-linear-gradient(115deg,rgba(255,255,255,.025) 0 2px,transparent 2px 7px),linear-gradient(180deg,#7A1428 0%,#5C0F1F 100%)!important}',
      '.site-host--regional-tamil-thirumanam .site-hero::before{content:"";position:absolute;inset:10px;border:2px solid #D9B45F;border-radius:18px;box-shadow:inset 0 0 0 4px rgba(58,8,18,.9),inset 0 0 0 5.5px rgba(228,180,92,.75);pointer-events:none;z-index:2}',
      '.site-host--regional-tamil-thirumanam .site-nav{background:rgba(74,10,24,.95);border-bottom-color:rgba(228,180,92,.5)}',
      '.site-host--regional-tamil-thirumanam .site-nav__brand{color:#F3D58A}',
      '.site-host--regional-tamil-thirumanam .site-nav__link{color:#FBEFD9}',
      '.site-host--regional-tamil-thirumanam .site-nav__link:hover{color:#F3D58A;background:rgba(228,180,92,.16)}',
      '.site-host--regional-tamil-thirumanam .site-nav__burger{color:#F3D58A;border-color:#E4B45C}',
      '.site-host--regional-tamil-thirumanam .site-hero__person-name{font-family:\'Cinzel\',Georgia,serif;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:clamp(2.1rem,5.6vw,4.4rem);color:#F3D58A;text-shadow:0 2px 0 rgba(58,8,18,.6),0 0 22px rgba(228,180,92,.25)}',
      '.site-host--regional-tamil-thirumanam .site-hero__couple-sep .amp{font-family:\'Cinzel\',Georgia,serif;font-weight:700;color:#F3D58A}',
      '.site-host--regional-tamil-thirumanam .tp-host-greeting,.site-host--regional-tamil-thirumanam .tp-host-date__day{color:#F3D58A}',
      '.site-host--regional-tamil-thirumanam .site-hero__additional-title,.site-host--regional-tamil-thirumanam .tp-host-tagline,.site-host--regional-tamil-thirumanam .tp-host-name-te,.site-host--regional-tamil-thirumanam .site-hero__person-parents span{color:#E4B45C}',
      '.site-host--regional-tamil-thirumanam .site-hero__additional-subtitle,.site-host--regional-tamil-thirumanam .site-hero__person-parents strong,.site-host--regional-tamil-thirumanam .tp-host-date{color:#FBEFD9}',
      '.site-host--regional-tamil-thirumanam .tp-host-date__day{display:inline-flex;align-items:center;justify-content:center;width:clamp(76px,9vw,116px);height:clamp(76px,9vw,116px);margin:0 clamp(12px,2vw,24px);padding:0;border:1.5px solid #D9B45F;border-radius:50%;box-shadow:0 0 0 4px rgba(58,8,18,.6),0 0 0 5.5px rgba(228,180,92,.6)}',
      '.site-host--regional-tamil-thirumanam .tp-host-date__side{padding:0}',
      '.site-host--regional-tamil-thirumanam .tp-host-date .tp-muggu{opacity:.22}',
      '.site-host--regional-tamil-thirumanam .tp-host-date .tp-muggu g[stroke]{stroke:#E4B45C}',
      '.site-host--regional-tamil-thirumanam .tp-host-date .tp-muggu g[fill]:not([fill="none"]){fill:#E4B45C}',
      '.site-host--regional-tamil-thirumanam .site-section{background:#5C0F1F}',
      '.site-host--regional-tamil-thirumanam .site-section--alt,.site-host--regional-tamil-thirumanam .site-count-section{background:linear-gradient(180deg,#6E1224 0%,#4E0B19 100%)}',
      '.site-host--regional-tamil-thirumanam .site-title__eyebrow{color:#E4B45C}',
      '.site-host--regional-tamil-thirumanam .site-title h2{color:#F3D58A}',
      '.site-host--regional-tamil-thirumanam .site-title p{color:#FBEFD9}',
      '.site-host--regional-tamil-thirumanam .site-story,.site-host--regional-tamil-thirumanam .site-celebration-card,.site-host--regional-tamil-thirumanam .site-detail,.site-host--regional-tamil-thirumanam .site-count .cd-unit,.site-host--regional-tamil-thirumanam .site-venue__card,.site-host--regional-tamil-thirumanam .site-blessings-card{background:linear-gradient(145deg,rgba(74,10,24,.9),rgba(45,6,14,.96));border-color:#D9B45F;box-shadow:inset 0 0 0 2px rgba(58,8,18,.9),inset 0 0 0 3.5px rgba(228,180,92,.45),0 8px 22px rgba(0,0,0,.3)}',
      '.site-host--regional-tamil-thirumanam .site-story p,.site-host--regional-tamil-thirumanam .site-detail strong,.site-host--regional-tamil-thirumanam .site-venue__card p,.site-host--regional-tamil-thirumanam .site-blessings-side p,.site-host--regional-tamil-thirumanam .site-blessings-msg,.site-host--regional-tamil-thirumanam .site-celebration-card__weekday,.site-host--regional-tamil-thirumanam .site-celebration-card__time{color:#FBEFD9}',
      '.site-host--regional-tamil-thirumanam .site-celebration-card__title,.site-host--regional-tamil-thirumanam .site-celebration-card__date,.site-host--regional-tamil-thirumanam .site-detail small,.site-host--regional-tamil-thirumanam .site-venue__card h3,.site-host--regional-tamil-thirumanam .site-blessings-side strong,.site-host--regional-tamil-thirumanam .site-blessings-subheading,.site-host--regional-tamil-thirumanam .site-count .cd-value{color:#F3D58A}',
      '.site-host--regional-tamil-thirumanam .site-count .cd-label,.site-host--regional-tamil-thirumanam .site-detail svg{color:#E4B45C}',
      '.site-host--regional-tamil-thirumanam .site-venue__media{border-radius:50% 50% 18px 18px / 26% 26% 18px 18px;border-color:#D9B45F}',
      '.site-host--regional-tamil-thirumanam .site-btn--soft,.site-host--regional-tamil-thirumanam .site-venue__media-link{background:#E4B45C;color:#4E0B19;border-color:#F3D58A}',
      '.site-host--regional-tamil-thirumanam .site-btn--ghost{background:transparent;color:#F3D58A;border-color:#E4B45C}',
      '.site-landscape--regional{background:var(--site-b1)}',
      '.site-host--regional-tamil-thirumanam .site-count-section .site-title h2{color:#F3D58A}',
      '.site-host--regional-tamil-thirumanam .site-count-section .site-title p{color:#FBEFD9}',
      /* END Telugu Pelli host page */
      /* BEGIN wedding design engine host (generated from css/wedding-host.css) */
      'body.site-host--wd{--site-p:var(--wd-title);--site-s:var(--wd-accent);--site-b1:var(--wd-bg1);--site-b2:var(--wd-bg2);--site-ink:var(--wd-ink);--site-fd:var(--wd-display,\'Playfair Display\',Georgia,serif);--site-fb:var(--wd-body,\'DM Sans\',system-ui,sans-serif);background:var(--wd-bg1);color:var(--wd-ink);font-family:var(--site-fb)}',
      'body.site-host--wd .site-nav{background:color-mix(in srgb,var(--wd-bg1) 92%,transparent);border-bottom:1px solid var(--wd-line);box-shadow:none}',
      'body.site-host--wd .site-nav__brand{font-family:var(--wd-caps,var(--site-fd));color:var(--wd-title)}',
      'body.site-host--wd .site-nav__link{color:var(--wd-ink)}',
      'body.site-host--wd .site-nav__link:hover{color:var(--wd-title);background:var(--wd-soft)}',
      'body.site-host--wd .site-nav__burger{color:var(--wd-title);border-color:var(--wd-line)}',
      'body.site-host--wd .site-hero{position:relative;color:var(--wd-ink);background:radial-gradient(900px 600px at 50% 0,color-mix(in srgb,var(--wd-bg1) 80%,#fff 20%) 0%,transparent 100%),linear-gradient(170deg,var(--wd-bg1),var(--wd-bg2))!important;overflow:hidden}',
      'body.site-host--wd .site-wd-frame{position:absolute;inset:0;pointer-events:none;z-index:1;color:var(--wd-accent)}',
      'body.site-host--wd .site-wd-frame::before{content:"";position:absolute;inset:clamp(10px,1.6vw,22px);border:1px solid var(--wd-line);border-radius:18px}',
      'body.site-wd-fr-double .site-wd-frame::before{border-width:1.5px;box-shadow:inset 0 0 0 5px transparent,inset 0 0 0 6px var(--wd-line)}',
      'body.site-wd-fr-band .site-wd-frame::before{inset:0;border:clamp(8px,1vw,14px) solid var(--wd-soft);border-radius:0;box-shadow:inset 0 0 0 10px transparent,inset 0 0 0 11px var(--wd-line)}',
      'body.site-wd-fr-hairline .site-wd-frame::before{border-radius:0}',
      'body.site-wd-fr-arch .site-wd-frame::before{border-radius:46% 46% 18px 18px / 22% 22% 18px 18px;border-width:1.5px}',
      'body.site-wd-fr-beads .site-wd-frame::before{border:0;padding:6px;background:radial-gradient(circle,var(--wd-accent) 1.6px,transparent 2.1px) 0 0/11px 11px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}',
      'body.site-wd-fr-kolam .site-wd-frame::before{border-style:dashed}',
      'body.site-wd-fr-deco .site-wd-frame::before{border-radius:4px;box-shadow:inset 0 0 0 4px transparent,inset 0 0 0 5px var(--wd-line)}',
      'body.site-host--wd .site-wd-frame .wd-corner{position:absolute;width:clamp(70px,11vw,170px);height:auto;opacity:.85}',
      'body.site-wd-fr-hairline .site-wd-frame .wd-corner{width:clamp(34px,4vw,56px)}',
      'body.site-host--wd .wd-corner--tl{top:clamp(4px,1vw,14px);left:clamp(4px,1vw,14px)}',
      'body.site-host--wd .wd-corner--tr{top:clamp(4px,1vw,14px);right:clamp(4px,1vw,14px);transform:scaleX(-1)}',
      'body.site-host--wd .wd-corner--bl{bottom:clamp(4px,1vw,14px);left:clamp(4px,1vw,14px);transform:scaleY(-1)}',
      'body.site-host--wd .wd-corner--br{bottom:clamp(4px,1vw,14px);right:clamp(4px,1vw,14px);transform:scale(-1,-1)}',
      'body.site-host--wd .site-hero__inner{position:relative;z-index:2;padding:clamp(80px,10vw,130px) clamp(28px,8vw,120px) clamp(56px,7vw,90px)}',
      'body.site-host--wd .site-wd-crest{display:flex;justify-content:center;margin-bottom:10px}',
      'body.site-host--wd .site-wd-crest img{width:clamp(72px,9vw,120px);height:clamp(72px,9vw,120px);object-fit:contain}',
      'body.site-host--wd .site-hero__photo{border:2px solid var(--wd-accent)}',
      'body.site-host--wd .site-hero__additional-title{font-family:var(--wd-caps,var(--site-fb));letter-spacing:.24em;text-transform:uppercase;font-size:clamp(.72rem,1.2vw,.92rem);color:var(--wd-accent);white-space:pre-line}',
      'body.site-host--wd .site-hero__additional-subtitle{font-family:var(--site-fb);color:var(--wd-ink);font-size:clamp(1rem,1.7vw,1.3rem);white-space:pre-line;font-style:normal}',
      'body.site-host--wd .site-hero__person-name{font-family:var(--site-fd);color:var(--wd-title);font-weight:400;font-size:calc(clamp(2.4rem,6vw,5rem) * var(--wd-name-size,1));text-shadow:none}',
      'body.wd-italic .site-hero__person-name{font-style:italic}',
      'body.site-host--wd .site-hero__couple-sep,body.site-host--wd .site-hero__couple-sep .amp{color:var(--wd-accent);font-family:var(--site-fd);text-shadow:none}',
      'body.site-host--wd .site-hero__person-parents{color:var(--wd-ink)}',
      'body.site-host--wd .site-hero__person-parents span{color:var(--wd-accent);opacity:1}',
      'body.site-host--wd .site-hero__person-parents strong{color:var(--wd-ink)}',
      'body.site-wd-l-editorial .site-hero__inner{text-align:left;justify-items:start}',
      'body.site-wd-l-editorial .site-wd-crest{justify-content:flex-start}',
      'body.site-host--wd .wd-date{margin:18px auto 22px;color:var(--wd-ink);font-family:var(--wd-caps,var(--site-fb))}',
      'body.site-host--wd .wd-date small{display:block;font-size:clamp(.62rem,1vw,.8rem);letter-spacing:.2em;color:var(--wd-accent)}',
      'body.site-host--wd .wd-date b{color:var(--wd-title);font-weight:600}',
      'body.site-host--wd .wd-date--pill{display:flex;border:1px solid var(--wd-line);border-radius:999px;padding:12px 10px;background:var(--wd-card);width:min(520px,100%)}',
      'body.site-host--wd .wd-cell{flex:1;text-align:center;padding:0 10px}',
      'body.site-host--wd .wd-cell+.wd-cell{border-left:1px solid var(--wd-line)}',
      'body.site-host--wd .wd-cell b{display:block;font-size:clamp(1.4rem,3vw,2.2rem);line-height:1.15}',
      'body.site-host--wd .wd-cell b.wd-cell__time{font-size:clamp(1.1rem,2vw,1.5rem)}',
      'body.site-host--wd .wd-date--medallion{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:22px}',
      'body.site-host--wd .wd-medal{width:clamp(84px,9vw,120px);height:clamp(84px,9vw,120px);display:grid;place-items:center;border:1.5px solid var(--wd-accent);border-radius:50%;box-shadow:0 0 0 5px var(--wd-soft)}',
      'body.site-host--wd .wd-medal b{font-size:clamp(2rem,4vw,3rem)}',
      'body.site-host--wd .wd-date__meta{flex-basis:100%;margin:6px 0 0;letter-spacing:.2em;font-size:clamp(.72rem,1.1vw,.9rem);color:var(--wd-ink)}',
      'body.site-host--wd .wd-date__big{display:block;font-family:var(--site-fd);font-size:clamp(3.4rem,8vw,6rem);line-height:1}',
      'body.site-host--wd .wd-date__month{margin:4px 0;letter-spacing:.28em;color:var(--wd-title)}',
      'body.site-host--wd .wd-date--ribbon{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:14px;padding:12px 28px;background:var(--wd-soft);border-top:1px solid var(--wd-line);border-bottom:1px solid var(--wd-line);letter-spacing:.18em;text-transform:uppercase;font-size:clamp(.72rem,1.2vw,.95rem)}',
      'body.site-host--wd .wd-date--ribbon i{width:5px;height:5px;background:var(--wd-accent);transform:rotate(45deg)}',
      'body.site-host--wd .wd-date__row{display:flex;align-items:center;justify-content:center}',
      'body.site-host--wd .wd-date__row span{font-size:clamp(1rem,2vw,1.5rem);letter-spacing:.16em;padding:0 clamp(14px,2.4vw,30px)}',
      'body.site-host--wd .wd-date__row b{font-size:clamp(2.4rem,5vw,3.8rem);padding:0 clamp(14px,2.4vw,30px);border-left:1px solid var(--wd-line);border-right:1px solid var(--wd-line)}',
      'body.site-host--wd .site-btn--ghost{background:transparent;color:var(--wd-title);border:1px solid var(--wd-line);box-shadow:none}',
      'body.site-host--wd .site-btn--soft,body.site-host--wd .site-venue__media-link{background:var(--wd-accent);color:var(--wd-bg1);border:1px solid var(--wd-accent);box-shadow:none}',
      'body.site-host--wd .site-section{background:var(--wd-bg1);color:var(--wd-ink)}',
      'body.site-host--wd .site-section--alt,body.site-host--wd .site-count-section{background:linear-gradient(180deg,color-mix(in srgb,var(--wd-bg1) 55%,var(--wd-bg2)),var(--wd-bg2));color:var(--wd-ink)}',
      'body.site-host--wd .site-title__eyebrow{color:var(--wd-accent);font-family:var(--wd-caps,var(--site-fb));letter-spacing:.24em}',
      'body.site-host--wd .site-title h2,body.site-host--wd .site-count-section .site-title h2{color:var(--wd-title);font-family:var(--site-fd);font-weight:400}',
      'body.site-host--wd .site-title p,body.site-host--wd .site-count-section .site-title p{color:var(--wd-ink);opacity:.9}',
      'body.site-host--wd .site-title h2::after{content:"";display:block;width:clamp(120px,14vw,200px);height:1px;margin:14px auto 0;background:linear-gradient(90deg,transparent,var(--wd-accent),transparent)}',
      'body.site-host--wd .site-story,body.site-host--wd .site-celebration-card,body.site-host--wd .site-detail,body.site-host--wd .site-count .cd-unit,body.site-host--wd .site-venue__card,body.site-host--wd .site-blessings-card{background:var(--wd-card);border:1px solid var(--wd-card-line);box-shadow:none;color:var(--wd-ink)}',
      'body.site-host--wd .site-story p,body.site-host--wd .site-detail strong,body.site-host--wd .site-venue__card p,body.site-host--wd .site-blessings-side p,body.site-host--wd .site-blessings-msg,body.site-host--wd .site-celebration-card__weekday,body.site-host--wd .site-celebration-card__time{color:var(--wd-ink)}',
      'body.site-host--wd .site-celebration-card__title,body.site-host--wd .site-celebration-card__date,body.site-host--wd .site-venue__card h3,body.site-host--wd .site-blessings-side strong,body.site-host--wd .site-blessings-subheading,body.site-host--wd .site-count .cd-value{color:var(--wd-title)}',
      'body.site-host--wd .site-detail small,body.site-host--wd .site-count .cd-label,body.site-host--wd .site-detail svg,body.site-host--wd .site-blessings-ornament{color:var(--wd-accent)}',
      'body.site-host--wd .site-blessings-divider{background:var(--wd-line)}',
      'body.site-host--wd .site-venue__media{border:1px solid var(--wd-card-line)}',
      'body.site-wd-l-arch .site-venue__media{border-radius:50% 50% 18px 18px / 26% 26% 18px 18px}',
      'body.site-host--wd .site-footer{background:var(--wd-bg2);border-top:1px solid var(--wd-line);color:var(--wd-ink)}',
      'body.site-host--wd .site-footer__names{font-family:var(--site-fd);color:var(--wd-title)}',
      'body.site-host--wd .site-footer p{color:var(--wd-ink);opacity:.75}',
      'body.site-host--wd .site-footer a{color:var(--wd-accent)}',
      '@media(max-width:640px){',
      '  body.site-host--wd .site-hero__inner{padding:96px 30px 48px}',
      '  body.site-host--wd .site-wd-frame .wd-corner{width:64px}',
      '  body.site-host--wd .wd-cell{padding:0 6px}',
      '}',
      'body.site-host--wd .site-wd-frame .wd-la{position:absolute;height:auto;pointer-events:none;opacity:.95}',
      'body.site-host--wd .site-wd-frame .wd-la--tl,body.site-host--wd .site-wd-frame .wd-la--tr{top:clamp(6px,1vw,16px);width:clamp(120px,22vw,320px)}',
      'body.site-host--wd .site-wd-frame .wd-la--tl{left:clamp(6px,1vw,16px)}',
      'body.site-host--wd .site-wd-frame .wd-la--tr{right:clamp(6px,1vw,16px);transform:scaleX(-1)}',
      'body.site-host--wd .site-wd-frame .wd-la--bl,body.site-host--wd .site-wd-frame .wd-la--br{bottom:clamp(6px,1vw,16px);width:clamp(120px,20vw,300px)}',
      'body.site-host--wd .site-wd-frame .wd-la--bl{left:clamp(6px,1vw,16px)}',
      'body.site-host--wd .site-wd-frame .wd-la--br{right:clamp(6px,1vw,16px);transform:scaleX(-1)}',
      'body.site-host--wd .site-wd-frame .wd-la--l,body.site-host--wd .site-wd-frame .wd-la--r{display:none}',
      '',
      '.site-invite{position:relative;max-width:760px;margin:0 auto;text-align:center;padding:clamp(36px,6vw,64px) clamp(24px,6vw,72px)!important;overflow:hidden}',
      '.site-invite__corners{position:absolute;inset:0;pointer-events:none;color:var(--site-s)}',
      '.site-invite__corners .wd-corner{position:absolute;width:clamp(54px,9vw,96px);height:auto;opacity:.8}',
      '.site-invite__corners .wd-corner--tl{top:8px;left:8px}',
      '.site-invite__corners .wd-corner--tr{top:8px;right:8px;transform:scaleX(-1)}',
      '.site-invite__corners .wd-corner--bl{bottom:8px;left:8px;transform:scaleY(-1)}',
      '.site-invite__corners .wd-corner--br{bottom:8px;right:8px;transform:scale(-1,-1)}',
      '.site-invite__crest{display:block;width:clamp(58px,8vw,92px);height:clamp(58px,8vw,92px);object-fit:contain;margin:0 auto 10px}',
      '.site-invite__blessing{display:flex;justify-content:center;gap:clamp(12px,3vw,32px);margin:0 0 12px;font-family:\'Noto Serif Telugu\',\'Noto Serif Tamil\',serif;font-weight:600;color:var(--site-p);font-size:clamp(.95rem,1.6vw,1.2rem)}',
      '.site-invite__lead{margin:0 0 6px!important;font-family:var(--wd-caps,var(--site-fb))!important;font-size:clamp(.72rem,1.2vw,.9rem)!important;letter-spacing:.24em;text-transform:uppercase;color:var(--site-s)!important;font-weight:600!important;line-height:1.6!important}',
      '.site-invite__names{margin:4px 0 18px!important;font-family:var(--site-fd)!important;color:var(--site-p)!important;font-size:clamp(2rem,5vw,3.4rem)!important;line-height:1.1!important;font-weight:400!important;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.3em}',
      '.site-invite__names i{font-style:normal;color:var(--site-s);font-size:.7em}',
      '.site-invite__msg{margin:0 auto!important;max-width:560px;font-family:var(--wd-body,var(--site-fb))!important;font-size:clamp(1.08rem,2vw,1.35rem)!important;line-height:1.75!important;color:var(--site-ink)!important;font-style:italic}',
      '.site-invite__rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:22px auto 16px;width:min(320px,70%)}',
      '.site-invite__rule::before,.site-invite__rule::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--site-s))}',
      '.site-invite__rule::after{background:linear-gradient(90deg,var(--site-s),transparent)}',
      '.site-invite__rule i{width:7px;height:7px;background:var(--site-s);transform:rotate(45deg)}',
      '.site-invite__when{margin:0 0 4px!important;font-family:var(--wd-caps,var(--site-fb))!important;letter-spacing:.18em;text-transform:uppercase;font-size:clamp(.74rem,1.3vw,.95rem)!important;color:var(--site-p)!important;font-weight:700!important;line-height:1.6!important}',
      '.site-invite__where{margin:0!important;font-family:var(--wd-body,var(--site-fb))!important;font-size:clamp(.9rem,1.5vw,1.05rem)!important;color:var(--site-ink)!important;opacity:.9;line-height:1.5!important}',
      'body.site-host--regional .site-invite__names{font-family:\'Great Vibes\',cursive!important}',
      'body.site-host--regional-tamil-thirumanam .site-invite__names{font-family:\'Cinzel\',Georgia,serif!important;text-transform:uppercase;letter-spacing:.06em;font-size:clamp(1.6rem,4vw,2.6rem)!important}',
      'body.site-host--wd .site-hero__kicker{color:var(--wd-accent);text-shadow:none}',
      'body.site-host--wd .site-invite__photo{display:block;width:clamp(120px,18vw,170px);height:clamp(120px,18vw,170px);object-fit:cover;border-radius:50%;margin:0 auto 16px;border:3px solid var(--wd-card,#fff);box-shadow:0 0 0 1.5px var(--wd-accent),0 8px 22px rgba(0,0,0,.16)}',
      'body.site-host--wd .site-invite__crest{width:clamp(80px,11vw,130px);height:clamp(80px,11vw,130px)}',
      'body.site-host--wd .site-wd-frame .wd-la--garland{top:0;left:50%;width:min(1180px,98%);transform:translateX(-50%)}',
      'body.site-host--wd .site-wd-frame .wd-la--cluster{top:auto;bottom:0;left:50%;width:clamp(260px,38vw,560px);transform:translateX(-50%)}',
      'body.site-host--wd .site-wd-frame .wd-la--vl,body.site-host--wd .site-wd-frame .wd-la--vr{display:block;top:4%;width:clamp(90px,11vw,180px)}',
      'body.site-host--wd .site-wd-frame .wd-la--vl{left:0}',
      'body.site-host--wd .site-wd-frame .wd-la--vr{right:0;transform:scaleX(-1)}',
      'body.site-host--wd .site-wd-frame .wd-la--br.wd-la--flip{transform:rotate(180deg)}',
      'body.site-host--wd .site-wd-frame .wd-la--cl-sm{width:clamp(140px,20vw,300px)}',
      'body.site-host--wd .wd-bday-title{display:flex;flex-direction:column;align-items:center;margin:.2rem auto 1rem;line-height:1}',
      'body.site-host--wd .wd-bday-title .wd-eng-title__script{font-family:var(--wd-display,inherit);color:var(--wd-accent);font-size:clamp(1.8rem,5vw,3rem)}',
      'body.site-host--wd .wd-bday-title .wd-eng-title__caps{margin-top:.5rem;padding:.4rem 1.2rem;font-family:var(--wd-caps,inherit);font-size:clamp(.62rem,1.4vw,.85rem);letter-spacing:.32em;text-transform:uppercase;color:var(--wd-title);border-top:1px solid var(--wd-line);border-bottom:1px solid var(--wd-line)}',
      'body.site-host--wd .wd-bday-age{display:flex;flex-direction:column;align-items:center;justify-content:center;width:110px;height:110px;margin:.7rem auto .2rem;border-radius:50%;border:1.5px solid var(--wd-line);box-shadow:inset 0 0 0 5px var(--wd-soft);background:var(--wd-card)}',
      'body.site-host--wd .wd-bday-age small{font-family:var(--wd-caps,inherit);font-size:.62rem;letter-spacing:.26em;text-transform:uppercase;color:var(--wd-ink)}',
      'body.site-host--wd .wd-bday-age b{font-family:var(--wd-display,inherit);font-size:2.8rem;line-height:1;color:var(--wd-title);font-weight:600}',
      'body.site-host--wd.wd-script .wd-bday-age b{font-family:var(--wd-caps,inherit)}',
      'body.site-host--wd .wd-bday-tagline{font-style:italic}',
      'body.site-host--wd .wd-occ-title .wd-bday-age small{margin-top:.2rem}',
      'body.site-host--wd .site-hero__names .amp{color:var(--wd-accent)}',
      'body.site-host--wd .site-hero__occ-label{margin:14px 0 -6px;font-family:var(--wd-caps,inherit);font-size:clamp(.7rem,1.3vw,.85rem);letter-spacing:.28em;text-transform:uppercase;color:var(--wd-accent)}',
      'body.site-host--wd .site-hero__names .wd-occ-n{display:inline-block;white-space:nowrap}',
      'body.site-host--wd .site-hero__names .wd-occ-amp{display:inline-block;margin:0 .2em;font-size:.6em;color:var(--wd-accent);vertical-align:.12em}',
      'body.site-host--wd .wd-occ-parents{margin:.2rem auto .4rem;text-align:center;color:var(--wd-ink)}',
      'body.site-host--wd .wd-occ-parents>span{display:block;font-style:italic;font-size:clamp(.85rem,1.5vw,1rem);letter-spacing:.06em;color:var(--wd-accent)}',
      'body.site-host--wd .wd-occ-parents b{display:block;font-family:var(--wd-display,inherit);font-weight:600;font-size:clamp(1.3rem,3vw,2rem);color:var(--wd-title);line-height:1.25}',
      'body.site-host--wd .wd-occ-parents .wd-occ-n{display:inline-block;white-space:nowrap}',
      'body.site-host--wd .wd-occ-parents .wd-occ-amp{display:inline-block;margin:0 .2em;color:var(--wd-accent);font-size:.85em}',
      'body.site-host--wd .wd-occ-awaiting{font-style:italic}',
      'body.site-host--wd.wd-fam-baby-shower .wd-occ-title,body.site-host--wd.wd-fam-naming-ceremony .wd-occ-title{margin-top:1.4rem}',
      'body.site-host--wd .site-hero:has(.wd-la--cluster) .site-hero__inner{padding-bottom:calc(clamp(260px,38vw,560px)*.78)}',
      'body.site-host--wd .site-hero:has(.wd-la--garland) .site-hero__inner{padding-top:max(96px,calc(min(1180px,98vw)*.2))}',
      'body.site-host--wd .site-wd-frame .wd-bd{position:absolute;inset:0;background-size:cover;background-position:center;pointer-events:none}',
      'body.site-host--wd .site-wd-frame .wd-la--foot{display:none}',
      /* END wedding design engine host */
      '/* Media Queries */',
      '@media(max-width:640px){',
      '  .site-blessings-grid{grid-template-columns:1fr;gap:16px}',
      '  .site-blessings-divider{width:56px;height:1px;margin:0 auto;background:linear-gradient(to right,transparent,#B8860B,transparent)}',
      '  .site-celebrations-grid{grid-template-columns:1fr 1fr;gap:12px}',
      '  .site-celebration-card{padding:20px 12px}',
      '  .site-celebration-card__img{width:52px;height:52px}',
      '  .site-host--regional .site-hero__inner{padding:60px 16px 40px}',
      '}',
      '',
      '/* ==================================================================',
      '   TAMIL THIRUMANAM BESPOKE HOST PAGE STYLING',
      '   ================================================================== */',
      'html.site-host--tamil-thirumanam, body.site-host--tamil-thirumanam{',
      '  --site-p:#FFF3DE;',
      '  --site-s:#E4B45C;',
      '  --site-b1:#5C0F1F;',
      '  --site-b2:#8C1E30;',
      '  --site-ink:#FBE6C4;',
      '  --site-fd:\'Cinzel\',\'Noto Serif Tamil\',\'Playfair Display\',Georgia,serif;',
      '  --site-fb:\'Cormorant Garamond\',\'Noto Serif Tamil\',\'DM Sans\',serif;',
      '  background:#7A1428;',
      '  background:linear-gradient(180deg, #7A1428 0%, #5C0F1F 100%);',
      '  background-attachment:fixed;',
      '  color:#FFFFFF;',
      '  font-family:var(--site-fb);',
      '}',
      '.site-host--tamil-thirumanam .site-container{width:min(100% - 48px,1180px);margin-inline:auto}',
      '.site-host--tamil-thirumanam .site-nav{background:rgba(92,15,31,.92);border-bottom:1.5px solid rgba(228,180,92,.35);box-shadow:0 4px 18px rgba(0,0,0,.3)}',
      '.site-host--tamil-thirumanam .site-nav__brand{font-family:var(--site-fd);font-weight:700;color:#FFF3DE;letter-spacing:.06em}',
      '.site-host--tamil-thirumanam .site-nav__link{color:#FFFFFF;font-weight:700;letter-spacing:.04em}',
      '.site-host--tamil-thirumanam .site-nav__link:hover{background:rgba(228,180,92,.2);color:#E4B45C}',
      '.site-host--tamil-thirumanam .site-nav__burger{border-color:#E4B45C;color:#FFF3DE}',
      '.site-host--tamil-thirumanam .site-hero{position:relative;min-height:100svh;display:flex;align-items:center;justify-content:center;text-align:center;color:#FFFFFF;background:linear-gradient(180deg, #7A1428 0%, #5C0F1F 100%);border-bottom:2px solid #E4B45C;overflow:hidden}',
      '.site-host--tamil-thirumanam .site-hero__shade{display:none!important}',
      '.site-host--tamil-thirumanam .site-hero__inner{position:relative;z-index:10;max-width:960px;width:100%;padding:clamp(80px,12vw,130px) 24px clamp(60px,8vw,100px);display:grid;justify-items:center}',
      '.site-host--tamil-thirumanam .site-hero__backdrop{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1}',
      '.site-host--tamil-thirumanam .site-hero-layer{position:absolute;pointer-events:none;user-select:none;-webkit-user-drag:none;object-fit:contain}',
      '.site-host--tamil-thirumanam .site-hero-layer--toran-top{width:92%;height:auto;left:4%;top:0%;z-index:3;opacity:0.95}',
      '.site-host--tamil-thirumanam .site-hero-layer--gopuram-arch{width:62%;height:auto;left:19%;top:1%;z-index:3;opacity:0.94}',
      '.site-host--tamil-thirumanam .site-hero-layer--pillar-left{width:18%;height:auto;left:0%;bottom:0%;z-index:4;opacity:0.95}',
      '.site-host--tamil-thirumanam .site-hero-layer--pillar-right{width:18%;height:auto;right:0%;bottom:0%;z-index:4;opacity:0.95}',
      '.site-host--tamil-thirumanam .site-hero-layer--flower-top-left{width:28%;height:auto;left:0%;top:0%;z-index:5;opacity:0.95}',
      '.site-host--tamil-thirumanam .site-hero-layer--flower-top-right{width:28%;height:auto;right:0%;top:0%;z-index:5;opacity:0.95}',
      '.site-host--tamil-thirumanam .site-hero-layer--garland-left{width:8%;height:auto;left:1%;top:0%;z-index:5;opacity:0.95}',
      '.site-host--tamil-thirumanam .site-hero-layer--garland-right{width:8%;height:auto;right:1%;top:0%;z-index:5;opacity:0.95}',
      '.site-host--tamil-thirumanam .site-hero__apex{margin-bottom:clamp(10px,1.8vw,16px);display:inline-flex;justify-content:center;align-items:center;z-index:11}',
      '.site-host--tamil-thirumanam .site-hero__apex-img{width:clamp(54px,7.5vw,80px);height:auto;filter:drop-shadow(0 4px 12px rgba(228,180,92,.4))}',
      '.site-host--tamil-thirumanam .site-hero__additional-title{font-family:var(--site-fd);letter-spacing:.18em;font-size:clamp(.95rem,2vw,1.3rem);font-weight:700;color:#E4B45C;text-transform:uppercase;margin-top:4px;margin-bottom:6px}',
      '.site-host--tamil-thirumanam .site-hero__additional-subtitle{font-family:var(--site-fb);font-style:italic;letter-spacing:.04em;font-size:clamp(1.05rem,2.1vw,1.4rem);font-weight:600;color:#FFFFFF;opacity:.95;margin-bottom:14px;line-height:1.4}',
      '.site-host--tamil-thirumanam .site-hero__person-name{font-family:var(--site-fd);font-weight:700;font-size:clamp(2.3rem,6.5vw,4.6rem);line-height:1.06;color:#FFFFFF;letter-spacing:.02em;text-shadow:0 2px 4px rgba(0,0,0,0.85)}',
      '.site-host--tamil-thirumanam .site-hero__couple-sep{font-size:clamp(1.8rem,4.5vw,3.4rem);color:#E4B45C;line-height:1.1}',
      '.site-host--tamil-thirumanam .site-hero__couple-sep .amp{font-family:var(--site-fd);font-size:clamp(1.8rem,4.5vw,3.4rem);color:#E4B45C;text-shadow:0 0 14px rgba(228,180,92,.5);font-weight:700}',
      '.site-host--tamil-thirumanam .site-hero__person-parents{font-family:var(--site-fb);font-size:clamp(.95rem,1.8vw,1.22rem);color:#FFFFFF;margin-top:6px;font-weight:600}',
      '.site-host--tamil-thirumanam .site-hero__person-parents span{color:#E4B45C;font-weight:700;font-size:.78em;letter-spacing:.16em;text-transform:uppercase;opacity:1}',
      '.site-host--tamil-thirumanam .site-hero__person-parents strong{color:#FFFFFF;font-weight:700;font-size:1.08em}',
      '.site-host--tamil-thirumanam .site-hero__sub{font-family:var(--site-fd);font-size:clamp(1.1rem,2.4vw,1.55rem);font-weight:700;color:#FFF3DE;letter-spacing:.1em;margin-top:14px}',
      '.site-host--tamil-thirumanam .site-hero__when{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);border-radius:999px;padding:9px 24px;color:#FFFFFF;font-family:var(--site-fd);font-weight:700;font-size:clamp(.82rem,1.7vw,1rem);letter-spacing:.12em;text-transform:uppercase;box-shadow:0 4px 14px rgba(0,0,0,0.4);margin-top:20px;display:inline-block}',
      '.site-host--tamil-thirumanam .site-btn--ghost{background:linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12));border:1.5px solid #FFFFFF;color:#FFFFFF;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.4)}',
      '.site-host--tamil-thirumanam .site-btn--ghost:hover{background:#FFFFFF;color:#5C0F1F;border-color:#FFFFFF}',
      '.site-host--tamil-thirumanam .site-btn--soft{background:#E4B45C;color:#5C0F1F;border:1.5px solid #E4B45C;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.4)}',
      '.site-host--tamil-thirumanam .site-btn--soft:hover{background:#C49A45;color:#5C0F1F}',
      '.site-host--tamil-thirumanam .site-section{padding:84px 0}',
      '.site-host--tamil-thirumanam .site-section--alt{background:linear-gradient(180deg, #5C0F1F 0%, #7A1428 100%)}',
      '.site-host--tamil-thirumanam .site-title__eyebrow{color:#E4B45C;font-weight:700;letter-spacing:.22em;font-size:.78rem}',
      '.site-host--tamil-thirumanam .site-title h2{font-family:var(--site-fd);color:#FFFFFF;font-size:clamp(2rem,4.5vw,3rem)}',
      '.site-host--tamil-thirumanam .site-title p{font-family:var(--site-fb);font-size:1.15rem;color:#FFFFFF;opacity:.9}',
      '.site-host--tamil-thirumanam .site-story{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);border-radius:24px;padding:clamp(28px,5vw,48px);box-shadow:0 8px 24px rgba(0,0,0,0.45);max-width:860px;margin:0 auto}',
      '.site-host--tamil-thirumanam .site-story p{font-family:var(--site-fb);font-size:clamp(1.2rem,2.4vw,1.55rem);line-height:1.85;color:#FFFFFF;font-weight:600}',
      '.site-host--tamil-thirumanam .site-celebration-card{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);border-radius:20px;padding:28px 18px;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,0.4);display:flex;flex-direction:column;align-items:center}',
      '.site-host--tamil-thirumanam .site-celebration-card__title{font-family:var(--site-fd);font-size:1.2rem;font-weight:700;color:#FFFFFF;letter-spacing:.1em;margin-bottom:4px}',
      '.site-host--tamil-thirumanam .site-celebration-card__weekday{color:#FFFFFF;font-weight:600}',
      '.site-host--tamil-thirumanam .site-celebration-card__date{color:#E4B45C;font-weight:700}',
      '.site-host--tamil-thirumanam .site-celebration-card__time{color:#FFFFFF;font-weight:700}',
      '.site-host--tamil-thirumanam .site-detail{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);box-shadow:0 6px 20px rgba(0,0,0,0.4);border-radius:20px}',
      '.site-host--tamil-thirumanam .site-detail svg{color:#E4B45C}',
      '.site-host--tamil-thirumanam .site-detail small{color:#E4B45C;font-weight:700;letter-spacing:.18em}',
      '.site-host--tamil-thirumanam .site-detail strong{color:#FFFFFF;font-family:var(--site-fb);font-size:1.22rem;font-weight:700}',
      '.site-host--tamil-thirumanam .site-count-section{background:linear-gradient(180deg, #5C0F1F 0%, #7A1428 100%);border-top:1.5px solid rgba(228,180,92,.35);border-bottom:1.5px solid rgba(228,180,92,.35);color:#FFFFFF}',
      '.site-host--tamil-thirumanam .site-count-section .site-title h2{color:#FFFFFF}',
      '.site-host--tamil-thirumanam .site-count .cd-unit{background:linear-gradient(145deg, rgba(80,12,26,0.88), rgba(45,6,14,0.96));border:1.2px solid rgba(255,255,255,0.45);box-shadow:0 4px 12px rgba(0,0,0,0.4);border-radius:18px}',
      '.site-host--tamil-thirumanam .site-count .cd-value{color:#FFFFFF}',
      '.site-host--tamil-thirumanam .site-count .cd-label{color:#E4B45C;font-weight:700;letter-spacing:.16em}',
      '.site-host--tamil-thirumanam .site-venue__card{background:linear-gradient(145deg, rgba(74,10,24,0.88), rgba(45,6,14,0.96));border:1.5px solid rgba(255,255,255,0.45);box-shadow:0 8px 24px rgba(0,0,0,0.45)}',
      '.site-host--tamil-thirumanam .site-venue__card h3{color:#FFFFFF;font-family:var(--site-fd)}',
      '.site-host--tamil-thirumanam .site-venue__media-link{background:linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12));border:1.5px solid #FFFFFF;color:#FFFFFF;font-weight:700}',
      '.site-host--tamil-thirumanam .site-venue__media{border:1.5px solid rgba(255,255,255,0.4);box-shadow:0 6px 18px rgba(0,0,0,0.5)}',
      '.site-landscape--tamil-thirumanam{position:relative;width:100%;height:clamp(220px,28vw,380px);overflow:hidden;background:linear-gradient(to bottom,#5C0F1F 0%,#3A0812 100%);pointer-events:none;user-select:none}',
      '.site-landscape--tamil-thirumanam img{position:absolute;pointer-events:none;user-select:none;-webkit-user-drag:none;object-fit:contain}',
      '.site-landscape__uruli{bottom:0;left:50%;transform:translateX(-50%);width:clamp(120px,22vw,220px);height:auto;z-index:6}',
      '.site-landscape__lamp-left{bottom:0;left:2%;width:clamp(90px,16vw,170px);height:auto;z-index:5}',
      '.site-landscape__lamp-right{bottom:0;right:2%;width:clamp(90px,16vw,170px);height:auto;z-index:5}',
      '.site-landscape__peacock-left{bottom:2%;left:8%;width:clamp(130px,22vw,240px);height:auto;z-index:4}',
      '.site-landscape__peacock-right{bottom:2%;right:8%;width:clamp(130px,22vw,240px);height:auto;z-index:4}',
      '.site-host--tamil-thirumanam .site-footer{background:#3A0812;border-top:2px solid #E4B45C;color:#FFFFFF;padding:56px 24px}',
      '.site-host--tamil-thirumanam .site-footer__names{font-family:var(--site-fd);color:#E4B45C;font-size:clamp(2rem,4vw,2.8rem);letter-spacing:.04em;margin-bottom:10px}',
      '.site-host--tamil-thirumanam .site-footer p{color:rgba(255,255,255,.75);font-size:.95rem}',
      '.site-host--tamil-thirumanam .site-footer a{color:#E4B45C}',
      '@media(max-width:640px){',
      '  .site-host--tamil-thirumanam .site-hero__inner{padding:60px 16px 40px}',
      '}'
    ].join('\n');
  }

  /* Inline JS for countdown, share, music, lightbox, nav on the hosted page */
  var INLINE_JS = [
    '  // --- Countdown ---',
    '  (function initCountdown() {',
    '    if (window.IH && IH.countdown) IH.countdown.mount(document.body);',
    '    else setTimeout(initCountdown, 100);',
    '  })();',
    '',
    '  // --- Share ---',
    '  (function () {',
    '    var btn = document.querySelector("[data-share-invitation]");',
    '    if (!btn) return;',
    '    var shareData = { title: document.title, url: window.location.href };',
    '    btn.addEventListener("click", function () {',
    '      if (navigator.share) {',
    '        navigator.share(shareData).catch(function () {});',
    '      } else {',
    '        navigator.clipboard.writeText(window.location.href).then(function () {',
    '          var original = btn.innerHTML;',
    '          btn.innerHTML = \'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg><span>Copied!</span>\';',
    '          setTimeout(function () { btn.innerHTML = original; }, 1500);',
    '        }).catch(function () {});',
    '      }',
    '    });',
    '  })();',
    '',
    '  // --- Navigation & Smooth In-Page Scrolling ---',
    '  (function () {',
    '    var burger = document.querySelector(".site-nav__burger");',
    '    var menu = document.querySelector(".site-nav__menu");',
    '    var closeMenu = function () {',
    '      if (menu) menu.classList.remove("is-open");',
    '      if (burger) burger.setAttribute("aria-expanded", "false");',
    '    };',
    '    if (burger && menu) {',
    '      burger.addEventListener("click", function () {',
    '        var open = menu.classList.toggle("is-open");',
    '        burger.setAttribute("aria-expanded", open ? "true" : "false");',
    '      });',
    '    }',
    '    document.addEventListener("click", function (e) {',
    '      var link = e.target.closest("a[href^=\'#\']");',
    '      if (!link) return;',
    '      var href = link.getAttribute("href");',
    '      if (!href || href === "#") return;',
    '      var targetId = href.slice(1);',
    '      e.preventDefault();',
    '      closeMenu();',
    '      if (targetId === "top") {',
    '        window.scrollTo({ top: 0, behavior: "smooth" });',
    '      } else {',
    '        var el = document.getElementById(targetId);',
    '        if (el) {',
    '          el.scrollIntoView({ behavior: "smooth", block: "start" });',
    '        }',
    '      }',
    '      try {',
    '        if (window.history && window.history.replaceState) {',
    '          window.history.replaceState(null, "", "#" + targetId);',
    '        }',
    '      } catch (err) {}',
    '    });',
    '    if (window.location.hash) {',
    '      setTimeout(function () {',
    '        var initEl = document.getElementById(window.location.hash.slice(1));',
    '        if (initEl) initEl.scrollIntoView({ behavior: "smooth", block: "start" });',
    '      }, 200);',
    '    }',
    '  })();',
    '',
    '  // --- Nav scroll shadow ---',
    '  (function () {',
    '    var nav = document.querySelector(".site-nav");',
    '    if (!nav) return;',
    '    var onScroll = function () {',
    '      nav.classList.toggle("is-scrolled", window.scrollY > 8);',
    '    };',
    '    window.addEventListener("scroll", onScroll, { passive: true });',
    '    onScroll();',
    '  })();',
    '',
    '  // --- Gallery Lightbox ---',
    '  (function () {',
    '    var box = null;',
    '    var current = 0;',
    '    var srcs = [];',
    '    function syncSrcs() {',
    '      srcs = Array.prototype.slice.call(document.querySelectorAll("[data-site-lightbox]")).map(function (it) {',
    '        var img = it.querySelector("img");',
    '        return img ? img.src : "";',
    '      });',
    '    }',
    '    function show() {',
    '      var img = box.querySelector(".site-lightbox__img");',
    '      img.src = srcs[current];',
    '      box.querySelector(".site-lightbox__count").textContent = (current + 1) + " / " + srcs.length;',
    '    }',
    '    function step(d) { syncSrcs(); current = (current + d + srcs.length) % srcs.length; show(); }',
    '    function closeBox() { if (box) { box.classList.remove("is-open"); document.body.style.overflow = ""; } }',
    '    function buildBox() {',
    '      box = document.createElement("div");',
    '      box.className = "site-lightbox";',
    '      box.setAttribute("role", "dialog");',
    '      box.setAttribute("aria-modal", "true");',
    '      box.innerHTML = \'<button class="site-lightbox__btn site-lightbox__close" type="button" aria-label="Close">Ã—</button>\' +',
    '        \'<button class="site-lightbox__btn site-lightbox__prev" type="button" aria-label="Previous">‹</button>\' +',
    '        \'<button class="site-lightbox__btn site-lightbox__next" type="button" aria-label="Next">›</button>\' +',
    '        \'<img class="site-lightbox__img" alt="" />\' +',
    '        \'<span class="site-lightbox__count"></span>\';',
    '      box.addEventListener("click", function (e) { if (e.target === box) closeBox(); });',
    '      box.querySelector(".site-lightbox__close").addEventListener("click", closeBox);',
    '      box.querySelector(".site-lightbox__prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });',
    '      box.querySelector(".site-lightbox__next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });',
    '      document.body.appendChild(box);',
    '      document.addEventListener("keydown", function (e) {',
    '        if (!box.classList.contains("is-open")) return;',
    '        if (e.key === "Escape") closeBox();',
    '        if (e.key === "ArrowLeft") step(-1);',
    '        if (e.key === "ArrowRight") step(1);',
    '      });',
    '    }',
    '    function openFig(fig) {',
    '      if (!fig) return;',
    '      syncSrcs();',
    '      var i = Array.prototype.indexOf.call(document.querySelectorAll("[data-site-lightbox]"), fig);',
    '      if (i < 0 || !srcs[i]) return;',
    '      current = i;',
    '      if (!box) buildBox();',
    '      show();',
    '      box.classList.add("is-open");',
    '      document.body.style.overflow = "hidden";',
    '    }',
    '    document.addEventListener("click", function (e) {',
    '      var fig = e.target.closest ? e.target.closest("[data-site-lightbox]") : null;',
    '      if (fig) { e.preventDefault(); openFig(fig); }',
    '    });',
    '    document.addEventListener("keydown", function (e) {',
    '      if (e.key !== "Enter" && e.key !== " ") return;',
    '      var t = e.target, fig = (t && t.closest) ? t.closest("[data-site-lightbox]") : null;',
    '      if (fig) { e.preventDefault(); openFig(fig); }',
    '    });',
    '  })();',
    '',
    '  // --- Music Toggle ---',
    '  (function () {',
    '    var audio = document.getElementById("site-music");',
    '    var mbtn = document.getElementById("site-music-btn");',
    '    if (!audio || !mbtn) return;',
    '    mbtn.addEventListener("click", function () {',
    '      if (audio.paused) {',
    '        audio.play().catch(function () {});',
    '        mbtn.classList.add("is-playing");',
    '        mbtn.setAttribute("aria-pressed", "true");',
    '        mbtn.setAttribute("aria-label", "Pause music");',
    '      } else {',
    '        audio.pause();',
    '        mbtn.classList.remove("is-playing");',
    '        mbtn.setAttribute("aria-pressed", "false");',
    '        mbtn.setAttribute("aria-label", "Play music");',
    '      }',
    '    });',
    '  })();'
  ].join('\n');

  /* ------------------------------------------------------------------
     2e. Build the hosted page — complete Host Page matching lovely-and-nani reference
     ------------------------------------------------------------------ */

  function buildHtml(state, opts) {
    /* How many folders up the shared js/ and images/ live. One level by
       default; a page that owns a folder of its own passes more. */
    var up = (opts && typeof opts.up === 'string') ? opts.up : '../';
    var data = resolvePaths(state, up);

    var who = personName(state) || 'Our Celebration';
    var meta = eventMeta(data);
    /* "Other" is a picker choice, not a name to print: guests read "Event". */
    var typeLabel = data.eventType === 'other' ? 'Event' : meta.label;
    var title = who + ' — ' + typeLabel + ' Invitation';

    var inv = IH.invitation;
    var p = paletteFor(data);
    /* Regional designs (Telugu Pelli, Tamil Thirumanam) share one host page
       built from the card's own layers in images/invitation-assets/<dir>/.
       isTeluguPelli means "uses that shared regional design". */
    var regionalCfg = ((inv && inv.REGIONAL_DESIGNS) || {})[state.template] || null;
    var isTeluguPelli = !!regionalCfg;
    function tpAsset(file) { return up + 'images/invitation-assets/' + (regionalCfg ? regionalCfg.dir : 'telugu-pelli') + '/' + file; }
    function tpImg(file, cls) { return '<img class="' + cls + '" src="' + tpAsset(file) + '" alt="" loading="eager">'; }
    var isTamilSlug = (state.template === 'tamil-thirumanam');
    var isTamilThirumanam = false; // the old maroon Tamil host design is replaced by the regional one
    /* Every other wedding template: the wedding design engine's look (palette
       with text that follows the background, fonts, motif, frame, date). */
    var WD = IH.weddingDesigns;
    var wdOneName = /^(baby-shower|naming-ceremony|house-warming|anniversary|graduation|retirement|farewell|corporate|festival|school-events|college-events|party|community-events)$/.test(data.eventType);
    var wdSpec = (!isTeluguPelli && WD && (data.eventType === 'wedding' || data.eventType === 'engagement' || data.eventType === 'reception' || data.eventType === 'birthday' || wdOneName)) ? WD.spec(state.template) : null;
    if (wdSpec && (data.eventType === 'reception' || data.eventType === 'birthday' || wdOneName) && wdSpec.occasion !== data.eventType) wdSpec = null;
    var wdBody = '';
    if (wdSpec) {
      var wdTplData = IH.data && IH.data.getTemplate ? IH.data.getTemplate(state.template) : null;
      var wdAttrs = WD.articleAttrs(data, data.colors || (wdTplData && wdTplData.colors) || {});
      wdBody = ' class="site-host--wd site-wd-l-' + wdSpec.layout + ' site-wd-fr-' + wdSpec.frame + wdAttrs.cls.replace(/ (invitation--wd|wd-l-\S+|wd-fr-\S+)/g, '') + '"' +
        ' style="' + wdAttrs.vars + ';--wd-bg1:' + p.bg1 + ';--wd-bg2:' + p.bg2 + '"';
    }

    /* Format date and time for display */
    var d = inv.formatDate(data.date);
    var time = inv.formatTime(data.time);
    var weekday = d.weekday || '';
    var dateFull = d.full || 'Date to be announced';
    var heroWhen = [weekday, dateFull, time].filter(Boolean).join(' · ');

    /* Hero subtitle: event type + title (e.g., "Wedding · Wedding") - always shows both if title exists */
    var heroSub = typeLabel;
    if (data.eventType === 'other') {
      // The headline already is the title, so name the person instead of repeating it.
      heroSub = data.personName || typeLabel;
    } else if (data.title) {
      heroSub = meta.label + ' · ' + data.title;
    }

    /* Maps URL */
    var mapsUrl = inv.getMapsUrl ? inv.getMapsUrl(data) : (data.mapsUrl || (data.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.address) : ''));

    /* Celebrations events list */
    var celebrations = [
      { enabled: !!(data.haldiEnabled || ((isTeluguPelli || isTamilThirumanam) && data.haldiDate)), title: 'HALDI', date: data.haldiDate, time: data.haldiTime, image: isTeluguPelli ? tpAsset('tp-icon-haldi.png') : up + 'images/ceremony-icons/haldi.png', fallback: up + 'images/templates/haldi-ceremony.svg' },
      { enabled: !!(data.mehndiEnabled || ((isTeluguPelli || isTamilThirumanam) && data.mehndiDate)), title: 'MEHNDI', date: data.mehndiDate, time: data.mehndiTime, image: isTeluguPelli ? tpAsset('tp-icon-gorintaku.png') : up + 'images/ceremony-icons/mehndi.png', fallback: up + 'images/templates/mehendi-ceremony.svg' },
      { enabled: !!(data.ceremonyEnabled || ((isTeluguPelli || isTamilThirumanam) && (data.ceremonyDate || data.date))), title: 'WEDDING', date: data.ceremonyDate || data.date, time: data.ceremonyTime || data.time, image: isTeluguPelli ? tpAsset('tp-icon-mangalsutra.png') : up + 'images/ceremony-icons/wedding.png', fallback: up + 'images/templates/wedding-day-mandap.svg' },
      { enabled: !!(data.receptionEnabled || ((isTeluguPelli || isTamilThirumanam) && data.receptionDate)), title: 'RECEPTION', date: data.receptionDate, time: data.receptionTime, image: isTeluguPelli ? tpAsset('tp-icon-kalasam.png') : up + 'images/ceremony-icons/reception.png', fallback: up + 'images/templates/reception-evening.svg' }
    ].filter(function (e) { return e.enabled; });
    /* Engagement cards on the design engine: engagement ceremony names. */
    var wdEngaged = data.eventType === 'engagement' || !!(wdSpec && wdSpec.occasion === 'engagement');
    var wdBirthday = !!(wdSpec && wdSpec.occasion === 'birthday');
    // The other occasions: programme and header wording from Additional Details (OCCASION_DETAILS).
    var occCfg = (inv.OCCASION_DETAILS && inv.OCCASION_DETAILS[data.eventType]) || null;
    var occHost = wdBirthday || !!occCfg;
    if (occCfg) {
      celebrations = inv.occasionEvents(data).map(function (e) {
        var src = WD.eventIconSrc(e.icon, up);
        return { enabled: true, title: e.title.toUpperCase(), date: e.date, time: e.time, image: src, fallback: src };
      });
    } else if (wdBirthday) {
      // Birthday: the party programme from Additional Details, drawn with the card's own icons.
      celebrations = WD.birthdayEvents(data).map(function (e) {
        var src = WD.eventIconSrc(e.icon, up);
        return { enabled: true, title: e.title.toUpperCase(), date: e.date, time: e.time, image: src, fallback: src };
      });
    } else if (wdSpec && wdSpec.occasion === 'reception') {
      celebrations = celebrations.filter(function (e) { return e.title === 'WEDDING' || e.title === 'RECEPTION'; });
      celebrations.forEach(function (e) { e.title = (e.title === 'WEDDING' ? 'Welcome & Cocktails' : 'Dinner & Dance').toUpperCase(); });
    } else if (wdEngaged) {
      // Ring ceremony and the lunch/dinner only.
      celebrations = celebrations.filter(function (e) { return e.title === 'WEDDING' || e.title === 'RECEPTION'; });
      celebrations.forEach(function (e) { e.title = (e.title === 'WEDDING' ? ((wdSpec && wdSpec.mainEvent) || 'Ring Ceremony') :(/^(0\d|1[0-5]):/.test(e.time || '') ? 'Engagement Lunch' : 'Engagement Dinner')).toUpperCase(); });
    }

    /* Family blessings check */
    var bGroomParents = data.groomParents || (isTamilSlug ? 'Groom’s Parents' : (isTeluguPelli ? 'Groom’s Parents' : ''));
    var bBrideParents = data.brideParents || (isTamilSlug ? 'Bride’s Parents' : (isTeluguPelli ? 'Bride’s Parents' : ''));
    /* Groom's/Bride's families belong to couple events only; parents left over from a wedding draft must not leak into other categories. */
    var coupleEvent = data.eventType === 'wedding' || data.eventType === 'engagement' || data.eventType === 'reception';
    var showBlessings = coupleEvent && (data.showBlessings !== false) && (bGroomParents || bBrideParents);

    /* Build navigation links (no RSVP) */
    var navLinks = [
      { href: '#story', label: 'Our Story' }
    ];
    if (celebrations.length > 0) {
      navLinks.push({ href: '#celebrations', label: 'Celebrations' });
    }
    if (showBlessings) {
      navLinks.push({ href: '#blessings', label: 'Blessings' });
    }
    navLinks.push({ href: '#details', label: 'Details' });
    if (data.showGallery !== false && data.gallery && data.gallery.length) {
      navLinks.push({ href: '#gallery', label: 'Gallery' });
    }
    if (data.showCountdown !== false && data.date) {
      navLinks.push({ href: '#countdown', label: 'Countdown' });
    }
    if (data.venue || data.address) {
      navLinks.push({ href: '#venue', label: 'Venue' });
    }

    var head = [
      '<!DOCTYPE html>',
      '<html lang="en"' + (isTeluguPelli ? ' class="site-host--regional site-host--regional-' + state.template + '"' : (isTamilThirumanam ? ' class="site-host--tamil-thirumanam"' : '')) + '>',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
      '<title>' + esc(title) + '</title>',
      '<meta name="description" content="' + esc(metaDescription(state)) + '">',
      '<meta name="generator" content="InviteAura">',
      '<meta name="robots" content="noindex">',
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + esc(title) + '">',
      '<meta property="og:description" content="' + esc(metaDescription(state)) + '">',
      opts && opts.canonical ? '<meta property="og:url" content="' + esc(opts.canonical) + '">' : '',
      opts && opts.image ? '<meta property="og:image" content="' + esc(opts.image) + '">' : '',
      opts && opts.image ? '<meta name="twitter:card" content="summary_large_image">' : '',
      '',
      '<link rel="icon" href="' + up + 'images/logo/favicon.svg" type="image/svg+xml">',
      '<link rel="icon" href="' + up + 'images/logo/favicon-32.png" type="image/png" sizes="32x32">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@600;700&family=Great+Vibes&family=Cormorant+Garamond:wght@600;700&family=Cinzel:wght@600;700;800&family=Noto+Serif+Telugu:wght@500;600;700&family=Noto+Serif+Tamil:wght@500;600;700&family=Marcellus&family=Parisienne&family=Bodoni+Moda:ital,wght@0,500;0,600;1,500&family=Josefin+Sans:wght@400;600&family=Allura&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Fredoka:wght@500;600&family=Pacifico&family=Nunito:wght@500;700&display=swap">',
      '',
      '<style>',
      siteHostPageCss(p),
      '</style>',
      '</head>',
      '<body' + (isTeluguPelli ? ' class="site-host--regional site-host--regional-' + state.template + '" style="--tp-divider:url(\'' + tpAsset('tp-divider.png') + '\')"' : (isTamilThirumanam ? ' class="site-host--tamil-thirumanam"' : wdBody)) + '>'
    ];

    var body = [];

    /* Navigation */
    body.push('<nav class="site-nav" aria-label="Invitation">');
    body.push('<div class="site-nav__inner">');
    body.push('<a class="site-nav__brand" href="#top">' + esc(brandText(state)) + '</a>');
    body.push('<button class="site-nav__burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu">');
    body.push('<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18"/></svg>');
    body.push('</button>');
    body.push('<div class="site-nav__menu" id="site-menu">');
    navLinks.forEach(function (link) {
      body.push('<a class="site-nav__link" href="' + link.href + '">' + esc(link.label) + '</a>');
    });
    body.push('</div>');
    body.push('</div>');
    body.push('</nav>');

    /* Hero section */
    var heroBgStyle = '';
    if (isTeluguPelli) {
      heroBgStyle = 'background:radial-gradient(ellipse at 50% 25%,#FFFFFF 0%,#FAF5EC 55%,#F5EADB 100%);';
    } else if (isTamilThirumanam) {
      heroBgStyle = 'background:linear-gradient(180deg, #7A1428 0%, #5C0F1F 100%);';
    } else if (data.background) {
      /* Use palette primary for top gradient, dark bg for bottom */
      var primaryRgba = rgba(p.primary, 0.92);
      var darkRgba = rgba(p.bg1, 0.85);
      heroBgStyle = 'background-image:linear-gradient(160deg,' + primaryRgba + ',' + darkRgba + '),url(' + esc(data.background) + ');background-size:cover;background-position:center;';
    } else {
      heroBgStyle = 'background:linear-gradient(160deg,var(--site-b1),var(--site-b2));';
    }

    body.push('<section class="site-hero" id="top" style="' + heroBgStyle + '">');
    if (isTeluguPelli) {
      var pillarBg = 'background-image:url(\'' + tpAsset('tp-pillar-cap.png') + '\'),url(\'' + tpAsset('tp-pillar-base.png') + '\'),url(\'' + tpAsset('tp-pillar-shaft.png') + '\')';
      body.push('<div class="site-hero__backdrop" aria-hidden="true">');
      body.push('  <div class="site-hero-layer tp-host-pillar tp-host-pillar--left" style="' + pillarBg + '"></div>');
      body.push('  <div class="site-hero-layer tp-host-pillar tp-host-pillar--right" style="' + pillarBg + '"></div>');
      body.push('  ' + tpImg('tp-toran.png', 'site-hero-layer tp-host-toran'));
      body.push('  ' + tpImg('tp-jasmine-string.png', 'site-hero-layer tp-host-jasmine tp-host-jasmine--left'));
      body.push('  ' + tpImg('tp-jasmine-string.png', 'site-hero-layer tp-host-jasmine tp-host-jasmine--right'));
      body.push('  ' + tpImg('tp-canopy-corner.png', 'site-hero-layer tp-host-canopy tp-host-canopy--left'));
      body.push('  ' + tpImg('tp-canopy-corner.png', 'site-hero-layer tp-host-canopy tp-host-canopy--right'));
      body.push('  ' + tpImg('bells-left.png', 'site-hero-layer tp-host-bells tp-host-bells--left'));
      body.push('  ' + tpImg('bells-right.png', 'site-hero-layer tp-host-bells tp-host-bells--right'));
      body.push('</div>');
    } else if (isTamilThirumanam) {
      body.push('<div class="site-hero__backdrop" aria-hidden="true">');
      body.push('  <img class="site-hero-layer site-hero-layer--toran-top" src="' + up + 'images/invitation-assets/tamil-thirumanam/toran-top.png" alt="" loading="eager">');
      body.push('  <img class="site-hero-layer site-hero-layer--gopuram-arch" src="' + up + 'images/invitation-assets/tamil-thirumanam/gopuram-arch.png" alt="" loading="eager">');
      body.push('  <img class="site-hero-layer site-hero-layer--pillar-left" src="' + up + 'images/invitation-assets/tamil-thirumanam/pillar-left.png" alt="" loading="eager">');
      body.push('  <img class="site-hero-layer site-hero-layer--pillar-right" src="' + up + 'images/invitation-assets/tamil-thirumanam/pillar-right.png" alt="" loading="eager">');
      body.push('  <img class="site-hero-layer site-hero-layer--flower-top-left" src="' + up + 'images/invitation-assets/tamil-thirumanam/flower-top-left.png" alt="" loading="eager">');
      body.push('  <img class="site-hero-layer site-hero-layer--flower-top-right" src="' + up + 'images/invitation-assets/tamil-thirumanam/flower-top-right.png" alt="" loading="eager">');
      body.push('  <img class="site-hero-layer site-hero-layer--garland-left" src="' + up + 'images/invitation-assets/tamil-thirumanam/garland-left.png" alt="" loading="eager">');
      body.push('  <img class="site-hero-layer site-hero-layer--garland-right" src="' + up + 'images/invitation-assets/tamil-thirumanam/garland-right.png" alt="" loading="eager">');
      body.push('</div>');
    } else if (wdSpec) {
      // Floral line art (same pieces as the card) in place of the thin corner lines.
      var wdLa = WD.lineArt ? WD.lineArt(data, wdSpec, up) : null;
      body.push('<div class="site-hero__backdrop site-wd-frame" aria-hidden="true">' +
        (wdLa ? WD.lineArtFrame(wdLa) : (/vine|deco|kolam|hairline/.test(wdSpec.frame) ? WD.corners(wdSpec.frame) : '')) + '</div>');
    } else {
      body.push('<div class="site-hero__shade" aria-hidden="true"></div>');
    }
    body.push('<div class="site-hero__inner">');

    if (isTeluguPelli) {
      body.push('<div class="site-hero__apex">');
      body.push('  <img class="site-hero__apex-img" src="' + tpAsset('tp-ganesha.png') + '" alt="Lord Vinayaka" width="80" height="80">');
      body.push('</div>');
      body.push('<p class="tp-host-greeting" lang="' + regionalCfg.lang + '">' +
        regionalCfg.greeting.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</p>');
    } else if (isTamilThirumanam) {
      body.push('<div class="site-hero__apex">');
      body.push('  <img class="site-hero__apex-img" src="' + up + 'images/invitation-assets/tamil-thirumanam/apex-murugan.png" alt="Murugan Vel" width="70" height="70">');
      body.push('</div>');
    } else if (wdSpec) {
      var wdMotif = up + 'images/wedding-motifs/' + wdSpec.slug + '.svg';
      // Birthday and the one-name occasions have no SVG motif: a missing crest is hidden.
      var wdNoMotif = wdSpec.occasion === 'birthday' || WD.isOneName(wdSpec) || !!(wdLa && wdLa.style === 'backdrop');
      body.push('<div class="site-wd-crest"><img src="' + esc(wdLa ? wdLa.crest : wdMotif) + '" alt="" aria-hidden="true"' +
        (wdLa ? (wdNoMotif ? ' onerror="this.style.display=\'none\'"' : ' onerror="this.onerror=null;this.src=\'' + esc(wdMotif) + '\'"') : '') + '></div>');
    }

    /* Hero photo */
    if (data.photo) {
      body.push('<img class="site-hero__photo" src="' + esc(data.photo) + '" alt="' + esc(brandText(state)) + '" width="132" height="132">');
    }

    /* Kicker */
    var kicker = data.hostName || meta.kicker;
    // A birthday's header wording (Additional Details) takes the kicker's place.
    if (data.eventType !== 'wedding' && !(occHost && data.additionalTitle)) {
      body.push('<p class="site-hero__kicker">' + esc(kicker) + '</p>');
    }

    if (data.eventType === 'wedding' || data.eventType === 'engagement' || occHost) {
      if (data.additionalTitle) {
        body.push('<p class="site-hero__additional-title">' + esc(data.additionalTitle) + '</p>');
      }
      if (data.additionalSubtitle) {
        body.push('<p class="site-hero__additional-subtitle">' + esc(wdEngaged ? WD.engagementText(data.additionalSubtitle) : data.additionalSubtitle) + '</p>');
      }
    }

    /* Names */
    if (data.eventType === 'wedding' || data.eventType === 'engagement') {
      var groom = esc(data.groomName || 'Groom');
      var bride = esc(data.brideName || 'Bride');
      var groomParents = data.groomParents || 'Groom’s Parents';
      var brideParents = data.brideParents || 'Bride’s Parents';
      var leftName = groom, leftParents = groomParents, leftRelationText = 'Son of', leftClass = 'groom';
      var rightName = bride, rightParents = brideParents, rightRelationText = 'Daughter of', rightClass = 'bride';

      if (data.namesSwapped) {
        leftName = bride; leftParents = brideParents; leftRelationText = 'Daughter of', leftClass = 'bride';
        rightName = groom; rightParents = groomParents; rightRelationText = 'Son of', rightClass = 'groom';
      }

      var teOf = function (v) { return (isTeluguPelli && v) ? '<p class="tp-host-name-te" lang="' + regionalCfg.lang + '">' + esc(v) + '</p>' : ''; };
      var groomNative = '';
      var brideNative = '';
      var leftTe = teOf(data.namesSwapped ? brideNative : groomNative);
      var rightTe = teOf(data.namesSwapped ? groomNative : brideNative);
      var swappedHeroClass = data.namesSwapped ? ' site-hero__couple--swapped' : '';
      body.push('<div class="site-hero__couple' + swappedHeroClass + '">');
      body.push('  <div class="site-hero__person site-hero__person--left site-hero__person--' + leftClass + '">');
      body.push('    <h1 class="site-hero__person-name">' + leftName + '</h1>' + leftTe);
      if (leftParents) {
        body.push('    <p class="site-hero__person-parents"><span>' + leftRelationText + '</span><strong>' + esc(leftParents) + '</strong></p>');
      }
      body.push('  </div>');
      body.push('  <div class="site-hero__couple-sep">' + (isTeluguPelli ? tpImg('tp-sprig.png', 'tp-host-sprig tp-host-sprig--left') : '') +
        '<span class="amp">&amp;</span>' + (isTeluguPelli ? tpImg('tp-sprig.png', 'tp-host-sprig tp-host-sprig--right') : '') + '</div>');
      body.push('  <div class="site-hero__person site-hero__person--right site-hero__person--' + rightClass + '">');
      body.push('    <h1 class="site-hero__person-name">' + rightName + '</h1>' + rightTe);
      if (rightParents) {
        body.push('    <p class="site-hero__person-parents"><span>' + rightRelationText + '</span><strong>' + esc(rightParents) + '</strong></p>');
      }
      body.push('  </div>');
      body.push('</div>');
    } else if (wdSpec && /^(baby-shower|naming-ceremony)$/.test(wdSpec.occasion)) {
      // Baby shower / naming ceremony: "Parents-to-be" or "Our Son" over the name, the parents under it.
      var wdLabel = WD.occasionNameLabel(data, wdSpec);
      body.push((wdLabel ? '<p class="site-hero__occ-label">' + esc(wdLabel) + '</p>' : '') +
        '<h1 class="site-hero__names">' + (wdSpec.occasion === 'baby-shower' && data.personName ? WD.coupleInner(data.personName, esc) : inv.headline(data)) + '</h1>' +
        WD.occasionNameAfter(data, wdSpec, esc));
    } else {
      var headline = inv.headline(data);
      body.push('<h1 class="site-hero__names">' + headline + '</h1>');
    }

    if (isTeluguPelli && (data.eventType === 'wedding' || data.eventType === 'engagement')) {
      /* Card-style tagline and DEC | 12 | 2026 date block over a faint muggu. */
      var tpD = inv.formatDate(data.date);
      var tpT = inv.formatTime(data.time);
      body.push('<p class="tp-host-tagline">Two souls <span class="tp-host-pk" aria-hidden="true"><i class="tp-host-pk__pasupu"></i><i class="tp-host-pk__kumkuma"></i></span> One beautiful journey</p>');
      if (tpD.full || tpT) {
        body.push('<div class="tp-host-date">' + (inv.TELUGU_MUGGU || '') +
          '<div class="tp-host-date__weekday"><span class="tp-host-date__rule"></span>' + esc((tpD.weekday || '').toUpperCase()) + '<span class="tp-host-date__rule"></span></div>' +
          '<div class="tp-host-date__row"><span class="tp-host-date__side">' + esc((tpD.month || '').slice(0, 3).toUpperCase()) + '</span>' +
          '<span class="tp-host-date__day">' + esc(tpD.day || '') + '</span><span class="tp-host-date__side">' + esc(tpD.year || '') + '</span></div>' +
          (tpT ? '<div class="tp-host-date__time">' + esc(tpT) + ' onwards</div>' : '') +
        '</div>');
      }
    } else if (wdSpec) {
      var wdD = inv.formatDate(data.date), wdT = inv.formatTime(data.time);
      // Birthday: the theme word, "Turning N" and the party title under the name.
      if (wdSpec.occasion === 'birthday') body.push(WD.birthdayTitle(wdSpec, data.years, esc) + (data.title ? '<p class="site-hero__sub wd-bday-tagline">' + esc(data.title) + '</p>' : ''));
      // Baby shower, naming ceremony, housewarming, anniversary: the card's own title (and years).
      else if (WD.isOneName(wdSpec)) {
        var wdDetail = WD.occasionDetail(data, wdSpec);
        var wdByTitle = WD.OCCASIONS[wdSpec.occasion].nameFrom === 'title';
        body.push((wdDetail ? '<p class="site-hero__sub wd-occ-note">' + esc(wdDetail) + '</p>' : '') + (WD.titleInName(data, wdSpec) ? '' : WD.occasionTitle(wdSpec, data, esc)) +
          (data.title && !wdByTitle ? '<p class="site-hero__sub wd-bday-tagline">' + esc(data.title) + '</p>' : ''));
      }
      if (wdD.full || wdT) body.push('<div class="wd-date wd-date--' + wdSpec.date + '">' + WD.dateInner(wdSpec, wdD, wdT, esc) + '</div>');
    } else {
      /* Subtitle */
      body.push('<p class="site-hero__sub">' + esc(heroSub) + '</p>');

      /* Date/time */
      body.push('<p class="site-hero__when">' + esc(heroWhen) + '</p>');
    }

    /* CTA buttons (no RSVP) */
    body.push('<div class="site-hero__cta">');
    body.push('<a class="site-btn site-btn--ghost" href="#story"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg><span>Our Story</span></a>');
    body.push('<button class="site-btn site-btn--soft" type="button" data-share-invitation><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg><span>Share</span></button>');
    body.push('</div>');

    body.push('</div>');
    body.push('</section>');

    /* Story section */
    body.push('<section class="site-section" id="story">');
    body.push('<div class="site-container">');
    body.push('<div class="site-title"><p class="site-title__eyebrow">' + ((isTeluguPelli || isTamilThirumanam) ? 'Auspicious Union' : 'You are invited') + '</p><h2>The Invitation</h2></div>');
    var message = data.message || '';
    if (data.eventType === 'naming-ceremony') {
      message = inv.genderize(message, data.babyRelation);
    }
    if ((isTeluguPelli || wdSpec) && (data.eventType === 'wedding' || data.eventType === 'engagement')) {
      /* Wedding invitation panel in the template's own style: ornament,
         couple, message, rule, then date and venue. */
      var invFirst = data.namesSwapped ? (data.brideName || 'Bride') : (data.groomName || 'Groom');
      var invSecond = data.namesSwapped ? (data.groomName || 'Groom') : (data.brideName || 'Bride');
      var invOrn = isTeluguPelli
        ? tpImg('tp-ganesha.png', 'site-invite__crest') + '<p class="site-invite__blessing" lang="' + regionalCfg.lang + '">' +
          regionalCfg.greeting.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</p>'
        : (data.photo
          // The host's main photo, framed, in place of the crest.
          ? '<img class="site-invite__photo" src="' + esc(data.photo) + '" alt="' + esc(brandText(state)) + '">'
          : '<img class="site-invite__crest" src="' + esc(wdLa ? wdLa.crest : up + 'images/wedding-motifs/' + wdSpec.slug + '.svg') + '" alt="" aria-hidden="true"' +
            (wdLa && wdLa.style === 'backdrop' ? ' onerror="this.style.display=\'none\'"'
              : wdLa ? ' onerror="this.onerror=null;this.src=\'' + esc(up + 'images/wedding-motifs/' + wdSpec.slug + '.svg') + '\'"' : '') + '>');
      var invCorners = (wdSpec && /vine|deco|kolam|hairline/.test(wdSpec.frame))
        ? '<div class="site-invite__corners" aria-hidden="true">' + WD.corners(wdSpec.frame) + '</div>' : '';
      body.push('<div class="site-story site-invite">' + invCorners + invOrn +
        '<p class="site-invite__lead">' + esc(data.hostName || 'Together with their families') + '</p>' +
        '<p class="site-invite__names"><span>' + esc(invFirst) + '</span><i>&amp;</i><span>' + esc(invSecond) + '</span></p>' +
        (message ? '<p class="site-invite__msg">' + esc(message) + '</p>' : '') +
        '<span class="site-invite__rule" aria-hidden="true"><i></i></span>' +
        (heroWhen ? '<p class="site-invite__when">' + esc(heroWhen) + '</p>' : '') +
        ((data.venue || data.address) ? '<p class="site-invite__where">' + esc([data.venue, data.address].filter(Boolean).join(', ')) + '</p>' : '') +
        '</div>');
    } else {
      body.push('<div class="site-story">');
      body.push('<p>' + esc(message) + '</p>');
      body.push('</div>');
    }
    body.push('</div>');
    body.push('</section>');

    /* Additional information */
    if (data.additionalInformation) {
      body.push('<section class="site-section" id="additional-info">');
      body.push('<div class="site-container">');
      body.push('<div class="site-title"><p class="site-title__eyebrow">Details</p><h2>Additional Information</h2></div>');
      body.push('<div class="site-story">');
      body.push('<p>' + esc(data.additionalInformation) + '</p>');
      body.push('</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Celebrations section */
    if (celebrations.length > 0) {
      body.push('<section class="site-section site-section--alt" id="celebrations">');
      body.push('<div class="site-container">');
      body.push('<div class="site-title"><p class="site-title__eyebrow">' + ((isTeluguPelli || isTamilThirumanam) ? 'Auspicious Rituals' : wdBirthday ? 'Let’s Celebrate' : occCfg ? 'Programme' : 'Auspicious Occasions') + '</p><h2>' + (wdBirthday ? 'The Party Programme' : occCfg ? occCfg.programme : wdSpec && wdSpec.occasion === 'reception' ? 'The Reception Programme' : wdEngaged ? 'The Engagement Programme' : 'Wedding Celebrations') + '</h2><p>' +
        (wdBirthday ? 'Here is how the party will unfold.' : occCfg ? 'Here is how the day will unfold.' : wdEngaged ? 'Please join us as our two families celebrate the engagement.' : 'Please join us across all ceremonial rituals as we celebrate our auspicious union.') + '</p></div>');
      body.push('<div class="site-celebrations-grid">');
      celebrations.forEach(function (e) {
        var ed = inv.formatDate(e.date);
        var et = inv.formatTime(e.time);
        body.push('<div class="site-celebration-card">');
        body.push('  <img class="site-celebration-card__img" src="' + esc(e.image) + '" onerror="this.onerror=null;this.src=\'' + esc(e.fallback) + '\';" alt="' + esc(e.title) + '">');
        body.push('  <strong class="site-celebration-card__title">' + esc(e.title) + '</strong>');
        if (ed.weekday) {
          body.push('  <span class="site-celebration-card__weekday">' + esc(ed.weekday) + '</span>');
        }
        if (ed.full) {
          body.push('  <span class="site-celebration-card__date">' + esc(ed.full) + '</span>');
        }
        if (et) {
          body.push('  <span class="site-celebration-card__time">' + esc(et) + '</span>');
        }
        body.push('</div>');
      });
      body.push('</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Blessings section */
    if (showBlessings) {
      var leftBlessingTitle = data.namesSwapped ? "Bride's Family" : "Groom's Family";
      var leftBlessingParents = data.namesSwapped ? (data.brideParents || bBrideParents) : (data.groomParents || bGroomParents);
      var rightBlessingTitle = data.namesSwapped ? "Groom's Family" : "Bride's Family";
      var rightBlessingParents = data.namesSwapped ? (data.groomParents || bGroomParents) : (data.brideParents || bBrideParents);

      body.push('<section class="site-section" id="blessings">');
      body.push('<div class="site-container">');
      body.push('<div class="site-title"><p class="site-title__eyebrow">Sacred Heritage</p><h2>With the Blessings of</h2></div>');
      body.push('<div class="site-blessings-card">');
      body.push('  <div class="site-blessings-grid">');
      if (leftBlessingParents) {
        body.push('    <div class="site-blessings-side">');
        body.push('      <strong>' + esc(leftBlessingTitle) + '</strong>');
        body.push('      <p>' + esc(leftBlessingParents) + ' and Family</p>');
        body.push('    </div>');
      }
      if (leftBlessingParents && rightBlessingParents) {
        body.push('    <div class="site-blessings-divider" aria-hidden="true"></div>');
      }
      if (rightBlessingParents) {
        body.push('    <div class="site-blessings-side">');
        body.push('      <strong>' + esc(rightBlessingTitle) + '</strong>');
        body.push('      <p>' + esc(rightBlessingParents) + ' and Family</p>');
        body.push('    </div>');
      }
      body.push('  </div>');
      body.push('  <div class="site-blessings-ornament" aria-hidden="true">');
      if (isTeluguPelli) body.push('    <span class="tp-host-pk"><i class="tp-host-pk__pasupu"></i><i class="tp-host-pk__kumkuma"></i></span>');
      else body.push('    <svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>');
      body.push('  </div>');
      body.push('  <h3 class="site-blessings-subheading">YOUR BLESSINGS MEAN THE WORLD</h3>');
      body.push('  <p class="site-blessings-msg">We look forward to celebrating this special day with you and seeking your divine blessings.</p>');
      body.push('</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Details section */
    body.push('<section class="site-section site-section--alt" id="details">');
    body.push('<div class="site-container">');
    body.push('<div class="site-title"><p class="site-title__eyebrow">When & Where</p><h2>Event Details</h2></div>');
    body.push('<div class="site-details">');
    body.push('<div class="site-detail">');
    body.push('<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>');
    body.push('<small>Date</small>');
    body.push('<strong>' + esc(dateFull) + (weekday ? '<br>' + esc(weekday) : '') + '</strong>');
    body.push('</div>');
    body.push('<div class="site-detail">');
    body.push('<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>');
    body.push('<small>Time</small>');
    body.push('<strong>' + esc(time || '—') + '</strong>');
    body.push('</div>');
    body.push('<div class="site-detail">');
    body.push('<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>');
    body.push('<small>Venue</small>');
    body.push('<strong>' + esc(data.venue || '—') + '</strong>');
    body.push('</div>');
    body.push('</div>');
    body.push('</div>');
    body.push('</section>');

    /* Gallery section */
    if (data.showGallery !== false && data.gallery && data.gallery.length) {
      body.push('<section class="site-section" id="gallery">');
      body.push('<div class="site-container">');
      body.push('<div class="site-title"><p class="site-title__eyebrow">Memories</p><h2>Our Moments</h2><p>A few special moments we would love to share with you.</p></div>');
      body.push('<div class="site-gallery site-gallery--n' + Math.min(6, data.gallery.length) + '">');
      var galleryItems = data.gallery.slice(0, 6);
      galleryItems.forEach(function (src, i) {
        var isWide = (i === 0);
        body.push('<figure class="site-gallery__item' + (isWide ? ' site-gallery__item--wide' : '') + '" data-site-lightbox tabindex="0" role="button" aria-label="View photo ' + (i + 1) + ' enlarged">');
        body.push('<img src="' + esc(src) + '" alt="Event photo ' + (i + 1) + '" loading="lazy">');
        body.push('<span class="site-gallery__zoom"><span>+</span></span>');
        body.push('</figure>');
      });
      body.push('</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Countdown section */
    if (data.showCountdown !== false && data.date) {
      var countdownTarget = inv.toDateTime(data.date, data.time);
      body.push('<section class="site-section site-count-section" id="countdown">');
      body.push('<div class="site-container">');
      /* data-cd-since: the wording countdown.js switches to once the date passes. */
      var sinceTitle = IH.countdown && IH.countdown.sinceTitle ? IH.countdown.sinceTitle(data.eventType) : 'Time since the celebration';
      /* Title case, leaving short joining words lower case: "Time Since the Celebration". */
      sinceTitle = sinceTitle.replace(/\b\w+/g, function (w, i) {
        return i && /^(the|for|of|and|a)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1);
      });
      body.push('<div class="site-title"><p class="site-title__eyebrow" data-cd-since="Since the Big Day">The Big Day</p>' +
        '<h2 data-cd-since="' + esc(sinceTitle) + '">Counting Down</h2>' +
        '<p data-cd-since="Thank you for being part of our celebration.">We cannot wait to celebrate this beautiful moment with you.</p></div>');
      body.push('<div class="site-count"><div class="invitation__countdown" data-countdown="' + esc(countdownTarget) + '" role="timer" aria-label="Time remaining until the event">');
      body.push('<div class="cd-unit"><span class="cd-value" data-cd="days">0</span><span class="cd-label">Days</span></div>');
      body.push('<div class="cd-unit"><span class="cd-value" data-cd="hours">00</span><span class="cd-label">Hours</span></div>');
      body.push('<div class="cd-unit"><span class="cd-value" data-cd="minutes">00</span><span class="cd-label">Minutes</span></div>');
      body.push('<div class="cd-unit"><span class="cd-value" data-cd="seconds">00</span><span class="cd-label">Seconds</span></div>');
      body.push('<span class="sr-only" data-cd-live aria-live="polite"></span>');
      body.push('</div></div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Venue section */
    if (data.venue || data.address) {
      body.push('<section class="site-section site-section--alt" id="venue">');
      body.push('<div class="site-container">');
      body.push('<div class="site-title"><p class="site-title__eyebrow">Join Us</p><h2>Venue & Details</h2></div>');
      body.push('<div class="site-venue">');
      body.push('<div class="site-venue__card">');
      body.push('<h3>' + esc(data.venue || 'Venue') + '</h3>');
      body.push('<p class="site-venue__when"><strong>' + esc(heroWhen) + '</strong></p>');
      if (data.address) {
        body.push('<p>' + esc(data.address) + '</p>');
      }
      if (mapsUrl) {
        body.push('<a class="site-venue__media-link" href="' + esc(mapsUrl) + '" target="_blank" rel="noopener noreferrer">');
        body.push('<svg class="icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>');
        body.push('<span>View Location</span>');
        body.push('</a>');
      }
      body.push('</div>');
      /* The venue panel always shows a venue picture: the host's uploaded
         venue photo, else the same default venue image the card uses. The
         general background image is never used here. */
      var venueSrc = data.venueImage ||
        (isTeluguPelli ? tpAsset('tp-venue-default.jpg') : up + ((wdSpec && wdSpec.venueDefault) || 'images/templates/venue-default.jpg'));
      body.push('<div class="site-venue__media" style="background-image:url(' + esc(venueSrc) + ')" role="img" aria-label="' + esc(data.venue || 'Venue') + '"></div>');
      body.push('</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Actions section (Share only, no RSVP) */
    body.push('<section class="site-section site-actions">');
    body.push('<div class="site-container">');
    body.push('<div class="site-title"><p class="site-title__eyebrow">Stay Connected</p><h2>We Would Love to See You</h2><p>Thank you for being part of our celebration.</p></div>');
    body.push('<div class="site-actions__row">');
    body.push('<button class="site-btn site-btn--soft" type="button" data-share-invitation>');
    body.push('<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg><span>Share</span></button>');
    body.push('</div>');
    body.push('</div>');
    body.push('</section>');

    /* Music player (hidden audio element + toggle button) */
    if (data.musicFile) {
      body.push('<audio id="site-music" preload="none" src="' + esc(data.musicFile) + '">Your browser cannot play this audio.</audio>');
      body.push('<button id="site-music-btn" class="site-music-btn" type="button" aria-label="Play music" aria-pressed="false">');
      body.push('<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>');
      body.push('</button>');
    }

    /* Download the invitation section as a JPG; sits above the music button.
       Only on a paid invitation's pages (opts.download). */
    if (opts && opts.download) body.push(dlButton(state, '.site-hero', !!data.musicFile));

    /* Grand Ceremonial Landscape for Telugu Pelli & Tamil Thirumanam */
    if (isTeluguPelli) {
      body.push('<div class="site-landscape--regional" aria-hidden="true">');
      body.push('  ' + tpImg('tp-lake-temple.png', 'tp-host-land__lake'));
      body.push('  ' + tpImg('tp-banana-plant.png', 'tp-host-land__banana tp-host-land__banana--left'));
      body.push('  ' + tpImg('tp-banana-plant.png', 'tp-host-land__banana tp-host-land__banana--right'));
      body.push('  ' + tpImg('tp-foliage-bottom.png', 'tp-host-land__lotus'));
      body.push('  ' + tpImg('tp-elephant.png', 'tp-host-land__elephant tp-host-land__elephant--left'));
      body.push('  ' + tpImg('tp-elephant.png', 'tp-host-land__elephant tp-host-land__elephant--right'));
      body.push('</div>');
    } else if (isTamilThirumanam) {
      body.push('<div class="site-landscape site-landscape--tamil-thirumanam" aria-hidden="true">');
      body.push('  <img class="site-landscape__lamp-left" src="' + up + 'images/invitation-assets/tamil-thirumanam/kuthuvilakku-left.png" alt="" loading="eager">');
      body.push('  <img class="site-landscape__lamp-right" src="' + up + 'images/invitation-assets/tamil-thirumanam/kuthuvilakku-right.png" alt="" loading="eager">');
      body.push('  <img class="site-landscape__peacock-left" src="' + up + 'images/invitation-assets/tamil-thirumanam/peacock-left.png" alt="" loading="eager">');
      body.push('  <img class="site-landscape__peacock-right" src="' + up + 'images/invitation-assets/tamil-thirumanam/peacock-right.png" alt="" loading="eager">');
      body.push('  <img class="site-landscape__uruli" src="' + up + 'images/invitation-assets/tamil-thirumanam/uruli-bottom.png" alt="" loading="eager">');
      body.push('</div>');
    }

    /* Footer */
    body.push('<footer class="site-footer">');
    body.push('<div class="site-footer__names">' + esc(brandText(state)) + '</div>');
    body.push('<p>Created with <a href="' + up + 'index.html" target="_blank" rel="noopener">InviteAura</a></p>');
    body.push('</footer>');

    /* Invitation data JSON */
    body.push('<script id="invitation-data" type="application/json">');
    body.push(escScript(JSON.stringify(leanState(state))));
    body.push('<\/script>');

    var tail = [
      '',
      (opts && opts.skipMainJs ? '' : '<script src="' + up + 'js/main.js" defer><\/script>'),
      '<script src="' + up + 'js/countdown.js" defer><\/script>',
      '<script src="' + up + 'js/share.js" defer><\/script>',
      (opts && opts.download ? '<script src="' + HTML2CANVAS + '" defer><\/script>' : ''),
      '<script>',
      '  /* Starts the live countdown, share, mobile nav, lightbox, music toggle. */',
      escScript(INLINE_JS),
      (opts && opts.download ? escScript(DL_SCRIPT) : ''),
      '<\/script>',
      '</body>',
      '</html>',
      ''
    ];

    return head.concat(body, tail).join('\n');
  }

  function buildCardHtml(state, opts) {
    var up = (opts && typeof opts.up === 'string') ? opts.up : '';
    var data = resolvePaths(state, up);
    var assetPrefix = 'https://www.inviteaura.in/';
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && window.location.protocol !== 'file:') {
      assetPrefix = window.location.origin + '/';
    }
    data.assetPrefix = assetPrefix;
    var who = personName(state) || 'Our Invitation';
    var title = who + ' — Invitation';
    var p = paletteFor(data);

    var head = [
      '<!DOCTYPE html>',
      '<html lang="en" data-theme="light">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
      '<title>' + esc(title) + '</title>',
      '<meta name="generator" content="InviteAura">',
      '<meta name="robots" content="noindex">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@600;700&family=Great+Vibes&family=Cormorant+Garamond:wght@600;700&family=Cinzel:wght@600;700;800&family=Noto+Serif+Telugu:wght@500;600;700&family=Noto+Serif+Tamil:wght@500;600;700&family=Marcellus&family=Parisienne&family=Bodoni+Moda:ital,wght@0,500;0,600;1,500&family=Josefin+Sans:wght@400;600&family=Allura&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Fredoka:wght@500;600&family=Pacifico&family=Nunito:wght@500;700&display=swap">',
      /* The site's own stylesheet, as card.html uses, so every design
         (the wedding design engine included) renders exactly the same. */
      '<link rel="stylesheet" href="' + up + 'css/style.css">',
      '<style>',
      /* Same page layout as card.html: the card centred, page scrolls. */
      'body{margin:0;min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:24px 16px;box-sizing:border-box;background:#EDEAE6}',
      '#card-fit{width:min(100%,704px)}',
      '#card-root{width:100%}',
      '#card-root .invitation{max-width:none}',
      /* Corner buttons, in the card's main colour. */
      ':root{--site-p:' + p.primary + '}',
      '.site-music-btn{position:fixed;right:20px;bottom:20px;z-index:900;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.9);background:rgba(22,18,28,.86);color:#fff;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 0 0 1px rgba(0,0,0,.35),0 12px 30px rgba(0,0,0,.35);cursor:pointer;transition:transform .2s ease}',
      '.site-music-btn:hover{transform:scale(1.08)}',
      '.site-music-btn svg{width:22px;height:22px}',
      '.site-music-btn.is-playing svg{animation:site-spin 3s linear infinite}',
      '@keyframes site-spin{to{transform:rotate(360deg)}}',
      DL_BTN_CSS,
      '</style>',
      '</head>',
      '<body>'
    ];

    /* Music plays from a corner button (as on card.html), not inside the card. */
    var music = data.musicFile;
    var body = [
      '<div id="card-fit"><div class="invitation-container" id="card-root">',
      IH.invitation.render(Object.assign({}, data, { musicFile: '' })),
      '</div></div>'
    ];
    if (music) {
      body.push('<audio id="site-music" preload="none" src="' + esc(music) + '"></audio>');
      body.push('<button id="site-music-btn" class="site-music-btn" type="button" aria-label="Play music" aria-pressed="false">' +
        '<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></button>');
    }
    if (opts && opts.download) body.push(dlButton(state, '.invitation', !!music));

    var tail = [
      (opts && opts.download ? '<script src="' + HTML2CANVAS + '" defer></script>' : ''),
      '<script src="' + up + 'js/main.js" defer></script>',
      '<script src="' + up + 'js/countdown.js" defer></script>',
      '<script>',
      '  /* Deferred scripts have run by DOMContentLoaded. */',
      '  document.addEventListener("DOMContentLoaded", function () { if (window.IH && IH.countdown) IH.countdown.mount(document.body); });',
      '  (function () {',
      '    var audio = document.getElementById("site-music"), mbtn = document.getElementById("site-music-btn");',
      '    if (!audio || !mbtn) return;',
      '    function set(on) { mbtn.classList.toggle("is-playing", on); mbtn.setAttribute("aria-pressed", on ? "true" : "false"); mbtn.setAttribute("aria-label", on ? "Pause music" : "Play music"); }',
      '    mbtn.addEventListener("click", function () { if (audio.paused) audio.play().then(function () { set(true); }).catch(function () {}); else { audio.pause(); set(false); } });',
      '    audio.addEventListener("ended", function () { set(false); });',
      '  })();',
      (opts && opts.download ? escScript(DL_SCRIPT) : ''),
      '</script>',
      '</body>',
      '</html>'
    ];

    return head.concat(body, tail).join('\n');
  }

  /* ------------------------------------------------------------------
     3. Writing it out
     ------------------------------------------------------------------ */

  /* The downloaded file travels on its own, with no images folder beside
     it, so photos stay embedded here rather than pointing at missing files. */
  function downloadBlob(name, html) {
    var url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function download(state) {
    var name = fileName(state);
    downloadBlob(name, buildCardHtml(state));
    return { mode: 'download', file: name, path: FOLDER + '/' + name };
  }

  /* Both pages of one invitation, under one name: the host page (the same
     builder host.html uses) for invitation_card/, and the card page (the
     same card card.html shows) for invitation_card/invitations/. Called
     through IH.exportPage so the redesign collection's wrapped builders are
     used. `up` matches each page's depth below the site root. */
  function pageFiles(state) {
    var name = fileName(state);
    // The download button is part of what the ₹99 hosting payment buys.
    var paid = !!(state && state.hostingPaid);
    return [
      { name: name, sub: '', html: IH.exportPage.buildHtml(state, { up: '../', download: paid }) },
      { name: name, sub: SAVE_DIR, html: IH.exportPage.buildCardHtml(state, { up: '../../', download: paid }) }
    ];
  }

  /* The card page of a published invitation sits one folder below the host
     page (invitation_card/invitations/), so the asset folders that sit
     beside the host page are one level up from it. */
  function cardAssetState(state) {
    var out = {};
    Object.keys(state).forEach(function (k) { out[k] = state[k]; });
    function nest(src) {
      if (typeof src !== 'string') return src;
      for (var i = 0; i < ASSET_DIRS.length; i++) {
        if (src.slice(0, ASSET_DIRS[i].length + 1) === ASSET_DIRS[i] + '/') return '../' + src;
      }
      return src;
    }
    out.photo = nest(state.photo);
    out.background = nest(state.background);
    out.venueImage = nest(state.venueImage);
    out.musicFile = nest(state.musicFile);
    if (state.gallery) out.gallery = state.gallery.map(nest);
    return out;
  }

  /* The chosen folder is remembered (IndexedDB) so it is asked for once. */
  function handleStore(mode, fn) {
    return new Promise(function (resolve, reject) {
      var open = indexedDB.open('inviteaura-save', 1);
      open.onupgradeneeded = function () { open.result.createObjectStore('handles'); };
      open.onerror = function () { reject(open.error); };
      open.onsuccess = function () {
        try {
          var tx = open.result.transaction('handles', mode);
          var req = fn(tx.objectStore('handles'));
          tx.oncomplete = function () { resolve(req.result); };
          tx.onerror = function () { reject(tx.error); };
        } catch (err) { reject(err); }
      };
    });
  }

  function pickFolder() {
    return window.showDirectoryPicker({ id: 'inviteaura-invitations', mode: 'readwrite' }).then(function (dir) {
      return handleStore('readwrite', function (st) { return st.put(dir, SAVE_DIR); })
        .catch(function () {}).then(function () { return dir; });
    });
  }

  function savedFolder() {
    return handleStore('readonly', function (st) { return st.get(SAVE_DIR); })
      .catch(function () { return null; })
      .then(function (dir) {
        if (!dir) return pickFolder();
        return dir.requestPermission({ mode: 'readwrite' })
          .then(function (perm) { return perm === 'granted' ? dir : pickFolder(); });
      });
  }

  /* Accept invitation_card/ itself or the project root. Any other folder is
     forgotten and an error explains which one to pick. */
  function cardFolder(dir) {
    if (dir.name === FOLDER) return Promise.resolve(dir);
    return dir.getDirectoryHandle(FOLDER).catch(function () {
      return handleStore('readwrite', function (st) { return st.delete(SAVE_DIR); }).catch(function () {})
        .then(function () { throw new Error('Pick the ' + FOLDER + ' folder (you picked "' + dir.name + '").'); });
    });
  }

  function writeFile(dir, file) {
    return dir.getFileHandle(file.name, { create: true })
      .then(function (fh) { return fh.createWritable(); })
      .then(function (w) {
        return w.write(new Blob([file.html], { type: 'text/html;charset=utf-8' })).then(function () { return w.close(); });
      });
  }

  /* Writes both pages where the browser allows writing to a folder (Chrome,
     Edge); elsewhere both download, the card page with a _card suffix so
     the two do not collide in Downloads. */
  function saveFiles(state) {
    var files = pageFiles(state);
    var paths = files.map(function (f) { return FOLDER + '/' + (f.sub ? f.sub + '/' : '') + f.name; });
    if (!window.showDirectoryPicker || !window.indexedDB) {
      files.forEach(function (f) { downloadBlob(f.sub ? f.name.replace(/\.html$/, '_card.html') : f.name, f.html); });
      return Promise.resolve({ mode: 'download', paths: paths });
    }
    return savedFolder().then(cardFolder).then(function (cards) {
      return Promise.all(files.map(function (f) {
        var dir = f.sub ? cards.getDirectoryHandle(f.sub, { create: true }) : Promise.resolve(cards);
        return dir.then(function (d) { return writeFile(d, f); });
      })).then(function () { return { mode: 'folder', paths: paths }; });
    });
  }

  IH.exportPage = {
    FOLDER: FOLDER,
    ASSET_DIRS: ASSET_DIRS,
    personName: personName,
    safeBase: safeBase,
    baseName: baseName,
    buildInvitationFilename: buildInvitationFilename,
    fileName: fileName,
    extractAssets: extractAssets,
    buildHtml: buildHtml,
    buildCardHtml: buildCardHtml,
    cardAssetState: cardAssetState,
    CARD_DIR: SAVE_DIR,
    download: download,
    saveFiles: saveFiles
  };
})();