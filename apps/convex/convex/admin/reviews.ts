import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from '../lib/securityValidators';

export const getAllReviews = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    ratingFrom: v.optional(v.number()),
    ratingTo: v.optional(v.number()),
    emoji: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(v.string()), // Add status field for filtering
    sortBy: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const {
      page,
      pageSize,
      ratingFrom,
      ratingTo,
      emoji,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortDirection = 'desc',
    } = args;

    let reviews = await ctx.db.query('ratings').collect();

    if (emoji) {
      reviews = reviews.filter((review) => review.emoji === emoji);
    }

    if (ratingFrom !== undefined || ratingTo !== undefined) {
      reviews = reviews.filter((review) => {
        if (ratingFrom !== undefined && review.value < ratingFrom) return false;
        if (ratingTo !== undefined && review.value > ratingTo) return false;
        return true;
      });
    }

    if (dateFrom || dateTo) {
      reviews = reviews.filter((review) => {
        const reviewDate = new Date(review.createdAt).getTime();
        if (dateFrom && reviewDate < dateFrom) return false;
        if (dateTo && reviewDate > dateTo) return false;
        return true;
      });
    }

    if (search) {
      reviews = reviews.filter((review) =>
        review.review.toLowerCase().includes(search.toLowerCase())
      );
    }

    const sortedReviews = reviews.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'value':
          aVal = a.value;
          bVal = b.value;
          break;
        case 'emoji':
          aVal = a.emoji;
          bVal = b.emoji;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    const totalCount = sortedReviews.length;
    const pageCount = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = sortedReviews.slice(startIndex, startIndex + pageSize);

    const reviewsWithDetails = await Promise.all(
      data.map(async (review) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', review.userId))
          .first();

        const vibe = await ctx.db
          .query('vibes')
          .withIndex('id', (q) => q.eq('id', review.vibeId))
          .first();

        return {
          ...review,
          user: user
            ? {
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                image_url: user.image_url,
              }
            : null,
          vibe: vibe
            ? {
                title: vibe.title,
                description: vibe.description.substring(0, 100) + '...',
              }
            : null,
        };
      })
    );

    return {
      data: reviewsWithDetails,
      totalCount,
      pageCount,
    };
  },
});

export const getReviewStats = query({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    const allReviews = await ctx.db.query('ratings').collect();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalReviews = allReviews.length;
    const flaggedReviews = allReviews.filter(
      (review) => review.flagged === true
    ).length;

    const newReviewsToday = allReviews.filter(
      (review) => new Date(review.createdAt).getTime() > oneDayAgo
    ).length;
    const newReviewsThisWeek = allReviews.filter(
      (review) => new Date(review.createdAt).getTime() > oneWeekAgo
    ).length;
    const newReviewsThisMonth = allReviews.filter(
      (review) => new Date(review.createdAt).getTime() > oneMonthAgo
    ).length;

    const ratingDistribution = {
      1: allReviews.filter((r) => r.value === 1).length,
      2: allReviews.filter((r) => r.value === 2).length,
      3: allReviews.filter((r) => r.value === 3).length,
      4: allReviews.filter((r) => r.value === 4).length,
      5: allReviews.filter((r) => r.value === 5).length,
    };

    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, review) => sum + review.value, 0) /
          totalReviews
        : 0;

    const emojiCounts = allReviews.reduce(
      (acc, review) => {
        acc[review.emoji] = (acc[review.emoji] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topEmojis = Object.entries(emojiCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }));

    return {
      totalReviews,
      flaggedReviews,
      newReviewsToday,
      newReviewsThisWeek,
      newReviewsThisMonth,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      topEmojis,
    };
  },
});

export const moderateReview = mutation({
  args: {
    reviewId: v.id('ratings'),
    flagged: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { reviewId, flagged, reason } = args;

    const review = await ctx.db.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    await ctx.db.patch(reviewId, {
      flagged,
      moderationReason: reason,
      moderatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const deleteReview = mutation({
  args: {
    reviewId: v.id('ratings'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { reviewId } = args;

    const review = await ctx.db.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    await ctx.db.delete(reviewId);

    return { success: true };
  },
});
