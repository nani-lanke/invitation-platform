/* Writes one <url> per template (/templates/<slug>, served by
   api/template-page.js) into sitemap.xml, between the TEMPLATE PAGES
   markers. Re-run after adding or removing templates:

     node scripts/build-template-sitemap.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const browser = require('../api/_browser');

const ROOT = path.join(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const SITE = 'https://www.inviteaura.in';
const START = '  <!-- TEMPLATE PAGES: written by scripts/build-template-sitemap.js -->';
const END = '  <!-- /TEMPLATE PAGES -->';

const IH = browser.load(SITE + '/');
let templates = IH.data.templates.slice();
const rd = IH.redesignCollection;
if (rd && rd.enabled) templates = templates.concat(rd.templates());

const today = new Date().toISOString().slice(0, 10);
const block = [START].concat(templates.map(function (t) {
  return '  <url><loc>' + SITE + '/templates/' + t.slug + '</loc><lastmod>' + today +
    '</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>';
}), [END]).join('\n');

let xml = fs.readFileSync(SITEMAP, 'utf8');
const a = xml.indexOf(START);
const b = xml.indexOf(END);
if (a !== -1 && b !== -1) xml = xml.slice(0, a) + block + xml.slice(b + END.length);
else xml = xml.replace('</urlset>', block + '\n\n</urlset>');
fs.writeFileSync(SITEMAP, xml);
console.log('sitemap.xml: ' + templates.length + ' template pages');
