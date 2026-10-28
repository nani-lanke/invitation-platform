const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../images/templates');

const templates3 = [
  // 133. Lotus Garden
  {
    slug: 'lotus-garden',
    title: 'Lotus Garden',
    kicker: 'THE UNION OF TWO SOULS',
    subhead: 'Groom & Bride',
    tagline: 'AUSPICIOUS BLESSINGS',
    bg1: '#F7FAF6',
    bg2: '#DEEAE0',
    ink: '#1B3026',
    primary: '#2E6B56',
    gold: '#D9829B',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Zen Water Ripple & Sacred Lotus Motif -->
      <g stroke="#2E6B56" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#D9829B" stroke-width="1" rx="6"/>
      </g>
      <!-- Blooming Pink Lotus Over Serene Water -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#2E6B56" stroke-width="1.5" opacity="0.4"/>
        <!-- Water Ripples -->
        <ellipse cx="0" cy="40" rx="90" ry="16" fill="none" stroke="#2E6B56" stroke-width="1.2" opacity="0.5"/>
        <ellipse cx="0" cy="40" rx="60" ry="10" fill="none" stroke="#2E6B56" stroke-width="1" opacity="0.4"/>
        <!-- Lily Pad -->
        <path d="M -70 40 C -70 20, 0 20, 0 40 C 0 60, -70 60, -70 40 Z" fill="#2E6B56" opacity="0.5"/>
        <!-- Sacred Lotus Petals -->
        <g fill="#D9829B" opacity="0.85">
          <!-- Central Petal -->
          <path d="M 0 35 C -25 -10, -20 -60, 0 -80 C 20 -60, 25 -10, 0 35 Z"/>
          <!-- Flanking Left -->
          <path d="M -10 35 C -45 5, -55 -40, -25 -65 C -15 -35, -5 5, -10 35 Z"/>
          <!-- Flanking Right -->
          <path d="M 10 35 C 45 5, 55 -40, 25 -65 C 15 -35, 5 5, 10 35 Z"/>
          <!-- Outer Left & Right -->
          <path d="M -15 35 C -65 20, -75 -15, -45 -40 C -30 -15, -10 15, -15 35 Z" opacity="0.7"/>
          <path d="M 15 35 C 65 20, 75 -15, 45 -40 C 30 -15, 10 15, 15 35 Z" opacity="0.7"/>
        </g>
        <circle cx="0" cy="15" r="7" fill="#FFF8EE"/>
      </g>
    `
  },
  // 134. Wildflower Vows
  {
    slug: 'wildflower-vows',
    title: 'Wildflower Vows',
    kicker: 'MEET US IN THE MEADOW',
    subhead: 'Groom & Bride',
    tagline: 'RUSTIC CELEBRATION',
    bg1: '#F9F8F3',
    bg2: '#EDEBDC',
    ink: '#282C22',
    primary: '#556B2F',
    gold: '#D48C46',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Natural Meadow Grasses & Wildflower Sprays -->
      <g stroke="#556B2F" stroke-width="1.2" fill="none" opacity="0.6">
        <rect x="38" y="38" width="524" height="724" stroke-dasharray="8 4" rx="4"/>
      </g>
      <!-- Wild Botanical Meadow Bunch -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#556B2F" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>
        <!-- Stems -->
        <g stroke="#556B2F" stroke-width="1.8" fill="none" opacity="0.75">
          <line x1="0" y1="60" x2="0" y2="-50"/>
          <line x1="0" y1="60" x2="-45" y2="-35"/>
          <line x1="0" y1="60" x2="45" y2="-35"/>
          <line x1="0" y1="60" x2="-25" y2="-65"/>
          <line x1="0" y1="60" x2="25" y2="-65"/>
        </g>
        <!-- Chamomile / Daisies & Poppies -->
        <g fill="#D48C46" opacity="0.85">
          <circle cx="0" cy="-55" r="9"/>
          <circle cx="-45" cy="-40" r="7.5"/>
          <circle cx="45" cy="-40" r="7.5"/>
          <circle cx="-25" cy="-70" r="8"/>
          <circle cx="25" cy="-70" r="8"/>
        </g>
        <!-- Daisy Petal Rings -->
        ${[-55, -40, -40, -70, -70].map((y, idx) => {
          const x = [0, -45, 45, -25, 25][idx];
          return `<circle cx="${x}" cy="${y}" r="3.5" fill="#FFF8EE"/>`;
        }).join('')}
      </g>
    `
  },
  // 135. Watercolor Romance
  {
    slug: 'watercolor-romance',
    title: 'Watercolor Romance',
    kicker: 'PLEASE JOIN US TO CELEBRATE',
    subhead: 'Groom & Bride',
    tagline: 'ROMANTIC GARDEN VOWS',
    bg1: '#FAF4F8',
    bg2: '#ECDDE8',
    ink: '#3D1E35',
    primary: '#8F3D72',
    gold: '#5C82A6',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Painterly Watercolor Washes & Arch -->
      <g stroke="#8F3D72" stroke-width="1.4" fill="none" opacity="0.6">
        <rect x="36" y="36" width="528" height="728" rx="14"/>
        <rect x="46" y="46" width="508" height="708" stroke="#5C82A6" stroke-width="1" stroke-dasharray="6 4" rx="10"/>
      </g>
      <!-- Layered Fluid Watercolor Floral Arch -->
      <g transform="translate(300, 260)">
        <ellipse cx="0" cy="0" rx="110" ry="100" fill="none" stroke="#8F3D72" stroke-width="1.5" opacity="0.4"/>
        <!-- Soft Petal Blobs -->
        <circle cx="-40" cy="-30" r="35" fill="#8F3D72" opacity="0.25"/>
        <circle cx="40" cy="-30" r="35" fill="#5C82A6" opacity="0.25"/>
        <circle cx="0" cy="-50" r="40" fill="#8F3D72" opacity="0.3"/>
        <!-- Central Delicate Floral Line Art -->
        <g stroke="#8F3D72" stroke-width="1.8" fill="none" opacity="0.8">
          <circle cx="0" cy="-30" r="16"/>
          ${Array.from({length: 8}, (_, i) => `
            <ellipse cx="${Math.cos(i * Math.PI / 4) * 22}" cy="${-30 + Math.sin(i * Math.PI / 4) * 22}" rx="8" ry="4" transform="rotate(${i * 45} ${Math.cos(i * Math.PI / 4) * 22} ${-30 + Math.sin(i * Math.PI / 4) * 22})"/>
          `).join('')}
        </g>
        <circle cx="0" cy="-30" r="5" fill="#5C82A6"/>
      </g>
    `
  },
  // 136. Pastel Garden
  {
    slug: 'pastel-garden',
    title: 'Pastel Garden',
    kicker: 'THE WEDDING DAY OF',
    subhead: 'Groom & Bride',
    tagline: 'SPRINGTIME RECEPTION',
    bg1: '#FDF7FA',
    bg2: '#F2E1EC',
    ink: '#362233',
    primary: '#944D7C',
    gold: '#7AA682',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Pastel Garland & Ranunculus Bouquet -->
      <g stroke="#944D7C" stroke-width="1.4" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#7AA682" stroke-width="1" rx="6"/>
      </g>
      <!-- Pastel Symphony Bouquet -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#7AA682" stroke-width="1.5" opacity="0.5"/>
        <!-- Lavender Sprigs & Sage Leaves -->
        <g stroke="#7AA682" stroke-width="1.6" fill="none" opacity="0.75">
          <path d="M -30 40 Q -60 0 -50 -50"/>
          <path d="M 30 40 Q 60 0 50 -50"/>
          <path d="M 0 40 Q 0 0 0 -60"/>
        </g>
        <!-- Pastel Blossom Heads -->
        <circle cx="-45" cy="-45" r="14" fill="#944D7C" opacity="0.75"/>
        <circle cx="45" cy="-45" r="14" fill="#944D7C" opacity="0.75"/>
        <circle cx="0" cy="-55" r="18" fill="#E8A598" opacity="0.85"/>
        <circle cx="-20" cy="-20" r="16" fill="#D9829B" opacity="0.8"/>
        <circle cx="20" cy="-20" r="16" fill="#7AA682" opacity="0.8"/>
        <circle cx="0" cy="-55" r="6" fill="#FDF7FA"/>
      </g>
    `
  },
  // 137. Cherry Blossom Love
  {
    slug: 'cherry-blossom-love',
    title: 'Cherry Blossom Love',
    kicker: 'OUR LOVE IN FULL BLOOM',
    subhead: 'Groom & Bride',
    tagline: 'SPRING CEREMONY',
    bg1: '#FCF5F7',
    bg2: '#F5DEE5',
    ink: '#3A1C24',
    primary: '#BA4B6E',
    gold: '#8C6239',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Japanese Sakura Branch & Drifting Petals -->
      <g stroke="#BA4B6E" stroke-width="1.2" fill="none" opacity="0.6">
        <rect x="36" y="36" width="528" height="728" rx="4"/>
      </g>
      <!-- Sakura Boughs with 5-Petal Blossoms -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#BA4B6E" stroke-width="1.2" opacity="0.4"/>
        <!-- Branch -->
        <path d="M -90 40 Q -30 10 10 -20 Q 50 -50 80 -40" fill="none" stroke="#8C6239" stroke-width="2.5" opacity="0.8"/>
        <!-- Blossoms -->
        ${[[-70, 25], [-30, 8], [15, -25], [60, -45], [0, -60]].map(([x, y]) => `
          <g transform="translate(${x}, ${y})">
            ${Array.from({length: 5}, (_, i) => `
              <circle cx="${Math.cos(i * Math.PI * 2 / 5) * 9}" cy="${Math.sin(i * Math.PI * 2 / 5) * 9}" r="6.5" fill="#BA4B6E" opacity="0.8"/>
            `).join('')}
            <circle cx="0" cy="0" r="4" fill="#FCF5F7"/>
          </g>
        `).join('')}
        <!-- Drifting Petals -->
        <path d="M -40 -70 C -50 -80, -35 -90, -30 -80 Z" fill="#BA4B6E" opacity="0.65"/>
        <path d="M 50 30 C 40 20, 55 10, 60 20 Z" fill="#BA4B6E" opacity="0.65"/>
        <path d="M 70 -10 C 60 -20, 75 -30, 80 -20 Z" fill="#BA4B6E" opacity="0.65"/>
      </g>
    `
  },
  // 138. Moonlit Florals
  {
    slug: 'moonlit-florals',
    title: 'Moonlit Florals',
    kicker: 'UNDER A CANOPY OF STARS',
    subhead: 'Groom & Bride',
    tagline: 'MIDNIGHT CELEBRATION',
    bg1: '#0B132B',
    bg2: '#1C2541',
    ink: '#EAF0FA',
    primary: '#48CAE4',
    gold: '#C0D6DF',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Midnight Celestial Frame & Constellations -->
      <g stroke="#48CAE4" stroke-width="1.2" fill="none" opacity="0.7">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#C0D6DF" stroke-width="0.8" stroke-dasharray="4 4" rx="6"/>
      </g>
      <!-- Crescent Moon & Night-Blooming Jasmine -->
      <g transform="translate(300, 260)">
        <!-- Moon Halo -->
        <circle cx="0" cy="0" r="95" fill="none" stroke="#48CAE4" stroke-width="1" opacity="0.4"/>
        <!-- Glowing Crescent Moon -->
        <path d="M 0 -50 C 35 -50, 60 -20, 60 20 C 60 60, 35 90, 0 90 C 30 70, 45 45, 45 20 C 45 -5, 30 -30, 0 -50 Z" fill="#EAF0FA" opacity="0.9"/>
        <!-- Celestial Star Cluster -->
        ${[[-60, -40], [-40, -70], [-70, 20], [-45, 60], [40, -60], [70, 50]].map(([x, y]) => `
          <g transform="translate(${x}, ${y})">
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#48CAE4" stroke-width="1"/>
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#48CAE4" stroke-width="1"/>
            <circle cx="0" cy="0" r="1.5" fill="#FFFFFF"/>
          </g>
        `).join('')}
        <!-- Night Blooming Jasmine Spray -->
        <circle cx="-25" cy="0" r="10" fill="#FFFFFF" opacity="0.85"/>
        <circle cx="-15" cy="-25" r="8" fill="#FFFFFF" opacity="0.85"/>
        <circle cx="-35" cy="25" r="8" fill="#FFFFFF" opacity="0.85"/>
      </g>
    `
  },
  // 139. Beachside Bliss
  {
    slug: 'beachside-bliss',
    title: 'Beachside Bliss',
    kicker: 'VOWS BY THE SHORELINE',
    subhead: 'Groom & Bride',
    tagline: 'COASTAL RECEPTION',
    bg1: '#F6FAFA',
    bg2: '#DCEDF0',
    ink: '#102E38',
    primary: '#2A7B9B',
    gold: '#D9A05B',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Ocean Waves & Seashell Coastal Crest -->
      <g stroke="#2A7B9B" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#D9A05B" stroke-width="1" rx="6"/>
      </g>
      <!-- Stylized Rolling Waves & Shell Vignette -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#2A7B9B" stroke-width="1.5" opacity="0.4"/>
        <!-- Horizon & Sun Disc -->
        <circle cx="0" cy="-25" r="45" fill="#D9A05B" opacity="0.25"/>
        <!-- Ocean Wave Curves -->
        <g stroke="#2A7B9B" stroke-width="2.2" fill="none" opacity="0.8">
          <path d="M -80 15 C -50 -10, -30 30, 0 15 C 30 -10, 50 30, 80 15"/>
          <path d="M -70 35 C -40 10, -20 50, 10 35 C 40 10, 60 50, 90 35" stroke="#2A7B9B" stroke-width="1.5" opacity="0.6"/>
        </g>
        <!-- Scallop Shell Center Motif -->
        <g fill="#D9A05B" stroke="#102E38" stroke-width="1" opacity="0.9">
          <path d="M 0 -50 C -25 -50, -35 -20, 0 0 C 35 -20, 25 -50, 0 -50 Z"/>
          <line x1="0" y1="0" x2="-15" y2="-40" stroke="#102E38" stroke-width="0.8"/>
          <line x1="0" y1="0" x2="0" y2="-48" stroke="#102E38" stroke-width="0.8"/>
          <line x1="0" y1="0" x2="15" y2="-40" stroke="#102E38" stroke-width="0.8"/>
        </g>
      </g>
    `
  },
  // 140. Goa Sunset Vows
  {
    slug: 'goa-sunset-vows',
    title: 'Goa Sunset Vows',
    kicker: 'DESTINATION GOA',
    subhead: 'Groom & Bride',
    tagline: 'SUNSET BY THE SEA',
    bg1: '#FFF5EC',
    bg2: '#FCE0CA',
    ink: '#3D1B14',
    primary: '#D64C27',
    gold: '#327A7B',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Portuguese Azulejo Corners & Sunset Palm Silhouette -->
      <g stroke="#D64C27" stroke-width="1.6" fill="none" opacity="0.7">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <!-- Azulejo Corner Tiles -->
        <g stroke="#327A7B" stroke-width="1.2">
          <rect x="46" y="46" width="30" height="30"/>
          <rect x="524" y="46" width="30" height="30"/>
          <rect x="46" y="724" width="30" height="30"/>
          <rect x="524" y="724" width="30" height="30"/>
        </g>
      </g>
      <!-- Sunset Sky Gradient & Swaying Coconut Palms -->
      <g transform="translate(300, 270)">
        <!-- Fiery Sun Sphere -->
        <circle cx="0" cy="0" r="90" fill="#D64C27" opacity="0.2"/>
        <circle cx="0" cy="0" r="70" fill="#FCE0CA" stroke="#D64C27" stroke-width="1.5" opacity="0.9"/>
        <!-- Palm Trees Silhouette -->
        <g fill="#3D1B14" opacity="0.85">
          <!-- Left Palm Trunk -->
          <path d="M -30 70 Q -25 20 -40 -15 L -35 -15 Q -20 20 -25 70 Z"/>
          <!-- Left Palm Fronds -->
          <path d="M -40 -15 Q -75 -40 -90 -20 Q -65 -15 -40 -15 Z"/>
          <path d="M -40 -15 Q -60 -55 -45 -60 Q -40 -35 -40 -15 Z"/>
          <path d="M -40 -15 Q -20 -55 -15 -45 Q -25 -25 -40 -15 Z"/>
          <!-- Right Palm Trunk & Fronds -->
          <path d="M 30 70 Q 25 30 40 0 L 45 0 Q 30 30 35 70 Z"/>
          <path d="M 40 0 Q 75 -25 90 -5 Q 65 0 40 0 Z"/>
          <path d="M 40 0 Q 60 -40 45 -45 Q 40 -20 40 0 Z"/>
        </g>
      </g>
    `
  },
  // 141. Tropical Paradise
  {
    slug: 'tropical-paradise',
    title: 'Tropical Paradise',
    kicker: 'CELEBRATING OUR UNION',
    subhead: 'Groom & Bride',
    tagline: 'ISLAND GETAWAY VOWS',
    bg1: '#F3F8F5',
    bg2: '#D9ECE0',
    ink: '#142E20',
    primary: '#1F6B45',
    gold: '#D65A31',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Monstera Fronds & Exotic Hibiscus Wreath -->
      <g stroke="#1F6B45" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#D65A31" stroke-width="1" rx="6"/>
      </g>
      <!-- Tropical Monstera & Hibiscus Vignette -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#1F6B45" stroke-width="1.5" opacity="0.4"/>
        <!-- Large Monstera Leaves -->
        <g fill="#1F6B45" opacity="0.75">
          <path d="M 0 40 C -70 20, -90 -40, -40 -70 C 0 -60, -10 0, 0 40 Z"/>
          <path d="M 0 40 C 70 20, 90 -40, 40 -70 C 0 -60, 10 0, 0 40 Z"/>
        </g>
        <!-- Red Hibiscus Bloom -->
        <g transform="translate(0, -20)" fill="#D65A31" opacity="0.9">
          ${Array.from({length: 5}, (_, i) => `
            <ellipse cx="${Math.cos(i * Math.PI * 2 / 5) * 20}" cy="${Math.sin(i * Math.PI * 2 / 5) * 20}" rx="18" ry="12" transform="rotate(${i * 72} ${Math.cos(i * Math.PI * 2 / 5) * 20} ${Math.sin(i * Math.PI * 2 / 5) * 20})"/>
          `).join('')}
          <circle cx="0" cy="0" r="8" fill="#FFF8EE"/>
          <line x1="0" y1="0" x2="0" y2="-22" stroke="#FFF8EE" stroke-width="2.5"/>
          <circle cx="0" cy="-24" r="3" fill="#D65A31"/>
        </g>
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

templates3.forEach(t => {
  const filePath = path.join(outDir, `${t.slug}.svg`);
  fs.writeFileSync(filePath, buildSVG(t), 'utf8');
  console.log(`Generated: ${t.slug}.svg`);
});
