const express = require('express');
const {
  getPublicCoupons,
  validateCoupon,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public / Customer routes
router.get('/public', getPublicCoupons);
router.post('/validate', validateCoupon);

// Admin-only routes (Rule 23 & 24)
router.get('/', authenticate, authorize('ADMIN'), getAllCoupons);
router.post('/', authenticate, authorize('ADMIN'), createCoupon);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCoupon);

module.exports = router;
