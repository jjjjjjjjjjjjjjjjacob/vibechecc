import { useQuery } from '@tanstack/react-query'; // fetch utility for React
import { convexQuery } from '@convex-dev/react-query'; // bridges Convex with React Query
import { api } from '@viberatr/convex'; // generated Convex API helpers

/**
 * Fetches the most popular search terms from the backend.
 * @param limit maximum number of search terms to return, defaults to 10
 */
export function useTrendingSearches(limit: number = 10) {
  return useQuery({
    // convexQuery wires the Convex function into React Query's caching layer
    ...convexQuery(api.search.getTrendingSearches, { limit }),
  });
}
