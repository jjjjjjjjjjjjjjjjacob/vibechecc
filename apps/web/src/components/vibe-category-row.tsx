import * as React from 'react';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { cn } from '@/utils/tailwind-utils';
import type { Vibe } from '@/types';

export type RatingDisplayMode = 'most-rated' | 'top-rated';

interface VibeCategoryRowProps {
  title: string;
  vibes: Vibe[];
  priority?: boolean; // For prioritizing certain sections
  ratingDisplayMode?: RatingDisplayMode; // How to display emoji ratings in cards
}

export function VibeCategoryRow({
  title,
  vibes,
  priority = false,
  ratingDisplayMode = 'most-rated',
}: VibeCategoryRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    // Update scroll buttons after animation
    setTimeout(checkScrollButtons, 300);
  };

  React.useEffect(() => {
    checkScrollButtons();
  }, [vibes]);

  if (vibes.length === 0) return null;

  return (
    <div
      className={cn('group mb-10', priority && 'mb-12', 'overflow-x-hidden')}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2
          className={cn(
            'text-foreground font-bold lowercase transition-colors',
            priority ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          )}
        >
          {title}
        </h2>
        <div className="hidden gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'bg-background/80 hover:bg-background/90 h-8 w-8 rounded-full border backdrop-blur-sm',
              !canScrollLeft && 'opacity-30'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">scroll left</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'bg-background/80 hover:bg-background/90 h-8 w-8 rounded-full border backdrop-blur-sm',
              !canScrollRight && 'opacity-30'
            )}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">scroll right</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className={cn(
            'scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4',
            'md:gap-6'
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={checkScrollButtons}
        >
          {vibes.map((vibe, _index) => (
            <div
              key={vibe.id}
              className={cn(
                'flex-shrink-0 snap-start',
                priority
                  ? 'w-[280px] md:w-[320px] lg:w-[360px]'
                  : 'w-[250px] md:w-[280px] lg:w-[300px]'
              )}
            >
              <VibeCard vibe={vibe} ratingDisplayMode={ratingDisplayMode} />
            </div>
          ))}

          {/* Add spacing at the end for better scrolling experience */}
          <div className="w-4 flex-shrink-0" />
        </div>

        {/* Mobile scroll indicators */}
        <div className="mt-4 flex justify-center gap-2 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-8 px-3"
          >
            <ChevronLeft className="mr-1 h-3 w-3" />
            prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-8 px-3"
          >
            next
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
