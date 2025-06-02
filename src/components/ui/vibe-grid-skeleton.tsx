import { VibeCardSkeleton } from './vibe-card-skeleton';

interface VibeGridSkeletonProps {
  count?: number;
}

export function VibeGridSkeleton({ count = 8 }: VibeGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <VibeCardSkeleton key={i} />
      ))}
    </div>
  );
}
