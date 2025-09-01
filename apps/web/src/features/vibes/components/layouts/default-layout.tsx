import * as React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/tailwind-utils';
import { SimpleVibePlaceholder } from '../simple-vibe-placeholder';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import type { VibeCardSharedProps } from '../vibe-card';
import { RateAndReviewDialog } from '@/features/ratings/components/rate-and-review-dialog';
import { AuthPromptDialog } from '@/features/auth';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import {
  EmojiReactionsRow,
  type EmojiRatingData,
  type UnifiedEmojiRatingHandler,
} from '@/features/ratings/components/emoji-reaction';
import { EmojiRatingCycleDisplay } from '@/features/ratings/components/emoji-rating-cycle-display';
import { AllRatingsPopover } from '@/features/ratings/components/all-emoji-ratings-popover';
import { ShareButton } from '@/components/social/share-button';
import { getConsistentGradient, gradientPresets } from '@/utils/gradient-utils';

export type DefaultLayoutProps = VibeCardSharedProps;

// Helper function to get contrast-aware classes based on textContrast mode
function getContrastAwareClasses(
  effectiveTextContrast: 'light' | 'dark' | 'auto' | undefined
) {
  return {
    // Text colors
    labelText:
      effectiveTextContrast === 'light'
        ? 'text-black/70'
        : effectiveTextContrast === 'dark'
          ? 'text-white/70'
          : 'text-muted-foreground',

    // Badge/pill backgrounds and text
    badgeBackground: 'bg-white/20',
    badgeText:
      effectiveTextContrast === 'light'
        ? 'text-black/90'
        : effectiveTextContrast === 'dark'
          ? 'text-white/90'
          : '',

    // Avatar fallback
    avatarFallback:
      effectiveTextContrast === 'light'
        ? 'bg-white/20 text-black/80'
        : effectiveTextContrast === 'dark'
          ? 'bg-white/20 text-white/80'
          : 'bg-background/50',

    // Button backgrounds and hovers
    buttonBackground:
      effectiveTextContrast === 'light'
        ? 'bg-white/20'
        : effectiveTextContrast === 'dark'
          ? 'bg-white/20'
          : 'bg-muted',
    buttonHover:
      effectiveTextContrast === 'light'
        ? 'hover:bg-white/30'
        : effectiveTextContrast === 'dark'
          ? 'hover:bg-white/30'
          : 'hover:bg-muted/80',
    buttonText:
      effectiveTextContrast === 'light'
        ? 'text-black/90'
        : effectiveTextContrast === 'dark'
          ? 'text-white/90'
          : 'text-foreground',
  };
}

export function DefaultLayout({
  vibe,
  variant,
  className,
  loading,
  enableFadeIn,
  optimizeForTouch,

  // Computed data
  imageUrl,
  isMobile,
  isVisible,

  // Rating data
  primaryEmojiRating,
  emojiRatings,
  isRatingsLoading,
  emojiMetadataRecord,
  currentUserRatings,

  // State
  isExpanded,
  showRatingDialog,
  showAuthDialog,
  selectedEmojiForRating,
  preselectedRatingValue,

  // Callbacks
  handleEmojiRating,
  setImageError,
  setShowRatingDialog,
  setShowAuthDialog,
  setSelectedEmojiForRating,
  setPreselectedRatingValue,
}: DefaultLayoutProps) {
  const [isImageHovered, setIsImageHovered] = React.useState(false);

  // Early return if vibe or vibe.id is undefined
  if (!vibe?.id) {
    return null;
  }

  // Convert rating data to unified format
  const topRating: EmojiRatingData | null = primaryEmojiRating
    ? {
        emoji: primaryEmojiRating.emoji,
        value: primaryEmojiRating.value,
        count: primaryEmojiRating.count,
      }
    : null;

  const reactionButtons: EmojiRatingData[] = emojiRatings.map((reaction) => ({
    emoji: reaction.emoji,
    value: reaction.value,
    count: reaction.count,
  }));

  const allRatingsData: EmojiRatingData[] = emojiRatings.map((rating) => {
    return {
      emoji: rating.emoji,
      value: rating.value,
      count: rating.count,
      tags: rating.tags,
    };
  });

  // Auto-generate gradient if missing (for vibes without images) OR get preset textContrast
  const autoGradient = React.useMemo(() => {
    if (!vibe.gradientFrom && !vibe.gradientTo && !imageUrl) {
      return getConsistentGradient(vibe.id);
    }

    // Check if existing gradient matches a preset to use its fixed textContrast
    if (vibe.gradientFrom && vibe.gradientTo) {
      const matchingPreset = gradientPresets.find(
        (preset) =>
          preset.from === vibe.gradientFrom && preset.to === vibe.gradientTo
      );
      if (matchingPreset) {
        return matchingPreset;
      }
    }

    return null;
  }, [vibe.gradientFrom, vibe.gradientTo, imageUrl, vibe.id]); // Include vibe.id for consistent generation

  // Unified rating handler
  const handleUnifiedEmojiRating: UnifiedEmojiRatingHandler = handleEmojiRating;

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
        {Array.from({ length: variant === 'compact' ? 4 : 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-12 rounded-full" />
        ))}
      </div>
    </div>
  );

  // Show skeleton if loading
  if (loading) {
    return (
      <Card
        className={cn(
          'border-border/50 bg-background relative overflow-hidden',
          'h-full w-full',
          variant === 'feed-masonry' && 'break-inside-avoid',
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
                  switch (variant) {
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
          <CardContent className={cn('p-4', variant === 'compact' && 'p-3')}>
            <Skeleton
              className={cn(
                'mb-2',
                (() => {
                  switch (variant) {
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

            {variant !== 'compact' && (
              <>
                <Skeleton className="mb-1 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </>
            )}
          </CardContent>

          {/* Footer skeleton */}
          <CardFooter
            className={cn(
              'flex flex-col items-start gap-3 p-4 pt-0 pb-0',
              variant === 'compact' && 'p-3 pt-0'
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
              {variant !== 'compact' && (
                <div className="flex flex-wrap gap-1">
                  {Array.from({
                    length:
                      variant === 'feed-masonry' || variant === 'feed-single'
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

  return (
    <>
      <Link
        to="/vibes/$vibeId"
        params={{ vibeId: vibe?.id }}
        className="block h-full w-full"
      >
        <Card
          data-vibe-card
          data-has-image={!!imageUrl}
          data-is-mobile={isMobile}
          data-expanded={isExpanded}
          tabIndex={-1}
          aria-label={`View vibe: ${vibe.title}`}
          className={cn(
            'group/vibe-card cursor-pointer',
            'border-border/50 relative overflow-hidden rounded-3xl transition duration-500 will-change-transform hover:shadow-md',
            'bg-card/30 h-auto',
            // isExpanded && 'data-[has-image=true]:min-h-full',
            variant === 'feed-masonry' && 'break-inside-avoid',
            enableFadeIn && !isVisible && 'opacity-0',
            enableFadeIn && isVisible && 'animate-in fade-in duration-300',
            optimizeForTouch && 'transform-gpu',
            // Ensure touch events work properly on mobile
            'touch-manipulation',
            className
          )}
          style={{
            // Ensure mobile touch events work
            touchAction: 'manipulation',
          }}
        >
          <div className="relative h-auto w-full flex-col p-0">
            <CardContent className="group/details m-0 gap-4 p-0 px-0 shadow-sm">
              <img
                src={imageUrl}
                alt={vibe.title}
                data-has-image={!!imageUrl}
                className={cn(
                  // 'group-hover/details:blur-[2px] group-hover/details:brightness-90',
                  'hover:group-hover/details:blur-none hover:group-hover/details:brightness-100',
                  'h-full w-full object-cover transition-all duration-200 will-change-transform data-[has-image=false]:hidden',
                  'hover:scale-[1.015]'
                )}
                onError={() => setImageError(true)}
                onMouseEnter={() => setIsImageHovered(true)}
                onMouseLeave={() => setIsImageHovered(false)}
              />
              <div className="p-1.5">
                <Card
                  data-has-image={!!imageUrl}
                  data-image-is-hovered={isImageHovered && !!imageUrl}
                  data-text-contrast={
                    // Only apply contrast mode when there's an image or gradient background
                    (imageUrl || (vibe.gradientFrom && vibe.gradientTo)) &&
                    vibe.textContrastMode !== 'auto'
                      ? vibe.textContrastMode
                      : undefined
                  }
                  className={cn(
                    'top-0 m-0 flex w-full flex-col gap-2 overflow-hidden rounded-2xl border-none p-1.5 transition-all',
                    'shadow-md shadow-black/20 data-[has-image=true]:top-1.5 data-[has-image=true]:w-[calc(100%-0.75rem)]',
                    'data-[has-image=true]:hover:bg-background/40 data-[has-image=true]:hover:shadow-md data-[has-image=true]:hover:shadow-black/40',
                    'data-[has-image=true]:absolute data-[has-image=true]:bg-transparent data-[has-image=true]:backdrop-blur-[1.8px]',
                    'data=[image-is-hovered=true]:blur-lg data-[image-is-hovered=true]:-translate-y-5 data-[image-is-hovered=true]:scale-102 data-[image-is-hovered=true]:opacity-0'
                  )}
                >
                  <div
                    data-has-image={!!imageUrl}
                    data-is-expanded={isExpanded}
                    className={cn(
                      'absolute inset-0 h-full w-full transition-opacity duration-200',
                      'data-[has-image=true]:opacity-0'
                    )}
                  >
                    <SimpleVibePlaceholder
                      hideText
                      title={vibe.title}
                      gradientFrom={vibe.gradientFrom || autoGradient?.from}
                      gradientTo={vibe.gradientTo || autoGradient?.to}
                      gradientDirection={
                        vibe.gradientDirection || autoGradient?.direction
                      }
                      textContrastMode={
                        (vibe.textContrastMode !== 'auto'
                          ? vibe.textContrastMode
                          : undefined) ||
                        (autoGradient?.textContrast as
                          | 'light'
                          | 'dark'
                          | undefined)
                      }
                    />
                  </div>
                  {vibe.createdBy && (
                    <div
                      role="group"
                      className="flex w-full items-center justify-between px-0"
                    >
                      <div className="flex items-center px-0">
                        {vibe.createdBy.username ? (
                          <Link
                            to="/users/$username"
                            params={{ username: vibe.createdBy.username }}
                            className="flex w-fit items-center gap-2"
                          >
                            <Avatar
                              className={cn(
                                'shadow-md transition-transform duration-150 will-change-transform hover:scale-[1.05]',
                                optimizeForTouch || isMobile
                                  ? 'h-8 w-8'
                                  : 'h-6 w-6'
                              )}
                            >
                              <AvatarImage
                                src={getUserAvatarUrl(vibe.createdBy)}
                                alt={computeUserDisplayName(vibe.createdBy)}
                                className="object-cover"
                              />
                              <AvatarFallback
                                className={cn(
                                  'border-none',
                                  optimizeForTouch || isMobile
                                    ? 'text-sm'
                                    : 'text-xs',
                                  (() => {
                                    const effectiveTextContrast =
                                      (vibe.textContrastMode !== 'auto'
                                        ? vibe.textContrastMode
                                        : undefined) ||
                                      (autoGradient?.textContrast as
                                        | 'light'
                                        | 'dark'
                                        | undefined);
                                    return getContrastAwareClasses(
                                      effectiveTextContrast
                                    ).avatarFallback;
                                  })()
                                )}
                              >
                                {getUserInitials(vibe.createdBy)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                'animate-in fade-in slide-in-from-left-2 rounded-full px-2 py-1 text-xs font-medium shadow-md backdrop-blur-sm duration-200',
                                (() => {
                                  const effectiveTextContrast =
                                    (vibe.textContrastMode !== 'auto'
                                      ? vibe.textContrastMode
                                      : undefined) ||
                                    (autoGradient?.textContrast as
                                      | 'light'
                                      | 'dark'
                                      | undefined);
                                  const classes = getContrastAwareClasses(
                                    effectiveTextContrast
                                  );
                                  return `${classes.badgeBackground} ${classes.badgeText}`;
                                })()
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

                      {/* Share button for compact variant - positioned with user info */}
                      {variant === 'compact' && (
                        <div className="flex-shrink-0">
                          <ShareButton
                            contentType="vibe"
                            variant="ghost"
                            size={'sm'}
                            showCount={false}
                            vibe={vibe}
                            author={vibe.createdBy || undefined}
                            ratings={
                              emojiRatings?.map((r) => ({
                                emoji: r.emoji,
                                value: r.value,
                                tags: r.tags || [],
                                count: r.count,
                              })) || undefined
                            }
                            textContrast={
                              (vibe.textContrastMode !== 'auto'
                                ? vibe.textContrastMode
                                : undefined) ||
                              (autoGradient?.textContrast as
                                | 'light'
                                | 'dark'
                                | undefined)
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative flex flex-col gap-2 rounded-md bg-transparent">
                    <div className="relative">
                      <CardContent
                        data-has-image={!!imageUrl}
                        className={cn(
                          'flex w-fit flex-col rounded-md p-0',
                          'px-1'
                        )}
                      >
                        <div>
                          <h3
                            className={cn(
                              'leading-tight font-bold',
                              (() => {
                                switch (variant) {
                                  case 'feed-masonry':
                                  case 'feed-single':
                                    return 'line-clamp-3 text-lg';
                                  case 'feed-grid':
                                    return 'line-clamp-2 text-base';
                                  case 'compact':
                                    return 'line-clamp-3 text-base';
                                  default:
                                    return 'line-clamp-1 text-lg';
                                }
                              })(),
                              // Dynamic text color based on gradient contrast
                              (() => {
                                const effectiveTextContrast =
                                  (vibe.textContrastMode !== 'auto'
                                    ? vibe.textContrastMode
                                    : undefined) ||
                                  (autoGradient?.textContrast as
                                    | 'light'
                                    | 'dark'
                                    | undefined);
                                if (effectiveTextContrast === 'light')
                                  return 'text-black/90';
                                if (effectiveTextContrast === 'dark')
                                  return 'text-white/90';
                                return ''; // Default theme color
                              })()
                            )}
                          >
                            {vibe.title}
                          </h3>
                        </div>

                        {variant !== 'compact' && (
                          <p
                            className={cn(
                              'text-sm leading-relaxed',
                              (() => {
                                switch (variant) {
                                  case 'feed-masonry':
                                  case 'feed-single':
                                  case 'feed-grid':
                                  default:
                                    return 'line-clamp-5';
                                }
                              })(),
                              // Dynamic text color based on gradient contrast
                              (() => {
                                const effectiveTextContrast =
                                  (vibe.textContrastMode !== 'auto'
                                    ? vibe.textContrastMode
                                    : undefined) ||
                                  (autoGradient?.textContrast as
                                    | 'light'
                                    | 'dark'
                                    | undefined);
                                if (effectiveTextContrast === 'light')
                                  return 'text-black/70';
                                if (effectiveTextContrast === 'dark')
                                  return 'text-white/70';
                                return 'text-secondary-foreground'; // Default theme color
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
                        variant === 'compact' && 'px-1 py-2'
                      )}
                    >
                      {/* Show skeleton while ratings are loading */}
                      {isRatingsLoading ? (
                        <RatingSkeleton />
                      ) : (
                        <div
                          className={cn(
                            'w-full',
                            variant === 'compact' ? 'space-y-2' : 'space-y-3'
                          )}
                        >
                          {/* Top rating or cycle display */}
                          {topRating && (
                            <span
                              className={cn(
                                'text-xs font-semibold',
                                (() => {
                                  const effectiveTextContrast =
                                    (vibe.textContrastMode !== 'auto'
                                      ? vibe.textContrastMode
                                      : undefined) ||
                                    (autoGradient?.textContrast as
                                      | 'light'
                                      | 'dark'
                                      | undefined);
                                  return getContrastAwareClasses(
                                    effectiveTextContrast
                                  ).labelText;
                                })()
                              )}
                            >
                              most rated
                            </span>
                          )}
                          <div className="flex w-full items-center justify-between">
                            {topRating ? (
                              <div className="flex items-center gap-2">
                                <EmojiRatingDisplay
                                  rating={topRating}
                                  vibeId={vibe.id}
                                  onEmojiClick={handleUnifiedEmojiRating}
                                  vibeTitle={vibe.title}
                                  variant="scale"
                                  size="sm"
                                  existingUserRatings={currentUserRatings || []}
                                  emojiMetadata={emojiMetadataRecord || {}}
                                  textContrast={
                                    (vibe.textContrastMode !== 'auto'
                                      ? vibe.textContrastMode
                                      : undefined) ||
                                    (autoGradient?.textContrast as
                                      | 'light'
                                      | 'dark'
                                      | undefined)
                                  }
                                />
                                {allRatingsData.length > 1 && (
                                  <AllRatingsPopover
                                    ratings={allRatingsData}
                                    onEmojiClick={handleUnifiedEmojiRating}
                                    vibeTitle={vibe.title}
                                    vibeId={vibe.id}
                                    visibleCount={1}
                                    existingUserRatings={currentUserRatings}
                                    emojiMetadata={emojiMetadataRecord || {}}
                                    textContrast={
                                      (vibe.textContrastMode !== 'auto'
                                        ? vibe.textContrastMode
                                        : undefined) ||
                                      (autoGradient?.textContrast as
                                        | 'light'
                                        | 'dark'
                                        | undefined)
                                    }
                                  />
                                )}
                              </div>
                            ) : (
                              <EmojiRatingCycleDisplay
                                vibeId={vibe.id}
                                onEmojiClick={handleUnifiedEmojiRating}
                                vibeTitle={vibe.title}
                                showBeTheFirst={true}
                                existingUserRatings={currentUserRatings}
                                emojiMetadata={emojiMetadataRecord || {}}
                                textContrast={
                                  (vibe.textContrastMode !== 'auto'
                                    ? vibe.textContrastMode
                                    : undefined) ||
                                  (autoGradient?.textContrast as
                                    | 'light'
                                    | 'dark'
                                    | undefined)
                                }
                              />
                            )}

                            {/* Share Button - only visible when no ratings */}
                            {!reactionButtons?.length && (
                              <ShareButton
                                contentType="vibe"
                                variant="ghost"
                                size={
                                  optimizeForTouch || isMobile
                                    ? 'default'
                                    : 'sm'
                                }
                                showCount={vibe.shareCount ? true : false}
                                currentShareCount={vibe.shareCount}
                                vibe={vibe}
                                author={vibe.createdBy || undefined}
                                ratings={
                                  emojiRatings?.map((r) => ({
                                    emoji: r.emoji,
                                    value: r.value,
                                    tags: r.tags || [],
                                    count: r.count,
                                  })) || undefined
                                }
                                textContrast={
                                  (vibe.textContrastMode !== 'auto'
                                    ? vibe.textContrastMode
                                    : undefined) ||
                                  (autoGradient?.textContrast as
                                    | 'light'
                                    | 'dark'
                                    | undefined)
                                }
                              />
                            )}
                          </div>

                          {/* Emoji Reactions Row - always show for non-compact variants */}
                          {variant !== 'compact' && reactionButtons?.length ? (
                            <EmojiReactionsRow
                              reactions={reactionButtons}
                              onEmojiClick={handleUnifiedEmojiRating}
                              vibeTitle={vibe.title}
                              vibeId={vibe.id}
                              maxReactions={variant === 'feed-grid' ? 4 : 6}
                              existingUserRatings={currentUserRatings}
                              emojiMetadata={emojiMetadataRecord || {}}
                              vibe={vibe}
                              author={vibe.createdBy || undefined}
                              optimizeForTouch={optimizeForTouch}
                              isMobile={isMobile}
                              shareCount={vibe.shareCount}
                              textContrast={
                                (vibe.textContrastMode !== 'auto'
                                  ? vibe.textContrastMode
                                  : undefined) ||
                                (autoGradient?.textContrast as
                                  | 'light'
                                  | 'dark'
                                  | undefined)
                              }
                            />
                          ) : null}
                        </div>
                      )}
                    </CardFooter>
                  </div>
                </Card>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>

      {/* Hidden Rating Dialog for clicking on emoji reactions */}
      <RateAndReviewDialog
        vibeId={vibe.id}
        open={showRatingDialog}
        onOpenChange={(open) => {
          setShowRatingDialog(open);
          if (!open) {
            setSelectedEmojiForRating(null);
            setPreselectedRatingValue(null);
          }
        }}
        vibeTitle={vibe.title}
        preSelectedEmoji={selectedEmojiForRating || undefined}
        preSelectedValue={preselectedRatingValue || undefined}
        existingUserRatings={currentUserRatings}
        emojiMetadata={emojiMetadataRecord || {}}
      >
        <div style={{ display: 'none' }} />
      </RateAndReviewDialog>

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
