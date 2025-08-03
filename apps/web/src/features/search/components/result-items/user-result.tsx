import { CommandItem } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Sparkles } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { UserSearchResult } from '@viberatr/types';

interface UserResultProps {
  result: UserSearchResult;
  onSelect?: () => void;
}

export function UserResult({ result, onSelect }: UserResultProps) {
  const navigate = useNavigate();

  const handleSelect = () => {
    navigate({ to: `/users/$username`, params: { username: result.username } });
    onSelect?.();
  };

  return (
    <CommandItem
      value={result.username}
      onSelect={handleSelect}
      className="data-[selected=true]:bg-muted/60 flex items-center gap-3 py-3"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={result.image} />
        <AvatarFallback>{result.title?.[0] || '?'}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="font-medium">{result.title}</div>
        <div className="text-muted-foreground text-sm">{result.subtitle}</div>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        {result.vibeCount !== undefined && (
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>{result.vibeCount} vibes</span>
          </div>
        )}
        {result.followerCount !== undefined && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{result.followerCount}</span>
          </div>
        )}
      </div>
    </CommandItem>
  );
}
