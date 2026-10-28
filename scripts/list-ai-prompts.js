const fs = require('fs');
const path = require('path');
const outDir = 'C:/Users/nanil/OneDrive/Desktop/Matey/personal_ai/ComfyUI-master/output';
const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));

files.forEach((file, i) => {
  try {
    const buf = fs.readFileSync(path.join(outDir, file));
    let pos = 8;
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.slice(pos + 4, pos + 8).toString('ascii');
      if (type === 'tEXt') {
        const data = buf.slice(pos + 8, pos + 8 + len).toString('utf8');
        if (data.startsWith('prompt\0')) {
          const json = JSON.parse(data.substring(7));
          const text = json['10']?.inputs?.text || '';
          console.log(`[${i+1}] ${file}: ${text.substring(0, 100).replace(/\r?\n/g, ' ')}`);
          break;
        }
      }
      pos += 12 + len;
    }
  } catch (e) {}
});
