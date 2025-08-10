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
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating, EmojiRatingMetadata } from '@viberatr/types';
import { Circle, Info, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// Using v2 emoji-mart component - switch to './emoji-search-command' for rollback
import { EmojiSearchCommandV2 as EmojiSearchCommand } from './emoji-search-command-v2';
import { RatingScale } from './rating-scale';
import { FlipClockDigit } from './flip-clock-digit';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Separator } from '@/components/ui/separator';

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
  'is it giving {value} {emoji}s?',
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
}: RatingPopoverProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
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
  const [previousLockedValue, setPreviousLockedValue] = React.useState<
    number | null
  >(null);
  const [isLockingIn, setIsLockingIn] = React.useState(false);

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

    setReview(value);
    setCharacterCount(value.length);
    setError(null);
  };

  const handleEmojiSelect = (emoji: string) => {
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
    } else {
      // Randomize placeholder when dialog opens
      setPlaceholderIndex(
        Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)
      );
    }
  };

  // Shared form content
  const formContent = (
    <form
      onSubmit={handleSubmit}
      className={cn('flex w-full flex-col space-y-8 p-4')}
    >
      {showEmojiPicker ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="m-auto flex w-full justify-between">
            <p className="text-muted-foreground text-left text-sm">
              select an emoji
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEmojiPicker(false)}
              className="h-6"
            >
              back
            </Button>
          </div>
          <EmojiSearchCommand
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSelect={handleEmojiSelect}
            showCategories={true}
            pageSize={200}
            perLine={isMobile ? 9 : 7}
            className="pointer-events-auto h-full max-h-[80vh] w-full"
            data-testid="emoji-search-command"
          />
          <div className="text-muted-foreground inline text-xs">
            <span>{getPlaceholderText()}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center space-y-4">
          <div className="relative flex flex-col items-center space-y-8">
            <div className="flex w-fit flex-col items-center justify-center gap-2">
              <div className="flex w-full items-center justify-between">
                <Label className="text-base">your rating</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6"
                  onClick={() => {
                    setShowEmojiPicker(true);
                  }}
                >
                  change emoji
                </Button>
              </div>
              <div
                className="relative flex flex-col items-center justify-center gap-3 py-4"
                data-rating-container
              >
                <div
                  className={cn(
                    'bg-theme-primary/10 shadow-theme-primary/10 flex items-center justify-between gap-4 rounded-3xl px-5 py-4 shadow-lg transition-all duration-300',
                    hasSelectedRating &&
                      'animate-pulse-scale bg-theme-primary/20 shadow-theme-primary/30 shadow-3xl',
                    isMouseDown &&
                      'bg-theme-primary/15 shadow-theme-secondary/20 shadow-2xl'
                  )}
                >
                  <button
                    data-mouse-down={isMouseDown ? 'true' : 'false'}
                    className="flex items-center font-sans text-[5.5rem] leading-none opacity-[0.99] drop-shadow-lg transition-transform duration-4000"
                    onClick={() => setShowEmojiPicker(true)}
                    onPointerDown={() => setShowEmojiPicker(true)}
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
                    <span>{selectedEmoji}</span>
                  </button>
                  <div
                    data-mouse-down={isMouseDown ? 'true' : 'false'}
                    className={cn(
                      'font-doto text-primary text-7xl',
                      hasSelectedRating &&
                        'drop-shadow-[0_0_20px_var(--theme-primary)]',
                      isMouseDown &&
                        'drop-shadow-[0_0_30px_var(--theme-secondary)]'
                    )}
                    style={{
                      textShadow: isMouseDown
                        ? '0 0 20px var(--theme-secondary), 0 2px 4px rgba(0,0,0,0.2)'
                        : '0 0 10px var(--theme-primary), 0 2px 4px rgba(0,0,0,0.2)',
                      perspective: '300px',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <FlipClockDigit
                      value={ratingValue.toFixed(1)}
                      className="inline-block"
                      onLockIn={isLockingIn}
                      previousLockedValue={previousLockedValue?.toFixed(1)}
                    />
                  </div>
                </div>
              </div>
              {/* Rating CTA */}
              {showRatingCTA && (
                <div className="animate-fade-in-down pointer-events-none absolute top-9">
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

              <div className="flex flex-col gap-2 font-[500]">
                {selectedEmoji ? (
                  <div
                    onMouseLeave={() => setRatingValue(selectedRatingValue)}
                    role="group"
                    className="w-full text-left focus:outline-none"
                    aria-label="Emoji rating scale"
                  >
                    <RatingScale
                      emoji={selectedEmoji}
                      value={selectedRatingValue}
                      onChange={setRatingValue}
                      onClick={(value) => {
                        // Store previous value for lock-in animation
                        setPreviousLockedValue(selectedRatingValue);

                        setSelectedRatingValue(value);
                        // setRatingValue(value);
                        setHasSelectedRating(true);
                        setShowRatingCTA(true);

                        // Trigger staggered lock-in animation
                        setIsLockingIn(true);
                        setTimeout(() => {
                          setIsLockingIn(false);
                        }, 250); // Allow time for all digits to animate

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
                      onPointerUp={() => {
                        setIsMouseDown(false);
                        // Trigger staggered lock-in animation
                        setIsLockingIn(true);
                        setTimeout(() => {
                          setIsLockingIn(false);
                        }, 250); // Allow time for all digits to animate
                      }}
                      isLockingIn={isLockingIn}
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
              rows={4}
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

      <div className={cn('flex gap-2 border-t', 'pt-3')}>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !selectedEmoji ||
            review.length === 0 ||
            showEmojiPicker
          }
          className="h-10 flex-1"
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
          className={cn('bg-background/90 min-h-[92vh] backdrop-blur')}
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <DrawerHeader className="relative p-4 pb-0">
            <DrawerTitle className="flex items-center justify-between">
              {existingRating ? 'update rating' : 'rating'}
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground text-left font-semibold">
              {vibeTitle
                ? `"${vibeTitle}"`
                : 'Share your thoughts with an emoji rating and review'}
            </DrawerDescription>
            <Separator className="border-0.5, mt-4 w-full" />
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
        className="bg-background/95 border-border max-h-[90vh] w-94 gap-0 overflow-y-auto border backdrop-blur duration-300 data-[state=closed]:translate-y-[calc(-50%_+2rem)]"
        onClick={(e) => e.stopPropagation()}
        showCloseButton={false}
        data-testid="dialog-content"
        shouldScaleBackground
        scaleFactor={0.8}
        scaleOffset={'50px'}
      >
        <DialogHeader className="p-4 pb-0 text-center">
          <DialogTitle className="flex items-center justify-between">
            {existingRating ? 'update rating' : 'rating'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-semibold">
            {vibeTitle
              ? `"${vibeTitle}"`
              : 'Share your thoughts with an emoji rating and review'}
          </DialogDescription>
          <Separator className="border-0.5, mt-4 w-full" />
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
