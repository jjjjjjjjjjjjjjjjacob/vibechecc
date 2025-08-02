import { mutation, query, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser, getCurrentUserOrThrow } from './users';
import type { Doc } from './_generated/dataModel';

// Follow a user
export const follow = mutation({
  args: {
    followingId: v.string(), // External ID of user to follow
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const currentUser = await getCurrentUserOrThrow(ctx);
    const followerId = currentUser.externalId;

    // Prevent self-follows
    if (followerId === args.followingId) {
      throw new Error('You cannot follow yourself');
    }

    // Check if user being followed exists
    const userToFollow = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', args.followingId))
      .first();

    if (!userToFollow) {
      throw new Error('User to follow not found');
    }

    // Check if follow relationship already exists
    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('byFollowerAndFollowing', (q) =>
        q.eq('followerId', followerId).eq('followingId', args.followingId)
      )
      .first();

    if (existingFollow) {
      throw new Error('You are already following this user');
    }

    // Create follow relationship
    const followId = await ctx.db.insert('follows', {
      followerId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    return { success: true, followId };
  },
});

// Unfollow a user
export const unfollow = mutation({
  args: {
    followingId: v.string(), // External ID of user to unfollow
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const currentUser = await getCurrentUserOrThrow(ctx);
    const followerId = currentUser.externalId;

    // Find existing follow relationship
    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('byFollowerAndFollowing', (q) =>
        q.eq('followerId', followerId).eq('followingId', args.followingId)
      )
      .first();

    if (!existingFollow) {
      throw new Error('You are not following this user');
    }

    // Remove follow relationship
    await ctx.db.delete(existingFollow._id);

    return { success: true };
  },
});

// Get list of users who follow a specific user (followers)
export const getUserFollowers = query({
  args: {
    userId: v.string(), // External ID of user whose followers to get
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get follow relationships where this user is being followed
    const followsQuery = ctx.db
      .query('follows')
      .withIndex('byFollowing', (q) => q.eq('followingId', args.userId))
      .order('desc');

    const follows = await followsQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit,
    });

    // Get follower user details
    const followersWithDetails = await Promise.all(
      follows.page.map(async (follow) => {
        const follower = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', follow.followerId)
          )
          .first();

        return {
          user: follower,
          followedAt: follow.createdAt,
        };
      })
    );

    // Get total follower count
    const totalFollowers = await ctx.db
      .query('follows')
      .withIndex('byFollowing', (q) => q.eq('followingId', args.userId))
      .collect()
      .then((results) => results.length);

    return {
      followers: followersWithDetails.filter((f) => f.user !== null),
      totalCount: totalFollowers,
      continueCursor: follows.continueCursor,
      isDone: follows.isDone,
    };
  },
});

// Get list of users that a specific user follows (following)
export const getUserFollowing = query({
  args: {
    userId: v.string(), // External ID of user whose following list to get
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get follow relationships where this user is following others
    const followsQuery = ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', args.userId))
      .order('desc');

    const follows = await followsQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit,
    });

    // Get following user details
    const followingWithDetails = await Promise.all(
      follows.page.map(async (follow) => {
        const followingUser = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', follow.followingId)
          )
          .first();

        return {
          user: followingUser,
          followedAt: follow.createdAt,
        };
      })
    );

    // Get total following count
    const totalFollowing = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', args.userId))
      .collect()
      .then((results) => results.length);

    return {
      following: followingWithDetails.filter((f) => f.user !== null),
      totalCount: totalFollowing,
      continueCursor: follows.continueCursor,
      isDone: follows.isDone,
    };
  },
});

// Check if user A follows user B
export const isFollowing = query({
  args: {
    followerId: v.string(), // External ID of potential follower
    followingId: v.string(), // External ID of potential followed user
  },
  handler: async (ctx, args) => {
    // Use the compound index for efficient lookup
    const follow = await ctx.db
      .query('follows')
      .withIndex('byFollowerAndFollowing', (q) =>
        q.eq('followerId', args.followerId).eq('followingId', args.followingId)
      )
      .first();

    return follow !== null;
  },
});

// Check if current user follows a specific user
export const isCurrentUserFollowing = query({
  args: {
    followingId: v.string(), // External ID of user to check
  },
  handler: async (ctx, args) => {
    // Get current user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return false;
    }

    // Use the compound index for efficient lookup
    const follow = await ctx.db
      .query('follows')
      .withIndex('byFollowerAndFollowing', (q) =>
        q
          .eq('followerId', currentUser.externalId)
          .eq('followingId', args.followingId)
      )
      .first();

    return follow !== null;
  },
});

// Get follow stats for a user (follower and following counts)
export const getFollowStats = query({
  args: {
    userId: v.string(), // External ID of user
  },
  handler: async (ctx, args) => {
    // Get follower count (users following this user)
    const followerCount = await ctx.db
      .query('follows')
      .withIndex('byFollowing', (q) => q.eq('followingId', args.userId))
      .collect()
      .then((results) => results.length);

    // Get following count (users this user follows)
    const followingCount = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', args.userId))
      .collect()
      .then((results) => results.length);

    return {
      followers: followerCount,
      following: followingCount,
    };
  },
});

// Get current user's follow stats
export const getCurrentUserFollowStats = query({
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return {
        followers: 0,
        following: 0,
      };
    }

    // Get follower count (users following current user)
    const followerCount = await ctx.db
      .query('follows')
      .withIndex('byFollowing', (q) =>
        q.eq('followingId', currentUser.externalId)
      )
      .collect()
      .then((results) => results.length);

    // Get following count (users current user follows)
    const followingCount = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) =>
        q.eq('followerId', currentUser.externalId)
      )
      .collect()
      .then((results) => results.length);

    return {
      followers: followerCount,
      following: followingCount,
    };
  },
});

// Get mutual follows between two users
export const getMutualFollows = query({
  args: {
    userId1: v.string(),
    userId2: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get users that userId1 follows
    const user1Following = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', args.userId1))
      .collect();

    // Get users that userId2 follows
    const user2Following = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', args.userId2))
      .collect();

    // Find mutual follows (users both follow)
    const user1FollowingIds = new Set(user1Following.map((f) => f.followingId));
    const mutualFollowIds = user2Following
      .filter((f) => user1FollowingIds.has(f.followingId))
      .map((f) => f.followingId)
      .slice(0, limit);

    // Get user details for mutual follows
    const mutualFollows = await Promise.all(
      mutualFollowIds.map(async (userId) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', userId))
          .first();
        return user;
      })
    );

    return {
      mutualFollows: mutualFollows.filter((user) => user !== null),
      totalCount: mutualFollowIds.length,
    };
  },
});

// Helper function to get popular users based on their content engagement
async function getPopularUserSuggestions(
  ctx: QueryCtx,
  currentUserId: string,
  limit: number
) {
  // Get users current user already follows to exclude them
  const currentUserFollowing = await ctx.db
    .query('follows')
    .withIndex('byFollower', (q) => q.eq('followerId', currentUserId))
    .collect();
  const followingIds = new Set(currentUserFollowing.map((f) => f.followingId));
  // Get recent vibes to find active creators
  const recentVibes = await ctx.db
    .query('vibes')
    .withIndex('byCreatedAt')
    .order('desc')
    .take(200);

  // Group by creator and calculate engagement metrics
  const userEngagement = new Map<
    string,
    {
      totalRatings: number;
      averageRating: number;
      totalValue: number;
      vibeCount: number;
    }
  >();

  for (const vibe of recentVibes) {
    if (
      vibe.createdById === currentUserId ||
      followingIds.has(vibe.createdById)
    )
      continue; // Skip own content and already followed users

    // Get all ratings for this vibe
    const vibeRatings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
      .collect();

    if (vibeRatings.length === 0) continue; // Skip vibes with no ratings

    const creatorId = vibe.createdById;
    const current = userEngagement.get(creatorId) || {
      totalRatings: 0,
      averageRating: 0,
      totalValue: 0,
      vibeCount: 0,
    };

    const vibeRatingSum = vibeRatings.reduce(
      (sum: number, r: Doc<'ratings'>) => sum + r.value,
      0
    );
    const _vibeAverage = vibeRatingSum / vibeRatings.length;

    current.totalRatings += vibeRatings.length;
    current.totalValue += vibeRatingSum;
    current.vibeCount += 1;
    current.averageRating = current.totalValue / current.totalRatings;

    userEngagement.set(creatorId, current);
  }

  // Sort by engagement score (combination of total ratings, average rating, and vibe count)
  const sortedUsers = Array.from(userEngagement.entries())
    .map(([userId, stats]) => ({
      userId,
      engagementScore:
        stats.totalRatings * (stats.averageRating / 5) + stats.vibeCount * 0.5, // Weight by rating quality and content creation
      totalRatings: stats.totalRatings,
      averageRating: stats.averageRating,
      vibeCount: stats.vibeCount,
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);

  // Get user details for suggestions
  const suggestions = await Promise.all(
    sortedUsers.map(
      async ({ userId, totalRatings, averageRating, vibeCount }) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', userId))
          .first();

        return {
          user,
          mutualConnections: 0, // No mutual connections for popular suggestions
          engagementStats: {
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            vibeCount,
          },
        };
      }
    )
  );

  return {
    suggestions: suggestions.filter((s) => s.user !== null),
  };
}

// Get suggested users to follow (users followed by people you follow)
export const getSuggestedFollows = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get current user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return { suggestions: [] };
    }

    // Get users that current user follows
    const currentUserFollowing = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) =>
        q.eq('followerId', currentUser.externalId)
      )
      .collect();

    if (currentUserFollowing.length === 0) {
      // If user doesn't follow anyone, suggest popular content creators
      return await getPopularUserSuggestions(
        ctx,
        currentUser.externalId,
        limit
      );
    }

    // Get users followed by people the current user follows
    const suggestionCounts = new Map<string, number>();

    for (const follow of currentUserFollowing) {
      const theirFollowing = await ctx.db
        .query('follows')
        .withIndex('byFollower', (q) => q.eq('followerId', follow.followingId))
        .collect();

      for (const theirFollow of theirFollowing) {
        // Don't suggest self or users already followed
        if (
          theirFollow.followingId !== currentUser.externalId &&
          !currentUserFollowing.some(
            (f) => f.followingId === theirFollow.followingId
          )
        ) {
          suggestionCounts.set(
            theirFollow.followingId,
            (suggestionCounts.get(theirFollow.followingId) || 0) + 1
          );
        }
      }
    }

    // Sort by popularity and get top suggestions
    const sortedSuggestions = Array.from(suggestionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    // Get user details for suggestions
    const suggestions = await Promise.all(
      sortedSuggestions.map(async ([userId, mutualConnections]) => {
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', userId))
          .first();

        return {
          user,
          mutualConnections,
        };
      })
    );

    const filteredSuggestions = suggestions.filter((s) => s.user !== null);

    // If we don't have enough mutual connection suggestions, fill with popular users
    if (filteredSuggestions.length < limit) {
      const remainingLimit = limit - filteredSuggestions.length;
      const popularSuggestions = await getPopularUserSuggestions(
        ctx,
        currentUser.externalId,
        remainingLimit * 2
      );

      // Filter out users already in mutual suggestions
      const mutualUserIds = new Set(
        filteredSuggestions.map((s) => s.user?.externalId)
      );
      const additionalSuggestions = popularSuggestions.suggestions
        .filter((s) => s.user && !mutualUserIds.has(s.user.externalId))
        .slice(0, remainingLimit);

      return {
        suggestions: [...filteredSuggestions, ...additionalSuggestions],
      };
    }

    return {
      suggestions: filteredSuggestions,
    };
  },
});
