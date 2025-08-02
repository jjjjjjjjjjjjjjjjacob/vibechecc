import { useState, useEffect, useRef } from 'react';
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
import { useSearchTracking } from '../hooks/use-search-tracking';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/utils/tailwind-utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchAccordionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

function VibeResultSkeleton() {
  return (
    <div className="flex items-start gap-3 px-2 py-3">
      <Skeleton className="h-12 w-12 rounded-md" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-3 w-48" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function UserResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

function TagResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SearchAccordion({
  open,
  onOpenChange,
  triggerRef,
}: SearchAccordionProps) {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchSuggestions(query);
  const { trackSearch } = useSearchTracking();
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

  const handleResultClick = (
    resultId: string,
    resultType: string,
    category?: string
  ) => {
    // Track the result click if there was a query
    if (query.trim()) {
      trackSearch(query.trim(), undefined, [resultId], category || resultType);
    }
    handleSelect();
  };

  const handleSuggestionSelect = (
    term: string,
    type?: 'tag' | 'search' | 'recent' | 'trending' | 'recommended'
  ) => {
    // Track the selection with category information
    if (term.trim() && type) {
      trackSearch(term.trim(), undefined, undefined, type);
    }

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

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-hidden bg-transparent transition-all duration-300 ease-in-out',
        open ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
      )}
    >
      <div className="border-b shadow-md">
        <div className="container pt-2">
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
                } else if (e.key === 'Enter' && query.trim()) {
                  // If Enter is pressed and no item is selected, automatically search
                  e.preventDefault();
                  // Track the enter key search
                  trackSearch(query.trim(), undefined, undefined, 'enter-key');
                  navigate({ to: '/search', search: { q: query.trim() } });
                  handleSelect();
                }
              }}
            />
            <CommandList className="max-h-[calc(70vh-3rem)] overflow-y-auto border-t">
              {!query && !isLoading && (
                <SearchSuggestions
                  recentSearches={formattedRecentSearches}
                  trendingSearches={formattedTrendingSearches}
                  popularTags={formattedPopularTags}
                  onSelect={handleSuggestionSelect}
                />
              )}

              {!query && isLoading && (
                <div className="space-y-2 p-2">
                  <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                    recent searches
                  </div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1">
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                  <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                    trending searches
                  </div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1">
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              )}

              {query && isLoading && (
                <div className="space-y-4">
                  <CommandGroup heading="vibes">
                    {[...Array(3)].map((_, i) => (
                      <VibeResultSkeleton key={i} />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="users">
                    {[...Array(2)].map((_, i) => (
                      <UserResultSkeleton key={i} />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="tags">
                    {[...Array(2)].map((_, i) => (
                      <TagResultSkeleton key={i} />
                    ))}
                  </CommandGroup>
                </div>
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
                          onSelect={() =>
                            handleResultClick(vibe.id, 'vibe', 'vibes')
                          }
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
                            onSelect={() =>
                              handleResultClick(user.id, 'user', 'users')
                            }
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
                            onSelect={() =>
                              handleResultClick(tag.id, 'tag', 'tags')
                            }
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
                            onSelect={() =>
                              handleResultClick(action.id, 'action', 'actions')
                            }
                          />
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </>
              )}

              {/* Always show Search for option at the bottom when there's query text */}
              {query && query.length > 0 && !isLoading && (
                <>
                  {(hasResults || !query) && <CommandSeparator />}
                  <CommandGroup heading="search for">
                    <CommandItem
                      value={`search-for-${query}`}
                      onSelect={() => {
                        // Track the search for action
                        trackSearch(
                          query.trim(),
                          undefined,
                          undefined,
                          'search-for'
                        );
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
