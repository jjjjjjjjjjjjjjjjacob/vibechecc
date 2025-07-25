import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { EmojiRatingDisplay } from './emoji-rating-display';
import { TopEmojiRatingsAccordion } from './top-emoji-ratings-accordion';
import type { EmojiRating } from '@/types';

interface EmojiRatingDisplayPopoverProps {
  rating: EmojiRating;
  allRatings?: EmojiRating[];
  onEmojiClick?: (emoji: string) => void;
  className?: string;
  vibeId?: string;
}

export function EmojiRatingDisplayPopover({
  rating,
  allRatings,
  onEmojiClick,
  className,
  vibeId,
}: EmojiRatingDisplayPopoverProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn('flex cursor-pointer items-center gap-1', className)}
        >
          <EmojiRatingDisplay
            rating={rating}
            showScale={true}
            onEmojiClick={onEmojiClick}
          />
          {allRatings && allRatings?.length > 1 && (
            <button
              className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
            >
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  open && 'rotate-90'
                )}
              />
            </button>
          )}
        </div>
      </PopoverTrigger>
      {allRatings && allRatings.length > 1 && (
        <PopoverContent className="w-80 p-4" align="start">
          <TopEmojiRatingsAccordion
            emojiRatings={allRatings}
            onEmojiClick={(emoji) => {
              onEmojiClick?.(emoji);
              setOpen(false);
            }}
            vibeId={vibeId}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}
