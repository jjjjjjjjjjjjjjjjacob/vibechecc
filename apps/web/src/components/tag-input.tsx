import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Hash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onTagsChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search for tags
  const { data: searchResults } = useQuery({
    ...convexQuery(api.tags.search, {
      searchTerm: inputValue,
      limit: 8,
    }),
    enabled: inputValue.length > 0,
  });

  // Get popular tags when no search term
  const { data: popularTags } = useQuery({
    ...convexQuery(api.tags.getPopular, { limit: 8 }),
    enabled: inputValue.length === 0 && showSuggestions,
  });

  const suggestions = inputValue ? searchResults : popularTags;

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onTagsChange([...tags, normalizedTag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

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
                {suggestions.map((tag) => (
                  <CommandItem
                    key={tag._id}
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
