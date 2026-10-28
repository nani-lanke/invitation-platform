/* ==========================================================================
   redesign-collection.js — the optional "Redesigned Collection" (100 cards).

   A separate collection beside the original catalogue. Nothing in the
   original catalogue is changed: each redesigned card has its own id
   (rd-<original-slug>), is NOT added to IH.data.templates (so gallery
   listings, counts, search and default selections are untouched), and is
   resolved only through IH.data.getTemplate / fetchTemplate.

   Rendering goes through the existing renderer. For an rd-* card the
   renderer receives a copy of the data with the original template slug
   (so the design engine builds the same validated layout). The new artwork
   is then swapped into the renderer's own output:
     - crest:  images/wedding-motifs/<slug>.svg -> images/redesign-100/<slug>/crest.webp
     - venue:  images/templates/venue-default.jpg -> images/redesign-100/<slug>/venue.webp
               (only the default; a venue photo the host uploads always wins)
     - corner florals and a footer landscape in the card frame, inline styled
       so exported/hosted documents need no extra stylesheet.
   The same is done for the hosted page (IH.exportPage.buildHtml).

   Load order on a page: templates.js, wedding-designs.js,
   redesign-collection-data.js, redesign-collection.js, then preview.js /
   export.js (their IH.invitation / IH.exportPage are wrapped on assignment).

   ROLLBACK: set ENABLED = false below. The collection disappears from the
   gallery and editor and every saved rd-* draft or link falls back to its
   original design. Removing the two <script> tags removes it entirely.
   Assets are rebuilt with: python scripts/build-redesign-collection.py
   ========================================================================== */
(function () {
  'use strict';

  var ENABLED = true;

  var IH = window.IH = window.IH || {};
  var DATA = IH.REDESIGN_COLLECTION_DATA;
  if (!DATA || !IH.data) return;

  var PREFIX = 'rd-';
  // The gallery script rewrites the query string as it loads, so the URL the
  // page was opened with is read from the navigation timing entry.
  var NAV = (window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var OPENED = new URL(NAV ? NAV.name : location.href);
  var OPEN_REQUESTED = OPENED.searchParams.get('collection') === DATA.id || OPENED.hash === '#redesigned-collection' || location.hash === '#redesigned-collection';
  var CARDS = {};
  DATA.cards.forEach(function (c) { CARDS[c.slug] = c; });
  var GROUP_LABEL = {};
  DATA.groups.forEach(function (g) { GROUP_LABEL[g.id] = g.label; });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function cardFor(slug) { return (typeof slug === 'string' && slug.indexOf(PREFIX) === 0) ? CARDS[slug] || null : null; }
  function assetDir(card) { return 'images/redesign-100/' + card.base + '/'; }

  /* ---- Registry: rd-* templates built from the live original ------------ */
  var origGet = IH.data.getTemplate;
  var cache = {};
  function rdTemplate(card) {
    if (cache[card.slug]) return cache[card.slug];
    var base = origGet.call(IH.data, card.base);
    if (!base) return null;
    var t = {};
    Object.keys(base).forEach(function (k) { t[k] = base[k]; });
    t.id = t.slug = card.slug;
    t.name = base.name + ' (Redesigned)';
    t.image = assetDir(card) + 'thumb.jpg';
    t.categoryLabel = base.categoryLabel + ' · ' + DATA.label;
    t.collection = DATA.id;
    t.collectionLabel = DATA.label;
    t.collectionGroup = card.group;
    t.collectionGroupLabel = GROUP_LABEL[card.group];
    t.baseSlug = base.slug;
    t.baseName = base.name;
    t.keywords = (base.keywords || '') + ' redesigned collection';
    cache[card.slug] = t;
    return t;
  }

  IH.data.getTemplate = function (slug) {
    var card = cardFor(slug);
    if (!card) return origGet.apply(IH.data, arguments);
    return ENABLED ? rdTemplate(card) : origGet.call(IH.data, card.base);
  };
  var origFetch = IH.data.fetchTemplate;
  IH.data.fetchTemplate = function (slug) {
    return cardFor(slug) ? Promise.resolve(IH.data.getTemplate(slug)) : origFetch.apply(IH.data, arguments);
  };

  IH.redesignCollection = {
    enabled: ENABLED,
    id: DATA.id,
    label: DATA.label,
    groups: DATA.groups,
    isRedesign: function (slug) { return !!cardFor(slug); },
    baseOf: function (slug) { var c = cardFor(slug); return c ? c.base : slug; },
    templates: function () { return ENABLED ? DATA.cards.map(rdTemplate).filter(Boolean) : []; }
  };

  /* ---- Artwork swapped into the renderer's output ----------------------- */
  function layerImgs(card, pre, host, royal) {
    var dir = pre + assetDir(card);
    var html = '';
    if (card.corners) {
      var c = host
        ? 'position:absolute;top:0;width:clamp(120px,24vw,300px);height:auto;pointer-events:none;z-index:0'
        : 'position:absolute;top:0;width:31%;height:auto;pointer-events:none;z-index:-1' +
          /* Royal cards show side notes at 40cqi once wider than 440px; end the florals above them. */
          (royal ? ';width:auto;max-width:31%;max-height:max(36cqi,170px)' : '');
      html += '<img class="rd-layer rd-corner rd-corner--tl" src="' + esc(dir + 'corner-tl.webp') + '" alt="" aria-hidden="true" style="' + c + ';left:-2%">' +
              '<img class="rd-layer rd-corner rd-corner--tr" src="' + esc(dir + 'corner-tr.webp') + '" alt="" aria-hidden="true" style="' + c + ';right:-2%">';
    }
    if (!host) {
      var mask = 'linear-gradient(to top,#000 42%,transparent 100%),linear-gradient(to right,transparent 0,#000 14%,#000 86%,transparent 100%)';
      html += '<img class="rd-layer rd-footer" src="' + esc(dir + 'footer.webp') + '" alt="" aria-hidden="true" style="position:absolute;left:0;bottom:0;width:100%;height:auto;' +
        'pointer-events:none;z-index:-1;-webkit-mask-image:' + mask + ';-webkit-mask-composite:source-in;mask-image:' + mask + ';mask-composite:intersect">';
    }
    return html;
  }

  function swapCommon(html, card, pre) {
    var dir = pre + assetDir(card);
    html = html.split(pre + 'images/wedding-motifs/' + card.base + '.svg').join(dir + 'crest.webp');
    html = html.split(pre + 'images/templates/venue-default.jpg').join(dir + 'venue.webp');
    if (card.corners) html = html.replace(/<svg class="wd-corner[\s\S]*?<\/svg>/g, '');
    return html;
  }

  function decorateCard(html, card, pre) {
    if (html.indexOf('invitation--wd') < 0) return html; // not a wedding-engine card (e.g. another event type)
    html = swapCommon(html, card, pre);
    html = html.replace(/class="invitation /, 'class="invitation rd-card ');
    html = html.replace('<div class="wd-frame" aria-hidden="true">', '<div class="wd-frame" aria-hidden="true">' + layerImgs(card, pre, false, html.indexOf('wd-l-royal') >= 0));
    html = html.replace(/<img class="wd-motif"/g, '<img style="filter:drop-shadow(0 3px 8px rgba(0,0,0,.28))" class="wd-motif"');
    html = html.replace(/<img class="wd-spray/g, '<img style="opacity:.94" class="wd-spray');
    var end = html.lastIndexOf('</article>');
    if (end >= 0) html = html.slice(0, end) + '<div class="rd-spacer" aria-hidden="true" style="height:40cqi"></div>' + html.slice(end);
    return html;
  }

  function decorateHost(html, card, up) {
    if (html.indexOf('site-host--wd') < 0) return html;
    html = swapCommon(html, card, up);
    html = html.replace('<div class="site-hero__backdrop site-wd-frame" aria-hidden="true">',
      '<div class="site-hero__backdrop site-wd-frame" aria-hidden="true">' + layerImgs(card, up, true));
    var mask = 'linear-gradient(to top,#000 50%,transparent 100%),linear-gradient(to right,transparent 0,#000 10%,#000 90%,transparent 100%)';
    var land = '<div class="rd-host-landscape" aria-hidden="true" style="position:relative;height:clamp(170px,26vw,400px);overflow:hidden;pointer-events:none">' +
      '<img src="' + esc(up + assetDir(card) + 'footer.webp') + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 70%;' +
      '-webkit-mask-image:' + mask + ';-webkit-mask-composite:source-in;mask-image:' + mask + ';mask-composite:intersect"></div>';
    return html.replace('<footer class="site-footer">', land + '<footer class="site-footer">');
  }

  function withBase(obj, card) {
    var copy = {};
    Object.keys(obj || {}).forEach(function (k) { copy[k] = obj[k]; });
    copy.template = card.base;
    copy.rdCollection = true; // the engine's floral line art is for the originals; these cards carry their own artwork
    return copy;
  }

  /* Wrap a module's object the moment its script assigns it to IH. */
  function onAssign(name, wrap) {
    if (IH[name]) { wrap(IH[name]); return; }
    var value;
    Object.defineProperty(IH, name, {
      configurable: true, enumerable: true,
      get: function () { return value; },
      set: function (v) { value = v; if (v) wrap(v); }
    });
  }

  onAssign('invitation', function (inv) {
    var render = inv.render;
    inv.render = function (data) {
      var card = data && cardFor(data.template);
      if (!card) return render.apply(this, arguments);
      var html = render.call(this, withBase(data, card));
      return ENABLED ? decorateCard(html, card, data.assetPrefix || '') : html;
    };
  });

  onAssign('exportPage', function (ex) {
    /* buildCardHtml (the downloadable card) renders through inv.render,
       which is already wrapped above, so only the host page needs this. */
    var buildHtml = ex.buildHtml;
    ex.buildHtml = function (state, opts) {
      var card = state && cardFor(state.template);
      if (!card) return buildHtml.apply(this, arguments);
      var html = buildHtml.call(this, withBase(state, card), opts);
      var up = (opts && typeof opts.up === 'string') ? opts.up : '../';
      return ENABLED ? decorateHost(html, card, up) : html;
    };
  });

  if (!ENABLED) return;

  /* The gallery's latest filters; it may render before mountGallery runs. */
  var LAST_FILTER = { category: OPENED.searchParams.get('category') || 'all', q: OPENED.searchParams.get('q') || '' };
  document.addEventListener('ih:galleryrender', function (e) { if (e.detail) LAST_FILTER = e.detail; });

  /* ---- Gallery: an optional, collapsed section on templates.html -------- */
  function tileGroups(render, keep) {
    return DATA.groups.map(function (g) {
      var list = DATA.cards.filter(function (c) { return c.group === g.id; }).map(rdTemplate).filter(Boolean).filter(keep);
      if (!list.length) return '';
      return '<h3 class="rd-collection__group" style="margin:var(--space-6,32px) 0 var(--space-4,16px)">' + esc(g.label) +
        ' <span class="muted" style="font-weight:400">(' + list.length + ')</span></h3>' + render(list, g.label);
    }).join('');
  }

  function mountGallery() {
    var grid = document.querySelector('[data-template-grid]');
    if (!grid || !IH.render || !IH.render.templateCardHTML) return;
    var anchor = grid.closest('section') || grid.parentNode;
    /* Shown below the original gallery: each group is one sideways row. */
    var sec = document.createElement('section');
    sec.className = 'section section--tight rd-collection';
    sec.id = 'redesigned-collection';
    sec.setAttribute('data-redesign-collection', DATA.id);
    sec.innerHTML = '<div class="container">' +
        '<div class="rd-collection__body" data-rd-gallery></div>' +
      '</div>';
    anchor.parentNode.insertBefore(sec, anchor.nextSibling);
    var body = sec.querySelector('[data-rd-gallery]');
    /* Follows the gallery's filters: only the Wedding (or All) category, and
       the same search text and Favourites toggle as the cards above. */
    var shownKey = null;
    function paint(f) {
      f = f || {};
      var cat = f.category || 'all';
      var term = String(f.q || '').trim().toLowerCase();
      var favs = f.favOnly && IH.favorites && IH.favorites.all ? IH.favorites.all() : null;
      var key = [cat, term, favs ? favs.join(',') : ''].join('|');
      if (key === shownKey) return;
      shownKey = key;
      if (cat !== 'all' && cat !== 'wedding') { body.innerHTML = ''; sec.hidden = true; return; }
      body.innerHTML = tileGroups(function (list, label) {
        return '<div class="template-grid rail rail--single" role="group" tabindex="0" aria-label="' + esc(label) +
          ' — scroll sideways to see more">' + list.map(function (t) {
          return IH.render.templateCardHTML(t, false).replace(' data-reveal="zoom"', '');
        }).join('') + '</div>';
      }, function (t) {
        if (favs && favs.indexOf(t.slug) === -1) return false;
        if (!term) return true;
        return t.keywords.toLowerCase().indexOf(term) !== -1 || t.name.toLowerCase().indexOf(term) !== -1 ||
          String(t.blurb || '').toLowerCase().indexOf(term) !== -1;
      });
      sec.hidden = !body.childNodes.length;
      if (IH.favorites && IH.favorites.sync) IH.favorites.sync();
    }
    paint(LAST_FILTER);
    document.addEventListener('ih:galleryrender', function (e) { paint(e.detail); });
    if (OPEN_REQUESTED) setTimeout(function () { sec.scrollIntoView(); }, 300);
  }

  /* ---- Categories page: one extra category card for the collection ------ */
  function mountCategories() {
    var grid = document.querySelector('[data-category-grid]');
    if (!grid || !IH.render || !IH.render.categoryCardHTML) return;
    var first = rdTemplate(DATA.cards[0]);
    var cat = { slug: DATA.id, label: DATA.label, count: DATA.cards.length, displayCount: DATA.cards.length,
      image: first ? first.image : '', description: 'New artwork for 100 wedding designs — regional, ritual, royal and botanical. Each one is its own design; the originals are unchanged.' };
    function inject() {
      if (grid.querySelector('[data-rd-category]')) return;
      var wrap = document.createElement('div');
      wrap.innerHTML = IH.render.categoryCardHTML(cat).replace(' data-reveal="zoom"', '')
        .replace('templates.html?category=' + encodeURIComponent(DATA.id), 'templates.html?collection=' + encodeURIComponent(DATA.id));
      var card = wrap.firstElementChild;
      if (!card) return;
      card.setAttribute('data-rd-category', DATA.id);
      grid.appendChild(card);
    }
    // The categories script fills the grid itself; add the card after it does.
    new MutationObserver(inject).observe(grid, { childList: true });
    if (grid.children.length) inject();
  }

  /* ---- Editor: each redesigned card sits right after its original ------
     In both template lists (step 1 "Invitation templates" and the Design
     step "Template" grid) the redesigned card is placed next to the design
     it was made from, and the "N designs made for ..." count includes it. */
  function mountEditor() {
    var hosts = [
      { el: document.querySelector('[data-template-picker]'), name: 'template' },
      { el: document.querySelector('[data-event-templates]'), name: 'templateQuick' }
    ].filter(function (h) { return h.el; });
    if (!hosts.length) return;
    function current() {
      try { var d = IH.store.get('draft', null); if (d && d.template) return d.template; } catch (e) {}
      return OPENED.searchParams.get('template') || '';
    }
    function tile(t, sel, name) {
      return '<label class="option-tile" data-rd-tile="' + esc(t.slug) + '">' +
        '<input type="radio" name="' + name + '" value="' + esc(t.slug) + '"' + (t.slug === sel ? ' checked' : '') + '>' +
        '<span class="option-tile__box" style="padding:10px;gap:8px">' +
          '<img src="' + esc(t.image) + '" alt="' + esc(t.name) + '" width="600" height="800" loading="lazy" ' +
            'style="width:100%;border-radius:10px;aspect-ratio:3/4;object-fit:cover">' +
          '<span>' + esc(t.name) + '</span>' +
        '</span></label>';
    }
    function inject(host) {
      var root = host.el;
      if (!root.firstChild || root.querySelector('[data-rd-tile]')) return;
      var sel = current();
      DATA.cards.forEach(function (c) {
        var input = root.querySelector('input[name="' + host.name + '"][value="' + c.base + '"]');
        var t = input && rdTemplate(c);
        if (!t) return;
        var label = input.closest('label');
        var wrap = document.createElement('div');
        wrap.innerHTML = tile(t, sel, host.name);
        label.parentNode.insertBefore(wrap.firstChild, label.nextSibling);
      });
      // "155 designs made for wedding." -> count what the grid now shows
      // (catalogue + redesigned), the same number the occasion picker shows.
      Array.prototype.forEach.call(root.querySelectorAll('.option-grid'), function (grid) {
        var note = grid.previousElementSibling;
        if (!note || !grid.querySelector('[data-rd-tile]')) return;
        var n = grid.querySelectorAll('input[name="' + host.name + '"]').length;
        var walker = document.createTreeWalker(note, NodeFilter.SHOW_TEXT);
        for (var node = walker.nextNode(); node; node = walker.nextNode()) {
          if (/^\s*\d+ designs? made for/.test(node.nodeValue)) {
            node.nodeValue = node.nodeValue.replace(/\d+ designs?/, n + ' design' + (n === 1 ? '' : 's'));
            break;
          }
        }
      });
    }
    /* The radio for the chosen design stays checked after a re-render. */
    function sync() {
      var sel = current();
      hosts.forEach(function (h) {
        Array.prototype.forEach.call(h.el.querySelectorAll('[data-rd-tile] input'), function (i) {
          if (i.checked !== (i.value === sel)) i.checked = i.value === sel;
        });
      });
    }
    // Both lists are rebuilt (innerHTML) when the event type changes; place the cards again each time.
    hosts.forEach(function (h) {
      new MutationObserver(function () { inject(h); sync(); }).observe(h.el, { childList: true });
      inject(h);
    });
    var frame = document.getElementById('preview-viewport-frame');
    if (frame) new MutationObserver(sync).observe(frame, { childList: true, subtree: true });
    sync();
  }

  function boot() { mountGallery(); mountCategories(); mountEditor(); }
  // Deferred scripts run before DOMContentLoaded, so the gallery and the
  // editor picker are mounted once every page script has set up.
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
