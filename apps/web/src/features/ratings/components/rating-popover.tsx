import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating, EmojiRatingMetadata } from '@viberater/types';
import { Circle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmojiSearchCommand } from './emoji-search-command';
import { RatingScale } from './rating-scale';
import { useMediaQuery } from '@/hooks/use-media-query';
import { enhancedTrackEvents } from '@/lib/enhanced-posthog';
import { getEmojiSentiment } from '../utils/emoji-sentiment';
import { useUser } from '@clerk/tanstack-react-start';

interface RatingPopoverProps {
  children: React.ReactNode;
  onSubmit: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  vibeTitle?: string;
  existingRating?: EmojiRating | null;
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  preSelectedEmoji?: string;
  preSelectedValue?: number;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  vibeId?: string;
}

// Creative placeholder templates
const REVIEW_PLACEHOLDERS = [
  'damn why does this deserve {value} {emoji}s',
  'is it actually {value} {emoji}s tho -_-',
  'why would you only give it {value} {emoji}s',
  '100% agree {value} {emoji}s',
  `if you think it's only {value} {emoji}s think again`,
  'thinking {value} {emoji}s might be overkill. or underkill?',
  'fuckit {value} {emoji}s',
];

export function RatingPopover({
  children,
  onSubmit,
  isSubmitting = false,
  vibeTitle,
  existingRating,
  emojiMetadata = {},
  preSelectedEmoji,
  preSelectedValue,
  onOpenChange,
  open: controlledOpen,
  vibeId,
}: RatingPopoverProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const { user } = useUser();

  // Analytics tracking state
  const [emojiSelectionStartTime, setEmojiSelectionStartTime] = React.useState<
    number | null
  >(null);
  const [ratingInteractionStartTime, setRatingInteractionStartTime] =
    React.useState<number | null>(null);
  const [reviewStartTime, setReviewStartTime] = React.useState<number | null>(
    null
  );
  const [_totalKeystrokesInReview, setTotalKeystrokesInReview] =
    React.useState(0);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );
  const [selectedEmoji, setSelectedEmoji] = React.useState(
    preSelectedEmoji || existingRating?.emoji || ''
  );
  const [ratingValue, setRatingValue] = React.useState(
    preSelectedValue || existingRating?.value || 3
  );
  const [selectedRatingValue, setSelectedRatingValue] = React.useState(
    preSelectedValue || existingRating?.value || 3
  );
  const [review, setReview] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [characterCount, setCharacterCount] = React.useState(0);
  const [searchValue, setSearchValue] = React.useState('');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(
    !existingRating && !preSelectedEmoji
  );
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const [hasSelectedRating, setHasSelectedRating] = React.useState(false);
  const [showRatingCTA, setShowRatingCTA] = React.useState(false);
  const [placeholderIndex, setPlaceholderIndex] = React.useState(
    Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)
  );

  // Update when preSelectedEmoji or preSelectedValue changes
  React.useEffect(() => {
    if (open) {
      if (preSelectedEmoji) {
        setSelectedEmoji(preSelectedEmoji);
        setShowEmojiPicker(false);
      }
      if (preSelectedValue) {
        setRatingValue(preSelectedValue);
        setSelectedRatingValue(preSelectedValue);
      }
    }
  }, [preSelectedEmoji, preSelectedValue, open]);

  const MAX_REVIEW_LENGTH = 3000; // Similar to Goodreads/Rotten Tomatoes

  const selectedEmojiMetadata = selectedEmoji
    ? emojiMetadata[selectedEmoji] || null
    : null;

  // Get dynamic placeholder text
  const getPlaceholderText = React.useCallback(() => {
    const template = REVIEW_PLACEHOLDERS[placeholderIndex];
    return template
      .replace(/{value}/g, selectedRatingValue.toFixed(1))
      .replace(/{emoji}/g, selectedEmoji || '?');
  }, [placeholderIndex, selectedRatingValue, selectedEmoji]);

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Enforce max length
    if (value.length > MAX_REVIEW_LENGTH) {
      return; // Don't allow typing beyond max length
    }

    // Track review start time on first keystroke
    if (!reviewStartTime && value.length === 1) {
      setReviewStartTime(Date.now());
    }

    // Track keystroke count for engagement analytics
    if (value.length > review.length) {
      setTotalKeystrokesInReview((prev) => prev + 1);
    }

    setReview(value);
    setCharacterCount(value.length);
    setError(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    // Track emoji selection analytics
    if (user?.id && vibeId) {
      const selectionTime = emojiSelectionStartTime
        ? Date.now() - emojiSelectionStartTime
        : undefined;

      enhancedTrackEvents.engagement_emoji_selected(
        vibeId,
        user.id,
        emoji,
        getEmojiSentiment(emoji),
        selectionTime
      );
    }

    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    setSearchValue('');
    // Randomize placeholder when emoji changes
    setPlaceholderIndex(Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedEmoji) {
      setError('please select an emoji');
      return;
    }

    if (review.length === 0) {
      setError('please write a review');
      return;
    }

    if (review.length > MAX_REVIEW_LENGTH) {
      setError(`review must be under ${MAX_REVIEW_LENGTH} characters`);
      return;
    }

    try {
      await onSubmit({
        emoji: selectedEmoji,
        value: selectedRatingValue,
        review: review.trim(),
        tags: selectedEmojiMetadata?.tags,
      });
      setOpen(false);

      // Reset form
      setSelectedEmoji(preSelectedEmoji || '');
      setRatingValue(3);
      setSelectedRatingValue(3);
      setReview('');
      setCharacterCount(0);
      setShowEmojiPicker(!preSelectedEmoji);
    } catch (error) {
      setError('Failed to submit rating. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Emoji rating submission error:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
      setShowEmojiPicker(!existingRating && !preSelectedEmoji);
      setHasSelectedRating(false);
      setShowRatingCTA(false);

      // Reset analytics tracking state
      setEmojiSelectionStartTime(null);
      setRatingInteractionStartTime(null);
      setReviewStartTime(null);
      setTotalKeystrokesInReview(0);
    } else {
      // Randomize placeholder when dialog opens
      setPlaceholderIndex(
        Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)
      );

      // Start analytics tracking
      setEmojiSelectionStartTime(Date.now());
      setRatingInteractionStartTime(Date.now());
    }
  };

  // Shared form content
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {showEmojiPicker ? (
        <div className="space-y-2">
          <Label>select an emoji</Label>
          <EmojiSearchCommand
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSelect={handleEmojiSelect}
            showCategories={true}
            maxHeight="h-[340px]"
            pageSize={200}
            className="border-0"
            data-testid="emoji-search-command"
          />
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Info className="h-3 w-3" />
            <span>it's giving {selectedEmoji || '...'}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">your emoji rating</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEmojiPicker(true)}
              >
                change emoji
              </Button>
            </div>
            <div
              className="relative flex flex-col items-center justify-center gap-4 py-6"
              data-rating-container
            >
              <div
                className={cn(
                  'bg-theme-primary/10 shadow-theme-primary/10 flex items-center justify-between gap-4 rounded-3xl p-4 shadow-lg transition-all duration-300',
                  hasSelectedRating &&
                    'animate-pulse-scale bg-theme-primary/20 shadow-theme-primary/30 shadow-3xl',
                  isMouseDown &&
                    'bg-theme-primary/15 shadow-theme-secondary/20 shadow-2xl'
                )}
              >
                <span
                  data-mouse-down={isMouseDown ? 'true' : 'false'}
                  className="font-noto-color text-7xl drop-shadow-lg transition-transform duration-4000"
                  style={
                    isMouseDown
                      ? {
                          animation: 'shimmy 0.3s ease-in-out infinite',
                        }
                      : hasSelectedRating
                        ? {
                            animation: 'bounce 1s ease-in-out 1',
                          }
                        : undefined
                  }
                >
                  {selectedEmoji}
                </span>
                <span
                  data-mouse-down={isMouseDown ? 'true' : 'false'}
                  className={cn(
                    'font-doto text-primary text-6xl transition-all duration-300',
                    hasSelectedRating &&
                      'animate-number-pop drop-shadow-[0_0_20px_var(--theme-primary)]',
                    isMouseDown &&
                      'drop-shadow-[0_0_30px_var(--theme-secondary)]'
                  )}
                  style={{
                    textShadow: isMouseDown
                      ? '0 0 20px var(--theme-secondary), 0 2px 4px rgba(0,0,0,0.2)'
                      : '0 0 10px var(--theme-primary), 0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {ratingValue.toFixed(1)}
                </span>
              </div>

              {/* Rating CTA */}
              {showRatingCTA && (
                <div className="animate-fade-in-down pointer-events-none absolute -top-2">
                  <div className="relative">
                    <div className="from-theme-primary to-theme-secondary rounded-full bg-gradient-to-r px-4 py-2 text-xs font-semibold text-white shadow-lg">
                      <span className="drop-shadow-sm">rating locked in!</span>
                      <span className="ml-1.5 inline-block animate-pulse">
                        ✨
                      </span>
                    </div>
                    {/* Sparkle effects */}
                    <div className="text-theme-secondary absolute -top-1 -left-1 animate-ping">
                      ✦
                    </div>
                    <div className="animation-delay-200 text-theme-primary absolute -right-1 -bottom-1 animate-ping">
                      ✦
                    </div>
                    <div className="animation-delay-400 text-theme-secondary absolute top-0 right-2 animate-ping">
                      ✦
                    </div>
                  </div>
                </div>
              )}

              <div className="font-[500]">
                {selectedEmoji ? (
                  <div
                    onMouseLeave={() => setRatingValue(selectedRatingValue)}
                    className="w-full text-left focus:outline-none"
                    aria-label="Emoji rating scale"
                    role="application"
                  >
                    <RatingScale
                      emoji={selectedEmoji}
                      value={selectedRatingValue}
                      variant="gradient"
                      onChange={setRatingValue}
                      onClick={(value) => {
                        // Track rating selection analytics
                        if (user?.id && vibeId && selectedEmoji) {
                          const _interactionTime = ratingInteractionStartTime
                            ? Date.now() - ratingInteractionStartTime
                            : undefined;

                          enhancedTrackEvents.ui_filter_toggled(
                            'rating_value',
                            true,
                            'emoji_rating_popover',
                            user.id
                          );
                        }

                        setSelectedRatingValue(value);
                        setRatingValue(value);
                        setHasSelectedRating(true);
                        setShowRatingCTA(true);

                        // Randomize placeholder when rating changes
                        setPlaceholderIndex(
                          Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)
                        );

                        // Add haptic-like visual feedback
                        const container = document.querySelector(
                          '[data-rating-container]'
                        );
                        if (container) {
                          container.classList.add('animate-pulse-scale');
                          setTimeout(() => {
                            container.classList.remove('animate-pulse-scale');
                          }, 500);
                        }

                        // Hide CTA after 2.5 seconds
                        setTimeout(() => {
                          setShowRatingCTA(false);
                        }, 2500);

                        // Remove flourish animation after completion
                        setTimeout(() => {
                          setHasSelectedRating(false);
                        }, 500);
                      }}
                      size="lg"
                      showTooltip={false}
                      onPointerDown={() => setIsMouseDown(true)}
                      onPointerUp={() => setIsMouseDown(false)}
                      mobileSlider={true}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    please select an emoji first
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {selectedRatingValue.toFixed(1)} out of 5
              </p>
            </div>
            {selectedEmojiMetadata?.tags && (
              <div className="flex flex-wrap gap-1">
                {selectedEmojiMetadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review" className="text-base">
              your review
              <span className="text-muted-foreground ml-1 font-normal">
                (required)
              </span>
            </Label>
            <Textarea
              id="review"
              value={review}
              onChange={handleReviewChange}
              placeholder={getPlaceholderText()}
              rows={6}
              maxLength={MAX_REVIEW_LENGTH}
              className={cn(
                'resize-none',
                error && 'border-destructive focus-visible:ring-destructive'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? 'review-error' : undefined}
            />
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs">
                {characterCount} / {MAX_REVIEW_LENGTH.toLocaleString()}{' '}
                characters
              </div>
              {error && (
                <p id="review-error" className="text-destructive text-xs">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isSubmitting}
          className="h-12 flex-1"
        >
          cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !selectedEmoji ||
            review.length === 0 ||
            showEmojiPicker
          }
          className="h-12 flex-1"
        >
          {isSubmitting ? (
            <>
              <Circle className="mr-2 h-4 w-4 animate-spin" />
              submitting...
            </>
          ) : (
            'submit rating'
          )}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} shouldScaleBackground>
        <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
          {children}
        </DrawerTrigger>
        <DrawerContent
          className="bg-background/90 min-h-[92vh] overflow-y-auto backdrop-blur"
          onClick={(e) => e.stopPropagation()}
        >
          <DrawerHeader className="p-6 pb-0">
            <DrawerTitle>
              {existingRating ? 'update emoji rating' : 'rate with emoji'}
            </DrawerTitle>
            {vibeTitle && (
              <p className="text-muted-foreground mt-1 text-sm lowercase">
                {vibeTitle}
              </p>
            )}
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent
        className="bg-background/95 border-border max-h-screen max-w-lg overflow-y-auto border backdrop-blur"
        onClick={(e) => e.stopPropagation()}
        showCloseButton={false}
        data-testid="dialog-content"
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {existingRating ? 'update emoji rating' : 'rate with emoji'}
          </DialogTitle>
          <DialogDescription>
            {vibeTitle
              ? `Rate "${vibeTitle}" with an emoji and detailed review`
              : 'Share your thoughts with an emoji rating and review'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
