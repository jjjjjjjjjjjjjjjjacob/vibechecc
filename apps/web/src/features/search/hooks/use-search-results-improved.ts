import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import type { SearchRequest, SearchFilters } from '@viberater/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/tanstack-react-start';

// Valid sort options for Convex search
const VALID_CONVEX_SORT_OPTIONS = [
  'relevance',
  'rating_desc',
  'rating_asc',
  'top_rated',
  'most_rated',
  'recent',
  'oldest',
  'name',
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

interface UseSearchResultsParams {
  query: string;
  filters?: SearchRequest['filters'];
  limit?: number;
  page?: number;
  includeTypes?: string[];
  enabled?: boolean;
}

export function useSearchResultsImproved({
  query,
  filters,
  limit = 20,
  page = 1,
  includeTypes,
  enabled = true,
}: UseSearchResultsParams) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const { user } = useUser();
  const previousQuery = useRef<string>('');

  // Use the optimized search API with proper pagination
  const searchQuery = useQuery({
    ...convexQuery(api.searchOptimized.searchAllOptimized, {
      query: debouncedQuery,
      filters: filterForConvex(filters),
      page,
      pageSize: limit,
      includeTypes,
    }),
    enabled: enabled, // Configurable enabled state
    // Keep previous data while loading next page
    placeholderData: (previousData) => previousData,
  });

  // Track search mutation for automatic search history logging
  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  // Stable callback for tracking searches
  const trackSearch = useCallback(
    (query: string, resultCount: number) => {
      trackSearchMutation.mutate({ query, resultCount }, {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Track search when debounced query changes (for search history)
  useEffect(() => {
    // Only track when we have a non-empty query, user is authenticated, and query actually changed
    if (
      debouncedQuery.trim() &&
      user?.id &&
      debouncedQuery !== previousQuery.current
    ) {
      previousQuery.current = debouncedQuery;
      // Track immediately when query changes for search history
      trackSearch(debouncedQuery, 0); // We don't know the count yet
    }
  }, [debouncedQuery, user?.id, trackSearch]); // Track on debounced query changes

  // Update search history with actual result count when we have results
  useEffect(() => {
    if (searchQuery.data && debouncedQuery.trim() && user?.id) {
      // Try different ways to get the count
      let totalCount = 0;

      // First try using the totalCount field if it exists
      if (searchQuery.data.totalCount !== undefined) {
        totalCount = searchQuery.data.totalCount;
      } else {
        // Fallback to manual calculation
        totalCount =
          (searchQuery.data.vibes?.length || 0) +
          (searchQuery.data.users?.length || 0) +
          (searchQuery.data.tags?.length || 0) +
          (searchQuery.data.actions?.length || 0) +
          (searchQuery.data.reviews?.length || 0);
      }

      // Always update with the actual result count (even if 0)
      trackSearch(debouncedQuery, totalCount);
    }
  }, [searchQuery.data, debouncedQuery, user?.id, trackSearch]); // Update when we get actual results

  return {
    data: searchQuery.data,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    isSuccess: searchQuery.isSuccess,
  };
}
