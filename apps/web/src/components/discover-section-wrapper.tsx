import * as React from 'react';
import { Suspense } from 'react';
import { VibeCategoryRow, type RatingDisplayMode } from '@/components/vibe-category-row';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { Vibe } from '@/types';

// Skeleton for lazy-loaded components
function VibeCategoryRowSkeleton() {
  return (
    <div className="mb-10">
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-[280px] flex-shrink-0 space-y-2"
          >
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DiscoverSectionWrapperProps {
  title: string | React.ReactNode;
  vibes: Vibe[] | undefined;
  isLoading: boolean;
  error: any;
  priority?: boolean;
  ratingDisplayMode?: RatingDisplayMode;
  // Infinite scroll props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  // Whether to hide section if no vibes
  hideWhenEmpty?: boolean;
}

export function DiscoverSectionWrapper({
  title,
  vibes,
  isLoading,
  error,
  priority = false,
  ratingDisplayMode = 'most-rated',
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  hideWhenEmpty = false,
}: DiscoverSectionWrapperProps) {
  // Always show section title and skeleton while loading
  if (isLoading) {
    return (
      <div className="mb-10">
        <h2 className={`mb-6 text-foreground font-bold lowercase transition-colors ${
          priority ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
        }`}>
          {title}
        </h2>
        <VibeCategoryRowSkeleton />
      </div>
    );
  }

  // Show error state with title
  if (error) {
    const errorMessage = error?.message || 'Failed to load content';
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    
    return (
      <div className="mb-10">
        <h2 className={`mb-6 text-foreground font-bold lowercase transition-colors ${
          priority ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
        }`}>
          {title}
        </h2>
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              {errorMessage}
            </p>
            <p className="text-xs text-muted-foreground">
              error code: {errorCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Hide section entirely if no vibes and hideWhenEmpty is true
  if ((!vibes || vibes.length === 0) && hideWhenEmpty) {
    return null;
  }

  // Show empty state with title if no vibes but don't hide
  if (!vibes || vibes.length === 0) {
    return (
      <div className="mb-10">
        <h2 className={`mb-6 text-foreground font-bold lowercase transition-colors ${
          priority ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
        }`}>
          {title}
        </h2>
        <div className="rounded-lg border border-muted bg-muted/10 p-8 text-center">
          <p className="text-muted-foreground">no vibes to show yet</p>
        </div>
      </div>
    );
  }

  // Normal rendering with vibes
  return (
    <Suspense fallback={<VibeCategoryRowSkeleton />}>
      <VibeCategoryRow
        title={title}
        vibes={vibes}
        priority={priority}
        ratingDisplayMode={ratingDisplayMode}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </Suspense>
  );
}