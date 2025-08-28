import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmojiRatingDisplay } from './emoji-rating-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ArrowRight, ChevronDown } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating, EmojiRatingMetadata, CurrentUserRating } from '@vibechecc/types';
import type {
  EmojiRatingData,
  UnifiedEmojiRatingHandler,
} from './emoji-reaction';

// Updated interface for unified handler
interface AllEmojiRatingsPopoverProps {
  ratings: EmojiRatingData[];
  onEmojiClick: UnifiedEmojiRatingHandler;
  vibeId: string;
  vibeTitle?: string;
  children?: React.ReactNode;
  className?: string;
  existingUserRatings?: CurrentUserRating[];
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
}

// Legacy interface for backward compatibility
interface LegacyAllEmojiRatingsPopoverProps {
  emojiRatings: EmojiRating[];
  onEmojiClick?: (emoji: string, value: number) => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  vibeId: string;
}

// New unified AllRatingsPopover with auto-generated trigger
export function AllRatingsPopover({
  ratings,
  onEmojiClick,
  vibeId,
  vibeTitle,
  children,
  className,
  existingUserRatings = [],
  emojiMetadata = {},
  visibleCount = 1,
}: AllEmojiRatingsPopoverProps & {
  visibleCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const remainingCount = ratings.length - visibleCount;

  // If no remaining ratings to show, don't render anything
  if (remainingCount <= 0) return null;

  const trigger = children || (
    <button
      className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        // Don't preventDefault - we want the popover to open
      }}
    >
      <ChevronDown className="h-3 w-3" />
      <span>{remainingCount} more</span>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn('max-h-96 w-80 overflow-y-auto', className)}
        side="top"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-semibold">all ratings</h4>
            <span className="text-muted-foreground text-xs">
              {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {ratings.map((rating, index) => (
              <div
                key={`${rating.emoji}-${index}`}
                className="hover:bg-muted/50 flex items-center justify-between rounded-md p-2 transition-colors"
              >
                <EmojiRatingDisplay
                  rating={rating}
                  vibeId={vibeId}
                  onEmojiClick={onEmojiClick}
                  vibeTitle={vibeTitle}
                  existingUserRatings={existingUserRatings}
                  emojiMetadata={emojiMetadata}
                  className="flex-1"
                />
                {rating.count > 1 && (
                  <div className="text-muted-foreground ml-2 text-xs">
                    avg: {rating.value.toFixed(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Component for showing "X more" ratings trigger
export function MoreRatingsTrigger({
  totalRatings,
  visibleRatings,
  className,
}: {
  totalRatings: number;
  visibleRatings: number;
  className?: string;
}) {
  const remainingCount = totalRatings - visibleRatings;

  if (remainingCount <= 0) return null;

  return (
    <button
      className={cn(
        'text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs transition-colors',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <ChevronDown className="h-3 w-3" />
      <span>{remainingCount} more</span>
    </button>
  );
}

// Legacy component for backward compatibility
export function AllEmojiRatingsPopover({
  emojiRatings,
  onEmojiClick,
  children,
  open,
  onOpenChange,
  vibeId,
}: LegacyAllEmojiRatingsPopoverProps) {
  const isExtraLarge = useMediaQuery('(min-width: 1280px)');

  // Convert to unified format
  const ratings: EmojiRatingData[] = emojiRatings.map((rating) => ({
    emoji: rating.emoji,
    value: rating.value,
    count: rating.count || 0,
    tags: rating.tags,
  }));

  const unifiedHandler: UnifiedEmojiRatingHandler | undefined = onEmojiClick
    ? async ({ emoji, value }) => {
        onEmojiClick(emoji, value);
      }
    : undefined;

  if (!unifiedHandler) {
    return null;
  }

  const content = (
    <>
      <ScrollArea className="max-h-[300px] overflow-y-auto p-4">
        <div className="space-y-2">
          {ratings.map((rating, index) => (
            <EmojiRatingDisplay
              key={`${rating.emoji}-${index}`}
              rating={rating}
              vibeId={vibeId}
              onEmojiClick={unifiedHandler}
              existingUserRatings={[]}
              emojiMetadata={{}}
            />
          ))}
        </div>
      </ScrollArea>
      {vibeId && (
        <div className="border-t p-4">
          <Link to="/vibes/$vibeId" params={{ vibeId }}>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => onOpenChange?.(false)}
            >
              <span>go to vibe</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </>
  );

  if (isExtraLarge) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">All Ratings</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange?.(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>All Ratings</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
