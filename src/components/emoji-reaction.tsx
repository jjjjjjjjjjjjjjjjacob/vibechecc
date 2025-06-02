import * as React from 'react';
import { cn } from '../utils/tailwind-utils';
import { PlusCircle, Search, ChevronDown, X } from 'lucide-react';
import { useUser } from '@clerk/tanstack-react-start';
import type { EmojiReaction as EmojiReactionType } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { ScrollArea } from './ui/scroll-area';
import { EMOJI_DATABASE, type EmojiData } from '../lib/emoji-database';

interface EmojiReactionProps {
  reaction: EmojiReactionType;
  onReact?: (emoji: string) => void;
  className?: string;
  showAddButton?: boolean;
}

export function EmojiReaction({
  reaction,
  onReact,
  className,
  showAddButton = false,
}: EmojiReactionProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const { user } = useUser();

  const hasReacted = user?.id ? reaction.users.includes(user.id) : false;

  const handleReact = () => {
    if (onReact) {
      onReact(reaction.emoji);
    }
  };

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-full px-2 py-1 text-sm transition-all hover:scale-105 active:scale-95",
        hasReacted ? "bg-primary/10" : "bg-muted hover:bg-muted/80",
        className,
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
            "ml-1 font-medium animate-in fade-in slide-in-from-left-2 duration-200",
            !isHovered && "animate-out fade-out slide-out-to-left-2 duration-200"
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
  onOpenChange,
}: HorizontalEmojiPickerProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [showFullPicker, setShowFullPicker] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Calculate relevance score for context-aware suggestions
  const calculateRelevanceScore = (emojiData: EmojiData): number => {
    if (contextKeywords.length === 0) return 0;
    
    let score = 0;
    const allKeywords = [emojiData.name, ...emojiData.keywords].map(k => k.toLowerCase());
    
    contextKeywords.forEach(contextKeyword => {
      const contextLower = contextKeyword.toLowerCase();
      allKeywords.forEach(keyword => {
        if (keyword.includes(contextLower) || contextLower.includes(keyword)) {
          score += keyword === contextLower ? 10 : 5;
        }
      });
    });
    
    return score;
  };

  // Get suggested emojis (top relevant + popular ones)
  const suggestedEmojis = React.useMemo(() => {
    const withScores = EMOJI_DATABASE.map(emoji => ({
      ...emoji,
      relevanceScore: calculateRelevanceScore(emoji)
    }));

    // Get context-relevant emojis first
    const contextRelevant = withScores
      .filter(e => e.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8);

    // If we don't have enough context-relevant emojis, add popular ones
    if (contextRelevant.length < 8) {
      const popularEmojis = ['😊', '👍', '❤️', '😍', '🎉', '👏', '🔥', '💯'];
      const additionalEmojis = EMOJI_DATABASE
        .filter(e => popularEmojis.includes(e.emoji) && !contextRelevant.find(cr => cr.emoji === e.emoji))
        .slice(0, 8 - contextRelevant.length);
      
      return [...contextRelevant, ...additionalEmojis];
    }

    return contextRelevant.slice(0, 8);
  }, [contextKeywords]);

  // Filter emojis based on search
  const searchResults = React.useMemo(() => {
    if (!searchValue.trim()) return [];
    
    const searchLower = searchValue.toLowerCase();
    return EMOJI_DATABASE
      .filter(emojiData => {
        const searchableText = [emojiData.name, ...emojiData.keywords].join(' ').toLowerCase();
        return searchableText.includes(searchLower);
      })
      .slice(0, 6); // Show only first row of results
  }, [searchValue]);

  // Filter and sort all emojis for full picker
  const allEmojis = React.useMemo(() => {
    let filtered = EMOJI_DATABASE;

    // Filter by search if there's a search value
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = EMOJI_DATABASE.filter(emojiData => {
        const searchableText = [emojiData.name, ...emojiData.keywords].join(' ').toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    // Calculate relevance scores and sort
    const withScores = filtered.map(emoji => ({
      ...emoji,
      relevanceScore: calculateRelevanceScore(emoji)
    }));

    // Sort by relevance score (descending), then by category
    return withScores.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.category.localeCompare(b.category);
    });
  }, [searchValue, contextKeywords]);

  // Group emojis by category for full picker
  const groupedEmojis = React.useMemo(() => {
    const groups: Record<string, typeof allEmojis> = {};
    
    allEmojis.forEach(emoji => {
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
    .filter(e => e.relevanceScore > 0)
    .slice(0, 6);

  const categoryOrder = ['smileys', 'people', 'animals', 'food', 'activities', 'travel', 'objects', 'symbols', 'flags'];

  return (
    <PopoverContent 
      className={cn(
        "w-full max-w-80 p-3 transition-all duration-300", 
        showFullPicker && "w-80 h-96 p-0",
        showSearchResults && !showFullPicker && "pb-6"
      )} 
      side="top" 
      align="start"
      sideOffset={8}
    >
      {showFullPicker ? (
        <div className="relative h-full">
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

                  {/* Quick suggestions based on context */}
                  {quickSuggestions.length > 0 && (
                    <CommandGroup heading="Suggested">
                      <div className="grid grid-cols-6 gap-1 py-2">
                        {quickSuggestions.map((emojiData) => (
                          <CommandItem
                            key={`suggested-${emojiData.emoji}`}
                            value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                            onSelect={() => handleEmojiClick(emojiData.emoji)}
                            className="flex h-8 w-8 items-center justify-center p-0 text-lg cursor-pointer"
                          >
                            {emojiData.emoji}
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                  )}

                  {/* Grouped emojis by category */}
                  {categoryOrder.map(category => {
                    const categoryEmojis = groupedEmojis[category];
                    if (!categoryEmojis || categoryEmojis.length === 0) return null;

                    return (
                      <CommandGroup 
                        key={category} 
                        heading={category.charAt(0).toUpperCase() + category.slice(1)}
                      >
                        <div className="grid grid-cols-6 gap-1 py-2">
                          {categoryEmojis.map((emojiData) => (
                            <CommandItem
                              key={`${category}-${emojiData.emoji}`}
                              value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                              onSelect={() => handleEmojiClick(emojiData.emoji)}
                              className="flex h-8 w-8 items-center justify-center p-0 text-lg cursor-pointer"
                              title={emojiData.name}
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
                    .filter(category => !categoryOrder.includes(category))
                    .map(category => {
                      const categoryEmojis = groupedEmojis[category];
                      if (!categoryEmojis || categoryEmojis.length === 0) return null;

                      return (
                        <CommandGroup 
                          key={category} 
                          heading={category.charAt(0).toUpperCase() + category.slice(1)}
                        >
                          <div className="grid grid-cols-8 gap-1 py-2">
                            {categoryEmojis.map((emojiData) => (
                              <CommandItem
                                key={`${category}-${emojiData.emoji}`}
                                value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                                onSelect={() => handleEmojiClick(emojiData.emoji)}
                                className="flex h-8 w-8 items-center justify-center p-0 text-lg cursor-pointer"
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
              "absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform z-10",
              showFullPicker ? "animate-in fade-in zoom-in duration-200 delay-100" : "animate-out fade-out zoom-out duration-200"
            )}
            aria-label="Collapse to horizontal picker"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Main horizontal row */}
          <div className="flex items-center gap-2">
            {/* Phase 1: Search icon morphs into search field */}
            <div
              data-state={isSearchExpanded ? 'expanded' : 'collapsed'}
              className={cn(
                "relative transition-all data-[state=expanded]:duration-300 data-[state=collapsed]:duration-100 ease-in-out",
                "data-[state=expanded]:w-full data-[state=collapsed]:w-8"
              )}
            >
              {!isSearchExpanded ? (
                <button
                  onClick={handleSearchClick}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors text-muted-foreground"
                  aria-label="Search emojis"
                >
                  <Search className="h-4 w-4" />
                </button>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    className="w-full h-8 pl-10 pr-8 rounded-full bg-muted border-none outline-none text-sm animate-in fade-in duration-500"
                  />
                  <button
                    onClick={handleCollapseSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full hover:bg-background/80 transition-colors animate-in fade-in duration-500"
                    aria-label="Close search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Default suggested emojis (always visible unless search is expanded) */}
            {!isSearchExpanded && (
              <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-300">
                {suggestedEmojis.slice(0, 6).map((emojiData, index) => (
                  <button
                    key={emojiData.emoji}
                    onClick={() => handleEmojiClick(emojiData.emoji)}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 text-lg hover:bg-muted rounded-md transition-colors",
                      "animate-in fade-in zoom-in duration-150"
                    )}
                    style={{
                      animationDelay: `${index * 30}ms`
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
              className="flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Show full emoji picker"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Phase 2 & 3: Search results expand down then right */}
          {isSearchExpanded && !searchValue && (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-300">
              {suggestedEmojis.map((emojiData, index) => (
                <button
                  key={emojiData.emoji}
                  onClick={() => handleEmojiClick(emojiData.emoji)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 text-lg hover:bg-muted rounded-md transition-colors",
                    "animate-in fade-in zoom-in duration-150"
                  )}
                  style={{
                    animationDelay: `${index * 30}ms`
                  }}
                  title={emojiData.name}
                >
                  {emojiData.emoji}
                </button>
              ))}
            </div>
          )}

          {showSearchResults && searchValue.trim() && (
            <div className={cn(
              "overflow-hidden pt-3",
              "animate-in slide-in-from-top-4 fade-in duration-300 delay-100"
            )}>
              <div className={cn(
                "overflow-hidden",
                "animate-in slide-in-from-left-8 fade-in duration-300 delay-200"
              )}>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-8 gap-1">
                    {searchResults.map((emojiData, index) => (
                      <button
                        key={emojiData.emoji}
                        onClick={() => handleEmojiClick(emojiData.emoji)}
                        className={cn(
                          "flex items-center justify-center w-8 h-8 text-lg hover:bg-muted rounded-md transition-colors",
                          "animate-in fade-in zoom-in duration-150"
                        )}
                        style={{
                          animationDelay: `${300 + index * 30}ms`
                        }}
                        title={emojiData.name}
                      >
                        {emojiData.emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2 animate-in fade-in duration-200 delay-400">
                    No emojis found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PopoverContent>
  );
}

export function EmojiReactions({
  reactions,
  onReact,
  className,
  showAddButton = true,
  contextKeywords = [],
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
        />
      ))}

      {showAddButton && (
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                padding: '0.25rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--muted)',
                transition: 'all 150ms',
                cursor: 'pointer',
              }}
              className="hover:scale-105 active:scale-95"
              role="button"
              tabIndex={0}
              aria-label="Add reaction"
            >
              <PlusCircle className="h-4 w-4" />
            </div>
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
