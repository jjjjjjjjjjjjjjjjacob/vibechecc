import { Circle } from 'lucide-react';
import { cn } from '../utils/tailwind-utils';
import { useTheme } from './theme-provider';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  popoverMode?: boolean; // When true, clicking opens popover instead of direct rating
  onPopoverOpen?: () => void; // Callback when popover should open
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  popoverMode = false,
  onPopoverOpen,
}: StarRatingProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hoverValue, setHoverValue] = useState(0);
  const circles = [1, 2, 3, 4, 5];

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (rating: number) => {
    if (readOnly) return;

    // In popover mode, open the popover instead of directly rating
    if (popoverMode && onPopoverOpen) {
      onPopoverOpen();
      return;
    }

    // Direct rating mode
    onChange?.(rating);

    // Show toast when rating is changed
    if (!readOnly && onChange) {
      toast.success(`rated ${rating} circle${rating === 1 ? '' : 's'}!`, {
        duration: 2000,
        icon: '🎯',
      });
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

  const activeColor =
    resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-500';
  const hoverColor =
    resolvedTheme === 'dark'
      ? 'hover:text-purple-300'
      : 'hover:text-purple-400';

  // Determine which circles should be filled
  const displayValue = hoverValue || value;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="flex items-center gap-0.5"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${value} out of 5 circles`}
      onMouseLeave={handleMouseLeave}
    >
      {circles.map((circle, index) => {
        const isFilled = circle <= Math.round(displayValue);
        const isHovering = hoverValue > 0 && circle <= hoverValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(circle)}
            onMouseEnter={() => handleMouseEnter(circle)}
            className={cn(
              'text-muted-foreground transition-colors',
              !readOnly && hoverColor,
              readOnly ? 'cursor-default' : 'cursor-pointer',
              (isFilled || isHovering) && activeColor
            )}
            disabled={readOnly}
            role={readOnly ? undefined : 'radio'}
            aria-checked={circle === Math.round(value)}
            aria-label={`${circle} circle${circle === 1 ? '' : 's'}`}
          >
            <Circle
              className={cn(
                sizeClasses[size],
                isFilled || isHovering ? 'fill-current' : ''
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
