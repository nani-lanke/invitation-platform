const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../images/templates');

const templates4 = [
  // 142. Desert Romance
  {
    slug: 'desert-romance',
    title: 'Desert Romance',
    kicker: 'UNDER THE DESERT SKY',
    subhead: 'Groom & Bride',
    tagline: 'DUNE WEDDING OASIS',
    bg1: '#FAF3EC',
    bg2: '#EEDBC8',
    ink: '#3D2214',
    primary: '#A85324',
    gold: '#D99B4E',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Desert Dunes & Terracotta Silhouette -->
      <g stroke="#A85324" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#D99B4E" stroke-width="1" rx="6"/>
      </g>
      <!-- Setting Sun & Rolling Sand Dunes -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#A85324" stroke-width="1.5" opacity="0.4"/>
        <!-- Golden Setting Sun Disc -->
        <circle cx="0" cy="-20" r="50" fill="#D99B4E" opacity="0.3"/>
        <!-- Sweeping Sand Dunes -->
        <g fill="#A85324" opacity="0.8">
          <path d="M -85 50 Q -30 10 20 40 Q 60 20 85 50 Z"/>
          <path d="M -85 65 Q -10 35 40 60 Q 70 45 85 65 Z" opacity="0.6"/>
        </g>
        <!-- Desert Agave / Silhouette -->
        <g stroke="#3D2214" stroke-width="1.6" fill="none" opacity="0.85">
          <path d="M 0 50 Q -10 30 -20 25"/>
          <path d="M 0 50 Q 0 20 0 15"/>
          <path d="M 0 50 Q 10 30 20 25"/>
        </g>
      </g>
    `
  },
  // 143. Lakefront Love
  {
    slug: 'lakefront-love',
    title: 'Lakefront Love',
    kicker: 'BY THE WATER\'S EDGE',
    subhead: 'Groom & Bride',
    tagline: 'LAKESIDE CEREMONY',
    bg1: '#F4F8FA',
    bg2: '#D8E7EE',
    ink: '#182834',
    primary: '#325A77',
    gold: '#92B4A7',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Alpine Mountain Ridges & Mirrored Water Horizon -->
      <g stroke="#325A77" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#92B4A7" stroke-width="1" rx="6"/>
      </g>
      <!-- Mountain Skyline & Lake Reeds -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#325A77" stroke-width="1.5" opacity="0.4"/>
        <!-- Misty Mountains -->
        <polygon points="-70,25 -30,-30 10,25" fill="#92B4A7" opacity="0.4"/>
        <polygon points="-20,25 25,-45 70,25" fill="#325A77" opacity="0.5"/>
        <!-- Lake Horizon Line & Reflection -->
        <line x1="-80" y1="25" x2="80" y2="25" stroke="#325A77" stroke-width="2"/>
        <line x1="-60" y1="38" x2="60" y2="38" stroke="#92B4A7" stroke-width="1.5" stroke-dasharray="8 4"/>
        <line x1="-40" y1="50" x2="40" y2="50" stroke="#325A77" stroke-width="1" stroke-dasharray="5 5"/>
        <!-- Lake Water Reeds -->
        <g stroke="#325A77" stroke-width="1.8" fill="none" opacity="0.8">
          <line x1="-55" y1="55" x2="-60" y2="5"/>
          <line x1="-50" y1="55" x2="-45" y2="0"/>
          <line x1="50" y1="55" x2="45" y2="5"/>
          <line x1="55" y1="55" x2="60" y2="0"/>
        </g>
      </g>
    `
  },
  // 144. European Escape
  {
    slug: 'european-escape',
    title: 'European Escape',
    kicker: 'A DESTINATION LOVE STORY',
    subhead: 'Groom & Bride',
    tagline: 'TUSCAN VILLA VOWS',
    bg1: '#F9F7F2',
    bg2: '#ECE6D8',
    ink: '#2D2720',
    primary: '#5C6B57',
    gold: '#B89262',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Tuscan Olive Branch Wreath & Deckled Frame -->
      <g stroke="#5C6B57" stroke-width="1.4" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="6"/>
        <rect x="46" y="46" width="508" height="708" stroke="#B89262" stroke-width="1" stroke-dasharray="6 3"/>
      </g>
      <!-- Tuscan Villa Olive Wreath Centerpiece -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#B89262" stroke-width="1.5" opacity="0.45"/>
        <!-- Circular Olive Wreath -->
        <g stroke="#5C6B57" stroke-width="1.8" fill="none" opacity="0.8">
          <path d="M 0 -80 C -60 -80, -80 -20, -80 0 C -80 40, -40 80, 0 80"/>
          <path d="M 0 -80 C 60 -80, 80 -20, 80 0 C 80 40, 40 80, 0 80"/>
        </g>
        <!-- Olive Leaves -->
        <g fill="#5C6B57" opacity="0.75">
          ${[[-40, -65], [-70, -35], [-75, 10], [-55, 55], [40, -65], [70, -35], [75, 10], [55, 55]].map(([x, y]) => `
            <ellipse cx="${x}" cy="${y}" rx="10" ry="5" transform="rotate(${x > 0 ? 30 : -30} ${x} ${y})"/>
          `).join('')}
        </g>
        <!-- Black Olives -->
        <circle cx="-50" cy="-45" r="4" fill="#2D2720"/>
        <circle cx="50" cy="-45" r="4" fill="#2D2720"/>
        <circle cx="-65" cy="30" r="4" fill="#2D2720"/>
        <circle cx="65" cy="30" r="4" fill="#2D2720"/>
        <!-- Center Ribbon Bow -->
        <circle cx="0" cy="80" r="8" fill="#B89262"/>
      </g>
    `
  },
  // 145. Black Tie Romance
  {
    slug: 'black-tie-romance',
    title: 'Black Tie Romance',
    kicker: 'CORDIALLY INVITE YOU TO',
    subhead: 'Groom & Bride',
    tagline: 'BLACK TIE REQUIRED',
    bg1: '#111215',
    bg2: '#21242B',
    ink: '#F4F5F7',
    primary: '#E2E4E9',
    gold: '#A1A7B4',
    fontDisplay: 'Futura, Arial, sans-serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Razor Sharp Monochrome Geometric Hairline Rules -->
      <g stroke="#E2E4E9" fill="none">
        <rect x="36" y="36" width="528" height="728" stroke-width="1.8" opacity="0.85"/>
        <rect x="44" y="44" width="512" height="712" stroke-width="0.8" opacity="0.4"/>
        <line x1="36" y1="120" x2="564" y2="120" stroke-width="0.8" opacity="0.3"/>
        <line x1="36" y1="680" x2="564" y2="680" stroke-width="0.8" opacity="0.3"/>
      </g>
      <!-- Tuxedo Lapel & Modern Geometric Monogram Centerpiece -->
      <g transform="translate(300, 260)">
        <polygon points="0,-70 50,0 0,70 -50,0" fill="none" stroke="#E2E4E9" stroke-width="2" opacity="0.9"/>
        <polygon points="0,-55 38,0 0,55 -38,0" fill="none" stroke="#A1A7B4" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>
        <!-- Stylized Bowtie / Knot -->
        <polygon points="-30,-15 30,15 30,-15 -30,15" fill="#E2E4E9" opacity="0.95"/>
        <circle cx="0" cy="0" r="6" fill="#111215" stroke="#E2E4E9" stroke-width="1.5"/>
      </g>
    `
  },
  // 146. Midnight Elegance
  {
    slug: 'midnight-elegance',
    title: 'Midnight Elegance',
    kicker: 'WRITTEN IN THE STARS',
    subhead: 'Groom & Bride',
    tagline: 'AN EVENING GALA',
    bg1: '#0A0D1A',
    bg2: '#161D36',
    ink: '#F5F7FA',
    primary: '#D4AF37',
    gold: '#8CA4D8',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Midnight Velvet & 24k Gold Constellation Filigree -->
      <g stroke="#D4AF37" stroke-width="1.5" fill="none" opacity="0.75">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#8CA4D8" stroke-width="0.8" stroke-dasharray="5 3" rx="6"/>
      </g>
      <!-- Celestial Constellations & Gold Starlight Crest -->
      <g transform="translate(300, 260)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.5"/>
        <circle cx="0" cy="0" r="95" fill="none" stroke="#8CA4D8" stroke-width="0.8" stroke-dasharray="3 4"/>
        <!-- 8-Point Starlight Center -->
        ${Array.from({length: 8}, (_, i) => `
          <g transform="rotate(${i * 45})">
            <polygon points="0,-75 6,-25 -6,-25" fill="#D4AF37" opacity="0.85"/>
            <circle cx="0" cy="-85" r="2.5" fill="#F5F7FA"/>
          </g>
        `).join('')}
        <circle cx="0" cy="0" r="24" fill="#D4AF37" opacity="0.9"/>
        <circle cx="0" cy="0" r="12" fill="#0A0D1A"/>
        <circle cx="0" cy="0" r="5" fill="#F5F7FA"/>
      </g>
    `
  },
  // 147. Pearl & Champagne
  {
    slug: 'pearl-and-champagne',
    title: 'Pearl & Champagne',
    kicker: 'RAISE A GLASS TO',
    subhead: 'Groom & Bride',
    tagline: 'A SPARKLING AFFAIR',
    bg1: '#FAF7F2',
    bg2: '#ECE3D4',
    ink: '#342C25',
    primary: '#A68B67',
    gold: '#D9C3A3',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Pearl Bead Garland & Champagne Effervescence -->
      <g stroke="#A68B67" stroke-width="1.2" fill="none" opacity="0.7">
        <rect x="36" y="36" width="528" height="728" rx="10"/>
      </g>
      <!-- Strung Pearl Beads around border -->
      <g fill="#FAF7F2" stroke="#A68B67" stroke-width="0.8">
        ${Array.from({length: 22}, (_, i) => `<circle cx="${50 + i * 22.8}" cy="46" r="3.5" />`).join('')}
        ${Array.from({length: 22}, (_, i) => `<circle cx="${50 + i * 22.8}" cy="754" r="3.5" />`).join('')}
      </g>
      <!-- Luminous Mother-of-Pearl & Champagne Ribbon Rosette -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#A68B67" stroke-width="1.5" opacity="0.45"/>
        <!-- Champagne Bubble Effervescence -->
        ${[[-35, -50, 4], [-15, -70, 3], [15, -60, 5], [40, -45, 3.5], [0, -35, 6], [-25, 45, 4], [30, 50, 4.5]].map(([x, y, r]) => `
          <circle cx="${x}" cy="${y}" r="${r}" fill="#D9C3A3" opacity="0.75"/>
        `).join('')}
        <!-- Luminous Silk Ribbon Knot -->
        <ellipse cx="-25" cy="0" rx="30" ry="16" fill="#FAF7F2" stroke="#A68B67" stroke-width="1.5" transform="rotate(-20 -25 0)"/>
        <ellipse cx="25" cy="0" rx="30" ry="16" fill="#FAF7F2" stroke="#A68B67" stroke-width="1.5" transform="rotate(20 25 0)"/>
        <circle cx="0" cy="0" r="14" fill="#A68B67"/>
        <circle cx="0" cy="0" r="7" fill="#FAF7F2"/>
      </g>
    `
  },
  // 148. Modern Monogram
  {
    slug: 'modern-monogram',
    title: 'Modern Monogram',
    kicker: 'THE WEDDING CELEBRATION OF',
    subhead: 'Groom & Bride',
    tagline: 'SAVE THE DATE',
    bg1: '#F8F7F5',
    bg2: '#E9E6E1',
    ink: '#1E1D1B',
    primary: '#48443E',
    gold: '#968D7F',
    fontDisplay: 'Futura, Arial, sans-serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Architectural Monogram Frame with Precision Lines -->
      <g stroke="#48443E" fill="none">
        <rect x="36" y="36" width="528" height="728" stroke-width="1.5" opacity="0.8"/>
        <!-- Architectural Crosshair Marks -->
        <line x1="300" y1="20" x2="300" y2="45" stroke-width="1"/>
        <line x1="300" y1="755" x2="300" y2="780" stroke-width="1"/>
        <line x1="20" y1="400" x2="45" y2="400" stroke-width="1"/>
        <line x1="555" y1="400" x2="580" y2="400" stroke-width="1"/>
      </g>
      <!-- Centerpiece Monogram Emblem (G & B) -->
      <g transform="translate(300, 260)">
        <circle cx="0" cy="0" r="85" fill="none" stroke="#48443E" stroke-width="2" opacity="0.85"/>
        <circle cx="0" cy="0" r="75" fill="none" stroke="#968D7F" stroke-width="0.8" stroke-dasharray="4 4"/>
        <!-- Interlocking G & B Monogram Letters -->
        <text x="-15" y="16" text-anchor="middle" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#1E1D1B">G</text>
        <text x="0" y="8" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-style="italic" fill="#968D7F">&amp;</text>
        <text x="18" y="16" text-anchor="middle" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#1E1D1B">B</text>
      </g>
    `
  },
  // 149. Luxury Editorial
  {
    slug: 'luxury-editorial',
    title: 'Luxury Editorial',
    kicker: 'THE WEDDING ISSUE · VOL. 1',
    subhead: 'Groom & Bride',
    tagline: 'SAVE THE DATE · 2026',
    bg1: '#F5F4F0',
    bg2: '#E3E0D8',
    ink: '#121212',
    primary: '#242424',
    gold: '#757065',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Futura, Arial, sans-serif',
    svgBody: `
      <!-- High-Fashion Magazine Layout & Asymmetric Column Rules -->
      <g stroke="#121212" fill="none">
        <line x1="44" y1="44" x2="556" y2="44" stroke-width="2"/>
        <line x1="44" y1="52" x2="556" y2="52" stroke-width="0.8"/>
        <line x1="44" y1="756" x2="556" y2="756" stroke-width="2"/>
        <line x1="120" y1="120" x2="120" y2="420" stroke-width="0.8" opacity="0.4"/>
      </g>
      <!-- Fashion Masthead Editorial Vignette -->
      <g transform="translate(300, 240)">
        <rect x="-140" y="-80" width="280" height="150" fill="none" stroke="#121212" stroke-width="1.2" opacity="0.6"/>
        <text x="0" y="-30" text-anchor="middle" font-family="Futura, Arial, sans-serif" font-size="14" letter-spacing="8" fill="#757065">SPECIAL EDITION</text>
        <text x="0" y="30" text-anchor="middle" font-family="Georgia, serif" font-size="62" font-style="italic" fill="#121212">Vows</text>
      </g>
    `
  },
  // 150. Cinematic Love Story
  {
    slug: 'cinematic-love-story',
    title: 'Cinematic Love Story',
    kicker: 'A ROMANTIC FEATURE FILM',
    subhead: 'Groom & Bride',
    tagline: 'PREMIERING WORLDWIDE',
    bg1: '#100C14',
    bg2: '#241A2D',
    ink: '#FAF5FF',
    primary: '#E8B4B8',
    gold: '#9D7494',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Futura, Arial, sans-serif',
    svgBody: `
      <!-- Anamorphic Widescreen 2.39:1 Frame Lines & Spotlight -->
      <g stroke="#E8B4B8" fill="none">
        <rect x="36" y="36" width="528" height="728" stroke-width="1.5" opacity="0.7"/>
        <!-- Cinema Letterbox Bars -->
        <line x1="36" y1="100" x2="564" y2="100" stroke-width="1" opacity="0.4"/>
        <line x1="36" y1="670" x2="564" y2="670" stroke-width="1" opacity="0.4"/>
      </g>
      <!-- Atmospheric Spotlight & Film Billing Block Center -->
      <g transform="translate(300, 260)">
        <!-- Radiant Spotlight Beam -->
        <polygon points="0,-120 -110,60 110,60" fill="#E8B4B8" opacity="0.12"/>
        <!-- Film Reel Medallion -->
        <circle cx="0" cy="-20" r="70" fill="none" stroke="#E8B4B8" stroke-width="2" opacity="0.8"/>
        <circle cx="0" cy="-20" r="55" fill="none" stroke="#9D7494" stroke-width="1" stroke-dasharray="6 4"/>
        ${Array.from({length: 6}, (_, i) => `
          <circle cx="${Math.cos(i * Math.PI / 3) * 35}" cy="${-20 + Math.sin(i * Math.PI / 3) * 35}" r="8" fill="#100C14" stroke="#E8B4B8" stroke-width="1.5"/>
        `).join('')}
        <circle cx="0" cy="-20" r="14" fill="#E8B4B8"/>
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

templates4.forEach(t => {
  const filePath = path.join(outDir, `${t.slug}.svg`);
  fs.writeFileSync(filePath, buildSVG(t), 'utf8');
  console.log(`Generated: ${t.slug}.svg`);
});
