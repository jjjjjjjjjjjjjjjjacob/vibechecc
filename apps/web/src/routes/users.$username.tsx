import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import {
  useUserByUsername,
  useUserVibes,
  useUserRatings,
  useUserReceivedRatings,
  useUserEmojiStats,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MasonryFeed } from '@/components/masonry-feed';
import { UserProfileView } from '@/features/profiles/components/user-profile-view';
import { useUser } from '@clerk/tanstack-react-start';
import { trackEvents } from '@/lib/posthog';
import { api } from '@vibechecc/convex';
import { useConvexQuery } from '@convex-dev/react-query';

export const Route = createFileRoute('/users/$username')({
  component: UserProfile,
});

function UserProfile() {
  const { username } = Route.useParams();
  const { user: clerkUser } = useUser();
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUserByUsername(username);
  const { data: userVibes, isLoading: vibesLoading } = useUserVibes(
    user?.externalId || ''
  );
  const { data: userRatings, isLoading: ratingsLoading } = useUserRatings(
    user?.externalId || ''
  );
  const { data: receivedRatings, isLoading: receivedRatingsLoading } =
    useUserReceivedRatings(user?.externalId || '');
  const { data: emojiStats, isLoading: _emojiStatsLoading } = useUserEmojiStats(
    user?.externalId || ''
  );

  // Fetch social connections for public profile
  const socialConnections = useConvexQuery(
    api.social.connections.getUserSocialConnections,
    user?.externalId ? { userId: user.externalId } : 'skip'
  );

  // Track profile view when user data is loaded
  React.useEffect(() => {
    if (user && !userLoading) {
      trackEvents.profileViewed(user.externalId, user.username);
    }
  }, [user, userLoading]);

  // Early returns after all hooks have been called
  if (userLoading) {
    return <UserProfileSkeleton />;
  }

  if (userError || !user) {
    return (
      <div className="from-background via-background to-muted/20 min-h-screen bg-gradient-to-br">
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="bg-background/80 border-theme-primary/20 w-full max-w-md shadow-2xl backdrop-blur-md">
              <CardContent className="p-8 text-center">
                <div className="mb-4 text-6xl opacity-50">🔍</div>
                <h1 className="from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent lowercase">
                  user not found
                </h1>
                <p className="text-muted-foreground/80">
                  the user @{username} could not be found in our community
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserProfileView
      user={user}
      socialConnections={socialConnections}
      userVibes={userVibes}
      vibesLoading={vibesLoading}
      userRatings={userRatings
        ?.filter((rating) => rating !== null)
        .map((rating) => ({
          ...rating,
          vibe: rating.vibe
            ? {
                ...rating.vibe,
                createdBy: rating.vibe.createdBy
                  ? {
                      id:
                        rating.vibe.createdBy.externalId ||
                        rating.vibe.createdBy._id ||
                        'unknown',
                      name:
                        rating.vibe.createdBy.username ||
                        `${rating.vibe.createdBy.first_name || ''} ${rating.vibe.createdBy.last_name || ''}`.trim() ||
                        'Unknown',
                      avatar: rating.vibe.createdBy.image_url,
                    }
                  : {
                      id: 'unknown',
                      name: 'Unknown User',
                      avatar: undefined,
                    },
              }
            : undefined,
        }))}
      ratingsLoading={ratingsLoading}
      receivedRatings={receivedRatings
        ?.filter((rating) => rating !== null)
        .map((rating) => ({
          ...rating,
          rater: rating.rater || undefined,
        }))}
      receivedRatingsLoading={receivedRatingsLoading}
      emojiStats={emojiStats}
      scopedTheme={true}
      currentUserId={clerkUser?.id}
    />
  );
}

function UserProfileSkeleton() {
  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/20">
      <div className="container mx-auto space-y-6 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          {/* Hero Skeleton */}
          <div className="bg-background/50 border-border relative overflow-hidden rounded-2xl border p-6 backdrop-blur sm:p-8">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
              <div className="flex-shrink-0">
                <Skeleton className="h-28 w-28 rounded-full sm:h-32 sm:w-32" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <Skeleton className="h-6 w-48 sm:h-8" />
                  <Skeleton className="mt-2 h-4 w-32 sm:h-5" />
                </div>
                <Skeleton className="h-3 w-full max-w-md" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-64 rounded-xl" />
          </div>

          {/* Content Skeleton */}
          <div className="space-y-4">
            <div className="text-center">
              <Skeleton className="mx-auto h-6 w-32" />
              <Skeleton className="mx-auto mt-2 h-3 w-48" />
            </div>
            <MasonryFeed
              vibes={[]}
              isLoading={true}
              variant="category"
              showLoadMoreTarget={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
