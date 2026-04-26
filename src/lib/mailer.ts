import nodemailer from 'nodemailer';

export function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, name: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transport = getTransport();
  await transport.sendMail({
    from: `"Pragati · Alembic Digital" <${from}>`,
    to,
    subject: 'Reset your Pragati password',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#0B1628;padding:28px 32px;">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">Pragati</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Alembic Digital</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Hi ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
              We received a request to reset your Pragati password. Click the button below — this link expires in <strong>1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px;background:#1565C0;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:12px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
                    Reset password
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
              If you didn't request this, ignore this email — your password won't change.<br/>
              Or copy this link: <span style="color:#1565C0;">${resetUrl}</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
              Pragati · Alembic Limited · Vadodara
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
