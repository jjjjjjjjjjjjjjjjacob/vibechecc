import { Skeleton } from '@/components/ui/skeleton'; // generic rectangular loader
import { Card, CardContent } from '@/components/ui/card'; // container mirroring real vibe detail layout

/**
 * Full-page skeleton that matches the vibe detail view.
 * Provides placeholders for image, meta information, reactions, and reviews.
 */
export function VibeDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* center content with typical page padding */}
      <Card className="mb-8 overflow-hidden">
        {/* main card holding the vibe info */}
        {/* hero image placeholder */}
        <div className="relative">
          <Skeleton className="h-64 w-full md:h-96" />
        </div>

        <CardContent className="p-6">
          {/* body of the card */}
          {/* title and rating area */}
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-9 w-64" />
            {/* vibe title */}
            <div className="flex items-center gap-2">
              {/* rating info */}
              <div className="flex gap-1">
                {/* star icons */}
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4" />
                ))}
              </div>
              <Skeleton className="h-4 w-16" />
              {/* numeric rating */}
            </div>
          </div>

          {/* author avatar and name */}
          <div className="mb-4 flex items-center">
            <Skeleton className="mr-3 h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="mb-1 h-5 w-24" />
              {/* author display name */}
              <Skeleton className="h-4 w-20" />
              {/* username */}
            </div>
          </div>

          {/* description paragraphs */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* tag list */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </div>

          {/* existing reactions */}
          <div className="mb-6 border-t pt-6">
            <Skeleton className="mb-4 h-6 w-20" />
            {/* section heading */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-12" />
              ))}
            </div>
          </div>

          {/* rating form users can fill */}
          <div className="mb-6 border-t pt-6">
            <Skeleton className="mb-4 h-6 w-32" />
            {/* form heading */}
            <div className="space-y-4">
              <div className="flex gap-1">
                {/* star inputs */}
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
              <Skeleton className="h-20 w-full" />
              {/* text area */}
              <Skeleton className="h-10 w-32" />
              {/* submit button */}
            </div>
          </div>

          {/* reviews from other users */}
          <div className="border-t pt-6">
            <Skeleton className="mb-4 h-6 w-16" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="border-b pb-4 last:border-b-0">
                  <div className="mb-2 flex items-center">
                    <Skeleton className="mr-2 h-8 w-8 rounded-full" />
                    {/* reviewer avatar */}
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-20" />
                      {/* reviewer name */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Skeleton key={j} className="h-3 w-3" />
                          ))}
                        </div>
                        <Skeleton className="h-3 w-16" />
                        {/* rating value */}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {/* review text lines */}
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
