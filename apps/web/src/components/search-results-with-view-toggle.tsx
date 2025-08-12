import * as React from 'react';
import { VibeCard } from '@/features/vibes/components/vibe-card';
// VibeList component doesn't exist, we'll use VibeCard with list variant
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import type { Vibe } from '@/types';
import { cn } from '@/utils/tailwind-utils';

// Internal type that tracks which layout to render
type ViewMode = 'grid' | 'list';

/**
 * Props for {@link SearchResultsWithViewToggle}.
 *
 * @property vibes - Collection of vibes to display
 * @property defaultView - Initial layout mode when component mounts
 * @property className - Optional CSS classes passed to the wrapper
 */
interface SearchResultsWithViewToggleProps {
  vibes: Vibe[];
  defaultView?: ViewMode;
  className?: string;
}

/**
 * Render a list of vibes with controls to toggle between grid and list views.
 *
 * The chosen view is persisted to `localStorage` so users see the same layout
 * when they return to the page.
 */
export function SearchResultsWithViewToggle({
  vibes,
  defaultView = 'grid',
  className,
}: SearchResultsWithViewToggleProps) {
  // Track the current view mode; defaults to the provided prop
  const [viewMode, setViewMode] = React.useState<ViewMode>(defaultView);

  // Save preference to localStorage whenever the view mode changes
  React.useEffect(() => {
    localStorage.setItem('vibeViewMode', viewMode);
  }, [viewMode]);

  // Load preference from localStorage on first render
  React.useEffect(() => {
    const saved = localStorage.getItem('vibeViewMode') as ViewMode;
    if (saved && ['grid', 'list'].includes(saved)) {
      setViewMode(saved);
    }
  }, []);

  return (
    // Wrapper div allows optional className and consistent vertical spacing
    <div className={cn('space-y-4', className)}>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        {/* Display how many vibes are being shown */}
        <p className="text-muted-foreground text-sm">
          {vibes.length} {vibes.length === 1 ? 'vibe' : 'vibes'} found
        </p>

        {/* Buttons to switch between grid and list layouts */}
        <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode('grid')}
            aria-label="grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode('list')}
            aria-label="list view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Render vibes according to the selected layout */}
      {viewMode === 'list' ? (
        // List mode stacks vibe cards vertically
        <div className="space-y-3">
          {vibes.map((vibe) => (
            <VibeCard key={vibe.id} vibe={vibe} variant="list" />
          ))}
        </div>
      ) : (
        // Grid mode arranges vibe cards in responsive columns
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vibes.map((vibe) => (
            <VibeCard key={vibe.id} vibe={vibe} variant="default" />
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
        <VibeCard key={vibe.id} vibe={vibe} variant="list" />
      ))}
    </div>
  );
}
