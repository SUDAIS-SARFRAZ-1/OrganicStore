const { sendContactEmail } = require('../services/emailService');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Strips HTML tags to prevent stored/reflected XSS
 */
function stripHtml(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * POST /api/contact
 * Handles contact form submissions with server-side validation and sanitization.
 */
async function submitContactForm(req, res, next) {
  try {
    const { name, email, phone, subject, message } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A valid name (at least 2 characters) is required.',
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long.',
      });
    }

    // 2. Sanitization
    const cleanName = stripHtml(name).slice(0, 100);
    const cleanEmail = email.trim().toLowerCase().slice(0, 100);
    const cleanPhone = phone ? stripHtml(String(phone)).slice(0, 30) : null;
    const cleanSubject = subject ? stripHtml(subject).slice(0, 150) : 'General Inquiry';
    const cleanMessage = stripHtml(message).slice(0, 2000);

    // 3. Dispatch notification email if transport configured
    try {
      if (typeof sendContactEmail === 'function') {
        await sendContactEmail({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          subject: cleanSubject,
          message: cleanMessage,
        });
      }
    } catch (emailErr) {
      // Don't fail the user request if SMTP fails; log warning
      console.warn('Contact email dispatch notice:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will get back to you shortly.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitContactForm,
};
