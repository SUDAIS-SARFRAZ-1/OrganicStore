import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query Client
 * Shared across application to enable immediate cache invalidation and purging on auth state changes.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});
