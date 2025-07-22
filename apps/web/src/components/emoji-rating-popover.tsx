import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating, EmojiRatingMetadata } from '@vibechecc/types';
import { Circle, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './ui/command';
import { EMOJI_DATABASE } from '@/lib/emoji-database';

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
  onOpenChange?: (open: boolean) => void;
}

export function EmojiRatingPopover({
  children,
  onSubmit,
  isSubmitting = false,
  vibeTitle,
  existingRating,
  emojiMetadata = {},
  preSelectedEmoji,
  onOpenChange,
}: EmojiRatingPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedEmoji, setSelectedEmoji] = React.useState(
    preSelectedEmoji || existingRating?.emoji || ''
  );
  const [ratingValue, setRatingValue] = React.useState(
    existingRating?.value || 3
  );
  const [review, setReview] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [characterCount, setCharacterCount] = React.useState(0);
  const [searchValue, setSearchValue] = React.useState('');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(
    !existingRating && !preSelectedEmoji
  );

  // Update when preSelectedEmoji changes
  React.useEffect(() => {
    if (preSelectedEmoji && open) {
      setSelectedEmoji(preSelectedEmoji);
      setShowEmojiPicker(false);
    }
  }, [preSelectedEmoji, open]);

  const MIN_REVIEW_LENGTH = 50;

  const selectedEmojiMetadata = selectedEmoji
    ? emojiMetadata[selectedEmoji] || null
    : null;

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReview(value);
    setCharacterCount(value.length);

    if (value.length < MIN_REVIEW_LENGTH && value.length > 0) {
      setError(`Review must be at least ${MIN_REVIEW_LENGTH} characters`);
    } else {
      setError(null);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    setSearchValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedEmoji) {
      setError('Please select an emoji');
      return;
    }

    if (review.length < MIN_REVIEW_LENGTH) {
      setError(`Review must be at least ${MIN_REVIEW_LENGTH} characters`);
      return;
    }

    try {
      await onSubmit({
        emoji: selectedEmoji,
        value: ratingValue,
        review: review.trim(),
        tags: selectedEmojiMetadata?.tags,
      });
      setOpen(false);

      // Reset form
      setSelectedEmoji(preSelectedEmoji || '');
      setRatingValue(3);
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
    }
    onOpenChange?.(newOpen);
  };

  // Filter emojis for rating (prioritize emojis with metadata)
  const ratingEmojis = React.useMemo(() => {
    const priorityEmojis = Object.keys(emojiMetadata);

    if (!searchValue.trim()) {
      // If no search, show emojis with metadata first, then some common ones
      const commonEmojis = [
        '😍',
        '🔥',
        '😊',
        '😎',
        '🤔',
        '😕',
        '😱',
        '😴',
        '😒',
        '💩',
      ];
      const combined = [...new Set([...priorityEmojis, ...commonEmojis])];
      return combined.slice(0, 24);
    }

    const searchLower = searchValue.toLowerCase();
    const allEmojis = EMOJI_DATABASE.filter((emojiData) => {
      const searchableText = [emojiData.name, ...emojiData.keywords]
        .join(' ')
        .toLowerCase();
      return searchableText.includes(searchLower);
    }).map((e) => e.emoji);

    // Prioritize rating emojis in search results
    const priorityResults = priorityEmojis.filter((emoji) =>
      allEmojis.includes(emoji)
    );
    const otherResults = allEmojis.filter(
      (emoji) => !priorityEmojis.includes(emoji)
    );

    return [...priorityResults, ...otherResults].slice(0, 24);
  }, [searchValue, emojiMetadata]);

  const renderEmojiScale = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRatingValue(value)}
            className={cn(
              'text-2xl transition-all hover:scale-110',
              value <= ratingValue ? 'opacity-100' : 'opacity-30 grayscale'
            )}
            aria-label={`${value} out of 5`}
          >
            {selectedEmoji}
          </button>
        ))}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-6"
        align="center"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {existingRating ? 'update emoji rating' : 'rate with emoji'}
            </h3>
            {vibeTitle && (
              <p className="text-muted-foreground text-sm">{vibeTitle}</p>
            )}
          </div>

          {showEmojiPicker ? (
            <div className="space-y-2">
              <Label>Select an Emoji</Label>
              <Command className="rounded-lg border">
                <CommandInput
                  placeholder="Search emojis..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList className="max-h-48">
                  <CommandEmpty>No emojis found.</CommandEmpty>
                  <CommandGroup>
                    <div className="grid grid-cols-6 gap-2 p-2">
                      {ratingEmojis.map((emoji) => (
                        <CommandItem
                          key={emoji}
                          value={emoji}
                          onSelect={() => handleEmojiSelect(emoji)}
                          className="hover:bg-accent flex h-10 w-10 cursor-pointer items-center justify-center rounded p-0 text-2xl"
                        >
                          {emoji}
                        </CommandItem>
                      ))}
                    </div>
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Info className="h-3 w-3" />
                <span>it's giving {selectedEmoji}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>your emoji rating</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(true)}
                  >
                    Change emoji
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="text-6xl">{selectedEmoji}</div>
                  {renderEmojiScale()}
                  <p className="text-muted-foreground text-sm">
                    {ratingValue} {selectedEmoji} out of 5
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
                <Label htmlFor="review">
                  Your Review
                  <span className="text-muted-foreground ml-1 text-sm font-normal">
                    (required, min {MIN_REVIEW_LENGTH} chars)
                  </span>
                </Label>
                <Textarea
                  id="review"
                  value={review}
                  onChange={handleReviewChange}
                  placeholder={`Why does this vibe deserve ${ratingValue} ${selectedEmoji}?`}
                  rows={4}
                  className={cn(
                    'resize-none',
                    error && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'review-error' : undefined}
                />
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-xs">
                    {characterCount} / {MIN_REVIEW_LENGTH} characters
                    {characterCount >= MIN_REVIEW_LENGTH && (
                      <span className="ml-1 text-green-600">✓</span>
                    )}
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

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedEmoji ||
                review.length < MIN_REVIEW_LENGTH ||
                showEmojiPicker
              }
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Circle className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
