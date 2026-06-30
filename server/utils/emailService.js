const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

// Verify connection on startup — logs immediately if credentials/network are wrong
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ BREVO SMTP CONNECTION FAILED:", error.message);
  } else {
    console.log("✅ Brevo SMTP connected successfully, ready to send emails");
  }
});

const FROM_EMAIL = `Smart Finance Tracker <${process.env.BREVO_SMTP_USER}>`;

const sendVerificationEmail = async (toEmail, otp, userName) => {
  try {
    const info = await transporter.sendMail({
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
    console.log("✅ Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ FAILED to send verification email:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));
    throw error;
  }
};

const sendWelcomeEmail = async (toEmail, userName) => {
  try {
    const info = await transporter.sendMail({
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
    console.log("✅ Welcome email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ FAILED to send welcome email:", error.message);
    throw error;
  }
};

const sendPasswordResetEmail = async (toEmail, resetToken, userName) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    const info = await transporter.sendMail({
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
                  <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Or copy this link:</p>
                  <p style="margin:0 0 24px 0;font-size:12px;color:#2563eb;word-break:break-all;">${resetUrl}</p>
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
    console.log("✅ Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ FAILED to send password reset email:", error.message);
    throw error;
  }
};

const sendFeedbackEmail = async ({ name, email, message }) => {
  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: process.env.BREVO_SMTP_USER,
      subject: `Smart Finance Tracker — Feedback from ${name || "Anonymous"}`,
      html: `
        <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
                <tr><td style="background-color:#ffffff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <h1 style="margin:0 0 24px 0;font-size:20px;font-weight:700;color:#0f172a;">💬 New Feedback Received</h1>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                    <tr>
                      <td style="padding:12px;background:#f1f5f9;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">From</p>
                        <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#0f172a;">${name || "Anonymous"}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px;background:#f1f5f9;border-radius:0 0 8px 8px;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Email</p>
                        <p style="margin:4px 0 0 0;font-size:15px;color:#2563eb;">${email || "Not provided"}</p>
                      </td>
                    </tr>
                  </table>
                  <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px;">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Message</p>
                    <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">${message}</p>
                  </div>
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
    console.log("✅ Feedback email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ FAILED to send feedback email:", error.message);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendFeedbackEmail,
};
