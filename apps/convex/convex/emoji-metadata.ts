import { internalMutation } from './_generated/server';

/**
 * Default emoji metadata used to seed the database. Each entry describes
 * an emoji's name, keywords, tags, category, color, and sentiment which
 * powers search and rating features across the app.
 */
// Default emoji rating metadata
const defaultEmojiMetadata = [
  // Positive emotions
  {
    emoji: '😍',
    name: 'smiling face with heart-eyes',
    keywords: ['love', 'crush', 'hearts', 'infatuation'],
    tags: ['love', 'amazing', 'perfect', 'favorite', 'obsessed'],
    category: 'emotion',
    color: '#FF69B4',
    sentiment: 'positive' as const,
  },
  {
    emoji: '🤩',
    name: 'star-struck',
    keywords: ['star', 'eyes', 'starry-eyed'],
    tags: ['excited', 'impressed', 'star-struck', 'awesome', 'wow'],
    category: 'emotion',
    color: '#FFD700',
    sentiment: 'positive' as const,
  },
  {
    emoji: '😎',
    name: 'smiling face with sunglasses',
    keywords: ['face', 'cool', 'sunglasses'],
    tags: ['cool', 'smooth', 'confident', 'stylish', 'chill'],
    category: 'emotion',
    color: '#1E90FF',
    sentiment: 'positive' as const,
  },
  {
    emoji: '🥰',
    name: 'smiling face with hearts',
    keywords: ['love', 'like', 'affection', 'valentines'],
    tags: ['adorable', 'sweet', 'heartwarming', 'lovely', 'affectionate'],
    category: 'emotion',
    color: '#FF1493',
    sentiment: 'positive' as const,
  },
  {
    emoji: '😊',
    name: 'smiling face',
    keywords: ['happy', 'joy', 'pleased'],
    tags: ['happy', 'pleasant', 'nice', 'enjoyable', 'satisfied'],
    category: 'emotion',
    color: '#32CD32',
    sentiment: 'positive' as const,
  },

  // Negative emotions
  {
    emoji: '😳',
    name: 'flushed face',
    keywords: ['face', 'blush', 'embarrassed'],
    tags: ['shocked', 'embarrassed', 'awkward', 'flustered', 'uncomfortable'],
    category: 'emotion',
    color: '#FF6347',
    sentiment: 'negative' as const,
  },
  {
    emoji: '😱',
    name: 'face screaming in fear',
    keywords: ['face', 'scream', 'scared'],
    tags: ['terrified', 'scary', 'horrified', 'shocking', 'frightening'],
    category: 'emotion',
    color: '#8B0000',
    sentiment: 'negative' as const,
  },
  {
    emoji: '😢',
    name: 'crying face',
    keywords: ['face', 'sad', 'tear'],
    tags: ['sad', 'emotional', 'heartbreaking', 'touching', 'tearful'],
    category: 'emotion',
    color: '#4169E1',
    sentiment: 'negative' as const,
  },
  {
    emoji: '😡',
    name: 'pouting face',
    keywords: ['angry', 'mad', 'rage'],
    tags: ['angry', 'furious', 'outrageous', 'infuriating', 'mad'],
    category: 'emotion',
    color: '#DC143C',
    sentiment: 'negative' as const,
  },
  {
    emoji: '🤢',
    name: 'nauseated face',
    keywords: ['sick', 'barf', 'disgust'],
    tags: ['disgusting', 'gross', 'nauseating', 'repulsive', 'awful'],
    category: 'emotion',
    color: '#228B22',
    sentiment: 'negative' as const,
  },

  // Neutral/Complex emotions
  {
    emoji: '🤔',
    name: 'thinking face',
    keywords: ['think', 'consider', 'ponder'],
    tags: [
      'thinking',
      'contemplative',
      'thought-provoking',
      'interesting',
      'curious',
    ],
    category: 'emotion',
    color: '#DAA520',
    sentiment: 'neutral' as const,
  },
  {
    emoji: '😐',
    name: 'neutral face',
    keywords: ['deadpan', 'neutral', 'meh'],
    tags: ['neutral', 'meh', 'indifferent', 'okay', 'average'],
    category: 'emotion',
    color: '#808080',
    sentiment: 'neutral' as const,
  },
  {
    emoji: '🤯',
    name: 'exploding head',
    keywords: ['shocked', 'mind blown', 'explode'],
    tags: ['mind-blown', 'unbelievable', 'incredible', 'shocking', 'wild'],
    category: 'emotion',
    color: '#FF4500',
    sentiment: 'neutral' as const,
  },

  // Assessment emojis
  {
    emoji: '🔥',
    name: 'fire',
    keywords: ['hot', 'lit', 'flame'],
    tags: ['fire', 'hot', 'trending', 'popular', 'lit'],
    category: 'assessment',
    color: '#FF6347',
    sentiment: 'positive' as const,
  },
  {
    emoji: '💯',
    name: 'hundred points',
    keywords: ['100', 'perfect', 'numbers'],
    tags: ['perfect', '100%', 'complete', 'fully-agree', 'authentic'],
    category: 'assessment',
    color: '#FF0000',
    sentiment: 'positive' as const,
  },
  {
    emoji: '👍',
    name: 'thumbs up',
    keywords: ['thumbsup', 'yes', 'approve'],
    tags: ['good', 'approve', 'like', 'yes', 'positive'],
    category: 'assessment',
    color: '#4169E1',
    sentiment: 'positive' as const,
  },
  {
    emoji: '👎',
    name: 'thumbs down',
    keywords: ['thumbsdown', 'no', 'disapprove'],
    tags: ['bad', 'disapprove', 'dislike', 'no', 'negative'],
    category: 'assessment',
    color: '#8B4513',
    sentiment: 'negative' as const,
  },
  {
    emoji: '💩',
    name: 'pile of poo',
    keywords: ['poop', 'shit', 'crap'],
    tags: ['terrible', 'worst', 'trash', 'garbage', 'awful'],
    category: 'assessment',
    color: '#8B4513',
    sentiment: 'negative' as const,
  },

  // Activity/Experience emojis
  {
    emoji: '🎉',
    name: 'party popper',
    keywords: ['party', 'tada', 'celebration'],
    tags: ['party', 'celebration', 'fun', 'festive', 'exciting'],
    category: 'reaction',
    color: '#FFD700',
    sentiment: 'positive' as const,
  },
  {
    emoji: '💀',
    name: 'skull',
    keywords: ['dead', 'skeleton', 'death'],
    tags: ['dead', 'dying', 'hilarious', 'cant-even', 'too-much'],
    category: 'reaction',
    color: '#F5F5DC',
    sentiment: 'neutral' as const,
  },
  {
    emoji: '🙏',
    name: 'folded hands',
    keywords: ['please', 'hope', 'wish'],
    tags: ['grateful', 'thankful', 'blessed', 'appreciate', 'respect'],
    category: 'reaction',
    color: '#DAA520',
    sentiment: 'positive' as const,
  },
];

// Internal mutation to populate emoji metadata
export const populateEmojiMetadata = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if metadata already exists
    const existingCount = await ctx.db.query('emojis').take(1);
    if (existingCount.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Emoji metadata already populated');
      return;
    }

    // Insert all default emoji metadata
    for (const metadata of defaultEmojiMetadata) {
      await ctx.db.insert('emojis', metadata);
    }

    // eslint-disable-next-line no-console
    console.log(
      `Populated ${defaultEmojiMetadata.length} emoji metadata entries`
    );
  },
});

// Export the default metadata for use in other files
export { defaultEmojiMetadata };
