import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Get emoji metadata by emoji
export const getEmojiMetadata = query({
  args: { emoji: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();
  },
});

// Get all emoji metadata
export const getAllEmojiMetadata = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('emojis').collect();
  },
});

// Get emoji metadata by category
export const getEmojiByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('emojis')
      .withIndex('byCategory', (q) => q.eq('category', args.category))
      .collect();
  },
});

// Create or update rating with emoji
export const createOrUpdateEmojiRating = mutation({
  args: {
    vibeId: v.string(),
    emoji: v.string(), // REQUIRED
    value: v.number(), // 1-5 scale
    review: v.string(), // REQUIRED
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to rate a vibe');
    }

    // Validate rating values
    if (args.value < 1 || args.value > 5) {
      throw new Error('Rating value must be between 1 and 5');
    }

    const now = new Date().toISOString();
    let tags: string[] = [];

    // Get emoji metadata for tags
    const emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    if (emojiData && emojiData.tags) {
      tags = emojiData.tags;
    }

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', args.vibeId).eq('userId', identity.subject)
      )
      .first();

    const ratingData = {
      emoji: args.emoji,
      value: args.value,
      review: args.review,
      tags: tags.length > 0 ? tags : undefined,
      updatedAt: now,
    };

    if (existingRating) {
      // Update existing rating
      return await ctx.db.patch(existingRating._id, ratingData);
    } else {
      // Create new rating
      return await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: identity.subject,
        createdAt: now,
        ...ratingData,
      });
    }
  },
});

// Get top emoji ratings for a vibe
export const getTopEmojiRatings = query({
  args: {
    vibeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    // Get all ratings for this vibe
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', args.vibeId))
      .collect();

    // Count emoji occurrences and calculate average values
    const emojiStats = new Map<
      string,
      { count: number; totalValue: number; averageValue: number }
    >();

    for (const rating of ratings) {
      const current = emojiStats.get(rating.emoji) || {
        count: 0,
        totalValue: 0,
        averageValue: 0,
      };
      current.count += 1;
      current.totalValue += rating.value;
      current.averageValue = current.totalValue / current.count;
      emojiStats.set(rating.emoji, current);
    }

    // Convert to array and sort by count (most used)
    const topEmojis = Array.from(emojiStats.entries())
      .map(([emoji, stats]) => ({
        emoji,
        count: stats.count,
        averageValue: stats.averageValue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Get metadata for each emoji
    const withMetadata = await Promise.all(
      topEmojis.map(async (emojiStat) => {
        const metadata = await ctx.db
          .query('emojis')
          .withIndex('byEmoji', (q) => q.eq('emoji', emojiStat.emoji))
          .first();

        return {
          ...emojiStat,
          tags: metadata?.tags || [],
          category: metadata?.category || 'unknown',
          sentiment: metadata?.sentiment || 'neutral',
        };
      })
    );

    return withMetadata;
  },
});

// Get the most-interacted emoji for a vibe
export const getMostInteractedEmoji = query({
  args: { vibeId: v.string() },
  handler: async (ctx, args) => {
    // First, check emoji ratings
    const topEmojiRatings = await getTopEmojiRatings(ctx, {
      vibeId: args.vibeId,
      limit: 1,
    });

    if (topEmojiRatings.length > 0) {
      return {
        emoji: topEmojiRatings[0].emoji,
        type: 'rating' as const,
        count: topEmojiRatings[0].count,
        averageValue: topEmojiRatings[0].averageValue,
      };
    }

    // No emoji ratings found
    return null;
  },
});

// Calculate emoji rating statistics for a vibe
export const getEmojiRatingStats = query({
  args: { vibeId: v.string() },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', args.vibeId))
      .filter((q) => q.neq(q.field('emoji'), undefined))
      .collect();

    const emojiGroups = new Map<string, number[]>();

    for (const rating of ratings) {
      const values = emojiGroups.get(rating.emoji) || [];
      values.push(rating.value);
      emojiGroups.set(rating.emoji, values);
    }

    const stats = Array.from(emojiGroups.entries()).map(([emoji, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const sorted = [...values].sort((a, b) => a - b);
      const median =
        values.length % 2 === 0
          ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
          : sorted[Math.floor(values.length / 2)];

      return {
        emoji,
        count: values.length,
        average: avg,
        median,
        distribution: {
          1: values.filter((v) => v === 1).length,
          2: values.filter((v) => v === 2).length,
          3: values.filter((v) => v === 3).length,
          4: values.filter((v) => v === 4).length,
          5: values.filter((v) => v === 5).length,
        },
      };
    });

    return stats.sort((a, b) => b.count - a.count);
  },
});

// Get user emoji rating statistics
export const getUserEmojiStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get all ratings by the user
    const userRatings = await ctx.db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', args.userId))
      .collect();

    // Group by emoji and calculate stats
    const emojiStats = new Map<
      string,
      { count: number; totalValue: number; emojis: string[] }
    >();

    for (const rating of userRatings) {
      const existing = emojiStats.get(rating.emoji) || {
        count: 0,
        totalValue: 0,
        emojis: [],
      };
      existing.count++;
      existing.totalValue += rating.value;
      emojiStats.set(rating.emoji, existing);
    }

    // Convert to array and sort by usage count
    const stats = Array.from(emojiStats.entries())
      .map(([emoji, data]) => ({
        emoji,
        count: data.count,
        averageValue: data.totalValue / data.count,
      }))
      .sort((a, b) => b.count - a.count);

    // Get total ratings count
    const totalEmojiRatings = userRatings.length;

    // Get most used emoji
    const mostUsedEmoji = stats[0] || null;

    // Get highest average rating emoji (min 3 uses)
    const highestRatedEmoji =
      stats
        .filter((s) => s.count >= 3)
        .sort((a, b) => b.averageValue - a.averageValue)[0] || null;

    return {
      stats,
      totalEmojiRatings,
      mostUsedEmoji,
      highestRatedEmoji,
      topEmojis: stats.slice(0, 5),
    };
  },
});

// Get trending emoji ratings
export const getTrendingEmojis = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - args.days * 24 * 60 * 60 * 1000);

    // Get all ratings from the last N days
    const recentRatings = await ctx.db
      .query('ratings')
      .withIndex('byCreatedAt', (q) =>
        q.gte('createdAt', daysAgo.toISOString())
      )
      .collect();

    // Get all emoji ratings from the previous N days (for comparison)
    const previousPeriodStart = new Date(
      daysAgo.getTime() - args.days * 24 * 60 * 60 * 1000
    );
    const allPreviousRatings = await ctx.db
      .query('ratings')
      .withIndex('byCreatedAt', (q) =>
        q.gte('createdAt', previousPeriodStart.toISOString())
      )
      .collect();

    // Filter to only include ratings from the previous period
    const previousRatings = allPreviousRatings.filter(
      (r) => r.createdAt < daysAgo.toISOString()
    );

    // Calculate stats for recent period
    const recentStats = new Map<
      string,
      { count: number; totalValue: number }
    >();
    for (const rating of recentRatings) {
      const existing = recentStats.get(rating.emoji) || {
        count: 0,
        totalValue: 0,
      };
      existing.count++;
      existing.totalValue += rating.value;
      recentStats.set(rating.emoji, existing);
    }

    // Calculate stats for previous period
    const previousStats = new Map<string, { count: number }>();
    for (const rating of previousRatings) {
      const existing = previousStats.get(rating.emoji) || { count: 0 };
      existing.count++;
      previousStats.set(rating.emoji, existing);
    }

    // Convert to array with change percentage
    const trends = Array.from(recentStats.entries())
      .map(([emoji, data]) => {
        const previousCount = previousStats.get(emoji)?.count || 0;
        const change =
          previousCount > 0
            ? ((data.count - previousCount) / previousCount) * 100
            : 100; // New emoji is 100% growth

        return {
          emoji,
          count: data.count,
          averageValue: data.totalValue / data.count,
          change,
        };
      })
      .sort((a, b) => {
        // Sort by growth rate first, then by count
        if (b.change !== a.change) return b.change - a.change;
        return b.count - a.count;
      });

    return trends;
  },
});
