import { SearchResultListCard } from './search-result-list-card';
import { SearchEmptyState } from './search-empty-state';
import { SearchLoading } from './search-loading';
import { SearchError } from './search-error';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { SearchResult, VibeSearchResult } from '@viberatr/types';
import type { Vibe } from '@/types';

interface SearchResultsListProps {
  results?: SearchResult[];
  loading: boolean;
  error?: Error | unknown;
  onRetry?: () => void;
  queriedEmojis?: string[];
}

// Helper function to convert VibeSearchResult to Vibe for VibeCard component
function convertVibeSearchResultToVibe(result: VibeSearchResult): Vibe {
  return {
    id: result.id,
    title: result.title,
    description: result.description,
    image: result.image,
    createdAt: new Date().toISOString(), // We don't have createdAt in search results
    createdBy: result.createdBy
      ? {
          externalId: result.createdBy.id,
          username: result.createdBy.name,
          first_name: result.createdBy.name,
          image_url: result.createdBy.avatar,
        }
      : null,
    ratings: [], // We don't have full ratings in search results
    tags: result.tags,
  };
}

export function SearchResultsList({
  results,
  loading,
  error,
  onRetry,
  queriedEmojis,
}: SearchResultsListProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (error) {
    return <SearchError error={error} onRetry={onRetry} />;
  }

  if (loading) {
    return <SearchLoading itemCount={6} type="list" />;
  }

  if (!results || results.length === 0) {
    return <SearchEmptyState />;
  }

  // On mobile, use VibeCard for vibe results and SearchResultListCard for others
  if (isMobile) {
    return (
      <div className="flex flex-col gap-y-2">
        {results.map((result) => {
          // For vibe results on mobile, use VibeCard with list variant
          if (result.type === 'vibe') {
            const vibeResult = result as VibeSearchResult;
            const vibeData = convertVibeSearchResultToVibe(vibeResult);
            return (
              <VibeCard
                key={result.id}
                vibe={vibeData}
                variant="feed-single"
                ratingDisplayMode="most-rated"
              />
            );
          }

          // For non-vibe results, use the regular search result card
          return (
            <SearchResultListCard
              key={result.id}
              result={result}
              queriedEmojis={queriedEmojis}
            />
          );
        })}
      </div>
    );
  }

  // On desktop, use SearchResultListCard for all results
  return (
    <div className="flex flex-col gap-y-4">
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
