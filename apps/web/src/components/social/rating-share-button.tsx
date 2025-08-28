import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { RatingShareModal } from './rating-share-modal';
import type { Rating, Vibe } from '@vibechecc/types';

interface RatingShareButtonProps {
  rating: Rating;
  vibe: Vibe;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function RatingShareButton({
  rating,
  vibe,
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = false,
}: RatingShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowShareModal(true);
        }}
        aria-label={`Share ${rating.emoji} ${rating.value}/5 rating`}
      >
        <Share2 className="h-4 w-4" />
        {showLabel && <span className="text-xs">share</span>}
      </Button>

      <RatingShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        rating={rating}
        vibe={vibe}
      />
    </>
  );
}
