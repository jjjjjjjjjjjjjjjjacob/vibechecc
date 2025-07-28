import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';
import { EmojiSearchCommand } from '@/components/emoji-search-command';
import { EmojiPillFilters } from '@/components/emoji-pill-filters';
import { RatingRangeSlider } from '@/components/rating-range-slider';

interface MobileFilterSheetProps {
  emojiFilter?: string[];
  emojiMinValue?: number;
  rating?: number;
  ratingMin?: number;
  ratingMax?: number;
  onEmojiFilterChange: (emojis: string[]) => void;
  onEmojiMinValueChange: (value: number) => void;
  onRatingChange: (rating?: number) => void;
  onRatingRangeChange?: (min: number, max: number) => void;
  onClearFilters: () => void;
}

export function MobileFilterSheet({
  emojiFilter,
  emojiMinValue,
  rating,
  ratingMin = 1,
  ratingMax = 5,
  onEmojiFilterChange,
  onEmojiMinValueChange,
  onRatingChange,
  onRatingRangeChange,
  onClearFilters,
}: MobileFilterSheetProps) {
  const [emojiSearchValue, setEmojiSearchValue] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  const hasActiveFilters =
    (emojiFilter && emojiFilter.length > 0) ||
    rating !== undefined ||
    ratingMin !== 1 ||
    ratingMax !== 5 ||
    emojiMinValue !== undefined;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          filter
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {(emojiFilter?.length || 0) + (rating ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="top" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>filter results</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div>
              <Label className="mb-2 block text-sm font-medium">
                active filters
              </Label>
              <div className="space-y-2">
                {rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">min rating: {rating}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRatingChange(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {emojiFilter && emojiFilter.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm">
                      emoji: {emojiMinValue || 1}+ {emojiFilter.join('')}
                    </span>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {emojiMinValue || 1}+ rating
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emoji Filter */}
          <div>
            <Label className="mb-2 block text-sm font-medium">
              filter by emoji
            </Label>
            <div className="space-y-3">
              <EmojiSearchCommand
                searchValue={emojiSearchValue}
                onSearchChange={setEmojiSearchValue}
                onSelect={(emoji) => {
                  const current = emojiFilter || [];
                  const updated = current.includes(emoji)
                    ? current.filter((e) => e !== emoji)
                    : [...current, emoji];

                  onEmojiFilterChange(updated);
                  setEmojiSearchValue(''); // Clear search after selection
                }}
                placeholder="search emojis..."
                maxHeight="h-32"
                showCategories={false}
                className="text-sm"
              />

              {/* Selected Emoji Filters */}
              {emojiFilter && emojiFilter.length > 0 && (
                <div className="space-y-3">
                  <EmojiPillFilters
                    emojis={emojiFilter}
                    onRemove={(emoji) => {
                      const updated = emojiFilter.filter((e) => e !== emoji);
                      onEmojiFilterChange(updated);
                    }}
                    onClear={() => onEmojiFilterChange([])}
                    variant="compact"
                  />

                  {/* Minimum Rating Selector for Emojis */}
                  <div className="space-y-3">
                    <Label className="text-muted-foreground text-xs">
                      minimum emoji rating: {emojiMinValue || 1}
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Button
                          key={value}
                          variant={
                            emojiMinValue === value ? 'default' : 'outline'
                          }
                          size="sm"
                          className="h-8 w-full p-0 text-xs"
                          onClick={() => onEmojiMinValueChange(value)}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* General Rating Range Filter */}
          {onRatingRangeChange && (
            <div>
              <RatingRangeSlider
                value={[ratingMin, ratingMax]}
                onChange={([newMin, newMax]) => {
                  onRatingRangeChange(newMin, newMax);
                }}
                min={1}
                max={5}
                step={0.1}
                label="general rating range"
                variant="compact"
              />
            </div>
          )}

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onClearFilters();
                setIsOpen(false);
              }}
            >
              clear all filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
