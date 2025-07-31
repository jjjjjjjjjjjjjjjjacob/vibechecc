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
  onEmojiClick?: (emoji: string, value: number) => void;
  className?: string;
  vibeId?: string;
  variant?: 'color' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function EmojiRatingDisplayPopover({
  rating,
  allRatings,
  onEmojiClick,
  className,
  vibeId,
  variant = 'color',
  size = 'md',
  onMouseEnter,
  onMouseLeave,
}: EmojiRatingDisplayPopoverProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn('flex cursor-pointer items-center gap-1', className)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <EmojiRatingDisplay
            rating={rating}
            showScale={true}
            onEmojiClick={onEmojiClick}
            variant={variant}
            size={size}
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
            onEmojiClick={(emoji, value) => {
              onEmojiClick?.(emoji, value);
              setOpen(false);
            }}
            vibeId={vibeId}
            variant={variant}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}
