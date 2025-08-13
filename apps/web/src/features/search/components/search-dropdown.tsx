import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VibeResult } from './result-items/vibe-result';
import { UserResult } from './result-items/user-result';
import { TagResult } from './result-items/tag-result';
import { ActionResult } from './result-items/action-result';
import { SearchSuggestions } from './search-suggestions';
import { useSearchSuggestions } from '../hooks/use-search';
import { useSearchTracking } from '../hooks/use-search-tracking';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface SearchDropdownProps {
  open: boolean; // whether the dropdown is visible
  onOpenChange: (open: boolean) => void; // callback to toggle visibility
  triggerRef?: React.RefObject<HTMLButtonElement>; // reference to the button opening the dropdown
}

/**
 * Floating search interface that displays results and suggestions.
 */
export function SearchDropdown({
  open,
  onOpenChange,
  triggerRef,
}: SearchDropdownProps) {
  const [query, setQuery] = useState(''); // raw input from user
  const debouncedQuery = useDebouncedValue(query, 300); // debounce typing
  const { data, isLoading } = useSearchSuggestions(debouncedQuery); // fetch suggestions
  const { trackSearch } = useSearchTracking(); // analytics hook
  const navigate = useNavigate(); // navigation helper
  const inputRef = useRef<HTMLInputElement>(null); // ref to input element
  const dropdownRef = useRef<HTMLDivElement>(null); // ref to container
  useEffect(() => {
    if (open && inputRef.current) {
      // focus the input shortly after opening for better UX
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);
  useEffect(() => {
    if (!open) return; // no listeners when closed

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false); // close when clicking outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange, triggerRef]);
  useEffect(() => {
    if (!open) return; // skip if hidden

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false); // close dropdown
        triggerRef?.current?.focus(); // return focus to trigger
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange, triggerRef]);

  const handleSelect = () => {
    onOpenChange(false); // hide dropdown
    setQuery(''); // reset input field
  };

  const handleResultSelect = (
    resultId: string,
    resultType: string,
    category?: string
  ) => {
    if (query.trim()) {
      // track the selected result for analytics
      trackSearch(query.trim(), undefined, [resultId], category || resultType);
    }
    handleSelect(); // close dropdown after selection
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      // navigate to the search page with the query
      navigate({ to: '/search', search: { q: finalQuery } });
      handleSelect();
    }
  };

  const handleSuggestionSelect = (term: string) => {
    if (term.startsWith('/')) {
      // Suggestion is a path; navigate directly
      navigate({ to: term as '/vibes' });
      handleSelect();
    } else {
      // Otherwise treat suggestion as search term
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
  const formattedTrendingSearches = trendingSearchTerms?.map(
    (term: string) => ({
      term,
      type: 'trending' as const,
    })
  );
  const formattedRecentSearches = recentSearches?.map((term: string) => ({
    term,
    type: 'recent' as const,
  }));
  const formattedPopularTags = popularTags?.map((tag: string) => ({
    term: tag,
    type: 'recommended' as const,
  }));
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (open && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const headerHeight = 64;
      setPosition({
        top: headerHeight,
        left: Math.max(0, rect.left - 200),
        width: Math.min(600, window.innerWidth - 32),
      });
    }
  }, [open, triggerRef]);

  if (!open) return null;

  return (
    <>
      <div
        className="animate-in fade-in-0 fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        className={cn(
          'bg-background fixed z-50 rounded-lg border shadow-2xl',
          'animate-in slide-in-from-top-2 fade-in-0 duration-200'
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="text-muted-foreground h-5 w-5" />
          {/* Text input uses lowercase placeholder per style guide */}
          <Input
            ref={inputRef}
            type="text"
            placeholder="search vibes, users, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="placeholder:text-muted-foreground flex-1 border-0 bg-transparent p-0 text-base focus-visible:ring-0"
          />
          {isLoading && (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {!query && (
              <SearchSuggestions
                recentSearches={formattedRecentSearches}
                trendingSearches={formattedTrendingSearches}
                popularTags={formattedPopularTags}
                onSelect={handleSuggestionSelect}
              />
            )}

            {query && !hasResults && !isLoading && (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  no results found for "{query}"
                </p>
              </div>
            )}

            {query && hasResults && data && 'vibes' in data && (
              <div className="space-y-4">
                {data.vibes && data.vibes.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wider">
                      vibes
                    </h3>
                    <div className="space-y-1">
                      {data.vibes.map((vibe) => (
                        <VibeResult
                          key={vibe.id}
                          result={vibe}
                          onSelect={() =>
                            handleResultSelect(vibe.id, 'vibe', 'vibes')
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
                {data.users && data.users.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wider">
                      users
                    </h3>
                    <div className="space-y-1">
                      {data.users.map((user) => (
                        <UserResult
                          key={user.id}
                          result={user}
                          onSelect={() =>
                            handleResultSelect(user.id, 'user', 'users')
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
                {data.tags && data.tags.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wider">
                      tags
                    </h3>
                    <div className="space-y-1">
                      {data.tags.map((tag) => (
                        <TagResult
                          key={tag.id}
                          result={tag}
                          onSelect={() =>
                            handleResultSelect(tag.id, 'tag', 'tags')
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
                {data.actions && data.actions.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wider">
                      actions
                    </h3>
                    <div className="space-y-1">
                      {data.actions.map((action) => (
                        <ActionResult
                          key={action.id}
                          result={action}
                          onSelect={() =>
                            handleResultSelect(action.id, 'action', 'actions')
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {query && query.length > 2 && (
              <div className="mt-4 border-t pt-2">
                <button
                  className="hover:bg-accent hover:text-accent-foreground w-full rounded-md px-3 py-2 text-left text-sm transition-colors"
                  onClick={() => handleSearch()}
                >
                  <span className="flex items-center justify-between">
                    <span>view all results for "{query}"</span>
                    <span className="text-muted-foreground text-xs">
                      press enter
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
