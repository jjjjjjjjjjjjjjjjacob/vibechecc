import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import type { SearchRequest, SearchFilters } from '@viberater/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEffect } from 'react';
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
    !VALID_CONVEX_SORT_OPTIONS.includes(convexFilters.sort as any)
  ) {
    delete convexFilters.sort;
  }

  return convexFilters as typeof filters;
}

interface UseSearchResultsParams {
  query: string;
  filters?: SearchRequest['filters'];
  limit?: number;
  page?: number;
  cursor?: string;
  includeTypes?: string[];
}

export function useSearchResults({
  query,
  filters,
  limit = 20,
  page = 1,
  cursor,
  includeTypes,
}: UseSearchResultsParams) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const { user } = useUser();

  // Use Convex query for search
  const searchQuery = useQuery({
    ...convexQuery(api.search.searchAll, {
      query: debouncedQuery,
      filters: filterForConvex(filters),
      limit,
      page,
      cursor,
      includeTypes,
    }),
    enabled: true, // Always enabled, backend handles empty queries
  });

  // Track search mutation
  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  // Track search when debounced query changes (only for non-empty queries and authenticated users)
  useEffect(() => {
    if (debouncedQuery.trim() && searchQuery.data && user?.id) {
      trackSearchMutation.mutate({
        query: debouncedQuery,
        resultCount: searchQuery.data.totalCount || 0,
      });
    }
  }, [debouncedQuery, searchQuery.data, user?.id, trackSearchMutation]);

  return {
    data: searchQuery.data,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    isSuccess: searchQuery.isSuccess,
  };
}
