import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResultsSkeletonProps {
  count?: number;
  variant?: 'vibe' | 'user' | 'tag' | 'review' | 'mixed';
}

export function SearchResultsSkeleton({
  count = 3,
  variant = 'mixed',
}: SearchResultsSkeletonProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => {
        // For mixed results, vary the skeleton type
        const skeletonType =
          variant === 'mixed'
            ? ['vibe', 'user', 'vibe', 'tag', 'review'][i % 5]
            : variant;

        switch (skeletonType) {
          case 'vibe':
            return <VibeResultSkeleton key={i} />;
          case 'user':
            return <UserResultSkeleton key={i} />;
          case 'tag':
            return <TagResultSkeleton key={i} />;
          case 'review':
            return <ReviewResultSkeleton key={i} />;
          default:
            return <VibeResultSkeleton key={i} />;
        }
      })}
    </div>
  );
}

function VibeResultSkeleton() {
  return (
    <Card className="bg-card/30 border-border/50 flex w-full overflow-hidden">
      <div className="w-full p-0">
        <div className="flex gap-4 p-4">
          {/* Image - Takes up left side, matching vibe-card search-result variant */}
          <div className="relative flex-1 overflow-hidden rounded-lg">
            <Skeleton className="h-full w-full md:aspect-[4/3]" />
          </div>

          {/* Content - Takes up right side */}
          <div className="flex min-w-0 flex-[1] flex-col justify-between">
            <div>
              {/* Title and username */}
              <Skeleton className="mb-2 h-5 w-full" />
              <Skeleton className="mb-1 h-4 w-24" />

              {/* Description */}
              <Skeleton className="mb-3 h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Bottom section with ratings and tags */}
            <div className="mt-auto space-y-2">
              {/* Primary emoji rating display */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function UserResultSkeleton() {
  return (
    <div className="space-y-1">
      {/* Main User Card */}
      <Card className="bg-card/30 overflow-hidden">
        <div className="p-0">
          <div className="flex items-center gap-4 p-4 pb-2">
            {/* Avatar */}
            <Skeleton className="h-16 w-16 flex-shrink-0 rounded-full" />

            <div className="flex min-w-0 flex-1 items-center justify-between">
              <div className="min-w-0 flex-1">
                {/* Name and username */}
                <div className="mb-1 flex items-center gap-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20 flex-shrink-0" />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Badge */}
              <Skeleton className="h-6 w-12 flex-shrink-0 rounded-full" />
            </div>
          </div>

          {/* Top Vibes section - Show placeholders for compact vibes */}
          <div className="px-4 pb-4">
            <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2">
              {/* Three compact vibe skeletons on desktop */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3">
                  <Skeleton className="mb-2 h-20 w-full rounded" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
            {/* Mobile: Show only one compact vibe */}
            <div className="sm:hidden">
              <div className="bg-muted/30 rounded-lg p-3">
                <Skeleton className="mb-2 h-20 w-full rounded" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TagResultSkeleton() {
  return (
    <div className="space-y-1">
      {/* Main Tag Card */}
      <Card className="overflow-hidden">
        <div className="p-0">
          <div className="flex items-center gap-4 p-4 pb-2">
            {/* Icon placeholder */}
            <Skeleton className="h-16 w-16 flex-shrink-0 rounded-full" />

            <div className="flex min-w-0 flex-1 items-center justify-between">
              <div className="min-w-0 flex-1">
                {/* Tag name and count */}
                <div className="mb-1 flex items-center gap-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16 flex-shrink-0" />
                </div>
              </div>

              {/* Badge */}
              <Skeleton className="h-6 w-10 flex-shrink-0 rounded-full" />
            </div>
          </div>

          {/* Top Vibes section - Same as UserResultSkeleton */}
          <div className="px-4 pb-4">
            <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2">
              {/* Three compact vibe skeletons on desktop */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3">
                  <Skeleton className="mb-2 h-20 w-full rounded" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
            {/* Mobile: Show only one compact vibe */}
            <div className="sm:hidden">
              <div className="bg-muted/30 rounded-lg p-3">
                <Skeleton className="mb-2 h-20 w-full rounded" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReviewResultSkeleton() {
  return (
    <Card className="bg-card/30 overflow-hidden">
      <div className="p-0">
        <div className="flex gap-3 p-4">
          {/* Reviewer Avatar */}
          <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-2 flex flex-col gap-0">
              <div className="flex w-full items-center justify-between gap-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-1 h-3 w-32" />
            </div>

            {/* Review Text */}
            <div className="mb-3">
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Export individual skeletons for reuse
export {
  VibeResultSkeleton,
  UserResultSkeleton,
  TagResultSkeleton,
  ReviewResultSkeleton,
};
