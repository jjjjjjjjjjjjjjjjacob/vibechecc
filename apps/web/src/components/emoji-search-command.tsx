import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@vibechecc/convex';
import { convexQuery } from '@convex-dev/react-query';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './ui/command';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/utils/tailwind-utils';
import { BASIC_EMOJIS } from '@/lib/basic-emojis';

interface EmojiSearchCommandProps {
  onSelect: (emoji: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showCategories?: boolean;
  maxHeight?: string;
  pageSize?: number;
}

export function EmojiSearchCommand({
  onSelect,
  searchValue,
  onSearchChange,
  placeholder = 'search emojis...',
  className,
  showCategories = true,
  maxHeight = 'h-48',
  pageSize = 50,
}: EmojiSearchCommandProps) {
  const [page, setPage] = React.useState(0);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Search emojis from database
  const searchResults = useQuery({
    ...convexQuery(api.emojis.search, {
      searchTerm: searchValue || undefined,
      page,
      pageSize,
    }),
  });

  // Get popular emojis when no search
  const popularEmojis = useQuery({
    ...convexQuery(api.emojis.getPopular, { limit: 12 }),
    enabled: !searchValue,
  });

  // Provide fallback to prevent destructuring errors
  const searchData = searchResults?.data || { emojis: [], hasMore: false };
  const popularData = popularEmojis?.data || BASIC_EMOJIS;

  // Load more on scroll
  const handleScroll = React.useCallback(() => {
    if (!scrollAreaRef.current || !searchData.hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setPage((prev) => prev + 1);
    }
  }, [searchData.hasMore]);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(0);
  }, [searchValue]);

  const emojisToShow = searchValue ? searchData.emojis : popularData;

  // Group emojis by category if enabled
  const groupedEmojis = React.useMemo(() => {
    if (!showCategories || !emojisToShow) return null;

    const groups: Record<string, typeof emojisToShow> = {};
    emojisToShow.forEach((emoji) => {
      if (!groups[emoji.category]) {
        groups[emoji.category] = [];
      }
      groups[emoji.category].push(emoji);
    });

    return groups;
  }, [emojisToShow, showCategories]);

  return (
    <Command className={cn('rounded-lg border', className)}>
      <CommandInput
        placeholder={placeholder}
        value={searchValue}
        onValueChange={onSearchChange}
      />
      <CommandList className={maxHeight}>
        <ScrollArea ref={scrollAreaRef} onScroll={handleScroll}>
          <CommandEmpty>no emojis found.</CommandEmpty>
          
          {!searchValue && popularData.length > 0 && (
            <CommandGroup heading="popular">
              <div className="grid grid-cols-6 gap-2 p-2">
                {popularData.map((emoji) => (
                  <CommandItem
                    key={emoji.emoji}
                    value={emoji.emoji}
                    onSelect={() => onSelect(emoji.emoji)}
                    className="hover:bg-accent flex h-10 w-10 cursor-pointer items-center justify-center rounded p-0 text-2xl"
                    title={emoji.name}
                    style={{
                      color: emoji.color,
                    }}
                  >
                    <span className="font-noto-color">{emoji.emoji}</span>
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          )}

          {searchValue && emojisToShow && !showCategories && (
            <CommandGroup>
              <div className="grid grid-cols-6 gap-2 p-2">
                {emojisToShow.map((emoji) => (
                  <CommandItem
                    key={emoji.emoji}
                    value={emoji.emoji}
                    onSelect={() => onSelect(emoji.emoji)}
                    className="hover:bg-accent flex h-10 w-10 cursor-pointer items-center justify-center rounded p-0 text-2xl"
                    title={emoji.name}
                    style={{
                      color: emoji.color,
                    }}
                  >
                    <span className="font-noto-color">{emoji.emoji}</span>
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          )}

          {showCategories && groupedEmojis && 
            Object.entries(groupedEmojis).map(([category, emojis]) => (
              <CommandGroup key={category} heading={category}>
                <div className="grid grid-cols-6 gap-2 p-2">
                  {emojis.map((emoji) => (
                    <CommandItem
                      key={emoji.emoji}
                      value={emoji.emoji}
                      onSelect={() => onSelect(emoji.emoji)}
                      className="hover:bg-accent flex h-10 w-10 cursor-pointer items-center justify-center rounded p-0 text-2xl"
                      title={emoji.name}
                      style={{
                        color: emoji.color,
                      }}
                    >
                      <span className="font-noto-color">{emoji.emoji}</span>
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            ))
          }
        </ScrollArea>
      </CommandList>
    </Command>
  );
}