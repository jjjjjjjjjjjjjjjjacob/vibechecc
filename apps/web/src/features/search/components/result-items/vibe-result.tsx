/**
 * vibe result module.
 * enhanced documentation for clarity and maintenance.
 */
import { CommandItem } from '@/components/ui/command';
// avatar pieces allow previewing the creator next to each vibe result
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// badge displays associated tags in a pill-style chip
import { Badge } from '@/components/ui/badge';
// star icon highlights average rating if available
import { Star } from 'lucide-react';
// navigation hook lets us push to the vibe detail route
import { useNavigate } from '@tanstack/react-router';
// local state tracks whether image loading failed
import { useState } from 'react';
// typed shape of a vibe search result
import type { VibeSearchResult } from '@viberatr/types';

interface VibeResultProps {
  result: VibeSearchResult;
  onSelect?: () => void;
}

export function VibeResult({ result, onSelect }: VibeResultProps) {
  const navigate = useNavigate();
  // image fallback state hides the image if loading fails
  const [imageError, setImageError] = useState(false);

  // selecting a vibe navigates to its detail page and triggers callback
  const handleSelect = () => {
    navigate({ to: `/vibes/$vibeId`, params: { vibeId: result.id } });
    onSelect?.();
  };

  return (
    <CommandItem
      value={result.title} // use title for command list filtering
      onSelect={handleSelect} // navigate when selected
      className="data-[selected=true]:bg-muted/60 flex items-start gap-3 py-3"
    >
      {/* optional thumbnail image; hidden if loading fails */}
      {result.image && !imageError && (
        <img
          src={result.image}
          alt={result.title}
          className="h-12 w-12 rounded-md object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* info column with title, rating, subtitle, creator, and tags */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{result.title}</span>
          {result.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-muted-foreground text-xs">
                {result.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {result.subtitle && (
          <p className="text-muted-foreground text-sm">{result.subtitle}</p>
        )}

        <div className="flex items-center gap-2">
          {result.createdBy && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={result.createdBy.avatar} />
                <AvatarFallback>
                  {result.createdBy.name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">
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
