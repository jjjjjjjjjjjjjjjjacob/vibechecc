import { Skeleton } from './skeleton';

export function HeroSectionSkeleton() {
  return (
    <section className="mb-12">
      <div className="rounded-2xl bg-gradient-to-r from-pink-500/20 to-orange-500/20 p-8 md:p-12">
        <div className="max-w-2xl">
          <Skeleton className="mb-4 h-12 w-96 md:h-14" />
          <div className="mb-6 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </section>
  );
}
