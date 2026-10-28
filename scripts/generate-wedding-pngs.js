const { chromium } = require('playwright');
const fs = require('fs/promises');
const path = require('path');

async function main() {
  const outputDir = path.join(__dirname, '..', 'images', 'wedding-events');
  const assetOutputDir = path.join(__dirname, '..', 'assets', 'images', 'wedding-events');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(assetOutputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 300, height: 300 } });

  // Minimalist, elegant gold line-art icons
  const icons = [
    {
      name: 'haldi',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
          <g fill="none" stroke="#B08A2E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
            <!-- Bowl -->
            <path d="M 50 110 Q 100 150 150 110 Q 150 140 100 160 Q 50 140 50 110 Z"/>
            <!-- Turmeric inside -->
            <path d="M 60 110 Q 100 130 140 110"/>
            <path d="M 70 100 Q 100 120 130 100"/>
          </g>
        </svg>
      `
    },
    {
      name: 'mehndi',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
          <g fill="none" stroke="#B08A2E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
            <!-- Leaf shape -->
            <path d="M 100 30 Q 150 30 180 80 Q 100 170 20 80 Q 50 30 100 30 Z"/>
            <!-- Leaf veins -->
            <path d="M 100 30 L 100 170"/>
            <path d="M 100 50 L 140 60 M 100 70 L 150 80 M 100 90 L 150 100 M 100 110 L 140 120"/>
            <path d="M 100 50 L 60 60 M 100 70 L 50 80 M 100 90 L 50 100 M 100 110 L 60 120"/>
          </g>
        </svg>
      `
    },
    {
      name: 'wedding-ceremony',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
          <g fill="none" stroke="#B08A2E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="80" cy="100" r="45"/>
            <circle cx="120" cy="100" r="45"/>
          </g>
        </svg>
      `
    },
    {
      name: 'reception',
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
          <g fill="none" stroke="#B08A2E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
            <!-- Left Glass -->
            <path d="M 75 60 L 90 120 M 65 140 L 100 140 M 85 120 L 85 165 M 70 165 L 100 165"/>
            <path d="M 60 70 Q 75 90 90 70 Q 75 40 60 70 Z"/>
            <!-- Right Glass -->
            <path d="M 125 60 L 110 120 M 100 140 L 135 140 M 115 120 L 115 165 M 100 165 L 130 165"/>
            <path d="M 140 70 Q 125 90 110 70 Q 125 40 140 70 Z"/>
          </g>
        </svg>
      `
    }
  ];

  for (const item of icons) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 300px; height: 300px; }
          svg { width: 200px; height: 200px; }
        </style>
      </head>
      <body>${item.svg}</body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pngBuffer = await page.screenshot({ omitBackground: true });
    await fs.writeFile(path.join(outputDir, `${item.name}.png`), pngBuffer);
    await fs.writeFile(path.join(assetOutputDir, `${item.name}.png`), pngBuffer);
  }

  await browser.close();
  console.log('Icons regenerated with minimalist line-art style.');
}
main().catch(console.error);
