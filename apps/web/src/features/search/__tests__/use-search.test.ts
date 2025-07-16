/// <reference lib="dom" />

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch, useSearchSuggestions } from '../hooks/use-search';
import type { ReactNode } from 'react';

// Mock the dependencies
vi.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: (value: string, delay: number) => value, // No delay in tests
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: vi.fn((fn: any, args: any) => ({
    queryKey: ['convex', fn, args],
    queryFn: () => Promise.resolve(null),
  })),
  useConvexMutation: vi.fn(() => vi.fn()),
}));

vi.mock('@vibechecc/convex', () => ({
  api: {
    search: {
      searchAll: 'search.searchAll',
      getSearchSuggestions: 'search.getSearchSuggestions',
      trackSearch: 'search.trackSearch',
    },
  },
}));

import { useQuery, useMutation } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('initializes with empty state', () => {
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
      (useMutation as any).mockReturnValue({
        mutate: vi.fn(),
      });

      const { result } = renderHook(() => useSearch(), { wrapper: createWrapper() });

      expect(result.current.query).toBe('');
      expect(result.current.results).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('updates query when search is called', () => {
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
      (useMutation as any).mockReturnValue({
        mutate: vi.fn(),
      });

      const { result } = renderHook(() => useSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('test query');
      });

      expect(result.current.query).toBe('test query');
    });

    it('clears query when clearSearch is called', () => {
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
      (useMutation as any).mockReturnValue({
        mutate: vi.fn(),
      });

      const { result } = renderHook(() => useSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('test query');
      });

      expect(result.current.query).toBe('test query');

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.query).toBe('');
    });
  });

  describe('Query Execution', () => {
    it('executes query with correct parameters', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: { vibes: [], users: [], tags: [], actions: [] },
        isLoading: false,
        isError: false,
        error: null,
      });
      (useQuery as any).mockImplementation(mockUseQuery);
      (useMutation as any).mockReturnValue({
        mutate: vi.fn(),
      });

      renderHook(() => useSearch({ limit: 10, debounceMs: 500 }), { wrapper: createWrapper() });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['convex', 'search.searchAll', {
        query: '',
        filters: undefined,
        limit: 10,
      }]);
      expect(queryConfig.enabled).toBe(false); // Empty query
    });

    it('enables query when query is not empty', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
      (useQuery as any).mockImplementation(mockUseQuery);
      (useMutation as any).mockReturnValue({
        mutate: vi.fn(),
      });

      const { result } = renderHook(() => useSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('test');
      });

      const queryConfig = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0];
      expect(queryConfig.enabled).toBe(true);
    });

    it('passes filters to query', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
      (useQuery as any).mockImplementation(mockUseQuery);
      (useMutation as any).mockReturnValue({
        mutate: vi.fn(),
      });

      const filters = { tags: ['funny'], minRating: 4 };
      renderHook(() => useSearch({ filters }), { wrapper: createWrapper() });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey[2].filters).toEqual(filters);
    });
  });

  describe('Search Tracking', () => {
    it('tracks search when query changes', async () => {
      const mockMutate = vi.fn();
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
      (useMutation as any).mockReturnValue({
        mutate: mockMutate,
      });

      const { result } = renderHook(() => useSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('test query');
      });

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({ query: 'test query' });
      });
    });

    it('does not track empty queries', () => {
      const mockMutate = vi.fn();
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
      (useMutation as any).mockReturnValue({
        mutate: mockMutate,
      });

      const { result } = renderHook(() => useSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('   '); // Whitespace only
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('returns error state from query', () => {
      const error = new Error('Search failed');
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error,
      });
      (useMutation as any).mockReturnValue({
        mutate: vi.fn(),
      });

      const { result } = renderHook(() => useSearch(), { wrapper: createWrapper() });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });
  });
});

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('returns null data when query is empty', () => {
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useSearchSuggestions(''), { wrapper: createWrapper() });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('executes query when query is provided', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: { vibes: [], users: [], tags: [], actions: [] },
        isLoading: false,
        isError: false,
        error: null,
      });
      (useQuery as any).mockImplementation(mockUseQuery);

      renderHook(() => useSearchSuggestions('test'), { wrapper: createWrapper() });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['convex', 'search.getSearchSuggestions', {
        query: 'test',
      }]);
      expect(queryConfig.enabled).toBe(true);
    });

    it('returns suggestions data when available', () => {
      const mockData = {
        vibes: [{ id: '1', content: 'Test vibe' }],
        users: [],
        tags: [],
        actions: [],
      };
      (useQuery as any).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useSearchSuggestions('test'), { wrapper: createWrapper() });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('Loading States', () => {
    it('returns loading state', () => {
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useSearchSuggestions('test'), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('returns error state', () => {
      const error = new Error('Suggestions failed');
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error,
      });

      const { result } = renderHook(() => useSearchSuggestions('test'), { wrapper: createWrapper() });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });
  });
});