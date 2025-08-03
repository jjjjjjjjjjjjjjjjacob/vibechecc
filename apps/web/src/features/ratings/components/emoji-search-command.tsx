import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@viberatr/convex';
import { convexQuery } from '@convex-dev/react-query';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
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
  'data-testid'?: string;
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
  'data-testid': dataTestId,
}: EmojiSearchCommandProps) {
  const [loadedEmojis, setLoadedEmojis] = React.useState<
    { emoji: string; name: string; color?: string; category?: string }[]
  >([]);
  const [allCategoryEmojis, setAllCategoryEmojis] = React.useState<
    { emoji: string; name: string; color?: string; category?: string }[]
  >([]);
  const [page, setPage] = React.useState(0);
  const [categoryPage, setCategoryPage] = React.useState(0);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const loadingRef = React.useRef(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Get categories for navigation
  const _categoriesQuery = useQuery({
    ...convexQuery(api.emojis.getCategories, {}),
    enabled: showCategories && !searchValue,
  });

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

  // Load emojis for category view with pagination
  const allEmojisQuery = useQuery({
    ...convexQuery(api.emojis.search, {
      page: categoryPage,
      pageSize: 200, // Load more emojis initially for category view
    }),
    enabled: showCategories && !searchValue && pageSize > 50,
    staleTime: 0, // Always fetch fresh data
  });

  const allEmojisData = allEmojisQuery?.data || { emojis: [], hasMore: false };

  // Accumulate loaded emojis for infinite scroll
  React.useEffect(() => {
    if (searchData.emojis.length > 0) {
      if (page === 0) {
        setLoadedEmojis(searchData.emojis);
      } else {
        setLoadedEmojis((prev) => [...prev, ...searchData.emojis]);
      }
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [searchData.emojis, page]);

  // Accumulate category emojis for infinite scroll
  React.useEffect(() => {
    if (showCategories && !searchValue && pageSize > 50) {
      if (allEmojisData.emojis.length > 0) {
        if (categoryPage === 0) {
          setAllCategoryEmojis(allEmojisData.emojis);
        } else {
          // Only add new emojis if they're not already in the list
          setAllCategoryEmojis((prev) => {
            const existingIds = new Set(prev.map((e) => e.emoji));
            const newEmojis = allEmojisData.emojis.filter(
              (e) => !existingIds.has(e.emoji)
            );
            return [...prev, ...newEmojis];
          });
        }
      }
      // Always reset loading state after query completes
      if (!allEmojisQuery?.isLoading) {
        loadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [
    allEmojisData.emojis,
    categoryPage,
    showCategories,
    searchValue,
    pageSize,
    allEmojisQuery?.isLoading,
  ]);

  // Load more on scroll
  const handleScroll = React.useCallback(() => {
    if (!scrollAreaRef.current || loadingRef.current) return;

    const element = scrollAreaRef.current;
    const { scrollTop, scrollHeight, clientHeight } = element;

    // Check if we've scrolled near the bottom
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;

    if (isNearBottom) {
      if (searchValue && searchData.hasMore) {
        loadingRef.current = true;
        setIsLoading(true);
        setPage((prev) => prev + 1);
      } else if (
        !searchValue &&
        showCategories &&
        pageSize > 50 &&
        allEmojisData.hasMore
      ) {
        loadingRef.current = true;
        setIsLoading(true);
        setCategoryPage((prev) => prev + 1);
      }
    }
  }, [
    searchData.hasMore,
    allEmojisData.hasMore,
    searchValue,
    showCategories,
    pageSize,
  ]);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(0);
    setLoadedEmojis([]);
    setCategoryPage(0);
    setAllCategoryEmojis([]);
  }, [searchValue]);

  // Trigger initial load for category view
  React.useEffect(() => {
    if (
      showCategories &&
      !searchValue &&
      pageSize > 50 &&
      allCategoryEmojis.length === 0 &&
      allEmojisData.emojis.length === 0
    ) {
      // Force initial query if nothing loaded yet
      setCategoryPage(0);
    }
  }, [
    showCategories,
    searchValue,
    pageSize,
    allCategoryEmojis.length,
    allEmojisData.emojis.length,
  ]);

  // Group emojis by category if enabled
  const groupedEmojis = React.useMemo(() => {
    if (!showCategories) return null;

    // Use all emojis for category view, or search results
    let emojisForGrouping;
    if (searchValue) {
      emojisForGrouping = loadedEmojis;
    } else if (pageSize > 50) {
      // For full picker, use all category emojis or fallback to current data
      emojisForGrouping =
        allCategoryEmojis.length > 0
          ? allCategoryEmojis
          : allEmojisData.emojis.length > 0
            ? allEmojisData.emojis
            : popularData;
    } else {
      emojisForGrouping = searchData.emojis;
    }

    if (!emojisForGrouping || emojisForGrouping.length === 0) return null;

    const groups: Record<
      string,
      Array<{ emoji: string; name: string; color: string; category?: string }>
    > = {};
    emojisForGrouping.forEach((emoji) => {
      const category =
        'category' in emoji
          ? (emoji as { category: string }).category
          : 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      // Ensure emoji has required color field
      const normalizedEmoji = {
        ...emoji,
        color: emoji.color || '#6B7280', // Default gray color if none provided
      };
      groups[category].push(normalizedEmoji);
    });

    return groups;
  }, [
    searchValue,
    loadedEmojis,
    searchData.emojis,
    allCategoryEmojis,
    allEmojisData.emojis,
    showCategories,
    pageSize,
    popularData,
  ]);

  return (
    <Command
      className={cn('rounded-lg border', className)}
      shouldFilter={false}
      data-testid={dataTestId}
    >
      <CommandInput
        placeholder={placeholder}
        value={searchValue}
        onValueChange={onSearchChange}
      />
      <CommandList className={cn('relative', maxHeight)}>
        <div
          className="absolute inset-0 overflow-x-hidden overflow-y-auto"
          ref={scrollAreaRef}
          onScroll={(e) => {
            e.stopPropagation();
            handleScroll();
          }}
        >
          <CommandEmpty>no emojis found.</CommandEmpty>

          {!searchValue && popularData.length > 0 && (
            <CommandGroup heading="popular">
              <div className="grid grid-cols-8 gap-1 px-2 pt-2 pb-1">
                {popularData.map((emoji) => (
                  <CommandItem
                    key={emoji.emoji}
                    value={emoji.emoji}
                    onSelect={() => onSelect(emoji.emoji)}
                    className="hover:bg-accent flex h-9 w-9 cursor-pointer items-center justify-center rounded p-0 text-xl"
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

          {searchValue && loadedEmojis.length > 0 && !showCategories && (
            <CommandGroup>
              <div className="grid grid-cols-8 gap-1 px-2 pt-2 pb-1">
                {loadedEmojis.map((emoji) => (
                  <CommandItem
                    key={emoji.emoji}
                    value={emoji.emoji}
                    onSelect={() => onSelect(emoji.emoji)}
                    className="hover:bg-accent flex h-9 w-9 cursor-pointer items-center justify-center rounded p-0 text-xl"
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

          {showCategories &&
            groupedEmojis &&
            Object.entries(groupedEmojis)
              .sort(([a], [b]) => {
                // Sort categories to match typical emoji picker order
                const order = [
                  'smileys',
                  'people',
                  'animals',
                  'food',
                  'travel',
                  'activities',
                  'objects',
                  'symbols',
                  'flags',
                ];
                const aIndex = order.indexOf(a.toLowerCase());
                const bIndex = order.indexOf(b.toLowerCase());
                if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
              })
              .map(([category, emojis]) => (
                <CommandGroup key={category} heading={category}>
                  <div className="grid grid-cols-8 gap-1 px-2 pt-2 pb-1">
                    {emojis.map((emoji) => (
                      <CommandItem
                        key={emoji.emoji}
                        value={emoji.emoji}
                        onSelect={() => onSelect(emoji.emoji)}
                        className="hover:bg-accent flex h-9 w-9 cursor-pointer items-center justify-center rounded p-0 text-xl"
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
              ))}

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          )}
        </div>
      </CommandList>
    </Command>
  );
}
