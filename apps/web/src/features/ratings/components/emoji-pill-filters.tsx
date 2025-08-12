import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind-utils';
import { X } from 'lucide-react';

interface EmojiPillFiltersProps {
  emojis: string[];
  onRemove: (emoji: string) => void;
  onClear?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
  showClearAll?: boolean;
  maxDisplay?: number;
}

export function EmojiPillFilters({
  emojis,
  onRemove,
  onClear,
  className,
  variant = 'default',
  showClearAll = true,
  maxDisplay,
}: EmojiPillFiltersProps) {
  if (!emojis || emojis.length === 0) {
    return null;
  }

  const displayEmojis = maxDisplay ? emojis.slice(0, maxDisplay) : emojis;
  const hiddenCount =
    maxDisplay && emojis.length > maxDisplay ? emojis.length - maxDisplay : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {variant === 'default' && (
        <div className="flex items-center justify-between">
          <span className="text-primary text-sm font-medium">
            selected emojis ({emojis.length})
          </span>
          {showClearAll && emojis.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-primary hover:text-destructive h-auto p-1 text-xs"
            >
              clear all
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {displayEmojis.map((emoji) => (
          <EmojiPill
            key={emoji}
            emoji={emoji}
            onRemove={() => onRemove(emoji)}
            variant={variant}
          />
        ))}

        {hiddenCount > 0 && (
          <Badge
            variant="secondary"
            className="bg-muted text-secondary border-dashed"
          >
            +{hiddenCount} more
          </Badge>
        )}
      </div>
    </div>
  );
}

interface EmojiPillProps {
  emoji: string;
  onRemove: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

function EmojiPill({
  emoji,
  onRemove,
  variant = 'default',
  className,
}: EmojiPillProps) {
  return (
    <Button className="rounded-full" variant="ghost" asChild onClick={onRemove}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border transition-all duration-200',
          'bg-muted/30 shadow-sm backdrop-blur-sm',
          variant === 'compact' ? 'px-2 py-1' : 'px-3 py-1.5',
          className
        )}
      >
        <span
          className={cn(
            'drop-shadow-sm',
            variant === 'compact' ? 'text-lg' : 'text-xl'
          )}
        >
          {emoji}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className={cn(
            'text-muted-foreground hover:text-destructive text-2xs flex rounded-full p-0 transition-colors'
          )}
          aria-label={`Remove ${emoji} filter`}
        >
          <X className="!size-3" strokeWidth={4.0} />
        </Button>
      </div>
    </Button>
  );
}

export { EmojiPill };
export type { EmojiPillFiltersProps, EmojiPillProps };
