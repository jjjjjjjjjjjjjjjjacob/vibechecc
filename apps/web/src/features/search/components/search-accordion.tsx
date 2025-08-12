import { useState, useEffect, useRef } from 'react';
// Import the shadcn command palette primitives used to build the accordion
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
  CommandItem,
} from '@/components/ui/command';
// Result renderers for each supported entity type
import { VibeResult } from './result-items/vibe-result';
import { UserResult } from './result-items/user-result';
import { TagResult } from './result-items/tag-result';
import { ActionResult } from './result-items/action-result';
// Wrapper for suggestion lists when no query is present
import { SearchSuggestions } from './search-suggestions';
// Hooks that fetch suggestions and report analytics
import { useSearchSuggestions } from '../hooks/use-search';
import { useSearchTracking } from '../hooks/use-search-tracking';
// Router helper for navigation
import { useNavigate } from '@tanstack/react-router';
// Utility for joining Tailwind classes
import { cn } from '@/utils/tailwind-utils';
// Skeleton placeholder used during loading states
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Props accepted by {@link SearchAccordion}.
 */
interface SearchAccordionProps {
  /** Whether the accordion should be visible */
  open: boolean;
  /** Callback to toggle the open state */
  onOpenChange: (open: boolean) => void;
  /** Optional reference to the button that toggles the accordion */
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Placeholder row while vibe results load.
 */
function VibeResultSkeleton() {
  // The structure mirrors a full result but swaps elements for skeletons
  return (
    <div className="flex items-start gap-3 px-2 py-3">
      {/* Thumbnail placeholder */}
      <Skeleton className="h-12 w-12 rounded-md" />
      {/* Textual content column */}
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
          {/* Tag and action placeholders */}
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder row for pending user results.
 */
function UserResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      {/* Circular avatar placeholder */}
      <Skeleton className="h-10 w-10 rounded-full" />
      {/* Name and username columns */}
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      {/* Follow and stats placeholders */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

/**
 * Placeholder row representing a tag while suggestions load.
 */
function TagResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      {/* Circle where tag avatar would render */}
      <Skeleton className="h-8 w-8 rounded-full" />
      {/* Tag name */}
      <div className="flex-1">
        <Skeleton className="h-4 w-20" />
      </div>
      {/* Usage count */}
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/**
 * Search-as-you-type accordion used in the global header.
 *
 * The component displays an input with live suggestions and result previews.
 * Selecting a result or suggestion navigates to the appropriate route while
 * recording analytics.
 */
export function SearchAccordion({
  open,
  onOpenChange,
  triggerRef,
}: SearchAccordionProps) {
  // Text entered by the user
  const [query, setQuery] = useState('');
  // Suggestions and result previews driven by the current query
  const { data, isLoading } = useSearchSuggestions(query);
  // Analytics helper for tracking searches
  const { trackSearch } = useSearchTracking();
  // Router navigation helper
  const navigate = useNavigate();
  // References to the input and outer container for focus management
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
    // Close the accordion when clicking outside of both the container
    // and the trigger element that opened it
    const handleClickOutside = (event: MouseEvent) => {
      if (!open) return;

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

  // Reset state and close the dropdown after a selection is made
  const handleSelect = () => {
    onOpenChange(false);
    setQuery('');
  };

  // When a result row is chosen, report the event and close the accordion
  const handleResultClick = (
    resultId: string,
    resultType: string,
    category?: string
  ) => {
    if (query.trim()) {
      trackSearch(query.trim(), undefined, [resultId], category || resultType);
    }
    handleSelect();
  };

  // Handle clicks on a suggestion chip such as recent or trending terms
  const handleSuggestionSelect = (
    term: string,
    type?: 'tag' | 'search' | 'recent' | 'trending' | 'recommended'
  ) => {
    if (term.trim() && type) {
      trackSearch(term.trim(), undefined, undefined, type);
    }

    if (term.startsWith('/')) {
      // Leading slash indicates direct route navigation (e.g. "/vibes")
      navigate({ to: term as '/vibes' });
      handleSelect();
    } else if (type === 'tag' || term.startsWith('#')) {
      // Tags are passed as filters on the search page
      const tagName = term.replace('#', '');
      navigate({ to: '/search', search: { tab: 'vibes', tags: [tagName] } });
      handleSelect();
    } else {
      // Default behavior performs a search for the term
      navigate({ to: '/search', search: { q: term } });
      handleSelect();
    }
  };

  // Determine if any result sections contain data
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

  // Convert trending searches to SearchSuggestion format
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
          {/* Outer command palette wrapper */}
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
                  // When enter is pressed with no item selected, perform a search
                  e.preventDefault();
                  // Report the search triggered by hitting enter
                  trackSearch(query.trim(), undefined, undefined, 'enter-key');
                  navigate({ to: '/search', search: { q: query.trim() } });
                  handleSelect();
                }
              }}
            />
            {/* Scrollable results and suggestions */}
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
                <CommandEmpty>no results found for "{query}"</CommandEmpty>
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
