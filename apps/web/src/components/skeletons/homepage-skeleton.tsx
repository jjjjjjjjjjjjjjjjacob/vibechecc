/**
 * Renders loading placeholders for the homepage layout while data is fetched.
 * Each imported skeleton component mirrors its real counterpart to maintain
 * layout dimensions during the loading state.
 */
import { HeroSectionSkeleton } from './hero-section-skeleton'; // hero banner placeholder
import { VibeCategoryRowSkeleton } from './vibe-category-row-skeleton'; // horizontal vibe row skeleton
import { VibeGridSkeleton } from './vibe-grid-skeleton'; // grid of vibe cards placeholder
import { Skeleton } from '@/components/ui/skeleton'; // generic skeleton block

export function HomepageSkeleton() {
  // wrap content to mimic typical page padding
  return (
    <div className="container mx-auto px-4 py-8">
      {/* top hero section placeholder */}
      <HeroSectionSkeleton />

      {/* row showcasing featured vibes */}
      <VibeCategoryRowSkeleton />

      {/* recent vibes section with heading and call to action */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          {/* section title placeholder */}
          <Skeleton className="h-8 w-32" />
          {/* link/button placeholder */}
          <Skeleton className="h-5 w-16" />
        </div>
        {/* grid of vibe cards */}
        <VibeGridSkeleton />
      </section>
    </div>
  );
}
