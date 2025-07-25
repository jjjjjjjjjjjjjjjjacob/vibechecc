import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating, EmojiRatingMetadata } from '@vibechecc/types';
import { Circle, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { EmojiSearchCommand } from './emoji-search-command';
import { EmojiRatingScale } from './emoji-rating-scale';

interface EmojiRatingPopoverProps {
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
];

export function EmojiRatingPopover({
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
}: EmojiRatingPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent
        className="bg-background/90 max-h-screen max-w-lg overflow-y-auto border-none backdrop-blur"
        onClick={(e) => e.stopPropagation()}
        showCloseButton={false}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="bg-gradient-to-r from-purple-500 to-red-500 bg-clip-text text-xl text-transparent drop-shadow-md drop-shadow-red-500/50">
            {existingRating ? 'update emoji rating' : 'rate with emoji'}
          </DialogTitle>
          {vibeTitle && (
            <p className="text-muted-foreground mt-1 text-sm lowercase drop-shadow-sm drop-shadow-yellow-500/20">
              {vibeTitle}
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {showEmojiPicker ? (
            <div className="space-y-2">
              <Label>select an emoji</Label>
              <EmojiSearchCommand
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSelect={handleEmojiSelect}
                showCategories={false}
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
                      'bg-primary/10 flex items-center justify-between gap-4 rounded-3xl p-4 transition-all duration-300',
                      hasSelectedRating && 'animate-pulse-scale bg-primary/20'
                    )}
                  >
                    <span
                      data-mouse-down={isMouseDown ? 'true' : 'false'}
                      className="font-noto-color text-7xl drop-shadow-[0_2px_5px_var(--color-slate-500)] transition-transform duration-4000"
                      style={
                        isMouseDown
                          ? {
                              animation: 'shimmy 0.2s ease-in-out infinite',
                            }
                          : hasSelectedRating
                            ? {
                                animation: 'bounce 0.5s ease-in-out 1',
                              }
                            : undefined
                      }
                    >
                      {selectedEmoji}
                    </span>
                    <span
                      data-mouse-down={isMouseDown ? 'true' : 'false'}
                      className={cn(
                        'font-doto text-6xl drop-shadow-[0_2px_5px_var(--color-red-500)] transition-all duration-300 data-[mouse-down=true]:drop-shadow-[0px_2px_10px_var(--color-yellow-500)]',
                        hasSelectedRating && 'animate-number-pop'
                      )}
                    >
                      {ratingValue.toFixed(1)}
                    </span>
                  </div>

                  {/* Rating CTA */}
                  {showRatingCTA && (
                    <div className="animate-fade-in-down pointer-events-none absolute -top-2">
                      <div className="relative">
                        <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/25">
                          <span className="drop-shadow-sm">
                            rating locked in!
                          </span>
                          <span className="ml-1.5 inline-block animate-pulse">
                            ✨
                          </span>
                        </div>
                        {/* Sparkle effects */}
                        <div className="absolute -top-1 -left-1 animate-ping text-yellow-400">
                          ✦
                        </div>
                        <div className="animation-delay-200 absolute -right-1 -bottom-1 animate-ping text-pink-400">
                          ✦
                        </div>
                        <div className="animation-delay-400 absolute top-0 right-2 animate-ping text-purple-400">
                          ✦
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="font-[500]">
                    {selectedEmoji ? (
                      <div
                        onMouseLeave={() => setRatingValue(selectedRatingValue)}
                      >
                        <EmojiRatingScale
                          emoji={selectedEmoji}
                          value={selectedRatingValue}
                          onChange={setRatingValue}
                          onClick={(value) => {
                            setSelectedRatingValue(value);
                            setRatingValue(value);
                            setHasSelectedRating(true);
                            setShowRatingCTA(true);

                            // Randomize placeholder when rating changes
                            setPlaceholderIndex(
                              Math.floor(
                                Math.random() * REVIEW_PLACEHOLDERS.length
                              )
                            );

                            // Add haptic-like visual feedback
                            const container = document.querySelector(
                              '[data-rating-container]'
                            );
                            if (container) {
                              container.classList.add('animate-pulse-scale');
                              setTimeout(() => {
                                container.classList.remove(
                                  'animate-pulse-scale'
                                );
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
                          preset="gradient"
                          showTooltip={false}
                          onMouseDown={() => setIsMouseDown(true)}
                          onMouseUp={() => setIsMouseDown(false)}
                          className="w-full drop-shadow-[0_2px_5px_var(--color-red-500)]"
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
      </DialogContent>
    </Dialog>
  );
}
