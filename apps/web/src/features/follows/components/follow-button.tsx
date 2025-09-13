import * as React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { useFollowUser } from '../hooks/use-follow-user';
import { useIsCurrentUserFollowing } from '../hooks/use-is-following';

interface FollowButtonProps {
  targetUserId: string;
  username?: string;
  variant?: 'default' | 'compact';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
  showIcon?: boolean;
  followText?: string;
  followingText?: string;
  unfollowText?: string;
}

export function FollowButton({
  targetUserId,
  username,
  variant = 'default',
  size = 'default',
  className,
  onFollowChange,
  showIcon = true,
  followText = 'follow',
  followingText = 'following',
  unfollowText = 'unfollow',
}: FollowButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const { data: isFollowing, isLoading: isCheckingStatus } =
    useIsCurrentUserFollowing(targetUserId);

  const { followUser, unfollowUser, isLoading } = useFollowUser({
    onSuccess: () => {
      onFollowChange?.(!isFollowing);
    },
  });

  const handleClick = React.useCallback(() => {
    if (isLoading || isCheckingStatus) return;

    if (isFollowing) {
      unfollowUser({ targetUserId, username });
    } else {
      followUser({ targetUserId, username });
    }
  }, [
    isFollowing,
    isLoading,
    isCheckingStatus,
    followUser,
    unfollowUser,
    targetUserId,
    username,
  ]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const getButtonText = () => {
    if (isLoading) return '';
    if (isFollowing) {
      return isHovered || isFocused ? unfollowText : followingText;
    }
    return followText;
  };

  const getButtonIcon = () => {
    if (!showIcon) return null;

    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
    }

    if (isFollowing) {
      return isHovered || isFocused ? (
        <UserMinus className="h-4 w-4" aria-hidden="true" />
      ) : (
        <UserPlus className="h-4 w-4 fill-current" aria-hidden="true" />
      );
    }

    return <UserPlus className="h-4 w-4" aria-hidden="true" />;
  };

  const getAriaLabel = () => {
    if (isLoading) {
      return `${isFollowing ? 'Unfollowing' : 'Following'} ${username || 'user'}...`;
    }
    if (isFollowing) {
      return isHovered || isFocused
        ? `Unfollow ${username || 'user'}`
        : `Following ${username || 'user'}. Click to unfollow`;
    }
    return `Follow ${username || 'user'}`;
  };

  if (isCheckingStatus) {
    return (
      <Button
        size={size}
        variant="outline"
        disabled
        aria-label="Checking follow status..."
        className={cn(
          'border-border bg-background/50 cursor-wait',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
          variant === 'compact' && 'px-3 py-1 text-xs',
          className
        )}
      >
        {showIcon && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {variant !== 'compact' && <span className="ml-2">loading...</span>}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? 'default' : 'outline'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={getAriaLabel()}
      aria-pressed={isFollowing}
      role="button"
      className={cn(
        // Base styles with improved transitions
        'relative transition-all duration-300 ease-out',
        'transform-gpu', // Use GPU acceleration for smoother animations

        // Enhanced focus styles for accessibility
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:outline-none',

        // Following state styles (more prominent gradient)
        isFollowing && [
          'from-primary to-primary/90 text-primary-foreground bg-gradient-to-r',
          'border-transparent shadow-sm',
          // Enhanced hover state for unfollow intent
          'hover:from-destructive hover:to-destructive/90',
          'hover:scale-[1.02] hover:shadow-md',
          // Focus state
          'focus-visible:from-destructive focus-visible:to-destructive/90',
          'focus-visible:scale-[1.02] focus-visible:shadow-md',
        ],

        // Not following state styles (improved contrast)
        !isFollowing && [
          'border-primary text-primary bg-transparent',
          'shadow-sm hover:shadow-md',
          // More prominent hover state
          'hover:from-primary hover:to-primary/90 hover:bg-gradient-to-r',
          'hover:text-primary-foreground hover:border-transparent',
          'hover:scale-[1.02]',
          // Focus state
          'focus-visible:from-primary focus-visible:to-primary/90 focus-visible:bg-gradient-to-r',
          'focus-visible:text-primary-foreground focus-visible:border-transparent',
          'focus-visible:scale-[1.02]',
        ],

        // Active state (pressed feedback)
        'active:scale-[0.98] active:shadow-sm',

        // Compact variant
        variant === 'compact' && 'px-3 py-1 text-xs font-medium',

        // Loading state improvements
        isLoading && [
          'cursor-wait opacity-75',
          'hover:scale-100 focus-visible:scale-100 active:scale-100',
          'pointer-events-none', // Prevent multiple clicks during loading
        ],

        className
      )}
    >
      {getButtonIcon()}
      {variant !== 'compact' && (
        <span className={cn('font-medium lowercase')}>{getButtonText()}</span>
      )}
    </Button>
  );
}
