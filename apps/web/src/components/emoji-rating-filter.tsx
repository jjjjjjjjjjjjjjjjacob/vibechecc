import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useEmojiMetadata } from '@/queries';
import { cn } from '@/utils/tailwind-utils';

interface EmojiRatingFilterProps {
  selectedEmojis: string[];
  minValue?: number;
  onEmojiToggle: (emoji: string) => void;
  onMinValueChange: (value: number | undefined) => void;
}

export function EmojiRatingFilter({
  selectedEmojis,
  minValue,
  onEmojiToggle,
  onMinValueChange,
}: EmojiRatingFilterProps) {
  const { data: emojiMetadataArray, isLoading } = useEmojiMetadata();

  // Get emojis from metadata or use defaults
  const availableEmojis = React.useMemo(() => {
    // Popular rating emojis to show if metadata is not loaded
    const defaultEmojis = ['😍', '🔥', '😱', '💯', '😂', '🤩', '😭', '🥺'];

    if (!emojiMetadataArray || emojiMetadataArray.length === 0) {
      return defaultEmojis;
    }
    // Get up to 12 emojis from metadata
    return emojiMetadataArray.slice(0, 12).map((m) => m.emoji);
  }, [emojiMetadataArray]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-secondary h-10 w-10 animate-pulse rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Emoji Selection */}
      <div>
        <p className="text-muted-foreground mb-2 text-xs">
          Filter by emoji ratings
        </p>
        <div className="grid grid-cols-4 gap-2">
          {availableEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant={selectedEmojis.includes(emoji) ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-10 w-10 p-0 text-lg',
                selectedEmojis.includes(emoji) && 'ring-2 ring-offset-2'
              )}
              onClick={() => onEmojiToggle(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>

      {/* Minimum Value Slider */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs">Minimum emoji rating</Label>
          {minValue && (
            <span className="text-muted-foreground text-xs">
              {minValue}+ out of 5
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Slider
            value={[minValue || 1]}
            min={1}
            max={5}
            step={1}
            onValueChange={([value]) => {
              onMinValueChange(value === 1 ? undefined : value);
            }}
            className="flex-1"
          />
          {minValue && minValue > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onMinValueChange(undefined)}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground text-xs">1</span>
          <span className="text-muted-foreground text-xs">5</span>
        </div>
      </div>

      {/* Selected Summary */}
      {(selectedEmojis.length > 0 || (minValue && minValue > 1)) && (
        <div className="border-border bg-secondary/20 rounded-md border p-2">
          <p className="text-xs font-medium">Active filters:</p>
          {selectedEmojis.length > 0 && (
            <p className="text-muted-foreground text-xs">
              Emojis: {selectedEmojis.join(' ')}
            </p>
          )}
          {minValue && minValue > 1 && (
            <p className="text-muted-foreground text-xs">
              Min rating: {minValue}+ ⭐
            </p>
          )}
        </div>
      )}
    </div>
  );
}
