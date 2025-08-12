/**
 * Hook that exposes follow and unfollow mutations with optimistic updates.
 * Handles cache updates, analytics tracking, and user-facing toasts.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@viberatr/convex';
import { useConvexMutation } from '@convex-dev/react-query';
import { toast } from 'sonner';
import { trackEvents } from '@/lib/posthog';

interface UseFollowUserOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useFollowUser(options: UseFollowUserOptions = {}) {
  // React Query cache for manual updates
  const queryClient = useQueryClient();
  // Convex mutations for follow/unfollow
  const followMutation = useConvexMutation(api.follows.follow);
  const unfollowMutation = useConvexMutation(api.follows.unfollow);

  // Mutation for following a user
  const followUser = useMutation({
    mutationFn: async ({
      targetUserId,
      username: _username,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      // Execute Convex mutation to create follow
      return await followMutation({ followingId: targetUserId });
    },
    onMutate: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      // Optimistically update follow status in cache
      await queryClient.cancelQueries({
        queryKey: ['isCurrentUserFollowing', targetUserId],
      });

      const previousData = queryClient.getQueryData([
        'isCurrentUserFollowing',
        targetUserId,
      ]);

      queryClient.setQueryData(['isCurrentUserFollowing', targetUserId], true);

      // Also bump the follower count so UI feels snappy
      queryClient.setQueryData(
        ['followStats', targetUserId],
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
    onError: (err, { targetUserId, username }, context) => {
      // Revert optimistic updates if mutation failed
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ['isCurrentUserFollowing', targetUserId],
          context.previousData
        );
      }

      // Roll back follower count
      queryClient.setQueryData(
        ['followStats', targetUserId],
        (old: { followers: number; following: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followers: Math.max(0, old.followers - 1),
          };
        }
      );

      toast.error(`failed to follow ${username ? `@${username}` : 'user'}`);
      options.onError?.(err as Error);
    },
    onSuccess: (data, { targetUserId, username }) => {
      // Track follow event for analytics
      trackEvents.followUser(targetUserId, username);

      toast.success(
        `followed ${username ? `@${username}` : 'user'} successfully! 🎉`
      );
      options.onSuccess?.();
    },
    onSettled: (data, error, targetUserId) => {
      // Ensure caches reflect server state
      queryClient.invalidateQueries({
        queryKey: ['isCurrentUserFollowing', targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ['followStats', targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ['currentUserFollowStats'],
      });
      queryClient.invalidateQueries({
        queryKey: ['userFollowers', targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ['suggestedFollows'],
      });
    },
  });

  // Mutation for unfollowing a user
  const unfollowUser = useMutation({
    mutationFn: async ({
      targetUserId,
      username: _username,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      // Execute Convex mutation to remove follow
      return await unfollowMutation({ followingId: targetUserId });
    },
    onMutate: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      // Optimistically set following status to false
      await queryClient.cancelQueries({
        queryKey: ['isCurrentUserFollowing', targetUserId],
      });

      const previousData = queryClient.getQueryData([
        'isCurrentUserFollowing',
        targetUserId,
      ]);

      queryClient.setQueryData(['isCurrentUserFollowing', targetUserId], false);

      // Decrement follower count optimistically
      queryClient.setQueryData(
        ['followStats', targetUserId],
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
    onError: (err, { targetUserId, username }, context) => {
      // Restore caches if the mutation fails
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ['isCurrentUserFollowing', targetUserId],
          context.previousData
        );
      }

      // Re-add follower count that we optimistically decremented
      queryClient.setQueryData(
        ['followStats', targetUserId],
        (old: { followers: number; following: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followers: old.followers + 1,
          };
        }
      );

      toast.error(`failed to unfollow ${username ? `@${username}` : 'user'}`);
      options.onError?.(err as Error);
    },
    onSuccess: (data, { targetUserId, username }) => {
      // Track the unfollow event
      trackEvents.unfollowUser(targetUserId, username);

      toast.success(
        `unfollowed ${username ? `@${username}` : 'user'} successfully`
      );
      options.onSuccess?.();
    },
    onSettled: (data, error, { targetUserId }) => {
      // Invalidate caches after mutation settles
      queryClient.invalidateQueries({
        queryKey: ['isCurrentUserFollowing', targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ['followStats', targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ['currentUserFollowStats'],
      });
      queryClient.invalidateQueries({
        queryKey: ['userFollowers', targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ['suggestedFollows'],
      });
    },
  });

  return {
    // expose mutate functions and loading state
    followUser: followUser.mutate,
    unfollowUser: unfollowUser.mutate,
    isFollowing: followUser.isPending,
    isUnfollowing: unfollowUser.isPending,
    isLoading: followUser.isPending || unfollowUser.isPending,
    error: followUser.error || unfollowUser.error,
  };
}
