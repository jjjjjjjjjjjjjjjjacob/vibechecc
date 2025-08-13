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
    <Card className="relative h-full overflow-hidden transition-all duration-200">
      {/* Avatar skeleton in top left */}
      <div className="absolute top-2 left-2 z-10">
        <Skeleton className="h-6 w-6 rounded-full shadow-md" />
      </div>

      <div className="block h-full">
        {/* Image placeholder with proper aspect ratio */}
        <div className="relative aspect-video overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Content section */}
        <div className="p-4">
          {/* Title */}
          <Skeleton className="mb-2 h-6 w-3/4" />

          {/* Description lines */}
          <Skeleton className="mb-1 h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Footer with rating skeleton */}
        <div className="flex flex-col items-start gap-3 p-4 pt-0">
          {/* Primary emoji rating display */}
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            {/* Secondary ratings */}
            <div className="flex gap-1">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function UserResultSkeleton() {
  return (
    <Card className="h-full overflow-hidden transition-all duration-200">
      <div className="flex flex-col items-center space-y-4 p-6 text-center">
        {/* Avatar */}
        <Skeleton className="h-20 w-20 rounded-full" />

        {/* Name and username */}
        <div className="space-y-1">
          <Skeleton className="mx-auto h-5 w-32" />
          <Skeleton className="mx-auto h-4 w-24" />
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="space-y-1">
            <Skeleton className="mx-auto h-4 w-8" />
            <Skeleton className="mx-auto h-3 w-12" />
          </div>
          <div className="space-y-1">
            <Skeleton className="mx-auto h-4 w-8" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
        </div>

        {/* Badge */}
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </Card>
  );
}

function TagResultSkeleton() {
  return (
    <Card className="h-full overflow-hidden transition-all duration-200">
      <div className="flex flex-col items-center space-y-4 p-6 text-center">
        {/* Icon placeholder */}
        <Skeleton className="h-20 w-20 rounded-full" />

        {/* Tag name */}
        <div className="space-y-2">
          <Skeleton className="mx-auto h-5 w-24" />
          <Skeleton className="mx-auto h-4 w-20" />
        </div>

        {/* Badge */}
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
    </Card>
  );
}

function ReviewResultSkeleton() {
  return (
    <Card className="h-full overflow-hidden transition-all duration-200">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Review content */}
          <div className="min-w-0 flex-1">
            {/* Header with avatar and rating */}
            <div className="mb-2 flex items-start gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="mt-1 h-3 w-32" />
              </div>
            </div>

            {/* Review text */}
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Vibe image */}
          <Skeleton className="h-20 w-20 flex-shrink-0 rounded-md" />
        </div>
      </div>

      {/* Footer badge */}
      <div className="p-4 pt-0">
        <Skeleton className="h-5 w-16 rounded-full" />
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
