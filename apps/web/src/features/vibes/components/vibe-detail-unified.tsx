import * as React from 'react';
import { Link } from '@tanstack/react-router';
import type { Id } from '@vibechecc/convex/dataModel';
import type { Vibe } from '@vibechecc/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/utils/tailwind-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import { VibeCardV2 } from '@/features/vibes/components/vibe-card';
import { Edit, Trash2, Expand } from 'lucide-react';
import { ShareButton } from '@/components/social/share-button';
import { VibeVotingButton } from '@/features/vibes/components/vibe-voting-button';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import { RevolvingRateReviewButton } from '@/features/ratings/components/revolving-rate-review-button';
import { ReviewCard } from '@/features/ratings/components/review-card';
import {
  EmojiReactionsRow,
  type EmojiRatingData,
  type UnifiedEmojiRatingHandler,
} from '@/features/ratings/components/emoji-reaction';
import { AllRatingsPopover } from '@/features/ratings/components/all-emoji-ratings-popover';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import { getConsistentGradient, gradientPresets } from '@/utils/gradient-utils';
import {
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
} from '@clerk/tanstack-react-start';
import {
  useBulkRatingVoteScores,
  useBulkUserRatingVoteStatuses,
} from '@/queries';

interface VibeDetailUnifiedProps {
  vibe: Vibe;
  imageUrl: string | null | undefined;
  isImageLoading: boolean;
  isOwner: boolean;
  mostInteractedEmoji: {
    emoji: string;
    value: number;
    count: number;
  } | null;
  emojiRatings: Array<{
    emoji: string;
    value: number;
    count: number;
    tags?: string[];
  }>;
  emojiMetadataRecord: Record<
    string,
    {
      emoji: string;
      sentiment?: 'positive' | 'negative' | 'neutral';
      tags?: string[];
      category: string;
    }
  >;
  onEmojiRatingClick: (emoji: string, value?: number) => void;
  onDelete: () => Promise<void>;
  onShare: () => void;
  isPendingDelete: boolean;
  allRatings: Array<{
    _id?: string;
    vibeId: string;
    userId: string;
    emoji?: string;
    value?: number;
    review?: string;
    createdAt?: string;
    updatedAt?: string;
    user?: {
      id: string;
      externalId: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
    };
  }>;
  variant: 'mobile' | 'desktop';
  similarVibes?: Array<Vibe>;
}

export function VibeDetailUnified({
  vibe,
  imageUrl,
  isImageLoading,
  isOwner,
  mostInteractedEmoji,
  emojiRatings,
  emojiMetadataRecord,
  onEmojiRatingClick,
  onDelete,
  onShare: _onShare,
  isPendingDelete,
  allRatings,
  variant,
  similarVibes = [],
}: VibeDetailUnifiedProps) {
  const { user } = useUser();
  const [showImageDialog, setShowImageDialog] = React.useState(false);
  const [ratingsSortBy, setRatingsSortBy] = React.useState<
    'newest' | 'oldest' | 'highest' | 'lowest'
  >('newest');

  // Emoji cycling animation for "be the first to rate" CTA
  const DEFAULT_EMOJIS = [
    '👀',
    '😍',
    '🔥',
    '😱',
    '💯',
    '😂',
    '🤩',
    '😭',
    '🥺',
    '🤔',
  ];

  // Start at a random emoji index for visual variety
  const [currentEmojiIndex, setCurrentEmojiIndex] = React.useState(() =>
    Math.floor(Math.random() * DEFAULT_EMOJIS.length)
  );
  const [emojiTransition, setEmojiTransition] = React.useState<
    'in' | 'out' | 'idle'
  >('idle');

  // Get current emoji
  const currentEmoji = DEFAULT_EMOJIS[currentEmojiIndex];

  // Generate a random initial delay between 0-2000ms for staggering
  const randomInitialDelay = React.useMemo(
    () => Math.floor(Math.random() * 2000),
    []
  );

  // Cycle through emojis with CSS transitions
  React.useEffect(() => {
    const startCycling = () => {
      const interval = setInterval(() => {
        setEmojiTransition('out');

        setTimeout(() => {
          setCurrentEmojiIndex((prev) => (prev + 1) % DEFAULT_EMOJIS.length);
          setEmojiTransition('in');

          setTimeout(() => {
            setEmojiTransition('idle');
          }, 300);
        }, 150);
      }, 2500);

      return interval;
    };

    // Use the random initial delay for staggered animations
    if (randomInitialDelay > 0) {
      let interval: NodeJS.Timeout | null = null;

      const delayTimeout = setTimeout(() => {
        interval = startCycling();
      }, randomInitialDelay);

      return () => {
        clearTimeout(delayTimeout);
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      const interval = startCycling();
      return () => clearInterval(interval);
    }
  }, [randomInitialDelay, DEFAULT_EMOJIS.length]);

  const ratingIds = React.useMemo(() => {
    if (!allRatings) return [];
    return allRatings.filter((r) => r._id).map((r) => r._id as Id<'ratings'>);
  }, [allRatings]);

  const { data: voteScores } = useBulkRatingVoteScores(ratingIds);
  const { data: voteStatuses } = useBulkUserRatingVoteStatuses(ratingIds);

  // Sort ratings based on selected sort option
  const sortedRatings = [...allRatings].sort((a, b) => {
    switch (ratingsSortBy) {
      case 'newest':
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      case 'oldest':
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      case 'highest':
        return (b.value || 0) - (a.value || 0);
      case 'lowest':
        return (a.value || 0) - (b.value || 0);
      default:
        return 0;
    }
  });

  const isMobile = variant === 'mobile';

  // Convert to unified handler format
  const handleUnifiedEmojiRating: UnifiedEmojiRatingHandler = async (data) => {
    return Promise.resolve(onEmojiRatingClick(data.emoji, data.value));
  };

  // Convert emoji ratings to EmojiRatingData format
  const emojiRatingData: EmojiRatingData[] = emojiRatings.map((rating) => ({
    emoji: rating.emoji,
    value: rating.value,
    count: rating.count,
    tags: rating.tags,
  }));

  // Auto-generate gradient if missing (for vibes without images) OR get preset textContrast
  const autoGradient = React.useMemo(() => {
    if (!vibe.gradientFrom && !vibe.gradientTo && !imageUrl) {
      return getConsistentGradient(vibe.id);
    }

    // Check if existing gradient matches a preset to use its fixed textContrast
    if (vibe.gradientFrom && vibe.gradientTo) {
      const matchingPreset = gradientPresets.find(
        (preset) =>
          preset.from === vibe.gradientFrom && preset.to === vibe.gradientTo
      );
      if (matchingPreset) {
        return matchingPreset;
      }
    }

    return null;
  }, [vibe.gradientFrom, vibe.gradientTo, imageUrl, vibe.id]); // Include vibe.id for consistent generation

  // Calculate aspect ratios
  const hasImage = imageUrl && !isImageLoading;
  const hasGradient = vibe.gradientFrom || vibe.gradientTo || autoGradient;
  const showVisual = hasImage || hasGradient;

  // For images: use object-cover up to 4:3 max ratio, expandable
  // For gradients: fixed 4:3 ratio, not expandable
  const getAspectRatio = () => {
    if (hasGradient && !hasImage) {
      return 'aspect-[4/3]'; // Fixed 4:3 for gradients (landscape)
    }
    return 'aspect-[4/3] max-h-[60vh]'; // Up to 4:3 for images with max height
  };

  // Render the main visual (image or gradient) without overlay
  const renderMainVisual = () => {
    if (!showVisual) return null;

    const visual = (
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg',
          getAspectRatio(),
          isMobile ? 'mb-4' : 'mb-6'
        )}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt={vibe.title}
            className="h-full w-full object-cover transition-all duration-200 hover:scale-[1.005]"
          />
        ) : (
          <SimpleVibePlaceholder
            title={vibe.title}
            gradientFrom={vibe.gradientFrom || autoGradient?.from}
            gradientTo={vibe.gradientTo || autoGradient?.to}
            gradientDirection={
              vibe.gradientDirection || autoGradient?.direction
            }
            textContrastMode={
              vibe.textContrastMode ||
              (autoGradient?.textContrast as 'light' | 'dark' | undefined)
            }
            hideText={false}
          />
        )}

        {/* Expand button for images only */}
        {hasImage && (
          <div
            className={cn(
              'absolute rounded-full bg-black/50 p-2',
              isMobile ? 'top-2 right-2' : 'top-3 right-3'
            )}
          >
            <Expand className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    );

    // Wrap with dialog only for images
    if (hasImage) {
      return (
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogTrigger asChild>
            <div className="cursor-pointer">{visual}</div>
          </DialogTrigger>
          <DialogContent className="overflow-auto rounded-xl border-none bg-black p-0 [&>button]:absolute [&>button]:top-4 [&>button]:right-4 [&>button]:z-50 [&>button]:text-white [&>button]:hover:bg-white/20">
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={imageUrl}
                alt={vibe.title}
                className="max-h-full max-w-full object-contain"
                onLoad={() => {
                  /* Image loaded */
                }}
                onError={() => {
                  /* Image error */
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return visual;
  };

  // Render user info section
  const renderUserInfo = () => {
    if (!vibe.createdBy) return null;

    return (
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vibe.createdBy.username ? (
            <Link
              to="/users/$username"
              params={{ username: vibe.createdBy.username }}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <Avatar className={isMobile ? 'h-10 w-10' : 'h-12 w-12'}>
                <AvatarImage
                  src={getUserAvatarUrl(vibe.createdBy)}
                  alt={computeUserDisplayName(vibe.createdBy)}
                  className="object-cover"
                />
                <AvatarFallback>
                  {getUserInitials(vibe.createdBy)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {computeUserDisplayName(vibe.createdBy)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {new Date(vibe.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className={isMobile ? 'h-10 w-10' : 'h-12 w-12'}>
                <AvatarFallback>??</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">unknown user</p>
                <p className="text-muted-foreground text-sm">
                  {new Date(vibe.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <ShareButton
            contentType="vibe"
            variant="ghost"
            size="sm"
            vibe={vibe}
            author={vibe.createdBy || undefined}
            ratings={emojiRatings}
          />

          {isOwner ? (
            <>
              <Link
                to="/vibes/$vibeId/edit"
                params={{ vibeId: vibe.id }}
                className="inline-block"
              >
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isPendingDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <VibeVotingButton
              vibeId={vibe.id as Id<'vibes'>}
              currentBoostScore={vibe.boostScore || 0}
              variant="ghost"
              size="sm"
              isOwnContent={false}
            />
          )}
        </div>
      </div>
    );
  };

  // Render content section (title, description, tags)
  const renderContent = () => (
    <div className={cn('mb-6', isMobile && 'mb-4')}>
      {/* Title */}
      <h1
        className={cn(
          'mb-4 leading-tight font-bold lowercase',
          isMobile ? 'text-2xl' : 'text-4xl'
        )}
      >
        {vibe.title}
      </h1>

      {/* Description */}
      {vibe.description && (
        <p
          className={cn(
            'text-muted-foreground mb-4 leading-relaxed',
            isMobile ? 'text-base' : 'text-lg'
          )}
        >
          {vibe.description}
        </p>
      )}

      {/* Tags */}
      {vibe.tags && vibe.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {vibe.tags.map((tag: string) => (
            <Link key={tag} to="/search" search={{ q: tag }}>
              <Badge
                variant="secondary"
                className="hover:bg-secondary/80 cursor-pointer transition-colors"
              >
                {tag.toLowerCase()}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // Render fallback content when no visual is available (now empty since we use the new structure)
  const renderFallbackContent = () => {
    // No longer needed - we now use the separate render functions for consistent layout
    return null;
  };

  // Render unified layout for both mobile and desktop
  return (
    <div className={cn(isMobile ? 'min-h-screen' : 'container mx-auto mb-8')}>
      {isMobile ? (
        // Mobile layout with full-height container
        <div className="flex min-h-screen flex-col p-4">
          {/* Main visual without overlay */}
          {renderMainVisual()}

          {/* Fallback content when no visual */}
          {renderFallbackContent()}

          {/* User info and action buttons */}
          {renderUserInfo()}

          {/* Content section */}
          {renderContent()}

          {/* Rating Section */}
          <div className={cn('border-t pt-4', showVisual && 'mt-4')}>
            {/* Most Rated Display */}
            {mostInteractedEmoji && (
              <span className="text-muted-foreground mb-3 block text-xs font-semibold">
                most rated
              </span>
            )}

            <div className="mb-4 flex w-full items-center justify-between">
              {mostInteractedEmoji ? (
                <div className="flex items-center gap-2">
                  <EmojiRatingDisplay
                    rating={mostInteractedEmoji}
                    vibeId={vibe.id}
                    onEmojiClick={async (data) => {
                      onEmojiRatingClick(data.emoji, data.value);
                    }}
                    variant="scale"
                    existingUserRatings={vibe.currentUserRatings || []}
                    emojiMetadata={emojiMetadataRecord}
                  />
                  {emojiRatingData.length > 1 && (
                    <AllRatingsPopover
                      ratings={emojiRatingData}
                      onEmojiClick={handleUnifiedEmojiRating}
                      vibeTitle={vibe.title}
                      vibeId={vibe.id}
                      visibleCount={1}
                      existingUserRatings={vibe.currentUserRatings || []}
                      emojiMetadata={emojiMetadataRecord || {}}
                    />
                  )}
                </div>
              ) : (
                <SignedIn>
                  {isOwner ? (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-muted-foreground text-sm">
                        you cannot rate your own vibe
                      </p>
                    </div>
                  ) : (
                    <RevolvingRateReviewButton
                      vibeId={vibe.id}
                      topEmojis={emojiRatings}
                      vibeTitle={vibe.title}
                      emojiMetadata={emojiMetadataRecord}
                      existingUserRatings={vibe.currentUserRatings ?? []}
                      isOwner={isOwner}
                    />
                  )}
                </SignedIn>
              )}

              {!mostInteractedEmoji && (
                <SignedOut>
                  <div className="p-4 text-center">
                    <div className="mb-3 flex items-center justify-center gap-2">
                      <div className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
                        <span
                          key={currentEmoji}
                          className={cn(
                            'absolute text-base transition-all duration-300 ease-out',
                            emojiTransition === 'in' &&
                              'animate-emoji-slide-in',
                            emojiTransition === 'out' &&
                              'animate-emoji-slide-out',
                            emojiTransition === 'idle' &&
                              'transform-none opacity-100'
                          )}
                        >
                          {currentEmoji}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        be the first to rate this vibe
                      </p>
                    </div>
                    <SignInButton mode="modal">
                      <Button size="sm" variant="outline">
                        sign in to rate
                      </Button>
                    </SignInButton>
                  </div>
                </SignedOut>
              )}
            </div>

            {/* Emoji Reactions Row */}
            {emojiRatingData.length > 0 && (
              <EmojiReactionsRow
                reactions={emojiRatingData}
                onEmojiClick={handleUnifiedEmojiRating}
                vibeTitle={vibe.title}
                vibeId={vibe.id}
                maxReactions={6}
                existingUserRatings={vibe.currentUserRatings || []}
                emojiMetadata={emojiMetadataRecord || {}}
                vibe={vibe}
                author={vibe.createdBy || undefined}
                optimizeForTouch={true}
                isMobile={isMobile}
                shareCount={vibe.shareCount}
              />
            )}
          </div>

          {/* Reviews Section - Mobile */}
          <div className="mt-6 border-t pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">
                reviews ({allRatings.length})
              </h3>
              {allRatings.length > 0 && (
                <Select
                  value={ratingsSortBy}
                  onValueChange={(
                    value: 'newest' | 'oldest' | 'highest' | 'lowest'
                  ) => setRatingsSortBy(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">newest</SelectItem>
                    <SelectItem value="oldest">oldest</SelectItem>
                    <SelectItem value="highest">highest</SelectItem>
                    <SelectItem value="lowest">lowest</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3">
              {allRatings.length > 0 ? (
                sortedRatings.map((rating, index) => {
                  return (
                    <ReviewCard
                      key={rating._id || index}
                      rating={rating}
                      vibe={vibe}
                      currentUserId={user?.id}
                      voteScore={voteScores?.[rating._id || '']}
                      voteStatus={voteStatuses?.[rating._id || '']}
                      onEmojiClick={handleUnifiedEmojiRating}
                      emojiMetadata={emojiMetadataRecord}
                      isOwnRating={rating.user?.externalId === user?.id}
                      showActions={true}
                    />
                  );
                })
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <p className="mb-3 text-sm">no reviews yet</p>
                  <p className="text-xs">be the first to share your thoughts</p>
                </div>
              )}

              {/* Leave a Review CTA */}
              <div className="mt-3">
                <div className="bg-secondary/10 border-border/50 rounded-lg border p-4 text-center">
                  <SignedIn>
                    {isOwner ? (
                      <p className="text-muted-foreground text-sm">
                        you cannot review your own vibe
                      </p>
                    ) : (
                      <div>
                        <p className="text-muted-foreground mb-3 text-sm">
                          share your thoughts
                        </p>
                        <RevolvingRateReviewButton
                          vibeId={vibe.id}
                          topEmojis={emojiRatings}
                          vibeTitle={vibe.title}
                          emojiMetadata={emojiMetadataRecord}
                          existingUserRatings={vibe.currentUserRatings ?? []}
                          isOwner={isOwner}
                        />
                      </div>
                    )}
                  </SignedIn>
                  <SignedOut>
                    <div>
                      <p className="text-muted-foreground mb-3 text-sm">
                        sign in to leave a review
                      </p>
                      <SignInButton mode="modal">
                        <Button size="sm" variant="outline">
                          sign in
                        </Button>
                      </SignInButton>
                    </div>
                  </SignedOut>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Desktop layout with sidebar
        <div className="grid w-full grid-cols-3 gap-8 transition-all duration-300">
          {/* Main Content */}
          <div className="col-span-3 w-full transition-all duration-300 sm:col-span-2">
            {/* Main visual without overlay */}
            {renderMainVisual()}

            {/* Fallback content when no visual */}
            {renderFallbackContent()}

            {/* User info and action buttons */}
            {renderUserInfo()}

            {/* Content section */}
            {renderContent()}

            {/* Rating Section - Desktop */}
            {(showVisual || !showVisual) && (
              <div className="mb-6">
                {/* Most Rated Display */}
                {mostInteractedEmoji && (
                  <span className="text-muted-foreground mb-3 block text-sm font-semibold">
                    most rated
                  </span>
                )}

                <div className="mb-4 flex w-full items-center justify-between">
                  {mostInteractedEmoji ? (
                    <div className="flex items-center gap-3">
                      <EmojiRatingDisplay
                        rating={mostInteractedEmoji}
                        vibeId={vibe.id}
                        onEmojiClick={async (data) => {
                          onEmojiRatingClick(data.emoji, data.value);
                        }}
                        variant="scale"
                        existingUserRatings={vibe.currentUserRatings || []}
                        emojiMetadata={emojiMetadataRecord}
                        size="lg"
                      />
                      {emojiRatingData.length > 1 && (
                        <AllRatingsPopover
                          ratings={emojiRatingData}
                          onEmojiClick={handleUnifiedEmojiRating}
                          vibeTitle={vibe.title}
                          vibeId={vibe.id}
                          visibleCount={1}
                          existingUserRatings={vibe.currentUserRatings || []}
                          emojiMetadata={emojiMetadataRecord || {}}
                        />
                      )}
                    </div>
                  ) : (
                    <SignedIn>
                      {isOwner ? (
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground">
                            you cannot rate your own vibe
                          </p>
                        </div>
                      ) : (
                        <RevolvingRateReviewButton
                          vibeId={vibe.id}
                          topEmojis={emojiRatings}
                          vibeTitle={vibe.title}
                          emojiMetadata={emojiMetadataRecord}
                          existingUserRatings={vibe.currentUserRatings ?? []}
                          isOwner={isOwner}
                        />
                      )}
                    </SignedIn>
                  )}

                  {!mostInteractedEmoji && (
                    <SignedOut>
                      <div className="p-6 text-center">
                        <div className="mb-4 flex items-center justify-center gap-3">
                          <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden">
                            <span
                              key={currentEmoji}
                              className={cn(
                                'absolute text-lg transition-all duration-300 ease-out',
                                emojiTransition === 'in' &&
                                  'animate-emoji-slide-in',
                                emojiTransition === 'out' &&
                                  'animate-emoji-slide-out',
                                emojiTransition === 'idle' &&
                                  'transform-none opacity-100'
                              )}
                            >
                              {currentEmoji}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-base">
                            be the first to rate this vibe
                          </p>
                        </div>
                        <SignInButton mode="modal">
                          <Button variant="outline">sign in to rate</Button>
                        </SignInButton>
                      </div>
                    </SignedOut>
                  )}
                </div>

                {/* Emoji Reactions Row */}
                {emojiRatingData.length > 0 && (
                  <EmojiReactionsRow
                    reactions={emojiRatingData}
                    onEmojiClick={handleUnifiedEmojiRating}
                    vibeTitle={vibe.title}
                    vibeId={vibe.id}
                    maxReactions={8}
                    existingUserRatings={vibe.currentUserRatings || []}
                    emojiMetadata={emojiMetadataRecord || {}}
                    vibe={vibe}
                    author={vibe.createdBy || undefined}
                    optimizeForTouch={false}
                    isMobile={isMobile}
                    shareCount={vibe.shareCount}
                  />
                )}
              </div>
            )}

            {/* Reviews Section - Desktop */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  reviews ({allRatings.length})
                </h3>
                {allRatings.length > 0 && (
                  <Select
                    value={ratingsSortBy}
                    onValueChange={(
                      value: 'newest' | 'oldest' | 'highest' | 'lowest'
                    ) => setRatingsSortBy(value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">newest first</SelectItem>
                      <SelectItem value="oldest">oldest first</SelectItem>
                      <SelectItem value="highest">highest rated</SelectItem>
                      <SelectItem value="lowest">lowest rated</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-4">
                {allRatings.length > 0 ? (
                  sortedRatings.map((rating, index) => {
                    return (
                      <ReviewCard
                        key={rating._id || index}
                        rating={rating}
                        vibe={vibe}
                        currentUserId={user?.id}
                        voteScore={voteScores?.[rating._id || '']}
                        voteStatus={voteStatuses?.[rating._id || '']}
                        onEmojiClick={handleUnifiedEmojiRating}
                        emojiMetadata={emojiMetadataRecord}
                        isOwnRating={rating.user?.externalId === user?.id}
                        showActions={true}
                      />
                    );
                  })
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    <p className="mb-3 text-sm">no reviews yet</p>
                    <p className="text-xs">
                      be the first to share your thoughts
                    </p>
                  </div>
                )}

                {/* Leave a Review CTA */}
                <div className="mt-4">
                  <div className="bg-secondary/10 rounded-lg border p-4 text-center">
                    <SignedIn>
                      {isOwner ? (
                        <p className="text-muted-foreground">
                          you cannot review your own vibe
                        </p>
                      ) : (
                        <div>
                          <p className="text-muted-foreground mb-4">
                            share your thoughts
                          </p>
                          <RevolvingRateReviewButton
                            vibeId={vibe.id}
                            topEmojis={emojiRatings}
                            vibeTitle={vibe.title}
                            emojiMetadata={emojiMetadataRecord}
                            existingUserRatings={vibe.currentUserRatings ?? []}
                            isOwner={isOwner}
                          />
                        </div>
                      )}
                    </SignedIn>
                    <SignedOut>
                      <div>
                        <p className="text-muted-foreground mb-4">
                          sign in to leave a review
                        </p>
                        <SignInButton mode="modal">
                          <Button variant="outline">sign in</Button>
                        </SignInButton>
                      </div>
                    </SignedOut>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Vibes Sidebar - Desktop Only */}
          <div className="col-span-1 hidden overflow-y-auto sm:block">
            <div className="sticky top-0">
              <div className="space-y-3">
                {similarVibes.map((similarVibe) => (
                  <VibeCardV2
                    key={similarVibe.id}
                    vibe={similarVibe}
                    variant="compact"
                    className="w-full"
                    optimizeForTouch={false}
                    enableFadeIn={false}
                  />
                ))}
                {similarVibes.length === 0 && (
                  <div className="text-muted-foreground py-8 text-center">
                    <p className="text-sm">no similar vibes found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
