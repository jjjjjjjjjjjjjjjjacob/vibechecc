/**
 * Achievements and Trophy System
 *
 * Backend functions for managing user achievements, trophies, and gamification
 * features to drive community engagement.
 */

import { query, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from './users';
import { ACHIEVEMENT_DEFINITIONS } from '@vibechecc/types';

// Achievement calculation functions

/**
 * Get user achievements progress
 */
export const getUserAchievements = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const targetUserId = args.userId || currentUser?.externalId;

    if (!targetUserId) {
      return [];
    }

    // Get user's ratings
    const userRatings = await ctx.db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', targetUserId))
      .collect();

    // Get user's vibes
    const userVibes = await ctx.db
      .query('vibes')
      .withIndex('createdBy', (q) => q.eq('createdById', targetUserId))
      .filter((q) => q.eq(q.field('visibility'), 'public'))
      .collect();

    // Get user's follows
    const userFollows = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', targetUserId))
      .collect();

    // Get user points for streak info
    const userPoints = await ctx.db
      .query('userPoints')
      .withIndex('byUserId', (q) => q.eq('userId', targetUserId))
      .first();

    // Calculate achievement progress
    const achievements = [];

    // Rating Master - high-quality ratings
    const highQualityRatings = userRatings.filter((r) => r.value >= 4).length;
    const ratingMasterProgress = calculateAchievementProgress(
      'RATING_MASTER',
      highQualityRatings,
      ACHIEVEMENT_DEFINITIONS.RATING_MASTER
    );
    achievements.push(ratingMasterProgress);

    // Community Builder - helpful ratings (based on rating likes received)
    const ratingLikes = await Promise.all(
      userRatings.map((rating) =>
        ctx.db
          .query('ratingLikes')
          .withIndex('byRating', (q) => q.eq('ratingId', rating._id || ''))
          .collect()
      )
    );
    const totalRatingLikes = ratingLikes.flat().length;
    const communityBuilderProgress = calculateAchievementProgress(
      'COMMUNITY_BUILDER',
      totalRatingLikes,
      ACHIEVEMENT_DEFINITIONS.COMMUNITY_BUILDER
    );
    achievements.push(communityBuilderProgress);

    // Trendsetter - vibes with engagement
    const engagedVibes = userVibes.filter((vibe) => {
      const ratings = userRatings.filter((r) => r.vibeId === vibe.id);
      return ratings.length >= 5; // At least 5 ratings = engaged
    }).length;
    const trendsetterProgress = calculateAchievementProgress(
      'TRENDSETTER',
      engagedVibes,
      ACHIEVEMENT_DEFINITIONS.TRENDSETTER
    );
    achievements.push(trendsetterProgress);

    // Consistent Contributor - activity streaks
    const currentStreak = userPoints?.streakDays || 0;
    const consistentContributorProgress = calculateAchievementProgress(
      'CONSISTENT_CONTRIBUTOR',
      currentStreak,
      ACHIEVEMENT_DEFINITIONS.CONSISTENT_CONTRIBUTOR
    );
    achievements.push(consistentContributorProgress);

    // Social Connector - follows given
    const socialConnectorProgress = calculateAchievementProgress(
      'SOCIAL_CONNECTOR',
      userFollows.length,
      ACHIEVEMENT_DEFINITIONS.SOCIAL_CONNECTOR
    );
    achievements.push(socialConnectorProgress);

    return achievements;
  },
});

/**
 * Get leaderboard data with different categories
 */
export const getLeaderboard = query({
  args: {
    category: v.optional(
      v.union(
        v.literal('points'),
        v.literal('level'),
        v.literal('streak'),
        v.literal('vibes'),
        v.literal('ratings'),
        v.literal('achievements')
      )
    ),
    timeframe: v.optional(
      v.union(v.literal('all'), v.literal('week'), v.literal('month'))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const category = args.category || 'points';
    const timeframe = args.timeframe || 'month';
    const limit = args.limit || 50;

    let leaderboard = [];

    switch (category) {
      case 'points':
        leaderboard = await getPointsLeaderboard(ctx, timeframe, limit);
        break;
      case 'level':
        leaderboard = await getLevelLeaderboard(ctx, limit);
        break;
      case 'streak':
        leaderboard = await getStreakLeaderboard(ctx, limit);
        break;
      case 'vibes':
        leaderboard = await getVibesLeaderboard(ctx, timeframe, limit);
        break;
      case 'ratings':
        leaderboard = await getRatingsLeaderboard(ctx, timeframe, limit);
        break;
      case 'achievements':
        leaderboard = await getAchievementsLeaderboard(ctx, limit);
        break;
    }

    return leaderboard;
  },
});

/**
 * Get achievement statistics
 */
export const getAchievementStats = query({
  args: {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (ctx) => {
    const achievements = Object.values(ACHIEVEMENT_DEFINITIONS);

    const stats = {
      totalAchievements: achievements.length,
      totalTiers: achievements.reduce((sum, ach) => sum + ach.tiers.length, 0),
      userProgress: {} as Record<string, number>,
    };

    // Calculate how many users have unlocked each achievement tier
    for (const achievement of achievements) {
      for (const tier of achievement.tiers) {
        const key = `${achievement.id}_${tier.name}`;
        // This would require calculating each user's progress
        // For now, return structure without heavy computation
        stats.userProgress[key] = 0;
      }
    }

    return stats;
  },
});

// Helper functions

function calculateAchievementProgress(
  achievementId: string,
  currentValue: number,
  definition: (typeof ACHIEVEMENT_DEFINITIONS)[keyof typeof ACHIEVEMENT_DEFINITIONS]
) {
  const tiers = [...definition.tiers].sort((a, b) => a.threshold - b.threshold);

  let unlockedTier: (typeof tiers)[0] | null = null;
  let nextTier: (typeof tiers)[0] | null = tiers[0];
  let progress = 0;

  for (const tier of tiers) {
    if (currentValue >= tier.threshold) {
      unlockedTier = tier;
      const nextTierIndex = tiers.indexOf(tier) + 1;
      nextTier = nextTierIndex < tiers.length ? tiers[nextTierIndex] : null;
    } else {
      break;
    }
  }

  if (nextTier) {
    progress = Math.min((currentValue / nextTier.threshold) * 100, 100);
  } else if (unlockedTier) {
    progress = 100; // Max tier unlocked
  }

  return {
    id: achievementId,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    color: definition.color,
    currentValue,
    unlockedTier,
    nextTier,
    progress: Math.round(progress),
    isCompleted: progress === 100 && !nextTier,
  };
}

async function getPointsLeaderboard(
  ctx: QueryCtx,
  timeframe: string,
  limit: number
) {
  const userPointsData = await ctx.db
    .query('userPoints')
    .withIndex('byTotalPoints')
    .order('desc')
    .take(limit);

  return Promise.all(
    userPointsData.map(async (userPoints, index: number) => {
      const user = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', userPoints.userId))
        .first();

      return {
        rank: index + 1,
        user: user
          ? {
              externalId: user.externalId,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              image_url: user.image_url,
            }
          : null,
        value: userPoints.totalPointsEarned,
        label: 'total points',
        metadata: {
          level: userPoints.level,
          currentBalance: userPoints.currentBalance,
          streak: userPoints.streakDays,
        },
      };
    })
  );
}

async function getLevelLeaderboard(ctx: QueryCtx, limit: number) {
  const userPointsData = await ctx.db
    .query('userPoints')
    .withIndex('byLevel')
    .order('desc')
    .take(limit);

  return Promise.all(
    userPointsData.map(async (userPoints, index: number) => {
      const user = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', userPoints.userId))
        .first();

      return {
        rank: index + 1,
        user: user
          ? {
              externalId: user.externalId,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              image_url: user.image_url,
            }
          : null,
        value: userPoints.level,
        label: 'level',
        metadata: {
          totalPoints: userPoints.totalPointsEarned,
          currentBalance: userPoints.currentBalance,
          streak: userPoints.streakDays,
        },
      };
    })
  );
}

async function getStreakLeaderboard(ctx: QueryCtx, limit: number) {
  const userPointsData = await ctx.db
    .query('userPoints')
    .withIndex('byStreak')
    .order('desc')
    .take(limit);

  return Promise.all(
    userPointsData.map(async (userPoints, index: number) => {
      const user = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', userPoints.userId))
        .first();

      return {
        rank: index + 1,
        user: user
          ? {
              externalId: user.externalId,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              image_url: user.image_url,
            }
          : null,
        value: userPoints.streakDays,
        label: 'day streak',
        metadata: {
          level: userPoints.level,
          totalPoints: userPoints.totalPointsEarned,
          lastActivity: userPoints.lastActivityDate,
        },
      };
    })
  );
}

async function getVibesLeaderboard(
  ctx: QueryCtx,
  timeframe: string,
  limit: number
) {
  const allVibes = await ctx.db
    .query('vibes')
    .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
    .collect();

  // Group by creator
  const vibesByCreator = allVibes.reduce(
    (acc: Record<string, number>, vibe) => {
      acc[vibe.createdById] = (acc[vibe.createdById] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Sort and take top creators
  const sortedCreators = Object.entries(vibesByCreator)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit);

  return Promise.all(
    sortedCreators.map(async ([userId, vibeCount], index) => {
      const user = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', userId))
        .first();

      const userPoints = await ctx.db
        .query('userPoints')
        .withIndex('byUserId', (q) => q.eq('userId', userId))
        .first();

      return {
        rank: index + 1,
        user: user
          ? {
              externalId: user.externalId,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              image_url: user.image_url,
            }
          : null,
        value: vibeCount,
        label: 'vibes created',
        metadata: {
          level: userPoints?.level || 1,
          totalPoints: userPoints?.totalPointsEarned || 0,
          streak: userPoints?.streakDays || 0,
        },
      };
    })
  );
}

async function getRatingsLeaderboard(
  ctx: QueryCtx,
  timeframe: string,
  limit: number
) {
  const allRatings = await ctx.db.query('ratings').collect();

  // Group by user
  const ratingsByUser = allRatings.reduce(
    (acc: Record<string, number>, rating) => {
      acc[rating.userId] = (acc[rating.userId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Sort and take top raters
  const sortedRaters = Object.entries(ratingsByUser)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit);

  return Promise.all(
    sortedRaters.map(async ([userId, ratingCount], index) => {
      const user = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', userId))
        .first();

      const userPoints = await ctx.db
        .query('userPoints')
        .withIndex('byUserId', (q) => q.eq('userId', userId))
        .first();

      return {
        rank: index + 1,
        user: user
          ? {
              externalId: user.externalId,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              image_url: user.image_url,
            }
          : null,
        value: ratingCount,
        label: 'ratings given',
        metadata: {
          level: userPoints?.level || 1,
          totalPoints: userPoints?.totalPointsEarned || 0,
          streak: userPoints?.streakDays || 0,
        },
      };
    })
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAchievementsLeaderboard(ctx: QueryCtx, limit: number) {
  // This would require calculating achievement progress for all users
  // For now, return empty array or basic structure
  return [];
}
