import { Skeleton } from '@/components/ui/skeleton'; // block element for loading states
import { Card, CardContent, CardFooter } from '@/components/ui/card'; // reuse card structure for consistent layout
import { cn } from '@/utils/tailwind-utils'; // utility for conditional class names

/**
 * Displays a placeholder card while vibe data is loading.
 * Mirrors the structure of a real vibe card so pages don't shift.
 */
interface VibeCardSkeletonProps {
  compact?: boolean; // toggles between full and compact layouts
}

export function VibeCardSkeleton({ compact }: VibeCardSkeletonProps) {
  // outer card container uses same styling as real card
  return (
    <Card className={cn('overflow-hidden', !compact && 'h-full')}>
      {/* reserve space for the vibe image */}
      <div className="relative">
        <Skeleton
          className={cn('w-full', compact ? 'aspect-[4/3]' : 'aspect-video')}
        />
      </div>

      {/* text content area */}
      <CardContent className={cn('p-4', compact && 'p-3')}>
        {/* placeholder for the vibe title */}
        <Skeleton className={cn('mb-2', compact ? 'h-5' : 'h-6')} />

        {/* show fake description lines only when not compact */}
        {!compact && (
          <div className="space-y-2">
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
      </CardContent>

      {/* footer mimics author and rating row */}
      <CardFooter
        className={cn(
          'flex flex-col items-start gap-2 p-4 pt-0',
          compact && 'p-3 pt-0'
        )}
      >
        <div className="flex w-full items-center justify-between">
          {/* avatar and author name placeholders */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* star rating placeholder */}
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-3" />
              ))}
            </div>
            <Skeleton className="ml-1 h-3 w-6" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
