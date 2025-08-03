/// <reference lib="dom" />
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

// Mock for Convex queries with proper data
const mockConvexQuery = vi.fn((apiFunction, params) => {
  // Return different data based on the API function being called
  if (apiFunction === 'api.emojis.getPopular') {
    return {
      queryKey: ['convexQuery', apiFunction, params],
      queryFn: async () => mockPopularEmojis,
      enabled: true,
      staleTime: 0,
    };
  }
  
  if (apiFunction === 'api.emojis.search') {
    return {
      queryKey: ['convexQuery', apiFunction, params],
      queryFn: async () => ({ 
        emojis: params?.searchTerm ? mockSearchResults : mockCategoryEmojis, 
        hasMore: false 
      }),
      enabled: true,
      staleTime: 0,
    };
  }
  
  if (apiFunction === 'api.search.getTrendingSearches') {
    return {
      queryKey: ['convexQuery', apiFunction, params],
      queryFn: async () => [
        { term: 'happy vibes', count: 42 },
        { term: 'weekend', count: 38 },
        { term: 'mood', count: 35 }
      ],
      enabled: true,
      staleTime: 0,
    };
  }
  
  // Default fallback
  return {
    queryKey: ['convexQuery', apiFunction, params],
    queryFn: async () => ({ emojis: [], hasMore: false }),
    enabled: true,
    staleTime: 0,
  };
});

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: mockConvexQuery,
  useConvexMutation: (fn: any) => fn, // Just return the function as-is for mocking
}));

// Also mock the api import to provide consistent function references
vi.mock('@viberater/convex', () => ({
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
    searchOptimized: {
      searchAllOptimized: 'api.searchOptimized.searchAllOptimized',
    },
    search: {
      trackSearch: 'api.search.trackSearch',
      getTrendingSearches: 'api.search.getTrendingSearches',
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

// Simplified mock for @/queries module
const defaultQuery = () => ({ data: [], isLoading: false, error: null });
const defaultMutation = () => ({ mutate: vi.fn(), isLoading: false, error: null });

vi.mock('@/queries', () => ({
  useVibes: defaultQuery,
  useVibesInfinite: () => ({
    data: { pages: [{ results: [], isDone: true }] },
    isLoading: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useForYouFeedInfinite: () => ({
    data: { pages: [{ results: [], isDone: true }] },
    isLoading: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useVibesPaginated: defaultQuery,
  useDeleteVibeMutation: defaultMutation,
  useCreateEmojiRatingMutation: defaultMutation,
  useTopEmojiRatings: defaultQuery,
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
  // Force garbage collection in test environment
  if (global.gc) {
    global.gc();
  }
  // Clear vi mocks
  vi.clearAllMocks();
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
