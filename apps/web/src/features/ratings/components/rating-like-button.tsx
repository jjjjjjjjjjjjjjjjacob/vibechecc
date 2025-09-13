import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@vibechecc/convex';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { toast } from '@/utils/toast';
import { useUser } from '@clerk/tanstack-react-start';
import type { Rating } from '@vibechecc/types';

interface RatingLikeButtonProps {
  rating: Rating;
  variant?: 'default' | 'minimal';
  size?: 'sm' | 'md';
  showCount?: boolean;
  className?: string;
}

export function RatingLikeButton({
  rating,
  variant = 'default',
  size = 'sm',
  showCount = true,
  className,
}: RatingLikeButtonProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Get like status and count for this rating
  const isLiked =
    useQuery(
      api.ratingLikes.isRatingLikedByUser,
      user ? { ratingId: rating._id || '' } : 'skip'
    ) ?? false;

  const likeCount =
    useQuery(api.ratingLikes.getRatingLikeCount, {
      ratingId: rating._id || '',
    }) ?? 0;

  const likeRatingMutation = useMutation(api.ratingLikes.likeRating);

  const handleLike = async () => {
    if (!user) {
      toast.error('Sign in required to like ratings');
      return;
    }

    if (!rating._id) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await likeRatingMutation({
        ratingId: rating._id,
      });

      toast.success(
        result.action === 'liked' ? '❤️ Rating liked!' : 'Rating unliked'
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error liking rating:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to like rating. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show for user's own ratings
  if (rating.userId === user?.id) {
    return null;
  }

  const isMinimal = variant === 'minimal';
  const isSmall = size === 'sm';

  return (
    <Button
      onClick={handleLike}
      disabled={isLoading}
      variant={isMinimal ? 'ghost' : isLiked ? 'default' : 'outline'}
      size={isSmall ? 'sm' : 'default'}
      className={cn(
        'group transition-all duration-200',
        isMinimal && 'h-auto p-1 hover:bg-transparent',
        isLiked &&
          !isMinimal &&
          'bg-theme-primary/10 hover:bg-theme-primary/20 border-theme-primary/50',
        !isLiked && !isMinimal && 'hover:border-theme-primary/50',
        className
      )}
    >
      {isLoading ? (
        <Loader2
          className={cn(isSmall ? 'h-3 w-3' : 'h-4 w-4', 'animate-spin')}
        />
      ) : (
        <Heart
          className={cn(
            isSmall ? 'h-3 w-3' : 'h-4 w-4',
            'transition-all duration-200',
            isLiked
              ? 'fill-theme-primary text-theme-primary scale-110'
              : 'text-muted-foreground group-hover:text-theme-primary group-hover:scale-110',
            isMinimal && isLiked && 'fill-theme-primary text-theme-primary',
            isMinimal && !isLiked && 'hover:fill-theme-primary/20'
          )}
        />
      )}
      {showCount && !isMinimal && likeCount > 0 && (
        <span
          className={cn(
            'ml-1.5 font-medium transition-colors duration-200',
            isSmall ? 'text-xs' : 'text-sm',
            isLiked
              ? 'text-theme-primary'
              : 'text-muted-foreground group-hover:text-theme-primary'
          )}
        >
          {likeCount}
        </span>
      )}
      {isMinimal && showCount && likeCount > 0 && (
        <span
          className={cn(
            'text-muted-foreground ml-1 text-xs',
            isLiked && 'text-theme-primary'
          )}
        >
          {likeCount}
        </span>
      )}
    </Button>
  );
}

/**
 * Compact version for use in tight spaces
 */
export function CompactRatingLikeButton({
  rating,
  className,
}: {
  rating: Rating;
  className?: string;
}) {
  return (
    <RatingLikeButton
      rating={rating}
      variant="minimal"
      size="sm"
      showCount={true}
      className={className}
    />
  );
}
