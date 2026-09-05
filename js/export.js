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

  function brandText(state) {
    var type = String(state.eventType || '');
    if (type === 'wedding' || type === 'engagement' || type === 'reception' || type === 'anniversary') {
      var g = String(state.groomName || '').trim(), b = String(state.brideName || '').trim();
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
      '  padding:clamp(1.4rem,6%,2.5rem) clamp(1rem,4.5%,1.75rem) clamp(1.25rem,5%,2rem);',
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
      '.invitation>*{position:relative;z-index:1}',
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
      '  text-transform:uppercase;',
      '  color:color-mix(in srgb,var(--inv-ink) 68%,transparent);',
      '  margin-bottom:var(--space-3,1rem);',
      '  max-width:100%;',
      '  text-wrap:balance;',
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
      '.invitation__subhead{',
      '  letter-spacing:clamp(.05em,.3cqi,.1em);',
      '  text-indent:clamp(.05em,.3cqi,.1em);',
      '}',
      '',
      '.invitation__rule{display:flex;align-items:center;justify-content:center;gap:10px;margin:var(--space-4,1.5rem) 0;color:var(--inv-secondary)}',
      '.invitation__rule::before,.invitation__rule::after{content:"";height:1px;width:52px;background:currentColor;opacity:.55}',
      '.invitation__rule svg{width:16px;height:16px}',
      '',
      '.invitation__message{font-size:.92rem;line-height:1.75;color:color-mix(in srgb,var(--inv-ink) 82%,transparent);margin-bottom:var(--space-5,2rem)}',
      '',
      '.invitation__when{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--space-3,1rem);margin-bottom:var(--space-5,2rem)}',
      '.invitation__when-date{font-family:var(--inv-font-display);font-size:1.55rem;font-weight:700;line-height:1.15;color:var(--inv-primary)}',
      '.invitation__when-sep{width:1px;height:44px;background:color-mix(in srgb,var(--inv-primary) 30%,transparent)}',
      '.invitation__when small{display:block;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;opacity:.7}',
      '',
      '.invitation__venue{margin-bottom:var(--space-5,2rem);display:flex;flex-direction:column;gap:var(--space-3,1rem)}',
      '.invitation__venue-name{font-family:var(--inv-font-display);font-size:1.15rem;color:var(--inv-primary)}',
      '.invitation__venue-address{font-size:.85rem;opacity:.8}',
      '.invitation__maps-btn{display:inline-flex;align-items:center;gap:var(--space-2,.5rem);padding:var(--space-2,.5rem) var(--space-3,.75rem);border-radius:var(--r-pill,999px);border:1px solid color-mix(in srgb,var(--inv-ink) 20%,transparent);background:transparent;color:var(--inv-primary);font-weight:600;font-size:.85rem;transition:all var(--t-fast,.15s) var(--ease,.25s)}',
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
      '.invitation--birthday .invitation__names{letter-spacing:-.02em;text-transform:uppercase;font-weight:700}',
      '.invitation--birthday .invitation__names .amp{text-transform:none}',
      '.invitation--birthday .invitation__kicker{letter-spacing:.18em}',
      '.invitation--birthday .invitation__when{border-radius:var(--r-lg,.75rem);background:color-mix(in srgb,var(--inv-primary) 8%,transparent);padding:var(--space-3,1rem)}',
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
      '.invitation--corporate{--inv-font-display:var(--inv-fb);border-radius:var(--r-md,.5rem);text-align:left;padding-inline:var(--space-6,2.5rem)}',
      '.invitation--corporate::before{border-radius:var(--r-sm,.25rem);border-width:0 0 0 3px;inset:0 0 0 0;border-left-color:var(--inv-secondary)}',
      '.invitation--corporate .invitation__ornament{justify-content:flex-start}',
      '.invitation--corporate .invitation__ornament svg{width:44px;height:44px}',
      '.invitation--corporate .invitation__names{font-size:clamp(1.5rem,1rem+2.4vw,2.1rem);letter-spacing:-.02em}',
      '.invitation--corporate .invitation__rule{justify-content:flex-start}',
      '.invitation--corporate .invitation__rule::before{display:none}',
      '.invitation--corporate .invitation__when{grid-template-columns:auto auto 1fr;justify-items:start;text-align:left}',
      '.invitation--corporate .invitation__actions{justify-content:flex-start}',
      '.invitation--corporate .invitation__photo{margin-inline:0;border-radius:var(--r-lg,.75rem)}',
      '',
      '.invitation--anniversary::before{inset:12px;border-width:3px;border-style:double}',
      '',
      '.invitation--festival{background:radial-gradient(120% 90% at 50% 0%,var(--inv-bg2),var(--inv-bg1))}',
      '.invitation--festival::before{border-radius:50%/6%;border-width:2px;inset:10px}',
      '.invitation--festival .invitation__names{font-style:italic}',
      '',
      '.invitation--engagement::before{inset:12px;border-width:2px}',
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
      '}'
    ].join('\n');
  }

  /* Inline JS for countdown, share, music, lightbox, nav on the hosted page */
  var INLINE_JS = [
    '  // --- Countdown ---',
    '  if (window.IH && IH.countdown) IH.countdown.mount(document.body);',
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
    '  // --- Mobile Navigation ---',
    '  (function () {',
    '    var burger = document.querySelector(".site-nav__burger");',
    '    var menu = document.querySelector(".site-nav__menu");',
    '    if (!burger || !menu) return;',
    '    var closeMenu = function () {',
    '      menu.classList.remove("is-open");',
    '      burger.setAttribute("aria-expanded", "false");',
    '    };',
    '    burger.addEventListener("click", function () {',
    '      var open = menu.classList.toggle("is-open");',
    '      burger.setAttribute("aria-expanded", open ? "true" : "false");',
    '    });',
    '    menu.addEventListener("click", function (e) {',
    '      if (e.target.closest("a")) closeMenu();',
    '    });',
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
    '      box.innerHTML = \'<button class="site-lightbox__btn site-lightbox__close" type="button" aria-label="Close">×</button>\' +',
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
    var up = (opts && opts.up) || '../';
    var data = resolvePaths(state, up);

    var who = personName(state) || 'Our Celebration';
    var meta = eventMeta(data);
    var title = who + ' — ' + meta.label + ' Invitation';

    var inv = IH.invitation;
    var p = paletteFor(data);

    /* Format date and time for display */
    var d = inv.formatDate(data.date);
    var time = inv.formatTime(data.time);
    var weekday = d.weekday || '';
    var dateFull = d.full || 'Date to be announced';
    var heroWhen = [weekday, dateFull, time].filter(Boolean).join(' · ');

    /* Hero subtitle: event type + title (e.g., "Wedding · Wedding") - always shows both if title exists */
    var heroSub = meta.label;
    if (data.title) {
      heroSub = meta.label + ' · ' + data.title;
    }

    /* Maps URL */
    var mapsUrl = inv.getMapsUrl ? inv.getMapsUrl(data) : (data.mapsUrl || (data.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data.address) : ''));

    /* Build navigation links (no RSVP) */
    var navLinks = [
      { href: '#story', label: 'Our Story' },
      { href: '#details', label: 'Details' },
      { href: '#gallery', label: 'Gallery' },
      { href: '#countdown', label: 'Countdown' },
      { href: '#venue', label: 'Venue' }
    ];

    var head = [
      '<!DOCTYPE html>',
      '<html lang="en">',
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
      '<link rel="icon" href="' + up + 'images/logo/favicon.png" type="image/svg+xml">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@600;700&family=Great+Vibes&family=Cormorant+Garamond:wght@600;700&display=swap">',
      '',
      '<style>',
      siteHostPageCss(p),
      '</style>',
      '</head>',
      '<body>'
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
    if (data.background) {
      /* Use palette primary for top gradient, dark bg for bottom */
      var primaryRgba = rgba(p.primary, 0.92);
      var darkRgba = rgba(p.bg1, 0.85);
      heroBgStyle = 'background-image:linear-gradient(160deg,' + primaryRgba + ',' + darkRgba + '),url(' + esc(data.background) + ');background-size:cover;background-position:center;';
    } else {
      heroBgStyle = 'background:linear-gradient(160deg,var(--site-b1),var(--site-b2));';
    }

    body.push('<section class="site-hero" id="top" style="' + heroBgStyle + '">');
    body.push('<div class="site-hero__shade" aria-hidden="true"></div>');
    body.push('<div class="site-hero__inner">');

    /* Hero photo */
    if (data.photo) {
      body.push('<img class="site-hero__photo" src="' + esc(data.photo) + '" alt="' + esc(brandText(state)) + '" width="132" height="132">');
    }

    /* Kicker */
    var kicker = data.hostName || meta.kicker;
    body.push('<p class="site-hero__kicker">' + esc(kicker) + '</p>');

    /* Names */
    var headline = inv.headline(data);
    body.push('<h1 class="site-hero__names">' + headline + '</h1>');

    /* Subtitle */
    body.push('<p class="site-hero__sub">' + esc(heroSub) + '</p>');

    /* Date/time */
    body.push('<p class="site-hero__when">' + esc(heroWhen) + '</p>');

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
    body.push('<div class="site-title"><p class="site-title__eyebrow">You are invited</p><h2>The Invitation</h2></div>');
    body.push('<div class="site-story">');
    var message = data.message || '';
    if (data.eventType === 'naming-ceremony') {
      message = inv.genderize(message, data.babyRelation);
    }
    body.push('<p>' + esc(message) + '</p>');
    body.push('</div>');
    body.push('</div>');
    body.push('</section>');

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
      body.push('<div class="site-gallery">');
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
      body.push('<div class="site-title"><p class="site-title__eyebrow">The Big Day</p><h2>Counting Down</h2><p>We cannot wait to celebrate this beautiful moment with you.</p></div>');
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
      if (data.background) {
        body.push('<div class="site-venue__media" style="background-image:url(' + esc(data.background) + ')"></div>');
      } else {
        body.push('<div class="site-venue__media"></div>');
      }
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

    /* Footer */
    body.push('<footer class="site-footer">');
    body.push('<div class="site-footer__names">' + esc(brandText(state)) + '</div>');
    body.push('<p>Created with <a href="' + up + 'index.html">InviteAura</a></p>');
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
      '<script>',
      '  /* Starts the live countdown, share, mobile nav, lightbox, music toggle. */',
      escScript(INLINE_JS),
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