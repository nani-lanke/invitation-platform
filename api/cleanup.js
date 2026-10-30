/* ====================================================================
   api/cleanup.js — delete hosted invitations whose time is up

   Run once a day by Vercel Cron (vercel.json "crons"). Every registry
   entry whose expiresAt has passed (31 days after the event — see
   api/_expiry) loses its host page, card page, photos and music in one
   commit, and the entry is kept as a record with hostingStatus 'deleted'.

   Media names are built from the names and date, so two invitations can
   share a file; a path still listed by a live invitation is never removed.

   Vercel sends "Authorization: Bearer $CRON_SECRET" with cron calls when
   CRON_SECRET is set in the project. Without it this refuses to run, so
   nobody else can trigger deletions (expired pages are still hidden by
   api/invite either way).
   ==================================================================== */

'use strict';

const github = require('./_github');
const expiry = require('./_expiry');

const INDEX = 'invitation_card/index.json';

/* A cron run has a short time limit; anything left over goes next day. */
const MAX_PER_RUN = 40;

function json(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return json(res, 503, { error: 'Set CRON_SECRET in the Vercel project to enable cleanup.' });
  }
  if (req.headers.authorization !== 'Bearer ' + secret) {
    return json(res, 401, { error: 'Not authorised.' });
  }

  try {
    const found = await github.getFile(INDEX);
    if (!found) return json(res, 200, { deleted: 0, note: 'no registry yet' });

    const entries = JSON.parse(found.text);
    if (!Array.isArray(entries)) throw new Error('index.json is not a list');

    const now = Date.now();
    const due = entries.filter(function (e) {
      return e && e.hostingStatus === 'active' && expiry.isExpired(e, now);
    }).slice(0, MAX_PER_RUN);

    if (!due.length) return json(res, 200, { deleted: 0 });

    /* Paths any other still-live invitation points at stay put. */
    const keep = new Set();
    entries.forEach(function (e) {
      if (e && e.hostingStatus === 'active' && due.indexOf(e) === -1) {
        (e.files || []).forEach(function (p) { keep.add(p); });
      }
    });

    const paths = new Set();
    due.forEach(function (e) {
      const own = Array.isArray(e.files) && e.files.length ? e.files : [
        'invitation_card/' + e.filename,
        'invitation_card/invitations/' + e.filename
      ];
      own.forEach(function (p) {
        if (p !== INDEX && p.indexOf('invitation_card/') === 0 && !keep.has(p)) paths.add(p);
      });
    });

    const present = [];
    for (const p of paths) {
      if (await github.exists(p)) present.push(p);
    }

    const stamp = new Date(now).toISOString();
    due.forEach(function (e) {
      e.hostingStatus = 'deleted';
      e.deletedAt = stamp;
    });

    const changes = present.map(function (p) { return { path: p, remove: true }; });
    changes.push({
      path: INDEX,
      content: Buffer.from(JSON.stringify(entries, null, 2), 'utf8').toString('base64')
    });

    const written = await github.putFiles(
      changes,
      'Remove ' + due.length + ' expired invitation' + (due.length === 1 ? '' : 's')
    );

    console.log('[CLEANUP] removed', {
      invitations: due.map(function (e) { return e.filename; }),
      files: present.length,
      commit: written.commit
    });

    return json(res, 200, {
      deleted: due.length,
      files: present.length,
      commit: written.commit
    });
  } catch (err) {
    console.error('cleanup failed:', err);
    return json(res, 500, { error: 'Cleanup failed: ' + err.message });
  }
};
