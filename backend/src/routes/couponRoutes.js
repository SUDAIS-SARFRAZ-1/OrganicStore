const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getPublicCoupons,
  validateCoupon,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter for coupon validation to prevent brute-force code guessing
const couponValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 30,
  message: {
    success: false,
    message: 'Too many coupon validation attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public / Customer routes
router.get('/public', getPublicCoupons);
router.post('/validate', couponValidationLimiter, validateCoupon);

// Admin-only routes (Rule 23 & 24)
router.get('/', authenticate, authorize('ADMIN'), getAllCoupons);
router.post('/', authenticate, authorize('ADMIN'), createCoupon);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCoupon);

module.exports = router;
