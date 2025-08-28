import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind-utils';
import { Sparkles, Trophy, Flame } from 'lucide-react';

interface VibePointsDisplayProps {
  currentBalance: number;
  level: number;
  streakDays: number;
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showIcons?: boolean;
}

export function VibePointsDisplay({
  currentBalance,
  level,
  streakDays,
  className,
  variant = 'full',
  showIcons = true,
}: VibePointsDisplayProps) {
  const formatPoints = (points: number) => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    }
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1 text-xs', className)}>
        {showIcons && <Sparkles className="text-theme-primary h-3 w-3" />}
        <span className="font-medium">{formatPoints(currentBalance)}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          {showIcons && <Sparkles className="text-theme-primary h-3.5 w-3.5" />}
          <span className="text-sm font-medium">
            {formatPoints(currentBalance)}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          L{level}
        </Badge>
        {streakDays > 0 && (
          <div className="flex items-center gap-1">
            {showIcons && <Flame className="h-3 w-3 text-orange-500" />}
            <span className="text-muted-foreground text-xs">{streakDays}</span>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Points Balance */}
      <div className="flex items-center gap-1.5">
        {showIcons && <Sparkles className="text-theme-primary h-4 w-4" />}
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {formatPoints(currentBalance)}
          </span>
          <span className="text-muted-foreground text-xs">points</span>
        </div>
      </div>

      {/* Level Badge */}
      <Badge
        variant="secondary"
        className="bg-theme-primary text-primary-foreground hover:bg-theme-primary/90"
      >
        <Trophy className="mr-1 h-3 w-3" />
        Level {level}
      </Badge>

      {/* Streak Indicator */}
      {streakDays > 0 && (
        <div className="flex items-center gap-1.5">
          {showIcons && <Flame className="h-4 w-4 text-orange-500" />}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{streakDays}</span>
            <span className="text-muted-foreground text-xs">
              {streakDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
