// Color assignment algorithm for emojis based on categories and characteristics

// Category-based color mappings
const CATEGORY_COLORS: Record<string, string> = {
  // Emoji categories
  smileys: '#FFD700', // Gold
  people: '#FF6B6B', // Coral
  animals: '#8B4513', // Saddle Brown
  food: '#FFA500', // Orange
  activities: '#4ECDC4', // Turquoise
  travel: '#3B82F6', // Blue
  objects: '#6B7280', // Gray
  symbols: '#9333EA', // Purple
  flags: '#10B981', // Emerald
};

// Emotion/sentiment-based colors
const _SENTIMENT_COLORS = {
  positive: {
    default: '#10B981', // Green
    love: '#EC4899', // Pink
    excited: '#F59E0B', // Amber
    happy: '#FFD700', // Gold
    cool: '#3B82F6', // Blue
  },
  negative: {
    default: '#EF4444', // Red
    sad: '#6B7280', // Gray
    angry: '#DC2626', // Dark Red
    scared: '#7C3AED', // Purple
    sick: '#84CC16', // Lime (sickly)
  },
  neutral: {
    default: '#6B7280', // Gray
    thinking: '#3B82F6', // Blue
    surprised: '#F59E0B', // Amber
  },
};

// Specific emoji color overrides for common emojis
const EMOJI_SPECIFIC_COLORS: Record<string, string> = {
  // Fire/Hot emojis
  '🔥': '#EF4444', // Red
  '❤️': '#EF4444', // Red
  '💕': '#EC4899', // Pink
  '💖': '#EC4899', // Pink
  '💗': '#EC4899', // Pink
  '💘': '#EC4899', // Pink
  '💝': '#EC4899', // Pink
  '💯': '#EF4444', // Red

  // Cool/Cold emojis
  '🥶': '#3B82F6', // Blue
  '❄️': '#60A5FA', // Light Blue
  '🧊': '#60A5FA', // Light Blue

  // Money/Success
  '💰': '#10B981', // Green
  '💸': '#10B981', // Green
  '🤑': '#10B981', // Green
  '💵': '#10B981', // Green

  // Nature
  '🌳': '#059669', // Green
  '🌲': '#059669', // Green
  '🌴': '#10B981', // Emerald
  '🌱': '#84CC16', // Lime
  '🌿': '#059669', // Green
  '🍀': '#059669', // Green

  // Special moods
  '😴': '#6B7280', // Gray
  '💀': '#1F2937', // Dark Gray
  '👻': '#F3F4F6', // Light Gray
  '🤡': '#DC2626', // Dark Red
  '🎉': '#F59E0B', // Amber
  '🌈': '#EC4899', // Pink (representing diversity)
};

// Keywords that suggest colors
const KEYWORD_COLORS: Record<string, string> = {
  // Emotions
  love: '#EC4899',
  heart: '#EF4444',
  happy: '#FFD700',
  sad: '#6B7280',
  angry: '#DC2626',
  scared: '#7C3AED',
  sick: '#84CC16',
  tired: '#6B7280',
  excited: '#F59E0B',
  cool: '#3B82F6',

  // Elements
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#92400E',
  air: '#E0E7FF',
  sun: '#FFD700',
  moon: '#6B7280',
  star: '#FFD700',

  // Nature
  plant: '#059669',
  tree: '#059669',
  flower: '#EC4899',
  animal: '#92400E',

  // Food
  food: '#FFA500',
  fruit: '#EF4444',
  vegetable: '#059669',
  sweet: '#EC4899',

  // Activities
  sport: '#4ECDC4',
  music: '#9333EA',
  art: '#EC4899',
  game: '#4ECDC4',
};

/**
 * Determine a representative color for an emoji based on several heuristics.
 * The priority order is overrides, keyword hints, category defaults, then gray.
 */
export function getEmojiColor(
  emoji: string,
  name: string,
  keywords: string[],
  category: string
): string {
  // 1. check specific emoji overrides first
  if (EMOJI_SPECIFIC_COLORS[emoji]) {
    return EMOJI_SPECIFIC_COLORS[emoji];
  }

  // 2. search provided keywords for color hints
  const allKeywords = [...keywords, name.toLowerCase()];
  for (const keyword of allKeywords) {
    for (const [colorKeyword, color] of Object.entries(KEYWORD_COLORS)) {
      if (keyword.includes(colorKeyword)) {
        return color;
      }
    }
  }

  // 3. fall back to category-based color mapping
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }

  // 4. default gray when no other rule applies
  return '#6B7280'; // gray
}

/** Infer high level sentiment from the emoji name and keyword metadata. */
export function getEmojiSentiment(
  name: string,
  keywords: string[]
): 'positive' | 'negative' | 'neutral' {
  const allText = [...keywords, name.toLowerCase()].join(' ');

  const positiveWords = [
    'happy',
    'joy',
    'love',
    'good',
    'great',
    'awesome',
    'beautiful',
    'smile',
    'laugh',
    'excited',
    'wonderful',
    'amazing',
    'perfect',
    'celebrate',
    'party',
    'success',
    'win',
    'yes',
    'approve',
  ];

  const negativeWords = [
    'sad',
    'angry',
    'bad',
    'hate',
    'terrible',
    'awful',
    'horrible',
    'cry',
    'tear',
    'frown',
    'disapprove',
    'no',
    'sick',
    'dead',
    'fear',
    'scared',
    'worry',
    'anxious',
    'stress',
    'fail',
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach((word) => {
    if (allText.includes(word)) positiveScore++;
  });

  negativeWords.forEach((word) => {
    if (allText.includes(word)) negativeScore++;
  });

  // choose the higher score to classify the sentiment
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

/** Build a list of descriptive tags for an emoji. */
export function getEmojiTags(
  name: string,
  keywords: string[],
  category: string
): string[] {
  const tags: Set<string> = new Set();

  // add category as a base tag
  tags.add(category);

  // extract meaningful tags from keywords
  const meaningfulKeywords = keywords.filter(
    (k) => k.length > 2 && !['the', 'and', 'or', 'a', 'an'].includes(k)
  );

  // add top 5 most relevant keywords as tags
  meaningfulKeywords.slice(0, 5).forEach((k) => tags.add(k));

  // add sentiment-based tags
  const sentiment = getEmojiSentiment(name, keywords);
  if (sentiment === 'positive') {
    tags.add('positive');
    tags.add('uplifting');
  } else if (sentiment === 'negative') {
    tags.add('negative');
    tags.add('emotional');
  } else {
    tags.add('neutral');
  }

  return Array.from(tags);
}
