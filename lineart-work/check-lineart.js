/* Renders every engine wedding card (148) and checks the line art: all pieces
   load, nothing overlaps text. Screens one card per style at 420px. */
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 1.5 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8099/preview.html'); await p.waitForLoadState('networkidle');
  const res = await p.evaluate(async () => {
    const out = [], seen = {}, host = document.createElement('div'); document.body.prepend(host);
    for (const [slug, spec] of Object.entries(IH.weddingDesigns.all())) {
      for (const w of [336, 420, 682]) {
        host.style.width = w + 'px';
        const d = Object.assign({}, IH.invitation.SAMPLE, { eventType: 'wedding' }); IH.invitation.applyTemplate(d, slug); IH.invitation.mount(host, d);
        const inv = host.querySelector('.invitation');
        const imgs = [...inv.querySelectorAll('.wd-la, .wd-la-sprig, .wd-motif--la')];
        await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
        const broken = imgs.filter(i => !i.naturalWidth || getComputedStyle(i).display === 'none').map(i => i.className);
        const crestFallback = !!inv.querySelector('.wd-motif--la') && /wedding-motifs/.test(inv.querySelector('.wd-motif--la').src);
        // The painted text itself (Range rects), not the elements' full-width boxes.
        const text = [];
        const tw = document.createTreeWalker(inv, NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          if (!n.nodeValue.trim() || n.parentElement.closest('.wd-frame, [aria-hidden="true"]') || getComputedStyle(n.parentElement).visibility === 'hidden') continue;
          const rg = document.createRange(); rg.selectNodeContents(n);
          for (const r of rg.getClientRects()) if (r.width && r.height) text.push(r);
        }
        const over = [];
        for (const im of inv.querySelectorAll('.wd-frame--la .wd-la')) {
          if (getComputedStyle(im).display === 'none') continue;
          const a = im.getBoundingClientRect();
          // Treat only clear overlaps (> 6px each way) as a hit; corner art's transparent box edges are ignored by shrinking 12%.
          const sx = a.width * 0.12, sy = a.height * 0.12, A = { l: a.left + sx, r: a.right - sx, t: a.top + sy, b: a.bottom - sy };
          if (text.some(t => Math.min(A.r, t.right) - Math.max(A.l, t.left) > 6 && Math.min(A.b, t.bottom) - Math.max(A.t, t.top) > 6)) over.push(im.className.replace('wd-la ', ''));
        }
        out.push({ slug, w, style: spec.lineArt, la: !!inv.querySelector('.wd-frame--la'), broken, crestFallback, over });
        if (w === 420 && !seen[spec.lineArt]) { seen[spec.lineArt] = slug; }
      }
    }
    return { out, seen };
  });
  const bad = res.out.filter(r => !r.la || r.broken.length || r.crestFallback || r.over.length);
  console.log('renders', res.out.length, 'problems', bad.length);
  const agg = {}; bad.forEach(r => r.over.forEach(o => { const k = o + '@' + r.w; agg[k] = (agg[k] || 0) + 1; })); console.log('overlaps', JSON.stringify(agg));
  bad.filter(r => !r.la || r.broken.length || r.crestFallback).slice(0, 10).forEach(r => console.log(JSON.stringify(r)));
  bad.filter(r => r.over.length).slice(0, 12).forEach(r => console.log(r.slug, r.w, r.over.join(',')));
  if (SP) for (const [style, slug] of Object.entries(res.seen)) {
    await p.goto('http://127.0.0.1:8099/preview.html?template=' + slug); await p.waitForLoadState('networkidle'); await p.waitForTimeout(500);
    await p.evaluate(() => { const i = [...document.querySelectorAll('.invitation')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]; i.id = 'shot'; });
    await p.locator('#shot').screenshot({ path: SP + 'style-' + style + '.png' });
  }
  console.log('styles', JSON.stringify(res.seen), 'errors', JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
