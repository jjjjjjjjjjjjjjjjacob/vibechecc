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
import {
  TopEmojiRatings,
  type EmojiRating,
} from '@/components/emoji-rating-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { useMediaQuery } from '@/hooks/use-media-query';

interface AllEmojiRatingsPopoverProps {
  emojiRatings: EmojiRating[];
  onEmojiClick?: (emoji: string, value: number) => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  vibeId?: string;
}

export function AllEmojiRatingsPopover({
  emojiRatings,
  onEmojiClick,
  children,
  open,
  onOpenChange,
  vibeId,
}: AllEmojiRatingsPopoverProps) {
  const isExtraLarge = useMediaQuery('(min-width: 1280px)');
  
  const content = (
    <>
      <ScrollArea className="max-h-[300px] overflow-y-auto p-4">
        <TopEmojiRatings
          emojiRatings={emojiRatings}
          expanded={true}
          onEmojiClick={onEmojiClick}
        />
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

