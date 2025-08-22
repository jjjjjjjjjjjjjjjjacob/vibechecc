import * as React from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/tailwind-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SimpleVibePlaceholder } from './simple-vibe-placeholder';
import { useUser } from '@clerk/tanstack-react-start';
import { trackEvents } from '@/lib/track-events';
import { Badge } from '@/components/ui/badge';
import {
  useTopEmojiRatings,
  useMostInteractedEmoji,
  useCreateEmojiRatingMutation,
  useEmojiMetadata,
} from '@/queries';
import toast from '@/utils/toast';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import type { Vibe } from '@vibechecc/types';
import type { RatingDisplayMode } from '@/components/vibe-category-row';
import { RatingPopover } from '@/features/ratings/components/rating-popover';
import { AuthPromptDialog } from '@/features/auth';
import { EmojiRatingDisplayPopover } from '@/features/ratings/components/emoji-rating-display-popover';
import { EmojiRatingCycleDisplay } from '@/features/ratings/components/emoji-rating-cycle-display';
import { EmojiReactions } from '@/features/ratings/components/emoji-reaction';
import { useVibeImageUrl } from '@/hooks/use-vibe-image-url';
import { ShareButton } from '@/components/social/share-button';
import {
  BoostIndicator,
  HighBoostIndicator,
} from '@/components/boost-indicator';

type VibeCardVariant =
  | 'default'
  | 'compact'
  | 'feed-grid'
  | 'feed-masonry'
  | 'feed-single'
  | 'list'
  | 'search-result'
  | 'mobile-story'
  | 'mobile-square'
  | 'mobile-optimized';

interface VibeCardProps {
  vibe?: Vibe;
  variant?: VibeCardVariant;
  ratingDisplayMode?: RatingDisplayMode;
  className?: string;
  delay?: number;
  loading?: boolean;
  // Mobile optimization props
  enableFadeIn?: boolean;
  optimizeForTouch?: boolean;
  // Legacy props for backward compatibility
  compact?: boolean;
  layout?: 'masonry' | 'grid' | 'single';
}

export function VibeCard({
  vibe,
  variant = 'default',
  ratingDisplayMode = 'most-rated',
  className,
  delay = 0,
  loading = false,
  enableFadeIn = false,
  optimizeForTouch = false,
  // Legacy prop support
  compact,
  layout,
}: VibeCardProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  // Get image URL (handles both legacy URLs and storage IDs)
  const { data: imageUrl, isLoading: isImageLoading } = useVibeImageUrl(
    vibe || {}
  );

  // Extract feed type from URL for analytics
  const feedType = React.useMemo(() => {
    const path = location.pathname.split('/');
    if (path[1] === 'feed' && path[2]) {
      return path[2];
    }
    return undefined;
  }, [location.pathname]);

  // Card expansion state with localStorage persistence
  const [isExpanded, setIsExpanded] = React.useState(() => {
    if (!vibe) return false;
    try {
      const stored = localStorage.getItem('expandedVibes');
      if (stored) {
        const expandedVibes = JSON.parse(stored);
        return !!expandedVibes[vibe.id];
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return false;
  });

  // Track if this card has been clicked once (for click-to-expand)
  const [hasBeenClicked, setHasBeenClicked] = React.useState(false);

  // Save expansion state to localStorage
  const saveExpansionState = React.useCallback(
    (vibeId: string, expanded: boolean) => {
      try {
        const stored = localStorage.getItem('expandedVibes');
        const expandedVibes = stored ? JSON.parse(stored) : {};

        if (expanded) {
          expandedVibes[vibeId] = Date.now();
        } else {
          delete expandedVibes[vibeId];
        }

        localStorage.setItem('expandedVibes', JSON.stringify(expandedVibes));
      } catch (e) {
        // Ignore localStorage errors
      }
    },
    []
  );

  // Handle card click - first click expands, second click navigates
  const handleCardClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (!vibe) return;

      // Don't handle clicks on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (!isExpanded && !hasBeenClicked) {
        // First click - expand the card
        setIsExpanded(true);
        setHasBeenClicked(true);
        saveExpansionState(vibe.id, true);

        // Track PostHog event
        trackEvents.vibeCardExpanded({
          vibeId: vibe.id,
          feedType,
          vibeTitle: vibe.title,
          hasImage: !!imageUrl,
          timestamp: Date.now(),
        });
      } else if (isExpanded) {
        // Second click - navigate to detail page
        trackEvents.vibeViewed(vibe.id);
        navigate({ to: '/vibes/$vibeId', params: { vibeId: vibe.id } });
      }
    },
    [
      vibe,
      isExpanded,
      hasBeenClicked,
      imageUrl,
      feedType,
      navigate,
      saveExpansionState,
    ]
  );

  const finalVariant = React.useMemo(() => {
    // Auto-select mobile variants when on mobile and no specific variant is set
    if (variant === 'default' && isMobile) {
      return 'mobile-optimized';
    }

    // If new variant prop is provided, use it
    if (variant !== 'default') return variant;

    // Handle legacy props
    if (compact) return 'compact';
    if (layout === 'masonry') return 'feed-masonry';
    if (layout === 'grid') return 'feed-grid';
    if (layout === 'single') return 'feed-single';

    return 'default';
  }, [variant, compact, layout, isMobile]);
  const [imageError, setImageError] = React.useState(false);
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [preselectedRatingValue, setPreselectedRatingValue] = React.useState<
    number | null
  >(null);
  const [showRatingPopover, setShowRatingPopover] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(!enableFadeIn);
  const { user } = useUser();
  const createEmojiRatingMutation = useCreateEmojiRatingMutation();
  const { data: emojiMetadataArray } = useEmojiMetadata();

  // Fade-in animation effect
  React.useEffect(() => {
    if (enableFadeIn && delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [enableFadeIn, delay]);

  // Fetch emoji rating data - get all unique emoji reactions for this vibe
  const { data: topEmojiRatings, isLoading: isTopEmojiRatingsLoading } =
    useTopEmojiRatings(vibe?.id || '', 20);
  const {
    data: mostInteractedEmojiData,
    isLoading: isMostInteractedEmojiLoading,
  } = useMostInteractedEmoji(vibe?.id || '');

  // Determine if we should use a placeholder
  const usePlaceholder = !imageUrl || imageError || isImageLoading;

  // Determine if ratings are loading
  const isRatingsLoading =
    isTopEmojiRatingsLoading || isMostInteractedEmojiLoading;

  // Transform backend emoji ratings to display format
  const emojiRatings = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) {
      return [];
    }

    return topEmojiRatings.map((rating) => ({
      emoji: rating.emoji,
      value: rating.averageValue,
      count: rating.count,
      tags: rating.tags,
    }));
  }, [topEmojiRatings]);

  // Use backend data for primary emoji display based on rating mode
  const primaryEmojiRating = React.useMemo(() => {
    if (
      ratingDisplayMode === 'top-rated' &&
      topEmojiRatings &&
      topEmojiRatings.length > 0
    ) {
      // Find the highest rated emoji (by average value)
      const topRated = topEmojiRatings.reduce((max, current) =>
        current.averageValue > max.averageValue ? current : max
      );
      return {
        emoji: topRated.emoji,
        value: topRated.averageValue,
        count: topRated.count,
      };
    } else if (
      mostInteractedEmojiData &&
      mostInteractedEmojiData.averageValue
    ) {
      // Default to most-rated (most interactions)
      return {
        emoji: mostInteractedEmojiData.emoji,
        value: mostInteractedEmojiData.averageValue,
        count: mostInteractedEmojiData.count,
      };
    }
    return null;
  }, [ratingDisplayMode, topEmojiRatings, mostInteractedEmojiData]);

  // Transform emoji ratings to reaction format for UI
  const emojiReactions = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) {
      return [];
    }

    // Determine max reactions based on variant
    const maxReactions = (() => {
      switch (finalVariant) {
        case 'compact':
          return 6;
        case 'feed-masonry':
        case 'feed-single':
          return 12;
        case 'feed-grid':
          return 8;
        case 'mobile-story':
        case 'mobile-square':
        case 'mobile-optimized':
          return 8;
        default:
          return 10;
      }
    })();

    return topEmojiRatings.slice(0, maxReactions).map((rating) => ({
      emoji: rating.emoji,
      count: rating.count,
      users: [], // We don't track individual users in the new system
    }));
  }, [topEmojiRatings, finalVariant]);

  // Convert emoji metadata array to record for easier lookup
  const emojiMetadataRecord = React.useMemo(() => {
    if (!emojiMetadataArray) return {};
    return emojiMetadataArray.reduce(
      (acc, metadata) => {
        acc[metadata.emoji] = metadata;
        return acc;
      },
      {} as Record<string, (typeof emojiMetadataArray)[0]>
    );
  }, [emojiMetadataArray]);

  // Handle emoji rating submission
  const handleEmojiRating = async (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    if (!vibe) return;

    await createEmojiRatingMutation.mutateAsync({
      vibeId: vibe.id,
      emoji: data.emoji,
      value: data.value,
      review: data.review,
    });

    toast.success(`vibe rated ${data.value} ${data.emoji}! review submitted.`, {
      duration: 3000,
      icon: data.emoji,
    });
  };

  const handleEmojiRatingClick = (emoji: string, value?: number) => {
    if (!user?.id) {
      setShowAuthDialog(true);
      return;
    }

    setSelectedEmojiForRating(emoji);

    // If a specific value was provided, store it for the popover
    if (value !== undefined) {
      setPreselectedRatingValue(value);
    }

    setShowRatingPopover(true);
  };

  const handleQuickReact = async (emoji: string) => {
    // Always open the emoji rating popover instead of quick reacting
    handleEmojiRatingClick(emoji, undefined);
  };

  // Skeleton component for rating section
  const RatingSkeleton = () => (
    <div className="w-full space-y-3">
      {/* Primary rating display skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Emoji reactions skeleton */}
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: finalVariant === 'compact' ? 4 : 6 }).map(
          (_, i) => (
            <Skeleton key={i} className="h-6 w-12 rounded-full" />
          )
        )}
      </div>
    </div>
  );

  // Search result variant implementation
  if (finalVariant === 'search-result') {
    // Show skeleton if loading
    if (loading) {
      return (
        <Card className="bg-card/30 border-border/50 flex w-full overflow-hidden">
          <CardContent className="w-full p-0">
            <div className="flex gap-4 p-4">
              <div className="relative flex w-1/2 overflow-hidden rounded-lg">
                <Skeleton className="h-full w-full md:aspect-[4/3]" />
              </div>
              <div className="flex w-1/2 flex-col">
                <div className="flex min-w-0 flex-[1] flex-col justify-between">
                  <div>
                    <Skeleton className="mb-2 h-5 w-full" />
                    <Skeleton className="mb-1 h-4 w-24" />
                    <Skeleton className="mb-3 h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                <div className="flex w-full min-w-0 flex-[1] flex-col justify-between">
                  <div>
                    <Skeleton className="mb-2 h-5 w-full" />
                    <Skeleton className="mb-1 h-4 w-24" />
                    <Skeleton className="mb-3 h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!vibe) return null;

    return (
      <>
        <Card className="bg-card/30 border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex gap-4 p-4">
              {/* Image - Takes up 2/3 of the card */}
              <Link
                to="/vibes/$vibeId"
                params={{ vibeId: vibe.id }}
                onClick={() => trackEvents.vibeViewed(vibe.id)}
                className="relative flex-1 overflow-hidden rounded-lg"
              >
                <div className="h-full w-full md:aspect-[4/3]">
                  {usePlaceholder ? (
                    <SimpleVibePlaceholder
                      title={vibe.title}
                      className="h-full w-full"
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt={vibe.title}
                      className="h-full w-full object-cover transition-transform duration-200 will-change-transform hover:scale-[1.02]"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              </Link>

              {/* Content - Takes up 1/3 of the card */}
              <div className="flex min-w-0 flex-[1] flex-col justify-between">
                <Link
                  to="/vibes/$vibeId"
                  params={{ vibeId: vibe.id }}
                  onClick={() => trackEvents.vibeViewed(vibe.id)}
                  className="block min-w-0"
                >
                  <div className="mb-2">
                    <h3 className="hover:text-foreground/80 line-clamp-2 text-base leading-tight font-semibold transition-colors">
                      {vibe.title}
                    </h3>
                    {vibe.createdBy && (
                      <span className="text-muted-foreground mt-1 block text-sm">
                        @{vibe.createdBy.username || vibe.createdBy.full_name}
                      </span>
                    )}
                  </div>

                  {vibe.description && (
                    <p className="text-muted-foreground mb-3 line-clamp-2 text-sm leading-relaxed">
                      {vibe.description}
                    </p>
                  )}
                </Link>

                {/* Bottom section with ratings and tags */}
                <div className="mt-auto space-y-2">
                  {/* Emoji Ratings - Using EmojiRatingDisplayPopover like vibe-card */}
                  {primaryEmojiRating ? (
                    <EmojiRatingDisplayPopover
                      rating={primaryEmojiRating}
                      allRatings={emojiRatings}
                      onEmojiClick={handleEmojiRatingClick}
                      vibeId={vibe.id}
                      size="sm"
                    />
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      no ratings yet
                    </div>
                  )}

                  {/* Tags, Boost Indicator, and Share Button */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Tags and Boost Indicator */}
                    <div className="flex flex-1 flex-wrap items-center gap-1">
                      {vibe.tags && vibe.tags.length > 0 ? (
                        vibe.tags.slice(0, 3).map((tag) => (
                          <Link
                            key={tag}
                            to="/search"
                            search={{ tags: [tag] }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge
                              variant="outline"
                              className="hover:bg-secondary/80 cursor-pointer text-xs transition-colors"
                            >
                              #{tag}
                            </Badge>
                          </Link>
                        ))
                      ) : (
                        <div className="flex-1" />
                      )}

                      {/* Boost Score Indicator */}
                      {(vibe.boostScore !== undefined &&
                        vibe.boostScore !== 0) ||
                      (vibe.totalBoosts !== undefined &&
                        vibe.totalBoosts > 0) ||
                      (vibe.totalDampens !== undefined &&
                        vibe.totalDampens > 0) ? (
                        <>
                          {/* High boost special indicator for scores >= 10 */}
                          {vibe.boostScore !== undefined &&
                          vibe.boostScore >= 10 ? (
                            <HighBoostIndicator
                              boostScore={vibe.boostScore}
                              className="ml-1"
                            />
                          ) : (
                            <BoostIndicator
                              boostScore={vibe.boostScore}
                              totalBoosts={vibe.totalBoosts}
                              totalDampens={vibe.totalDampens}
                              size="sm"
                              className="ml-1"
                            />
                          )}
                        </>
                      ) : null}
                    </div>

                    {/* Share Button */}
                    <ShareButton
                      contentType="vibe"
                      variant="ghost"
                      size="sm"
                      showCount={vibe.shareCount ? true : false}
                      currentShareCount={vibe.shareCount}
                      vibe={vibe}
                      author={vibe.createdBy || undefined}
                      ratings={
                        topEmojiRatings?.map((r) => ({
                          emoji: r.emoji,
                          value: r.averageValue,
                          tags: r.tags || [],
                          count: r.count,
                        })) || undefined
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden Emoji Rating Popover */}
        <RatingPopover
          open={showRatingPopover}
          onOpenChange={(open) => {
            setShowRatingPopover(open);
            if (!open) {
              setSelectedEmojiForRating(null);
              setPreselectedRatingValue(null);
            }
          }}
          onSubmit={handleEmojiRating}
          isSubmitting={createEmojiRatingMutation.isPending}
          vibeTitle={vibe.title}
          emojiMetadata={emojiMetadataRecord}
          preSelectedEmoji={selectedEmojiForRating || undefined}
          preSelectedValue={preselectedRatingValue || undefined}
        >
          <div style={{ display: 'none' }} />
        </RatingPopover>

        {/* Auth Prompt Dialog */}
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate vibes"
          description="join vibechecc to share your reactions and ratings with the community"
        />
      </>
    );
  }

  // List variant implementation
  if (finalVariant === 'list') {
    // Show skeleton if loading
    if (loading) {
      return (
        <div
          className={cn(
            'bg-muted/30 relative block w-full overflow-hidden rounded-lg shadow-sm',
            'min-h-[6rem] sm:min-h-[7rem]',
            className
          )}
        >
          {/* Background layer to match actual card */}
          <div className="from-muted/50 to-muted/30 absolute inset-0 bg-gradient-to-r" />

          {/* Content - matching actual component structure */}
          <div className="relative z-10 flex h-full min-h-[6rem] items-center justify-between p-4 sm:min-h-[7rem]">
            {/* Left side: Avatar and title */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Right side: Rating display */}
            <div className="ml-4 flex-shrink-0">
              <Skeleton className="h-10 w-20 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    if (!vibe) return null;

    return (
      <>
        <div
          className={cn(
            'group relative overflow-hidden rounded-lg transition-shadow duration-200 will-change-transform hover:shadow-md',
            'h-24 sm:h-28',
            className
          )}
        >
          <Link
            to="/vibes/$vibeId"
            params={{ vibeId: vibe.id }}
            onClick={() => {
              trackEvents.vibeViewed(vibe.id);
            }}
            className="block h-full"
          >
            {/* Background image or placeholder */}
            <div className="absolute inset-0">
              {usePlaceholder ? (
                <SimpleVibePlaceholder
                  title={vibe.title}
                  className="h-full w-full"
                  hideText
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={vibe.title}
                  className="h-full w-full object-cover transition-transform duration-200 will-change-transform group-hover:scale-[1.02]"
                  onError={() => setImageError(true)}
                />
              )}
              {/* Gradient overlay */}
            </div>

            {/* Content overlay */}
            <div className="relative z-10 flex h-full items-center justify-between p-4">
              {/* Left side: Avatar and title */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {vibe.createdBy && (
                  <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-white/20">
                    <AvatarImage
                      src={getUserAvatarUrl(vibe.createdBy)}
                      alt={computeUserDisplayName(vibe.createdBy)}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-background/50 text-xs">
                      {getUserInitials(vibe.createdBy)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-base font-bold text-white sm:text-lg">
                    {vibe.title}
                  </h3>
                  <p className="line-clamp-1 text-sm text-white/70">
                    {vibe.createdBy
                      ? computeUserDisplayName(vibe.createdBy)
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Right side: Rating display */}
              <div className="ml-4 flex-shrink-0">
                {isRatingsLoading ? (
                  <Skeleton className="h-10 w-20 rounded-full bg-white/10" />
                ) : primaryEmojiRating ? (
                  <button
                    className="focus:ring-primary flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm focus:ring-2 focus:outline-none"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEmojiRatingClick(
                        primaryEmojiRating.emoji,
                        primaryEmojiRating.value
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEmojiRatingClick(
                          primaryEmojiRating.emoji,
                          primaryEmojiRating.value
                        );
                      }
                    }}
                    aria-label={`View ${primaryEmojiRating.emoji} rating details`}
                  >
                    <span className="text-lg">{primaryEmojiRating.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {primaryEmojiRating.value.toFixed(1)}
                      </span>
                      <span className="text-xs text-white/50">
                        {primaryEmojiRating.count}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    className="focus:ring-primary rounded-full bg-white/10 px-3 py-2 text-sm text-white/70 backdrop-blur-sm focus:ring-2 focus:outline-none"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user?.id) {
                        setShowAuthDialog(true);
                      } else {
                        setShowRatingPopover(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!user?.id) {
                          setShowAuthDialog(true);
                        } else {
                          setShowRatingPopover(true);
                        }
                      }
                    }}
                    aria-label="Add emoji rating"
                  >
                    rate this
                  </button>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Hidden Emoji Rating Popover */}
        <RatingPopover
          open={showRatingPopover}
          onOpenChange={(open) => {
            setShowRatingPopover(open);
            if (!open) {
              setSelectedEmojiForRating(null);
              setPreselectedRatingValue(null);
            }
          }}
          onSubmit={handleEmojiRating}
          isSubmitting={createEmojiRatingMutation.isPending}
          vibeTitle={vibe.title}
          emojiMetadata={emojiMetadataRecord}
          preSelectedEmoji={selectedEmojiForRating || undefined}
          preSelectedValue={preselectedRatingValue || undefined}
        >
          <div style={{ display: 'none' }} />
        </RatingPopover>

        {/* Auth Prompt Dialog */}
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate vibes"
          description="join vibechecc to share your reactions and ratings with the community"
        />
      </>
    );
  }

  // Mobile Story variant (9:16 aspect ratio for story-like experience)
  if (finalVariant === 'mobile-story') {
    if (loading) {
      return (
        <Card
          className={cn(
            'bg-popover/20 border-border/50 relative overflow-hidden',
            'mx-auto aspect-[9/16] w-full max-w-sm',
            className
          )}
        >
          <Skeleton className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute right-4 bottom-4 left-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      );
    }

    if (!vibe) return null;

    return (
      <>
        <Card
          className={cn(
            'bg-popover/20 border-border/50 relative overflow-hidden transition-all duration-200',
            'group mx-auto aspect-[9/16] w-full max-w-sm cursor-pointer',
            enableFadeIn && !isVisible && 'opacity-0',
            enableFadeIn && isVisible && 'animate-in fade-in duration-300',
            optimizeForTouch &&
              'transform-gpu will-change-transform hover:scale-[1.02]',
            className
          )}
        >
          <Link
            to="/vibes/$vibeId"
            params={{ vibeId: vibe.id }}
            onClick={() => trackEvents.vibeViewed(vibe.id)}
            className="block h-full w-full"
          >
            {/* Background image */}
            <div className="absolute inset-0">
              {usePlaceholder ? (
                <SimpleVibePlaceholder
                  title={vibe.title}
                  className="h-full w-full"
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={vibe.title}
                  className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.05]"
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Avatar in top-left */}
            {vibe.createdBy && (
              <div className="absolute top-4 left-4 z-10">
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <AvatarImage
                    src={getUserAvatarUrl(vibe.createdBy)}
                    alt={computeUserDisplayName(vibe.createdBy)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-background/50 text-sm">
                    {getUserInitials(vibe.createdBy)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Content overlay - positioned at bottom */}
            <div className="absolute right-0 bottom-0 left-0 space-y-3 p-4">
              {/* Title and description */}
              <div className="space-y-2">
                <h3 className="line-clamp-2 text-lg leading-tight font-bold text-white">
                  {vibe.title}
                </h3>
                {vibe.description && (
                  <p className="line-clamp-2 text-sm text-white/80">
                    {vibe.description}
                  </p>
                )}
                <p className="text-sm text-white/60">
                  {vibe.createdBy
                    ? computeUserDisplayName(vibe.createdBy)
                    : 'Unknown'}
                </p>
              </div>

              {/* Rating display */}
              <div className="flex items-center justify-between">
                {primaryEmojiRating ? (
                  <button
                    className={cn(
                      'flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 backdrop-blur-sm transition-colors',
                      optimizeForTouch && 'min-h-[44px] min-w-[44px]'
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEmojiRatingClick(
                        primaryEmojiRating.emoji,
                        primaryEmojiRating.value
                      );
                    }}
                  >
                    <span className="text-lg">{primaryEmojiRating.emoji}</span>
                    <span className="font-medium text-white">
                      {primaryEmojiRating.value.toFixed(1)}
                    </span>
                  </button>
                ) : (
                  <button
                    className={cn(
                      'rounded-full bg-white/15 px-4 py-2 text-sm text-white/80 backdrop-blur-sm',
                      optimizeForTouch && 'min-h-[44px]'
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user?.id) {
                        setShowAuthDialog(true);
                      } else {
                        setShowRatingPopover(true);
                      }
                    }}
                  >
                    rate this
                  </button>
                )}

                <ShareButton
                  contentType="vibe"
                  variant="ghost"
                  size="sm"
                  showCount={false}
                  vibe={vibe}
                  author={vibe.createdBy || undefined}
                  className={cn(
                    'text-white hover:bg-white/20',
                    optimizeForTouch && 'min-h-[44px] min-w-[44px]'
                  )}
                />
              </div>
            </div>
          </Link>
        </Card>

        {/* Hidden popovers */}
        <RatingPopover
          open={showRatingPopover}
          onOpenChange={(open) => {
            setShowRatingPopover(open);
            if (!open) {
              setSelectedEmojiForRating(null);
              setPreselectedRatingValue(null);
            }
          }}
          onSubmit={handleEmojiRating}
          isSubmitting={createEmojiRatingMutation.isPending}
          vibeTitle={vibe.title}
          emojiMetadata={emojiMetadataRecord}
          preSelectedEmoji={selectedEmojiForRating || undefined}
          preSelectedValue={preselectedRatingValue || undefined}
        >
          <div style={{ display: 'none' }} />
        </RatingPopover>

        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate vibes"
          description="join vibechecc to share your reactions and ratings with the community"
        />
      </>
    );
  }

  // Mobile Square variant (1:1 aspect ratio for social media sharing)
  if (finalVariant === 'mobile-square') {
    if (loading) {
      return (
        <Card
          className={cn(
            'bg-popover/20 border-border/50 relative overflow-hidden',
            'aspect-square w-full',
            className
          )}
        >
          <Skeleton className="h-full w-full" />
          <div className="absolute right-4 bottom-4 left-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </Card>
      );
    }

    if (!vibe) return null;

    return (
      <>
        <Card
          className={cn(
            'bg-popover/20 border-border/50 group relative overflow-hidden transition-all duration-200',
            'aspect-square w-full cursor-pointer',
            enableFadeIn && !isVisible && 'opacity-0',
            enableFadeIn && isVisible && 'animate-in fade-in duration-300',
            optimizeForTouch &&
              'transform-gpu will-change-transform hover:scale-[1.02]',
            className
          )}
        >
          <Link
            to="/vibes/$vibeId"
            params={{ vibeId: vibe.id }}
            onClick={() => trackEvents.vibeViewed(vibe.id)}
            className="block h-full w-full"
          >
            {/* Background image */}
            <div className="absolute inset-0">
              {usePlaceholder ? (
                <SimpleVibePlaceholder
                  title={vibe.title}
                  className="h-full w-full"
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={vibe.title}
                  className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.05]"
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Avatar in top-left */}
            {vibe.createdBy && (
              <div className="absolute top-3 left-3 z-10">
                <Avatar className="h-8 w-8 border-2 border-white/30">
                  <AvatarImage
                    src={getUserAvatarUrl(vibe.createdBy)}
                    alt={computeUserDisplayName(vibe.createdBy)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-background/50 text-xs">
                    {getUserInitials(vibe.createdBy)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Content overlay - bottom section */}
            <div className="absolute right-0 bottom-0 left-0 space-y-2 p-3">
              <h3 className="line-clamp-2 text-base leading-tight font-bold text-white">
                {vibe.title}
              </h3>

              <div className="flex items-center justify-between">
                {primaryEmojiRating ? (
                  <button
                    className={cn(
                      'flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm',
                      optimizeForTouch && 'min-h-[44px]'
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEmojiRatingClick(
                        primaryEmojiRating.emoji,
                        primaryEmojiRating.value
                      );
                    }}
                  >
                    <span className="text-sm">{primaryEmojiRating.emoji}</span>
                    <span className="text-sm font-medium text-white">
                      {primaryEmojiRating.value.toFixed(1)}
                    </span>
                  </button>
                ) : (
                  <button
                    className={cn(
                      'rounded-full bg-white/15 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm',
                      optimizeForTouch && 'min-h-[44px]'
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user?.id) {
                        setShowAuthDialog(true);
                      } else {
                        setShowRatingPopover(true);
                      }
                    }}
                  >
                    rate
                  </button>
                )}

                <ShareButton
                  contentType="vibe"
                  variant="ghost"
                  size="sm"
                  showCount={false}
                  vibe={vibe}
                  author={vibe.createdBy || undefined}
                  className={cn(
                    'h-8 w-8 text-white hover:bg-white/20',
                    optimizeForTouch && 'min-h-[44px] min-w-[44px]'
                  )}
                />
              </div>
            </div>
          </Link>
        </Card>

        {/* Hidden popovers */}
        <RatingPopover
          open={showRatingPopover}
          onOpenChange={(open) => {
            setShowRatingPopover(open);
            if (!open) {
              setSelectedEmojiForRating(null);
              setPreselectedRatingValue(null);
            }
          }}
          onSubmit={handleEmojiRating}
          isSubmitting={createEmojiRatingMutation.isPending}
          vibeTitle={vibe.title}
          emojiMetadata={emojiMetadataRecord}
          preSelectedEmoji={selectedEmojiForRating || undefined}
          preSelectedValue={preselectedRatingValue || undefined}
        >
          <div style={{ display: 'none' }} />
        </RatingPopover>

        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate vibes"
          description="join vibechecc to share your reactions and ratings with the community"
        />
      </>
    );
  }

  // Main card variants skeleton (default, feed-masonry, feed-grid, feed-single, compact, mobile-optimized)
  if (loading) {
    return (
      <Card
        className={cn(
          'bg-popover/20 border-border/50 relative overflow-hidden',
          'h-full w-full',
          finalVariant === 'feed-masonry' && 'break-inside-avoid',
          className
        )}
      >
        {/* Avatar skeleton */}
        <div className="absolute top-2 left-2 z-10">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>

        <div className="block h-full">
          {/* Image skeleton */}
          <div className="relative">
            <Skeleton
              className={cn(
                'w-full',
                (() => {
                  switch (finalVariant) {
                    case 'feed-single':
                      return 'sm:aspect-video';
                    case 'feed-masonry':
                    case 'feed-grid':
                      return 'aspect-[3/4]';
                    case 'compact':
                      return 'aspect-[4/3]';
                    default:
                      return 'aspect-video';
                  }
                })()
              )}
            />
          </div>

          {/* Content skeleton */}
          <CardContent
            className={cn('p-4', finalVariant === 'compact' && 'p-3')}
          >
            <Skeleton
              className={cn(
                'mb-2',
                (() => {
                  switch (finalVariant) {
                    case 'feed-masonry':
                    case 'feed-single':
                      return 'h-6 w-full';
                    case 'feed-grid':
                      return 'h-5 w-full';
                    case 'compact':
                      return 'h-5 w-3/4';
                    default:
                      return 'h-6 w-3/4';
                  }
                })()
              )}
            />

            {finalVariant !== 'compact' && (
              <>
                <Skeleton className="mb-1 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </>
            )}
          </CardContent>

          {/* Footer skeleton */}
          <CardFooter
            className={cn(
              'flex flex-col items-start gap-3 p-4 pt-0',
              finalVariant === 'compact' && 'p-3 pt-0'
            )}
          >
            <div className="w-full space-y-3">
              {/* Primary rating skeleton */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>

              {/* Emoji reactions skeleton */}
              {finalVariant !== 'compact' && (
                <div className="flex flex-wrap gap-1">
                  {Array.from({
                    length:
                      finalVariant === 'feed-masonry' ||
                      finalVariant === 'feed-single'
                        ? 6
                        : 4,
                  }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-12 rounded-full" />
                  ))}
                </div>
              )}
            </div>
          </CardFooter>
        </div>
      </Card>
    );
  }

  if (!vibe) return null;

  return (
    <>
      <Card
        data-has-image={!!imageUrl}
        data-is-mobile={isMobile}
        data-expanded={isExpanded}
        onClick={handleCardClick}
        className={cn(
          'group/vibe-card cursor-pointer',
          'bg-popover/20 border-border/50 relative overflow-hidden transition duration-500 will-change-transform hover:shadow-md',
          'min-h-16 transition-all hover:data-[has-image=true]:min-h-148',
          isExpanded && 'data-[has-image=true]:min-h-148',
          finalVariant === 'feed-masonry' && 'break-inside-avoid',
          enableFadeIn && !isVisible && 'opacity-0',
          enableFadeIn && isVisible && 'animate-in fade-in duration-300',
          optimizeForTouch && 'transform-gpu',
          className
        )}
      >
        <div
          className={cn(
            'absolute top-0 h-full w-full overflow-hidden',
            // Dynamic aspect ratio based on variant and image presence
            usePlaceholder
              ? (() => {
                  switch (finalVariant) {
                    case 'feed-masonry':
                      return 'aspect-[4/3]';
                    case 'compact':
                      return 'aspect-[4/3]';
                    case 'mobile-optimized':
                      return isMobile ? 'aspect-[4/5]' : 'aspect-[4/3]';
                    default:
                      return 'aspect-video';
                  }
                })()
              : (() => {
                  switch (finalVariant) {
                    case 'feed-single':
                      return 'sm:aspect-video';
                    case 'feed-masonry':
                    case 'feed-grid':
                      return 'aspect-[3/4]';
                    case 'compact':
                      return 'aspect-[4/3]';
                    case 'mobile-optimized':
                      return isMobile ? 'aspect-[4/5]' : 'aspect-[3/4]';
                    default:
                      return 'aspect-video';
                  }
                })()
          )}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt={vibe.title}
              className={cn(
                'h-full w-full object-cover transition duration-200 will-change-transform',
                'group-hover/vibe-card:opacity-100 hover:scale-[1.02]'
              )}
              onError={() => setImageError(true)}
            />
          )}
          <div
            data-has-image={!!imageUrl}
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity duration-200',
              'data-[has-image=true]:opacity-80',
              'group-hover/vibe-card:data-[has-image=true]:opacity-0',
              'data-[has-image=false]:opacity-100'
            )}
          >
            <SimpleVibePlaceholder hideText title={vibe.title} />
          </div>
        </div>
        <div className="block h-full">
          <CardContent className="m-0 bg-transparent p-0">
            <Card className="m-0 w-full rounded-none border-none bg-transparent p-4">
              {/* Avatar positioned absolutely in upper left corner */}
              {vibe.createdBy && (
                <div
                  onMouseEnter={() => setIsAvatarHovered(true)}
                  onMouseLeave={() => setIsAvatarHovered(false)}
                  role="group"
                >
                  {vibe.createdBy.username ? (
                    <Link
                      to="/users/$username"
                      params={{ username: vibe.createdBy.username }}
                      className="flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigate({
                          to: '/users/$username',
                          params: { username: vibe.createdBy.username },
                        });
                      }}
                    >
                      <Avatar
                        className={cn(
                          'shadow-md transition-transform duration-150 will-change-transform hover:scale-[1.05]',
                          optimizeForTouch || isMobile ? 'h-8 w-8' : 'h-6 w-6'
                        )}
                      >
                        <AvatarImage
                          src={getUserAvatarUrl(vibe.createdBy)}
                          alt={computeUserDisplayName(vibe.createdBy)}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={cn(
                            'bg-background/50 border-none',
                            optimizeForTouch || isMobile ? 'text-sm' : 'text-xs'
                          )}
                        >
                          {getUserInitials(vibe.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          'bg-background/50 animate-in fade-in slide-in-from-left-2 rounded-full px-2 py-1 text-xs font-medium shadow-md backdrop-blur-sm duration-200'
                        )}
                      >
                        {computeUserDisplayName(vibe.createdBy)}
                      </span>
                    </Link>
                  ) : (
                    <Avatar className="ring-background h-8 w-8 shadow-md ring-2">
                      <AvatarImage
                        src={getUserAvatarUrl(vibe.createdBy)}
                        alt={computeUserDisplayName(vibe.createdBy)}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {getUserInitials(vibe.createdBy)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
              <div className="relative overflow-hidden rounded-md bg-transparent">
                <div className="relative">
                  <CardContent
                    className={cn(
                      'z-50 bg-transparent px-0 py-1',
                      finalVariant === 'compact' && 'px-0 py-1'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-start justify-between gap-2',
                        finalVariant === 'compact' && 'items-center'
                      )}
                    >
                      <h3
                        className={cn(
                          'min-w-0 flex-1 leading-tight font-bold',
                          (() => {
                            switch (finalVariant) {
                              case 'feed-masonry':
                              case 'feed-single':
                                return 'line-clamp-3 text-lg';
                              case 'feed-grid':
                                return 'line-clamp-2 text-base';
                              case 'compact':
                                return 'line-clamp-1 text-base';
                              default:
                                return 'line-clamp-1 text-lg';
                            }
                          })()
                        )}
                      >
                        {vibe.title}
                      </h3>

                      {/* Share button for compact variant */}
                      {finalVariant === 'compact' && (
                        <div
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <ShareButton
                            contentType="vibe"
                            variant="ghost"
                            size={
                              optimizeForTouch || isMobile ? 'default' : 'sm'
                            }
                            showCount={false}
                            vibe={vibe}
                            author={vibe.createdBy || undefined}
                            ratings={
                              topEmojiRatings?.map((r) => ({
                                emoji: r.emoji,
                                value: r.averageValue,
                                tags: r.tags || [],
                                count: r.count,
                              })) || undefined
                            }
                            className={cn(
                              optimizeForTouch || isMobile
                                ? 'min-h-[44px] min-w-[44px]'
                                : ''
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {finalVariant !== 'compact' && (
                      <p
                        className={cn(
                          'text-secondary-foreground mt-2 text-sm leading-relaxed',
                          (() => {
                            switch (finalVariant) {
                              case 'feed-masonry':
                              case 'feed-single':
                                return 'line-clamp-5';
                              case 'feed-grid':
                                return 'line-clamp-3';
                              default:
                                return 'line-clamp-2';
                            }
                          })()
                        )}
                      >
                        {vibe.description}
                      </p>
                    )}
                  </CardContent>
                </div>

                <CardFooter
                  className={cn(
                    'flex flex-col items-start gap-3 bg-transparent p-0',
                    finalVariant === 'compact' && 'p-3 pt-0'
                  )}
                >
                  {/* Show skeleton while ratings are loading */}
                  {isRatingsLoading ? (
                    <RatingSkeleton />
                  ) : (
                    <>
                      {/* Emoji Rating Display - Show cycling display if no ratings yet */}
                      <div className="w-full">
                        {primaryEmojiRating ? (
                          <EmojiRatingDisplayPopover
                            rating={primaryEmojiRating}
                            allRatings={emojiRatings}
                            onEmojiClick={handleEmojiRatingClick}
                            vibeId={vibe.id}
                            showScale={finalVariant !== 'compact'}
                            size={finalVariant === 'compact' ? 'sm' : 'md'}
                          />
                        ) : (
                          <EmojiRatingCycleDisplay
                            onSubmit={handleEmojiRating}
                            isSubmitting={createEmojiRatingMutation.isPending}
                            vibeTitle={vibe.title}
                            emojiMetadata={emojiMetadataRecord}
                            showBeTheFirst={emojiRatings.length === 0}
                            delay={delay}
                          />
                        )}
                      </div>

                      {/* Emoji Reactions and Share Button */}
                      {finalVariant !== 'compact' ? (
                        <div className="flex w-full items-center justify-between gap-2">
                          {/* Emoji Reactions */}
                          {emojiReactions.length > 0 ? (
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <EmojiReactions
                                reactions={emojiReactions}
                                onReact={handleQuickReact}
                                showAddButton={true}
                                onRatingSubmit={handleEmojiRating}
                                vibeTitle={vibe.title}
                                vibeId={vibe.id}
                                className="min-w-0"
                              />
                            </div>
                          ) : (
                            <div className="flex-1" />
                          )}

                          {/* Share Button */}
                          <ShareButton
                            contentType="vibe"
                            variant="ghost"
                            size={
                              optimizeForTouch || isMobile ? 'default' : 'sm'
                            }
                            showCount={vibe.shareCount ? true : false}
                            currentShareCount={vibe.shareCount}
                            vibe={vibe}
                            author={vibe.createdBy || undefined}
                            ratings={
                              topEmojiRatings?.map((r) => ({
                                emoji: r.emoji,
                                value: r.averageValue,
                                tags: r.tags || [],
                                count: r.count,
                              })) || undefined
                            }
                            className={cn(
                              optimizeForTouch || isMobile
                                ? 'min-h-[44px] min-w-[44px]'
                                : ''
                            )}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </CardFooter>
              </div>
            </Card>
          </CardContent>
        </div>
      </Card>

      {/* Hidden Emoji Rating Popover for clicking on emoji reactions */}
      <RatingPopover
        open={showRatingPopover}
        onOpenChange={(open) => {
          setShowRatingPopover(open);
          if (!open) {
            setSelectedEmojiForRating(null);
            setPreselectedRatingValue(null);
          }
        }}
        onSubmit={handleEmojiRating}
        isSubmitting={createEmojiRatingMutation.isPending}
        vibeTitle={vibe.title}
        emojiMetadata={emojiMetadataRecord}
        preSelectedEmoji={selectedEmojiForRating || undefined}
        preSelectedValue={preselectedRatingValue || undefined}
      >
        <div style={{ display: 'none' }} />
      </RatingPopover>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to rate vibes"
        description="join vibechecc to share your reactions and ratings with the community"
      />
    </>
  );
}

// Legacy export for backward compatibility
export interface FeedVibeCardProps {
  vibe: Vibe;
  layout?: 'masonry' | 'grid' | 'single';
  ratingDisplayMode?: RatingDisplayMode;
  className?: string;
}

export function FeedVibeCard(props: FeedVibeCardProps) {
  return <VibeCard {...props} />;
}
