import { CommandItem } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { VibeSearchResult } from '@vibechecc/types';

interface VibeResultProps {
  result: VibeSearchResult;
  onSelect?: () => void;
}

export function VibeResult({ result, onSelect }: VibeResultProps) {
  const navigate = useNavigate();

  const handleSelect = () => {
    navigate({ to: `/vibes/$vibeId`, params: { vibeId: result.id } });
    onSelect?.();
  };

  return (
    <CommandItem
      value={result.title}
      onSelect={handleSelect}
      className="flex items-start gap-3 py-3"
    >
      {result.image && (
        <img
          src={result.image}
          alt={result.title}
          className="h-12 w-12 rounded-md object-cover"
        />
      )}
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{result.title}</span>
          {result.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">{result.rating}</span>
            </div>
          )}
        </div>
        
        {result.subtitle && (
          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
        )}
        
        <div className="flex items-center gap-2">
          {result.createdBy && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={result.createdBy.avatar} />
                <AvatarFallback>{result.createdBy.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {result.createdBy.name}
              </span>
            </div>
          )}
          
          {result.tags && result.tags.length > 0 && (
            <div className="flex gap-1">
              {result.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="h-5 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </CommandItem>
  );
}