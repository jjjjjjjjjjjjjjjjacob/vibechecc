import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/tailwind-utils';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from '@/hooks/usePostHog';
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
import type { Vibe } from '@/types';
import type { RatingDisplayMode } from '@/components/vibe-category-row';
import { EmojiRatingPopover } from '@/components/emoji-rating-popover';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import { EmojiRatingDisplayPopover } from '@/components/emoji-rating-display-popover';
import { EmojiRatingCycleDisplay } from '@/components/emoji-rating-cycle-display';
import { EmojiReactions } from '@/components/emoji-reaction';

type VibeCardVariant =
  | 'default'
  | 'compact'
  | 'feed-grid'
  | 'feed-masonry'
  | 'feed-single'
  | 'list';

interface VibeCardProps {
  vibe: Vibe;
  variant?: VibeCardVariant;
  ratingDisplayMode?: RatingDisplayMode;
  className?: string;
  // Legacy props for backward compatibility
  compact?: boolean;
  layout?: 'masonry' | 'grid' | 'single';
}

export function VibeCard({
  vibe,
  variant = 'default',
  ratingDisplayMode = 'most-rated',
  className,
  // Legacy prop support
  compact,
  layout,
}: VibeCardProps) {
  // Determine final variant based on new and legacy props
  const finalVariant = React.useMemo(() => {
    // If new variant prop is provided, use it
    if (variant !== 'default') return variant;

    // Handle legacy props
    if (compact) return 'compact';
    if (layout === 'masonry') return 'feed-masonry';
    if (layout === 'grid') return 'feed-grid';
    if (layout === 'single') return 'feed-single';

    return 'default';
  }, [variant, compact, layout]);
  const [imageError, setImageError] = React.useState(false);
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [preselectedRatingValue, setPreselectedRatingValue] = React.useState<
    number | null
  >(null);
  const [showEmojiRatingPopover, setShowEmojiRatingPopover] =
    React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = React.useState(false);
  const { user } = useUser();
  const { trackEvents } = usePostHog();
  const createEmojiRatingMutation = useCreateEmojiRatingMutation();
  const { data: emojiMetadataArray } = useEmojiMetadata();

  // Fetch emoji rating data - get all unique emoji reactions for this vibe
  const { data: topEmojiRatings, isLoading: isTopEmojiRatingsLoading } =
    useTopEmojiRatings(vibe.id, 20);
  const {
    data: mostInteractedEmojiData,
    isLoading: isMostInteractedEmojiLoading,
  } = useMostInteractedEmoji(vibe.id);

  // Determine if we should use a placeholder
  const usePlaceholder = !vibe.image || imageError;

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

    setShowEmojiRatingPopover(true);
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

  // List variant implementation
  if (finalVariant === 'list') {
    return (
      <>
        <div
          className={cn(
            'group relative overflow-hidden rounded-lg transition-all duration-200 hover:shadow-md',
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
                  src={vibe.image}
                  alt={vibe.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                  <div
                    className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEmojiRatingClick(
                        primaryEmojiRating.emoji,
                        primaryEmojiRating.value
                      );
                    }}
                  >
                    <span className="font-noto-color text-lg">
                      {primaryEmojiRating.emoji}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {primaryEmojiRating.value.toFixed(1)}
                      </span>
                      <span className="text-xs text-white/50">
                        {primaryEmojiRating.count}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-full bg-white/10 px-3 py-2 text-sm text-white/70 backdrop-blur-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user?.id) {
                        setShowAuthDialog(true);
                      } else {
                        setShowEmojiRatingPopover(true);
                      }
                    }}
                  >
                    rate this
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Hidden Emoji Rating Popover */}
        <EmojiRatingPopover
          open={showEmojiRatingPopover}
          onOpenChange={(open) => {
            setShowEmojiRatingPopover(open);
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
        </EmojiRatingPopover>

        {/* Auth Prompt Dialog */}
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate vibes"
          description="join viberater to share your reactions and ratings with the community"
        />
      </>
    );
  }

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200 hover:shadow-md',
          'h-full',
          finalVariant === 'feed-masonry' && 'break-inside-avoid',
          className
        )}
      >
        {/* Avatar positioned absolutely in upper left corner */}
        {vibe.createdBy && (
          <div
            className="absolute top-2 left-2 z-10"
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
                }}
              >
                <Avatar className="h-6 w-6 shadow-md transition-transform hover:scale-110">
                  <AvatarImage
                    src={getUserAvatarUrl(vibe.createdBy)}
                    alt={computeUserDisplayName(vibe.createdBy)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-background/50 border-none text-xs">
                    {getUserInitials(vibe.createdBy)}
                  </AvatarFallback>
                </Avatar>
                {isAvatarHovered && (
                  <span
                    className={cn(
                      'bg-background/50 animate-in fade-in slide-in-from-left-2 rounded-full px-2 py-1 text-xs font-medium shadow-md backdrop-blur-sm duration-200'
                    )}
                  >
                    {computeUserDisplayName(vibe.createdBy)}
                  </span>
                )}
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

        <div className="block h-full">
          <Link
            to="/vibes/$vibeId"
            params={{ vibeId: vibe.id }}
            onClick={() => {
              // Track vibe view when clicked
              trackEvents.vibeViewed(vibe.id);
            }}
          >
            <div className="relative">
              <div
                className={cn(
                  'relative overflow-hidden',
                  // Dynamic aspect ratio based on variant and image presence
                  usePlaceholder
                    ? (() => {
                        switch (finalVariant) {
                          case 'feed-masonry':
                            return 'aspect-[4/3]';
                          case 'compact':
                            return 'aspect-[4/3]';
                          default:
                            return 'aspect-video';
                        }
                      })()
                    : (() => {
                        switch (finalVariant) {
                          case 'feed-single':
                            return 'aspect-video';
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
              >
                {usePlaceholder ? (
                  <SimpleVibePlaceholder title={vibe.title} />
                ) : (
                  <img
                    src={vibe.image}
                    alt={vibe.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </div>

            <CardContent
              className={cn('p-4', finalVariant === 'compact' && 'p-3')}
            >
              <h3
                className={cn(
                  'leading-tight font-bold',
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

              {finalVariant !== 'compact' && (
                <p
                  className={cn(
                    'text-muted-foreground mt-2 text-sm leading-relaxed',
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
          </Link>

          <CardFooter
            className={cn(
              'flex flex-col items-start gap-3 p-4 pt-0',
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
                    />
                  ) : (
                    <EmojiRatingCycleDisplay
                      onSubmit={handleEmojiRating}
                      isSubmitting={createEmojiRatingMutation.isPending}
                      vibeTitle={vibe.title}
                      emojiMetadata={emojiMetadataRecord}
                      showBeTheFirst={true}
                    />
                  )}
                </div>

                {/* Emoji Reactions - only show if there are reactions */}
                {emojiReactions.length > 0 && (
                  <div className="w-full min-w-0 overflow-hidden">
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
                )}
              </>
            )}
          </CardFooter>
        </div>
      </Card>

      {/* Hidden Emoji Rating Popover for clicking on emoji reactions */}
      <EmojiRatingPopover
        open={showEmojiRatingPopover}
        onOpenChange={(open) => {
          setShowEmojiRatingPopover(open);
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
      </EmojiRatingPopover>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to rate vibes"
        description="join viberater to share your reactions and ratings with the community"
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
