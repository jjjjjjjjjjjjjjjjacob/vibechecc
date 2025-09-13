import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from '@/components/ui/icons';
import { api } from '@vibechecc/convex';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';

interface BoostButtonProps {
  /** The ID of the rating to boost */
  ratingId: string;
  /** The user ID of the rating author (to prevent self-boosting) */
  authorUserId: string;
  /** Current boost score for display */
  currentBoostScore?: number;
  /** Size variant for the button */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Whether to show the boost score */
  showScore?: boolean;
  /** Whether the user has already boosted this rating */
  hasUserBoosted?: boolean;
}

export function BoostButton({
  ratingId,
  authorUserId,
  currentBoostScore = 0,
  size = 'sm',
  className,
  showScore = true,
  hasUserBoosted = false,
}: BoostButtonProps) {
  const queryClient = useQueryClient();

  // Get current user's points stats
  const { data: userPoints, isLoading: pointsLoading } = useQuery(
    convexQuery(api.userPoints.getUserPointsStats, {})
  );

  // Get boost cost for this rating
  const { data: boostCostData } = useQuery(
    convexQuery(api.userPoints.getBoostCost, {
      contentType: 'rating',
      contentId: ratingId,
    })
  );
  const boostCost =
    typeof boostCostData === 'object'
      ? boostCostData?.boostCost
      : boostCostData;

  // Boost content mutation
  const convexMutation = useConvexMutation(api.userPoints.boostContent);
  const boostMutation = useMutation({
    mutationFn: convexMutation,
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(
          `Boosted rating! ${result.pointsTransferred} points transferred to author.`,
          {
            icon: '🚀',
            duration: 3000,
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: ['convexQuery', api.userPoints.getUserPointsStats],
        });
        queryClient.invalidateQueries({
          queryKey: ['convexQuery', api.userPoints.getBoostCost],
        });
      } else {
        toast.error(result?.message || 'Failed to boost rating', {
          icon: '❌',
        });
      }
    },
    onError: (error) => {
      // Log error for debugging in development
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Boost error:', error);
      }
      toast.error('Failed to boost rating. Please try again.', {
        icon: '❌',
      });
    },
  });

  // Check if user can boost (not their own rating, has enough points, hasn't boosted already)
  const canBoost = React.useMemo(() => {
    if (!userPoints || pointsLoading) return false;
    if (authorUserId === userPoints.userId) return false; // Can't boost own rating
    if (hasUserBoosted) return false; // Already boosted
    if (!boostCost) return false; // Cost not loaded
    if (userPoints.currentBalance < boostCost) return false; // Not enough points

    return true;
  }, [userPoints, pointsLoading, authorUserId, hasUserBoosted, boostCost]);

  const handleBoost = async () => {
    if (!canBoost || boostMutation.isPending) return;

    // Show loading toast
    const loadingToast = toast.loading('Boosting rating...', {
      id: 'boost-rating',
    });

    try {
      await boostMutation.mutateAsync({
        contentType: 'rating',
        contentId: ratingId,
      });
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Get button text based on state
  const getButtonText = () => {
    if (hasUserBoosted) return 'Boosted';
    if (!userPoints || authorUserId === userPoints.userId) return 'Boost';
    if (boostCost && userPoints.currentBalance < boostCost)
      return 'Not enough points';
    return `Boost (${boostCost || '?'} pts)`;
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (!userPoints) return 'Loading...';
    if (authorUserId === userPoints.userId)
      return "You can't boost your own rating";
    if (hasUserBoosted) return 'You have already boosted this rating';
    if (boostCost && userPoints.currentBalance < boostCost) {
      return `Need ${boostCost} points (you have ${userPoints.currentBalance})`;
    }
    return `Transfer ${boostCost || 0} points to boost this rating`;
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={hasUserBoosted ? 'secondary' : 'outline'}
        size={size === 'md' ? 'default' : size}
        className={cn(
          'transition-all duration-200',
          hasUserBoosted &&
            'border-success/20 bg-success/10 text-success hover:bg-success/20',
          !canBoost && !hasUserBoosted && 'cursor-not-allowed opacity-50',
          className
        )}
        onClick={handleBoost}
        disabled={!canBoost || boostMutation.isPending}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {boostMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ArrowUp
            className={cn(
              'h-3 w-3 transition-transform',
              hasUserBoosted && 'text-success',
              canBoost && !hasUserBoosted && 'hover:scale-110'
            )}
          />
        )}
        <span className="text-xs font-medium">{getButtonText()}</span>
      </Button>

      {showScore && currentBoostScore > 0 && (
        <span
          className="text-muted-foreground text-xs font-medium"
          aria-label={`Current boost score: ${currentBoostScore}`}
        >
          +{currentBoostScore}
        </span>
      )}
    </div>
  );
}

/**
 * Usage example:
 *
 * ```tsx
 * <BoostButton
 *   ratingId="rating123"
 *   authorUserId="user456"
 *   currentBoostScore={5}
 *   hasUserBoosted={false}
 *   showScore={true}
 *   size="sm"
 * />
 * ```
 */
