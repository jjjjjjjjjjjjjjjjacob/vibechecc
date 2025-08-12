/**
 * user result module.
 * enhanced documentation for clarity and maintenance.
 */
import { CommandItem } from '@/components/ui/command';
// avatar primitives render profile images with fallbacks
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// lucide icons give quick visual cues for vibe and follower counts
import { Users, Sparkles } from 'lucide-react';
// hook for programmatic navigation to user profile pages
import { useNavigate } from '@tanstack/react-router';
// typed shape of a user search result
import type { UserSearchResult } from '@viberatr/types';

interface UserResultProps {
  result: UserSearchResult;
  onSelect?: () => void;
}

export function UserResult({ result, onSelect }: UserResultProps) {
  const navigate = useNavigate();
  // when a user is chosen we navigate to their profile and invoke any callback
  const handleSelect = () => {
    navigate({ to: `/users/$username`, params: { username: result.username } });
    onSelect?.();
  };

  return (
    <CommandItem
      value={result.username} // use username for command palette filtering
      onSelect={handleSelect} // selecting navigates to the user's profile
      className="data-[selected=true]:bg-muted/60 flex items-center gap-3 py-3"
    >
      {/* profile image with letter fallback when no image exists */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={result.image} alt={result.title || result.username} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {result.title?.[0]?.toUpperCase() ||
            result.username?.[0]?.toUpperCase() ||
            '?'}
        </AvatarFallback>
      </Avatar>

      {/* main text column shows display name and optional subtitle */}
      <div className="flex-1">
        <div className="font-medium">{result.title}</div>
        <div className="text-muted-foreground text-sm">{result.subtitle}</div>
      </div>

      {/* right side shows counts when available */}
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
