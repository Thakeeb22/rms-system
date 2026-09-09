const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Edulog Academy" <${process.env.EMAIL_USER}>`, 
      to,
      subject,
      html,
      text,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error("Failed to send email. Please try again later.");
  }
};

const passwordResetTemplate = (resetUrl, userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Edulog Academy</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Result Management System</p>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">We received a request to reset your password. Click the button below to reset it. This link will expire in <strong>10 minutes</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Reset Password</a>
    </div>
    <p style="font-size: 14px; color: #777; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
    <p style="font-size: 14px; color: #777;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a></p>
  </div>
</body>
</html>`;
};

module.exports = { sendEmail, passwordResetTemplate };