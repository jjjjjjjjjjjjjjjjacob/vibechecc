/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider } from 'convex/react';
import { useNotifications } from './use-notifications';
import React, { type ReactNode } from 'react';

// Mock Convex
const mockConvex = {
  query: vi.fn(),
};

vi.mock('convex/react', () => ({
  useConvex: () => mockConvex,
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the API
vi.mock('@vibechecc/convex', () => ({
  api: {
    notifications: {
      getNotifications: 'notifications:getNotifications',
    },
  },
}));

describe('useNotifications', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={mockConvex as any}>{children}</ConvexProvider>
    </QueryClientProvider>
  );

  it('fetches notifications with default parameters', async () => {
    const mockNotifications = {
      notifications: [
        {
          _id: 'notif1',
          type: 'follow',
          title: 'John followed you',
          read: false,
          createdAt: Date.now(),
        },
      ],
      nextCursor: null,
    };

    mockConvex.query.mockResolvedValue(mockNotifications);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(mockConvex.query).toHaveBeenCalledWith(
      'notifications:getNotifications',
      {
        limit: 20,
        cursor: undefined,
        type: undefined,
      }
    );

    expect(result.current.data?.pages[0]).toEqual(mockNotifications);
  });

  it('fetches notifications with specific filter', async () => {
    const mockNotifications = {
      notifications: [
        {
          _id: 'notif1',
          type: 'follow',
          title: 'John followed you',
          read: false,
          createdAt: Date.now(),
        },
      ],
      nextCursor: null,
    };

    mockConvex.query.mockResolvedValue(mockNotifications);

    const { result } = renderHook(() => useNotifications('follow'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(mockConvex.query).toHaveBeenCalledWith(
      'notifications:getNotifications',
      {
        limit: 20,
        cursor: undefined,
        type: 'follow',
      }
    );
  });

  it('handles "all" filter by passing undefined type', async () => {
    const mockNotifications = {
      notifications: [],
      nextCursor: null,
    };

    mockConvex.query.mockResolvedValue(mockNotifications);

    const { result } = renderHook(() => useNotifications('all'), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(mockConvex.query).toHaveBeenCalledWith(
      'notifications:getNotifications',
      {
        limit: 20,
        cursor: undefined,
        type: undefined,
      }
    );
  });

  it('respects custom limit option', async () => {
    const mockNotifications = {
      notifications: [],
      nextCursor: null,
    };

    mockConvex.query.mockResolvedValue(mockNotifications);

    const { result } = renderHook(
      () => useNotifications('follow', { limit: 50 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(mockConvex.query).toHaveBeenCalledWith(
      'notifications:getNotifications',
      {
        limit: 50,
        cursor: undefined,
        type: 'follow',
      }
    );
  });

  it('respects enabled option', async () => {
    const { result } = renderHook(
      () => useNotifications('follow', { enabled: false }),
      { wrapper }
    );

    // Should not make any queries when disabled
    expect(mockConvex.query).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('handles pagination correctly', async () => {
    const page1 = {
      notifications: [
        { _id: 'notif1', type: 'follow', title: 'Page 1', read: false },
      ],
      nextCursor: 'cursor1',
    };

    const page2 = {
      notifications: [
        { _id: 'notif2', type: 'rating', title: 'Page 2', read: false },
      ],
      nextCursor: null,
    };

    // First call returns page 1
    mockConvex.query.mockResolvedValueOnce(page1);
    // Second call returns page 2
    mockConvex.query.mockResolvedValueOnce(page2);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for first page to load
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(1);
    });

    expect(result.current.data?.pages[0]).toEqual(page1);
    expect(result.current.hasNextPage).toBe(true);

    // Fetch next page
    result.current.fetchNextPage();

    // Wait for second page to load
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    expect(result.current.data?.pages[0]).toEqual(page1);
    expect(result.current.data?.pages[1]).toEqual(page2);
    expect(result.current.hasNextPage).toBe(false);

    // Verify both queries were made with correct cursors
    expect(mockConvex.query).toHaveBeenNthCalledWith(
      1,
      'notifications:getNotifications',
      {
        limit: 20,
        cursor: undefined,
        type: undefined,
      }
    );

    expect(mockConvex.query).toHaveBeenNthCalledWith(
      2,
      'notifications:getNotifications',
      {
        limit: 20,
        cursor: 'cursor1',
        type: undefined,
      }
    );
  });

  it('determines hasNextPage correctly', async () => {
    // Test with nextCursor present
    const pageWithNext = {
      notifications: [{ _id: 'notif1', type: 'follow', title: 'Test' }],
      nextCursor: 'cursor1',
    };

    mockConvex.query.mockResolvedValue(pageWithNext);

    const { result: resultWithNext } = renderHook(() => useNotifications(), {
      wrapper,
    });

    await waitFor(() => {
      expect(resultWithNext.current.hasNextPage).toBe(true);
    });

    // Test with no nextCursor
    const pageWithoutNext = {
      notifications: [{ _id: 'notif1', type: 'follow', title: 'Test' }],
      nextCursor: null,
    };

    mockConvex.query.mockResolvedValue(pageWithoutNext);

    const { result: resultWithoutNext } = renderHook(() => useNotifications(), {
      wrapper,
    });

    await waitFor(() => {
      expect(resultWithoutNext.current.hasNextPage).toBe(false);
    });
  });

  it('uses correct query key for caching', () => {
    renderHook(() => useNotifications('follow'), { wrapper });

    // Verify the query key is constructed correctly
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    expect(queries).toHaveLength(1);
    expect(queries[0].queryKey).toEqual(['notifications', 'follow']);
  });

  it('uses different query keys for different filters', () => {
    const { unmount: unmount1 } = renderHook(() => useNotifications('follow'), {
      wrapper,
    });
    const { unmount: unmount2 } = renderHook(() => useNotifications('rating'), {
      wrapper,
    });

    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    expect(queries).toHaveLength(2);

    const queryKeys = queries.map((q) => q.queryKey);
    expect(queryKeys).toContainEqual(['notifications', 'follow']);
    expect(queryKeys).toContainEqual(['notifications', 'rating']);

    unmount1();
    unmount2();
  });

  it('handles query errors gracefully', async () => {
    const error = new Error('Failed to fetch notifications');
    mockConvex.query.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('handles loading states correctly', async () => {
    let resolveQuery: (value: any) => void;
    const queryPromise = new Promise((resolve) => {
      resolveQuery = resolve;
    });

    mockConvex.query.mockReturnValue(queryPromise);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Resolve the query
    const mockData = {
      notifications: [{ _id: 'notif1', type: 'follow', title: 'Test' }],
      nextCursor: null,
    };
    resolveQuery!(mockData);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.pages[0]).toEqual(mockData);
  });

  it('handles empty notification responses', async () => {
    const emptyResponse = {
      notifications: [],
      nextCursor: null,
    };

    mockConvex.query.mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.pages[0]).toEqual(emptyResponse);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('maintains query state across filter changes', async () => {
    const followNotifications = {
      notifications: [{ _id: 'notif1', type: 'follow', title: 'Follow' }],
      nextCursor: null,
    };

    const ratingNotifications = {
      notifications: [{ _id: 'notif2', type: 'rating', title: 'Rating' }],
      nextCursor: null,
    };

    mockConvex.query
      .mockResolvedValueOnce(followNotifications)
      .mockResolvedValueOnce(ratingNotifications);

    // Start with follow filter
    const { result, rerender } = renderHook(
      ({ filter }: { filter: any }) => useNotifications(filter),
      {
        wrapper,
        initialProps: { filter: 'follow' },
      }
    );

    await waitFor(() => {
      expect(result.current.data?.pages[0]).toEqual(followNotifications);
    });

    // Change to rating filter
    rerender({ filter: 'rating' });

    await waitFor(() => {
      expect(result.current.data?.pages[0]).toEqual(ratingNotifications);
    });

    // Verify separate queries were made
    expect(mockConvex.query).toHaveBeenCalledTimes(2);
    expect(mockConvex.query).toHaveBeenNthCalledWith(
      1,
      'notifications:getNotifications',
      {
        limit: 20,
        cursor: undefined,
        type: 'follow',
      }
    );
    expect(mockConvex.query).toHaveBeenNthCalledWith(
      2,
      'notifications:getNotifications',
      {
        limit: 20,
        cursor: undefined,
        type: 'rating',
      }
    );
  });

  it('handles concurrent fetchNextPage calls', async () => {
    const page1 = {
      notifications: [{ _id: 'notif1', type: 'follow', title: 'Page 1' }],
      nextCursor: 'cursor1',
    };

    const page2 = {
      notifications: [{ _id: 'notif2', type: 'rating', title: 'Page 2' }],
      nextCursor: null,
    };

    mockConvex.query.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(1);
    });

    // Clear the call count before testing concurrent calls
    const initialCallCount = mockConvex.query.mock.calls.length;

    // Make concurrent fetchNextPage calls
    result.current.fetchNextPage();
    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    // Should make exactly 2 additional queries (React Query may dedupe or make 2 calls)
    const finalCallCount = mockConvex.query.mock.calls.length;
    expect(finalCallCount - initialCallCount).toBeLessThanOrEqual(2);
  });
});
