import { HeroSectionSkeleton } from './hero-section-skeleton';
import { VibeCategoryRowSkeleton } from './vibe-category-row-skeleton';
import { VibeGridSkeleton } from './vibe-grid-skeleton';
import { Skeleton } from './skeleton';

export function HomepageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section Skeleton */}
      <HeroSectionSkeleton />

      {/* Featured Vibes Skeleton */}
      <VibeCategoryRowSkeleton />

      {/* Recent Vibes Section Skeleton */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <VibeGridSkeleton />
      </section>
    </div>
  );
}
