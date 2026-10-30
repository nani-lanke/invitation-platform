/* ====================================================================
   api/upload.js — one piece of a large upload, staged ahead of publish

   Vercel refuses a request body over 4.5 MB, and an invitation with a song
   and a gallery is well past that once base64 adds its third. So the
   editor (js/publish.js) cuts each large data: URL into pieces and posts
   them here one at a time. Each piece becomes a loose git blob and its sha
   comes back; api/publish then receives 'staged:<sha>,<sha>…' in place of
   the data: URL, joins the pieces, and validates the whole file exactly as
   if it had arrived inline.

   Body: { chunk, razorpay_order_id, razorpay_payment_id, razorpay_signature }
   Returns: { sha }
   ==================================================================== */

'use strict';

const github = require('./_github');
const payment = require('./_payment');

/* A piece is a slice of a data: URL — base64 plus, in the first piece,
   the 'data:audio/mpeg;base64,' header. Nothing else is accepted. */
const CHUNK = /^[A-Za-z0-9+/=:;,.\-]+$/;
const MAX_CHUNK = 3 * 1024 * 1024;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (err) {
      return json(res, 400, { error: 'The request body was not valid JSON.' });
    }
  }

  const gate = payment.gate(body);
  if (!gate.ok) return json(res, 402, { error: gate.error });

  const chunk = body && body.chunk;
  if (typeof chunk !== 'string' || !chunk || chunk.length > MAX_CHUNK || !CHUNK.test(chunk)) {
    return json(res, 400, { error: 'That upload piece was not usable.' });
  }

  try {
    const sha = await github.putBlob(chunk);
    return json(res, 201, { sha: sha });
  } catch (err) {
    console.error('upload failed:', err);
    return json(res, 500, { error: 'A photo or the music could not be uploaded. Please try again.' });
  }
};
