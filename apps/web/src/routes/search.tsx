import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import * as React from 'react';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Lazy load search components for code splitting
const SearchResultsGrid = lazy(() =>
  import('@/features/search/components').then((m) => ({
    default: m.SearchResultsGrid,
  }))
);
const SearchResultsList = lazy(() =>
  import('@/features/search/components').then((m) => ({
    default: m.SearchResultsList,
  }))
);
const SearchPagination = lazy(() =>
  import('@/features/search/components').then((m) => ({
    default: m.SearchPagination,
  }))
);

// Import non-heavy components normally
import { useSearchResultsImproved } from '@/features/search/hooks/use-search-results-improved';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmojiSearchCommand } from '@/components/emoji-search-command';
import { EmojiPillFilters } from '@/components/emoji-pill-filters';
import { RatingRangeSlider } from '@/components/rating-range-slider';
import { TagSearchCommand } from '@/components/tag-search-command';
import { MobileFilterSheet } from '@/features/search/components/mobile-filter-sheet';
import { cn } from '@/utils/tailwind-utils';

// Loading skeletons for code-split components
function SearchResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <div className="p-4">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-3 h-3 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="mt-6 flex justify-center gap-2">
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

  const { data, isLoading, isError, error } = useSearchResultsImproved({
    query: q || '',
    filters,
    page: tab === 'all' ? 1 : page, // Always use page 1 for "all" tab
    includeTypes: getIncludeTypes(tab),
  });

  // Debug log to check data structure
  /*
  React.useEffect(() => {
    if (data) {
      console.log('Search data for tab', tab, ':', {
        vibes: data.vibes?.length || 0,
        users: data.users?.length || 0,
        tags: data.tags?.length || 0,
        reviews: data.reviews?.length || 0,
        includeTypes: getIncludeTypes(tab),
      });
    }
  }, [data, tab]);
  */

  // Separate query to get total counts for all types (for badge display)
  const { data: allCountsData } = useSearchResultsImproved({
    query: q || '',
    filters,
    page: 1,
    includeTypes: undefined, // Get counts for all types
  });

  // Update cached counts when we get new data from the all counts query
  React.useEffect(() => {
    if (allCountsData?.totalCounts) {
      setCachedTotalCounts(allCountsData.totalCounts);
    }
  }, [allCountsData?.totalCounts]);

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
              found
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          {/* Filter sidebar - always show on desktop */}
          <aside className="hidden lg:block">
            <Card className="bg-background/90 sticky top-4 border-none shadow-lg backdrop-blur">
              <h2
                className={cn(
                  'mb-6 font-semibold lowercase',
                  'from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-transparent'
                )}
              >
                filter results
              </h2>
              <div className="space-y-6">
                {/* Emoji Filter */}
                <div>
                  <Label className="mb-3 block text-sm font-medium lowercase">
                    filter by emoji
                  </Label>
                  <div className="space-y-4">
                    <EmojiSearchCommand
                      searchValue={emojiSearchValue}
                      onSearchChange={setEmojiSearchValue}
                      onSelect={(emoji) => {
                        const current = emojiFilter || [];
                        const updated = current.includes(emoji)
                          ? current.filter((e) => e !== emoji)
                          : [...current, emoji];

                        navigate({
                          search: (prev) => ({
                            ...prev,
                            emojiFilter:
                              updated.length > 0 ? updated : undefined,
                            page: 1,
                          }),
                        });
                        setEmojiSearchValue(''); // Clear search after selection
                      }}
                      placeholder="search emojis..."
                      maxHeight="h-40"
                      showCategories={false}
                      className="text-sm"
                    />

                    {/* Active Emoji Filters */}
                    {emojiFilter && emojiFilter.length > 0 && (
                      <EmojiPillFilters
                        emojis={emojiFilter}
                        onRemove={(emoji) => {
                          const updated = emojiFilter.filter(
                            (e) => e !== emoji
                          );
                          navigate({
                            search: (prev) => ({
                              ...prev,
                              emojiFilter:
                                updated.length > 0 ? updated : undefined,
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
                              variant={
                                emojiMinValue === value ? 'default' : 'outline'
                              }
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
                    className="from-theme-primary to-theme-secondary w-full bg-gradient-to-r lowercase"
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
            </Card>
          </aside>

          {/* Results grid */}
          <main className="min-w-0">
            <div className="mb-6 space-y-4">
              {/* Mobile/Tablet Filter and Sort Controls */}
              <div className="flex items-center justify-between lg:hidden">
                <MobileFilterSheet
                  emojiFilter={emojiFilter}
                  emojiMinValue={emojiMinValue}
                  rating={rating}
                  ratingMin={ratingMin}
                  ratingMax={ratingMax}
                  tags={tags}
                  onEmojiFilterChange={(emojis) => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        emojiFilter: emojis.length > 0 ? emojis : undefined,
                        page: 1,
                      }),
                    });
                  }}
                  onEmojiMinValueChange={(value) => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        emojiMinValue: value,
                        page: 1,
                      }),
                    });
                  }}
                  onRatingChange={(rating) => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        rating: rating,
                        page: 1,
                      }),
                    });
                  }}
                  onRatingRangeChange={(min, max) => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        ratingMin: min !== 1 ? min : undefined,
                        ratingMax: max !== 5 ? max : undefined,
                        page: 1,
                      }),
                    });
                  }}
                  onTagsChange={(tags) => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        tags: tags.length > 0 ? tags : undefined,
                        page: 1,
                      }),
                    });
                  }}
                  onClearFilters={() => {
                    navigate({
                      search: {
                        q,
                        sort,
                        page: 1,
                        tab,
                      },
                    });
                  }}
                />

                <select
                  value={sort}
                  onChange={(e) =>
                    updateFilters({
                      ...filters,
                      sort: e.target.value as typeof sort,
                    })
                  }
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="relevance">most relevant</option>
                  <option value="rating_desc">highest rated</option>
                  <option value="top_rated">top rated</option>
                  <option value="most_rated">most rated</option>
                  <option value="recent">most recent</option>
                  <option value="name">name (a-z)</option>
                  <option value="creation_date">creation date</option>
                  <option value="interaction_time">recent activity</option>
                </select>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'vibes', 'users', 'tags', 'reviews'] as const).map(
                  (tabName) => {
                    // Use cached counts for consistent display across all tabs
                    const count = cachedTotalCounts
                      ? tabName === 'all'
                        ? cachedTotalCounts.total
                        : cachedTotalCounts[tabName] || 0
                      : 0;

                    return (
                      <Button
                        key={tabName}
                        variant={tab === tabName ? 'default' : ''}
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
                        className={cn(
                          'whitespace-nowrap lowercase',
                          tab === tabName
                            ? cn(
                                'border-none text-white shadow-lg',
                                'from-theme-primary to-theme-secondary bg-gradient-to-r'
                              )
                            : 'bg-background/90 border-border text-primary hover:bg-primary/10 border'
                        )}
                      >
                        <span>{tabName}</span>
                        {!isLoading && count > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1.5 h-5 px-1.5 text-xs"
                          >
                            {count}
                          </Badge>
                        )}
                      </Button>
                    );
                  }
                )}
              </div>

              {/* Desktop Sort Options */}
              <div className="hidden items-center justify-between lg:flex">
                <Label className="text-sm font-medium">sort by:</Label>
                <select
                  value={sort}
                  onChange={(e) =>
                    updateFilters({
                      ...filters,
                      sort: e.target.value as typeof sort,
                    })
                  }
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  <option value="relevance">most relevant</option>
                  <option value="rating_desc">highest rated</option>
                  <option value="top_rated">top rated</option>
                  <option value="most_rated">most rated</option>
                  <option value="recent">most recent</option>
                  <option value="name">name (a-z)</option>
                  <option value="creation_date">creation date</option>
                  <option value="interaction_time">recent activity</option>
                </select>
              </div>
            </div>

            <Suspense fallback={<SearchResultsSkeleton />}>
              <SearchResultsList
                results={
                  data
                    ? tab === 'all'
                      ? [
                          ...(data.vibes || []),
                          ...(data.users || []),
                          ...(data.tags || []),
                          ...(data.actions || []),
                          ...(data.reviews || []),
                        ]
                      : tab === 'vibes'
                        ? data.vibes || []
                        : tab === 'users'
                          ? data.users || []
                          : tab === 'tags'
                            ? data.tags || []
                            : tab === 'reviews'
                              ? data.reviews || []
                              : []
                    : []
                }
                loading={isLoading}
                error={isError ? error : undefined}
                onRetry={() => window.location.reload()}
                queriedEmojis={emojiFilter}
              />
            </Suspense>

            {!isLoading &&
              data &&
              activeTabCount > 0 &&
              totalPages > 1 &&
              tab !== 'all' && (
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
