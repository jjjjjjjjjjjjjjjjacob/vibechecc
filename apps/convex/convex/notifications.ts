import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser, getCurrentUserOrThrow } from './users';

// Internal mutation to create a notification
export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal('follow'),
      v.literal('rating'),
      v.literal('new_vibe'),
      v.literal('new_rating')
    ),
    triggerUserId: v.string(),
    targetId: v.string(),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Don't create notification if user is notifying themselves
    if (args.userId === args.triggerUserId) {
      return null;
    }

    // Check if receiving user exists
    const receivingUser = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', args.userId))
      .first();

    if (!receivingUser) {
      throw new Error('Receiving user not found');
    }

    // Check if triggering user exists
    const triggerUser = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', args.triggerUserId))
      .first();

    if (!triggerUser) {
      throw new Error('Triggering user not found');
    }

    // Create the notification
    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      triggerUserId: args.triggerUserId,
      targetId: args.targetId,
      title: args.title,
      description: args.description,
      metadata: args.metadata,
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Query to get paginated notifications for a user with optional type filter
export const getNotifications = query({
  args: {
    type: v.optional(
      v.union(
        v.literal('follow'),
        v.literal('rating'),
        v.literal('new_vibe'),
        v.literal('new_rating')
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return {
        notifications: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    const limit = args.limit ?? 20;
    const userId = currentUser.externalId;

    let notificationsQuery;

    if (args.type) {
      // Filter by type
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUserAndType', (q) =>
          q.eq('userId', userId).eq('type', args.type!)
        )
        .order('desc');
    } else {
      // Get all notifications for user
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUser', (q) => q.eq('userId', userId))
        .order('desc');
    }

    const notifications = await notificationsQuery.paginate({
      numItems: limit,
      cursor: args.cursor ?? null,
    });

    // Enrich notifications with trigger user data
    const enrichedNotifications = await Promise.all(
      notifications.page.map(async (notification) => {
        const triggerUser = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', notification.triggerUserId)
          )
          .first();

        return {
          ...notification,
          triggerUser,
        };
      })
    );

    return {
      notifications: enrichedNotifications,
      nextCursor: notifications.continueCursor,
      hasMore: notifications.isDone === false,
    };
  },
});

// Mutation to mark a single notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Get the notification
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Verify the notification belongs to the current user
    if (notification.userId !== currentUser.externalId) {
      throw new Error('Not authorized to update this notification');
    }

    // Mark as read
    await ctx.db.patch(args.notificationId, {
      read: true,
    });

    return { success: true };
  },
});

// Mutation to mark all notifications as read for current user
export const markAllAsRead = mutation({
  args: {
    type: v.optional(
      v.union(
        v.literal('follow'),
        v.literal('rating'),
        v.literal('new_vibe'),
        v.literal('new_rating')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const currentUser = await getCurrentUserOrThrow(ctx);
    const userId = currentUser.externalId;

    let notificationsQuery;

    if (args.type) {
      // Filter by type and unread status
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUserAndType', (q) =>
          q.eq('userId', userId).eq('type', args.type!)
        )
        .filter((q) => q.eq(q.field('read'), false));
    } else {
      // Get all unread notifications for user
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUserAndRead', (q) =>
          q.eq('userId', userId).eq('read', false)
        );
    }

    const unreadNotifications = await notificationsQuery.collect();

    // Mark all as read
    const updatePromises = unreadNotifications.map((notification) =>
      ctx.db.patch(notification._id, { read: true })
    );

    await Promise.all(updatePromises);

    return {
      success: true,
      updatedCount: unreadNotifications.length,
    };
  },
});

// Query to get total unread notification count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    // Get current authenticated user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('byUserAndRead', (q) =>
        q.eq('userId', currentUser.externalId).eq('read', false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Query to get unread counts per notification type
export const getUnreadCountByType = query({
  args: {},
  handler: async (ctx) => {
    // Get current authenticated user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return {
        follow: 0,
        rating: 0,
        new_vibe: 0,
        new_rating: 0,
        total: 0,
      };
    }

    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('byUserAndRead', (q) =>
        q.eq('userId', currentUser.externalId).eq('read', false)
      )
      .collect();

    const counts = {
      follow: 0,
      rating: 0,
      new_vibe: 0,
      new_rating: 0,
      total: unreadNotifications.length,
    };

    // Count by type
    unreadNotifications.forEach((notification) => {
      counts[notification.type]++;
    });

    return counts;
  },
});
