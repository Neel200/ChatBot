import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:16px;padding:12px 20px;">
                <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">✦ ChatBot</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${baseUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"ChatBot" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your ChatBot email address",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">Verify your email</h2>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#475569;">
        Thanks for signing up! Click the button below to confirm your email address and activate your account.
        This link expires in <strong>24 hours</strong>.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${url}"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
          Verify email address
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
        Or copy this link into your browser:<br/>
        <span style="color:#6366f1;word-break:break-all;">${url}</span>
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${baseUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"ChatBot" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your ChatBot password",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">Reset your password</h2>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#475569;">
        We received a request to reset your password. Click the button below to choose a new one.
        This link expires in <strong>1 hour</strong>.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${url}"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
          Reset password
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
        Or copy this link into your browser:<br/>
        <span style="color:#6366f1;word-break:break-all;">${url}</span>
      </p>
    `),
  });
}
