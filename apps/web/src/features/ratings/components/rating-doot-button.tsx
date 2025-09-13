import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { Button } from '@/components/ui/button';
import { ArrowDown, Loader2, AlertTriangle } from '@/components/ui/icons';
import { api } from '@vibechecc/convex';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RatingDootButtonProps {
  /** The ID of the rating to dampen */
  ratingId: string;
  /** The user ID of the rating author (to prevent self-dampening) */
  authorUserId: string;
  /** Current dampen score for display */
  currentDampenScore?: number;
  /** Size variant for the button */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Whether to show the dampen score */
  showScore?: boolean;
  /** Whether the user has already dampened this rating */
  hasUserDampened?: boolean;
}

export function RatingDootButton({
  ratingId,
  authorUserId,
  currentDampenScore = 0,
  size = 'sm',
  className,
  showScore = true,
  hasUserDampened = false,
}: RatingDootButtonProps) {
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  // Get current user's points stats
  const { data: userPoints, isLoading: pointsLoading } = useQuery(
    convexQuery(api.userPoints.getUserPointsStats, {})
  );

  // Get dampen cost for this rating
  const { data: dampenCostData } = useQuery(
    convexQuery(api.userPoints.getBoostCost, {
      contentType: 'rating',
      contentId: ratingId,
    })
  );
  const dampenCost =
    typeof dampenCostData === 'object'
      ? dampenCostData?.dampenCost
      : dampenCostData;

  // Dampen content mutation
  const convexMutation = useConvexMutation(api.userPoints.dampenContent);
  const dampenMutation = useMutation({
    mutationFn: convexMutation,
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(
          `Rating dampened. ${result.pointsPenalized} points deducted from author.`,
          {
            icon: '⬇️',
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
        toast.error(result?.message || 'Failed to dampen rating', {
          icon: '❌',
        });
      }
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      // Log error for debugging in development
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Dampen error:', error);
      }
      toast.error('Failed to dampen rating. Please try again.', {
        icon: '❌',
      });
      setShowConfirmDialog(false);
    },
  });

  // Check if user can dampen (not their own rating, has enough points, hasn't dampened already)
  const canDampen = React.useMemo(() => {
    if (!userPoints || pointsLoading) return false;
    if (authorUserId === userPoints.userId) return false; // Can't dampen own rating
    if (hasUserDampened) return false; // Already dampened
    if (!dampenCost) return false; // Cost not loaded
    if (userPoints.currentBalance < dampenCost) return false; // Not enough points

    return true;
  }, [userPoints, pointsLoading, authorUserId, hasUserDampened, dampenCost]);

  const handleDampen = async () => {
    if (!canDampen || dampenMutation.isPending) return;

    // Show loading toast
    const loadingToast = toast.loading('Dampening rating...', {
      id: 'dampen-rating',
    });

    try {
      await dampenMutation.mutateAsync({
        contentType: 'rating',
        contentId: ratingId,
      });
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Get button text based on state
  const getButtonText = () => {
    if (hasUserDampened) return 'Dampened';
    if (!userPoints || authorUserId === userPoints.userId) return 'Dampen';
    if (dampenCost && userPoints.currentBalance < dampenCost)
      return 'Not enough points';
    return `Dampen (${dampenCost || '?'} pts)`;
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (!userPoints) return 'Loading...';
    if (authorUserId === userPoints.userId)
      return "You can't dampen your own rating";
    if (hasUserDampened) return 'You have already dampened this rating';
    if (dampenCost && userPoints.currentBalance < dampenCost) {
      return `Need ${dampenCost} points (you have ${userPoints.currentBalance})`;
    }
    return `Costs ${dampenCost || 0} points to dampen this rating`;
  };

  return (
    <div className="flex items-center gap-1">
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogTrigger asChild>
          <Button
            variant={hasUserDampened ? 'secondary' : 'outline'}
            size={size === 'md' ? 'default' : size}
            className={cn(
              'transition-all duration-200',
              hasUserDampened &&
                'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20',
              !canDampen && !hasUserDampened && 'cursor-not-allowed opacity-50',
              className
            )}
            disabled={!canDampen}
            title={getTooltipText()}
            aria-label={getTooltipText()}
          >
            <ArrowDown
              className={cn(
                'h-3 w-3 transition-transform',
                hasUserDampened && 'text-destructive',
                canDampen && !hasUserDampened && 'hover:scale-110'
              )}
            />
            <span className="text-xs font-medium">{getButtonText()}</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-warning h-5 w-5" />
              Confirm Dampen Action
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Are you sure you want to dampen this rating? This action will:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                <li>
                  Cost you <strong>{dampenCost || 0} points</strong>
                </li>
                <li>
                  Deduct points from the rating author based on their karma
                </li>
                <li>Cannot be undone</li>
              </ul>
              <p className="text-muted-foreground text-xs">
                Use this feature responsibly to maintain community quality.
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={dampenMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDampen}
              disabled={dampenMutation.isPending}
              className="gap-2"
            >
              {dampenMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Dampening...
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4" />
                  Confirm Dampen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showScore && currentDampenScore > 0 && (
        <span
          className="text-muted-foreground text-xs font-medium"
          aria-label={`Current dampen score: ${currentDampenScore}`}
        >
          -{currentDampenScore}
        </span>
      )}
    </div>
  );
}

/**
 * Usage example:
 *
 * ```tsx
 * <RatingDootButton
 *   ratingId="rating123"
 *   authorUserId="user456"
 *   currentDampenScore={2}
 *   hasUserDampened={false}
 *   showScore={true}
 *   size="sm"
 * />
 * ```
 */
