import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StarRating } from './star-rating';
import { DecimalRatingSelector } from './decimal-rating-selector';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';
import type { Rating } from '@viberater/types';
import { Circle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RatingPopoverProps {
  children: React.ReactNode;
  currentRating?: Rating | null;
  onSubmit: (data: {
    rating: number;
    review: string;
    useEmojiRating?: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
  vibeTitle?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RatingPopover({
  children,
  currentRating,
  onSubmit,
  isSubmitting = false,
  vibeTitle,
  open,
  onOpenChange,
}: RatingPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const actualOpen = isControlled ? open : internalOpen;
  const actualSetOpen = isControlled ? onOpenChange : setInternalOpen;
  const [rating, setRating] = React.useState(currentRating?.value || 0);
  const [review, setReview] = React.useState(currentRating?.review || '');
  const [useEmojiRating, setUseEmojiRating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [characterCount, setCharacterCount] = React.useState(review.length);

  const MIN_REVIEW_LENGTH = 50;

  React.useEffect(() => {
    if (currentRating) {
      setRating(currentRating.value);
      setReview(currentRating.review || '');
      setCharacterCount(currentRating.review?.length || 0);
    }
  }, [currentRating]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (review.length > 0 && review.length < MIN_REVIEW_LENGTH) {
      setError(`Review must be at least ${MIN_REVIEW_LENGTH} characters`);
      return;
    }

    try {
      await onSubmit({
        rating,
        review: review.trim(),
        useEmojiRating,
      });
      actualSetOpen(false);

      // Reset form if creating new rating
      if (!currentRating) {
        setRating(0);
        setReview('');
        setUseEmojiRating(false);
        setCharacterCount(0);
      }
    } catch (error) {
      setError('Failed to submit rating. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Rating submission error:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    actualSetOpen(newOpen);
    if (!newOpen) {
      // Reset error when closing
      setError(null);
    }
  };

  return (
    <Popover open={actualOpen} onOpenChange={handleOpenChange}>
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
              {currentRating ? 'Update Your Rating' : 'Rate This Vibe'}
            </h3>
            {vibeTitle && (
              <p className="text-muted-foreground text-sm">{vibeTitle}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Your Rating</Label>
            <Tabs defaultValue="simple" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simple">Simple</TabsTrigger>
                <TabsTrigger value="precise">Precise</TabsTrigger>
              </TabsList>
              <TabsContent value="simple" className="space-y-2">
                <div className="flex items-center gap-4">
                  <StarRating
                    value={rating}
                    onChange={(value) => setRating(Math.round(value))}
                    size="lg"
                  />
                  <span className="text-muted-foreground text-sm">
                    {rating > 0
                      ? rating % 1 === 0
                        ? `${rating} circle${rating === 1 ? '' : 's'}`
                        : `${rating.toFixed(1)} circles`
                      : 'Select rating'}
                  </span>
                </div>
              </TabsContent>
              <TabsContent value="precise" className="space-y-2">
                <DecimalRatingSelector
                  value={rating}
                  onChange={setRating}
                  showStars={true}
                  showSlider={true}
                  showInput={true}
                  label=""
                />
              </TabsContent>
            </Tabs>
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
              placeholder="Share your thoughts about this vibe..."
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

          <div className="flex items-center justify-between space-x-2 border-t pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emoji-rating"
                checked={useEmojiRating}
                onChange={(e) => setUseEmojiRating(e.target.checked)}
                className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                aria-label="Use emoji rating"
              />
              <Label
                htmlFor="emoji-rating"
                className="cursor-pointer text-sm font-normal"
              >
                Add emoji rating
              </Label>
            </div>
            {useEmojiRating && (
              <p className="text-muted-foreground text-xs">
                Select emoji after submitting
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => actualSetOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                rating === 0 ||
                (review.length > 0 && review.length < MIN_REVIEW_LENGTH)
              }
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Circle className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentRating ? (
                'Update Rating'
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
