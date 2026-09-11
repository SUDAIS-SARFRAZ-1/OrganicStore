const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  verifyOtp,
  resendOtp,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter for authentication attempts (Item 6 & 14)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 40,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP operations to prevent brute-force enumeration (Item 6)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 40,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public auth routes with throttling
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);

// Password Reset Routes
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);

// Backwards compatibility routes
router.post('/verify-email', otpLimiter, verifyEmail);
router.post('/resend-verification', otpLimiter, resendVerification);

router.post('/logout', logout);

// Protected auth route
router.get('/me', authenticate, getMe);

module.exports = router;
