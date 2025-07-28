import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/utils/tailwind-utils';
import { Badge } from '@/components/ui/badge';

interface RatingRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  showValues?: boolean;
  variant?: 'default' | 'compact';
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
  const [minValue, maxValue] = value;

  const handleValueChange = (newValue: number[]) => {
    const [newMin, newMax] = newValue;
    // Ensure min is never greater than max
    if (newMin <= newMax) {
      onChange([newMin, newMax]);
    }
  };

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
          <Label className="text-sm font-medium lowercase">{label}</Label>
          {showValues && (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="border-purple-500/20 bg-purple-500/10 text-xs text-purple-600"
              >
                {formatValue(minValue)} - {formatValue(maxValue)}
              </Badge>
            </div>
          )}
        </div>
      )}

      {variant === 'compact' && showValues && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            min: {formatValue(minValue)}
          </span>
          <span className="text-muted-foreground">
            max: {formatValue(maxValue)}
          </span>
        </div>
      )}

      <div className="px-3 py-2">
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
            '[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-purple-500 [&_[data-slot=slider-range]]:to-pink-500',
            '[&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-thumb]]:border-purple-500 [&_[data-slot=slider-thumb]]:shadow-lg',
            '[&_[data-slot=slider-thumb]]:hover:ring-purple-500/30 [&_[data-slot=slider-thumb]]:focus-visible:ring-purple-500/30',
            '[&_[data-slot=slider-thumb]]:size-5',
            disabled && 'pointer-events-none opacity-50'
          )}
        />
      </div>

      {variant === 'default' && (
        <div className="text-muted-foreground flex items-center justify-between px-3 text-xs">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

export type { RatingRangeSliderProps };
