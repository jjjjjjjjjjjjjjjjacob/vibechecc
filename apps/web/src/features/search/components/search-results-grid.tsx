import { SearchResultCard } from './search-result-card';
import { SearchEmptyState } from './search-empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { SearchResult } from '@vibechecc/types';

interface SearchResultsGridProps {
  results?: SearchResult[];
  loading: boolean;
}

export function SearchResultsGrid({ results, loading }: SearchResultsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return <SearchEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}