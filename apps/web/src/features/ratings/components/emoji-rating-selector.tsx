import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/tailwind-utils';
import { RatingPopover } from './rating-popover';
import type { EmojiRating, EmojiRatingMetadata } from '@viberatr/types';

interface EmojiRatingSelectorProps {
  topEmojis?: EmojiRating[];
  onSubmit: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  vibeTitle?: string;
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  className?: string;
}

const DEFAULT_EMOJIS = [
  '❓',
  '😍',
  '🔥',
  '😱',
  '💯',
  '😂',
  '🤩',
  '😭',
  '🥺',
  '🤔',
];

/**
 * Button that cycles through emojis and opens a rating popover when clicked.
 * Users can choose an emoji, rate on a scale, and submit an optional review.
 *
 * @param topEmojis list of emojis already rated for the vibe
 * @param onSubmit async handler called with rating data
 * @param isSubmitting disables interaction while true
 * @param vibeTitle optional title of the vibe for display inside the popover
 * @param emojiMetadata metadata map keyed by emoji for color/tag info
 * @param className optional wrapper classes
 */
export function EmojiRatingSelector({
  topEmojis = [],
  onSubmit,
  isSubmitting = false,
  vibeTitle,
  emojiMetadata = {},
  className,
}: EmojiRatingSelectorProps) {
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // create emoji options for cycling animation
  const emojiOptions = React.useMemo(() => {
    if (topEmojis.length > 0) {
      // mix top emojis with question marks
      const emojis = topEmojis.map((r) => r.emoji);
      return [...emojis, '❓', '❓'].slice(0, 10);
    }
    return DEFAULT_EMOJIS;
  }, [topEmojis]);

  // get current emoji data to render in the button
  const currentEmojiData = React.useMemo(() => {
    const emoji = emojiOptions[currentEmojiIndex];
    const topEmojiData = topEmojis.find((e) => e.emoji === emoji);

    if (topEmojiData) {
      return {
        emoji: topEmojiData.emoji,
        value: topEmojiData.value,
        count: topEmojiData.count,
      };
    }

    // return random rating for non-top emojis
    return {
      emoji,
      value: Math.random() * 4 + 1, // random between 1-5
      count: 0,
    };
  }, [currentEmojiIndex, emojiOptions, topEmojis]);

  // cycle through emojis while not hovered to create animation
  React.useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentEmojiIndex((prev) => (prev + 1) % emojiOptions.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [emojiOptions.length, isHovered]);

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-lg font-semibold lowercase">
        rate & review this vibe
      </h3>

      <RatingPopover
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        vibeTitle={vibeTitle}
        emojiMetadata={emojiMetadata}
        preSelectedEmoji={
          isHovered && currentEmojiData.emoji !== '❓'
            ? currentEmojiData.emoji
            : undefined
        }
      >
        <motion.button
          className={cn(
            'relative flex items-center gap-3 rounded-lg',
            'bg-secondary/50 hover:bg-secondary',
            'w-full px-4 py-3',
            'transition-all duration-200',
            'hover:scale-[1.02] active:scale-[0.98]',
            'group cursor-pointer'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-1 items-center gap-3">
            {/* Emoji Container */}
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={currentEmojiData.emoji}
                  className="absolute text-3xl"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut',
                  }}
                >
                  {currentEmojiData.emoji}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Rating Display */}
            <div className="flex-1 text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentEmojiData.emoji}-${currentEmojiData.value}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  {currentEmojiData.emoji === '❓' ? (
                    <p className="text-muted-foreground text-sm">
                      click to rate with an emoji
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {currentEmojiData.value.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          out of 5
                        </span>
                        {currentEmojiData.count &&
                          currentEmojiData.count > 0 && (
                            <span className="text-muted-foreground text-xs">
                              ({currentEmojiData.count} rating
                              {currentEmojiData.count &&
                              currentEmojiData.count !== 1
                                ? 's'
                                : ''}
                              )
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <motion.span
                            key={i}
                            className={cn(
                              'text-xs',
                              i < Math.floor(currentEmojiData.value)
                                ? 'opacity-100'
                                : 'opacity-30'
                            )}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            {currentEmojiData.emoji}
                          </motion.span>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Hover indicator */}
          <motion.div
            className="text-muted-foreground"
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.button>
      </RatingPopover>

      {topEmojis.length === 0 && (
        <p className="text-muted-foreground text-xs">
          be the first to rate this vibe with an emoji!
        </p>
      )}
    </div>
  );
}
