import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import * as React from 'react';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Lazy load search components for code splitting
const _SearchResultsGrid = lazy(() =>
  import('@/features/search/components/search-results-grid').then((m) => ({
    default: m.SearchResultsGrid,
  }))
);
const SearchResultsList = lazy(() =>
  import('@/features/search/components/search-results-list').then((m) => ({
    default: m.SearchResultsList,
  }))
);
const SearchPagination = lazy(() =>
  import('@/features/search/components/search-pagination').then((m) => ({
    default: m.SearchPagination,
  }))
);

// Import non-heavy components normally
import { useSearchResultsImproved } from '@/features/search/hooks/use-search-results-improved';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmojiSearchCollapsible } from '@/features/ratings/components/emoji-search-collapsible';
import { EmojiPillFilters } from '@/features/ratings/components/emoji-pill-filters';
import { RatingRangeSlider } from '@/features/ratings/components/rating-range-slider';
import { TagSearchCommand } from '@/components/tag-search-command';
import { cn } from '@/utils/tailwind-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { ChevronLeft, SlidersHorizontal } from '@/components/ui/icons';

// Loading skeletons for code-split components
function SearchResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="relative h-full overflow-hidden">
          {/* Avatar skeleton in top left */}
          <div className="absolute top-2 left-2 z-10">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>

          {/* Main content structure matching VibeResultCard */}
          <div className="block h-full">
            {/* Image placeholder */}
            <div className="relative aspect-video overflow-hidden">
              <Skeleton className="h-full w-full" />
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <Skeleton className="mb-2 h-6 w-3/4" />

              {/* Description */}
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Footer with rating skeleton */}
            <div className="flex flex-col items-start gap-3 p-4 pt-0">
              {/* Emoji rating display skeleton */}
              <div className="w-full space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                {/* Additional rating items */}
                <div className="flex gap-1">
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="mt-6 flex flex-col justify-center gap-2">
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
  ratingMin: z.number().min(1).max(5).optional().default(1),
  ratingMax: z.number().min(1).max(5).optional().default(5),
  sort: z
    .enum([
      'relevance',
      'rating_desc',
      'top_rated',
      'most_rated',
      'recent',
      'name',
      'creation_date',
      'interaction_time',
    ])
    .optional()
    .default('relevance'),
  page: z.number().optional().default(1),
  emojiFilter: z.array(z.string()).optional(),
  emojiMinValue: z.number().min(1).max(5).optional(),
  tab: z
    .enum(['all', 'vibes', 'users', 'tags', 'reviews'])
    .optional()
    .default('all'),
});

export const Route = createFileRoute('/search')({
  validateSearch: searchParamsSchema,
  component: SearchResultsPage,
});

function SearchResultsPage() {
  const {
    q,
    tags,
    rating,
    ratingMin,
    ratingMax,
    sort,
    page,
    emojiFilter,
    emojiMinValue,
    tab,
  } = Route.useSearch();
  const [emojiSearchValue, setEmojiSearchValue] = React.useState('');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [filterExpanded, setFilterExpanded] = React.useState(isMobile);

  // Cache for total counts from 'all' query
  const [cachedTotalCounts, setCachedTotalCounts] = React.useState<{
    total: number;
    vibes: number;
    users: number;
    tags: number;
    reviews: number;
    actions: number;
  } | null>(null);

  const filters = {
    tags,
    minRating:
      rating || (ratingMin !== 1 || ratingMax !== 5 ? ratingMin : undefined),
    maxRating: ratingMax !== 5 ? ratingMax : undefined,
    sort,
    emojiRatings:
      (emojiFilter && emojiFilter.length > 0) || emojiMinValue
        ? { emojis: emojiFilter, minValue: emojiMinValue }
        : undefined,
  };

  // Get include types based on active tab
  const getIncludeTypes = (activeTab: string) => {
    switch (activeTab) {
      case 'vibes':
        return ['vibe'];
      case 'users':
        return ['user'];
      case 'tags':
        return ['tag'];
      case 'reviews':
        return ['review'];
      case 'all':
      default:
        return undefined; // Include all types
    }
  };

  // Main query for current tab results
  const { data, isLoading, isError, error } = useSearchResultsImproved({
    query: q || '',
    filters,
    page: page,
    includeTypes: getIncludeTypes(tab),
  });

  // Only fetch all counts if we're not on the "all" tab (which gives us complete counts anyway)
  const { data: allCountsData } = useSearchResultsImproved({
    query: q || '',
    filters,
    page: 1,
    includeTypes: undefined, // Get counts for all types
    enabled: tab !== 'all', // Only run this query when not on "all" tab
    skipTracking: true, // Skip tracking for this secondary query to prevent duplicates
  });

  React.useEffect(() => {
    if (!filterExpanded && !isMobile) {
      setFilterExpanded(true);
    } else if (filterExpanded && isMobile) {
      setFilterExpanded(false);
    }
  }, [isMobile, filterExpanded]);

  // Update cached counts - use data from "all" tab or from separate counts query
  React.useEffect(() => {
    if (tab === 'all' && data?.totalCounts) {
      // Use counts from the main query when on "all" tab
      setCachedTotalCounts(data.totalCounts);
    } else if (tab !== 'all' && allCountsData?.totalCounts) {
      // Use counts from separate query when on specific tabs
      setCachedTotalCounts(allCountsData.totalCounts);
    }
  }, [data?.totalCounts, allCountsData?.totalCounts, tab]);

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

  // Get proper counts from the improved search
  const activeTabCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const filter = (
    <div className="space-y-6">
      {/* Emoji Filter */}
      <div>
        <Label className="mb-3 block text-sm font-medium lowercase">
          filter by emoji
        </Label>
        <div className="h-full w-full space-y-4 shadow-none">
          <EmojiSearchCollapsible
            searchValue={emojiSearchValue}
            onSearchChange={setEmojiSearchValue}
            data-testid="emoji-search-collapsible"
            perLine={isMobile ? 10 : 8}
            onSelect={(emoji) => {
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
              setEmojiSearchValue(''); // Clear search after selection
            }}
            placeholder="search emojis..."
            className="w-full text-sm"
          />

          {/* Active Emoji Filters */}
          {emojiFilter && emojiFilter.length > 0 && (
            <EmojiPillFilters
              emojis={emojiFilter}
              onRemove={(emoji) => {
                const updated = emojiFilter.filter((e) => e !== emoji);
                navigate({
                  search: (prev) => ({
                    ...prev,
                    emojiFilter: updated.length > 0 ? updated : undefined,
                    page: 1,
                  }),
                });
              }}
              onClear={() => {
                navigate({
                  search: (prev) => ({
                    ...prev,
                    emojiFilter: undefined,
                    page: 1,
                  }),
                });
              }}
              variant="compact"
            />
          )}

          {/* Minimum Rating Selector for Emojis */}
          {emojiFilter && emojiFilter.length > 0 && (
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs lowercase">
                minimum emoji rating: {emojiMinValue || 1}
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    variant={emojiMinValue === value ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-full p-0 text-xs"
                    onClick={() => {
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          emojiMinValue: value,
                          page: 1,
                        }),
                      });
                    }}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tag Filter */}
      <div>
        <Label className="mb-3 block text-sm font-medium lowercase">
          filter by tags
        </Label>
        <TagSearchCommand
          selectedTags={tags || []}
          onTagSelect={(tag) => {
            const current = tags || [];
            if (!current.includes(tag)) {
              navigate({
                search: (prev) => ({
                  ...prev,
                  tags: [...current, tag],
                  page: 1,
                }),
              });
            }
          }}
          onTagRemove={(tag) => {
            const updated = (tags || []).filter((t) => t !== tag);
            navigate({
              search: (prev) => ({
                ...prev,
                tags: updated.length > 0 ? updated : undefined,
                page: 1,
              }),
            });
          }}
        />
      </div>

      {/* General Rating Range Filter */}
      <div>
        <RatingRangeSlider
          value={[ratingMin, ratingMax]}
          onChange={([newMin, newMax]) => {
            navigate({
              search: (prev) => ({
                ...prev,
                ratingMin: newMin !== 1 ? newMin : undefined,
                ratingMax: newMax !== 5 ? newMax : undefined,
                page: 1,
              }),
            });
          }}
          min={1}
          max={5}
          step={0.1}
          label="general rating range"
          variant="default"
        />
      </div>

      {/* Clear All Filters - only show when filters are active */}
      {((emojiFilter && emojiFilter.length > 0) ||
        rating ||
        ratingMin !== 1 ||
        ratingMax !== 5 ||
        (emojiMinValue && emojiMinValue > 1) ||
        (tags && tags.length > 0)) && (
        <Button
          variant="outline"
          size="sm"
          className="from-theme-primary/50 to-theme-secondary/50 w-full bg-gradient-to-r lowercase"
          onClick={() => {
            navigate({
              search: {
                q,
                sort,
                page: 1,
                tab,
              },
            });
          }}
        >
          clear all filters
        </Button>
      )}
    </div>
  );

  const filterSidebar = (
    <aside
      data-open={filterExpanded}
      className="transition-width flex hidden w-0 flex-shrink-0 overflow-hidden duration-500 data-[open=true]:w-[334px] sm:flex"
    >
      <Card className="bg-card/30 dark:border-border/50 h-fit border-transparent p-2 shadow-lg backdrop-blur">
        {filter}
      </Card>
    </aside>
  );

  const filterButton = (
    <Button
      data-open={!isMobile && filterExpanded}
      variant="ghost"
      onClick={() => setFilterExpanded(!filterExpanded)}
      className={cn(
        'group flex h-fit w-full justify-start rounded-lg border p-1 transition',
        'data-[open=false]:border-theme-primary data-[open=false]:justify-center data-[open=true]:border-transparent',
        'data-[open=false]:hover:from-theme-primary data-[open=false]:hover:via-theme-primary data-[open=false]:hover:to-theme-secondary data-[] data-[open=false]:hover:bg-gradient-to-br data-[open=false]:hover:text-white data-[open=true]:hover:bg-transparent'
      )}
    >
      <h2
        data-open={!isMobile && filterExpanded}
        className={cn(
          'h-10 h-full flex-shrink-0 leading-none font-semibold lowercase transition data-[open=false]:hidden data-[open=false]:opacity-0',
          'from-theme-primary via-theme-primary to-theme-secondary bg-gradient-to-br bg-clip-text text-transparent'
        )}
      >
        filter results
      </h2>
      <ChevronLeft
        strokeWidth={4.0}
        data-open={!isMobile && filterExpanded}
        className="data-[open=false]:text-theme-primary text-theme-secondary transition data-[open=false]:hidden data-[open=false]:opacity-0 data-[open=true]:rotate-180"
      />
      <SlidersHorizontal
        strokeWidth={3.0}
        data-open={!isMobile && filterExpanded}
        className="text-theme-primary group-hover:text-background transition data-[open=false]:opacity-100 data-[open=true]:hidden data-[open=true]:opacity-0"
      />
    </Button>
  );

  const tabsList =
    isMobile || (!isMobile && isTablet && filterExpanded) ? (
      <Select
        value={tab}
        onValueChange={(value) =>
          navigate({
            search: (prev) => ({ ...prev, tab: value as typeof tab, page: 1 }),
          })
        }
      >
        <SelectTrigger
          className="rounded-md border !bg-transparent px-2 py-1 text-xs"
          size="xs"
          showIcon={false}
        >
          <SelectValue placeholder="sort by" />
        </SelectTrigger>
        <SelectContent className="bg-background/90 backdrop-blur-sm">
          <SelectItem value="all">
            all{' '}
            <Badge
              variant="secondary"
              className="bg-muted/30 text-2xs ml-1.5 h-5 px-1.5"
            >
              {cachedTotalCounts?.total || 0}
            </Badge>
          </SelectItem>
          <SelectItem value="vibes">
            vibes{' '}
            <Badge
              variant="secondary"
              className="bg-muted/30 text-2xs ml-1.5 h-5 px-1.5"
            >
              {cachedTotalCounts?.vibes}
            </Badge>
          </SelectItem>

          <SelectItem value="users">
            users{' '}
            <Badge
              variant="secondary"
              className="bg-muted/30 text-2xs ml-1.5 h-5 px-1.5"
            >
              {cachedTotalCounts?.users}
            </Badge>
          </SelectItem>
          <SelectItem value="tags">
            tags{' '}
            <Badge
              variant="secondary"
              className="bg-muted/30 text-2xs ml-1.5 h-5 px-1.5"
            >
              {cachedTotalCounts?.tags}
            </Badge>
          </SelectItem>
          <SelectItem value="reviews">
            reviews{' '}
            <Badge
              variant="secondary"
              className="bg-muted/30 text-2xs ml-1.5 h-5 px-1.5"
            >
              {cachedTotalCounts?.reviews}
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>
    ) : (
      <TabsList className="flex w-fit gap-1 bg-transparent">
        {(['all', 'vibes', 'users', 'tags', 'reviews'] as const).map(
          (tabName) => {
            // Use cached counts for consistent display across all tabs
            const count = cachedTotalCounts
              ? tabName === 'all'
                ? cachedTotalCounts.total
                : cachedTotalCounts[tabName] || 0
              : 0;

            return (
              <TabsTrigger value={tabName} asChild key={tabName}>
                <Button
                  key={tabName}
                  size="sm"
                  onClick={() => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        tab: tabName,
                        page: 1,
                      }),
                    });
                  }}
                  variant={tab === tabName ? 'default' : 'outline'}
                  className={cn(
                    'rounded-lg whitespace-nowrap lowercase transition',
                    tab === tabName
                      ? 'hover:from-theme-primary hover:via-theme-primary hover:to-theme-secondary from-theme-primary/70 via-theme-primary/70 to-theme-secondary/60 border-none bg-transparent bg-gradient-to-br text-xs text-white shadow-lg'
                      : 'border-border/50 text-xs shadow-md'
                  )}
                >
                  <span>{tabName}</span>
                  {!isLoading && count > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-muted/30 text-2xs ml-1.5 h-5 px-1.5"
                    >
                      {count}
                    </Badge>
                  )}
                </Button>
              </TabsTrigger>
            );
          }
        )}
      </TabsList>
    );

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-[hsl(var(--theme-primary))]/10">
      <div className="container mx-auto px-4 py-8">
        {/* Search header */}
        <div className="mb-8 text-left">
          <h1
            className={cn(
              'mb-2 text-3xl font-bold lowercase drop-shadow-md sm:text-4xl'
            )}
          >
            {q
              ? `search results for "${q}"`
              : emojiFilter && emojiFilter.length > 0
                ? `${emojiFilter.join(' ')} vibes`
                : 'search results'}
          </h1>
          {data?.totalCount !== undefined && (
            <p className="text-muted-foreground drop-shadow-sm">
              {data.totalCount} {data.totalCount === 1 ? 'result' : 'results'}{' '}
              {q ? `found for "${q}"` : 'found'}
            </p>
          )}
        </div>

        <Tabs value={tab} className="flex gap-8">
          {/* Results grid */}
          <main className="flex w-full min-w-0 flex-col gap-4">
            <div
              data-open={filterExpanded}
              className="space-4 flex w-full items-center gap-4"
            >
              <div className="flex w-full justify-between">
                {tabsList}

                {/* Sort Options */}
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <Label className="text-muted-foreground text-xs font-medium">
                    sort by:
                  </Label>
                  <Select
                    value={sort}
                    onValueChange={(value) =>
                      updateFilters({
                        ...filters,
                        sort: value as typeof sort,
                      })
                    }
                  >
                    <SelectTrigger
                      className="rounded-md border !bg-transparent px-2 py-1 text-xs"
                      size="xs"
                    >
                      <SelectValue placeholder="sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/90 backdrop-blur-sm">
                      <SelectItem value="relevance">most relevant</SelectItem>
                      <SelectItem value="rating_desc">highest rated</SelectItem>
                      <SelectItem value="top_rated">top rated</SelectItem>
                      <SelectItem value="most_rated">most rated</SelectItem>
                      <SelectItem value="recent">most recent</SelectItem>
                      <SelectItem value="name">name (a-z)</SelectItem>
                      <SelectItem value="creation_date">
                        creation date
                      </SelectItem>
                      <SelectItem value="interaction_time">
                        recent activity
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div
                data-open={!isMobile && filterExpanded}
                className="transition-width flex w-12 flex-shrink-0 overflow-hidden duration-400 data-[open=true]:w-[334px]"
              >
                {isMobile ? (
                  <Sheet open={filterExpanded} onOpenChange={setFilterExpanded}>
                    <SheetTrigger asChild>{filterButton}</SheetTrigger>
                    <SheetContent side="top" className="gap-2 p-4">
                      <h2
                        className={cn(
                          'h-10 h-full w-fit flex-shrink-0 leading-none font-semibold lowercase transition',
                          'from-theme-primary via-theme-primary to-theme-secondary bg-gradient-to-br bg-clip-text text-transparent'
                        )}
                      >
                        filter results
                      </h2>
                      <Separator />
                      {filter}
                    </SheetContent>
                  </Sheet>
                ) : (
                  filterButton
                )}
              </div>
            </div>
            <TabsContent
              value={'all'}
              data-open={filterExpanded}
              className="relative flex w-full gap-0 transition data-[open=false]:gap-x-0 data-[open=true]:gap-x-4"
            >
              <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResultsList
                  results={[
                    ...(data?.vibes || []),
                    ...(data?.users || []),
                    ...(data?.tags || []),
                    ...(data?.actions || []),
                    ...(data?.reviews || []),
                  ]}
                  loading={isLoading}
                  error={isError ? error : undefined}
                  onRetry={() => window.location.reload()}
                  queriedEmojis={emojiFilter}
                />
              </Suspense>
              {!isMobile && filterSidebar}
            </TabsContent>
            <TabsContent
              value={'vibes'}
              data-open={filterExpanded}
              className="flex w-full transition data-[open=false]:gap-x-0 data-[open=true]:gap-x-4"
            >
              <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResultsList
                  results={data?.vibes || []}
                  loading={isLoading}
                  error={isError ? error : undefined}
                  onRetry={() => window.location.reload()}
                  queriedEmojis={emojiFilter}
                />
              </Suspense>
              {!isMobile && filterSidebar}
            </TabsContent>
            <TabsContent
              value={'users'}
              data-open={filterExpanded}
              className="flex w-full transition data-[open=false]:gap-x-0 data-[open=true]:gap-x-4"
            >
              <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResultsList
                  results={data?.users || []}
                  loading={isLoading}
                  error={isError ? error : undefined}
                  onRetry={() => window.location.reload()}
                  queriedEmojis={emojiFilter}
                />
              </Suspense>
              {!isMobile && filterSidebar}
            </TabsContent>
            <TabsContent
              value={'tags'}
              data-open={filterExpanded}
              className="flex w-full transition data-[open=false]:gap-x-0 data-[open=true]:gap-x-4"
            >
              <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResultsList
                  results={data?.tags || []}
                  loading={isLoading}
                  error={isError ? error : undefined}
                  onRetry={() => window.location.reload()}
                  queriedEmojis={emojiFilter}
                />
              </Suspense>
              {!isMobile && filterSidebar}
            </TabsContent>
            {/* TabsContent for all tabs */}
            <TabsContent
              value={'reviews'}
              data-open={filterExpanded}
              className="flex w-full transition data-[open=false]:gap-x-0 data-[open=true]:gap-x-4"
            >
              <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResultsList
                  results={data?.reviews || []}
                  loading={isLoading}
                  error={isError ? error : undefined}
                  onRetry={() => window.location.reload()}
                  queriedEmojis={emojiFilter}
                />
              </Suspense>
              {!isMobile && filterSidebar}
            </TabsContent>

            {!isLoading && data && activeTabCount > 0 && totalPages > 1 && (
              <Suspense fallback={<PaginationSkeleton />}>
                <SearchPagination
                  currentPage={page || 1}
                  totalPages={totalPages}
                />
              </Suspense>
            )}
          </main>
          {/* Filter sidebar - always show on desktop */}
        </Tabs>
      </div>
    </div>
  );
}

export default SearchResultsPage;
