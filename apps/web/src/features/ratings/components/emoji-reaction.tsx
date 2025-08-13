import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { PlusCircle } from '@/components/ui/icons';
import { useUser } from '@clerk/tanstack-react-start';
import type { EmojiReaction as EmojiReactionType } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EmojiSearchCollapsible } from './emoji-search-collapsible';
import { RatingPopover } from './rating-popover';
import { AuthPromptDialog } from '@/features/auth';
import { trackEvents } from '@/lib/posthog';

interface EmojiReactionProps {
  reaction: EmojiReactionType;
  onReact?: (emoji: string) => void;
  className?: string;
  showAddButton?: boolean;
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

export function EmojiReaction({
  reaction,
  onReact,
  className,
  showAddButton: _showAddButton = false,
  onRatingSubmit,
  vibeTitle,
  vibeId: _vibeId,
}: EmojiReactionProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isRatingPopoverOpen, setIsRatingPopoverOpen] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const { user } = useUser();

  const hasReacted = user?.id ? reaction.users.includes(user.id) : false;

  const handleReact = () => {
    // Check if user is signed in first
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // Always open the rating popover with this emoji
    if (onRatingSubmit) {
      setIsRatingPopoverOpen(true);
      return;
    }

    // If onRatingSubmit is not provided, fall back to onReact
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
      <span className="font-sans text-base font-medium">{reaction.emoji}</span>

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

  // Always wrap with RatingPopover if onRatingSubmit is provided
  if (onRatingSubmit) {
    return (
      <>
        <RatingPopover
          open={isRatingPopoverOpen}
          onOpenChange={setIsRatingPopoverOpen}
          onSubmit={handleRatingSubmit}
          vibeTitle={vibeTitle}
          preSelectedEmoji={reaction.emoji}
        >
          {buttonContent}
        </RatingPopover>
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate"
          description="you must sign in to rate vibes with emojis"
        />
      </>
    );
  }

  return (
    <>
      {buttonContent}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to react"
        description="you must sign in to react to vibes"
      />
    </>
  );
}

interface EmojiReactionsProps {
  reactions: EmojiReactionType[];
  onReact?: (emoji: string) => void;
  className?: string;
  showAddButton?: boolean;
  contextKeywords?: string[];
  onRatingSubmit?: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  vibeTitle?: string;
  vibeId?: string;
}

interface SimplifiedEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  open: boolean;
  onRatingSubmit?: (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => Promise<void>;
  vibeTitle?: string;
  vibeId?: string;
}

function SimplifiedEmojiPicker({
  onEmojiSelect,
  onClose,
  open: _open,
  onRatingSubmit,
  vibeTitle,
  vibeId: _vibeId,
}: SimplifiedEmojiPickerProps) {
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [isRatingPopoverOpen, setIsRatingPopoverOpen] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const { user } = useUser();

  const handleEmojiSelect = (emoji: string) => {
    // Check if user is signed in first
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (onRatingSubmit) {
      // Always open rating popover instead of quick reaction
      setSelectedEmojiForRating(emoji);
      setIsRatingPopoverOpen(true);
      // Don't close the picker yet - let the rating popover handle it
    } else {
      // If onRatingSubmit is not provided, fall back to onEmojiSelect
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

  const pickerContent = (
    <PopoverContent
      className="w-auto bg-transparent p-0"
      side="top"
      align="end"
      sideOffset={8}
      alignOffset={-16}
    >
      <EmojiSearchCollapsible
        onSelect={handleEmojiSelect}
        className="w-full"
        showCategories={false}
        perLine={8}
        expandButtonVariant="circle"
      />
    </PopoverContent>
  );

  // If an emoji is selected for rating and onRatingSubmit is provided, wrap with rating popover
  if (selectedEmojiForRating && onRatingSubmit) {
    return (
      <>
        {pickerContent}
        <RatingPopover
          open={isRatingPopoverOpen}
          onOpenChange={setIsRatingPopoverOpen}
          onSubmit={handleRatingSubmit}
          vibeTitle={vibeTitle}
          preSelectedEmoji={selectedEmojiForRating}
        >
          <div style={{ display: 'none' }} />
        </RatingPopover>
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          title="sign in to rate"
          description="you must sign in to rate vibes with emojis"
        />
      </>
    );
  }

  return (
    <>
      {pickerContent}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to react"
        description="you must sign in to react to vibes"
      />
    </>
  );
}

export function EmojiReactions({
  reactions,
  onReact,
  className,
  showAddButton = true,
  contextKeywords: _contextKeywords = [],
  onRatingSubmit,
  vibeTitle,
  vibeId,
}: EmojiReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const { user } = useUser();

  const handleAddEmoji = (emoji: string) => {
    // This should only be called when onRatingSubmit is not provided
    // When onRatingSubmit is provided, the SimplifiedEmojiPicker handles the emoji selection directly
    if (onReact && !onRatingSubmit) {
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
            onRatingSubmit={onRatingSubmit}
            vibeTitle={vibeTitle}
            vibeId={vibeId}
            className="flex-shrink-0"
          />
        ))}
      </div>

      {/* Plus button always visible at the end */}
      {showAddButton && (
        <Popover
          open={showEmojiPicker}
          onOpenChange={(open) => {
            if (open) {
              trackEvents.emojiPopoverOpened(vibeId, 'vibe_reactions');
            } else {
              trackEvents.emojiPopoverClosed(vibeId, 'vibe_reactions');
            }
            setShowEmojiPicker(open);
          }}
        >
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex flex-shrink-0 items-center justify-center rounded-full p-1',
                'bg-muted hover:bg-muted/80 text-sm',
                'transition-all hover:scale-105 active:scale-95'
              )}
              aria-label="Add reaction"
              title="Add your reaction"
              onClick={() => {
                if (!user) {
                  setShowAuthDialog(true);
                }
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </button>
          </PopoverTrigger>

          <SimplifiedEmojiPicker
            onEmojiSelect={handleAddEmoji}
            onClose={handleCloseEmojiPicker}
            open={showEmojiPicker}
            onRatingSubmit={onRatingSubmit}
            vibeTitle={vibeTitle}
            vibeId={vibeId}
          />
        </Popover>
      )}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to react"
        description="you must sign in to react to vibes"
      />
    </div>
  );
}
