/**
 * tag result module.
 * enhanced documentation for clarity and maintenance.
 */
import { CommandItem } from '@/components/ui/command';
// hash icon visually conveys the concept of a tag result
import { Hash } from 'lucide-react';
// router hook enables navigation to filtered search results when a tag is chosen
import { useNavigate } from '@tanstack/react-router';
// the search api returns tag results in this shape
import type { TagSearchResult } from '@viberatr/types';

interface TagResultProps {
  result: TagSearchResult;
  onSelect?: () => void;
}

export function TagResult({ result, onSelect }: TagResultProps) {
  const navigate = useNavigate();
  // when a tag option is chosen we strip the hash symbol and navigate to the
  // search page with that tag pre-applied; any provided callback is invoked
  // afterward so parent components can close the menu or perform analytics
  const handleSelect = () => {
    const tagName = result.title.replace('#', '');
    navigate({ to: '/search', search: { tab: 'vibes', tags: [tagName] } });
    onSelect?.();
  };

  return (
    <CommandItem
      value={result.title} // value aids keyboard navigation within the command list
      onSelect={handleSelect} // selecting triggers navigation and optional callback
      className="data-[selected=true]:bg-muted/60 flex items-center gap-3 py-2"
    >
      {/* leading icon distinguishes tag results from other result types */}
      <Hash className="text-muted-foreground h-4 w-4" />

      {/* main label column grows to fill remaining space */}
      <div className="flex-1">
        <span className="font-medium">{result.title}</span>
      </div>

      {/* subtitle displays secondary context such as usage counts */}
      <span className="text-muted-foreground text-sm">{result.subtitle}</span>
    </CommandItem>
  );
}
