import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
} from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';

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

// Query to get rating by ID
export function useRating(ratingId: string) {
  return useQuery({
    ...convexQuery(api.ratings.getById, { ratingId }),
    enabled: !!ratingId,
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
        // Invalidate filtered queries as emoji ratings affect filters
        queryClient.invalidateQueries({
          queryKey: ['convexQuery', api.vibes.getFilteredVibes],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['emojiRatings'] });
    },
  });
}