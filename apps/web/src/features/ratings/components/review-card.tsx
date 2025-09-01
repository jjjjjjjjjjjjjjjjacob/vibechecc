import * as React from 'react';
import { Link } from '@tanstack/react-router';
import type { Id } from '@vibechecc/convex/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmojiRatingDisplay } from './emoji-rating-display';
import { EmojiRatingCycleDisplay } from './emoji-rating-cycle-display';
import { RatingDootButton } from './rating-doot-button';
import { RatingShareButton } from '@/components/social/rating-share-button';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import type {
  UnifiedEmojiRatingHandler,
} from './emoji-reaction';

interface ReviewCardProps {
  rating: {
    _id?: string;
    vibeId: string;
    userId: string;
    emoji?: string;
    value?: number;
    review?: string;
    createdAt?: string;
    updatedAt?: string;
    user?: any;
    rater?: any;
    vibe?: {
      id: string;
      title: string;
      description?: string;
      image?: string;
      createdBy?: { id: string; name: string; avatar?: string };
      createdAt?: string;
    };
  };
  vibe: {
    id: string;
    title: string;
    currentUserRatings?: any[];
  };
  currentUserId?: string;
  voteScore?: { netScore: number };
  voteStatus?: {
    voteType: 'boost' | 'dampen' | null;
    boosted: boolean;
    dampened: boolean;
  };
  onEmojiClick?: UnifiedEmojiRatingHandler;
  emojiMetadata?: Record<string, any>;
  isOwnRating?: boolean;
  variant?: 'default' | 'compact';
  showActions?: boolean;
}

export function ReviewCard({
  rating,
  vibe,
  currentUserId,
  voteScore,
  voteStatus,
  onEmojiClick,
  emojiMetadata = {},
  isOwnRating,
  variant = 'default',
  showActions = true,
}: ReviewCardProps) {
  // Determine user data - could be in rating.user or rating.rater
  const user = rating.user || rating.rater;
  const hasUsername = !!(user && user.username);
  const displayName = computeUserDisplayName(user);
  const username = user?.username;
  const hasReviewText = rating.review && rating.review.trim();

  // Handle unified emoji rating
  const handleUnifiedEmojiRating: UnifiedEmojiRatingHandler = async (data) => {
    if (onEmojiClick) {
      return onEmojiClick(data);
    }
    return Promise.resolve();
  };

  return (
    <div className="bg-secondary/10 border-border/50 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        {hasUsername ? (
          <Link
            to="/users/$username"
            params={{ username: username! }}
            className="flex-shrink-0"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={getUserAvatarUrl(user)}
                alt={displayName}
              />
              <AvatarFallback className="text-xs">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage
              src={getUserAvatarUrl(user)}
              alt={displayName}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0 flex-1">
          {/* Username row with emoji scale - header only */}
          <div className="mb-2">
            <div className="flex items-center gap-2">
              {hasUsername ? (
                <Link
                  to="/users/$username"
                  params={{ username: username! }}
                  className="flex-shrink-0 truncate text-sm font-medium"
                >
                  @{username}
                </Link>
              ) : (
                <span className="flex-shrink-0 truncate text-sm font-medium">
                  {displayName}
                </span>
              )}
              {/* Emoji rating scale inline with username */}
              <EmojiRatingDisplay
                rating={{
                  emoji: rating.emoji || '😊',
                  value: rating.value || 3,
                  count: 1,
                }}
                vibeId={vibe.id}
                vibeTitle={vibe.title}
                onEmojiClick={handleUnifiedEmojiRating}
                size="sm"
                variant="scale"
                existingUserRatings={vibe.currentUserRatings || []}
                emojiMetadata={emojiMetadata}
              />
            </div>
            <span className="text-muted-foreground block text-xs">
              {rating.createdAt
                ? new Date(rating.createdAt).toLocaleDateString()
                : ''}
            </span>
            {/* Show vibe title for received ratings */}
            {rating.vibe && (
              <span className="text-muted-foreground block text-xs">
                on "{rating.vibe.title}"
              </span>
            )}
          </div>

          {/* Review text */}
          {hasReviewText && (
            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
              {rating.review}
            </p>
          )}

          {/* Footer with action buttons */}
          {showActions && (
            <div className="flex items-center justify-between border-t pt-2">
              <div>
                <EmojiRatingCycleDisplay
                  vibeId={vibe.id}
                  vibeTitle={vibe.title}
                  onEmojiClick={handleUnifiedEmojiRating}
                  existingUserRatings={vibe.currentUserRatings || []}
                  emojiMetadata={emojiMetadata}
                  isOwner={isOwnRating || false}
                />
              </div>
              <div className="flex items-center gap-1">
                {rating._id && (
                  <RatingDootButton
                    ratingId={rating._id as Id<'ratings'>}
                    netScore={voteScore?.netScore || 0}
                    voteStatus={voteStatus || {
                      voteType: null,
                      boosted: false,
                      dampened: false,
                    }}
                    isOwnRating={isOwnRating || false}
                    variant="ghost"
                    size="sm"
                  />
                )}
                <RatingShareButton
                  rating={{
                    ...rating,
                    emoji: rating.emoji || '😊',
                    value: rating.value || 3,
                    review: rating.review || '',
                    createdAt: rating.createdAt || new Date().toISOString(),
                  }}
                  vibe={{
                    ...vibe,
                    createdBy: rating.vibe?.createdBy ? {
                      externalId: rating.vibe.createdBy.id,
                      id: rating.vibe.createdBy.id,
                      username: rating.vibe.createdBy.name,
                      full_name: rating.vibe.createdBy.name,
                      image_url: rating.vibe.createdBy.avatar,
                    } : null,
                  }}
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}