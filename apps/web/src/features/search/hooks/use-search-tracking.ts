import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import { useUser } from '@clerk/tanstack-react-start';

export function useSearchTracking() {
  const { user } = useUser();

  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  const trackSearch = (
    query: string,
    resultCount?: number,
    clickedResults?: string[],
    category?: string
  ) => {
    // Only track for authenticated users with non-empty queries
    if (!user?.id || !query.trim()) {
      return;
    }

    trackSearchMutation.mutate(
      {
        query: query.trim(),
        resultCount: resultCount || 0,
        clickedResults,
        category,
      },
      {}
    );
  };

  return {
    trackSearch,
    isTracking: trackSearchMutation.isPending,
  };
}
