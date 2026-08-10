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
const MAX_BODY = 64 * 1024;   // the fields are text; anything larger is not

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

    const file = validate.fileName(IH, state);
    const path = FOLDER + '/' + file;
    const url = root + path;

    const html = IH.exportPage.buildHtml(state, { up: '../', canonical: url });

    const written = await github.putFile(path, html, 'Publish invitation: ' + file);

    return json(res, 201, {
      url: url,
      path: path,
      file: file,
      replaced: written.replaced,
      commit: written.url
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
