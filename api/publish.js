/* ====================================================================
   api/publish.js — POST an invitation, get back its address

   The one thing GitHub Pages could not do. The browser sends the fields
   a host filled in; this renders the page with the site's own renderer
   and commits it to invitation_card/ in the repository.

   Vercel serves files from a deployment rather than live from the repo,
   so a commit alone would not publish anything until the next build —
   and a build per invitation would exhaust the daily deployment budget
   on a public site. api/invite.js closes that gap by reading the file
   back out of the repository on request, which is why the address works
   immediately and no redeploy is involved.

       POST /api/publish   { title, date, time, venue, ... }
       201  { url, path, file, replaced }

   Every guard this endpoint needs is in _validate.js and _limit.js; the
   reasoning for each lives there.
   ==================================================================== */

'use strict';

const browser = require('./_browser');
const validate = require('./_validate');
const limit = require('./_limit');
const github = require('./_github');

const FOLDER = 'invitation_card';
const MAIN_DIR = 'main_image';
const MUSIC_DIR = 'background_music';

/* Vercel refuses a request body over 4.5 MB before this function runs, so
   this only catches the cases it can still answer politely. _validate.js
   holds the real ceiling. */
const MAX_BODY = 5 * 1024 * 1024;

/* The deployed origin, taken from the request rather than configured, so
   preview deployments and the production domain each describe themselves
   correctly in the page's og: tags. */
function siteRoot(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + host + '/';
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  const declared = Number(req.headers['content-length'] || 0);
  if (declared > MAX_BODY) {
    return json(res, 413, { error: 'That invitation is too large to publish.' });
  }

  try {
    const gate = await limit.check(req);
    if (!gate.ok) {
      res.setHeader('Retry-After', String(gate.retryAfter));
      return json(res, 429, { error: gate.error });
    }

    /* Vercel parses JSON bodies, but a hand-rolled request may send a
       string, and a malformed one should read as a bad request rather
       than a crash. */
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (err) {
        return json(res, 400, { error: 'The request body was not valid JSON.' });
      }
    }

    const checked = validate.clean(body);
    if (!checked.ok) return json(res, 400, { error: checked.error });

    const root = siteRoot(req);
    const IH = browser.load(root);
    const state = checked.state;

    /* Templates carry the palette, so a host who did not pick colours
       still gets the design they chose rather than the bare defaults. */
    if (!state.customColors) IH.invitation.applyTemplate(state, state.template);

    const base = validate.baseName(IH, state);
    const file = base + '.html';
    const path = FOLDER + '/' + file;
    const url = root + path;

    /* extractAssets is the same function the .zip route calls, so the
       server and the download produce identical paths rather than two
       layouts that merely resemble each other. It rewrites the state's
       data: URLs into the relative paths the page will ask for, and hands
       back the bytes to commit alongside it. */
    const split = IH.exportPage.extractAssets(state, base);

    let music = null;
    if (String(state.musicFile || '').slice(0, 11) === 'data:audio/') {
      const m = /^data:audio\/([\w.+-]+);/.exec(state.musicFile);
      const ext = ({ mpeg: 'mp3', mp3: 'mp3', mp4: 'm4a', 'x-m4a': 'm4a',
                     aac: 'aac', ogg: 'ogg', wav: 'wav', 'x-wav': 'wav',
                     webm: 'webm', flac: 'flac' })[(m && m[1] || '').toLowerCase()] || 'mp3';
      music = { path: MUSIC_DIR + '/' + base + '_music.' + ext, data: state.musicFile };
      split.state.musicFile = music.path;
    }

    const mainPhoto = split.assets.filter(function (a) {
      return a.path.indexOf(MAIN_DIR + '/') === 0;
    })[0] || split.assets[0];

    const html = IH.exportPage.buildHtml(split.state, {
      up: '../',
      canonical: url,
      image: mainPhoto ? root + FOLDER + '/' + mainPhoto.path : ''
    });

    /* One commit for the page and everything it needs, so the invitation
       is never live with its photos still missing. */
    const files = [{ path: path, content: Buffer.from(html, 'utf8').toString('base64') }];
    split.assets.concat(music ? [music] : []).forEach(function (a) {
      files.push({
        path: FOLDER + '/' + a.path,
        content: String(a.data).slice(String(a.data).indexOf(',') + 1)
      });
    });

    const written = await github.putFiles(files, 'Publish invitation: ' + file);

    return json(res, 201, {
      url: url,
      path: path,
      file: file,
      files: files.map(function (f) { return f.path; }),
      count: written.count,
      commit: written.commit
    });
  } catch (err) {
    /* The message can name the repository or the token's permissions, so
       it goes to the function log and never to the caller. */
    console.error('publish failed:', err);
    return json(res, 500, {
      error: 'The invitation could not be published. If you are setting this up, ' +
             'set ALLOW_CHECK=1 and open /api/check — it names the step that failed.'
    });
  }
};
