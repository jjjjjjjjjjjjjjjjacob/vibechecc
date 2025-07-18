import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import {
  SearchFilters,
  SearchResultsGrid,
  SearchPagination,
} from '@/features/search/components';
import { useSearchResults } from '@/features/search/hooks/use-search-results';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const searchParamsSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().optional(),
  sort: z
    .enum(['relevance', 'rating_desc', 'recent'])
    .optional()
    .default('relevance'),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute('/search')({
  validateSearch: searchParamsSchema,
  component: SearchResultsPage,
});

function SearchResultsPage() {
  const { q, tags, rating, sort, page } = Route.useSearch();
  const filters = { tags, minRating: rating, sort };

  const { data, isLoading, isError, error } = useSearchResults({
    query: q || '',
    filters,
    page,
  });

  const updateFilters = (newFilters: typeof filters) => {
    const navigate = Route.useNavigate();
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
          {/* Filter sidebar - placeholder for Agent 4 */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-4 p-4">
              <h2 className="mb-4 font-semibold">Filter Results</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">Tags</p>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Filters coming soon...
                    </p>
                  )}
                </div>
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
                  updateFilters({ ...filters, sort: e.target.value as any })
                }
                className="rounded-md border px-3 py-1 text-sm"
              >
                <option value="relevance">Most Relevant</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>

            <SearchResultsGrid
              results={data?.results}
              loading={isLoading}
              error={isError ? error : undefined}
              onRetry={() => window.location.reload()}
            />

            {!isLoading && data?.results && data.results.length > 0 && (
              <SearchPagination
                currentPage={page || 1}
                totalPages={totalPages}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
