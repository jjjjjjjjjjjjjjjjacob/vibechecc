import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface UseInstantSearchOptions {
  debounceMs?: number;
  limit?: number;
  enabled?: boolean;
}

export function useInstantSearch(options: UseInstantSearchOptions = {}) {
  const { debounceMs = 150, limit = 10, enabled = true } = options;
  const [query, setQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const previewRef = useRef<HTMLDivElement>(null);

  // Use search suggestions for instant preview
  const { data, isLoading } = useQuery({
    ...convexQuery(api.search.getSearchSuggestions, {
      query: debouncedQuery,
      limit,
    }),
    enabled: enabled && debouncedQuery.trim().length > 0,
  });

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setIsVisible(newQuery.trim().length > 0);
  }, []);

  const hidePreview = useCallback(() => {
    setIsVisible(false);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setIsVisible(false);
  }, []);

  // Prefetch full search results when hovering over a result
  const prefetchResult = useCallback((resultQuery: string) => {
    // This will cache the results for when the user navigates
    return convexQuery(api.search.searchAll, {
      query: resultQuery,
      limit: 20,
    });
  }, []);

  return {
    query,
    debouncedQuery,
    isVisible,
    results: data,
    isLoading,
    previewRef,
    handleQueryChange,
    hidePreview,
    clearSearch,
    prefetchResult,
  };
}
