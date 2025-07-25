import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

interface EmojiRatingScaleProps {
  emoji: string;
  value: number;
  onChange?: (value: number) => void;
  onClick?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  preset?: 'color' | 'gradient';
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  emojiColor?: string;
}

export function EmojiRatingScale({
  emoji,
  value,
  onChange,
  onClick,
  size = 'md',
  showTooltip = true,
  className,
  preset = 'color',
  onMouseDown,
  onMouseUp,
  emojiColor,
}: EmojiRatingScaleProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const displayValue = hoverValue ?? value;

  const sizeClasses = {
    sm: 'text-lg gap-0.5',
    md: 'text-2xl gap-0.75',
    lg: 'text-4xl gap-1',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Calculate rating value based on mouse position
    const rawValue = (x / width) * 5;
    const clampedValue = Math.max(0.1, Math.min(5, rawValue));
    const roundedValue = Math.round(clampedValue * 10) / 10;

    setHoverValue(roundedValue);
    if (onChange) {
      onChange(roundedValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
    if (onMouseUp) {
      onMouseUp();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onClick) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Calculate rating value based on mouse position
    const rawValue = (x / width) * 5;
    const clampedValue = Math.max(0.1, Math.min(5, rawValue));
    const roundedValue = Math.round(clampedValue * 10) / 10;

    onClick(roundedValue);
  };

  const handleMouseDown = () => {
    onMouseDown?.();
  };

  const handleMouseUpLocal = () => {
    onMouseUp?.();
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
        onMouseDown={onMouseDown ? handleMouseDown : undefined}
        onMouseUp={onMouseUp ? handleMouseUpLocal : undefined}
        onClick={onClick ? handleClick : undefined}
      >
        <div
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${(displayValue / 5) * 100}%` }}
        >
          <div
            className={cn(
              'flex',
              preset === 'gradient'
                ? 'font-noto bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text whitespace-pre text-transparent transition-all group-active/rating-display:brightness-150'
                : 'font-noto-color whitespace-pre'
            )}
            style={
              preset === 'color' && emojiColor
                ? { color: emojiColor }
                : undefined
            }
          >
            {[...Array(5)].map((_, i) => (
              <span key={`filled-${i}`}>{emoji}</span>
            ))}
          </div>
        </div>
        <div
          data-preset={preset}
          className="font-noto-color data-[preset=gradient]:font-noto flex opacity-30"
        >
          {[...Array(5)].map((_, i) => (
            <span key={`unfilled-${i}`}>{emoji}</span>
          ))}
        </div>
      </div>
      {showTooltip && hoverValue !== null && onChange && (
        <div className="bg-popover text-popover-foreground animate-in fade-in-0 slide-in-from-bottom-1 absolute -top-8 left-1/2 -translate-x-1/2 rounded px-2 py-1 text-xs font-medium shadow-md duration-100">
          {hoverValue.toFixed(1)}
        </div>
      )}
    </div>
  );
}
