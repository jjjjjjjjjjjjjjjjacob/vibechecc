import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/tailwind-utils';
// import { VibeCard } from '@/features/vibes/components/vibe-card';
import { VibeCardV2 as VibeCard } from '@/features/vibes/components/vibe-card';
import { JSMasonryLayout, useMasonryLayout } from '@/components/masonry-layout';
import { useIsMobile } from '@/hooks/use-mobile';
import { FeedSignupCta } from '@/features/auth/components/signup-cta';
import {
  useSignupCtaPlacement,
  useAnonymousInteractionTracking,
} from '@/features/auth/hooks/use-signup-cta-placement';
import { useEmojiMetadata, useCreateEmojiRatingMutation } from '@/queries';
import type { Vibe, EmojiRatingMetadata } from '@vibechecc/types';

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
  // Mobile optimization props
  enableFadeIn?: boolean;
  optimizeForTouch?: boolean;
  preferredMobileVariant?:
    | 'mobile-optimized'
    | 'mobile-story'
    | 'mobile-square';
  // Data props to avoid N+1 queries
  onRefetch?: () => void;
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
  enableFadeIn = false,
  optimizeForTouch = true,
  preferredMobileVariant = 'mobile-optimized',
  onRefetch,
}: MasonryFeedProps) {
  const shouldUseMasonry = useMasonryLayout();
  const isMobile = useIsMobile();
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Fetch emoji metadata once for entire feed
  const { data: emojiMetadataArray } = useEmojiMetadata();
  const createEmojiRatingMutation = useCreateEmojiRatingMutation();

  // Convert emoji metadata array to record
  const emojiMetadata = React.useMemo(() => {
    if (!emojiMetadataArray) return {};
    return emojiMetadataArray.reduce(
      (
        acc: Record<string, EmojiRatingMetadata>,
        metadata: EmojiRatingMetadata
      ) => {
        acc[metadata.emoji] = metadata;
        return acc;
      },
      {}
    );
  }, [emojiMetadataArray]);

  // Handle emoji rating at feed level
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEmojiRating = React.useCallback(
    async (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data: {
        emoji: string;
        value: number;
        review: string;
        tags?: string[];
      }
    ) => {
      // This would need the vibeId, so we'll pass this function to the cards
      // The actual implementation will be in the card components
      throw new Error('This should be handled by individual cards');
    },

    []
  );

  // CTA placement hooks
  const {
    shouldShowFeedCta,
    isAuthenticated,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    vibesViewed,
  } = useSignupCtaPlacement({
    feedThreshold: 3,
    enableFeedCta: variant === 'feed', // Only show on main feed
  });
  const { trackVibeView } = useAnonymousInteractionTracking();

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

  // Create vibes array with CTAs injected at strategic positions
  const vibesWithCtas = React.useMemo(() => {
    if (isAuthenticated || variant !== 'feed') {
      return vibes;
    }

    const result: (Vibe | { type: 'cta'; id: string; index: number })[] = [];

    vibes.forEach((vibe, index) => {
      result.push(vibe);

      // Add CTA after viewing 3rd, 7th, 15th vibe, etc.
      const ctaPositions = [2, 6, 14, 25, 40]; // 0-indexed positions
      if (ctaPositions.includes(index) && shouldShowFeedCta(index + 1)) {
        result.push({
          type: 'cta',
          id: `feed-cta-${index}`,
          index: index + 1,
        });
      }
    });

    return result;
  }, [vibes, isAuthenticated, variant, shouldShowFeedCta]);

  // Track vibe views for anonymous users
  React.useEffect(() => {
    if (!isAuthenticated && vibes.length > 0) {
      vibes.forEach((vibe) => {
        trackVibeView(vibe.id);
      });
    }
  }, [vibes, isAuthenticated, trackVibeView]);

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
        <FeedSkeleton
          useMasonry={shouldUseMasonry}
          variant={variant}
          isMobile={isMobile}
          preferredMobileVariant={preferredMobileVariant}
        />
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

        {/* Empty State CTA for unauthenticated users */}
        {!isAuthenticated && variant === 'feed' && (
          <div className="mt-8">
            <FeedSignupCta
              vibesViewed={0}
              className="animate-fade-in-up mx-auto max-w-md"
            />
          </div>
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
            sm: (() => {
              // Mobile variants prefer single column for better UX
              if (
                isMobile &&
                (preferredMobileVariant === 'mobile-story' ||
                  preferredMobileVariant === 'mobile-square')
              ) {
                return 1;
              }
              return variant === 'search' ? 2 : 1;
            })(),
            md: variant === 'search' ? 3 : 2,
            lg: variant === 'search' ? 4 : 3,
            xl: variant === 'search' ? 5 : 4,
          }}
          gap={
            isMobile && preferredMobileVariant === 'mobile-story'
              ? '12px'
              : '12px'
          }
          className="w-full"
        >
          {vibesWithCtas.map((item, index) => {
            if ('type' in item && item.type === 'cta') {
              return (
                <FeedSignupCta
                  key={item.id}
                  vibesViewed={item.index}
                  className="animate-fade-in-up"
                />
              );
            }

            const vibe = item as Vibe;
            return (
              <VibeCard
                key={vibe.id}
                vibe={vibe}
                variant={getVibeCardVariant()}
                ratingDisplayMode={ratingDisplayMode}
                enableFadeIn={enableFadeIn}
                optimizeForTouch={optimizeForTouch}
                delay={enableFadeIn ? index * 50 : 0}
                emojiMetadata={emojiMetadata}
                currentUserRatings={vibe.currentUserRatings}
                onEmojiRating={async (data) => {
                  await createEmojiRatingMutation.mutateAsync({
                    vibeId: vibe.id,
                    emoji: data.emoji,
                    value: data.value,
                    review: data.review,
                  });
                  onRefetch?.();
                }}
              />
            );
          })}
        </JSMasonryLayout>
      ) : (
        // Mobile single column layout
        <div
          className={cn(
            // Adjust spacing based on mobile variant
            preferredMobileVariant === 'mobile-story'
              ? 'space-y-2'
              : 'space-y-2',
            // Center mobile-story cards
            preferredMobileVariant === 'mobile-story' &&
              'flex flex-col items-center'
          )}
        >
          {vibesWithCtas.map((item, index) => {
            if ('type' in item && item.type === 'cta') {
              return (
                <FeedSignupCta
                  key={item.id}
                  vibesViewed={item.index}
                  className="animate-fade-in-up"
                />
              );
            }

            const vibe = item as Vibe;
            return (
              <VibeCard
                key={vibe.id}
                vibe={vibe}
                variant={getVibeCardVariant()}
                ratingDisplayMode={ratingDisplayMode}
                enableFadeIn={enableFadeIn}
                optimizeForTouch={optimizeForTouch}
                delay={enableFadeIn ? index * 100 : 0}
                emojiMetadata={emojiMetadata}
                currentUserRatings={vibe.currentUserRatings}
                onEmojiRating={async (data) => {
                  await createEmojiRatingMutation.mutateAsync({
                    vibeId: vibe.id,
                    emoji: data.emoji,
                    value: data.value,
                    review: data.review,
                  });
                  onRefetch?.();
                }}
              />
            );
          })}
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
  isMobile = false,
  preferredMobileVariant = 'mobile-optimized',
}: {
  useMasonry: boolean;
  variant?: 'feed' | 'search' | 'category';
  isMobile?: boolean;
  preferredMobileVariant?:
    | 'mobile-optimized'
    | 'mobile-story'
    | 'mobile-square';
}) {
  const skeletonCount = variant === 'search' ? 15 : 12;

  // Determine aspect ratio based on mobile variant
  const getAspectRatio = () => {
    if (isMobile) {
      switch (preferredMobileVariant) {
        case 'mobile-story':
          return 'aspect-[9/16]';
        case 'mobile-square':
          return 'aspect-square';
        case 'mobile-optimized':
          return 'aspect-[4/5]';
        default:
          return 'aspect-[4/5]';
      }
    }
    return useMasonry ? 'aspect-[3/4]' : 'aspect-video';
  };

  const skeletons = Array.from({ length: skeletonCount }, (_, i) => (
    <Card
      key={i}
      className={cn(
        'overflow-hidden',
        isMobile &&
          preferredMobileVariant === 'mobile-story' &&
          'mx-auto max-w-sm'
      )}
    >
      <Skeleton className={cn('w-full', getAspectRatio())} />
      <div
        className={cn(
          'space-y-3 p-4',
          preferredMobileVariant === 'mobile-story' &&
            'absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 text-white'
        )}
      >
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
      <JSMasonryLayout columns={columns} gap="12px" className="w-full">
        {skeletons}
      </JSMasonryLayout>
    );
  }

  return <div className="space-y-5">{skeletons}</div>;
}
