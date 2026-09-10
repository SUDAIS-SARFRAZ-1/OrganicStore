const express = require('express');
const {
  getStripeConfig,
  createCheckoutSession,
  verifyCheckoutSession,
  processDirectCardPayment,
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
// Get publishable key

router.get('/config', getStripeConfig);

// Protected payment endpoints
router.post('/create-checkout-session', authenticate, createCheckoutSession);
router.post('/verify-checkout-session', authenticate, verifyCheckoutSession);
router.post('/process-card-payment', authenticate, processDirectCardPayment);

module.exports = router;
