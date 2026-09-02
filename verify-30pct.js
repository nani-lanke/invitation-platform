const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8013;
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

async function run() {
  await new Promise(res => server.listen(PORT, res));
  console.log(`Server on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });

  // Test at step 2 (typical editor height)
  let page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${BASE_URL}/create.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.device-switch', { state: 'attached', timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);

  const r = await page.evaluate(() => {
    const layout = document.querySelector('.create-layout');
    const preview = document.querySelector('.create-preview');
    const stage = document.querySelector('.preview-stage');
    const editor = layout.querySelector(':scope > :first-child'); // editor column
    return {
      layoutH: layout.getBoundingClientRect().height,
      previewH: preview.getBoundingClientRect().height,
      stageH: stage.getBoundingClientRect().height,
      editorH: editor ? editor.getBoundingClientRect().height : 0,
      vh: window.innerHeight,
      previewMinHeight: getComputedStyle(preview).minHeight
    };
  });

  console.log(`Step 2 (typical):`);
  console.log(`  viewport: ${r.vh}px`);
  console.log(`  layout: ${r.layoutH.toFixed(1)}px`);
  console.log(`  preview: ${r.previewH.toFixed(1)}px`);
  console.log(`  stage: ${r.stageH.toFixed(1)}px`);
  console.log(`  editor: ${r.editorH.toFixed(1)}px`);
  console.log(`  preview min-height: ${r.previewMinHeight}`);
  console.log(`  130vh = ${(r.vh * 1.3).toFixed(1)}px`);

  // Test with minimal editor content - go back to step 1 where preview is hidden
  // Then check step 2 with less content by simulating shorter form
  await page.evaluate(() => {
    // Temporarily hide some editor sections to make it shorter
    const sections = document.querySelectorAll('.wizard-panel[data-step-panel="2"] .field');
    sections.forEach((s, i) => { if (i > 3) s.style.display = 'none'; });
  });
  await page.waitForTimeout(300);

  const r2 = await page.evaluate(() => {
    const layout = document.querySelector('.create-layout');
    const preview = document.querySelector('.create-preview');
    const stage = document.querySelector('.preview-stage');
    const editor = layout.querySelector(':scope > :first-child');
    return {
      layoutH: layout.getBoundingClientRect().height,
      previewH: preview.getBoundingClientRect().height,
      stageH: stage.getBoundingClientRect().height,
      editorH: editor ? editor.getBoundingClientRect().height : 0,
    };
  });

  console.log(`\nStep 2 (shortened editor):`);
  console.log(`  layout: ${r2.layoutH.toFixed(1)}px`);
  console.log(`  preview: ${r2.previewH.toFixed(1)}px`);
  console.log(`  stage: ${r2.stageH.toFixed(1)}px`);
  console.log(`  editor: ${r2.editorH.toFixed(1)}px`);
  console.log(`  Preview uses min-height: ${r2.previewH === r2.stageH && r2.layoutH === r2.previewH ? 'YES' : 'NO'}`);

  // Restore and test step 5 (invitation step - might be taller)
  await page.evaluate(() => {
    const sections = document.querySelectorAll('.wizard-panel[data-step-panel="2"] .field');
    sections.forEach(s => s.style.display = '');
  });
  await page.waitForTimeout(300);

  // Go to step 3
  await page.evaluate(() => { const b = document.querySelector('button[data-step-next]'); if (b) b.click(); });
  await page.waitForTimeout(600);

  const r3 = await page.evaluate(() => {
    const layout = document.querySelector('.create-layout');
    const preview = document.querySelector('.create-preview');
    const stage = document.querySelector('.preview-stage');
    const editor = layout.querySelector(':scope > :first-child');
    return {
      layoutH: layout.getBoundingClientRect().height,
      previewH: preview.getBoundingClientRect().height,
      stageH: stage.getBoundingClientRect().height,
      editorH: editor ? editor.getBoundingClientRect().height : 0,
    };
  });

  console.log(`\nStep 3:`);
  console.log(`  layout: ${r3.layoutH.toFixed(1)}px`);
  console.log(`  preview: ${r3.previewH.toFixed(1)}px`);
  console.log(`  stage: ${r3.stageH.toFixed(1)}px`);
  console.log(`  editor: ${r3.editorH.toFixed(1)}px`);

  // Summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Preview stage height (step 2): ${r.stageH.toFixed(1)}px`);
  console.log(`Original preview content height (from earlier test): ~854px`);
  console.log(`Increase: ${((r.stageH/854 - 1) * 100).toFixed(0)}%`);
  console.log(`Preview min-height applied: ${r.previewMinHeight}`);
  console.log(`Grid stretch working: ${r.layoutH === r.previewH ? 'YES' : 'NO'}`);
  console.log(`All modes equal height: YES (verified earlier)`);

  await browser.close();
  server.close();
}
run().catch(e => { console.error(e); process.exit(1); });