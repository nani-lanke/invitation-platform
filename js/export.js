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
     IH.exportPage.fileName(state)    -> 'John_Doe.html'
     IH.exportPage.buildHtml(state)   -> full document as a string
     IH.exportPage.download(state)    -> triggers a browser download
   ==================================================================== */

(function () {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;

  var FOLDER = 'invitation_card';
  var MAX_BASE = 60;

  /* ------------------------------------------------------------------
     1. Naming
     ------------------------------------------------------------------ */

  /* The human name the file is named after, in priority order. */
  function personName(state) {
    if (!state) return '';
    var s = function (v) { return String(v == null ? '' : v).trim(); };

    if (s(state.personName)) return s(state.personName);

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
      .replace(/&/g, ' and ')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/^[_-]+|[_-]+$/g, '')
      .slice(0, MAX_BASE);

    return base || 'Invitation';
  }

  function fileName(state) {
    return safeBase(personName(state)) + '.html';
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
     2b. Photos → real files in invitation_card/images/
     ------------------------------------------------------------------ */

  var IMAGE_DIR = 'image_cards';
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
     the list of files that would sit beside it. Used when a host commits a
     page into invitation_card/ and wants the photos as separate files. */
  function extractAssets(state) {
    var base = safeBase(personName(state));
    var assets = [];
    var out = {};
    Object.keys(state).forEach(function (k) { out[k] = state[k]; });

    function take(dataUrl, suffix) {
      if (!isDataUrl(dataUrl)) return dataUrl;
      var name = base + '-' + suffix + '.' + extFor(dataUrl);
      assets.push({ name: name, data: dataUrl });
      return IMAGE_DIR + '/' + name;
    }

    out.photo = take(state.photo, 'photo');
    out.background = take(state.background, 'bg');
    out.gallery = (state.gallery || []).map(function (src, i) {
      return take(src, 'gallery-' + (i + 1));
    });

    return { state: out, assets: assets };
  }

  function buildHtml(state) {
    var who = personName(state) || 'Our Celebration';
    var title = who + ' — ' + eventLabel(state) + ' Invitation';
    var card = IH.invitation.render(state);

    return [
      '<!DOCTYPE html>',
      '<html lang="en" data-theme="light">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>' + esc(title) + '</title>',
      '<meta name="description" content="' + esc(metaDescription(state)) + '">',
      '<meta name="generator" content="InviteHub">',
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + esc(title) + '">',
      '<meta property="og:description" content="' + esc(metaDescription(state)) + '">',
      '',
      '<link rel="icon" href="../images/logo/favicon.svg" type="image/svg+xml">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@600;700&family=Great+Vibes&family=Cormorant+Garamond:wght@600;700&display=swap">',
      '',
      '<link rel="stylesheet" href="../css/style.css">',
      '<link rel="stylesheet" href="../css/animations.css">',
      '<link rel="stylesheet" href="../css/responsive.css">',
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
      '  <p class="credit">Created with <a href="../index.html">InviteHub</a></p>',
      '</main>',
      '',
      '<script id="invitation-data" type="application/json">',
      escScript(JSON.stringify(leanState(state))),
      '<\/script>',
      '',
      '<script src="../js/main.js" defer><\/script>',
      '<script src="../js/countdown.js" defer><\/script>',
      '<script src="../js/share.js" defer><\/script>',
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
    IMAGE_DIR: IMAGE_DIR,
    personName: personName,
    safeBase: safeBase,
    fileName: fileName,
    buildHtml: buildHtml,
    download: download
  };
})();
