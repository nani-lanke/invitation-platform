/**
 * Updates teluguPelliBackdrop() in js/preview.js with the complete premium
 * traditional South Indian wedding visual composition:
 *
 * TOP SVG (600×280):
 * - Grand multi-cusped scalloped archway with kalasam spire
 * - Fluted side marble columns
 * - Overhead cascading cream/white floral garland (malli poolu/jasmine + champak)
 *   interspersed with marigold flowers along mango-leaf toran
 * - 6 hanging brass temple bells (ghanthas) & deepam lanterns on golden beaded chains
 * - Jasmine-marigold side garlands
 *
 * BOTTOM SVG (600×210):
 * - Lakeside marble palace Chhatri pavilions with domed cupolas
 * - Flanking royal palm trees
 * - Calm lake water with horizontal mirror reflections
 * - Blooming lotus pond with pink Nelumbo nucifera, lotus buds, green lily pads
 * - Inward-facing caparisoned ceremonial elephants:
 *   Golden Nettipattam forehead plate with emerald gem crest
 *   Emerald green velvet saddle blankets with gold trim & starburst medallions
 *   3-tier beaded Kantha Mala chest necklaces
 *   Gold anklet bands (Gajala Kolusu) on all feet
 *   Gold-banded ivory tusks
 */
const fs = require('fs');
const path = require('path');

const previewPath = path.join(__dirname, '..', 'js', 'preview.js');
let code = fs.readFileSync(previewPath, 'utf8');

// Build the new function
const newFunc = [
'  function teluguPelliBackdrop() {',
'    var PILLARS = [',
"      'images/background_images/pillers_image_one/pillersimage_1.png',",
"      'images/background_images/pillers_image_one/pillersimage_2.png',",
"      'images/background_images/pillers_image_one/pillersimage_3.png',",
"      'images/background_images/pillers_image_one/pillersimage_4.png',",
"      'images/background_images/pillers_image_one/pillersimage_5.png',",
"      'images/background_images/pillers_image_one/pillersimage_6.png',",
"      'images/background_images/pillers_image_one/pillersimage_7.png',",
"      'images/background_images/pillers_image_one/pillersimage_8.png',",
"      'images/background_images/pillers_image_one/pillersimage_9.png'",
'    ];',
'    var leftPillar = PILLARS[Math.floor(Math.random() * PILLARS.length)];',
'    var rightPillar = PILLARS[Math.floor(Math.random() * PILLARS.length)];',
'',
"    return '<div class=\"invitation__backdrop invitation__backdrop--telugu-pelli\" aria-hidden=\"true\">' +",
"      '<svg class=\"invitation__bg-top\" viewBox=\"0 0 600 280\" preserveAspectRatio=\"xMidYMin meet\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">' +",
"        '<defs>' +",
// --- Gradients ---
"          '<linearGradient id=\"tpt-stone-grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#FDF8EE\"/>' +",
"            '<stop offset=\"35%\" stop-color=\"#F2E4C4\"/>' +",
"            '<stop offset=\"70%\" stop-color=\"#DEC596\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#8C6F32\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpt-gold-foil\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#B8861B\"/>' +",
"            '<stop offset=\"25%\" stop-color=\"#E2B842\"/>' +",
"            '<stop offset=\"50%\" stop-color=\"#FFF3A8\"/>' +",
"            '<stop offset=\"75%\" stop-color=\"#D4A02A\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#8C600B\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpt-brass-lamp\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#7A5206\"/>' +",
"            '<stop offset=\"30%\" stop-color=\"#D4A02A\"/>' +",
"            '<stop offset=\"50%\" stop-color=\"#FFE885\"/>' +",
"            '<stop offset=\"70%\" stop-color=\"#B8861B\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#5E3D02\"/>' +",
"          '</linearGradient>' +",
"          '<radialGradient id=\"tpt-lamp-glow\" cx=\"50%\" cy=\"50%\" r=\"50%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#FFE082\" stop-opacity=\"0.9\"/>' +",
"            '<stop offset=\"35%\" stop-color=\"#FFA726\" stop-opacity=\"0.5\"/>' +",
"            '<stop offset=\"70%\" stop-color=\"#FF6F00\" stop-opacity=\"0.2\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#E65100\" stop-opacity=\"0\"/>' +",
"          '</radialGradient>' +",
"          '<linearGradient id=\"tpt-leaf-grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#689F38\"/>' +",
"            '<stop offset=\"50%\" stop-color=\"#4B7724\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#2E5014\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpt-lotus-petal\" x1=\"0%\" y1=\"100%\" x2=\"0%\" y2=\"0%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#FFF0F3\"/>' +",
"            '<stop offset=\"40%\" stop-color=\"#F48FB1\"/>' +",
"            '<stop offset=\"80%\" stop-color=\"#D81B60\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#880E4F\"/>' +",
"          '</linearGradient>' +",
"          '<radialGradient id=\"tpt-marigold\" cx=\"50%\" cy=\"50%\" r=\"50%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#FFF176\"/>' +",
"            '<stop offset=\"45%\" stop-color=\"#FFA726\"/>' +",
"            '<stop offset=\"85%\" stop-color=\"#E65100\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#BF360C\"/>' +",
"          '</radialGradient>' +",
// --- White Champak/Jasmine flower symbol ---
"          '<g id=\"tpt-white-flower\">' +",
"            '<ellipse cx=\"-4\" cy=\"0\" rx=\"3.5\" ry=\"5.5\" fill=\"#FFFDF5\" stroke=\"#C5A04D\" stroke-width=\"0.6\"/>' +",
"            '<ellipse cx=\"4\" cy=\"2\" rx=\"3.5\" ry=\"5.5\" fill=\"#FFFDF5\" stroke=\"#C5A04D\" stroke-width=\"0.6\"/>' +",
"            '<circle cx=\"0\" cy=\"4\" r=\"1.8\" fill=\"#FDD835\" stroke=\"#FFA726\" stroke-width=\"0.4\"/>' +",
"          '</g>' +",
// --- Brass Bell ---
"          '<g id=\"tpt-bell\">' +",
"            '<line x1=\"0\" y1=\"0\" x2=\"0\" y2=\"35\" stroke=\"#B8861B\" stroke-width=\"1.6\" stroke-dasharray=\"2.5,2.5\"/>' +",
"            '<ellipse cx=\"0\" cy=\"10\" rx=\"2.5\" ry=\"4\" fill=\"none\" stroke=\"#B8861B\" stroke-width=\"1\"/>' +",
"            '<ellipse cx=\"0\" cy=\"22\" rx=\"2.5\" ry=\"4\" fill=\"none\" stroke=\"#B8861B\" stroke-width=\"1\"/>' +",
"            '<circle cx=\"0\" cy=\"33\" r=\"2.5\" fill=\"#8C600B\"/>' +",
"            '<path d=\"M -8 35 Q 0 31 8 35 L 9 39 Q 0 37 -9 39 Z\" fill=\"url(#tpt-brass-lamp)\" stroke=\"#5E3D02\" stroke-width=\"0.6\"/>' +",
"            '<path d=\"M -11 45 Q -14 53 -16 63 Q -8 67 0 67 Q 8 67 16 63 Q 14 58 11 45 Q 0 47 -11 45 Z\" fill=\"url(#tpt-brass-lamp)\" stroke=\"#5E3D02\" stroke-width=\"0.8\"/>' +",
"            '<ellipse cx=\"0\" cy=\"63\" rx=\"16\" ry=\"4.5\" fill=\"#9E7012\" stroke=\"#5E3D02\" stroke-width=\"0.8\"/>' +",
"            '<path d=\"M -14 63 Q 0 68 14 63\" stroke=\"#FFE885\" stroke-width=\"0.8\" fill=\"none\"/>' +",
"            '<circle cx=\"0\" cy=\"67\" r=\"3\" fill=\"#FFE885\"/>' +",
"            '<line x1=\"0\" y1=\"67\" x2=\"0\" y2=\"73\" stroke=\"#B8861B\" stroke-width=\"1\"/>' +",
"            '<circle cx=\"0\" cy=\"74\" r=\"1.5\" fill=\"#5E3D02\"/>' +",
"          '</g>' +",
// --- Hanging Deepam Lantern ---
"          '<g id=\"tpt-hanging-lamp\">' +",
"            '<line x1=\"0\" y1=\"0\" x2=\"0\" y2=\"50\" stroke=\"#B8861B\" stroke-width=\"1.8\" stroke-dasharray=\"3,3\"/>' +",
"            '<ellipse cx=\"0\" cy=\"16\" rx=\"3\" ry=\"5\" fill=\"none\" stroke=\"#B8861B\" stroke-width=\"1.2\"/>' +",
"            '<ellipse cx=\"0\" cy=\"32\" rx=\"3\" ry=\"5\" fill=\"none\" stroke=\"#B8861B\" stroke-width=\"1.2\"/>' +",
"            '<circle cx=\"0\" cy=\"48\" r=\"3.5\" fill=\"#8C600B\"/>' +",
"            '<path d=\"M -10 50 Q 0 43 10 50 L 12 54 Q 0 51 -12 54 Z\" fill=\"url(#tpt-brass-lamp)\" stroke=\"#5E3D02\" stroke-width=\"0.6\"/>' +",
"            '<path d=\"M -16 63 Q -20 73 -14 81 Q -6 85 0 85 Q 6 85 14 81 Q 20 73 16 63 Q 0 65 -16 63 Z\" fill=\"url(#tpt-brass-lamp)\" stroke=\"#5E3D02\" stroke-width=\"0.8\"/>' +",
"            '<ellipse cx=\"0\" cy=\"64\" rx=\"16\" ry=\"4\" fill=\"#9E7012\" stroke=\"#5E3D02\" stroke-width=\"0.7\"/>' +",
"            '<circle cx=\"0\" cy=\"53\" r=\"20\" fill=\"url(#tpt-lamp-glow)\"/>' +",
"            '<path d=\"M 0 45 C -4 54 -5 59 0 63 C 5 59 4 54 0 45 Z\" fill=\"#FFF9C4\" stroke=\"#FFA726\" stroke-width=\"0.7\"/>' +",
"            '<path d=\"M 0 51 C -2 55 -2 58 0 61 C 2 58 2 55 0 51 Z\" fill=\"#FF5722\"/>' +",
"            '<path d=\"M -7 84 L -10 92 Q 0 94 10 92 L 7 84 Z\" fill=\"url(#tpt-brass-lamp)\" stroke=\"#5E3D02\" stroke-width=\"0.6\"/>' +",
"            '<line x1=\"0\" y1=\"93\" x2=\"0\" y2=\"103\" stroke=\"#B8861B\" stroke-width=\"1.2\"/>' +",
"            '<path d=\"M -5 103 Q 0 99 5 103 L 6 108 Q 0 110 -6 108 Z\" fill=\"url(#tpt-brass-lamp)\" stroke=\"#5E3D02\" stroke-width=\"0.6\"/>' +",
"            '<circle cx=\"0\" cy=\"110\" r=\"1.8\" fill=\"#5E3D02\"/>' +",
"          '</g>' +",
// --- Scalloped Arch ---
"          '<g id=\"tpt-scalloped-arch\">' +",
"            '<path d=\"M 30 18 L 570 18 L 570 85 Q 520 80 470 70 Q 300 35 130 70 Q 80 80 30 85 Z\" fill=\"#E8D7B5\" opacity=\"0.35\"/>' +",
"            '<path d=\"M 50 160 C 50 110, 80 60, 140 45 C 180 35, 230 42, 260 28 C 280 18, 290 12, 300 8 C 310 12, 320 18, 340 28 C 370 42, 420 35, 460 45 C 520 60, 550 110, 550 160 L 535 160 C 535 115, 508 72, 452 58 C 415 50, 370 56, 342 42 C 324 32, 312 25, 300 20 C 288 25, 276 32, 258 42 C 230 56, 185 50, 148 58 C 92 72, 65 115, 65 160 Z\" fill=\"url(#tpt-stone-grad)\" stroke=\"#7C6028\" stroke-width=\"1.2\"/>' +",
"            '<path d=\"M 65 160 Q 75 125, 110 108 Q 145 92, 175 96 Q 210 98, 238 80 Q 268 62, 300 52 Q 332 62, 362 80 Q 390 98, 425 96 Q 455 92, 490 108 Q 525 125, 535 160\" fill=\"none\" stroke=\"#B8861B\" stroke-width=\"2.2\"/>' +",
"            '<path d=\"M 72 158 Q 82 128, 114 113 Q 146 98, 174 102 Q 208 104, 235 87 Q 265 69, 300 59 Q 335 69, 365 87 Q 392 104, 426 102 Q 454 98, 486 113 Q 518 128, 528 158\" fill=\"none\" stroke=\"#DEC596\" stroke-width=\"1\" stroke-dasharray=\"2,3\"/>' +",
"            '<g transform=\"translate(300 20)\">' +",
"              '<path d=\"M 0 -14 L -4 -2 L 4 -2 Z\" fill=\"url(#tpt-gold-foil)\" stroke=\"#5E3D02\" stroke-width=\"0.8\"/>' +",
"              '<circle cx=\"0\" cy=\"-14\" r=\"2.5\" fill=\"#FFE885\"/>' +",
"              '<ellipse cx=\"0\" cy=\"0\" rx=\"9\" ry=\"6\" fill=\"url(#tpt-gold-foil)\" stroke=\"#7C6028\" stroke-width=\"0.8\"/>' +",
"              '<circle cx=\"0\" cy=\"0\" r=\"4\" fill=\"#D32F2F\"/>' +",
"              '<circle cx=\"0\" cy=\"0\" r=\"1.5\" fill=\"#FFE885\"/>' +",
"            '</g>' +",
"          '</g>' +",
// --- Side Pillar Caps ---
"          '<g id=\"tpt-side-pillar-cap\">' +",
"            '<path d=\"M 0 0 L 28 0 L 24 18 L 4 18 Z\" fill=\"url(#tpt-stone-grad)\" stroke=\"#7C6028\" stroke-width=\"0.8\"/>' +",
"            '<rect x=\"2\" y=\"18\" width=\"24\" height=\"6\" fill=\"url(#tpt-gold-foil)\" stroke=\"#5E3D02\" stroke-width=\"0.6\"/>' +",
"            '<rect x=\"5\" y=\"24\" width=\"18\" height=\"120\" fill=\"url(#tpt-stone-grad)\" stroke=\"#8C6F32\" stroke-width=\"0.8\"/>' +",
"            '<line x1=\"9\" y1=\"24\" x2=\"9\" y2=\"144\" stroke=\"#FFF7E6\" stroke-width=\"0.8\" opacity=\"0.7\"/>' +",
"            '<line x1=\"14\" y1=\"24\" x2=\"14\" y2=\"144\" stroke=\"#7C6028\" stroke-width=\"0.8\" opacity=\"0.6\"/>' +",
"            '<line x1=\"19\" y1=\"24\" x2=\"19\" y2=\"144\" stroke=\"#FFF7E6\" stroke-width=\"0.8\" opacity=\"0.7\"/>' +",
"          '</g>' +",
// --- Mango Leaf ---
"          '<g id=\"tpt-mango-leaf\">' +",
"            '<path d=\"M 0 0 C -7 14 -9 30 0 46 C 9 30 7 14 0 0 Z\" fill=\"url(#tpt-leaf-grad)\" stroke=\"#2E5014\" stroke-width=\"0.8\"/>' +",
"            '<path d=\"M 0 2 L 0 44\" stroke=\"#8BC34A\" stroke-width=\"0.6\" fill=\"none\" opacity=\"0.8\"/>' +",
"            '<circle cx=\"0\" cy=\"46\" r=\"2.2\" fill=\"#E65100\"/>' +",
"          '</g>' +",
// --- Marigold Flower ---
"          '<g id=\"tpt-marigold-flower\">' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"11\" fill=\"url(#tpt-marigold)\"/>' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"8\" fill=\"#FFA726\" stroke=\"#E65100\" stroke-width=\"0.6\"/>' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"3.5\" fill=\"#BF360C\"/>' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"1.5\" fill=\"#FFF176\"/>' +",
"          '</g>' +",
// --- Lotus Bloom ---
"          '<g id=\"tpt-lotus-bloom\">' +",
"            '<path d=\"M 0 6 C -8 1 -18 -4 -24 -14 C -14 -15 -6 -6 0 6 Z\" fill=\"url(#tpt-lotus-petal)\" stroke=\"#880E4F\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M 0 6 C 8 1 18 -4 24 -14 C 14 -15 6 -6 0 6 Z\" fill=\"url(#tpt-lotus-petal)\" stroke=\"#880E4F\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M 0 -24 C 7 -14 8 -3 0 8 C -8 -3 -7 -14 0 -24 Z\" fill=\"url(#tpt-lotus-petal)\" stroke=\"#880E4F\" stroke-width=\"0.6\"/>' +",
"            '<path d=\"M 0 7 C -6 0 -14 -6 -16 -18 C -9 -17 -3 -8 0 7 Z\" fill=\"url(#tpt-lotus-petal)\" stroke=\"#AD1457\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M 0 7 C 6 0 14 -6 16 -18 C 9 -17 3 -8 0 7 Z\" fill=\"url(#tpt-lotus-petal)\" stroke=\"#AD1457\" stroke-width=\"0.5\"/>' +",
"            '<ellipse cx=\"0\" cy=\"5\" rx=\"5\" ry=\"2.5\" fill=\"#FDD835\"/>' +",
"          '</g>' +",
"        '</defs>' +",
// --- Top SVG body: use symbols ---
"        '<use href=\"#tpt-scalloped-arch\" xlink:href=\"#tpt-scalloped-arch\"/>' +",
"        '<image href=\"\' + leftPillar + \'\" xlink:href=\"\' + leftPillar + \'\" x=\"10\" y=\"130\" width=\"34\" height=\"145\" preserveAspectRatio=\"xMidYMid meet\"/>\' +",
"        '<image href=\"\' + rightPillar + \'\" xlink:href=\"\' + rightPillar + \'\" x=\"556\" y=\"130\" width=\"34\" height=\"145\" preserveAspectRatio=\"xMidYMid meet\"/>\' +",
// --- Toran garland with mango leaves, marigolds, jasmine/champak ---
"        '<g id=\"tpt-toran\">' +",
"          '<path d=\"M 40 52 Q 300 112 560 52\" fill=\"none\" stroke=\"#B8861B\" stroke-width=\"2\" opacity=\"0.85\"/>' +",
"          '<path d=\"M 40 55 Q 300 115 560 55\" fill=\"none\" stroke=\"#E65100\" stroke-width=\"1.2\" opacity=\"0.7\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(68 54) rotate(-14) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(112 66) rotate(-10) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(158 76) rotate(-6) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(204 84) rotate(-2) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(250 88) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(300 90) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(350 88) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(396 84) rotate(2) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(442 76) rotate(6) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(488 66) rotate(10) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-mango-leaf\" xlink:href=\"#tpt-mango-leaf\" transform=\"translate(532 54) rotate(14) scale(0.85)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(90 62) scale(0.75)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(135 73) scale(0.9)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(181 82) scale(0.75)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(227 88) scale(0.9)\"/>' +",
"          '<image href=\"images/background_images/vinayaka_images/vinayaka_image_2.png\" xlink:href=\"images/background_images/vinayaka_images/vinayaka_image_2.png\" x=\"268\" y=\"18\" width=\"64\" height=\"64\" preserveAspectRatio=\"xMidYMid meet\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(373 88) scale(0.9)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(419 82) scale(0.75)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(465 73) scale(0.9)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(510 62) scale(0.75)\"/>' +",
"        '</g>' +",
// --- 6 hanging bells & lamps (3 per side, alternating heights) ---
"        '<use href=\"#tpt-hanging-lamp\" xlink:href=\"#tpt-hanging-lamp\" transform=\"translate(75 48)\"/>' +",
"        '<use href=\"#tpt-bell\" xlink:href=\"#tpt-bell\" transform=\"translate(140 42) scale(0.88)\"/>' +",
"        '<use href=\"#tpt-bell\" xlink:href=\"#tpt-bell\" transform=\"translate(210 38) scale(0.82)\"/>' +",
"        '<use href=\"#tpt-bell\" xlink:href=\"#tpt-bell\" transform=\"translate(390 38) scale(0.82)\"/>' +",
"        '<use href=\"#tpt-bell\" xlink:href=\"#tpt-bell\" transform=\"translate(460 42) scale(0.88)\"/>' +",
"        '<use href=\"#tpt-hanging-lamp\" xlink:href=\"#tpt-hanging-lamp\" transform=\"translate(525 48)\"/>' +",
// --- Side jasmine/champak garlands ---
"        '<g id=\"tpt-jasmine-garland-left\" transform=\"translate(48 70)\">' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 0)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 16)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 32)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(0 48) scale(0.65)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 62)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 78)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(0 94) scale(0.65)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 108)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 124)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(0 140) scale(0.65)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 154)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 170)\"/>' +",
"          '<circle cx=\"0\" cy=\"182\" r=\"3\" fill=\"#E65100\"/>' +",
"        '</g>' +",
"        '<g id=\"tpt-jasmine-garland-right\" transform=\"translate(552 70)\">' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 0)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 16)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 32)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(0 48) scale(0.65)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 62)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 78)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(0 94) scale(0.65)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 108)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 124)\"/>' +",
"          '<use href=\"#tpt-marigold-flower\" xlink:href=\"#tpt-marigold-flower\" transform=\"translate(0 140) scale(0.65)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 154)\"/>' +",
"          '<use href=\"#tpt-white-flower\" xlink:href=\"#tpt-white-flower\" transform=\"translate(0 170)\"/>' +",
"          '<circle cx=\"0\" cy=\"182\" r=\"3\" fill=\"#E65100\"/>' +",
"        '</g>' +",
"      '</svg>' +",
// ======== BOTTOM SVG ========
"      '<svg class=\"invitation__bg-bottom\" viewBox=\"0 0 600 210\" preserveAspectRatio=\"xMidYMax meet\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">' +",
"        '<defs>' +",
// --- Bottom gradients ---
"          '<linearGradient id=\"tpb-lake-water\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#E1EBEB\" stop-opacity=\"0.35\"/>' +",
"            '<stop offset=\"50%\" stop-color=\"#CFDFE0\" stop-opacity=\"0.65\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#B2CDD0\" stop-opacity=\"0.9\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpb-palace-marble\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#FFFFFF\"/>' +",
"            '<stop offset=\"60%\" stop-color=\"#F7F1E6\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#E8DCB8\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpb-gold-foil\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#B8861B\"/>' +",
"            '<stop offset=\"25%\" stop-color=\"#E2B842\"/>' +",
"            '<stop offset=\"50%\" stop-color=\"#FFF3A8\"/>' +",
"            '<stop offset=\"75%\" stop-color=\"#D4A02A\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#8C600B\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpb-royal-emerald\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#196F3D\"/>' +",
"            '<stop offset=\"50%\" stop-color=\"#145A32\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#0B3B1F\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpb-lotus-petal\" x1=\"0%\" y1=\"100%\" x2=\"0%\" y2=\"0%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#FFF0F3\"/>' +",
"            '<stop offset=\"40%\" stop-color=\"#F48FB1\"/>' +",
"            '<stop offset=\"80%\" stop-color=\"#D81B60\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#880E4F\"/>' +",
"          '</linearGradient>' +",
"          '<linearGradient id=\"tpb-leaf-grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#689F38\"/>' +",
"            '<stop offset=\"50%\" stop-color=\"#4B7724\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#2E5014\"/>' +",
"          '</linearGradient>' +",
"          '<radialGradient id=\"tpb-marigold\" cx=\"50%\" cy=\"50%\" r=\"50%\">' +",
"            '<stop offset=\"0%\" stop-color=\"#FFF176\"/>' +",
"            '<stop offset=\"45%\" stop-color=\"#FFA726\"/>' +",
"            '<stop offset=\"85%\" stop-color=\"#E65100\"/>' +",
"            '<stop offset=\"100%\" stop-color=\"#BF360C\"/>' +",
"          '</radialGradient>' +",
// --- Chhatri Pavilion ---
"          '<g id=\"tpb-chhatri-pavilion\">' +",
"            '<path d=\"M -26 8 C -26 -8 0 -18 0 -26 C 0 -18 26 -8 26 8 Z\" fill=\"url(#tpb-palace-marble)\" stroke=\"#DEC596\" stroke-width=\"0.6\"/>' +",
"            '<line x1=\"0\" y1=\"-26\" x2=\"0\" y2=\"-32\" stroke=\"#B8861B\" stroke-width=\"1\"/>' +",
"            '<circle cx=\"0\" cy=\"-33\" r=\"1.2\" fill=\"#145A32\"/>' +",
"            '<path d=\"M -55 8 C -55 -2 -38 -10 -38 -18 C -38 -10 -22 -2 -22 8 Z\" fill=\"url(#tpb-palace-marble)\" stroke=\"#DEC596\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M 22 8 C 22 -2 38 -10 38 -18 C 38 -10 55 -2 55 8 Z\" fill=\"url(#tpb-palace-marble)\" stroke=\"#DEC596\" stroke-width=\"0.5\"/>' +",
"            '<rect x=\"-70\" y=\"2\" width=\"140\" height=\"6\" fill=\"url(#tpb-palace-marble)\" stroke=\"#DEC596\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M -26 10 C -26 20 0 24 0 28 C 0 24 26 20 26 10 Z\" fill=\"#B0BEC5\" opacity=\"0.35\"/>' +",
"            '<path d=\"M -70 14 Q 0 10 70 14\" stroke=\"#90A4AE\" stroke-width=\"0.6\" fill=\"none\" opacity=\"0.6\"/>' +",
"            '<path d=\"M -50 18 Q 0 15 50 18\" stroke=\"#FFFFFF\" stroke-width=\"0.6\" fill=\"none\" opacity=\"0.7\"/>' +",
"            '<path d=\"M -85 22 Q 0 19 85 22\" stroke=\"#90A4AE\" stroke-width=\"0.6\" fill=\"none\" opacity=\"0.5\"/>' +",
"          '</g>' +",
// --- Royal Palm Tree ---
"          '<g id=\"tpb-palm-tree\">' +",
"            '<path d=\"M -3 30 Q -6 15 -2 0 Q -1 -12 -5 -25 L -1 -25 Q 3 -12 2 0 Q -2 15 1 30 Z\" fill=\"#6D4C41\"/>' +",
"            '<path d=\"M -4 -25 Q -18 -32 -28 -28 Q -20 -38 -5 -27\" fill=\"#33691E\"/>' +",
"            '<path d=\"M -2 -26 Q -12 -42 -2 -48 Q 2 -40 -1 -26\" fill=\"#388E3C\"/>' +",
"            '<path d=\"M 0 -26 Q 16 -40 24 -32 Q 16 -28 2 -25\" fill=\"#2E7D32\"/>' +",
"            '<path d=\"M 2 -25 Q 18 -26 26 -16 Q 14 -18 0 -24\" fill=\"#1B5E20\"/>' +",
"          '</g>' +",
// --- Lotus Bloom (bottom) ---
"          '<g id=\"tpb-lotus-bloom\">' +",
"            '<path d=\"M 0 6 C -8 1 -18 -4 -24 -14 C -14 -15 -6 -6 0 6 Z\" fill=\"url(#tpb-lotus-petal)\" stroke=\"#880E4F\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M 0 6 C 8 1 18 -4 24 -14 C 14 -15 6 -6 0 6 Z\" fill=\"url(#tpb-lotus-petal)\" stroke=\"#880E4F\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M 0 -24 C 7 -14 8 -3 0 8 C -8 -3 -7 -14 0 -24 Z\" fill=\"url(#tpb-lotus-petal)\" stroke=\"#880E4F\" stroke-width=\"0.6\"/>' +",
"            '<path d=\"M 0 7 C -6 0 -14 -6 -16 -18 C -9 -17 -3 -8 0 7 Z\" fill=\"url(#tpb-lotus-petal)\" stroke=\"#AD1457\" stroke-width=\"0.5\"/>' +",
"            '<path d=\"M 0 7 C 6 0 14 -6 16 -18 C 9 -17 3 -8 0 7 Z\" fill=\"url(#tpb-lotus-petal)\" stroke=\"#AD1457\" stroke-width=\"0.5\"/>' +",
"            '<ellipse cx=\"0\" cy=\"5\" rx=\"5\" ry=\"2.5\" fill=\"#FDD835\"/>' +",
"          '</g>' +",
// --- Lotus Leaf ---
"          '<g id=\"tpb-lotus-leaf\">' +",
"            '<path d=\"M 0 0 C -22 -15 -35 8 -22 25 C -8 38 18 36 28 20 C 38 4 22 -16 0 0 Z\" fill=\"url(#tpb-leaf-grad)\" stroke=\"#1B5E20\" stroke-width=\"0.8\"/>' +",
"            '<path d=\"M 4 12 L -18 8 M 4 12 L -12 24 M 4 12 L 6 28 M 4 12 L 22 18 M 4 12 L 18 0\" stroke=\"#8BC34A\" stroke-width=\"0.6\" fill=\"none\" opacity=\"0.7\"/>' +",
"          '</g>' +",
// --- Marigold (bottom) ---
"          '<g id=\"tpb-marigold-flower\">' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"11\" fill=\"url(#tpb-marigold)\"/>' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"8\" fill=\"#FFA726\" stroke=\"#E65100\" stroke-width=\"0.6\"/>' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"3.5\" fill=\"#BF360C\"/>' +",
"            '<circle cx=\"0\" cy=\"0\" r=\"1.5\" fill=\"#FFF176\"/>' +",
"          '</g>' +",
"        '</defs>' +",
// --- Bottom SVG body: Lake, Chhatris, elephants, lotus garden ---
"        '<rect x=\"0\" y=\"60\" width=\"600\" height=\"150\" fill=\"url(#tpb-lake-water)\"/>' +",
"        '<line x1=\"0\" y1=\"60\" x2=\"600\" y2=\"60\" stroke=\"url(#tpb-gold-foil)\" stroke-width=\"1\"/>' +",
// Palm trees flanking
"        '<use href=\"#tpb-palm-tree\" xlink:href=\"#tpb-palm-tree\" transform=\"translate(210 65) scale(0.9)\"/>' +",
"        '<use href=\"#tpb-palm-tree\" xlink:href=\"#tpb-palm-tree\" transform=\"translate(390 65) scale(-0.9 0.9)\"/>' +",
// Central Chhatri pavilion (palace silhouette)
"        '<use href=\"#tpb-chhatri-pavilion\" xlink:href=\"#tpb-chhatri-pavilion\" transform=\"translate(300 60)\"/>' +",
// Ceremonial elephants flanking pavilion
"        '<image href=\"images/background_images/elephant_vector/elephant_vector_1.png\" xlink:href=\"images/background_images/elephant_vector/elephant_vector_1.png\" x=\"18\" y=\"55\" width=\"125\" height=\"122\" preserveAspectRatio=\"xMidYMid meet\"/>' +",
"        '<image href=\"images/background_images/elephant_vector/elephant_vector_4.png\" xlink:href=\"images/background_images/elephant_vector/elephant_vector_4.png\" x=\"444\" y=\"56\" width=\"138\" height=\"120\" preserveAspectRatio=\"xMidYMid meet\"/>' +",
// Lotus garden
"        '<use href=\"#tpb-lotus-leaf\" xlink:href=\"#tpb-lotus-leaf\" transform=\"translate(38 168) scale(0.7)\"/>' +",
"        '<use href=\"#tpb-lotus-bloom\" xlink:href=\"#tpb-lotus-bloom\" transform=\"translate(75 174) scale(0.7)\"/>' +",
"        '<use href=\"#tpb-marigold-flower\" xlink:href=\"#tpb-marigold-flower\" transform=\"translate(115 180) scale(0.6)\"/>' +",
"        '<use href=\"#tpb-lotus-leaf\" xlink:href=\"#tpb-lotus-leaf\" transform=\"translate(562 168) scale(-0.7 0.7)\"/>' +",
"        '<use href=\"#tpb-lotus-bloom\" xlink:href=\"#tpb-lotus-bloom\" transform=\"translate(525 174) scale(0.7)\"/>' +",
"        '<use href=\"#tpb-marigold-flower\" xlink:href=\"#tpb-marigold-flower\" transform=\"translate(485 180) scale(0.6)\"/>' +",
// Central bottom ornament
"        '<g transform=\"translate(300 172)\">' +",
"          '<path d=\"M -90 0 Q 0 -14 90 0 Q 0 14 -90 0 Z\" fill=\"none\" stroke=\"#B8861B\" stroke-width=\"1.2\" opacity=\"0.6\"/>' +",
"          '<path d=\"M -60 4 Q 0 -6 60 4 Q 0 14 -60 4 Z\" fill=\"none\" stroke=\"#D4A02A\" stroke-width=\"0.8\" opacity=\"0.5\"/>' +",
"          '<circle cx=\"-55\" cy=\"0\" r=\"2.5\" fill=\"#B8861B\"/><circle cx=\"-28\" cy=\"0\" r=\"2.5\" fill=\"#B8861B\"/>' +",
"          '<circle cx=\"0\" cy=\"0\" r=\"3.5\" fill=\"#145A32\"/><circle cx=\"28\" cy=\"0\" r=\"2.5\" fill=\"#B8861B\"/><circle cx=\"55\" cy=\"0\" r=\"2.5\" fill=\"#B8861B\"/>' +",
"          '<use href=\"#tpb-lotus-bloom\" xlink:href=\"#tpb-lotus-bloom\" transform=\"translate(0 -10) scale(0.8)\"/>' +",
"        '</g>' +",
"      '</svg>' +",
"    '</div>';",
"  }"
].join('\n');

// Insert the helper when the old function is absent, otherwise replace it.
const startMarker = '  function teluguPelliBackdrop() {';
const startIdx = code.indexOf(startMarker);
const invitationMarker = '  IH.invitation = {';
const invitationIdx = code.indexOf(invitationMarker);

if (invitationIdx === -1) {
  console.error('ERROR: Could not find IH.invitation = { insertion point');
  process.exit(1);
}

if (startIdx === -1) {
  code = code.substring(0, invitationIdx) + newFunc + '\n\n' + code.substring(invitationIdx);
} else {
  const oldFunc = code.substring(startIdx, invitationIdx);
  code = code.substring(0, startIdx) + newFunc + '\n\n' + code.substring(invitationIdx);
  console.log('  Old function length:', oldFunc.length, 'chars');
}
console.log('  New function length:', newFunc.length, 'chars');

// Also ensure the render hook is present in IH.invitation.render
const hookStr = "      if (tplSlug === 'telugu-pelli') {\n        html.push(teluguPelliBackdrop());\n      }\n";
if (!code.includes("if (tplSlug === 'telugu-pelli')")) {
  const articlePushMarker = "aria-label=\"' + escapeHtml(meta.label) + ' invitation preview\">');";
  const articleIdx = code.indexOf(articlePushMarker);
  if (articleIdx !== -1) {
    const insertAfter = articleIdx + articlePushMarker.length;
    code = code.substring(0, insertAfter) + '\n\n' + hookStr + code.substring(insertAfter);
    console.log('✓ Added telugu-pelli render hook inside IH.invitation.render');
  }
}

fs.writeFileSync(previewPath, code, 'utf8');
console.log('✓ Successfully updated teluguPelliBackdrop() in js/preview.js');

// Quick syntax check
try {
  new Function(code);
  console.log('✓ JS syntax validation: PASSED');
} catch (e) {
  console.error('✗ JS syntax error:', e.message);
}
