import api from './api';

/**
 * Payment API Service
 */
export async function getStripeConfig() {
  const response = await api.get('/payments/config');
  return response.publishableKey;
}

export async function createStripeCheckoutSession(orderId) {
  const response = await api.post('/payments/create-checkout-session', { orderId });
  return response;
}

export async function verifyStripeCheckoutSession(sessionId, orderId) {
  const response = await api.post('/payments/verify-checkout-session', { sessionId, orderId });
  return response;
}

export async function processDirectCardPayment(paymentData) {
  const response = await api.post('/payments/process-card-payment', paymentData);
  return response;
}

