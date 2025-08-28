import type { EmojiRating } from '@vibechecc/types';
import { EmojiRatingDisplay } from './emoji-rating-display';
import type {
  EmojiRatingData,
  UnifiedEmojiRatingHandler,
} from './emoji-reaction';

interface MostRatedDisplayProps {
  emojiRatings: EmojiRating[];
  vibeId: string;
  onEmojiClick: UnifiedEmojiRatingHandler;
  vibeTitle?: string;
  className?: string;
  showPopover?: boolean;
  emojiColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MostRatedDisplay({
  emojiRatings,
  vibeId,
  onEmojiClick,
  vibeTitle,
  className,
  showPopover = true,
  emojiColor,
  size = 'md',
}: MostRatedDisplayProps) {
  if (!emojiRatings || emojiRatings.length === 0) {
    return null;
  }

  // Find the emoji with the most ratings (highest count)
  const mostRated = emojiRatings.reduce((highest, current) => {
    const currentCount = current.count || 0;
    const highestCount = highest.count || 0;
    return currentCount > highestCount ? current : highest;
  });

  const mostRatingData: EmojiRatingData = {
    emoji: mostRated.emoji,
    value: mostRated.value,
    count: mostRated.count || 0,
  };

  return (
    <EmojiRatingDisplay
      rating={mostRatingData}
      vibeId={vibeId}
      onEmojiClick={onEmojiClick}
      vibeTitle={vibeTitle}
      className={className}
      emojiColor={emojiColor}
      size={size}
    />
  );
}
