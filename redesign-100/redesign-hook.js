/* Feeds a redesigned working copy into the project's own renderer.
   Loaded just before preview.js; when preview.js assigns IH.invitation the
   setter below wraps IH.invitation.mount (preview.js boots immediately), and keeps the original sample data (names, dates, venue,
   families, wording) untouched and only adds the redesign's image mappings:
   venueImage, assetPrefix (-> crest at images/wedding-motifs/<slug>.svg) and
   the corner/footer layers declared in cards/<slug>/design.js. */
(function () {
  var IH = window.IH, api;
  Object.defineProperty(IH, 'invitation', {
    configurable: true, enumerable: true,
    get: function () { return api; },
    set: function (v) { api = v; wrap(v); }
  });
  function wrap(inv) {
  var orig = inv.mount;
  inv.mount = function (host, data) {
    window.RD_ORIGINAL_DATA = JSON.parse(JSON.stringify(data));
    var d = window.RD_ON && window.RD_DESIGN;
    if (d) {
      data.venueImage = d.base + d.images.venue;
      data.assetPrefix = d.base;
    }
    var res = orig.call(this, host, data);
    var art = host.querySelector('.invitation');
    if (d && art) {
      art.classList.add('rd-card');
      if (d.images.cornerTL) {
        art.classList.add('rd-has-corner');
        art.style.setProperty('--rd-tl', 'url("' + d.base + d.images.cornerTL + '")');
        art.style.setProperty('--rd-tr', 'url("' + d.base + d.images.cornerTR + '")');
      }
      art.style.setProperty('--rd-footer', 'url("' + d.base + d.images.footer + '")');
      art.setAttribute('data-rd-slug', d.slug);
    }
    window.RD_RENDERED = true;
    return res;
  };
  }
})();
