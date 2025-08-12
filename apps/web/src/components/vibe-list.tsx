import * as React from 'react';
// Card component used to render individual vibes
import { VibeCard } from '@/features/vibes/components/vibe-card';
// Type definition for a vibe document
import type { Vibe } from '@/types';
// Utility for merging Tailwind classes
import { cn } from '@/utils/tailwind-utils';

/** Props accepted by {@link VibeList}. */
interface VibeListProps {
  // vibes to display in order
  vibes: Vibe[];
  // optional class names for the wrapping element
  className?: string;
  // choose how ratings appear on each card
  ratingDisplayMode?: 'most-rated' | 'top-rated';
}

/**
 * Render a vertically stacked list of {@link VibeCard} components.
 */
export function VibeList({
  vibes,
  className,
  ratingDisplayMode = 'most-rated',
}: VibeListProps) {
  // wrap cards in a column with spacing, merging any caller-provided styles
  return (
    <div className={cn('space-y-3', className)}>
      {/* map each vibe to a list-styled card */}
      {vibes.map((vibe) => (
        <VibeCard
          key={vibe.id}
          vibe={vibe}
          variant="list"
          ratingDisplayMode={ratingDisplayMode}
        />
      ))}
    </div>
  );
}

// Example usage component for different layouts
export function VibeListExample({ vibes }: { vibes: Vibe[] }) {
  // manage which layout is active
  const [view, setView] = React.useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-4">
      {/* view toggle */}
      <div className="flex justify-end gap-2">
        <button
          // switch to grid mode
          onClick={() => setView('grid')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            view === 'grid'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {/* keep label lowercase */}
          grid
        </button>
        <button
          // switch to list mode
          onClick={() => setView('list')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            view === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {/* keep label lowercase */}
          list
        </button>
      </div>

      {/* content rendered according to selected view */}
      {view === 'list' ? (
        // when in list mode reuse VibeList defined above
        <VibeList vibes={vibes} />
      ) : (
        // otherwise arrange cards in a responsive grid
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vibes.map((vibe) => (
            <VibeCard key={vibe.id} vibe={vibe} variant="default" />
          ))}
        </div>
      )}
    </div>
  );
}
