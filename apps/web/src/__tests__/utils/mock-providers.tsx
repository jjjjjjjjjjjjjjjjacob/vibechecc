/// <reference lib="dom" />
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import { mockUsers } from './mock-data';
import { vi } from 'vitest';

/**
 * Mock providers for testing React components with full app context
 */

// Create mock query client
const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

// Mock Clerk publishable key (using proper format)
const mockClerkPublishableKey = 'pk_test_Y2xlcmsuY2xldmVyLmRvbWFpbi5jb20k';

// Mock user context
export interface MockUserContextType {
  user: typeof mockUsers.alice | null;
  isSignedIn: boolean;
  isLoaded: boolean;
}

const MockUserContext = React.createContext<MockUserContextType>({
  user: null,
  isSignedIn: false,
  isLoaded: false,
});

export const useMockUser = () => React.useContext(MockUserContext);

// Provider for authenticated user tests
export function MockAuthenticatedProvider({
  children,
  user = mockUsers.alice,
}: {
  children: React.ReactNode;
  user?: typeof mockUsers.alice;
}) {
  const contextValue: MockUserContextType = {
    user,
    isSignedIn: true,
    isLoaded: true,
  };

  return (
    <MockUserContext.Provider value={contextValue}>
      <ClerkProvider publishableKey={mockClerkPublishableKey}>
        <QueryClientProvider client={mockQueryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    </MockUserContext.Provider>
  );
}

// Provider for unauthenticated user tests
export function MockUnauthenticatedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const contextValue: MockUserContextType = {
    user: null,
    isSignedIn: false,
    isLoaded: true,
  };

  return (
    <MockUserContext.Provider value={contextValue}>
      <ClerkProvider publishableKey={mockClerkPublishableKey}>
        <QueryClientProvider client={mockQueryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    </MockUserContext.Provider>
  );
}

// Provider for loading state tests
export function MockLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const contextValue: MockUserContextType = {
    user: null,
    isSignedIn: false,
    isLoaded: false,
  };

  return (
    <MockUserContext.Provider value={contextValue}>
      <ClerkProvider publishableKey={mockClerkPublishableKey}>
        <QueryClientProvider client={mockQueryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    </MockUserContext.Provider>
  );
}

// Simplified app provider without router (to avoid complex setup issues)
export function MockAppProvider({
  children,
  user = mockUsers.alice,
  isSignedIn = true,
}: {
  children: React.ReactNode;
  initialRoute?: string;
  user?: typeof mockUsers.alice;
  isSignedIn?: boolean;
}) {
  const contextValue: MockUserContextType = {
    user: isSignedIn ? user : null,
    isSignedIn,
    isLoaded: true,
  };

  return (
    <MockUserContext.Provider value={contextValue}>
      <ClerkProvider publishableKey={mockClerkPublishableKey}>
        <QueryClientProvider client={mockQueryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    </MockUserContext.Provider>
  );
}

// Provider with custom query client for specific test scenarios
export function MockProviderWithQueryClient({
  children,
  queryClient,
  user = null,
  isSignedIn = false,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
  user?: typeof mockUsers.alice | null;
  isSignedIn?: boolean;
}) {
  const contextValue: MockUserContextType = {
    user,
    isSignedIn,
    isLoaded: true,
  };

  return (
    <MockUserContext.Provider value={contextValue}>
      <ClerkProvider publishableKey={mockClerkPublishableKey}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    </MockUserContext.Provider>
  );
}

// Utility to create a fresh query client for tests that need isolation
export function createMockQueryClient(options?: {
  retry?: boolean;
  staleTime?: number;
}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: options?.retry ?? false,
        staleTime: options?.staleTime ?? Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Mock PostHog provider for analytics testing
export function MockPostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock PostHog instance
  const mockPostHog = {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    isFeatureEnabled: vi.fn(() => false),
    getFeatureFlag: vi.fn(() => null),
    onFeatureFlags: vi.fn(),
  };

  // Mock PostHog React context
  const MockPostHogContext = React.createContext(mockPostHog);

  return (
    <MockPostHogContext.Provider value={mockPostHog}>
      {children}
    </MockPostHogContext.Provider>
  );
}
