import * as React from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import type { Vibe } from '@vibechecc/types';
import { cn } from '@/utils/tailwind-utils';

interface VirtualMasonryFeedProps {
  vibes: Vibe[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
  ratingDisplayMode?: 'most-rated' | 'top-rated';
  overscan?: number;
  threshold?: number; // Number of items before switching to virtual scrolling
}

export function VirtualMasonryFeed({
  vibes,
  onLoadMore,
  hasMore,
  isLoading,
  className,
  ratingDisplayMode = 'most-rated',
  overscan = 5,
  threshold = 50,
}: VirtualMasonryFeedProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const listRef = React.useRef<List>(null);
  const sizeMap = React.useRef<{ [key: number]: number }>({});

  // Estimate item height based on content and device
  const estimateItemSize = React.useCallback(
    (index: number) => {
      const vibe = vibes[index];
      if (!vibe) return 400;

      // Base height for card structure
      const baseHeight = 200;

      // Add height for description (estimate 0.5px per character)
      const descriptionHeight = Math.min(vibe.description.length * 0.5, 200);

      // Add height for image if present
      const imageHeight = vibe.image || vibe.imageStorageId ? 250 : 0;

      // Add height for ratings
      const ratingsHeight = ratingDisplayMode === 'top-rated' ? 120 : 60;

      // Adjust for device
      const deviceMultiplier = isMobile ? 1.2 : isTablet ? 1.1 : 1;

      return (
        (baseHeight + descriptionHeight + imageHeight + ratingsHeight) *
        deviceMultiplier
      );
    },
    [vibes, isMobile, isTablet, ratingDisplayMode]
  );

  // Get actual size after render
  const getItemSize = React.useCallback(
    (index: number) => {
      return sizeMap.current[index] || estimateItemSize(index);
    },
    [estimateItemSize]
  );

  // Set actual size after measurement
  const setItemSize = React.useCallback((index: number, size: number) => {
    sizeMap.current[index] = size;
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, []);

  // Render individual vibe card
  const Row = React.memo(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const vibe = vibes[index];
      const rowRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        if (rowRef.current) {
          const height = rowRef.current.getBoundingClientRect().height;
          setItemSize(index, height);
        }
      }, [index, vibe]);

      // Trigger load more when approaching the end
      React.useEffect(() => {
        if (
          index === vibes.length - 10 &&
          hasMore &&
          !isLoading &&
          onLoadMore
        ) {
          onLoadMore();
        }
      }, [index]);

      if (!vibe) return null;

      return (
        <div ref={rowRef} style={style} className="px-4 py-2">
          <VibeCard
            vibe={vibe}
            variant="feed-masonry"
            ratingDisplayMode={ratingDisplayMode}
            className="h-auto"
          />
        </div>
      );
    }
  );

  Row.displayName = 'VirtualVibeRow';

  // Don't use virtual scrolling for small lists
  if (vibes.length < threshold) {
    return (
      <div className={cn('grid gap-4 px-4', className)}>
        {vibes.map((vibe) => (
          <VibeCard
            key={vibe._id}
            vibe={vibe}
            variant="feed-masonry"
            ratingDisplayMode={ratingDisplayMode}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        )}
      </div>
    );
  }

  // Use virtual scrolling for large lists
  return (
    <div className={cn('h-screen', className)}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={vibes.length}
            itemSize={getItemSize}
            overscanCount={overscan}
            estimatedItemSize={400}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
      {isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
