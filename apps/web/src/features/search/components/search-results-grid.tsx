/**
 * search results grid module.
 * enhanced documentation for clarity and maintenance.
 */
import { SearchResultCard } from './search-result-card';
import { SearchEmptyState } from './search-empty-state';
import { SearchLoading } from './search-loading';
import { SearchError } from './search-error';
import type { SearchResult } from '@viberatr/types';

interface SearchResultsGridProps {
  results?: SearchResult[];
  loading: boolean;
  error?: Error | unknown;
  onRetry?: () => void;
  queriedEmojis?: string[]; // Pass queried emojis to prioritize in vibe cards
}

export function SearchResultsGrid({
  results,
  loading,
  error,
  onRetry,
  queriedEmojis,
}: SearchResultsGridProps) {
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
    <div className="grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {results.map((result) => (
        <SearchResultCard
          key={result.id}
          result={result}
          queriedEmojis={queriedEmojis}
        />
      ))}
    </div>
  );
}
