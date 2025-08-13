import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import { useUser } from '@clerk/tanstack-react-start';
import { trackEvents } from '@/lib/posthog';

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

    // Track in PostHog immediately
    trackEvents.searchPerformed(query.trim(), resultCount || 0);

    // Also track in Convex for backend analytics
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

  const trackFilterApplied = (
    filterType: string,
    filterValue: string | number | boolean | string[] | undefined,
    searchQuery?: string
  ) => {
    trackEvents.searchFilterApplied(filterType, filterValue, searchQuery);
  };

  const trackFilterRemoved = (
    filterType: string,
    filterValue: string | number | boolean | string[] | undefined,
    searchQuery?: string
  ) => {
    trackEvents.searchFilterRemoved(filterType, filterValue, searchQuery);
  };

  const trackResultClicked = (
    resultType: 'vibe' | 'user' | 'tag',
    resultId: string,
    position: number,
    searchQuery?: string
  ) => {
    trackEvents.searchResultClicked(
      resultType,
      resultId,
      position,
      searchQuery
    );
  };

  const trackSortChanged = (
    sortType: 'recent' | 'rating_desc' | 'rating_asc' | 'top_rated',
    searchQuery?: string
  ) => {
    trackEvents.searchSortChanged(sortType, searchQuery);
  };

  return {
    trackSearch,
    trackFilterApplied,
    trackFilterRemoved,
    trackResultClicked,
    trackSortChanged,
    isTracking: trackSearchMutation.isPending,
  };
}
