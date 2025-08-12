// skeleton blocks used to mimic the layout of loading content
import { Skeleton } from '@/components/ui/skeleton';
// card wrapper that provides consistent borders and rounding
import { Card } from '@/components/ui/card';

/** props controlling the look of the {@link SearchLoading} placeholder */
interface SearchLoadingProps {
  /** number of placeholder items to render */
  itemCount?: number;
  /** whether to render items in a grid or list layout */
  type?: 'grid' | 'list';
}

/**
 * Displays a skeleton UI while search results load. Layout switches between a
 * vertical list and responsive grid depending on the `type` prop.
 */
export function SearchLoading({
  itemCount = 6,
  type = 'grid',
}: SearchLoadingProps) {
  // render a vertical list when type is explicitly set to "list"
  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: itemCount }).map((_, i) => (
          // each list item is wrapped in a card to mimic final content
          <Card key={i} className="overflow-hidden">
            <div className="flex gap-4">
              {/* placeholder for an image thumbnail */}
              <Skeleton className="h-32 w-32 flex-shrink-0" />
              <div className="flex-1 p-4">
                {/* stacked text lines simulating title and description */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                {/* pill-shaped tags or metadata */}
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // default grid layout for typical search result cards
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: itemCount }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {/* aspect ratio box approximating the preview image */}
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-2 p-4">
            {/* title line */}
            <Skeleton className="h-5 w-full" />
            {/* short description line */}
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2 pt-2">
              {/* user avatar placeholder */}
              <Skeleton className="h-8 w-8 rounded-full" />
              {/* username placeholder */}
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** skeleton list used for the search suggestion dropdown */
export function SearchSuggestionsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* heading placeholder */}
        <Skeleton className="h-4 w-24" />
        <div className="space-y-1">
          {/* simulate three suggestion rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {/* secondary heading */}
        <Skeleton className="h-4 w-20" />
        <div className="space-y-1">
          {/* simulate two additional suggestion rows */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
