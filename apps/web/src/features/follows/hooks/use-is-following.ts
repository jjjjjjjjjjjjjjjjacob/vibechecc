import { api } from '@viberatr/convex'; // generated Convex API bindings
import { useQuery } from '@tanstack/react-query'; // fetch helper with caching
import { convexQuery } from '@convex-dev/react-query'; // tie Convex to React Query

/**
 * Determines if one user follows another.
 * @param followerId user performing the follow
 * @param followingId user being followed
 */
export function useIsFollowing(followerId: string, followingId: string) {
  return useQuery({
    ...convexQuery(api.follows.isFollowing, {
      followerId, // id of the potential follower
      followingId, // id of the potential followee
    }),
    initialData: false, // assume not following until data arrives
  });
}

/**
 * Convenience wrapper to check if the signed-in user follows another user.
 * @param targetUserId the user to check against the current user
 */
export function useIsCurrentUserFollowing(targetUserId: string) {
  return useQuery({
    ...convexQuery(api.follows.isCurrentUserFollowing, {
      followingId: targetUserId, // Convex expects `followingId`
    }),
    initialData: false, // default to false while loading
  });
}
