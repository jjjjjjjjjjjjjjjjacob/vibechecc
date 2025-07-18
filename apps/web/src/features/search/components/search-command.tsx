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
  const { data, isLoading, isError } = useSearchSuggestions(query);
  const navigate = useNavigate();

  const handleSelect = () => {
    onOpenChange(false);
    setQuery('');
  };

  const handleSuggestionSelect = (term: string) => {
    if (term.startsWith('/')) {
      navigate({ to: term as any });
      handleSelect();
    } else {
      setQuery(term);
    }
  };

  const hasResults = data && (
    (data.vibes && data.vibes.length > 0) ||
    (data.users && data.users.length > 0) ||
    (data.tags && data.tags.length > 0) ||
    (data.actions && data.actions.length > 0)
  );

  // Extract recent searches from the suggestions data when query is empty
  const recentSearches = (!query && data && 'recentSearches' in data) ? data.recentSearches : [];
  const trendingSearchTerms = (!query && data && 'trendingSearches' in data) ? data.trendingSearches : [];
  const popularTags = (!query && data && 'popularTags' in data) ? data.popularTags : [];
  
  // Convert trending searches to SearchSuggestion format (use from data instead of separate query)
  const formattedTrendingSearches = trendingSearchTerms?.map(term => ({
    term,
    type: 'trending' as const,
  })) || [];
  
  // Convert recent searches to SearchSuggestion format
  const formattedRecentSearches = recentSearches.map(term => ({
    term,
    type: 'recent' as const,
  }));
  
  // Convert popular tags to SearchSuggestion format
  const formattedPopularTags = popularTags.map(tag => ({
    term: tag,
    type: 'tag' as const,
  }));

  // Check if there are any suggestions or results to show
  const hasContent = !query || hasResults || formattedRecentSearches.length > 0 || formattedTrendingSearches.length > 0 || formattedPopularTags.length > 0;

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
          
          {query && hasResults && (
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
                  {(data.vibes && data.vibes.length > 0) || 
                   (data.users && data.users.length > 0) && <CommandSeparator />}
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
                  <CommandSeparator />
                  <CommandGroup heading="Actions">
                    {data.actions.map((action) => (
                      <ActionResult 
                        key={action.id} 
                        result={action} 
                        query={query}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}
              
              {query.length > 2 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Search for">
                    <ActionResult
                      result={{
                        id: 'search-all',
                        type: 'action',
                        title: `Search for "${query}"`,
                        subtitle: 'View all results',
                        action: 'search',
                        icon: 'search',
                      }}
                      query={query}
                      onSelect={() => {
                        navigate({ to: '/search', search: { q: query } });
                        handleSelect();
                      }}
                    />
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}