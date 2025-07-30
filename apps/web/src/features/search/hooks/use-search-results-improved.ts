import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import type { SearchRequest, SearchFilters } from '@viberater/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEffect, useRef } from 'react';
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
  includeTypes?: string[];
}

export function useSearchResultsImproved({
  query,
  filters,
  limit = 20,
  page = 1,
  includeTypes,
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
    enabled: true, // Always enabled, backend handles empty queries
    // Keep previous data while loading next page
    placeholderData: (previousData) => previousData,
  });

  // Track search mutation for automatic search history logging
  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  // Track search when debounced query changes (for search history)
  useEffect(() => {
    console.log('useSearchResultsImproved useEffect triggered:', { 
      debouncedQuery, 
      userId: user?.id, 
      previousQuery: previousQuery.current 
    });
    
    // Only track when we have a non-empty query, user is authenticated, and query actually changed
    if (debouncedQuery.trim() && user?.id && debouncedQuery !== previousQuery.current) {
      console.log('Tracking search in useSearchResultsImproved:', debouncedQuery);
      previousQuery.current = debouncedQuery;
      // Track immediately when query changes for search history
      trackSearchMutation.mutate({
        query: debouncedQuery,
        resultCount: 0, // We don't know the count yet
      }, {
        onSuccess: (data) => {
          console.log('useSearchResultsImproved trackSearch success:', data);
        },
        onError: (error) => {
          console.error('useSearchResultsImproved trackSearch error:', error);
        }
      });
    } else {
      console.log('Skipping search tracking:', { 
        hasQuery: !!debouncedQuery.trim(), 
        hasUser: !!user?.id, 
        queryChanged: debouncedQuery !== previousQuery.current 
      });
    }
  }, [debouncedQuery, user?.id]); // Track on debounced query changes (excluding trackSearchMutation to avoid infinite loops)

  // Update search history with actual result count when we have results
  useEffect(() => {
    console.log('Result count useEffect triggered:', {
      hasData: !!searchQuery.data,
      debouncedQuery,
      userId: user?.id,
      data: searchQuery.data
    });
    
    if (searchQuery.data && debouncedQuery.trim() && user?.id) {
      // Log the data structure to understand what we're working with
      console.log('Full search data structure:', {
        vibes: searchQuery.data.vibes?.length,
        users: searchQuery.data.users?.length,
        tags: searchQuery.data.tags?.length,
        actions: searchQuery.data.actions?.length,
        reviews: searchQuery.data.reviews?.length,
        totalCount: searchQuery.data.totalCount,
        fullData: searchQuery.data
      });
      
      // Try different ways to get the count
      let totalCount = 0;
      
      // First try using the totalCount field if it exists
      if (searchQuery.data.totalCount !== undefined) {
        totalCount = searchQuery.data.totalCount;
        console.log('Using totalCount from data:', totalCount);
      } else {
        // Fallback to manual calculation
        totalCount = (searchQuery.data.vibes?.length || 0) + 
                    (searchQuery.data.users?.length || 0) + 
                    (searchQuery.data.tags?.length || 0) + 
                    (searchQuery.data.actions?.length || 0) + 
                    (searchQuery.data.reviews?.length || 0);
        console.log('Calculated totalCount manually:', totalCount);
      }
      
      console.log('Updating search with result count:', { 
        query: debouncedQuery, 
        totalCount,
        willUpdate: totalCount > 0
      });
      
      // Always update with the actual result count (even if 0)
      trackSearchMutation.mutate({
        query: debouncedQuery,
        resultCount: totalCount,
      }, {
        onSuccess: (data) => {
          console.log('Result count update success:', data);
        },
        onError: (error) => {
          console.error('Result count update error:', error);
        }
      });
    } else {
      console.log('Skipping result count update:', {
        hasData: !!searchQuery.data,
        hasQuery: !!debouncedQuery.trim(),
        hasUser: !!user?.id
      });
    }
  }, [searchQuery.data, debouncedQuery, user?.id]); // Update when we get actual results

  return {
    data: searchQuery.data,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    isSuccess: searchQuery.isSuccess,
  };
}