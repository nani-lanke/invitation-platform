/* ====================================================================
   api/template-page.js — /templates/<slug>, one page per template

   vercel.json rewrites /templates/royal-wedding here. The page is
   preview.html itself, with the template's own title, description,
   canonical, share tags and heading written into the HTML, so search
   engines and link previews see them without running any script.
   js/preview.js reads the slug from the path and draws the card as it
   always has.

   The template data comes from the site's own js/ modules, loaded
   through api/_browser.js, so a new template gets its page for free.
   ==================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const browser = require('./_browser');

const SITE = 'https://www.inviteaura.in';
const PAGE_FILE = path.join(__dirname, '..', 'preview.html');

let IH = null;
let PAGE = null;

function attr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Sets the content of one <meta> or the href of the canonical link. */
function setMeta(html, selector, value) {
  const re = new RegExp('(<meta ' + selector + ' content=")[^"]*(")');
  return html.replace(re, '$1' + attr(value) + '$2');
}

function build(tpl, slug) {
  const url = SITE + '/templates/' + slug;
  /* Same wording as js/preview.js; the category tells same-named templates apart. */
  const title = tpl.name + ' — ' + (tpl.categoryLabel ? tpl.categoryLabel + ' ' : '') + 'Invitation Template | InviteAura';
  const desc = tpl.name + ' — ' + (tpl.blurb || (tpl.categoryLabel || 'Digital') + ' invitation template.') +
    ' Preview and personalise it free on InviteAura.';
  /* The template's own picture when it is one WhatsApp and Facebook can show. */
  const image = /\.(jpe?g|png|webp)$/i.test(tpl.image || '') ? SITE + '/' + tpl.image.replace(/^\//, '') : null;

  let html = PAGE;
  /* Every path in preview.html (and in the scripts) is relative to the site root. */
  html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">');
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + attr(title) + '</title>');
  html = setMeta(html, 'name="description"', desc);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + url + '$2');
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', desc);
  html = setMeta(html, 'property="og:url"', url);
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', desc);
  if (image) {
    html = setMeta(html, 'property="og:image"', image);
    html = setMeta(html, 'name="twitter:image"', image);
    /* The site-wide card's type and size no longer apply. */
    html = html.replace(/<meta property="og:image:(type|width|height)" content="[^"]*">\n?/g, '');
  }
  /* With <base href="/"> a bare #main would jump to the home page. */
  html = html.replace('href="#main"', 'href="/templates/' + slug + '#main"');
  html = html.replace(/(<h1[^>]*data-preview-name>)[^<]*(<\/h1>)/, '$1' + attr(tpl.name) + '$2');
  html = html.replace(/(<p[^>]*data-preview-blurb[^>]*>)(<\/p>)/, '$1' + attr(tpl.blurb || '') + '$2');
  return html;
}

module.exports = function handler(req, res) {
  const slug = String((req.query && req.query.slug) || '').toLowerCase();
  if (!IH) IH = browser.load(SITE + '/');
  if (!PAGE) PAGE = fs.readFileSync(PAGE_FILE, 'utf8');

  const tpl = /^[a-z0-9-]{1,100}$/.test(slug) ? IH.data.getTemplate(slug) : null;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!tpl) {
    /* preview.js shows "Template not found"; keep it out of search results. */
    res.statusCode = 404;
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
    return res.end(PAGE
      .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">\n<meta name="robots" content="noindex">')
      .replace('href="#main"', 'href="/templates/' + attr(slug) + '#main"'));
  }

  res.statusCode = 200;
  /* The page changes only on deploy; the CDN keeps it for a day. */
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
  return res.end(build(tpl, slug));
};
