/* ==========================================================================
   InviteHub — share.js
   Copy-link, social share targets, the Web Share API, and a dependency-free
   QR code encoder (byte mode, EC level M, versions 1–10).

   The QR encoder is implemented here rather than pulled from a CDN so the
   whole site stays self-contained and works offline on GitHub Pages.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var IH = window.IH || (window.IH = {});
  var dom = IH.dom;
  var qs = dom.qs, qsa = dom.qsa, on = dom.on, escapeHtml = dom.escapeHtml;

  /* ==================================================================
     PART 1 — QR encoder
     ================================================================== */

  var QR = (function () {

    /* --- Galois field GF(256), primitive polynomial 0x11D --- */

    var EXP = new Uint8Array(512);
    var LOG = new Uint8Array(256);

    (function initGF() {
      var x = 1;
      for (var i = 0; i < 255; i++) {
        EXP[i] = x;
        LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11D;
      }
      for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
    })();

    function gfMul(a, b) {
      if (a === 0 || b === 0) return 0;
      return EXP[LOG[a] + LOG[b]];
    }

    /* Reed–Solomon generator polynomial of the given degree. */
    function rsGenerator(degree) {
      var poly = [1];
      for (var d = 0; d < degree; d++) {
        var next = new Array(poly.length + 1).fill(0);
        for (var i = 0; i < poly.length; i++) {
          next[i] ^= poly[i];
          next[i + 1] ^= gfMul(poly[i], EXP[d]);
        }
        poly = next;
      }
      return poly;
    }

    function rsEncode(data, ecLen) {
      var gen = rsGenerator(ecLen);
      var res = new Array(ecLen).fill(0);
      for (var i = 0; i < data.length; i++) {
        var factor = data[i] ^ res[0];
        res.shift();
        res.push(0);
        if (factor !== 0) {
          for (var j = 0; j < gen.length - 1; j++) {
            res[j] ^= gfMul(gen[j + 1], factor);
          }
        }
      }
      return res;
    }

    /* --- Version tables, error-correction level M --- */
    /* [ecCodewordsPerBlock, group1Blocks, group1DataCw, group2Blocks, group2DataCw] */
    var RS_BLOCKS_M = {
      1:  [10, 1, 16, 0, 0],
      2:  [16, 1, 28, 0, 0],
      3:  [26, 1, 44, 0, 0],
      4:  [18, 2, 32, 0, 0],
      5:  [24, 2, 43, 0, 0],
      6:  [16, 4, 27, 0, 0],
      7:  [18, 4, 31, 0, 0],
      8:  [22, 2, 38, 2, 39],
      9:  [22, 3, 36, 2, 37],
      10: [26, 4, 43, 1, 44]
    };

    /* Maximum byte-mode payload per version at level M. */
    var BYTE_CAPACITY_M = { 1: 14, 2: 26, 3: 42, 4: 62, 5: 84, 6: 106, 7: 122, 8: 152, 9: 180, 10: 213 };

    var ALIGNMENT = {
      1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
      6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
    };

    var VERSION_INFO = { 7: 0x07C94, 8: 0x085BC, 9: 0x09A99, 10: 0x0A4D3 };

    /* --- Bit buffer --- */

    function BitBuffer() { this.bits = []; }
    BitBuffer.prototype.put = function (value, length) {
      for (var i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
    };
    BitBuffer.prototype.length = function () { return this.bits.length; };
    BitBuffer.prototype.toBytes = function () {
      var out = [];
      for (var i = 0; i < this.bits.length; i += 8) {
        var byte = 0;
        for (var j = 0; j < 8; j++) byte = (byte << 1) | (this.bits[i + j] || 0);
        out.push(byte);
      }
      return out;
    };

    /* UTF-8 encode without TextEncoder (older Safari on iOS). */
    function utf8Bytes(str) {
      if (window.TextEncoder) return Array.prototype.slice.call(new TextEncoder().encode(str));
      var out = [];
      for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80) out.push(c);
        else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
        else if (c < 0xD800 || c >= 0xE000) { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
        else {
          i++;
          var cp = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
          out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
        }
      }
      return out;
    }

    function pickVersion(byteLength) {
      for (var v = 1; v <= 10; v++) if (byteLength <= BYTE_CAPACITY_M[v]) return v;
      return null;
    }

    /* --- Codeword construction --- */

    function buildCodewords(bytes, version) {
      var spec = RS_BLOCKS_M[version];
      var ecLen = spec[0], g1 = spec[1], d1 = spec[2], g2 = spec[3], d2 = spec[4];
      var totalData = g1 * d1 + g2 * d2;
      var countBits = version >= 10 ? 16 : 8;

      var buf = new BitBuffer();
      buf.put(4, 4);                       // byte mode
      buf.put(bytes.length, countBits);
      for (var i = 0; i < bytes.length; i++) buf.put(bytes[i], 8);

      // Terminator (up to four zero bits) then pad to a byte boundary.
      var capacityBits = totalData * 8;
      var terminator = Math.min(4, capacityBits - buf.length());
      buf.put(0, terminator);
      while (buf.length() % 8 !== 0) buf.put(0, 1);

      var data = buf.toBytes();
      var padBytes = [0xEC, 0x11];
      var p = 0;
      while (data.length < totalData) data.push(padBytes[p++ % 2]);

      // Split into blocks, compute EC per block.
      var blocks = [];
      var offset = 0;
      var b;
      for (b = 0; b < g1; b++) { blocks.push(data.slice(offset, offset + d1)); offset += d1; }
      for (b = 0; b < g2; b++) { blocks.push(data.slice(offset, offset + d2)); offset += d2; }

      var ecBlocks = blocks.map(function (block) { return rsEncode(block, ecLen); });

      // Interleave data codewords, then EC codewords.
      var result = [];
      var maxData = Math.max(d1, d2);
      for (var i2 = 0; i2 < maxData; i2++) {
        for (b = 0; b < blocks.length; b++) {
          if (i2 < blocks[b].length) result.push(blocks[b][i2]);
        }
      }
      for (var e = 0; e < ecLen; e++) {
        for (b = 0; b < ecBlocks.length; b++) result.push(ecBlocks[b][e]);
      }
      return result;
    }

    /* --- Matrix --- */

    function makeMatrix(size) {
      var m = [];
      for (var r = 0; r < size; r++) {
        m.push({ cells: new Int8Array(size).fill(-1) });
      }
      return m;
    }

    function setFunctionPatterns(m, version, size) {
      function place(r, c, value) {
        if (r < 0 || c < 0 || r >= size || c >= size) return;
        m[r].cells[c] = value;
      }

      // Finder patterns + separators
      [[0, 0], [0, size - 7], [size - 7, 0]].forEach(function (pos) {
        var pr = pos[0], pc = pos[1];
        for (var r = -1; r <= 7; r++) {
          for (var c = -1; c <= 7; c++) {
            var rr = pr + r, cc = pc + c;
            if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
            var inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                         (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                         (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            place(rr, cc, inRing ? 1 : 0);
          }
        }
      });

      // Timing patterns
      for (var i = 8; i < size - 8; i++) {
        place(6, i, i % 2 === 0 ? 1 : 0);
        place(i, 6, i % 2 === 0 ? 1 : 0);
      }

      // Alignment patterns
      var centers = ALIGNMENT[version];
      centers.forEach(function (cr) {
        centers.forEach(function (cc) {
          // Skip the three that would collide with finder patterns.
          if ((cr === 6 && cc === 6) ||
              (cr === 6 && cc === size - 7) ||
              (cr === size - 7 && cc === 6)) return;
          for (var r = -2; r <= 2; r++) {
            for (var c = -2; c <= 2; c++) {
              var ring = Math.max(Math.abs(r), Math.abs(c));
              place(cr + r, cc + c, (ring === 1) ? 0 : 1);
            }
          }
        });
      });

      // Dark module
      place(size - 8, 8, 1);

      // Reserve format information areas
      for (var k = 0; k <= 8; k++) {
        if (k !== 6) { place(8, k, 0); place(k, 8, 0); }
      }
      for (var k2 = 0; k2 < 8; k2++) {
        place(8, size - 1 - k2, 0);
        place(size - 1 - k2, 8, 0);
      }

      // Reserve version information (v7+)
      if (version >= 7) {
        for (var a = 0; a < 6; a++) {
          for (var b = 0; b < 3; b++) {
            place(size - 11 + b, a, 0);
            place(a, size - 11 + b, 0);
          }
        }
      }
    }

    function isFunctionModule(reserved, r, c) { return reserved[r][c] === 1; }

    function buildReservedMap(version, size) {
      var probe = makeMatrix(size);
      setFunctionPatterns(probe, version, size);
      var map = [];
      for (var r = 0; r < size; r++) {
        map.push([]);
        for (var c = 0; c < size; c++) map[r].push(probe[r].cells[c] === -1 ? 0 : 1);
      }
      return map;
    }

    function placeData(m, reserved, codewords, size) {
      var bitIndex = 0;
      var totalBits = codewords.length * 8;
      var upward = true;

      for (var col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--; // the vertical timing column is skipped entirely
        for (var step = 0; step < size; step++) {
          var row = upward ? size - 1 - step : step;
          for (var k = 0; k < 2; k++) {
            var c = col - k;
            if (isFunctionModule(reserved, row, c)) continue;
            var bit = 0;
            if (bitIndex < totalBits) {
              bit = (codewords[bitIndex >> 3] >>> (7 - (bitIndex & 7))) & 1;
            }
            m[row].cells[c] = bit;
            bitIndex++;
          }
        }
        upward = !upward;
      }
    }

    var MASKS = [
      function (r, c) { return (r + c) % 2 === 0; },
      function (r) { return r % 2 === 0; },
      function (r, c) { return c % 3 === 0; },
      function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
      function (r, c) { return ((r * c) % 2) + ((r * c) % 3) === 0; },
      function (r, c) { return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; },
      function (r, c) { return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; }
    ];

    function applyMask(m, reserved, maskId, size) {
      var fn = MASKS[maskId];
      for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
          if (isFunctionModule(reserved, r, c)) continue;
          if (fn(r, c)) m[r].cells[c] ^= 1;
        }
      }
    }

    /* BCH(15,5) format information, EC level M = 0b00. */
    function formatBits(maskId) {
      var data = (0 << 3) | maskId;       // 00 = level M
      var value = data << 10;
      for (var i = 4; i >= 0; i--) {
        if ((value >>> (i + 10)) & 1) value ^= 0x537 << i;
      }
      return ((data << 10) | value) ^ 0x5412;
    }

    function drawFormat(m, maskId, size) {
      var bits = formatBits(maskId);
      for (var i = 0; i < 15; i++) {
        var bit = (bits >>> i) & 1;
        // Copy 1 — around the top-left finder
        if (i < 6) m[8].cells[i] = bit;
        else if (i === 6) m[8].cells[7] = bit;
        else if (i === 7) m[8].cells[8] = bit;
        else if (i === 8) m[7].cells[8] = bit;
        else m[14 - i].cells[8] = bit;

        // Copy 2 — bits 0-6 climb the bottom-left finder, bits 7-14 run along
        // the top-right one. The split is at 7, not 8: row size-8 in column 8
        // is the dark module and must not be used for format data.
        if (i < 7) m[size - 1 - i].cells[8] = bit;
        else m[8].cells[size - 15 + i] = bit;
      }
      m[size - 8].cells[8] = 1; // dark module
    }

    function drawVersion(m, version, size) {
      if (version < 7) return;
      var bits = VERSION_INFO[version];
      for (var i = 0; i < 18; i++) {
        var bit = (bits >>> i) & 1;
        var a = Math.floor(i / 3);
        var b = i % 3;
        m[size - 11 + b].cells[a] = bit;
        m[a].cells[size - 11 + b] = bit;
      }
    }

    /* --- Mask penalty scoring (ISO/IEC 18004 §8.8.2) --- */

    function penalty(m, size) {
      var score = 0, r, c, run, prev, dark = 0;

      // Rule 1 — runs of five or more same-coloured modules
      for (r = 0; r < size; r++) {
        run = 1; prev = m[r].cells[0];
        for (c = 1; c < size; c++) {
          if (m[r].cells[c] === prev) run++;
          else { if (run >= 5) score += 3 + (run - 5); run = 1; prev = m[r].cells[c]; }
        }
        if (run >= 5) score += 3 + (run - 5);
      }
      for (c = 0; c < size; c++) {
        run = 1; prev = m[0].cells[c];
        for (r = 1; r < size; r++) {
          if (m[r].cells[c] === prev) run++;
          else { if (run >= 5) score += 3 + (run - 5); run = 1; prev = m[r].cells[c]; }
        }
        if (run >= 5) score += 3 + (run - 5);
      }

      // Rule 2 — 2x2 blocks of one colour
      for (r = 0; r < size - 1; r++) {
        for (c = 0; c < size - 1; c++) {
          var v = m[r].cells[c];
          if (v === m[r].cells[c + 1] && v === m[r + 1].cells[c] && v === m[r + 1].cells[c + 1]) score += 3;
        }
      }

      // Rule 3 — finder-like 1:1:3:1:1 patterns with four light modules
      var P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
      var P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      function matches(get, start) {
        for (var k = 0; k < 11; k++) {
          if (get(start + k) !== P1[k]) break;
          if (k === 10) return true;
        }
        for (var k2 = 0; k2 < 11; k2++) {
          if (get(start + k2) !== P2[k2]) return false;
        }
        return true;
      }
      for (r = 0; r < size; r++) {
        for (c = 0; c <= size - 11; c++) {
          if (matches(function (i) { return m[r].cells[i]; }, c)) score += 40;
        }
      }
      for (c = 0; c < size; c++) {
        for (r = 0; r <= size - 11; r++) {
          if (matches(function (i) { return m[i].cells[c]; }, r)) score += 40;
        }
      }

      // Rule 4 — deviation from 50% dark modules
      for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (m[r].cells[c]) dark++;
      var percent = (dark * 100) / (size * size);
      score += Math.floor(Math.abs(percent - 50) / 5) * 10;

      return score;
    }

    function cloneMatrix(m, size) {
      var out = makeMatrix(size);
      for (var r = 0; r < size; r++) out[r].cells.set(m[r].cells);
      return out;
    }

    /* --- Public: encode text into a boolean module grid --- */

    function encode(text) {
      var bytes = utf8Bytes(String(text));
      var version = pickVersion(bytes.length);
      if (!version) throw new Error('Content too long for a version-10 QR code (' + bytes.length + ' bytes).');

      var size = version * 4 + 17;
      var codewords = buildCodewords(bytes, version);
      var reserved = buildReservedMap(version, size);

      var base = makeMatrix(size);
      setFunctionPatterns(base, version, size);
      placeData(base, reserved, codewords, size);
      drawVersion(base, version, size);

      var best = null, bestScore = Infinity;
      for (var mask = 0; mask < 8; mask++) {
        var candidate = cloneMatrix(base, size);
        applyMask(candidate, reserved, mask, size);
        drawFormat(candidate, mask, size);
        var s = penalty(candidate, size);
        if (s < bestScore) { bestScore = s; best = candidate; }
      }

      var grid = [];
      for (var r = 0; r < size; r++) {
        grid.push([]);
        for (var c = 0; c < size; c++) grid[r].push(best[r].cells[c] === 1);
      }
      return { size: size, version: version, modules: grid };
    }

    /* --- Renderers --- */

    function toSvg(text, opts) {
      opts = opts || {};
      var qr = encode(text);
      var quiet = opts.quiet === undefined ? 4 : opts.quiet;
      var total = qr.size + quiet * 2;
      var dark = opts.dark || '#14070F';
      var light = opts.light || '#FFFFFF';

      var path = [];
      for (var r = 0; r < qr.size; r++) {
        for (var c = 0; c < qr.size; c++) {
          if (qr.modules[r][c]) path.push('M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z');
        }
      }

      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" ' +
        'shape-rendering="crispEdges" role="img" aria-label="QR code for ' + escapeHtml(text) + '">' +
        '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>' +
        '<path d="' + path.join('') + '" fill="' + dark + '"/></svg>';
    }

    function toCanvas(text, opts) {
      opts = opts || {};
      var qr = encode(text);
      var quiet = opts.quiet === undefined ? 4 : opts.quiet;
      var scale = opts.scale || 8;
      var total = (qr.size + quiet * 2) * scale;

      var canvas = document.createElement('canvas');
      canvas.width = total;
      canvas.height = total;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = opts.light || '#FFFFFF';
      ctx.fillRect(0, 0, total, total);
      ctx.fillStyle = opts.dark || '#14070F';
      for (var r = 0; r < qr.size; r++) {
        for (var c = 0; c < qr.size; c++) {
          if (qr.modules[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
      return canvas;
    }

    return { encode: encode, toSvg: toSvg, toCanvas: toCanvas };
  })();

  IH.qr = QR;

  /* ==================================================================
     PART 2 — Share helpers
     ================================================================== */

  function currentShareUrl(scope) {
    var explicit = scope && scope.getAttribute && scope.getAttribute('data-share-url');
    if (explicit) return explicit;
    var holder = qs('[data-share-link]');
    if (holder) return (holder.textContent || holder.value || '').trim();
    return location.href;
  }

  function currentShareText(scope) {
    var explicit = scope && scope.getAttribute && scope.getAttribute('data-share-text');
    if (explicit) return explicit;
    var holder = qs('[data-share-text-source]');
    if (holder) return holder.textContent.trim();
    return 'You are invited! Open my invitation on InviteHub.';
  }
  /* ==================================================================
     PART 3 — QR modal
     ================================================================== */

  function ensureQrModal() {
    var modal = qs('#qr-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'modal modal--sm';
    modal.id = 'qr-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'qr-modal-title');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="modal__dialog">' +
        '<div class="modal__header">' +
          '<h2 id="qr-modal-title">Scan to open</h2>' +
          '<button class="modal__close" type="button" data-modal-close aria-label="Close QR code">' + IH.icon('close', 21) + '</button>' +
        '</div>' +
        '<div class="modal__body center">' +
          '<div class="qr-holder" data-qr-holder style="margin-inline:auto;width:max-content"></div>' +
          '<p class="muted" style="margin-top:var(--space-4);font-size:var(--step--1)" data-qr-caption></p>' +
          '<p class="muted" style="font-size:.78rem">Print this on your card so guests can open the invitation instantly.</p>' +
        '</div>' +
        '<div class="modal__footer">' +
          '<button class="btn btn--secondary" type="button" data-qr-download>' + IH.icon('download', 18) + '<span>Download PNG</span></button>' +
          '<button class="btn btn--primary" type="button" data-modal-close>' + IH.icon('check', 18) + '<span>Done</span></button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    on(modal, 'mousedown', function (evt) { if (evt.target === modal) IH.modal.close(modal); });

    on(qs('[data-qr-download]', modal), 'click', function () {
      var url = modal.getAttribute('data-current-url') || '';
      try {
        var canvas = QR.toCanvas(url, { scale: 12 });
        var link = document.createElement('a');
        link.download = (dom.slugify(url.split('/').pop()) || 'invitehub-qr') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        IH.toast.success('QR code saved to your downloads.');
      } catch (err) {
        IH.toast.error('Could not generate the PNG: ' + err.message);
      }
    });

    return modal;
  }

  IH.qrModal = {
    open: function (url) {
      var modal = ensureQrModal();
      var holder = qs('[data-qr-holder]', modal);
      var caption = qs('[data-qr-caption]', modal);
      modal.setAttribute('data-current-url', url);
      try {
        holder.innerHTML = QR.toSvg(url, { scale: 8 });
        if (caption) caption.textContent = url;
      } catch (err) {
        holder.innerHTML = '<p class="muted">' + escapeHtml(err.message) + '</p>';
      }
      IH.modal.open(modal);
    }
  };

  /* ==================================================================
     PART 4 — Wiring
     ================================================================== */

  function initShare() {
    document.addEventListener('click', function (evt) {
      var node = evt.target.closest && evt.target.closest('[data-share]');
      if (node) {
        evt.preventDefault();
        var network = node.getAttribute('data-share');
        var url = currentShareUrl(node);
        var text = currentShareText(node);

        if (network === 'copy') {
          IH.share.copy(url).then(function () {
            IH.toast.success('Invitation link copied to your clipboard.', { title: 'Copied' });
            var label = qs('span', node);
            if (label) {
              var original = label.textContent;
              label.textContent = 'Copied!';
              setTimeout(function () { label.textContent = original; }, 1800);
            }
          }).catch(function () {
            IH.toast.error('Your browser blocked clipboard access. Select the link and copy it manually.');
          });
          return;
        }

        if (network === 'qr') { IH.qrModal.open(url); return; }

        if (network === 'native') {
          IH.share.native(url, text).catch(function (err) {
            if (err && err.name === 'AbortError') return;
            IH.toast.info('Native sharing is unavailable here — use the buttons below instead.');
          });
          return;
        }

        IH.share.open(network, url, text);
        return;
      }

      // The Share button inside a rendered invitation card.
      var invShare = evt.target.closest && evt.target.closest('[data-share-invitation]');
      if (invShare) {
        evt.preventDefault();
        var iUrl = currentShareUrl(invShare);
        var iText = currentShareText(invShare);
        if (navigator.share) {
          IH.share.native(iUrl, iText).catch(function (err) {
            if (err && err.name === 'AbortError') return;
            IH.share.copy(iUrl).then(function () { IH.toast.success('Link copied — paste it anywhere.'); });
          });
        } else {
          IH.share.copy(iUrl).then(function () {
            IH.toast.success('Link copied — paste it into WhatsApp or email.', { title: 'Copied' });
          }).catch(function () {
            IH.toast.info('Copy this link: ' + iUrl);
          });
        }
      }
    });

    // Inline QR blocks that render on page load.
    qsa('[data-qr]').forEach(function (host) {
      var value = host.getAttribute('data-qr') || currentShareUrl(host);
      try {
        host.innerHTML = QR.toSvg(value, {
          dark: host.getAttribute('data-qr-dark') || '#14070F',
          light: host.getAttribute('data-qr-light') || '#FFFFFF'
        });
      } catch (err) {
        host.innerHTML = '<p class="muted" style="font-size:.78rem">' + escapeHtml(err.message) + '</p>';
      }
    });

    // Hide the "native share" button where the API does not exist.
    if (!navigator.share) qsa('[data-share="native"]').forEach(function (b) { b.hidden = true; });
  }

  function boot() { initShare(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
