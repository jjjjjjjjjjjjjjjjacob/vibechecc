import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { useUser } from '@clerk/tanstack-react-start';
import type {
  EmojiRating,
  EmojiRatingMetadata,
  CurrentUserRating,
} from '@vibechecc/types';
import { RatingScale } from './rating-scale';
import { RateAndReviewDialog } from './rate-and-review-dialog';
import { AuthPromptDialog } from '@/features/auth';
import type {
  EmojiRatingData,
  UnifiedEmojiRatingHandler,
} from './emoji-reaction';
import { Button } from '@/components/ui';

interface EmojiRatingDisplayProps {
  rating: EmojiRatingData;
  vibeId: string;
  onEmojiClick?: UnifiedEmojiRatingHandler;
  vibeTitle?: string;
  className?: string;
  emojiColor?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'compact-hover' | 'scale';
  hasUserReacted?: boolean;
  // Required data props to avoid queries
  existingUserRatings?: CurrentUserRating[];
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  textContrast?: 'light' | 'dark';
}

export function EmojiRatingDisplay({
  rating,
  vibeId,
  onEmojiClick,
  vibeTitle,
  className,
  emojiColor,
  size = 'md',
  variant = 'default',
  hasUserReacted = false,
  existingUserRatings = [],
  emojiMetadata = {},
  textContrast,
}: EmojiRatingDisplayProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const [selectedValue, setSelectedValue] = React.useState<number | null>(null);
  const { user } = useUser();

  // Helper function to get contrast-aware button classes
  const getButtonClasses = (
    textContrast?: 'light' | 'dark',
    hasReacted?: boolean
  ) => {
    if (textContrast === 'light') {
      return hasReacted
        ? 'bg-white/30 text-black/90'
        : 'bg-white/20 hover:bg-white/30 text-black/90';
    } else if (textContrast === 'dark') {
      return hasReacted
        ? 'bg-white/30 text-white/90'
        : 'bg-white/20 hover:bg-white/30 text-white/90';
    }
    return hasReacted ? 'bg-primary/10' : 'bg-muted hover:bg-muted/80';
  };

  const sizeClasses = {
    sm: 'text-lg gap-1',
    md: 'text-2xl gap-2',
    lg: 'text-4xl gap-3',
  };

  // Enhanced click handler with auth and popover logic
  const handleEnhancedClick = async () => {
    if (!onEmojiClick) return;

    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // If we have a handler, always open the rating dialog for detailed rating input
    setIsRatingDialogOpen(true);
  };

  // Scale variant (with rating scale bar)
  if (variant === 'scale') {
    const handleScaleChange = (value: number) => {
      // Track mouse movement for real-time feedback
      setHoverValue(value);
    };

    const handleScaleMouseLeave = () => {
      // Reset hover value when mouse leaves the scale
      setHoverValue(null);
    };

    const handleScaleClick = async (value: number) => {
      if (!onEmojiClick) return;

      if (!user) {
        setShowAuthDialog(true);
        return;
      }

      // Store the selected value and open rating dialog
      setSelectedValue(value);
      setHoverValue(null);
      setIsRatingDialogOpen(true);
    };

    const scaleDisplay = (
      <div className={cn('flex items-center gap-1', className)}>
        <span
          className={cn(
            'font-[500]',
            textContrast === 'light'
              ? 'text-black/90'
              : textContrast === 'dark'
                ? 'text-white/90'
                : ''
          )}
        >
          {rating.value.toFixed(1)}
        </span>
        <RatingScale
          emoji={rating.emoji}
          value={hoverValue ?? rating.value}
          onChange={onEmojiClick ? handleScaleChange : undefined}
          onClick={onEmojiClick ? handleScaleClick : undefined}
          size={size}
          emojiColor={emojiColor}
          className="flex-1"
          showTooltip={!!onEmojiClick}
          maintainValueOnLeave={false}
          onMouseLeave={handleScaleMouseLeave}
        />
        <div
          className={cn(
            'text-sm',
            textContrast === 'light'
              ? 'text-black/70'
              : textContrast === 'dark'
                ? 'text-white/70'
                : 'text-muted-foreground'
          )}
        >
          {rating.count > 0 && `(${rating.count})`}
        </div>
      </div>
    );

    return (
      <>
        {onEmojiClick ? (
          <RateAndReviewDialog
            vibeId={vibeId}
            open={isRatingDialogOpen}
            onOpenChange={(open) => {
              setIsRatingDialogOpen(open);
              if (!open) {
                setHoverValue(null);
                setSelectedValue(null);
              }
            }}
            vibeTitle={vibeTitle}
            preSelectedEmoji={rating.emoji}
            preSelectedValue={selectedValue ?? undefined}
            existingUserRatings={existingUserRatings}
            emojiMetadata={emojiMetadata}
          >
            {scaleDisplay}
          </RateAndReviewDialog>
        ) : (
          scaleDisplay
        )}
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate"
          description="you must sign in to rate vibes with emojis"
        />
      </>
    );
  }

  // Compact variants (minimal emoji display)
  if (variant === 'compact' || variant === 'compact-hover') {
    const compactDisplay = (
      <Button
        className={cn(
          'relative inline-flex h-8 items-center justify-center gap-1 rounded-full px-2 py-1 text-sm leading-none transition-all',
          getButtonClasses(textContrast, hasUserReacted),
          onEmojiClick && 'cursor-pointer',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.preventDefault();
          handleEnhancedClick();
        }}
        onKeyDown={
          onEmojiClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEnhancedClick();
                }
              }
            : undefined
        }
        role={onEmojiClick ? 'button' : undefined}
        tabIndex={onEmojiClick ? 0 : undefined}
        aria-label={
          onEmojiClick
            ? `${rating.emoji} rating ${rating.value} out of 5`
            : undefined
        }
      >
        <span
          className="font-sans text-base font-medium"
          style={{ color: emojiColor }}
        >
          {rating.emoji}
        </span>
        {variant === 'compact-hover' && isHovered && (
          <span
            className={cn(
              'animate-in fade-in slide-in-from-left-2 ml-1 flex items-center gap-1 font-medium duration-200',
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}
          >
            <span
              className={cn(
                'font-[500]',
                textContrast === 'light'
                  ? 'text-black/90'
                  : textContrast === 'dark'
                    ? 'text-white/90'
                    : ''
              )}
            >
              {rating.value.toFixed(1)}
            </span>
            {rating.count > 0 && (
              <span
                className={cn(
                  'text-muted-foreground',
                  textContrast === 'light'
                    ? 'text-black/50'
                    : textContrast === 'dark'
                      ? 'text-white/50'
                      : 'text-muted-foreground'
                )}
              >
                ({rating.count})
              </span>
            )}
          </span>
        )}
        {variant === 'compact' && rating.count > 0 && (
          <span className="ml-1 font-medium">{rating.count}</span>
        )}
      </Button>
    );

    return (
      <>
        {onEmojiClick ? (
          <RateAndReviewDialog
            vibeId={vibeId}
            open={isRatingDialogOpen}
            onOpenChange={setIsRatingDialogOpen}
            vibeTitle={vibeTitle}
            preSelectedEmoji={rating.emoji}
            preSelectedValue={selectedValue ?? undefined}
            existingUserRatings={existingUserRatings}
            emojiMetadata={emojiMetadata}
          >
            {compactDisplay}
          </RateAndReviewDialog>
        ) : (
          compactDisplay
        )}
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate"
          description="you must sign in to rate vibes with emojis"
        />
      </>
    );
  }

  // Default variant (pill with rating and count)
  const defaultDisplay = (
    <Button
      className={cn(
        'inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 py-1 leading-none transition-all',
        getButtonClasses(textContrast, false),
        sizeClasses[size],
        onEmojiClick && 'cursor-pointer',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        handleEnhancedClick();
      }}
      role={onEmojiClick ? 'button' : undefined}
      tabIndex={onEmojiClick ? 0 : undefined}
      aria-label={
        onEmojiClick
          ? `${rating.emoji} rating ${rating.value} out of 5`
          : undefined
      }
      onKeyDown={
        onEmojiClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEnhancedClick();
              }
            }
          : undefined
      }
    >
      <span style={{ color: emojiColor }}>{rating.emoji}</span>
      <span
        className={cn(
          'text-base font-medium',
          textContrast === 'light'
            ? 'text-black/90'
            : textContrast === 'dark'
              ? 'text-white/90'
              : ''
        )}
      >
        {rating.value.toFixed(1)}
      </span>
      {rating.count > 0 && (
        <span
          className={cn(
            'text-sm',
            textContrast === 'light'
              ? 'text-black/70'
              : textContrast === 'dark'
                ? 'text-white/70'
                : 'text-muted-foreground'
          )}
        >
          ({rating.count})
        </span>
      )}
    </Button>
  );

  return (
    <>
      {onEmojiClick ? (
        <RateAndReviewDialog
          vibeId={vibeId}
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          vibeTitle={vibeTitle}
          preSelectedEmoji={rating.emoji}
          preSelectedValue={selectedValue ?? undefined}
          existingUserRatings={existingUserRatings}
          emojiMetadata={emojiMetadata}
        >
          {defaultDisplay}
        </RateAndReviewDialog>
      ) : (
        defaultDisplay
      )}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to rate"
        description="you must sign in to rate vibes with emojis"
      />
    </>
  );
}

export { type EmojiRating };
