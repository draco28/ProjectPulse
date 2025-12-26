'use client';

/**
 * React Query Provider - Sprint 15
 *
 * Wraps the app with QueryClientProvider for React Query hooks.
 * Required for: useKanbanBoard, useSessionsData, useOnboarding, etc.
 *
 * Configuration:
 * - staleTime: 60s (data considered fresh)
 * - gcTime: 5min (cache garbage collection)
 * - retry: 1 (single retry on failure)
 * - refetchOnWindowFocus: false (manual refresh preferred)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient inside component to avoid shared state between requests (SSR safety)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default QueryProvider;
