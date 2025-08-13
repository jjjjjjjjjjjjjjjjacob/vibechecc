import { CommandItem } from '@/components/ui/command';
import { Hash } from '@/components/ui/icons';
import { useNavigate } from '@tanstack/react-router';
import type { TagSearchResult } from '@vibechecc/types';

interface TagResultProps {
  result: TagSearchResult;
  onSelect?: () => void;
}

export function TagResult({ result, onSelect }: TagResultProps) {
  const navigate = useNavigate();

  const handleSelect = () => {
    const tagName = result.title.replace('#', '');
    navigate({ to: '/search', search: { tab: 'vibes', tags: [tagName] } });
    onSelect?.();
  };

  return (
    <CommandItem
      value={result.title}
      onSelect={handleSelect}
      className="data-[selected=true]:bg-muted/60 flex items-center gap-3 py-2"
    >
      <Hash className="text-muted-foreground h-4 w-4" />

      <div className="flex-1">
        <span className="font-medium">{result.title}</span>
      </div>

      <span className="text-muted-foreground text-sm">{result.subtitle}</span>
    </CommandItem>
  );
}
