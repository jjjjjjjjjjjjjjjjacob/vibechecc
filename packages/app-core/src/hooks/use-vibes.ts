import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
  useConvexAction,
} from '@convex-dev/react-query';
import { useConvex } from 'convex/react';
import { api } from '@vibechecc/convex';
import type { SearchFilters } from '@vibechecc/types';

// Query to get all vibes (simple version for performance)
export function useVibes() {
  return useQuery({
    ...convexQuery(api.vibes.getAllSimple, {}),
  });
}

// Query to get paginated vibes with full details
export function useVibesPaginated(
  limit?: number,
  options?: { enabled?: boolean; cursor?: string }
) {
  return useQuery({
    ...convexQuery(api.vibes.getAll, {
      limit,
      cursor: options?.cursor,
    }),
    enabled: options?.enabled !== false,
  });
}

// Query to get filtered vibes with pagination
export function useFilteredVibesPaginated(
  limit?: number,
  options?: {
    enabled?: boolean;
    cursor?: string;
    filters?: {
      emojis?: string[];
      minRating?: number;
      maxRating?: number;
      tags?: string[];
      sort?:
        | 'recent'
        | 'rating_desc'
        | 'rating_asc'
        | 'top_rated'
        | 'most_rated'
        | 'name'
        | 'creation_date';
    };
  }
) {
  return useQuery({
    ...convexQuery(api.vibes.getFilteredVibes, {
      limit,
      cursor: options?.cursor,
      filters: options?.filters,
    }),
    enabled: options?.enabled !== false,
  });
}

// Query to get a vibe by ID
export function useVibe(id: string) {
  return useQuery({
    ...convexQuery(api.vibes.getById, { id }),
    enabled: !!id,
  });
}

// Query to get vibes by user
export function useUserVibes(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getByUser, { userId }),
    enabled: !!userId,
  });
}

// Query to get vibes a user has reacted to
export function useUserReactedVibes(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getUserRatedVibes, { userId }),
    enabled: !!userId,
  });
}

// Query to get vibes by tag
export function useVibesByTag(tag: string, limit?: number) {
  return useQuery({
    ...convexQuery(api.vibes.getByTag, { tag, limit }),
    enabled: !!tag,
  });
}

// Query to get all available tags
export function useAllTags() {
  return useQuery({
    ...convexQuery(api.vibes.getAllTags, {}),
  });
}

// Query to get user interests derived from their vibe interactions
export function useUserDerivedInterests(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getUserDerivedInterests, { userId }),
    enabled: !!userId,
  });
}

// Query to get top-rated vibes
export function useTopRatedVibes(
  limit?: number,
  options?: { enabled?: boolean; cursor?: string }
) {
  return useQuery({
    ...convexQuery(api.vibes.getTopRated, {
      limit,
      cursor: options?.cursor,
    }),
    enabled: options?.enabled !== false,
  });
}

// Query to get personalized vibes for a user (based on their interactions)
export function usePersonalizedVibes(
  userId?: string,
  options?: { enabled?: boolean; cursor?: string; limit?: number }
) {
  return useQuery({
    // For now, fall back to top-rated vibes - this will be enhanced with a proper recommendation algorithm
    ...convexQuery(api.vibes.getTopRated, {
      limit: options?.limit || 20,
      cursor: options?.cursor,
    }),
    enabled: options?.enabled !== false && !!userId,
  });
}

// Query to get personalized "for you" feed (vibes from followed users)
export function useForYouFeed(options?: {
  enabled?: boolean;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    ...convexQuery(api.vibes.getForYouFeed, {
      limit: options?.limit || 20,
      cursor: options?.cursor,
    }),
    enabled: options?.enabled !== false,
  });
}

// Infinite query for "for you" feed with pagination
export function useForYouFeedInfinite(options?: {
  enabled?: boolean;
  queryKeyPrefix?: string[];
  limit?: number;
}) {
  const {
    enabled = true,
    queryKeyPrefix = ['for-you-feed'],
    limit = 20,
  } = options || {};
  const convex = useConvex();

  return useInfiniteQuery({
    queryKey: [...queryKeyPrefix, 'infinite', 'getForYouFeed'],
    queryFn: async ({ pageParam }) => {
      return await convex.query(api.vibes.getForYouFeed, {
        limit,
        cursor: pageParam || undefined,
      });
    },
    getNextPageParam: (lastPage) => lastPage?.continueCursor || undefined,
    enabled,
    initialPageParam: null as string | null,
  });
}

// Query to get vibes from followed users with filtering
export function useFollowingVibes(
  filters?: {
    minRating?: number;
    maxRating?: number;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    sort?: 'recent' | 'rating_desc' | 'rating_asc' | 'top_rated' | 'most_rated';
    limit?: number;
    cursor?: string;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    ...convexQuery(api.vibes.getFollowingVibes, {
      limit: filters?.limit || 20,
      cursor: filters?.cursor,
      filters: filters
        ? {
            minRating: filters.minRating,
            maxRating: filters.maxRating,
            tags: filters.tags,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            sort: filters.sort,
          }
        : undefined,
    }),
    enabled: options?.enabled !== false,
  });
}

// Infinite query for following vibes with filtering
export function useFollowingVibesInfinite(
  filters?: {
    minRating?: number;
    maxRating?: number;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    sort?: 'recent' | 'rating_desc' | 'rating_asc' | 'top_rated' | 'most_rated';
    limit?: number;
  },
  options?: {
    enabled?: boolean;
    queryKeyPrefix?: string[];
  }
) {
  const { enabled = true, queryKeyPrefix = ['following-vibes'] } =
    options || {};
  const { limit = 20, ...filterOptions } = filters || {};
  const convex = useConvex();

  const filterKey = JSON.stringify(filterOptions || {});

  return useInfiniteQuery({
    queryKey: [...queryKeyPrefix, 'infinite', 'getFollowingVibes', filterKey],
    queryFn: async ({ pageParam }) => {
      return await convex.query(api.vibes.getFollowingVibes, {
        limit,
        cursor: pageParam || undefined,
        filters: filterOptions,
      });
    },
    getNextPageParam: (lastPage) => lastPage?.continueCursor || undefined,
    enabled,
    initialPageParam: null as string | null,
  });
}

// Query to get top-rated vibes by emoji
export function useTopRatedEmojiVibes(
  emoji: string,
  minValue: number,
  limit?: number
) {
  return useQuery({
    ...convexQuery(api.vibes.getTopRatedByEmoji, { emoji, minValue, limit }),
    enabled: !!emoji,
  });
}

// Enhanced trending algorithm with engagement scoring
export function useTrendingWithEngagement(options?: {
  limit?: number;
  cursor?: string;
  timeWindowHours?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    ...convexQuery(api.vibes.getTrendingWithEngagement, queryOptions),
    enabled,
  });
}

// Query to get personalized recommendations based on user behavior
export function usePersonalizedRecommendations(options?: {
  userId?: string;
  limit?: number;
  cursor?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    ...convexQuery(api.vibes.getPersonalizedRecommendations, queryOptions),
    enabled,
  });
}

// Generalized infinite query for vibes using getFilteredVibes
export function useVibesInfinite(
  filters?: {
    emojis?: string[];
    minRating?: number;
    maxRating?: number;
    tags?: string[];
    sort?:
      | 'recent'
      | 'rating_desc'
      | 'rating_asc'
      | 'top_rated'
      | 'most_rated'
      | 'name'
      | 'creation_date';
    minRatingCount?: number;
    maxRatingCount?: number;
    followingOnly?: boolean;
    limit?: number;
  },
  options?: {
    enabled?: boolean;
    queryKeyPrefix?: string[];
    select?: (data: unknown) => unknown;
    queryKeyName?: string; // Override for the query key identifier
  }
) {
  const {
    enabled = true,
    queryKeyPrefix = ['vibes'],
    select,
    queryKeyName,
  } = options || {};
  const { limit = 20, ...filterOptions } = filters || {};
  const convex = useConvex();

  // Generate a query key based on filters or use provided queryKeyName
  const filterKey = queryKeyName || JSON.stringify(filterOptions || {});

  return useInfiniteQuery({
    queryKey: [...queryKeyPrefix, 'infinite', 'getFilteredVibes', filterKey],
    queryFn: async ({ pageParam }) => {
      return await convex.query(api.vibes.getFilteredVibes, {
        limit,
        cursor: pageParam || undefined,
        filters: filterOptions,
      });
    },
    getNextPageParam: (lastPage) => lastPage?.continueCursor || undefined,
    enabled,
    initialPageParam: null as string | null,
    select,
  });
}

// Generalized paginated query for vibes using getFilteredVibes
export function useVibesPaginatedGeneric(
  filters?: {
    emojis?: string[];
    minRating?: number;
    maxRating?: number;
    tags?: string[];
    sort?:
      | 'recent'
      | 'rating_desc'
      | 'rating_asc'
      | 'top_rated'
      | 'most_rated'
      | 'name'
      | 'creation_date';
    minRatingCount?: number;
    maxRatingCount?: number;
    followingOnly?: boolean;
    limit?: number;
    cursor?: string;
  },
  options?: {
    enabled?: boolean;
    queryKeyPrefix?: string[];
    queryKeyName?: string; // Override for the query key identifier
  }
) {
  const { enabled = true } = options || {};
  const { limit, cursor, ...filterOptions } = filters || {};

  return useQuery({
    ...convexQuery(api.vibes.getFilteredVibes, {
      limit,
      cursor,
      filters: filterOptions,
    }),
    enabled,
  });
}

// Mutation to create a vibe
export function useCreateVibeMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.vibes.create);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      // Targeted invalidation - only invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getAllSimple],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getAll],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getFilteredVibes],
      });
    },
  });
}

// Mutation to update a vibe
export function useUpdateVibeMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.vibes.updateVibe);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: (updatedVibe, variables) => {
      // Targeted invalidation - only invalidate the specific vibe and lists
      if (variables?.vibeId) {
        queryClient.invalidateQueries({
          queryKey: [
            'convexQuery',
            api.vibes.getById,
            { id: variables.vibeId },
          ],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getAllSimple],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getAll],
      });
    },
  });
}

// Mutation to delete a vibe (soft delete)
export function useDeleteVibeMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.vibes.deleteVibe);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: (_result, variables) => {
      // Targeted invalidation - remove from lists but keep cached if accessed directly
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getAllSimple],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getAll],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.vibes.getFilteredVibes],
      });
      if (variables?.vibeId) {
        queryClient.invalidateQueries({
          queryKey: [
            'convexQuery',
            api.vibes.getById,
            { id: variables.vibeId },
          ],
        });
      }
    },
  });
}

// Mutation for quick react to a vibe
export function useQuickReactMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.vibes.quickReact);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
      queryClient.invalidateQueries({ queryKey: ['emojiRatings'] });
    },
  });
}