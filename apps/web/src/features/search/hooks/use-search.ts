import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import type { SearchFilters } from '@viberater/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUser } from '@clerk/tanstack-react-start';

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
  filters?: SearchFilters;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 150, limit = 20, filters } = options;
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const { user } = useUser();

  // Use Convex query for search
  const searchQuery = useQuery({
    ...convexQuery(api.search.searchAll, {
      query: debouncedQuery,
      filters,
      limit,
    }),
    enabled: debouncedQuery.trim().length > 0,
  });

  // Track search mutation
  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  // Track search when debounced query changes (only for authenticated users)
  useEffect(() => {
    if (debouncedQuery.trim() && searchQuery.data && user?.id) {
      trackSearchMutation.mutate({
        query: debouncedQuery,
        resultCount: searchQuery.data.totalCount || 0,
      });
    }
  }, [debouncedQuery, searchQuery.data, user?.id, trackSearchMutation]);

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
