/**
 * Skeleton placeholder for a horizontal row of vibe cards. Used while loading
 * categories on the homepage so users see the intended layout before real data
 * arrives.
 */
import { Skeleton } from '@/components/ui/skeleton'; // generic rectangular placeholder
import { VibeCardSkeleton } from './vibe-card-skeleton'; // card placeholder

export function VibeCategoryRowSkeleton() {
  return (
    <div className="mb-8">
      {/* overall section spacing */}
      {/* heading and action buttons */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        {/* fake title */}
        <div className="flex gap-2">
          {/* arrow buttons */}
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      {/* horizontally scrollable row of vibe card placeholders */}
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="min-w-[250px] snap-start md:min-w-[280px] lg:min-w-[300px]"
          >
            <VibeCardSkeleton />
            {/* individual card placeholder */}
          </div>
        ))}
      </div>
    </div>
  );
}
