const express = require('express');
const {
  getProductReviews,
  checkEligibility,
  createReview,
  deleteReview,
  adminGetReviews,
  adminToggleReviewStatus,
  adminFeatureReviewAsTestimonial,
} = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public: Get reviews for a product
router.get('/product/:productId', getProductReviews);

// Customer Authenticated: Check eligibility
router.get('/eligibility/:productId', authenticate, checkEligibility);

// Customer Authenticated: Post a purchase-gated review
router.post('/', authenticate, createReview);

// Customer Authenticated (or Admin): Delete review
router.delete('/:id', authenticate, deleteReview);

// Admin Routes
router.get('/admin/all', authenticate, authorize('ADMIN'), adminGetReviews);
router.put('/admin/:id/status', authenticate, authorize('ADMIN'), adminToggleReviewStatus);
router.post('/admin/:id/feature-testimonial', authenticate, authorize('ADMIN'), adminFeatureReviewAsTestimonial);

module.exports = router;
