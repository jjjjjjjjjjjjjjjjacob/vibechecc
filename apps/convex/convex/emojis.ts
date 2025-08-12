import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  getEmojiColor,
  getEmojiSentiment,
  getEmojiTags,
} from './lib/emoji-colors';
import type { Emoji } from './schema';

/**
 * Import a batch of emoji records. This is typically used during initial
 * seeding and is exposed as a mutation so it can be called from scripts.
 */
export const importBatch = mutation({
  args: {
    // Array of emoji objects to insert
    emojis: v.array(
      v.object({
        emoji: v.string(), // literal emoji character
        name: v.string(), // human readable name
        keywords: v.array(v.string()), // search keywords
        category: v.string(), // category such as "food" or "emotion"
      })
    ),
  },
  handler: async (ctx, { emojis }) => {
    let insertedCount = 0; // track how many new emojis we add

    for (const emojiData of emojis) {
      // Check if emoji already exists to avoid duplicates
      const existing = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', emojiData.emoji))
        .first();

      if (!existing) {
        // Derive color and other metadata from the helper library
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

        // Insert the enriched emoji record
        await ctx.db.insert('emojis', {
          emoji: emojiData.emoji,
          name: emojiData.name,
          keywords: emojiData.keywords,
          category: emojiData.category,
          color,
          sentiment,
          tags,
        });

        insertedCount++; // increment count when a new emoji is stored
      }
    }

    // Return how many entries were inserted for logging/feedback
    return { count: insertedCount };
  },
});

/**
 * Search emojis with optional text and category filters. Results are paginated
 * to keep responses small for clients.
 */
export const search = query({
  args: {
    searchTerm: v.optional(v.string()), // free text search
    category: v.optional(v.string()), // restrict to a category
    page: v.optional(v.number()), // page number (0-indexed)
    pageSize: v.optional(v.number()), // results per page
  },
  handler: async (ctx, { searchTerm, category, page = 0, pageSize = 50 }) => {
    let allEmojis; // collection to apply filters on

    if (searchTerm) {
      // When searching by term we need to load all emojis then filter
      allEmojis = await ctx.db.query('emojis').collect();

      // Perform case-insensitive search across name, keywords, and tags
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
      // For category filtering we can leverage the indexed query
      allEmojis = await ctx.db
        .query('emojis')
        .withIndex('byCategory', (q) => q.eq('category', category))
        .collect();
    } else {
      // Default to fetching all emojis for browsing
      allEmojis = await ctx.db.query('emojis').collect();
    }

    // Calculate pagination window
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

/**
 * Look up metadata for a provided list of emoji characters. This is used when
 * enriching user-provided emoji lists with color and sentiment information.
 */
export const getByEmojis = query({
  args: {
    emojis: v.array(v.string()), // list of emoji characters to fetch
  },
  handler: async (ctx, { emojis }) => {
    const results: Array<Emoji> = [];

    for (const emoji of emojis) {
      // Indexed lookup for each emoji to avoid full table scans
      const emojiData = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
        .first();

      if (emojiData) {
        results.push(emojiData); // include only found entries
      }
    }

    return results;
  },
});

/**
 * Return a curated list of popular emojis. In the future this could be based
 * on actual usage stats; for now the list is hard coded.
 */
export const getPopular = query({
  args: {
    limit: v.optional(v.number()), // max results to return
  },
  handler: async (ctx, { limit = 20 }) => {
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

/**
 * Return a sorted list of all available emoji categories for filtering.
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    // Load all emojis then gather their categories into a set
    const allEmojis = await ctx.db.query('emojis').collect();
    const categories = new Set(allEmojis.map((e) => e.category));
    return Array.from(categories).sort();
  },
});

// Default export for test setup convenience
export default {
  importBatch,
  search,
  getByEmojis,
  getPopular,
  getCategories,
};
