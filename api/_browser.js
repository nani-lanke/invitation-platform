/* ====================================================================
   api/_browser.js — running the site's own renderer on the server

   The invitation markup is built by js/preview.js, and the surrounding
   page by js/export.js. Both are plain string building: no element is
   ever touched until a page controller boots. Rather than keep a second
   renderer here, which would drift from the first the moment someone
   edits a template, those files are loaded into a small sandbox that
   supplies just enough of a browser for them to define themselves.

   The trick that makes it safe is document.readyState. Every module ends
   with the same line:

       if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot)

   so reporting 'loading' from a document whose DOMContentLoaded never
   fires means the definitions run and the page controllers never do.

   Exports:
     load(siteRoot) -> the IH namespace, ready to render
   ==================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* Order matters: main.js defines IH.dom, which the rest close over. */
const SCRIPTS = [
  'js/main.js',      // IH.dom, IH.icon, IH.store, IH.toast
  'js/templates.js', // IH.data — templates and their palettes
  'js/countdown.js', // IH.countdown — markup() is needed by the page builder
  'js/preview.js',   // IH.invitation.render
  'js/export.js'     // IH.exportPage.buildHtml
];

/* These are read at runtime from paths built out of the array above, which
   Vercel's file tracer cannot follow — nothing statically references them.
   vercel.json therefore carries `includeFiles: "js/**"` for this function.
   Without that line the folder is simply absent from the deployment and
   every publish fails with ENOENT, so the error below says as much rather
   than leaving a bare stack trace in the log. */
const ROOTS = [path.join(__dirname, '..'), process.cwd()];

function resolve(rel) {
  for (const root of ROOTS) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) return full;
  }
  throw new Error(
    'Cannot find ' + rel + ' in the deployment (looked in ' + ROOTS.join(', ') + '). ' +
    'The js/ folder is only bundled into this function if vercel.json sets ' +
    'functions["api/publish.js"].includeFiles to "js/**".'
  );
}

/* The scripts are read once per warm function instance; only the tiny
   sandbox is rebuilt per request, since it carries the request's origin. */
let sources = null;

function readSources() {
  if (!sources) {
    sources = SCRIPTS.map(function (rel) {
      return { file: rel, code: fs.readFileSync(resolve(rel), 'utf8') };
    });
  }
  return sources;
}

function stubElement() {
  const noop = function () {};
  return {
    style: { setProperty: noop },
    dataset: {},
    classList: { add: noop, remove: noop, toggle: noop, contains: function () { return false; } },
    setAttribute: noop,
    getAttribute: function () { return null; },
    removeAttribute: noop,
    appendChild: noop,
    removeChild: noop,
    addEventListener: noop,
    removeEventListener: noop,
    focus: noop,
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    getBoundingClientRect: function () { return { top: 0, left: 0, width: 0, height: 0 }; },
    innerHTML: '',
    textContent: '',
    hidden: false
  };
}

function makeSandbox(siteRoot) {
  const noop = function () {};
  const url = new URL(siteRoot);

  const document = {
    readyState: 'loading',            // the whole reason no controller boots
    title: '',
    addEventListener: noop,
    removeEventListener: noop,
    createElement: stubElement,
    createElementNS: stubElement,
    documentElement: stubElement(),
    head: stubElement(),
    body: stubElement(),
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    getElementById: function () { return null; }
  };

  const window = {
    document: document,
    location: {
      href: siteRoot,
      origin: url.origin,
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      search: ''
    },
    navigator: { userAgent: 'node', language: 'en' },
    /* IH.store probes localStorage inside a try/catch and falls back to
       memory when it throws, so leaving it undefined is the right stub. */
    btoa: function (s) { return Buffer.from(s, 'binary').toString('base64'); },
    atob: function (s) { return Buffer.from(s, 'base64').toString('binary'); },
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    escape: global.escape,
    unescape: global.unescape,
    TextEncoder: TextEncoder,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: noop,
    cancelAnimationFrame: noop,
    addEventListener: noop,
    removeEventListener: noop,
    isSecureContext: true,
    console: console
  };
  window.window = window;
  window.self = window;
  window.globalThis = window;

  return window;
}

/* Returns the IH namespace with the renderer attached. siteRoot is the
   deployed origin plus any subpath, e.g. 'https://invites.vercel.app/'. */
function load(siteRoot) {
  const sandbox = makeSandbox(siteRoot);
  const context = vm.createContext(sandbox);

  readSources().forEach(function (script) {
    vm.runInContext(script.code, context, { filename: script.file, timeout: 5000 });
  });

  const IH = sandbox.IH;
  if (!IH || !IH.invitation || !IH.exportPage) {
    throw new Error('renderer did not load: the js/ modules may have moved');
  }
  return IH;
}

module.exports = { load: load };
