/* ====================================================================
   api/invite.js — serving a page that was committed after the last build

   Vercel serves the files that existed when a deployment was built. An
   invitation published a minute ago is in the repository but not in that
   deployment, so a request for it would 404 until the next build — and
   building once per invitation is not something a public site can do.

   vercel.json rewrites /invitation_card/<name>.html here instead. This
   reads the file back out of the repository and returns it, so the
   address works the moment the commit lands.

   The read is cached at Vercel's edge, so guests opening the same
   invitation do not each cost a GitHub API call: an invitation never
   changes after it is published, and the s-maxage below is what keeps
   the 5,000-per-hour API budget irrelevant.
   ==================================================================== */

'use strict';

const github = require('./_github');

const FOLDER = 'invitation_card';

/* Only a flat filename, and only .html. No slashes means no traversal,
   and no directory listing to stumble into. */
const NAME = /^[A-Za-z0-9._-]{1,120}\.html$/;

function fail(res, status, message) {
  res.status(status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
  res.end(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Invitation not found</title>' +
    '<link rel="stylesheet" href="/css/style.css"></head><body>' +
    '<main class="container" style="max-width:34rem;margin:4rem auto;text-align:center">' +
    '<h1>' + message + '</h1>' +
    '<p>Ask whoever invited you to send the link again.</p>' +
    '<p><a class="btn btn--primary" href="/create.html">Create your own invitation</a></p>' +
    '</main></body></html>'
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return fail(res, 405, 'That is not something this page does');
  }

  /* The rewrite passes the filename through; a direct call may too. */
  const name = String((req.query && req.query.file) || '').trim();

  if (!NAME.test(name)) {
    return fail(res, 404, 'This invitation link looks incomplete');
  }

  try {
    const found = await github.getFile(FOLDER + '/' + name);
    if (!found) {
      return fail(res, 404, 'This invitation is no longer here');
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    /* Published invitations do not change, so the edge may hold one for
       an hour and keep serving a stale copy for a day while it
       refreshes — which also carries guests through a GitHub outage. */
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(req.method === 'HEAD' ? '' : found.text);
  } catch (err) {
    console.error('serving ' + name + ' failed:', err);
    return fail(res, 502, 'This invitation could not be loaded just now');
  }
};
