import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Convex queries for sitemap generation
 *
 * These queries provide optimized data fetching for XML sitemap generation.
 * They return minimal data needed for sitemaps to avoid large payloads.
 */

// Get all public vibes for sitemap
export const getAllVibesForSitemap = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10000; // Large limit for sitemap generation

    // Get all public vibes with minimal data needed for sitemap
    const vibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .order('desc')
      .take(limit);

    return vibes.map((vibe) => ({
      id: vibe.id,
      title: vibe.title,
      createdAt: vibe.createdAt,
      updatedAt: vibe.updatedAt || vibe.createdAt,
      tags: vibe.tags,
      visibility: vibe.visibility,
    }));
  },
});

// Get all users for sitemap
export const getAllUsersForSitemap = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5000; // Reasonable limit for user profiles

    // Get all users with minimal data needed for sitemap
    const users = await ctx.db.query('users').order('desc').take(limit);

    return users
      .filter((user) => user.username) // Only include users with usernames
      .map((user) => ({
        username: user.username!,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));
  },
});

// Get all tags for sitemap
export const getAllTagsForSitemap = query({
  args: {
    minCount: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const minCount = args.minCount ?? 1; // Only include tags with at least 1 vibe
    const limit = args.limit ?? 1000;

    // Get tags from the tags table (populated by tag count updates)
    const tags = await ctx.db
      .query('tags')
      .withIndex('byCount')
      .order('desc')
      .take(limit);

    return tags
      .filter((tag) => tag.count >= minCount)
      .map((tag) => ({
        name: tag.name,
        count: tag.count,
        updated_at: new Date(tag.lastUsed).toISOString(),
      }));
  },
});

// Get sitemap statistics
export const getSitemapStats = query({
  handler: async (ctx) => {
    // Get counts for sitemap planning
    const [vibesCount, usersCount, tagsCount] = await Promise.all([
      // Count public vibes
      ctx.db
        .query('vibes')
        .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
        .take(50001) // Take one more than the limit to check if we exceed it
        .then((vibes) => Math.min(vibes.length, 50000)),

      // Count users with usernames
      ctx.db
        .query('users')
        .take(5001)
        .then((users) =>
          Math.min(users.filter((u) => u.username).length, 5000)
        ),

      // Count tags with content
      ctx.db
        .query('tags')
        .withIndex('byCount')
        .take(1001)
        .then((tags) => Math.min(tags.filter((t) => t.count > 0).length, 1000)),
    ]);

    const totalEntries = vibesCount + usersCount + tagsCount + 10; // +10 for static pages
    const needsMultipleSitemaps = totalEntries > 50000;

    return {
      vibesCount,
      usersCount,
      tagsCount,
      totalEntries,
      needsMultipleSitemaps,
      lastGenerated: new Date().toISOString(),
    };
  },
});

// Get recently updated content for priority sitemap updates
export const getRecentlyUpdatedContent = query({
  args: {
    hours: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hours ?? 24; // Last 24 hours by default
    const limit = args.limit ?? 100;
    const cutoffTime = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    // Get recently updated vibes
    const recentVibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .order('desc')
      .take(limit * 2) // Take more to filter by update time
      .then((vibes) =>
        vibes
          .filter(
            (vibe) =>
              (vibe.updatedAt && vibe.updatedAt > cutoffTime) ||
              vibe.createdAt > cutoffTime
          )
          .slice(0, limit)
          .map((vibe) => ({
            type: 'vibe' as const,
            id: vibe.id,
            url: `/vibes/${vibe.id}`,
            lastmod: vibe.updatedAt || vibe.createdAt,
          }))
      );

    // Get recently updated users
    const recentUsers = await ctx.db
      .query('users')
      .order('desc')
      .take(limit)
      .then((users) =>
        users
          .filter(
            (user) =>
              user.username &&
              user.updated_at &&
              user.updated_at > Date.now() - hours * 60 * 60 * 1000
          )
          .slice(0, Math.floor(limit / 2))
          .map((user) => ({
            type: 'user' as const,
            id: user.username!,
            url: `/users/${user.username}`,
            lastmod: new Date(user.updated_at!).toISOString(),
          }))
      );

    return [...recentVibes, ...recentUsers]
      .sort(
        (a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime()
      )
      .slice(0, limit);
  },
});

// Get content metrics for priority calculation
export const getContentMetrics = query({
  args: {
    contentType: v.union(
      v.literal('vibe'),
      v.literal('user'),
      v.literal('tag')
    ),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.contentType === 'vibe') {
      // Get vibe engagement metrics
      const vibe = await ctx.db
        .query('vibes')
        .filter((q) => q.eq(q.field('id'), args.contentId))
        .first();

      if (!vibe) return null;

      // Get ratings count as engagement metric
      const ratingsCount = await ctx.db
        .query('ratings')
        .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
        .take(1000) // Reasonable limit for counting
        .then((ratings) => ratings.length);

      const daysSinceCreation =
        (Date.now() - new Date(vibe.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - daysSinceCreation / 365); // Decay over 1 year

      return {
        engagementScore: ratingsCount,
        recency: recencyScore,
        popularity: ratingsCount / Math.max(1, daysSinceCreation), // Ratings per day
      };
    }

    if (args.contentType === 'user') {
      // Get user metrics
      const user = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('username'), args.contentId))
        .first();

      if (!user) return null;

      // Get user's vibe count
      const vibesCount = await ctx.db
        .query('vibes')
        .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
        .take(1000)
        .then((vibes) => vibes.filter((v) => v.visibility === 'public').length);

      const daysSinceJoined = user.created_at
        ? (Date.now() - user.created_at) / (1000 * 60 * 60 * 24)
        : 365;
      const recencyScore = Math.max(0, 1 - daysSinceJoined / 365);

      return {
        engagementScore: vibesCount,
        recency: recencyScore,
        popularity: vibesCount / Math.max(1, daysSinceJoined),
      };
    }

    if (args.contentType === 'tag') {
      // Get tag metrics
      const tag = await ctx.db
        .query('tags')
        .filter((q) => q.eq(q.field('name'), args.contentId))
        .first();

      if (!tag) return null;

      return {
        engagementScore: tag.count,
        recency: 0.5, // Tags don't have creation dates
        popularity: tag.count / 10, // Normalize popularity
      };
    }

    return null;
  },
});
