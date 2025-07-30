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
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface SearchDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export function SearchDropdown({ open, onOpenChange, triggerRef }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isLoading } = useSearchSuggestions(debouncedQuery);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Handle click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange, triggerRef]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        triggerRef?.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange, triggerRef]);

  const handleSelect = () => {
    onOpenChange(false);
    setQuery('');
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      navigate({ to: '/search', search: { q: finalQuery } });
      handleSelect();
    }
  };

  const handleSuggestionSelect = (term: string) => {
    if (term.startsWith('/')) {
      navigate({ to: term as '/vibes' });
      handleSelect();
    } else {
      handleSearch(term);
    }
  };

  const hasResults =
    data &&
    'vibes' in data &&
    ((data.vibes && data.vibes.length > 0) ||
      (data.users && data.users.length > 0) ||
      (data.tags && data.tags.length > 0) ||
      (data.actions && data.actions.length > 0));

  // Extract suggestions data
  const recentSearches =
    !query && data && 'recentSearches' in data ? data.recentSearches : undefined;
  const trendingSearchTerms =
    !query && data && 'trendingSearches' in data ? data.trendingSearches : undefined;
  const popularTags =
    !query && data && 'popularTags' in data ? data.popularTags : undefined;

  // Format suggestions
  const formattedTrendingSearches = trendingSearchTerms?.map((term: string) => ({
    term,
    type: 'trending' as const,
  }));
  const formattedRecentSearches = recentSearches?.map((term: string) => ({
    term,
    type: 'recent' as const,
  }));
  const formattedPopularTags = popularTags?.map((tag: string) => ({
    term: tag,
    type: 'recommended' as const,
  }));

  // Calculate position based on trigger button
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  useEffect(() => {
    if (open && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const headerHeight = 64; // Height of the header
      setPosition({
        top: headerHeight,
        left: Math.max(0, rect.left - 200), // Offset to make it wider than button
        width: Math.min(600, window.innerWidth - 32), // Max width 600px with padding
      });
    }
  }, [open, triggerRef]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in-0"
        aria-hidden="true"
      />
      
      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={cn(
          "fixed z-50 bg-background border rounded-lg shadow-2xl",
          "animate-in slide-in-from-top-2 fade-in-0 duration-200"
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search vibes, users, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="flex-1 border-0 bg-transparent p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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

        {/* Results */}
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
                <p className="text-muted-foreground">No results found for "{query}"</p>
              </div>
            )}

            {query && hasResults && data && 'vibes' in data && (
              <div className="space-y-4">
                {/* Vibes */}
                {data.vibes && data.vibes.length > 0 && (
                  <div>
                    <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Vibes
                    </h3>
                    <div className="space-y-1">
                      {data.vibes.map((vibe) => (
                        <VibeResult
                          key={vibe.id}
                          result={vibe}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {data.users && data.users.length > 0 && (
                  <div>
                    <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Users
                    </h3>
                    <div className="space-y-1">
                      {data.users.map((user) => (
                        <UserResult
                          key={user.id}
                          result={user}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {data.tags && data.tags.length > 0 && (
                  <div>
                    <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tags
                    </h3>
                    <div className="space-y-1">
                      {data.tags.map((tag) => (
                        <TagResult
                          key={tag.id}
                          result={tag}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {data.actions && data.actions.length > 0 && (
                  <div>
                    <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </h3>
                    <div className="space-y-1">
                      {data.actions.map((action) => (
                        <ActionResult
                          key={action.id}
                          result={action}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View all results */}
            {query && query.length > 2 && (
              <div className="mt-4 border-t pt-2">
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => handleSearch()}
                >
                  <span className="flex items-center justify-between">
                    <span>View all results for "{query}"</span>
                    <span className="text-xs text-muted-foreground">
                      Press Enter
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