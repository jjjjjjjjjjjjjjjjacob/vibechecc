import * as React from 'react';
import { StarRating } from './star-rating';
import { RatingPopover } from './rating-popover';
import type { Rating } from '@vibechecc/types';

interface StarRatingWithPopoverProps {
  value: number;
  onChange?: (value: number) => void; // For quick rating
  onRatingSubmit: (data: {
    rating: number;
    review: string;
    useEmojiRating?: boolean;
  }) => Promise<void>;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isSubmitting?: boolean;
  vibeTitle?: string;
  currentRating?: Rating | null;
  enablePopover?: boolean; // Whether to use popover mode
}

export function StarRatingWithPopover({
  value,
  onChange,
  onRatingSubmit,
  readOnly = false,
  size = 'md',
  isSubmitting = false,
  vibeTitle,
  currentRating,
  enablePopover = true,
}: StarRatingWithPopoverProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // If popover is disabled or readOnly, use direct rating
  if (!enablePopover || readOnly) {
    return (
      <StarRating
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        size={size}
      />
    );
  }

  // Popover mode
  return (
    <RatingPopover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      onSubmit={async (data) => {
        await onRatingSubmit(data);
        setPopoverOpen(false);
      }}
      isSubmitting={isSubmitting}
      vibeTitle={vibeTitle}
      currentRating={currentRating}
    >
      <div>
        <StarRating
          value={value}
          readOnly={false}
          size={size}
          popoverMode={true}
          onPopoverOpen={() => setPopoverOpen(true)}
        />
      </div>
    </RatingPopover>
  );
}
