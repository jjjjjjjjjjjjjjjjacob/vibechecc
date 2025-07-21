/// <reference lib="dom" />

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from '@tanstack/react-query';
import { useSearch, useSearchSuggestions } from '../hooks/use-search';
import React, { type ReactNode } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// Mock the dependencies
let mockDebouncedValue: string = '';

vi.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: vi.fn((value: string, _delay: number) => {
    mockDebouncedValue = value;
    return mockDebouncedValue;
  }),
}));

vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: vi.fn(() => ({ user: { id: 'test-user-id' } })),
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
  convexQuery: vi.fn((fn: string, args: Record<string, unknown>) => ({
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

// Helper to create a complete mock mutation object
const createMockMutation = (
  overrides: Partial<ReturnType<typeof useMutation>> = {}
): ReturnType<typeof useMutation> => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: false,
  isError: false,
  error: null,
  data: null,
  variables: undefined,
  reset: vi.fn(),
  status: 'idle',
  ...overrides,
});

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDebouncedValue = '';
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Functionality', () => {
    it('initializes with empty state', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.query).toBe('');
      expect(result.current.results).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('updates query when search is called', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search('test query');
      });

      expect(result.current.query).toBe('test query');
    });

    it('clears query when clearSearch is called', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

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

  describe('Debouncing', () => {
    it('uses debounced value for queries', async () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useQuery).mockImplementation(mockUseQuery);
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      const { result } = renderHook(() => useSearch({ debounceMs: 300 }), {
        wrapper: createWrapper(),
      });

      // Search is called immediately
      act(() => {
        result.current.search('test');
      });

      // Query uses debounced value
      const queryConfig =
        mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0];
      expect(queryConfig.queryKey[2].query).toBe(mockDebouncedValue);
    });

    it('respects custom debounce delay', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      renderHook(() => useSearch({ debounceMs: 500 }), {
        wrapper: createWrapper(),
      });

      // Check that useDebouncedValue was called with the correct delay
      const mockedUseDebouncedValue = vi.mocked(useDebouncedValue);
      expect(mockedUseDebouncedValue).toHaveBeenCalledWith('', 500);
    });
  });

  describe('Query Execution', () => {
    it('executes query with correct parameters', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: { vibes: [], users: [], tags: [], actions: [], totalCount: 0 },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useQuery).mockImplementation(mockUseQuery);
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      renderHook(() => useSearch({ limit: 10, debounceMs: 500 }), {
        wrapper: createWrapper(),
      });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual([
        'convex',
        'search.searchAll',
        {
          query: '',
          filters: undefined,
          limit: 10,
        },
      ]);
      expect(queryConfig.enabled).toBe(false); // Empty query
    });

    it('enables query when query is not empty', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useQuery).mockImplementation(mockUseQuery);
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      // Mock debounced value to match the query
      vi.mocked(useDebouncedValue).mockImplementation((value) => {
        mockDebouncedValue = value;
        return value;
      });

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search('test');
      });

      const queryConfig =
        mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0];
      expect(queryConfig.enabled).toBe(true);
    });

    it('passes filters to query', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useQuery).mockImplementation(mockUseQuery);
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      const filters = { tags: ['funny'], minRating: 4 };
      renderHook(() => useSearch({ filters }), { wrapper: createWrapper() });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey[2].filters).toEqual(filters);
    });
  });

  describe('Search Tracking', () => {
    it('tracks search when query changes and has results', async () => {
      const mockMutate = vi.fn();
      const mockSearchData = {
        vibes: [{ id: '1', content: 'test' }],
        users: [],
        tags: [],
        actions: [],
        totalCount: 1,
      };

      vi.mocked(useQuery).mockReturnValue({
        data: mockSearchData,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;

      vi.mocked(useMutation).mockReturnValue(
        createMockMutation({
          mutate: mockMutate,
        }) as ReturnType<typeof useMutation>
      );

      // Mock debounced value to match the query
      vi.mocked(useDebouncedValue).mockImplementation((value) => {
        mockDebouncedValue = value;
        return value;
      });

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search('test query');
      });

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          query: 'test query',
          resultCount: 1,
        });
      });
    });

    it('does not track empty queries', () => {
      const mockMutate = vi.fn();
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useMutation).mockReturnValue(
        createMockMutation({
          mutate: mockMutate,
        }) as ReturnType<typeof useMutation>
      );

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search('   '); // Whitespace only
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not track when user is not authenticated', async () => {
      const mockMutate = vi.fn();
      const mockSearchData = {
        vibes: [{ id: '1', content: 'test' }],
        users: [],
        tags: [],
        actions: [],
        totalCount: 1,
      };

      // Mock no user - override the mock temporarily
      const { useUser } = await import('@clerk/tanstack-react-start');
      vi.mocked(useUser).mockImplementation(
        () =>
          ({
            user: null,
          }) as any
      );

      vi.mocked(useQuery).mockReturnValue({
        data: mockSearchData,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;

      vi.mocked(useMutation).mockReturnValue(
        createMockMutation({
          mutate: mockMutate,
        }) as ReturnType<typeof useMutation>
      );

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search('test query');
      });

      await waitFor(() => {
        expect(mockMutate).not.toHaveBeenCalled();
      });

      // Restore the mock
      vi.mocked(useUser).mockImplementation(() => ({
        user: { id: 'test-user-id' },
      }));
    });
  });

  describe('Error Handling', () => {
    it('returns error state from query', () => {
      const error = new Error('Search failed');
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error,
        isSuccess: false,
        status: 'error',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });
  });

  describe('Loading States', () => {
    it('returns loading state during query execution', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'loading',
        fetchStatus: 'fetching',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useMutation).mockReturnValue(createMockMutation());

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.results).toBeNull();
    });
  });
});

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDebouncedValue = '';
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Functionality', () => {
    it('returns suggestions even when query is empty', () => {
      const mockSuggestions = {
        vibes: [],
        users: [],
        tags: ['trending-tag'],
        actions: [],
      };

      vi.mocked(useQuery).mockReturnValue({
        data: mockSuggestions,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;

      const { result } = renderHook(() => useSearchSuggestions(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toEqual(mockSuggestions);
      expect(result.current.isLoading).toBe(false);
    });

    it('executes query when query is provided', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: { vibes: [], users: [], tags: [], actions: [] },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useQuery).mockImplementation(mockUseQuery);

      // Mock debounced value
      vi.mocked(useDebouncedValue).mockImplementation((value) => {
        mockDebouncedValue = value;
        return value;
      });

      renderHook(() => useSearchSuggestions('test'), {
        wrapper: createWrapper(),
      });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual([
        'convex',
        'search.getSearchSuggestions',
        {
          query: 'test',
        },
      ]);
      expect(queryConfig.enabled).toBe(true);
    });

    it('uses faster debounce for suggestions', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;

      renderHook(() => useSearchSuggestions('test'), {
        wrapper: createWrapper(),
      });

      // Check that useDebouncedValue was called with the correct delay
      const mockedUseDebouncedValue = vi.mocked(useDebouncedValue);
      expect(mockedUseDebouncedValue).toHaveBeenCalledWith('test', 150);
    });

    it('returns suggestions data when available', () => {
      const mockData = {
        vibes: [{ id: '1', content: 'Test vibe' }],
        users: [],
        tags: [],
        actions: [],
      };
      vi.mocked(useQuery).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;

      const { result } = renderHook(() => useSearchSuggestions('test'), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('Loading States', () => {
    it('returns loading state', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'loading',
        fetchStatus: 'fetching',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;

      const { result } = renderHook(() => useSearchSuggestions('test'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('returns error state', () => {
      const error = new Error('Suggestions failed');
      vi.mocked(useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error,
        isSuccess: false,
        status: 'error',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;

      const { result } = renderHook(() => useSearchSuggestions('test'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });
  });

  describe('Debouncing', () => {
    it('uses debounced value for suggestions', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        fetchStatus: 'idle',
        refetch: vi.fn(),
      }) as ReturnType<typeof useQuery>;
      vi.mocked(useQuery).mockImplementation(mockUseQuery);

      // Mock debounced value to be different from input
      vi.mocked(useDebouncedValue).mockReturnValue('debounced-test');

      renderHook(() => useSearchSuggestions('test'), {
        wrapper: createWrapper(),
      });

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey[2].query).toBe('debounced-test');
    });
  });
});
