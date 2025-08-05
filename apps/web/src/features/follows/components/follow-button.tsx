import * as React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
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

        // Following state styles (gradient)
        isFollowing && [
          'from-theme-primary to-theme-secondary text-primary-foreground bg-gradient-to-r',
          'shadow-lg backdrop-blur-md',
          'hover:scale-105 hover:shadow-xl',
          // Hover state for unfollow
          isHovered &&
            'from-theme-primary to-theme-secondary border-none bg-gradient-to-r',
        ],

        // Not following state styles
        !isFollowing && [
          'bg-background/80 border-theme-primary/80 text-theme-primary border border-solid',
          'hover:from-theme-primary hover:to-theme-secondary hover:bg-gradient-to-r',
          'hover:text-foreground hover:border-none',
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
