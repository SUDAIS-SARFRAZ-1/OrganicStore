import api from './api';

/**
 * Auth API Service (Rule 19: Named resource + action)
 */
export async function loginUser({ email, password }) {
  return api.post('/auth/login', { email, password });
}

export async function registerUser({ name, email, password, phone }) {
  return api.post('/auth/register', { name, email, password, phone });
}

export async function verifyOtpApi({ email, otp }) {
  return api.post('/auth/verify-otp', { email, otp });
}

export async function resendOtpApi({ email }) {
  return api.post('/auth/resend-otp', { email });
}

// Backwards compatibility functions
export async function verifyEmailApi({ token }) {
  return api.post('/auth/verify-email', { token });
}

export async function resendVerificationApi({ email }) {
  return api.post('/auth/resend-verification', { email });
}

export async function logoutUser() {
  return api.post('/auth/logout');
}

export async function getMe() {
  return api.get('/auth/me');
}
