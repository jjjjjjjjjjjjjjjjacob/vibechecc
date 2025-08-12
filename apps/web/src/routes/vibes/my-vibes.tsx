/**
 * Route showing the authenticated user's own vibes.
 * Redirects to sign-in if the user is not authenticated on the server.
 */
import { createFileRoute, redirect } from '@tanstack/react-router';
import * as React from 'react';
import { useUserVibes } from '@/queries';
import { VibeGrid } from '@/features/vibes/components/vibe-grid';
import { CreateVibeButton } from '@/features/vibes/components/create-vibe-button';
import { useUser } from '@clerk/tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import { VibeGridSkeleton } from '@/components/skeletons/vibe-grid-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

// Server function to check authentication
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

export const Route = createFileRoute('/vibes/my-vibes')({
  component: MyVibes,
  beforeLoad: async () => await requireAuth(),
});

function MyVibes() {
  // Grab current user and fetch their vibes
  const { user, isLoaded } = useUser();
  const { data: vibes, isLoading, error } = useUserVibes(user?.id || '');

  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-9 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <VibeGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
          <p>failed to load your vibes. please try again later.</p>
        </div>
      </div>
    );
  }

  if (!vibes || vibes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <h1 className="mb-4 text-3xl font-bold lowercase">my vibes</h1>
          <p className="text-muted-foreground mb-6">
            you haven't created any vibes yet.
          </p>
          <CreateVibeButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold lowercase">my vibes</h1>
          <p className="text-muted-foreground">
            vibes you've created ({vibes.length})
          </p>
        </div>
        <CreateVibeButton />
      </div>

      <VibeGrid vibes={vibes} />
    </div>
  );
}

export default MyVibes;
