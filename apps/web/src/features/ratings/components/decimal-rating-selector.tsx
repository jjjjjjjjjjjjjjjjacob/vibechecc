import * as React from 'react'; // React hooks and types
import { cn } from '@/utils/tailwind-utils'; // class name merger
import { Slider } from '@/components/ui/slider'; // range input for numeric value
import { Input } from '@/components/ui/input'; // numeric text field
import { Label } from '@/components/ui/label'; // accessible label component
import { StarRating } from './star-rating'; // interactive star rating display

interface DecimalRatingSelectorProps {
  value: number; // current rating value
  onChange: (value: number) => void; // notify parent when value changes
  min?: number; // minimum allowed rating
  max?: number; // maximum allowed rating
  step?: number; // increment precision
  showStars?: boolean; // toggle star visualization
  showSlider?: boolean; // toggle slider control
  showInput?: boolean; // toggle manual input field
  label?: string; // optional label text
  className?: string; // additional container classes
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
  // when slider moves, forward the first value in the array
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  // parse and validate numeric input from text field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  // clamp and snap to step when leaving the input field
  const handleInputBlur = () => {
    const roundedValue = Math.round(value / step) * step;
    const clampedValue = Math.max(min, Math.min(max, roundedValue));
    if (clampedValue !== value) {
      onChange(clampedValue);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}

      {showStars && (
        <div className="flex justify-center">
          {/* star visualization */}
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
          {/* numeric slider */}
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      )}

      {showInput && (
        <div className="flex items-center gap-2">
          {/* manual numeric entry */}
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
          <span className="text-muted-foreground text-sm">out of {max}</span>
        </div>
      )}
    </div>
  );
}
