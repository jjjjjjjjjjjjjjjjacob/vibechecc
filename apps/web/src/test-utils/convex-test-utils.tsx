import { vi } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Mock Convex client
export const mockConvexClient = {
  query: vi.fn(),
  mutation: vi.fn(),
  action: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
} as unknown as ConvexReactClient;

// Default mock data
export const mockData = {
  emojis: {
    popular: [
      { _id: '1', emoji: '🔥', category: 'popular', description: 'Fire' },
      { _id: '2', emoji: '😍', category: 'popular', description: 'Heart Eyes' },
      { _id: '3', emoji: '💯', category: 'popular', description: 'Hundred' },
    ],
    search: {
      default: [
        {
          _id: '5',
          emoji: '😀',
          category: 'smileys',
          description: 'Grinning Face',
        },
        {
          _id: '6',
          emoji: '👋',
          category: 'hands',
          description: 'Waving Hand',
        },
        { _id: '7', emoji: '👍', category: 'hands', description: 'Thumbs Up' },
      ],
      fire: [
        { _id: '1', emoji: '🔥', category: 'objects', description: 'Fire' },
        {
          _id: '4',
          emoji: '🔴',
          category: 'symbols',
          description: 'Red Circle',
        },
      ],
    },
    categories: ['popular', 'smileys', 'hands', 'objects', 'symbols'],
  },
  users: {
    current: null,
  },
  vibes: [],
  notifications: [],
};

// Mock convexQuery function that returns proper React Query options
export const mockConvexQuery = (query: unknown, args: unknown) => {
  const queryString = query?.toString() || '';

  return {
    queryKey: ['convexQuery', queryString, args],
    queryFn: async () => {
      // Mock emoji queries
      if (queryString.includes('emojis.getPopular')) {
        return mockData.emojis.popular;
      }

      if (queryString.includes('emojis.search')) {
        const searchArgs = args as { searchTerm?: string };
        if (searchArgs?.searchTerm === 'fire') {
          return mockData.emojis.search.fire;
        }
        if (searchArgs?.searchTerm === 'xyzabc123notfound') {
          return [];
        }
        return mockData.emojis.search.default;
      }

      if (queryString.includes('emojis.getCategories')) {
        return mockData.emojis.categories;
      }

      // Mock user queries
      if (queryString.includes('users.current')) {
        return mockData.users.current;
      }

      // Default return
      return undefined;
    },
  };
};

// Mock useConvexQuery hook
export const mockUseConvexQuery = (query: unknown, args: unknown) => {
  const queryString = query?.toString() || '';

  // Mock emoji queries
  if (queryString.includes('emojis.getPopular')) {
    return {
      data: mockData.emojis.popular,
      isLoading: false,
      error: null,
    };
  }

  if (queryString.includes('emojis.search')) {
    const searchArgs = args as { searchTerm?: string };
    if (searchArgs?.searchTerm === 'fire') {
      return {
        data: mockData.emojis.search.fire,
        isLoading: false,
        error: null,
      };
    }
    if (searchArgs?.searchTerm === 'xyzabc123notfound') {
      return {
        data: [],
        isLoading: false,
        error: null,
      };
    }
    return {
      data: mockData.emojis.search.default,
      isLoading: false,
      error: null,
    };
  }

  if (queryString.includes('emojis.getCategories')) {
    return {
      data: mockData.emojis.categories,
      isLoading: false,
      error: null,
    };
  }

  // Mock user queries
  if (queryString.includes('users.current')) {
    return {
      data: mockData.users.current,
      isLoading: false,
      error: null,
    };
  }

  // Default return
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
};

// Mock useConvexMutation hook
export const mockUseConvexMutation = () => vi.fn();

// Mock useConvexAction hook
export const mockUseConvexAction = () => vi.fn();

// Test wrapper component with providers
export interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
  convexClient?: ConvexReactClient;
}

export const createTestWrapper = (options?: {
  queryClient?: QueryClient;
  convexClient?: ConvexReactClient;
}) => {
  const queryClient =
    options?.queryClient ||
    new QueryClient({
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

  const convexClient = options?.convexClient || mockConvexClient;

  return ({ children }: { children: ReactNode }) => (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProvider>
  );
};

// Utility to update mock data for specific tests
export const updateMockData = (path: string, value: unknown) => {
  const keys = path.split('.');
  let current: Record<string, unknown> = mockData as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
};

// Reset mock data to defaults
export const resetMockData = () => {
  mockData.users.current = null;
  mockData.vibes = [];
  mockData.notifications = [];
  // Reset other data as needed
};
