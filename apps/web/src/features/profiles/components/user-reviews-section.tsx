import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import { useUserRatings } from '@/queries';
import type { User, Rating } from '@vibechecc/types';
import { MessageSquare } from '@/components/ui/icons';

interface UserReviewsSectionProps {
  user: User;
  maxDisplay?: number;
  showViewAllButton?: boolean;
  className?: string;
}

export function UserReviewsSection({
  user,
  maxDisplay = 6,
  showViewAllButton = true,
  className,
}: UserReviewsSectionProps) {
  const { data: userRatings, isLoading: reviewsLoading } = useUserRatings(
    user.externalId
  );

  // Filter only ratings that have review text
  const ratingsWithReviews =
    userRatings?.filter(
      (rating) => rating && rating.review && rating.review.trim().length > 0
    ) || [];
  const displayedReviews = ratingsWithReviews.slice(0, maxDisplay);
  const hasMoreReviews = ratingsWithReviews.length > maxDisplay;

  if (reviewsLoading) {
    return (
      <div className={className}>
        <h2 className="from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase sm:mb-4 sm:text-2xl">
          your reviews
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="bg-muted h-10 w-10 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-4 w-3/4 rounded"></div>
                    <div className="bg-muted h-3 w-full rounded"></div>
                    <div className="bg-muted h-3 w-1/2 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (displayedReviews.length === 0) {
    return (
      <div className={className}>
        <h2 className="from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase sm:mb-4 sm:text-2xl">
          your reviews
        </h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-foreground mb-2 text-lg font-medium">
              no reviews given yet
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              rate and review vibes to see them here!
            </p>
            <Button
              variant="outline"
              asChild
              className="border-theme-primary/30 text-theme-primary hover:bg-theme-primary/10"
            >
              <a href="/discover">
                <MessageSquare className="mr-2 h-4 w-4" />
                explore vibes
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase sm:mb-4 sm:text-2xl">
        your reviews
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {displayedReviews.map((rating) => {
          if (!rating) return null;

          // Ensure the rating object matches the Rating type by adding the user field
          const completeRating = {
            ...rating,
            user: user,
          } as unknown as Rating;

          return (
            <ReviewCard
              key={`${rating.vibeId}-${rating.createdAt}`}
              rating={completeRating}
              currentUser={user}
            />
          );
        })}
      </div>

      {showViewAllButton && hasMoreReviews && (
        <div className="mt-4 text-center sm:mt-6">
          <Button
            variant="outline"
            asChild
            className="bg-background/90 border-theme-primary/30 text-theme-primary w-full transition-transform hover:scale-[1.02] hover:bg-current/10 sm:w-auto"
          >
            <a href="/vibes/my-reviews">
              view all reviews ({ratingsWithReviews.length} total)
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  rating: Rating;
  currentUser: User;
}

function ReviewCard({ rating, currentUser }: ReviewCardProps) {
  const vibe = rating.vibe;
  const usePlaceholder = !vibe?.image;

  if (!vibe) {
    return null;
  }

  return (
    <Link to="/vibes/$vibeId" params={{ vibeId: vibe.id }}>
      <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
            {/* Reviewer Avatar (current user) */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={currentUser.image_url}
                alt={
                  `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() ||
                  currentUser.username
                }
                className="object-cover"
              />
              <AvatarFallback className="text-sm">
                {(
                  `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() ||
                  currentUser.username ||
                  'U'
                )
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Header */}
              <div className="mb-2 flex items-center gap-2 sm:mb-1">
                <span className="truncate text-sm font-medium">
                  @
                  {currentUser.username ||
                    `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()}
                </span>
                <span className="text-muted-foreground flex-shrink-0 text-xs">
                  on "{vibe.title}"
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  review
                </Badge>
              </div>

              {/* Review Text */}
              <div className="mb-3 sm:mb-2">
                <p className="text-sm leading-relaxed">{rating.review}</p>
              </div>

              {/* Rating and Vibe Image */}
              <div className="flex items-center justify-between gap-2">
                <EmojiRatingDisplay
                  rating={{
                    emoji: rating.emoji,
                    value: rating.value,
                    count: undefined,
                  }}
                  showScale={false}
                  size="sm"
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded">
                      {usePlaceholder ? (
                        <SimpleVibePlaceholder title={vibe.title} />
                      ) : (
                        <img
                          src={vibe.image}
                          alt={vibe.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-background max-w-xs border p-0"
                  >
                    <div className="space-y-2">
                      {!usePlaceholder && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t">
                          <img
                            src={vibe.image}
                            alt={vibe.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-foreground text-sm font-medium">
                          {vibe.title}
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
