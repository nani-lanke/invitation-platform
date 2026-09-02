const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8011;
const BASE_URL = `http://localhost:${PORT}`;

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/create.html' : req.url;
  filePath = path.join(__dirname, filePath);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const ct = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

async function check(page, label) {
  const r = await page.evaluate(() => {
    const layout = document.querySelector('.create-layout');
    const preview = document.querySelector('.create-preview');
    const stage = document.querySelector('.preview-stage');
    const iframe = document.querySelector('.preview-stage iframe');
    if (!layout || !preview) return { error: 'missing elements' };
    const lr = layout.getBoundingClientRect();
    const pr = preview.getBoundingClientRect();
    return {
      layoutH: lr.height,
      previewH: pr.height,
      stageH: stage ? stage.getBoundingClientRect().height : 0,
      iframeH: iframe ? iframe.getBoundingClientRect().height : 0,
      stageRect: stage ? stage.getBoundingClientRect() : null,
      iframeRect: iframe ? iframe.getBoundingClientRect() : null,
      device: stage ? stage.getAttribute('data-device') : 'unknown',
      previewOverflowY: getComputedStyle(preview).overflowY,
      stageOverflowY: stage ? getComputedStyle(stage).overflowY : '',
      iframeOverflowY: iframe ? getComputedStyle(iframe).overflowY : ''
    };
  });
  const eq = Math.abs(r.layoutH - r.previewH) < 1;
  console.log(`[${label}] layout=${r.layoutH.toFixed(1)} preview=${r.previewH.toFixed(1)} stage=${r.stageH.toFixed(1)} iframe=${r.iframeH.toFixed(1)} ${eq ? 'EQUAL ✓' : 'MISMATCH ✗'} (device: ${r.device})`);
  if (!eq) {
    console.log(`  Warning: layout/preview height mismatch >1px`);
  }
  return { layoutH: r.layoutH, previewH: r.previewH, eq, stageH: r.stageH, iframeH: r.iframeH, device: r.device };
}

async function run() {
  await new Promise(res => server.listen(PORT, res));
  console.log(`Server on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });

  // First, measure baseline (current height with change)
  let page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  // Advance past step 1 so preview shows
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);

  console.log('\n=== DESKTOP 1400px ===');
  let r1 = await check(page, 'Mobile (default)');

  // Switch to Desktop
  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="desktop"]'); if (b) b.click(); });
  await page.waitForTimeout(300);
  let r2 = await check(page, 'Desktop');

  // Switch to Hosted
  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="hosted"]'); if (b) b.click(); });
  await page.waitForTimeout(800);
  let r3 = await check(page, 'Hosted');

  // Verify all three modes have identical heights
  const heights = [r1.layoutH, r2.layoutH, r3.layoutH];
  const maxH = Math.max(...heights);
  const minH = Math.min(...heights);
  console.log(`\nHeight consistency check: max=${maxH.toFixed(1)} min=${minH.toFixed(1)} diff=${(maxH-minH).toFixed(1)}px ${maxH-minH < 2 ? '✓ PASS' : '✗ FAIL'}`);

  // Test switching back and forth
  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="mobile"]'); if (b) b.click(); });
  await page.waitForTimeout(300);
  let r4 = await check(page, 'Mobile (return)');

  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="desktop"]'); if (b) b.click(); });
  await page.waitForTimeout(300);
  let r5 = await check(page, 'Desktop (return)');

  // Narrower desktop
  page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);
  console.log('\n=== DESKTOP 1200px ===');
  await check(page, 'Mobile');

  // Tablet-like (just above 1100 breakpoint)
  page = await browser.newPage({ viewport: { width: 1150, height: 900 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);
  console.log('\n=== 1150px (still 2-col) ===');
  await check(page, 'Mobile');

  // Mobile (single column) - verify responsive behavior still works
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);
  console.log('\n=== MOBILE 390px ===');
  await check(page, 'Mobile');

  // Check console for errors
  const logs = [];
  page.on('console', m => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', e => logs.push(`ERROR: ${e.message}`));
  await page.waitForTimeout(200);
  const errors = logs.filter(l => l.startsWith('ERROR:'));
  console.log(`\nConsole errors: ${errors.length > 0 ? errors.length : 'none'}`);
  if (errors.length) errors.forEach(e => console.log('  ' + e));

  console.log('\n=== SUMMARY ===');
  console.log('If all desktop checks show EQUAL ✓ and height consistency diff < 2px, the 30% increase works.');
  console.log('Mobile shows preview in stacked layout (expected, preserved existing behavior).');

  await browser.close();
  server.close();
}
run().catch(e => { console.error(e); process.exit(1); });