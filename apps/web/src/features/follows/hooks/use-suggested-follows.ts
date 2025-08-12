import { api } from '@viberatr/convex'; // generated Convex API helpers
import { useQuery } from '@tanstack/react-query'; // data fetching and caching
import { convexQuery } from '@convex-dev/react-query'; // connect Convex functions to React Query

/**
 * Optional settings for the suggested follows hook.
 * `limit` controls the number of suggestions and `enabled` toggles the query.
 */
interface UseSuggestedFollowsOptions {
  limit?: number; // maximum suggestions to fetch
  enabled?: boolean; // whether the query should run
}

/**
 * Retrieves user suggestions for the current user to follow.
 * @param options optional limit and enabled flags
 */
export function useSuggestedFollows(options: UseSuggestedFollowsOptions = {}) {
  const { limit = 10, enabled = true } = options; // apply defaults

  return useQuery({
    ...convexQuery(api.follows.getSuggestedFollows, { limit }), // ask Convex for suggestions
    enabled, // allow callers to disable fetching
    select: (data) => data?.suggestions || [], // unwrap suggestions array
    initialData: { suggestions: [] }, // empty array before first fetch
  });
}
