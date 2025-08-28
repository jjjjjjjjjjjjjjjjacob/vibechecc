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

export type DefaultLayoutProps = VibeCardSharedProps;

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
  handleCardClick,
  handleEmojiRating,
  setImageError,
  setShowRatingDialog,
  setShowAuthDialog,
  setSelectedEmojiForRating,
  setPreselectedRatingValue,
}: DefaultLayoutProps) {
  const navigate = useNavigate();

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

  const allRatingsData: EmojiRatingData[] = emojiRatings.map((rating) => ({
    emoji: rating.emoji,
    value: rating.value,
    count: rating.count,
    tags: rating.tags,
  }));

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
          'border-border/50 relative overflow-hidden',
          'h-full w-full',
          variant === 'feed-masonry' && 'break-inside-avoid',
          className
        )}
        style={{ backgroundColor: 'var(--background-color)' }}
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
              'flex flex-col items-start gap-3 p-4 pt-0',
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
      <Card
        data-vibe-card
        data-has-image={!!imageUrl}
        data-is-mobile={isMobile}
        data-expanded={isExpanded}
        onClick={(e) => {
          // Check if click target is an interactive element that should prevent navigation
          const target = e.target as HTMLElement;
          
          // First check for emoji-related elements specifically
          const isEmojiElement = target.closest('em-emoji-picker, em-emoji, .emoji-mart-emoji, .emoji-picker');
          if (isEmojiElement) {
            // Don't navigate for emoji clicks, let them work normally
            return;
          }
          
          // Check for other interactive elements
          const clickedInteractiveElement = target.closest(
            'button, [role="button"], a, [role="link"], input, textarea, select, [contenteditable], [data-radix-popper-content-wrapper], [data-state]'
          );
          
          // If clicking on an interactive element, but exclude the card itself (which has role="button")
          if (clickedInteractiveElement && !clickedInteractiveElement.closest('[data-vibe-card]')) {
            e.stopPropagation(); // Prevent the click from bubbling further
            return;
          }
          
          // For non-interactive areas, call handleCardClick without preventing the event
          // Let handleCardClick decide how to handle the event
          e.stopPropagation(); // Still stop propagation to prevent other handlers
          handleCardClick(e as unknown as React.MouseEvent);
        }}
        tabIndex={0}
        role="button"
        aria-label={`View vibe: ${vibe.title}`}
        className={cn(
          'group/vibe-card cursor-pointer',
          'border-border/50 relative overflow-hidden transition duration-500 will-change-transform hover:shadow-md',
          'bg-card/30 h-auto',
          // isExpanded && 'data-[has-image=true]:min-h-full',
          variant === 'feed-masonry' && 'break-inside-avoid',
          enableFadeIn && !isVisible && 'opacity-0',
          enableFadeIn && isVisible && 'animate-in fade-in duration-300',
          optimizeForTouch && 'transform-gpu',
          className
        )}
      >
        <div className="relative h-auto w-full flex-col">
          <CardContent className="m-0 gap-4 p-0">
            <div className="w-full flex-col overflow-hidden">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={vibe.title}
                  className={cn(
                    'h-full w-full object-cover transition duration-200 will-change-transform',
                    'group-hover/vibe-card:scale-[1.02]'
                  )}
                  onError={() => setImageError(true)}
                />
              )}
            </div>
            <Card className="relative m-0 flex w-full flex-col gap-2 rounded-lg border-none bg-transparent p-3 shadow-none">
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
                  gradientFrom={vibe.gradientFrom}
                  gradientTo={vibe.gradientTo}
                  gradientDirection={vibe.gradientDirection}
                />
              </div>
              {vibe.createdBy && (
                <div role="group">
                  {vibe.createdBy.username ? (
                    <Link
                      to="/users/$username"
                      params={{ username: vibe.createdBy.username }}
                      className="flex w-fit items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (vibe.createdBy?.username) {
                          navigate({
                            to: '/users/$username',
                            params: { username: vibe.createdBy.username },
                          });
                        }
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
              <div className="relative flex flex-col gap-2 overflow-hidden rounded-md bg-transparent">
                <div className="relative">
                  <CardContent
                    className={cn('flex w-fit flex-col rounded-md p-0')}
                  >
                    <div
                      className={cn(
                        'flex items-start justify-between gap-2',
                        variant === 'compact' && 'items-center'
                      )}
                    >
                      <h3
                        className={cn(
                          'flex-1 leading-tight font-bold',
                          (() => {
                            switch (variant) {
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
                      {variant === 'compact' && (
                        <div className="flex-shrink-0">
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
                              emojiRatings?.map((r) => ({
                                emoji: r.emoji,
                                value: r.value,
                                tags: r.tags || [],
                                count: r.count,
                              })) || undefined
                            }
                          />
                        </div>
                      )}
                    </div>

                    {variant !== 'compact' && (
                      <p
                        className={cn(
                          'text-secondary-foreground text-sm leading-relaxed',
                          (() => {
                            switch (variant) {
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
                    variant === 'compact' && 'p-3 pt-0'
                  )}
                >
                  {/* Show skeleton while ratings are loading */}
                  {isRatingsLoading ? (
                    <RatingSkeleton />
                  ) : (
                    <div className="w-full space-y-3">
                      {/* Top rating or cycle display */}
                      <div className="flex w-full items-center justify-between">
                        {topRating ? (
                          <div className="flex items-center gap-2">
                            <EmojiRatingDisplay
                              rating={topRating}
                              vibeId={vibe.id}
                              onEmojiClick={handleUnifiedEmojiRating}
                              vibeTitle={vibe.title}
                              variant="scale"
                              existingUserRatings={currentUserRatings || []}
                              emojiMetadata={emojiMetadataRecord || {}}
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
                              />
                            )}
                          </div>
                        ) : (
                          <EmojiRatingCycleDisplay
                            vibeId={vibe.id}
                            onEmojiClick={handleUnifiedEmojiRating}
                            vibeTitle={vibe.title}
                            existingUserRatings={currentUserRatings}
                            emojiMetadata={emojiMetadataRecord || {}}
                          />
                        )}

                        {/* Share Button - always visible */}
                        <ShareButton
                          contentType="vibe"
                          variant="ghost"
                          size={optimizeForTouch || isMobile ? 'default' : 'sm'}
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
                          className={cn(
                            optimizeForTouch || isMobile
                              ? 'min-h-[44px] min-w-[44px]'
                              : ''
                          )}
                        />
                      </div>

                      {/* Emoji Reactions Row - always show for non-compact variants */}
                      {variant !== 'compact' && (
                        <EmojiReactionsRow
                          reactions={reactionButtons}
                          onEmojiClick={handleUnifiedEmojiRating}
                          vibeTitle={vibe.title}
                          vibeId={vibe.id}
                          maxReactions={variant === 'feed-grid' ? 4 : 6}
                          existingUserRatings={currentUserRatings}
                          emojiMetadata={emojiMetadataRecord || {}}
                        />
                      )}
                    </div>
                  )}
                </CardFooter>
              </div>
            </Card>
          </CardContent>
        </div>
      </Card>

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
