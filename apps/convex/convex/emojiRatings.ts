import {
  query,
  mutation,
  type QueryCtx,
  type MutationCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';

// Helper function to compute user display name (backend version)
function computeUserDisplayName(user: Doc<'users'> | null): string {
  if (!user) {
    return 'Someone';
  }

  // Priority 1: username
  if (user.username?.trim()) {
    return user.username.trim();
  }

  // Priority 2: first_name + last_name
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  // No legacy name field in Convex schema - skip this step

  // Fallback
  return 'Someone';
}

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

// Get user's existing ratings for a vibe
export const getUserVibeRatings = query({
  args: { vibeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const ratings = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', args.vibeId).eq('userId', identity.subject)
      )
      .collect();

    return ratings.map((rating) => ({
      id: rating._id,
      emoji: rating.emoji,
      value: rating.value,
      review: rating.review,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    }));
  },
});

// Get ALL ratings for a vibe (for displaying all user ratings)
export const getAllRatingsForVibe = query({
  args: { vibeId: v.string() },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', args.vibeId))
      .collect();

    // Get all users who rated this vibe in a single query
    const userIds = [...new Set(ratings.map((r) => r.userId))];
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', userId))
          .first();
        return user;
      })
    );

    // Create a user map for efficient lookup
    const userMap = new Map(
      users.filter((u) => u).map((u) => [u!.externalId, u])
    );

    // Return ratings with user details
    return ratings.map((rating) => ({
      _id: rating._id,
      vibeId: rating.vibeId,
      userId: rating.userId,
      emoji: rating.emoji,
      value: rating.value,
      review: rating.review,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
      user: userMap.get(rating.userId) || null,
    }));
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

    // Check if user is trying to rate their own vibe
    const vibe = await ctx.db
      .query('vibes')
      .withIndex('id', (q) => q.eq('id', args.vibeId))
      .first();

    if (!vibe) {
      throw new Error('Vibe not found');
    }

    if (vibe.createdById === identity.subject) {
      throw new Error('You cannot rate your own vibe');
    }

    const now = new Date().toISOString();
    const tags: string[] = [];

    // Get emoji metadata for tags
    await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    // Tags come from the rating data, not from the emoji itself
    // The emoji metadata contains keywords, not tags

    // Check if user already rated this vibe with this specific emoji
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeUserEmoji', (q) =>
        q
          .eq('vibeId', args.vibeId)
          .eq('userId', identity.subject)
          .eq('emoji', args.emoji)
      )
      .first();

    const ratingData = {
      emoji: args.emoji,
      value: args.value,
      review: args.review,
      tags: tags.length > 0 ? tags : undefined,
      updatedAt: now,
    };

    let result;
    if (existingRating) {
      // Update existing rating
      await ctx.db.patch(existingRating._id, ratingData);
      result = existingRating._id;
    } else {
      // Create new rating
      result = await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: identity.subject,
        createdAt: now,
        ...ratingData,
      });
    }

    // Create rating notification for the vibe creator (only for new ratings or significant updates)
    try {
      // Note: vibe is already fetched above for validation
      if (vibe.createdById !== identity.subject) {
        // Don't notify yourself
        // Get the rater's user info
        const raterUser = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', identity.subject)
          )
          .first();

        const raterDisplayName = computeUserDisplayName(raterUser);
        const ratingId = existingRating ? existingRating._id : result;

        // Extract notification args to avoid type depth issues
        const notificationArgs = {
          userId: vibe.createdById,
          type: 'rating' as const,
          triggerUserId: identity.subject,
          targetId: ratingId ? ratingId.toString() : '',
          title: `${raterDisplayName} rated your vibe with ${args.emoji}`,
          description: 'see what they thought',
          metadata: {
            vibeTitle: vibe.title,
            emoji: args.emoji,
            ratingValue: args.value,
          },
        };

        // Schedule notification with type workaround
        // @ts-expect-error Convex FunctionReference generics are too deep for TS here
        await (ctx.scheduler as unknown).runAfter(
          0,
          // @ts-expect-error Convex generated internal reference type depth
          (internal as unknown).notifications.createNotification,
          notificationArgs as unknown
        );
      }
    } catch (error) {
      // Don't fail the rating operation if notification creation fails
      // eslint-disable-next-line no-console
      console.error('Failed to create rating notification:', error);
    }

    // Create new rating notifications for users who follow the rater (only for new ratings)
    if (!existingRating) {
      try {
        // Get the rater's user info (vibe is already fetched above)
        const raterUser = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', identity.subject)
          )
          .first();

        if (raterUser) {
          const raterDisplayName = computeUserDisplayName(raterUser);

          // Get vibe creator info
          const vibeCreator = await ctx.db
            .query('users')
            .withIndex('byExternalId', (q) =>
              q.eq('externalId', vibe.createdById)
            )
            .first();

          const vibeCreatorName = computeUserDisplayName(vibeCreator);

          // Extract notification args to avoid type depth issues
          const followerNotificationArgs = {
            triggerUserId: identity.subject,
            triggerUserDisplayName: raterDisplayName,
            type: 'new_rating' as const,
            targetId: result ? result.toString() : '',
            title: `${raterDisplayName} reviewed a vibe`,
            description: 'see their review',
            metadata: {
              vibeTitle: vibe.title,
              vibeCreator: vibeCreatorName,
              emoji: args.emoji,
              ratingValue: args.value,
            },
            maxFollowers: 50,
          };

          // PERFORMANCE OPTIMIZED: Use batch notification system
          // @ts-expect-error Convex FunctionReference generics are too deep for TS here
          await (ctx.scheduler as unknown).runAfter(
            0,
            // @ts-expect-error Convex generated internal reference type depth
            (internal as unknown).notifications.createFollowerNotifications,
            followerNotificationArgs as unknown
          );
        }
      } catch (error) {
        // Don't fail the rating operation if notification creation fails
        // eslint-disable-next-line no-console
        console.error(
          'Failed to create new rating notifications for followers:',
          error
        );
      }
    }

    // Award points for writing a review (only for new ratings)
    if (!existingRating) {
      try {
        // @ts-expect-error Convex FunctionReference generics are too deep for TS here
        await (ctx.scheduler as unknown).runAfter(
          0,
          // @ts-expect-error Convex generated internal reference type depth
          (internal as unknown).userPoints.awardPointsForReview,
          {
            userId: identity.subject,
            ratingId: result ? result.toString() : '',
            vibeId: args.vibeId,
          } as unknown
        );
      } catch (error) {
        // Don't fail the rating operation if points award fails
        // eslint-disable-next-line no-console
        console.error('Failed to award points for review:', error);
      }
    }

    return result;
  },
});

// Helper function to get top emoji ratings
async function getTopEmojiRatingsInternal(
  ctx: QueryCtx,
  args: { vibeId: string; limit?: number }
) {
  const limit = args.limit ?? 5;

  // Get all ratings for this vibe that have emoji field
  const ratings = await ctx.db
    .query('ratings')
    .withIndex('vibe', (q) => q.eq('vibeId', args.vibeId))
    .filter((q) => q.neq(q.field('emoji'), undefined))
    .collect();

  // Group by emoji and calculate stats
  const emojiStats = new Map<
    string,
    { count: number; totalValue: number; tags: Set<string> }
  >();

  for (const rating of ratings) {
    const stats = emojiStats.get(rating.emoji) || {
      count: 0,
      totalValue: 0,
      tags: new Set<string>(),
    };
    stats.count++;
    stats.totalValue += rating.value;
    if (rating.tags) {
      rating.tags.forEach((tag: string) => stats.tags.add(tag));
    }
    emojiStats.set(rating.emoji, stats);
  }

  // Convert to sorted array
  const sortedEmojis = Array.from(emojiStats.entries())
    .map(([emoji, stats]) => ({
      emoji,
      count: stats.count,
      averageValue: stats.totalValue / stats.count,
      tags: Array.from(stats.tags),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // Get emoji metadata for additional info
  const emojis = await Promise.all(
    sortedEmojis.map(async (stat) => {
      const emojiData = await ctx.db
        .query('emojis')
        .withIndex('byEmoji', (q) => q.eq('emoji', stat.emoji))
        .first();

      return {
        ...stat,
        category: emojiData?.category || 'unknown',
        sentiment: emojiData?.sentiment || 'neutral',
      };
    })
  );

  return emojis;
}

// Get top emoji ratings for a vibe
export const getTopEmojiRatings = query({
  args: {
    vibeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return getTopEmojiRatingsInternal(ctx, args);
  },
});

// Get the most-interacted emoji for a vibe
export const getMostInteractedEmoji = query({
  args: { vibeId: v.string() },
  handler: async (ctx, args) => {
    // First, check emoji ratings
    const topEmojiRatings = await getTopEmojiRatingsInternal(ctx, {
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

// Toggle boost on a rating (boost/unboost) - Now includes point transfers
export const toggleRatingBoost = mutation({
  args: {
    ratingId: v.id('ratings'),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    boosted: boolean;
    action: string;
    pointsTransferred: number;
    message: string;
  }> => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to boost a rating');
    }

    // Check if the rating exists
    const rating = await ctx.db.get(args.ratingId);
    if (!rating) {
      throw new Error('Rating not found');
    }

    // Prevent users from boosting their own ratings
    if (rating.userId === identity.subject) {
      throw new Error('You cannot boost your own rating');
    }

    // Get or create voter's points
    let voterPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', identity.subject))
      .first();

    if (!voterPoints) {
      // Initialize voter's user points inline
      const today = new Date().toISOString().split('T')[0];
      const starterPoints = 50;
      const userPointsId = await ctx.db.insert('userPoints', {
        userId: identity.subject,
        totalPointsEarned: starterPoints,
        currentBalance: starterPoints,
        protectedPoints: 50, // MIN_PROTECTED_POINTS + extra protection
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        level: 1,
        multiplier: 1.0,
        streakDays: 0,
        lastActivityDate: today,
        karmaScore: 0,
      });
      voterPoints = await ctx.db.get(userPointsId);

      if (!voterPoints) {
        throw new Error('Failed to initialize user points');
      }
    }

    // Get or create rating author's points for level calculation
    let authorPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', rating.userId))
      .first();

    if (!authorPoints) {
      // Initialize author's user points inline
      const today = new Date().toISOString().split('T')[0];
      const starterPoints = 50;
      const userPointsId = await ctx.db.insert('userPoints', {
        userId: rating.userId,
        totalPointsEarned: starterPoints,
        currentBalance: starterPoints,
        protectedPoints: 50, // MIN_PROTECTED_POINTS + extra protection
        dailyEarnedPoints: 0,
        dailyPostCount: 0,
        dailyReviewCount: 0,
        dailyDampenCount: 0,
        lastResetDate: today,
        level: 1,
        multiplier: 1.0,
        streakDays: 0,
        lastActivityDate: today,
        karmaScore: 0,
      });
      authorPoints = await ctx.db.get(userPointsId);

      if (!authorPoints) {
        throw new Error('Failed to initialize rating author points');
      }
    }

    // Calculate transfer amount based on levels
    const transferAmount = Math.ceil(
      2 * (1 + Math.max(0, authorPoints.level - voterPoints.level) * 0.1)
    );

    // Check if user already voted on this rating
    const existingVote = await ctx.db
      .query('ratingVotes')
      .withIndex('byRatingAndUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', identity.subject)
      )
      .first();

    let pointTransferResult = null;
    let message = '';

    if (existingVote) {
      if (existingVote.voteType === 'boost') {
        // Unboost - remove the existing boost vote and reverse point transfer
        await ctx.db.delete(existingVote._id);
        await updateRatingScore(ctx, args.ratingId);

        // Reverse the point transfer (from author back to voter)
        if (authorPoints.currentBalance >= transferAmount) {
          pointTransferResult = await ctx.runMutation(
            internal.userPoints.internalProcessPointTransfer,
            {
              fromUserId: rating.userId, // from (author)
              toUserId: identity.subject, // to (voter)
              amount: transferAmount,
              transferType: 'boost',
              targetId: args.ratingId,
              metadata: { action: 'unboost', ratingId: args.ratingId },
            }
          );

          if (pointTransferResult.success) {
            message = `Unboosted! Reclaimed ${transferAmount} VP`;
          }
        }

        return {
          boosted: false,
          action: 'unboosted',
          pointsTransferred: pointTransferResult?.success ? transferAmount : 0,
          message: message || 'Unboosted!',
        };
      } else {
        // Switch from dampen to boost - handle both point transfers
        // First reverse the dampen penalty (give points back to author if possible)
        // Then do the boost transfer (from voter to author)

        if (voterPoints.currentBalance < transferAmount) {
          throw new Error(
            `Insufficient points. You need ${transferAmount} VP to boost this rating.`
          );
        }

        await ctx.db.patch(existingVote._id, {
          voteType: 'boost' as const,
          createdAt: Date.now(),
        });
        await updateRatingScore(ctx, args.ratingId);

        // Process boost transfer (voter to author)
        pointTransferResult = await ctx.runMutation(
          internal.userPoints.internalProcessPointTransfer,
          {
            fromUserId: identity.subject, // from (voter)
            toUserId: rating.userId, // to (author)
            amount: transferAmount,
            transferType: 'boost',
            targetId: args.ratingId,
            metadata: { action: 'switch_to_boost', ratingId: args.ratingId },
          }
        );

        if (pointTransferResult.success) {
          message = `Switched to boost! Sent ${transferAmount} VP to rating author`;
        }

        return {
          boosted: true,
          action: 'boosted',
          pointsTransferred: pointTransferResult?.success ? transferAmount : 0,
          message: message || 'Switched to boost!',
        };
      }
    } else {
      // New boost - create new boost vote and transfer points
      if (voterPoints.currentBalance < transferAmount) {
        throw new Error(
          `Insufficient points. You need ${transferAmount} VP to boost this rating.`
        );
      }

      await ctx.db.insert('ratingVotes', {
        ratingId: args.ratingId,
        userId: identity.subject,
        voteType: 'boost',
        createdAt: Date.now(),
      });
      await updateRatingScore(ctx, args.ratingId);

      // Process boost transfer (voter to author)
      pointTransferResult = await ctx.runMutation(
        internal.userPoints.internalProcessPointTransfer,
        {
          fromUserId: identity.subject, // from (voter)
          toUserId: rating.userId, // to (author)
          amount: transferAmount,
          transferType: 'boost',
          targetId: args.ratingId,
          metadata: { action: 'boost', ratingId: args.ratingId },
        }
      );

      if (pointTransferResult.success) {
        message = `Boosted! Sent ${transferAmount} VP to rating author`;
      }

      return {
        boosted: true,
        action: 'boosted',
        pointsTransferred: pointTransferResult?.success ? transferAmount : 0,
        message: message || 'Boosted!',
      };
    }
  },
});

// Toggle dampen on a rating (dampen/undampen) - Now includes point penalties
export const toggleRatingDampen = mutation({
  args: {
    ratingId: v.id('ratings'),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    dampened: boolean;
    action: string;
    pointsPenalized: number;
    message: string;
  }> => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to dampen a rating');
    }

    // Check if the rating exists
    const rating = await ctx.db.get(args.ratingId);
    if (!rating) {
      throw new Error('Rating not found');
    }

    // Prevent users from dampening their own ratings
    if (rating.userId === identity.subject) {
      throw new Error('You cannot dampen your own rating');
    }

    // Get dampener's points to check daily limit
    const dampenerPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', identity.subject))
      .first();

    if (!dampenerPoints) {
      throw new Error('User points not found. Please try refreshing the page.');
    }

    // Get rating author's points for penalty calculation
    const authorPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', rating.userId))
      .first();

    if (!authorPoints) {
      throw new Error('Rating author points not found.');
    }

    // Check daily dampen limit
    const currentDampenCount = dampenerPoints.dailyDampenCount || 0;
    if (currentDampenCount >= 10) {
      // MAX_DAMPEN_PER_DAY
      throw new Error('You have reached your daily dampen limit (10 per day).');
    }

    // Check if author is protected
    const accountAge = Date.now() - (authorPoints._creationTime || 0);
    const daysOld = accountAge / (1000 * 60 * 60 * 24);
    const isProtected =
      daysOld < 7 || // NEW_USER_PROTECTED_DAYS
      Math.max(
        0,
        authorPoints.currentBalance - (authorPoints.protectedPoints || 0)
      ) <= 20; // MIN_PROTECTED_POINTS

    if (isProtected) {
      throw new Error(
        'This user is protected from dampening (new user or low balance).'
      );
    }

    // Calculate penalty amount
    const protectedPoints = authorPoints.protectedPoints || 0;
    const karmaScore = authorPoints.karmaScore || 0;
    const effectiveBalance = Math.max(
      0,
      authorPoints.currentBalance - protectedPoints
    );

    let penalty = 1; // RATING_DAMPEN_PENALTY

    // Reduce penalty if user has low effective balance
    const balanceMultiplier =
      effectiveBalance > 50 ? 1 : Math.max(0.2, effectiveBalance / 50);

    // Reduce penalty for users with good karma
    const karmaMultiplier =
      karmaScore > 0 ? Math.max(0.5, 1 - karmaScore / 100) : 1;

    // Increase penalty for users with bad karma
    const badKarmaMultiplier =
      karmaScore < 0 ? Math.min(2, 1 + Math.abs(karmaScore / 50)) : 1;

    penalty =
      penalty * balanceMultiplier * karmaMultiplier * badKarmaMultiplier;
    penalty = Math.min(penalty, 5); // MAX_DAMPEN_PENALTY
    penalty = Math.min(penalty, effectiveBalance); // Can't take more than available
    penalty = Math.ceil(penalty);

    // Check if user already voted on this rating
    const existingVote = await ctx.db
      .query('ratingVotes')
      .withIndex('byRatingAndUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', identity.subject)
      )
      .first();

    let pointTransferResult = null;
    let message = '';

    if (existingVote) {
      if (existingVote.voteType === 'dampen') {
        // Undampen - remove the existing dampen vote and restore points if possible
        await ctx.db.delete(existingVote._id);
        await updateRatingScore(ctx, args.ratingId);

        // Try to restore points to the author (reverse dampen penalty)
        pointTransferResult = await ctx.runMutation(
          internal.userPoints.internalProcessPointTransfer,
          {
            fromUserId: identity.subject, // doesn't matter for restore
            toUserId: rating.userId, // to (author)
            amount: penalty,
            transferType: 'boost', // use boost to add points back
            targetId: args.ratingId,
            metadata: {
              action: 'undampen',
              ratingId: args.ratingId,
              restored: true,
            },
          }
        );

        if (pointTransferResult.success) {
          message = `Undampened! Restored ${penalty} VP to rating author`;
        }

        return {
          dampened: false,
          action: 'undampened',
          pointsPenalized: 0,
          message: message || 'Undampened!',
        };
      } else {
        // Switch from boost to dampen - reverse boost transfer and apply dampen penalty
        await ctx.db.patch(existingVote._id, {
          voteType: 'dampen' as const,
          createdAt: Date.now(),
        });
        await updateRatingScore(ctx, args.ratingId);

        // Apply dampen penalty
        if (penalty > 0 && effectiveBalance > 0) {
          pointTransferResult = await ctx.runMutation(
            internal.userPoints.internalProcessPointTransfer,
            {
              fromUserId: identity.subject, // doesn't spend dampener's points
              toUserId: rating.userId, // to (author) - will lose points
              amount: penalty,
              transferType: 'dampen',
              targetId: args.ratingId,
              metadata: { action: 'switch_to_dampen', ratingId: args.ratingId },
            }
          );

          if (pointTransferResult.success) {
            message = `Switched to dampen! Removed ${penalty} VP from rating author`;
          }
        }

        // Update dampener's daily count
        await ctx.db.patch(dampenerPoints._id, {
          dailyDampenCount: currentDampenCount + 1,
        });

        return {
          dampened: true,
          action: 'dampened',
          pointsPenalized: pointTransferResult?.success ? penalty : 0,
          message: message || 'Switched to dampen!',
        };
      }
    } else {
      // New dampen - create new dampen vote and apply penalty
      await ctx.db.insert('ratingVotes', {
        ratingId: args.ratingId,
        userId: identity.subject,
        voteType: 'dampen',
        createdAt: Date.now(),
      });
      await updateRatingScore(ctx, args.ratingId);

      // Apply dampen penalty
      if (penalty > 0 && effectiveBalance > 0) {
        pointTransferResult = await ctx.runMutation(
          internal.userPoints.internalProcessPointTransfer,
          {
            fromUserId: identity.subject, // doesn't spend dampener's points
            toUserId: rating.userId, // to (author) - will lose points
            amount: penalty,
            transferType: 'dampen',
            targetId: args.ratingId,
            metadata: { action: 'dampen', ratingId: args.ratingId },
          }
        );

        if (pointTransferResult.success) {
          message = `Dampened! Removed ${penalty} VP from rating author`;
        }
      }

      // Update dampener's daily count
      await ctx.db.patch(dampenerPoints._id, {
        dailyDampenCount: currentDampenCount + 1,
      });

      return {
        dampened: true,
        action: 'dampened',
        pointsPenalized: pointTransferResult?.success ? penalty : 0,
        message: message || 'Dampened!',
      };
    }
  },
});

// Helper function to update rating score based on votes
async function updateRatingScore(ctx: MutationCtx, ratingId: Id<'ratings'>) {
  // Count all votes for this rating
  const votes = await ctx.db
    .query('ratingVotes')
    .withIndex('byRating', (q) => q.eq('ratingId', ratingId))
    .collect();

  const boostCount = votes.filter((v) => v.voteType === 'boost').length;
  const dampenCount = votes.filter((v) => v.voteType === 'dampen').length;
  const netScore = boostCount - dampenCount;

  // Update the rating with new scores
  await ctx.db.patch(ratingId, {
    boostCount,
    dampenCount,
    netScore,
  });
}

// Legacy function - kept for backward compatibility during transition
export const toggleRatingLike = mutation({
  args: {
    ratingId: v.id('ratings'),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    boosted: boolean;
    action: string;
    pointsTransferred: number;
    message: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to like a rating');
    }

    const rating = await ctx.db.get(args.ratingId);
    if (!rating) {
      throw new Error('Rating not found');
    }
    if (rating.userId === identity.subject) {
      throw new Error('You cannot like your own rating');
    }

    const existing = await ctx.db
      .query('ratingVotes')
      .withIndex('byRatingAndUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', identity.subject)
      )
      .first();

    if (existing && existing.voteType === 'boost') {
      await ctx.db.delete(existing._id);
      await updateRatingScore(ctx, args.ratingId);
      return {
        boosted: false,
        action: 'unboosted',
        pointsTransferred: 0,
        message: 'Unboosted!',
      };
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        voteType: 'boost' as const,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert('ratingVotes', {
        ratingId: args.ratingId,
        userId: identity.subject,
        voteType: 'boost',
        createdAt: Date.now(),
      });
    }
    await updateRatingScore(ctx, args.ratingId);
    return {
      boosted: true,
      action: 'boosted',
      pointsTransferred: 0,
      message: 'Boosted!',
    };
  },
});

// Get vote score for a rating (net score and counts)
export const getRatingVoteScore = query({
  args: {
    ratingId: v.id('ratings'),
  },
  handler: async (ctx, args) => {
    const rating = await ctx.db.get(args.ratingId);
    if (!rating) {
      return { netScore: 0, boostCount: 0, dampenCount: 0 };
    }

    return {
      netScore: rating.netScore ?? 0,
      boostCount: rating.boostCount ?? 0,
      dampenCount: rating.dampenCount ?? 0,
    };
  },
});

// Check current user's vote status on a rating
export const getUserRatingVoteStatus = query({
  args: {
    ratingId: v.id('ratings'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { voteType: null, boosted: false, dampened: false };
    }

    const vote = await ctx.db
      .query('ratingVotes')
      .withIndex('byRatingAndUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', identity.subject)
      )
      .first();

    if (!vote) {
      return { voteType: null, boosted: false, dampened: false };
    }

    return {
      voteType: vote.voteType,
      boosted: vote.voteType === 'boost',
      dampened: vote.voteType === 'dampen',
    };
  },
});

// Legacy functions - kept for backward compatibility during transition
export const getRatingLikeCount = query({
  args: {
    ratingId: v.id('ratings'),
  },
  handler: async (ctx, args): Promise<number> => {
    const result: { netScore: number } = await ctx.runQuery(
      // @ts-expect-error Type instantiation is excessively deep - Convex generated types
      api.emojiRatings.getRatingVoteScore,
      args
    );
    return result.netScore; // Return net score instead of like count
  },
});

export const getUserRatingLikeStatus = query({
  args: {
    ratingId: v.id('ratings'),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const result: { boosted: boolean } = await ctx.runQuery(
      api.emojiRatings.getUserRatingVoteStatus,
      args
    );
    return result.boosted; // Return boosted status instead of liked
  },
});

// Get vote scores for multiple ratings (bulk query for performance)
export const getBulkRatingVoteScores = query({
  args: {
    ratingIds: v.array(v.id('ratings')),
  },
  handler: async (ctx, args) => {
    const scoreMap = new Map<
      string,
      { netScore: number; boostCount: number; dampenCount: number }
    >();

    // Get all ratings and their scores
    const ratings = await Promise.all(
      args.ratingIds.map(async (ratingId) => {
        const rating = await ctx.db.get(ratingId);
        return {
          ratingId,
          netScore: rating?.netScore ?? 0,
          boostCount: rating?.boostCount ?? 0,
          dampenCount: rating?.dampenCount ?? 0,
        };
      })
    );

    // Build the result map
    for (const rating of ratings) {
      scoreMap.set(rating.ratingId, {
        netScore: rating.netScore,
        boostCount: rating.boostCount,
        dampenCount: rating.dampenCount,
      });
    }

    return Object.fromEntries(scoreMap);
  },
});

// Get user vote statuses for multiple ratings (bulk query for performance)
export const getBulkUserRatingVoteStatuses = query({
  args: {
    ratingIds: v.array(v.id('ratings')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return all neutral if not authenticated
      return Object.fromEntries(
        args.ratingIds.map((ratingId) => [
          ratingId,
          { voteType: null, boosted: false, dampened: false },
        ])
      );
    }

    const voteStatuses = new Map<
      string,
      {
        voteType: 'boost' | 'dampen' | null;
        boosted: boolean;
        dampened: boolean;
      }
    >();

    // Initialize all ratings as not voted
    for (const ratingId of args.ratingIds) {
      voteStatuses.set(ratingId, {
        voteType: null,
        boosted: false,
        dampened: false,
      });
    }

    // Get all votes by this user for the provided rating IDs
    const userVotes = await Promise.all(
      args.ratingIds.map(async (ratingId) => {
        const vote = await ctx.db
          .query('ratingVotes')
          .withIndex('byRatingAndUser', (q) =>
            q.eq('ratingId', ratingId).eq('userId', identity.subject)
          )
          .first();
        return {
          ratingId,
          voteType: vote?.voteType ?? null,
          boosted: vote?.voteType === 'boost',
          dampened: vote?.voteType === 'dampen',
        };
      })
    );

    // Update the statuses
    for (const vote of userVotes) {
      voteStatuses.set(vote.ratingId, {
        voteType: vote.voteType,
        boosted: vote.boosted,
        dampened: vote.dampened,
      });
    }

    return Object.fromEntries(voteStatuses);
  },
});

// Legacy functions - kept for backward compatibility during transition
export const getBulkRatingLikeCounts = query({
  args: {
    ratingIds: v.array(v.id('ratings')),
  },
  handler: async (ctx, args) => {
    const scores = await ctx.runQuery(
      api.emojiRatings.getBulkRatingVoteScores,
      args
    );
    const likeCounts: Record<string, number> = {};
    for (const [ratingId, score] of Object.entries(
      scores as Record<
        string,
        { netScore: number; boostCount: number; dampenCount: number }
      >
    )) {
      likeCounts[ratingId] = score.netScore; // Return net score instead of like count
    }

    return likeCounts;
  },
});

export const getBulkUserRatingLikeStatuses = query({
  args: {
    ratingIds: v.array(v.id('ratings')),
  },
  handler: async (ctx, args) => {
    const voteStatuses = await ctx.runQuery(
      api.emojiRatings.getBulkUserRatingVoteStatuses,
      args
    );
    const likeStatuses: Record<string, boolean> = {};
    for (const [ratingId, status] of Object.entries(
      voteStatuses as Record<
        string,
        {
          voteType: 'boost' | 'dampen' | null;
          boosted: boolean;
          dampened: boolean;
        }
      >
    )) {
      likeStatuses[ratingId] = status.boosted; // Return boosted status instead of liked
    }

    return likeStatuses;
  },
});

// Helper function to delete a rating and all its votes/likes (for data consistency)
async function deleteRatingWithVotes(
  ctx: MutationCtx,
  ratingId: Id<'ratings'>
) {
  // Delete all votes on this rating
  const ratingVotes = await ctx.db
    .query('ratingVotes')
    .withIndex('byRating', (q) => q.eq('ratingId', ratingId))
    .collect();

  for (const vote of ratingVotes) {
    await ctx.db.delete(vote._id);
  }

  // Delete all legacy likes on this rating
  const ratingsLikes = await ctx.db
    .query('ratingLikes')
    .withIndex('byRating', (q) => q.eq('ratingId', ratingId))
    .collect();

  for (const like of ratingsLikes) {
    await ctx.db.delete(like._id);
  }

  // Then delete the rating itself
  await ctx.db.delete(ratingId);
}

// Keep old function name for backward compatibility

const _deleteRatingWithLikes = deleteRatingWithVotes;

// Admin function to clean up orphaned rating likes (for data consistency)
export const cleanupOrphanedRatingLikes = mutation({
  args: {},

  handler: async (ctx, _args) => {
    // Check authentication (admin only)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to perform this action');
    }

    // Get user to check admin status
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', identity.subject))
      .first();

    if (!user?.isAdmin) {
      throw new Error('Only administrators can perform this action');
    }

    // Get all rating likes
    const allLikes = await ctx.db.query('ratingLikes').collect();
    let deletedCount = 0;

    // Check each like to see if its rating still exists
    for (const like of allLikes) {
      const rating = await ctx.db.get(like.ratingId);
      if (!rating) {
        // Rating no longer exists, delete the orphaned like
        await ctx.db.delete(like._id);
        deletedCount++;
      }
    }

    return { deletedOrphanedLikes: deletedCount };
  },
});

// Default export for test-setup
const emojiRatingsModule: Record<string, unknown> = {
  getEmojiMetadata,
  getAllEmojiMetadata,
  getEmojiByCategory,
  createOrUpdateEmojiRating,
  getTopEmojiRatings,
  getMostInteractedEmoji,
  getEmojiRatingStats,
  getUserEmojiStats,
  getTrendingEmojis,
  toggleRatingBoost,
  toggleRatingDampen,
  getRatingVoteScore,
  getUserRatingVoteStatus,
  getBulkRatingVoteScores,
  getBulkUserRatingVoteStatuses,
  // Legacy functions for backward compatibility
  toggleRatingLike,
  getRatingLikeCount,
  getUserRatingLikeStatus,
  getBulkRatingLikeCounts,
  getBulkUserRatingLikeStatuses,
  cleanupOrphanedRatingLikes,
};
export default emojiRatingsModule;
