import * as React from 'react';
import { cn } from '../utils/tailwind-utils';
import { PlusCircle, Search, ChevronDown, X } from 'lucide-react';
import { useUser } from '@clerk/tanstack-react-start';
import type { EmojiReaction as EmojiReactionType } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './ui/command';
import { ScrollArea } from './ui/scroll-area';
import { EMOJI_DATABASE, type EmojiData } from '../lib/emoji-database';

interface EmojiReactionProps {
  reaction: EmojiReactionType;
  onReact?: (emoji: string) => void;
  className?: string;
  showAddButton?: boolean;
  ratingMode?: boolean; // When true, clicking opens emoji rating popover
  onRatingOpen?: (emoji: string) => void; // Callback to open rating popover with emoji
}

export function EmojiReaction({
  reaction,
  onReact,
  className,
  showAddButton: _showAddButton = false,
  ratingMode = false,
  onRatingOpen,
}: EmojiReactionProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const { user } = useUser();

  const hasReacted = user?.id ? reaction.users.includes(user.id) : false;

  const handleReact = () => {
    // In rating mode, open the rating popover with this emoji
    if (ratingMode && onRatingOpen) {
      onRatingOpen(reaction.emoji);
      return;
    }

    // Normal reaction mode
    if (onReact) {
      onReact(reaction.emoji);
    }
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center rounded-full px-2 py-1 text-sm transition-all hover:scale-105 active:scale-95',
        hasReacted ? 'bg-primary/10' : 'bg-muted hover:bg-muted/80',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleReact}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleReact();
        }
      }}
      tabIndex={0}
    >
      <span className="text-base font-medium">{reaction.emoji}</span>

      {isHovered && (
        <span
          className={cn(
            'animate-in fade-in slide-in-from-left-2 ml-1 font-medium duration-200',
            !isHovered &&
              'animate-out fade-out slide-out-to-left-2 duration-200'
          )}
        >
          {reaction.count}
        </span>
      )}
    </button>
  );
}

interface EmojiReactionsProps {
  reactions: EmojiReactionType[];
  onReact?: (emoji: string) => void;
  className?: string;
  showAddButton?: boolean;
  contextKeywords?: string[];
  ratingMode?: boolean; // When true, reactions open rating popovers
  onRatingOpen?: (emoji: string) => void; // Callback to open rating popover
}

interface HorizontalEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  contextKeywords?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HorizontalEmojiPicker({
  onEmojiSelect,
  onClose,
  contextKeywords = [],
  open,
  onOpenChange: _onOpenChange,
}: HorizontalEmojiPickerProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [showFullPicker, setShowFullPicker] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Calculate relevance score for context-aware suggestions
  const calculateRelevanceScore = React.useCallback(
    (emojiData: EmojiData): number => {
      if (contextKeywords.length === 0) return 0;

      let score = 0;
      const allKeywords = [emojiData.name, ...emojiData.keywords].map((k) =>
        k.toLowerCase()
      );

      contextKeywords.forEach((contextKeyword) => {
        const contextLower = contextKeyword.toLowerCase();
        allKeywords.forEach((keyword) => {
          if (
            keyword.includes(contextLower) ||
            contextLower.includes(keyword)
          ) {
            score += keyword === contextLower ? 10 : 5;
          }
        });
      });

      return score;
    },
    [contextKeywords]
  );

  // Get suggested emojis (top relevant + popular ones)
  const suggestedEmojis = React.useMemo(() => {
    const withScores = EMOJI_DATABASE.map((emoji) => ({
      ...emoji,
      relevanceScore: calculateRelevanceScore(emoji),
    }));

    // Get context-relevant emojis first
    const contextRelevant = withScores
      .filter((e) => e.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8);

    // If we don't have enough context-relevant emojis, add popular ones
    if (contextRelevant.length < 8) {
      const popularEmojis = ['😊', '👍', '❤️', '😍', '🎉', '👏', '🔥', '💯'];
      const additionalEmojis = EMOJI_DATABASE.filter(
        (e) =>
          popularEmojis.includes(e.emoji) &&
          !contextRelevant.find((cr) => cr.emoji === e.emoji)
      ).slice(0, 8 - contextRelevant.length);

      return [...contextRelevant, ...additionalEmojis];
    }

    return contextRelevant.slice(0, 8);
  }, [calculateRelevanceScore]);

  // Filter emojis based on search
  const searchResults = React.useMemo(() => {
    if (!searchValue.trim()) return [];

    const searchLower = searchValue.toLowerCase();
    return EMOJI_DATABASE.filter((emojiData) => {
      const searchableText = [emojiData.name, ...emojiData.keywords]
        .join(' ')
        .toLowerCase();
      return searchableText.includes(searchLower);
    }).slice(0, 6); // Show only first row of results
  }, [searchValue]);

  // Filter and sort all emojis for full picker
  const allEmojis = React.useMemo(() => {
    let filtered = EMOJI_DATABASE;

    // Filter by search if there's a search value
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = EMOJI_DATABASE.filter((emojiData) => {
        const searchableText = [emojiData.name, ...emojiData.keywords]
          .join(' ')
          .toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    // Calculate relevance scores and sort
    const withScores = filtered.map((emoji) => ({
      ...emoji,
      relevanceScore: calculateRelevanceScore(emoji),
    }));

    // Sort by relevance score (descending), then by category
    return withScores.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.category.localeCompare(b.category);
    });
  }, [searchValue, calculateRelevanceScore]);

  // Group emojis by category for full picker
  const groupedEmojis = React.useMemo(() => {
    const groups: Record<string, typeof allEmojis> = {};

    allEmojis.forEach((emoji) => {
      if (!groups[emoji.category]) {
        groups[emoji.category] = [];
      }
      groups[emoji.category].push(emoji);
    });

    return groups;
  }, [allEmojis]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
    // Focus the input after the animation
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  };

  const handleSearchInput = (value: string) => {
    setSearchValue(value);

    if (value.trim() && !showSearchResults) {
      // Start the animation sequence when first character is typed
      setTimeout(() => setShowSearchResults(true), 400); // After search field expands
    } else if (!value.trim() && showSearchResults) {
      setShowSearchResults(false);
    }
  };

  const handleShowFullPicker = () => {
    setShowFullPicker(true);
  };

  const handleCollapseSearch = () => {
    setIsSearchExpanded(false);
    setSearchValue('');
    setShowSearchResults(false);
  };

  // Reset states when popover closes
  React.useEffect(() => {
    if (!open) {
      setIsSearchExpanded(false);
      setSearchValue('');
      setShowFullPicker(false);
      setShowSearchResults(false);
    }
  }, [open]);

  // Get quick suggestions (top relevant emojis)
  const quickSuggestions = allEmojis
    .filter((e) => e.relevanceScore > 0)
    .slice(0, 6);

  const categoryOrder = [
    'smileys',
    'people',
    'animals',
    'food',
    'activities',
    'travel',
    'objects',
    'symbols',
    'flags',
  ];

  const horizontalPicker = (
    <div className="space-y-0">
      {/* Main horizontal row */}
      <div className="flex items-center gap-2">
        {/* Phase 1: Search icon morphs into search field */}
        <div
          data-state={isSearchExpanded ? 'expanded' : 'collapsed'}
          className={cn(
            'relative transition-[width] ease-in-out data-[state=collapsed]:duration-100 data-[state=expanded]:duration-300',
            'data-[state=collapsed]:w-8 data-[state=expanded]:w-full'
          )}
        >
          {!isSearchExpanded ? (
            <button
              onClick={handleSearchClick}
              className="bg-muted hover:bg-muted-foreground/20 text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              aria-label="Search emojis"
            >
              <Search className="h-4 w-4" />
            </button>
          ) : (
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search emojis..."
                value={searchValue}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleCollapseSearch();
                  }
                }}
                className="bg-muted h-8 w-full rounded-full border-none pr-8 pl-10 text-sm duration-500 outline-none"
              />
              <button
                onClick={handleCollapseSearch}
                className="hover:bg-background/80 animate-in fade-in absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2 transform items-center justify-center rounded-full transition-colors duration-500"
                aria-label="Close search"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Default suggested emojis (always visible unless search is expanded) */}
        {!isSearchExpanded && (
          <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-1 duration-300">
            {suggestedEmojis.slice(0, 6).map((emojiData, index) => (
              <button
                key={emojiData.emoji}
                onClick={() => handleEmojiClick(emojiData.emoji)}
                className={cn(
                  'hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors',
                  'animate-in fade-in zoom-in duration-150'
                )}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
                title={emojiData.name}
              >
                {emojiData.emoji}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleShowFullPicker}
          className="bg-muted hover:bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          aria-label="Show full emoji picker"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Phase 2 & 3: Search results expand down then right */}
      {isSearchExpanded && !searchValue && (
        <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-1 duration-300">
          {suggestedEmojis.map((emojiData, index) => (
            <button
              key={emojiData.emoji}
              onClick={() => handleEmojiClick(emojiData.emoji)}
              className={cn(
                'hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors',
                'animate-in fade-in zoom-in duration-150'
              )}
              style={{
                animationDelay: `${index * 30}ms`,
              }}
              title={emojiData.name}
            >
              {emojiData.emoji}
            </button>
          ))}
        </div>
      )}

      {showSearchResults && searchValue.trim() && (
        <div
          className={cn(
            'overflow-hidden pt-3',
            'animate-in slide-in-from-top-4 fade-in delay-100 duration-300'
          )}
        >
          <div
            className={cn(
              'overflow-hidden',
              'animate-in slide-in-from-left-8 fade-in delay-200 duration-300'
            )}
          >
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-8 gap-1">
                {searchResults.map((emojiData, index) => (
                  <button
                    key={emojiData.emoji}
                    onClick={() => handleEmojiClick(emojiData.emoji)}
                    className={cn(
                      'hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors',
                      'animate-in fade-in zoom-in duration-150'
                    )}
                    style={{
                      animationDelay: `${300 + index * 30}ms`,
                    }}
                    title={emojiData.name}
                  >
                    {emojiData.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground animate-in fade-in py-2 text-center text-sm delay-400 duration-200">
                No emojis found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const fullPicker = (
    <div className="relative h-full w-full">
      <Command className="h-full">
        <CommandInput
          placeholder="Search emojis..."
          value={searchValue}
          onValueChange={setSearchValue}
        />

        <CommandList asChild>
          <ScrollArea className="h-80">
            <div className="p-2">
              <CommandEmpty>No emojis found.</CommandEmpty>

              {/* Quick suggestions based on context  */}
              {quickSuggestions.length > 0 && (
                <CommandGroup heading="Suggested">
                  <div className="grid grid-cols-8 gap-1 py-2">
                    {quickSuggestions.map((emojiData) => (
                      <CommandItem
                        key={`suggested-${emojiData.emoji}`}
                        value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                        onSelect={() => handleEmojiClick(emojiData.emoji)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center p-0 text-lg"
                      >
                        {emojiData.emoji}
                      </CommandItem>
                    ))}
                  </div>
                </CommandGroup>
              )}

              {/* Grouped emojis by category */}
              {categoryOrder.map((category) => {
                const categoryEmojis = groupedEmojis[category];
                if (!categoryEmojis || categoryEmojis.length === 0) return null;

                return (
                  <CommandGroup
                    key={category}
                    heading={
                      category.charAt(0).toUpperCase() + category.slice(1)
                    }
                  >
                    <div className="animate-in fade-in grid grid-cols-8 gap-1 py-2 duration-300">
                      {categoryEmojis.map((emojiData, index) => (
                        <CommandItem
                          key={`${category}-${emojiData.emoji}`}
                          value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                          onSelect={() => handleEmojiClick(emojiData.emoji)}
                          className="animate-in fade-in zoom-in flex h-8 w-8 cursor-pointer items-center justify-center p-0 text-lg duration-150"
                          title={emojiData.name}
                          style={{
                            animationDelay: `${index * 30}ms`,
                          }}
                        >
                          {emojiData.emoji}
                        </CommandItem>
                      ))}
                    </div>
                  </CommandGroup>
                );
              })}

              {/* Show remaining categories that aren't in the priority order */}
              {Object.keys(groupedEmojis)
                .filter((category) => !categoryOrder.includes(category))
                .map((category) => {
                  const categoryEmojis = groupedEmojis[category];
                  if (!categoryEmojis || categoryEmojis.length === 0)
                    return null;

                  return (
                    <CommandGroup
                      key={category}
                      heading={
                        category.charAt(0).toUpperCase() + category.slice(1)
                      }
                    >
                      <div className="grid grid-cols-8 gap-1 py-2">
                        {categoryEmojis.map((emojiData) => (
                          <CommandItem
                            key={`${category}-${emojiData.emoji}`}
                            value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                            onSelect={() => handleEmojiClick(emojiData.emoji)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center p-0 text-lg"
                            title={emojiData.name}
                          >
                            {emojiData.emoji}
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                  );
                })}
            </div>
          </ScrollArea>
        </CommandList>
      </Command>

      {/* Chevron up in bottom right corner when full picker is shown */}
      <button
        onClick={() => setShowFullPicker(false)}
        className={cn(
          'bg-primary text-primary-foreground absolute right-2 bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-lg hover:scale-105'
        )}
        aria-label="Collapse to horizontal picker"
      >
        <ChevronDown className="h-4 w-4 rotate-180" />
      </button>
    </div>
  );

  return (
    <PopoverContent
      className={cn(
        'h-14 w-80 overflow-hidden p-3 transition-[height]',
        showFullPicker && 'h-96 p-0',
        (showSearchResults || isSearchExpanded) &&
          !showFullPicker &&
          'h-24 pb-6'
      )}
      side="top"
      align="start"
      sideOffset={8}
    >
      {showFullPicker ? fullPicker : horizontalPicker}
    </PopoverContent>
  );
}

export function EmojiReactions({
  reactions,
  onReact,
  className,
  showAddButton = true,
  contextKeywords = [],
  ratingMode = false,
  onRatingOpen,
}: EmojiReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const handleAddEmoji = (emoji: string) => {
    if (onReact) {
      onReact(emoji);
    }
  };

  const handleCloseEmojiPicker = () => {
    setShowEmojiPicker(false);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {reactions.map((reaction) => (
        <EmojiReaction
          key={reaction.emoji}
          reaction={reaction}
          onReact={onReact}
          ratingMode={ratingMode}
          onRatingOpen={onRatingOpen}
        />
      ))}

      {showAddButton && (
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center justify-center rounded-full p-1',
                'bg-muted hover:bg-muted/80 text-sm',
                'transition-all hover:scale-105 active:scale-95'
              )}
              aria-label="Add reaction"
            >
              <PlusCircle className="h-4 w-4" />
            </button>
          </PopoverTrigger>

          <HorizontalEmojiPicker
            onEmojiSelect={handleAddEmoji}
            onClose={handleCloseEmojiPicker}
            contextKeywords={contextKeywords}
            open={showEmojiPicker}
            onOpenChange={setShowEmojiPicker}
          />
        </Popover>
      )}
    </div>
  );
}
