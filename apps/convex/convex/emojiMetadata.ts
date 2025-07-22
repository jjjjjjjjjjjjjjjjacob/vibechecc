import { internalMutation } from './_generated/server';

// Default emoji rating metadata
const defaultEmojiMetadata = [
  // Positive emotions
  {
    emoji: '😍',
    tags: ['love', 'amazing', 'perfect', 'favorite', 'obsessed'],
    category: 'emotion',
    sentiment: 'positive' as const,
  },
  {
    emoji: '🤩',
    tags: ['excited', 'impressed', 'star-struck', 'awesome', 'wow'],
    category: 'emotion',
    sentiment: 'positive' as const,
  },
  {
    emoji: '😎',
    tags: ['cool', 'smooth', 'confident', 'stylish', 'chill'],
    category: 'emotion',
    sentiment: 'positive' as const,
  },
  {
    emoji: '🥰',
    tags: ['adorable', 'sweet', 'heartwarming', 'lovely', 'affectionate'],
    category: 'emotion',
    sentiment: 'positive' as const,
  },
  {
    emoji: '😊',
    tags: ['happy', 'pleasant', 'nice', 'enjoyable', 'satisfied'],
    category: 'emotion',
    sentiment: 'positive' as const,
  },

  // Negative emotions
  {
    emoji: '😳',
    tags: ['shocked', 'embarrassed', 'awkward', 'flustered', 'uncomfortable'],
    category: 'emotion',
    sentiment: 'negative' as const,
  },
  {
    emoji: '😱',
    tags: ['terrified', 'scary', 'horrified', 'shocking', 'frightening'],
    category: 'emotion',
    sentiment: 'negative' as const,
  },
  {
    emoji: '😢',
    tags: ['sad', 'emotional', 'heartbreaking', 'touching', 'tearful'],
    category: 'emotion',
    sentiment: 'negative' as const,
  },
  {
    emoji: '😡',
    tags: ['angry', 'furious', 'outrageous', 'infuriating', 'mad'],
    category: 'emotion',
    sentiment: 'negative' as const,
  },
  {
    emoji: '🤢',
    tags: ['disgusting', 'gross', 'nauseating', 'repulsive', 'awful'],
    category: 'emotion',
    sentiment: 'negative' as const,
  },

  // Neutral/Complex emotions
  {
    emoji: '🤔',
    tags: [
      'thinking',
      'contemplative',
      'thought-provoking',
      'interesting',
      'curious',
    ],
    category: 'emotion',
    sentiment: 'neutral' as const,
  },
  {
    emoji: '😐',
    tags: ['neutral', 'meh', 'indifferent', 'okay', 'average'],
    category: 'emotion',
    sentiment: 'neutral' as const,
  },
  {
    emoji: '🤯',
    tags: ['mind-blown', 'unbelievable', 'incredible', 'shocking', 'wild'],
    category: 'emotion',
    sentiment: 'neutral' as const,
  },

  // Assessment emojis
  {
    emoji: '🔥',
    tags: ['fire', 'hot', 'trending', 'popular', 'lit'],
    category: 'assessment',
    sentiment: 'positive' as const,
  },
  {
    emoji: '💯',
    tags: ['perfect', '100%', 'complete', 'fully-agree', 'authentic'],
    category: 'assessment',
    sentiment: 'positive' as const,
  },
  {
    emoji: '👍',
    tags: ['good', 'approve', 'like', 'yes', 'positive'],
    category: 'assessment',
    sentiment: 'positive' as const,
  },
  {
    emoji: '👎',
    tags: ['bad', 'disapprove', 'dislike', 'no', 'negative'],
    category: 'assessment',
    sentiment: 'negative' as const,
  },
  {
    emoji: '💩',
    tags: ['terrible', 'worst', 'trash', 'garbage', 'awful'],
    category: 'assessment',
    sentiment: 'negative' as const,
  },

  // Activity/Experience emojis
  {
    emoji: '🎉',
    tags: ['party', 'celebration', 'fun', 'festive', 'exciting'],
    category: 'reaction',
    sentiment: 'positive' as const,
  },
  {
    emoji: '💀',
    tags: ['dead', 'dying', 'hilarious', 'cant-even', 'too-much'],
    category: 'reaction',
    sentiment: 'neutral' as const,
  },
  {
    emoji: '🙏',
    tags: ['grateful', 'thankful', 'blessed', 'appreciate', 'respect'],
    category: 'reaction',
    sentiment: 'positive' as const,
  },
];

// Internal mutation to populate emoji metadata
export const populateEmojiMetadata = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if metadata already exists
    const existingCount = await ctx.db.query('emojiRatingMetadata').take(1);
    if (existingCount.length > 0) {
      console.log('Emoji metadata already populated');
      return;
    }

    // Insert all default emoji metadata
    for (const metadata of defaultEmojiMetadata) {
      await ctx.db.insert('emojiRatingMetadata', metadata);
    }

    console.log(
      `Populated ${defaultEmojiMetadata.length} emoji metadata entries`
    );
  },
});

// Export the default metadata for use in other files
export { defaultEmojiMetadata };
