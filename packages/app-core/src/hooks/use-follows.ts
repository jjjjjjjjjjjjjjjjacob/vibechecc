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

// Query to check if current user is following a specific user
export function useIsFollowing(targetUserId: string) {
  return useQuery({
    ...convexQuery(api.follows.isFollowing, { followingId: targetUserId }),
    enabled: !!targetUserId,
  });
}

// Query to get user's followers
export function useFollowers(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    ...convexQuery(api.follows.getFollowers, { userId }),
    enabled: !!userId && options?.enabled !== false,
  });
}

// Query to get users that a user is following
export function useFollowing(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    ...convexQuery(api.follows.getFollowing, { userId }),
    enabled: !!userId && options?.enabled !== false,
  });
}

// Query to get follow statistics for a user
export function useFollowStats(userId: string) {
  return useQuery({
    ...convexQuery(api.follows.getFollowStats, { userId }),
    enabled: !!userId,
  });
}

// Query to get current user's follow statistics
export function useCurrentUserFollowStats() {
  return useQuery({
    ...convexQuery(api.follows.getCurrentUserFollowStats, {}),
  });
}

// Query to get suggested users to follow
export function useSuggestedFollows(options?: { limit?: number; enabled?: boolean }) {
  return useQuery({
    ...convexQuery(api.follows.getSuggestedFollows, {
      limit: options?.limit || 10,
    }),
    enabled: options?.enabled !== false,
  });
}

// Mutation to follow a user
export function useFollowUserMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  const followMutation = useConvexMutation(api.follows.follow);

  return useMutation({
    mutationFn: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      return await followMutation({ followingId: targetUserId });
    },
    onMutate: async ({ targetUserId }) => {
      // Optimistically update follow status
      await queryClient.cancelQueries({
        queryKey: ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
      });

      const previousData = queryClient.getQueryData([
        'convexQuery',
        api.follows.isFollowing,
        { followingId: targetUserId },
      ]);

      queryClient.setQueryData(
        ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
        true
      );

      // Optimistically update follow stats
      queryClient.setQueryData(
        ['convexQuery', api.follows.getFollowStats, { userId: targetUserId }],
        (old: { followers: number; following: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followers: old.followers + 1,
          };
        }
      );

      return { previousData, targetUserId };
    },
    onError: (err, { targetUserId }, context) => {
      // Revert optimistic updates
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
          context.previousData
        );
      }

      // Revert follow stats
      queryClient.setQueryData(
        ['convexQuery', api.follows.getFollowStats, { userId: targetUserId }],
        (old: { followers: number; following: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followers: Math.max(0, old.followers - 1),
          };
        }
      );

      options?.onError?.(err as Error);
    },
    onSuccess: (data, { targetUserId }) => {
      options?.onSuccess?.();
    },
    onSettled: (data, error, { targetUserId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getFollowStats, { userId: targetUserId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getCurrentUserFollowStats],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getFollowers, { userId: targetUserId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getSuggestedFollows],
      });
    },
  });
}

// Mutation to unfollow a user
export function useUnfollowUserMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  const unfollowMutation = useConvexMutation(api.follows.unfollow);

  return useMutation({
    mutationFn: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      return await unfollowMutation({ followingId: targetUserId });
    },
    onMutate: async ({ targetUserId }) => {
      // Optimistically update follow status
      await queryClient.cancelQueries({
        queryKey: ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
      });

      const previousData = queryClient.getQueryData([
        'convexQuery',
        api.follows.isFollowing,
        { followingId: targetUserId },
      ]);

      queryClient.setQueryData(
        ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
        false
      );

      // Optimistically update follow stats
      queryClient.setQueryData(
        ['convexQuery', api.follows.getFollowStats, { userId: targetUserId }],
        (old: { followers: number; following: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followers: Math.max(0, old.followers - 1),
          };
        }
      );

      return { previousData, targetUserId };
    },
    onError: (err, { targetUserId }, context) => {
      // Revert optimistic updates
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
          context.previousData
        );
      }

      // Revert follow stats
      queryClient.setQueryData(
        ['convexQuery', api.follows.getFollowStats, { userId: targetUserId }],
        (old: { followers: number; following: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followers: old.followers + 1,
          };
        }
      );

      options?.onError?.(err as Error);
    },
    onSuccess: (data, { targetUserId }) => {
      options?.onSuccess?.();
    },
    onSettled: (data, error, { targetUserId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.isFollowing, { followingId: targetUserId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getFollowStats, { userId: targetUserId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getCurrentUserFollowStats],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getFollowers, { userId: targetUserId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['convexQuery', api.follows.getSuggestedFollows],
      });
    },
  });
}

// Combined hook for follow/unfollow functionality
export function useFollowUser(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const followMutation = useFollowUserMutation(options);
  const unfollowMutation = useUnfollowUserMutation(options);

  return {
    followUser: followMutation.mutate,
    unfollowUser: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    error: followMutation.error || unfollowMutation.error,
  };
}