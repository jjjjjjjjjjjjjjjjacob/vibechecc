import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/tailwind-utils';
import { SimpleVibePlaceholder } from '../simple-vibe-placeholder';
import { useUser } from '@clerk/tanstack-react-start';
import { trackEvents } from '@/lib/track-events';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import type { VibeCardSharedProps } from '../vibe-card';
import { RateAndReviewDialog } from '@/features/ratings/components/rate-and-review-dialog';
import { AuthPromptDialog } from '@/features/auth';
import { ShareButton } from '@/components/social/share-button';

interface MobileStoryLayoutProps extends VibeCardSharedProps {}

export function MobileStoryLayout({
  vibe,
  variant,
  className,
  loading,
  enableFadeIn,
  optimizeForTouch,

  // Computed data
  imageUrl,
  usePlaceholder,
  isVisible,

  // Rating data
  primaryEmojiRating,
  emojiMetadataRecord,
  currentUserRatings,

  // State
  showRatingDialog,
  showAuthDialog,
  selectedEmojiForRating,
  preselectedRatingValue,

  // Callbacks
  handleEmojiRatingClick,
  handleEmojiRating,
  setImageError,
  setShowRatingDialog,
  setShowAuthDialog,
  setSelectedEmojiForRating,
  setPreselectedRatingValue,
}: MobileStoryLayoutProps) {
  const { user } = useUser();

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
                gradientFrom={vibe.gradientFrom}
                gradientTo={vibe.gradientTo}
                gradientDirection={vibe.gradientDirection}
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
                      setShowRatingDialog(true);
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

      {/* Hidden Rating Dialog */}
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

      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to rate vibes"
        description="join vibechecc to share your reactions and ratings with the community"
      />
    </>
  );
}
