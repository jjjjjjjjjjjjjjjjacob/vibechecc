import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import * as React from 'react';
import {
  useVibe,
  useAddRatingMutation,
  useVibesPaginated,
  useCreateEmojiRatingMutation,
  useEmojiMetadata,
  useTopEmojiRatings,
  useMostInteractedEmoji,
  useDeleteVibeMutation,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import { AlertTriangle, Edit, Trash2, Share2 } from '@/components/ui/icons';
import { ShareModal } from '@/components/social/share-modal';
import { VibeDetailSkeleton } from '@/components/skeletons/vibe-detail-skeleton';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import { useUser, SignedIn, SignedOut } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';
import { AuthPromptDialog } from '@/features/auth/components/auth-prompt-dialog';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import { RatingPopover } from '@/features/ratings/components/rating-popover';
import { EmojiRatingSelector } from '@/features/ratings/components/emoji-rating-selector';
import { EmojiRatingCycleDisplay } from '@/features/ratings/components/emoji-rating-cycle-display';
import { useVibeImageUrl } from '@/hooks/use-vibe-image-url';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Vibe } from '@vibechecc/types';

// Constants to avoid rollup issues with empty array literals
const EMPTY_ARRAY: never[] = [];

export const Route = createFileRoute('/vibes/$vibeId')({
  component: VibePage,
});

function VibePage() {
  const { vibeId } = Route.useParams();
  const { data: vibe, isLoading, error } = useVibe(vibeId);
  const location = useLocation();
  const { data: allVibesData } = useVibesPaginated(50);
  const { data: emojiMetadataArray } = useEmojiMetadata();
  const [review, setReview] = React.useState('');
  const { user: _user } = useUser();
  const addRatingMutation = useAddRatingMutation();
  const createEmojiRatingMutation = useCreateEmojiRatingMutation();
  const deleteVibeMutation = useDeleteVibeMutation();
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [_authDialogType, setAuthDialogType] = React.useState<'react' | 'rate'>(
    'react'
  );
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [preselectedRatingValue, setPreselectedRatingValue] = React.useState<
    number | null
  >(null);
  const [showRatingPopover, setShowRatingPopover] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

  // Get image URL (handles both legacy URLs and storage IDs)
  const { data: imageUrl, isLoading: isImageLoading } = useVibeImageUrl(
    vibe || {}
  );

  // Fetch real emoji rating data
  const { data: topEmojiRatings } = useTopEmojiRatings(vibeId, 5);
  const { data: mostInteractedEmojiData } = useMostInteractedEmoji(vibeId);

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

  // Convert emoji metadata array to record for easier lookup
  const emojiMetadataRecord = React.useMemo(() => {
    if (!emojiMetadataArray) return {};
    return emojiMetadataArray.reduce(
      (acc, metadata) => {
        acc[metadata.emoji] = {
          ...metadata,
          sentiment:
            metadata.sentiment ||
            ('neutral' as 'positive' | 'negative' | 'neutral'),
        };
        return acc;
      },
      {} as Record<string, (typeof emojiMetadataArray)[0]>
    );
  }, [emojiMetadataArray]);

  // Extract context keywords from vibe for emoji suggestions
  const _contextKeywords = React.useMemo(() => {
    if (!vibe) return [];

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

    // Add keywords from tags
    if (vibe.tags) {
      keywords.push(...vibe.tags.map((tag) => tag.toLowerCase()));
    }

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
  }, [vibe]);

  // Get similar vibes based on tags, creator, or fallback to recent vibes
  const similarVibes = React.useMemo(() => {
    const allVibes = allVibesData?.vibes ?? [];
    if (!vibe || !allVibes) return [];

    // Filter out the current vibe
    const otherVibes = allVibes.filter((v) => v.id !== vibe.id);

    // Simple similarity algorithm:
    // 1. Vibes with matching tags
    // 2. Vibes from the same creator
    // 3. Fallback to recent vibes

    const vibesWithTags = vibe.tags
      ? otherVibes.filter((v) =>
          v.tags?.some((tag) => vibe.tags?.includes(tag))
        )
      : EMPTY_ARRAY;

    const vibesFromSameCreator = otherVibes.filter(
      (v) => v.createdById === vibe.createdById
    );

    // Combine and deduplicate
    const similar = [...vibesWithTags, ...vibesFromSameCreator].filter(
      (v, index, arr) => arr.findIndex((item) => item.id === v.id) === index
    );

    // If we don't have enough similar vibes, add some recent ones
    if (similar.length < 4) {
      const recentVibes = otherVibes
        .filter((v) => !similar.some((s) => s.id === v.id))
        .slice(0, 4 - similar.length);
      similar.push(...recentVibes);
    }

    return similar.slice(0, 4); // Limit to 4 similar vibes
  }, [vibe, allVibesData?.vibes]);

  // Check if we're on the edit route
  const isEditRoute = location.pathname.endsWith('/edit');

  // If we're on the edit route, render only the outlet
  if (isEditRoute) {
    return <Outlet />;
  }

  if (isLoading) {
    return <VibeDetailSkeleton />;
  }

  if (error || !vibe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
          <p>failed to load vibe. it may not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Show deleted notice for deleted vibes
  if (vibe.isDeleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-destructive/10 rounded-full p-4">
                  <AlertTriangle className="text-destructive h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-destructive mb-2 text-2xl font-bold">
                    this vibe has been deleted
                  </h1>
                  <p className="text-muted-foreground">
                    this vibe is no longer available. it may have been removed
                    by the creator or for policy violations.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="mt-4"
                >
                  ← go back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const _averageRating = vibe.ratings.length
    ? vibe.ratings.reduce((sum: number, r) => sum + (r.value || 0), 0) /
      vibe.ratings.length
    : 0;

  const _handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    const rating = 3; // Default rating
    const emoji = '⭐'; // Default emoji

    try {
      await addRatingMutation.mutateAsync({
        vibeId: vibe.id,
        value: rating,
        emoji: emoji,
        review: review.trim() || 'No review provided',
      });
      setReview('');
      // We don't reset rating to allow the user to see what they rated

      // Show success toast
      toast.success(
        `vibe rated ${rating} stars! ${review.trim() ? 'review submitted.' : ''}`,
        {
          duration: 3000,
          icon: '✨',
        }
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit rating:', error);
      toast.error('failed to submit rating. please try again.', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  // Handle rating with popover (includes emoji option)
  const _handleRatingWithPopover = async (data: {
    rating: number;
    review: string;
    useEmojiRating?: boolean;
  }) => {
    try {
      await addRatingMutation.mutateAsync({
        vibeId: vibe.id,
        value: data.rating,
        emoji: '⭐', // Default star emoji
        review: data.review || 'No review provided',
      });

      // Show success toast
      toast.success(
        `vibe rated ${data.rating} star${data.rating === 1 ? '' : 's'}! review submitted.`,
        {
          duration: 3000,
          icon: '✨',
        }
      );

      // If user wants to add emoji rating, open emoji popover
      if (data.useEmojiRating) {
        // This will be handled by showing the emoji rating popover
        toast('Select an emoji to add emoji rating', {
          duration: 2000,
          icon: '👆',
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit rating:', error);
      throw error; // Re-throw to let popover handle error state
    }
  };

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
        value: data.value,
        review: data.review,
      });

      toast.success(
        `vibe rated ${data.value} ${data.emoji}! review submitted.`,
        {
          duration: 3000,
          icon: data.emoji,
        }
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit emoji rating:', error);
      throw error; // Re-throw to let popover handle error state
    }
  };

  const handleEmojiRatingClick = (emoji: string, value?: number) => {
    if (!_user?.id) {
      setAuthDialogType('rate');
      setShowAuthDialog(true);
      return;
    }

    setSelectedEmojiForRating(emoji);

    // If a specific value was provided, store it for the popover
    if (value !== undefined) {
      setPreselectedRatingValue(value);
    }

    setShowRatingPopover(true);
  };

  const handleDeleteVibe = async () => {
    if (!_user?.id || !vibe) return;

    if (
      confirm(
        'Are you sure you want to delete this vibe? This action cannot be undone.'
      )
    ) {
      try {
        await deleteVibeMutation.mutateAsync({ vibeId });
        toast.success('Vibe deleted successfully');
        // The query will automatically invalidate and refetch
      } catch {
        // Failed to delete vibe - already showing user-facing error toast
        toast.error('Failed to delete vibe. Please try again.');
      }
    }
  };

  // Check if current user owns this vibe
  const isOwner = _user?.id && vibe && vibe.createdById === _user.id;

  return (
    <div className="container mx-auto mb-8">
      <div className="grid w-full grid-cols-3 gap-8 transition-all duration-300">
        {/* Main Content */}
        <div className="col-span-3 w-full transition-all duration-300 sm:col-span-2">
          {/* Main Vibe Card */}
          <div className="relative mb-6 overflow-hidden rounded-lg">
            {/* Main Image */}
            <div className="relative aspect-video">
              {imageUrl && !isImageLoading ? (
                <img
                  src={imageUrl}
                  alt={vibe.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <SimpleVibePlaceholder title={vibe.title} />
              )}
            </div>
          </div>

          {/* Tags */}
          {vibe.tags && vibe.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {vibe.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    to="/search"
                    search={{ q: tag }}
                    className="inline-block"
                  >
                    <Badge
                      variant="secondary"
                      className="hover:bg-secondary/80 cursor-pointer text-xs transition-colors"
                    >
                      {tag.toLowerCase()}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Title with Emoji Rating */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold lowercase">{vibe.title}</h1>
              {mostInteractedEmoji ? (
                <EmojiRatingDisplay
                  rating={mostInteractedEmoji}
                  showScale={true}
                  onEmojiClick={handleEmojiRatingClick}
                  size="lg"
                />
              ) : (
                <div className="mt-2">
                  <EmojiRatingCycleDisplay
                    onSubmit={handleEmojiRating}
                    isSubmitting={createEmojiRatingMutation.isPending}
                    vibeTitle={vibe.title}
                    emojiMetadata={emojiMetadataRecord}
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Share button - always visible */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                share
              </Button>

              {/* Edit/Delete buttons for vibe owner */}
              {isOwner && (
                <>
                  <Link
                    to="/vibes/$vibeId/edit"
                    params={{ vibeId }}
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteVibe}
                    disabled={deleteVibeMutation.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteVibeMutation.isPending ? 'deleting...' : 'delete'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Top Emoji Ratings */}
          {emojiRatings.length > 0 ? (
            <div className="bg-secondary/20 mb-6 rounded-lg p-4">
              <h3 className="text-muted-foreground mb-3 text-sm font-medium">
                top ratings
              </h3>
              <div className="space-y-2">
                {/* First 3 ratings always visible */}
                {emojiRatings.slice(0, 3).map((rating, index) => (
                  <div key={`${rating.emoji}-${index}`}>
                    <EmojiRatingDisplay
                      rating={rating}
                      showScale={true}
                      onEmojiClick={handleEmojiRatingClick}
                    />
                  </div>
                ))}

                {/* Accordion for remaining ratings */}
                {emojiRatings.length > 3 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="more-ratings" className="border-none">
                      <AccordionTrigger className="text-muted-foreground hover:text-foreground py-2 text-xs transition-colors hover:no-underline">
                        {emojiRatings.length - 3} more
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                        {emojiRatings.slice(3).map((rating, index) => (
                          <div key={`${rating.emoji}-${index + 3}`}>
                            <EmojiRatingDisplay
                              rating={rating}
                              showScale={true}
                              onEmojiClick={handleEmojiRatingClick}
                            />
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-secondary/20 mb-6 rounded-lg p-4 text-center">
              <p className="text-muted-foreground mb-2 text-sm">
                no ratings yet
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!_user?.id) {
                    setAuthDialogType('rate');
                    setShowAuthDialog(true);
                  } else {
                    // Scroll to rating selector or open emoji picker
                    const ratingSection = document.querySelector(
                      '[data-rating-selector]'
                    );
                    ratingSection?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                be the first to rate
              </Button>
            </div>
          )}

          {/* Creator Info */}
          <div className="mb-6 flex items-center">
            {vibe.createdBy && vibe.createdBy.username ? (
              <Link
                to="/users/$username"
                params={{ username: vibe.createdBy.username }}
                className="flex items-center transition-opacity hover:opacity-80"
              >
                <Avatar className="mr-3 h-10 w-10">
                  <AvatarImage
                    src={getUserAvatarUrl(vibe.createdBy)}
                    alt={computeUserDisplayName(vibe.createdBy)}
                  />
                  <AvatarFallback>
                    {getUserInitials(vibe.createdBy)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="hover:text-foreground/80 font-medium">
                    originally vibed by {computeUserDisplayName(vibe.createdBy)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(vibe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ) : (
              <>
                <Avatar className="mr-3 h-10 w-10">
                  <AvatarFallback>??</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Unknown User</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(vibe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {vibe.description}
          </p>

          {/* Rate & Review This Vibe */}
          <div className="mb-6" data-rating-selector>
            <SignedIn>
              <EmojiRatingSelector
                topEmojis={emojiRatings}
                onSubmit={handleEmojiRating}
                isSubmitting={createEmojiRatingMutation.isPending}
                vibeTitle={vibe.title}
                emojiMetadata={emojiMetadataRecord}
              />
            </SignedIn>

            <SignedOut>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold lowercase">
                  rate & review this vibe
                </h3>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setAuthDialogType('rate');
                    setShowAuthDialog(true);
                  }}
                >
                  <span className="mr-2 text-2xl">❓</span>
                  sign in to rate with an emoji
                </Button>
              </div>
            </SignedOut>
          </div>

          {/* Reviews */}
          <Card className="m-0 border-none bg-transparent">
            <CardContent className="p-0">
              <h2 className="mb-4 text-xl font-bold lowercase">reviews</h2>
              {vibe.ratings.filter((r) => r.review).length > 0 ? (
                <div className="space-y-2">
                  {vibe.ratings
                    .filter((r) => r.review)
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((rating, index) => {
                      const anchorId = rating._id
                        ? `rating-${rating._id}`
                        : `rating-${index}`;
                      const hasUsername = !!(
                        rating.user && rating.user.username
                      );
                      const displayName = computeUserDisplayName(rating.user);
                      const username = rating.user?.username;

                      return (
                        <div
                          key={index}
                          id={anchorId}
                          className="hover:bg-secondary/40 bg-secondary/20 group rounded-lg p-3 transition-colors"
                        >
                          <a
                            href={`#${anchorId}`}
                            className="anchor"
                            aria-label="Permalink to this review"
                          />
                          <div className="flex items-start gap-3">
                            {hasUsername ? (
                              <Link
                                to="/users/$username"
                                params={{ username: username! }}
                                className="flex-shrink-0 transition-opacity hover:opacity-80"
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={getUserAvatarUrl(rating.user)}
                                    alt={displayName}
                                  />
                                  <AvatarFallback>
                                    {getUserInitials(rating.user)}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                            ) : (
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage
                                  src={getUserAvatarUrl(rating.user)}
                                  alt={displayName}
                                />
                                <AvatarFallback>
                                  {getUserInitials(rating.user)}
                                </AvatarFallback>
                              </Avatar>
                            )}

                            <div className="min-w-0 flex-1">
                              {/* Header */}
                              <div className="mb-2 flex items-center gap-2">
                                {hasUsername ? (
                                  <Link
                                    to="/users/$username"
                                    params={{ username: username! }}
                                    className="truncate text-sm font-medium transition-opacity hover:opacity-80"
                                  >
                                    @{username}
                                  </Link>
                                ) : (
                                  <span className="truncate text-sm font-medium">
                                    {displayName}
                                  </span>
                                )}
                                <span className="text-muted-foreground text-xs">
                                  {new Date(
                                    rating.createdAt || Date.now()
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Review Text */}
                              {rating.review && (
                                <div className="mb-2">
                                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                                    {rating.review}
                                  </p>
                                </div>
                              )}

                              {/* Rating */}
                              <div className="flex items-center justify-between">
                                <EmojiRatingDisplay
                                  rating={{
                                    emoji: rating.emoji || '😊',
                                    value: rating.value || 3,
                                    count: undefined,
                                  }}
                                  showScale={false}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    no written reviews yet
                  </p>
                  <p className="text-muted-foreground text-sm">
                    be the first to review this vibe!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Similar Vibes Sidebar */}
        <div className="col-span-1 hidden overflow-y-auto sm:block">
          <div className="sticky">
            <div className="space-y-4">
              {similarVibes.map((similarVibe) => (
                <VibeCard
                  key={similarVibe.id}
                  vibe={similarVibe as Vibe}
                  compact={true}
                />
              ))}
              {similarVibes.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  <p>no similar vibes found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="sign in to rate"
        description="you must sign in to rate and review vibes"
      />

      {/* Emoji Rating Popover for clicking on top ratings */}
      <RatingPopover
        open={showRatingPopover}
        onSubmit={handleEmojiRating}
        isSubmitting={createEmojiRatingMutation.isPending}
        vibeTitle={vibe.title}
        emojiMetadata={emojiMetadataRecord}
        preSelectedEmoji={selectedEmojiForRating || undefined}
        preSelectedValue={preselectedRatingValue || undefined}
        onOpenChange={(open) => {
          setShowRatingPopover(open);
          if (!open) {
            setSelectedEmojiForRating(null);
            setPreselectedRatingValue(null);
          }
        }}
      >
        <div />
      </RatingPopover>

      {/* Share Modal */}
      {vibe && vibe.createdBy && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          vibe={vibe}
          author={vibe.createdBy}
          ratings={vibe.ratings || []}
        />
      )}
    </div>
  );
}

export default VibePage;
