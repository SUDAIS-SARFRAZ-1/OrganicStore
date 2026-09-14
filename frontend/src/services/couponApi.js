import api from './api';

/**
 * Coupon API Service (Rule 19: Named resource + action)
 */
export async function getPublicCoupons() {
  try {
    const response = await api.get('/coupons/public');
    return response.coupons || [];
  } catch {
    return [];
  }
}

export async function validateCoupon({ code, cartTotal }) {
  const response = await api.post('/coupons/validate', {
    code,
    cartTotal,
  });
  return response;
}
