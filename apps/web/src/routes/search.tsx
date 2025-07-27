import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load search components for code splitting
const SearchResultsGrid = lazy(() => 
  import('@/features/search/components').then(m => ({ default: m.SearchResultsGrid }))
);
const SearchPagination = lazy(() => 
  import('@/features/search/components').then(m => ({ default: m.SearchPagination }))
);

// Import non-heavy components normally
import { useSearchResults } from '@/features/search/hooks/use-search-results';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { EmojiRatingFilter } from '@/components/emoji-rating-filter';

// Loading skeletons for code-split components
function SearchResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <div className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex justify-center gap-2 mt-6">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

const searchParamsSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().optional(),
  sort: z
    .enum(['relevance', 'rating_desc', 'recent'])
    .optional()
    .default('relevance'),
  page: z.number().optional().default(1),
  emojiFilter: z.array(z.string()).optional(),
  emojiMinValue: z.number().min(1).max(5).optional(),
});

export const Route = createFileRoute('/search')({
  validateSearch: searchParamsSchema,
  component: SearchResultsPage,
});

function SearchResultsPage() {
  const { q, tags, rating, sort, page, emojiFilter, emojiMinValue } =
    Route.useSearch();
  const filters = {
    tags,
    minRating: rating,
    sort,
    emojiRatings:
      (emojiFilter && emojiFilter.length > 0) || emojiMinValue
        ? { emojis: emojiFilter, minValue: emojiMinValue }
        : undefined,
  };

  const { data, isLoading, isError, error } = useSearchResults({
    query: q || '',
    filters,
  });

  const navigate = Route.useNavigate();

  const updateFilters = (newFilters: typeof filters) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...newFilters,
        page: 1, // Reset page when filters change
      }),
    });
  };

  const totalPages = Math.ceil((data?.totalCount || 0) / 20);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Search header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">
            {q ? `Search results for "${q}"` : 'All Results'}
          </h1>
          {data?.totalCount !== undefined && (
            <p className="text-muted-foreground">
              {data.totalCount} {data.totalCount === 1 ? 'result' : 'results'}{' '}
              found
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filter sidebar */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-4 p-4">
              <h2 className="mb-4 font-semibold">Filter Results</h2>
              <div className="space-y-6">
                {/* Star Rating Filter */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Minimum Rating
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Button
                          key={value}
                          variant={
                            rating && rating >= value ? 'default' : 'ghost'
                          }
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                rating: rating === value ? undefined : value,
                                page: 1,
                              }),
                            });
                          }}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              rating && rating >= value ? 'fill-current' : ''
                            }`}
                          />
                        </Button>
                      ))}
                    </div>
                    {rating && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate({
                            search: (prev) => ({
                              ...prev,
                              rating: undefined,
                              page: 1,
                            }),
                          });
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Emoji Rating Filter */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Emoji Ratings
                  </Label>
                  <EmojiRatingFilter
                    selectedEmojis={emojiFilter || []}
                    minValue={emojiMinValue}
                    onEmojiToggle={(emoji) => {
                      const current = emojiFilter || [];
                      const updated = current.includes(emoji)
                        ? current.filter((e) => e !== emoji)
                        : [...current, emoji];

                      navigate({
                        search: (prev) => ({
                          ...prev,
                          emojiFilter: updated.length > 0 ? updated : undefined,
                          page: 1,
                        }),
                      });
                    }}
                    onMinValueChange={(value) => {
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          emojiMinValue: value,
                          page: 1,
                        }),
                      });
                    }}
                  />
                </div>

                {/* Clear All Filters */}
                {(rating ||
                  (emojiFilter && emojiFilter.length > 0) ||
                  emojiMinValue) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigate({
                        search: {
                          q,
                          sort,
                          page: 1,
                        },
                      });
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </Card>
          </aside>

          {/* Results grid */}
          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="secondary">VIBES</Badge>
                <Badge variant="secondary">USERS</Badge>
                <Badge variant="secondary">TAGS</Badge>
              </div>
              <select
                value={sort}
                onChange={(e) =>
                  updateFilters({
                    ...filters,
                    sort: e.target.value as
                      | 'relevance'
                      | 'rating_desc'
                      | 'recent',
                  })
                }
                className="rounded-md border px-3 py-1 text-sm"
              >
                <option value="relevance">Most Relevant</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>

            <Suspense fallback={<SearchResultsSkeleton />}>
              <SearchResultsGrid
                results={
                  data
                    ? [
                        ...(data.vibes || []),
                        ...(data.users || []),
                        ...(data.tags || []),
                        ...(data.actions || []),
                      ]
                    : undefined
                }
                loading={isLoading}
                error={isError ? error : undefined}
                onRetry={() => window.location.reload()}
              />
            </Suspense>

            {!isLoading &&
              data &&
              ((data.vibes && data.vibes.length > 0) ||
                (data.users && data.users.length > 0) ||
                (data.tags && data.tags.length > 0) ||
                (data.actions && data.actions.length > 0)) && (
                <Suspense fallback={<PaginationSkeleton />}>
                  <SearchPagination
                    currentPage={page || 1}
                    totalPages={totalPages}
                  />
                </Suspense>
              )}
          </main>
        </div>
      </div>
    </div>
  );
}
