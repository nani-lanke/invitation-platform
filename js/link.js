/* ====================================================================
   link.js — the invitation, carried inside its own URL

   GitHub Pages is static hosting: nothing can write a file when a host
   finishes their invitation. So the invitation does not become a file on
   the server — it becomes a link. Every detail is packed into the part of
   the URL after the "#", and i.html unpacks it and renders the card.

       …/i.html#eyJlIjoid2VkZGluZyIsImIiOiJTYW5kaHlhIiwiZyI6Ik1vaGFuIn0

   The fragment never reaches a server, so nothing has to store it, and the
   link works the moment the site is deployed.

   Public surface:
     IH.link.encode(state)  -> the fragment string
     IH.link.decode(str)    -> a state object, or null if unreadable
     IH.link.build(state)   -> the full absolute URL to send to guests
     IH.link.read()         -> decode the current page's own fragment
   ==================================================================== */

(function (window, document) {
  'use strict';

  var IH = window.IH || (window.IH = {});

  var PAGE = 'i.html';

  /* Short keys keep the link sendable. Anything not listed is dropped —
     which also stops editor-only fields (step, plan, updatedAt) leaking
     into a guest's URL. */
  var FIELDS = {
    eventType: 'e', template: 't', title: 'ti', hostName: 'h',
    brideName: 'b', groomName: 'g', personName: 'p',
    date: 'd', time: 'tm', venue: 'v', address: 'a', mapsUrl: 'm',
    phone: 'ph', email: 'em', message: 'ms',
    font: 'f', colors: 'c', customColors: 'cc', animation: 'an',
    showCountdown: 'sc', showRsvp: 'sr', showMaps: 'sm', showGallery: 'sg',
    photo: 'pt', background: 'bg', gallery: 'gl'
  };

  var REVERSE = {};
  Object.keys(FIELDS).forEach(function (long) { REVERSE[FIELDS[long]] = long; });

  /* A data: URL is a whole photo inline — far too big for a link, and
     WhatsApp would truncate it. Only real paths travel. */
  function isPortable(value) {
    return typeof value === 'string' && value && value.slice(0, 5) !== 'data:';
  }

  /* --- base64url over UTF-8 ------------------------------------------ */

  function toBase64Url(text) {
    var bytes = window.unescape(window.encodeURIComponent(text));
    return window.btoa(bytes)
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(text) {
    var padded = String(text).replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    return window.decodeURIComponent(window.escape(window.atob(padded)));
  }

  /* --- encode / decode ------------------------------------------------ */

  function encode(state) {
    var small = {};

    Object.keys(FIELDS).forEach(function (long) {
      var value = state[long];
      if (value === undefined || value === null || value === '') return;
      if (value === false) return;                       // defaults are true
      if (Array.isArray(value)) {
        var keep = value.filter(isPortable);
        if (keep.length) small[FIELDS[long]] = keep;
        return;
      }
      if (long === 'photo' || long === 'background') {
        if (isPortable(value)) small[FIELDS[long]] = value;
        return;
      }
      small[FIELDS[long]] = value;
    });

    return toBase64Url(JSON.stringify(small));
  }

  function decode(fragment) {
    if (!fragment) return null;
    var raw = String(fragment).replace(/^#/, '').replace(/^i=/, '');
    if (!raw) return null;

    try {
      var small = JSON.parse(fromBase64Url(raw));
      if (!small || typeof small !== 'object') return null;

      var state = {};
      Object.keys(small).forEach(function (short) {
        var long = REVERSE[short];
        if (long) state[long] = small[short];
      });
      return state;
    } catch (err) {
      return null;                                        // truncated or edited
    }
  }

  /* --- URLs ----------------------------------------------------------- */

  function build(state) {
    // Resolved against the current page, so it is correct both locally and
    // under a GitHub Pages subpath (…/InviteHub/i.html).
    var base = location.href.replace(/[^/]*(\?.*)?(#.*)?$/, '') + PAGE;
    return base + '#' + encode(state);
  }

  function read() {
    return decode(location.hash);
  }

  IH.link = {
    PAGE: PAGE,
    encode: encode,
    decode: decode,
    build: build,
    read: read
  };
})(window, document);
