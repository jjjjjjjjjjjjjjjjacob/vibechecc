import * as React from 'react';
import { VibeCard } from './vibe-card';
import type { Vibe } from '@/types';

interface VibeGridProps {
  vibes: Vibe[];
}

export function VibeGrid({ vibes }: VibeGridProps) {
  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vibes.map((vibe) => (
        <VibeCard key={vibe.id} vibe={vibe} />
      ))}
    </div>
  );
}
