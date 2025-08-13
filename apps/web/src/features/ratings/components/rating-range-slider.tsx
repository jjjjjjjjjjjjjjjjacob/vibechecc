import * as React from 'react'; // React primitives
import { Label } from '@/components/ui/label'; // text label helper
import { Slider } from '@/components/ui/slider'; // range slider component
import { cn } from '@/utils/tailwind-utils'; // conditional classnames
import { Badge } from '@/components/ui/badge'; // pill style badge for values

/**
 * Props controlling the rating range selector.
 * Allows callers to configure bounds, display, and appearance.
 */
interface RatingRangeSliderProps {
  value: [number, number]; // current [min,max] values
  onChange: (value: [number, number]) => void; // emit updates to parent
  min?: number; // lowest allowed rating
  max?: number; // highest allowed rating
  step?: number; // precision for adjustments
  disabled?: boolean; // disables interaction
  className?: string; // optional container classes
  label?: string; // header text when variant is default
  showValues?: boolean; // toggle value display next to label
  variant?: 'default' | 'compact'; // layout style
}

export function RatingRangeSlider({
  value,
  onChange,
  min = 1,
  max = 5,
  step = 0.1,
  disabled = false,
  className,
  label = 'rating range',
  showValues = true,
  variant = 'default',
}: RatingRangeSliderProps) {
  const [minValue, maxValue] = value; // destructure for clarity

  // update state only when lower bound not exceeding upper bound
  const handleValueChange = (newValue: number[]) => {
    const [newMin, newMax] = newValue;
    if (newMin <= newMax) {
      onChange([newMin, newMax]);
    }
  };

  // turn numeric values into nice strings
  const formatValue = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) {
      return '0';
    }
    return val === Math.floor(val) ? val.toString() : val.toFixed(1);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {variant === 'default' && (
        <div className="flex items-center justify-between">
          {/* header row */}
          <Label className="text-sm font-medium lowercase">{label}</Label>
          {showValues && (
            <div className="flex items-center gap-2">
              {/* current range display */}
              <Badge
                variant="secondary"
                className="border-[hsl(var(--theme-primary))]/20 bg-[hsl(var(--theme-primary))]/10 text-xs text-[hsl(var(--theme-primary))]"
              >
                {formatValue(minValue)} - {formatValue(maxValue)}
              </Badge>
            </div>
          )}
        </div>
      )}

      {variant === 'compact' && showValues && (
        <div className="flex items-center justify-between text-xs">
          {/* compact values */}
          <span className="text-muted-foreground">
            min: {formatValue(minValue)}
          </span>
          <span className="text-muted-foreground">
            max: {formatValue(maxValue)}
          </span>
        </div>
      )}

      <div className="px-3 py-2">
        {/* interactive slider */}
        <Slider
          value={[minValue, maxValue]}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'w-full',
            '[&_[data-slot=slider-track]]:bg-muted/60',
            '[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-[hsl(var(--theme-primary))] [&_[data-slot=slider-range]]:to-[hsl(var(--theme-secondary))]',
            '[&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-thumb]]:border-[hsl(var(--theme-primary))] [&_[data-slot=slider-thumb]]:shadow-lg',
            '[&_[data-slot=slider-thumb]]:hover:ring-[hsl(var(--theme-primary))]/30 [&_[data-slot=slider-thumb]]:focus-visible:ring-[hsl(var(--theme-primary))]/30',
            '[&_[data-slot=slider-thumb]]:size-5',
            disabled && 'pointer-events-none opacity-50'
          )}
        />
      </div>

      {variant === 'default' && (
        <div className="text-muted-foreground flex items-center justify-between px-3 text-xs">
          {/* slider bounds */}
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

export type { RatingRangeSliderProps };
