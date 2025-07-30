import * as React from 'react';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import type { Vibe } from '@/types';
import { cn } from '@/utils/tailwind-utils';

interface VibeListProps {
  vibes: Vibe[];
  className?: string;
  ratingDisplayMode?: 'most-rated' | 'top-rated';
}

export function VibeList({ vibes, className, ratingDisplayMode = 'most-rated' }: VibeListProps) {
  return (
    <div className={cn('space-y-3', className)}>
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
  const [view, setView] = React.useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setView('grid')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            view === 'grid'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          Grid
        </button>
        <button
          onClick={() => setView('list')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            view === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          List
        </button>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <VibeList vibes={vibes} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vibes.map((vibe) => (
            <VibeCard key={vibe.id} vibe={vibe} variant="default" />
          ))}
        </div>
      )}
    </div>
  );
}