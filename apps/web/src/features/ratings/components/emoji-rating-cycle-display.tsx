import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { RatingPopover } from './rating-popover';
import type { EmojiRatingMetadata } from '@vibechecc/types';

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

const DEFAULT_EMOJIS = [
  '👀',
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
  // Start at a random emoji index for visual variety
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(() =>
    Math.floor(Math.random() * DEFAULT_EMOJIS.length)
  );
  const [isHovered, setIsHovered] = React.useState(false);
  const [userInteracted, setUserInteracted] = React.useState(false);
  const [selectedEmoji, setSelectedEmoji] = React.useState<string | undefined>(
    undefined
  );
  const [emojiTransition, setEmojiTransition] = React.useState<
    'in' | 'out' | 'idle'
  >('idle');

  const emojiOptions = DEFAULT_EMOJIS;

  // Get current emoji
  const currentEmoji = emojiOptions[currentEmojiIndex];

  // Generate a random initial delay between 0-2000ms for staggering
  const randomInitialDelay = React.useMemo(
    () => Math.floor(Math.random() * 2000),
    []
  );

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

    // Use the combined delay (prop delay + random initial delay)
    const totalDelay = delay + randomInitialDelay;

    if (totalDelay > 0) {
      const delayTimeout = setTimeout(() => {
        const interval = startCycling();
        return () => clearInterval(interval);
      }, totalDelay);

      return () => clearTimeout(delayTimeout);
    } else {
      const interval = startCycling();
      return () => clearInterval(interval);
    }
  }, [emojiOptions.length, isHovered, delay, randomInitialDelay]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setUserInteracted(true);
    setSelectedEmoji(currentEmoji);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Don't reset userInteracted here - keep it true once user has interacted
  };

  const handleClick = () => {
    setUserInteracted(true);
    setSelectedEmoji(currentEmoji);
  };

  return (
    <RatingPopover
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      vibeTitle={vibeTitle}
      emojiMetadata={emojiMetadata}
      preSelectedEmoji={
        userInteracted && selectedEmoji ? selectedEmoji : undefined
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
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
