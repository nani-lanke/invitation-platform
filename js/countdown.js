/* ==========================================================================
   InviteHub — countdown.js
   A single shared ticker drives every countdown on the page, so ten
   invitations on screen still cost one interval.

   Markup contract:
     <div data-countdown="2026-12-25T18:30">
       <div class="cd-unit"><span class="cd-value" data-cd="days">--</span>
            <span class="cd-label">Days</span></div>
       ... hours / minutes / seconds ...
     </div>
   Optional: data-countdown-done="Message shown once the date passes"
   ========================================================================== */

(function (window, document) {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;
  var qs = dom.qs, qsa = dom.qsa;

  var registry = [];
  var timer = null;

  /* ------------------------------------------------------------------
     Date parsing — accepts "YYYY-MM-DD", "YYYY-MM-DDTHH:mm" and ISO
     strings. Bare dates are read as local midnight (not UTC), which is
     what a host entering "25 December" actually means.
     ------------------------------------------------------------------ */

  function parseTarget(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

    var str = String(value).trim();
    var m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      return new Date(
        parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10),
        m[4] ? parseInt(m[4], 10) : 0,
        m[5] ? parseInt(m[5], 10) : 0,
        m[6] ? parseInt(m[6], 10) : 0
      );
    }

    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  function breakdown(ms) {
    if (ms < 0) ms = 0;
    var totalSeconds = Math.floor(ms / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor(totalSeconds / 3600) % 24,
      minutes: Math.floor(totalSeconds / 60) % 60,
      seconds: totalSeconds % 60,
      total: ms
    };
  }

  function pad(n, width) {
    var str = String(n);
    while (str.length < (width || 2)) str = '0' + str;
    return str;
  }

  /* ------------------------------------------------------------------
     Instance
     ------------------------------------------------------------------ */

  function makeInstance(root) {
    var target = parseTarget(root.getAttribute('data-countdown'));
    var doneMessage = root.getAttribute('data-countdown-done') || 'This event has taken place.';
    var slots = {};

    ['days', 'hours', 'minutes', 'seconds'].forEach(function (unit) {
      var node = qs('[data-cd="' + unit + '"]', root);
      if (node) slots[unit] = { node: node, last: null };
    });

    var live = qs('[data-cd-live]', root);
    var finished = false;

    function write(unit, value) {
      var slot = slots[unit];
      if (!slot) return;
      var text = unit === 'days' ? String(value) : pad(value);
      if (slot.last === text) return;
      slot.last = text;
      slot.node.textContent = text;
      // Restart the flip animation without a layout thrash.
      slot.node.classList.remove('is-ticking');
      void slot.node.offsetWidth;
      slot.node.classList.add('is-ticking');
    }

    function tick(now) {
      if (!target) {
        Object.keys(slots).forEach(function (u) { slots[u].node.textContent = u === 'days' ? '0' : '00'; });
        return true; // nothing to do, drop from the registry
      }

      var diff = target.getTime() - now;

      if (diff <= 0) {
        if (!finished) {
          finished = true;
          ['days', 'hours', 'minutes', 'seconds'].forEach(function (u) { write(u, 0); });
          root.classList.add('is-finished');
          root.setAttribute('data-state', 'finished');
          var msg = qs('[data-cd-message]', root);
          if (msg) { msg.textContent = doneMessage; msg.hidden = false; }
          root.dispatchEvent(new CustomEvent('ih:countdownend', { bubbles: true }));
        }
        return true;
      }

      root.classList.remove('is-finished');
      root.setAttribute('data-state', 'running');

      var parts = breakdown(diff);
      write('days', parts.days);
      write('hours', parts.hours);
      write('minutes', parts.minutes);
      write('seconds', parts.seconds);

      // Screen readers get a low-frequency summary rather than every second.
      if (live && parts.seconds === 0) {
        live.textContent = parts.days + ' days, ' + parts.hours + ' hours and ' +
          parts.minutes + ' minutes remaining.';
      }

      return false;
    }

    return { root: root, tick: tick };
  }

  /* ------------------------------------------------------------------
     Shared loop
     ------------------------------------------------------------------ */

  function loop() {
    var now = Date.now();
    for (var i = registry.length - 1; i >= 0; i--) {
      var inst = registry[i];
      if (!document.body.contains(inst.root)) { registry.splice(i, 1); continue; }
      if (inst.tick(now)) registry.splice(i, 1);
    }
    if (!registry.length) { clearInterval(timer); timer = null; }
  }

  function start() {
    if (timer || !registry.length) return;
    loop();
    timer = setInterval(loop, 1000);
  }

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */

  IH.countdown = {
    /* Register every [data-countdown] inside `root` that is not yet tracked. */
    mount: function (root) {
      qsa('[data-countdown]', root || document).forEach(function (node) {
        var already = registry.some(function (inst) { return inst.root === node; });
        if (already) return;
        registry.push(makeInstance(node));
      });
      start();
      return registry.length;
    },

    /* Point an existing element at a new date (used by the live editor). */
    set: function (node, value) {
      if (!node) return;
      node.setAttribute('data-countdown', value || '');
      for (var i = registry.length - 1; i >= 0; i--) {
        if (registry[i].root === node) registry.splice(i, 1);
      }
      registry.push(makeInstance(node));
      start();
    },

    /* Build the four-unit markup used inside invitations. */
    markup: function (isoValue, extraClass) {
      var units = [['days', 'Days'], ['hours', 'Hours'], ['minutes', 'Minutes'], ['seconds', 'Seconds']];
      return '<div class="invitation__countdown' + (extraClass ? ' ' + extraClass : '') + '" ' +
        'data-countdown="' + dom.escapeHtml(isoValue || '') + '" role="timer" aria-label="Time remaining until the event">' +
        units.map(function (u) {
          return '<div class="cd-unit">' +
            '<span class="cd-value" data-cd="' + u[0] + '">' + (u[0] === 'days' ? '0' : '00') + '</span>' +
            '<span class="cd-label">' + u[1] + '</span>' +
          '</div>';
        }).join('') +
        '<span class="sr-only" data-cd-live aria-live="polite"></span>' +
        '</div>';
    },

    parse: parseTarget,
    breakdown: breakdown,

    /* "in 4 months" / "3 days ago" — used in listings and admin-style copy. */
    relative: function (value) {
      var target = parseTarget(value);
      if (!target) return '';
      var diff = target.getTime() - Date.now();
      var past = diff < 0;
      var parts = breakdown(Math.abs(diff));
      var text;
      if (parts.days >= 365) text = Math.floor(parts.days / 365) + ' year' + (parts.days >= 730 ? 's' : '');
      else if (parts.days >= 30) text = Math.floor(parts.days / 30) + ' month' + (parts.days >= 60 ? 's' : '');
      else if (parts.days >= 1) text = parts.days + ' day' + (parts.days > 1 ? 's' : '');
      else if (parts.hours >= 1) text = parts.hours + ' hour' + (parts.hours > 1 ? 's' : '');
      else text = Math.max(parts.minutes, 1) + ' minute' + (parts.minutes > 1 ? 's' : '');
      return past ? text + ' ago' : 'in ' + text;
    }
  };

  /* Pause the ticker while the tab is hidden, then resync on return. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearInterval(timer); timer = null; }
    else start();
  });

  function boot() { IH.countdown.mount(document); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
