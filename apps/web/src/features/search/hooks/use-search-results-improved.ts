import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import type { SearchRequest, SearchFilters } from '@vibechecc/types';
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
  skipTracking = false, // New parameter to skip tracking for secondary queries
}: UseSearchResultsParams & { skipTracking?: boolean }) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const { user } = useUser();
  const previousQuery = useRef<string>('');
  const hasTrackedRef = useRef<Set<string>>(new Set());

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

  // Stable callback for tracking searches with deduplication
  const trackSearch = useCallback(
    (query: string, resultCount: number) => {
      // Prevent duplicate tracking within 1 second
      if (hasTrackedRef.current.has(query)) {
        return;
      }

      hasTrackedRef.current.add(query);
      // Clear the tracking key after 1 second
      setTimeout(() => {
        hasTrackedRef.current.delete(query);
      }, 1000);

      trackSearchMutation.mutate({ query, resultCount }, {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Track search only once when query changes and we get results
  useEffect(() => {
    // Skip tracking if disabled or for secondary queries
    if (skipTracking) return;

    // Only track when we have a non-empty query, user is authenticated, query changed, and we have data
    if (
      debouncedQuery.trim() &&
      user?.id &&
      debouncedQuery !== previousQuery.current &&
      searchQuery.data
    ) {
      previousQuery.current = debouncedQuery;

      // Calculate total count from results
      let totalCount = 0;
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

      // Track once with the actual result count
      trackSearch(debouncedQuery, totalCount);
    }
  }, [debouncedQuery, user?.id, searchQuery.data, skipTracking, trackSearch]); // Single effect for tracking

  return {
    data: searchQuery.data,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    isSuccess: searchQuery.isSuccess,
  };
}
