import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import type { SearchRequest, SearchResponse } from '@vibechecc/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEffect } from 'react';

interface UseSearchResultsParams {
  query: string;
  filters?: SearchRequest['filters'];
  limit?: number;
  cursor?: string;
}

export function useSearchResults({ query, filters, limit = 20, cursor }: UseSearchResultsParams) {
  const debouncedQuery = useDebouncedValue(query, 300);
  
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

  // Track search when debounced query changes (only for non-empty queries)
  useEffect(() => {
    if (debouncedQuery.trim() && searchQuery.data) {
      trackSearchMutation.mutate({ 
        query: debouncedQuery,
        resultCount: searchQuery.data.totalCount || 0,
      });
    }
  }, [debouncedQuery, searchQuery.data]);

  return {
    data: searchQuery.data,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    isSuccess: searchQuery.isSuccess,
  };
}