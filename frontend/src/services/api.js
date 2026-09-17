import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://organicstore-6t0v.onrender.com/api';
const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
const baseURL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token and guest cart ID header
api.interceptors.request.use((config) => {
  try {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore
  }

  try {
    const guestCartId = localStorage.getItem('organic_store_guest_cart_id');
    if (guestCartId && !config.headers['x-cart-id']) {
      config.headers['x-cart-id'] = guestCartId;
    }
  } catch {
    // Ignore
  }

  return config;
});

// Response interceptor: centralized error extraction, session expiry handler & cart sync
api.interceptors.response.use(
  (response) => {
    // Sync guest cart ID from header or payload if present
    const headerCartId = response.headers?.['x-cart-id'];
    const payloadCartId = response.data?.guestCartId;
    const cartId = headerCartId || payloadCartId;

    if (cartId && typeof cartId === 'string' && cartId.trim().length > 0) {
      try {
        localStorage.setItem('organic_store_guest_cart_id', cartId.trim());
      } catch {
        // Ignore
      }
    }

    return response.data;
  },
  (error) => {
    // If backend reports token expired or unauthorized, automatically clear session and query cache
    if (error.response?.status === 401) {
      try {
        useAuthStore.getState().logout();
      } catch {
        // Ignore
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
