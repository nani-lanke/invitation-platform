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
     2b. Photos → real files in invitation_card/images/
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
    out.musicFile = fix(state.musicFile);
    if (state.gallery) out.gallery = state.gallery.map(fix);

    return out;
  }

  /* ------------------------------------------------------------------
     2c. Website palette and copy — every value follows the invitation
     data, never a hardcoded couple or date.
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
    var tpl = IH.data && IH.data.getTemplate(state.template);
    var c = state.colors || (tpl && tpl.colors) ||
      { primary: '#8B2F58', secondary: '#C9871F', bg1: '#FDF0F4', bg2: '#F6D9E4', ink: '#3A1B2B' };
    var fonts = (IH.invitation && IH.invitation.GOOGLE_FONTS &&
      IH.invitation.GOOGLE_FONTS[state.font]) ||
      { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" };
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

  /* Short plain-text brand for the nav bar and footer. */
  function brandText(state) {
    var type = String(state.eventType || '');
    if (type === 'wedding' || type === 'engagement' || type === 'reception' || type === 'anniversary') {
      var g = String(state.groomName || '').trim(), b = String(state.brideName || '').trim();
      if (g && b) return g + ' & ' + b;
      if (g || b) return g || b;
    }
    return String(state.personName || state.babyName || state.title || state.hostName || '').trim();
  }

  function sectionTitle(eyebrow, heading, sub) {
    var out = [
      '<div class="site-title">',
      '<p class="site-title__eyebrow">' + esc(eyebrow) + '</p>',
      '<h2>' + esc(heading) + '</h2>'
    ];
    if (sub) out.push('<p>' + esc(sub) + '</p>');
    out.push('</div>');
    return out.join('');
  }

  /* The page's own stylesheet, embedded so the file works on its own and
     never depends on the site's css/ files changing underneath it. */
  function websiteCss(p) {
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
      '.site-hero__names{font-family:var(--site-fd);font-weight:700;font-size:clamp(2.6rem,9vw,6.2rem);line-height:1.02;margin:18px 0 6px;text-wrap:balance}',
      '.site-hero__names .amp{display:block;font-size:.6em;font-weight:600;line-height:1.7;color:var(--site-s)}',
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
      '.site-section{padding:88px 0}',
      '.site-section--alt{background:color-mix(in srgb,var(--site-b2) 40%,var(--site-b1))}',
      '.site-title{text-align:center;margin-bottom:52px}',
      '.site-title__eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:.74rem;font-weight:700;color:var(--site-p)}',
      '.site-title h2{font-family:var(--site-fd);font-size:clamp(2rem,5vw,3.1rem);margin:12px 0 14px;color:var(--site-ink)}',
      '.site-title p{max-width:640px;margin:0 auto;color:color-mix(in srgb,var(--site-ink) 72%,transparent);font-size:1.02rem}',
      '',
      '/* Story */',
      '.site-story{max-width:820px;margin:0 auto;text-align:center}',
      '.site-story p{font-family:var(--site-fd);font-size:clamp(1.25rem,2.8vw,1.75rem);line-height:1.85;color:var(--site-ink)}',
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
      '.site-gallery__item img{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}',
      '.site-gallery__item:hover img,.site-gallery__item:focus-visible img{transform:scale(1.07)}',
      '.site-gallery__item:focus-visible{outline:3px solid var(--site-p);outline-offset:2px}',
      '.site-gallery__zoom{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(180deg,transparent,rgba(20,10,25,.45));opacity:0;transition:opacity .3s ease;color:#fff}',
      '.site-gallery__zoom span{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.25);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-size:1.4rem;line-height:1}',
      '.site-gallery__item:hover .site-gallery__zoom,.site-gallery__item:focus-visible .site-gallery__zoom{opacity:1}',
      '',
      '/* Countdown */',
      '.site-count-section{background:linear-gradient(135deg,var(--site-p),color-mix(in srgb,var(--site-p) 58%,var(--site-b2)));color:#fff}',
      '.site-count-section .site-title h2{color:#fff}',
      '.site-count-section .site-title p{color:rgba(255,255,255,.86)}',
      '.site-count .invitation__countdown{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;max-width:820px;margin:0 auto}',
      '.site-count .cd-unit{display:grid;gap:6px;justify-items:center;padding:26px 14px;border:1px solid rgba(255,255,255,.22);border-radius:18px;background:rgba(255,255,255,.08);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
      '.site-count .cd-value{font-family:var(--site-fd);font-size:clamp(2rem,5vw,3.4rem);font-weight:700;line-height:1;transition:transform .3s ease}',
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
      '.site-music-btn{position:fixed;right:20px;bottom:20px;z-index:900;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;border:0;background:var(--site-p);color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.28);transition:transform .2s ease}',
      '.site-music-btn:hover{transform:scale(1.08)}',
      '.site-music-btn svg{width:22px;height:22px}',
      '.site-music-btn.is-playing svg{animation:site-spin 3s linear infinite}',
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
      ''
    ].join('\n');
  }

  /* Everything the page needs to run once it is in a real browser. Static
     on purpose: no data is interpolated, so it needs no escaping. */
  var INLINE_SITE_JS = [
    'document.addEventListener("DOMContentLoaded", function () {',
    '  var burger = document.querySelector(".site-nav__burger");',
    '  var menu = document.querySelector(".site-nav__menu");',
    '  if (burger && menu) {',
    '    var closeMenu = function () { menu.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); };',
    '    burger.addEventListener("click", function () {',
    '      var open = menu.classList.toggle("is-open");',
    '      burger.setAttribute("aria-expanded", open ? "true" : "false");',
    '    });',
    '    menu.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });',
    '  }',
    '  var nav = document.querySelector(".site-nav");',
    '  var onScroll = function () { if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8); };',
    '  window.addEventListener("scroll", onScroll, { passive: true });',
    '  onScroll();',
    '',
    '  var box = null;',
    '  var current = 0;',
    '  var srcs = [];',
    '  function syncSrcs() { srcs = Array.prototype.slice.call(document.querySelectorAll("[data-site-lightbox]")).map(function (it) { var img = it.querySelector("img"); return img ? img.src : ""; }); }',
    '  function show() {',
    '    var img = box.querySelector(".site-lightbox__img");',
    '    img.src = srcs[current];',
    '    box.querySelector(".site-lightbox__count").textContent = (current + 1) + " / " + srcs.length;',
    '  }',
    '  function step(d) { syncSrcs(); current = (current + d + srcs.length) % srcs.length; show(); }',
    '  function closeBox() { if (box) { box.classList.remove("is-open"); document.body.style.overflow = ""; } }',
    '  function buildBox() {',
    '    box = document.createElement("div");',
    '    box.className = "site-lightbox";',
    '    box.setAttribute("role", "dialog");',
    '    box.setAttribute("aria-modal", "true");',
    '    box.innerHTML = \'<button class="site-lightbox__btn site-lightbox__close" type="button" aria-label="Close">\u00D7</button>\' +',
    '      \'<button class="site-lightbox__btn site-lightbox__prev" type="button" aria-label="Previous">\u2039</button>\' +',
    '      \'<button class="site-lightbox__btn site-lightbox__next" type="button" aria-label="Next">\u203A</button>\' +',
    '      \'<img class="site-lightbox__img" alt="" />\' +',
    '      \'<span class="site-lightbox__count"></span>\';',
    '    box.addEventListener("click", function (e) { if (e.target === box) closeBox(); });',
    '    box.querySelector(".site-lightbox__close").addEventListener("click", closeBox);',
    '    box.querySelector(".site-lightbox__prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });',
    '    box.querySelector(".site-lightbox__next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });',
    '    document.body.appendChild(box);',
    '    document.addEventListener("keydown", function (e) {',
    '      if (!box.classList.contains("is-open")) return;',
    '      if (e.key === "Escape") closeBox();',
    '      if (e.key === "ArrowLeft") step(-1);',
    '      if (e.key === "ArrowRight") step(1);',
    '    });',
    '  }',
    '  function openFig(fig) {',
    '    if (!fig) return;',
    '    syncSrcs();',
    '    var i = Array.prototype.indexOf.call(document.querySelectorAll("[data-site-lightbox]"), fig);',
    '    if (i < 0 || !srcs[i]) return;',
    '    current = i;',
    '    if (!box) buildBox();',
    '    show();',
    '    box.classList.add("is-open");',
    '    document.body.style.overflow = "hidden";',
    '  }',
    '  document.addEventListener("click", function (e) {',
    '    var fig = e.target.closest ? e.target.closest("[data-site-lightbox]") : null;',
    '    if (fig) { e.preventDefault(); openFig(fig); }',
    '  });',
    '  document.addEventListener("keydown", function (e) {',
    '    if (e.key !== "Enter" && e.key !== " ") return;',
    '    var t = e.target, fig = (t && t.closest) ? t.closest("[data-site-lightbox]") : null;',
    '    if (fig) { e.preventDefault(); openFig(fig); }',
    '  });',
    '',
    '  var audio = document.getElementById("site-music");',
    '  var mbtn = document.getElementById("site-music-btn");',
    '  if (audio && mbtn) {',
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
    '  }',
    '',
    '  if (window.IH && IH.countdown) IH.countdown.mount(document.body);',
    '});'
  ].join('\n');

  /* The whole invitation as a full-screen website. The markup is built
     from the invitation's own fields — names, date, venue, gallery,
     palette — so every future invitation comes out as a real page. */
  function buildHtml(state, opts) {
    /* How many folders up the shared js/ and images/ live. One level by
       default; a page that owns a folder of its own passes more. */
    var up = (opts && opts.up) || '../';
    var data = resolvePaths(state, up);

    var who = personName(state) || 'Our Celebration';
    var meta = eventMeta(data);
    var title = who + ' — ' + meta.label + ' Invitation';

    var inv = IH.invitation;
    var p = paletteFor(data);
    var d = inv.formatDate(data.date);
    var time = inv.formatTime(data.time);
    var headline = inv.headline(data);
    var subhead = inv.subhead(data);

    var type = String(data.eventType || 'other');
    var host = String(data.hostName || data.organization || '').trim();
    var kicker = host || meta.kicker;
    if (type === 'naming-ceremony' && (data.babyName || data.personName)) {
      kicker = 'OUR ' + (/daughter/i.test(String(data.babyRelation || '')) ? 'Daughter' : 'Son').toUpperCase();
    }

    var subParts = [meta.label];
    if (subhead) subParts.push(subhead);
    else if (type === 'wedding' || type === 'engagement') subParts.push('Invitation');
    var subText = subParts.join(' · ');

    var dateLine = [d.weekday, d.full, time].filter(Boolean).join(' · ');

    var message = (type === 'naming-ceremony' && inv.genderize)
      ? inv.genderize(data.message, data.babyRelation)
      : data.message;

    /* Only link to sections that will actually exist. */
    var navLinks = [];
    if (message) navLinks.push({ id: 'story', label: 'Our Story' });
    if (d.full || time || data.venue || data.address) navLinks.push({ id: 'details', label: 'Details' });
    if (data.showGallery !== false && data.gallery && data.gallery.length) navLinks.push({ id: 'gallery', label: 'Gallery' });
    if (data.showCountdown !== false && data.date && IH.countdown && IH.countdown.markup) navLinks.push({ id: 'countdown', label: 'Countdown' });
    if (data.venue || data.address) navLinks.push({ id: 'venue', label: 'Venue' });
    if (data.showRsvp !== false || data.phone) navLinks.push({ id: 'rsvp', label: 'RSVP' });

    var hasRsvp = data.showRsvp !== false || !!data.phone;
    var heroSecondary = navLinks.length ? navLinks[0] : null;
    var heroPrimary = hasRsvp ? { id: 'rsvp', label: 'RSVP' } : heroSecondary;
    var heroExtra = hasRsvp ? heroSecondary : null;
    if (heroExtra && heroPrimary && heroExtra.id === heroPrimary.id) heroExtra = null;

    var mapHref = data.mapsUrl ||
      (data.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.address) : '');

    var heroStyle = 'background-image:linear-gradient(160deg,' + rgba(p.primary, 0.92) + ',' +
      rgba(p.b2, 0.85) + ')' +
      (data.background ? ',url(' + data.background + ')' : '') +
      ';background-size:cover;background-position:center;';

    var head = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>' + esc(title) + '</title>',
      '<meta name="description" content="' + esc(metaDescription(state)) + '">',
      '<meta name="generator" content="InviteHub">',
      /* An invitation carries names, an address and a phone number. It is
         meant for the people sent the link, not for search results — but
         noindex only stops indexing, so the link-preview scrapers below
         still read the page and show the site in WhatsApp. */
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
      '<style>',
      websiteCss(p),
      '</style>',
      '</head>',
      '<body>'
    ];

    var body = [];

    /* Nav */
    body.push('<nav class="site-nav" aria-label="Invitation">');
    body.push('<div class="site-nav__inner">');
    body.push('<a class="site-nav__brand" href="#top">' + esc(brandText(data) || 'Invitation') + '</a>');
    body.push('<button class="site-nav__burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu">' + IH.icon('menu', 22) + '</button>');
    body.push('<div class="site-nav__menu" id="site-menu">');
    navLinks.forEach(function (l) {
      body.push('<a class="site-nav__link" href="#' + l.id + '">' + esc(l.label) + '</a>');
    });
    body.push('</div>');
    body.push('</div>');
    body.push('</nav>');

    /* Hero */
    body.push('<section class="site-hero" id="top" style="' + esc(heroStyle) + '">');
    body.push('<div class="site-hero__shade" aria-hidden="true"></div>');
    body.push('<div class="site-hero__inner">');
    if (data.photo) {
      body.push('<img class="site-hero__photo" src="' + esc(data.photo) + '" alt="' + esc(who) + '" width="132" height="132">');
    }
    body.push('<p class="site-hero__kicker">' + esc(kicker) + '</p>');
    body.push('<h1 class="site-hero__names">' + headline + '</h1>');
    body.push('<p class="site-hero__sub">' + esc(subText) + '</p>');
    if (dateLine) body.push('<p class="site-hero__when">' + esc(dateLine) + '</p>');
    body.push('<div class="site-hero__cta">');
    if (heroPrimary) {
      body.push('<a class="site-btn site-btn--light" href="#' + heroPrimary.id + '">' + IH.icon('user-check', 18) + '<span>' + esc(heroPrimary.label) + '</span></a>');
    }
    if (heroExtra) {
      body.push('<a class="site-btn site-btn--ghost" href="#' + heroExtra.id + '">' + IH.icon('chevron-down', 18) + '<span>' + esc(heroExtra.label) + '</span></a>');
    }
    body.push('</div>');
    body.push('</div>');
    body.push('</section>');

    /* Story */
    if (message) {
      body.push('<section class="site-section" id="story">');
      body.push('<div class="site-container">');
      body.push(sectionTitle('You are invited', 'The Invitation', ''));
      body.push('<div class="site-story"><p>' + esc(message) + '</p></div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Details */
    var cards = [];
    if (d.full) {
      cards.push('<div class="site-detail">' + IH.icon('calendar', 24) +
        '<small>Date</small><strong>' + esc(d.full) + (d.weekday ? '<br>' + esc(d.weekday) : '') + '</strong></div>');
    }
    if (time) {
      cards.push('<div class="site-detail">' + IH.icon('clock', 24) +
        '<small>Time</small><strong>' + esc(time) + '</strong></div>');
    }
    if (data.venue || data.address) {
      var vParts = [];
      if (data.venue) vParts.push(esc(data.venue));
      if (data.address) vParts.push(esc(data.address));
      cards.push('<div class="site-detail">' + IH.icon('map-pin', 24) +
        '<small>Venue</small><strong>' + vParts.join('<br>') + '</strong></div>');
    }
    if (cards.length) {
      body.push('<section class="site-section site-section--alt" id="details">');
      body.push('<div class="site-container">');
      body.push(sectionTitle('When &amp; Where', 'Event Details', ''));
      body.push('<div class="site-details">' + cards.join('') + '</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Gallery */
    if (data.showGallery !== false && data.gallery && data.gallery.length) {
      body.push('<section class="site-section" id="gallery">');
      body.push('<div class="site-container">');
      body.push(sectionTitle('Memories', 'Our Moments', 'A few special moments we would love to share with you.'));
      body.push('<div class="site-gallery">');
      data.gallery.forEach(function (src, i) {
        var wide = i === 0 && data.gallery.length > 1 ? ' site-gallery__item--wide' : '';
        body.push('<figure class="site-gallery__item' + wide + '" data-site-lightbox tabindex="0" role="button" aria-label="View photo ' + (i + 1) + ' enlarged">' +
          '<img src="' + esc(src) + '" alt="Event photo ' + (i + 1) + '" loading="lazy">' +
          '<span class="site-gallery__zoom"><span>+</span></span>' +
          '</figure>');
      });
      body.push('</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Countdown */
    if (data.showCountdown !== false && data.date && IH.countdown && IH.countdown.markup) {
      body.push('<section class="site-section site-count-section" id="countdown">');
      body.push('<div class="site-container">');
      body.push(sectionTitle('The Big Day', 'Counting Down', 'We cannot wait to celebrate this beautiful moment with you.'));
      body.push('<div class="site-count">' + IH.countdown.markup(inv.toDateTime(data.date, data.time)) + '</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Venue */
    if (data.venue || data.address) {
      body.push('<section class="site-section site-section--alt" id="venue">');
      body.push('<div class="site-container">');
      body.push(sectionTitle('Join Us', 'Venue &amp; Details', ''));
      body.push('<div class="site-venue">');
      body.push('<div class="site-venue__card">');
      if (data.venue) body.push('<h3>' + esc(data.venue) + '</h3>');
      if (data.address) body.push('<p>' + esc(data.address) + '</p>');
      if (dateLine) body.push('<p class="site-venue__when"><strong>' + esc(dateLine) + '</strong></p>');
      if (data.showMaps !== false && mapHref) {
        body.push('<a class="site-btn site-btn--solid" style="align-self:flex-start" href="' + esc(mapHref) + '" target="_blank" rel="noopener noreferrer">' + IH.icon('map-pin', 18) + '<span>Get Directions</span></a>');
      }
      body.push('</div>');
      body.push('<div class="site-venue__media"' + (data.background ? ' style="background-image:url(' + esc(data.background) + ')"' : '') + '>');
      if (data.showMaps !== false && mapHref) {
        body.push('<a class="site-venue__media-link" href="' + esc(mapHref) + '" target="_blank" rel="noopener noreferrer">' + IH.icon('map-pin', 17) + '<span>Open in Maps</span></a>');
      }
      body.push('</div>');
      body.push('</div>');
      body.push('</div>');
      body.push('</section>');
    }

    /* Actions */
    var act = [];
    if (data.showRsvp !== false) {
      act.push('<button class="site-btn site-btn--soft" type="button" data-soon="RSVP collection arrives with the full version of InviteHub.">' + IH.icon('user-check', 18) + '<span>RSVP</span></button>');
    }
    if (data.phone) {
      act.push('<a class="site-btn site-btn--solid" href="tel:' + esc(String(data.phone).replace(/\s/g, '')) + '">' + IH.icon('phone', 18) + '<span>Call Host</span></a>');
    }
    act.push('<button class="site-btn site-btn--soft" type="button" data-share-invitation>' + IH.icon('share', 18) + '<span>Share</span></button>');
    body.push('<section class="site-section site-actions" id="rsvp">');
    body.push('<div class="site-container">');
    body.push(sectionTitle('Stay Connected', 'We Would Love to See You', 'Thank you for being part of our ' + meta.label.toLowerCase() + '.'));
    body.push('<div class="site-actions__row">' + act.join('') + '</div>');
    body.push('</div>');
    body.push('</section>');

    /* Footer */
    body.push('<footer class="site-footer">');
    body.push('<div class="site-footer__names">' + esc(brandText(data) || 'Invitation') + '</div>');
    body.push('<p>Created with <a href="' + up + 'index.html">InviteHub</a></p>');
    body.push('</footer>');

    /* Music */
    if (data.musicFile) {
      body.push('<audio id="site-music" src="' + esc(data.musicFile) + '" preload="none" loop></audio>');
      body.push('<button class="site-music-btn" id="site-music-btn" type="button" aria-pressed="false" aria-label="Play music">' + IH.icon('music', 22) + '</button>');
    }

    var tail = [
      '',
      '<script id="invitation-data" type="application/json">',
      escScript(JSON.stringify(leanState(state))),
      '<\/script>',
      '',
      '<script src="' + up + 'js/main.js" defer><\/script>',
      '<script src="' + up + 'js/countdown.js" defer><\/script>',
      '<script src="' + up + 'js/share.js" defer><\/script>',
      '<script>',
      '  /* The page above is already fully rendered, so it reads fine with',
      '     JavaScript off. This starts the live countdown, the mobile menu,',
      '     the gallery lightbox and the music toggle. */',
      escScript(INLINE_SITE_JS),
      '<\/script>',
      '</body>',
      '</html>',
      ''
    ];

    return head.concat(body, tail).join('\n');
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
