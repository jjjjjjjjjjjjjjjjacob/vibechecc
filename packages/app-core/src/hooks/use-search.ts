import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import type { SearchFilters } from '@vibechecc/types';
import { useDebouncedValue } from '../utils/use-debounced-value';

// Valid sort options for Convex search
const VALID_CONVEX_SORT_OPTIONS = [
  'relevance',
  'rating_desc',
  'rating_asc',
  'recent',
  'oldest',
  'name',
  'top_rated',
  'most_rated',
  'creation_date',
  'interaction_time',
] as const;

// Helper to filter SearchFilters to only include Convex-compatible options
function filterForConvex(filters?: SearchFilters): typeof filters {
  if (!filters) return filters;

  const convexFilters = { ...filters };

  // Filter out unsupported sort options
  if (
    convexFilters.sort &&
    !VALID_CONVEX_SORT_OPTIONS.includes(convexFilters.sort)
  ) {
    convexFilters.sort = 'relevance';
  }

  return convexFilters as typeof filters;
}

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
  filters?: SearchFilters;
  cursor?: string;
  userId?: string; // For mobile user context
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 150, limit = 20, filters, cursor, userId } = options;
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const previousQuery = useRef<string>('');

  // Use Convex query for search with pagination
  const searchQuery = useQuery({
    ...convexQuery(api.search.searchAll, {
      query: debouncedQuery,
      filters: filterForConvex(filters),
      paginationOpts: {
        numItems: limit,
        cursor: cursor || null,
      },
    }),
    enabled: debouncedQuery.trim().length > 0,
  });

  // Track search mutation for automatic search history logging
  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  // Track search when debounced query changes (for search history)
  useEffect(() => {
    if (
      debouncedQuery.trim() &&
      userId &&
      debouncedQuery !== previousQuery.current
    ) {
      previousQuery.current = debouncedQuery;
      trackSearchMutation.mutate(
        {
          query: debouncedQuery,
          resultCount: 0, // We don't need to wait for results
        },
        {}
      );
    }
  }, [debouncedQuery, userId, trackSearchMutation]);

  // Update search history with actual result count when we have results
  useEffect(() => {
    if (searchQuery.data && debouncedQuery.trim() && userId) {
      const totalCount =
        (searchQuery.data.vibes?.length || 0) +
        (searchQuery.data.users?.length || 0) +
        (searchQuery.data.tags?.length || 0) +
        (searchQuery.data.actions?.length || 0) +
        (searchQuery.data.reviews?.length || 0);

      // Track again with the actual result count
      trackSearchMutation.mutate(
        {
          query: debouncedQuery,
          resultCount: totalCount,
        },
        {}
      );
    }
  }, [searchQuery.data, debouncedQuery, userId, trackSearchMutation]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    results: searchQuery.data ?? null,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    search,
    clearSearch,
  };
}

export function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebouncedValue(query, 150); // Faster debounce for suggestions

  // Use Convex query for suggestions
  const { data, isLoading, isError, error } = useQuery({
    ...convexQuery(api.search.getSearchSuggestions, {
      query: debouncedQuery,
    }),
    enabled: true, // Always enabled to get suggestions even when query is empty
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
    error,
  };
}

// Hook for recent searches
export function useRecentSearches(userId?: string) {
  return useQuery({
    ...convexQuery(api.search.getRecentSearches, {}),
    enabled: !!userId,
  });
}

// Hook for trending searches
export function useTrendingSearches() {
  return useQuery({
    ...convexQuery(api.search.getTrendingSearches, {}),
  });
}

// Hook for search tracking
export function useSearchTracking() {
  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  const trackSearch = useCallback(
    (query: string, resultCount: number = 0) => {
      trackSearchMutation.mutate({
        query,
        resultCount,
      });
    },
    [trackSearchMutation]
  );

  return {
    trackSearch,
    isTracking: trackSearchMutation.isPending,
    error: trackSearchMutation.error,
  };
}