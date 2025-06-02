import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/tailwind-utils';
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

interface EnhancedEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
  contextKeywords?: string[]; // Keywords related to the current vibe/card for relevance scoring
  triggerRef: React.RefObject<HTMLElement>; // Reference to the trigger element for positioning
}

export function EnhancedEmojiPicker({
  onEmojiSelect,
  onClose,
  className,
  contextKeywords = [],
  triggerRef,
}: EnhancedEmojiPickerProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // Calculate position based on trigger element
  React.useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const pickerHeight = 400; // Approximate height of the picker
      
      // Calculate if there's enough space above or below
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      
      let top = rect.top - pickerHeight - 8; // 8px gap
      let left = rect.left;
      
      // If not enough space above, position below
      if (spaceAbove < pickerHeight && spaceBelow > spaceAbove) {
        top = rect.bottom + 8;
      }
      
      // Ensure the picker doesn't go off-screen horizontally
      const pickerWidth = 320;
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
      
      setPosition({ top, left });
    }
  }, [triggerRef]);

  // Calculate relevance score for context-aware suggestions
  const calculateRelevanceScore = (emojiData: EmojiData): number => {
    if (contextKeywords.length === 0) return 0;
    
    let score = 0;
    const allKeywords = [emojiData.name, ...emojiData.keywords].map(k => k.toLowerCase());
    
    contextKeywords.forEach(contextKeyword => {
      const contextLower = contextKeyword.toLowerCase();
      allKeywords.forEach(keyword => {
        if (keyword.includes(contextLower) || contextLower.includes(keyword)) {
          score += keyword === contextLower ? 10 : 5; // Exact match gets higher score
        }
      });
    });
    
    return score;
  };

  // Filter and sort emojis based on search and context
  const filteredEmojis = React.useMemo(() => {
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

  // Group emojis by category for better organization
  const groupedEmojis = React.useMemo(() => {
    const groups: Record<string, typeof filteredEmojis> = {};
    
    filteredEmojis.forEach(emoji => {
      if (!groups[emoji.category]) {
        groups[emoji.category] = [];
      }
      groups[emoji.category].push(emoji);
    });

    return groups;
  }, [filteredEmojis]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  // Get quick suggestions (top relevant emojis)
  const quickSuggestions = filteredEmojis
    .filter(e => e.relevanceScore > 0)
    .slice(0, 8);

  const categoryOrder = ['smileys', 'people', 'animals', 'food', 'activities', 'travel', 'objects', 'symbols', 'flags'];

  return (
    <div
      className={cn(
        "animate-in fade-in duration-200",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      data-emoji-picker
    >
      <Command className="max-h-96 h-full">
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
                  <div className="grid grid-cols-8 gap-1 py-2">
                    {quickSuggestions.map((emojiData, index) => (
                      <CommandItem
                        key={`suggested-${emojiData.emoji}`}
                        value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                        onSelect={() => handleEmojiClick(emojiData.emoji)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center p-0 text-lg cursor-pointer",
                          "animate-in fade-in duration-150"
                        )}
                        style={{
                          animationDelay: `${index * 30}ms`
                        }}
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
                    <div className="grid grid-cols-8 gap-1 py-2">
                      {categoryEmojis.map((emojiData, index) => (
                        <CommandItem
                          key={`${category}-${emojiData.emoji}`}
                          value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                          onSelect={() => handleEmojiClick(emojiData.emoji)}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center p-0 text-lg cursor-pointer",
                            "animate-in fade-in duration-150"
                          )}
                          style={{
                            animationDelay: `${index * 20}ms`
                          }}
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
                        {categoryEmojis.map((emojiData, index) => (
                          <CommandItem
                            key={`${category}-${emojiData.emoji}`}
                            value={`${emojiData.name} ${emojiData.keywords.join(' ')}`}
                            onSelect={() => handleEmojiClick(emojiData.emoji)}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center p-0 text-lg cursor-pointer",
                              "animate-in fade-in duration-150"
                            )}
                            style={{
                              animationDelay: `${index * 20}ms`
                            }}
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
    </div>
  );
} 