import * as React from 'react';
import { Users, UserPlus } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { useFollowStats } from '../hooks/use-follow-stats';
import { Skeleton } from '@/components/ui/skeleton';

interface FollowStatsProps {
  userId: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
  showLabels?: boolean;
}

export function FollowStats({
  userId,
  onFollowersClick,
  onFollowingClick,
  variant = 'default',
  className,
  showLabels = true,
}: FollowStatsProps) {
  const { data: stats, isLoading } = useFollowStats(userId);

  if (isLoading) {
    return (
      <div className={cn('flex gap-3', className)}>
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    );
  }

  const pillClasses = cn(
    'border-border bg-card/50 rounded-full border backdrop-blur transition-all duration-200',
    variant === 'compact' ? 'px-2 py-1' : 'px-3 py-1.5',
    'hover:bg-card/70 hover:scale-105'
  );

  const textClasses = cn(
    'text-foreground flex items-center gap-2',
    variant === 'compact' ? 'text-xs' : 'text-xs'
  );

  const iconSize = variant === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {/* Followers */}
      <button
        onClick={onFollowersClick}
        disabled={!onFollowersClick}
        className={cn(
          pillClasses,
          onFollowersClick && 'hover:border-theme-primary/30 cursor-pointer',
          !onFollowersClick && 'cursor-default'
        )}
        type="button"
      >
        <div className={textClasses}>
          <Users className={iconSize} />
          <span className="font-bold">{stats.followers}</span>
          {showLabels && (
            <span className="font-medium">
              {stats.followers === 1 ? 'follower' : 'followers'}
            </span>
          )}
        </div>
      </button>

      {/* Following */}
      <button
        onClick={onFollowingClick}
        disabled={!onFollowingClick}
        className={cn(
          pillClasses,
          onFollowingClick && 'hover:border-theme-primary/30 cursor-pointer',
          !onFollowingClick && 'cursor-default'
        )}
        type="button"
      >
        <div className={textClasses}>
          <UserPlus className={iconSize} />
          <span className="font-bold">{stats.following}</span>
          {showLabels && <span className="font-medium">following</span>}
        </div>
      </button>
    </div>
  );
}

interface CompactFollowStatsProps {
  userId: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  className?: string;
}

export function CompactFollowStats({
  userId,
  onFollowersClick,
  onFollowingClick,
  className,
}: CompactFollowStatsProps) {
  return (
    <FollowStats
      userId={userId}
      onFollowersClick={onFollowersClick}
      onFollowingClick={onFollowingClick}
      variant="compact"
      showLabels={false}
      className={className}
    />
  );
}
