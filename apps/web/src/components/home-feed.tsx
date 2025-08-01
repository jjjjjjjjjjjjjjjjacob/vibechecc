import * as React from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { MasonryFeed } from '@/components/masonry-feed';
import { cn } from '@/utils/tailwind-utils';
import { useVibesInfinite } from '@/queries';
import { Flame, Sparkles, Clock, TrendingUp, Star } from 'lucide-react';

type FeedTab = 'for-you' | 'hot' | 'new' | 'unrated';

interface HomeFeedProps {
  className?: string;
}

export function HomeFeed({ className }: HomeFeedProps) {
  const [activeTab, setActiveTab] = React.useState<FeedTab>('for-you');
  const { user } = useUser();

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
      description: 'personalized based on your interactions',
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
          filters: { sort: 'top_rated' as const, limit: 20 }, // For now, fallback to top-rated
          enabled: !!user?.id,
          emptyTitle: 'your personalized feed is empty',
          emptyDescription:
            'start rating and interacting with vibes to get personalized recommendations!',
          emptyAction: (
            <div className="flex justify-center gap-3">
              <Button asChild>
                <a href="/?tab=hot">explore hot vibes</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/vibes/create">create a vibe</a>
              </Button>
            </div>
          ),
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
  // Use the generalized infinite query hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useVibesInfinite(queryConfig.filters, {
    enabled: queryConfig.enabled,
    queryKeyPrefix: ['home-feed'],
    queryKeyName: activeTab, // Use tab name as safe identifier
  });

  // Flatten all pages to get vibes array
  const vibes = React.useMemo(() => {
    return (
      data?.pages.flatMap((page: { vibes: unknown[] }) => page.vibes) || []
    );
  }, [data]);

  // Load more function for intersection observer
  const loadMore = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className={cn('w-full', className)}>
      {/* Feed Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="text-primary h-5 w-5" />
          <h1 className="text-2xl font-bold">feed</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab Description */}
          <p className="text-muted-foreground text-sm">
            {availableTabs.find((tab) => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Feed Content */}
      <MasonryFeed
        vibes={vibes}
        isLoading={isLoading}
        error={error}
        hasMore={hasNextPage}
        onLoadMore={loadMore}
        ratingDisplayMode={activeTab === 'hot' ? 'top-rated' : 'most-rated'}
        variant="feed"
        emptyStateTitle={queryConfig.emptyTitle}
        emptyStateDescription={queryConfig.emptyDescription}
        emptyStateAction={queryConfig.emptyAction}
      />
    </div>
  );
}
