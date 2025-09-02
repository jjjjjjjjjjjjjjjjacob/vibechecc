import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { RateAndReviewDialog } from './rate-and-review-dialog';
import type {
  EmojiRating,
  EmojiRatingMetadata,
  CurrentUserRating,
} from '@vibechecc/types';

interface RevolvingRateReviewButtonProps {
  vibeId: string;
  topEmojis?: EmojiRating[];
  vibeTitle?: string;
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  existingUserRatings: CurrentUserRating[];
  className?: string;
  isOwner?: boolean;
  onSuccess?: (data: { emoji: string; value: number; review: string }) => void;
  onError?: (error: Error) => void;
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

export function RevolvingRateReviewButton({
  vibeId,
  topEmojis = [],
  vibeTitle,
  emojiMetadata = {},
  existingUserRatings,
  className,
  isOwner = false,
  onSuccess,
  onError,
}: RevolvingRateReviewButtonProps) {
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [showDialog, setShowDialog] = React.useState(false);
  const [preSelectedEmoji, setPreSelectedEmoji] = React.useState<
    string | undefined
  >();
  const [preSelectedValue, setPreSelectedValue] = React.useState<
    number | undefined
  >();

  // Create emoji options for cycling animation
  const emojiOptions = React.useMemo(() => {
    if (topEmojis.length > 0) {
      // Mix top emojis with default emojis
      const emojis = topEmojis
        .map((r) => r.emoji)
        .concat(
          topEmojis.length > 5
            ? []
            : Array(5 - topEmojis.length)
                .fill(null)
                .map(
                  () =>
                    DEFAULT_EMOJIS[
                      Math.floor(Math.random() * DEFAULT_EMOJIS.length)
                    ]
                )
        );
      return emojis.slice(0, 10);
    }
    return DEFAULT_EMOJIS;
  }, [topEmojis]);

  // Get current emoji data
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

    // Return random rating for non-top emojis
    return {
      emoji,
      value: Math.random() * 4 + 1, // Random between 1-5
      count: 0,
    };
  }, [currentEmojiIndex, emojiOptions, topEmojis]);

  // Cycle through emojis
  React.useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentEmojiIndex((prev) => (prev + 1) % emojiOptions.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [emojiOptions.length, isHovered]);

  const handleClick = () => {
    // Set pre-selected data from the currently displayed emoji
    if (isHovered && currentEmojiData.emoji !== '❓') {
      setPreSelectedEmoji(currentEmojiData.emoji);
      setPreSelectedValue(currentEmojiData.value);
    } else {
      setPreSelectedEmoji(undefined);
      setPreSelectedValue(undefined);
    }
    setShowDialog(true);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-lg font-semibold lowercase">
        rate & review this vibe
      </h3>

      <RateAndReviewDialog
        vibeId={vibeId}
        vibeTitle={vibeTitle}
        emojiMetadata={emojiMetadata}
        existingUserRatings={existingUserRatings}
        isOwner={isOwner}
        preSelectedEmoji={preSelectedEmoji}
        preSelectedValue={preSelectedValue}
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={(data) => {
          onSuccess?.(data);
          // Reset pre-selected data after successful submission
          setPreSelectedEmoji(undefined);
          setPreSelectedValue(undefined);
        }}
        onError={onError}
      >
        <button
          className={cn(
            'relative flex items-center gap-3 rounded-lg',
            'bg-secondary/50 hover:bg-secondary',
            'w-full px-4 py-3',
            'transition-all duration-200',
            'hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]',
            'group cursor-pointer'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          <div className="flex flex-1 items-center gap-3">
            {/* Emoji Container */}
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden">
              <span
                key={currentEmojiData.emoji}
                className={cn(
                  'absolute text-3xl',
                  'animate-in fade-in-0 slide-in-from-right-8',
                  'duration-300'
                )}
              >
                {currentEmojiData.emoji}
              </span>
            </div>

            {/* Rating Display */}
            <div className="flex-1 text-left">
              <div
                key={`${currentEmojiData.emoji}-${currentEmojiData.value}`}
                className={cn(
                  'space-y-1',
                  'animate-in fade-in-0 slide-in-from-bottom-2',
                  'duration-200'
                )}
              >
                {currentEmojiData.emoji === '❓' ||
                currentEmojiData.count === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {currentEmojiData.count === 0
                      ? `be the first to rate with ${currentEmojiData.emoji}`
                      : 'click to rate with an emoji'}
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
                      {currentEmojiData.count && currentEmojiData.count > 0 && (
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
                        <span
                          key={i}
                          className={cn(
                            'text-xs',
                            'animate-in zoom-in-50 duration-200',
                            i < Math.floor(currentEmojiData.value)
                              ? 'opacity-100'
                              : 'opacity-30'
                          )}
                          style={{
                            animationDelay: `${i * 50}ms`,
                          }}
                        >
                          {currentEmojiData.emoji}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Hover indicator */}
          <div
            className={cn(
              'text-muted-foreground transition-transform duration-200',
              isHovered && 'translate-x-1'
            )}
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
          </div>
        </button>
      </RateAndReviewDialog>

      {topEmojis.length === 0 && (
        <p className="text-muted-foreground text-xs">
          be the first to rate this vibe with an emoji!
        </p>
      )}
    </div>
  );
}
