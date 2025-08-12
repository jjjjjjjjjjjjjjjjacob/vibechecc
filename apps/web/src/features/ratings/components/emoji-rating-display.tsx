import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating } from '@viberatr/types';
import { AllEmojiRatingsPopover } from './all-emoji-ratings-popover';
import { ChevronDown } from 'lucide-react';
import { RatingScale } from './rating-scale';
import { api } from '@viberatr/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';

interface EmojiRatingDisplayProps {
  rating: EmojiRating;
  showScale?: boolean;
  className?: string;
  onEmojiClick?: (emoji: string, value: number) => void;
  variant?: 'color' | 'gradient';
  emojiColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Render a single emoji rating. When `showScale` is true a full rating scale
 * is displayed, otherwise a compact pill showing the current value.
 *
 * @param rating base rating data including emoji and value
 * @param showScale whether to render interactive scale instead of pill
 * @param className optional tailwind classes for the wrapper
 * @param onEmojiClick callback fired when user clicks the emoji or scale
 * @param variant determines color treatment of the scale
 * @param emojiColor explicit color to apply to the emoji glyph
 * @param size size of the scale or emoji
 */
export function EmojiRatingDisplay({
  rating,
  showScale = false,
  className,
  onEmojiClick,
  variant = 'color',
  emojiColor,
  size = 'md',
}: EmojiRatingDisplayProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(rating.value);

  // keep local state in sync when rating changes externally
  React.useEffect(() => {
    setLocalValue(rating.value);
  }, [rating.value]);

  // proxy scale selections back to parent component
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
        <div className="flex w-full items-center gap-2">
          <div className="flex min-w-6 items-center gap-1.5">
            <span className="text-sm font-medium">{localValue.toFixed(1)}</span>
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
              variant={variant}
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
      ) : (
        // Show the compact rating display
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
  variant?: 'color' | 'gradient';
}

export { type EmojiRating };

/**
 * Display a list of top emoji ratings, optionally expandable to reveal all
 * ratings. Colors for each emoji are retrieved via a Convex query.
 *
 * @param emojiRatings array of rating objects to show
 * @param expanded whether the full list is shown
 * @param className optional wrapper classes
 * @param onExpandToggle handler to expand or collapse the list
 * @param onEmojiClick callback when an emoji rating is clicked
 * @param vibeId optional vibe id passed to the popover for context
 * @param size scale size passed to child displays
 * @param variant color variant used by children
 */
export function TopEmojiRatings({
  emojiRatings,
  expanded = false,
  className,
  onExpandToggle,
  onEmojiClick,
  vibeId,
  size = 'md',
  variant = 'color',
}: TopEmojiRatingsProps) {
  const [showAllRatingsPopover, setShowAllRatingsPopover] =
    React.useState(false);
  // choose which ratings to show based on expand state
  const displayRatings = expanded ? emojiRatings : emojiRatings.slice(0, 3);

  // fetch emoji metadata for colors
  const emojis = displayRatings.map((r) => r.emoji);
  const emojiDataQuery = useQuery({
    ...convexQuery(api.emojis.getByEmojis, { emojis }),
    enabled: emojis.length > 0,
  });
  // convert array result into a map for quick lookup by emoji
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
            variant={variant}
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
