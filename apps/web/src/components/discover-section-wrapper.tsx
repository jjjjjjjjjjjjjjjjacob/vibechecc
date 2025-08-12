import * as React from 'react';
import { Suspense } from 'react';
import {
  VibeCategoryRow,
  type RatingDisplayMode,
} from '@/components/vibe-category-row';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { Vibe } from '@/types';

/**
 * Simple placeholder used while lazily loaded sections fetch their data.
 * Displays a heading skeleton and a handful of generic card placeholders.
 */
function VibeCategoryRowSkeleton() {
  return (
    <div className="mb-10">
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[280px] flex-shrink-0 space-y-2">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Props for {@link DiscoverSectionWrapper}. The wrapper adds loading, empty, and
 * error states around a {@link VibeCategoryRow} to keep section behavior
 * consistent across pages.
 */
interface DiscoverSectionWrapperProps {
  /** Section heading displayed above the vibe row */
  title: string | React.ReactNode;
  /** Array of vibes to render. When undefined, the section is loading. */
  vibes: Vibe[] | undefined;
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Error object returned from data fetching, if any */
  error: Error | null;
  /** Increase spacing and font sizes when true */
  priority?: boolean;
  /** How emoji ratings should be displayed within each vibe card */
  ratingDisplayMode?: RatingDisplayMode;
  // Infinite scroll props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  // Whether to hide section if no vibes
  hideWhenEmpty?: boolean;
}

/**
 * Wrapper component that renders a titled vibe section with built-in loading,
 * error, and empty states. It delegates the actual list rendering to
 * {@link VibeCategoryRow}.
 */
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
        <h2
          className={`text-foreground mb-6 font-bold lowercase transition-colors ${
            priority ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          }`}
        >
          {title}
        </h2>
        <VibeCategoryRowSkeleton />
      </div>
    );
  }

  // Show error state with title
  if (error) {
    const errorMessage = error?.message || 'failed to load content';
    const errorCode = (error as { code?: string })?.code || 'UNKNOWN_ERROR';

    return (
      <div className="mb-10">
        <h2
          className={`text-foreground mb-6 font-bold lowercase transition-colors ${
            priority ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          }`}
        >
          {title}
        </h2>
        <div className="border-destructive/20 bg-destructive/10 flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="text-destructive h-5 w-5" />
          <div>
            <p className="text-destructive text-sm font-medium">
              {errorMessage}
            </p>
            <p className="text-muted-foreground text-xs">
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
        <h2
          className={`text-foreground mb-6 font-bold lowercase transition-colors ${
            priority ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          }`}
        >
          {title}
        </h2>
        <div className="border-muted bg-muted/10 rounded-lg border p-8 text-center">
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
