import type { EmojiRating } from '@vibechecc/types';
import { EmojiRatingDisplay } from './emoji-rating-display';
import type {
  EmojiRatingData,
  UnifiedEmojiRatingHandler,
} from './emoji-reaction';

interface HighestRatedEmojiDisplayProps {
  emojiRatings: EmojiRating[];
  vibeId: string;
  onEmojiClick: UnifiedEmojiRatingHandler;
  vibeTitle?: string;
  className?: string;
  showPopover?: boolean;
  emojiColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function HighestRatedEmojiDisplay({
  emojiRatings,
  vibeId,
  onEmojiClick,
  vibeTitle,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showPopover = true,
  emojiColor,
  size = 'md',
}: HighestRatedEmojiDisplayProps) {
  if (!emojiRatings || emojiRatings.length === 0) {
    return null;
  }

  // Find the emoji with the highest average rating
  const topRated = emojiRatings.reduce((highest, current) => {
    return current.value > highest.value ? current : highest;
  });

  const topRatingData: EmojiRatingData = {
    emoji: topRated.emoji,
    value: topRated.value,
    count: topRated.count || 0,
  };

  return (
    <EmojiRatingDisplay
      rating={topRatingData}
      vibeId={vibeId}
      onEmojiClick={onEmojiClick}
      vibeTitle={vibeTitle}
      className={className}
      emojiColor={emojiColor}
      size={size}
    />
  );
}
