import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from '@/components/ui/icons';
import { cn } from '@/utils/tailwind-utils';
import { useToggleRatingLikeMutation } from '@/queries';
import { useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';
import type { Id } from '@vibechecc/convex/dataModel';

interface RatingLikeButtonProps {
  ratingId: Id<'ratings'>;
  likeCount: number;
  isLiked: boolean;
  onLikeChange?: (liked: boolean) => void;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
  isOwnRating?: boolean;
}

export function RatingLikeButton({
  ratingId,
  likeCount,
  isLiked: initialIsLiked,
  onLikeChange,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
  isOwnRating = false,
}: RatingLikeButtonProps) {
  const { user } = useUser();
  const toggleLikeMutation = useToggleRatingLikeMutation();
  const [optimisticIsLiked, setOptimisticIsLiked] = React.useState(initialIsLiked);
  const [optimisticCount, setOptimisticCount] = React.useState(likeCount);

  // Update state when props change
  React.useEffect(() => {
    setOptimisticIsLiked(initialIsLiked);
    setOptimisticCount(likeCount);
  }, [initialIsLiked, likeCount]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('sign in to like reviews', {
        duration: 3000,
        icon: '❤️',
      });
      return;
    }

    if (isOwnRating) {
      toast.error('you cannot like your own review', {
        duration: 3000,
        icon: '🚫',
      });
      return;
    }

    // Optimistic update
    const newIsLiked = !optimisticIsLiked;
    setOptimisticIsLiked(newIsLiked);
    setOptimisticCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const result = await toggleLikeMutation.mutateAsync({ ratingId });
      
      // Update with actual result if needed
      if (result.action === 'liked') {
        onLikeChange?.(true);
      } else if (result.action === 'unliked') {
        onLikeChange?.(false);
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticIsLiked(!newIsLiked);
      setOptimisticCount(likeCount);
      
      toast.error('failed to update like', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || toggleLikeMutation.isPending}
      className={cn(
        'gap-1.5 transition-all',
        optimisticIsLiked && 'text-destructive hover:text-destructive',
        className
      )}
      aria-label={optimisticIsLiked ? 'Unlike review' : 'Like review'}
    >
      <Heart 
        className={cn(
          'h-3.5 w-3.5 transition-all',
          optimisticIsLiked && 'fill-current'
        )}
      />
      {optimisticCount > 0 && (
        <span className="text-xs">
          {optimisticCount}
        </span>
      )}
    </Button>
  );
}