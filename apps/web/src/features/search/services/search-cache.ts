import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import type { SearchFilters } from '@viberatr/types';

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

// Cache time constants (in milliseconds)
const CACHE_TIME = 15 * 60 * 1000; // 15 minutes
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const searchCacheOptions = {
  // Main search query options
  searchAll: (
    query: string,
    filters?: SearchFilters,
    limit = 20,
    cursor?: string
  ) =>
    queryOptions({
      ...convexQuery(api.search.searchAll, {
        query,
        filters: filterForConvex(filters),
        paginationOpts: {
          numItems: limit,
          cursor: cursor || null,
        },
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
    queryClient: QueryClient,
    query: string,
    filters?: SearchFilters
  ) {
    return queryClient.prefetchQuery(
      searchCacheOptions.searchAll(query, filters)
    );
  },

  // Prefetch suggestions
  async prefetchSuggestions(queryClient: QueryClient, query: string) {
    return queryClient.prefetchQuery(searchCacheOptions.suggestions(query));
  },

  // Prefetch trending searches
  async prefetchTrending(queryClient: QueryClient) {
    return queryClient.prefetchQuery(searchCacheOptions.trending());
  },
};

// Cache invalidation helpers
export const searchCacheInvalidation = {
  // Invalidate all search-related caches
  invalidateAll(queryClient: QueryClient) {
    queryClient.invalidateQueries({ queryKey: ['search'] });
  },

  // Invalidate specific search query
  invalidateSearch(queryClient: QueryClient, query: string) {
    queryClient.invalidateQueries({
      queryKey: ['search', 'searchAll', { query }],
    });
  },

  // Invalidate trending searches
  invalidateTrending(queryClient: QueryClient) {
    queryClient.invalidateQueries({
      queryKey: ['search', 'getTrendingSearches'],
    });
  },
};
