import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
  useConvexAction,
} from '@convex-dev/react-query';
import { api } from '@viberater/convex';
// import { useAuth } from '@clerk/tanstack-react-start';

// viberater QUERIES

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

// Infinite query to get paginated vibes with full details
export function useVibesPaginatedInfinite(
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    ...convexQuery(api.vibes.getAll, {
      limit,
      cursor: undefined,
    }),
    getNextPageParam: (lastPage) => lastPage?.continueCursor,
    enabled: options?.enabled !== false,
  });
}

// Lightweight infinite query for discover page
export function useVibesLightweightInfinite(
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    ...convexQuery(api.vibes.getAll, {
      limit,
      cursor: undefined,
    }),
    getNextPageParam: (lastPage) => lastPage?.continueCursor,
    enabled: options?.enabled !== false,
  });
}

// Infinite query to get unrated vibes
export function useUnratedVibesInfinite(
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    ...convexQuery(api.vibes.getAll, {
      limit: (limit || 10) * 2, // Get more to filter client-side
      cursor: undefined,
    }),
    getNextPageParam: (lastPage) => lastPage?.continueCursor,
    enabled: options?.enabled !== false,
    select: (data) => ({
      ...data,
      pages: data.pages.map(page => ({
        ...page,
        vibes: page.vibes?.filter(v => !v.ratings || v.ratings.length === 0).slice(0, limit || 10) || []
      }))
    }),
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
  return useMutation({
    mutationFn: useConvexMutation(api.vibes.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
    },
  });
}

// Mutation to add a rating
export function useAddRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.vibes.addRating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
    },
  });
}

// Mutation to create/update emoji rating
export function useCreateEmojiRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.emojiRatings.createOrUpdateEmojiRating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
      queryClient.invalidateQueries({ queryKey: ['emojiRatings'] });
    },
  });
}

// Mutation for quick react to a vibe
export function useQuickReactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.vibes.quickReact),
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
  return useMutation({
    mutationFn: useConvexMutation(api.users.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Mutation to update a user
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Action to update user profile (syncs with both Convex and Clerk)
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.updateProfile),
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

// Infinite query to get top-rated vibes
export function useTopRatedVibesInfinite(
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    ...convexQuery(api.vibes.getTopRated, {
      limit,
      cursor: undefined,
    }),
    getNextPageParam: (lastPage) => lastPage?.continueCursor,
    enabled: options?.enabled !== false,
  });
}

// Lightweight infinite query for top-rated vibes
export function useTopRatedVibesLightweightInfinite(
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    ...convexQuery(api.vibes.getTopRated, {
      limit,
      cursor: undefined,
    }),
    getNextPageParam: (lastPage) => lastPage?.continueCursor,
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
  return useMutation({
    mutationFn: useConvexAction(api.users.updateOnboardingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Action to complete onboarding (syncs with both Convex and Clerk)
export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.completeOnboarding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Mutation to ensure user exists in Convex
export function useEnsureUserExistsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.ensureUserExists),
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
