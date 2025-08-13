import { Skeleton } from '@/components/ui/skeleton'; // basic block placeholder

/**
 * Skeleton for the hero section shown while homepage content loads.
 */
export function HeroSectionSkeleton() {
  return (
    <section className="mb-12">
      {/* outer spacing for the hero area */}
      <div className="rounded-2xl bg-gradient-to-r from-pink-500/20 to-orange-500/20 p-8 md:p-12">
        {/* gradient background box */}
        <div className="max-w-2xl">
          {/* constrain content width */}
          <Skeleton className="mb-4 h-12 w-96 md:h-14" />
          {/* placeholder for headline */}
          <div className="mb-6 space-y-2">
            {/* space between paragraph lines */}
            <Skeleton className="h-6 w-full" />
            {/* first line */}
            <Skeleton className="h-6 w-3/4" />
            {/* second shorter line */}
          </div>
          <Skeleton className="h-10 w-32" />
          {/* call-to-action button */}
        </div>
      </div>
    </section>
  );
}
