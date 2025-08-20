import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from '../users';
import type { Doc } from '../_generated/dataModel';

/**
 * Track a share event for analytics
 */
export const trackShare = mutation({
  args: {
    contentType: v.union(v.literal('vibe'), v.literal('profile')),
    contentId: v.string(),
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok'),
      v.literal('clipboard'),
      v.literal('native')
    ),
    shareType: v.optional(
      v.union(
        v.literal('story'),
        v.literal('feed'),
        v.literal('direct'),
        v.literal('copy')
      )
    ),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get current user if authenticated (optional for anonymous sharing)
    const currentUser = await getCurrentUser(ctx);

    // Create share event record
    await ctx.db.insert('shareEvents', {
      contentType: args.contentType,
      contentId: args.contentId,
      userId: currentUser?.externalId,
      platform: args.platform,
      shareType: args.shareType || 'direct',
      success: args.success,
      errorMessage: args.errorMessage,
      sessionId: args.sessionId,
      referrer: args.referrer,
      userAgent: args.userAgent,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmTerm: args.utmTerm,
      utmContent: args.utmContent,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    // If share was successful and it's a vibe, increment the share count
    if (args.success && args.contentType === 'vibe') {
      const vibe = await ctx.db
        .query('vibes')
        .withIndex('id', (q) => q.eq('id', args.contentId))
        .first();

      if (vibe) {
        await ctx.db.patch(vibe._id, {
          shareCount: (vibe.shareCount || 0) + 1,
          lastSharedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

/**
 * Increment share count for a vibe (legacy function for backwards compatibility)
 */
export const incrementShareCount = mutation({
  args: {
    vibeId: v.string(),
  },
  handler: async (ctx, args) => {
    const vibe = await ctx.db
      .query('vibes')
      .withIndex('id', (q) => q.eq('id', args.vibeId))
      .first();

    if (!vibe) {
      throw new Error('Vibe not found');
    }

    await ctx.db.patch(vibe._id, {
      shareCount: (vibe.shareCount || 0) + 1,
      lastSharedAt: Date.now(),
    });

    return { shareCount: (vibe.shareCount || 0) + 1 };
  },
});

/**
 * Get shareable content data for a vibe
 */
export const getShareableVibeContent = query({
  args: {
    vibeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the vibe
    const vibe = await ctx.db
      .query('vibes')
      .withIndex('id', (q) => q.eq('id', args.vibeId))
      .first();

    if (!vibe || vibe.visibility === 'deleted') {
      return null;
    }

    // Get the creator
    const creator = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', vibe.createdById))
      .first();

    // Compute creator display name
    function computeUserDisplayName(user: Doc<'users'> | null): string {
      if (!user) return 'Someone';
      if (user.username?.trim()) return user.username.trim();
      const firstName = user.first_name?.trim();
      const lastName = user.last_name?.trim();
      if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim();
      }
      return 'Someone';
    }

    return {
      id: vibe.id,
      title: vibe.title,
      description: vibe.description,
      creatorName: computeUserDisplayName(creator),
      creatorUsername: creator?.username,
      tags: vibe.tags || [],
      shareCount: vibe.shareCount || 0,
      createdAt: vibe.createdAt,
    };
  },
});

/**
 * Get shareable content data for a user profile
 */
export const getShareableProfileContent = query({
  args: {
    userId: v.string(), // External ID
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', args.userId))
      .first();

    if (!user || user.deleted) {
      return null;
    }

    // Get follower count
    const followerCount = await ctx.db
      .query('follows')
      .withIndex('byFollowing', (q) => q.eq('followingId', args.userId))
      .collect()
      .then((follows) => follows.length);

    // Get vibe count (public vibes only)
    const vibeCount = await ctx.db
      .query('vibes')
      .withIndex('byCreatedByAndVisibility', (q) =>
        q.eq('createdById', args.userId).eq('visibility', 'public')
      )
      .collect()
      .then((vibes) => vibes.length);

    // Compute display name
    function computeUserDisplayName(user: Doc<'users'> | null): string {
      if (!user) return 'Someone';
      if (user.username?.trim()) return user.username.trim();
      const firstName = user.first_name?.trim();
      const lastName = user.last_name?.trim();
      if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim();
      }
      return 'Someone';
    }

    return {
      externalId: user.externalId,
      username: user.username,
      displayName: computeUserDisplayName(user),
      bio: user.bio,
      followerCount,
      vibeCount,
      interests: user.interests || [],
      joinedAt: user.created_at,
    };
  },
});

/**
 * Get share analytics for content
 */
export const getShareAnalytics = query({
  args: {
    contentType: v.union(v.literal('vibe'), v.literal('profile')),
    contentId: v.string(),
    timeRange: v.optional(
      v.union(
        v.literal('24h'),
        v.literal('7d'),
        v.literal('30d'),
        v.literal('all')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Calculate time filter
    let timeFilter: number | undefined;
    const now = Date.now();
    switch (args.timeRange) {
      case '24h':
        timeFilter = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeFilter = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeFilter = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeFilter = undefined;
    }

    // Get share events
    let shareEventsQuery = ctx.db
      .query('shareEvents')
      .withIndex('byContent', (q) =>
        q.eq('contentType', args.contentType).eq('contentId', args.contentId)
      );

    if (timeFilter) {
      shareEventsQuery = shareEventsQuery.filter((q) =>
        q.gte(q.field('createdAt'), timeFilter)
      );
    }

    const shareEvents = await shareEventsQuery.collect();

    // Calculate metrics
    const totalShares = shareEvents.filter((event) => event.success).length;
    const totalAttempts = shareEvents.length;
    const successRate = totalAttempts > 0 ? totalShares / totalAttempts : 0;

    // Platform breakdown
    const platformBreakdown: Record<string, number> = {};
    shareEvents
      .filter((event) => event.success)
      .forEach((event) => {
        platformBreakdown[event.platform] =
          (platformBreakdown[event.platform] || 0) + 1;
      });

    // Share type breakdown
    const shareTypeBreakdown: Record<string, number> = {};
    shareEvents
      .filter((event) => event.success)
      .forEach((event) => {
        shareTypeBreakdown[event.shareType] =
          (shareTypeBreakdown[event.shareType] || 0) + 1;
      });

    return {
      totalShares,
      totalAttempts,
      successRate,
      platformBreakdown,
      shareTypeBreakdown,
      recentShares: shareEvents
        .filter((event) => event.success)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10)
        .map((event) => ({
          platform: event.platform,
          shareType: event.shareType,
          createdAt: event.createdAt,
          userId: event.userId,
        })),
    };
  },
});

/**
 * Get most shared content (trending)
 */
export const getMostSharedContent = query({
  args: {
    contentType: v.union(v.literal('vibe'), v.literal('profile')),
    limit: v.optional(v.number()),
    timeRange: v.optional(
      v.union(
        v.literal('24h'),
        v.literal('7d'),
        v.literal('30d'),
        v.literal('all')
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Calculate time filter
    let timeFilter: number | undefined;
    const now = Date.now();
    switch (args.timeRange) {
      case '24h':
        timeFilter = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeFilter = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeFilter = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeFilter = undefined;
    }

    // Get share events
    let shareEventsQuery = ctx.db
      .query('shareEvents')
      .withIndex('bySuccess', (q) => q.eq('success', true));

    if (timeFilter) {
      shareEventsQuery = shareEventsQuery.filter((q) =>
        q.gte(q.field('createdAt'), timeFilter)
      );
    }

    const shareEvents = await shareEventsQuery
      .filter((q) => q.eq(q.field('contentType'), args.contentType))
      .collect();

    // Count shares by content
    const shareCounts: Record<string, number> = {};
    shareEvents.forEach((event) => {
      shareCounts[event.contentId] = (shareCounts[event.contentId] || 0) + 1;
    });

    // Sort by share count and return top content
    return Object.entries(shareCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([contentId, shareCount]) => ({
        contentId,
        shareCount,
        contentType: args.contentType,
      }));
  },
});
