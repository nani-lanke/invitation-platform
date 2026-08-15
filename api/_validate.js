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

   * Uploads are accepted but bounded. They arrive as data: URLs — the
     easiest way to fill a repository with junk — so every one is checked
     for a real image or audio type, capped on its own, and capped again
     as a total. The ceiling is not arbitrary: a Vercel function refuses
     a request body over 4.5 MB outright, and base64 inflates bytes by a
     third, so anything larger never reaches this file to be rejected
     politely. Better to fail here with a sentence that explains itself.

   Exports:
     clean(body) -> { ok: true, state } | { ok: false, error }
     baseName(IH, state) -> 'Rahul_Priya_15-08-2026_1830'
     fileName(IH, state) -> 'Rahul_Priya_15-08-2026_1830.html'

   The stem returned by baseName is the shared name for the page's media.
   The hosted page's own filename is built in api/publish.js from that
   name plus a random id ('rahul-priya-a8f42c.html').
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
  babyName:   80,
  babyRelation: 12,
  parentsName:120,
  organization: 120,
  department: 80,
  classCourse: 80,
  role:       80,
  yearsOfService: 4,
  eventKind:  80,
  theme:      80,
  years:       4,
  venue:     160,
  address:   400,
  phone:      40,
  email:     160,
  message:  1200,
  additionalInformation: 1200,
  font:       40,
  animation:  30
};

/* Vercel caps a function's request body at 4.5 MB. Staying under it with
   room to spare keeps the failure a readable message rather than a blank
   413 from the platform. */
const MAX_TOTAL = 4 * 1024 * 1024;
const MAX_IMAGE = 2 * 1024 * 1024;
const MAX_AUDIO = 3 * 1024 * 1024;
const MAX_GALLERY = 6;

const IMAGE_URL = /^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/;
const AUDIO_URL = /^data:audio\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/;

/* base64 carries 3 bytes in every 4 characters. */
function decodedSize(dataUrl) {
  const b64 = String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor(b64.length * 3 / 4) - pad;
}

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
      !state.personName && !state.babyName && !state.hostName) {
    return { ok: false, error: 'Give the invitation a title or a name first.' };
  }

  /* Uploads. Each is checked for a real type before its size, so a text
     file renamed .jpg is refused for what it is rather than for being
     small enough to slip through. */
  let budget = MAX_TOTAL;

  function accept(value, kind, label) {
    const pattern = kind === 'audio' ? AUDIO_URL : IMAGE_URL;
    const cap = kind === 'audio' ? MAX_AUDIO : MAX_IMAGE;

    if (typeof value !== 'string' || !value) return null;
    if (!pattern.test(value)) {
      throw new Error(label + ' is not a ' + (kind === 'audio' ? 'supported audio file' : 'supported image') + '.');
    }
    const size = decodedSize(value);
    if (size > cap) {
      throw new Error(label + ' is ' + Math.round(size / 1024 / 1024 * 10) / 10 +
                      ' MB — the limit for publishing is ' + (cap / 1024 / 1024) + ' MB.');
    }
    budget -= size;
    if (budget < 0) {
      throw new Error('Together your photos and music are over ' +
                      (MAX_TOTAL / 1024 / 1024) + ' MB. Remove one, or use Download page folder.');
    }
    return value;
  }

  try {
    const photo = accept(body.photo, 'image', 'The main photo');
    if (photo) state.photo = photo;

    const background = accept(body.background, 'image', 'The background image');
    if (background) state.background = background;

    if (Array.isArray(body.gallery)) {
      const gallery = [];
      body.gallery.slice(0, MAX_GALLERY).forEach(function (src, i) {
        const ok = accept(src, 'image', 'Gallery photo ' + (i + 1));
        if (ok) gallery.push(ok);
      });
      if (gallery.length) state.gallery = gallery;
    }

    const music = accept(body.musicFile, 'audio', 'The background music');
    if (music) {
      state.musicFile = music;
      if (typeof body.music === 'string') state.music = text(body.music, 120);
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }

  return { ok: true, state: state };
}

/* The canonical stem the page and all its assets share. The generator
   itself lives in js/export.js (buildInvitationFilename), which both the
   editor and this server load, so the .zip and the server commit produce
   exactly the same filename as Download .html:

       Rahul_Priya_15-08-2026_1830
       Rahul_Priya_15-08-2026_1830.html */
function baseName(IH, state) {
  return IH.exportPage.baseName(state);
}

function fileName(IH, state) {
  return IH.exportPage.fileName(state);
}

module.exports = { clean: clean, baseName: baseName, fileName: fileName };
