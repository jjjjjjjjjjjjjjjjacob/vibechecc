import { query, internalMutation, type MutationCtx } from './_generated/server';
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

// Helper function to rebuild tag counts
async function rebuildTagCountsHelper(ctx: MutationCtx) {
  // Clear existing tags
  const existingTags = await ctx.db.query('tags').collect();
  for (const tag of existingTags) {
    await ctx.db.delete(tag._id);
  }

  // Get all vibes and their tags
  const allVibes = await ctx.db.query('vibes').collect();
  const tagCounts = new Map<string, number>();

  // Count tags from all vibes
  for (const vibe of allVibes) {
    if (vibe.tags) {
      for (const tag of vibe.tags) {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      }
    }
  }

  // Insert new tag records
  const now = Date.now();
  for (const [tagName, count] of tagCounts.entries()) {
    await ctx.db.insert('tags', {
      name: tagName,
      count,
      createdAt: now,
      lastUsed: now,
    });
  }

  return { tagsRebuilt: tagCounts.size, vibesProcessed: allVibes.length };
}

// Rebuild tag counts from existing vibes (migration/admin function)
export const rebuildTagCounts = internalMutation({
  handler: async (ctx) => {
    return await rebuildTagCountsHelper(ctx);
  },
});

// Export helper for tests
export { rebuildTagCountsHelper };

// Seed tags with zero counts for production
export const seedTagsWithZeroCounts = internalMutation({
  args: { tagNames: v.array(v.string()) },
  handler: async (ctx, { tagNames }) => {
    const now = Date.now();
    let createdCount = 0;

    for (const tagName of tagNames) {
      const normalizedTag = tagName.toLowerCase().trim();

      // Check if tag already exists
      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (!existingTag) {
        await ctx.db.insert('tags', {
          name: normalizedTag,
          count: 0,
          createdAt: now,
          lastUsed: now,
        });
        createdCount++;
      }
    }

    return {
      totalTagsToSeed: tagNames.length,
      newTagsCreated: createdCount,
      message: `Seeded ${createdCount} new tags with 0 counts`,
    };
  },
});

// Seed tags with preserved counts from another environment
export const seedTagsWithCounts = internalMutation({
  args: {
    tags: v.array(
      v.object({
        name: v.string(),
        count: v.number(),
      })
    ),
  },
  handler: async (ctx, { tags }) => {
    const now = Date.now();
    let createdCount = 0;
    let updatedCount = 0;

    for (const tag of tags) {
      const normalizedTag = tag.name.toLowerCase().trim();

      // Check if tag already exists
      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (existingTag) {
        // Update existing tag with the count from dev
        await ctx.db.patch(existingTag._id, {
          count: tag.count,
          lastUsed: now,
        });
        updatedCount++;
      } else {
        // Create new tag with the count from dev
        await ctx.db.insert('tags', {
          name: normalizedTag,
          count: tag.count,
          createdAt: now,
          lastUsed: now,
        });
        createdCount++;
      }
    }

    return {
      totalTagsToSeed: tags.length,
      newTagsCreated: createdCount,
      tagsUpdated: updatedCount,
      message: `Created ${createdCount} new tags and updated ${updatedCount} existing tags with counts from dev`,
    };
  },
});

// Get all tags for seeding purposes
export const getAllTags = query({
  handler: async (ctx) => {
    const tags = await ctx.db.query('tags').collect();
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
