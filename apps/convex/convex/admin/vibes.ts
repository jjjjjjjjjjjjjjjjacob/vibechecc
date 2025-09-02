import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from '../lib/securityValidators';

export const getAllVibes = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(v.literal('all'), v.literal('public'), v.literal('deleted'))
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
      tags,
      status = 'all',
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortDirection = 'desc',
    } = args;

    let vibes = await ctx.db.query('vibes').collect();

    if (status !== 'all') {
      vibes = vibes.filter((vibe) => {
        if (status === 'deleted') {
          return vibe.visibility === 'deleted';
        }
        return vibe.visibility === 'public' || !vibe.visibility;
      });
    }

    if (search) {
      vibes = vibes.filter(
        (vibe) =>
          vibe.title.toLowerCase().includes(search.toLowerCase()) ||
          vibe.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (tags && tags.length > 0) {
      vibes = vibes.filter(
        (vibe) => vibe.tags && vibe.tags.some((tag) => tags.includes(tag))
      );
    }

    if (dateFrom || dateTo) {
      vibes = vibes.filter((vibe) => {
        const vibeDate = new Date(vibe.createdAt).getTime();
        if (dateFrom && vibeDate < dateFrom) return false;
        if (dateTo && vibeDate > dateTo) return false;
        return true;
      });
    }

    const sortedVibes = vibes.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortBy) {
        case 'title':
          aVal = a.title;
          bVal = b.title;
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

    const totalCount = sortedVibes.length;
    const pageCount = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = sortedVibes.slice(startIndex, startIndex + pageSize);

    const vibesWithCreators = await Promise.all(
      data.map(async (vibe) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        // Filter for emoji ratings (those with emoji field)
        const emojiRatings = ratings.filter((rating) => rating.emoji);

        // Get user data for emoji ratings
        const emojiRatingsWithUsers = await Promise.all(
          emojiRatings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', rating.userId)
              )
              .first();
            return {
              ...rating,
              user: user
                ? {
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                  }
                : null,
            };
          })
        );

        return {
          ...vibe,
          creator: creator
            ? {
                username: creator.username,
                first_name: creator.first_name,
                last_name: creator.last_name,
                image_url: creator.image_url,
              }
            : null,
          ratingsCount: ratings.length,
          emojiRatings: emojiRatingsWithUsers,
          starRatings: ratings.filter((r) => !r.emoji).length,
        };
      })
    );

    return {
      data: vibesWithCreators,
      totalCount,
      pageCount,
    };
  },
});

export const getVibeStats = query({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    const allVibes = await ctx.db.query('vibes').collect();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalVibes = allVibes.length;
    const publicVibes = allVibes.filter(
      (vibe) => vibe.visibility === 'public' || !vibe.visibility
    ).length;
    const deletedVibes = allVibes.filter(
      (vibe) => vibe.visibility === 'deleted'
    ).length;

    const newVibesToday = allVibes.filter(
      (vibe) => new Date(vibe.createdAt).getTime() > oneDayAgo
    ).length;
    const newVibesThisWeek = allVibes.filter(
      (vibe) => new Date(vibe.createdAt).getTime() > oneWeekAgo
    ).length;
    const newVibesThisMonth = allVibes.filter(
      (vibe) => new Date(vibe.createdAt).getTime() > oneMonthAgo
    ).length;

    const vibesWithImages = allVibes.filter(
      (vibe) => vibe.image || vibe.imageStorageId
    ).length;
    const imageAttachmentRate =
      totalVibes > 0 ? Math.round((vibesWithImages / totalVibes) * 100) : 0;

    const vibesWithTags = allVibes.filter(
      (vibe) => vibe.tags && vibe.tags.length > 0
    ).length;
    const tagUsageRate =
      totalVibes > 0 ? Math.round((vibesWithTags / totalVibes) * 100) : 0;

    return {
      totalVibes,
      publicVibes,
      deletedVibes,
      newVibesToday,
      newVibesThisWeek,
      newVibesThisMonth,
      imageAttachmentRate,
      tagUsageRate,
    };
  },
});

export const moderateVibe = mutation({
  args: {
    vibeId: v.id('vibes'),
    visibility: v.union(v.literal('public'), v.literal('deleted')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { vibeId, visibility, reason } = args;

    const vibe = await ctx.db.get(vibeId);
    if (!vibe) {
      throw new Error('Vibe not found');
    }

    await ctx.db.patch(vibeId, {
      visibility,
      moderationReason: reason,
      moderatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const deleteVibe = mutation({
  args: {
    vibeId: v.id('vibes'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { vibeId, reason } = args;

    const vibe = await ctx.db.get(vibeId);
    if (!vibe) {
      throw new Error('Vibe not found');
    }

    await ctx.db.patch(vibeId, {
      visibility: 'deleted',
      deletionReason: reason,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const vibeRatings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
      .collect();

    for (const rating of vibeRatings) {
      // Delete likes on this rating first
      const ratingsLikes = await ctx.db
        .query('ratingLikes')
        .withIndex('byRating', (q) => q.eq('ratingId', rating._id))
        .collect();

      for (const like of ratingsLikes) {
        await ctx.db.delete(like._id);
      }

      // Then delete the rating itself
      await ctx.db.delete(rating._id);
    }

    return { success: true };
  },
});
