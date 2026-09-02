const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8012;
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

async function checkContent(page, label) {
  const r = await page.evaluate(() => {
    const layout = document.querySelector('.create-layout');
    const preview = document.querySelector('.create-preview');
    const stage = document.querySelector('.preview-stage');
    const iframe = document.querySelector('.preview-stage iframe');
    const invitation = document.querySelector('.preview-stage .invitation');
    const hostedContent = iframe ? iframe.contentDocument : null;
    const body = hostedContent ? hostedContent.body : null;

    return {
      layoutH: layout ? layout.getBoundingClientRect().height : 0,
      previewH: preview ? preview.getBoundingClientRect().height : 0,
      stageH: stage ? stage.getBoundingClientRect().height : 0,
      iframeH: iframe ? iframe.getBoundingClientRect().height : 0,
      invitationH: invitation ? invitation.getBoundingClientRect().height : 0,
      bodyH: body ? body.scrollHeight : 0,
      stageOverflow: stage ? getComputedStyle(stage).overflow : '',
      iframeOverflow: iframe ? getComputedStyle(iframe).overflow : '',
      previewOverflow: preview ? getComputedStyle(preview).overflow : '',
      stageScrollTop: stage ? stage.scrollTop : 0,
      device: stage ? stage.getAttribute('data-device') : 'unknown',
      // Check for clipping
      hasScroll: stage ? stage.scrollHeight > stage.clientHeight : false,
      stageScrollHeight: stage ? stage.scrollHeight : 0,
      stageClientHeight: stage ? stage.clientHeight : 0
    };
  });

  console.log(`[${label}] layout=${r.layoutH.toFixed(1)} preview=${r.previewH.toFixed(1)} stage=${r.stageH.toFixed(1)} iframe=${r.iframeH.toFixed(1)} inv/body=${r.invitationH.toFixed(1)}/${r.bodyH.toFixed(1)}`);
  console.log(`  stage overflow: ${r.stageOverflow}, scroll: ${r.hasScroll ? 'YES (clipping)' : 'NO'}, scrollH=${r.stageScrollHeight.toFixed(1)} clientH=${r.stageClientHeight.toFixed(1)}`);

  return r;
}

async function run() {
  await new Promise(res => server.listen(PORT, res));
  console.log(`Server on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });

  // Desktop - test all three modes for content fit
  let page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);

  console.log('\n=== DESKTOP 1400px - Content Fit ===');
  await checkContent(page, 'Mobile');

  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="desktop"]'); if (b) b.click(); });
  await page.waitForTimeout(300);
  await checkContent(page, 'Desktop');

  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="hosted"]'); if (b) b.click(); });
  await page.waitForTimeout(800);
  await checkContent(page, 'Hosted');

  // Test with longer content (step 3, more fields)
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="mobile"]'); if (b) b.click(); });
  await page.waitForTimeout(300);
  await checkContent(page, 'Mobile (step 3)');

  await page.evaluate(() => { const b = document.querySelector('button[data-preview-device="hosted"]'); if (b) b.click(); });
  await page.waitForTimeout(800);
  await checkContent(page, 'Hosted (step 3)');

  // Narrower desktop
  page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);
  console.log('\n=== DESKTOP 1200px ===');
  await checkContent(page, 'Mobile');

  // Mobile - verify responsive behavior
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);
  console.log('\n=== MOBILE 390px ===');
  await checkContent(page, 'Mobile');

  // Check console
  const logs = [];
  page.on('console', m => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', e => logs.push(`ERROR: ${e.message}`));
  await page.waitForTimeout(200);
  const errors = logs.filter(l => l.startsWith('ERROR:'));
  console.log(`\nConsole errors: ${errors.length > 0 ? errors.length : 'none'}`);
  if (errors.length) errors.forEach(e => console.log('  ' + e));

  await browser.close();
  server.close();
}
run().catch(e => { console.error(e); process.exit(1); });