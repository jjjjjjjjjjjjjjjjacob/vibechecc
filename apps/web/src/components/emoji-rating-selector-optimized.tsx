import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { EmojiRatingPopover } from './emoji-rating-popover';
import type { EmojiRating, EmojiRatingMetadata } from '@viberater/types';

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

export function EmojiRatingSelectorOptimized({
  topEmojis = [],
  onSubmit,
  isSubmitting = false,
  vibeTitle,
  emojiMetadata = {},
  className,
}: EmojiRatingSelectorProps) {
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [emojiTransition, setEmojiTransition] = React.useState<'in' | 'out' | 'idle'>('idle');

  // Create emoji options for cycling animation
  const emojiOptions = React.useMemo(() => {
    if (topEmojis.length > 0) {
      const emojis = topEmojis.map((r) => r.emoji);
      return [...emojis, '❓', '❓'].slice(0, 10);
    }
    return DEFAULT_EMOJIS;
  }, [topEmojis]);

  // Get current emoji data
  const currentEmojiData = React.useMemo(() => {
    const emoji = emojiOptions[currentEmojiIndex];
    const rating = topEmojis.find((r) => r.emoji === emoji);
    const metadata = emojiMetadata[emoji];

    return {
      emoji,
      value: rating?.value || 3,
      averageRating: rating?.averageRating,
      totalRatings: rating?.totalRatings || 0,
      name: metadata?.name || 'unknown',
    };
  }, [emojiOptions, currentEmojiIndex, topEmojis, emojiMetadata]);

  // Auto-cycle through emojis
  React.useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setEmojiTransition('out');
      
      setTimeout(() => {
        setCurrentEmojiIndex((prev) => (prev + 1) % emojiOptions.length);
        setEmojiTransition('in');
        
        setTimeout(() => {
          setEmojiTransition('idle');
        }, 300);
      }, 150);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, emojiOptions.length]);

  return (
    <div className={cn('w-full', className)}>
      <EmojiRatingPopover
        emoji={currentEmojiData.emoji}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        vibeTitle={vibeTitle}
        metadata={emojiMetadata[currentEmojiData.emoji]}
        trigger={
          currentEmojiData.totalRatings > 0 && currentEmojiData.averageRating
            ? Math.round(currentEmojiData.averageRating)
            : undefined
        }
      >
        <button
          className={cn(
            'relative flex items-center gap-3 rounded-lg',
            'bg-secondary/50 hover:bg-secondary',
            'border border-border hover:border-border/70',
            'p-4 transition-all duration-200',
            'hover:shadow-sm focus:outline-none focus:ring-2',
            'focus:ring-ring focus:ring-offset-2',
            'group w-full text-left'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex flex-1 items-center gap-3">
            {/* Emoji Container */}
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden">
              <span
                key={currentEmojiData.emoji}
                className={cn(
                  'absolute text-3xl transition-all duration-300 ease-out',
                  emojiTransition === 'in' && 'animate-emoji-slide-in',
                  emojiTransition === 'out' && 'animate-emoji-slide-out',
                  emojiTransition === 'idle' && 'opacity-100 transform-none'
                )}
              >
                {currentEmojiData.emoji}
              </span>
            </div>

            {/* Rating Display */}
            <div className="flex-1 text-left">
              <div
                key={`${currentEmojiData.emoji}-${currentEmojiData.value}`}
                className="animate-rating-reveal"
              >
                <div className="text-foreground font-medium">
                  rate with {currentEmojiData.name}
                </div>
                {currentEmojiData.totalRatings > 0 ? (
                  <>
                    <div className="text-muted-foreground text-sm">
                      avg: {currentEmojiData.averageRating?.toFixed(1)} • {currentEmojiData.totalRatings} rating
                      {currentEmojiData.totalRatings !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'text-xs transition-all duration-200',
                            i < (currentEmojiData.averageRating || 0)
                              ? 'opacity-100'
                              : 'opacity-30'
                          )}
                          style={{ 
                            animationDelay: `${i * 0.05}s`,
                            animation: 'stagger-fade-in 0.4s ease-out forwards'
                          }}
                        >
                          {currentEmojiData.emoji}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    be the first to rate!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hover indicator */}
          <div 
            className={cn(
              'text-muted-foreground transition-transform duration-200',
              isHovered && 'animate-arrow-slide'
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
      </EmojiRatingPopover>

      {topEmojis.length === 0 && (
        <div className="mt-2 text-center">
          <p className="text-muted-foreground text-sm">
            no ratings yet — be the first!
          </p>
        </div>
      )}
    </div>
  );
}