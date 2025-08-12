/**
 * Wraps an EmojiRatingDisplay with a popover that reveals all ratings when clicked.
 * Useful for showing a summary score while allowing deeper inspection.
 */
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
  showScale?: boolean;
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
  showScale = true,
  onMouseEnter,
  onMouseLeave,
}: EmojiRatingDisplayPopoverProps) {
  // Track popover visibility
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn('flex cursor-pointer items-center gap-1', className)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          <EmojiRatingDisplay
            rating={rating}
            showScale={showScale}
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
              // Forward selection to parent and close the popover
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
