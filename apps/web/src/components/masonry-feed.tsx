import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/tailwind-utils';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { JSMasonryLayout, useMasonryLayout } from '@/components/masonry-layout';
import type { Vibe } from '@/types';

interface MasonryFeedProps {
  vibes: Vibe[];
  isLoading?: boolean;
  error?: Error | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  ratingDisplayMode?: 'most-rated' | 'top-rated';
  variant?: 'feed' | 'search' | 'category';
  queriedEmojis?: string[];
  className?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
  showLoadMoreTarget?: boolean;
}

export function MasonryFeed({
  vibes,
  isLoading = false,
  error,
  hasMore = false,
  onLoadMore,
  ratingDisplayMode = 'most-rated',
  variant = 'feed',
  queriedEmojis: _queriedEmojis,
  className,
  emptyStateTitle = 'no vibes found',
  emptyStateDescription = 'try adjusting your filters or check back later',
  emptyStateAction,
  showLoadMoreTarget = true,
}: MasonryFeedProps) {
  const shouldUseMasonry = useMasonryLayout();
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement || !hasMore || !onLoadMore || !showLoadMoreTarget)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreElement);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, showLoadMoreTarget]);

  // Get vibe card variant based on feed variant
  const getVibeCardVariant = () => {
    if (variant === 'search') {
      return shouldUseMasonry ? 'feed-masonry' : 'feed-single';
    }
    if (variant === 'category') {
      return shouldUseMasonry ? 'feed-masonry' : 'feed-single';
    }
    return shouldUseMasonry ? 'feed-masonry' : 'feed-single';
  };

  // Error state
  if (error) {
    return (
      <div className={cn('py-12 text-center', className)}>
        <p className="text-muted-foreground mb-4">failed to load vibes</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary hover:text-primary/80 text-sm underline"
        >
          try again
        </button>
      </div>
    );
  }

  // Loading state (initial load)
  if (isLoading && vibes.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <FeedSkeleton useMasonry={shouldUseMasonry} variant={variant} />
      </div>
    );
  }

  // Empty state
  if (vibes.length === 0) {
    return (
      <div className={cn('py-16 text-center', className)}>
        <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <span className="text-muted-foreground text-2xl">🔍</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold">{emptyStateTitle}</h3>
        <p className="text-muted-foreground mx-auto mb-6 max-w-md">
          {emptyStateDescription}
        </p>
        {emptyStateAction && (
          <div className="flex justify-center">{emptyStateAction}</div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Feed Grid */}
      {shouldUseMasonry ? (
        // Desktop masonry layout
        <JSMasonryLayout
          columns={{
            default: 1,
            sm: variant === 'search' ? 2 : 1,
            md: variant === 'search' ? 3 : 2,
            lg: variant === 'search' ? 4 : 3,
            xl: variant === 'search' ? 5 : 4,
          }}
          gap="20px"
          className="w-full"
        >
          {vibes.map((vibe) => (
            <VibeCard
              key={vibe.id}
              vibe={vibe}
              variant={getVibeCardVariant()}
              ratingDisplayMode={ratingDisplayMode}
            />
          ))}
        </JSMasonryLayout>
      ) : (
        // Mobile single column layout
        <div className="space-y-5">
          {vibes.map((vibe) => (
            <VibeCard
              key={vibe.id}
              vibe={vibe}
              variant={getVibeCardVariant()}
              ratingDisplayMode={ratingDisplayMode}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll target */}
      {hasMore && showLoadMoreTarget && (
        <div ref={loadMoreRef} className="pt-6 text-center">
          {isLoading && (
            <div className="flex items-center justify-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-muted-foreground">loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Loading skeleton component
function FeedSkeleton({
  useMasonry,
  variant = 'feed',
}: {
  useMasonry: boolean;
  variant?: 'feed' | 'search' | 'category';
}) {
  const skeletonCount = variant === 'search' ? 15 : 12;
  const skeletons = Array.from({ length: skeletonCount }, (_, i) => (
    <Card key={i} className="overflow-hidden">
      <Skeleton
        className={cn('w-full', useMasonry ? 'aspect-[3/4]' : 'aspect-video')}
      />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </Card>
  ));

  if (useMasonry) {
    const columns =
      variant === 'search'
        ? { default: 1, sm: 2, md: 3, lg: 4, xl: 5 }
        : { default: 1, sm: 2, md: 2, lg: 3, xl: 4 };

    return (
      <JSMasonryLayout columns={columns} gap="20px" className="w-full">
        {skeletons}
      </JSMasonryLayout>
    );
  }

  return <div className="space-y-5">{skeletons}</div>;
}
