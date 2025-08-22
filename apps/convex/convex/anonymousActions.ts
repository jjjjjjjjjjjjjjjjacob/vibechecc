import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { AuthUtils } from './lib/securityValidators';

// Anonymous user action schema
const anonymousActionValidator = v.object({
  sessionId: v.string(),
  type: v.union(
    v.literal('vibe_view'),
    v.literal('vibe_like'),
    v.literal('rating_attempt'),
    v.literal('follow_attempt'),
    v.literal('search')
  ),
  targetId: v.string(),
  data: v.optional(v.any()),
  timestamp: v.number(),
});

// Store anonymous actions temporarily for carryover
export const storeAnonymousActions = mutation({
  args: {
    sessionId: v.string(),
    actions: v.array(anonymousActionValidator),
  },
  handler: async (ctx, { sessionId, actions }) => {
    // Store actions with expiration (24 hours)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    
    return await ctx.db.insert('anonymousActions', {
      sessionId,
      actions,
      createdAt: Date.now(),
      expiresAt,
    });
  },
});

// Retrieve and process anonymous actions when user signs up
export const processAnonymousActions = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = AuthUtils.requireAuth(identity?.subject);
    
    // Find the anonymous actions for this session
    const anonymousRecord = await ctx.db
      .query('anonymousActions')
      .withIndex('bySessionId', (q) => q.eq('sessionId', sessionId))
      .filter((q) => q.gt(q.field('expiresAt'), Date.now()))
      .unique();
    
    if (!anonymousRecord) {
      return { success: false, message: 'No anonymous actions found or expired' };
    }

    const { actions } = anonymousRecord;
    let processedCount = 0;
    const results = [];

    // Process each action
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'vibe_view':
            // Track vibe view in analytics
            results.push({
              type: 'vibe_view',
              targetId: action.targetId,
              status: 'tracked',
            });
            break;

          case 'vibe_like':
            // Could potentially create a like/reaction if we want to preserve these
            results.push({
              type: 'vibe_like',
              targetId: action.targetId,
              status: 'tracked',
            });
            break;

          case 'rating_attempt':
            // Track that user attempted to rate this vibe
            results.push({
              type: 'rating_attempt',
              targetId: action.targetId,
              status: 'tracked',
            });
            break;

          case 'follow_attempt':
            // Track follow attempt - could optionally create actual follow
            results.push({
              type: 'follow_attempt',
              targetId: action.targetId,
              status: 'tracked',
            });
            break;

          case 'search':
            // Add to search history
            await ctx.db.insert('searchHistory', {
              userId,
              query: action.data?.query || action.targetId,
              timestamp: action.timestamp,
              resultCount: 0,
              category: 'carryover',
            });
            results.push({
              type: 'search',
              targetId: action.targetId,
              status: 'added_to_history',
            });
            break;
        }
        processedCount++;
      } catch (error) {
        console.error(`Failed to process action ${action.type}:`, error);
        results.push({
          type: action.type,
          targetId: action.targetId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Mark the anonymous record as processed
    await ctx.db.patch(anonymousRecord._id, {
      processedAt: Date.now(),
      processedBy: userId,
    });

    return {
      success: true,
      processedCount,
      totalActions: actions.length,
      results,
    };
  },
});

// Query to get carryover summary for display
export const getCarryoverSummary = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, { sessionId }) => {
    const anonymousRecord = await ctx.db
      .query('anonymousActions')
      .withIndex('bySessionId', (q) => q.eq('sessionId', sessionId))
      .filter((q) => q.gt(q.field('expiresAt'), Date.now()))
      .unique();

    if (!anonymousRecord) {
      return null;
    }

    const { actions } = anonymousRecord;
    
    // Summarize actions by type
    const summary = actions.reduce(
      (acc, action) => {
        acc[action.type] = (acc[action.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalActions: actions.length,
      summary,
      sessionCreated: anonymousRecord.createdAt,
      expiresAt: anonymousRecord.expiresAt,
    };
  },
});

// Cleanup expired anonymous actions (run periodically)
export const cleanupExpiredAnonymousActions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredRecords = await ctx.db
      .query('anonymousActions')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect();

    let deletedCount = 0;
    for (const record of expiredRecords) {
      await ctx.db.delete(record._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});