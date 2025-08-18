import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import * as React from 'react';
import {
  useUpdateProfileMutation,
  useCurrentUser,
  useEnsureUserExistsMutation,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useClerk } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getOptimizedAuth } from '@/lib/optimized-auth';
import { getWebRequest } from '@tanstack/react-start/server';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Shield } from '@/components/ui/icons';
import toast from '@/utils/toast';
import { useAdminAuth } from '@/features/admin/hooks/use-admin-auth';
import { DebugAuth } from '@/features/auth/components/debug-auth';
import {
  UserVibesSection,
  UserReviewsSection,
  UserInterestsSection,
} from '@/features/profiles/components';
import {
  FollowStats,
  FollowersModal,
  FollowingModal,
} from '@/features/follows/components';
import { SocialConnectionsList } from '@/components/social/connections/social-connections-list';
import { ConnectSocialButton } from '@/components/social/connections/connect-social-button';
import { api } from '@vibechecc/convex';
import { useConvexQuery } from '@convex-dev/react-query';

// Server function to check authentication
const requireAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error('No request found');
  const { userId } = await getOptimizedAuth(request);

  if (!userId) {
    throw redirect({
      to: '/sign-in',
    });
  }

  return { userId };
});

export const Route = createFileRoute('/profile/')({
  component: Profile,
  beforeLoad: async () => await requireAuth(),
});

function Profile() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { isAdmin } = useAdminAuth();
  const {
    data: convexUser,
    isLoading: convexUserLoading,
    refetch: refetchUser,
  } = useCurrentUser();
  const { mutate: ensureUserExists, isPending: isCreatingUser } =
    useEnsureUserExistsMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  // Fetch social connections
  const socialConnections = useConvexQuery(
    api.social.connections.getSocialConnections
  );

  // Follow modal states
  const [isFollowersModalOpen, setIsFollowersModalOpen] = React.useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = React.useState(false);

  // User interests state
  const [userInterests, setUserInterests] = React.useState<string[]>([]);

  // Initialize user interests when loaded
  React.useEffect(() => {
    if (convexUser) {
      setUserInterests(convexUser.interests || []);
    }
  }, [convexUser]);

  // Handle case where user is authenticated but doesn't exist in Convex
  React.useEffect(() => {
    if (
      clerkLoaded &&
      clerkUser &&
      !convexUserLoading &&
      !convexUser &&
      !isCreatingUser
    ) {
      ensureUserExists(undefined, {
        onSuccess: () => {
          refetchUser();
        },
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error('Failed to create user:', error);
          toast.error(
            'Failed to initialize user profile. Please refresh the page.'
          );
        },
      });
    }
  }, [
    clerkLoaded,
    clerkUser,
    convexUserLoading,
    convexUser,
    isCreatingUser,
    ensureUserExists,
    refetchUser,
  ]);

  const isLoading = !clerkLoaded || convexUserLoading || isCreatingUser;

  if (isLoading) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
          <div className="mx-auto max-w-4xl">
            <Card className="bg-background/90 mb-6 border-none shadow-lg backdrop-blur sm:mb-8">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex-shrink-0">
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-6 sm:mb-8">
              <Skeleton className="mb-3 h-6 w-24 sm:mb-4 sm:h-8" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!clerkUser || !convexUser) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
          <DebugAuth />
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base">
            <p>failed to load user profile. please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleInterestsUpdate = (newInterests: string[]) => {
    setUserInterests(newInterests);
  };

  const displayName =
    `${convexUser.first_name || ''} ${convexUser.last_name || ''}`.trim() ||
    convexUser.username ||
    clerkUser.fullName ||
    clerkUser.firstName ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    'User';

  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
  const userJoinDate = convexUser.created_at
    ? new Date(convexUser.created_at).toLocaleDateString()
    : clerkUser.createdAt
      ? new Date(clerkUser.createdAt).toLocaleDateString()
      : 'Unknown';

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mx-auto max-w-4xl">
          {/* A) USER SNAPSHOT & PROFILE MANAGEMENT */}
          <Card className="bg-background/90 mb-6 border-none shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl sm:mb-8">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarImage
                      src={convexUser.image_url || clerkUser.imageUrl}
                      alt={displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg sm:text-2xl">
                      {displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="w-full flex-1 text-center sm:text-left">
                  <div className="mb-4">
                    <h1 className="from-theme-primary to-theme-secondary mb-1.5 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase drop-shadow-md sm:text-2xl">
                      {displayName}
                    </h1>
                    {convexUser.username && (
                      <p className="text-muted-foreground drop-theme-secondary/20 mb-1 text-sm drop-shadow-sm sm:text-base">
                        @{convexUser.username}
                      </p>
                    )}
                    <p className="text-muted-foreground drop-theme-secondary/20 mb-1 text-sm drop-shadow-sm sm:text-base">
                      {userEmail}
                    </p>
                    <p className="text-muted-foreground drop-theme-secondary/20 mb-3 text-xs drop-shadow-sm sm:text-sm">
                      member since {userJoinDate}
                    </p>
                  </div>

                  {/* Follow Stats Pills */}
                  <div className="mb-4 flex justify-center sm:justify-start">
                    <FollowStats
                      userId={convexUser.externalId}
                      onFollowersClick={() => setIsFollowersModalOpen(true)}
                      onFollowingClick={() => setIsFollowingModalOpen(true)}
                      variant="default"
                    />
                  </div>

                  {/* Action buttons - mobile-first stacked layout */}
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        asChild
                        className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                      >
                        <Link to="/profile/edit">edit profile</Link>
                      </Button>
                      <Button
                        variant="secondary"
                        asChild
                        className="flex-1 transition-transform hover:scale-[1.02] sm:flex-none"
                      >
                        <Link to="/profile/preview">preview profile</Link>
                      </Button>
                    </div>
                    <div className="flex justify-center gap-2 sm:justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="transition-transform hover:scale-[1.02]"
                      >
                        <Link to="/onboarding">
                          <Sparkles className="mr-2 h-4 w-4" />
                          take tour
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="transition-transform hover:scale-[1.02]"
                        >
                          <Link to="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            admin panel
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B) CONTENT MANAGEMENT SECTION */}
          <div className="space-y-6 sm:space-y-8">
            {/* 1. Your Vibes */}
            <UserVibesSection user={convexUser} className="mb-6 sm:mb-8" />

            {/* 2. Your Reviews */}
            <UserReviewsSection user={convexUser} className="mb-6 sm:mb-8" />

            {/* 3. Your Interests */}
            <UserInterestsSection
              user={convexUser}
              userInterests={userInterests}
              onInterestsUpdate={handleInterestsUpdate}
              updateProfileMutation={updateProfileMutation}
              className="mb-6 sm:mb-8"
            />

            {/* 4. Social Connections */}
            <div className="mb-6 sm:mb-8">
              <SocialConnectionsList className="mb-4" />

              {/* Connection CTAs */}
              {socialConnections && (
                <Card className="bg-background/90 border-none shadow-lg backdrop-blur">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="mb-4 text-lg font-semibold lowercase">
                      connect more accounts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {!socialConnections.some(
                        (c) =>
                          c.platform === 'twitter' &&
                          c.connectionStatus === 'connected'
                      ) && (
                        <ConnectSocialButton
                          platform="twitter"
                          variant="outline"
                          size="default"
                          showLabel={true}
                        />
                      )}
                      {!socialConnections.some(
                        (c) =>
                          c.platform === 'instagram' &&
                          c.connectionStatus === 'connected'
                      ) && (
                        <ConnectSocialButton
                          platform="instagram"
                          variant="outline"
                          size="default"
                          showLabel={true}
                        />
                      )}
                      {!socialConnections.some(
                        (c) =>
                          c.platform === 'tiktok' &&
                          c.connectionStatus === 'connected'
                      ) && (
                        <ConnectSocialButton
                          platform="tiktok"
                          variant="outline"
                          size="default"
                          showLabel={true}
                        />
                      )}
                    </div>
                    {socialConnections.filter(
                      (c) => c.connectionStatus === 'connected'
                    ).length === 3 && (
                      <p className="text-muted-foreground mt-4 text-sm">
                        all social accounts connected! 🎉
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* C) ACCOUNT MANAGEMENT SECTION */}
          <div className="border-muted/20 border-t pt-6">
            <h2 className="from-theme-primary to-theme-secondary mb-4 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase sm:text-2xl">
              account management
            </h2>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => openUserProfile()}
                className="border-theme-primary/30 text-theme-primary hover:bg-theme-primary/10"
              >
                manage account settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Follow Modals */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={convexUser.externalId}
        username={convexUser.username}
      />
      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        userId={convexUser.externalId}
        username={convexUser.username}
      />
    </div>
  );
}

export default Profile;
