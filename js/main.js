/* ==========================================================================
   InviteHub — main.js
   Shared runtime: theme, navigation, icons, toasts, modals, accordion,
   scroll reveal, back-to-top, generic form validation, storage helpers.

   Everything hangs off a single global (window.IH) so that a future
   Vercel/Supabase build can replace individual modules (notably IH.store
   and IH.data) without touching the rest of the UI code.
   ========================================================================== */

(function (window, document) {
  'use strict';

  /* ------------------------------------------------------------------
     0. Namespace
     ------------------------------------------------------------------ */

  var IH = window.IH || {};
  window.IH = IH;

  IH.config = {
    brand: 'InviteHub',
    storagePrefix: 'invitehub:',
    currency: '₹'
  };

  /* ------------------------------------------------------------------
     1. Tiny DOM helpers
     ------------------------------------------------------------------ */

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(el, evt, fn, opts) { if (el) el.addEventListener(evt, fn, opts); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        if (val === null || val === undefined || val === false) return;
        if (key === 'class') node.className = val;
        else if (key === 'html') node.innerHTML = val;
        else if (key === 'text') node.textContent = val;
        else if (key === 'dataset') Object.keys(val).forEach(function (d) { node.dataset[d] = val[d]; });
        else if (key.slice(0, 2) === 'on' && typeof val === 'function') node.addEventListener(key.slice(2), val);
        else node.setAttribute(key, val === true ? '' : val);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 180);
    };
  }

  function throttle(fn, wait) {
    var last = 0, queued;
    return function () {
      var ctx = this, args = arguments, now = Date.now();
      if (now - last >= (wait || 120)) { last = now; fn.apply(ctx, args); }
      else {
        clearTimeout(queued);
        queued = setTimeout(function () { last = Date.now(); fn.apply(ctx, args); }, wait - (now - last));
      }
    };
  }

  function slugify(str) {
    return String(str || '').toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  IH.dom = { qs: qs, qsa: qsa, on: on, el: el, escapeHtml: escapeHtml, debounce: debounce, throttle: throttle, slugify: slugify };

  /* ------------------------------------------------------------------
     2. Storage — the single seam a backend would replace
     ------------------------------------------------------------------ */

  IH.store = {
    available: (function () {
      try {
        var k = '__ih_probe__';
        window.localStorage.setItem(k, '1');
        window.localStorage.removeItem(k);
        return true;
      } catch (err) { return false; }
    })(),
    _mem: {},
    key: function (name) { return IH.config.storagePrefix + name; },
    get: function (name, fallback) {
      try {
        var raw = this.available ? window.localStorage.getItem(this.key(name)) : this._mem[name];
        if (raw === null || raw === undefined) return fallback;
        return JSON.parse(raw);
      } catch (err) { return fallback; }
    },
    set: function (name, value) {
      var raw = JSON.stringify(value);
      try {
        if (this.available) window.localStorage.setItem(this.key(name), raw);
        else this._mem[name] = raw;
        return true;
      } catch (err) {
        // Quota exceeded (large data-URL photos) — degrade to memory only.
        this._mem[name] = raw;
        return false;
      }
    },
    remove: function (name) {
      try { if (this.available) window.localStorage.removeItem(this.key(name)); } catch (err) { /* ignore */ }
      delete this._mem[name];
    }
  };

  /* ------------------------------------------------------------------
     3. Icons — inline SVG sprite (no icon font, no network request)
     ------------------------------------------------------------------ */

  var ICON_PATHS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/><path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z"/>',
    palette: '<path d="M12 21a9 9 0 1 1 9-9c0 1.7-1.3 3-3 3h-1.6a2 2 0 0 0-1.4 3.4 2 2 0 0 1-1.4 3.4H12z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    'qr-code': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 21h1M21 14h.01"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    'calendar-x': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M14 15l-4 4M10 15l4 4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    gift: '<rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>',
    cake: '<path d="M4 21h16v-6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6z"/><path d="M12 8V5M8 8V6M16 8V6M4 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/>',
    baby: '<circle cx="12" cy="9" r="5"/><path d="M9.5 8.5h.01M14.5 8.5h.01M10 12c1.2 1 2.8 1 4 0"/><path d="M6 21a6 6 0 0 1 12 0"/>',
    home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'graduation-cap': '<path d="M22 9 12 4 2 9l10 5 10-5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
    rings: '<circle cx="9" cy="14" r="6"/><circle cx="15" cy="14" r="6"/><path d="M15 5.5 16.5 8h-3z"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.5 0-4.5-4-6-4-9.5 0 0-3 1.5-3 5 0-1.5-1-3-2.5-4C8 9 5 11 5 15.5 5 19.3 8 22 12 22z"/>',
    'party-popper': '<path d="M3 21 8 9l7 7-12 5z"/><path d="M14 4.5 15 3M19 6l1.5-1M18 11h2M13 8.5 14.5 7"/><circle cx="17" cy="8" r="1"/>',
    'book-open': '<path d="M12 6.5C10.5 5 8 4 4 4v14c4 0 6.5 1 8 2.5 1.5-1.5 4-2.5 8-2.5V4c-4 0-6.5 1-8 2.5z"/><path d="M12 6.5v14"/>',
    'praying-hands': '<path d="M11 21 7.5 15.5A4 4 0 0 1 7 13.5V6a1.5 1.5 0 0 1 3 0v5"/><path d="m13 21 3.5-5.5a4 4 0 0 0 .5-2V6a1.5 1.5 0 0 0-3 0v5"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 9l5-5 5 5M12 4v12"/>',
    'zoom-in': '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    'zoom-out': '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M16 21h3a2 2 0 0 0 2-2v-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8a7 7 0 0 1-7 7h-3z"/><path d="M2 21c0-3 1.9-5.6 4.5-7"/>',
    'trending-up': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    facebook: '<path d="M14 9V7c0-1 .4-1.5 1.5-1.5H17V2.5h-2.4C11.8 2.5 11 4.3 11 6.5V9H8.5v3.5H11V22h3v-9.5h2.6l.4-3.5H14z" stroke="none" fill="currentColor"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    whatsapp: '<path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-3.9A8 8 0 1 1 20 12z"/><path d="M9.2 9.1c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.6 1.4c.1.2 0 .4-.1.5l-.4.5c-.1.2-.2.3 0 .6a6 6 0 0 0 2.5 2.1c.3.1.4 0 .6-.1l.5-.6c.2-.2.3-.2.5-.1l1.4.7c.2.1.4.2.4.4v.4c0 .6-.5 1.2-1 1.3-.5.1-1.1.2-3.4-.8a8.4 8.4 0 0 1-3.5-3.3c-.9-1.6-.5-2.6-.3-3z" stroke="none" fill="currentColor"/>',
    telegram: '<path d="M21 4 2.8 11.1c-.6.2-.6.9 0 1.1l4.5 1.5 1.7 5.2c.2.5.8.6 1.1.2l2.4-2.4 4.6 3.4c.5.3 1.1 0 1.2-.6L22 4.8c.1-.6-.4-1-1-.8z"/><path d="m7.3 13.7 9.4-6-6.5 7.3"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/>',
    x: '<path d="M4 4l16 16M20 4 4 20"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4h6v3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    'external-link': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    flag: '<path d="M4 22V4M4 4h13l-2.5 4L17 12H4"/>',
    tag: '<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    ticket: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 6v2M13 11v2M13 16v2"/>',
    'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h3"/>',
    'message-circle': '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 8.9 8.9 0 0 1-4-.9L3 21l1.9-5a8.4 8.4 0 0 1-.9-4 8.4 8.4 0 0 1 8.5-8.5A8.4 8.4 0 0 1 21 11.5z"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    wand: '<path d="m15 4 5 5L9 20l-5-5z"/><path d="M18 2v3M20.5 3.5h-3M5 15l4 4"/>'
  };

  IH.icon = function (name, size, extraClass) {
    var path = ICON_PATHS[name];
    if (!path) path = ICON_PATHS.sparkles;
    var s = size || 24;
    return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '" width="' + s + '" height="' + s +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + path + '</svg>';
  };

  /* Replace any <i data-icon="name"> placeholder with a real SVG, carrying
     over the class and inline style so per-icon colours survive the swap. */
  IH.hydrateIcons = function (root) {
    qsa('[data-icon]', root || document).forEach(function (node) {
      var name = node.getAttribute('data-icon');
      var size = node.getAttribute('data-icon-size') || 24;
      var wrap = el('span', { html: IH.icon(name, size) });
      var svg = wrap.firstChild;
      if (node.className) svg.setAttribute('class', 'icon ' + node.className);
      if (node.getAttribute('style')) svg.setAttribute('style', node.getAttribute('style'));
      if (node.getAttribute('title')) svg.setAttribute('title', node.getAttribute('title'));
      node.parentNode.replaceChild(svg, node);
    });
  };

  /* ------------------------------------------------------------------
     4. Theme (light / dark) — persisted, respects OS preference
     ------------------------------------------------------------------ */

  IH.theme = {
    KEY: 'theme',
    get: function () { return document.documentElement.getAttribute('data-theme') || 'light'; },
    systemPref: function () {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    apply: function (mode, persist) {
      var value = mode === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', value);
      var meta = qs('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', value === 'dark' ? '#120D14' : '#FDFAFB');
      qsa('[data-theme-toggle]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', value === 'dark' ? 'true' : 'false');
        btn.setAttribute('aria-label', value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('title', value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      });
      if (persist !== false) IH.store.set(this.KEY, value);
      document.dispatchEvent(new CustomEvent('ih:themechange', { detail: { theme: value } }));
    },
    toggle: function () { this.apply(this.get() === 'dark' ? 'light' : 'dark'); },
    init: function () {
      var saved = IH.store.get(this.KEY, null);
      this.apply(saved || this.systemPref(), !!saved);

      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var handler = function (evt) {
          // Only follow the OS while the visitor has not made an explicit choice.
          if (IH.store.get(IH.theme.KEY, null) === null) IH.theme.apply(evt.matches ? 'dark' : 'light', false);
        };
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq.addListener) mq.addListener(handler);
      }

      qsa('[data-theme-toggle]').forEach(function (btn) {
        on(btn, 'click', function () { IH.theme.toggle(); });
      });
    }
  };

  // Applied as early as possible (also inlined in <head>) to avoid a flash.
  (function preTheme() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(IH.config.storagePrefix + 'theme'));
      var mode = saved || ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', mode);
    } catch (err) { /* default light */ }
  })();

  /* ------------------------------------------------------------------
     5. Toast notifications
     ------------------------------------------------------------------ */

  IH.toast = (function () {
    var region;

    function ensureRegion() {
      if (region && document.body.contains(region)) return region;
      region = qs('.toast-region');
      if (!region) {
        region = el('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false' });
        // Insert ahead of the back-to-top button so the CSS sibling rule that
        // lifts that button clear of a toast stack can actually match.
        var toTop = qs('.to-top');
        if (toTop) document.body.insertBefore(region, toTop);
        else document.body.appendChild(region);
      }
      return region;
    }

    function show(message, opts) {
      opts = opts || {};
      var type = opts.type || 'success';
      var iconName = { success: 'check-circle', info: 'info', warning: 'alert-circle', error: 'alert-circle' }[type] || 'info';

      var node = el('div', { class: 'toast toast--' + type, role: type === 'error' ? 'alert' : null });
      node.innerHTML =
        '<span class="toast__icon">' + IH.icon(iconName, 15) + '</span>' +
        '<div class="toast__body">' +
        (opts.title ? '<div class="toast__title">' + escapeHtml(opts.title) + '</div>' : '') +
        '<div class="toast__msg">' + escapeHtml(message) + '</div>' +
        '</div>' +
        '<button class="toast__close" type="button" aria-label="Dismiss notification">' + IH.icon('close', 16) + '</button>';

      var host = ensureRegion();
      host.appendChild(node);

      var timer;
      function dismiss() {
        clearTimeout(timer);
        node.classList.add('is-leaving');
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 240);
      }

      on(qs('.toast__close', node), 'click', dismiss);
      on(node, 'mouseenter', function () { clearTimeout(timer); });
      on(node, 'mouseleave', function () { timer = setTimeout(dismiss, 2600); });
      timer = setTimeout(dismiss, opts.duration || 4200);

      // Never let toasts pile up beyond a readable stack.
      var extras = qsa('.toast', host);
      if (extras.length > 4) extras.slice(0, extras.length - 4).forEach(function (old) {
        if (old.parentNode) old.parentNode.removeChild(old);
      });

      return dismiss;
    }

    return {
      show: show,
      success: function (m, o) { return show(m, Object.assign({ type: 'success' }, o || {})); },
      info:    function (m, o) { return show(m, Object.assign({ type: 'info' }, o || {})); },
      warning: function (m, o) { return show(m, Object.assign({ type: 'warning' }, o || {})); },
      error:   function (m, o) { return show(m, Object.assign({ type: 'error' }, o || {})); }
    };
  })();

  /* ------------------------------------------------------------------
     6. Modals — focus trapped, ESC / backdrop close, scroll lock
     ------------------------------------------------------------------ */

  IH.modal = (function () {
    var openStack = [];
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function lockScroll(lock) {
      if (lock) {
        var pad = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (pad > 0) document.body.style.paddingRight = pad + 'px';
      } else if (!openStack.length) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }

    function trap(evt, dialog) {
      if (evt.key !== 'Tab') return;
      var items = qsa(FOCUSABLE, dialog).filter(function (n) { return n.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (evt.shiftKey && document.activeElement === first) { evt.preventDefault(); last.focus(); }
      else if (!evt.shiftKey && document.activeElement === last) { evt.preventDefault(); first.focus(); }
    }

    function open(target) {
      var node = typeof target === 'string' ? qs(target) : target;
      if (!node || node.classList.contains('is-open')) return null;

      var record = { node: node, lastFocus: document.activeElement, keyHandler: null };
      node.classList.add('is-open');
      node.removeAttribute('aria-hidden');
      openStack.push(record);
      lockScroll(true);

      record.keyHandler = function (evt) {
        if (evt.key === 'Escape') { evt.preventDefault(); close(node); }
        else trap(evt, qs('.modal__dialog', node) || node);
      };
      document.addEventListener('keydown', record.keyHandler);

      var focusTarget = qs('[data-autofocus]', node) || qs('.modal__close', node) || qs(FOCUSABLE, node);
      if (focusTarget) setTimeout(function () { focusTarget.focus(); }, 60);

      node.dispatchEvent(new CustomEvent('ih:modalopen'));
      return node;
    }

    function close(target) {
      var node = typeof target === 'string' ? qs(target) : target;
      if (!node) { var top = openStack[openStack.length - 1]; node = top && top.node; }
      if (!node) return;

      var idx = -1;
      openStack.forEach(function (r, i) { if (r.node === node) idx = i; });
      if (idx === -1) return;

      var record = openStack.splice(idx, 1)[0];
      node.classList.remove('is-open');
      node.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', record.keyHandler);
      lockScroll(false);
      if (record.lastFocus && record.lastFocus.focus) record.lastFocus.focus();
      node.dispatchEvent(new CustomEvent('ih:modalclose'));
    }

    function init() {
      qsa('.modal').forEach(function (node) {
        if (!node.classList.contains('is-open')) node.setAttribute('aria-hidden', 'true');
        on(node, 'mousedown', function (evt) { if (evt.target === node) close(node); });
      });

      document.addEventListener('click', function (evt) {
        var opener = evt.target.closest && evt.target.closest('[data-modal-open]');
        if (opener) { evt.preventDefault(); open(opener.getAttribute('data-modal-open')); return; }
        var closer = evt.target.closest && evt.target.closest('[data-modal-close]');
        if (closer) {
          evt.preventDefault();
          var sel = closer.getAttribute('data-modal-close');
          close(sel ? sel : closer.closest('.modal'));
        }
      });
    }

    return { open: open, close: close, init: init };
  })();

  /* ------------------------------------------------------------------
     7. Confetti burst (decorative reward on success)
     ------------------------------------------------------------------ */

  IH.confetti = function (count) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.documentElement.getAttribute('data-motion') === 'off') return;

    var colors = ['#DB2777', '#9333EA', '#D9A93F', '#F472B6', '#22C55E', '#38BDF8'];
    var layer = el('div', { class: 'confetti-layer', 'aria-hidden': 'true' });
    var n = count || 44;

    for (var i = 0; i < n; i++) {
      layer.appendChild(el('span', {
        class: 'confetti-piece',
        style: 'left:' + (Math.random() * 100).toFixed(2) + '%;' +
               'background:' + colors[i % colors.length] + ';' +
               '--dur:' + (2 + Math.random() * 1.8).toFixed(2) + 's;' +
               '--delay:' + (Math.random() * 0.5).toFixed(2) + 's;' +
               'width:' + (6 + Math.random() * 6).toFixed(0) + 'px;' +
               'height:' + (10 + Math.random() * 8).toFixed(0) + 'px;'
      }));
    }

    document.body.appendChild(layer);
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 4800);
  };

  /* ------------------------------------------------------------------
     8. Scroll reveal
     ------------------------------------------------------------------ */

  function initReveal() {
    var targets = qsa('[data-reveal]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (n) { n.classList.add('is-revealed'); });
      return;
    }

    document.documentElement.classList.add('js-reveal-ready');

    // Give grouped children an incremental delay so they cascade.
    qsa('[data-reveal-group]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (n) { observer.observe(n); });

    // Anything already on screen at load reveals immediately.
    requestAnimationFrame(function () {
      targets.forEach(function (n) {
        var box = n.getBoundingClientRect();
        if (box.top < window.innerHeight * 0.92) n.classList.add('is-revealed');
      });
    });
  }

  IH.observeReveal = function (nodes) {
    if (!document.documentElement.classList.contains('js-reveal-ready')) return;
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    nodes.forEach(function (n) { observer.observe(n); });
  };

  /* ------------------------------------------------------------------
     9. Navigation (drawer + sticky header + active link)
     ------------------------------------------------------------------ */

  function initNav() {
    var header = qs('.site-header');
    var toggle = qs('.nav__toggle');
    var list = qs('.nav__list');
    var backdrop = qs('.nav__backdrop');

    if (header) {
      var onScroll = throttle(function () {
        header.classList.toggle('is-stuck', window.scrollY > 8);
      }, 100);
      on(window, 'scroll', onScroll, { passive: true });
      onScroll();
    }

    function setDrawer(open) {
      if (!list || !toggle) return;
      list.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (backdrop) backdrop.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var firstLink = qs('.nav__link', list);
        if (firstLink) setTimeout(function () { firstLink.focus(); }, 120);
      }
    }

    on(toggle, 'click', function () {
      setDrawer(toggle.getAttribute('aria-expanded') !== 'true');
    });
    on(backdrop, 'click', function () { setDrawer(false); });

    // The drawer sits over the hamburger once open, so it carries its own
    // close button. Focus goes back to the toggle that opened it.
    on(qs('[data-nav-close]'), 'click', function () {
      setDrawer(false);
      if (toggle) toggle.focus();
    });

    on(document, 'keydown', function (evt) {
      if (evt.key === 'Escape' && list && list.classList.contains('is-open')) {
        setDrawer(false);
        toggle.focus();
      }
    });

    qsa('.nav__link, .nav__drawer-cta .btn').forEach(function (link) {
      on(link, 'click', function () { setDrawer(false); });
    });

    on(window, 'resize', debounce(function () {
      if (window.innerWidth > 1100 && list && list.classList.contains('is-open')) setDrawer(false);
    }, 200));

    // Mark the current page in the nav based on the file name.
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    qsa('.nav__link').forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
      if (href && href === here) link.setAttribute('aria-current', 'page');
    });
  }

  /* ------------------------------------------------------------------
     10. Back to top
     ------------------------------------------------------------------ */

  function initBackToTop() {
    var btn = qs('.to-top');
    if (!btn) return;
    var onScroll = throttle(function () {
      btn.classList.toggle('is-visible', window.scrollY > 520);
    }, 160);
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();
    on(btn, 'click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var skip = qs('.skip-link') || qs('.nav__brand');
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------
     11. FAQ accordion
     ------------------------------------------------------------------ */

  function initAccordions() {
    qsa('.faq-list').forEach(function (list) {
      var single = list.hasAttribute('data-accordion-single');

      qsa('.faq-item', list).forEach(function (item) {
        var trigger = qs('.faq-item__trigger', item);
        var panel = qs('.faq-item__panel', item);
        if (!trigger || !panel) return;

        if (!panel.id) panel.id = 'faq-panel-' + Math.random().toString(36).slice(2, 8);
        if (!trigger.id) trigger.id = panel.id + '-trigger';
        trigger.setAttribute('aria-controls', panel.id);
        trigger.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', trigger.id);

        on(trigger, 'click', function () {
          var willOpen = !item.classList.contains('is-open');
          if (single && willOpen) {
            qsa('.faq-item.is-open', list).forEach(function (other) {
              other.classList.remove('is-open');
              qs('.faq-item__trigger', other).setAttribute('aria-expanded', 'false');
            });
          }
          item.classList.toggle('is-open', willOpen);
          trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
      });
    });

    // FAQ search (present on faq.html)
    var faqSearch = qs('[data-faq-search]');
    if (faqSearch) {
      var faqEmpty = qs('[data-faq-empty]');
      on(faqSearch, 'input', debounce(function () {
        var term = faqSearch.value.trim().toLowerCase();
        var shown = 0;
        qsa('.faq-item').forEach(function (item) {
          var match = !term || item.textContent.toLowerCase().indexOf(term) !== -1;
          item.hidden = !match;
          if (match) shown++;
        });
        qsa('[data-faq-group]').forEach(function (group) {
          group.hidden = !qsa('.faq-item:not([hidden])', group).length;
        });
        if (faqEmpty) faqEmpty.hidden = shown > 0;
      }, 160));
    }
  }

  /* ------------------------------------------------------------------
     12. Form validation (shared by contact + create wizard)
     ------------------------------------------------------------------ */

  IH.validate = {
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()); },
    phone: function (v) { return /^[+]?[\d\s()-]{7,18}$/.test(String(v).trim()); },
    url: function (v) { return /^https?:\/\/[^\s]+$/i.test(String(v).trim()); },

    setError: function (input, message) {
      var field = input.closest('.field');
      if (!field) return;
      field.classList.add('has-error');
      var box = qs('.field__error', field);
      if (box) box.innerHTML = IH.icon('alert-circle', 14) + '<span>' + escapeHtml(message) + '</span>';
      input.setAttribute('aria-invalid', 'true');
      if (box && box.id) input.setAttribute('aria-describedby', box.id);
    },

    clearError: function (input) {
      var field = input.closest('.field');
      if (!field) return;
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
    },

    /* Validates one control; returns true when valid. */
    field: function (input) {
      var value = (input.value || '').trim();
      var required = input.hasAttribute('required');
      var label = input.getAttribute('data-label') || (qs('.field__label', input.closest('.field') || document) || {}).textContent || 'This field';
      label = String(label).replace('*', '').trim();

      if (required && !value) {
        /* A field may carry its own wording for the empty case (e.g.
           "Please enter the parents' names."); otherwise the label +
           "is required." reads fine. */
        var reqMsg = input.getAttribute('data-required-message');
        this.setError(input, reqMsg || (label + ' is required.')); return false;
      }
      if (!value) { this.clearError(input); return true; }

      if (input.type === 'email' && !this.email(value)) { this.setError(input, 'Enter a valid email address.'); return false; }
      if (input.type === 'tel' && !this.phone(value)) { this.setError(input, 'Enter a valid phone number.'); return false; }
      if (input.type === 'url' && !this.url(value)) { this.setError(input, 'Enter a full URL starting with https://'); return false; }

      var min = parseInt(input.getAttribute('minlength'), 10);
      if (min && value.length < min) { this.setError(input, label + ' needs at least ' + min + ' characters.'); return false; }

      this.clearError(input);
      return true;
    },

    /* Validates every control inside a container; focuses the first failure. */
    scope: function (container) {
      var inputs = qsa('input, select, textarea', container).filter(function (n) {
        return n.type !== 'hidden' && n.type !== 'file' && !n.disabled && n.offsetParent !== null;
      });
      var firstBad = null;
      inputs.forEach(function (input) {
        if (!IH.validate.field(input) && !firstBad) firstBad = input;
      });
      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return !firstBad;
    }
  };

  function initForms() {
    // Live-clear errors while the visitor types, re-check on blur.
    document.addEventListener('input', function (evt) {
      var t = evt.target;
      if (!t.matches || !t.matches('.input, .select, .textarea')) return;
      var field = t.closest('.field');
      if (field && field.classList.contains('has-error')) IH.validate.field(t);
    });

    document.addEventListener('blur', function (evt) {
      var t = evt.target;
      if (t.matches && t.matches('.input, .select, .textarea') && (t.value || '').trim()) IH.validate.field(t);
    }, true);

    // Demo forms: no backend, so confirm locally and explain what happens.
    qsa('form[data-demo-form]').forEach(function (form) {
      on(form, 'submit', function (evt) {
        evt.preventDefault();
        if (!IH.validate.scope(form)) {
          IH.toast.error('Please fix the highlighted fields and try again.', { title: 'Almost there' });
          return;
        }

        var btn = qs('[type="submit"]', form);
        var original = btn ? btn.innerHTML : '';
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = IH.icon('rotate-ccw', 18, 'animate-spin') + '<span>Sending…</span>';
        }

        // Simulated round-trip. A backend build swaps this for a fetch().
        setTimeout(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = original; }
          form.reset();
          var success = qs('[data-form-success]', form.parentNode) || qs('[data-form-success]');
          if (success) {
            success.hidden = false;
            success.setAttribute('tabindex', '-1');
            success.focus();
            success.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          IH.toast.success(
            form.getAttribute('data-demo-form') || 'Message received. This demo does not send email yet.',
            { title: 'Thank you!' }
          );
          IH.confetti(30);
        }, 900);
      });
    });
  }

  /* ------------------------------------------------------------------
     13. Lazy images + graceful fallback
     ------------------------------------------------------------------ */

  function initImages() {
    qsa('img').forEach(function (img) {
      if (!img.hasAttribute('loading') && !img.hasAttribute('data-eager')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      on(img, 'error', function () {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = '1';
        img.style.background = 'var(--surface-2)';
        img.style.minHeight = '120px';
      });
    });
  }

  /* ------------------------------------------------------------------
     14. Misc: current year, external links, motion switch
     ------------------------------------------------------------------ */

  function initMisc() {
    qsa('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

    qsa('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (rel.indexOf('noopener') === -1) rel.push('noopener');
      if (rel.indexOf('noreferrer') === -1) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
    });

    // Anything explicitly marked as a "coming soon" action.
    document.addEventListener('click', function (evt) {
      var node = evt.target.closest && evt.target.closest('[data-soon]');
      if (!node) return;
      evt.preventDefault();
      IH.toast.info(node.getAttribute('data-soon') || 'Not available yet.', { title: 'Coming soon' });
    });

    var motionPref = IH.store.get('motion', null);
    if (motionPref === 'off') document.documentElement.setAttribute('data-motion', 'off');
  }

  /* ------------------------------------------------------------------
     15. Boot
     ------------------------------------------------------------------ */

  function boot() {
    IH.theme.init();
    IH.hydrateIcons();
    initNav();
    IH.modal.init();
    initAccordions();
    initForms();
    initImages();
    initBackToTop();
    initReveal();
    initMisc();
    document.dispatchEvent(new CustomEvent('ih:ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
