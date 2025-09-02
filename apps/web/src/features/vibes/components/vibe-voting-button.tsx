import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';
import type { Id } from '@vibechecc/convex/dataModel';

interface VibeVotingButtonProps {
  vibeId: Id<'vibes'>;
  currentBoostScore?: number;
  userVoteStatus?: 'boost' | 'dampen' | null;
  onVoteChange?: (
    voteType: 'boost' | 'dampen' | null,
    newScore: number
  ) => void;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
  isOwnContent?: boolean;
}

export function VibeVotingButton({
  vibeId: _vibeId,
  currentBoostScore = 0,
  userVoteStatus = null,
  onVoteChange,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
  isOwnContent = false,
}: VibeVotingButtonProps) {
  const { user } = useUser();
  const [optimisticScore, setOptimisticScore] =
    React.useState(currentBoostScore);
  const [optimisticVoteStatus, setOptimisticVoteStatus] =
    React.useState(userVoteStatus);

  // Update state when props change
  React.useEffect(() => {
    setOptimisticScore(currentBoostScore);
    setOptimisticVoteStatus(userVoteStatus);
  }, [currentBoostScore, userVoteStatus]);

  const handleBoost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('sign in to boost content', {
        duration: 3000,
        icon: '🚀',
      });
      return;
    }

    if (isOwnContent) {
      toast.error('you cannot boost your own content', {
        duration: 3000,
        icon: '🚫',
      });
      return;
    }

    const isCurrentlyBoosted = optimisticVoteStatus === 'boost';
    const newVoteStatus: 'boost' | null = isCurrentlyBoosted ? null : 'boost';
    const scoreDelta = isCurrentlyBoosted ? -1 : 1;

    // Optimistic update
    setOptimisticVoteStatus(newVoteStatus);
    setOptimisticScore((prev) => prev + scoreDelta);

    try {
      // TODO: Implement boost mutation
      onVoteChange?.(newVoteStatus, optimisticScore + scoreDelta);

      toast.success(newVoteStatus ? 'vibe boosted!' : 'boost removed', {
        duration: 2000,
        icon: newVoteStatus ? '🚀' : '📉',
      });
    } catch (_error) {
      // Revert optimistic update on error
      setOptimisticVoteStatus(userVoteStatus);
      setOptimisticScore(currentBoostScore);

      toast.error('failed to update vote', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  const handleDampen = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('sign in to dampen content', {
        duration: 3000,
        icon: '📉',
      });
      return;
    }

    if (isOwnContent) {
      toast.error('you cannot dampen your own content', {
        duration: 3000,
        icon: '🚫',
      });
      return;
    }

    const isCurrentlyDampened = optimisticVoteStatus === 'dampen';
    const newVoteStatus: 'dampen' | null = isCurrentlyDampened
      ? null
      : 'dampen';
    const scoreDelta = isCurrentlyDampened ? 1 : -1;

    // Optimistic update
    setOptimisticVoteStatus(newVoteStatus);
    setOptimisticScore((prev) => prev + scoreDelta);

    try {
      // TODO: Implement dampen mutation
      onVoteChange?.(newVoteStatus, optimisticScore + scoreDelta);

      toast.success(newVoteStatus ? 'vibe dampened' : 'dampen removed', {
        duration: 2000,
        icon: newVoteStatus ? '📉' : '🚀',
      });
    } catch (_error) {
      // Revert optimistic update on error
      setOptimisticVoteStatus(userVoteStatus);
      setOptimisticScore(currentBoostScore);

      toast.error('failed to update vote', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  const isBoostActive = optimisticVoteStatus === 'boost';
  const isDampenActive = optimisticVoteStatus === 'dampen';

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Boost Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleBoost}
        disabled={disabled}
        className={cn(
          'px-1.5 transition-all',
          isBoostActive && 'text-theme-primary hover:text-theme-primary'
        )}
        aria-label={isBoostActive ? 'Remove boost' : 'Boost content'}
      >
        <ChevronUp
          className={cn(
            'h-4 w-4 transition-all',
            isBoostActive && 'fill-current'
          )}
        />
      </Button>

      {/* Score Display */}
      <span
        className={cn(
          'px-1 text-xs font-medium tabular-nums',
          optimisticScore > 0
            ? 'text-theme-primary'
            : optimisticScore < 0
              ? 'text-destructive'
              : 'text-muted-foreground'
        )}
      >
        {optimisticScore === 0
          ? '0'
          : optimisticScore > 0
            ? `+${optimisticScore}`
            : `${optimisticScore}`}
      </span>

      {/* Dampen Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleDampen}
        disabled={disabled}
        className={cn(
          'px-1.5 transition-all',
          isDampenActive && 'text-destructive hover:text-destructive'
        )}
        aria-label={isDampenActive ? 'Remove dampen' : 'Dampen content'}
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-all',
            isDampenActive && 'fill-current'
          )}
        />
      </Button>
    </div>
  );
}
