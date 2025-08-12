import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ClerkProvider } from '@clerk/tanstack-react-start';

// Use actual Convex client for integration tests
// This assumes you have VITE_CONVEX_URL set in your test environment
const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://test.convex.cloud';

// Create a real Convex client for tests
export const createTestConvexClient = () => {
  return new ConvexReactClient(CONVEX_URL);
};

// Create test wrapper with real providers
export const createIntegrationTestWrapper = (options?: {
  convexClient?: ConvexReactClient;
  queryClient?: QueryClient;
}) => {
  const convexClient = options?.convexClient || createTestConvexClient();

  const queryClient =
    options?.queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0, // Always fetch fresh data in tests
          gcTime: 0, // Don't cache between tests
        },
        mutations: {
          retry: false,
        },
      },
    });

  return ({ children }: { children: ReactNode }) => (
    <ClerkProvider
      publishableKey={process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_'}
    >
      <ConvexProvider client={convexClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
};

// Helper to wait for Convex queries to resolve
export const waitForConvexQuery = async (
  fn: () => boolean | Promise<boolean>,
  timeout = 5000
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await fn();
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timeout waiting for Convex query after ${timeout}ms`);
};

// Helper to clean up test data
export const cleanupTestData = async (convexClient: ConvexReactClient) => {
  // This would call a Convex function to clean up test data
  // For now, we'll just disconnect the client
  convexClient.close();
};

// Test utilities for authentication
export const mockAuthenticatedUser = (userId: string = 'test-user-123') => {
  // In a real setup, this would set up Clerk authentication
  // For now, we'll use the mock from vitest.setup.ts
  return {
    userId,
    isSignedIn: true,
    user: {
      id: userId,
      username: 'testuser',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  };
};

// Export test data generators
export const generateTestVibe = (overrides = {}) => ({
  title: 'Test Vibe',
  description: 'This is a test vibe',
  emoji: '🎉',
  tags: ['test', 'vitest'],
  ...overrides,
});

export const generateTestUser = (overrides = {}) => ({
  externalId: `test-user-${Date.now()}`,
  username: `testuser${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  ...overrides,
});

export const generateTestRating = (vibeId: string, overrides = {}) => ({
  vibeId,
  value: 5,
  review: 'Great vibe!',
  emoji: '⭐',
  ...overrides,
});
