/* ====================================================================
   api/_payment.js — the ₹99 payment gate, shared

   api/publish and api/upload both write to the repository, so both check
   the same Razorpay signature before doing anything.

   Exports:
     gate(body) -> { ok: true, paymentId } | { ok: false, error }
   ==================================================================== */

'use strict';

const crypto = require('crypto');

/* When RAZORPAY_KEY_SECRET is configured, a valid Razorpay signature is
   required, so nothing is written ahead of a genuine ₹99 payment. When the
   secret is absent, the whole payment step degrades gracefully and the
   check is skipped rather than refusing every publish. */
function gate(body) {
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

module.exports = { gate: gate };
