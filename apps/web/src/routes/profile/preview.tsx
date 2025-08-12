import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import * as React from 'react';
import {
  useCurrentUser,
  useEnsureUserExistsMutation,
  useUserVibes,
  useUserRatings,
  useUserReceivedRatings,
  useUserEmojiStats,
} from '@/queries';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { Skeleton } from '@/components/ui/skeleton';
import toast from '@/utils/toast';
import { UserProfileView } from '@/features/profiles/components';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const requireAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error('No request found');
  const { userId } = await getAuth(request);

  if (!userId) {
    throw redirect({
      to: '/sign-in',
    });
  }

  return { userId };
});

export const Route = createFileRoute('/profile/preview')({
  component: ProfilePreview,
  beforeLoad: async () => await requireAuth(),
});

function ProfilePreview() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const {
    data: convexUser,
    isLoading: convexUserLoading,
    refetch: refetchUser,
  } = useCurrentUser();
  const { mutate: ensureUserExists, isPending: isCreatingUser } =
    useEnsureUserExistsMutation();

  const { data: userVibes, isLoading: vibesLoading } = useUserVibes(
    convexUser?.externalId || ''
  );
  const { data: userRatings, isLoading: ratingsLoading } = useUserRatings(
    convexUser?.externalId || ''
  );
  const { data: receivedRatings, isLoading: receivedRatingsLoading } =
    useUserReceivedRatings(convexUser?.externalId || '') as any;
  const { data: emojiStats } = useUserEmojiStats(convexUser?.externalId || '');

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
          </div>
        </div>
      </div>
    );
  }

  if (!clerkUser || !convexUser) {
    return (
      <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base">
            <p>failed to load user profile. please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-purple-950/10">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mx-auto mb-4 max-w-4xl">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              back to profile
            </Link>
          </Button>
        </div>
        <UserProfileView
          user={convexUser}
          userVibes={userVibes}
          vibesLoading={vibesLoading}
          userRatings={userRatings as any}
          ratingsLoading={ratingsLoading}
          receivedRatings={receivedRatings as any}
          receivedRatingsLoading={receivedRatingsLoading}
          emojiStats={emojiStats}
          showBackButton={false}
          scopedTheme={true}
          currentUserId={clerkUser?.id}
        />
      </div>
    </div>
  );
}

export default ProfilePreview;
