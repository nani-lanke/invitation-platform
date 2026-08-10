/* ====================================================================
   publish.js — the invitation as a real page at its own address

   js/link.js carries an invitation inside its own URL, which needs no
   deployment but leaves a base64 blob in the address bar. This module
   covers the other shape: a folder committed to the repository, so the
   invitation lives at a URL a person can read aloud.

       https://USER.github.io/REPO/invitation_card/Groom_Bride_2026-08-10_1830.html

   GitHub Pages serves whatever is in the repository, so that address is
   real — HTTP 200, and WhatsApp and Facebook can read its preview tags,
   which the fragment link can never offer.

   A browser cannot write a folder into your downloads, so the folder is
   handed over as a .zip you unpack at the root of the repository. The
   ZIP is written here by hand (stored, uncompressed) to keep the site
   free of dependencies, like the rest of the project.

   Public surface:
     IH.publish.slug(state)   -> { base, file, url } — the shared stem
     IH.publish.files(state)  -> [{ path, bytes }] — the folder's contents
     IH.publish.download(state) -> saves the .zip
   ==================================================================== */

(function (window, document) {
  'use strict';

  var IH = window.IH || (window.IH = {});

  var FOLDER = 'invitation_card';
  var MAIN_DIR = 'main_image';
  var MUSIC_DIR = 'background_music';
  var MAX_PART = 50;

  /* data:audio/mpeg;base64,… -> mp3. Falls back to the container most
     phones record, since a wrong extension only affects the filename. */
  var AUDIO_EXT = {
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg',
    'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/webm': 'webm',
    'audio/flac': 'flac'
  };

  function audioExt(dataUrl) {
    var m = /^data:([^;,]+)[;,]/.exec(String(dataUrl));
    return AUDIO_EXT[(m && m[1] || '').toLowerCase()] || 'mp3';
  }

  /* ------------------------------------------------------------------
     1. Naming — what the address will say
     ------------------------------------------------------------------ */

  /* 'O’Brien & Sons' -> 'OBrien-and-Sons'. Case is kept: the names read
     better capitalised, and GitHub Pages serves paths case-sensitively
     either way, so nothing is gained by flattening them. */
  function slugPart(name) {
    var raw = String(name == null ? '' : name);
    if (raw.normalize) raw = raw.normalize('NFKD');

    /* Spaces become dashes first, then everything that is not a letter,
       digit or dash is dropped outright. Doing it in that order is what
       turns "José O'Brien" into "Jose-OBrien" rather than "Jose-O-Brien":
       the accent NFKD split off, and the apostrophe, are simply removed
       instead of being read as a word break. */
    return raw
      .replace(/&/g, ' and ')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_PART)
      .replace(/-+$/, '');                  // in case the cut landed on one
  }

  /* The date already arrives as YYYY-MM-DD, which sorts and reads well in
     a path. An invitation saved before the date is filled in still needs
     somewhere to live. */
  function datePart(state) {
    var d = String((state && state.date) || '');
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : 'undated';
  }

  /* The deployed site's root, worked out from the page asking. Locally
     that is http://localhost:8000/; on Pages it keeps the repository
     subpath (…/InviteHub/), so the URL shown is the URL that will work. */
  function siteRoot() {
    return window.location.href.replace(/[^/]*(\?.*)?(#.*)?$/, '');
  }

  /* Absolute URLs are baked into the committed page, so they are only
     written when the editor is running on the real site. Building an
     invitation from a local preview would otherwise ship og:url pointing
     at localhost, which no guest can reach. */
  function isDeployed() {
    var host = window.location.hostname;
    return window.location.protocol.indexOf('http') === 0 &&
           host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]' &&
           host !== '';
  }

  function timePart(state) {
    var t = String((state && state.time) || '');
    return /^\d{2}:\d{2}$/.test(t) ? t.replace(':', '') : '';
  }

  /* The stem the page and every one of its assets share:

         Groom_Bride_2026-08-10_1830

     Underscores join the parts while dashes stay inside a name, so the
     pieces split back apart cleanly even for someone called Anne-Marie.
     An invitation with no time simply ends at the date. */
  function baseName(state) {
    var s = function (v) { return String(v == null ? '' : v).trim(); };
    var groom = slugPart(s(state.groomName));
    var bride = slugPart(s(state.brideName));

    var who = (groom && bride) ? groom + '_' + bride
            : groom || bride
            || slugPart(s(state.personName))
            || slugPart(s(state.hostName))
            || slugPart(s(state.title))
            || 'Invitation';

    var parts = [who, datePart(state)];
    var time = timePart(state);
    if (time) parts.push(time);
    return parts.join('_');
  }

  function slug(state) {
    var base = baseName(state);
    return {
      base: base,
      names: base,
      date: datePart(state),
      dir: FOLDER,
      file: FOLDER + '/' + base + '.html',
      url: siteRoot() + FOLDER + '/' + base + '.html'
    };
  }

  /* Where api/publish.js will put the page. It builds the same stem, so
     publishing through the server and unpacking the .zip land on exactly
     the same address rather than two near-misses. */
  function page(state) {
    var base = baseName(state);
    return {
      file: base + '.html',
      path: FOLDER + '/' + base + '.html',
      url: siteRoot() + FOLDER + '/' + base + '.html'
    };
  }

  /* ------------------------------------------------------------------
     2. Bytes
     ------------------------------------------------------------------ */

  function utf8(text) {
    if (window.TextEncoder) return new window.TextEncoder().encode(text);

    var binary = window.unescape(window.encodeURIComponent(String(text)));
    var out = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }

  function fromDataUrl(dataUrl) {
    var binary = window.atob(String(dataUrl).split(',')[1] || '');
    var out = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }

  /* ------------------------------------------------------------------
     3. A minimal ZIP writer (stored entries, no compression)

     The payload is one HTML file and a few already-compressed photos, so
     deflate would buy almost nothing and cost a compressor. Every entry
     is written with method 0 and flag bit 11 set, marking names as UTF-8.
     ------------------------------------------------------------------ */

  var CRC_TABLE = (function () {
    var table = new Int32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
    return table;
  })();

  function crc32(bytes) {
    var c = -1;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ -1) >>> 0;
  }

  /* MS-DOS packs a timestamp into two 16-bit words, with two-second
     resolution and 1980 as year zero. */
  function dosTime(date) {
    return ((date.getHours() << 11) | (date.getMinutes() << 5) |
            (date.getSeconds() >> 1)) & 0xFFFF;
  }

  function dosDate(date) {
    var year = Math.max(1980, date.getFullYear()) - 1980;
    return ((year << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xFFFF;
  }

  function zip(entries) {
    var now = new Date();
    var time = dosTime(now), date = dosDate(now);
    var parts = [];        // Uint8Array pieces, concatenated at the end
    var central = [];
    var offset = 0;
    var total = 0;

    function push(bytes) {
      parts.push(bytes);
      offset += bytes.length;
      total += bytes.length;
    }

    entries.forEach(function (entry) {
      var name = utf8(entry.path);
      var body = entry.bytes;
      var sum = crc32(body);
      var start = offset;

      var head = new DataView(new ArrayBuffer(30));
      head.setUint32(0, 0x04034B50, true);   // local file header
      head.setUint16(4, 20, true);           // version needed
      head.setUint16(6, 0x0800, true);       // flags: UTF-8 name
      head.setUint16(8, 0, true);            // method: stored
      head.setUint16(10, time, true);
      head.setUint16(12, date, true);
      head.setUint32(14, sum, true);
      head.setUint32(18, body.length, true); // compressed size
      head.setUint32(22, body.length, true); // uncompressed size
      head.setUint16(26, name.length, true);
      head.setUint16(28, 0, true);           // extra field length

      push(new Uint8Array(head.buffer));
      push(name);
      push(body);

      var dir = new DataView(new ArrayBuffer(46));
      dir.setUint32(0, 0x02014B50, true);    // central directory header
      dir.setUint16(4, 20, true);            // version made by
      dir.setUint16(6, 20, true);            // version needed
      dir.setUint16(8, 0x0800, true);
      dir.setUint16(10, 0, true);
      dir.setUint16(12, time, true);
      dir.setUint16(14, date, true);
      dir.setUint32(16, sum, true);
      dir.setUint32(20, body.length, true);
      dir.setUint32(24, body.length, true);
      dir.setUint16(28, name.length, true);
      dir.setUint16(30, 0, true);            // extra
      dir.setUint16(32, 0, true);            // comment
      dir.setUint16(34, 0, true);            // disk number
      dir.setUint16(36, 0, true);            // internal attributes
      dir.setUint32(38, 0, true);            // external attributes
      dir.setUint32(42, start, true);        // offset of local header

      central.push(new Uint8Array(dir.buffer), name);
    });

    var centralStart = offset;
    central.forEach(push);
    var centralSize = offset - centralStart;

    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054B50, true);      // end of central directory
    end.setUint16(4, 0, true);               // this disk
    end.setUint16(6, 0, true);               // disk with central directory
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, centralStart, true);
    end.setUint16(20, 0, true);              // comment length
    push(new Uint8Array(end.buffer));

    var out = new Uint8Array(total);
    var at = 0;
    parts.forEach(function (part) { out.set(part, at); at += part.length; });
    return out;
  }

  /* ------------------------------------------------------------------
     4. The folder
     ------------------------------------------------------------------ */

  /* Every file that belongs in the repository for this invitation, each
     path already relative to the repository root so unzipping there puts
     everything where it belongs. */
  function files(state) {
    var where = slug(state);

    /* Photos become real files beside the page instead of data URLs inside
       it: the page stays small and a browser can cache them. Each is named
       for the page it belongs to, and sorted into its own folder:

           invitation_card/Groom_Bride_2026-08-10_1830.html
           invitation_card/main_image/…_image.jpg
           invitation_card/background_image/…_background.jpg
           invitation_card/sample_images/…_image1.jpg, …_image2.jpg
           invitation_card/background_music/…_music.mp3

       Those folders sit beside the page, not under it, so the paths the
       page uses are exactly the paths in the zip — no ../ anywhere. */
    var split = IH.exportPage.extractAssets(state, where.base);

    var music = null;
    if (String(state.musicFile || '').slice(0, 11) === 'data:audio/') {
      music = {
        path: MUSIC_DIR + '/' + where.base + '_music.' + audioExt(state.musicFile),
        data: state.musicFile
      };
      split.state.musicFile = music.path;
    }

    /* WhatsApp and Facebook fetch the page with no browser context, so
       og:image has to be an absolute URL. Only a photo the host actually
       uploaded is offered: the stock artwork is SVG, which the preview
       scrapers will not render, so no image beats a broken one. */
    var photo = split.assets.filter(function (a) {
      return a.path.indexOf(MAIN_DIR + '/') === 0;
    })[0] || split.assets[0];

    var out = [{
      path: where.file,
      bytes: utf8(IH.exportPage.buildHtml(split.state, {
        up: '../',
        canonical: isDeployed() ? where.url : '',
        image: photo && isDeployed() ? siteRoot() + FOLDER + '/' + photo.path : ''
      }))
    }];

    split.assets.forEach(function (asset) {
      out.push({ path: FOLDER + '/' + asset.path, bytes: fromDataUrl(asset.data) });
    });

    if (music) {
      out.push({ path: FOLDER + '/' + music.path, bytes: fromDataUrl(music.data) });
    }

    return out;
  }

  /* ------------------------------------------------------------------
     5. Publishing through the server

     Only on a deployment that runs code — api/publish.js renders the
     page and commits it. On GitHub Pages there is no /api, and the
     request comes back as the 404 page, which is caught below and
     explained rather than left as a mystery.

     Fields travel, not markup: the server renders. Sending finished HTML
     would let anyone publish any page at all on the site's own domain.
     ------------------------------------------------------------------ */

  var SEND = [
    'eventType', 'template', 'title', 'hostName', 'brideName', 'groomName',
    'personName', 'years', 'date', 'time', 'venue', 'address', 'mapsUrl', 'phone',
    'email', 'message', 'font', 'colors', 'customColors', 'animation',
    'showCountdown', 'showRsvp', 'showMaps', 'showGallery',
    /* The uploads travel too. The server checks each one's type and size
       and commits them beside the page — see api/_validate.js for the
       ceilings, which exist because Vercel refuses a request body over
       4.5 MB before the function ever runs. */
    'photo', 'background', 'gallery', 'musicFile', 'music'
  ];

  function payload(state) {
    var out = {};
    SEND.forEach(function (key) {
      var value = state[key];
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value) && !value.length) return;
      out[key] = value;
    });
    return out;
  }

  /* Roughly what the request will weigh. Uploads are base64, so the bytes
     on the wire are about a third more than the files themselves — worth
     knowing before the platform rejects the whole request. */
  function payloadSize(state) {
    var total = 0;
    ['photo', 'background', 'musicFile'].forEach(function (k) {
      if (typeof state[k] === 'string') total += state[k].length;
    });
    (state.gallery || []).forEach(function (src) {
      if (typeof src === 'string') total += src.length;
    });
    return total;
  }

  function hasUploads(state) {
    function uploaded(v) { return typeof v === 'string' && v.slice(0, 5) === 'data:'; }
    return uploaded(state.photo) || uploaded(state.background) ||
           uploaded(state.musicFile) || (state.gallery || []).some(uploaded);
  }

  function toServer(state) {
    return fetch('api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload(state))
    }).then(function (res) {
      if (res.status === 404 || res.status === 405) {
        throw new Error('This copy of the site cannot publish — it is served as ' +
                        'static files. Deploy it to Vercel, or use Download page folder.');
      }
      return res.json().catch(function () {
        throw new Error('The server sent back something unreadable.');
      }).then(function (body) {
        if (!res.ok) throw new Error(body.error || 'Publishing failed.');
        return body;
      });
    });
  }

  function download(state) {
    var where = slug(state);
    var entries = files(state);
    var blob = new Blob([zip(entries)], { type: 'application/zip' });

    var name = where.base + '.zip';
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

    return { file: name, dir: where.dir, url: where.url, count: entries.length };
  }

  IH.publish = {
    FOLDER: FOLDER,
    MAIN_DIR: MAIN_DIR,
    slug: slug,
    page: page,
    files: files,
    zip: zip,
    download: download,
    hasUploads: hasUploads,
    payloadSize: payloadSize,
    toServer: toServer
  };
})(window, document);
