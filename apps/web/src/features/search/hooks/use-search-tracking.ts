import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import { useUser } from '@clerk/tanstack-react-start';

export function useSearchTracking() {
  const { user } = useUser();
  
  const trackSearchMutation = useMutation({
    mutationFn: useConvexMutation(api.search.trackSearch),
  });

  const trackSearch = (query: string, resultCount?: number, clickedResults?: string[], category?: string) => {
    console.log('trackSearch called in hook:', { user: user?.id, query, resultCount, clickedResults, category });
    
    // Only track for authenticated users with non-empty queries
    if (!user?.id || !query.trim()) {
      console.log('trackSearch skipped:', { hasUser: !!user?.id, queryTrimmed: query.trim() });
      return;
    }

    console.log('Calling trackSearchMutation.mutate...');
    trackSearchMutation.mutate({
      query: query.trim(),
      resultCount: resultCount || 0,
      clickedResults,
      category,
    }, {
      onSuccess: (data) => {
        console.log('trackSearch success:', data);
      },
      onError: (error) => {
        console.error('trackSearch error:', error);
      }
    });
  };

  return {
    trackSearch,
    isTracking: trackSearchMutation.isPending,
  };
}