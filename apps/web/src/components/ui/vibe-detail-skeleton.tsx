import { Skeleton } from './skeleton';
import { Card, CardContent } from './card';

export function VibeDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 overflow-hidden">
        {/* Image skeleton */}
        <div className="relative">
          <Skeleton className="h-64 w-full md:h-96" />
        </div>

        <CardContent className="p-6">
          {/* Title and rating section */}
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-9 w-64" />
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4" />
                ))}
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Author section */}
          <div className="mb-4 flex items-center">
            <Skeleton className="mr-3 h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="mb-1 h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </div>

          {/* Reactions section */}
          <div className="mb-6 border-t pt-6">
            <Skeleton className="mb-4 h-6 w-20" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-12" />
              ))}
            </div>
          </div>

          {/* Rating form section */}
          <div className="mb-6 border-t pt-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Reviews section */}
          <div className="border-t pt-6">
            <Skeleton className="mb-4 h-6 w-16" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="border-b pb-4 last:border-b-0">
                  <div className="mb-2 flex items-center">
                    <Skeleton className="mr-2 h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-20" />
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Skeleton key={j} className="h-3 w-3" />
                          ))}
                        </div>
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
