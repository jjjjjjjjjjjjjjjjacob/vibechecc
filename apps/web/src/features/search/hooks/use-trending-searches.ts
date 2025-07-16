import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';

export function useTrendingSearches(limit: number = 10) {
  return useQuery({
    ...convexQuery(api.search.getTrendingSearches, { limit }),
  });
}