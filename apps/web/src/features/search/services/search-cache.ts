import { queryOptions } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import type { SearchFilters } from '@vibechecc/types';

// Cache time constants (in milliseconds)
const CACHE_TIME = 15 * 60 * 1000; // 15 minutes
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const searchCacheOptions = {
  // Main search query options
  searchAll: (query: string, filters?: SearchFilters, limit = 20, cursor?: string) =>
    queryOptions({
      ...convexQuery(api.search.searchAll, {
        query,
        filters,
        limit,
        cursor,
      }),
      gcTime: CACHE_TIME,
      staleTime: STALE_TIME,
    }),

  // Search suggestions query options
  suggestions: (query: string, limit = 10) =>
    queryOptions({
      ...convexQuery(api.search.getSearchSuggestions, {
        query,
        limit,
      }),
      gcTime: CACHE_TIME,
      staleTime: STALE_TIME,
    }),

  // Trending searches query options
  trending: (limit = 10) =>
    queryOptions({
      ...convexQuery(api.search.getTrendingSearches, {
        limit,
      }),
      gcTime: CACHE_TIME,
      staleTime: STALE_TIME * 2, // Trending changes less frequently
    }),
};

// Prefetch functions for better perceived performance
export const searchPrefetch = {
  // Prefetch search results
  async prefetchSearch(
    queryClient: any,
    query: string,
    filters?: SearchFilters
  ) {
    return queryClient.prefetchQuery(
      searchCacheOptions.searchAll(query, filters)
    );
  },

  // Prefetch suggestions
  async prefetchSuggestions(queryClient: any, query: string) {
    return queryClient.prefetchQuery(
      searchCacheOptions.suggestions(query)
    );
  },

  // Prefetch trending searches
  async prefetchTrending(queryClient: any) {
    return queryClient.prefetchQuery(
      searchCacheOptions.trending()
    );
  },
};

// Cache invalidation helpers
export const searchCacheInvalidation = {
  // Invalidate all search-related caches
  invalidateAll(queryClient: any) {
    queryClient.invalidateQueries({ queryKey: ['search'] });
  },

  // Invalidate specific search query
  invalidateSearch(queryClient: any, query: string) {
    queryClient.invalidateQueries({
      queryKey: ['search', 'searchAll', { query }],
    });
  },

  // Invalidate trending searches
  invalidateTrending(queryClient: any) {
    queryClient.invalidateQueries({
      queryKey: ['search', 'getTrendingSearches'],
    });
  },
};