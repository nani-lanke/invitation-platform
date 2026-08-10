/* ====================================================================
   api/_validate.js — what a stranger is allowed to publish

   Everything here exists because /api/publish is open to the internet
   and writes into a real repository. The browser sends field values, not
   markup: if it sent finished HTML, anyone could publish any page they
   liked on your domain, and no amount of sanitising would reliably fix
   that. So the server accepts a fixed list of fields, each capped and
   shaped, and renders the page itself.

   Two rules earn their own explanation:

   * mapsUrl becomes an href. The renderer escapes it, but escaping does
     nothing to `javascript:` — no quotes or angle brackets are involved.
     Locally that was only ever self-inflicted; published from a public
     form it is stored XSS on your own domain, so the scheme is checked.

   * Photos are refused outright. They arrive as data: URLs, which are
     megabytes each and the easiest way to fill a repository with junk.
     Invitations published through the form are text and template art.

   Exports:
     clean(body) -> { ok: true, state } | { ok: false, error }
     fileName(IH, state) -> 'Title_2026-08-10_1830.html'
   ==================================================================== */

'use strict';

const HEX = /^#[0-9A-Fa-f]{3,8}$/;

/* Field -> how it is allowed to look. Anything absent from this table is
   dropped silently, which is also what keeps editor-only bookkeeping
   (step, plan, updatedAt) out of a published page. */
const TEXT = {
  eventType:  40,
  template:   60,
  title:     120,
  hostName:  120,
  brideName:  80,
  groomName:  80,
  personName: 80,
  years:       4,
  venue:     160,
  address:   400,
  phone:      40,
  email:     160,
  message:  1200,
  font:       40,
  animation:  30
};

const FLAGS = ['customColors', 'showCountdown', 'showRsvp', 'showMaps', 'showGallery'];
const COLOR_KEYS = ['primary', 'secondary', 'bg1', 'bg2', 'ink'];

/* Control characters would survive escaping and land in the markup, and
   a stray newline in a name is never intentional. */
const CONTROL = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

function text(value, max) {
  return String(value)
    .replace(CONTROL, ' ')
    .trim()
    .slice(0, max);
}

function clean(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Expected an invitation object.' };
  }

  if (body.photo || body.background || (body.gallery && body.gallery.length)) {
    return {
      ok: false,
      error: 'Published invitations cannot carry uploaded photos. ' +
             'Use Download page folder to publish one with photos yourself.'
    };
  }

  const state = {};

  Object.keys(TEXT).forEach(function (key) {
    const raw = body[key];
    if (typeof raw !== 'string' && typeof raw !== 'number') return;
    const value = text(raw, TEXT[key]);
    if (value) state[key] = value;
  });

  if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    state.date = body.date;
  }
  if (typeof body.time === 'string' && /^\d{2}:\d{2}$/.test(body.time)) {
    state.time = body.time;
  }

  if (typeof body.mapsUrl === 'string' && body.mapsUrl) {
    let parsed = null;
    try { parsed = new URL(body.mapsUrl); } catch (err) { parsed = null; }
    if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
      return { ok: false, error: 'The map link must be an http or https address.' };
    }
    if (body.mapsUrl.length > 500) {
      return { ok: false, error: 'The map link is too long.' };
    }
    state.mapsUrl = body.mapsUrl;
  }

  FLAGS.forEach(function (key) {
    if (typeof body[key] === 'boolean') state[key] = body[key];
  });

  if (body.colors && typeof body.colors === 'object') {
    const colors = {};
    COLOR_KEYS.forEach(function (key) {
      if (typeof body.colors[key] === 'string' && HEX.test(body.colors[key])) {
        colors[key] = body.colors[key];
      }
    });
    if (Object.keys(colors).length === COLOR_KEYS.length) state.colors = colors;
  }

  /* A card with no name and no title has nothing to say, and would give
     every such attempt the same filename. */
  if (!state.title && !state.brideName && !state.groomName &&
      !state.personName && !state.hostName) {
    return { ok: false, error: 'Give the invitation a title or a name first.' };
  }

  return { ok: true, state: state };
}

/* The same stem js/publish.js builds, so a page published through the
   server and one unpacked from the .zip land on the same address:

       Groom_Bride_2026-08-10_1830.html

   safeBase comes from js/export.js, so both sides agree on what a
   filesystem-safe name looks like. */
function fileName(IH, state) {
  const part = function (v) { return IH.exportPage.safeBase(String(v || '').trim()); };
  const groom = state.groomName ? part(state.groomName) : '';
  const bride = state.brideName ? part(state.brideName) : '';

  const who = (groom && bride) ? groom + '_' + bride
            : groom || bride
            || (state.personName && part(state.personName))
            || (state.hostName && part(state.hostName))
            || (state.title && part(state.title))
            || 'Invitation';

  const parts = [who, /^\d{4}-\d{2}-\d{2}$/.test(state.date || '') ? state.date : 'undated'];
  if (/^\d{2}:\d{2}$/.test(state.time || '')) parts.push(state.time.replace(':', ''));

  return parts.join('_') + '.html';
}

module.exports = { clean: clean, fileName: fileName };
