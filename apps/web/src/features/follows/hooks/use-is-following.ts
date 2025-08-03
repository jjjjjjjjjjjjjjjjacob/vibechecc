import { api } from '@viberatr/convex';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';

export function useIsFollowing(followerId: string, followingId: string) {
  return useQuery({
    ...convexQuery(api.follows.isFollowing, {
      followerId,
      followingId,
    }),
    initialData: false,
  });
}

export function useIsCurrentUserFollowing(targetUserId: string) {
  return useQuery({
    ...convexQuery(api.follows.isCurrentUserFollowing, {
      followingId: targetUserId,
    }),
    initialData: false,
  });
}
