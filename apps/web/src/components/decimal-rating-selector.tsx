import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarRating } from './star-rating';

interface DecimalRatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showStars?: boolean;
  showSlider?: boolean;
  showInput?: boolean;
  label?: string;
  className?: string;
}

export function DecimalRatingSelector({
  value,
  onChange,
  min = 0,
  max = 5,
  step = 0.2,
  showStars = true,
  showSlider = true,
  showInput = true,
  label = 'Rating',
  className,
}: DecimalRatingSelectorProps) {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure value is within bounds and rounded to step
    const roundedValue = Math.round(value / step) * step;
    const clampedValue = Math.max(min, Math.min(max, roundedValue));
    if (clampedValue !== value) {
      onChange(clampedValue);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      {showStars && (
        <div className="flex justify-center">
          <StarRating
            value={value}
            onChange={onChange}
            allowDecimals={true}
            step={step}
            showValue={true}
            size="lg"
          />
        </div>
      )}

      {showSlider && (
        <div className="px-3">
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      )}

      {showInput && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className="w-20 text-center"
          />
          <span className="text-sm text-muted-foreground">out of {max}</span>
        </div>
      )}
    </div>
  );
}