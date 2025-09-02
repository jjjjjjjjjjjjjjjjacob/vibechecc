import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { useUser } from '@clerk/tanstack-react-start';
import {
  showPointsToast,
  showInsufficientPointsToast,
} from '@/utils/points-toast';
import { useBoostContentMutation, useDampenContentMutation } from '@/queries';
import toast from '@/utils/toast';
import type { Id } from '@vibechecc/convex/dataModel';

interface BoostButtonProps {
  contentId: Id<'vibes'> | Id<'ratings'>;
  contentType: 'vibe' | 'rating';
  currentBoostScore: number;
  boostCost: number;
  dampenCost: number;
  userPoints: number;
  userBoostAction?: 'boost' | 'dampen' | null;
  onBoostChange?: (action: 'boost' | 'dampen' | null, newScore: number) => void;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
  isOwnContent?: boolean;
  showCostOnHover?: boolean;
}

export function BoostButton({
  contentId,
  contentType,
  currentBoostScore,
  boostCost,
  dampenCost,
  userPoints,
  userBoostAction: initialBoostAction,
  onBoostChange,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
  isOwnContent = false,
  showCostOnHover = true,
}: BoostButtonProps) {
  const { user } = useUser();
  const boostContentMutation = useBoostContentMutation();
  const dampenContentMutation = useDampenContentMutation();
  const [optimisticAction, setOptimisticAction] =
    React.useState(initialBoostAction);
  const [optimisticScore, setOptimisticScore] =
    React.useState(currentBoostScore);
  const isLoading =
    boostContentMutation.isPending || dampenContentMutation.isPending;

  // Update state when props change
  React.useEffect(() => {
    setOptimisticAction(initialBoostAction);
    setOptimisticScore(currentBoostScore);
  }, [initialBoostAction, currentBoostScore]);

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

    if (userPoints < boostCost) {
      showInsufficientPointsToast(boostCost, userPoints, {
        showAction: true,
        actionLabel: 'earn points',
        onAction: () => {
          // Navigate to earning points guide or close toast
        },
      });
      return;
    }

    const isCurrentlyBoosted = optimisticAction === 'boost';
    const newAction: 'boost' | null = isCurrentlyBoosted ? null : 'boost';
    const scoreDelta = isCurrentlyBoosted ? -1 : 1;

    // Optimistic update
    setOptimisticAction(newAction);
    setOptimisticScore((prev) => prev + scoreDelta);

    try {
      const result = await boostContentMutation.mutateAsync({
        contentId,
        contentType,
      });

      onBoostChange?.(newAction, optimisticScore + scoreDelta);

      if (newAction === 'boost') {
        // Show message with point transfer info
        if (result.message) {
          toast.success(result.message, {
            duration: 4000,
            icon: '🚀',
          });
        } else {
          showPointsToast('spent', boostCost, 'content boosted!');
        }
      } else {
        showPointsToast('earned', Math.floor(boostCost * 0.5), 'boost removed');
      }
    } catch (_error) {
      // Revert optimistic update on error
      setOptimisticAction(initialBoostAction);
      setOptimisticScore(currentBoostScore);

      toast.error('failed to boost content', {
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
        icon: '🚀',
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

    if (userPoints < dampenCost) {
      showInsufficientPointsToast(dampenCost, userPoints, {
        showAction: true,
        actionLabel: 'earn points',
        onAction: () => {
          // Navigate to earning points guide or close toast
        },
      });
      return;
    }

    const isCurrentlyDampened = optimisticAction === 'dampen';
    const newAction: 'dampen' | null = isCurrentlyDampened ? null : 'dampen';
    const scoreDelta = isCurrentlyDampened ? 1 : -1;

    // Optimistic update
    setOptimisticAction(newAction);
    setOptimisticScore((prev) => prev + scoreDelta);

    try {
      const result = await dampenContentMutation.mutateAsync({
        contentId,
        contentType,
      });

      onBoostChange?.(newAction, optimisticScore + scoreDelta);

      if (newAction === 'dampen') {
        // Show message with point penalty info
        if (result.message) {
          toast.success(result.message, {
            duration: 4000,
            icon: '📉',
          });
        } else {
          showPointsToast('spent', dampenCost, 'content dampened');
        }
      } else {
        showPointsToast(
          'earned',
          Math.floor(dampenCost * 0.5),
          'dampen removed'
        );
      }
    } catch (_error) {
      // Revert optimistic update on error
      setOptimisticAction(initialBoostAction);
      setOptimisticScore(currentBoostScore);

      toast.error('failed to dampen content', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  const isBoostActive = optimisticAction === 'boost';
  const isDampenActive = optimisticAction === 'dampen';

  return (
    <div className="flex items-center gap-1">
      {/* Boost Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleBoost}
        disabled={disabled || isLoading}
        className={cn(
          'gap-1 transition-all',
          isBoostActive && 'text-theme-primary hover:text-theme-primary',
          className
        )}
        aria-label={
          isBoostActive
            ? `Remove boost (refund ${Math.floor(boostCost * 0.5)} points)`
            : `Boost content (${boostCost} points)`
        }
        title={
          showCostOnHover
            ? isBoostActive
              ? `Remove boost (refund ${Math.floor(boostCost * 0.5)} points)`
              : `Boost content (${boostCost} points)`
            : undefined
        }
      >
        <ArrowUp
          className={cn(
            'h-3.5 w-3.5 transition-all',
            isBoostActive && 'fill-current'
          )}
        />
      </Button>

      {/* Score Display */}
      {optimisticScore !== 0 && (
        <span
          className={cn(
            'px-1 text-xs font-medium',
            optimisticScore > 0 ? 'text-theme-primary' : 'text-destructive'
          )}
        >
          {optimisticScore > 0 ? '+' : ''}
          {optimisticScore}
        </span>
      )}

      {/* Dampen Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleDampen}
        disabled={disabled || isLoading}
        className={cn(
          'gap-1 transition-all',
          isDampenActive && 'text-destructive hover:text-destructive',
          className
        )}
        aria-label={
          isDampenActive
            ? `Remove dampen (refund ${Math.floor(dampenCost * 0.5)} points)`
            : `Dampen content (${dampenCost} points)`
        }
        title={
          showCostOnHover
            ? isDampenActive
              ? `Remove dampen (refund ${Math.floor(dampenCost * 0.5)} points)`
              : `Dampen content (${dampenCost} points)`
            : undefined
        }
      >
        <ArrowDown
          className={cn(
            'h-3.5 w-3.5 transition-all',
            isDampenActive && 'fill-current'
          )}
        />
      </Button>
    </div>
  );
}
