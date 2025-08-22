import { toast } from './toast';

interface PointsToastOptions {
  duration?: number;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function showPointsToast(
  action: 'earned' | 'spent',
  amount: number,
  message: string,
  options?: PointsToastOptions
) {
  const { duration = 4000, showAction, actionLabel, onAction } = options || {};
  
  const isEarned = action === 'earned';
  const icon = isEarned ? '✨' : '💸';
  const sign = isEarned ? '+' : '-';
  
  // Create formatted message with points amount prominently displayed
  const formattedMessage = `${sign}${amount} points: ${message}`;
  
  const toastAction = showAction && actionLabel && onAction 
    ? {
        label: actionLabel,
        onClick: onAction,
      }
    : undefined;

  if (isEarned) {
    return toast.success(formattedMessage, {
      icon,
      duration,
      action: toastAction,
      className: 'border-l-4 border-l-theme-primary',
    });
  } else {
    return toast.info(formattedMessage, {
      icon,
      duration,
      action: toastAction,
      className: 'border-l-4 border-l-orange-500',
    });
  }
}

export function showLevelUpToast(
  newLevel: number,
  pointsRequired: number,
  options?: Omit<PointsToastOptions, 'duration'>
) {
  const { showAction, actionLabel, onAction } = options || {};
  
  const toastAction = showAction && actionLabel && onAction 
    ? {
        label: actionLabel,
        onClick: onAction,
      }
    : undefined;

  return toast.success(
    `level up! you've reached level ${newLevel}`,
    {
      icon: '🎉',
      duration: 6000,
      action: toastAction,
      className: 'border-l-4 border-l-theme-primary bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10',
    }
  );
}

export function showStreakToast(
  streakDays: number,
  bonusPoints?: number,
  options?: PointsToastOptions
) {
  const { duration = 5000, showAction, actionLabel, onAction } = options || {};
  
  const toastAction = showAction && actionLabel && onAction 
    ? {
        label: actionLabel,
        onClick: onAction,
      }
    : undefined;

  const bonusMessage = bonusPoints ? ` (+${bonusPoints} bonus points!)` : '';
  const message = `${streakDays} day streak!${bonusMessage}`;

  return toast.success(message, {
    icon: '🔥',
    duration,
    action: toastAction,
    className: 'border-l-4 border-l-orange-500',
  });
}

export function showInsufficientPointsToast(
  required: number,
  current: number,
  options?: Omit<PointsToastOptions, 'duration'>
) {
  const { showAction, actionLabel, onAction } = options || {};
  
  const toastAction = showAction && actionLabel && onAction 
    ? {
        label: actionLabel,
        onClick: onAction,
      }
    : undefined;

  const shortfall = required - current;
  const message = `insufficient points. need ${shortfall} more points`;

  return toast.error(message, {
    icon: '⚠️',
    duration: 4000,
    action: toastAction,
    className: 'border-l-4 border-l-destructive',
  });
}