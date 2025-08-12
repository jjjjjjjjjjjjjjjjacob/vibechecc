import { useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Hash, X } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { useAllTags } from '@/queries';

/**
 * Props for {@link TagSearchCommand}. The component presents a search box with
 * autocomplete suggestions for existing tags and allows selecting/removing
 * multiple tags.
 */
interface TagSearchCommandProps {
  /** tags that are already selected */
  selectedTags?: string[];
  /** callback fired when a tag is chosen from the list */
  onTagSelect: (tag: string) => void;
  /** callback fired when a selected tag is removed */
  onTagRemove: (tag: string) => void;
  /** additional classes applied to the wrapper */
  className?: string;
  /** placeholder text displayed in the input */
  placeholder?: string;
}

/**
 * Search component for selecting and removing tags. Uses a command palette
 * style UI for quick keyboard-driven navigation.
 */
export function TagSearchCommand({
  selectedTags = [],
  onTagSelect,
  onTagRemove,
  className,
  placeholder = 'search tags...',
}: TagSearchCommandProps) {
  // local search query state for filtering tags as user types
  const [searchValue, setSearchValue] = useState('');
  // fetch all available tags from the backend
  const { data: allTags, isLoading } = useAllTags();

  // compute list of tags that match the query and aren't selected yet
  const filteredTags = allTags?.filter(
    (tag) =>
      tag.tag.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedTags.includes(tag.tag)
  );

  return (
    <div className={cn('space-y-3', className)}>
      <Command className="ring-border rounded-lg border-0 ring-1">
      {/* search input driving the command palette */}
        <CommandInput
          placeholder={placeholder}
          value={searchValue}
          onValueChange={setSearchValue}
          className="h-9"
        />
        {/* scrollable suggestion list */}
        <CommandList className="max-h-40 overflow-y-auto">
          {isLoading && <CommandEmpty>loading tags...</CommandEmpty>}
          {!isLoading && filteredTags?.length === 0 && (
            <CommandEmpty>no tags found.</CommandEmpty>
          )}
          {filteredTags && filteredTags.length > 0 && (
            <CommandGroup>
              {filteredTags.map((tag) => (
                <CommandItem
                  key={tag.tag}
                  value={tag.tag}
                  onSelect={() => {
                    // emit the selected tag and clear the search box
                    onTagSelect(tag.tag);
                    setSearchValue('');
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="text-muted-foreground h-3 w-3" />
                    <span className="text-sm">{tag.tag}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {tag.count} {tag.count === 1 ? 'vibe' : 'vibes'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>

      {/* render currently selected tags as removable badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pr-1 pl-2"
            >
              <Hash className="h-3 w-3" />
              {tag}
              <button
                onClick={() => onTagRemove(tag)}
                className="hover:bg-muted ml-1 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
