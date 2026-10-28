const fs = require('fs');
const content = fs.readFileSync('js/templates.js', 'utf8');
const lines = content.split('\n');
let weddingCount = 0;
let engagementCount = 0;
let receptionCount = 0;
let birthdayCount = 0;
let babyShowerCount = 0;
let otherCount = 0;

lines.forEach(line => {
  if (line.trim().startsWith('["')) {
    if (line.includes('"wedding"')) weddingCount++;
    else if (line.includes('"engagement"')) engagementCount++;
    else if (line.includes('"reception"')) receptionCount++;
    else if (line.includes('"birthday"')) birthdayCount++;
    else if (line.includes('"baby-shower"')) babyShowerCount++;
    else otherCount++;
  }
});

console.log('Total wedding templates:', weddingCount);
console.log('Engagement:', engagementCount);
console.log('Reception:', receptionCount);
console.log('Birthday:', birthdayCount);
console.log('Baby Shower:', babyShowerCount);
console.log('Other:', otherCount);
console.log('Total templates:', weddingCount + engagementCount + receptionCount + birthdayCount + babyShowerCount + otherCount);
