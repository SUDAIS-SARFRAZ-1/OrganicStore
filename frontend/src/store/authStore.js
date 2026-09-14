import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../queryClient';
import { clearGuestCartId } from '../services/cartApi';
import { logoutUser } from '../services/authApi';

/**
 * Zustand Auth Store (Client/UI State only - Rule 10)
 * Manages client user profile snapshot and UI authentication state.
 * SECURITY (Item 5): JWT tokens are NEVER stored in localStorage or Zustand.
 * Sessions are strictly HTTP-only, secure, sameSite cookies.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // Accept user object (token parameter ignored for security - cookie-only sessions)
      setAuth: (user) =>
        set({
          user: user || null,
          isAuthenticated: Boolean(user),
        }),

      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),

      logout: async () => {
        // 1. Notify backend to clear HTTP-only auth and guest cookies
        try {
          await logoutUser();
        } catch {
          // Ignore network errors during logout
        }

        // 2. Remove guest cart pointer
        clearGuestCartId();

        // 3. Completely flush React Query cache so subsequent logins NEVER see previous member's data
        try {
          queryClient.clear();
        } catch {
          // Ignore if queryClient is not initialized
        }

        // 4. Reset auth state in memory and localStorage
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'organic_store_auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
