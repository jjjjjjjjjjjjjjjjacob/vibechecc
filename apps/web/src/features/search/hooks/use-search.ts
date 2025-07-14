import { useState, useCallback, useTransition } from 'react';
import type { SearchResponse } from '@vibechecc/types';
import { getMockSearchResults, getMockSearchSuggestions } from '../utils/search-mock-data';

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, startTransition] = useTransition();

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    startTransition(() => {
      // TODO: Replace with actual API call when backend is ready
      const mockResults = getMockSearchResults(searchQuery);
      setResults(mockResults);
    });
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
  }, []);

  return {
    query,
    results,
    isLoading,
    search,
    clearSearch,
  };
}

export function useSearchSuggestions(query: string) {
  const [isLoading, startTransition] = useTransition();
  const [data, setData] = useState<ReturnType<typeof getMockSearchSuggestions> | null>(null);

  const fetchSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setData(null);
      return;
    }

    startTransition(() => {
      // TODO: Replace with actual API call when backend is ready
      const suggestions = getMockSearchSuggestions(searchQuery);
      setData(suggestions);
    });
  }, []);

  // Fetch suggestions when query changes
  if (query !== (data ? query : '')) {
    fetchSuggestions(query);
  }

  return {
    data,
    isLoading,
  };
}