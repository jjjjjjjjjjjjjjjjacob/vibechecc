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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Link } from '@tanstack/react-router';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/tailwind-utils';
import type {
  EmojiRating,
  EmojiRatingMetadata,
  CurrentUserRating,
} from '@vibechecc/types';
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
  textContrast?: 'light' | 'dark';
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
  textContrast,
  visibleCount = 1,
}: AllEmojiRatingsPopoverProps & {
  visibleCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const remainingCount = ratings.length - visibleCount;

  // Sort ratings by count (descending), then by value (descending)
  const sortedRatings = React.useMemo(() => {
    return [...ratings].sort((a, b) => {
      // First sort by count (most ratings)
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Then sort by average rating (highest rating)
      return b.value - a.value;
    });
  }, [ratings]);

  // If no remaining ratings to show, don't render anything
  if (remainingCount <= 0) return null;

  // Split ratings into groups
  const topRatings = sortedRatings.slice(0, 3);
  const accordionRatings = sortedRatings.slice(3, 8);
  const hasMoreThan8Ratings = sortedRatings.length > 8;

  const trigger = children || (
    <Button
      variant="ghost"
      className={cn(
        'flex items-center gap-0.5 px-2 py-1 text-xs transition-colors hover:bg-white/20',
        textContrast === 'light'
          ? 'text-black/70 hover:text-black/90'
          : textContrast === 'dark'
            ? 'text-white/70 hover:text-white/90'
            : 'text-muted-foreground hover:text-foreground'
      )}
      onClick={(e) => {
        e.preventDefault();
        setOpen(true);
      }}
    >
      <ChevronDown className="h-3 w-3" />
      <span>{remainingCount} more</span>
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn('max-h-96 w-80 overflow-y-auto', className)}
        side="top"
        align="start"
        sideOffset={8}
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4
              className={cn(
                'text-sm font-semibold',
                textContrast === 'light'
                  ? 'text-black/90'
                  : textContrast === 'dark'
                    ? 'text-white/90'
                    : ''
              )}
            >
              all ratings
            </h4>
            <span
              className={cn(
                'text-xs',
                textContrast === 'light'
                  ? 'text-black/70'
                  : textContrast === 'dark'
                    ? 'text-white/70'
                    : 'text-muted-foreground'
              )}
            >
              {sortedRatings.length} rating
              {sortedRatings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Top 3 ratings - always visible */}
          <div className="space-y-2">
            {topRatings.map((rating, index) => (
              <div
                key={`top-${rating.emoji}-${index}`}
                className="hover:bg-muted/50 rounded-md p-2 transition-colors"
              >
                <EmojiRatingDisplay
                  rating={rating}
                  vibeId={vibeId}
                  onEmojiClick={onEmojiClick}
                  vibeTitle={vibeTitle}
                  existingUserRatings={existingUserRatings}
                  emojiMetadata={emojiMetadata}
                  variant="scale"
                  className="flex-1"
                  textContrast={textContrast}
                />
              </div>
            ))}
          </div>

          {/* Accordion for ratings 4-8 */}
          {accordionRatings.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="more-ratings" className="border-0">
                <AccordionTrigger
                  className={cn(
                    'py-2 text-xs font-medium hover:no-underline',
                    textContrast === 'light'
                      ? 'text-black/70 hover:text-black/90'
                      : textContrast === 'dark'
                        ? 'text-white/70 hover:text-white/90'
                        : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {accordionRatings.length} more rating
                  {accordionRatings.length !== 1 ? 's' : ''}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-2">
                    {accordionRatings.map((rating, index) => (
                      <div
                        key={`accordion-${rating.emoji}-${index}`}
                        className="hover:bg-muted/50 rounded-md p-2 transition-colors"
                      >
                        <EmojiRatingDisplay
                          rating={rating}
                          vibeId={vibeId}
                          onEmojiClick={onEmojiClick}
                          vibeTitle={vibeTitle}
                          existingUserRatings={existingUserRatings}
                          emojiMetadata={emojiMetadata}
                          variant="scale"
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Go to vibe CTA for 8+ ratings */}
          {hasMoreThan8Ratings && (
            <div className="border-t pt-3">
              <Link to="/vibes/$vibeId" params={{ vibeId }}>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-sm"
                  onClick={() => setOpen(false)}
                >
                  <span>
                    go to vibe to see all {sortedRatings.length} ratings
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
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
  textContrast,
}: {
  totalRatings: number;
  visibleRatings: number;
  className?: string;
  textContrast?: 'light' | 'dark';
}) {
  const remainingCount = totalRatings - visibleRatings;

  if (remainingCount <= 0) return null;

  return (
    <button
      className={cn(
        'flex items-center gap-0.5 text-xs transition-colors',
        textContrast === 'light'
          ? 'text-black/70 hover:text-black/90'
          : textContrast === 'dark'
            ? 'text-white/70 hover:text-white/90'
            : 'text-muted-foreground hover:text-foreground',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
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

// Full ratings dialog that shows ALL ratings without cutoff
interface AllRatingsDialogProps {
  ratings: EmojiRatingData[];
  onEmojiClick: UnifiedEmojiRatingHandler;
  vibeId: string;
  vibeTitle?: string;
  existingUserRatings?: CurrentUserRating[];
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
  textContrast?: 'light' | 'dark';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AllRatingsDialog({
  ratings,
  onEmojiClick,
  vibeId,
  vibeTitle,
  existingUserRatings = [],
  emojiMetadata = {},
  textContrast,
  open,
  onOpenChange,
}: AllRatingsDialogProps) {
  // Sort ratings by count (descending), then by value (descending)
  const sortedRatings = React.useMemo(() => {
    return [...ratings].sort((a, b) => {
      // First sort by count (most ratings)
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Then sort by average rating (highest rating)
      return b.value - a.value;
    });
  }, [ratings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-md">
        <DialogHeader>
          <DialogTitle>all ratings</DialogTitle>
          {vibeTitle && (
            <p className="text-muted-foreground text-sm">for "{vibeTitle}"</p>
          )}
        </DialogHeader>

        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-muted-foreground text-sm">
            {sortedRatings.length} rating{sortedRatings.length !== 1 ? 's' : ''}
          </span>
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3">
            {sortedRatings.map((rating, index) => (
              <div
                key={`${rating.emoji}-${index}`}
                className="hover:bg-muted/50 rounded-md border p-3 transition-colors"
              >
                <EmojiRatingDisplay
                  rating={rating}
                  vibeId={vibeId}
                  onEmojiClick={onEmojiClick}
                  vibeTitle={vibeTitle}
                  existingUserRatings={existingUserRatings}
                  emojiMetadata={emojiMetadata}
                  variant="scale"
                  className="flex-1"
                  textContrast={textContrast}
                />
              </div>
            ))}

            {sortedRatings.length === 0 && (
              <div className="text-muted-foreground py-8 text-center">
                <p>no ratings yet</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t pt-3">
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
      </DialogContent>
    </Dialog>
  );
}
