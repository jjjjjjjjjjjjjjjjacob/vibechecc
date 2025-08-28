import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating, EmojiRatingMetadata, CurrentUserRating } from '@vibechecc/types';
import { AllEmojiRatingsPopover } from './all-emoji-ratings-popover';
import { ChevronDown } from '@/components/ui/icons';
import { api } from '@vibechecc/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { EmojiRatingDisplay } from './emoji-rating-display';
import type { UnifiedEmojiRatingHandler } from './emoji-reaction';

interface EmojiRatingsListProps {
  emojiRatings: EmojiRating[];
  vibeId: string;
  expanded?: boolean;
  className?: string;
  onExpandToggle?: () => void;
  onEmojiClick?: (emoji: string, value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'color' | 'gradient';
  existingUserRatings?: CurrentUserRating[];
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
}

export function EmojiRatingsList({
  emojiRatings,
  vibeId,
  expanded = false,
  className,
  onExpandToggle,
  onEmojiClick,
  size: _size = 'md',
  variant: _variant = 'color',
  existingUserRatings = [],
  emojiMetadata = {},
}: EmojiRatingsListProps) {
  const [showAllRatingsPopover, setShowAllRatingsPopover] =
    React.useState(false);
  const displayRatings = expanded ? emojiRatings : emojiRatings.slice(0, 3);

  // Fetch emoji metadata for colors
  const emojis = displayRatings.map((r) => r.emoji);
  const emojiDataQuery = useQuery({
    ...convexQuery(api.emojis.getByEmojis, { emojis }),
    enabled: emojis.length > 0,
  });

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

  // Convert to unified handler
  const unifiedHandler: UnifiedEmojiRatingHandler | undefined = onEmojiClick
    ? async ({ emoji, value, review }) => {
        if (review) {
          return;
        }
        onEmojiClick(emoji, value);
      }
    : undefined;

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
            rating={{
              emoji: rating.emoji,
              value: rating.value,
              count: rating.count || 0,
            }}
            vibeId={vibeId}
            onEmojiClick={unifiedHandler!}
            existingUserRatings={existingUserRatings}
            emojiMetadata={emojiMetadata}
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
          onClick={(e) => {
            e.stopPropagation();
            onExpandToggle?.();
          }}
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
