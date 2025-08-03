/**
 * Emoji sentiment analysis utility for rating analytics
 * Categorizes emojis by emotional sentiment for engagement insights
 */

// Sentiment categories based on emotional psychology
export type EmojiSentiment =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'mixed'
  | 'intense';

// Emoji sentiment mapping for analytics
const EMOJI_SENTIMENT_MAP: Record<string, EmojiSentiment> = {
  // Positive emotions
  '😍': 'positive',
  '🥰': 'positive',
  '😊': 'positive',
  '😁': 'positive',
  '😄': 'positive',
  '🤩': 'positive',
  '🔥': 'positive',
  '💯': 'positive',
  '⭐': 'positive',
  '✨': 'positive',
  '🎉': 'positive',
  '👏': 'positive',
  '💖': 'positive',
  '💕': 'positive',
  '😌': 'positive',
  '🙌': 'positive',
  '👍': 'positive',
  '💪': 'positive',
  '🌟': 'positive',
  '🏆': 'positive',

  // Negative emotions
  '😭': 'negative',
  '😢': 'negative',
  '😞': 'negative',
  '😔': 'negative',
  '😕': 'negative',
  '😟': 'negative',
  '😰': 'negative',
  '😨': 'negative',
  '😱': 'intense', // Shock can be positive or negative
  '😡': 'negative',
  '😠': 'negative',
  '🤬': 'negative',
  '😤': 'negative',
  '💔': 'negative',
  '😷': 'negative',
  '🤢': 'negative',
  '🤮': 'negative',
  '👎': 'negative',
  '😣': 'negative',
  '😖': 'negative',

  // Neutral/thinking emotions
  '🤔': 'neutral',
  '😐': 'neutral',
  '😑': 'neutral',
  '🙄': 'neutral',
  '😒': 'neutral',
  '😶': 'neutral',
  '🤐': 'neutral',
  '🤷': 'neutral',
  '👀': 'neutral',
  '🤫': 'neutral',

  // Mixed/complex emotions
  '😅': 'mixed',
  '😬': 'mixed',
  '🤨': 'mixed',
  '😏': 'mixed',
  '😈': 'mixed',
  '🤪': 'mixed',
  '🥴': 'mixed',
  '😵': 'mixed',
  '🤯': 'intense',
  '🥺': 'mixed',
  '🫠': 'mixed',

  // Intense emotions (very strong reactions)
  '🤣': 'intense',
  '😂': 'intense',
  '💀': 'intense',
  '⚡': 'intense',
  '🌪️': 'intense',
  '💥': 'intense',
  '🔝': 'intense',
  '📈': 'intense',

  // Default/unknown
  '❓': 'neutral',
  '❔': 'neutral',
};

/**
 * Get sentiment for an emoji
 */
export function getEmojiSentiment(emoji: string): EmojiSentiment {
  return EMOJI_SENTIMENT_MAP[emoji] || 'neutral';
}

/**
 * Analyze sentiment distribution in a collection of emojis
 */
export function analyzeSentimentDistribution(
  emojis: string[]
): Record<EmojiSentiment, number> {
  const distribution: Record<EmojiSentiment, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
    intense: 0,
  };

  emojis.forEach((emoji) => {
    const sentiment = getEmojiSentiment(emoji);
    distribution[sentiment]++;
  });

  return distribution;
}

/**
 * Get dominant sentiment from a collection of emojis
 */
export function getDominantSentiment(emojis: string[]): EmojiSentiment {
  const distribution = analyzeSentimentDistribution(emojis);
  let maxCount = 0;
  let dominantSentiment: EmojiSentiment = 'neutral';

  Object.entries(distribution).forEach(([sentiment, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantSentiment = sentiment as EmojiSentiment;
    }
  });

  return dominantSentiment;
}

/**
 * Get sentiment score for analytics (numeric representation)
 * Positive: 1, Mixed/Intense: 0, Negative: -1, Neutral: 0
 */
export function getSentimentScore(sentiment: EmojiSentiment): number {
  switch (sentiment) {
    case 'positive':
      return 1;
    case 'negative':
      return -1;
    case 'neutral':
    case 'mixed':
    case 'intense':
    default:
      return 0;
  }
}
