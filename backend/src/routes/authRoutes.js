const express = require('express');
const {
  register,
  verifyOtp,
  resendOtp,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Backwards compatibility routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

router.post('/login', login);
router.post('/logout', logout);

// Protected auth route
router.get('/me', authenticate, getMe);

module.exports = router;
