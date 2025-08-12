/**
 * Cycles through a set of emojis until the user hovers, then lets them rate via a popover.
 * Provides an inviting call-to-action for first-time ratings.
 */
import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { RatingPopover } from './rating-popover';
import type { EmojiRatingMetadata } from '@viberatr/types';

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
  variant?: 'color' | 'gradient';
  showBeTheFirst?: boolean;
  delay?: number;
}

// Emojis shown while cycling through options
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
  showBeTheFirst = false,
  delay = 0,
  // variant = 'color',
}: EmojiRatingCycleDisplayProps) {
  // Index into the emoji array for the currently displayed symbol
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(0);
  // Pause cycling when user hovers so they can click a specific emoji
  const [isHovered, setIsHovered] = React.useState(false);
  // Track transition state for CSS animations
  const [emojiTransition, setEmojiTransition] = React.useState<
    'in' | 'out' | 'idle'
  >('idle');

  const emojiOptions = DEFAULT_EMOJIS;

  // Get current emoji
  const currentEmoji = emojiOptions[currentEmojiIndex];

  // Cycle through emojis with CSS transitions
  React.useEffect(() => {
    if (isHovered) return;

    const startCycling = () => {
      const interval = setInterval(() => {
        setEmojiTransition('out');

        setTimeout(() => {
          setCurrentEmojiIndex((prev) => (prev + 1) % emojiOptions.length);
          setEmojiTransition('in');

          setTimeout(() => {
            setEmojiTransition('idle');
          }, 300);
        }, 150);
      }, 2500);

      return interval;
    };

    if (delay > 0) {
      const delayTimeout = setTimeout(() => {
        const interval = startCycling();
        return () => clearInterval(interval);
      }, delay);

      return () => clearTimeout(delayTimeout);
    } else {
      const interval = startCycling();
      return () => clearInterval(interval);
    }
  }, [emojiOptions.length, isHovered, delay]);

  return (
    <RatingPopover
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      vibeTitle={vibeTitle}
      emojiMetadata={emojiMetadata}
      preSelectedEmoji={
        isHovered && currentEmoji !== '❓' ? currentEmoji : undefined
      }
    >
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'bg-secondary/50 hover:bg-secondary inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-sm font-medium transition-all',
          'hover:animate-scale-spring active:scale-95',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
          }
        }}
      >
        <div className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
          <span
            key={currentEmoji}
            className={cn(
              'absolute text-base transition-all duration-300 ease-out',
              emojiTransition === 'in' && 'animate-emoji-slide-in',
              emojiTransition === 'out' && 'animate-emoji-slide-out',
              emojiTransition === 'idle' && 'transform-none opacity-100'
            )}
          >
            {currentEmoji}
          </span>
        </div>

        <span className="text-muted-foreground text-xs transition-opacity duration-200">
          {showBeTheFirst
            ? 'be the first to rate'
            : currentEmoji === '❓'
              ? 'rate'
              : 'click to rate'}
        </span>
      </div>
    </RatingPopover>
  );
}
