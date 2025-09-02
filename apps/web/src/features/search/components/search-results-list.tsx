import { SearchResultListCard } from './search-result-list-card';
import { SearchEmptyState } from './search-empty-state';
import { SearchError } from './search-error';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { SearchResult, VibeSearchResult, Vibe } from '@vibechecc/types';

interface SearchResultsListProps {
  results?: SearchResult[];
  loading: boolean;
  error?: Error | unknown;
  onRetry?: () => void;
  queriedEmojis?: string[];
}

// Helper function to convert VibeSearchResult to Vibe for VibeCard component
function _convertVibeSearchResultToVibe(result: VibeSearchResult): Vibe {
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
    emojiRatings: [],
    currentUserRatings: [], // We don't have user ratings in search results
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

  // Show loading state with appropriate card skeletons
  if (loading) {
    // Determine what type of skeletons to show based on results or default to mixed
    const getLoadingCards = () => {
      const skeletonCount = 6;
      const cards = [];

      // If we have results, use their types for skeletons
      if (results && results.length > 0) {
        for (let i = 0; i < Math.min(skeletonCount, results.length); i++) {
          cards.push(
            <SearchResultListCard
              key={`skeleton-${i}`}
              result={results[i]}
              loading={true}
              queriedEmojis={queriedEmojis}
            />
          );
        }
      } else {
        // Default: show mixed content skeletons
        cards.push(
          <SearchResultListCard
            key="skeleton-vibe-1"
            result={{ type: 'vibe' } as SearchResult}
            loading={true}
            queriedEmojis={queriedEmojis}
          />
        );
        cards.push(
          <SearchResultListCard
            key="skeleton-user"
            result={{ type: 'user' } as SearchResult}
            loading={true}
            queriedEmojis={queriedEmojis}
          />
        );
        cards.push(
          <SearchResultListCard
            key="skeleton-vibe-2"
            result={{ type: 'vibe' } as SearchResult}
            loading={true}
            queriedEmojis={queriedEmojis}
          />
        );
        cards.push(
          <SearchResultListCard
            key="skeleton-tag"
            result={{ type: 'tag' } as SearchResult}
            loading={true}
            queriedEmojis={queriedEmojis}
          />
        );
        cards.push(
          <SearchResultListCard
            key="skeleton-review"
            result={{ type: 'review' } as SearchResult}
            loading={true}
            queriedEmojis={queriedEmojis}
          />
        );
        cards.push(
          <SearchResultListCard
            key="skeleton-vibe-3"
            result={{ type: 'vibe' } as SearchResult}
            loading={true}
            queriedEmojis={queriedEmojis}
          />
        );
      }

      return cards;
    };

    return (
      <div
        className={
          isMobile
            ? 'flex w-full flex-col gap-y-2'
            : 'flex w-full flex-col gap-y-4'
        }
      >
        {getLoadingCards()}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="w-full">
        <SearchEmptyState />
      </div>
    );
  }

  // On mobile, use VibeCard for vibe results and SearchResultListCard for others
  if (isMobile) {
    return (
      <div className="flex w-full flex-col gap-y-2">
        {results.map((result) => {
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
    <div className="flex w-full flex-col gap-y-4">
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
