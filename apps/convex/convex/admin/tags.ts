import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from '../lib/securityValidators';

export const getAllTags = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    search: v.optional(v.string()),
    minUsage: v.optional(v.number()),
    maxUsage: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const {
      page,
      pageSize,
      search,
      minUsage,
      maxUsage,
      sortBy = 'count',
      sortDirection = 'desc',
    } = args;

    const query = ctx.db.query('tags');
    let tags = await query.collect();

    if (search) {
      tags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (minUsage !== undefined || maxUsage !== undefined) {
      tags = tags.filter((tag) => {
        if (minUsage !== undefined && tag.count < minUsage) return false;
        if (maxUsage !== undefined && tag.count > maxUsage) return false;
        return true;
      });
    }

    const sortedTags = tags.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'count':
          aVal = a.count;
          bVal = b.count;
          break;
        case 'createdAt':
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case 'lastUsed':
          aVal = a.lastUsed;
          bVal = b.lastUsed;
          break;
        default:
          aVal = a.count;
          bVal = b.count;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    const totalCount = sortedTags.length;
    const pageCount = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = sortedTags.slice(startIndex, startIndex + pageSize);

    return {
      data,
      totalCount,
      pageCount,
    };
  },
});

export const getTagStats = query({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    const allTags = await ctx.db.query('tags').collect();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalTags = allTags.length;
    const totalUsage = allTags.reduce((sum, tag) => sum + tag.count, 0);
    const averageUsage = totalTags > 0 ? Math.round(totalUsage / totalTags) : 0;

    const activeTags = allTags.filter(
      (tag) => tag.lastUsed > oneWeekAgo
    ).length;

    const newTagsToday = allTags.filter(
      (tag) => tag.createdAt > oneDayAgo
    ).length;
    const newTagsThisWeek = allTags.filter(
      (tag) => tag.createdAt > oneWeekAgo
    ).length;
    const newTagsThisMonth = allTags.filter(
      (tag) => tag.createdAt > oneMonthAgo
    ).length;

    const unusedTags = allTags.filter((tag) => tag.count === 0).length;
    const popularTags = allTags.filter((tag) => tag.count >= 10).length;

    const topTags = allTags
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((tag) => ({ name: tag.name, count: tag.count }));

    const recentlyUsedTags = allTags
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 10)
      .map((tag) => ({
        name: tag.name,
        count: tag.count,
        lastUsed: tag.lastUsed,
      }));

    return {
      totalTags,
      totalUsage,
      averageUsage,
      activeTags,
      newTagsToday,
      newTagsThisWeek,
      newTagsThisMonth,
      unusedTags,
      popularTags,
      topTags,
      recentlyUsedTags,
    };
  },
});

export const createTag = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { name } = args;
    const normalizedName = name.toLowerCase().trim();

    if (!normalizedName) {
      throw new Error('Tag name cannot be empty');
    }

    const existingTag = await ctx.db
      .query('tags')
      .withIndex('byName', (q) => q.eq('name', normalizedName))
      .first();

    if (existingTag) {
      throw new Error('Tag already exists');
    }

    const tagId = await ctx.db.insert('tags', {
      name: normalizedName,
      count: 0,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    return { id: tagId, success: true };
  },
});

export const updateTag = mutation({
  args: {
    tagId: v.id('tags'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { tagId, name } = args;
    const normalizedName = name.toLowerCase().trim();

    if (!normalizedName) {
      throw new Error('Tag name cannot be empty');
    }

    const tag = await ctx.db.get(tagId);
    if (!tag) {
      throw new Error('Tag not found');
    }

    const existingTag = await ctx.db
      .query('tags')
      .withIndex('byName', (q) => q.eq('name', normalizedName))
      .first();

    if (existingTag && existingTag._id !== tagId) {
      throw new Error('Tag with this name already exists');
    }

    const oldName = tag.name;

    await ctx.db.patch(tagId, {
      name: normalizedName,
    });

    const vibesWithOldTag = await ctx.db.query('vibes').collect();
    for (const vibe of vibesWithOldTag) {
      if (vibe.tags && vibe.tags.includes(oldName)) {
        const updatedTags = vibe.tags.map((t) =>
          t === oldName ? normalizedName : t
        );
        await ctx.db.patch(vibe._id, {
          tags: updatedTags,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return { success: true };
  },
});

export const mergeTags = mutation({
  args: {
    sourceTagId: v.id('tags'),
    targetTagId: v.id('tags'),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { sourceTagId, targetTagId } = args;

    const sourceTag = await ctx.db.get(sourceTagId);
    const targetTag = await ctx.db.get(targetTagId);

    if (!sourceTag || !targetTag) {
      throw new Error('One or both tags not found');
    }

    if (sourceTagId === targetTagId) {
      throw new Error('Cannot merge a tag with itself');
    }

    const vibesWithSourceTag = await ctx.db.query('vibes').collect();
    for (const vibe of vibesWithSourceTag) {
      if (vibe.tags && vibe.tags.includes(sourceTag.name)) {
        const updatedTags = vibe.tags.map((t) =>
          t === sourceTag.name ? targetTag.name : t
        );
        const uniqueTags = [...new Set(updatedTags)];
        await ctx.db.patch(vibe._id, {
          tags: uniqueTags,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await ctx.db.patch(targetTagId, {
      count: targetTag.count + sourceTag.count,
      lastUsed: Math.max(targetTag.lastUsed, sourceTag.lastUsed),
    });

    await ctx.db.delete(sourceTagId);

    return { success: true };
  },
});

export const deleteTag = mutation({
  args: {
    tagId: v.id('tags'),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { tagId } = args;

    const tag = await ctx.db.get(tagId);
    if (!tag) {
      throw new Error('Tag not found');
    }

    const vibesWithTag = await ctx.db.query('vibes').collect();
    for (const vibe of vibesWithTag) {
      if (vibe.tags && vibe.tags.includes(tag.name)) {
        const updatedTags = vibe.tags.filter((t) => t !== tag.name);
        await ctx.db.patch(vibe._id, {
          tags: updatedTags.length > 0 ? updatedTags : undefined,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await ctx.db.delete(tagId);

    return { success: true };
  },
});
