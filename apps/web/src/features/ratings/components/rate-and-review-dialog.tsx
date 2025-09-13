import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, Award } from '@/components/ui/icons';
import { EmojiRatingSelector } from './emoji-rating-selector';
import { api } from '@vibechecc/convex';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import type { EmojiRating } from '@vibechecc/types';

interface RateAndReviewDialogProps {
  /** The ID of the vibe being rated */
  vibeId: string;
  /** The user ID of the vibe author (for point calculations) */
  vibeAuthorId: string;
  /** Current user's existing rating for this vibe */
  existingRating?: EmojiRating;
  /** Trigger element for the dialog */
  trigger: React.ReactNode;
  /** Custom className for the dialog content */
  className?: string;
}

export function RateAndReviewDialog({
  vibeId,
  vibeAuthorId,
  existingRating,
  trigger,
  className,
}: RateAndReviewDialogProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedEmoji, setSelectedEmoji] = React.useState<string>(
    existingRating?.emoji || ''
  );
  const [ratingValue, setRatingValue] = React.useState<number>(
    existingRating?.value || 0
  );
  const [reviewText, setReviewText] = React.useState<string>(
    existingRating?.reviewText || ''
  );
  const [hasChanges, setHasChanges] = React.useState(false);

  // Get current user's points stats
  const { data: userPoints } = useQuery(
    convexQuery(api.userPoints.getUserPointsStats, {})
  );

  // Reset form when dialog opens/closes or existing rating changes
  React.useEffect(() => {
    if (isOpen && existingRating) {
      setSelectedEmoji(existingRating.emoji);
      setRatingValue(existingRating.value);
      setReviewText(existingRating.reviewText || '');
      setHasChanges(false);
    } else if (isOpen && !existingRating) {
      setSelectedEmoji('');
      setRatingValue(0);
      setReviewText('');
      setHasChanges(false);
    }
  }, [isOpen, existingRating]);

  // Track changes
  React.useEffect(() => {
    const hasActualChanges =
      selectedEmoji !== (existingRating?.emoji || '') ||
      ratingValue !== (existingRating?.value || 0) ||
      reviewText.trim() !== (existingRating?.reviewText || '').trim();

    setHasChanges(hasActualChanges);
  }, [selectedEmoji, ratingValue, reviewText, existingRating]);

  // Submit rating mutation
  const submitRatingMutation = useConvexMutation(
    api.emojiRatings.createOrUpdateEmojiRating
  );
  const submitMutation = useMutation({
    mutationFn: submitRatingMutation,
    onSuccess: (result) => {
      if (result) {
        // Calculate points earned
        const basePoints = reviewText.trim() ? 5 : 3; // More points for reviews
        const isUpdate = !!existingRating;

        toast.success(
          isUpdate
            ? 'Rating updated successfully!'
            : `Rating submitted! +${basePoints} points earned.`,
          {
            icon: isUpdate ? '✨' : '⭐',
            duration: 3000,
            action: userPoints
              ? {
                  label: `${userPoints.availablePoints + basePoints} total`,
                  onClick: () => {},
                }
              : undefined,
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: ['convex', api.emojiRatings.getTopEmojiRatings],
        });
        queryClient.invalidateQueries({
          queryKey: ['convex', api.userPoints.getUserPointsStats],
        });

        setIsOpen(false);
      }
    },
    onError: (error) => {
      // Log error for debugging in development
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Rating submission error:', error);
      }
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit rating',
        {
          icon: '❌',
        }
      );
    },
  });

  const handleSubmit = async () => {
    if (!selectedEmoji || ratingValue === 0) {
      toast.error('Please select an emoji and rating value', { icon: '⚠️' });
      return;
    }

    const loadingToast = toast.loading(
      existingRating ? 'Updating rating...' : 'Submitting rating...',
      { id: 'submit-rating' }
    );

    try {
      await submitMutation.mutateAsync({
        vibeId,
        emoji: selectedEmoji,
        value: ratingValue,
        review: reviewText.trim(),
      });
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const isFormValid = selectedEmoji && ratingValue > 0;
  const canEarnPoints = !existingRating && reviewText.trim().length >= 10;
  const isOwnVibe = userPoints?.userId === vibeAuthorId;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="text-primary h-5 w-5" />
            {existingRating ? 'Update Your Rating' : 'Rate This Vibe'}
          </DialogTitle>
          <DialogDescription>
            Share your thoughts and help the community discover great vibes.
            {!isOwnVibe && canEarnPoints && (
              <div className="mt-2">
                <Badge variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  +5 points for detailed review
                </Badge>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Emoji Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Choose your emotion and rating
            </label>
            <EmojiRatingSelector
              onSubmit={async (data) => {
                setSelectedEmoji(data.emoji);
                setRatingValue(data.value);
                setReviewText(data.review);
              }}
              isSubmitting={submitMutation.isPending}
              vibeTitle="this vibe"
            />
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="review-text" className="text-sm font-medium">
                Review (optional)
              </label>
              {!isOwnVibe && (
                <span className="text-muted-foreground text-xs">
                  {reviewText.length >= 10
                    ? '+5 points'
                    : `${10 - reviewText.length} more for bonus`}
                </span>
              )}
            </div>
            <Textarea
              id="review-text"
              placeholder="Share your thoughts about this vibe... What made it special? How did it make you feel?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {reviewText.length >= 10
                  ? '✓ Eligible for bonus points'
                  : 'Write 10+ characters for bonus points'}
              </span>
              <span>{reviewText.length}/500</span>
            </div>
          </div>

          {/* Points Display */}
          {userPoints && !isOwnVibe && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Your current points:</span>
                <span className="font-medium">{userPoints.currentBalance}</span>
              </div>
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Points for this rating:</span>
                <span className="text-primary font-medium">
                  +{reviewText.trim().length >= 10 ? 5 : 3}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || !hasChanges || submitMutation.isPending}
            className="gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {existingRating ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                {existingRating ? 'Update Rating' : 'Submit Rating'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Usage example:
 *
 * ```tsx
 * <RateAndReviewDialog
 *   vibeId="vibe123"
 *   vibeAuthorId="user456"
 *   existingRating={existingRating}
 *   trigger={
 *     <Button>Rate This Vibe</Button>
 *   }
 * />
 * ```
 */
