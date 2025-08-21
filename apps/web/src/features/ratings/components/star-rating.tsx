import { Circle } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { useEffect, useState } from 'react';
import toast from '@/utils/toast';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  popoverMode?: boolean; // When true, clicking opens popover instead of direct rating
  onPopoverOpen?: () => void; // Callback when popover should open
  allowDecimals?: boolean; // Enable decimal ratings
  step?: number; // Step size for decimal ratings (default 0.2)
  showValue?: boolean; // Show numeric value alongside circles
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  popoverMode = false,
  onPopoverOpen,
  allowDecimals = false,
  step = 0.2,
  showValue = false,
}: StarRatingProps) {
  const [mounted, setMounted] = useState(false);
  const [hoverValue, setHoverValue] = useState(0);
  const circles = [1, 2, 3, 4, 5];

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (rating: number, event?: React.MouseEvent) => {
    if (readOnly) return;

    // In popover mode, open the popover instead of directly rating
    if (popoverMode && onPopoverOpen) {
      onPopoverOpen();
      return;
    }

    let finalRating = rating;

    // If decimals are allowed and we have a mouse event, calculate precise rating
    if (allowDecimals && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const width = rect.width;
      const percentage = x / width;

      // Calculate decimal rating based on click position
      const rawRating = rating - 1 + percentage;
      // Round to nearest step
      finalRating = Math.round(rawRating / step) * step;
      // Clamp between rating-1 and rating
      finalRating = Math.max(rating - 1 + step, Math.min(rating, finalRating));
    }

    // Direct rating mode
    onChange?.(finalRating);

    // Show toast when rating is changed
    if (!readOnly && onChange) {
      const displayRating =
        finalRating % 1 === 0 ? finalRating.toString() : finalRating.toFixed(1);
      toast.success(
        `rated ${displayRating} circle${finalRating === 1 ? '' : 's'}!`,
        {
          duration: 2000,
          icon: '🎯',
        }
      );
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (readOnly) return;
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverValue(0);
  };

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  // If not mounted yet, return a placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        {Array(5).fill(<div className={sizeClasses[size]} />)}
      </div>
    );
  }

  const activeColor = 'text-theme-primary';
  const hoverColor = 'hover:text-theme-primary/80';

  // Determine which circles should be filled
  const displayValue = hoverValue || value;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="flex items-center gap-1"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${value} out of 5 circles`}
      onMouseLeave={handleMouseLeave}
    >
      {circles.map((circle, index) => {
        const fillPercentage = Math.min(
          100,
          Math.max(0, (displayValue - (circle - 1)) * 100)
        );
        const isFilled = fillPercentage >= 100;
        const isPartiallyFilled = fillPercentage > 0 && fillPercentage < 100;
        const isHovering = hoverValue > 0 && circle <= hoverValue;

        return (
          <button
            key={index}
            type="button"
            onClick={(e) => handleClick(circle, allowDecimals ? e : undefined)}
            onMouseEnter={() => handleMouseEnter(circle)}
            className={cn(
              'text-muted-foreground relative transition-colors',
              !readOnly && hoverColor,
              readOnly ? 'cursor-default' : 'cursor-pointer',
              (isFilled || isHovering) && activeColor
            )}
            disabled={readOnly}
            role={readOnly ? undefined : 'radio'}
            aria-checked={circle === Math.round(value)}
            aria-label={`${circle} circle${circle === 1 ? '' : 's'}`}
          >
            {isPartiallyFilled && allowDecimals ? (
              <div className="relative">
                <Circle className={cn(sizeClasses[size])} />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Circle
                    className={cn(
                      sizeClasses[size],
                      'fill-current',
                      activeColor
                    )}
                  />
                </div>
              </div>
            ) : (
              <Circle
                className={cn(
                  sizeClasses[size],
                  isFilled || isHovering ? 'fill-current' : ''
                )}
              />
            )}
          </button>
        );
      })}
      {showValue && (
        <span
          className={cn(
            'text-muted-foreground ml-1',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
