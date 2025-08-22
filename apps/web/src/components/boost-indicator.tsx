import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { TrendingUp, TrendingDown } from '@/components/ui/icons';

interface BoostIndicatorProps {
  boostScore?: number;
  totalBoosts?: number;
  totalDampens?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
}

export function BoostIndicator({
  boostScore = 0,
  totalBoosts = 0,
  totalDampens = 0,
  className,
  size = 'md',
  showIcon = true,
  showTooltip = true,
}: BoostIndicatorProps) {
  // Don't render if there's no boost activity
  if (boostScore === 0 && totalBoosts === 0 && totalDampens === 0) {
    return null;
  }

  const isPositive = boostScore > 0;
  const isNegative = boostScore < 0;
  const hasActivity = totalBoosts > 0 || totalDampens > 0;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-2.5 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  // Color classes based on boost score
  const getColorClasses = () => {
    if (isPositive) {
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    }
    if (isNegative) {
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    }
    // Neutral/no score but has activity
    return 'bg-muted text-muted-foreground border-border';
  };

  const formatScore = (score: number) => {
    if (score === 0) return '0';
    if (score > 0) return `+${score}`;
    return score.toString();
  };

  const tooltipText = showTooltip
    ? `Boost Score: ${formatScore(boostScore)}${hasActivity ? ` (${totalBoosts} boosts, ${totalDampens} dampens)` : ''}`
    : undefined;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        sizeClasses[size],
        getColorClasses(),
        className
      )}
      title={tooltipText}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp className={iconSizes[size]} />}
          {isNegative && <TrendingDown className={iconSizes[size]} />}
          {!isPositive && !isNegative && hasActivity && (
            <div className={cn('rounded-full bg-current', {
              'h-1.5 w-1.5': size === 'sm',
              'h-2 w-2': size === 'md',
              'h-2.5 w-2.5': size === 'lg',
            })} />
          )}
        </>
      )}
      <span>{formatScore(boostScore)}</span>
    </div>
  );
}

// Utility component for high boost scores with special styling
interface HighBoostIndicatorProps {
  boostScore: number;
  threshold?: number;
  className?: string;
}

export function HighBoostIndicator({ 
  boostScore, 
  threshold = 10,
  className 
}: HighBoostIndicatorProps) {
  if (boostScore < threshold) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-theme-primary to-theme-secondary px-2 py-1 text-xs font-bold text-primary-foreground shadow-md',
        className
      )}
    >
      <TrendingUp className="h-3 w-3" />
      <span>+{boostScore}</span>
      <span className="text-[10px] opacity-90">BOOSTED</span>
    </div>
  );
}