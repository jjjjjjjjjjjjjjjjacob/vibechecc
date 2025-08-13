import { query, QueryCtx } from '../_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from '../lib/securityValidators';

export const getDashboardStats = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    await AuthUtils.requireAdmin(ctx);

    const [users, vibes, ratings, follows, notifications] = await Promise.all([
      ctx.db.query('users').collect(),
      ctx.db.query('vibes').collect(),
      ctx.db.query('ratings').collect(),
      ctx.db.query('follows').collect(),
      ctx.db.query('notifications').collect(),
    ]);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return {
      users: {
        total: users.length,
        active: users.filter((u) => (u.last_active_at || 0) > oneWeekAgo)
          .length,
        new: users.filter((u) => (u.created_at || 0) > oneDayAgo).length,
        suspended: users.filter((u) => u.suspended === true).length,
      },
      vibes: {
        total: vibes.length,
        public: vibes.filter((v) => v.visibility === 'public' || !v.visibility)
          .length,
        deleted: vibes.filter((v) => v.visibility === 'deleted').length,
        new: vibes.filter((v) => new Date(v.createdAt).getTime() > oneDayAgo)
          .length,
      },
      ratings: {
        total: ratings.length,
        new: ratings.filter((r) => new Date(r.createdAt).getTime() > oneDayAgo)
          .length,
        flagged: ratings.filter((r) => r.flagged === true).length,
        averageRating:
          ratings.length > 0
            ? Math.round(
                (ratings.reduce((sum, r) => sum + r.value, 0) /
                  ratings.length) *
                  100
              ) / 100
            : 0,
      },
      engagement: {
        totalFollows: follows.length,
        newFollows: follows.filter((f) => f.createdAt > oneDayAgo).length,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      },
    };
  },
});

export const getUserGrowth = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { days = 30 } = args;
    const users = await ctx.db.query('users').collect();
    const now = Date.now();
    const startDate = now - days * 24 * 60 * 60 * 1000;

    const growthData: { date: string; users: number; cumulative: number }[] =
      [];

    for (let i = 0; i < days; i++) {
      const dayStart = startDate + i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const newUsersThisDay = users.filter((user) => {
        const userCreatedAt = user.created_at || 0;
        return userCreatedAt >= dayStart && userCreatedAt < dayEnd;
      }).length;

      const cumulativeUsers = users.filter((user) => {
        const userCreatedAt = user.created_at || 0;
        return userCreatedAt < dayEnd;
      }).length;

      growthData.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        users: newUsersThisDay,
        cumulative: cumulativeUsers,
      });
    }

    return growthData;
  },
});

export const getEngagementMetrics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { days = 7 } = args;
    const [vibes, ratings, follows] = await Promise.all([
      ctx.db.query('vibes').collect(),
      ctx.db.query('ratings').collect(),
      ctx.db.query('follows').collect(),
    ]);

    const now = Date.now();
    const startDate = now - days * 24 * 60 * 60 * 1000;

    const engagementData: {
      date: string;
      vibes: number;
      ratings: number;
      follows: number;
    }[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = startDate + i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const vibesThisDay = vibes.filter((vibe) => {
        const vibeCreatedAt = new Date(vibe.createdAt).getTime();
        return vibeCreatedAt >= dayStart && vibeCreatedAt < dayEnd;
      }).length;

      const ratingsThisDay = ratings.filter((rating) => {
        const ratingCreatedAt = new Date(rating.createdAt).getTime();
        return ratingCreatedAt >= dayStart && ratingCreatedAt < dayEnd;
      }).length;

      const followsThisDay = follows.filter((follow) => {
        return follow.createdAt >= dayStart && follow.createdAt < dayEnd;
      }).length;

      engagementData.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        vibes: vibesThisDay,
        ratings: ratingsThisDay,
        follows: followsThisDay,
      });
    }

    const totalEngagementActions = ratings.length + follows.length;
    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length) *
              100
          ) / 100
        : 0;

    const uniqueRaters = new Set(ratings.map((r) => r.userId)).size;
    const uniqueFollowers = new Set(follows.map((f) => f.followerId)).size;

    return {
      timeline: engagementData,
      summary: {
        totalEngagementActions,
        averageRating,
        uniqueRaters,
        uniqueFollowers,
      },
    };
  },
});

export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { limit = 50 } = args;

    const [recentVibes, recentRatings, recentFollows, recentUsers] =
      await Promise.all([
        ctx.db.query('vibes').order('desc').take(limit),
        ctx.db
          .query('ratings')
          .withIndex('byCreatedAt')
          .order('desc')
          .take(limit),
        ctx.db.query('follows').order('desc').take(limit),
        ctx.db.query('users').order('desc').take(limit),
      ]);

    const activities: Array<{
      type: 'user_joined' | 'vibe_created' | 'rating_added' | 'user_followed';
      timestamp: number;
      data: {
        userId?: string;
        username?: string;
        displayName?: string;
        vibeId?: string;
        title?: string;
        description?: string;
        createdById?: string;
        emoji?: string;
        value?: number;
        review?: string;
        followerId?: string;
        followingId?: string;
        creatorName?: string;
        raterName?: string;
        vibeTitle?: string;
        followerName?: string;
        followingName?: string;
        ratingId?: string;
      };
    }> = [];

    for (const user of recentUsers) {
      if (user.created_at) {
        activities.push({
          type: 'user_joined',
          timestamp: user.created_at,
          data: {
            userId: user._id,
            username: user.username,
            displayName:
              user.username ||
              `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
              'Anonymous',
          },
        });
      }
    }

    for (const vibe of recentVibes) {
      activities.push({
        type: 'vibe_created',
        timestamp: new Date(vibe.createdAt).getTime(),
        data: {
          vibeId: vibe._id,
          title: vibe.title,
          description: vibe.description.substring(0, 100) + '...',
          createdById: vibe.createdById,
        },
      });
    }

    for (const rating of recentRatings) {
      activities.push({
        type: 'rating_added',
        timestamp: new Date(rating.createdAt).getTime(),
        data: {
          ratingId: rating._id,
          vibeId: rating.vibeId,
          userId: rating.userId,
          emoji: rating.emoji,
          value: rating.value,
          review: rating.review.substring(0, 50) + '...',
        },
      });
    }

    for (const follow of recentFollows) {
      activities.push({
        type: 'user_followed',
        timestamp: follow.createdAt,
        data: {
          followerId: follow.followerId,
          followingId: follow.followingId,
        },
      });
    }

    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    const activitiesWithUserData = await Promise.all(
      sortedActivities.map(async (activity) => {
        const enrichedData = { ...activity.data };

        if (activity.type === 'vibe_created' && activity.data.createdById) {
          const creator = await ctx.db
            .query('users')
            .withIndex('byExternalId', (q) =>
              q.eq('externalId', activity.data.createdById!)
            )
            .first();
          enrichedData.creatorName = creator?.username || 'Unknown';
        }

        if (
          activity.type === 'rating_added' &&
          activity.data.userId &&
          activity.data.vibeId
        ) {
          const [rater, vibe] = await Promise.all([
            ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', activity.data.userId!)
              )
              .first(),
            ctx.db
              .query('vibes')
              .withIndex('id', (q) => q.eq('id', activity.data.vibeId!))
              .first(),
          ]);
          enrichedData.raterName = rater?.username || 'Unknown';
          enrichedData.vibeTitle = vibe?.title || 'Unknown';
        }

        if (
          activity.type === 'user_followed' &&
          activity.data.followerId &&
          activity.data.followingId
        ) {
          const [follower, following] = await Promise.all([
            ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', activity.data.followerId!)
              )
              .first(),
            ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', activity.data.followingId!)
              )
              .first(),
          ]);
          enrichedData.followerName = follower?.username || 'Unknown';
          enrichedData.followingName = following?.username || 'Unknown';
        }

        return {
          ...activity,
          data: enrichedData,
        };
      })
    );

    return activitiesWithUserData;
  },
});
