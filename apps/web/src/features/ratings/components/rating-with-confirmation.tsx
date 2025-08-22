import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RatingPopover } from './rating-popover';
import { useUserVibeRatings } from '@/queries';
import type { EmojiRatingMetadata } from '@vibechecc/types';

interface RatingWithConfirmationProps {
  vibeId: string;
  onSubmit: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  vibeTitle?: string;
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  preSelectedEmoji?: string;
  preSelectedValue?: number;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  isOwner?: boolean;
  children: React.ReactNode;
}

export function RatingWithConfirmation({
  vibeId,
  onSubmit,
  isSubmitting = false,
  vibeTitle,
  emojiMetadata = {},
  preSelectedEmoji,
  preSelectedValue,
  onOpenChange,
  open,
  isOwner = false,
  children,
}: RatingWithConfirmationProps) {
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingRatingData, setPendingRatingData] = React.useState<{
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  } | null>(null);
  
  // Get user's existing ratings for this vibe
  const { data: userRatings } = useUserVibeRatings(vibeId, {
    enabled: !!vibeId && !isOwner,
  });

  const handleRatingSubmit = async (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    // Check if user already has a rating with this emoji
    const existingRating = userRatings?.find(r => r.emoji === data.emoji);
    
    if (existingRating) {
      // User is updating their existing rating - just submit it
      await onSubmit(data);
      return;
    }
    
    // Check if user has any other ratings for this vibe
    const hasOtherRatings = userRatings && userRatings.length > 0;
    
    if (hasOtherRatings) {
      // Show confirmation dialog
      setPendingRatingData(data);
      setShowConfirmDialog(true);
    } else {
      // No existing ratings, proceed directly
      await onSubmit(data);
    }
  };

  const handleConfirmNewRating = async () => {
    if (pendingRatingData) {
      await onSubmit(pendingRatingData);
      setPendingRatingData(null);
    }
    setShowConfirmDialog(false);
  };

  const handleUpdateExisting = () => {
    // Close the confirmation dialog and keep the rating popover open
    // The user can select a different emoji or update their existing one
    setShowConfirmDialog(false);
    setPendingRatingData(null);
  };

  // Get list of emojis user has already rated with
  const existingEmojis = userRatings?.map(r => r.emoji) || [];
  const existingEmojisDisplay = existingEmojis.join(' ');

  return (
    <>
      <RatingPopover
        onSubmit={handleRatingSubmit}
        isSubmitting={isSubmitting}
        vibeTitle={vibeTitle}
        existingRating={null}
        emojiMetadata={emojiMetadata}
        preSelectedEmoji={preSelectedEmoji}
        preSelectedValue={preSelectedValue}
        onOpenChange={onOpenChange}
        open={open}
        isOwner={isOwner}
      >
        {children}
      </RatingPopover>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>you've already rated this vibe</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                you've already rated this vibe with: <span className="text-2xl">{existingEmojisDisplay}</span>
              </p>
              <p>
                you can either:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>submit a new review with {pendingRatingData?.emoji} (recommended)</li>
                <li>update one of your existing reviews</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                having multiple emoji ratings helps show the complexity of this vibe!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleUpdateExisting}>
              update existing
            </Button>
            <Button onClick={handleConfirmNewRating}>
              add new {pendingRatingData?.emoji} rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}