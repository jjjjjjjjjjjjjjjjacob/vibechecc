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
import { Flame, Sparkles, Clock, TrendingUp, Star } from 'lucide-react';
import type { Vibe } from '@viberater/types';

type FeedTab = 'for-you' | 'hot' | 'new' | 'unrated';

interface HomeFeedProps {
  className?: string;
}

export function HomeFeed({ className }: HomeFeedProps) {
  const [activeTab, setActiveTab] = React.useState<FeedTab>('for-you');
  const { user } = useUser();
  const { data: followStats } = useCurrentUserFollowStats();

  // Handle tab change
  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
  };

  // Feed tabs configuration
  const feedTabs = [
    {
      id: 'for-you' as const,
      label: 'for you',
      icon: <Sparkles className="h-4 w-4" />,
      description:
        followStats?.following > 0
          ? `personalized vibes from ${followStats.following} ${followStats.following === 1 ? 'person' : 'people'} you follow`
          : 'discover and follow people to see personalized content',
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
    if (!user?.id && activeTab === 'for-you') {
      setActiveTab('hot');
    }
  }, [user?.id, activeTab]);

  // Get query configuration for current tab
  const getQueryConfig = () => {
    switch (activeTab) {
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
    enabled: queryConfig.enabled && activeTab === 'for-you',
    queryKeyPrefix: ['home-feed', 'for-you'],
  });

  const generalFeedQuery = useVibesInfinite(queryConfig.filters, {
    enabled: queryConfig.enabled && activeTab !== 'for-you',
    queryKeyPrefix: ['home-feed'],
    queryKeyName: activeTab, // Use tab name as safe identifier
  });

  // Use the appropriate query based on the active tab
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = activeTab === 'for-you' ? personalizedFeedQuery : generalFeedQuery;

  // Flatten all pages to get vibes array
  const vibes = React.useMemo(() => {
    if (!data || typeof data !== 'object' || !('pages' in data) || !data.pages)
      return [];
    return (data as { pages: Array<{ vibes?: unknown[] }> }).pages.flatMap(
      (page) => page?.vibes || []
    );
  }, [data]);

  // For "for you" tab, use custom empty state component
  const shouldUseCustomEmptyState =
    activeTab === 'for-you' && vibes.length === 0 && !isLoading;

  // Load more function for intersection observer
  const loadMore = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prepare header content
  const headerContent = (
    <div className="mb-4 flex items-center gap-2">
      <TrendingUp className="text-primary h-5 w-5" />
      <h1 className="text-2xl font-bold">feed</h1>
    </div>
  );

  // Prepare sticky navigation
  const stickyNavigation = [
    {
      id: 'feed-tabs',
      content: (
        <TooltipProvider>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableTabs.map((tab) => (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === tab.id ? 'default' : 'outline'}
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
      ),
    },
  ];

  return (
    <FeedLayout
      className={className}
      header={headerContent}
      stickyNavigation={stickyNavigation}
      headerSpacing="md"
      contentSpacing="sm"
    >
      {/* Feed Content */}
      {shouldUseCustomEmptyState ? (
        <ForYouEmptyState />
      ) : (
        <MasonryFeed
          vibes={vibes as Vibe[]}
          isLoading={isLoading}
          error={error}
          hasMore={hasNextPage}
          onLoadMore={loadMore}
          ratingDisplayMode={activeTab === 'hot' ? 'top-rated' : 'most-rated'}
          variant="feed"
          emptyStateTitle={queryConfig.emptyTitle}
          emptyStateDescription={queryConfig.emptyDescription}
          emptyStateAction={
            activeTab === 'for-you' ? null : queryConfig.emptyAction
          }
        />
      )}
    </FeedLayout>
  );
}
