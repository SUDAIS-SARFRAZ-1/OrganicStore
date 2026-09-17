import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://organicstore-6t0v.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: centralized error extraction & session expiry handler
api.interceptors.response.use(
  (response) => response.data,
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
