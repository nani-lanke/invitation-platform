/* ====================================================================
   api/send-email.js — POST: send the published invitation email

   Sends a professional invitation email via Spacemail SMTP to the
   customer's email address after successful payment AND publishing.

   Environment variables (set in Vercel):
     SMTP_HOST         e.g., mail.spacemail.com
     SMTP_PORT         e.g., 465
     SMTP_USER         e.g., support@inviteaura.in
     SMTP_PASS         the Spacemail mailbox password
     SMTP_FROM         e.g., InviteAura <support@inviteaura.in>

   Request body:
     { email: "customer@example.com", invitationUrl: "https://inviteaura.in/invitation_card/..." }

   Response:
     { success: true, message: "Invitation email sent successfully" }
   ==================================================================== */

'use strict';

const nodemailer = require('nodemailer');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
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
      secure: true, // true for 465, false for other ports
      auth: {
        user: user,
        pass: pass
      }
    },
    from: from
  };
}

function buildEmailHtml(invitationUrl, invitationName) {
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
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#ffffff;line-height:1.3;">Your Invitation is Ready! 🎉</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 16px;font-size:16px;color:#333;">Hello!</p>
              <p style="margin:0 0 24px;font-size:16px;color:#333;">Congratulations! Your beautiful invitation <strong>"${invitationName}"</strong> has been successfully created with InviteAura.</p>
              <p style="margin:0 0 24px;font-size:16px;color:#333;">Your invitation is now ready to share with your family and friends.</p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#8B2F58 0%,#B98A2E 100%);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-size:16px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;box-shadow:0 4px 14px rgba(139,47,88,0.3);">
                      View Your Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 8px;font-size:14px;color:#666;text-align:center;">Or copy this link:</p>
              <p style="margin:0 0 24px;padding:12px 16px;background-color:#f8f8f8;border-radius:8px;word-break:break-all;font-size:13px;color:#8B2F58;text-align:center;font-family:monospace;">
                ${invitationUrl}
              </p>

              <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">

              <p style="margin:0 0 8px;font-size:15px;color:#333;">Thank you for choosing InviteAura.</p>
              <p style="margin:0 0 8px;font-size:15px;color:#333;">We wish you and your family beautiful memories, happiness, and a wonderful celebration. ❤️</p>

              <p style="margin:24px 0 0;font-size:15px;color:#333;">Warm wishes,<br><strong>Team InviteAura</strong></p>
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

function buildEmailText(invitationUrl, invitationName) {
  return `Hello!

Congratulations! 🎉

Your beautiful invitation "${invitationName}" has been successfully created with InviteAura.

Your invitation is now ready to share with your family and friends.

OPEN YOUR INVITATION:
${invitationUrl}

---

Thank you for choosing InviteAura.

We wish you and your family beautiful memories, happiness, and a wonderful celebration. ❤️

Warm wishes,
Team InviteAura

support@inviteaura.in

InviteAura
Create beautiful memories. Share beautiful moments.`;
}

module.exports = async function handler(req, res) {
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

  const email = String(body && body.email || '').trim().toLowerCase();
  const invitationUrl = String(body && body.invitationUrl || '').trim();
  const invitationName = String(body && body.invitationName || 'Your Invitation').trim();

  // Validate inputs
  if (!email || !validateEmail(email)) {
    return json(res, 400, { error: 'A valid email address is required.' });
  }

  if (!invitationUrl || !validateUrl(invitationUrl)) {
    return json(res, 400, { error: 'A valid invitation URL is required.' });
  }

  // Get SMTP configuration
  const smtp = getSmtpConfig();
  if (!smtp.ok) {
    console.error('[send-email] SMTP configuration error:', smtp.error);
    return json(res, 503, { error: 'Email service is not configured.' });
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(smtp.config);

    // Verify connection
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: smtp.from,
      to: email,
      subject: 'Your InviteAura Invitation is Ready! 🎉',
      text: buildEmailText(invitationUrl, invitationName),
      html: buildEmailHtml(invitationUrl, invitationName)
    });

    console.log('[send-email] Email sent successfully', {
      messageId: info.messageId,
      to: email,
      invitationUrl: invitationUrl
    });

    return json(res, 200, {
      success: true,
      message: 'Invitation email sent successfully'
    });

  } catch (err) {
    // Log error without sensitive info
    console.error('[send-email] Failed to send email:', {
      error: err.message,
      code: err.code,
      to: email,
      invitationUrl: invitationUrl
    });

    return json(res, 500, {
      success: false,
      message: 'Unable to send invitation email'
    });
  }
};