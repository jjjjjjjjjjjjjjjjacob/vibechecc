import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  getEmojiColor,
  getEmojiSentiment,
  getEmojiTags,
} from './lib/emojiColors';
import type { Emoji } from './schema';

// Import emoji batch (public endpoint for seeding)
export const importBatch = mutation({
  args: {
    emojis: v.array(
      v.object({
        emoji: v.string(),
        name: v.string(),
        keywords: v.array(v.string()),
        category: v.string(),
      })
    ),
  },
  handler: async (ctx, { emojis }) => {
    let insertedCount = 0;

    for (const emojiData of emojis) {
      // Check if emoji already exists
      const existing = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', emojiData.emoji))
        .first();

      if (!existing) {
        // Get color and metadata
        const color = getEmojiColor(
          emojiData.emoji,
          emojiData.name,
          emojiData.keywords,
          emojiData.category
        );

        const sentiment = getEmojiSentiment(emojiData.name, emojiData.keywords);
        const tags = getEmojiTags(
          emojiData.name,
          emojiData.keywords,
          emojiData.category
        );

        await ctx.db.insert('emojis', {
          emoji: emojiData.emoji,
          name: emojiData.name,
          keywords: emojiData.keywords,
          category: emojiData.category,
          color,
          sentiment,
          tags,
        });

        insertedCount++;
      }
    }

    return { count: insertedCount };
  },
});

// Search emojis with pagination
export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    category: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, { searchTerm, category, page = 0, pageSize = 50 }) => {
    // Get all emojis or by category
    let allEmojis;

    if (searchTerm) {
      // For search, get all emojis for filtering
      allEmojis = await ctx.db.query('emojis').collect();

      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      allEmojis = allEmojis.filter((emoji) => {
        const searchableText = [
          emoji.name,
          ...emoji.keywords,
          ...(emoji.tags || []),
        ]
          .join(' ')
          .toLowerCase();
        return searchableText.includes(searchLower);
      });
    } else if (category) {
      // For category browsing, use index
      allEmojis = await ctx.db
        .query('emojis')
        .withIndex('byCategory', (q) => q.eq('category', category))
        .collect();
    } else {
      // For general browsing, get all emojis
      allEmojis = await ctx.db.query('emojis').collect();
    }

    // Paginate results
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedEmojis = allEmojis.slice(start, end);

    return {
      emojis: paginatedEmojis,
      totalCount: allEmojis.length,
      page,
      pageSize,
      hasMore: end < allEmojis.length,
    };
  },
});

// Get emojis by specific emojis (for metadata enrichment)
export const getByEmojis = query({
  args: {
    emojis: v.array(v.string()),
  },
  handler: async (ctx, { emojis }) => {
    const results: Array<Emoji> = [];

    for (const emoji of emojis) {
      const emojiData = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
        .first();

      if (emojiData) {
        results.push(emojiData);
      }
    }

    return results;
  },
});

// Get popular emojis for quick selection
export const getPopular = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20 }) => {
    // For now, return a curated list of popular emojis
    // In the future, this could be based on usage statistics
    const popularEmojis = [
      '🔥',
      '😍',
      '💯',
      '😂',
      '🤩',
      '😎',
      '🥺',
      '😭',
      '💀',
      '👀',
      '❤️',
      '✨',
    ];

    const results = [];
    for (const emoji of popularEmojis) {
      const emojiData = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
        .first();

      if (emojiData) {
        results.push(emojiData);
      }
    }

    return results.slice(0, limit);
  },
});

// Get emoji categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const allEmojis = await ctx.db.query('emojis').collect();
    const categories = new Set(allEmojis.map((e) => e.category));
    return Array.from(categories).sort();
  },
});

// Default export for test-setup
export default {
  importBatch,
  search,
  getByEmojis,
  getPopular,
  getCategories,
};
