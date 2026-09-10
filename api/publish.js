/* ====================================================================
   api/publish.js — POST an invitation, get back its public address

   Publishes an invitation page and its assets into invitation_card/ through
   the GitHub API, then verifies the committed file reads back before a
   URL is ever returned.

   The public URL is generated once, here, and returned to the browser as
   publicUrl. Nothing in the browser builds it for the hosted route:

       https://<domain>/invitation_card/<slug>-<id>.html

   A ₹99 Razorpay payment must be verified before anything is hosted. The
   browser already verifies it against api/verify and sends the Razorpay
   ids here, so the same signature is checked again before the commit.
   ==================================================================== */

'use strict';

const crypto = require('crypto');

const browser = require('./_browser');
const validate = require('./_validate');
const limit = require('./_limit');
const github = require('./_github');

const FOLDER = 'invitation_card';
const INDEX = FOLDER + '/index.json';
const MAIN_DIR = 'main_image';
const MUSIC_DIR = 'background_music';

const MAX_BODY = 5 * 1024 * 1024;

/* The invitation email. api/publish calls the mailer DIRECTLY — an
   HTTP call from the function to itself never works: with no SITE_URL
   the relative '/api/send-email' makes fetch throw "Failed to parse
   URL", and with one it is a needless network hop. The send is awaited
   so a Vercel function cannot be frozen before the mail leaves. */
const sendInvitationEmail = require('./send-email');

function maskEmail(email) {
  const at = String(email || '').indexOf('@');
  if (at <= 0) return '***';
  return String(email).slice(0, 2) + '***' + String(email).slice(at);
}

/* Duplicate protection: the email is sent at most once per payment.
   Sent and failed are different states — only a confirmed send is
   marked, so a failed email can be retried. */
const sentEmails = new Set();

async function hasEmailBeenSent(paymentId) {
  if (!paymentId) return false;

  if (sentEmails.has(paymentId)) return true;

  try {
    const index = await readIndex();
    if (index.ok) {
      const entry = index.entries.find(function (e) {
        return e.paymentId === paymentId;
      });
      if (entry && entry.emailSent === true) {
        sentEmails.add(paymentId);
        return true;
      }
    }
  } catch (err) {
    console.error('[publish] Error checking email sent status:', err.message);
  }

  return false;
}

/* A durable record of a confirmed send, written after the mailer
   reports success. A failure here only costs duplicate protection on
   the next attempt — it never undoes the sent mail itself. */
async function markEmailSent(paymentId) {
  if (!paymentId) return;

  sentEmails.add(paymentId);

  try {
    const index = await readIndex();
    if (index.ok) {
      const entry = index.entries.find(function (e) {
        return e.paymentId === paymentId;
      });
      if (entry) {
        entry.emailSent = true;
        await github.putFiles([{
          path: INDEX,
          content: Buffer.from(JSON.stringify(index.entries, null, 2), 'utf8').toString('base64')
        }], 'Mark email sent for payment: ' + paymentId);
      }
    }
  } catch (err) {
    console.error('[publish] Error marking email as sent:', err.message);
  }
}

/* The site's real origin. On Vercel x-forwarded-host is the public host
   (a custom domain if one is attached), so the URL always matches where
   the site is actually served. SITE_URL, when set, wins so a deployment
   can pin its own domain explicitly. */
function siteRoot(req) {
  if (process.env.SITE_URL) {
    return String(process.env.SITE_URL).replace(/\/+$/, '') + '/';
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + host + '/';
}

/* A random, unguessable suffix that keeps every invitation's address
   unique even when two hosts share the same names and date. */
function invitationId() {
  return crypto.randomBytes(4).toString('hex');
}

/* 'Rahul & Priya' -> 'rahul-and-priya'. Lowercase, hyphenated, only
   [a-z0-9-] survives; the unique id makes the filename safe even if the
   name itself is empty. */
function slugifyName(name) {
  const raw = String(name || '');
  const norm = raw.normalize ? raw.normalize('NFKD') : raw;
  return norm
    .replace(/[\u0300-\u036f]/g, '')      // drop accents left by NFKD
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'invitation';
}

function json(res, status, body) {
  res.status(status).setHeader(
    'Content-Type',
    'application/json; charset=utf-8'
  );
  res.end(JSON.stringify(body));
}

/* The payment gate. When RAZORPAY_KEY_SECRET is configured, a valid
   Razorpay signature is required before anything is committed, so the
   invitation is never hosted ahead of a genuine ₹99 payment. When the
   secret is absent, the whole payment step degrades gracefully and the
   check is skipped rather than refusing every publish. */
function paymentGate(body) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return { ok: true, paymentId: '' };

  const oid = String((body && body.razorpay_order_id) || '');
  const pid = String((body && body.razorpay_payment_id) || '');
  const sig = String((body && body.razorpay_signature) || '');

  if (!oid || !pid || !sig) {
    return { ok: false, error: 'A verified ₹99 payment is required before hosting.' };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(oid + '|' + pid)
    .digest('hex');

  if (expected !== sig) {
    return { ok: false, error: 'The payment could not be verified.' };
  }

  return { ok: true, paymentId: pid };
}

/* The registry: one index.json inside the invitations folder listing
   every hosted invitation, so the site's own storage (the repository) is
   also where the records live — no second database. Reads are best-effort:
   a failed read means a new registry is not written, rather than one that
   could drop previous entries. */
async function readIndex() {
  try {
    const found = await github.getFile(INDEX);
    if (!found) return { entries: [], ok: true };
    const parsed = JSON.parse(found.text);
    return { entries: Array.isArray(parsed) ? parsed : [], ok: true };
  } catch (err) {
    console.error('readIndex failed:', err.message);
    return { entries: [], ok: false };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  const declared = Number(req.headers['content-length'] || 0);

  if (declared > MAX_BODY) {
    return json(res, 413, {
      error: 'That invitation is too large to publish.'
    });
  }

  try {
    const gate = await limit.check(req);

    if (!gate.ok) {
      res.setHeader(
        'Retry-After',
        String(gate.retryAfter)
      );

      return json(res, 429, {
        error: gate.error
      });
    }

    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return json(res, 400, {
          error: 'The request body was not valid JSON.'
        });
      }
    }

    const checked = validate.clean(body);

    if (!checked.ok) {
      return json(res, 400, {
        error: checked.error
      });
    }

    const payment = paymentGate(body);
    if (!payment.ok) {
      return json(res, 402, { error: payment.error });
    }

    /* Safe identifiers only — never the signature or any secret. */
    console.log('[PUBLISH] payment gate passed', {
      orderId: body && body.razorpay_order_id,
      paymentId: body && body.razorpay_payment_id
    });

    const root = siteRoot(req);

    const IH = browser.load(root);

    const state = checked.state;
    console.log('[PUBLISH] started', { title: state.title });

    if (!state.customColors) {
      IH.invitation.applyTemplate(
        state,
        state.template
      );
    }

    /* One identity for the whole invitation: a readable slug plus a
       random id. The stem for the media stays the shared baseName. */
    const base = validate.baseName(IH, state);
    const id = invitationId();
    const slug = slugifyName(
      IH.exportPage.personName(state) || state.title
    );

    const file = slug + '-' + id + '.html';
    const path = FOLDER + '/' + file;
    const publicUrl = root + path;

    const split =
      IH.exportPage.extractAssets(
        state,
        base
      );

    let music = null;

    if (
      String(state.musicFile || '').slice(0, 11) ===
      'data:audio/'
    ) {
      const m =
        /^data:audio\/([\w.+-]+);/.exec(
          state.musicFile
        );

      const ext =
        ({
          mpeg: 'mp3',
          mp3: 'mp3',
          mp4: 'm4a',
          'x-m4a': 'm4a',
          aac: 'aac',
          ogg: 'ogg',
          wav: 'wav',
          'x-wav': 'wav',
          webm: 'webm',
          flac: 'flac'
        })[
          (m && m[1] || '').toLowerCase()
        ] || 'mp3';

      music = {
        path:
          MUSIC_DIR +
          '/' +
          base +
          '_music.' +
          ext,

        data:
          state.musicFile
      };

      split.state.musicFile =
        music.path;
    }

    const mainPhoto =
      split.assets.filter(function (a) {
        return (
          a.path.indexOf(
            MAIN_DIR + '/'
          ) === 0
        );
      })[0] ||
      split.assets[0];

    const html =
      IH.exportPage.buildHtml(
        split.state,
        {
          up: '../',

          canonical: publicUrl,

          image:
            mainPhoto
              ? root +
                FOLDER +
                '/' +
                mainPhoto.path
              : ''
        }
      );

    const now = new Date().toISOString();

    const files = [
      {
        path: path,

        content:
          Buffer
            .from(html, 'utf8')
            .toString('base64')
      }
    ];

    split.assets
      .concat(
        music
          ? [music]
          : []
      )
      .forEach(function (a) {
        files.push({
          path:
            FOLDER +
            '/' +
            a.path,

          content:
            String(a.data).slice(
              String(a.data).indexOf(',') + 1
            )
        });
      });

    /* Record the hosted invitation in the folder's registry, in the same
       single commit as the page, so the registry and the page can never
       disagree. */
    const index = await readIndex();

    if (index.ok) {
      index.entries.push({
        invitationId: id,
        filename: file,
        publicUrl: publicUrl,
        eventType: state.eventType || '',
        eventTitle: state.title || '',
        createdAt: now,
        hostedAt: now,
        paymentId: payment.paymentId || '',
        hostingStatus: 'active'
      });

      files.push({
        path: INDEX,

        content:
          Buffer
            .from(
              JSON.stringify(index.entries, null, 2),
              'utf8'
            )
            .toString('base64')
      });
    }

    const written =
      await github.putFiles(
        files,
        'Publish invitation: ' + file
      );

    console.log('[PUBLISH] successful', {
      filename: file,
      files: written.count
    });

    /* The address is only called live after the page actually reads back
       from the repository. A commit that "succeeded" but is not there is
       not a published invitation. */
    const landed =
      await github.getFile(path);

    if (!landed) {
      throw new Error(
        'The commit reported success, but the page could not be read back.'
      );
    }

    console.log('[PUBLISH] final URL generated', {
      publicUrl: publicUrl
    });

    /* The invitation email, sent to the customer's own address. It runs
       only here — after payment verification AND a verified publish —
       and is awaited so the mail cannot be frozen out of a serverless
       function. Failure never undoes the publication: the URL stays
       live and the response says exactly what happened to the email. */
    let emailStatus = {
      sent: false,
      skipped: true,
      reason: state.email ? '' : 'no customer email in the invitation data'
    };

    if (state.email) {
      const alreadySent = await hasEmailBeenSent(payment.paymentId);

      if (alreadySent) {
        emailStatus = { sent: true, skipped: false, alreadySent: true, reason: '' };
        console.log('[EMAIL] already sent for this payment, skipping', {
          paymentId: payment.paymentId
        });
      } else {
        const customerName = IH.exportPage.personName(state) || state.hostName || state.title || 'there';
        const invitationName = IH.exportPage.personName(state) || state.title || 'Your Invitation';

        try {
          await sendInvitationEmail({
            email: state.email,
            invitationUrl: publicUrl,
            invitationName: invitationName,
            customerName: customerName
          });

          emailStatus = { sent: true, skipped: false, reason: '' };
          console.log('[EMAIL] sending successful', {
            email: maskEmail(state.email)
          });
          markEmailSent(payment.paymentId).catch(function (err) {
            console.error('[EMAIL] Mark email sent rejection (non-fatal):', err.message);
          });
        } catch (emailErr) {
          emailStatus = {
            sent: false,
            skipped: false,
            reason: emailErr.message
          };
          console.error('[EMAIL] sending failed (invitation stays live):', {
            error: emailErr.message,
            code: emailErr.code,
            email: maskEmail(state.email)
          });
        }
      }
    }

    return json(res, 201, {
      invitationId: id,

      filename: file,

      publicUrl: publicUrl,

      path: path,

      file: file,

      files:
        files.map(function (f) {
          return f.path;
        }),

      count:
        written.count,

      commit:
        written.commit,

      verified: true,

      hostedAt: now,

      email: emailStatus
    });

  } catch (err) {

    console.error(
      'publish failed:',
      err
    );

    return json(res, 500, {
      error:
        'The invitation could not be published. ' +
        'If you are setting this up, set ' +
        'ALLOW_CHECK=1 and open /api/check — ' +
        'it names the step that failed.'
    });
  }
};