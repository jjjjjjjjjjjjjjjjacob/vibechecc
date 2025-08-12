import * as React from 'react';
// Use the existing card component to render each individual vibe
import { VibeCard } from './vibe-card';
// Shared type definition for vibe documents
import type { Vibe } from '@/types';

/** Props accepted by {@link VibeGrid}. */
interface VibeGridProps {
  // array of vibes to render in the grid
  vibes: Vibe[];
}

/**
 * Display a responsive grid of vibe cards.
 *
 * The component is intentionally simple: it just maps the provided array to
 * individual {@link VibeCard} elements and relies on Tailwind grid classes
 * for responsive behavior.
 */
export function VibeGrid({ vibes }: VibeGridProps) {
  // Lay out cards in a grid that adapts to available width
  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Render each vibe using the shared card component */}
      {vibes.map((vibe) => (
        <VibeCard key={vibe.id} vibe={vibe} />
      ))}
    </div>
  );
}
