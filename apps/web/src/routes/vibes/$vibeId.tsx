import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import type {} from '@vibechecc/convex/dataModel';
import * as React from 'react';
import {
  useVibe,
  useVibesPaginated,
  useEmojiMetadata,
  useTopEmojiRatings,
  useMostInteractedEmoji,
  useDeleteVibeMutation,
  useAllRatingsForVibe,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { ShareModal } from '@/components/social/share-modal';
import { VibeDetailSkeleton } from '@/components/skeletons/vibe-detail-skeleton';
import { useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';
import { AuthPromptDialog } from '@/features/auth/components/auth-prompt-dialog';
import { SignupCta } from '@/features/auth/components/signup-cta';
import {
  useSignupCtaPlacement,
  useAnonymousInteractionTracking,
} from '@/features/auth/hooks/use-signup-cta-placement';
import type { UnifiedEmojiRatingHandler } from '@/features/ratings/components/emoji-reaction';
import { RateAndReviewDialog } from '@/features/ratings/components/rate-and-review-dialog';
import { AllRatingsDialog } from '@/features/ratings/components/all-emoji-ratings-popover';
import { useVibeImageUrl } from '@/hooks/use-vibe-image-url';
import { useIsMobile } from '@/hooks/use-mobile';
import { VibeDetailUnified } from '@/features/vibes/components/vibe-detail-unified';

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
  const { user: _user } = useUser();
  const isMobile = useIsMobile();

  // CTA placement hooks
  const { placement: ctaPlacement, isAuthenticated } = useSignupCtaPlacement({
    enableVibeDetailCta: true,
    enableInteractionGate: true,
  });
  const { trackVibeView } = useAnonymousInteractionTracking();
  const deleteVibeMutation = useDeleteVibeMutation();
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [showRatingDialog, setShowRatingDialog] = React.useState(false);
  const [selectedEmojiForRating, setSelectedEmojiForRating] = React.useState<
    string | null
  >(null);
  const [preselectedRatingValue, setPreselectedRatingValue] = React.useState<
    number | null
  >(null);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showAllRatingsDialog, setShowAllRatingsDialog] = React.useState(false);

  // Get image URL (handles both legacy URLs and storage IDs)
  const { data: imageUrl, isLoading: isImageLoading } = useVibeImageUrl(
    vibe || {}
  );

  // Fetch real emoji rating data
  const { data: topEmojiRatings } = useTopEmojiRatings(vibeId, 5);
  const { data: mostInteractedEmojiData } = useMostInteractedEmoji(vibeId);

  // Fetch ALL ratings for this vibe
  const { data: allRatingsData } = useAllRatingsForVibe(vibeId);

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

  // Check if current user owns this vibe
  const isOwner = !!(_user?.id && vibe && vibe.createdById === _user.id);

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

  // Track vibe view for anonymous users
  React.useEffect(() => {
    if (!isAuthenticated && vibe) {
      trackVibeView(vibe.id);
    }
  }, [vibe, isAuthenticated, trackVibeView]);

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

  const handleEmojiRatingClick = (emoji: string, value?: number) => {
    if (!_user?.id) {
      setShowAuthDialog(true);
      return;
    }

    setSelectedEmojiForRating(emoji);

    // If a specific value was provided, store it for the popover
    if (value !== undefined) {
      setPreselectedRatingValue(value);
    }

    setShowRatingDialog(true);
  };

  // Adapter for unified handler
  const handleEmojiRatingClickUnified: UnifiedEmojiRatingHandler = async ({
    emoji,
    value,
  }) => {
    handleEmojiRatingClick(emoji, value);
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

  return (
    <>
      <VibeDetailUnified
        vibe={vibe}
        imageUrl={imageUrl}
        isImageLoading={isImageLoading}
        isOwner={isOwner}
        mostInteractedEmoji={mostInteractedEmoji}
        emojiRatings={emojiRatings}
        emojiMetadataRecord={emojiMetadataRecord}
        onEmojiRatingClick={handleEmojiRatingClick}
        onDelete={handleDeleteVibe}
        onShare={() => setShowShareModal(true)}
        isPendingDelete={deleteVibeMutation.isPending}
        allRatings={(allRatingsData || []).map((rating) => ({
          _id: rating._id,
          vibeId: rating.vibeId,
          userId: rating.userId,
          emoji: rating.emoji,
          value: rating.value,
          review: rating.review,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
          user: rating.user
            ? {
                id: rating.user._id,
                externalId: rating.user.externalId,
                username: rating.user.username,
                firstName: rating.user.first_name,
                lastName: rating.user.last_name,
                imageUrl:
                  rating.user.image_url || rating.user.profile_image_url,
              }
            : undefined,
        }))}
        variant={isMobile ? 'mobile' : 'desktop'}
        similarVibes={similarVibes}
      />

      {/* Rating Dialog for clicking on top ratings */}
      <RateAndReviewDialog
        vibeId={vibe.id}
        open={showRatingDialog}
        vibeTitle={vibe.title}
        preSelectedEmoji={selectedEmojiForRating || undefined}
        preSelectedValue={preselectedRatingValue || undefined}
        isOwner={!!isOwner}
        existingUserRatings={vibe.currentUserRatings || []}
        emojiMetadata={emojiMetadataRecord}
        onOpenChange={(open) => {
          setShowRatingDialog(open);
          if (!open) {
            setSelectedEmojiForRating(null);
            setPreselectedRatingValue(null);
          }
        }}
      >
        <div />
      </RateAndReviewDialog>

      {/* Share Modal */}
      {vibe && vibe.createdBy && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          vibe={vibe}
          author={vibe.createdBy}
          ratings={emojiRatings.map((r) => ({
            emoji: r.emoji,
            value: r.value,
            tags: r.tags || [],
            count: r.count,
          }))}
        />
      )}

      {/* All Ratings Dialog */}
      <AllRatingsDialog
        open={showAllRatingsDialog}
        onOpenChange={setShowAllRatingsDialog}
        ratings={emojiRatings}
        onEmojiClick={handleEmojiRatingClickUnified}
        vibeId={vibe.id}
        vibeTitle={vibe.title}
        existingUserRatings={vibe.currentUserRatings || []}
        emojiMetadata={emojiMetadataRecord}
      />

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="viber over here 🔥"
        description="if you vibe this effortlessly you should probably sign up"
      />

      {/* Vibe Detail CTA for unauthenticated users */}
      {!isAuthenticated && ctaPlacement.showInVibeDetail && (
        <div className="mb-8">
          <SignupCta
            variant="engagement"
            context="vibe_detail"
            placement="vibe-detail-bottom"
            triggerData={{
              vibesViewed: 1,
              interactionAttempted: false,
            }}
            className=""
          />
        </div>
      )}
    </>
  );
}

export default VibePage;
