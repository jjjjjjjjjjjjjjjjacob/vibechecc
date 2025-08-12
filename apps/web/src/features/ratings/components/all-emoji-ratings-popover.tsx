import * as React from 'react'; // base React utilities
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'; // hover/click overlay for large screens
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'; // modal fallback for small screens
import { TopEmojiRatings, type EmojiRating } from './emoji-rating-display'; // list of top ratings
import { ScrollArea } from '@/components/ui/scroll-area'; // scrollable container
import { X, ArrowRight } from 'lucide-react'; // icons
import { Button } from '@/components/ui/button'; // button primitive
import { Link } from '@tanstack/react-router'; // client side navigation
import { useMediaQuery } from '@/hooks/use-media-query'; // media query hook

/**
 * Props for the popover showing all emoji ratings for a vibe.
 */
interface AllEmojiRatingsPopoverProps {
  emojiRatings: EmojiRating[]; // list of emoji rating data
  onEmojiClick?: (emoji: string, value: number) => void; // optional click handler
  children: React.ReactNode; // trigger element
  open?: boolean; // controlled open state
  onOpenChange?: (open: boolean) => void; // callback when open state changes
  vibeId?: string; // optional vibe id for navigation
}

export function AllEmojiRatingsPopover({
  emojiRatings,
  onEmojiClick,
  children,
  open,
  onOpenChange,
  vibeId,
}: AllEmojiRatingsPopoverProps) {
  const isExtraLarge = useMediaQuery('(min-width: 1280px)'); // switch layout based on screen

  // shared content used by both popover and dialog variants
  const content = (
    <>
      <ScrollArea className="max-h-[300px] overflow-y-auto p-4">{/* list container */}
        <TopEmojiRatings
          emojiRatings={emojiRatings}
          expanded={true}
          onEmojiClick={onEmojiClick}
        />
      </ScrollArea>
      {vibeId && (
        <div className="border-t p-4">{/* link to full vibe page */}
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

  // large screens use a popover anchored to trigger
  if (isExtraLarge) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">all ratings</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange?.(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">close</span>
            </Button>
          </div>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // small screens fall back to a dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>all ratings</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
