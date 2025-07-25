import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getEmojiColor, getEmojiSentiment, getEmojiTags } from './lib/emojiColors';

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
        const tags = getEmojiTags(emojiData.name, emojiData.keywords, emojiData.category);

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
    let query = ctx.db.query('emojis');

    // Filter by category if provided
    if (category) {
      query = query.withIndex('byCategory', (q) => q.eq('category', category));
    }

    // Get all emojis
    const allEmojis = await query.collect();

    // Filter by search term if provided
    let filteredEmojis = allEmojis;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredEmojis = allEmojis.filter((emoji) => {
        const searchableText = [
          emoji.name,
          ...emoji.keywords,
          ...(emoji.tags || []),
        ]
          .join(' ')
          .toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    // Paginate results
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedEmojis = filteredEmojis.slice(start, end);

    return {
      emojis: paginatedEmojis,
      totalCount: filteredEmojis.length,
      page,
      pageSize,
      hasMore: end < filteredEmojis.length,
    };
  },
});

// Get emojis by specific emojis (for metadata enrichment)
export const getByEmojis = query({
  args: {
    emojis: v.array(v.string()),
  },
  handler: async (ctx, { emojis }) => {
    const results: Record<string, any> = {};

    for (const emoji of emojis) {
      const emojiData = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
        .first();

      if (emojiData) {
        results[emoji] = emojiData;
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
    const popularEmojis = ['🔥', '😍', '💯', '😂', '🤩', '😎', '🥺', '😭', '💀', '🙈'];
    
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