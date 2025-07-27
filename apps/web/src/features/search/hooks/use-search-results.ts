import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import type { SearchRequest } from '@viberater/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEffect } from 'react';
import { useUser } from '@clerk/tanstack-react-start';

interface UseSearchResultsParams {
  query: string;
  filters?: SearchRequest['filters'];
  limit?: number;
  cursor?: string;
}

export function useSearchResults({
  query,
  filters,
  limit = 20,
  cursor,
}: UseSearchResultsParams) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const { user } = useUser();

  // Use Convex query for search
  const searchQuery = useQuery({
    ...convexQuery(api.search.searchAll, {
      query: debouncedQuery,
      filters,
      limit,
      cursor,
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
