import * as React from 'react';
import { cn } from '../utils/tailwind-utils';
import { PlusCircle, Search, ChevronDown, X } from 'lucide-react';
import { useUser } from '@clerk/tanstack-react-start';
import type { EmojiReaction as EmojiReactionType } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { EmojiSearchCommand } from './emoji-search-command';
import { EmojiRatingPopover } from './emoji-rating-popover';
import { api } from '@viberater/convex';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';

interface EmojiReactionProps {
  reaction: EmojiReactionType;
  onReact?: (emoji: string) => void;
  className?: string;
  showAddButton?: boolean;
  ratingMode?: boolean; // When true, clicking opens emoji rating popover
  onRatingSubmit?: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  vibeTitle?: string;
  vibeId?: string;
}

export function EmojiReaction({
  reaction,
  onReact,
  className,
  showAddButton: _showAddButton = false,
  ratingMode = false,
  onRatingSubmit,
  vibeTitle,
  vibeId: _vibeId,
}: EmojiReactionProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isRatingPopoverOpen, setIsRatingPopoverOpen] = React.useState(false);
  const { user } = useUser();

  const hasReacted = user?.id ? reaction.users.includes(user.id) : false;

  const handleReact = () => {
    // In rating mode, open the rating popover with this emoji
    if (ratingMode && onRatingSubmit) {
      setIsRatingPopoverOpen(true);
      return;
    }

    // Normal reaction mode
    if (onReact) {
      onReact(reaction.emoji);
    }
  };

  const handleRatingSubmit = async (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    if (onRatingSubmit) {
      await onRatingSubmit(data);
      setIsRatingPopoverOpen(false);
    }
  };

  const buttonContent = (
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
      <span className="font-noto-color text-base font-medium">
        {reaction.emoji}
      </span>

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

  // In rating mode, wrap with EmojiRatingPopover
  if (ratingMode && onRatingSubmit) {
    return (
      <EmojiRatingPopover
        open={isRatingPopoverOpen}
        onOpenChange={setIsRatingPopoverOpen}
        onSubmit={handleRatingSubmit}
        vibeTitle={vibeTitle}
        preSelectedEmoji={reaction.emoji}
      >
        {buttonContent}
      </EmojiRatingPopover>
    );
  }

  return buttonContent;
}

interface EmojiReactionsProps {
  reactions: EmojiReactionType[];
  onReact?: (emoji: string) => void;
  className?: string;
  showAddButton?: boolean;
  contextKeywords?: string[];
  ratingMode?: boolean; // When true, reactions open rating popovers
  onRatingSubmit?: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  vibeTitle?: string;
  vibeId?: string;
}

interface HorizontalEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  contextKeywords?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ratingMode?: boolean;
  onRatingSubmit?: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  vibeTitle?: string;
  vibeId?: string;
}

function HorizontalEmojiPicker({
  onEmojiSelect,
  onClose,
  contextKeywords: _contextKeywords = [],
  open,
  onOpenChange: _onOpenChange,
  ratingMode = false,
  onRatingSubmit,
  vibeTitle,
  vibeId: _vibeId,
}: HorizontalEmojiPickerProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [showFullPicker, setShowFullPicker] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [isRatingPopoverOpen, setIsRatingPopoverOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Get popular emojis from database
  const popularEmojis = useQuery({
    ...convexQuery(api.emojis.getPopular, { limit: 8 }),
    enabled: open,
  });

  // Search emojis from database
  const searchResults = useQuery({
    ...convexQuery(api.emojis.search, {
      searchTerm: searchValue || undefined,
      pageSize: 6,
    }),
    enabled: open && !!searchValue,
  });

  // Get suggested emojis from popular ones
  const suggestedEmojis = React.useMemo(() => {
    const popularData = popularEmojis?.data || [];
    return popularData.slice(0, 6);
  }, [popularEmojis?.data]);

  // Get emojis from search results
  const searchEmojis = React.useMemo(() => {
    const searchData = searchResults?.data || { emojis: [] };
    return searchData.emojis || [];
  }, [searchResults?.data]);

  const handleEmojiClick = (emoji: string) => {
    if (ratingMode && onRatingSubmit) {
      // In rating mode, open rating popover instead of quick reaction
      setSelectedEmojiForRating(emoji);
      setIsRatingPopoverOpen(true);
      // Don't close the picker yet - let the rating popover handle it
    } else {
      // Normal reaction mode
      onEmojiSelect(emoji);
      onClose();
    }
  };

  const handleRatingSubmit = async (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    if (onRatingSubmit) {
      await onRatingSubmit(data);
      setIsRatingPopoverOpen(false);
      setSelectedEmojiForRating(null);
      onClose(); // Close the emoji picker after rating is submitted
    }
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
                  'hover:bg-muted font-noto-color flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors',
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
                'hover:bg-muted font-noto-color flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors',
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
            {searchEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-1">
                {searchEmojis.map((emojiData, index) => (
                  <button
                    key={emojiData.emoji}
                    onClick={() => handleEmojiClick(emojiData.emoji)}
                    className={cn(
                      'hover:bg-muted font-noto-color flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors',
                      'animate-in fade-in zoom-in duration-150'
                    )}
                    style={{
                      animationDelay: `${300 + index * 30}ms`,
                      color: emojiData.color,
                    }}
                    title={emojiData.name}
                  >
                    <span className="font-noto-color">{emojiData.emoji}</span>
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
      <EmojiSearchCommand
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSelect={handleEmojiClick}
        className="h-full border-0"
        maxHeight="h-[340px]"
        pageSize={200}
        showCategories={true}
      />

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

  const pickerContent = (
    <PopoverContent
      className={cn(
        'h-14 w-80 overflow-hidden p-3 transition-[height]',
        showFullPicker && 'h-[400px] w-[352px] p-0',
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

  // If in rating mode and an emoji is selected for rating, wrap with rating popover
  if (ratingMode && selectedEmojiForRating && onRatingSubmit) {
    return (
      <>
        {pickerContent}
        <EmojiRatingPopover
          open={isRatingPopoverOpen}
          onOpenChange={setIsRatingPopoverOpen}
          onSubmit={handleRatingSubmit}
          vibeTitle={vibeTitle}
          preSelectedEmoji={selectedEmojiForRating}
        >
          <div style={{ display: 'none' }} />
        </EmojiRatingPopover>
      </>
    );
  }

  return pickerContent;
}

export function EmojiReactions({
  reactions,
  onReact,
  className,
  showAddButton = true,
  contextKeywords = [],
  ratingMode = false,
  onRatingSubmit,
  vibeTitle,
  vibeId,
}: EmojiReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const handleAddEmoji = (emoji: string) => {
    // This should only be called in non-rating mode now
    // In rating mode, the HorizontalEmojiPicker handles the emoji selection directly
    if (onReact && !ratingMode) {
      onReact(emoji);
    }
  };

  const handleCloseEmojiPicker = () => {
    setShowEmojiPicker(false);
  };

  return (
    <div className={cn('flex w-full min-w-0 items-center gap-1', className)}>
      {/* Container for emoji reactions that can be hidden when overflowing */}
      <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {reactions.map((reaction) => (
          <EmojiReaction
            key={reaction.emoji}
            reaction={reaction}
            onReact={onReact}
            ratingMode={ratingMode}
            onRatingSubmit={onRatingSubmit}
            vibeTitle={vibeTitle}
            vibeId={vibeId}
            className="flex-shrink-0"
          />
        ))}
      </div>

      {/* Plus button always visible at the end */}
      {showAddButton && (
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex flex-shrink-0 items-center justify-center rounded-full p-1',
                'bg-muted hover:bg-muted/80 text-sm',
                'transition-all hover:scale-105 active:scale-95'
              )}
              aria-label="Add reaction"
              title="Add your reaction"
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
            ratingMode={ratingMode}
            onRatingSubmit={onRatingSubmit}
            vibeTitle={vibeTitle}
            vibeId={vibeId}
          />
        </Popover>
      )}
    </div>
  );
}
