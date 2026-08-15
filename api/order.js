/* ====================================================================
   api/order.js — POST: create a Razorpay order for the ₹99 hosting plan

   The price is decided here, never on the client. The only product is
   Online Invitation Hosting at ₹99 (9900 paise). The client names the
   product; the server fixes the amount, so a caller cannot edit the
   price by submitting one of their own.
   ==================================================================== */

'use strict';

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const PRODUCTS = {
  'online-invitation-hosting': {
    name: 'Online Invitation Hosting',
    amount: 9900,
    currency: 'INR'
  }
};

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  if (!KEY_ID || !KEY_SECRET) {
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

  const product = PRODUCTS[(body && body.product) || 'online-invitation-hosting'];
  if (!product) {
    return json(res, 400, { error: 'Unknown product.' });
  }

  try {
    const auth = 'Basic ' + Buffer.from(KEY_ID + ':' + KEY_SECRET).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        amount: product.amount,
        currency: product.currency,
        receipt: 'invitehub-host-' + Date.now(),
        notes: { product: body.product || 'online-invitation-hosting' }
      })
    });

    const order = await response.json();
    if (!response.ok || !order.id) {
      return json(res, 502, { error: 'The payment gateway could not start the order.' });
    }

    return json(res, 201, {
      orderId: order.id,
      keyId: KEY_ID,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('order failed:', err);
    return json(res, 500, { error: 'The payment gateway could not be reached.' });
  }
};