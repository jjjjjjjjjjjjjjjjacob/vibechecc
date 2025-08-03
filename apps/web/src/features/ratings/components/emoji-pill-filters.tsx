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
          <span className="text-muted-foreground text-sm font-medium">
            selected emojis ({emojis.length})
          </span>
          {showClearAll && emojis.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive h-auto p-1 text-xs"
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
            className="bg-muted text-muted-foreground border-dashed"
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
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-all duration-200',
        'border-purple-200/50 bg-gradient-to-r from-purple-50 to-pink-50',
        'hover:border-purple-300/50 hover:from-purple-100 hover:to-pink-100',
        'dark:border-purple-500/30 dark:from-purple-950/30 dark:to-pink-950/30',
        'dark:hover:from-purple-900/40 dark:hover:to-pink-900/40',
        variant === 'compact' ? 'px-2 py-1' : 'px-3 py-1.5',
        className
      )}
    >
      <span
        className={cn(
          'font-noto-color drop-shadow-sm',
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
          'hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors',
          variant === 'compact' ? 'h-4 w-4 p-0' : 'h-5 w-5 p-0'
        )}
        aria-label={`Remove ${emoji} filter`}
      >
        <X className={cn(variant === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      </Button>
    </div>
  );
}

export { EmojiPill };
export type { EmojiPillFiltersProps, EmojiPillProps };
