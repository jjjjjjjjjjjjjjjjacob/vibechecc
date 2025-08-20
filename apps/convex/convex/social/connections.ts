import { mutation, query, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentUser, getCurrentUserOrThrow } from '../users';

/**
 * Connect a social media account to the user's profile
 */
export const connectSocialAccount = mutation({
  args: {
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Check if connection already exists for this platform
    const existingConnection = await ctx.db
      .query('socialConnections')
      .withIndex('byUserAndPlatform', (q) =>
        q.eq('userId', currentUser.externalId).eq('platform', args.platform)
      )
      .first();

    if (existingConnection) {
      // Update existing connection
      await ctx.db.patch(existingConnection._id, {
        platformUserId: args.platformUserId,
        platformUsername: args.platformUsername,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        connectionStatus: 'connected',
        connectedAt: Date.now(),
        lastSyncAt: Date.now(),
        metadata: args.metadata,
        lastError: undefined,
        errorCount: 0,
      });

      return { connectionId: existingConnection._id, updated: true };
    } else {
      // Create new connection
      const connectionId = await ctx.db.insert('socialConnections', {
        userId: currentUser.externalId,
        platform: args.platform,
        platformUserId: args.platformUserId,
        platformUsername: args.platformUsername,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        connectionStatus: 'connected',
        connectedAt: Date.now(),
        lastSyncAt: Date.now(),
        metadata: args.metadata,
        errorCount: 0,
      });

      return { connectionId, updated: false };
    }
  },
});

/**
 * Disconnect a social media account from the user's profile
 */
export const disconnectSocialAccount = mutation({
  args: {
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const connection = await ctx.db
      .query('socialConnections')
      .withIndex('byUserAndPlatform', (q) =>
        q.eq('userId', currentUser.externalId).eq('platform', args.platform)
      )
      .first();

    if (!connection) {
      throw new Error('Social connection not found');
    }

    // Update connection status to disconnected and clear sensitive data
    await ctx.db.patch(connection._id, {
      connectionStatus: 'disconnected',
      accessToken: undefined,
      refreshToken: undefined,
      tokenExpiresAt: undefined,
      lastError: undefined,
      errorCount: 0,
    });

    return { success: true };
  },
});

/**
 * Get all social connections for the current user
 */
export const getSocialConnections = query({
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      // Return empty array if user is not authenticated
      return [];
    }

    const connections = await ctx.db
      .query('socialConnections')
      .withIndex('byUser', (q) => q.eq('userId', currentUser.externalId))
      .collect();

    // Return connections without sensitive data
    return connections.map((connection) => ({
      _id: connection._id,
      platform: connection.platform,
      platformUserId: connection.platformUserId,
      platformUsername: connection.platformUsername,
      connectionStatus: connection.connectionStatus,
      connectedAt: connection.connectedAt,
      lastSyncAt: connection.lastSyncAt,
      lastError: connection.lastError,
      errorCount: connection.errorCount,
      metadata: connection.metadata,
      // Exclude accessToken, refreshToken for security
    }));
  },
});

/**
 * Get social connections for a specific user (public view)
 */
export const getUserSocialConnections = query({
  args: {
    userId: v.string(), // External ID
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query('socialConnections')
      .withIndex('byUser', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('connectionStatus'), 'connected'))
      .collect();

    // Return only public information
    return connections.map((connection) => ({
      platform: connection.platform,
      platformUsername: connection.platformUsername,
      connectedAt: connection.connectedAt,
      // No sensitive data or error information
    }));
  },
});

/**
 * Update social connection metadata or status
 */
export const updateSocialConnection = mutation({
  args: {
    connectionId: v.id('socialConnections'),
    updates: v.object({
      platformUsername: v.optional(v.string()),
      connectionStatus: v.optional(
        v.union(
          v.literal('connected'),
          v.literal('disconnected'),
          v.literal('expired'),
          v.literal('error')
        )
      ),
      lastSyncAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      errorCount: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Get the connection and verify ownership
    const connection = await ctx.db.get(args.connectionId);

    if (!connection) {
      throw new Error('Social connection not found');
    }

    if (connection.userId !== currentUser.externalId) {
      throw new Error('Unauthorized: You can only update your own connections');
    }

    // Update the connection
    await ctx.db.patch(args.connectionId, args.updates);

    return { success: true };
  },
});

/**
 * Mark a social connection as having an error
 */
export const markConnectionError = mutation({
  args: {
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const connection = await ctx.db
      .query('socialConnections')
      .withIndex('byUserAndPlatform', (q) =>
        q.eq('userId', currentUser.externalId).eq('platform', args.platform)
      )
      .first();

    if (!connection) {
      throw new Error('Social connection not found');
    }

    const newErrorCount = (connection.errorCount || 0) + 1;
    const shouldMarkAsError = newErrorCount >= 3; // Mark as error after 3 consecutive failures

    await ctx.db.patch(connection._id, {
      lastError: args.errorMessage,
      errorCount: newErrorCount,
      connectionStatus: shouldMarkAsError
        ? 'error'
        : connection.connectionStatus,
    });

    return {
      success: true,
      errorCount: newErrorCount,
      statusChanged: shouldMarkAsError,
    };
  },
});

/**
 * Reset error count for a connection (when it works again)
 */
export const resetConnectionErrors = mutation({
  args: {
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const connection = await ctx.db
      .query('socialConnections')
      .withIndex('byUserAndPlatform', (q) =>
        q.eq('userId', currentUser.externalId).eq('platform', args.platform)
      )
      .first();

    if (!connection) {
      throw new Error('Social connection not found');
    }

    await ctx.db.patch(connection._id, {
      lastError: undefined,
      errorCount: 0,
      connectionStatus:
        connection.connectionStatus === 'error'
          ? 'connected'
          : connection.connectionStatus,
    });

    return { success: true };
  },
});

/**
 * Get connection statistics
 */
export const getConnectionStats = query({
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const connections = await ctx.db
      .query('socialConnections')
      .withIndex('byUser', (q) => q.eq('userId', currentUser.externalId))
      .collect();

    const stats = {
      total: connections.length,
      connected: connections.filter((c) => c.connectionStatus === 'connected')
        .length,
      disconnected: connections.filter(
        (c) => c.connectionStatus === 'disconnected'
      ).length,
      error: connections.filter((c) => c.connectionStatus === 'error').length,
      expired: connections.filter((c) => c.connectionStatus === 'expired')
        .length,
      platforms: {} as Record<string, { status: string; lastSync?: number }>,
    };

    connections.forEach((connection) => {
      stats.platforms[connection.platform] = {
        status: connection.connectionStatus,
        lastSync: connection.lastSyncAt,
      };
    });

    return stats;
  },
});

/**
 * Check if a user has a specific platform connected
 */
export const isPlatformConnected = query({
  args: {
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ),
    userId: v.optional(v.string()), // If not provided, checks current user
  },
  handler: async (ctx, args) => {
    let targetUserId: string;

    if (args.userId) {
      targetUserId = args.userId;
    } else {
      const currentUser = await getCurrentUserOrThrow(ctx);
      targetUserId = currentUser.externalId;
    }

    const connection = await ctx.db
      .query('socialConnections')
      .withIndex('byUserAndPlatform', (q) =>
        q.eq('userId', targetUserId).eq('platform', args.platform)
      )
      .first();

    return {
      connected: connection?.connectionStatus === 'connected',
      status: connection?.connectionStatus,
      platformUsername: connection?.platformUsername,
    };
  },
});

/**
 * Internal mutation to connect a social account (used by webhooks)
 */
export const internalConnectSocialAccount = internalMutation({
  args: {
    userId: v.string(), // External Clerk user ID
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if connection already exists for this platform
    const existingConnection = await ctx.db
      .query('socialConnections')
      .withIndex('byUserAndPlatform', (q) =>
        q.eq('userId', args.userId).eq('platform', args.platform)
      )
      .first();

    if (existingConnection) {
      // Update existing connection
      await ctx.db.patch(existingConnection._id, {
        platformUserId: args.platformUserId,
        platformUsername: args.platformUsername,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        connectionStatus: 'connected',
        connectedAt: Date.now(),
        lastSyncAt: Date.now(),
        metadata: args.metadata,
        lastError: undefined,
        errorCount: 0,
      });

      return { connectionId: existingConnection._id, updated: true };
    } else {
      // Create new connection
      const connectionId = await ctx.db.insert('socialConnections', {
        userId: args.userId,
        platform: args.platform,
        platformUserId: args.platformUserId,
        platformUsername: args.platformUsername,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        connectionStatus: 'connected',
        connectedAt: Date.now(),
        lastSyncAt: Date.now(),
        metadata: args.metadata,
        errorCount: 0,
      });

      return { connectionId, updated: false };
    }
  },
});

/**
 * Internal mutation to mark connection error (used by webhooks)
 */
export const internalMarkConnectionError = internalMutation({
  args: {
    userId: v.string(), // External Clerk user ID
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query('socialConnections')
      .withIndex('byUserAndPlatform', (q) =>
        q.eq('userId', args.userId).eq('platform', args.platform)
      )
      .first();

    if (!connection) {
      // If connection doesn't exist, just log the error but don't fail
      return { found: false };
    }

    const newErrorCount = (connection.errorCount || 0) + 1;
    const shouldMarkAsError = newErrorCount >= 3; // Mark as error after 3 consecutive failures

    await ctx.db.patch(connection._id, {
      lastError: args.errorMessage,
      errorCount: newErrorCount,
      connectionStatus: shouldMarkAsError
        ? 'error'
        : connection.connectionStatus,
    });

    return {
      found: true,
      errorCount: newErrorCount,
      statusChanged: shouldMarkAsError,
    };
  },
});

/**
 * Internal mutation to clean up all connections for a user (used by webhooks)
 */
export const cleanupUserConnections = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all connections for the user
    const connections = await ctx.db
      .query('socialConnections')
      .withIndex('byUser', (q) => q.eq('userId', args.clerkUserId))
      .collect();

    // Mark all connections as disconnected and clear sensitive data
    for (const connection of connections) {
      await ctx.db.patch(connection._id, {
        connectionStatus: 'disconnected',
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiresAt: undefined,
        lastError: 'User account deleted',
        errorCount: 0,
      });
    }

    return { cleaned: connections.length };
  },
});
