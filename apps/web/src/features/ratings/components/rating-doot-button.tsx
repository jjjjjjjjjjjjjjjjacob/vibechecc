import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import {
  useToggleRatingBoostMutation,
  useToggleRatingDampenMutation,
} from '@/queries';
import { useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';
import type { Id } from '@vibechecc/convex/dataModel';

interface RatingDootButtonProps {
  ratingId: Id<'ratings'>;
  netScore: number;
  voteStatus: {
    voteType: 'boost' | 'dampen' | null;
    boosted: boolean;
    dampened: boolean;
  };
  onVoteChange?: (voteType: 'boost' | 'dampen' | null) => void;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
  isOwnRating?: boolean;
}

export function RatingDootButton({
  ratingId,
  netScore,
  voteStatus,
  onVoteChange,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
  isOwnRating = false,
}: RatingDootButtonProps) {
  const { user } = useUser();
  const boostMutation = useToggleRatingBoostMutation();
  const dampenMutation = useToggleRatingDampenMutation();
  const [optimisticVoteStatus, setOptimisticVoteStatus] =
    React.useState(voteStatus);
  const [optimisticScore, setOptimisticScore] = React.useState(netScore);

  const isLoading = boostMutation.isPending || dampenMutation.isPending;

  // Update state when props change
  React.useEffect(() => {
    setOptimisticVoteStatus(voteStatus);
    setOptimisticScore(netScore);
  }, [voteStatus, netScore]);

  const handleBoost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('sign in to boost reviews', {
        duration: 3000,
        icon: '🚀',
      });
      return;
    }

    if (isOwnRating) {
      toast.error('you cannot boost your own review', {
        duration: 3000,
        icon: '🚫',
      });
      return;
    }

    // Optimistic update
    const wasAlreadyBoosted = optimisticVoteStatus.boosted;
    const wasDampened = optimisticVoteStatus.dampened;

    if (wasAlreadyBoosted) {
      // Unboost
      setOptimisticVoteStatus({
        voteType: null,
        boosted: false,
        dampened: false,
      });
      setOptimisticScore((prev) => prev - 1);
    } else {
      // Boost (might be switching from dampen)
      setOptimisticVoteStatus({
        voteType: 'boost',
        boosted: true,
        dampened: false,
      });
      setOptimisticScore((prev) => (wasDampened ? prev + 2 : prev + 1));
    }

    try {
      const result = await boostMutation.mutateAsync({ ratingId });

      if (result?.action === 'boosted') {
        onVoteChange?.('boost');
        // Show success message with point transfer info
        if (result.message) {
          toast.success(result.message, {
            duration: 4000,
            icon: '🚀',
          });
        } else {
          toast.success('review boosted!', {
            duration: 3000,
            icon: '🚀',
          });
        }
      } else if (result?.action === 'unboosted') {
        onVoteChange?.(null);
        // Show unboost message
        if (result.message) {
          toast.success(result.message, {
            duration: 4000,
            icon: '↩️',
          });
        } else {
          toast.success('boost removed', {
            duration: 3000,
            icon: '↩️',
          });
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticVoteStatus(voteStatus);
      setOptimisticScore(netScore);

      const errorMessage =
        error instanceof Error ? error.message : 'failed to boost review';
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌',
      });
    }
  };

  const handleDampen = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('sign in to vote on reviews', {
        duration: 3000,
        icon: '📊',
      });
      return;
    }

    if (isOwnRating) {
      toast.error('you cannot dampen your own review', {
        duration: 3000,
        icon: '🚫',
      });
      return;
    }

    // Optimistic update
    const wasAlreadyDampened = optimisticVoteStatus.dampened;
    const wasBoosted = optimisticVoteStatus.boosted;

    if (wasAlreadyDampened) {
      // Undampen
      setOptimisticVoteStatus({
        voteType: null,
        boosted: false,
        dampened: false,
      });
      setOptimisticScore((prev) => prev + 1);
    } else {
      // Dampen (might be switching from boost)
      setOptimisticVoteStatus({
        voteType: 'dampen',
        boosted: false,
        dampened: true,
      });
      setOptimisticScore((prev) => (wasBoosted ? prev - 2 : prev - 1));
    }

    try {
      const result = await dampenMutation.mutateAsync({ ratingId });

      if (result?.action === 'dampened') {
        onVoteChange?.('dampen');
        // Show success message with point penalty info
        if (result.message) {
          toast.success(result.message, {
            duration: 4000,
            icon: '📉',
          });
        } else {
          toast.success('review dampened', {
            duration: 3000,
            icon: '📉',
          });
        }
      } else if (result?.action === 'undampened') {
        onVoteChange?.(null);
        // Show undampen message
        if (result.message) {
          toast.success(result.message, {
            duration: 4000,
            icon: '↩️',
          });
        } else {
          toast.success('dampen removed', {
            duration: 3000,
            icon: '↩️',
          });
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticVoteStatus(voteStatus);
      setOptimisticScore(netScore);

      const errorMessage =
        error instanceof Error ? error.message : 'failed to dampen review';
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌',
      });
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Boost Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleBoost}
        disabled={disabled || isLoading}
        className={cn(
          'h-8 w-8 p-0 transition-all',
          optimisticVoteStatus.boosted &&
            'text-green-600 hover:text-green-600 dark:text-green-400',
          !optimisticVoteStatus.boosted &&
            'text-muted-foreground hover:text-green-600 dark:hover:text-green-400'
        )}
        aria-label={
          optimisticVoteStatus.boosted ? 'Unboost review' : 'Boost review'
        }
      >
        <ChevronUp
          className={cn(
            'h-4 w-4 transition-all',
            optimisticVoteStatus.boosted && 'fill-current'
          )}
        />
      </Button>

      {/* Score Display */}
      <span
        className={cn(
          'min-w-[2rem] text-center text-sm font-medium transition-colors',
          optimisticScore > 0 && 'text-green-600 dark:text-green-400',
          optimisticScore < 0 && 'text-red-600 dark:text-red-400',
          optimisticScore === 0 && 'text-muted-foreground'
        )}
      >
        {optimisticScore}
      </span>

      {/* Dampen Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleDampen}
        disabled={disabled || isLoading}
        className={cn(
          'h-8 w-8 p-0 transition-all',
          optimisticVoteStatus.dampened &&
            'text-red-600 hover:text-red-600 dark:text-red-400',
          !optimisticVoteStatus.dampened &&
            'text-muted-foreground hover:text-red-600 dark:hover:text-red-400'
        )}
        aria-label={
          optimisticVoteStatus.dampened ? 'Undampen review' : 'Dampen review'
        }
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-all',
            optimisticVoteStatus.dampened && 'fill-current'
          )}
        />
      </Button>
    </div>
  );
}
