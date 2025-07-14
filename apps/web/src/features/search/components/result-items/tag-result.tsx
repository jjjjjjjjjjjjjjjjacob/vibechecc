import { CommandItem } from '@/components/ui/command';
import { Hash } from 'lucide-react';
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
    navigate({ to: '/vibes', search: { tags: [tagName] } });
    onSelect?.();
  };

  return (
    <CommandItem
      value={result.title}
      onSelect={handleSelect}
      className="flex items-center gap-3 py-2"
    >
      <Hash className="h-4 w-4 text-muted-foreground" />
      
      <div className="flex-1">
        <span className="font-medium">{result.title}</span>
      </div>
      
      <span className="text-sm text-muted-foreground">{result.subtitle}</span>
    </CommandItem>
  );
}