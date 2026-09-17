const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transport
 * Supports:
 * 1. Gmail with Google App Password via EMAIL_USER and EMAIL_PASS
 * 2. Custom SMTP via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * 3. Fallback development logger if no credentials are configured
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT) || 587;

  const cleanPass = emailPass.replace(/\s+/g, '');

  if (emailUser && cleanPass) {
    if (host) {
      // Custom SMTP server (e.g., Brevo, SendGrid, Mailgun, AWS SES, Resend)
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: emailUser,
          pass: cleanPass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    } else {
      // Default to smtp.gmail.com on port 587 (STARTTLS)
      // Using explicit host & port 587 with STARTTLS is far more reliable on cloud environments (like Render) than service: 'gmail'
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // port 587 uses STARTTLS
        auth: {
          user: emailUser,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    }
  } else {
    // Fallback development transporter
    transporter = {
      isDev: true,
      sendMail: async (mailOptions) => {
        console.log('\n================== [ORGANIC STORE EMAIL DISPATCH] ==================');
        console.log(`To:      ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        if (mailOptions.otp) {
          console.log(`>> 6-DIGIT VERIFICATION OTP: [ ${mailOptions.otp} ]`);
        }
        if (mailOptions.resetCode) {
          console.log(`>> 6-DIGIT PASSWORD RESET CODE: [ ${mailOptions.resetCode} ]`);
        }
        if (mailOptions.resetUrl) {
          console.log(`>> PASSWORD RESET URL: ${mailOptions.resetUrl}`);
        }
        console.log('NOTE: To deliver real emails directly into user inboxes, configure:');
        console.log('EMAIL_USER and EMAIL_PASS in Render Environment Variables or backend/.env');
        console.log('====================================================================\n');
        return { messageId: `dev-simulated-${Date.now()}` };
      },
    };
  }

  return transporter;
}

/**
 * Diagnostic tool to check SMTP credentials and server connectivity
 */
async function verifyEmailConnection() {
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();

  if (!emailUser || !emailPass) {
    return {
      configured: false,
      status: 'missing_credentials',
      message: 'EMAIL_USER or EMAIL_PASS environment variables are missing in this environment. In production on Render, you MUST add EMAIL_USER and EMAIL_PASS to the Render dashboard Environment Variables.',
    };
  }

  const activeTransporter = getTransporter();
  if (activeTransporter.isDev) {
    return {
      configured: false,
      status: 'dev_simulation',
      message: 'Email service is running in simulation mode.',
    };
  }

  try {
    await activeTransporter.verify();
    return {
      configured: true,
      status: 'connected',
      user: emailUser,
      message: 'SMTP transport verified and ready to deliver real emails.',
    };
  } catch (err) {
    return {
      configured: true,
      status: 'error',
      user: emailUser,
      error: err.message,
      message: `Failed to connect to SMTP server: ${err.message}`,
    };
  }
}

/**
 * Dispatches an automated 6-digit OTP verification email to the user's inbox.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Customer full name
 * @param {string} options.otp - 6-digit One-Time Password
 */
async function sendOtpEmail({ to, name, otp }) {
  const senderEmail = (process.env.FROM_EMAIL || process.env.EMAIL_USER || '"Organic Store" <no-reply@organicstore.com>').trim();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Organic Store Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f6f3; margin: 0; padding: 24px; color: #333333; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .header { background: #6a9739; padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .content h2 { margin-top: 0; font-size: 18px; color: #111827; }
        .content p { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 16px 0; }
        .otp-container { text-align: center; margin: 28px 0; padding: 20px; background: #f9fafb; border: 2px dashed #6a9739; border-radius: 12px; }
        .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6a9739; margin-bottom: 8px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #111827; margin: 0; }
        .expiry-note { font-size: 12px; color: #6b7280; text-align: center; margin-top: 12px; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; font-size: 12px; color: #92400e; margin-top: 24px; }
        .footer { background: #fdfdfd; padding: 20px 28px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Organic Store</h1>
          <p>100% Certified Organic Groceries &amp; Farm Fresh Produce</p>
        </div>
        <div class="content">
          <h2>Welcome, ${name || 'Valued Customer'}!</h2>
          <p>Thank you for creating an account with Organic Store. To complete your registration and activate your account, please enter the following 6-digit verification code:</p>
          
          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry-note">Valid for <strong>10 minutes</strong></div>
          </div>

          <div class="security-notice">
            <strong>Security Notice:</strong> Never share this verification code with anyone. Organic Store representatives will never ask for your code.
          </div>

          <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Organic Store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Organic Store Verification Code\n\nYour 6-digit verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.`;

  const mailOptions = {
    from: senderEmail,
    to,
    replyTo: (process.env.EMAIL_USER || senderEmail).trim(),
    subject: `Your Organic Store Verification Code: ${otp}`,
    text: textContent,
    html: htmlContent,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'high',
    },
    otp,
  };

  const activeTransporter = getTransporter();
  try {
    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`\n[EMAIL DELIVERED] Recipient: ${to} | OTP: [ ${otp} ] | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, otp };
  } catch (err) {
    console.error(`\n[EMAIL DELIVERY FAILURE] Recipient: ${to} | Error:`, err.message);
    console.log(`\n================== [FALLBACK OTP CODE IN TERMINAL] ==================\nRecipient: ${to}\nOTP Code:  [ ${otp} ]\n====================================================================\n`);
    return { success: false, fallback: true, otp, error: err.message };
  }
}

/**
 * Dispatches an automated account confirmation email with a unique activation token.
 * (Retained for backwards compatibility)
 */
async function sendVerificationEmail({ to, name, token }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const senderEmail = (process.env.FROM_EMAIL || process.env.EMAIL_USER || '"Organic Store" <no-reply@organicstore.com>').trim();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Activate Your Organic Store Account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f6f3; margin: 0; padding: 24px; color: #333333; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .header { background: #6a9739; padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; }
        .button-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #6a9739; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; }
        .footer { background: #fdfdfd; padding: 20px 28px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Organic Store</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${name || 'Valued Customer'}!</h2>
          <p>Please click below to activate your account:</p>
          <div class="button-wrapper">
            <a href="${verificationUrl}" class="btn" target="_blank">Confirm &amp; Activate Account</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Organic Store.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: senderEmail,
    to,
    subject: 'Confirm Your Email - Activate Your Organic Store Account',
    html: htmlContent,
    verificationUrl,
  };

  const activeTransporter = getTransporter();
  const info = await activeTransporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId, verificationUrl };
}

/**
 * Dispatches a contact inquiry notification email to store support
 */
async function sendContactEmail({ name, email, phone, subject, message }) {
  const senderEmail = process.env.FROM_EMAIL || '"Organic Store Support" <support@organicstore.com>';
  const supportDestination = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'support@organicstore.com';

  const htmlContent = `
    <h3>New Customer Inquiry via Contact Form</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
    <p><strong>Topic:</strong> ${subject}</p>
    <hr />
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `;

  const mailOptions = {
    from: senderEmail,
    to: supportDestination,
    replyTo: email,
    subject: `[Contact Form] ${subject} - ${name}`,
    html: htmlContent,
  };

  const activeTransporter = getTransporter();
  return activeTransporter.sendMail(mailOptions);
}

/**
 * Dispatches a password reset email with a 6-digit code and direct link
 */
async function sendPasswordResetEmail({ to, name, resetCode, resetUrl }) {
  const senderEmail = (process.env.FROM_EMAIL || process.env.EMAIL_USER || '"Organic Store Security" <security@organicstore.com>').trim();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Organic Store Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f6f3; margin: 0; padding: 24px; color: #333333; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .header { background: #6a9739; padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .content h2 { margin-top: 0; font-size: 18px; color: #111827; }
        .content p { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 16px 0; }
        .code-container { text-align: center; margin: 28px 0; padding: 20px; background: #f9fafb; border: 2px dashed #6a9739; border-radius: 12px; }
        .code-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6a9739; margin-bottom: 8px; }
        .code-val { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #111827; margin: 0; }
        .expiry-note { font-size: 12px; color: #6b7280; text-align: center; margin-top: 12px; }
        .btn-wrapper { text-align: center; margin: 24px 0; }
        .btn { display: inline-block; background-color: #6a9739; color: #ffffff !important; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; font-size: 12px; color: #92400e; margin-top: 24px; }
        .footer { background: #fdfdfd; padding: 20px 28px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Organic Store</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <h2>Hello, ${name || 'Customer'}!</h2>
          <p>We received a request to reset your password for your Organic Store account. You can use either the 6-digit reset code below or click the reset button:</p>
          
          <div class="code-container">
            <div class="code-label">Password Reset Code</div>
            <div class="code-val">${resetCode}</div>
            <div class="expiry-note">Valid for <strong>15 minutes</strong></div>
          </div>

          ${resetUrl ? `
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Your Password</a>
          </div>
          ` : ''}

          <div class="security-notice">
            <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email or change your password immediately. Your account remains secure.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Organic Store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Organic Store Password Reset\n\nYour 6-digit password reset code is: ${resetCode}\n\nReset URL: ${resetUrl || 'N/A'}\n\nThis code expires in 15 minutes. If you did not request this reset, please ignore this email.`;

  const mailOptions = {
    from: senderEmail,
    to,
    replyTo: (process.env.EMAIL_USER || senderEmail).trim(),
    subject: 'Reset Your Password - Organic Store',
    text: textContent,
    html: htmlContent,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'high',
    },
    resetCode,
    resetUrl,
  };

  const activeTransporter = getTransporter();
  try {
    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`\n[EMAIL DELIVERED] Password reset code sent to ${to} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`\n[EMAIL DELIVERY FAILURE] Password reset sending to ${to} failed:`, err.message);
    console.log(`\n================== [FALLBACK RESET CODE IN TERMINAL] ==================\nRecipient: ${to}\nReset Code: [ ${resetCode} ]\nReset URL:  ${resetUrl}\n=======================================================================\n`);
    return { success: false, fallback: true, error: err.message };
  }
}

module.exports = {
  sendOtpEmail,
  sendVerificationEmail,
  sendContactEmail,
  sendPasswordResetEmail,
  verifyEmailConnection,
};

