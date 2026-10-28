const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../images/templates');

const templates2 = [
  // 124. Maharaja Palace
  {
    slug: 'maharaja-palace',
    title: 'Maharaja Palace',
    kicker: 'BY IMPERIAL INVITATION',
    subhead: 'Groom & Bride',
    tagline: 'DURBAR PALACE WEDDING',
    bg1: '#201309',
    bg2: '#402612',
    ink: '#FDF5E6',
    primary: '#E5B348',
    gold: '#F7D788',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Monumental Rajput Scalloped Palace Arch -->
      <g stroke="#E5B348" stroke-width="2" fill="none" opacity="0.8">
        <rect x="36" y="36" width="528" height="728" rx="6"/>
        <path d="M 80 320 L 80 200 C 80 80, 200 60, 300 60 C 400 60, 520 80, 520 200 L 520 320"/>
        <!-- Fluted Columns -->
        <line x1="100" y1="200" x2="100" y2="340" stroke-width="3"/>
        <line x1="500" y1="200" x2="500" y2="340" stroke-width="3"/>
      </g>
      <!-- Crystal Chandelier & Imperial Heraldic Medallion -->
      <g transform="translate(300, 240)">
        <!-- Chandelier Droplets -->
        <g stroke="#F7D788" stroke-width="1.2" fill="none" opacity="0.85">
          <line x1="0" y1="-80" x2="0" y2="-20"/>
          <path d="M -40 -20 Q 0 10 40 -20"/>
          <path d="M -60 -20 Q 0 25 60 -20"/>
          ${[-60, -40, -20, 0, 20, 40, 60].map(x => `<circle cx="${x}" cy="${-15 + Math.abs(x)/4}" r="3" fill="#E5B348"/>`).join('')}
        </g>
        <!-- Royal Crest -->
        <circle cx="0" cy="40" r="45" fill="#201309" stroke="#E5B348" stroke-width="2.5"/>
        <circle cx="0" cy="40" r="35" fill="none" stroke="#F7D788" stroke-width="1" stroke-dasharray="3 3"/>
        <polygon points="0,15 12,35 30,35 15,48 22,68 0,55 -22,68 -15,48 -30,35 -12,35" fill="#E5B348"/>
      </g>
    `
  },
  // 125. Royal Shehnai
  {
    slug: 'royal-shehnai',
    title: 'Royal Shehnai',
    kicker: 'AUSPICIOUS MELODIES OF LOVE',
    subhead: 'Groom & Bride',
    tagline: 'GRAND WEDDING CEREMONY',
    bg1: '#FFF9F2',
    bg2: '#F8E9D6',
    ink: '#421816',
    primary: '#A82823',
    gold: '#D99E32',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Festive Marigold Garland Toran Top -->
      <g fill="#D99E32" stroke="#A82823" stroke-width="1" opacity="0.8">
        <rect x="36" y="36" width="528" height="728" fill="none" stroke="#D99E32" stroke-width="1.8" rx="8"/>
        <!-- Hanging marigold beads across top -->
        ${Array.from({length: 15}, (_, i) => `
          <g transform="translate(${80 + i * 31.4}, 50)">
            <circle cx="0" cy="0" r="5" fill="#D99E32"/>
            <circle cx="0" cy="8" r="4.5" fill="#A82823"/>
            <circle cx="0" cy="15" r="4" fill="#D99E32"/>
            <circle cx="0" cy="21" r="3" fill="#A82823"/>
          </g>
        `).join('')}
      </g>
      <!-- Crossed Royal Shehnai Flutes & Swarna Tassels -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#D99E32" stroke-width="1.5" opacity="0.45"/>
        <!-- Shehnai 1 (Left to Right) -->
        <g transform="rotate(-35)" fill="#D99E32" stroke="#A82823" stroke-width="1.2">
          <path d="M -10 -80 L 10 -80 L 6 60 L -6 60 Z"/>
          <path d="M -22 -80 C -22 -105, 22 -105, 22 -80 Z"/>
          <circle cx="0" cy="-10" r="3" fill="#A82823"/>
          <circle cx="0" cy="15" r="3" fill="#A82823"/>
          <circle cx="0" cy="40" r="3" fill="#A82823"/>
        </g>
        <!-- Shehnai 2 (Right to Left) -->
        <g transform="rotate(35)" fill="#D99E32" stroke="#A82823" stroke-width="1.2">
          <path d="M -10 -80 L 10 -80 L 6 60 L -6 60 Z"/>
          <path d="M -22 -80 C -22 -105, 22 -105, 22 -80 Z"/>
          <circle cx="0" cy="-10" r="3" fill="#A82823"/>
          <circle cx="0" cy="15" r="3" fill="#A82823"/>
          <circle cx="0" cy="40" r="3" fill="#A82823"/>
        </g>
        <!-- Center Lotus Rosette -->
        <circle cx="0" cy="0" r="18" fill="#A82823" stroke="#D99E32" stroke-width="2"/>
        <circle cx="0" cy="0" r="7" fill="#D99E32"/>
      </g>
    `
  },
  // 126. Jewel of Jaipur
  {
    slug: 'jewel-of-jaipur',
    title: 'Jewel of Jaipur',
    kicker: 'ROYAL RAJPUTANA WEDDING',
    subhead: 'Groom & Bride',
    tagline: 'PINK CITY CELEBRATIONS',
    bg1: '#FDF3F0',
    bg2: '#F5DDD4',
    ink: '#3D1C1E',
    primary: '#C04E58',
    gold: '#D49B42',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Jaipur Jharokha Scalloped Arch & Stone Lattice -->
      <g stroke="#C04E58" stroke-width="1.6" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="10"/>
        <rect x="46" y="46" width="508" height="708" stroke="#D49B42" stroke-width="1" stroke-dasharray="4 4" rx="8"/>
      </g>
      <!-- Jharokha Window Centerpiece with Gemstone Accents -->
      <g transform="translate(300, 260)">
        <!-- Carved Jharokha Dome -->
        <path d="M -100 80 L -100 -20 C -100 -80, -50 -120, 0 -130 C 50 -120, 100 -80, 100 -20 L 100 80 Z" fill="#FDF3F0" stroke="#C04E58" stroke-width="2.5" opacity="0.95"/>
        <!-- Inner Lattice Jaali -->
        <g stroke="#D49B42" stroke-width="0.8" opacity="0.45">
          ${[-60, -30, 0, 30, 60].map(x => `<line x1="${x}" y1="-40" x2="${x}" y2="70"/>`).join('')}
          ${[-20, 10, 40, 70].map(y => `<line x1="-80" y1="${y}" x2="80" y2="${y}"/>`).join('')}
        </g>
        <!-- Pink City Ruby & Emerald Gemstone Inset -->
        <circle cx="0" cy="-60" r="16" fill="#C04E58" stroke="#D49B42" stroke-width="2"/>
        <circle cx="0" cy="-60" r="8" fill="#D49B42"/>
        <!-- Flanking Jaipur Peacocks -->
        <circle cx="-130" cy="20" r="25" fill="#D49B42" opacity="0.2"/>
        <circle cx="130" cy="20" r="25" fill="#D49B42" opacity="0.2"/>
      </g>
    `
  },
  // 127. Udaipur Romance
  {
    slug: 'udaipur-romance',
    title: 'Udaipur Romance',
    kicker: 'LAKESIDE ROYAL WEDDING',
    subhead: 'Groom & Bride',
    tagline: 'LAKE PICHOLA PALACE',
    bg1: '#F5F7FB',
    bg2: '#DFE7F5',
    ink: '#1C2638',
    primary: '#2F4D77',
    gold: '#C9934B',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Serene Blue Lake & Chhatri Palace Skyline -->
      <g stroke="#2F4D77" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#C9934B" stroke-width="1" rx="6"/>
      </g>
      <!-- Lake Pichola Marble Palace & Chhatri Silhouette -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="115" fill="none" stroke="#2F4D77" stroke-width="1.5" opacity="0.4"/>
        <!-- Soft Sunset Glow Circle -->
        <circle cx="0" cy="-20" r="60" fill="#C9934B" opacity="0.2"/>
        <!-- Chhatri Dome Silhouette -->
        <g fill="#2F4D77" opacity="0.85">
          <!-- Central Dome -->
          <path d="M -30 20 C -30 -20, -10 -40, 0 -45 C 10 -40, 30 -20, 30 20 Z"/>
          <rect x="-35" y="20" width="70" height="6" rx="2"/>
          <line x1="-20" y1="26" x2="-20" y2="45" stroke="#2F4D77" stroke-width="2.5"/>
          <line x1="0" y1="26" x2="0" y2="45" stroke="#2F4D77" stroke-width="2.5"/>
          <line x1="20" y1="26" x2="20" y2="45" stroke="#2F4D77" stroke-width="2.5"/>
        </g>
        <!-- Water Ripples -->
        <g stroke="#2F4D77" stroke-width="1.2" opacity="0.6">
          <line x1="-80" y1="55" x2="80" y2="55"/>
          <line x1="-60" y1="65" x2="60" y2="65" stroke-dasharray="6 4"/>
          <line x1="-40" y1="75" x2="40" y2="75" stroke-dasharray="4 4"/>
        </g>
      </g>
    `
  },
  // 128. Regal Maroon
  {
    slug: 'regal-maroon',
    title: 'Regal Maroon',
    kicker: 'THE CORONATION OF LOVE',
    subhead: 'Groom & Bride',
    tagline: 'GRAND NOCTURNE WEDDING',
    bg1: '#2E0814',
    bg2: '#521226',
    ink: '#FFF2D9',
    primary: '#D4A745',
    gold: '#F0CF7D',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Antique Gold Baroque & Damask Lace Corners -->
      <g stroke="#D4A745" fill="none" opacity="0.85">
        <rect x="36" y="36" width="528" height="728" stroke-width="2.5" rx="6"/>
        <rect x="46" y="46" width="508" height="708" stroke-width="1" stroke-dasharray="6 3" rx="4"/>
        <!-- 4 Ornate Corners -->
        <g stroke-width="1.8">
          <path d="M 46 96 C 76 96, 96 76, 96 46"/>
          <path d="M 554 96 C 524 96, 504 76, 504 46"/>
          <path d="M 46 704 C 76 704, 96 724, 96 754"/>
          <path d="M 554 704 C 524 704, 504 724, 504 754"/>
        </g>
      </g>
      <!-- Regal Gold Filigree Cartouche & Velvet Crest -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#D4A745" stroke-width="2" opacity="0.6"/>
        <circle cx="0" cy="0" r="95" fill="none" stroke="#F0CF7D" stroke-width="1" stroke-dasharray="4 4"/>
        <!-- Ornate Oval Medallion -->
        <ellipse cx="0" cy="0" rx="65" ry="85" fill="#2E0814" stroke="#D4A745" stroke-width="3"/>
        <ellipse cx="0" cy="0" rx="55" ry="75" fill="none" stroke="#F0CF7D" stroke-width="1" stroke-dasharray="3 3"/>
        <!-- Royal Crown Motif -->
        <g fill="#D4A745">
          <path d="M -30 20 L -25 -15 L -10 5 L 0 -25 L 10 5 L 25 -15 L 30 20 Z"/>
          <circle cx="-25" cy="-20" r="3" fill="#F0CF7D"/>
          <circle cx="0" cy="-30" r="4" fill="#F0CF7D"/>
          <circle cx="25" cy="-20" r="3" fill="#F0CF7D"/>
        </g>
      </g>
    `
  },
  // 129. Imperial Gold
  {
    slug: 'imperial-gold',
    title: 'Imperial Gold',
    kicker: 'TOGETHER WITH THEIR FAMILIES',
    subhead: 'Groom & Bride',
    tagline: 'SAVE THE DATE',
    bg1: '#FAF8F2',
    bg2: '#EFE7D2',
    ink: '#332B1A',
    primary: '#A67D28',
    gold: '#D6A845',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Beveled Geometric Gold Foil Borders -->
      <g stroke="#D6A845" fill="none">
        <rect x="36" y="36" width="528" height="728" stroke-width="2" opacity="0.8"/>
        <rect x="44" y="44" width="512" height="712" stroke-width="0.8" opacity="0.5"/>
        <rect x="52" y="52" width="496" height="696" stroke-width="1.5" stroke="#A67D28" opacity="0.7"/>
        <!-- Corner Diamond Insets -->
        <polygon points="52,40 64,52 52,64 40,52" fill="#D6A845" opacity="0.85"/>
        <polygon points="548,40 560,52 548,64 536,52" fill="#D6A845" opacity="0.85"/>
        <polygon points="52,736 64,748 52,760 40,748" fill="#D6A845" opacity="0.85"/>
        <polygon points="548,736 560,748 548,760 536,748" fill="#D6A845" opacity="0.85"/>
      </g>
      <!-- Haute-Couture Embossed 24k Gold Sunburst Crest -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#D6A845" stroke-width="1.5" opacity="0.5"/>
        <circle cx="0" cy="0" r="90" fill="none" stroke="#A67D28" stroke-width="1" stroke-dasharray="2 4"/>
        ${Array.from({length: 24}, (_, i) => `
          <line x1="0" y1="0" x2="${Math.cos(i * Math.PI / 12) * 80}" y2="${Math.sin(i * Math.PI / 12) * 80}" stroke="#D6A845" stroke-width="1.2" opacity="0.6"/>
        `).join('')}
        <circle cx="0" cy="0" r="45" fill="#FAF8F2" stroke="#D6A845" stroke-width="2.5"/>
        <circle cx="0" cy="0" r="35" fill="none" stroke="#A67D28" stroke-width="1.2"/>
        <polygon points="0,-20 18,-6 12,16 -12,16 -18,-6" fill="#D6A845" opacity="0.9"/>
      </g>
    `
  },
  // 130. Champagne Palace
  {
    slug: 'champagne-palace',
    title: 'Champagne Palace',
    kicker: 'AN EVENING OF ELEGANCE',
    subhead: 'Groom & Bride',
    tagline: 'BLACK TIE OPTIONAL',
    bg1: '#FAF7F0',
    bg2: '#EDE5D4',
    ink: '#302A24',
    primary: '#8C7355',
    gold: '#CDB388',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Slender Neoclassical Arches & Editorial Fine Lines -->
      <g stroke="#CDB388" stroke-width="1.2" fill="none" opacity="0.75">
        <rect x="40" y="40" width="520" height="720" rx="100"/>
        <rect x="50" y="50" width="500" height="700" stroke="#8C7355" stroke-width="0.8" rx="90"/>
      </g>
      <!-- Modern Champagne Spun-Silk Medallion -->
      <g transform="translate(300, 260)">
        <circle cx="0" cy="0" r="95" fill="none" stroke="#CDB388" stroke-width="1" opacity="0.4"/>
        <!-- Slender Double Arch Vignette -->
        <path d="M -50 60 L -50 0 C -50 -40, 50 -40, 50 0 L 50 60" fill="none" stroke="#8C7355" stroke-width="1.6"/>
        <path d="M -35 60 L -35 5 C -35 -25, 35 -25, 35 5 L 35 60" fill="none" stroke="#CDB388" stroke-width="1"/>
        <circle cx="0" cy="-5" r="8" fill="#CDB388" opacity="0.85"/>
        <circle cx="0" cy="-5" r="3" fill="#FAF7F0"/>
      </g>
    `
  },
  // 131. Royal Garden Court
  {
    slug: 'royal-garden-court',
    title: 'Royal Garden Court',
    kicker: 'IN THE GARDEN OF CELEBRATION',
    subhead: 'Groom & Bride',
    tagline: 'ORANGERIE RECEPTION',
    bg1: '#F6F8F3',
    bg2: '#E0E7D7',
    ink: '#1E2E20',
    primary: '#3C6342',
    gold: '#B88E44',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Formal Wrought Iron Palace Gate & Rose Garland -->
      <g stroke="#3C6342" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#B88E44" stroke-width="1" rx="6"/>
      </g>
      <!-- Wrought Iron Gate & Climbing Garden Roses -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#3C6342" stroke-width="1.5" opacity="0.4"/>
        <!-- Gate Scallop Scrolls -->
        <g stroke="#B88E44" stroke-width="1.8" fill="none" opacity="0.85">
          <path d="M -70 20 C -70 -30, -20 -50, 0 -20 C 20 -50, 70 -30, 70 20"/>
          <path d="M -50 40 C -50 0, -10 -20, 0 10 C 10 -20, 50 0, 50 40"/>
        </g>
        <!-- Blooming Garden Rose Sprays -->
        <g fill="#A64B5D" opacity="0.85">
          <circle cx="-55" cy="-20" r="10"/>
          <circle cx="55" cy="-20" r="10"/>
          <circle cx="0" cy="-55" r="12"/>
        </g>
        <g fill="#3C6342" opacity="0.7">
          <ellipse cx="-70" cy="-20" rx="8" ry="4" transform="rotate(-30 -70 -20)"/>
          <ellipse cx="70" cy="-20" rx="8" ry="4" transform="rotate(30 70 -20)"/>
          <ellipse cx="-15" cy="-65" rx="8" ry="4" transform="rotate(-45 -15 -65)"/>
          <ellipse cx="15" cy="-65" rx="8" ry="4" transform="rotate(45 15 -65)"/>
        </g>
      </g>
    `
  },
  // 132. Rosewater Romance
  {
    slug: 'rosewater-romance',
    title: 'Rosewater Romance',
    kicker: 'CELEBRATING TRUE LOVE',
    subhead: 'Groom & Bride',
    tagline: 'FOREVER & ALWAYS',
    bg1: '#FAF2F2',
    bg2: '#EEDADB',
    ink: '#422026',
    primary: '#A64B5D',
    gold: '#CF9D76',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Dusty Rose Botanical Wreath & Calligraphic Vignette -->
      <g stroke="#A64B5D" stroke-width="1.4" fill="none" opacity="0.6">
        <rect x="36" y="36" width="528" height="728" rx="12"/>
        <rect x="46" y="46" width="508" height="708" stroke="#CF9D76" stroke-width="1" stroke-dasharray="5 3" rx="10"/>
      </g>
      <!-- Watercolor Rose Bouquet Centerpiece -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#CF9D76" stroke-width="1.5" opacity="0.45"/>
        <!-- Soft Layered Rose Petals -->
        <g fill="#A64B5D" opacity="0.75">
          <circle cx="0" cy="0" r="28"/>
          <path d="M -25 -10 C -40 -35, -10 -50, 0 -35 C 10 -50, 40 -35, 25 -10 Z"/>
          <path d="M -25 10 C -40 35, -10 50, 0 35 C 10 50, 40 35, 25 10 Z"/>
          <circle cx="-32" cy="0" r="18" fill="#CF9D76" opacity="0.8"/>
          <circle cx="32" cy="0" r="18" fill="#CF9D76" opacity="0.8"/>
        </g>
        <circle cx="0" cy="0" r="14" fill="#FAF2F2"/>
        <circle cx="0" cy="0" r="6" fill="#A64B5D"/>
      </g>
    `
  }
];

function buildSVG(t) {
  const isDark = t.bg1.startsWith('#1') || t.bg1.startsWith('#2') || t.bg1.startsWith('#3') || t.bg1.startsWith('#0');
  const glowOpacity = isDark ? '0.25' : '0.45';
  const sheenOpacity = isDark ? '0.15' : '0.2';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 800" width="600" height="800" role="img" aria-label="${t.title} — wedding invitation template preview">
  <defs>
    <linearGradient id="bg-${t.slug}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bg1}"/>
      <stop offset="55%" stop-color="${t.bg2}"/>
      <stop offset="100%" stop-color="${t.bg1}"/>
    </linearGradient>
    <radialGradient id="gl-${t.slug}" cx="50%" cy="34%" r="62%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="${glowOpacity}"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sh-${t.slug}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="${sheenOpacity}"/>
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="600" height="800" fill="url(#bg-${t.slug})"/>
  <rect x="0" y="0" width="600" height="800" fill="url(#gl-${t.slug})"/>
  <rect x="0" y="0" width="600" height="800" fill="url(#sh-${t.slug})"/>

  <!-- Custom Vector Art -->
  ${t.svgBody}

  <!-- Typography -->
  <text x="300" y="470" text-anchor="middle" font-family="${t.fontDisplay}" font-size="19" letter-spacing="7" fill="${t.gold || t.primary}" opacity="0.85">${t.kicker}</text>
  <line x1="210" y1="495" x2="275" y2="495" stroke="${t.gold || t.primary}" stroke-width="1.2" opacity="0.5"/>
  <circle cx="300" cy="495" r="3.5" fill="${t.gold || t.primary}" opacity="0.75"/>
  <line x1="325" y1="495" x2="390" y2="495" stroke="${t.gold || t.primary}" stroke-width="1.2" opacity="0.5"/>

  <text x="300" y="575" text-anchor="middle" font-family="${t.fontDisplay}" font-size="52" font-style="italic" fill="${t.ink}">${t.title}</text>
  <text x="300" y="630" text-anchor="middle" font-family="${t.fontBody}" font-size="20" fill="${t.ink}" opacity="0.72">${t.subhead}</text>
  <g opacity="0.55">
    <line x1="225" y1="680" x2="375" y2="680" stroke="${t.gold || t.primary}" stroke-width="1"/>
  </g>
  <text x="300" y="720" text-anchor="middle" font-family="${t.fontBody}" font-size="16" letter-spacing="4.5" fill="${t.ink}" opacity="0.6">${t.tagline}</text>
</svg>`;
}

templates2.forEach(t => {
  const filePath = path.join(outDir, `${t.slug}.svg`);
  fs.writeFileSync(filePath, buildSVG(t), 'utf8');
  console.log(`Generated: ${t.slug}.svg`);
});
