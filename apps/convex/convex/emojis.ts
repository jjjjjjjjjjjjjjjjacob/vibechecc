import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  getEmojiColor,
  getEmojiSentiment,
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

        await ctx.db.insert('emojis', {
          emoji: emojiData.emoji,
          name: emojiData.name,
          keywords: emojiData.keywords,
          category: emojiData.category,
          color,
          sentiment,
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
    // First try to get emojis by usage count
    let results = await ctx.db
      .query('emojis')
      .filter((q) => q.neq(q.field('usageCount'), undefined))
      .order('desc')
      .take(limit);
    
    // If not enough, fall back to curated list
    if (results.length < limit) {
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

      for (const emoji of popularEmojis) {
        if (results.length >= limit) break;
        
        const emojiData = await ctx.db
          .query('emojis')
          .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
          .first();

        if (emojiData && !results.find(r => r.emoji === emoji)) {
          results.push(emojiData);
        }
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

// Track emoji usage (called when emoji is selected)
export const trackUsage = mutation({
  args: {
    emoji: v.string(),
  },
  handler: async (ctx, { emoji }) => {
    const emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
      .first();
    
    if (emojiData) {
      await ctx.db.patch(emojiData._id, {
        usageCount: (emojiData.usageCount || 0) + 1,
        lastUsed: Date.now(),
      });
    }
  },
});

// Get frequently used emojis for a user
export const getFrequentlyUsed = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 8 }) => {
    // If userId provided, get from their emoji ratings
    if (userId) {
      const userRatings = await ctx.db
        .query('ratings')
        .withIndex('byUserAndEmoji', (q) => q.eq('userId', userId))
        .order('desc')
        .take(limit * 2); // Get more to dedupe
      
      const emojiCounts = new Map<string, number>();
      for (const rating of userRatings) {
        const count = emojiCounts.get(rating.emoji) || 0;
        emojiCounts.set(rating.emoji, count + 1);
      }
      
      // Sort by frequency and get top emojis
      const sortedEmojis = Array.from(emojiCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([emoji]) => emoji);
      
      const results = [];
      for (const emoji of sortedEmojis) {
        const emojiData = await ctx.db
          .query('emojis')
          .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
          .first();
        if (emojiData) {
          results.push(emojiData);
        }
      }
      
      return results;
    }
    
    // Otherwise return globally popular emojis
    const popularResults = await ctx.db
      .query('emojis')
      .filter((q) => q.neq(q.field('usageCount'), undefined))
      .order('desc')
      .take(limit);
    
    if (popularResults.length >= limit) {
      return popularResults;
    }
    
    // Fall back to curated list
    const popularEmojis = [
      '🔥', '😍', '💯', '😂', '🤩', '😎', '🥺', '😭',
      '💀', '👀', '❤️', '✨',
    ];
    
    const results = [...popularResults];
    for (const emoji of popularEmojis) {
      if (results.length >= limit) break;
      
      const emojiData = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
        .first();

      if (emojiData && !results.find(r => r.emoji === emoji)) {
        results.push(emojiData);
      }
    }
    
    return results.slice(0, limit);
  },
});

// Default export for test-setup
export default {
  importBatch,
  search,
  getByEmojis,
  getPopular,
  getCategories,
  trackUsage,
  getFrequentlyUsed,
};
