/**
 * Community Stats and Social Features
 *
 * Backend functions for community engagement metrics, leaderboards,
 * and social media platform integration.
 */

import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get community overview statistics
 */
export const getCommunityStats = query({
  args: {},
  handler: async (ctx) => {
    // Get total user count
    const allUsers = await ctx.db.query('users').collect();
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(
      (user) =>
        user.last_active_at &&
        Date.now() - user.last_active_at < 30 * 24 * 60 * 60 * 1000 // Active in last 30 days
    ).length;

    // Get total vibes
    const allVibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .collect();
    const totalVibes = allVibes.length;

    // Get total ratings
    const allRatings = await ctx.db.query('ratings').collect();
    const totalRatings = allRatings.length;

    // Get total rating likes
    const allRatingLikes = await ctx.db.query('ratingLikes').collect();
    const totalRatingLikes = allRatingLikes.length;

    // Get social connections stats
    const allSocialConnections = await ctx.db
      .query('socialConnections')
      .collect();
    const connectedSocialAccounts = allSocialConnections.filter(
      (conn) => conn.connectionStatus === 'connected'
    ).length;

    // Calculate activity for last 24 hours
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentVibes = allVibes.filter(
      (vibe) => new Date(vibe.createdAt).getTime() > last24Hours
    ).length;
    const recentRatings = allRatings.filter(
      (rating) => new Date(rating.createdAt).getTime() > last24Hours
    ).length;
    const recentRatingLikes = allRatingLikes.filter(
      (like) => like.createdAt > last24Hours
    ).length;

    // Get platform breakdown
    const platformBreakdown = allSocialConnections.reduce(
      (acc, conn) => {
        if (conn.connectionStatus === 'connected') {
          acc[conn.platform] = (acc[conn.platform] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totals: {
        users: totalUsers,
        activeUsers,
        vibes: totalVibes,
        ratings: totalRatings,
        ratingLikes: totalRatingLikes,
        socialConnections: connectedSocialAccounts,
      },
      recent24h: {
        vibes: recentVibes,
        ratings: recentRatings,
        ratingLikes: recentRatingLikes,
      },
      engagement: {
        averageRatingsPerVibe:
          totalVibes > 0
            ? Math.round((totalRatings / totalVibes) * 10) / 10
            : 0,
        averageLikesPerRating:
          totalRatings > 0
            ? Math.round((totalRatingLikes / totalRatings) * 10) / 10
            : 0,
        socialConnectionRate:
          totalUsers > 0
            ? Math.round((connectedSocialAccounts / totalUsers) * 100)
            : 0,
      },
      platforms: platformBreakdown,
    };
  },
});

/**
 * Get top contributors (leaderboard data)
 */
export const getTopContributors = query({
  args: {
    limit: v.optional(v.number()),
    timeframe: v.optional(
      v.union(v.literal('all'), v.literal('week'), v.literal('month'))
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const timeframe = args.timeframe || 'month';

    // Calculate date cutoff
    let cutoffDate = 0;
    if (timeframe === 'week') {
      cutoffDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'month') {
      cutoffDate = Date.now() - 30 * 24 * 60 * 60 * 1000;
    }

    // Get user points (already sorted by total points)
    const userPointsData = await ctx.db
      .query('userPoints')
      .withIndex('byTotalPoints')
      .order('desc')
      .take(limit);

    // Get user data for each contributor
    const contributors = await Promise.all(
      userPointsData.map(async (userPoints) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', userPoints.userId)
          )
          .first();

        if (!user) return null;

        // Count activities in timeframe if not 'all'
        let periodStats = {
          vibes: 0,
          ratings: 0,
          ratingLikes: 0,
        };

        if (timeframe !== 'all') {
          // Count vibes created in timeframe
          const userVibes = await ctx.db
            .query('vibes')
            .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
            .filter((q) =>
              q.gte(q.field('createdAt'), new Date(cutoffDate).toISOString())
            )
            .collect();

          // Count ratings created in timeframe
          const userRatings = await ctx.db
            .query('ratings')
            .withIndex('user', (q) => q.eq('userId', user.externalId))
            .filter((q) =>
              q.gte(q.field('createdAt'), new Date(cutoffDate).toISOString())
            )
            .collect();

          // Count rating likes given in timeframe
          const userRatingLikes = await ctx.db
            .query('ratingLikes')
            .withIndex('byUser', (q) => q.eq('userId', user.externalId))
            .filter((q) => q.gte(q.field('createdAt'), cutoffDate))
            .collect();

          periodStats = {
            vibes: userVibes.length,
            ratings: userRatings.length,
            ratingLikes: userRatingLikes.length,
          };
        }

        return {
          user: {
            externalId: user.externalId,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            image_url: user.image_url,
          },
          points: {
            total: userPoints.totalPointsEarned,
            current: userPoints.currentBalance,
            level: userPoints.level,
            streak: userPoints.streakDays,
          },
          periodStats,
        };
      })
    );

    return contributors.filter(
      (contributor): contributor is NonNullable<typeof contributor> =>
        contributor !== null
    );
  },
});

/**
 * Get recent community activity feed
 */
export const getCommunityActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get recent vibes
    const recentVibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .order('desc')
      .take(Math.ceil(limit * 0.4));

    // Get recent ratings
    const recentRatings = await ctx.db
      .query('ratings')
      .withIndex('byCreatedAt')
      .order('desc')
      .take(Math.ceil(limit * 0.4));

    // Get recent rating likes
    const recentRatingLikes = await ctx.db
      .query('ratingLikes')
      .withIndex('byCreatedAt')
      .order('desc')
      .take(Math.ceil(limit * 0.2));

    // Create activity items
    const activities = [];

    // Add vibe activities
    for (const vibe of recentVibes) {
      const author = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', vibe.createdById))
        .first();

      if (author) {
        activities.push({
          type: 'vibe_created' as const,
          timestamp: new Date(vibe.createdAt).getTime(),
          user: {
            username: author.username,
            first_name: author.first_name,
            last_name: author.last_name,
            image_url: author.image_url,
          },
          data: {
            vibe: {
              id: vibe.id,
              title: vibe.title,
              description: vibe.description.substring(0, 100),
            },
          },
        });
      }
    }

    // Add rating activities
    for (const rating of recentRatings) {
      const author = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', rating.userId))
        .first();

      const vibe = await ctx.db
        .query('vibes')
        .withIndex('id', (q) => q.eq('id', rating.vibeId))
        .first();

      if (author && vibe) {
        activities.push({
          type: 'rating_created' as const,
          timestamp: new Date(rating.createdAt).getTime(),
          user: {
            username: author.username,
            first_name: author.first_name,
            last_name: author.last_name,
            image_url: author.image_url,
          },
          data: {
            rating: {
              emoji: rating.emoji,
              value: rating.value,
              review: rating.review.substring(0, 100),
            },
            vibe: {
              id: vibe.id,
              title: vibe.title,
            },
          },
        });
      }
    }

    // Add rating like activities (less frequent)
    for (const like of recentRatingLikes.slice(0, Math.ceil(limit * 0.1))) {
      const liker = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', like.userId))
        .first();

      const rating = await ctx.db
        .query('ratings')
        .filter((q) => q.eq(q.field('_id'), like.ratingId))
        .first();

      if (liker && rating) {
        const ratingAuthor = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', rating.userId))
          .first();

        activities.push({
          type: 'rating_liked' as const,
          timestamp: like.createdAt,
          user: {
            username: liker.username,
            first_name: liker.first_name,
            last_name: liker.last_name,
            image_url: liker.image_url,
          },
          data: {
            rating: {
              emoji: rating.emoji,
              review: rating.review.substring(0, 50),
            },
            ratingAuthor: ratingAuthor
              ? {
                  username: ratingAuthor.username,
                  first_name: ratingAuthor.first_name,
                }
              : null,
          },
        });
      }
    }

    // Sort by timestamp and take limit
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return sortedActivities;
  },
});

/**
 * Get social media platform statistics
 */
export const getSocialPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const socialConnections = await ctx.db.query('socialConnections').collect();

    // Group by platform
    const platformStats = socialConnections.reduce(
      (acc, connection) => {
        const platform = connection.platform;

        if (!acc[platform]) {
          acc[platform] = {
            total: 0,
            connected: 0,
            disconnected: 0,
            error: 0,
            lastSync: 0,
          };
        }

        acc[platform].total += 1;

        switch (connection.connectionStatus) {
          case 'connected':
            acc[platform].connected += 1;
            break;
          case 'disconnected':
            acc[platform].disconnected += 1;
            break;
          case 'error':
          case 'expired':
            acc[platform].error += 1;
            break;
        }

        if (
          connection.lastSyncAt &&
          connection.lastSyncAt > acc[platform].lastSync
        ) {
          acc[platform].lastSync = connection.lastSyncAt;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          total: number;
          connected: number;
          disconnected: number;
          error: number;
          lastSync: number;
        }
      >
    );

    // Get share events by platform for engagement metrics
    const shareEvents = await ctx.db.query('shareEvents').collect();
    const sharesByPlatform = shareEvents.reduce(
      (acc, event) => {
        acc[event.platform] = (acc[event.platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      connections: platformStats,
      shares: sharesByPlatform,
      totalConnectedAccounts: Object.values(platformStats).reduce(
        (sum, stats) => sum + stats.connected,
        0
      ),
      totalShares: Object.values(sharesByPlatform).reduce(
        (sum, count) => sum + count,
        0
      ),
    };
  },
});

/**
 * Get trending community content
 */
export const getTrendingCommunityContent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get vibes with high engagement
    const allVibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .collect();

    // Calculate engagement score for each vibe
    const vibeEngagement = await Promise.all(
      allVibes.map(async (vibe) => {
        // Get ratings count
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        // Get rating likes count
        const ratingLikes = await Promise.all(
          ratings.map((rating) =>
            ctx.db
              .query('ratingLikes')
              .withIndex('byRating', (q) => q.eq('ratingId', rating._id || ''))
              .collect()
          )
        );

        const totalLikes = ratingLikes.flat().length;

        // Get share count
        const shareCount = vibe.shareCount || 0;

        // Calculate engagement score (weighted)
        const engagementScore =
          ratings.length * 1 + // 1 point per rating
          totalLikes * 0.5 + // 0.5 points per rating like
          shareCount * 2; // 2 points per share

        return {
          vibe,
          ratings,
          engagementScore,
          ratingsCount: ratings.length,
          likesCount: totalLikes,
          shareCount,
        };
      })
    );

    // Sort by engagement score and take top items
    const trending = vibeEngagement
      .filter((item) => item.engagementScore > 0) // Only include vibes with some engagement
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    // Get author data for each trending vibe
    const trendingWithAuthors = await Promise.all(
      trending.map(async (item) => {
        const author = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', item.vibe.createdById)
          )
          .first();

        return {
          ...item,
          author: author
            ? {
                username: author.username,
                first_name: author.first_name,
                last_name: author.last_name,
                image_url: author.image_url,
              }
            : null,
        };
      })
    );

    return trendingWithAuthors;
  },
});
