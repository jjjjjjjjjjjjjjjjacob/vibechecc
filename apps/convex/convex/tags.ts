import { query, internalMutation, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';

/**
 * Internal mutation that keeps the denormalized tag statistics up to date.
 *
 * Whenever a vibe adds or removes tags we increment or decrement the count
 * stored on the `tags` table. Doing this work in a mutation ensures strong
 * consistency across all concurrent writes.
 */
export const updateTagCounts = internalMutation({
  // The mutation accepts optional arrays describing which tags to add or
  // remove from the aggregate counts.
  args: {
    tagsToAdd: v.optional(v.array(v.string())),
    tagsToRemove: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Destructure with defaults so loops below always operate on arrays.
    const { tagsToAdd = [], tagsToRemove = [] } = args;
    // Capture a single timestamp to reuse for all writes in this mutation.
    const now = Date.now();

    // ----- handle tag additions -----
    for (const tagName of tagsToAdd) {
      // Normalize incoming tags to lowercase and strip surrounding whitespace.
      const normalizedTag = tagName.toLowerCase().trim();
      // Skip empty strings that may result from malformed input.
      if (!normalizedTag) continue;

      // Check if the tag already exists using an indexed lookup.
      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (existingTag) {
        // Increment the count and update `lastUsed` if the tag exists.
        await ctx.db.patch(existingTag._id, {
          count: existingTag.count + 1,
          lastUsed: now,
        });
      } else {
        // Otherwise insert a brand new tag record with an initial count.
        await ctx.db.insert('tags', {
          name: normalizedTag,
          count: 1,
          createdAt: now,
          lastUsed: now,
        });
      }
    }

    // ----- handle tag removals -----
    for (const tagName of tagsToRemove) {
      const normalizedTag = tagName.toLowerCase().trim();
      if (!normalizedTag) continue;

      // Look up the existing tag record, if any, to decrement its count.
      const existingTag = await ctx.db
        .query('tags')
        .withIndex('byName', (q) => q.eq('name', normalizedTag))
        .first();

      if (existingTag) {
        if (existingTag.count > 1) {
          // Decrement count when more than one vibe references the tag.
          await ctx.db.patch(existingTag._id, {
            count: existingTag.count - 1,
          });
        } else {
          // Remove the record entirely when it would otherwise hit zero.
          await ctx.db.delete(existingTag._id);
        }
      }
    }
  },
});

/**
 * Query that returns the most popular tags ranked by how often they are used.
 * This powers tag suggestions and the fallback tag list when a user has not
 * typed anything yet.
 */
export const getPopularTags = query({
  // Allow callers to optionally specify how many tags they want back.
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Default to returning the top 20 tags when no limit is provided.
    const { limit = 20 } = args;

    const tags = await ctx.db
      .query('tags')
      // Leverage the `byCount` index to quickly fetch the highest counts.
      .withIndex('byCount')
      .order('desc')
      .take(limit);

    // Return a simplified list containing only the fields consumers care about.
    return tags.map((tag) => ({
      name: tag.name,
      count: tag.count,
    }));
  },
});

/**
 * Helper used by administrative tasks to recompute the entire tags table from
 * scratch. This is useful when migrating data or fixing inconsistencies.
 */
async function rebuildTagCountsHelper(ctx: MutationCtx) {
  // ----- remove all existing tag records -----
  const existingTags = await ctx.db.query('tags').collect();
  for (const tag of existingTags) {
    await ctx.db.delete(tag._id);
  }

  // ----- scan every vibe to compute fresh counts -----
  const allVibes = await ctx.db.query('vibes').collect();
  const tagCounts = new Map<string, number>();

  for (const vibe of allVibes) {
    if (vibe.tags) {
      for (const tag of vibe.tags) {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          // Increment count for this normalized tag in the map.
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      }
    }
  }

  // ----- write the rebuilt counts back to the database -----
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

/**
 * Internal mutation wrapper that exposes the rebuild helper to scripts or
 * scheduled jobs. This should not be publicly callable from clients.
 */
export const rebuildTagCounts = internalMutation({
  handler: async (ctx) => {
    return await rebuildTagCountsHelper(ctx);
  },
});

// Export helper for tests so we can trigger the rebuild logic in isolation.
export { rebuildTagCountsHelper };

/**
 * Search for tags matching a user supplied query string. If the query is empty
 * we fall back to returning the most popular tags instead.
 */
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
