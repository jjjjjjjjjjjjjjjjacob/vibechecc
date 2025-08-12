import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface StickySearchBarProps {
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onFiltersClick?: () => void;
  activeFiltersCount?: number;
  className?: string;
}

/**
 * Sticky top search bar that persists on scroll and surfaces filters.
 */
export function StickySearchBar({
  defaultQuery = '',
  onQueryChange,
  onFiltersClick,
  activeFiltersCount = 0,
  className,
}: StickySearchBarProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [isSticky, setIsSticky] = useState(false);
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/search' });
  const debouncedQuery = useDebouncedValue(query, 300);

  // Update query when search params change
  useEffect(() => {
    if (searchParams.q !== query) {
      setQuery(searchParams.q || '');
    }
  }, [searchParams.q, query]);

  // Handle query changes
  useEffect(() => {
    if (debouncedQuery !== searchParams.q) {
      onQueryChange?.(debouncedQuery);
    }
  }, [debouncedQuery, searchParams.q, onQueryChange]);

  // Handle sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() !== searchParams.q) {
      navigate({
        to: '/search',
        search: { ...searchParams, q: query.trim() },
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    navigate({
      to: '/search',
      search: { ...searchParams, q: undefined },
    });
  };

  return (
    <div
      className={cn(
        'sticky top-16 z-40 -mx-4 px-4 transition-all duration-300',
        isSticky &&
          'bg-background/95 supports-[backdrop-filter]:bg-background/60 shadow-md backdrop-blur',
        className
      )}
    >
      <div className="container mx-auto py-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
            {/* Search input with lowercase placeholder for consistency */}
            <Input
              type="text"
              placeholder="search vibes, users, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                'h-12 pr-10 pl-10 text-base',
                isSticky && 'bg-background'
              )}
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={onFiltersClick}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </form>

        {/* Quick filters (visible when sticky) */}
        {isSticky && activeFiltersCount > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}{' '}
              {activeFiltersCount === 1 ? 'filter' : 'filters'} active
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Integrated search header for search results page
export function SearchPageHeader({
  onFiltersClick,
  activeFiltersCount,
}: {
  onFiltersClick?: () => void;
  activeFiltersCount?: number;
}) {
  const searchParams = useSearch({ from: '/search' });
  const navigate = useNavigate();

  const handleQueryChange = (newQuery: string) => {
    navigate({
      to: '/search',
      search: { ...searchParams, q: newQuery || undefined },
      replace: true,
    });
  };

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold lowercase">search results</h1>
        <StickySearchBar
          defaultQuery={searchParams.q}
          onQueryChange={handleQueryChange}
          onFiltersClick={onFiltersClick}
          activeFiltersCount={activeFiltersCount}
        />
      </div>
    </div>
  );
}
