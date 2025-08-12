/**
 * Horizontal 0-5 emoji rating scale used for precise rating input.
 * Supports mouse and touch interactions with live preview.
 */
import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

interface RatingScaleProps {
  emoji: string;
  value: number;
  onChange?: (value: number) => void;
  onClick?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  variant?: 'color' | 'gradient';
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  emojiColor?: string;
  mobileSlider?: boolean;
}

export function RatingScale({
  emoji,
  value,
  onChange,
  onClick,
  size = 'md',
  showTooltip = true,
  className,
  variant = 'color',
  onPointerDown,
  onPointerUp,
  emojiColor,
  mobileSlider = false,
}: RatingScaleProps) {
  // Value the user is currently hovering over
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  // Ref to measure pointer position within the scale
  const containerRef = React.useRef<HTMLDivElement>(null);

  const displayValue = hoverValue ?? value;

  const sizeClasses = {
    sm: 'text-lg gap-0.5',
    md: 'text-2xl gap-0.75',
    lg: 'text-4xl gap-1',
  };

  const calculateValueFromPosition = (clientX: number) => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;

    const rawValue = (x / width) * 5;
    const clampedValue = Math.max(0.1, Math.min(5, rawValue));
    return Math.round(clampedValue * 10) / 10;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const value = calculateValueFromPosition(e.clientX);
    if (value === null) return;

    setHoverValue(value);
    if (onChange) {
      onChange(value);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const value = calculateValueFromPosition(touch.clientX);
    if (value === null) return;

    setHoverValue(value);
    if (onChange) {
      onChange(value);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
    if (onPointerUp) {
      onPointerUp();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const value = calculateValueFromPosition(e.clientX);
    if (value !== null) {
      onClick(value);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const value = calculateValueFromPosition(touch.clientX);
    if (value !== null) {
      onClick(value);
    }
    setHoverValue(null);
    if (onPointerUp) {
      onPointerUp();
    }
  };

  const handlePointerDown = () => {
    onPointerDown?.();
  };

  const handlePointerUpLocal = () => {
    onPointerUp?.();
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={containerRef}
        className={cn(
          'group/rating-display relative flex items-center select-none',
          sizeClasses[size],
          (onChange || onClick) && 'cursor-pointer'
        )}
        onMouseMove={onChange ? handleMouseMove : undefined}
        onMouseLeave={onChange ? handleMouseLeave : undefined}
        onPointerDown={onPointerDown ? handlePointerDown : undefined}
        onPointerUp={onPointerUp ? handlePointerUpLocal : undefined}
        onClick={onClick ? handleClick : undefined}
        onTouchMove={onChange ? handleTouchMove : undefined}
        onTouchEnd={onClick ? handleTouchEnd : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        role="button"
        tabIndex={onClick || onChange ? 0 : -1}
        aria-label={`Rate ${value} out of 5 with ${emoji}`}
      >
        <div
          data-variant={variant}
          className="font-noto-color data-[variant=gradient]:font-noto whitespace-pre opacity-30 brightness-60 grayscale-100"
        >
          {[...Array(5)].map((_, i) => (
            <span key={`unfilled-${i}`}>{emoji}</span>
          ))}
        </div>
        <div
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${(displayValue / 5) * 100}%` }}
        >
          <div
            className={cn(
              'flex',
              variant === 'gradient'
                ? 'font-noto from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text whitespace-pre text-transparent opacity-80 brightness-150 transition-all group-active:brightness-150'
                : 'font-noto-color whitespace-pre opacity-[0.99]'
            )}
            style={
              variant === 'color' && emojiColor
                ? { color: emojiColor }
                : undefined
            }
          >
            {[...Array(5)].map((_, i) => (
              <span key={`filled-${i}`}>{emoji}</span>
            ))}
          </div>
        </div>
        {mobileSlider && (onChange || onClick) && (
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={displayValue}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              setHoverValue(newValue);
              if (onChange) {
                onChange(newValue);
              }
            }}
            onPointerUp={(e) => {
              const newValue = parseFloat((e.target as HTMLInputElement).value);
              if (onClick) {
                onClick(newValue);
              }
              setHoverValue(null);
              if (onPointerUp) {
                onPointerUp();
              }
            }}
            onTouchEnd={(e) => {
              const newValue = parseFloat((e.target as HTMLInputElement).value);
              if (onClick) {
                onClick(newValue);
              }
              setHoverValue(null);
              if (onPointerUp) {
                onPointerUp();
              }
            }}
            className="absolute inset-0 h-full w-full cursor-pointer touch-pan-x opacity-0"
            aria-label={`Rate ${value} out of 5 with ${emoji}`}
          />
        )}
      </div>
      {showTooltip && hoverValue !== null && onChange && (
        <div className="bg-popover text-popover-foreground animate-in fade-in-0 slide-in-from-bottom-1 absolute -top-8 left-1/2 -translate-x-1/2 rounded px-2 py-1 text-xs font-medium shadow-md duration-100">
          {hoverValue.toFixed(1)}
        </div>
      )}
    </div>
  );
}
