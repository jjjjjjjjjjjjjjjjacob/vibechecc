import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/utils/tailwind-utils';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from '@/hooks/usePostHog';
import { PlusCircle } from 'lucide-react';
import {
  useTopEmojiRatings,
  useMostInteractedEmoji,
  useCreateEmojiRatingMutation,
  useEmojiMetadata,
  useQuickReactMutation,
} from '@/queries';
import toast from '@/utils/toast';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import type { Vibe } from '@/types';
import { EmojiRatingPopover } from '@/components/emoji-rating-popover';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import { EmojiRatingDisplayPopover } from '@/components/emoji-rating-display-popover';
import { EmojiRatingCycleDisplay } from '@/components/emoji-rating-cycle-display';
import { EmojiReactions } from '@/components/emoji-reaction';

interface VibeCardProps {
  vibe: Vibe;
  compact?: boolean;
}

export function VibeCard({ vibe, compact }: VibeCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [preselectedRatingValue, setPreselectedRatingValue] = React.useState<
    number | null
  >(null);
  const [showEmojiRatingPopover, setShowEmojiRatingPopover] =
    React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = React.useState(false);
  const { user } = useUser();
  const { trackEvents } = usePostHog();
  const createEmojiRatingMutation = useCreateEmojiRatingMutation();
  const quickReactMutation = useQuickReactMutation();
  const { data: emojiMetadataArray } = useEmojiMetadata();

  // Fetch emoji rating data
  const { data: topEmojiRatings } = useTopEmojiRatings(vibe.id, 5);
  const { data: mostInteractedEmojiData } = useMostInteractedEmoji(vibe.id);

  // Determine if we should use a placeholder
  const usePlaceholder = !vibe.image || imageError;

  // Transform backend emoji ratings to display format
  const emojiRatings = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) {
      return [];
    }

    return topEmojiRatings.map((rating) => ({
      emoji: rating.emoji,
      value: rating.averageValue,
      count: rating.count,
      tags: rating.tags,
    }));
  }, [topEmojiRatings]);

  // Use backend data for most interacted emoji
  const mostInteractedEmoji = React.useMemo(() => {
    if (mostInteractedEmojiData && mostInteractedEmojiData.averageValue) {
      return {
        emoji: mostInteractedEmojiData.emoji,
        value: mostInteractedEmojiData.averageValue,
        count: mostInteractedEmojiData.count,
      };
    }
    return null;
  }, [mostInteractedEmojiData]);

  // Transform emoji ratings to reaction format for UI
  const emojiReactions = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) {
      return [];
    }

    // Get top 3 emojis for reactions display
    return topEmojiRatings.slice(0, 3).map((rating) => ({
      emoji: rating.emoji,
      count: rating.count,
      users: [], // We don't track individual users in the new system
    }));
  }, [topEmojiRatings]);

  // Convert emoji metadata array to record for easier lookup
  const emojiMetadataRecord = React.useMemo(() => {
    if (!emojiMetadataArray) return {};
    return emojiMetadataArray.reduce(
      (acc, metadata) => {
        acc[metadata.emoji] = metadata;
        return acc;
      },
      {} as Record<string, (typeof emojiMetadataArray)[0]>
    );
  }, [emojiMetadataArray]);

  // Handle emoji rating submission
  const handleEmojiRating = async (data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    await createEmojiRatingMutation.mutateAsync({
      vibeId: vibe.id,
      emoji: data.emoji,
      value: data.value,
      review: data.review,
    });

    toast.success(`vibe rated ${data.value} ${data.emoji}! review submitted.`, {
      duration: 3000,
      icon: data.emoji,
    });
  };

  const handleEmojiRatingClick = (emojiData: string) => {
    if (!user?.id) {
      setShowAuthDialog(true);
      return;
    }

    // Check if the emoji data contains a decimal value
    const [emoji, value] = emojiData.includes(':')
      ? emojiData.split(':')
      : [emojiData, null];
    setSelectedEmojiForRating(emoji);

    // If a specific value was provided, store it for the popover
    if (value) {
      setPreselectedRatingValue(parseFloat(value));
    }

    setShowEmojiRatingPopover(true);
  };

  const handleQuickReact = async (emoji: string) => {
    if (!user?.id) {
      setShowAuthDialog(true);
      return;
    }

    try {
      await quickReactMutation.mutateAsync({
        vibeId: vibe.id,
        emoji,
      });

      toast.success('quick reaction added!', {
        duration: 2000,
        icon: emoji,
      });
    } catch (error) {
      if (error instanceof Error && error.message?.includes('already rated')) {
        // User already has a rating, open the rating popover
        setSelectedEmojiForRating(emoji);
        setShowEmojiRatingPopover(true);
      } else {
        toast.error('failed to add reaction', {
          duration: 2000,
        });
      }
    }
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200 hover:shadow-md',
          !compact && 'h-full'
        )}
      >
        {/* Avatar positioned absolutely in upper left corner */}
        {vibe.createdBy && (
          <div
            className="absolute top-2 left-2 z-10"
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
            role="group"
          >
            {vibe.createdBy.username ? (
              <Link
                to="/users/$username"
                params={{ username: vibe.createdBy.username }}
                className="flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Avatar className="h-6 w-6 shadow-md transition-transform hover:scale-110">
                  <AvatarImage
                    src={getUserAvatarUrl(vibe.createdBy)}
                    alt={computeUserDisplayName(vibe.createdBy)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-background/50 border-none text-xs">
                    {getUserInitials(vibe.createdBy)}
                  </AvatarFallback>
                </Avatar>
                {isAvatarHovered && (
                  <span
                    className={cn(
                      'bg-background/50 rounded-full px-2 py-1 text-xs font-medium shadow-md backdrop-blur-sm',
                      'animate-in fade-in slide-in-from-left-2 duration-200'
                    )}
                  >
                    {computeUserDisplayName(vibe.createdBy)}
                  </span>
                )}
              </Link>
            ) : (
              <Avatar className="ring-background h-8 w-8 shadow-md ring-2">
                <AvatarImage
                  src={getUserAvatarUrl(vibe.createdBy)}
                  alt={computeUserDisplayName(vibe.createdBy)}
                  className="object-cover"
                />
                <AvatarFallback>
                  {getUserInitials(vibe.createdBy)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        <div className="block h-full">
          <Link
            to="/vibes/$vibeId"
            params={{ vibeId: vibe.id }}
            onClick={() => {
              // Track vibe view when clicked
              trackEvents.vibeViewed(vibe.id);
            }}
          >
            <div className="relative">
              <div
                className={cn(
                  'relative overflow-hidden',
                  compact ? 'aspect-[4/3]' : 'aspect-video'
                )}
              >
                {usePlaceholder ? (
                  <SimpleVibePlaceholder title={vibe.title} />
                ) : (
                  <img
                    src={vibe.image}
                    alt={vibe.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </div>

            <CardContent className={cn('p-4', compact && 'p-3')}>
              <h3
                className={cn(
                  'line-clamp-1 font-bold',
                  compact ? 'text-base' : 'text-lg'
                )}
              >
                {vibe.title}
              </h3>

              {!compact && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {vibe.description}
                </p>
              )}
            </CardContent>
          </Link>

          <CardFooter
            className={cn(
              'flex flex-col items-start gap-3 p-4 pt-0',
              compact && 'p-3 pt-0'
            )}
          >
            {/* Emoji Rating Display - Show cycling display if no ratings yet */}
            <div className="w-full">
              {mostInteractedEmoji ? (
                <EmojiRatingDisplayPopover
                  rating={mostInteractedEmoji}
                  allRatings={emojiRatings}
                  onEmojiClick={handleEmojiRatingClick}
                  vibeId={vibe.id}
                />
              ) : (
                <EmojiRatingCycleDisplay
                  onSubmit={handleEmojiRating}
                  isSubmitting={createEmojiRatingMutation.isPending}
                  vibeTitle={vibe.title}
                  emojiMetadata={emojiMetadataRecord}
                />
              )}
            </div>

            {/* Emoji Reactions or "Be the first to rate" CTA */}
            <div className="w-full">
              {emojiReactions.length > 0 ? (
                <EmojiReactions
                  reactions={emojiReactions}
                  onReact={handleQuickReact}
                  showAddButton={true}
                  ratingMode={true}
                  onRatingOpen={handleEmojiRatingClick}
                />
              ) : (
                <button
                  onClick={() => handleEmojiRatingClick('')}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  be the first to rate
                </button>
              )}
            </div>
          </CardFooter>
        </div>
      </Card>

      {/* Hidden Emoji Rating Popover for clicking on emoji reactions */}
      <div className="pointer-events-none">
        <EmojiRatingPopover
          onSubmit={handleEmojiRating}
          isSubmitting={createEmojiRatingMutation.isPending}
          vibeTitle={vibe.title}
          emojiMetadata={emojiMetadataRecord}
          preSelectedEmoji={selectedEmojiForRating || undefined}
          preSelectedValue={preselectedRatingValue || undefined}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEmojiForRating(null);
              setPreselectedRatingValue(null);
            }
          }}
        >
          <button
            ref={(el) => {
              if (el && showEmojiRatingPopover && selectedEmojiForRating) {
                el.click();
                setShowEmojiRatingPopover(false);
              }
            }}
            className="sr-only"
            aria-hidden="true"
          />
        </EmojiRatingPopover>
      </div>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to rate vibes"
        description="join vibechecc to share your reactions and ratings with the community"
      />
    </>
  );
}
