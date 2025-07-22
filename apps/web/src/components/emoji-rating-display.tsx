import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { EmojiReaction, EmojiRating } from '@vibechecc/types';

interface EmojiRatingDisplayProps {
  rating: EmojiRating;
  mode?: 'compact' | 'expanded';
  showScale?: boolean;
  className?: string;
  onEmojiClick?: (emoji: string) => void;
}

export function EmojiRatingDisplay({
  rating,
  mode = 'compact',
  showScale = false,
  className,
  onEmojiClick,
}: EmojiRatingDisplayProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Render filled and unfilled emojis for the scale
  const renderEmojiScale = () => {
    const filled = rating.value;
    const hasPartial = rating.value % 1 !== 0;
    const partialFill = rating.value % 1;
    const unfilled = 5 - rating.value;

    return (
      <div
        className="flex items-center gap-0.5"
        onClick={() => onEmojiClick?.(rating.emoji)}
      >
        {[...Array(filled)].map((_, i) => (
          <motion.span
            key={`filled-${i}`}
            className="text-lg transition-transform hover:scale-110"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            {rating.emoji}
          </motion.span>
        ))}
        {hasPartial && (
          <motion.span
            key="partial"
            className="relative inline-block text-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: filled * 0.05 }}
          >
            <span className="opacity-30">{rating.emoji}</span>
            <span
              className="absolute inset-0 top-0 left-0 overflow-hidden"
              style={{ width: `${partialFill * 100}%` }}
            >
              <span className="block">{rating.emoji}</span>
            </span>
          </motion.span>
        )}
        {[...Array(unfilled)].map((_, i) => (
          <motion.span
            key={`unfilled-${i}`}
            className="text-lg opacity-30 transition-transform hover:scale-110"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: (filled + (hasPartial ? 1 : 0) + i) * 0.05 }}
          >
            {rating.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  if (mode === 'compact') {
    return (
      <motion.div
        className={cn('inline-flex items-center gap-2', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showScale ? (
          // Show the scale when requested
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">
                {rating.value.toFixed(1)}
              </span>
            </div>
            {renderEmojiScale()}
            {rating.count && (
              <span className="text-muted-foreground text-xs">
                {rating.count} ratings
              </span>
            )}
          </div>
        ) : (
          // Show the compact rating display
          <motion.div
            className="bg-secondary/50 hover:bg-secondary inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-sm font-medium transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => {
              onEmojiClick?.(rating.emoji);
            }}
          >
            <motion.span
              className="text-base"
              animate={{ rotate: isHovered ? [0, -10, 10, 0] : 0 }}
              transition={{ duration: 0.5 }}
            >
              {rating.emoji}
            </motion.span>
            <span>{rating.value.toFixed(1)}</span>
            {rating.count && (
              <span className="text-muted-foreground">({rating.count})</span>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Expanded mode
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{rating.emoji}</span>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">{rating.value.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">out of 5</span>
          </div>
          {rating.count && (
            <span className="text-muted-foreground text-xs">
              {rating.count} rating{rating.count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {showScale && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderEmojiScale()}
        </motion.div>
      )}

      {rating.tags && rating.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rating.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary/50 rounded-full px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
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
  onEmojiClick?: (emoji: string) => void;
}

export { type EmojiRating };

export function TopEmojiRatings({
  emojiRatings,
  expanded = false,
  className,
  onExpandToggle,
  onEmojiClick,
}: TopEmojiRatingsProps) {
  const displayRatings = expanded ? emojiRatings : emojiRatings.slice(0, 3);

  return (
    <div className={cn('space-y-2', className)}>
      <AnimatePresence mode="popLayout">
        {displayRatings.map((rating, index) => (
          <motion.div
            key={`${rating.emoji}-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
          >
            <div
              onClick={() => onEmojiClick?.(rating.emoji)}
              className={cn(
                onEmojiClick &&
                  'cursor-pointer transition-transform hover:scale-105'
              )}
            >
              <EmojiRatingDisplay
                rating={rating}
                mode="compact"
                showScale={expanded}
                onEmojiClick={onEmojiClick}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {emojiRatings.length > 3 && onExpandToggle && (
        <button
          onClick={onExpandToggle}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          {expanded
            ? 'show less'
            : `show ${emojiRatings.length - 3} more rating${emojiRatings.length - 3 !== 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}

// Helper function to get the most-interacted emoji rating
export function getMostInteractedEmojiRating(
  reactions: EmojiReaction[]
): EmojiRating | null {
  if (!reactions || reactions.length === 0) return null;

  // Sort by count to find the most popular
  const sorted = [...reactions].sort((a, b) => b.count - a.count);
  const topReaction = sorted[0];

  // For now, we'll simulate a rating value based on count
  // In real implementation, this would come from the backend
  return {
    emoji: topReaction.emoji,
    value: Math.min(5, Math.max(1, Math.round(topReaction.count / 2))), // Temporary logic
    count: topReaction.count,
  };
}
