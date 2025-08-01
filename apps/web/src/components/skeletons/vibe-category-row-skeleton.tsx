import { Skeleton } from '@/components/ui/skeleton';
import { VibeCardSkeleton } from './vibe-card-skeleton';

export function VibeCategoryRowSkeleton() {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="min-w-[250px] snap-start md:min-w-[280px] lg:min-w-[300px]"
          >
            <VibeCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
