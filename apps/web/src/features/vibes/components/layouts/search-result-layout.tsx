import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind-utils';
import { SimpleVibePlaceholder } from '../simple-vibe-placeholder';
import { trackEvents } from '@/lib/track-events';
import type { VibeCardSharedProps } from '../vibe-card';
import { RateAndReviewDialog } from '@/features/ratings/components/rate-and-review-dialog';
import { AuthPromptDialog } from '@/features/auth';
import { ShareButton } from '@/components/social/share-button';
import {
  BoostIndicator,
  HighBoostIndicator,
} from '@/components/boost-indicator';

interface SearchResultLayoutProps extends VibeCardSharedProps {}

export function SearchResultLayout({
  vibe,
  variant,
  className,
  loading,

  // Computed data
  imageUrl,
  usePlaceholder,

  // Rating data
  primaryEmojiRating,
  emojiRatings,
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
}: SearchResultLayoutProps) {
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
                    gradientFrom={vibe.gradientFrom}
                    gradientTo={vibe.gradientTo}
                    gradientDirection={vibe.gradientDirection}
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
                {/* Emoji Ratings Display */}
                {primaryEmojiRating ? (
                  <div className="text-xs">
                    <span className="mr-1">{primaryEmojiRating.emoji}</span>
                    <span>{primaryEmojiRating.value.toFixed(1)}/5</span>
                    {primaryEmojiRating.count && (
                      <span className="text-muted-foreground ml-1">
                        ({primaryEmojiRating.count})
                      </span>
                    )}
                  </div>
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
                    {(vibe.boostScore !== undefined && vibe.boostScore !== 0) ||
                    (vibe.totalBoosts !== undefined && vibe.totalBoosts > 0) ||
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
                      emojiRatings?.map((r) => ({
                        emoji: r.emoji,
                        value: r.value,
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
