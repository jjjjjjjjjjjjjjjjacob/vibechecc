import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Hash } from '@/components/ui/icons';
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
    ...convexQuery(api.tags.searchTags, {
      query: inputValue,
      limit: 8,
    }),
    enabled: inputValue.length > 0,
  });

  // Get popular tags when no search term
  const { data: popularTags } = useQuery({
    ...convexQuery(api.tags.getPopularTags, { limit: 8 }),
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

  const handleRemoveTag = (
    tagToRemove: string,
    e?: React.MouseEvent | React.TouchEvent
  ) => {
    e?.preventDefault();
    e?.stopPropagation();
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
            className="group flex items-center gap-1 pr-1"
          >
            <Hash className="h-3 w-3" />
            {tag}
            <button
              type="button"
              onClick={(e) => handleRemoveTag(tag, e)}
              onTouchEnd={(e) => handleRemoveTag(tag, e)}
              className="hover:bg-destructive/20 -mr-0.5 ml-1 inline-flex h-5 w-5 touch-manipulation items-center justify-center rounded-sm transition-colors"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
          onBlur={() => {
            // Delay hiding to allow touch/click events to fire
            setTimeout(() => setShowSuggestions(false), 300);
          }}
          showBorder={showSuggestions}
        />
        {showSuggestions && (
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <div
                  className="cursor-pointer touch-manipulation px-2 py-1.5 text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddTag(inputValue);
                  }}
                  onTouchEnd={(e) => {
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
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddTag(tag.name);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleAddTag(tag.name);
                    }}
                    className="cursor-pointer touch-manipulation"
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
