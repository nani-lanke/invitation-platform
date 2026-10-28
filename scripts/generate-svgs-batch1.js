const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../images/templates');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const templates1 = [
  // 114. Kanchipuram Silk
  {
    slug: 'kanchipuram-silk',
    title: 'Kanchipuram Silk',
    kicker: 'THE WEDDING OF',
    subhead: 'Groom & Bride',
    tagline: 'SOUTH INDIAN TRADITION',
    bg1: '#FFF8EE',
    bg2: '#F3E6D0',
    ink: '#401018',
    primary: '#8E1538',
    gold: '#D4AF37',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Gopuram / Temple border top & bottom -->
      <g fill="#D4AF37" opacity="0.6">
        <path d="M 40 40 L 560 40 L 560 44 L 40 44 Z"/>
        <path d="M 40 50 L 560 50 L 560 52 L 40 52 Z"/>
        <!-- Temple triangles top -->
        ${Array.from({length: 25}, (_, i) => `<polygon points="${44 + i * 20.8},50 ${54.4 + i * 20.8},64 ${64.8 + i * 20.8},50" />`).join('')}

        <path d="M 40 760 L 560 760 L 560 756 L 40 756 Z"/>
        <path d="M 40 750 L 560 750 L 560 748 L 40 748 Z"/>
        <!-- Temple triangles bottom -->
        ${Array.from({length: 25}, (_, i) => `<polygon points="${44 + i * 20.8},750 ${54.4 + i * 20.8},736 ${64.8 + i * 20.8},750" />`).join('')}
      </g>
      <!-- Corner ornaments -->
      <g stroke="#D4AF37" stroke-width="1.4" fill="none" opacity="0.75">
        <path d="M 44 80 L 44 44 L 80 44"/>
        <path d="M 556 80 L 556 44 L 520 44"/>
        <path d="M 44 720 L 44 756 L 80 756"/>
        <path d="M 556 720 L 556 756 L 520 756"/>
        <circle cx="56" cy="56" r="3.5" fill="#8E1538"/>
        <circle cx="544" cy="56" r="3.5" fill="#8E1538"/>
        <circle cx="56" cy="744" r="3.5" fill="#8E1538"/>
        <circle cx="544" cy="744" r="3.5" fill="#8E1538"/>
      </g>
      <!-- Central Sari Zari Medallion & Peacocks -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.45"/>
        <circle cx="0" cy="0" r="95" fill="none" stroke="#8E1538" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.6"/>
        <circle cx="0" cy="0" r="75" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.5"/>
        <!-- 12 Petal Lotus Center -->
        ${Array.from({length: 12}, (_, i) => `
          <g transform="rotate(${i * 30})">
            <path d="M 0 -30 C 12 -50, 12 -70, 0 -75 C -12 -70, -12 -50, 0 -30 Z" fill="#8E1538" opacity="0.75"/>
            <circle cx="0" cy="-60" r="2.5" fill="#D4AF37"/>
          </g>
        `).join('')}
        <circle cx="0" cy="0" r="22" fill="#D4AF37" opacity="0.85"/>
        <circle cx="0" cy="0" r="14" fill="#8E1538"/>
        <circle cx="0" cy="0" r="5" fill="#FFF8EE"/>
      </g>
    `
  },
  // 115. Tanjore Grandeur
  {
    slug: 'tanjore-grandeur',
    title: 'Tanjore Grandeur',
    kicker: 'SACRED UNION OF',
    subhead: 'Groom & Bride',
    tagline: 'CLASSICAL CELEBRATION',
    bg1: '#FAF5E8',
    bg2: '#EFE0C2',
    ink: '#382410',
    primary: '#9A2420',
    gold: '#DDA83A',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Heavy Embossed Gold Arch & Pillars -->
      <g stroke="#DDA83A" fill="none" opacity="0.7">
        <rect x="36" y="36" width="528" height="728" stroke-width="3" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke-width="1.2" stroke-dasharray="6 3" rx="6"/>
      </g>
      <!-- Tanjore Arch Top -->
      <g transform="translate(300, 120)">
        <path d="M -220 180 C -220 40, -120 -40, 0 -40 C 120 -40, 220 40, 220 180" fill="none" stroke="#DDA83A" stroke-width="4" opacity="0.6"/>
        <path d="M -200 180 C -200 60, -100 -20, 0 -20 C 100 -20, 200 60, 200 180" fill="none" stroke="#9A2420" stroke-width="2" opacity="0.7"/>
        <!-- Hanging Tanjore Bell / Deepam -->
        <g transform="translate(0, 0)">
          <path d="M -15 0 C -25 20, -30 40, 0 50 C 30 40, 25 20, 15 0 Z" fill="#DDA83A" opacity="0.8"/>
          <circle cx="0" cy="58" r="4" fill="#9A2420"/>
        </g>
      </g>
      <!-- Embossed Gemstones & Lotus Frame -->
      <g transform="translate(300, 280)">
        <circle cx="0" cy="0" r="100" fill="#FAF5E8" stroke="#DDA83A" stroke-width="3" opacity="0.9"/>
        <circle cx="0" cy="0" r="85" fill="none" stroke="#9A2420" stroke-width="1.5" stroke-dasharray="3 3"/>
        ${Array.from({length: 8}, (_, i) => `
          <g transform="rotate(${i * 45})">
            <circle cx="0" cy="-92" r="5" fill="#9A2420"/>
            <circle cx="0" cy="-92" r="2.5" fill="#DDA83A"/>
            <path d="M 0 -70 Q 15 -50 0 -30 Q -15 -50 0 -70 Z" fill="#DDA83A" opacity="0.65"/>
          </g>
        `).join('')}
        <circle cx="0" cy="0" r="18" fill="#9A2420"/>
        <circle cx="0" cy="0" r="9" fill="#DDA83A"/>
      </g>
    `
  },
  // 116. Chettinad Heritage
  {
    slug: 'chettinad-heritage',
    title: 'Chettinad Heritage',
    kicker: 'TWO FAMILIES UNITE',
    subhead: 'Groom & Bride',
    tagline: 'HERITAGE TRADITION',
    bg1: '#FDF5ED',
    bg2: '#EED6C2',
    ink: '#3D2016',
    primary: '#A2482B',
    gold: '#C68841',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Athangudi Tile Geometric Borders -->
      <g fill="none" stroke="#A2482B" stroke-width="1.5" opacity="0.65">
        <rect x="35" y="35" width="530" height="730" stroke="#C68841" stroke-width="2"/>
        <rect x="45" y="45" width="510" height="710" stroke-width="1"/>
      </g>
      <!-- Athangudi Tile Diamonds around top & bottom -->
      <g fill="#A2482B" opacity="0.45">
        ${Array.from({length: 12}, (_, i) => `<polygon points="${80 + i * 38},40 ${90 + i * 38},50 ${80 + i * 38},60 ${70 + i * 38},50" />`).join('')}
        ${Array.from({length: 12}, (_, i) => `<polygon points="${80 + i * 38},740 ${90 + i * 38},750 ${80 + i * 38},760 ${70 + i * 38},750" />`).join('')}
      </g>
      <!-- Antique Pillars and Kuthu Vilakku (Lamps) -->
      <g transform="translate(100, 270)" fill="#C68841" stroke="#A2482B" stroke-width="1">
        <!-- Left Lamp -->
        <path d="M 0 60 L 20 60 L 15 40 L 18 10 L 0 0 L -18 10 L -15 40 L -20 60 Z" opacity="0.75"/>
        <path d="M 0 0 L 0 -25" stroke-width="2"/>
        <circle cx="0" cy="-30" r="5" fill="#A2482B"/>
        <!-- Flame -->
        <path d="M 0 -36 C -4 -42, -4 -48, 0 -54 C 4 -48, 4 -42, 0 -36 Z" fill="#D64218" stroke="none"/>
      </g>
      <g transform="translate(500, 270)" fill="#C68841" stroke="#A2482B" stroke-width="1">
        <!-- Right Lamp -->
        <path d="M 0 60 L 20 60 L 15 40 L 18 10 L 0 0 L -18 10 L -15 40 L -20 60 Z" opacity="0.75"/>
        <path d="M 0 0 L 0 -25" stroke-width="2"/>
        <circle cx="0" cy="-30" r="5" fill="#A2482B"/>
        <!-- Flame -->
        <path d="M 0 -36 C -4 -42, -4 -48, 0 -54 C 4 -48, 4 -42, 0 -36 Z" fill="#D64218" stroke="none"/>
      </g>
      <!-- Center Athangudi Mandala -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="80" fill="none" stroke="#A2482B" stroke-width="2" opacity="0.5"/>
        <rect x="-45" y="-45" width="90" height="90" fill="none" stroke="#C68841" stroke-width="2" transform="rotate(45)" opacity="0.7"/>
        <rect x="-35" y="-35" width="70" height="70" fill="#A2482B" transform="rotate(45)" opacity="0.2"/>
        <circle cx="0" cy="0" r="24" fill="#C68841" opacity="0.8"/>
        <circle cx="0" cy="0" r="10" fill="#A2482B"/>
      </g>
    `
  },
  // 117. Andhra Kalamkari
  {
    slug: 'andhra-kalamkari',
    title: 'Andhra Kalamkari',
    kicker: 'AUSPICIOUS WEDDING OF',
    subhead: 'Groom & Bride',
    tagline: 'KALYANAM CELEBRATION',
    bg1: '#F8F2E6',
    bg2: '#E8DCC4',
    ink: '#2E1F18',
    primary: '#872828',
    gold: '#365D68',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Organic Tree of Life & Kalamkari Vine Borders -->
      <g stroke="#872828" stroke-width="1.5" fill="none" opacity="0.7">
        <rect x="36" y="36" width="528" height="728" rx="10"/>
        <path d="M 46 76 C 70 76, 76 46, 106 46"/>
        <path d="M 554 76 C 530 76, 524 46, 494 46"/>
        <path d="M 46 724 C 70 724, 76 754, 106 754"/>
        <path d="M 554 724 C 530 724, 524 754, 494 754"/>
      </g>
      <!-- Kalamkari Dancing Peacock (Mayura) & Lotus Vines -->
      <g transform="translate(300, 270)">
        <!-- Lotus Pod & Petals -->
        <g fill="#872828" opacity="0.6">
          <path d="M 0 -30 C -40 -70, -70 -20, 0 30 C 70 -20, 40 -70, 0 -30 Z"/>
          <circle cx="0" cy="-5" r="8" fill="#365D68"/>
        </g>
        <!-- Flowing Peacock Plumage -->
        <g stroke="#365D68" stroke-width="2" fill="none" opacity="0.7">
          <path d="M -20 10 C -60 40, -100 20, -110 -20 C -120 -60, -90 -90, -40 -80"/>
          <path d="M 20 10 C 60 40, 100 20, 110 -20 C 120 -60, 90 -90, 40 -80"/>
        </g>
        <!-- Peacock Feather Eyes -->
        <g fill="#872828" opacity="0.7">
          <circle cx="-110" cy="-20" r="10"/>
          <circle cx="-110" cy="-20" r="5" fill="#365D68"/>
          <circle cx="110" cy="-20" r="10"/>
          <circle cx="110" cy="-20" r="5" fill="#365D68"/>
          <circle cx="-40" cy="-80" r="8"/>
          <circle cx="40" cy="-80" r="8"/>
        </g>
        <!-- Concentric Kalamkari Ring -->
        <circle cx="0" cy="0" r="115" fill="none" stroke="#872828" stroke-width="1" stroke-dasharray="5 5" opacity="0.5"/>
      </g>
    `
  },
  // 118. Telangana Bathukamma
  {
    slug: 'telangana-bathukamma',
    title: 'Telangana Bathukamma',
    kicker: 'CELEBRATING LOVE & HARMONY',
    subhead: 'Groom & Bride',
    tagline: 'FLORAL WEDDING FESTIVAL',
    bg1: '#FFF9F0',
    bg2: '#FCE6CC',
    ink: '#3D1808',
    primary: '#D64218',
    gold: '#F5A623',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Festive Floral Outer Frame -->
      <g stroke="#F5A623" stroke-width="1.8" fill="none" opacity="0.6">
        <rect x="36" y="36" width="528" height="728" rx="12"/>
        <rect x="46" y="46" width="508" height="708" stroke="#D64218" stroke-width="1" stroke-dasharray="6 4" rx="8"/>
      </g>
      <!-- Layered Conical Bathukamma Floral Motif -->
      <g transform="translate(300, 260)">
        <!-- Bottom Tier: Gunugu & Tangedu (Yellow / Marigold) -->
        <ellipse cx="0" cy="80" rx="120" ry="26" fill="#F5A623" opacity="0.55"/>
        <ellipse cx="0" cy="80" rx="100" ry="20" fill="#D64218" opacity="0.6"/>
        <!-- Middle Tier: Katla / Marigold Flowers -->
        <ellipse cx="0" cy="45" rx="85" ry="20" fill="#F5A623" opacity="0.75"/>
        <ellipse cx="0" cy="45" rx="65" ry="15" fill="#D64218" opacity="0.7"/>
        <!-- Upper Tier: Lotus & Chamanthi -->
        <ellipse cx="0" cy="15" rx="55" ry="16" fill="#F5A623" opacity="0.85"/>
        <ellipse cx="0" cy="15" rx="40" ry="12" fill="#D64218" opacity="0.85"/>
        <!-- Top Gauramma (Turmeric Cone) with Jasmine -->
        <path d="M -16 -10 L 0 -50 L 16 -10 Z" fill="#F5A623"/>
        <circle cx="0" cy="-56" r="6" fill="#D64218"/>
        <!-- Radiating Festive Sunburst / Petals -->
        ${Array.from({length: 16}, (_, i) => `
          <line x1="0" y1="0" x2="${Math.cos(i * Math.PI / 8) * 135}" y2="${Math.sin(i * Math.PI / 8) * 135}" stroke="#F5A623" stroke-width="1" stroke-dasharray="2 6" opacity="0.45"/>
        `).join('')}
      </g>
    `
  },
  // 119. Coorg Kodava
  {
    slug: 'coorg-kodava',
    title: 'Coorg Kodava',
    kicker: 'KODAVA DAMPATHY',
    subhead: 'Groom & Bride',
    tagline: 'WESTERN GHATS WEDDING',
    bg1: '#F3F7F2',
    bg2: '#DCE7DA',
    ink: '#182C1C',
    primary: '#2F5938',
    gold: '#C29648',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Western Ghats Forest & Kupya-Chele Sash Motif -->
      <g stroke="#2F5938" stroke-width="1.5" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#C29648" stroke-width="1" rx="6"/>
      </g>
      <!-- Coffee Leaves & Berries Vignette -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#2F5938" stroke-width="1.8" opacity="0.4"/>
        <circle cx="0" cy="0" r="90" fill="none" stroke="#C29648" stroke-width="1.2" stroke-dasharray="4 4"/>
        <!-- Botanical Coffee Leaf Sprays -->
        <g fill="#2F5938" opacity="0.6">
          <path d="M 0 0 C -30 -40, -60 -40, -80 -20 C -60 0, -30 10, 0 0 Z"/>
          <path d="M 0 0 C 30 -40, 60 -40, 80 -20 C 60 0, 30 10, 0 0 Z"/>
          <path d="M 0 0 C -30 40, -60 40, -80 20 C -60 0, -30 -10, 0 0 Z"/>
          <path d="M 0 0 C 30 40, 60 40, 80 20 C 60 0, 30 -10, 0 0 Z"/>
        </g>
        <!-- Ripe Red Coffee Berries -->
        <g fill="#A82823">
          <circle cx="-35" cy="-25" r="7"/>
          <circle cx="-25" cy="-35" r="6"/>
          <circle cx="35" cy="-25" r="7"/>
          <circle cx="25" cy="-35" r="6"/>
          <circle cx="-35" cy="25" r="7"/>
          <circle cx="35" cy="25" r="7"/>
        </g>
        <!-- Traditional Gold Peeche-Kathi Crossed Dagger Motif -->
        <g stroke="#C29648" stroke-width="2.5" fill="none" opacity="0.85">
          <line x1="-35" y1="-35" x2="35" y2="35"/>
          <line x1="35" y1="-35" x2="-35" y2="35"/>
          <circle cx="0" cy="0" r="12" fill="#C29648" stroke="#2F5938"/>
        </g>
      </g>
    `
  },
  // 120. Kutch Mirrorwork
  {
    slug: 'kutch-mirrorwork',
    title: 'Kutch Mirrorwork',
    kicker: 'SHUBH VIVAH',
    subhead: 'Groom & Bride',
    tagline: 'ROYAL GUJARATI CEREMONY',
    bg1: '#FDF7F2',
    bg2: '#F8E5D8',
    ink: '#361622',
    primary: '#B52151',
    gold: '#E68A2E',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Rabari Embroidery Chevron & Mirror Borders -->
      <g stroke="#B52151" stroke-width="1.8" fill="none" opacity="0.6">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <!-- Chevron Zigzag border top & bottom -->
        <path d="${Array.from({length: 22}, (_, i) => `M ${50 + i * 22} 55 L ${61 + i * 22} 45 L ${72 + i * 22} 55`).join(' ')}" stroke="#E68A2E" stroke-width="1.8"/>
        <path d="${Array.from({length: 22}, (_, i) => `M ${50 + i * 22} 745 L ${61 + i * 22} 755 L ${72 + i * 22} 745`).join(' ')}" stroke="#E68A2E" stroke-width="1.8"/>
      </g>
      <!-- Central Abhala (Mirror) Medallion -->
      <g transform="translate(300, 270)">
        <!-- Embroidered Sunburst Ring -->
        ${Array.from({length: 16}, (_, i) => `
          <g transform="rotate(${i * 22.5})">
            <polygon points="0,-115 6,-95 -6,-95" fill="#B52151" opacity="0.75"/>
            <circle cx="0" cy="-80" r="5" fill="#E68A2E"/>
          </g>
        `).join('')}
        <circle cx="0" cy="0" r="70" fill="#FFFFFF" stroke="#B52151" stroke-width="4" opacity="0.95"/>
        <circle cx="0" cy="0" r="58" fill="#FDF7F2" stroke="#E68A2E" stroke-width="2" stroke-dasharray="4 3"/>
        <!-- Shimmering Mirror Center -->
        <circle cx="0" cy="0" r="42" fill="#EAF0F6" stroke="#8A9BA8" stroke-width="1.5"/>
        <ellipse cx="-12" cy="-12" rx="15" ry="8" fill="#FFFFFF" opacity="0.8" transform="rotate(-30 -12 -12)"/>
      </g>
    `
  },
  // 121. Banarasi Royale
  {
    slug: 'banarasi-royale',
    title: 'Banarasi Royale',
    kicker: 'THE ROYAL WEDDING OF',
    subhead: 'Groom & Bride',
    tagline: 'REGAL CELEBRATIONS',
    bg1: '#3B0A1E',
    bg2: '#6A1435',
    ink: '#FCEFD2',
    primary: '#E8C15A',
    gold: '#F5E096',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Zari Gold Jaal Brocade Background Texture -->
      <g stroke="#E8C15A" stroke-width="0.8" fill="none" opacity="0.25">
        ${Array.from({length: 9}, (_, r) =>
          Array.from({length: 7}, (_, c) =>
            `<path d="M ${50 + c * 80} ${120 + r * 60} Q ${90 + c * 80} ${90 + r * 60} ${130 + c * 80} ${120 + r * 60} Q ${90 + c * 80} ${150 + r * 60} ${50 + c * 80} ${120 + r * 60} Z"/>`
          ).join('')
        ).join('')}
      </g>
      <!-- Heavy Mughal Bel Zari Border -->
      <g stroke="#E8C15A" fill="none" opacity="0.75">
        <rect x="34" y="34" width="532" height="732" stroke-width="2.5" rx="6"/>
        <rect x="44" y="44" width="512" height="712" stroke-width="1" stroke-dasharray="5 3" rx="4"/>
      </g>
      <!-- Banarasi Floral Kalka (Paisley) Centerpiece -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#E8C15A" stroke-width="2" opacity="0.5"/>
        <circle cx="0" cy="0" r="95" fill="none" stroke="#F5E096" stroke-width="1" stroke-dasharray="3 3"/>
        <!-- 4-Corner Buta Paisley -->
        ${Array.from({length: 4}, (_, i) => `
          <g transform="rotate(${i * 90})">
            <path d="M 0 -40 C 35 -60, 45 -95, 0 -95 C -25 -95, -15 -60, 0 -40 Z" fill="#E8C15A" opacity="0.8"/>
            <circle cx="0" cy="-70" r="4" fill="#3B0A1E"/>
          </g>
        `).join('')}
        <circle cx="0" cy="0" r="28" fill="#E8C15A" opacity="0.9"/>
        <circle cx="0" cy="0" r="16" fill="#3B0A1E"/>
        <circle cx="0" cy="0" r="6" fill="#F5E096"/>
      </g>
    `
  },
  // 122. Awadhi Nawab
  {
    slug: 'awadhi-nawab',
    title: 'Awadhi Nawab',
    kicker: 'NIKAHO CELEBRATION OF',
    subhead: 'Groom & Bride',
    tagline: 'ROYAL NAWABI RECEPTION',
    bg1: '#FBF9F4',
    bg2: '#EDE5D5',
    ink: '#2E2822',
    primary: '#6C5B4C',
    gold: '#C49F58',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Cusped Mughal Nawabi Arch -->
      <g stroke="#C49F58" stroke-width="1.8" fill="none" opacity="0.65">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <!-- Multi-foil Arch outline -->
        <path d="M 100 280 C 100 160, 180 80, 300 80 C 420 80, 500 160, 500 280"/>
        <path d="M 120 280 C 120 180, 190 100, 300 100 C 410 100, 480 180, 480 280" stroke="#6C5B4C" stroke-width="1" stroke-dasharray="4 3"/>
      </g>
      <!-- Shadow-work Chikankari Filigree Medallion -->
      <g transform="translate(300, 240)">
        <circle cx="0" cy="0" r="85" fill="none" stroke="#C49F58" stroke-width="1.5" opacity="0.5"/>
        <!-- 8-Point Chikankari Star -->
        ${Array.from({length: 8}, (_, i) => `
          <g transform="rotate(${i * 45})">
            <path d="M 0 -25 C 10 -45, 10 -65, 0 -75 C -10 -65, -10 -45, 0 -25 Z" fill="#6C5B4C" opacity="0.35"/>
            <circle cx="0" cy="-60" r="3" fill="#C49F58"/>
          </g>
        `).join('')}
        <circle cx="0" cy="0" r="18" fill="#C49F58" opacity="0.75"/>
        <circle cx="0" cy="0" r="8" fill="#FBF9F4"/>
      </g>
    `
  },
  // 123. Kashmir Garden
  {
    slug: 'kashmir-garden',
    title: 'Kashmir Garden',
    kicker: 'IN THE VALLEY OF LOVE',
    subhead: 'Groom & Bride',
    tagline: 'SHALIMAR BAGH VOWS',
    bg1: '#F6F8F6',
    bg2: '#E1ECE3',
    ink: '#1E2D24',
    primary: '#3B6B55',
    gold: '#BA7032',
    fontDisplay: 'Georgia, serif',
    fontBody: 'Georgia, serif',
    svgBody: `
      <!-- Kashmiri Chinar Leaves & Persian Paisley Border -->
      <g stroke="#3B6B55" stroke-width="1.6" fill="none" opacity="0.6">
        <rect x="36" y="36" width="528" height="728" rx="8"/>
        <rect x="46" y="46" width="508" height="708" stroke="#BA7032" stroke-width="1" stroke-dasharray="5 3"/>
      </g>
      <!-- Chinar Leaf Vignette in Center -->
      <g transform="translate(300, 270)">
        <circle cx="0" cy="0" r="105" fill="none" stroke="#3B6B55" stroke-width="1.5" opacity="0.4"/>
        <!-- 5-Pointed Chinar Maple Leaf -->
        <g fill="#BA7032" opacity="0.75">
          <!-- Central Point -->
          <path d="M 0 40 L 0 -70 L 15 -45 L 30 -55 L 20 -25 L 45 -25 L 15 0 L 25 25 L 0 15 Z"/>
          <path d="M 0 40 L 0 -70 L -15 -45 L -30 -55 L -20 -25 L -45 -25 L -15 0 L -25 25 L 0 15 Z"/>
        </g>
        <!-- Shalimar Garden Vine Flankers -->
        <g stroke="#3B6B55" stroke-width="1.5" fill="none" opacity="0.7">
          <path d="M -50 0 C -90 -30, -80 -70, -40 -60"/>
          <path d="M 50 0 C 90 -30, 80 -70, 40 -60"/>
          <circle cx="-60" cy="-45" r="4" fill="#BA7032"/>
          <circle cx="60" cy="-45" r="4" fill="#BA7032"/>
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

templates1.forEach(t => {
  const filePath = path.join(outDir, `${t.slug}.svg`);
  fs.writeFileSync(filePath, buildSVG(t), 'utf8');
  console.log(`Generated: ${t.slug}.svg`);
});
