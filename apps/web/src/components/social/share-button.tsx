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
  textContrast?: 'light' | 'dark';
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
  textContrast,
}: ShareButtonProps) {
  const [shareCount] = useState(currentShareCount);
  const [showShareModal, setShowShareModal] = useState(false);

  // Helper function to get contrast-aware button classes (no background for share button)
  const getContrastAwareClasses = (textContrast?: 'light' | 'dark') => {
    if (!textContrast) return '';

    if (textContrast === 'light') {
      return 'text-black/90 hover:text-black border-black/20 hover:bg-white/20';
    } else if (textContrast === 'dark') {
      return 'text-white/90 hover:text-white border-white/20 hover:bg-white/20';
    }
    return '';
  };

  // Ensure we have required props for vibe sharing
  if (contentType === 'vibe' && (!vibe || !author)) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        className={cn(
          'm-0 aspect-square gap-2 p-0',
          getContrastAwareClasses(textContrast),
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          setShowShareModal(true);
        }}
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
