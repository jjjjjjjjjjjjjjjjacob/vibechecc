import { query, internalMutation } from './_generated/server';
import { v } from 'convex/values';

// Internal mutation to update tag counts
export const updateTagCounts = internalMutation({
  args: {
    tagsToAdd: v.optional(v.array(v.string())),
    tagsToRemove: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tagsToAdd = [], tagsToRemove = [] } = args;
    const now = Date.now();

    // Process tags to add
    for (const tagName of tagsToAdd) {
      const normalizedTag = tagName.toLowerCase().trim();
      if (!normalizedTag) continue;

      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (existingTag) {
        await ctx.db.patch(existingTag._id, {
          count: existingTag.count + 1,
          lastUsed: now,
        });
      } else {
        await ctx.db.insert('tags', {
          name: normalizedTag,
          count: 1,
          createdAt: now,
          lastUsed: now,
        });
      }
    }

    // Process tags to remove
    for (const tagName of tagsToRemove) {
      const normalizedTag = tagName.toLowerCase().trim();
      if (!normalizedTag) continue;

      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (existingTag) {
        if (existingTag.count > 1) {
          await ctx.db.patch(existingTag._id, {
            count: existingTag.count - 1,
          });
        } else {
          // Remove tag if count reaches 0
          await ctx.db.delete(existingTag._id);
        }
      }
    }
  },
});

// Public query to get popular tags
export const getPopularTags = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 20 } = args;

    const tags = await ctx.db
      .query('tags')
      .withIndex('byCount')
      .order('desc')
      .take(limit);

    return tags.map((tag) => ({
      name: tag.name,
      count: tag.count,
    }));
  },
});

// Search tags
export const searchTags = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, limit = 10 } = args;

    if (!query.trim()) {
      // Return popular tags if no query
      const popularTags = await ctx.db
        .query('tags')
        .withIndex('byCount')
        .order('desc')
        .take(limit);

      return popularTags.map((tag) => ({
        name: tag.name,
        count: tag.count,
      }));
    }

    const tags = await ctx.db
      .query('tags')
      .withSearchIndex('search', (q) => q.search('name', query))
      .take(limit);

    return tags.map((tag) => ({
      name: tag.name,
      count: tag.count,
    }));
  },
});
