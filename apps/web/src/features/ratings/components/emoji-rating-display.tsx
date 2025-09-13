import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating, Rating } from '@vibechecc/types';
import { AllEmojiRatingsPopover } from './all-emoji-ratings-popover';
import { ChevronDown } from '@/components/ui/icons';
import { RatingScale } from './rating-scale';
import { BoostButton } from './boost-button';
import { RatingDootButton } from './rating-doot-button';
import { RatingLikeButton } from './rating-like-button';
import { api } from '@vibechecc/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';

interface EmojiRatingDisplayProps {
  rating: EmojiRating;
  showScale?: boolean;
  className?: string;
  onEmojiClick?: (emoji: string, value: number) => void;
  emojiColor?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show boost/dampen controls */
  showBoostDampen?: boolean;
  /** The rating ID for boost/dampen actions */
  ratingId?: string;
  /** The author's user ID for the rating */
  ratingAuthorId?: string;
  /** Current boost score */
  boostScore?: number;
  /** Current dampen score */
  dampenScore?: number;
  /** Whether current user has boosted this rating */
  hasUserBoosted?: boolean;
  /** Whether current user has dampened this rating */
  hasUserDampened?: boolean;
  /** Show rating like button */
  showRatingLike?: boolean;
  /** Full rating data for like button */
  fullRatingData?: Rating;
}

export function EmojiRatingDisplay({
  rating,
  showScale = false,
  className,
  onEmojiClick,
  emojiColor,
  size = 'md',
  showBoostDampen = false,
  ratingId,
  ratingAuthorId,
  boostScore = 0,
  dampenScore = 0,
  hasUserBoosted = false,
  hasUserDampened = false,
  showRatingLike = false,
  fullRatingData,
}: EmojiRatingDisplayProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(rating.value);

  React.useEffect(() => {
    setLocalValue(rating.value);
  }, [rating.value]);

  const handleScaleClick = (value: number) => {
    onEmojiClick?.(rating.emoji, value);
  };

  return (
    <div
      className={cn('inline-flex w-full items-center gap-2', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="group"
      aria-label="Rating display"
    >
      {showScale ? (
        // Show the scale when requested
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex min-w-6 items-center gap-1.5">
              <span className="text-sm font-medium">
                {localValue.toFixed(1)}
              </span>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleScaleClick(localValue);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleScaleClick(localValue);
                }
              }}
              onMouseLeave={() => setLocalValue(rating.value)}
              role="button"
              tabIndex={0}
              aria-label={`Rate ${localValue} out of 5`}
            >
              <RatingScale
                emoji={rating.emoji}
                value={localValue}
                size={size}
                showTooltip={true}
                onChange={setLocalValue}
                emojiColor={emojiColor}
              />
            </div>
            {rating.count && (
              <span className="text-muted-foreground text-xs whitespace-pre">
                {rating.count} rating{rating.count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Boost/Dampen/Like Controls */}
          {(showBoostDampen || showRatingLike) &&
            ratingId &&
            ratingAuthorId && (
              <div className="flex items-center gap-2 pl-10">
                {showBoostDampen && (
                  <>
                    <BoostButton
                      ratingId={ratingId}
                      authorUserId={ratingAuthorId}
                      currentBoostScore={boostScore}
                      hasUserBoosted={hasUserBoosted}
                      size="sm"
                      showScore={true}
                    />
                    <RatingDootButton
                      ratingId={ratingId}
                      authorUserId={ratingAuthorId}
                      currentDampenScore={dampenScore}
                      hasUserDampened={hasUserDampened}
                      size="sm"
                      showScore={true}
                    />
                  </>
                )}
                {showRatingLike && fullRatingData && (
                  <RatingLikeButton
                    rating={fullRatingData}
                    variant="minimal"
                    size="sm"
                    showCount={true}
                  />
                )}
              </div>
            )}
        </div>
      ) : (
        // Show the compact rating display with optional boost/dampen
        <div className="flex w-full items-center gap-2">
          <div
            className="bg-secondary/50 hover:bg-secondary inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-sm font-medium transition-all hover:scale-105 active:scale-95"
            onClick={() => {
              onEmojiClick?.(rating.emoji, rating.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEmojiClick?.(rating.emoji, rating.value);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`${rating.emoji} rating ${rating.value} out of 5`}
          >
            <span
              className="data-[hover=true]:animate-wiggle text-base transition-transform duration-500"
              data-hover={isHovered ? 'true' : 'false'}
              style={emojiColor ? { color: emojiColor } : undefined}
            >
              {rating.emoji}
            </span>
            <span>{rating.value.toFixed(1)}</span>
            {rating.count && (
              <span className="text-muted-foreground">({rating.count})</span>
            )}
          </div>

          {/* Boost/Dampen/Like Controls for compact view */}
          {(showBoostDampen || showRatingLike) &&
            ratingId &&
            ratingAuthorId && (
              <div className="flex items-center gap-1">
                {showBoostDampen && (
                  <>
                    <BoostButton
                      ratingId={ratingId}
                      authorUserId={ratingAuthorId}
                      currentBoostScore={boostScore}
                      hasUserBoosted={hasUserBoosted}
                      size="sm"
                      showScore={true}
                    />
                    <RatingDootButton
                      ratingId={ratingId}
                      authorUserId={ratingAuthorId}
                      currentDampenScore={dampenScore}
                      hasUserDampened={hasUserDampened}
                      size="sm"
                      showScore={true}
                    />
                  </>
                )}
                {showRatingLike && fullRatingData && (
                  <RatingLikeButton
                    rating={fullRatingData}
                    variant="minimal"
                    size="sm"
                    showCount={true}
                  />
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

interface TopEmojiRatingsProps {
  emojiRatings: EmojiRating[];
  expanded?: boolean;
  className?: string;
  onExpandToggle?: () => void;
  onEmojiClick?: (emoji: string, value: number) => void;
  vibeId?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show boost/dampen controls */
  showBoostDampen?: boolean;
  /** Map of rating ID to rating metadata for boost/dampen */
  ratingMetadata?: Record<
    string,
    {
      ratingId: string;
      authorUserId: string;
      boostScore?: number;
      dampenScore?: number;
      hasUserBoosted?: boolean;
      hasUserDampened?: boolean;
    }
  >;
}

export { type EmojiRating };

export function TopEmojiRatings({
  emojiRatings,
  expanded = false,
  className,
  onExpandToggle,
  onEmojiClick,
  vibeId,
  size = 'md',
  showBoostDampen = false,
  ratingMetadata = {},
}: TopEmojiRatingsProps) {
  const [showAllRatingsPopover, setShowAllRatingsPopover] =
    React.useState(false);
  const displayRatings = expanded ? emojiRatings : emojiRatings.slice(0, 3);

  // Fetch emoji metadata for colors
  const emojis = displayRatings.map((r) => r.emoji);
  const emojiDataQuery = useQuery({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep - Convex generated types
    ...convexQuery(api.emojis.getByEmojis, { emojis }),
    enabled: emojis.length > 0,
  });
  // Convert array to map for easy lookup
  const emojiDataMap = React.useMemo(() => {
    const emojiDataArray = emojiDataQuery.data || [];
    const map: Record<string, { color?: string }> = {};
    if (Array.isArray(emojiDataArray)) {
      emojiDataArray.forEach((data) => {
        map[data.emoji] = data;
      });
    }
    return map;
  }, [emojiDataQuery.data]);

  return (
    <div className={cn('space-y-2', className)}>
      {displayRatings.map((rating, index) => (
        <div
          key={`${rating.emoji}-${index}`}
          className="data-[mounted=true]:animate-in data-[mounted=true]:fade-in-0 data-[mounted=true]:slide-in-from-top-2 data-[mounted=true]:fill-mode-both data-[mounted=true]:duration-300"
          data-mounted="true"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <EmojiRatingDisplay
            rating={rating}
            showScale={expanded}
            onEmojiClick={onEmojiClick}
            emojiColor={emojiDataMap[rating.emoji]?.color}
            size={size}
            showBoostDampen={showBoostDampen}
            ratingId={ratingMetadata[rating.emoji]?.ratingId}
            ratingAuthorId={ratingMetadata[rating.emoji]?.authorUserId}
            boostScore={ratingMetadata[rating.emoji]?.boostScore}
            dampenScore={ratingMetadata[rating.emoji]?.dampenScore}
            hasUserBoosted={ratingMetadata[rating.emoji]?.hasUserBoosted}
            hasUserDampened={ratingMetadata[rating.emoji]?.hasUserDampened}
          />
        </div>
      ))}
      {emojiRatings?.length > 1 && (
        <AllEmojiRatingsPopover
          emojiRatings={emojiRatings}
          onEmojiClick={onEmojiClick}
          open={showAllRatingsPopover}
          onOpenChange={setShowAllRatingsPopover}
          vibeId={vibeId}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAllRatingsPopover(true);
            }}
            className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs whitespace-pre transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
            <span>{emojiRatings.length - 1} more</span>
          </button>
        </AllEmojiRatingsPopover>
      )}
      {emojiRatings.length > 3 && onExpandToggle && (
        <button
          onClick={onExpandToggle}
          className="text-muted-foreground hover:text-foreground text-xs whitespace-pre transition-colors"
        >
          {expanded
            ? 'show less'
            : `show ${emojiRatings.length - 3} more rating${emojiRatings.length - 3 !== 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
