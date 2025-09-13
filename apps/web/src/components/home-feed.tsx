import * as React from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MasonryFeed } from '@/components/masonry-feed';
import { FeedLayout } from '@/components/layouts';
import { useVibesInfinite, useForYouFeedInfinite } from '@/queries';
import { useCurrentUserFollowStats } from '@/features/follows/hooks/use-follow-stats';
import { ForYouEmptyState } from '@/components/for-you-empty-state';
import {
  Flame,
  Sparkles,
  Clock,
  TrendingUp,
  Star,
} from '@/components/ui/icons';
import { useInView } from 'react-intersection-observer';
import { useHeaderNavStore } from '@/stores/header-nav-store';
import { cn } from '@/utils/tailwind-utils';

interface HomeFeedProps {
  className?: string;
}

export function HomeFeed({ className }: HomeFeedProps) {
  // Use selector functions to prevent unnecessary re-renders
  const feedTab = useHeaderNavStore((state) => state.feedTab);
  const setFeedTab = useHeaderNavStore((state) => state.setFeedTab);
  // Only subscribe to setPageNavState (not the state itself to avoid re-renders)
  const setPageNavState = useHeaderNavStore((state) => state.setPageNavState);
  const { user } = useUser();
  const { data: followStats } = useCurrentUserFollowStats();

  // Track initial mount to prevent dipping on navigation
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Set up intersection observer for sticky tabs
  const {
    ref: tabsRef,
    inView: tabsInView,
    entry,
  } = useInView({
    threshold: 0,
    rootMargin: '-120px 0px 0px 0px', // Account for header height
  });

  // Handle tab change
  const handleTabChange = (tab: 'for-you' | 'hot' | 'new' | 'unrated') => {
    setFeedTab(tab);
  };

  // Feed tabs configuration
  const feedTabs = [
    {
      id: 'for-you' as const,
      label: 'for you',
      icon: <Sparkles className="h-4 w-4" />,
      description:
        followStats?.following > 0
          ? `ai-powered recommendations based on your interests and ${followStats.following} ${followStats.following === 1 ? 'person' : 'people'} you follow`
          : 'intelligent recommendations that learn from your ratings and interactions',
      requiresAuth: true,
    },
    {
      id: 'hot' as const,
      label: 'hot',
      icon: <Flame className="h-4 w-4" />,
      description: 'most rated & recently active vibes',
      requiresAuth: false,
    },
    {
      id: 'new' as const,
      label: 'new',
      icon: <Clock className="h-4 w-4" />,
      description: 'freshly posted vibes',
      requiresAuth: false,
    },
    {
      id: 'unrated' as const,
      label: 'unrated',
      icon: <Star className="h-4 w-4" />,
      description: "vibes that haven't been rated yet",
      requiresAuth: false,
    },
  ];

  // Show "For You" only if user is authenticated, otherwise default to "Hot"
  const availableTabs = user?.id
    ? feedTabs
    : feedTabs.filter((tab) => !tab.requiresAuth);

  React.useEffect(() => {
    // If user is not authenticated and on "for-you", switch to "hot"
    if (!user?.id && feedTab === 'for-you') {
      setFeedTab('hot');
    }
  }, [user?.id, feedTab, setFeedTab]);

  // Get query configuration for current tab
  const getQueryConfig = () => {
    switch (feedTab) {
      case 'for-you':
        return {
          usePersonalizedFeed: true, // Use enhanced personalized feed with AI recommendations
          enabled: !!user?.id,
          emptyTitle: 'building your recommendations',
          emptyDescription:
            'our ai learns from your ratings and follows to show you the best content!',
          emptyAction: null, // Handled by custom component
        };
      case 'hot':
        return {
          filters: { sort: 'top_rated' as const, limit: 20 },
          enabled: true,
          emptyTitle: 'no hot vibes right now',
          emptyDescription:
            'be the first to create and rate vibes to get the community started!',
          emptyAction: (
            <Button asChild>
              <a href="/vibes/create">create a vibe</a>
            </Button>
          ),
        };
      case 'new':
        return {
          filters: { sort: 'recent' as const, limit: 20 },
          enabled: true,
          emptyTitle: 'no new vibes yet',
          emptyDescription:
            'be the first to share something amazing with the community!',
          emptyAction: (
            <Button asChild>
              <a href="/vibes/create">create a vibe</a>
            </Button>
          ),
        };
      case 'unrated':
        return {
          filters: { sort: 'recent' as const, maxRatingCount: 0, limit: 20 },
          enabled: true,
          emptyTitle: 'no unrated vibes found',
          emptyDescription:
            'all vibes have been rated! check back later for new content.',
          emptyAction: (
            <Button asChild>
              <a href="/vibes/create">create a vibe</a>
            </Button>
          ),
        };
    }
  };

  const queryConfig = getQueryConfig();

  // Use personalized feed for "for-you" tab, otherwise use generalized feed
  const personalizedFeedQuery = useForYouFeedInfinite({
    enabled: queryConfig.enabled && feedTab === 'for-you',
    queryKeyPrefix: ['home-feed', 'for-you'],
  });

  const generalFeedQuery = useVibesInfinite(queryConfig.filters, {
    enabled: queryConfig.enabled && feedTab !== 'for-you',
    queryKeyPrefix: ['home-feed'],
    queryKeyName: feedTab, // Use tab name as safe identifier
  });

  // Use the appropriate query based on the active tab
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = feedTab === 'for-you' ? personalizedFeedQuery : generalFeedQuery;

  // Flatten all pages to get vibes array - optimized with better memoization
  const vibes = React.useMemo(() => {
    if (!data || typeof data !== 'object' || !('pages' in data) || !data.pages)
      return [];
    return (
      data as { pages: Array<{ vibes?: import('@vibechecc/types').Vibe[] }> }
    ).pages.flatMap((page) => page?.vibes || []);
  }, [data]); // Include full data object for proper dependency tracking

  // For "for you" tab, use custom empty state component
  // Also show if there's an error but we want to provide helpful guidance
  const shouldUseCustomEmptyState =
    feedTab === 'for-you' &&
    vibes.length === 0 &&
    !isLoading &&
    (!error || (error && followStats && followStats.following === 0));

  // Load more function for intersection observer
  const loadMore = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Initialize after first intersection observer measurement
  React.useEffect(() => {
    if (entry && !hasInitialized) {
      setTimeout(() => {
        setHasInitialized(true);
      }, 1000);
    }
  }, [entry, hasInitialized]);

  // Update header page nav state when tabs go out of view
  React.useEffect(() => {
    // Only set pageNavState if we're on the homepage
    // This prevents tabs from appearing when navigating away
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      // Show tabs in header when:
      // 1. They're not in view AND observer has initialized AND we have an entry (to prevent initial flicker)
      // We ignore loading state to prevent tabs from disappearing during queries
      if (!tabsInView && hasInitialized && entry) {
        setPageNavState('tabs');
      } else if (tabsInView || !hasInitialized || !entry) {
        // Hide tabs when they're visible in the main content OR when not initialized yet
        setPageNavState(null);
      }
    } else {
      setPageNavState(null);
    }

    // Clear pageNavState when component unmounts (navigating away)
    return () => {
      setPageNavState(null);
    };
  }, [tabsInView, hasInitialized, entry, setPageNavState]);

  // Prepare header content
  const headerContent = (
    <div className="flex flex-col">
      <div
        data-show-tabs={tabsInView}
        data-has-mounted={hasInitialized}
        className="mb-4 flex items-center gap-2 transition data-[has-mounted=false]:delay-1000 data-[show-tabs=false]:opacity-0 data-[show-tabs=true]:opacity-100"
      >
        <TrendingUp className="text-primary h-5 w-5" />
        <h1 className="text-2xl font-bold">feed</h1>
      </div>
      <div ref={tabsRef}>
        <TooltipProvider>
          <div
            data-show-tabs={tabsInView}
            data-has-mounted={hasInitialized}
            className={cn(
              'flex gap-2 overflow-x-auto pb-2 transition duration-300 data-[has-mounted=false]:delay-1000',
              'opacity-100 data-[show-tabs=false]:-translate-y-5 data-[show-tabs=false]:opacity-0 data-[show-tabs=true]:translate-y-0'
            )}
          >
            {availableTabs.map((tab) => (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={feedTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTabChange(tab.id)}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    {tab.icon}
                    {tab.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tab.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );

  return (
    <FeedLayout
      className={className}
      header={headerContent}
      headerSpacing="md"
      contentSpacing="sm"
    >
      {/* Feed Content */}
      {shouldUseCustomEmptyState ? (
        <ForYouEmptyState />
      ) : (
        <MasonryFeed
          vibes={vibes}
          isLoading={isLoading}
          error={error}
          hasMore={hasNextPage}
          onLoadMore={loadMore}
          ratingDisplayMode={feedTab === 'hot' ? 'top-rated' : 'most-rated'}
          variant="feed"
          emptyStateTitle={queryConfig.emptyTitle}
          emptyStateDescription={queryConfig.emptyDescription}
          emptyStateAction={
            feedTab === 'for-you' ? null : queryConfig.emptyAction
          }
        />
      )}
    </FeedLayout>
  );
}
