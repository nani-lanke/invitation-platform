/* ====================================================================
   api/verify.js — POST: verify a Razorpay payment signature

   Razorpay signs `order_id|payment_id` with the key secret. The server
   re-computes that signature and compares it, so only a genuine payment
   from Razorpay passes. The secret never leaves this function.
   ==================================================================== */

'use strict';

const crypto = require('crypto');

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  if (!KEY_SECRET) {
    return json(res, 503, { error: 'Payments are not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return json(res, 400, { error: 'The request body was not valid JSON.' });
    }
  }

  const orderId = body && body.razorpay_order_id;
  const paymentId = body && body.razorpay_payment_id;
  const signature = body && body.razorpay_signature;

  if (!orderId || !paymentId || !signature) {
    return json(res, 400, { error: 'Missing payment details.' });
  }

  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  if (expected !== signature) {
    return json(res, 400, { error: 'Payment signature did not match.' });
  }

  return json(res, 200, { ok: true });
};