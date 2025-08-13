import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from '../lib/securityValidators';

export const getAllEmojis = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    sentiment: v.optional(
      v.union(
        v.literal('positive'),
        v.literal('negative'),
        v.literal('neutral')
      )
    ),
    status: v.optional(
      v.union(v.literal('all'), v.literal('enabled'), v.literal('disabled'))
    ),
    sortBy: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const {
      page,
      pageSize,
      search,
      category,
      sentiment,
      status = 'all',
      sortBy = 'emoji',
      sortDirection = 'asc',
    } = args;

    let emojis = await ctx.db.query('emojis').collect();

    if (category) {
      emojis = emojis.filter((emoji) => emoji.category === category);
    }

    if (search) {
      emojis = emojis.filter(
        (emoji) =>
          emoji.name.toLowerCase().includes(search.toLowerCase()) ||
          emoji.keywords.some((keyword) =>
            keyword.toLowerCase().includes(search.toLowerCase())
          ) ||
          emoji.emoji.includes(search)
      );
    }

    if (sentiment) {
      emojis = emojis.filter((emoji) => emoji.sentiment === sentiment);
    }

    if (status !== 'all') {
      emojis = emojis.filter((emoji) => {
        if (status === 'disabled') {
          return emoji.disabled === true;
        }
        return emoji.disabled !== true;
      });
    }

    const sortedEmojis = emojis.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        case 'sentiment':
          aVal = a.sentiment || 'neutral';
          bVal = b.sentiment || 'neutral';
          break;
        case 'usage':
          aVal = 0;
          bVal = 0;
          break;
        case 'emoji':
        default:
          aVal = a.emoji.codePointAt(0) || 0;
          bVal = b.emoji.codePointAt(0) || 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    const totalCount = sortedEmojis.length;
    const pageCount = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = sortedEmojis.slice(startIndex, startIndex + pageSize);

    // For performance, just return 0 for usage count to avoid hitting document limits
    // In production, consider adding a usage counter field to the emoji table itself
    const emojisWithUsage = data.map((emoji) => ({
      ...emoji,
      usageCount: 0, // Placeholder to avoid document limit issues
    }));

    return {
      data: emojisWithUsage,
      totalCount,
      pageCount,
    };
  },
});

export const getEmojiStats = query({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    const allEmojis = await ctx.db.query('emojis').collect();
    const allRatings = await ctx.db.query('ratings').collect();

    const totalEmojis = allEmojis.length;
    const enabledEmojis = allEmojis.filter(
      (emoji) => emoji.disabled !== true
    ).length;
    const disabledEmojis = allEmojis.filter(
      (emoji) => emoji.disabled === true
    ).length;

    const categoryDistribution = allEmojis.reduce(
      (acc, emoji) => {
        acc[emoji.category] = (acc[emoji.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const sentimentDistribution = allEmojis.reduce(
      (acc, emoji) => {
        const sentiment = emoji.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const emojiUsage = allRatings.reduce(
      (acc, rating) => {
        acc[rating.emoji] = (acc[rating.emoji] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const usedEmojis = Object.keys(emojiUsage).length;
    const unusedEmojis = totalEmojis - usedEmojis;

    const topUsedEmojis = Object.entries(emojiUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([emoji, count]) => {
        const emojiData = allEmojis.find((e) => e.emoji === emoji);
        return {
          emoji,
          name: emojiData?.name || 'Unknown',
          count,
        };
      });

    const averageUsagePerEmoji =
      usedEmojis > 0 ? Math.round(allRatings.length / usedEmojis) : 0;

    return {
      totalEmojis,
      enabledEmojis,
      disabledEmojis,
      usedEmojis,
      unusedEmojis,
      averageUsagePerEmoji,
      categoryDistribution,
      sentimentDistribution,
      topUsedEmojis,
    };
  },
});

export const updateEmojiField = mutation({
  args: {
    emojiId: v.id('emojis'),
    field: v.union(
      v.literal('name'),
      v.literal('category'),
      v.literal('sentiment'),
      v.literal('keywords'),
      v.literal('tags')
    ),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { emojiId, field, value } = args;

    const emoji = await ctx.db.get(emojiId);
    if (!emoji) {
      throw new Error('Emoji not found');
    }

    const updateData: {
      name?: string;
      category?: string;
      sentiment?: 'positive' | 'negative' | 'neutral';
      keywords?: string[];
      tags?: string[];
    } = {};

    switch (field) {
      case 'name':
        if (typeof value !== 'string' || !value.trim()) {
          throw new Error('Name must be a non-empty string');
        }
        updateData.name = value.trim();
        break;

      case 'category':
        if (typeof value !== 'string' || !value.trim()) {
          throw new Error('Category must be a non-empty string');
        }
        updateData.category = value.trim();
        break;

      case 'sentiment':
        if (!['positive', 'negative', 'neutral'].includes(value)) {
          throw new Error('Sentiment must be positive, negative, or neutral');
        }
        updateData.sentiment = value;
        break;

      case 'keywords':
        if (!Array.isArray(value)) {
          throw new Error('Keywords must be an array');
        }
        updateData.keywords = value
          .map((kw: unknown) => String(kw).trim())
          .filter(Boolean);
        break;

      case 'tags':
        if (!Array.isArray(value) && value !== undefined) {
          throw new Error('Tags must be an array or undefined');
        }
        updateData.tags = value
          ? value.map((tag: unknown) => String(tag).trim()).filter(Boolean)
          : undefined;
        break;

      default:
        throw new Error('Invalid field');
    }

    await ctx.db.patch(emojiId, updateData);

    return { success: true };
  },
});

export const toggleEmojiStatus = mutation({
  args: {
    emojiId: v.id('emojis'),
    disabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { emojiId, disabled } = args;

    const emoji = await ctx.db.get(emojiId);
    if (!emoji) {
      throw new Error('Emoji not found');
    }

    await ctx.db.patch(emojiId, {
      disabled: disabled || undefined,
    });

    return { success: true };
  },
});

export const bulkUpdateEmojis = mutation({
  args: {
    emojiIds: v.array(v.id('emojis')),
    operation: v.union(
      v.literal('enable'),
      v.literal('disable'),
      v.literal('updateCategory'),
      v.literal('updateSentiment'),
      v.literal('addTag'),
      v.literal('removeTag')
    ),
    value: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { emojiIds, operation, value } = args;

    if (emojiIds.length === 0) {
      throw new Error('No emojis selected');
    }

    for (const emojiId of emojiIds) {
      const emoji = await ctx.db.get(emojiId);
      if (!emoji) {
        continue;
      }

      const updateData: {
        disabled?: boolean;
        category?: string;
        sentiment?: 'positive' | 'negative' | 'neutral';
        keywords?: string[];
      } = {};

      switch (operation) {
        case 'enable':
          updateData.disabled = undefined;
          break;

        case 'disable':
          updateData.disabled = true;
          break;

        case 'updateCategory':
          if (typeof value !== 'string' || !value.trim()) {
            throw new Error('Category must be a non-empty string');
          }
          updateData.category = value.trim();
          break;

        case 'updateSentiment':
          if (!['positive', 'negative', 'neutral'].includes(value)) {
            throw new Error('Sentiment must be positive, negative, or neutral');
          }
          updateData.sentiment = value;
          break;

        case 'addTag': {
          if (typeof value !== 'string' || !value.trim()) {
            throw new Error('Keyword must be a non-empty string');
          }
          const currentKeywords = emoji.keywords || [];
          if (!currentKeywords.includes(value.trim())) {
            updateData.keywords = [...currentKeywords, value.trim()];
          }
          break;
        }

        case 'removeTag':
          if (typeof value !== 'string' || !value.trim()) {
            throw new Error('Keyword must be a non-empty string');
          }
          updateData.keywords = (emoji.keywords || []).filter(
            (keyword) => keyword !== value.trim()
          );
          break;

        default:
          throw new Error('Invalid operation');
      }

      await ctx.db.patch(emojiId, updateData);
    }

    return { success: true, updatedCount: emojiIds.length };
  },
});
