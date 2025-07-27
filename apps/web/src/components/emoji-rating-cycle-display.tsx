import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/tailwind-utils';
import { EmojiRatingPopover } from './emoji-rating-popover';
import type { EmojiRatingMetadata } from '@viberater/types';

interface EmojiRatingCycleDisplayProps {
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

export function EmojiRatingCycleDisplay({
  onSubmit,
  isSubmitting = false,
  vibeTitle,
  emojiMetadata = {},
  className,
}: EmojiRatingCycleDisplayProps) {
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  const emojiOptions = DEFAULT_EMOJIS;

  // Get current emoji
  const currentEmoji = emojiOptions[currentEmojiIndex];

  // Cycle through emojis
  React.useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentEmojiIndex((prev) => (prev + 1) % emojiOptions.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [emojiOptions.length, isHovered]);

  return (
    <EmojiRatingPopover
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      vibeTitle={vibeTitle}
      emojiMetadata={emojiMetadata}
      preSelectedEmoji={
        isHovered && currentEmoji !== '❓' ? currentEmoji : undefined
      }
    >
      <motion.div
        className={cn(
          'bg-secondary/50 hover:bg-secondary inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-sm font-medium transition-all hover:scale-105 active:scale-95',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={currentEmoji}
              className="absolute text-base"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
            >
              {currentEmoji}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={currentEmoji === '❓' ? 'rate' : 'click'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground"
          >
            {currentEmoji === '❓' ? 'rate' : 'click to rate'}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </EmojiRatingPopover>
  );
}
