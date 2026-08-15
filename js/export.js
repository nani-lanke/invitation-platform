/* ====================================================================
   export.js — the invitation as a single downloadable file

   The site is deployed to GitHub Pages, which is static hosting: nothing
   can write a file when a host finishes their invitation. Sharing is
   therefore done with a link that carries its own contents (js/link.js).

   This module covers the other route — building one self-contained .html
   the host can download and send as an attachment, or commit into
   invitations/ to publish it at its own URL. Photos stay embedded as
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
   ('../' for invitations/Name.html, '../../../' for a page nested in
   invitations/Names/Date/). js/publish.js uses it for the second form.
   ==================================================================== */

(function () {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;

  var FOLDER = 'invitations';
  var MAX_BASE = 60;
  var s = function (v) { return String(v == null ? '' : v).trim(); };

  /* ------------------------------------------------------------------
     1. Naming
     ------------------------------------------------------------------ */

  /* The human name the file is named after, in priority order. */
  function personName(state) {
    if (!state) return '';
    var s = function (v) { return String(v == null ? '' : v).trim(); };

    if (s(state.personName)) return s(state.personName);

    /* A naming ceremony names the baby, so the file follows the baby when
       personName is empty (or already moved aside for the baby). */
    if (s(state.babyName)) return s(state.babyName);

    /* Groom first, matching the order the card itself prints the names. */
    var bride = s(state.brideName), groom = s(state.groomName);
    if (bride && groom) return groom + ' and ' + bride;
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
      .replace(/[\u0300-\u036f]/g, '')  // drop accents left behind by NFKD
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
    var couple = [s(state.groomName), s(state.brideName)].filter(Boolean).join(' ');

    switch (type) {
      case 'wedding':
      case 'engagement':
        return couple;
      case 'reception':
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
      [s(state.groomName), s(state.brideName)].filter(Boolean).join(' ') ||
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
    var time = timePart(state);
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
    return meta ? meta.label : 'Event';
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
      if (key === 'photo' || key === 'background' || key === 'gallery') return;
      lean[key] = state[key];
    });
    lean.photoCount = (state.gallery ? state.gallery.length : 0) +
      (state.photo ? 1 : 0) + (state.background ? 1 : 0);
    lean.generatedAt = new Date().toISOString();
    return lean;
  }

  /* ------------------------------------------------------------------
     2b. Photos → real files in invitations/images/
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
    out.gallery = (state.gallery || []).map(function (src, i) {
      return take(src, GALLERY_DIR, 'image' + (i + 1));
    });

    return { state: out, assets: assets };
  }

  /* An image the host picked out of the repository is written as a path
     from the site root ('images/hero/card-baby.svg'), which is wrong once
     the page is sitting inside invitations/. Everything else already
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
    out.musicFile = fix(state.musicFile);
    if (state.gallery) out.gallery = state.gallery.map(fix);

    return out;
  }

  function buildHtml(state, opts) {
    /* How many folders up the shared css/ and js/ live. One level by
       default; a page that owns a folder of its own passes more. */
    var up = (opts && opts.up) || '../';

    var who = personName(state) || 'Our Celebration';
    var title = who + ' — ' + eventLabel(state) + ' Invitation';
    var card = IH.invitation.render(resolvePaths(state, up));

    return [
      '<!DOCTYPE html>',
      '<html lang="en" data-theme="light">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>' + esc(title) + '</title>',
      '<meta name="description" content="' + esc(metaDescription(state)) + '">',
      '<meta name="generator" content="InviteHub">',
      /* An invitation carries names, an address and a phone number. It is
         meant for the people sent the link, not for search results — but
         noindex only stops indexing, so the link-preview scrapers below
         still read the page and show the card in WhatsApp. */
      '<meta name="robots" content="noindex">',
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + esc(title) + '">',
      '<meta property="og:description" content="' + esc(metaDescription(state)) + '">',
      /* A scraper has no page to resolve a relative URL against, so these
         two are only worth writing when the caller knows the deployed
         address. js/publish.js does; a plain download does not. */
      opts && opts.canonical ? '<meta property="og:url" content="' + esc(opts.canonical) + '">' : '',
      opts && opts.image ? '<meta property="og:image" content="' + esc(opts.image) + '">' : '',
      opts && opts.image ? '<meta name="twitter:card" content="summary_large_image">' : '',
      '',
      '<link rel="icon" href="' + up + 'images/logo/favicon.svg" type="image/svg+xml">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@600;700&family=Great+Vibes&family=Cormorant+Garamond:wght@600;700&display=swap">',
      '',
      '<link rel="stylesheet" href="' + up + 'css/style.css">',
      '<link rel="stylesheet" href="' + up + 'css/animations.css">',
      '<link rel="stylesheet" href="' + up + 'css/responsive.css">',
      '',
      '<style>',
      '  /* Spatial UI: the invitation floats as a lit glass window in front of',
      '     an out-of-focus ambient field. The card itself stays fully opaque —',
      '     translucency belongs to the frame, never to the text. */',
      '  :root{',
      '    --glass-bg:rgba(255,255,255,.24);',
      '    --glass-stroke:rgba(255,255,255,.55);',
      '    --glass-blur:40px;',
      '    --glass-saturate:180%;',
      '    --window-radius:28px;',
      '    --elev-1:0 1px 3px rgba(40,18,32,.10);',
      '    --elev-2:0 6px 14px rgba(40,18,32,.10);',
      '    --elev-3:0 16px 34px rgba(40,18,32,.14);',
      '    --elev-4:0 34px 70px rgba(40,18,32,.24);',
      '    --amb-1:#F6E3EA; --amb-2:#E7D4E6; --amb-3:#FBF1E4; --amb-base:#FBF6F3;',
      '    --page-ink:#3B2431;',
      '  }',
      '  @media (prefers-color-scheme:dark){',
      '    :root:not([data-theme="light"]){',
      '      --glass-bg:rgba(255,255,255,.10); --glass-stroke:rgba(255,255,255,.20);',
      '      --amb-1:#4A2036; --amb-2:#2C1A3A; --amb-3:#4A3320; --amb-base:#171016;',
      '      --page-ink:#F3E6EC;',
      '    }',
      '  }',
      '  :root[data-theme="dark"]{',
      '    --glass-bg:rgba(255,255,255,.10); --glass-stroke:rgba(255,255,255,.20);',
      '    --amb-1:#4A2036; --amb-2:#2C1A3A; --amb-3:#4A3320; --amb-base:#171016;',
      '    --page-ink:#F3E6EC;',
      '  }',
      '',
      '  body{min-height:100svh;margin:0;display:grid;place-items:center;',
      '       padding:clamp(1rem,4vw,3rem) 1rem;background:var(--amb-base);',
      '       color:var(--page-ink);perspective:1400px;overflow-x:hidden}',
      '',
      '  /* Layer 0 — the environment behind everything */',
      '  .env{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}',
      '  .orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.62;',
      '       transform:translate3d(calc(var(--px,0px)*var(--d,1)),calc(var(--py,0px)*var(--d,1)),0)}',
      '  .orb--1{width:46vmax;height:46vmax;top:-14vmax;left:-10vmax;background:var(--amb-1);--d:1.4}',
      '  .orb--2{width:38vmax;height:38vmax;bottom:-12vmax;right:-8vmax;background:var(--amb-2);--d:2.2}',
      '  .orb--3{width:26vmax;height:26vmax;top:32%;right:14%;background:var(--amb-3);opacity:.45;--d:3}',
      '',
      '  /* Layer 1 — the glass window holding the card */',
      '  .stage{position:relative;z-index:1;display:grid;justify-items:center;gap:clamp(1rem,3vw,1.5rem);',
      '         width:min(100%,520px);transform-style:preserve-3d}',
      '  .window{width:100%;display:grid;justify-items:center;',
      '          padding:clamp(10px,2.6vw,20px);border-radius:var(--window-radius);',
      '          background:var(--glass-bg);border:1px solid var(--glass-stroke);',
      '          -webkit-backdrop-filter:blur(var(--glass-blur)) saturate(var(--glass-saturate));',
      '          backdrop-filter:blur(var(--glass-blur)) saturate(var(--glass-saturate));',
      '          box-shadow:var(--elev-4),inset 0 1px 0 rgba(255,255,255,.55);',
      '          transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));',
      '          transition:transform .45s cubic-bezier(.22,1,.36,1),box-shadow .45s ease}',
      '  .window:hover,.window:focus-within{box-shadow:var(--elev-4),0 0 0 1px var(--glass-stroke),',
      '          inset 0 1px 0 rgba(255,255,255,.7)}',
      '',
      '  /* Layer 2 — the invitation, opaque and unchanged in contrast */',
      '  .window .invitation{box-shadow:var(--elev-3);border-radius:calc(var(--window-radius) - 10px)}',
      '',
      '  .credit{margin:0;font-size:.76rem;letter-spacing:.02em;color:var(--page-ink);',
      '          padding:.5rem 1rem;border-radius:999px;background:var(--glass-bg);',
      '          border:1px solid var(--glass-stroke);box-shadow:var(--elev-1);',
      '          -webkit-backdrop-filter:blur(20px) saturate(160%);',
      '          backdrop-filter:blur(20px) saturate(160%)}',
      '  .credit a{color:inherit;text-underline-offset:2px}',
      '',
      '  /* Without backdrop-filter the glass would read as flat haze, so fall',
      '     back to a solid tinted panel that keeps the same depth cues. */',
      '  @supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){',
      '    .window,.credit{background:color-mix(in srgb,var(--amb-base) 82%,#fff)}',
      '  }',
      '',
      '  @media (prefers-reduced-motion:reduce){',
      '    .window{transition:none;transform:none}',
      '    .orb{transform:none}',
      '  }',
      '</style>',
      '</head>',
      '<body>',
      '<div class="env" aria-hidden="true">',
      '  <span class="orb orb--1"></span><span class="orb orb--2"></span><span class="orb orb--3"></span>',
      '</div>',
      '<main class="stage">',
      '  <div class="window" data-invitation-host>',
      card,
      '  </div>',
      '  <p class="credit">Created with <a href="' + up + 'index.html">InviteHub</a></p>',
      '</main>',
      '',
      '<script id="invitation-data" type="application/json">',
      escScript(JSON.stringify(leanState(state))),
      '<\/script>',
      '',
      '<script src="' + up + 'js/main.js" defer><\/script>',
      '<script src="' + up + 'js/countdown.js" defer><\/script>',
      '<script src="' + up + 'js/share.js" defer><\/script>',
      '<script>',
      '  /* The card above is already rendered, so the page reads fine with',
      '     JavaScript off. This starts the live countdown and adds the small',
      '     pointer-driven parallax that sells the depth. */',
      '  document.addEventListener("DOMContentLoaded", function () {',
      '    if (window.IH && IH.countdown) { IH.countdown.mount(document.body); }',
      '',
      '    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;',
      '    var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;',
      '    var win = document.querySelector(".window");',
      '    if (reduced || !fine || !win) { return; }',
      '',
      '    var frame = 0;',
      '    document.addEventListener("pointermove", function (e) {',
      '      if (frame) { return; }',
      '      frame = requestAnimationFrame(function () {',
      '        frame = 0;',
      '        var x = (e.clientX / window.innerWidth) - 0.5;',
      '        var y = (e.clientY / window.innerHeight) - 0.5;',
      '        win.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");',
      '        win.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");',
      '        document.documentElement.style.setProperty("--px", (-x * 14).toFixed(1) + "px");',
      '        document.documentElement.style.setProperty("--py", (-y * 14).toFixed(1) + "px");',
      '      });',
      '    }, { passive: true });',
      '',
      '    document.addEventListener("pointerleave", function () {',
      '      win.style.setProperty("--ry", "0deg");',
      '      win.style.setProperty("--rx", "0deg");',
      '    });',
      '  });',
      '<\/script>',
      '</body>',
      '</html>',
      ''
    ].join('\n');
  }

  /* ------------------------------------------------------------------
     3. Writing it out
     ------------------------------------------------------------------ */

  /* The downloaded file travels on its own, with no images folder beside
     it, so photos stay embedded here rather than pointing at missing files. */
  function download(state) {
    var name = fileName(state);
    var blob = new Blob([buildHtml(state)], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return { mode: 'download', file: name, path: FOLDER + '/' + name };
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
    download: download
  };
})();
