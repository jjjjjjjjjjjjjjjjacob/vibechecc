import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { useUser } from '@clerk/tanstack-react-start';
import { RateAndReviewDialog } from './rate-and-review-dialog';
import { AuthPromptDialog } from '@/features/auth';
import type { EmojiRatingMetadata, CurrentUserRating } from '@vibechecc/types';
import type { UnifiedEmojiRatingHandler } from './emoji-reaction';
import { Button } from '@/components/ui';

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
  textContrast?: 'light' | 'dark';
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
  onEmojiClick: _onEmojiClick,
  isSubmitting: _isSubmitting = false,
  vibeTitle,
  emojiMetadata = {},
  existingUserRatings,
  className,
  showBeTheFirst = false,
  delay = 0,
  isOwner = false,
  textContrast,
  // variant = 'color',
}: EmojiRatingCycleDisplayProps) {
  const { user } = useUser();

  // Helper function to get contrast-aware button classes
  const getButtonClasses = (textContrast?: 'light' | 'dark') => {
    if (textContrast === 'light') {
      return 'bg-white/20 hover:bg-white/30 text-black/90';
    } else if (textContrast === 'dark') {
      return 'bg-white/20 hover:bg-white/30 text-white/90';
    }
    return 'bg-white/20 hover:bg-white/30 text-foreground';
  };

  // Helper function to get contrast-aware text classes
  const getTextClasses = (textContrast?: 'light' | 'dark') => {
    if (textContrast === 'light') {
      return 'text-black/70';
    } else if (textContrast === 'dark') {
      return 'text-white/70';
    }
    return 'text-secondary-foreground';
  };

  // Start at a random emoji index for visual variety
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(() =>
    Math.floor(Math.random() * DEFAULT_EMOJIS.length)
  );
  const [isHovered, setIsHovered] = React.useState(false);
  const [emojiTransition, setEmojiTransition] = React.useState<
    'in' | 'out' | 'idle'
  >('idle');
  const [isOpen, setIsOpen] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);

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
    <>
      <RateAndReviewDialog
        vibeId={vibeId}
        vibeTitle={vibeTitle}
        isOwner={isOwner}
        preSelectedEmoji={
          isHovered && currentEmoji !== '❓' ? currentEmoji : undefined
        }
        existingUserRatings={existingUserRatings}
        emojiMetadata={emojiMetadata}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <Button
          tabIndex={0}
          className={cn(
            'inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-sm font-medium transition-all',
            'hover:animate-scale-spring active:scale-95',
            getButtonClasses(textContrast),
            className
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.preventDefault();

            // Check authentication first
            if (!user) {
              setShowAuthDialog(true);
              return;
            }

            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();

              // Check authentication first
              if (!user) {
                setShowAuthDialog(true);
                return;
              }

              setIsOpen(true);
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

          <span
            className={cn(
              'text-xs transition-opacity duration-200',
              getTextClasses(textContrast)
            )}
          >
            {showBeTheFirst
              ? 'be the first to rate'
              : currentEmoji === '❓'
                ? 'rate'
                : 'click to rate'}
          </span>
        </Button>
      </RateAndReviewDialog>

      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to rate"
        description="you must sign in to rate vibes with emojis"
      />
    </>
  );
}
