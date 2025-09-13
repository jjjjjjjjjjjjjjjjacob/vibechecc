/**
 * Rating Likes Convex Functions
 *
 * Backend functions for managing social interactions with individual ratings.
 * Users can like/upvote ratings from other users, with tracking and analytics.
 */

import { query, mutation, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from './users';

/**
 * Like a rating
 */
export const likeRating = mutation({
  args: {
    ratingId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Check if rating exists
    const rating = await ctx.db
      .query('ratings')
      .filter((q) => q.eq(q.field('_id'), args.ratingId))
      .first();

    if (!rating) {
      throw new Error('Rating not found');
    }

    // Prevent users from liking their own ratings
    if (rating.userId === currentUser.externalId) {
      throw new Error('You cannot like your own rating');
    }

    // Check if user already liked this rating
    const existingLike = await ctx.db
      .query('ratingLikes')
      .withIndex('byRatingAndUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', currentUser.externalId)
      )
      .first();

    if (existingLike) {
      // Unlike - remove existing like
      await ctx.db.delete(existingLike._id);

      // Create notification for unlike (optional - could be skipped to reduce noise)
      // Not implementing unlike notifications to avoid spam

      return {
        action: 'unliked' as const,
        likeCount: await getRatingLikeCountInternal(ctx, args.ratingId),
        isLiked: false,
      };
    } else {
      // Like - create new like
      await ctx.db.insert('ratingLikes', {
        ratingId: args.ratingId,
        userId: currentUser.externalId,
        createdAt: Date.now(),
      });

      // Create notification for rating author (if not same user)
      if (rating.userId !== currentUser.externalId) {
        await ctx.db.insert('notifications', {
          userId: rating.userId,
          type: 'rating',
          triggerUserId: currentUser.externalId,
          targetId: args.ratingId,
          title: 'Rating liked',
          description: 'Someone liked your rating',
          metadata: {
            action: 'rating_liked',
            ratingId: args.ratingId,
            vibeId: rating.vibeId,
            emoji: rating.emoji,
            ratingText: rating.review.substring(0, 100), // Preview of rating
          },
          read: false,
          createdAt: Date.now(),
        });
      }

      return {
        action: 'liked' as const,
        likeCount: await getRatingLikeCountInternal(ctx, args.ratingId),
        isLiked: true,
      };
    }
  },
});

/**
 * Get like count for a rating (internal helper)
 */
async function getRatingLikeCountInternal(
  ctx: QueryCtx,
  ratingId: string
): Promise<number> {
  const likes = await ctx.db
    .query('ratingLikes')
    .withIndex('byRating', (q) => q.eq('ratingId', ratingId))
    .collect();

  return likes.length;
}

/**
 * Get rating likes with metadata
 */
export const getRatingLikes = query({
  args: {
    ratingId: v.string(),
  },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query('ratingLikes')
      .withIndex('byRating', (q) => q.eq('ratingId', args.ratingId))
      .order('desc')
      .collect();

    // Get user data for each like
    const likesWithUsers = await Promise.all(
      likes.map(async (like) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', like.userId))
          .first();

        return {
          ...like,
          user: user
            ? {
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                image_url: user.image_url,
              }
            : null,
        };
      })
    );

    return {
      likes: likesWithUsers,
      count: likes.length,
    };
  },
});

/**
 * Check if current user liked a rating
 */
export const isRatingLikedByUser = query({
  args: {
    ratingId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return false;
    }

    const like = await ctx.db
      .query('ratingLikes')
      .withIndex('byRatingAndUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', currentUser.externalId)
      )
      .first();

    return !!like;
  },
});

/**
 * Get rating like count
 */
export const getRatingLikeCount = query({
  args: {
    ratingId: v.string(),
  },
  handler: async (ctx, args) => {
    return await getRatingLikeCountInternal(ctx, args.ratingId);
  },
});

/**
 * Get multiple ratings' like data (for batch loading)
 */
export const getBatchRatingLikeData = query({
  args: {
    ratingIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Get all likes for these ratings
    const allLikes = await ctx.db.query('ratingLikes').collect();

    // Filter for our rating IDs
    const relevantLikes = allLikes.filter((like) =>
      args.ratingIds.includes(like.ratingId)
    );

    // Group by rating ID
    const likeCounts: Record<string, number> = {};
    const userLikes: Record<string, boolean> = {};

    args.ratingIds.forEach((ratingId) => {
      const ratingLikes = relevantLikes.filter(
        (like) => like.ratingId === ratingId
      );

      likeCounts[ratingId] = ratingLikes.length;

      if (currentUser) {
        userLikes[ratingId] = ratingLikes.some(
          (like) => like.userId === currentUser.externalId
        );
      } else {
        userLikes[ratingId] = false;
      }
    });

    return {
      likeCounts,
      userLikes,
    };
  },
});

/**
 * Get user's liked ratings (for profile/activity feed)
 */
export const getUserLikedRatings = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const targetUserId = args.userId || currentUser?.externalId;

    if (!targetUserId) {
      return [];
    }

    const limit = args.limit || 20;

    const likes = await ctx.db
      .query('ratingLikes')
      .withIndex('byUser', (q) => q.eq('userId', targetUserId))
      .order('desc')
      .take(limit);

    // Get rating data for each like
    const likedRatings = await Promise.all(
      likes.map(async (like) => {
        const rating = await ctx.db
          .query('ratings')
          .filter((q) => q.eq(q.field('_id'), like.ratingId))
          .first();

        if (!rating) {
          return null;
        }

        // Get vibe data
        const vibe = await ctx.db
          .query('vibes')
          .withIndex('id', (q) => q.eq('id', rating.vibeId))
          .first();

        // Get rating author
        const ratingAuthor = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', rating.userId))
          .first();

        return {
          like,
          rating: {
            ...rating,
            author: ratingAuthor
              ? {
                  username: ratingAuthor.username,
                  first_name: ratingAuthor.first_name,
                  last_name: ratingAuthor.last_name,
                  image_url: ratingAuthor.image_url,
                }
              : null,
          },
          vibe: vibe
            ? {
                id: vibe.id,
                title: vibe.title,
                description: vibe.description.substring(0, 100),
              }
            : null,
        };
      })
    );

    return likedRatings.filter((item) => item !== null);
  },
});

/**
 * Get rating engagement analytics
 */
export const getRatingEngagementStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = args.startDate || now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    const endDate = args.endDate || now;

    // Get all likes in date range
    const likes = await ctx.db
      .query('ratingLikes')
      .withIndex('byCreatedAt', (q) => q.gte('createdAt', startDate))
      .filter((q) => q.lte(q.field('createdAt'), endDate))
      .collect();

    // Get all ratings to calculate engagement rates
    const allRatings = await ctx.db.query('ratings').collect();

    // Calculate engagement metrics
    const totalLikes = likes.length;
    const uniqueRatingsLiked = new Set(likes.map((like) => like.ratingId)).size;
    const uniqueUsersLiking = new Set(likes.map((like) => like.userId)).size;

    const engagementRate =
      allRatings.length > 0
        ? (uniqueRatingsLiked / allRatings.length) * 100
        : 0;

    // Group by day for trend analysis
    const dailyLikes: Record<string, number> = {};
    likes.forEach((like) => {
      const day = new Date(like.createdAt).toISOString().split('T')[0];
      dailyLikes[day] = (dailyLikes[day] || 0) + 1;
    });

    return {
      totalLikes,
      uniqueRatingsLiked,
      uniqueUsersLiking,
      engagementRate: Math.round(engagementRate * 100) / 100,
      dailyTrend: dailyLikes,
      timeRange: {
        startDate,
        endDate,
      },
    };
  },
});
