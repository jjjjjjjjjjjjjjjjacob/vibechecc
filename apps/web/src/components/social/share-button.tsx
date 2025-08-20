import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { ShareModal } from './share-modal';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';

interface ShareButtonProps {
  contentType: 'vibe' | 'profile';
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showCount?: boolean;
  currentShareCount?: number;
  vibe?: Vibe;
  author?: User;
  ratings?: (EmojiRating | Rating)[];
}

export function ShareButton({
  contentType,
  variant = 'ghost',
  size = 'icon',
  className,
  showCount = false,
  currentShareCount = 0,
  vibe,
  author,
  ratings,
}: ShareButtonProps) {
  const [shareCount] = useState(currentShareCount);
  const [showShareModal, setShowShareModal] = useState(false);

  // Ensure we have required props for vibe sharing
  if (contentType === 'vibe' && (!vibe || !author)) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        onClick={() => setShowShareModal(true)}
      >
        <Share className="h-4 w-4" />
        {showCount && shareCount > 0 && (
          <span className="text-xs tabular-nums">{shareCount}</span>
        )}
      </Button>

      {contentType === 'vibe' && vibe && author && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          vibe={vibe}
          author={author}
          ratings={ratings}
        />
      )}
    </>
  );
}
