import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EmojiRatingDisplay } from './emoji-rating-display';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';

interface TopEmojiRatingsAccordionProps {
  emojiRatings: EmojiRating[];
  className?: string;
  onEmojiClick?: (emoji: string) => void;
  vibeId?: string;
}

export function TopEmojiRatingsAccordion({
  emojiRatings,
  className,
  onEmojiClick,
  vibeId,
}: TopEmojiRatingsAccordionProps) {
  const topRatings = emojiRatings.slice(0, 4);
  const remainingRatings = emojiRatings.slice(4);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-2">
        <div className="space-y-1.5 pb-1">
          <h3 className="text-muted-foreground text-sm font-medium">
            top ratings
          </h3>
        </div>
        {topRatings.map((rating, index) => (
          <div
            key={`${rating.emoji}-${index}`}
            className="animate-fade-in-down opacity-0"
            style={{
              animation: `fade-in-down 0.3s ease-out ${index * 0.05}s forwards`
            }}
          >
            <EmojiRatingDisplay
              rating={rating}
              showScale={true}
              onEmojiClick={onEmojiClick}
            />
          </div>
        ))}
      </div>

      {remainingRatings.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="more-ratings" className="border-none">
            <AccordionTrigger className="text-muted-foreground hover:text-foreground py-2 text-xs hover:no-underline">
              <div className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                <span>{remainingRatings.length} more</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {remainingRatings.map((rating, index) => (
                <div
                  key={`${rating.emoji}-${index}`}
                  className="mb-2 animate-fade-in-down opacity-0"
                  style={{
                    animation: `fade-in-down 0.3s ease-out ${index * 0.05}s forwards`
                  }}
                >
                  <EmojiRatingDisplay
                    rating={rating}
                    showScale={true}
                    onEmojiClick={onEmojiClick}
                  />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      {vibeId && (
        <div className="mt-3 border-t pt-3">
          <Link to="/vibes/$vibeId" params={{ vibeId }}>
            <Button
              variant="ghost"
              className="h-8 w-full justify-between text-xs"
            >
              <span>go to vibe</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
