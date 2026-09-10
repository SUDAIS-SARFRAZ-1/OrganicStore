import api from './api';

/**
 * Review API Service (Rule 19: Named resource + action)
 */

export async function getProductReviews(productId) {
  const response = await api.get(`/reviews/product/${productId}`);
  return response;
}

export async function checkReviewEligibility(productId) {
  try {
    const response = await api.get(`/reviews/eligibility/${productId}`);
    return response;
  } catch (err) {
    return {
      eligible: false,
      reason: err.response?.data?.message || 'Unable to check review eligibility.',
    };
  }
}

export async function submitReview({ productId, rating, title, comment }) {
  const response = await api.post('/reviews', {
    productId,
    rating,
    title,
    comment,
  });
  return response;
}

export async function deleteReview(reviewId) {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response;
}
