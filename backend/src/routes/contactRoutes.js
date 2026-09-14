const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitContactForm } = require('../controllers/contactController');

const router = express.Router();

// Strict rate limit: max 5 contact submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many messages sent from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', contactLimiter, submitContactForm);

module.exports = router;
