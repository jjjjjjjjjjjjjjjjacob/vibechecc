import * as React from 'react';
import { useRef, useState } from 'react';
// arrow icons used for horizontal navigation
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
// shadcn button component for both navigation and scroll controls
import { Button } from '@/components/ui/button';
// card used to render individual vibes inside the row
import { VibeCard } from '@/features/vibes/components/vibe-card';
// helper to merge Tailwind classes
import { cn } from '@/utils/tailwind-utils';
// hook to trigger fetching more content when near the end of the list
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import type { Vibe } from '@/types';

export type RatingDisplayMode = 'most-rated' | 'top-rated';

// props describe the vibe list and presentation details
interface VibeCategoryRowProps {
  title: string | React.ReactNode;
  vibes: Vibe[];
  priority?: boolean; // render with extra spacing when marked as important
  ratingDisplayMode?: RatingDisplayMode; // determines which rating metric to show
  // Infinite scroll props allow the row to lazily fetch more content
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

/**
 * Horizontally scrollable row of vibe cards with optional infinite loading.
 *
 * The component exposes imperative scroll buttons on desktop while relying on
 * native swipe gestures on mobile. When `fetchNextPage` is provided the row
 * observes an invisible sentinel near the end to request more data.
 */
export function VibeCategoryRow({
  title,
  vibes,
  priority = false,
  ratingDisplayMode = 'most-rated',
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: VibeCategoryRowProps) {
  // track the scrolling container to drive button state and infinite loading
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // flags indicating whether left/right arrows should be enabled
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // configure infinite scroll when a fetch callback is supplied
  const infiniteScrollRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: fetchNextPage || (() => {}),
    rootMargin: '200px',
  });

  // check scroll positions to toggle button availability
  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  // perform a smooth horizontal scroll in the requested direction
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // scroll most of viewport

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    // re-evaluate arrow states after the animation finishes
    setTimeout(checkScrollButtons, 300);
  };

  // whenever vibes change, re-check whether arrows should be shown
  React.useEffect(() => {
    checkScrollButtons();
  }, [vibes]);

  // nothing to render when no vibes are provided
  if (vibes?.length === 0 || !vibes) return null;

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
        {/* arrow buttons only visible on hover for desktop users */}
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
          {vibes?.map((vibe, _index) => (
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

          {/* loading placeholder shown while fetching next page */}
          {isFetchingNextPage && (
            <div
              className={cn(
                'flex flex-shrink-0 snap-start items-center justify-center',
                priority
                  ? 'w-[280px] md:w-[320px] lg:w-[360px]'
                  : 'w-[250px] md:w-[280px] lg:w-[300px]'
              )}
            >
              <div className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">loading more...</span>
              </div>
            </div>
          )}

          {/* invisible sentinel that triggers fetching additional vibes */}
          {fetchNextPage && hasNextPage && (
            <div
              ref={infiniteScrollRef}
              className="w-4 flex-shrink-0"
              style={{ opacity: 0 }}
            />
          )}

          {/* small spacer so last card isn't flush against the edge */}
          <div className="w-4 flex-shrink-0" />
        </div>

        {/* compact next/prev buttons for touch devices */}
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
