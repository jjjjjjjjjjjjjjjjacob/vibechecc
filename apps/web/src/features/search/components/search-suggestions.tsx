import { CommandGroup, CommandItem } from '@/components/ui/command';
import { Clock, TrendingUp, Search, Hash } from 'lucide-react';
import type { SearchSuggestion } from '@viberater/types';

interface SearchSuggestionsProps {
  recentSearches?: SearchSuggestion[];
  trendingSearches?: SearchSuggestion[];
  popularTags?: SearchSuggestion[];
  onSelect: (term: string, type?: 'tag' | 'search' | 'recent' | 'trending' | 'recommended') => void;
}

export function SearchSuggestions({
  recentSearches = [],
  trendingSearches = [],
  popularTags = [],
  onSelect,
}: SearchSuggestionsProps) {
  return (
    <>
      {recentSearches.length > 0 && (
        <CommandGroup heading="recent searches">
          {recentSearches.map((search) => (
            <CommandItem
              key={search.term}
              value={search.term}
              onSelect={() => onSelect(search.term, 'recent')}
              className="data-[selected=true]:bg-muted/60 flex items-center gap-2"
            >
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>{search.term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {trendingSearches.length > 0 && (
        <CommandGroup heading="trending">
          {trendingSearches.map((search) => (
            <CommandItem
              key={search.term}
              value={search.term}
              onSelect={() => onSelect(search.term, 'trending')}
              className="data-[selected=true]:bg-muted/60 flex items-center gap-2"
            >
              <TrendingUp className="text-muted-foreground h-4 w-4" />
              <span>{search.term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {popularTags.length > 0 && (
        <CommandGroup heading="popular tags">
          {popularTags.map((tag) => (
            <CommandItem
              key={tag.term}
              value={tag.term}
              onSelect={() => onSelect(tag.term, 'tag')}
              className="data-[selected=true]:bg-muted/60 flex items-center gap-2"
            >
              <Hash className="text-muted-foreground h-4 w-4" />
              <span>{tag.term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      <CommandGroup heading="quick actions">
        <CommandItem
          value="browse all vibes"
          onSelect={() => onSelect('/vibes')}
          className="data-[selected=true]:bg-muted/60 flex items-center gap-2"
        >
          <Search className="text-muted-foreground h-4 w-4" />
          <span>browse all vibes</span>
        </CommandItem>
      </CommandGroup>
    </>
  );
}
