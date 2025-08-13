import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Star } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

interface RatingSliderProps {
  min?: number;
  max?: number;
  onChange: (range: { min?: number; max?: number } | undefined) => void;
  className?: string;
}

export function RatingSlider({
  min = 0,
  max = 5,
  onChange,
  className,
}: RatingSliderProps) {
  const [range, setRange] = useState<[number, number]>([min || 0, max || 5]);

  useEffect(() => {
    setRange([min || 0, max || 5]);
  }, [min, max]);

  const handleRangeChange = (value: number[]) => {
    setRange([value[0], value[1]]);

    // Only call onChange if range is different from default
    if (value[0] === 0 && value[1] === 5) {
      onChange(undefined);
    } else {
      onChange({
        min: value[0] > 0 ? value[0] : undefined,
        max: value[1] < 5 ? value[1] : undefined,
      });
    }
  };

  const handleReset = () => {
    setRange([0, 5]);
    onChange(undefined);
  };

  const isFiltered = range[0] > 0 || range[1] < 5;

  // Generate star display for visual feedback
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating
                ? 'fill-yellow-500 text-yellow-500'
                : 'fill-muted text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium">Rating Range</h4>
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-auto px-2 py-1 text-xs"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Current range display */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm">
          <div className="flex items-center gap-2">
            {renderStars(range[0])}
            <span className="text-muted-foreground">
              ({range[0].toFixed(1)})
            </span>
          </div>
        </div>
        <span className="text-muted-foreground text-sm">to</span>
        <div className="text-sm">
          <div className="flex items-center gap-2">
            {renderStars(range[1])}
            <span className="text-muted-foreground">
              ({range[1].toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={range}
          onValueChange={handleRangeChange}
          min={0}
          max={5}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Preset buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="hover:bg-accent cursor-pointer"
          onClick={() => handleRangeChange([4, 5])}
        >
          4+ stars
        </Badge>
        <Badge
          variant="outline"
          className="hover:bg-accent cursor-pointer"
          onClick={() => handleRangeChange([3, 5])}
        >
          3+ stars
        </Badge>
        <Badge
          variant="outline"
          className="hover:bg-accent cursor-pointer"
          onClick={() => handleRangeChange([0, 2])}
        >
          Low rated
        </Badge>
        <Badge
          variant="outline"
          className="hover:bg-accent cursor-pointer"
          onClick={() => handleRangeChange([2, 4])}
        >
          Mid range
        </Badge>
      </div>

      {/* Summary */}
      <p className="text-muted-foreground mt-3 text-xs">
        {isFiltered
          ? `Showing vibes rated ${range[0].toFixed(1)} - ${range[1].toFixed(1)} stars`
          : 'All ratings'}
      </p>
    </div>
  );
}
