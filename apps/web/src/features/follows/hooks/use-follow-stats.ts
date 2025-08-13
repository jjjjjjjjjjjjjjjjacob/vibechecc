import { useQuery } from '@tanstack/react-query';
import { api } from '@vibechecc/convex';
import { convexQuery } from '@convex-dev/react-query';

export function useFollowStats(userId: string) {
  return useQuery({
    ...convexQuery(api.follows.getFollowStats, { userId }),
    initialData: { followers: 0, following: 0 },
  });
}

export function useCurrentUserFollowStats() {
  return useQuery({
    ...convexQuery(api.follows.getCurrentUserFollowStats, {}),
    initialData: { followers: 0, following: 0 },
  });
}
