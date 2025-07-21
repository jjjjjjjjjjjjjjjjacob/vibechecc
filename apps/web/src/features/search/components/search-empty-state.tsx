import { Search, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { useTrendingSearches } from '../hooks/use-trending-searches';
import { useRecentSearches } from '../hooks/use-recent-searches';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchEmptyStateProps {
  query?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function SearchEmptyState({
  query,
  hasFilters,
  onClearFilters,
}: SearchEmptyStateProps) {
  const navigate = useNavigate();
  const { data: trendingSearches, isLoading: trendingLoading } =
    useTrendingSearches(6);
  const { recentSearches } = useRecentSearches();

  const suggestions = [
    'Try searching for different keywords',
    'Check your spelling',
    'Use more general terms',
    hasFilters ? 'Remove some filters' : null,
  ].filter(Boolean);

  const handleSearch = (term: string) => {
    navigate({
      to: '/search',
      search: { q: term },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-muted mb-4 rounded-full p-4">
        <Search className="text-muted-foreground h-8 w-8" />
      </div>

      <h2 className="mb-2 text-2xl font-semibold">
        {query ? `No results for "${query}"` : 'No results found'}
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md text-center">
        {query
          ? "We couldn't find any matches for your search."
          : 'Start searching to discover amazing vibes!'}
      </p>

      {/* Suggestions for improving search */}
      {query && (
        <Card className="bg-muted/50 mb-6 w-full max-w-md p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Search tips</span>
          </div>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {suggestions.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
          {hasFilters && onClearFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="mt-3 w-full"
            >
              Clear all filters
            </Button>
          )}
        </Card>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <Card className="mb-4 w-full max-w-md p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h3 className="font-semibold">Recent searches</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 5).map((search) => (
              <Button
                key={search.term}
                variant="ghost"
                size="sm"
                onClick={() => handleSearch(search.term)}
                className="text-muted-foreground hover:text-foreground"
              >
                {search.term}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Trending searches */}
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Trending searches</h3>
        </div>

        {trendingLoading ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(trendingSearches ?? []).map((search) => (
              <Button
                key={search.term}
                variant="secondary"
                size="sm"
                onClick={() => handleSearch(search.term)}
                className="capitalize"
              >
                {search.term}
                <span className="text-muted-foreground ml-1 text-xs">
                  ({search.count})
                </span>
              </Button>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-3 text-sm">
          Can't find what you're looking for?
        </p>
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/vibes/create' })}
        >
          Create a new vibe
        </Button>
      </div>
    </div>
  );
}
