import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useVibesPaginated } from '@/queries';
import { VibeGrid } from '@/components/vibe-grid';
import { VibeGridSkeleton } from '@/components/ui/vibe-grid-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/vibes/')({
  component: AllVibes,
});

function AllVibes() {
  const { data: vibesData, isLoading, error } = useVibesPaginated(50); // Get more vibes initially

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-9 w-32" />
          <Skeleton className="h-5 w-80" />
        </div>
        <VibeGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
          <p>failed to load vibes. please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold lowercase">all vibes</h1>
        <p className="text-muted-foreground">
          discover and explore all vibes shared by our community.
        </p>
      </div>

      <VibeGrid vibes={vibesData?.vibes || []} />
    </div>
  );
}
