import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { motion, AnimatePresence } from 'framer-motion';
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
          <h3 className="text-sm font-medium text-muted-foreground">top ratings</h3>
        </div>
        <AnimatePresence mode="popLayout">
          {topRatings.map((rating, index) => (
            <motion.div
              key={`${rating.emoji}-${index}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
            >
              <EmojiRatingDisplay
                rating={rating}
                showScale={true}
                onEmojiClick={onEmojiClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {remainingRatings.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="more-ratings" className="border-none">
            <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
              <div className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                <span>{remainingRatings.length} more</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <AnimatePresence mode="popLayout">
                {remainingRatings.map((rating, index) => (
                  <motion.div
                    key={`${rating.emoji}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="mb-2"
                  >
                    <EmojiRatingDisplay
                      rating={rating}
                      showScale={true}
                      onEmojiClick={onEmojiClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      {vibeId && (
        <div className="mt-3 pt-3 border-t">
          <Link to="/vibes/$vibeId" params={{ vibeId }}>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-8 text-xs"
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