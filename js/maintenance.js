/* ====================================================================
   js/maintenance.js — server maintenance settings (edit these)

   Shared by index.html (countdown bar) and api/order.js (stops
   payments while maintenance is running). Keep the +05:30 in SET_AT so
   the browser and the server read the same Indian time.
   ==================================================================== */

(function (root) {
  var MAINTENANCE = {
    ON: false,                            // true = maintenance scheduled, false = nothing
    SET_AT: '2026-10-30T18:00:00+05:30', // when you turned it on (IST)
    STARTS_IN: 12,                       // hours after SET_AT that maintenance starts
    DURATION: 2                          // hours maintenance lasts (payments stopped)
  };

  var HOUR = 3600000;

  /* Returns { phase: 'off' | 'upcoming' | 'active', start, end } */
  MAINTENANCE.status = function (now) {
    now = now || Date.now();
    var start = new Date(MAINTENANCE.SET_AT).getTime() + MAINTENANCE.STARTS_IN * HOUR;
    var end = start + MAINTENANCE.DURATION * HOUR;
    var phase = 'off';
    if (MAINTENANCE.ON && !isNaN(start) && now < end) phase = now < start ? 'upcoming' : 'active';
    return { phase: phase, start: start, end: end };
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = MAINTENANCE; return; }
  root.MAINTENANCE = MAINTENANCE;

  /* Browser: orange countdown bar at the bottom of the page. */
  function showBar() {
    if (MAINTENANCE.status().phase === 'off') return;

    var bar = document.createElement('div');
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:10px 16px;text-align:center;color:#fff;font:600 15px/1.4 inherit;box-shadow:0 -4px 16px rgba(0,0,0,.2)';
    document.body.appendChild(bar);

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function fmt(ms) {
      var t = Math.max(0, Math.floor(ms / 1000));
      return pad(Math.floor(t / 3600)) + ':' + pad(Math.floor(t / 60) % 60) + ':' + pad(t % 60);
    }
    function tick() {
      var now = Date.now();
      var st = MAINTENANCE.status(now);
      if (st.phase === 'off') { bar.remove(); document.body.style.paddingBottom = ''; clearInterval(timer); return; }
      if (st.phase === 'upcoming') {
        bar.style.background = '#f97316';
        bar.innerHTML = '&#9888; Server maintenance starts in <b>' + fmt(st.start - now) + '</b> &middot; payments will be paused for ' + MAINTENANCE.DURATION + ' hours';
      } else {
        bar.style.background = '#c2410c';
        bar.innerHTML = '&#128295; Maintenance in progress &middot; payments are not accepted right now &middot; back in <b>' + fmt(st.end - now) + '</b>';
      }
      document.body.style.paddingBottom = bar.offsetHeight + 'px';
    }
    var timer = setInterval(tick, 1000);
    tick();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBar);
  else showBar();
})(this);
