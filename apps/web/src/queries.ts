import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
  useConvexAction,
} from '@convex-dev/react-query';
import { useConvex } from 'convex/react';
import type { FunctionReference, FunctionArgs } from 'convex/server';
import { api } from '@viberatr/convex';
// import { useAuth } from '@clerk/tanstack-react-start';

// CONVEX INFINITE QUERY HELPER

const _convexInfiniteQuery = <
  ConvexQueryReference extends FunctionReference<'query'>,
  Args extends FunctionArgs<ConvexQueryReference>,
>(
  funcRef: ConvexQueryReference,
  queryArgs: Args
) => {
  return {
    queryKey: ['convexQuery', JSON.stringify(funcRef), queryArgs],
    staleTime: Infinity,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: { continueCursor?: string }) =>
      lastPage?.continueCursor || undefined,
  };
};

// viberatr QUERIES

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

// Query to get ratings given by a user
export function useUserRatings(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getUserRatings, { userId }),
    enabled: !!userId,
  });
}

// Query to get ratings received by a user on their vibes
export function useUserReceivedRatings(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getUserReceivedRatings, { userId }),
    enabled: !!userId,
  });
}

// Mutation to create a vibe
export function useCreateVibeMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.vibes.create);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: (_newVibe) => {
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
      // Don't invalidate individual vibe queries as they're not affected
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

// Mutation to add a rating
export function useAddRatingMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.vibes.addRating);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: (_result, variables) => {
      // Only invalidate the specific vibe that was rated
      if (variables?.vibeId) {
        queryClient.invalidateQueries({
          queryKey: [
            'convexQuery',
            api.vibes.getById,
            { id: variables.vibeId },
          ],
        });
        // Also invalidate filtered queries that might be affected by rating changes
        queryClient.invalidateQueries({
          queryKey: ['convexQuery', api.vibes.getFilteredVibes],
        });
      }
    },
  });
}

// Mutation to create/update emoji rating
export function useCreateEmojiRatingMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(
    api.emojiRatings.createOrUpdateEmojiRating
  );

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: (_result, variables) => {
      // Targeted invalidation for emoji ratings
      if (variables?.vibeId) {
        queryClient.invalidateQueries({
          queryKey: [
            'convexQuery',
            api.vibes.getById,
            { id: variables.vibeId },
          ],
        });
        // Note: getForVibe method doesn't exist in emojiRatings API
        // Removing this invalidation as the method is not available
        // Invalidate filtered queries as emoji ratings affect filters
        queryClient.invalidateQueries({
          queryKey: ['convexQuery', api.vibes.getFilteredVibes],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['emojiRatings'] });
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

// Query to get all users
export function useUsers() {
  return useQuery({
    ...convexQuery(api.users.getAll, {}),
  });
}

// Query to get user by ID
export function useUser(id: string) {
  return useQuery({
    ...convexQuery(api.users.getById, { id }),
    enabled: !!id,
  });
}

// Query to get user by username
export function useUserByUsername(username: string) {
  return useQuery({
    ...convexQuery(api.users.getByUsername, { username }),
    enabled: !!username,
  });
}

// Query to get current user from Convex
export function useCurrentUser() {
  return useQuery({
    ...convexQuery(api.users.current, {}),
    select: (data) => {
      // console.log('data', data);
      return data;
    },
  });
}

// Mutation to create a user
export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.users.create);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Mutation to update a user
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.users.update);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Action to update user profile (syncs with both Convex and Clerk)
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.updateProfile);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
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

// ONBOARDING QUERIES

// Debug authentication (temporary)
export function useDebugAuth() {
  return useQuery({
    ...convexQuery(api.users.debugAuth, {}),
  });
}

// Query to get user onboarding status
export function useOnboardingStatus() {
  return useQuery({
    ...convexQuery(api.users.getOnboardingStatus, {}),
  });
}

// Action to update onboarding data (syncs with both Convex and Clerk)
export function useUpdateOnboardingDataMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.updateOnboardingData);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Action to complete onboarding (syncs with both Convex and Clerk)
export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.completeOnboarding);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Action to update user theme (syncs with Convex)
export function useUpdateThemeMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.updateProfile);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Mutation to ensure user exists in Convex
export function useEnsureUserExistsMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.users.ensureUserExists);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Query to get top emoji ratings for a vibe
export function useTopEmojiRatings(vibeId: string, limit?: number) {
  return useQuery({
    ...convexQuery(api.emojiRatings.getTopEmojiRatings, { vibeId, limit }),
    enabled: !!vibeId,
  });
}

// Query to get most interacted emoji for a vibe
export function useMostInteractedEmoji(vibeId: string) {
  return useQuery({
    ...convexQuery(api.emojiRatings.getMostInteractedEmoji, { vibeId }),
    enabled: !!vibeId,
  });
}

// Query to get all emoji metadata
export function useEmojiMetadata() {
  return useQuery({
    ...convexQuery(api.emojiRatings.getAllEmojiMetadata, {}),
  });
}

// Query to get emoji rating stats for a vibe
export function useEmojiRatingStats(vibeId: string) {
  return useQuery({
    ...convexQuery(api.emojiRatings.getEmojiRatingStats, { vibeId }),
    enabled: !!vibeId,
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

// Query to get user's emoji rating statistics
export function useUserEmojiStats(userId: string) {
  return useQuery({
    ...convexQuery(api.emojiRatings.getUserEmojiStats, { userId }),
    enabled: !!userId,
  });
}

// Query to get trending emoji ratings
export function useTrendingEmojiRatings(days: number = 7) {
  return useQuery({
    ...convexQuery(api.emojiRatings.getTrendingEmojis, { days }),
  });
}

// Legacy stub for unused NewColumn component
export function useCreateColumnMutation() {
  return useMutation({
    mutationFn: async (_args: { boardId: string; name: string }) => {
      throw new Error(
        'useCreateColumnMutation is deprecated and not implemented'
      );
    },
  });
}

// FOLLOW SYSTEM QUERIES
export * from './features/follows/hooks';

// NOTIFICATION SYSTEM QUERIES

// Query to get notifications with pagination and filtering
export function useNotificationsQuery(
  type?: 'rating' | 'new_rating' | 'new_vibe' | 'follow',
  options?: { enabled?: boolean; limit?: number; cursor?: string }
) {
  return useQuery({
    ...convexQuery(api.notifications.getNotifications, {
      limit: options?.limit || 20,
      cursor: options?.cursor,
      type,
    }),
    enabled: options?.enabled !== false,
  });
}

// Infinite query for notifications
export function useNotificationsInfinite(
  type?: 'rating' | 'new_rating' | 'new_vibe' | 'follow',
  options?: { enabled?: boolean; limit?: number }
) {
  const { enabled = true, limit = 20 } = options || {};
  const convex = useConvex();

  return useInfiniteQuery({
    queryKey: ['notifications', 'infinite', type || 'all'],
    queryFn: async ({ pageParam }) => {
      return await convex.query(api.notifications.getNotifications, {
        limit,
        cursor: pageParam || undefined,
        type,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage?.nextCursor : undefined,
    enabled,
    initialPageParam: null as string | null,
  });
}

// Query to get unread notification count
export function useUnreadNotificationCount(options?: { enabled?: boolean }) {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCount, {}),
    enabled: options?.enabled !== false,
  });
}

// Query to get unread notification count by type
export function useUnreadNotificationCountByType(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    ...convexQuery(api.notifications.getUnreadCountByType, {}),
    enabled: options?.enabled !== false,
  });
}

// Mutation to mark notification as read
export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.notifications.markAsRead);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Mutation to mark all notifications as read
export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.notifications.markAllAsRead);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Query to get rating by ID
export function useRating(ratingId: string) {
  return useQuery({
    ...convexQuery(api.ratings.getById, { ratingId }),
    enabled: !!ratingId,
  });
}

// GENERALIZED QUERY HOOKS

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
  const {
    enabled = true,
    queryKeyPrefix: _queryKeyPrefix = ['vibes'],
    queryKeyName,
  } = options || {};
  const { limit, cursor, ...filterOptions } = filters || {};

  // Generate a query key based on filters or use provided queryKeyName
  const _filterKey =
    queryKeyName || JSON.stringify({ ...filterOptions, cursor });

  return useQuery({
    ...convexQuery(api.vibes.getFilteredVibes, {
      limit,
      cursor,
      filters: filterOptions,
    }),
    enabled,
  });
}
