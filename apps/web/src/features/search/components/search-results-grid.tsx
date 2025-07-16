import { SearchResultCard } from './search-result-card';
import { SearchEmptyState } from './search-empty-state';
import { SearchLoading } from './search-loading';
import { SearchError } from './search-error';
import type { SearchResult } from '@vibechecc/types';

interface SearchResultsGridProps {
  results?: SearchResult[];
  loading: boolean;
  error?: Error | unknown;
  onRetry?: () => void;
}

export function SearchResultsGrid({ results, loading, error, onRetry }: SearchResultsGridProps) {
  if (error) {
    return <SearchError error={error} onRetry={onRetry} />;
  }

  if (loading) {
    return <SearchLoading itemCount={9} type="grid" />;
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