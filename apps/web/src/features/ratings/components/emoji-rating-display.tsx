import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { useUser } from '@clerk/tanstack-react-start';
import type { EmojiRating } from '@vibechecc/types';
import { RatingScale } from './rating-scale';
import { RateAndReviewDialog } from './rate-and-review-dialog';
import { AuthPromptDialog } from '@/features/auth';
import type {
  EmojiRatingData,
  UnifiedEmojiRatingHandler,
} from './emoji-reaction';
import type { Rating, EmojiRatingMetadata, CurrentUserRating } from '@vibechecc/types';

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
}: EmojiRatingDisplayProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const [selectedValue, setSelectedValue] = React.useState<number | null>(null);
  const { user } = useUser();

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
      <div className={cn('flex items-center gap-3', className)}>
        <RatingScale
          emoji={rating.emoji}
          value={hoverValue ?? rating.value}
          onChange={onEmojiClick ? handleScaleChange : undefined}
          onClick={onEmojiClick ? handleScaleClick : undefined}
          size={size}
          emojiColor={emojiColor}
          className="flex-1"
          showTooltip={!!onEmojiClick}
        />
        <div className="text-muted-foreground text-sm">
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
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-full px-2 py-1 text-sm transition-all hover:scale-105 active:scale-95',
          hasUserReacted ? 'bg-primary/10' : 'bg-muted hover:bg-muted/80',
          onEmojiClick && 'cursor-pointer',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={
          onEmojiClick
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEnhancedClick();
              }
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
            <span>{rating.value.toFixed(1)}</span>
            {rating.count > 0 && (
              <span className="text-muted-foreground">({rating.count})</span>
            )}
          </span>
        )}
        {variant === 'compact' && rating.count > 0 && (
          <span className="ml-1 font-medium">{rating.count}</span>
        )}
      </div>
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
    <div
      className={cn(
        'bg-secondary/50 hover:bg-secondary inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 transition-all hover:scale-105 active:scale-95',
        sizeClasses[size],
        onEmojiClick && 'cursor-pointer',
        className
      )}
      onClick={
        onEmojiClick
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEnhancedClick();
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
      <span className="text-base font-medium">{rating.value.toFixed(1)}</span>
      {rating.count > 0 && (
        <span className="text-muted-foreground text-sm">({rating.count})</span>
      )}
    </div>
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
