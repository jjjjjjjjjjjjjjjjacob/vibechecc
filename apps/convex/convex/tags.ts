import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Search for tags (autocomplete)
export const search = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const searchTerm = args.searchTerm.toLowerCase().trim();

    if (!searchTerm) {
      // Return popular tags if no search term
      return await ctx.db
        .query('tags')
        .withIndex('byCount')
        .order('desc')
        .take(limit);
    }

    // Search for tags matching the search term
    const results = await ctx.db
      .query('tags')
      .withSearchIndex('search', (q) => q.search('name', searchTerm))
      .take(limit);

    return results;
  },
});

// Get popular tags
export const getPopular = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query('tags')
      .withIndex('byCount')
      .order('desc')
      .take(limit);
  },
});

// Internal function to update tag usage
export const updateTagUsage = mutation({
  args: {
    tags: v.array(v.string()),
    increment: v.boolean(), // true to increment, false to decrement
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const tagName of args.tags) {
      const normalizedTag = tagName.toLowerCase().trim();
      if (!normalizedTag) continue;

      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (existingTag) {
        // Update existing tag
        const newCount = args.increment
          ? existingTag.count + 1
          : Math.max(0, existingTag.count - 1);

        if (newCount === 0) {
          // Remove tag if count reaches 0
          await ctx.db.delete(existingTag._id);
        } else {
          await ctx.db.patch(existingTag._id, {
            count: newCount,
            lastUsed: args.increment ? now : existingTag.lastUsed,
          });
        }
      } else if (args.increment) {
        // Create new tag only when incrementing
        await ctx.db.insert('tags', {
          name: normalizedTag,
          count: 1,
          createdAt: now,
          lastUsed: now,
        });
      }
    }
  },
});

// Get all tags (for admin/debug purposes)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('tags').withIndex('byName').collect();
  },
});
