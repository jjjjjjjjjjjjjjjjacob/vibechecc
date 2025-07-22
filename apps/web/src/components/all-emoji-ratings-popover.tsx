import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  TopEmojiRatings,
  type EmojiRating,
} from '@/components/emoji-rating-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AllEmojiRatingsPopoverProps {
  emojiRatings: EmojiRating[];
  onEmojiClick?: (emoji: string) => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AllEmojiRatingsPopover({
  emojiRatings,
  onEmojiClick,
  children,
  open,
  onOpenChange,
}: AllEmojiRatingsPopoverProps) {
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
        <ScrollArea className="max-h-[300px] overflow-y-auto p-4">
          <TopEmojiRatings
            emojiRatings={emojiRatings}
            expanded={true}
            onEmojiClick={onEmojiClick}
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

