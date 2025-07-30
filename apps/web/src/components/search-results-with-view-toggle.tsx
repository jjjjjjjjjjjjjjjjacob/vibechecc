import * as React from 'react';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import { VibeList } from '@/components/vibe-list';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import type { Vibe } from '@/types';
import { cn } from '@/utils/tailwind-utils';

type ViewMode = 'grid' | 'list';

interface SearchResultsWithViewToggleProps {
  vibes: Vibe[];
  defaultView?: ViewMode;
  className?: string;
}

export function SearchResultsWithViewToggle({
  vibes,
  defaultView = 'grid',
  className,
}: SearchResultsWithViewToggleProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>(defaultView);

  // Save preference to localStorage
  React.useEffect(() => {
    localStorage.setItem('vibeViewMode', viewMode);
  }, [viewMode]);

  // Load preference from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('vibeViewMode') as ViewMode;
    if (saved && ['grid', 'list'].includes(saved)) {
      setViewMode(saved);
    }
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {vibes.length} {vibes.length === 1 ? 'vibe' : 'vibes'} found
        </p>
        
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {viewMode === 'list' ? (
        <VibeList vibes={vibes} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vibes.map((vibe) => (
            <VibeCard
              key={vibe.id}
              vibe={vibe}
              variant="default"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebars or smaller spaces
export function CompactSearchResults({ vibes }: { vibes: Vibe[] }) {
  return (
    <div className="space-y-2">
      {vibes.map((vibe) => (
        <VibeCard
          key={vibe.id}
          vibe={vibe}
          variant="list"
        />
      ))}
    </div>
  );
}