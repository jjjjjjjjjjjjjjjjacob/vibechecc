import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { RateAndReviewDialog } from './rate-and-review-dialog';
import type { EmojiRatingMetadata, Rating, CurrentUserRating } from '@vibechecc/types';
import type { UnifiedEmojiRatingHandler } from './emoji-reaction';

interface EmojiRatingCycleDisplayProps {
  vibeId: string;
  onEmojiClick: UnifiedEmojiRatingHandler;
  isSubmitting?: boolean;
  vibeTitle?: string;
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  existingUserRatings: CurrentUserRating[];
  className?: string;
  variant?: 'color' | 'gradient';
  showBeTheFirst?: boolean;
  delay?: number;
  isOwner?: boolean;
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
  vibeId,
  onEmojiClick,
  isSubmitting = false,
  vibeTitle,
  emojiMetadata = {},
  existingUserRatings,
  className,
  showBeTheFirst = false,
  delay = 0,
  isOwner = false,
  // variant = 'color',
}: EmojiRatingCycleDisplayProps) {
  // Start at a random emoji index for visual variety
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(() =>
    Math.floor(Math.random() * DEFAULT_EMOJIS.length)
  );
  const [isHovered, setIsHovered] = React.useState(false);
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
      let interval: NodeJS.Timeout | null = null;

      const delayTimeout = setTimeout(() => {
        interval = startCycling();
      }, totalDelay);

      return () => {
        clearTimeout(delayTimeout);
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      const interval = startCycling();
      return () => clearInterval(interval);
    }
  }, [emojiOptions.length, isHovered, delay, randomInitialDelay]);

  return (
    <RateAndReviewDialog
      vibeId={vibeId}
      vibeTitle={vibeTitle}
      isOwner={isOwner}
      preSelectedEmoji={
        isHovered && currentEmoji !== '❓' ? currentEmoji : undefined
      }
      existingUserRatings={existingUserRatings}
      emojiMetadata={emojiMetadata}
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
        onClick={(e) => e.stopPropagation()}
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
    </RateAndReviewDialog>
  );
}
