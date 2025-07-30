import { SearchResultListCard } from './search-result-list-card';
import { SearchEmptyState } from './search-empty-state';
import { SearchLoading } from './search-loading';
import { SearchError } from './search-error';
import type { SearchResult } from '@viberater/types';

interface SearchResultsListProps {
  results?: SearchResult[];
  loading: boolean;
  error?: Error | unknown;
  onRetry?: () => void;
  queriedEmojis?: string[];
}

export function SearchResultsList({
  results,
  loading,
  error,
  onRetry,
  queriedEmojis,
}: SearchResultsListProps) {
  if (error) {
    return <SearchError error={error} onRetry={onRetry} />;
  }

  if (loading) {
    return <SearchLoading itemCount={6} type="list" />;
  }

  if (!results || results.length === 0) {
    return <SearchEmptyState />;
  }

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <SearchResultListCard
          key={result.id}
          result={result}
          queriedEmojis={queriedEmojis}
        />
      ))}
    </div>
  );
}