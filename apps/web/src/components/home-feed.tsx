import * as React from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { MasonryFeed } from '@/components/masonry-feed';
import { cn } from '@/utils/tailwind-utils';
import {
  useVibesPaginated,
  useTopRatedVibes,
  usePersonalizedVibes,
} from '@/queries';
import type { Vibe } from '@/types';
import { Flame, Sparkles, Clock, TrendingUp } from 'lucide-react';

type FeedTab = 'for-you' | 'hot' | 'new';

interface HomeFeedProps {
  className?: string;
}

export function HomeFeed({ className }: HomeFeedProps) {
  const [activeTab, setActiveTab] = React.useState<FeedTab>('for-you');
  const [cursors, setCursors] = React.useState<
    Record<FeedTab, string | undefined>
  >({
    'for-you': undefined,
    hot: undefined,
    new: undefined,
  });
  const [accumulatedVibes, setAccumulatedVibes] = React.useState<
    Record<FeedTab, Vibe[]>
  >({
    'for-you': [],
    hot: [],
    new: [],
  });
  const { user } = useUser();
  // Remove shouldUseMasonry since it's handled in MasonryFeed

  // Feed queries based on tab
  const forYouQuery = usePersonalizedVibes(user?.id, {
    enabled: activeTab === 'for-you' && !!user?.id,
    limit: 20,
    cursor: cursors['for-you'],
  });

  const hotQuery = useTopRatedVibes(20, {
    enabled: activeTab === 'hot',
    cursor: cursors['hot'],
  });

  const newQuery = useVibesPaginated(20, {
    enabled: activeTab === 'new',
    cursor: cursors['new'],
  });

  // Get current data based on active tab
  const getCurrentData = (): {
    vibes: Vibe[] | undefined;
    isLoading: boolean;
    error: Error | null;
    hasMore: boolean;
  } => {
    const accumulated = accumulatedVibes[activeTab];

    switch (activeTab) {
      case 'for-you':
        return {
          vibes: accumulated.length > 0 ? accumulated : forYouQuery.data?.vibes,
          isLoading: forYouQuery.isLoading,
          error: forYouQuery.error,
          hasMore: forYouQuery.data?.isDone === false,
        };
      case 'hot':
        return {
          vibes: accumulated.length > 0 ? accumulated : hotQuery.data?.vibes,
          isLoading: hotQuery.isLoading,
          error: hotQuery.error,
          hasMore: hotQuery.data?.isDone === false,
        };
      case 'new':
        return {
          vibes: accumulated.length > 0 ? accumulated : newQuery.data?.vibes,
          isLoading: newQuery.isLoading,
          error: newQuery.error,
          hasMore: newQuery.data?.isDone === false,
        };
    }
  };

  const { vibes, isLoading, error, hasMore } = getCurrentData();

  // Accumulate vibes for infinite scroll for all tabs
  React.useEffect(() => {
    const currentQuery =
      activeTab === 'for-you'
        ? forYouQuery
        : activeTab === 'hot'
          ? hotQuery
          : newQuery;
    const currentCursor = cursors[activeTab];

    if (currentQuery.data?.vibes) {
      setAccumulatedVibes((prev) => {
        if (!currentCursor) {
          // First load - replace accumulated vibes for this tab
          return { ...prev, [activeTab]: currentQuery.data.vibes };
        } else {
          // Subsequent loads - append to accumulated vibes for this tab
          const existingIds = new Set(prev[activeTab].map((v) => v.id));
          const newVibes = currentQuery.data.vibes.filter(
            (v) => !existingIds.has(v.id)
          );
          return { ...prev, [activeTab]: [...prev[activeTab], ...newVibes] };
        }
      });
    }
  }, [activeTab, forYouQuery.data, hotQuery.data, newQuery.data, cursors]);

  // Handle tab change
  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
  };

  // Load more function for intersection observer
  const loadMore = React.useCallback(() => {
    if (!hasMore || isLoading) return;

    const currentQuery =
      activeTab === 'for-you'
        ? forYouQuery
        : activeTab === 'hot'
          ? hotQuery
          : newQuery;
    if (currentQuery.data?.continueCursor) {
      setCursors((prev) => ({
        ...prev,
        [activeTab]: currentQuery.data.continueCursor,
      }));
    }
  }, [
    activeTab,
    hasMore,
    isLoading,
    forYouQuery.data?.continueCursor,
    hotQuery.data?.continueCursor,
    newQuery.data?.continueCursor,
  ]);

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
  ];

  // Show "For You" only if user is authenticated, otherwise default to "Hot"
  const availableTabs = user?.id
    ? feedTabs
    : feedTabs.filter((tab) => !tab.requiresAuth);

  // Intersection observer for infinite scroll
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreElement);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  React.useEffect(() => {
    // If user is not authenticated and on "for-you", switch to "hot"
    if (!user?.id && activeTab === 'for-you') {
      setActiveTab('hot');
    }
  }, [user?.id, activeTab]);

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
        vibes={vibes || []}
        isLoading={
          isLoading &&
          (!cursors[activeTab] || accumulatedVibes[activeTab].length === 0)
        }
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        ratingDisplayMode={activeTab === 'hot' ? 'top-rated' : 'most-rated'}
        variant="feed"
        emptyStateTitle={
          {
            'for-you': 'your personalized feed is empty',
            hot: 'no hot vibes right now',
            new: 'no new vibes yet',
          }[activeTab] || 'no vibes found'
        }
        emptyStateDescription={
          {
            'for-you':
              'start rating and interacting with vibes to get personalized recommendations!',
            hot: 'be the first to create and rate vibes to get the community started!',
            new: 'be the first to share something amazing with the community!',
          }[activeTab] || 'try refreshing the page'
        }
        emptyStateAction={
          <div className="flex justify-center gap-3">
            <Button asChild>
              <a href="/vibes/create">
                {{
                  'for-you': 'explore hot vibes',
                  hot: 'create a vibe',
                  new: 'create a vibe',
                }[activeTab] || 'create a vibe'}
              </a>
            </Button>
            {activeTab === 'for-you' && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/?tab=hot')}
              >
                explore hot vibes
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}
