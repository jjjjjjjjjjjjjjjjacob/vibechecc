/// <reference lib="dom" />
/**
 * Global Vitest setup for the web app. Provides DOM assertions, cleans up
 * rendered components after each test, and defines common mocks used across
 * test suites.
 */
import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as React from 'react';

// Mock data
const mockPopularEmojis = [
  { emoji: '🔥', name: 'fire', color: '#FF6B6B', keywords: ['hot', 'flame'] },
  {
    emoji: '😍',
    name: 'heart eyes',
    color: '#FF6B9D',
    keywords: ['love', 'crush'],
  },
  {
    emoji: '💯',
    name: '100',
    color: '#4ECDC4',
    keywords: ['perfect', 'score'],
  },
];

// Mock file URL data
const mockFileUrl = 'https://example.com/mock-image.jpg';

const mockCategoryEmojis = [
  {
    emoji: '😀',
    name: 'grinning face',
    color: '#FFD93D',
    keywords: ['smile', 'happy'],
    category: 'smileys',
  },
  {
    emoji: '😃',
    name: 'grinning face with big eyes',
    color: '#FFD93D',
    keywords: ['smile', 'happy'],
    category: 'smileys',
  },
  {
    emoji: '😄',
    name: 'grinning face with smiling eyes',
    color: '#FFD93D',
    keywords: ['smile', 'happy'],
    category: 'smileys',
  },
  {
    emoji: '👋',
    name: 'waving hand',
    color: '#FFCB6B',
    keywords: ['hello', 'goodbye'],
    category: 'people',
  },
  {
    emoji: '👍',
    name: 'thumbs up',
    color: '#FFCB6B',
    keywords: ['like', 'approve'],
    category: 'people',
  },
];

const mockSearchResults = [
  { emoji: '🔥', name: 'fire', color: '#FF6B6B', keywords: ['hot', 'flame'] },
  {
    emoji: '🔴',
    name: 'red circle',
    color: '#FF0000',
    keywords: ['red', 'circle'],
  },
];

// Mock @convex-dev/react-query to return mock data immediately
const mockConvexQuery = vi.fn((query: unknown, args: any) => {
  // Default structure for all queries
  const baseQuery = {
    queryKey: ['convexQuery', query, args],
    queryFn: async (): Promise<any> => {
      // Default return for unknown queries
      return [];
    },
    enabled: args?.enabled !== false,
    staleTime: 0,
  };

  // Log for debugging
  // console.log('convexQuery called with:', { query, args });

  // Try to identify the query function name from various possible structures
  let functionName = '';

  try {
    // Safely extract function name from query object
    if (query) {
      // Try JSON stringify to see the structure, handling circular references
      let queryStr = '';
      try {
        queryStr = JSON.stringify(query);
      } catch {
        // Handle circular reference or other stringify errors
        if (query.toString) {
          queryStr = query.toString();
        }
      }

      // Look for function names in the stringified version
      if (queryStr && typeof queryStr === 'string') {
        if (queryStr.includes('getPopular')) {
          functionName = 'getPopular';
        } else if (queryStr.includes('getCategories')) {
          functionName = 'getCategories';
        } else if (queryStr.includes('searchAllOptimized')) {
          functionName = 'searchAllOptimized';
        } else if (queryStr.includes('getCurrentUserFollowStats')) {
          functionName = 'getCurrentUserFollowStats';
        } else if (queryStr.includes('getFollowStats')) {
          functionName = 'getFollowStats';
        } else if (queryStr.includes('getForYouFeed')) {
          functionName = 'getForYouFeed';
        } else if (queryStr.includes('search')) {
          functionName = 'search';
        } else if (queryStr.includes('getUrl')) {
          functionName = 'getUrl';
        }
      }

      // Check if query is a string (from our mock)
      if (typeof query === 'string') {
        if (query.includes('getPopular')) {
          functionName = 'getPopular';
        } else if (query.includes('getCategories')) {
          functionName = 'getCategories';
        } else if (query.includes('searchAllOptimized')) {
          functionName = 'searchAllOptimized';
        } else if (query.includes('getCurrentUserFollowStats')) {
          functionName = 'getCurrentUserFollowStats';
        } else if (query.includes('getFollowStats')) {
          functionName = 'getFollowStats';
        } else if (query.includes('getForYouFeed')) {
          functionName = 'getForYouFeed';
        } else if (query.includes('search')) {
          functionName = 'search';
        } else if (query.includes('getUrl')) {
          functionName = 'getUrl';
        }
      }

      // Also try direct property access
      if (!functionName && typeof query === 'object' && query !== null) {
        // First check direct properties
        const queryObj = query as any;
        functionName =
          queryObj._name || queryObj.name || queryObj.functionName || '';

        // Check nested properties if still no function name
        if (!functionName) {
          try {
            const queryKeys = Object.keys(query);
            for (const key of queryKeys) {
              const value = (query as any)[key];
              if (value && typeof value === 'object') {
                if (value._name || value.name) {
                  functionName = value._name || value.name;
                  break;
                }
                // Check if the key itself might be the function name
                if (
                  key === 'getPopular' ||
                  key === 'getCategories' ||
                  key === 'searchAllOptimized' ||
                  key === 'search' ||
                  key === 'getUrl'
                ) {
                  functionName = key;
                  break;
                }
              }
            }
          } catch {
            // Ignore errors when accessing properties
          }
        }
      }
    }
  } catch {
    // If any error occurs during extraction, just use empty string
    functionName = '';
  }

  // Ensure functionName is always a string
  if (typeof functionName !== 'string') {
    functionName = '';
  }

  // Match against our expected function names
  const fnStr = String(functionName || '');
  if (fnStr === 'getPopular' || fnStr.includes('getPopular')) {
    // Return the array directly for getPopular
    baseQuery.queryFn = async (): Promise<any[]> => mockPopularEmojis;
  } else if (fnStr === 'getCategories' || fnStr.includes('getCategories')) {
    baseQuery.queryFn = async (): Promise<string[]> => [
      'smileys',
      'people',
      'animals',
      'food',
    ];
  } else if (
    fnStr === 'searchAllOptimized' ||
    fnStr.includes('searchAllOptimized')
  ) {
    // Handle searchAllOptimized specifically
    baseQuery.queryFn = async (): Promise<any> => {
      return {
        vibes: [],
        users: [],
        tags: [],
        actions: [],
        reviews: [],
        totalCount: 0,
        hasMore: false,
        page: args?.page || 0,
        continueCursor: null,
      };
    };
  } else if (
    fnStr === 'getCurrentUserFollowStats' ||
    fnStr.includes('getCurrentUserFollowStats')
  ) {
    baseQuery.queryFn = async (): Promise<any> => {
      return {
        followers: 5,
        following: 10,
      };
    };
  } else if (fnStr === 'getFollowStats' || fnStr.includes('getFollowStats')) {
    baseQuery.queryFn = async (): Promise<any> => {
      return {
        followers: 3,
        following: 7,
      };
    };
  } else if (fnStr === 'getForYouFeed' || fnStr.includes('getForYouFeed')) {
    baseQuery.queryFn = async (): Promise<any> => {
      return {
        results: [],
        isDone: true,
        continueCursor: null,
      };
    };
  } else if (fnStr === 'search' || fnStr.includes('search')) {
    baseQuery.queryFn = async (): Promise<any> => {
      if (args?.searchTerm) {
        if (args.searchTerm === 'xyzabc123notfound') {
          return {
            emojis: [],
            hasMore: false,
            page: 0,
            pageSize: 50,
            totalCount: 0,
          };
        }

        return {
          emojis: mockSearchResults,
          hasMore: false,
          page: args.page || 0,
          pageSize: args.pageSize || 50,
          totalCount: mockSearchResults.length,
        };
      }

      // Category browsing
      return {
        emojis: args?.page === 0 ? mockCategoryEmojis : [],
        hasMore: args?.page === 0,
        page: args.page || 0,
        pageSize: args.pageSize || 200,
        totalCount: mockCategoryEmojis.length,
      };
    };
  } else if (fnStr === 'getUrl' || fnStr.includes('getUrl')) {
    baseQuery.queryFn = async (): Promise<string | null> => {
      // Return mock file URL
      return mockFileUrl;
    };
  }

  return baseQuery;
});

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: mockConvexQuery,
  useConvexMutation: (fn: any) => fn, // Just return the function as-is for mocking
}));

// Also mock the api import to provide consistent function references
vi.mock('@viberatr/convex', () => ({
  api: {
    emojis: {
      getPopular: 'api.emojis.getPopular',
      getCategories: 'api.emojis.getCategories',
      search: 'api.emojis.search',
      getByEmojis: 'api.emojis.getByEmojis',
    },
    emojiRatings: {
      getEmojiMetadata: 'api.emojiRatings.getEmojiMetadata',
      getAllEmojiMetadata: 'api.emojiRatings.getAllEmojiMetadata',
      getEmojiByCategory: 'api.emojiRatings.getEmojiByCategory',
    },
    'search-optimized': {
      searchAllOptimized: 'api["search-optimized"].searchAllOptimized',
    },
    search: {
      trackSearch: 'api.search.trackSearch',
    },
    vibes: {
      getAllSimple: 'api.vibes.getAllSimple',
      getAll: 'api.vibes.getAll',
      getFilteredVibes: 'api.vibes.getFilteredVibes',
      getById: 'api.vibes.getById',
      getByUser: 'api.vibes.getByUser',
      getForYouFeed: 'api.vibes.getForYouFeed',
    },
    users: {
      current: 'api.users.current',
    },
    follows: {
      getFollowStats: 'api.follows.getFollowStats',
      getCurrentUserFollowStats: 'api.follows.getCurrentUserFollowStats',
    },
    files: {
      getUrl: 'api.files.getUrl',
    },
  },
}));

// Mock @/queries module
vi.mock('@/queries', () => ({
  useVibes: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useVibesInfinite: () => ({
    data: {
      pages: [{ results: [], isDone: true, continueCursor: null }],
    },
    isLoading: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useForYouFeedInfinite: () => ({
    data: {
      pages: [{ results: [], isDone: true, continueCursor: null }],
    },
    isLoading: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useVibesPaginated: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useDeleteVibeMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
  useCreateEmojiRatingMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
  useTopEmojiRatings: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

// Mock @clerk/tanstack-react-start
vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({
    user: { id: 'user123', firstName: 'Test', lastName: 'User' },
    isLoaded: true,
    isSignedIn: true,
  }),
  SignInButton: ({ children, ...props }: any) =>
    React.createElement(
      'button',
      { ...props, 'data-testid': 'sign-in-button' },
      children || 'Sign In'
    ),
  SignOutButton: ({ children, ...props }: any) =>
    React.createElement(
      'button',
      { ...props, 'data-testid': 'sign-out-button' },
      children || 'Sign Out'
    ),
  SignUpButton: ({ children, ...props }: any) =>
    React.createElement(
      'button',
      { ...props, 'data-testid': 'sign-up-button' },
      children || 'Sign Up'
    ),
  UserButton: ({ ...props }: any) =>
    React.createElement(
      'button',
      { ...props, 'data-testid': 'user-button' },
      'User'
    ),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLElement.prototype methods that might be missing
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}
