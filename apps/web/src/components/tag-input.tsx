import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Hash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

/**
 * Props accepted by {@link TagInput}. The component keeps track of a list of
 * tag strings and surfaces completions from Convex as the user types.
 */
interface TagInputProps {
  /** Current list of tag strings displayed as badges */
  tags: string[];
  /** Callback fired whenever the tag array changes */
  onTagsChange: (tags: string[]) => void;
  /** Optional placeholder for the input field */
  placeholder?: string;
}

/**
 * Autocomplete-enabled input that lets users search for existing tags or create
 * new ones. Suggestions are fetched from Convex and displayed in a command
 * menu. Selected tags appear as removable badges above the input.
 */
export function TagInput({ tags, onTagsChange, placeholder }: TagInputProps) {
  // Track the raw input value the user is typing
  const [inputValue, setInputValue] = React.useState('');
  // Control whether the suggestion dropdown is visible
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Query Convex for tags matching the current input. We disable the query when
  // the input is empty to avoid unnecessary network calls.
  const { data: searchResults } = useQuery({
    ...convexQuery(api.tags.searchTags, {
      query: inputValue,
      limit: 8,
    }),
    enabled: inputValue.length > 0,
  });

  // When there's no search term, fall back to a list of popular tags so users
  // can discover common topics.
  const { data: popularTags } = useQuery({
    ...convexQuery(api.tags.getPopularTags, { limit: 8 }),
    enabled: inputValue.length === 0 && showSuggestions,
  });

  // Decide which list of suggestions to show based on whether the user typed a
  // query.
  const suggestions = inputValue ? searchResults : popularTags;

  // Normalize and add a tag to the list, preventing duplicates.
  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onTagsChange([...tags, normalizedTag]);
      setInputValue('');
    }
  };

  // Remove a tag by name from the current array.
  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  // Keyboard shortcuts: pressing Enter adds the typed tag, Backspace removes
  // the last tag when the input is empty.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed with empty input
      e.preventDefault();
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1"
          >
            <Hash className="h-3 w-3" />
            {tag}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveTag(tag)}
              className="h-3 w-3 p-0 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <Command className="rounded-md border">
        <CommandInput
          placeholder={placeholder || 'search or create tags...'}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          showBorder={showSuggestions}
        />
        {showSuggestions && (
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <div
                  className="cursor-pointer px-2 py-1.5 text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddTag(inputValue);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAddTag(inputValue);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <div className="flex items-center">
                    <Hash className="mr-2 h-4 w-4" />
                    create "{inputValue.toLowerCase()}"
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                  no tags found
                </div>
              )}
            </CommandEmpty>
            {suggestions && suggestions.length > 0 && (
              <CommandGroup
                heading={inputValue ? 'matching tags' : 'popular tags'}
              >
                {suggestions.map((tag: { name: string; count?: number }) => (
                  <CommandItem
                    key={tag.name}
                    value={tag.name}
                    onSelect={() => handleAddTag(tag.name)}
                    className="cursor-pointer"
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    <span className="flex-1">{tag.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {tag.count} vibe{tag.count !== 1 ? 's' : ''}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
      <p className="text-muted-foreground text-xs">
        start typing to search existing tags or create new ones
      </p>
    </div>
  );
}
