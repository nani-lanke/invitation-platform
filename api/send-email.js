/* ====================================================================
   api/send-email.js — POST: send the published invitation email

   Sends the congratulations email via SMTP (nodemailer) to the
   customer's email address. Called directly by api/publish.js after
   successful payment AND successful publishing — never for a failed
   publish, and never to an admin address.

   Environment variables (set in Vercel, all environments):
     SMTP_HOST         e.g., mail.spacemail.com
     SMTP_PORT         e.g., 465 (secure) or 587
     SMTP_USER         e.g., support@inviteaura.in
     SMTP_PASS         the mailbox password
     SMTP_FROM         e.g., InviteAura <support@inviteaura.in>

   Request body (from api/publish.js, or a manual retry):
     { email, invitationUrl, invitationName, customerName }

   Response:
     200 { success: true,  message }
     4xx/5xx { success: false, error }
   ==================================================================== */

'use strict';

const nodemailer = require('nodemailer');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUrl(url) {
  try {
    return new URL(url).protocol === 'https:';
  } catch (err) {
    return false;
  }
}

/* Logs name the person, never the address. */
function maskEmail(email) {
  const at = String(email).indexOf('@');
  if (at <= 0) return '***';
  const local = String(email).slice(0, at);
  const domain = String(email).slice(at);
  return local.slice(0, 2) + '***' + domain;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');

  if (missing.length > 0) {
    return { ok: false, error: 'SMTP not configured: missing ' + missing.join(', ') };
  }

  return {
    ok: true,
    config: {
      host: host,
      port: port,
      secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
      auth: { user: user, pass: pass }
    },
    from: from
  };
}

function escapeHtml(s) {
  return String(s)
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
  <title>Your InviteAura Invitation is Ready!</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f5f5f5;line-height:1.6;color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8B2F58 0%,#B98A2E 100%);padding:40px 30px;text-align:center;">
              <img src="https://inviteaura.in/images/logo/inviteaura-light.png" alt="InviteAura" width="160" style="display:block;margin:0 auto 16px;max-width:100%;height:auto;">
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#ffffff;line-height:1.3;">🎉 Congratulations!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Hello ${customer},</p>
              <p style="margin:0 0 24px;font-size:16px;color:#333;">Congratulations! Your invitation <strong>"${name}"</strong> has been successfully created and is now ready to share.</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#faf7f2;border-radius:8px;border:1px solid #eee;">
                <tr>
                  <td style="padding:14px 18px;font-size:15px;color:#333;"><strong>Invitation Name:</strong> ${name}</td>
                </tr>
                <tr>
                  <td style="padding:0 18px 14px;font-size:15px;color:#333;"><strong>Customer Name:</strong> ${customer}</td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Your Invitation:</strong></p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 8px;">
                <tr>
                  <td align="center">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#8B2F58 0%,#B98A2E 100%);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-size:16px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;box-shadow:0 4px 14px rgba(139,47,88,0.3);">
                      Open Your Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:8px 0 24px;padding:12px 16px;background-color:#f8f8f8;border-radius:8px;word-break:break-all;font-size:13px;color:#8B2F58;text-align:center;font-family:monospace;">
                ${url}
              </p>

              <p style="margin:0 0 24px;font-size:16px;color:#333;">You can open the invitation, check everything, and share the link with your family and friends.</p>

              <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">

              <p style="margin:0 0 8px;font-size:15px;color:#333;">Thank you for choosing InviteAura.</p>
              <p style="margin:0;font-size:15px;color:#333;">Create. Celebrate. Share.</p>
              <p style="margin:16px 0 0;font-size:15px;color:#333;"><strong>Team InviteAura</strong></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 30px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;">support@inviteaura.in</p>
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
  return `Hello ${opts.customerName},

Congratulations! 🎉

Your invitation has been successfully created and is now ready to share.

Invitation Name: ${opts.invitationName}

Customer Name: ${opts.customerName}

Your Invitation:
${opts.invitationUrl}

You can open the invitation, check everything, and share the link with your family and friends.

Thank you for choosing InviteAura.

Create. Celebrate. Share.

Team InviteAura`;
}

/* Sends one email. Can be called directly from api/publish.js or via HTTP */
async function sendInvitationEmail(opts) {
  const email = String(opts && opts.email || '').trim().toLowerCase();
  const invitationUrl = String(opts && opts.invitationUrl || '').trim();
  const invitationName = String(opts && opts.invitationName || 'Your Invitation').trim();
  const customerName = String(opts && opts.customerName || 'there').trim() || 'there';

  if (!validateEmail(email)) {
    throw new Error('A valid customer email address is required.');
  }
  if (!validateUrl(invitationUrl)) {
    throw new Error('A valid invitation URL is required.');
  }

  const smtp = getSmtpConfig();
  if (!smtp.ok) {
    const err = new Error(smtp.error);
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  console.log('[send-email] sending started', {
    to: maskEmail(email),
    invitationUrl: invitationUrl
  });

  const transporter = nodemailer.createTransport(smtp.config);

  const info = await transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: '🎉 Congratulations! Your InviteAura Invitation Is Ready',
    text: buildEmailText({
      invitationUrl: invitationUrl,
      invitationName: invitationName,
      customerName: customerName
    }),
    html: buildEmailHtml({
      invitationUrl: invitationUrl,
      invitationName: invitationName,
      customerName: customerName
    })
  });

  console.log('[send-email] email sent successfully', {
    messageId: info.messageId,
    to: maskEmail(email)
  });

  return { messageId: info.messageId };
}

/* Direct HTTP entry point for Vercel /api/send-email */
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
      customerName: body.customerName
    });
    return json(res, 200, { success: true, message: 'Invitation email sent successfully', messageId: result.messageId });
  } catch (err) {
    console.error('[send-email] email failed:', {
      error: err.message,
      code: err.code,
      to: maskEmail(body.email)
    });

    const status = err.code === 'SMTP_NOT_CONFIGURED' ? 503 : 500;
    return json(res, status, {
      success: false,
      error: 'Unable to send the invitation email: ' + err.message
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
