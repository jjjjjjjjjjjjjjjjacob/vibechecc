import * as React from 'react';
import { Link } from '@tanstack/react-router';
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

type ListLayoutProps = VibeCardSharedProps;

export function ListLayout({
  vibe,
  className,
  loading,

  // Computed data
  imageUrl,
  usePlaceholder,

  // Rating data
  primaryEmojiRating,
  isRatingsLoading,
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
}: ListLayoutProps) {
  const { user } = useUser();

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

  return (
    <>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg transition-shadow duration-200 will-change-transform hover:shadow-md',
          'border-border/50 bg-card/30 border',
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
          {/* Background layer: placeholder or image */}
          <div className="absolute inset-0">
            {usePlaceholder ? (
              <SimpleVibePlaceholder
                title={vibe.title}
                gradientFrom={vibe.gradientFrom}
                gradientTo={vibe.gradientTo}
                gradientDirection={vibe.gradientDirection}
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
          </div>

          {/* Content overlay */}
          <div className="relative z-10 flex h-full items-center justify-between p-4">
            {/* Left side: Avatar and title */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {vibe.createdBy && (
                <Avatar className="border-border/50 h-10 w-10 flex-shrink-0 border-2">
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
                <h3 className="text-foreground line-clamp-1 text-base font-bold sm:text-lg">
                  {vibe.title}
                </h3>
                <p className="text-muted-foreground line-clamp-1 text-sm">
                  {vibe.createdBy
                    ? computeUserDisplayName(vibe.createdBy)
                    : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Right side: Rating display */}
            <div className="ml-4 flex-shrink-0">
              {isRatingsLoading ? (
                <Skeleton className="bg-foreground/10 h-10 w-20 rounded-full" />
              ) : primaryEmojiRating ? (
                <button
                  className="bg-foreground/10 focus:ring-primary flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm focus:ring-2 focus:outline-none"
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
                    <span className="text-foreground text-sm font-medium">
                      {primaryEmojiRating.value.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {primaryEmojiRating.count}
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  className="bg-foreground/10 text-foreground focus:ring-primary rounded-full px-3 py-2 text-sm backdrop-blur-sm focus:ring-2 focus:outline-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!user?.id) {
                      setShowAuthDialog(true);
                    } else {
                      setShowRatingDialog(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user?.id) {
                        setShowAuthDialog(true);
                      } else {
                        setShowRatingDialog(true);
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
