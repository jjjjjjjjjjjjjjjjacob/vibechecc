import { CommandGroup, CommandItem } from '@/components/ui/command';
import { Clock, TrendingUp, Search, Hash } from 'lucide-react';
import type { SearchSuggestion } from '@viberater/types';
import { useSearchTracking } from '@/hooks/use-enhanced-analytics';

interface SearchSuggestionsProps {
  recentSearches?: SearchSuggestion[];
  trendingSearches?: SearchSuggestion[];
  popularTags?: SearchSuggestion[];
  onSelect: (
    term: string,
    type?: 'tag' | 'search' | 'recent' | 'trending' | 'recommended'
  ) => void;
}

export function SearchSuggestions({
  recentSearches = [],
  trendingSearches = [],
  popularTags = [],
  onSelect,
}: SearchSuggestionsProps) {
  const { trackSearchStart } = useSearchTracking();

  const handleSuggestionSelect = (
    term: string,
    type: 'tag' | 'search' | 'recent' | 'trending' | 'recommended' = 'search',
    position: number
  ) => {
    // Track the suggestion selection
    trackSearchStart(term, {
      suggestion_type: type,
      suggestion_position: position,
      suggestion_source: 'dropdown',
    });

    onSelect(term, type);
  };

  return (
    <>
      {recentSearches.length > 0 && (
        <CommandGroup heading="recent searches">
          {recentSearches.map((search, index) => (
            <CommandItem
              key={`suggestion-recent-${search.term}`}
              value={`recent-${search.term}`}
              onSelect={() =>
                handleSuggestionSelect(search.term, 'recent', index)
              }
              className="data-[selected=true]:bg-muted/80 flex items-center gap-2"
            >
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>{search.term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {trendingSearches.length > 0 && (
        <CommandGroup heading="trending">
          {trendingSearches.map((search, index) => (
            <CommandItem
              key={`suggestion-trending-${search.term}`}
              value={`trending-${search.term}`}
              onSelect={() =>
                handleSuggestionSelect(search.term, 'trending', index)
              }
              className="data-[selected=true]:bg-muted/80 flex items-center gap-2"
            >
              <TrendingUp className="text-muted-foreground h-4 w-4" />
              <span>{search.term}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {popularTags.length > 0 && (
        <CommandGroup heading="popular tags">
          {popularTags.map((tag, index) => (
            <CommandItem
              key={`suggestion-tags-${tag.term}`}
              value={`tag-${tag.term}`}
              onSelect={() => handleSuggestionSelect(tag.term, 'tag', index)}
              className="data-[selected=true]:bg-muted/80 flex items-center gap-2"
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
          onSelect={() => handleSuggestionSelect('/vibes', 'recommended', 0)}
          className="data-[selected=true]:bg-muted/80 flex items-center gap-2"
        >
          <Search className="text-muted-foreground h-4 w-4" />
          <span>browse all vibes</span>
        </CommandItem>
      </CommandGroup>
    </>
  );
}
