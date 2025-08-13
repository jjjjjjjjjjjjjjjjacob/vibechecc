import * as React from 'react';
import { VibeCard } from './vibe-card';
import type { Vibe } from '@/types';
import type { RatingDisplayMode } from '@/components/vibe-category-row';

interface OptimizedVibeCardProps {
  vibe: Vibe;
  variant?:
    | 'default'
    | 'compact'
    | 'feed-grid'
    | 'feed-masonry'
    | 'feed-single'
    | 'list'
    | 'search-result';
  ratingDisplayMode?: RatingDisplayMode;
  className?: string;
  delay?: number;
}

/**
 * Optimized vibe card with memoization to prevent unnecessary re-renders
 * Only re-renders when vibe data actually changes
 */
export const OptimizedVibeCard = React.memo<OptimizedVibeCardProps>(
  ({ vibe, variant, ratingDisplayMode, className, delay }) => {
    return (
      <VibeCard
        vibe={vibe}
        variant={variant}
        ratingDisplayMode={ratingDisplayMode}
        className={className}
        delay={delay}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if important props change
    if (prevProps.vibe.id !== nextProps.vibe.id) return false;
    if (prevProps.vibe.title !== nextProps.vibe.title) return false;
    if (prevProps.vibe.description !== nextProps.vibe.description) return false;
    if (prevProps.vibe.image !== nextProps.vibe.image) return false;
    if (prevProps.vibe.imageStorageId !== nextProps.vibe.imageStorageId)
      return false;
    if (prevProps.variant !== nextProps.variant) return false;
    if (prevProps.ratingDisplayMode !== nextProps.ratingDisplayMode)
      return false;
    if (prevProps.className !== nextProps.className) return false;

    // Don't re-render for other prop changes
    return true;
  }
);

OptimizedVibeCard.displayName = 'OptimizedVibeCard';

/**
 * Optimized vibe list that uses virtualization for large lists
 */
export const OptimizedVibeList = React.memo<{
  vibes: Vibe[];
  variant?: OptimizedVibeCardProps['variant'];
  ratingDisplayMode?: RatingDisplayMode;
  className?: string;
}>(({ vibes, variant, ratingDisplayMode, className }) => {
  // Use virtual scrolling for lists > 50 items
  const shouldVirtualize = vibes.length > 50;

  if (shouldVirtualize) {
    // Lazy load virtual scrolling component
    const VirtualMasonryFeed = React.lazy(() =>
      import('@/components/virtual-masonry-feed').then((m) => ({
        default: m.VirtualMasonryFeed,
      }))
    );

    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <VirtualMasonryFeed
          vibes={vibes}
          ratingDisplayMode={ratingDisplayMode}
          className={className}
        />
      </React.Suspense>
    );
  }

  // Regular rendering for smaller lists
  return (
    <div className={className}>
      {vibes.map((vibe, index) => (
        <OptimizedVibeCard
          key={vibe.id}
          vibe={vibe}
          variant={variant}
          ratingDisplayMode={ratingDisplayMode}
          delay={index * 50} // Stagger animations
        />
      ))}
    </div>
  );
});

OptimizedVibeList.displayName = 'OptimizedVibeList';
