import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Get emoji metadata by emoji
export const getEmojiMetadata = query({
  args: { emoji: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('emojiRatingMetadata')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();
  },
});

// Get all emoji metadata
export const getAllEmojiMetadata = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('emojiRatingMetadata').collect();
  },
});

// Get emoji metadata by category
export const getEmojiByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('emojiRatingMetadata')
      .withIndex('byCategory', (q) => q.eq('category', args.category))
      .collect();
  },
});

// Create or update rating with emoji
export const createOrUpdateEmojiRating = mutation({
  args: {
    vibeId: v.string(),
    rating: v.number(), // Traditional 1-5 rating
    review: v.optional(v.string()),
    emoji: v.optional(v.string()),
    emojiValue: v.optional(v.number()), // 1-5 scale for emoji
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to rate a vibe');
    }

    // Validate rating values
    if (args.rating < 1 || args.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    if (args.emojiValue && (args.emojiValue < 1 || args.emojiValue > 5)) {
      throw new Error('Emoji rating value must be between 1 and 5');
    }

    const now = new Date().toISOString();
    let tags: string[] = [];

    // If emoji rating is provided, get associated tags
    if (args.emoji && args.emojiValue) {
      const emojiMetadata = await ctx.db
        .query('emojiRatingMetadata')
        .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
        .first();

      if (emojiMetadata) {
        tags = emojiMetadata.tags;
      }
    }

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', args.vibeId).eq('userId', identity.subject)
      )
      .first();

    const ratingData = {
      rating: args.rating,
      review: args.review,
      date: now,
      emojiRating:
        args.emoji && args.emojiValue
          ? { emoji: args.emoji, value: args.emojiValue }
          : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (existingRating) {
      // Update existing rating
      return await ctx.db.patch(existingRating._id, ratingData);
    } else {
      // Create new rating
      return await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: identity.subject,
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

    // Get all ratings with emoji ratings for this vibe
    const ratingsWithEmoji = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', args.vibeId))
      .filter((q) => q.neq(q.field('emojiRating'), undefined))
      .collect();

    // Count emoji occurrences and calculate average values
    const emojiStats = new Map<
      string,
      { count: number; totalValue: number; averageValue: number }
    >();

    for (const rating of ratingsWithEmoji) {
      if (rating.emojiRating) {
        const { emoji, value } = rating.emojiRating;
        const current = emojiStats.get(emoji) || {
          count: 0,
          totalValue: 0,
          averageValue: 0,
        };
        current.count += 1;
        current.totalValue += value;
        current.averageValue = current.totalValue / current.count;
        emojiStats.set(emoji, current);
      }
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
          .query('emojiRatingMetadata')
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

    // If no emoji ratings, check regular reactions
    const reactions = await ctx.db
      .query('reactions')
      .withIndex('vibe', (q) => q.eq('vibeId', args.vibeId))
      .filter((q) => q.neq(q.field('isRating'), true)) // Exclude rating reactions
      .collect();

    if (reactions.length === 0) {
      return null;
    }

    // Count reactions by emoji
    const reactionCounts = new Map<string, number>();
    for (const reaction of reactions) {
      const count = reactionCounts.get(reaction.emoji) || 0;
      reactionCounts.set(reaction.emoji, count + 1);
    }

    // Find most used reaction
    let mostUsed = { emoji: '', count: 0 };
    for (const [emoji, count] of reactionCounts) {
      if (count > mostUsed.count) {
        mostUsed = { emoji, count };
      }
    }

    return {
      emoji: mostUsed.emoji,
      type: 'reaction' as const,
      count: mostUsed.count,
      averageValue: null,
    };
  },
});

// Calculate emoji rating statistics for a vibe
export const getEmojiRatingStats = query({
  args: { vibeId: v.string() },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', args.vibeId))
      .filter((q) => q.neq(q.field('emojiRating'), undefined))
      .collect();

    const emojiGroups = new Map<string, number[]>();

    for (const rating of ratings) {
      if (rating.emojiRating) {
        const { emoji, value } = rating.emojiRating;
        const values = emojiGroups.get(emoji) || [];
        values.push(value);
        emojiGroups.set(emoji, values);
      }
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
    // Get all emoji ratings by the user
    const userEmojiRatings = await ctx.db
      .query('emojiRatings')
      .withIndex('byUser', (q) => q.eq('userId', args.userId))
      .collect();

    // Group by emoji and calculate stats
    const emojiStats = new Map<
      string,
      { count: number; totalValue: number; emojis: string[] }
    >();

    for (const rating of userEmojiRatings) {
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

    // Get total emoji ratings count
    const totalEmojiRatings = userEmojiRatings.length;

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

    // Get all emoji ratings from the last N days
    const recentRatings = await ctx.db
      .query('emojiRatings')
      .filter((q) => q.gte(q.field('createdAt'), daysAgo.toISOString()))
      .collect();

    // Get all emoji ratings from the previous N days (for comparison)
    const previousPeriodStart = new Date(
      daysAgo.getTime() - args.days * 24 * 60 * 60 * 1000
    );
    const previousRatings = await ctx.db
      .query('emojiRatings')
      .filter((q) =>
        q.and(
          q.gte(q.field('createdAt'), previousPeriodStart.toISOString()),
          q.lt(q.field('createdAt'), daysAgo.toISOString())
        )
      )
      .collect();

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
