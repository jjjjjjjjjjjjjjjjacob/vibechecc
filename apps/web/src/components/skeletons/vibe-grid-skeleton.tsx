import { VibeCardSkeleton } from './vibe-card-skeleton'; // placeholder for individual vibe card

/**
 * Props controlling the skeleton grid.
 * `count` sets how many card placeholders to render.
 */
interface VibeGridSkeletonProps {
  count?: number; // number of skeleton cards to show
}

/**
 * Renders a responsive grid of vibe card skeletons.
 * @param count how many skeleton cards to display
 */
export function VibeGridSkeleton({ count = 8 }: VibeGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <VibeCardSkeleton key={i} /> // each slot shows a placeholder card
      ))}
    </div>
  );
}
