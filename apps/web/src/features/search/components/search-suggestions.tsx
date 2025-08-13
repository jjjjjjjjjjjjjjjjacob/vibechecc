import { CommandGroup, CommandItem } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, TrendingUp, Search, Hash } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import type { SearchSuggestion } from '@viberatr/types';

interface SearchSuggestionsProps {
  recentSearches?: SearchSuggestion[];
  trendingSearches?: SearchSuggestion[];
  popularTags?: SearchSuggestion[];
  onSelect: (
    term: string,
    type?: 'tag' | 'search' | 'recent' | 'trending' | 'recommended'
  ) => void;
  isLoading?: boolean;
}

function SearchSuggestionsSkeleton() {
  return (
    <>
      <CommandGroup heading="trending">
        {[...Array(5)].map((_, i) => (
          <CommandItem
            key={`skeleton-trending-${i}`}
            disabled
            className="h-9 animate-pulse"
            style={{
              animationDelay: `${i * 50}ms`,
            }}
          >
            <div className="flex w-full items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandGroup heading="popular tags">
        {[...Array(8)].map((_, i) => (
          <CommandItem
            key={`skeleton-tags-${i}`}
            disabled
            className="h-9 animate-pulse"
            style={{
              animationDelay: `${(5 + i) * 50}ms`,
            }}
          >
            <div className="flex w-full items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandGroup heading="quick actions">
        <CommandItem
          disabled
          className="h-9 animate-pulse"
          style={{
            animationDelay: `${13 * 50}ms`,
          }}
        >
          <div className="flex w-full items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CommandItem>
      </CommandGroup>
    </>
  );
}

export function SearchSuggestions({
  recentSearches = [],
  trendingSearches = [],
  popularTags = [],
  onSelect,
  isLoading = false,
}: SearchSuggestionsProps) {
  if (isLoading) {
    return <SearchSuggestionsSkeleton />;
  }

  // Dynamic display - only show what exists, up to the max
  const MAX_RECENT_ITEMS = 5;
  const TRENDING_ITEMS = 5;
  const TAGS_ITEMS = 8;

  // Only take up to MAX_RECENT_ITEMS recent searches
  const displayRecentSearches = recentSearches.slice(0, MAX_RECENT_ITEMS);

  let itemIndex = 0;

  return (
    <>
      {/* Only show recent searches section if there are recent searches */}
      {displayRecentSearches.length > 0 && (
        <CommandGroup heading="recent searches">
          {displayRecentSearches.map((search) => {
            const currentIndex = itemIndex++;
            return (
              <CommandItem
                key={`suggestion-recent-${search.term}`}
                value={`recent-${search.term}`}
                onSelect={() => onSelect(search.term, 'recent')}
                className={cn(
                  'data-[selected=true]:bg-muted/80 flex h-9 items-center gap-2'
                )}
                style={{
                  animationDelay: `${currentIndex * 30}ms`,
                  animationDuration: '200ms',
                }}
              >
                <Clock className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                <span className="truncate">{search.term}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      )}

      <CommandGroup heading="trending">
        {[...Array(TRENDING_ITEMS)].map((_, i) => {
          const search = trendingSearches[i];
          const currentIndex = itemIndex++;

          if (search) {
            return (
              <CommandItem
                key={`suggestion-trending-${search.term}`}
                value={`trending-${search.term}`}
                onSelect={() => onSelect(search.term, 'trending')}
                className={cn(
                  'data-[selected=true]:bg-muted/80 flex h-9 items-center gap-2'
                )}
                style={{
                  animationDelay: `${currentIndex * 30}ms`,
                  animationDuration: '200ms',
                }}
              >
                <TrendingUp className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                <span className="truncate">{search.term}</span>
              </CommandItem>
            );
          }

          return (
            <div
              key={`trending-empty-${i}`}
              className="h-9 px-2 py-1.5"
              aria-hidden="true"
            />
          );
        })}
      </CommandGroup>

      <CommandGroup heading="popular tags">
        {[...Array(TAGS_ITEMS)].map((_, i) => {
          const tag = popularTags[i];
          const currentIndex = itemIndex++;

          if (tag) {
            return (
              <CommandItem
                key={`suggestion-tags-${tag.term}`}
                value={`tag-${tag.term}`}
                onSelect={() => onSelect(tag.term, 'tag')}
                className={cn(
                  'data-[selected=true]:bg-muted/80 flex h-9 items-center gap-2'
                )}
                style={{
                  animationDelay: `${currentIndex * 30}ms`,
                  animationDuration: '200ms',
                }}
              >
                <Hash className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                <span className="truncate">{tag.term}</span>
              </CommandItem>
            );
          }

          return (
            <div
              key={`tags-empty-${i}`}
              className="h-9 px-2 py-1.5"
              aria-hidden="true"
            />
          );
        })}
      </CommandGroup>

      <CommandGroup heading="quick actions">
        <CommandItem
          value="browse all vibes"
          onSelect={() => onSelect('/vibes')}
          className={cn(
            'data-[selected=true]:bg-muted/80 flex h-9 items-center gap-2',
            'animate-in fade-in-0 slide-in-from-left-1'
          )}
          style={{
            animationDelay: `${itemIndex * 30}ms`,
            animationDuration: '200ms',
          }}
        >
          <Search className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          <span className="truncate">browse all vibes</span>
        </CommandItem>
      </CommandGroup>
    </>
  );
}
