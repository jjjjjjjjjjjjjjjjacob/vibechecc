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

interface TagSearchCommandProps {
  selectedTags?: string[];
  onTagSelect: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  className?: string;
  placeholder?: string;
}

export function TagSearchCommand({
  selectedTags = [],
  onTagSelect,
  onTagRemove,
  className,
  placeholder = 'search tags...',
}: TagSearchCommandProps) {
  const [searchValue, setSearchValue] = useState('');
  const { data: allTags, isLoading } = useAllTags();

  // Filter tags based on search
  const filteredTags = allTags?.filter((tag) =>
    tag.tag.toLowerCase().includes(searchValue.toLowerCase()) &&
    !selectedTags.includes(tag.tag)
  );

  return (
    <div className={cn('space-y-3', className)}>
      <Command className="rounded-lg border">
        <CommandInput
          placeholder={placeholder}
          value={searchValue}
          onValueChange={setSearchValue}
          className="h-9"
        />
        <CommandList className="max-h-40 overflow-y-auto">
          {isLoading && (
            <CommandEmpty>Loading tags...</CommandEmpty>
          )}
          {!isLoading && filteredTags?.length === 0 && (
            <CommandEmpty>No tags found.</CommandEmpty>
          )}
          {filteredTags && filteredTags.length > 0 && (
            <CommandGroup>
              {filteredTags.map((tag) => (
                <CommandItem
                  key={tag.tag}
                  value={tag.tag}
                  onSelect={() => {
                    onTagSelect(tag.tag);
                    setSearchValue('');
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{tag.tag}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tag.count} {tag.count === 1 ? 'vibe' : 'vibes'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1"
            >
              <Hash className="h-3 w-3" />
              {tag}
              <button
                onClick={() => onTagRemove(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
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