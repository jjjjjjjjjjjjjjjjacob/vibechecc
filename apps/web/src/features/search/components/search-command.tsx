import { useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
} from '@/components/ui/command';
import { VibeResult } from './result-items/vibe-result';
import { UserResult } from './result-items/user-result';
import { TagResult } from './result-items/tag-result';
import { ActionResult } from './result-items/action-result';
import { SearchSuggestions } from './search-suggestions';
import { useSearchSuggestions } from '../hooks/use-search';
import { useNavigate } from '@tanstack/react-router';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchSuggestions(query);
  const navigate = useNavigate();

  const handleSelect = () => {
    onOpenChange(false);
    setQuery('');
  };

  const handleSuggestionSelect = (term: string) => {
    if (term.startsWith('/')) {
      navigate({ to: term as '/vibes' });
      handleSelect();
    } else {
      setQuery(term);
    }
  };

  const hasResults =
    data &&
    'vibes' in data &&
    ((data.vibes && data.vibes.length > 0) ||
      (data.users && data.users.length > 0) ||
      (data.tags && data.tags.length > 0) ||
      (data.actions && data.actions.length > 0));

  // Extract recent searches from the suggestions data when query is empty
  const recentSearches =
    !query && data && 'recentSearches' in data
      ? data.recentSearches
      : undefined;
  const trendingSearchTerms =
    !query && data && 'trendingSearches' in data
      ? data.trendingSearches
      : undefined;
  const popularTags =
    !query && data && 'popularTags' in data ? data.popularTags : undefined;

  // Convert trending searches to SearchSuggestion format (use from data instead of separate query)
  const formattedTrendingSearches =
    trendingSearchTerms && Array.isArray(trendingSearchTerms)
      ? trendingSearchTerms.map((term: string) => ({
          term,
          type: 'trending' as const,
        }))
      : undefined;

  // Convert recent searches to SearchSuggestion format
  const formattedRecentSearches =
    recentSearches && Array.isArray(recentSearches)
      ? recentSearches.map((term: string) => ({
          term,
          type: 'recent' as const,
        }))
      : undefined;

  // Convert popular tags to SearchSuggestion format
  const formattedPopularTags =
    popularTags && Array.isArray(popularTags)
      ? popularTags.map((tag: string) => ({
          term: tag,
          type: 'recommended' as const,
        }))
      : undefined;

  // Check if there are any suggestions or results to show
  const hasContent =
    !query ||
    hasResults ||
    (formattedRecentSearches && formattedRecentSearches.length > 0) ||
    (formattedTrendingSearches && formattedTrendingSearches.length > 0) ||
    (formattedPopularTags && formattedPopularTags.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search for vibes, users, or tags"
    >
      <Command>
        <CommandInput
          placeholder="Search vibes, users, or tags..."
          value={query}
          onValueChange={setQuery}
          showBorder={hasContent}
        />
        <CommandList>
          {!query && (
            <SearchSuggestions
              recentSearches={formattedRecentSearches}
              trendingSearches={formattedTrendingSearches}
              popularTags={formattedPopularTags}
              onSelect={handleSuggestionSelect}
            />
          )}

          {query && !hasResults && !isLoading && (
            <CommandEmpty>No results found for "{query}"</CommandEmpty>
          )}

          {query && hasResults && data && 'vibes' in data && (
            <>
              {data.vibes && data.vibes.length > 0 && (
                <CommandGroup heading="Vibes">
                  {data.vibes.map((vibe) => (
                    <VibeResult
                      key={vibe.id}
                      result={vibe}
                      onSelect={handleSelect}
                    />
                  ))}
                </CommandGroup>
              )}

              {data.users && data.users.length > 0 && (
                <>
                  {data.vibes && data.vibes.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="Users">
                    {data.users.map((user) => (
                      <UserResult
                        key={user.id}
                        result={user}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}

              {data.tags && data.tags.length > 0 && (
                <>
                  {((data.vibes && data.vibes.length > 0) ||
                    (data.users && data.users.length > 0)) && (
                    <CommandSeparator />
                  )}
                  <CommandGroup heading="Tags">
                    {data.tags.map((tag) => (
                      <TagResult
                        key={tag.id}
                        result={tag}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}

              {data.actions && data.actions.length > 0 && (
                <>
                  {((data.vibes && data.vibes.length > 0) ||
                    (data.users && data.users.length > 0) ||
                    (data.tags && data.tags.length > 0)) && (
                    <CommandSeparator />
                  )}
                  <CommandGroup heading="Actions">
                    {data.actions.map((action) => (
                      <ActionResult
                        key={action.id}
                        result={action}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {query && query.length > 2 && (
            <>
              {(hasResults || isLoading) && <CommandSeparator />}
              <CommandGroup heading="Search for">
                <button
                  className="hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  onClick={() => {
                    navigate({ to: '/search', search: { q: query } });
                    handleSelect();
                  }}
                >
                  <span className="flex-1">Search for "{query}"</span>
                  <span className="text-muted-foreground ml-auto text-xs tracking-widest">
                    View all results
                  </span>
                </button>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
