/* In the page: key a white-background render; report whether the subject touches the canvas edge. */
function keyFree([src, feather]) {
  return (async () => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, EDGE = 4;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H), p = d.data;
    // Background = the brighter half of the border pixels.
    const border = [];
    for (let x = 0; x < W; x += 3) border.push((EDGE * W + x) * 4, ((H - 1 - EDGE) * W + x) * 4);
    for (let y = 0; y < H; y += 3) border.push((y * W + EDGE) * 4, (y * W + W - 1 - EDGE) * 4);
    const lum = i => p[i] + p[i + 1] + p[i + 2];
    border.sort((a, b) => lum(b) - lum(a));
    const top = border.slice(0, Math.max(10, border.length >> 1));
    const bg = [0, 1, 2].map(ch => top.map(i => p[i + ch]).sort((a, b) => a - b)[top.length >> 1]);
    const dist = new Float32Array(W * H);
    for (let j = 0; j < W * H; j++) { const i = j * 4; dist[j] = Math.max(Math.abs(p[i] - bg[0]), Math.abs(p[i + 1] - bg[1]), Math.abs(p[i + 2] - bg[2])); }
    // Flood from the border through near-background pixels only (tight threshold keeps white petals).
    const LO = 5, HI = 24, seen = new Uint8Array(W * H), q = new Int32Array(W * H); let qh = 0, qt = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < EDGE || y < EDGE || x >= W - EDGE || y >= H - EDGE) { const j = y * W + x; seen[j] = 1; q[qt++] = j; }
    while (qh < qt) {
      const j = q[qh++], x = j % W, y = (j / W) | 0;
      for (const n of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1]) if (n >= 0 && !seen[n] && dist[n] < HI) { seen[n] = 1; q[qt++] = n; }
    }
    // Enclosed background (inside a wreath or a ring): large, flat, near-white
    // regions the border flood cannot reach. Textured white petals are kept.
    const lab = new Int32Array(W * H).fill(-1), stack = new Int32Array(W * H);
    for (let s0 = 0; s0 < W * H; s0++) {
      if (seen[s0] || lab[s0] >= 0 || dist[s0] >= HI) continue;
      let sp = 0, n = 0, sum = 0; stack[sp++] = s0; lab[s0] = s0; const members = [];
      while (sp) { const j = stack[--sp]; members.push(j); n++; sum += dist[j]; const x = j % W, y = (j / W) | 0;
        for (const m of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1])
          if (m >= 0 && !seen[m] && lab[m] < 0 && dist[m] < HI) { lab[m] = s0; stack[sp++] = m; } }
      if (n > W * H * 0.004 && sum / n < 9) for (const j of members) seen[j] = 1;
    }
    let opaque = 0, minX = W, minY = H, maxX = -1, maxY = -1, edgeHits = 0, edgeLen = 0;
    for (let j = 0; j < W * H; j++) {
      const i = j * 4, x = j % W, y = (j / W) | 0;
      if (!seen[j]) { p[i + 3] = 255; opaque++; }
      else {
        const a = Math.min(1, Math.max(0, (dist[j] - LO) / (HI - LO))); p[i + 3] = Math.round(a * 255);
        if (a > 0) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.min(255, Math.max(0, (p[i + ch] - bg[ch] * (1 - a)) / a));
      }
      const onRing = x === EDGE + 2 || y === EDGE + 2 || x === W - EDGE - 3 || y === H - EDGE - 3;
      if (onRing) { edgeLen++; if (p[i + 3] > 128) edgeHits++; }
      if (p[i + 3] > 20) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    const coverage = +(opaque / (W * H)).toFixed(3), touch = +(edgeHits / edgeLen).toFixed(3);
    const bgOk = bg.every(v => v > 205);
    if (maxX < 0) return { ok: false, coverage, touch, bgOk };
    // Soft feather near the crop edges so nothing ends in a straight line.
    const pad = 6; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
    const ow = maxX - minX + 1, oh = maxY - minY + 1, f = Math.max(4, Math.round(Math.min(ow, oh) * feather));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const e = Math.min(x - minX, maxX - x, y - minY, maxY - y);
      if (e < f) { const i = (y * W + x) * 4; p[i + 3] = Math.round(p[i + 3] * Math.max(0, e / f)); }
    }
    ctx.putImageData(d, 0, 0);
    const o = document.createElement('canvas'); o.width = ow; o.height = oh;
    o.getContext('2d').drawImage(c, minX, minY, ow, oh, 0, 0, ow, oh);
    return { ok: bgOk && coverage > 0.03 && coverage < 0.8 && touch < 0.02, coverage, touch, bgOk, png: o.toDataURL('image/png') };
  })();
}
module.exports = { keyFree };
