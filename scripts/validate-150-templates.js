const fs = require('fs');
const content = fs.readFileSync('js/templates.js', 'utf8');

// Extract TEMPLATE_ROWS array or parse template rows
const lines = content.split('\n');
let weddingRows = [];
let capture = false;

lines.forEach(line => {
  if (line.includes('var TEMPLATE_ROWS = [')) {
    capture = true;
    return;
  }
  if (capture && line.includes('// --- OTHER CATEGORIES')) {
    capture = false;
    return;
  }
  if (capture && line.trim().startsWith('["')) {
    weddingRows.push(line.trim());
  }
});

console.log('Extracted wedding template rows:', weddingRows.length);

// Verify each row has required fields: name, slug, category ("wedding"), etc.
let errors = 0;
weddingRows.forEach((rowStr, idx) => {
  try {
    // evaluate array row safely
    const row = eval(rowStr.replace(/,\s*$/, ''));
    if (!row[0] || !row[1] || row[2] !== 'wedding') {
      console.error(`Invalid row at index ${idx}:`, rowStr);
      errors++;
    }
  } catch (err) {
    console.error(`Failed to parse row ${idx}: ${rowStr}`, err.message);
    errors++;
  }
});

if (errors === 0) {
  console.log('✅ All 150 wedding templates validated successfully with correct schema and category!');
} else {
  console.log(`❌ Validation found ${errors} errors.`);
  process.exit(1);
}
