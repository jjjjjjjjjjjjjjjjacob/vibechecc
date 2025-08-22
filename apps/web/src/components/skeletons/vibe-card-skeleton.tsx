import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/utils/tailwind-utils';
import { usePlaceholderTracking } from '@/hooks/use-performance-tracking';

interface VibeCardSkeletonProps {
  compact?: boolean;
  trackingId?: string;
}

export function VibeCardSkeleton({ compact, trackingId }: VibeCardSkeletonProps) {
  const componentName = trackingId || `vibe-card-skeleton${compact ? '-compact' : ''}`;
  const { visibilityRef, trackInteraction } = usePlaceholderTracking(componentName, {
    trackVisibility: true,
    trackInteraction: true,
    minVisibilityTime: 300,
  });
  return (
    <Card 
      ref={visibilityRef}
      className={cn('overflow-hidden', !compact && 'h-full')}
      onClick={() => trackInteraction('card_click')}
    >
      {/* Image skeleton */}
      <div className="relative">
        <Skeleton
          className={cn('w-full', compact ? 'aspect-[4/3]' : 'aspect-video')}
          onClick={() => trackInteraction('image_click')}
        />
      </div>

      <CardContent className={cn('p-4', compact && 'p-3')}>
        {/* Title skeleton */}
        <Skeleton className={cn('mb-2', compact ? 'h-5' : 'h-6')} />

        {/* Description skeleton (only for non-compact) */}
        {!compact && (
          <div className="space-y-2">
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          'flex flex-col items-start gap-2 p-4 pt-0',
          compact && 'p-3 pt-0'
        )}
      >
        <div className="flex w-full items-center justify-between">
          {/* Author info skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Rating skeleton */}
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
