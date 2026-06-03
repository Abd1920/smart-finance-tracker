const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Smart Finance Tracker <onboarding@resend.dev>";

const sendVerificationEmail = async (toEmail, otp, userName) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Verify Your Email — Smart Finance Tracker",
    html: `
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
              <tr><td align="center" style="padding-bottom:24px;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#2563eb;border-radius:12px;padding:12px 16px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">💰 Smart Finance Tracker</span>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#ffffff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;">Verify Your Email ✉️</h1>
                <p style="margin:0 0 24px 0;font-size:15px;color:#64748b;">Hi ${userName},</p>
                <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">
                  Use the verification code below to complete your registration. This code expires in <strong>10 minutes</strong>.
                </p>
                <div style="background-color:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                  <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Verification Code</p>
                  <p style="margin:0;font-size:42px;font-weight:800;color:#2563eb;letter-spacing:10px;">${otp}</p>
                </div>
                <p style="margin:0;font-size:13px;color:#94a3b8;">Valid for 10 minutes only. If you didn't request this, ignore this email.</p>
              </td></tr>
              <tr><td align="center" style="padding-top:24px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Smart Finance Tracker</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};

const sendWelcomeEmail = async (toEmail, userName) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Welcome to Smart Finance Tracker! 🎉",
    html: `
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
              <tr><td align="center" style="padding-bottom:24px;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#2563eb;border-radius:12px;padding:12px 16px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">💰 Smart Finance Tracker</span>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#ffffff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;">Welcome, ${userName}! 🎉</h1>
                <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">Your account has been successfully created. Start managing your finances smarter!</p>
                <div style="background-color:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <p style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#166534;">What you can do:</p>
                  <p style="margin:0 0 8px 0;font-size:13px;color:#475569;">✅ Track income & expenses</p>
                  <p style="margin:0 0 8px 0;font-size:13px;color:#475569;">✅ Manage multiple accounts</p>
                  <p style="margin:0 0 8px 0;font-size:13px;color:#475569;">✅ Transfer money between accounts</p>
                  <p style="margin:0 0 8px 0;font-size:13px;color:#475569;">✅ Track debts & loans</p>
                  <p style="margin:0;font-size:13px;color:#475569;">✅ View financial reports & charts</p>
                </div>
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#2563eb;border-radius:10px;">
                    <a href="${process.env.CLIENT_URL}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Go to Dashboard →</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td align="center" style="padding-top:24px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Smart Finance Tracker</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};

const sendPasswordResetEmail = async (toEmail, resetToken, userName) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Reset Your Password — Smart Finance Tracker",
    html: `
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
              <tr><td align="center" style="padding-bottom:24px;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:#2563eb;border-radius:12px;padding:12px 16px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">💰 Smart Finance Tracker</span>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#ffffff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;">Reset Your Password 🔐</h1>
                <p style="margin:0 0 24px 0;font-size:15px;color:#64748b;">Hi ${userName},</p>
                <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">Click the button below to reset your password. Expires in <strong>1 hour</strong>.</p>
                <table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                  <tr><td style="background-color:#2563eb;border-radius:10px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Reset Password</a>
                  </td></tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Or copy: ${resetUrl}</p>
                <p style="margin:0;font-size:13px;color:#94a3b8;">If you didn't request this, ignore this email.</p>
              </td></tr>
              <tr><td align="center" style="padding-top:24px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Smart Finance Tracker</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
