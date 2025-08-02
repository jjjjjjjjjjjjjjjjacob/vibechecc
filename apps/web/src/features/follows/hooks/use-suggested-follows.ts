import { api } from '@viberater/convex';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';

interface UseSuggestedFollowsOptions {
  limit?: number;
  enabled?: boolean;
}

export function useSuggestedFollows(options: UseSuggestedFollowsOptions = {}) {
  const { limit = 10, enabled = true } = options;

  return useQuery({
    ...convexQuery(api.follows.getSuggestedFollows, { limit }),
    enabled,
    select: (data) => data?.suggestions || [],
    initialData: { suggestions: [] },
  });
}
