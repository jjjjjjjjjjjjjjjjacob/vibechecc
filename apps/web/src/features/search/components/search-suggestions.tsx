import { CommandGroup, CommandItem } from '@/components/ui/command';
import { Clock, TrendingUp, Search } from 'lucide-react';
import type { SearchSuggestion } from '@vibechecc/types';

interface SearchSuggestionsProps {
  recentSearches?: SearchSuggestion[];
  trendingSearches?: SearchSuggestion[];
  onSelect: (term: string) => void;
}

export function SearchSuggestions({
  recentSearches = [],
  trendingSearches = [],
  onSelect,
}: SearchSuggestionsProps) {
  if (recentSearches.length === 0 && trendingSearches.length === 0) {
    return null;
  }

  return (
    <>
      {recentSearches.length > 0 && (
        <CommandGroup heading="Recent searches">
          {recentSearches.map((search) => (
            <CommandItem
              key={search.term}
              value={search.term}
              onSelect={() => onSelect(search.term)}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{search.term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {trendingSearches.length > 0 && (
        <CommandGroup heading="Trending">
          {trendingSearches.map((search) => (
            <CommandItem
              key={search.term}
              value={search.term}
              onSelect={() => onSelect(search.term)}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>{search.term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      <CommandGroup heading="Quick actions">
        <CommandItem
          value="Browse all vibes"
          onSelect={() => onSelect('/vibes')}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span>Browse all vibes</span>
        </CommandItem>
      </CommandGroup>
    </>
  );
}