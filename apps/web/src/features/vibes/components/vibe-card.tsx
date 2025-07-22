import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/utils/tailwind-utils';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import { EmojiReactions } from '@/components/emoji-reaction';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from '@/hooks/usePostHog';
import {
  useTopEmojiRatings,
  useMostInteractedEmoji,
  useCreateEmojiRatingMutation,
  useEmojiMetadata,
} from '@/queries';
import toast from 'react-hot-toast';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import type { Vibe, EmojiReaction } from '@/types';
import {
  EmojiRatingDisplay,
  TopEmojiRatings,
  getMostInteractedEmojiRating,
} from '@/components/emoji-rating-display';
import { EmojiRatingPopover } from '@/components/emoji-rating-popover';
import { ChevronDown } from 'lucide-react';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import { AllEmojiRatingsPopover } from '@/components/all-emoji-ratings-popover';

interface VibeCardProps {
  vibe: Vibe;
  compact?: boolean;
}

export function VibeCard({ vibe, compact }: VibeCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const reactions = vibe.reactions ?? [];
  const [showAllRatingsPopover, setShowAllRatingsPopover] =
    React.useState(false);
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [showEmojiRatingPopover, setShowEmojiRatingPopover] =
    React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const { user } = useUser();
  const { trackEvents } = usePostHog();
  const createEmojiRatingMutation = useCreateEmojiRatingMutation();
  const { data: emojiMetadataArray } = useEmojiMetadata();

  // Fetch emoji rating data
  const { data: topEmojiRatings } = useTopEmojiRatings(vibe.id, 5);
  const { data: mostInteractedEmojiData } = useMostInteractedEmoji(vibe.id);

  // Determine if we should use a placeholder
  const usePlaceholder = !vibe.image || imageError;

  // Transform backend emoji ratings to display format
  const emojiRatings = React.useMemo(() => {
    if (!topEmojiRatings || topEmojiRatings.length === 0) {
      // Fallback to reactions if no emoji ratings exist
      return reactions
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((reaction) => ({
          emoji: reaction.emoji,
          value: 3, // Default value for reactions
          count: reaction.count,
        }));
    }

    return topEmojiRatings.map((rating) => ({
      emoji: rating.emoji,
      value: rating.averageValue,
      count: rating.count,
      tags: rating.tags,
    }));
  }, [topEmojiRatings, reactions]);

  // Use backend data for most interacted emoji, fallback to reactions
  const mostInteractedEmoji = React.useMemo(() => {
    if (mostInteractedEmojiData && mostInteractedEmojiData.averageValue) {
      return {
        emoji: mostInteractedEmojiData.emoji,
        value: mostInteractedEmojiData.averageValue,
        count: mostInteractedEmojiData.count,
      };
    }
    // Fallback to reaction-based calculation
    return getMostInteractedEmojiRating(reactions);
  }, [mostInteractedEmojiData, reactions]);

  // Extract context keywords from vibe for emoji suggestions
  const contextKeywords = React.useMemo(() => {
    const keywords: string[] = [];

    // Extract words from title and description
    const titleWords = vibe.title
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2);
    const descriptionWords =
      vibe.description
        ?.toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2) ?? [];

    keywords.push(...titleWords, ...descriptionWords);

    // Add some context-based keywords based on common patterns
    const title = vibe.title.toLowerCase();
    const description = vibe.description?.toLowerCase() || '';

    // Add contextual keywords based on content analysis
    if (
      title.includes('money') ||
      title.includes('rich') ||
      title.includes('expensive') ||
      description.includes('money')
    ) {
      keywords.push('money', 'rich', 'expensive');
    }
    if (
      title.includes('time') ||
      title.includes('clock') ||
      title.includes('fast') ||
      description.includes('time')
    ) {
      keywords.push('time', 'fast', 'speed');
    }
    if (
      title.includes('love') ||
      title.includes('heart') ||
      description.includes('love')
    ) {
      keywords.push('love', 'heart');
    }
    if (
      title.includes('fire') ||
      title.includes('hot') ||
      description.includes('fire')
    ) {
      keywords.push('fire', 'hot', 'amazing');
    }

    return [...new Set(keywords)]; // Remove duplicates
  }, [vibe.title, vibe.description]);

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
    try {
      await createEmojiRatingMutation.mutateAsync({
        vibeId: vibe.id,
        emoji: data.emoji,
        emojiValue: data.value,
        review: data.review,
        rating: data.value, // Use emoji value as star rating
      });

      toast.success(
        `vibe rated ${data.value} ${data.emoji}! review submitted.`,
        {
          duration: 3000,
          icon: data.emoji,
        }
      );
    } catch (error) {
      throw error; // Re-throw to let popover handle error state
    }
  };

  const handleEmojiRatingClick = (emoji: string) => {
    if (!user?.id) {
      setShowAuthDialog(true);
      return;
    }
    setSelectedEmojiForRating(emoji);
    setShowEmojiRatingPopover(true);
  };

  // Handle emoji reactions
  const handleReact = (emoji: string) => {
    if (!user?.id) {
      setShowAuthDialog(true);
      return;
    }

    // Instead of just adding a reaction, open the rating popover with the emoji pre-selected
    handleEmojiRatingClick(emoji);
  };

  return (
    <>
      <Card
        className={cn(
          'overflow-hidden transition-all duration-200 hover:shadow-md',
          !compact && 'h-full'
        )}
      >
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
              'flex flex-col items-start gap-2 p-4 pt-0',
              compact && 'p-3 pt-0'
            )}
          >
            <div className="flex w-full flex-col items-center justify-between gap-2">
              {mostInteractedEmoji && (
                <div className="flex items-end gap-1">
                  <EmojiRatingDisplay
                    rating={mostInteractedEmoji}
                    mode="compact"
                    showScale={true}
                    onEmojiClick={handleEmojiRatingClick}
                  />
                  {emojiRatings.length > 1 && (
                    <AllEmojiRatingsPopover
                      emojiRatings={emojiRatings}
                      onEmojiClick={handleEmojiRatingClick}
                      open={showAllRatingsPopover}
                      onOpenChange={setShowAllRatingsPopover}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAllRatingsPopover(true);
                        }}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-xs transition-colors"
                      >
                        <ChevronDown className="h-3 w-3" />
                        <span>{emojiRatings.length - 1} more</span>
                      </button>
                    </AllEmojiRatingsPopover>
                  )}
                </div>
              )}

              {reactions.length > 0 && (
                <div
                  className="w-full"
                  onClick={(e) => {
                    // Prevent navigation when clicking reactions
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2">
                    {vibe.createdBy && vibe.createdBy.username ? (
                      <Link
                        to="/users/$username"
                        params={{ username: vibe.createdBy.username }}
                        className="flex items-center gap-2 transition-opacity hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={getUserAvatarUrl(vibe.createdBy)}
                            alt={computeUserDisplayName(vibe.createdBy)}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {getUserInitials(vibe.createdBy)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground hover:text-foreground text-xs">
                          {computeUserDisplayName(vibe.createdBy)}
                        </span>
                      </Link>
                    ) : (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={getUserAvatarUrl(vibe.createdBy)}
                            alt={computeUserDisplayName(vibe.createdBy)}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {getUserInitials(vibe.createdBy)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground text-xs">
                          {vibe.createdBy
                            ? computeUserDisplayName(vibe.createdBy)
                            : 'Unknown User'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
              <EmojiReactions
                reactions={reactions}
                onReact={handleReact}
                showAddButton={true}
                contextKeywords={contextKeywords}
              />
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
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEmojiForRating(null);
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
