import { useQuery } from '@tanstack/react-query'; // React Query hook for data fetching
import { api } from '@viberatr/convex'; // generated Convex API helpers
import { convexQuery } from '@convex-dev/react-query'; // binds Convex functions to React Query

/**
 * Fetch follower/following counts for an arbitrary user.
 * @param userId the user to look up
 */
export function useFollowStats(userId: string) {
  return useQuery({
    ...convexQuery(api.follows.getFollowStats, { userId }), // send id to Convex
    initialData: { followers: 0, following: 0 }, // start with zeros to avoid undefined
  });
}

/**
 * Fetch follower/following counts for the signed-in user.
 */
export function useCurrentUserFollowStats() {
  return useQuery({
    ...convexQuery(api.follows.getCurrentUserFollowStats, {}), // no args needed
    initialData: { followers: 0, following: 0 }, // default to zeros
  });
}
