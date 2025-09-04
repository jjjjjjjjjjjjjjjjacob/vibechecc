import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@vibechecc/convex';
import { useConvexMutation } from '@convex-dev/react-query';
import { toast } from 'sonner';
import { trackEvents } from '@/lib/track-events';

interface UseFollowUserOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useFollowUser(options: UseFollowUserOptions = {}) {
  const queryClient = useQueryClient();
  // @ts-expect-error - Complex Convex types cause deep instantiation errors
  const followMutation = useConvexMutation(api.follows.follow);
  const unfollowMutation = useConvexMutation(api.follows.unfollow);

  const followUser = useMutation({
    mutationFn: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      return await followMutation({ followingId: targetUserId });
    },
    onMutate: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      // Optimistically update follow status
      await queryClient.cancelQueries({
        queryKey: ['isCurrentUserFollowing', targetUserId],
      });

      const previousData = queryClient.getQueryData([
        'isCurrentUserFollowing',
        targetUserId,
      ]);

      queryClient.setQueryData(['isCurrentUserFollowing', targetUserId], true);

      // Optimistically update follow stats
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
      // Revert optimistic updates
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ['isCurrentUserFollowing', targetUserId],
          context.previousData
        );
      }

      // Revert follow stats
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
      // Track follow event
      trackEvents.followUser(targetUserId, username);

      toast.success(
        `followed ${username ? `@${username}` : 'user'} successfully! 🎉`
      );
      options.onSuccess?.();
    },
    onSettled: (data, error, targetUserId) => {
      // Invalidate related queries
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

  const unfollowUser = useMutation({
    mutationFn: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      return await unfollowMutation({ followingId: targetUserId });
    },
    onMutate: async ({
      targetUserId,
    }: {
      targetUserId: string;
      username?: string;
    }) => {
      // Optimistically update follow status
      await queryClient.cancelQueries({
        queryKey: ['isCurrentUserFollowing', targetUserId],
      });

      const previousData = queryClient.getQueryData([
        'isCurrentUserFollowing',
        targetUserId,
      ]);

      queryClient.setQueryData(['isCurrentUserFollowing', targetUserId], false);

      // Optimistically update follow stats
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
      // Revert optimistic updates
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          ['isCurrentUserFollowing', targetUserId],
          context.previousData
        );
      }

      // Revert follow stats
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
      // Track unfollow event
      trackEvents.unfollowUser(targetUserId, username);

      toast.success(
        `unfollowed ${username ? `@${username}` : 'user'} successfully`
      );
      options.onSuccess?.();
    },
    onSettled: (data, error, { targetUserId }) => {
      // Invalidate related queries
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
    followUser: followUser.mutate,
    unfollowUser: unfollowUser.mutate,
    isFollowing: followUser.isPending,
    isUnfollowing: unfollowUser.isPending,
    isLoading: followUser.isPending || unfollowUser.isPending,
    error: followUser.error || unfollowUser.error,
  };
}
