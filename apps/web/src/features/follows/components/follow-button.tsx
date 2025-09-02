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

  const getButtonText = () => {
    if (isLoading) return '';
    if (isFollowing) {
      return isHovered ? unfollowText : followingText;
    }
    return followText;
  };

  const getButtonIcon = () => {
    if (!showIcon) return null;

    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isFollowing) {
      return isHovered ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4 fill-current" />
      );
    }

    return <UserPlus className="h-4 w-4" />;
  };

  if (isCheckingStatus) {
    return (
      <Button
        size={size}
        variant="outline"
        disabled
        className={cn(
          'border-border bg-background/50',
          variant === 'compact' && 'px-3 py-1 text-xs',
          className
        )}
      >
        {showIcon && <Loader2 className="h-4 w-4 animate-spin" />}
        {variant !== 'compact' && <span className="ml-2">loading...</span>}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleClick}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        // Base styles
        'border-none transition-all duration-200',

        // Following state styles (gradient background)
        isFollowing && [
          'from-theme-primary to-theme-secondary text-primary-foreground bg-gradient-to-r',
          'shadow-lg hover:scale-105 hover:shadow-xl',
        ],

        // Not following state styles (outline)
        !isFollowing && [
          'border-theme-primary text-theme-primary border bg-transparent',
          'hover:from-theme-primary hover:to-theme-secondary hover:bg-gradient-to-r',
          'hover:text-primary-foreground hover:border-theme-primary',
          'hover:scale-105 hover:shadow-lg',
        ],

        // Compact variant
        variant === 'compact' && 'px-3 py-1 text-xs font-medium',

        // Loading state
        isLoading && 'cursor-not-allowed opacity-75',

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
