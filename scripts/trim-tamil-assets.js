const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const dir = path.resolve(__dirname, '..', 'images', 'invitation-assets', 'tamil-thirumanam');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

  console.log('Trimming transparent padding from Tamil Thirumanam assets...');

  for (const file of files) {
    const fPath = path.join(dir, file);
    const dataUrl = 'data:image/png;base64,' + fs.readFileSync(fPath).toString('base64');

    const trimmedDataUrl = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let minX = w, minY = h, maxX = 0, maxY = 0;
      let found = false;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const alpha = data[(y * w + x) * 4 + 3];
          if (alpha > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            found = true;
          }
        }
      }

      if (!found) return src; // Return original if empty

      // Add a tiny 2px padding if possible
      minX = Math.max(0, minX - 2);
      minY = Math.max(0, minY - 2);
      maxX = Math.min(w - 1, maxX + 2);
      maxY = Math.min(h - 1, maxY + 2);

      const tw = maxX - minX + 1;
      const th = maxY - minY + 1;

      const tCanvas = document.createElement('canvas');
      tCanvas.width = tw;
      tCanvas.height = th;
      const tCtx = tCanvas.getContext('2d');
      tCtx.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);

      return tCanvas.toDataURL('image/png');
    }, dataUrl);

    const base64Data = trimmedDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(fPath, Buffer.from(base64Data, 'base64'));
    const stat = fs.statSync(fPath);
    console.log(`✓ Trimmed ${file}: new size ${stat.size} bytes`);
  }

  await browser.close();
  console.log('All Tamil assets trimmed successfully!');
})();
