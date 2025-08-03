import * as React from 'react';
import { Button } from '@/components/ui/button';
import { MasonryFeed } from '@/components/masonry-feed';
import { CreateVibeButton } from '@/features/vibes/components/create-vibe-button';
import { useUserVibes } from '@/queries';
import type { User } from '@viberatr/types';

interface UserVibesSectionProps {
  user: User;
  maxDisplay?: number;
  showViewAllButton?: boolean;
  className?: string;
}

export function UserVibesSection({
  user,
  maxDisplay = 6,
  showViewAllButton = true,
  className,
}: UserVibesSectionProps) {
  const { data: vibes, isLoading: vibesLoading } = useUserVibes(
    user.externalId
  );

  const displayedVibes = vibes?.slice(0, maxDisplay) || [];
  const hasMoreVibes = vibes && vibes.length > maxDisplay;

  return (
    <div className={className}>
      <h2 className="from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent lowercase sm:mb-4 sm:text-2xl">
        your vibes
      </h2>

      <MasonryFeed
        vibes={displayedVibes}
        isLoading={vibesLoading}
        variant="category"
        ratingDisplayMode="most-rated"
        showLoadMoreTarget={false}
        emptyStateTitle="no vibes created yet"
        emptyStateDescription="share your first vibe with the community!"
        emptyStateAction={
          <CreateVibeButton
            variant="default"
            className="from-theme-primary to-theme-secondary text-foreground bg-gradient-to-r shadow-lg"
          />
        }
      />

      {showViewAllButton && !vibesLoading && hasMoreVibes && (
        <div className="mt-4 text-center sm:mt-6">
          <Button
            variant="outline"
            asChild
            className="bg-background/90 border-theme-primary/30 text-theme-primary w-full transition-transform hover:scale-[1.02] hover:bg-current/10 sm:w-auto"
          >
            <a href="/vibes/my-vibes">view all vibes ({vibes?.length} total)</a>
          </Button>
        </div>
      )}
    </div>
  );
}
