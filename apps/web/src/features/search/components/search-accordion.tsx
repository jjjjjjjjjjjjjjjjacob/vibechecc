import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
  CommandItem,
} from '@/components/ui/command';
import { VibeResult } from './result-items/vibe-result';
import { UserResult } from './result-items/user-result';
import { TagResult } from './result-items/tag-result';
import { ActionResult } from './result-items/action-result';
import { SearchSuggestions } from './search-suggestions';
import { useSearchSuggestions } from '../hooks/use-search';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/utils/tailwind-utils';

interface SearchAccordionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export function SearchAccordion({
  open,
  onOpenChange,
  triggerRef,
}: SearchAccordionProps) {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchSuggestions(query);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!open) return;

      // Check if the click is outside both the search accordion and the trigger button
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange, triggerRef]);

  const handleSelect = () => {
    onOpenChange(false);
    setQuery('');
  };

  const handleSuggestionSelect = (term: string, type?: 'tag' | 'search') => {
    if (term.startsWith('/')) {
      navigate({ to: term as '/vibes' });
      handleSelect();
    } else if (type === 'tag' || term.startsWith('#')) {
      // For tags, navigate to search page showing vibes with that tag
      const tagName = term.replace('#', '');
      navigate({ to: '/search', search: { tab: 'vibes', tags: [tagName] } });
      handleSelect();
    } else {
      // Navigate to search page with the selected term
      navigate({ to: '/search', search: { q: term } });
      handleSelect();
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
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-hidden bg-transparent transition-all duration-300 ease-in-out',
        open ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
      )}
    >
      <div className="border-b shadow-md">
        <div className="container">
          <Command className="rounded-none border-0 bg-transparent">
            <CommandInput
              ref={inputRef}
              placeholder="search vibes, users, or tags..."
              value={query}
              onValueChange={setQuery}
              showBorder={false}
              className="placeholder:text-muted-foreground/70 h-12 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onOpenChange(false);
                  triggerRef?.current?.focus();
                }
              }}
            />
            <CommandList className="max-h-[calc(70vh-3rem)] overflow-y-auto border-t">
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
                    <CommandGroup heading="vibes">
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
                      {data.vibes && data.vibes.length > 0 && (
                        <CommandSeparator />
                      )}
                      <CommandGroup heading="users">
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
                      <CommandGroup heading="tags">
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
                      <CommandGroup heading="actions">
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

              {/* Always show Search for option at the bottom when there's query text */}
              {query && query.length > 0 && (
                <>
                  {(hasResults || !query) && <CommandSeparator />}
                  <CommandGroup heading="search for">
                    <CommandItem
                      value={`search-for-${query}`}
                      onSelect={() => {
                        navigate({ to: '/search', search: { q: query } });
                        handleSelect();
                      }}
                      className="data-[selected=true]:bg-muted/60"
                    >
                      <span className="flex-1">search for "{query}"</span>
                      <span className="text-muted-foreground ml-auto text-xs tracking-widest">
                        view all results
                      </span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      </div>
    </div>
  );
}
