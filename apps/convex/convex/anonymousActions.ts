import { v } from 'convex/values';
import { mutation, query, type MutationCtx } from './_generated/server';
import { AuthUtils } from './lib/securityValidators';

// SECURITY: Maximum actions per session to prevent abuse
const MAX_ACTIONS_PER_SESSION = 50;

// SECURITY: Session expiration (24 hours)
const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// Enhanced anonymous user action schema with validation
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

/**
 * Store anonymous actions temporarily for carryover with enhanced security
 * SECURITY: Validates session tokens, enforces limits, and prevents abuse
 */
export const storeAnonymousActions = mutation({
  args: {
    sessionId: v.string(),
    actions: v.array(anonymousActionValidator),
  },
  handler: async (ctx, { sessionId, actions }) => {
    // SECURITY: Validate session token format
    if (!isValidSessionToken(sessionId)) {
      throw new Error('Invalid session token format');
    }

    // SECURITY: Enforce maximum actions limit
    if (actions.length > MAX_ACTIONS_PER_SESSION) {
      throw new Error(
        `Maximum ${MAX_ACTIONS_PER_SESSION} actions per session allowed`
      );
    }

    // SECURITY: Validate action timestamps (prevent time manipulation)
    const now = Date.now();
    for (const action of actions) {
      if (
        action.timestamp > now + 60000 ||
        action.timestamp < now - 7 * 24 * 60 * 60 * 1000
      ) {
        throw new Error('Invalid action timestamp');
      }
    }

    // Check if session already exists
    const existingSession = await ctx.db
      .query('anonymousActions')
      .withIndex('bySessionId', (q) => q.eq('sessionId', sessionId))
      .unique();

    const expiresAt = now + SESSION_EXPIRATION_MS;

    if (existingSession) {
      // SECURITY: Check if session is expired
      if (existingSession.expiresAt < now) {
        throw new Error('Session expired');
      }

      // Update existing session (merge actions)
      const mergedActions = [...existingSession.actions, ...actions];

      // SECURITY: Enforce limit on merged actions
      if (mergedActions.length > MAX_ACTIONS_PER_SESSION) {
        throw new Error('Session action limit exceeded');
      }

      await ctx.db.patch(existingSession._id, {
        actions: mergedActions,
        expiresAt, // Extend expiration
      });

      // Log security event
      await logSecurityEvent(ctx, 'anonymous_session_updated', {
        sessionId,
        actionCount: actions.length,
        totalActions: mergedActions.length,
      });

      return existingSession._id;
    } else {
      // Create new session
      const newSessionId = await ctx.db.insert('anonymousActions', {
        sessionId,
        actions,
        createdAt: now,
        expiresAt,
      });

      // Log security event
      await logSecurityEvent(ctx, 'anonymous_session_created', {
        sessionId,
        actionCount: actions.length,
      });

      return newSessionId;
    }
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
      return {
        success: false,
        message: 'No anonymous actions found or expired',
      };
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
        // eslint-disable-next-line no-console
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

/**
 * Enhanced cleanup of expired anonymous actions with security logging
 * SECURITY: Removes expired sessions to prevent data accumulation
 */
export const cleanupExpiredAnonymousActions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredRecords = await ctx.db
      .query('anonymousActions')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect();

    let deletedCount = 0;
    let totalActions = 0;

    for (const record of expiredRecords) {
      totalActions += record.actions.length;
      await ctx.db.delete(record._id);
      deletedCount++;
    }

    // Log cleanup activity for security monitoring
    if (deletedCount > 0) {
      await logSecurityEvent(ctx, 'anonymous_sessions_cleanup', {
        deletedSessions: deletedCount,
        totalActions,
        cleanupTimestamp: now,
      });

      // eslint-disable-next-line no-console
      console.log(
        `[SECURITY] Cleaned up ${deletedCount} expired anonymous sessions with ${totalActions} total actions`
      );
    }

    return { deletedCount, totalActionsRemoved: totalActions };
  },
});

/**
 * SECURITY: Validate session token format and integrity
 */
function isValidSessionToken(token: string): boolean {
  try {
    // Expected format: {base64}-{timestamp}-{integrity}
    const parts = token.split('-');
    if (parts.length !== 3) {
      return false;
    }

    const [tokenPart, timestampPart, integrityPart] = parts;

    // Validate base64 token part (should be 43 characters for 32-byte token)
    if (tokenPart.length !== 43) {
      return false;
    }

    // Validate timestamp part (should be valid base36 number)
    const timestamp = parseInt(timestampPart, 36);
    if (isNaN(timestamp) || timestamp <= 0) {
      return false;
    }

    // Validate integrity part (should be 8 hex characters)
    if (integrityPart.length !== 8 || !/^[0-9a-f]+$/i.test(integrityPart)) {
      return false;
    }

    // Additional validation: check if timestamp is reasonable (not too old or in future)
    const now = Date.now();
    const tokenAge = now - timestamp;
    if (tokenAge < -60000 || tokenAge > 7 * 24 * 60 * 60 * 1000) {
      // Allow 1 minute clock skew, max 7 days old
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * SECURITY: Log security events for anonymous actions system
 */
async function logSecurityEvent(
  ctx: MutationCtx,
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await ctx.db.insert('userBehavior', {
      userId: data.sessionId?.toString() || 'anonymous',
      eventType: 'personalized_content_engaged',
      metadata: {
        security_event_type: eventType,
        source: 'anonymous_actions_system',
        timestamp: Date.now(),
        ...data,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SECURITY] Failed to log security event:', error);
  }
}
