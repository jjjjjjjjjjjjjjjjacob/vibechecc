import * as React from 'react';
import { Link } from '@tanstack/react-router';
import type { Id } from '@vibechecc/convex/dataModel';
import type { Vibe } from '@vibechecc/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimpleVibePlaceholder } from '@/features/vibes/components/simple-vibe-placeholder';
import {
  Share2,
  Edit,
  Trash2,
  Heart,
  MoreHorizontal,
} from '@/components/ui/icons';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import { RevolvingRateReviewButton } from '@/features/ratings/components/revolving-rate-review-button';
import { RatingDootButton } from '@/features/ratings/components/rating-doot-button';
import { RatingShareButton } from '@/components/social/rating-share-button';
import { BoostButton } from '@/features/ratings/components/boost-button';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import { useUser, SignedIn, SignedOut } from '@clerk/tanstack-react-start';
import {
  useBulkRatingVoteScores,
  useBulkUserRatingVoteStatuses,
} from '@/queries';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VibeDetailMobileProps {
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
}

export function VibeDetailMobile({
  vibe,
  imageUrl,
  isImageLoading,
  isOwner,
  mostInteractedEmoji,
  emojiRatings,
  emojiMetadataRecord,
  onEmojiRatingClick,
  onDelete,
  onShare,
  isPendingDelete,
}: VibeDetailMobileProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState('overview');

  const ratingIds = React.useMemo(() => {
    if (!vibe?.currentUserRatings) return [];
    return vibe.currentUserRatings.filter((r) => r._id).map((r) => r._id as Id<'ratings'>);
  }, [vibe?.currentUserRatings]);

  const { data: voteScores } = useBulkRatingVoteScores(ratingIds);
  const { data: voteStatuses } = useBulkUserRatingVoteStatuses(ratingIds);

  const reviewsWithText = (vibe.currentUserRatings || []).filter((r) => r.review);
  const reviewCount = reviewsWithText.length;
  const totalRatings = vibe.emojiRatings.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Sticky Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {vibe.createdBy && vibe.createdBy.username ? (
              <Link
                to="/users/$username"
                params={{ username: vibe.createdBy.username }}
                className="flex items-center gap-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getUserAvatarUrl(vibe.createdBy)}
                    alt={computeUserDisplayName(vibe.createdBy)}
                  />
                  <AvatarFallback>
                    {getUserInitials(vibe.createdBy)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  @{vibe.createdBy.username}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>??</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">unknown user</span>
              </div>
            )}
          </div>

          {/* Action Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>actions</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  share vibe
                </Button>

                {isOwner && (
                  <>
                    <Link
                      to="/vibes/$vibeId/edit"
                      params={{ vibeId: vibe.id }}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        edit vibe
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="text-destructive w-full justify-start"
                      onClick={onDelete}
                      disabled={isPendingDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isPendingDelete ? 'deleting...' : 'delete vibe'}
                    </Button>
                  </>
                )}

                {!isOwner && (
                  <BoostButton
                    contentId={vibe.id as Id<'vibes'>}
                    contentType="vibe"
                    currentBoostScore={0}
                    boostCost={100}
                    dampenCost={50}
                    userPoints={0}
                    userBoostAction={null}
                    isOwnContent={false}
                    variant="outline"
                    className="w-full justify-start"
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Image */}
        <div className="relative aspect-[4/3] w-full">
          {imageUrl && !isImageLoading ? (
            <img
              src={imageUrl}
              alt={vibe.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <SimpleVibePlaceholder title={vibe.title} />
          )}

          {/* Gradient Overlay */}
          <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {/* Title & Primary Rating */}
          <div className="relative z-10 -mt-12 mb-4">
            <h1 className="text-foreground mb-3 text-3xl font-bold lowercase">
              {vibe.title}
            </h1>

            {mostInteractedEmoji ? (
              <div className="bg-background/95 inline-block rounded-full px-4 py-2 backdrop-blur">
                <EmojiRatingDisplay
                  rating={mostInteractedEmoji}
                  vibeId={vibe.id}
                  onEmojiClick={onEmojiRatingClick}
                  existingUserRatings={vibe.currentUserRatings || []}
                  emojiMetadata={emojiMetadataRecord}
                  size="lg"
                  variant="scale"
                />
              </div>
            ) : (
              <div className="mt-2">
                <RevolvingRateReviewButton
                  vibeId={vibe.id}
                  topEmojis={emojiRatings}
                  vibeTitle={vibe.title}
                  emojiMetadata={emojiMetadataRecord}
                  existingUserRatings={vibe.currentUserRatings || []}
                  isOwner={isOwner}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          {vibe.tags && vibe.tags.length > 0 && (
            <div className="mb-4">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2">
                  {vibe.tags.map((tag: string) => (
                    <Link key={tag} to="/search" search={{ q: tag }}>
                      <Badge
                        variant="secondary"
                        className="hover:bg-secondary/80"
                      >
                        {tag.toLowerCase()}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Stats Bar */}
          <div className="bg-secondary/20 mb-4 flex items-center justify-around rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRatings}</div>
              <div className="text-muted-foreground text-xs">ratings</div>
            </div>
            <div className="bg-border h-8 w-px" />
            <div className="text-center">
              <div className="text-2xl font-bold">{reviewCount}</div>
              <div className="text-muted-foreground text-xs">reviews</div>
            </div>
            <div className="bg-border h-8 w-px" />
            <div className="text-center">
              <div className="text-2xl font-bold">{emojiRatings.length}</div>
              <div className="text-muted-foreground text-xs">emojis</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {vibe.description}
          </p>

          {/* Tabs for organized content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">overview</TabsTrigger>
              <TabsTrigger value="ratings">
                ratings {emojiRatings.length > 0 && `(${emojiRatings.length})`}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                reviews {reviewCount > 0 && `(${reviewCount})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Rate This Vibe */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 text-lg font-semibold lowercase">
                    rate this vibe
                  </h3>
                  <SignedIn>
                    {isOwner ? (
                      <div className="bg-secondary/20 rounded-lg p-3 text-center">
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
                        existingUserRatings={vibe.currentUserRatings || []}
                        isOwner={isOwner}
                      />
                    )}
                  </SignedIn>
                  <SignedOut>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        // Handle auth prompt
                      }}
                    >
                      <span className="mr-2 text-2xl">❓</span>
                      sign in to rate
                    </Button>
                  </SignedOut>
                </CardContent>
              </Card>

              {/* Creator Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {vibe.createdBy && vibe.createdBy.username ? (
                        <Link
                          to="/users/$username"
                          params={{ username: vibe.createdBy.username }}
                          className="flex items-center gap-3"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={getUserAvatarUrl(vibe.createdBy)}
                              alt={computeUserDisplayName(vibe.createdBy)}
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
                              @{vibe.createdBy.username}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <>
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>??</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">unknown user</p>
                            <p className="text-muted-foreground text-sm">
                              {new Date(vibe.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ratings" className="mt-4">
              {emojiRatings.length > 0 ? (
                <div className="space-y-3">
                  {emojiRatings.map((rating, index) => (
                    <Card key={`${rating.emoji}-${index}`}>
                      <CardContent className="p-4">
                        <EmojiRatingDisplay
                          rating={rating}
                          vibeId={vibe.id}
                          onEmojiClick={onEmojiRatingClick}
                          existingUserRatings={vibe.currentUserRatings || []}
                          emojiMetadata={emojiMetadataRecord}
                          size="md"
                          variant="scale"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            {rating.count}{' '}
                            {rating.count === 1 ? 'rating' : 'ratings'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onEmojiRatingClick(rating.emoji, rating.value)
                            }
                          >
                            rate with this
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-2">no ratings yet</p>
                    {!isOwner && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab('overview')}
                      >
                        be the first to rate
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              {reviewsWithText.length > 0 ? (
                <div className="space-y-3">
                  {reviewsWithText
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((rating, index) => {
                      const hasUsername = !!(
                        rating.user && rating.user.username
                      );
                      const displayName = computeUserDisplayName(rating.user);
                      const username = rating.user?.username;

                      return (
                        <Card key={index}>
                          <CardContent className="p-4">
                            {/* Review Header */}
                            <div className="mb-3 flex items-start gap-3">
                              {hasUsername ? (
                                <Link
                                  to="/users/$username"
                                  params={{ username: username! }}
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
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={getUserAvatarUrl(rating.user)}
                                    alt={displayName}
                                  />
                                  <AvatarFallback>
                                    {getUserInitials(rating.user)}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {hasUsername ? (
                                    <Link
                                      to="/users/$username"
                                      params={{ username: username! }}
                                      className="font-medium"
                                    >
                                      @{username}
                                    </Link>
                                  ) : (
                                    <span className="font-medium">
                                      {displayName}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground text-xs">
                                    {new Date(
                                      rating.createdAt || Date.now()
                                    ).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Rating Display */}
                                <div className="mt-1">
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

                            {/* Review Text */}
                            {rating.review && (
                              <p className="text-muted-foreground mb-3 text-sm leading-relaxed whitespace-pre-line">
                                {rating.review}
                              </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between border-t pt-3">
                              <div className="flex items-center gap-1">
                                {rating._id && (
                                  <>
                                    <RatingDootButton
                                      ratingId={rating._id as Id<'ratings'>}
                                      netScore={
                                        voteScores?.[rating._id]?.netScore || 0
                                      }
                                      voteStatus={
                                        voteStatuses?.[rating._id] || {
                                          voteType: null,
                                          boosted: false,
                                          dampened: false,
                                        }
                                      }
                                      isOwnRating={
                                        rating.user?.externalId === user?.id
                                      }
                                      variant="ghost"
                                      size="sm"
                                    />
                                    <BoostButton
                                      contentId={rating._id as Id<'ratings'>}
                                      contentType="rating"
                                      currentBoostScore={0}
                                      boostCost={50}
                                      dampenCost={25}
                                      userPoints={0}
                                      userBoostAction={null}
                                      isOwnContent={
                                        rating.user?.externalId === user?.id
                                      }
                                      variant="ghost"
                                      size="sm"
                                    />
                                  </>
                                )}
                              </div>
                              <RatingShareButton
                                rating={rating}
                                vibe={vibe}
                                variant="ghost"
                                size="sm"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-2">
                      no written reviews yet
                    </p>
                    <p className="text-muted-foreground text-sm">
                      be the first to review this vibe!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Action Button for Quick Actions */}
      <div className="fixed right-4 bottom-4 z-50">
        <Drawer>
          <DrawerTrigger asChild>
            <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
              <Heart className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>quick rate</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <SignedIn>
                {!isOwner && (
                  <RevolvingRateReviewButton
                    vibeId={vibe.id}
                    topEmojis={emojiRatings}
                    vibeTitle={vibe.title}
                    emojiMetadata={emojiMetadataRecord}
                    existingUserRatings={vibe.currentUserRatings || []}
                    isOwner={isOwner}
                  />
                )}
              </SignedIn>
              <SignedOut>
                <Button variant="secondary" size="lg" className="w-full">
                  sign in to rate
                </Button>
              </SignedOut>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
