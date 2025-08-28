import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { PlusCircle } from '@/components/ui/icons';
import { useUser } from '@clerk/tanstack-react-start';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EmojiSearchCollapsible } from './emoji-search-collapsible';
import { RateAndReviewDialog } from './rate-and-review-dialog';
import { AuthPromptDialog } from '@/features/auth';
import { trackEvents } from '@/lib/track-events';
import { EmojiRatingDisplay } from './emoji-rating-display';
import type { EmojiRatingMetadata, CurrentUserRating } from '@vibechecc/types';

// Unified emoji rating data type
export interface EmojiRatingData {
  emoji: string;
  value: number;
  count: number;
  users?: string[];
  tags?: string[];
}

// Unified handler interface
export interface UnifiedEmojiRatingHandler {
  (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }): Promise<void>;
}

export function EmojiReactionButton({
  reaction,
  onEmojiClick,
  vibeTitle,
  vibeId,
  className,
  existingUserRatings,
  emojiMetadata,
}: {
  reaction: EmojiRatingData;
  onEmojiClick: UnifiedEmojiRatingHandler;
  vibeTitle?: string;
  vibeId: string;
  className?: string;
  existingUserRatings?: CurrentUserRating[];
  emojiMetadata?: Record<string, EmojiRatingMetadata>;
}) {
  const { user } = useUser();
  const hasReacted = user?.id ? reaction.users?.includes(user.id) : false;

  return (
    <EmojiRatingDisplay
      rating={reaction}
      vibeId={vibeId}
      onEmojiClick={onEmojiClick}
      variant="compact-hover"
      hasUserReacted={hasReacted}
      vibeTitle={vibeTitle}
      size="sm"
      className={cn('flex-shrink-0', className)}
      existingUserRatings={existingUserRatings || []}
      emojiMetadata={emojiMetadata || {}}
    />
  );
}

// New emoji picker component that opens rating popover when emoji is selected
function EmojiPickerWithRating({
  onEmojiClick,
  vibeTitle,
  vibeId,
  existingUserRatings,
  emojiMetadata,
}: {
  onEmojiClick: UnifiedEmojiRatingHandler;
  vibeTitle?: string;
  vibeId: string;
  existingUserRatings: CurrentUserRating[];
  emojiMetadata: Record<string, EmojiRatingMetadata>;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = React.useState(false);
  const [selectedEmoji, setSelectedEmoji] = React.useState<string>('');
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const { user } = useUser();

  const handleAddEmojiClick = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    setIsRatingDialogOpen(true);
  };

  const handleRatingSubmit = async (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    await onEmojiClick(data);
    setIsRatingDialogOpen(false);
    setSelectedEmoji('');
  };

  return (
    <>
      <Popover
        open={showEmojiPicker}
        onOpenChange={(open) => {
          if (open) {
            trackEvents.emojiPopoverOpened(vibeId, 'vibe_reactions');
            window.dispatchEvent(new CustomEvent('vibe-overlay-open'));
          } else {
            trackEvents.emojiPopoverClosed(vibeId, 'vibe_reactions');
            window.dispatchEvent(new CustomEvent('vibe-overlay-closed'));
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
            onClick={(e) => {
              e.stopPropagation();
              handleAddEmojiClick();
            }}
          >
            <PlusCircle className="h-4 w-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto bg-transparent p-0"
          side="top"
          align="end"
          sideOffset={8}
          alignOffset={-16}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <EmojiSearchCollapsible
            onSelect={handleEmojiSelect}
            className="w-full"
            showCategories={false}
            perLine={8}
            expandButtonVariant="circle"
          />
        </PopoverContent>
      </Popover>

      <RateAndReviewDialog
        vibeId={vibeId}
        open={isRatingDialogOpen}
        onOpenChange={(open) => {
          setIsRatingDialogOpen(open);
          if (!open) {
            setSelectedEmoji('');
          }
          window.dispatchEvent(
            new CustomEvent(open ? 'vibe-overlay-open' : 'vibe-overlay-closed')
          );
        }}
        vibeTitle={vibeTitle}
        preSelectedEmoji={selectedEmoji}
        onSuccess={handleRatingSubmit}
        existingUserRatings={existingUserRatings}
        emojiMetadata={emojiMetadata}
      >
        <div style={{ display: 'none' }} />
      </RateAndReviewDialog>

      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to react"
        description="you must sign in to react to vibes"
      />
    </>
  );
}

export function EmojiReactionsRow({
  reactions,
  onEmojiClick,
  vibeTitle,
  vibeId,
  className,
  showAddButton = true,
  maxReactions = 6,
  existingUserRatings,
  emojiMetadata,
}: {
  reactions: EmojiRatingData[];
  onEmojiClick: UnifiedEmojiRatingHandler;
  vibeTitle?: string;
  vibeId: string;
  className?: string;
  showAddButton?: boolean;
  maxReactions?: number;
  existingUserRatings: CurrentUserRating[];
  emojiMetadata: Record<string, EmojiRatingMetadata>;
}) {
  const displayReactions = reactions.slice(0, maxReactions);

  return (
    <div className={cn('flex w-full min-w-0 items-center gap-1', className)}>
      <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {displayReactions.map((reaction) => (
          <EmojiReactionButton
            key={reaction.emoji}
            reaction={reaction}
            onEmojiClick={onEmojiClick}
            vibeTitle={vibeTitle}
            vibeId={vibeId}
            className="flex-shrink-0"
            existingUserRatings={existingUserRatings}
            emojiMetadata={emojiMetadata}
          />
        ))}
      </div>

      {showAddButton && (
        <EmojiPickerWithRating
          onEmojiClick={onEmojiClick}
          vibeTitle={vibeTitle}
          vibeId={vibeId}
          existingUserRatings={existingUserRatings}
          emojiMetadata={emojiMetadata}
        />
      )}
    </div>
  );
}
