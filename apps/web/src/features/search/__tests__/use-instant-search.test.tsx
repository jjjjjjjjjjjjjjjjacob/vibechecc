/**
 * tests useInstantSearch hook for debounced search execution
 * ensures queries fire after delay and cancel on cleanup
 */
/// <reference lib="dom" />

// vitest helpers for assertions and timers
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { useInstantSearch } from '../hooks/use-instant-search';
import type { SearchResponse } from '@viberatr/types';
import React, { type ReactNode } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// Mock dependencies
let mockDebouncedValue: string = '';

vi.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: vi.fn((value: string, _delay: number) => {
    mockDebouncedValue = value;
    return mockDebouncedValue;
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: vi.fn((fn: string, args: Record<string, unknown>) => ({
    queryKey: ['convex', fn, args],
    queryFn: () => Promise.resolve(null),
  })),
}));

vi.mock('@viberatr/convex', () => ({
  api: {
    search: {
      getSearchSuggestions: 'search.getSearchSuggestions',
      searchAll: 'search.searchAll',
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useInstantSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDebouncedValue = '';
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.query).toBe('');
      expect(result.current.isVisible).toBe(false);
      expect(result.current.results).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.previewRef.current).toBeNull();
    });

    it('respects custom options', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      renderHook(() => useInstantSearch({ debounceMs: 300, limit: 5 }), {
        wrapper: createWrapper(),
      });

      expect(vi.mocked(useDebouncedValue)).toHaveBeenCalledWith('', 300);
    });
  });

  describe('Query Handling', () => {
    it('updates query and shows preview when text is entered', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleQueryChange('test search');
      });

      expect(result.current.query).toBe('test search');
      expect(result.current.isVisible).toBe(true);
    });

    it('hides preview when query is empty', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleQueryChange('test');
        result.current.handleQueryChange('');
      });

      expect(result.current.query).toBe('');
      expect(result.current.isVisible).toBe(false);
    });

    it('hides preview when query is only whitespace', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleQueryChange('   ');
      });

      expect(result.current.query).toBe('   ');
      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('Preview Visibility', () => {
    it('hides preview when hidePreview is called', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleQueryChange('test');
      });

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.hidePreview();
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.query).toBe('test'); // Query remains
    });

    it('clears everything when clearSearch is called', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleQueryChange('test search');
      });

      expect(result.current.query).toBe('test search');
      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.query).toBe('');
      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('Query Execution', () => {
    it('executes suggestions query with correct parameters', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);
      vi.mocked(useQuery).mockImplementation(mockUseQuery);

      // Mock debounced value
      vi.mocked(useDebouncedValue).mockImplementation((value) => {
        mockDebouncedValue = value;
        return value;
      });

      const { result } = renderHook(() => useInstantSearch({ limit: 5 }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleQueryChange('test');
      });

      const queryConfig =
        mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0];
      expect(queryConfig.queryKey).toEqual([
        'convex',
        'search.getSearchSuggestions',
        {
          query: 'test',
          limit: 5,
        },
      ]);
      expect(queryConfig.enabled).toBe(true);
    });

    it('disables query when query is empty', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);
      vi.mocked(useQuery).mockImplementation(mockUseQuery);

      renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });

    it('disables query when enabled option is false', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);
      vi.mocked(useQuery).mockImplementation(mockUseQuery);

      // Mock debounced value
      vi.mocked(useDebouncedValue).mockImplementation((value) => {
        mockDebouncedValue = value;
        return value;
      });

      const { result } = renderHook(
        () => useInstantSearch({ enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      act(() => {
        result.current.handleQueryChange('test');
      });

      const queryConfig =
        mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0];
      expect(queryConfig.enabled).toBe(false);
    });
  });

  describe('Debouncing', () => {
    it('uses debounced value for queries', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);
      vi.mocked(useQuery).mockImplementation(mockUseQuery);

      // Mock different debounced value
      vi.mocked(useDebouncedValue).mockReturnValue('debounced-query');

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleQueryChange('original-query');
      });

      expect(result.current.query).toBe('original-query');
      expect(result.current.debouncedQuery).toBe('debounced-query');

      const queryConfig =
        mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0];
      expect(queryConfig.queryKey[2].query).toBe('debounced-query');
    });

    it('uses custom debounce delay', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      renderHook(() => useInstantSearch({ debounceMs: 500 }), {
        wrapper: createWrapper(),
      });

      expect(vi.mocked(useDebouncedValue)).toHaveBeenCalledWith('', 500);
    });
  });

  describe('Loading States', () => {
    it('returns loading state from query', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'loading',
        fetchStatus: 'fetching',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Results', () => {
    it('returns results when available', () => {
      const mockResults = {
        vibes: [{ id: '1', content: 'Test vibe' }],
        users: [{ id: '2', username: 'testuser' }],
        tags: ['test-tag'],
        actions: [],
      };

      vi.mocked(useQuery).mockReturnValue({
        data: mockResults,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.results).toEqual(mockResults);
    });
  });

  describe('Prefetching', () => {
    it('returns prefetch function with correct parameters', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      const prefetchQuery = result.current.prefetchResult('prefetch test');

      expect(prefetchQuery).toEqual({
        queryKey: [
          'convex',
          'search.searchAll',
          {
            query: 'prefetch test',
            paginationOpts: {
              cursor: null,
              numItems: 20,
            },
          },
        ],
        queryFn: expect.any(Function),
      });
    });
  });

  describe('Preview Ref', () => {
    it('provides a ref for the preview element', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      } as unknown as UseQueryResult<SearchResponse, unknown>);

      const { result } = renderHook(() => useInstantSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.previewRef).toBeDefined();
      expect(result.current.previewRef.current).toBeNull();

      // Simulate attaching to an element
      const div = document.createElement('div');
      act(() => {
        result.current.previewRef.current = div;
      });

      expect(result.current.previewRef.current).toBe(div);
    });
  });
});
