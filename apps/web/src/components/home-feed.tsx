import * as React from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TabsDraggable,
  TabsDraggableList,
  TabsDraggableTrigger,
  TabsDraggableContent,
  TabsDraggableContentContainer,
} from '@/components/ui/tabs-draggable';
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
  Zap,
} from '@/components/ui/icons';
import { useInView } from 'react-intersection-observer';
import { useHeaderNavStore } from '@/stores/header-nav-store';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

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
    initialInView: false,
  });

  // Handle tab change
  const handleTabChange = (
    tab: 'for-you' | 'hot' | 'new' | 'unrated' | 'boosted' | 'controversial'
  ) => {
    setFeedTab(tab);
  };

  // Feed tabs configuration - Mobile only shows 4 tabs
  const allFeedTabs = [
    {
      id: 'for-you' as const,
      label: 'for you',
      icon: <Sparkles className="h-4 w-4" />,
      description:
        followStats?.following > 0
          ? `personalized vibes from ${followStats.following} ${followStats.following === 1 ? 'person' : 'people'} you follow`
          : 'discover and follow people to see personalized content',
      requiresAuth: true,
      mobileVisible: true,
    },
    {
      id: 'hot' as const,
      label: 'hot',
      icon: <Flame className="h-4 w-4" />,
      description: 'boost score + recency + engagement algorithm',
      requiresAuth: false,
      mobileVisible: true,
    },
    {
      id: 'boosted' as const,
      label: 'boosted',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'highest boost scores from the community',
      requiresAuth: false,
      mobileVisible: false, // Hidden on mobile
    },
    {
      id: 'controversial' as const,
      label: 'controversial',
      icon: <Zap className="h-4 w-4" />,
      description: 'vibes with mixed reactions and high engagement',
      requiresAuth: false,
      mobileVisible: false, // Hidden on mobile
    },
    {
      id: 'new' as const,
      label: 'new',
      icon: <Clock className="h-4 w-4" />,
      description: 'freshly posted vibes',
      requiresAuth: false,
      mobileVisible: true,
    },
    {
      id: 'unrated' as const,
      label: 'unrated',
      icon: <Star className="h-4 w-4" />,
      description: "vibes that haven't been rated yet",
      requiresAuth: false,
      mobileVisible: true,
    },
  ];

  // Filter tabs based on device
  const feedTabs = isMobile
    ? allFeedTabs.filter((tab) => tab.mobileVisible)
    : allFeedTabs;

  // Show "For You" only if user is authenticated, otherwise default to "Hot"
  const availableTabs = user?.id
    ? feedTabs
    : feedTabs.filter((tab) => !tab.requiresAuth);

  React.useEffect(() => {
    // If user is not authenticated and on "for-you", switch to "hot"
    if (!user?.id && feedTab === 'for-you') {
      setFeedTab('hot');
    }

    // If on mobile and current tab is not visible, switch to "hot"
    if (isMobile && !availableTabs.find((tab) => tab.id === feedTab)) {
      setFeedTab('hot');
    }
  }, [user?.id, feedTab, setFeedTab, isMobile, availableTabs]);

  // Get query configuration for current tab
  const getQueryConfig = () => {
    switch (feedTab) {
      case 'for-you':
        return {
          usePersonalizedFeed: true, // Use dedicated personalized feed
          enabled: !!user?.id,
          emptyTitle: 'your personalized feed is empty',
          emptyDescription:
            'start following users to see their vibes in your personalized feed!',
          emptyAction: null, // Handled by custom component
        };
      case 'hot':
        return {
          filters: { sort: 'hot' as const, limit: 20 },
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
      case 'boosted':
        return {
          filters: { sort: 'boosted' as const, limit: 20 },
          enabled: true,
          emptyTitle: 'no boosted vibes yet',
          emptyDescription:
            'vibes with high boost scores will appear here when the community starts boosting content!',
          emptyAction: (
            <Button asChild>
              <a href="/vibes/create">create a vibe</a>
            </Button>
          ),
        };
      case 'controversial':
        return {
          filters: { sort: 'controversial' as const, limit: 20 },
          enabled: true,
          emptyTitle: 'no controversial vibes found',
          emptyDescription:
            'vibes with mixed reactions and high engagement will appear here!',
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
    if (!data?.pages) {
      return [];
    }
    // Set as initialized since query is now available
    const vibes = (
      data as { pages: Array<{ vibes?: import('@vibechecc/types').Vibe[] }> }
    ).pages.flatMap((page) => page?.vibes || []);
    return vibes;
  }, [data?.pages]); // Only depend on pages, not the full data object

  // For "for you" tab, use custom empty state component
  const shouldUseCustomEmptyState =
    feedTab === 'for-you' && vibes.length === 0 && !isLoading;

  // Load more function for intersection observer
  const loadMore = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Individual query hooks for each tab to maintain separate data states
  const forYouQuery = useForYouFeedInfinite({
    enabled: !!user?.id && isMobile,
    queryKeyPrefix: ['home-feed', 'for-you', 'mobile'],
  });

  const hotQuery = useVibesInfinite(
    { sort: 'hot' as const, limit: 20 },
    {
      enabled: isMobile,
      queryKeyPrefix: ['home-feed', 'mobile'],
      queryKeyName: 'hot',
    }
  );

  const boostedQuery = useVibesInfinite(
    { sort: 'boosted' as const, limit: 20 },
    {
      enabled: isMobile,
      queryKeyPrefix: ['home-feed', 'mobile'],
      queryKeyName: 'boosted',
    }
  );

  const controversialQuery = useVibesInfinite(
    { sort: 'controversial' as const, limit: 20 },
    {
      enabled: isMobile,
      queryKeyPrefix: ['home-feed', 'mobile'],
      queryKeyName: 'controversial',
    }
  );

  const newQuery = useVibesInfinite(
    { sort: 'recent' as const, limit: 20 },
    {
      enabled: isMobile,
      queryKeyPrefix: ['home-feed', 'mobile'],
      queryKeyName: 'new',
    }
  );

  const unratedQuery = useVibesInfinite(
    { sort: 'recent' as const, maxRatingCount: 0, limit: 20 },
    {
      enabled: isMobile,
      queryKeyPrefix: ['home-feed', 'mobile'],
      queryKeyName: 'unrated',
    }
  );

  // Memoized tab data for each tab
  const tabDataMap = React.useMemo(() => {
    const map = new Map<
      typeof feedTab,
      {
        vibes: import('@vibechecc/types').Vibe[];
        isLoading: boolean;
        error: unknown;
        hasNextPage?: boolean;
        isFetchingNextPage?: boolean;
        fetchNextPage: () => void;
      }
    >();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processQuery = (tabId: typeof feedTab, query: any) => {
      const tabVibes = query.data?.pages
        ? query.data.pages.flatMap(
            (page: any) => page?.vibes?.filter(Boolean) || []
          )
        : [];

      map.set(tabId, {
        vibes: tabVibes,
        isLoading: query.isLoading,
        error: query.error,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
      });
    };

    if (user?.id) {
      processQuery('for-you', forYouQuery);
    }
    processQuery('hot', hotQuery);
    processQuery('boosted', boostedQuery);
    processQuery('controversial', controversialQuery);
    processQuery('new', newQuery);
    processQuery('unrated', unratedQuery);

    return map;
  }, [
    user?.id,
    forYouQuery,
    hotQuery,
    boostedQuery,
    controversialQuery,
    newQuery,
    unratedQuery,
  ]);

  // Render feed content for a specific tab (mobile only)
  const renderMobileFeedContent = React.useCallback(
    (tabId: typeof feedTab) => {
      // Get query configuration for this specific tab
      const getTabQueryConfig = () => {
        switch (tabId) {
          case 'for-you':
            return {
              emptyTitle: 'your personalized feed is empty',
              emptyDescription:
                'start following users to see their vibes in your personalized feed!',
              emptyAction: null,
            };
          case 'hot':
            return {
              emptyTitle: 'no hot vibes right now',
              emptyDescription:
                'be the first to create and rate vibes to get the community started!',
              emptyAction: (
                <Button asChild>
                  <a href="/vibes/create">create a vibe</a>
                </Button>
              ),
            };
          case 'boosted':
            return {
              emptyTitle: 'no boosted vibes yet',
              emptyDescription:
                'vibes with high boost scores will appear here when the community starts boosting content!',
              emptyAction: (
                <Button asChild>
                  <a href="/vibes/create">create a vibe</a>
                </Button>
              ),
            };
          case 'controversial':
            return {
              emptyTitle: 'no controversial vibes found',
              emptyDescription:
                'vibes with mixed reactions and high engagement will appear here!',
              emptyAction: (
                <Button asChild>
                  <a href="/vibes/create">create a vibe</a>
                </Button>
              ),
            };
          case 'new':
            return {
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

      const tabConfig = getTabQueryConfig();
      const tabData = tabDataMap.get(tabId);

      if (!tabData) {
        // Fallback if no data available
        return null;
      }

      const shouldUseTabCustomEmptyState =
        tabId === 'for-you' && tabData.vibes.length === 0 && !tabData.isLoading;

      // Always render actual content for each tab - no skeletons for inactive tabs
      if (shouldUseTabCustomEmptyState) {
        return <ForYouEmptyState />;
      }

      return (
        <MasonryFeed
          vibes={tabData.vibes}
          isLoading={tabData.isLoading}
          error={tabData.error as Error | null}
          hasMore={tabData.hasNextPage}
          onLoadMore={() => {
            if (!tabData.hasNextPage || tabData.isFetchingNextPage) return;
            tabData.fetchNextPage();
          }}
          ratingDisplayMode={tabId === 'hot' ? 'top-rated' : 'most-rated'}
          variant="feed"
          emptyStateTitle={tabConfig.emptyTitle}
          emptyStateDescription={tabConfig.emptyDescription}
          emptyStateAction={tabId === 'for-you' ? null : tabConfig.emptyAction}
        />
      );
    },
    [tabDataMap]
  );

  // Initialize after first intersection observer measurement
  React.useEffect(() => {
    if (entry && !hasInitialized) {
      const timeoutId = setTimeout(() => {
        setHasInitialized(true);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [entry, hasInitialized]);

  // Update header page nav state when tabs go out of view
  React.useEffect(() => {
    // Only update if we're initialized to prevent premature state changes
    if (!hasInitialized) return;

    // Only set pageNavState if we're on the homepage
    // This prevents tabs from appearing when navigating away
    const isOnHomepage =
      typeof window !== 'undefined' && window.location.pathname === '/';

    if (isOnHomepage) {
      // Show tabs in header when they're not in view
      if (!tabsInView) {
        setPageNavState('tabs');
      } else {
        // Hide tabs when they're visible in the main content
        setPageNavState(null);
      }
    } else {
      setPageNavState(null);
    }

    // Clear pageNavState when component unmounts (navigating away)
    return () => {
      setPageNavState(null);
    };
  }, [tabsInView, hasInitialized, setPageNavState]);

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
      {/* Desktop tabs - regular buttons with tooltips */}
      {!isMobile && (
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
      )}
    </div>
  );

  return (
    <FeedLayout
      className={className}
      header={headerContent}
      headerSpacing="sm"
      contentSpacing="sm"
    >
      <div
        data-show-tabs={!!tabsInView && !!hasInitialized}
        className="group/feed-tabs"
      >
        {/* Mobile: Swipeable tabs with content */}
        {isMobile ? (
          <TabsDraggable
            value={feedTab}
            onValueChange={(value) => handleTabChange(value as typeof feedTab)}
            className="flex flex-col"
          >
            <TabsDraggableList
              ref={tabsRef}
              className={cn(
                'mr-auto pt-0 pb-2 opacity-0 transition duration-300 group-data-[show-tabs=false]/feed-tabs:delay-1000',
                'group-data-[show-tabs=false]/feed-tabs:-translate-y-5 group-data-[show-tabs=false]/feed-tabs:opacity-0 group-data-[show-tabs=true]/feed-tabs:translate-y-0 group-data-[show-tabs=true]/feed-tabs:opacity-100'
              )}
              indicatorRailsClassName="bg-transparent backdrop-blur-none h-10 p-0 items-center"
              indicatorClassName="bg-transparent border border-secondary-foreground/50 py-0"
            >
              {availableTabs.map((tab) => (
                <TabsDraggableTrigger
                  key={tab.id}
                  value={tab.id}
                  icon={tab.icon}
                  className="h-fit py-0"
                >
                  {tab.label}
                </TabsDraggableTrigger>
              ))}
            </TabsDraggableList>

            <TabsDraggableContentContainer className="min-h-[400px]">
              {availableTabs.map((tab) => (
                <TabsDraggableContent
                  key={tab.id}
                  value={tab.id}
                  className="items-start"
                >
                  {renderMobileFeedContent(tab.id)}
                </TabsDraggableContent>
              ))}
            </TabsDraggableContentContainer>
          </TabsDraggable>
        ) : /* Desktop: Regular feed content */
        shouldUseCustomEmptyState ? (
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
      </div>
    </FeedLayout>
  );
}
