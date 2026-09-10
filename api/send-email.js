/* ====================================================================
   api/send-email.js — POST: send the published invitation confirmation email

   Sends the congratulations email via SMTP (nodemailer) to the customer's
   email address. Called directly by api/publish.js after successful
   payment AND verified publishing, or manually via "Retry Email".

   Environment variables (set in Vercel, all environments):
     SMTP_HOST         e.g., mail.spacemail.com
     SMTP_PORT         e.g., 465 (secure) or 587
     SMTP_USER         e.g., support@inviteaura.in
     SMTP_PASS         the mailbox password
     SMTP_FROM         e.g., InviteAura <support@inviteaura.in>

   Structured response:
     {
       success: true,
       accepted: true,
       rejected: false,
       recipient: "lo***@gmail.com",
       messageId: "...",
       providerResponse: "...",
       attemptId: "EMAIL-...",
       message: "Email accepted by the mail server. Please check Inbox and Spam/Junk."
     }
   ==================================================================== */

'use strict';

const crypto = require('crypto');
const nodemailer = require('nodemailer');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function generateAttemptId() {
  return 'EMAIL-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (err) {
    return false;
  }
}

/* Safe PII masking: logos.links.2025@gmail.com -> lo***@gmail.com */
function maskEmail(email) {
  const str = String(email || '').trim();
  const at = str.indexOf('@');
  if (at <= 0) return '***';
  const local = str.slice(0, at);
  const domain = str.slice(at);
  const prefix = local.slice(0, Math.min(2, local.length));
  return prefix + '***' + domain;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || (user ? `InviteAura <${user}>` : 'InviteAura <support@inviteaura.in>');

  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');

  if (missing.length > 0) {
    return { ok: false, error: 'SMTP not configured: missing ' + missing.join(', ') };
  }

  const isSecure = port === 465;

  return {
    ok: true,
    config: {
      host: host,
      port: port,
      secure: isSecure, // true for port 465 (SSL/TLS), false for 587 (STARTTLS)
      requireTLS: !isSecure, // enforce STARTTLS when using port 587
      auth: {
        user: user,
        pass: pass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    },
    from: from,
    user: user
  };
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailHtml(opts) {
  const url = opts.invitationUrl;
  const name = escapeHtml(opts.invitationName);
  const customer = escapeHtml(opts.customerName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your InviteAura Invitation Is Ready!</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f5f5f5;line-height:1.6;color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8B2F58 0%,#B98A2E 100%);padding:40px 30px;text-align:center;">
              <h1 style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#ffffff;line-height:1.3;">InviteAura</h1>
              <p style="margin:0;font-size:18px;color:rgba(255,255,255,0.95);font-weight:500;">🎉 Congratulations!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Hi ${customer},</p>
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Congratulations! 🎉</p>
              <p style="margin:0 0 24px;font-size:16px;color:#333;">Your invitation has been successfully created and is ready to share.</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#faf7f2;border-radius:8px;border:1px solid #eee;">
                <tr>
                  <td style="padding:16px 18px;font-size:15px;color:#333;">
                    <strong style="color:#8B2F58;">Invitation:</strong><br>
                    <span style="font-size:16px;font-weight:600;display:inline-block;margin-top:4px;">${name}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Your Invitation Link:</strong></p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 12px;">
                <tr>
                  <td align="center">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#8B2F58 0%,#B98A2E 100%);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:8px;font-size:16px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;box-shadow:0 4px 14px rgba(139,47,88,0.3);">
                      Open Your Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:8px 0 24px;padding:12px 16px;background-color:#f8f8f8;border-radius:8px;word-break:break-all;font-size:13px;color:#8B2F58;text-align:center;font-family:monospace;">
                ${url}
              </p>

              <p style="margin:0 0 20px;font-size:16px;color:#333;">You can open your invitation using the link above and share it with your family and friends.</p>

              <p style="margin:0 0 12px;font-size:15px;color:#333;">Thank you for choosing InviteAura. ❤️</p>
              <p style="margin:0 0 12px;font-size:15px;color:#333;">We hope your celebration is beautiful, memorable, and filled with happiness.</p>
              <p style="margin:0 0 24px;font-size:15px;color:#666;font-style:italic;">Create. Celebrate. Share.</p>

              <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">

              <p style="margin:0;font-size:15px;color:#333;">Warm regards,</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#8B2F58;">Team InviteAura</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 30px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;">
                <a href="mailto:support@inviteaura.in" style="color:#8B2F58;text-decoration:none;">support@inviteaura.in</a>
              </p>
              <p style="margin:0;font-size:13px;color:#888;">
                <span style="font-family:'Playfair Display',Georgia,serif;font-weight:600;color:#8B2F58;">InviteAura</span> — Create beautiful memories. Share beautiful moments.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:16px 0 0;font-size:12px;color:#999;text-align:center;">&copy; 2026 InviteAura. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText(opts) {
  return `Hi ${opts.customerName},

Congratulations! 🎉

Your invitation has been successfully created and is ready to share.

Invitation:
${opts.invitationName}

Your Invitation Link:
${opts.invitationUrl}

You can open your invitation using the link above and share it with your family and friends.

Thank you for choosing InviteAura. ❤️

We hope your celebration is beautiful, memorable, and filled with happiness.

Create. Celebrate. Share.

Warm regards,
Team InviteAura

support@inviteaura.in`;
}

/* ====================================================================
   sendInvitationEmail(opts) — core email delivery with diagnostics

   opts: {
     email: string,
     invitationUrl: string,
     invitationName?: string,
     customerName?: string,
     attemptId?: string
   }
   ==================================================================== */
async function sendInvitationEmail(opts) {
  const attemptId = (opts && opts.attemptId) || generateAttemptId();
  const email = String(opts && opts.email || '').trim().toLowerCase();
  const invitationUrl = String(opts && opts.invitationUrl || '').trim();
  const invitationName = String(opts && opts.invitationName || 'Your Invitation').trim();
  const customerName = String(opts && opts.customerName || 'there').trim() || 'there';
  const subject = '🎉 Your InviteAura Invitation Is Ready!';
  const senderEmail = 'support@inviteaura.in';

  console.log(`[EMAIL][${attemptId}] START`);
  console.log(`[EMAIL][${attemptId}] recipient: ${maskEmail(email)}`);
  console.log(`[EMAIL][${attemptId}] sender: ${senderEmail}`);
  console.log(`[EMAIL][${attemptId}] subject: ${subject}`);

  if (!validateEmail(email)) {
    console.log(`[EMAIL][${attemptId}] SMTP/provider configured: NO`);
    console.log(`[EMAIL][${attemptId}] SMTP connection: FAILED`);
    console.log(`[EMAIL][${attemptId}] authentication: FAILED`);
    console.log(`[EMAIL][${attemptId}] provider accepted: none`);
    console.log(`[EMAIL][${attemptId}] provider rejected: ${maskEmail(email)}`);
    console.log(`[EMAIL][${attemptId}] messageId: none`);
    console.log(`[EMAIL][${attemptId}] response: Invalid recipient email address`);
    console.log(`[EMAIL][${attemptId}] END`);
    const err = new Error('A valid customer email address is required.');
    err.code = 'INVALID_EMAIL';
    err.attemptId = attemptId;
    throw err;
  }

  if (!validateUrl(invitationUrl)) {
    console.log(`[EMAIL][${attemptId}] SMTP/provider configured: NO`);
    console.log(`[EMAIL][${attemptId}] SMTP connection: FAILED`);
    console.log(`[EMAIL][${attemptId}] authentication: FAILED`);
    console.log(`[EMAIL][${attemptId}] provider accepted: none`);
    console.log(`[EMAIL][${attemptId}] provider rejected: ${maskEmail(email)}`);
    console.log(`[EMAIL][${attemptId}] messageId: none`);
    console.log(`[EMAIL][${attemptId}] response: Invalid invitation URL`);
    console.log(`[EMAIL][${attemptId}] END`);
    const err = new Error('A valid invitation URL is required.');
    err.code = 'INVALID_URL';
    err.attemptId = attemptId;
    throw err;
  }

  const smtp = getSmtpConfig();
  if (!smtp.ok) {
    console.log(`[EMAIL][${attemptId}] SMTP/provider configured: NO`);
    console.log(`[EMAIL][${attemptId}] SMTP connection: FAILED`);
    console.log(`[EMAIL][${attemptId}] authentication: FAILED`);
    console.log(`[EMAIL][${attemptId}] provider accepted: none`);
    console.log(`[EMAIL][${attemptId}] provider rejected: ${maskEmail(email)}`);
    console.log(`[EMAIL][${attemptId}] messageId: none`);
    console.log(`[EMAIL][${attemptId}] response: ${smtp.error}`);
    console.log(`[EMAIL][${attemptId}] END`);
    const err = new Error(smtp.error);
    err.code = 'SMTP_NOT_CONFIGURED';
    err.attemptId = attemptId;
    throw err;
  }

  console.log(`[EMAIL][${attemptId}] SMTP/provider configured: YES`);

  const transporter = nodemailer.createTransport(smtp.config);

  /* Verify SMTP connection and authentication explicitly */
  try {
    await transporter.verify();
    console.log(`[EMAIL][${attemptId}] SMTP connection: SUCCESS`);
    console.log(`[EMAIL][${attemptId}] authentication: SUCCESS`);
  } catch (verifyErr) {
    const isAuth = verifyErr && (verifyErr.code === 'EAUTH' || verifyErr.responseCode === 535);
    console.log(`[EMAIL][${attemptId}] SMTP connection: ${isAuth ? 'SUCCESS' : 'FAILED'}`);
    console.log(`[EMAIL][${attemptId}] authentication: ${isAuth ? 'FAILED' : 'FAILED'}`);
    console.log(`[EMAIL][${attemptId}] provider accepted: none`);
    console.log(`[EMAIL][${attemptId}] provider rejected: ${maskEmail(email)}`);
    console.log(`[EMAIL][${attemptId}] messageId: none`);
    console.log(`[EMAIL][${attemptId}] response: ${verifyErr.message || 'SMTP verification error'}`);
    console.log(`[EMAIL][${attemptId}] END`);

    const safeMessage = isAuth
      ? 'SMTP authentication failed. Please check SMTP_USER and SMTP_PASS.'
      : 'SMTP connection failed: ' + (verifyErr.message || 'Could not reach mail server');
    const err = new Error(safeMessage);
    err.code = isAuth ? 'SMTP_AUTH_FAILED' : 'SMTP_CONNECTION_FAILED';
    err.attemptId = attemptId;
    throw err;
  }

  console.log(`[EMAIL][${attemptId}] sendMail/provider request: START`);

  const customMessageId = `<${attemptId}@inviteaura.in>`;

  let info;
  try {
    info = await transporter.sendMail({
      from: smtp.from,
      to: email,
      sender: senderEmail,
      replyTo: senderEmail,
      envelope: {
        from: senderEmail,
        to: email
      },
      messageId: customMessageId,
      subject: subject,
      text: buildEmailText({
        invitationUrl: invitationUrl,
        invitationName: invitationName,
        customerName: customerName
      }),
      html: buildEmailHtml({
        invitationUrl: invitationUrl,
        invitationName: invitationName,
        customerName: customerName
      }),
      headers: {
        'X-Mailer': 'InviteAura Platform Mailer',
        'X-Entity-Ref-ID': attemptId,
        'List-Unsubscribe': '<mailto:support@inviteaura.in?subject=unsubscribe>'
      }
    });
  } catch (sendErr) {
    console.log(`[EMAIL][${attemptId}] provider accepted: none`);
    console.log(`[EMAIL][${attemptId}] provider rejected: ${maskEmail(email)}`);
    console.log(`[EMAIL][${attemptId}] messageId: none`);
    console.log(`[EMAIL][${attemptId}] response: ${sendErr.message}`);
    console.log(`[EMAIL][${attemptId}] END`);

    const err = new Error('Mail provider failed to send: ' + sendErr.message);
    err.code = sendErr.code || 'SEND_MAIL_FAILED';
    err.attemptId = attemptId;
    throw err;
  }

  const accepted = Array.isArray(info.accepted) ? info.accepted : [];
  const rejected = Array.isArray(info.rejected) ? info.rejected : [];

  const maskedAccepted = accepted.map(maskEmail);
  const maskedRejected = rejected.map(maskEmail);

  console.log(`[EMAIL][${attemptId}] provider accepted: ${maskedAccepted.length > 0 ? maskedAccepted.join(', ') : 'none'}`);
  console.log(`[EMAIL][${attemptId}] provider rejected: ${maskedRejected.length > 0 ? maskedRejected.join(', ') : 'none'}`);
  console.log(`[EMAIL][${attemptId}] messageId: ${info.messageId || customMessageId}`);
  console.log(`[EMAIL][${attemptId}] response: ${String(info.response || 'OK').trim()}`);
  console.log(`[EMAIL][${attemptId}] END`);

  if (rejected.length > 0 || accepted.length === 0) {
    return {
      success: false,
      accepted: false,
      rejected: true,
      recipient: maskEmail(email),
      attemptId: attemptId,
      messageId: info.messageId || customMessageId,
      providerResponse: String(info.response || '').trim(),
      error: 'The email provider rejected the recipient address: ' + maskEmail(email)
    };
  }

  return {
    success: true,
    accepted: true,
    rejected: false,
    recipient: maskEmail(email),
    messageId: info.messageId || customMessageId,
    providerResponse: String(info.response || '').trim(),
    attemptId: attemptId,
    message: 'Email accepted by the mail server. Please check Inbox and Spam/Junk.'
  };
}

/* ====================================================================
   Direct HTTP entry point for Vercel /api/send-email
   ==================================================================== */
async function httpHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return json(res, 400, { error: 'The request body was not valid JSON.' });
    }
  }
  body = body || {};

  try {
    const result = await sendInvitationEmail({
      email: body.email,
      invitationUrl: body.invitationUrl,
      invitationName: body.invitationName,
      customerName: body.customerName,
      attemptId: body.attemptId
    });

    if (!result.success || !result.accepted) {
      return json(res, 422, result);
    }

    return json(res, 200, result);
  } catch (err) {
    console.error('[EMAIL] sending failed:', {
      error: err.message,
      code: err.code,
      to: maskEmail(body.email)
    });

    const status = (err.code === 'SMTP_NOT_CONFIGURED' || err.code === 'SMTP_AUTH_FAILED' || err.code === 'SMTP_CONNECTION_FAILED')
      ? 503
      : (err.code === 'INVALID_EMAIL' || err.code === 'INVALID_URL' ? 400 : 500);

    return json(res, status, {
      success: false,
      accepted: false,
      rejected: false,
      attemptId: err.attemptId || 'EMAIL-UNKNOWN',
      error: err.message || 'Unable to send confirmation email'
    });
  }
}

/* Dual export: works as Vercel serverless HTTP handler (req, res) AND as a directly imported JS function(opts) */
async function entry(reqOrOpts, maybeRes) {
  if (maybeRes && typeof maybeRes.status === 'function') {
    return httpHandler(reqOrOpts, maybeRes);
  }
  return sendInvitationEmail(reqOrOpts);
}

module.exports = entry;
module.exports.sendInvitationEmail = sendInvitationEmail;
module.exports.handler = httpHandler;
module.exports.generateAttemptId = generateAttemptId;
