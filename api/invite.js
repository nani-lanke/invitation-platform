/* ====================================================================
   api/invite.js — serving a page that was committed after the last build

   Vercel serves the files that existed when a deployment was built. An
   invitation published a minute ago is in the repository but not in that
   deployment, so a request for it would 404 until the next build — and
   building once per invitation is not something a public site can do.

   vercel.json rewrites /invitation_card/<name>.html here instead. This reads
   the file back out of the repository and returns it, so the address
   works the moment the commit lands. The same route also serves the
   photos and music committed beside the page (main_image/…, etc.).

   The read is cached at Vercel's edge, so guests opening the same
   invitation do not each cost a GitHub API call: an invitation never
   changes after it is published, and the s-maxage below is what keeps
   the 5,000-per-hour API budget irrelevant.

   The legacy /invitations/… rewrite still lands here too, so pages
   published before this folder existed keep working.
   ==================================================================== */

'use strict';

const github = require('./_github');
const expiry = require('./_expiry');

const DEFAULT_DIR = 'invitation_card';
const LEGACY_DIR = 'invitations';
const INDEX = DEFAULT_DIR + '/index.json';
const HOUR = 3600;
const DAY = 86400;

/* Only .html, either flat (the host page) or one folder down in
   invitations/ (its card page, which api/publish commits beside it).
   No other slash means no traversal and no directory listing. */
const HTML_NAME = /^(invitations\/)?[A-Za-z0-9._-]{1,120}\.html$/;

/* Media sits one folder under the page, in exactly the folders
   js/export.js uses. The registry file index.json matches neither rule,
   so it is never served. */
const ASSET_NAME = /^(main_image|background_image|sample_images|background_music)\/[A-Za-z0-9._-]{1,160}$/;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webm': 'audio/webm',
  '.flac': 'audio/flac'
};

/* Invitations are public by design, so a cross-origin read (e.g. the
   editor checking a just-published URL from a different host) is fine. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS'
};

function fail(res, status, message, note) {
  res.status(status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
  Object.keys(CORS).forEach(function (k) { res.setHeader(k, CORS[k]); });
  res.end(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + (status === 410 ? 'Invitation ended' : 'Invitation not found') + '</title>' +
    '<link rel="stylesheet" href="/css/style.css"></head><body>' +
    '<main class="container" style="max-width:34rem;margin:4rem auto;text-align:center">' +
    '<h1>' + message + '</h1>' +
    '<p>' + (note || 'Ask whoever invited you to send the link again.') + '</p>' +
    '<p><a class="btn btn--primary" href="/create.html">Create your own invitation</a></p>' +
    '</main></body></html>'
  );
}

/* The registry entry for a host page ('x.html') or its card page
   ('invitations/x.html'). A failed registry read returns null, so a
   GitHub hiccup never takes a live invitation down. */
async function entryFor(name) {
  try {
    const found = await github.getFile(INDEX);
    if (!found) return null;
    const entries = JSON.parse(found.text);
    const file = name.replace(/^invitations\//, '');
    return (Array.isArray(entries) ? entries : []).find(function (e) {
      return e && e.filename === file;
    }) || null;
  } catch (err) {
    console.error('registry read for ' + name + ' failed:', err.message);
    return null;
  }
}

/* Edge caching that can never outlive the invitation: hold it for an hour
   (plus a day of stale-while-revalidate) only while that much time is left. */
function cacheFor(left) {
  if (left === Infinity || left > HOUR + DAY) {
    return 'public, max-age=0, s-maxage=' + HOUR + ', stale-while-revalidate=' + DAY;
  }
  const hold = Math.max(1, Math.min(HOUR, left));
  return 'public, max-age=0, s-maxage=' + hold + ', stale-while-revalidate=' + Math.max(0, left - hold);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204);
    Object.keys(CORS).forEach(function (k) { res.setHeader(k, CORS[k]); });
    return res.end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    return fail(res, 405, 'That is not something this page does');
  }

  /* The rewrite passes the folder and filename through; a direct call may
     too. Only the two folders this site has ever served are accepted. */
  const dir = String((req.query && req.query.dir) || DEFAULT_DIR);
  if (dir !== DEFAULT_DIR && dir !== LEGACY_DIR) {
    return fail(res, 404, 'This invitation link looks incomplete');
  }

  const name = String((req.query && req.query.file) || '').trim();

  try {
    if (HTML_NAME.test(name)) {
      /* Hosted invitations end 31 days after the event (api/_expiry);
         api/cleanup deletes the files, this stops serving them on time. */
      const entry = dir === DEFAULT_DIR ? await entryFor(name) : null;
      const left = expiry.secondsLeft(entry);
      if (left <= 0) {
        return fail(res, 410, 'This invitation has ended',
          'Hosted invitations are removed ' + expiry.DAYS_AFTER_EVENT + ' days after the event. Thank you for celebrating with us.');
      }

      const found = await github.getFile(dir + '/' + name);
      if (!found) {
        return fail(res, 404, 'This invitation is no longer here');
      }

      res.status(200);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      /* Published invitations do not change, so the edge may hold one for
         an hour and keep serving a stale copy for a day while it
         refreshes — which also carries guests through a GitHub outage —
         but never past the invitation's end. */
      res.setHeader('Cache-Control', cacheFor(left));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      Object.keys(CORS).forEach(function (k) { res.setHeader(k, CORS[k]); });
      res.end(req.method === 'HEAD' ? '' : found.text);
      return;
    }

    if (ASSET_NAME.test(name)) {
      const found = await github.getRaw(dir + '/' + name);
      if (!found) {
        return fail(res, 404, 'This photo or track is no longer here');
      }

      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';

      res.status(200);
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      Object.keys(CORS).forEach(function (k) { res.setHeader(k, CORS[k]); });
      res.end(req.method === 'HEAD' ? '' : found.buffer);
      return;
    }

    return fail(res, 404, 'This invitation link looks incomplete');
  } catch (err) {
    console.error('serving ' + name + ' failed:', err);
    return fail(res, 502, 'This invitation could not be loaded just now');
  }
};