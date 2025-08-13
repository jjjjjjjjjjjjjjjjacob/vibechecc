import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from '../lib/securityValidators';

export const getAllUsers = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    search: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal('all'), v.literal('active'), v.literal('suspended'))
    ),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const {
      page,
      pageSize,
      search,
      status = 'all',
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortDirection = 'desc',
    } = args;

    let allUsers = await ctx.db.query('users').collect();

    if (search) {
      allUsers = allUsers.filter(
        (user) =>
          (user.username &&
            user.username.toLowerCase().includes(search.toLowerCase())) ||
          (user.first_name &&
            user.first_name.toLowerCase().includes(search.toLowerCase())) ||
          (user.last_name &&
            user.last_name.toLowerCase().includes(search.toLowerCase())) ||
          (user.bio && user.bio.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (status !== 'all') {
      allUsers = allUsers.filter((user) => {
        if (status === 'suspended') {
          return user.suspended === true;
        }
        return user.suspended !== true;
      });
    }

    if (dateFrom || dateTo) {
      allUsers = allUsers.filter((user) => {
        const userCreatedAt = user.created_at || 0;
        if (dateFrom && userCreatedAt < dateFrom) return false;
        if (dateTo && userCreatedAt > dateTo) return false;
        return true;
      });
    }

    const sortedUsers = allUsers.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortBy) {
        case 'username':
          aVal = a.username || '';
          bVal = b.username || '';
          break;
        case 'created_at':
          aVal = a.created_at || 0;
          bVal = b.created_at || 0;
          break;
        case 'last_sign_in_at':
          aVal = a.last_sign_in_at || 0;
          bVal = b.last_sign_in_at || 0;
          break;
        case 'followerCount':
          aVal = a.followerCount || 0;
          bVal = b.followerCount || 0;
          break;
        default:
          aVal = a.created_at || 0;
          bVal = b.created_at || 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    const totalCount = sortedUsers.length;
    const pageCount = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = sortedUsers.slice(startIndex, startIndex + pageSize);

    return {
      data,
      totalCount,
      pageCount,
    };
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    const allUsers = await ctx.db.query('users').collect();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(
      (user) => (user.last_active_at || 0) > oneWeekAgo
    ).length;
    const suspendedUsers = allUsers.filter(
      (user) => user.suspended === true
    ).length;
    const newUsersToday = allUsers.filter(
      (user) => (user.created_at || 0) > oneDayAgo
    ).length;
    const newUsersThisWeek = allUsers.filter(
      (user) => (user.created_at || 0) > oneWeekAgo
    ).length;
    const newUsersThisMonth = allUsers.filter(
      (user) => (user.created_at || 0) > oneMonthAgo
    ).length;

    const onboardedUsers = allUsers.filter(
      (user) => user.onboardingCompleted === true
    ).length;
    const onboardingCompletionRate =
      totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;

    const usersWithBio = allUsers.filter(
      (user) => user.bio && user.bio.trim().length > 0
    ).length;
    const profileCompletionRate =
      totalUsers > 0 ? Math.round((usersWithBio / totalUsers) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      onboardingCompletionRate,
      profileCompletionRate,
    };
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id('users'),
    suspended: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { userId, suspended, reason } = args;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(userId, {
      suspended,
      suspensionReason: reason,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id('users'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { userId, reason } = args;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(userId, {
      deleted: true,
      deletedAt: Date.now(),
      deletionReason: reason,
      username: `deleted_user_${userId}`,
      first_name: undefined,
      last_name: undefined,
      bio: undefined,
      image_url: undefined,
      profile_image_url: undefined,
    });

    const userVibes = await ctx.db
      .query('vibes')
      .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
      .collect();

    for (const vibe of userVibes) {
      await ctx.db.patch(vibe._id, {
        visibility: 'deleted',
        updatedAt: new Date().toISOString(),
      });
    }

    const userRatings = await ctx.db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', user.externalId))
      .collect();

    for (const rating of userRatings) {
      await ctx.db.delete(rating._id);
    }

    const userFollows = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', user.externalId))
      .collect();

    for (const follow of userFollows) {
      await ctx.db.delete(follow._id);
    }

    const followingUser = await ctx.db
      .query('follows')
      .withIndex('byFollowing', (q) => q.eq('followingId', user.externalId))
      .collect();

    for (const follow of followingUser) {
      await ctx.db.delete(follow._id);
    }

    return { success: true };
  },
});
