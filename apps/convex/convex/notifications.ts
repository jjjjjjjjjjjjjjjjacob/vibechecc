import { mutation, query, internalMutation } from './_generated/server';
// Import validation utilities from Convex
import { v } from 'convex/values';
// Internal API reference used for calling other functions
import { internal } from './_generated/api';
// Helper functions for fetching the current user in different contexts
import { getCurrentUser, getCurrentUserOrThrow } from './users';

/**
 * Create a single notification for a user.
 *
 * @param ctx - Convex mutation context used to interact with the database
 * @param args - Details about the notification to create
 * @returns The ID of the created notification or null if the user notified themselves
 */
export const createNotification = internalMutation({
  // Define the expected arguments and their types
  args: {
    userId: v.string(), // The recipient's external ID
    type: v.union(
      v.literal('follow'),
      v.literal('rating'),
      v.literal('new_vibe'),
      v.literal('new_rating')
    ), // Restrict notification type to one of the allowed literals
    triggerUserId: v.string(), // The user who triggered the notification
    targetId: v.string(), // Resource the notification references
    title: v.string(), // Short title of the notification
    description: v.string(), // Longer description
    metadata: v.optional(v.any()), // Optional extra data stored as JSON
  },
  // Handler performs the actual insert logic
  handler: async (ctx, args) => {
    // Prevent sending notifications to self; this is a no-op
    if (args.userId === args.triggerUserId) {
      return null;
    }

    // Look up the user who should receive the notification
    const receivingUser = await ctx.db
      .query('users') // Query the users table
      .withIndex('byExternalId', (q) => q.eq('externalId', args.userId)) // Use index for lookup
      .first(); // Take the first matching record

    // If the recipient doesn't exist, raise an error so the caller can react
    if (!receivingUser) {
      throw new Error('receiving user not found');
    }

    // Fetch the user who triggered the notification to ensure they exist
    const triggerUser = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', args.triggerUserId))
      .first();

    // Bail out if the triggering user does not exist
    if (!triggerUser) {
      throw new Error('triggering user not found');
    }

    // Insert the notification into the database
    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId, // recipient external ID
      type: args.type, // category of notification
      triggerUserId: args.triggerUserId, // who triggered it
      targetId: args.targetId, // resource reference
      title: args.title, // title text
      description: args.description, // description text
      metadata: args.metadata, // optional extra metadata
      read: false, // mark as unread initially
      createdAt: Date.now(), // timestamp for ordering
    });

    // Return the newly created notification ID for further use
    return notificationId;
  },
});
/**
 * Insert a batch of notifications efficiently.
 *
 * @param ctx - Convex mutation context
 * @param args - Array of notifications to create
 * @returns IDs of created notifications
 */
export const createBatchNotifications = internalMutation({
  // The mutation accepts an array of notification-like objects
  args: {
    notifications: v.array(
      v.object({
        userId: v.string(), // recipient ID
        type: v.union(
          v.literal('follow'),
          v.literal('rating'),
          v.literal('new_vibe'),
          v.literal('new_rating')
        ), // restrict to valid types
        triggerUserId: v.string(), // sender ID
        targetId: v.string(), // referenced resource
        title: v.string(), // notification title
        description: v.string(), // description text
        metadata: v.optional(v.any()), // optional metadata
      })
    ),
  },
  handler: async (ctx, args) => {
    // Short-circuit when no notifications are provided
    if (args.notifications.length === 0) {
      return [];
    }

    // Timestamp once to reuse for all notifications
    const now = Date.now();
    // Collect all user IDs referenced to validate existence
    const allUserIds = new Set<string>();
    args.notifications.forEach((notif) => {
      allUserIds.add(notif.userId); // recipient
      allUserIds.add(notif.triggerUserId); // sender
    });
    // Fetch all existing users in a single query using OR conditions
    const existingUsers = await ctx.db
      .query('users')
      .filter((q) =>
        q.or(
          ...Array.from(allUserIds).map((id) => q.eq(q.field('externalId'), id))
        )
      )
      .collect();

    // Build a set of valid user IDs for quick lookups
    const existingUserIds = new Set(existingUsers.map((u) => u.externalId));
    // Filter out notifications where either user is missing or self-notifying
    const validNotifications = args.notifications.filter(
      (notif) =>
        notif.userId !== notif.triggerUserId &&
        existingUserIds.has(notif.userId) &&
        existingUserIds.has(notif.triggerUserId)
    );
    // Insert each valid notification and collect IDs
    const notificationIds = await Promise.all(
      validNotifications.map((notif) =>
        ctx.db.insert('notifications', {
          ...notif,
          read: false,
          createdAt: now,
        })
      )
    );

    return notificationIds;
  },
});
/**
 * Notify all followers when a user posts a new vibe or rating.
 *
 * @param ctx - Convex context
 * @param args - details about the trigger and notification contents
 * @returns IDs of the created notifications
 */
export const createFollowerNotifications = internalMutation({
  args: {
    triggerUserId: v.string(), // ID of the user triggering the event
    triggerUserDisplayName: v.string(), // name used in notification text
    type: v.union(v.literal('new_vibe'), v.literal('new_rating')), // type of event
    targetId: v.string(), // ID of the new vibe or rating
    title: v.string(), // notification title
    description: v.string(), // notification description
    metadata: v.optional(v.any()), // optional metadata
    maxFollowers: v.optional(v.number()), // limit to avoid large fan-outs
  },
  handler: async (ctx, args): Promise<string[]> => {
    const maxFollowers = args.maxFollowers ?? 50; // default fan-out cap
    // Query followers of the triggering user
    const followers = await ctx.db
      .query('follows')
      .withIndex('byFollowing', (q) => q.eq('followingId', args.triggerUserId))
      .order('desc')
      .take(maxFollowers);

    // If there are no followers, there's nothing to do
    if (followers.length === 0) {
      return [];
    }
    // Build notifications for each follower
    const notifications = followers.map((follow) => ({
      userId: follow.followerId,
      type: args.type,
      triggerUserId: args.triggerUserId,
      targetId: args.targetId,
      title: args.title,
      description: args.description,
      metadata: args.metadata,
    }));
    // Delegate insertion to the batch mutation
    return await ctx.runMutation(
      internal.notifications.createBatchNotifications,
      {
        notifications,
      }
    );
  },
});
/**
 * Fetch notifications for the current user with optional type filtering.
 */
export const getNotifications = query({
  args: {
    type: v.optional(
      v.union(
        v.literal('follow'),
        v.literal('rating'),
        v.literal('new_vibe'),
        v.literal('new_rating')
      )
    ), // filter by notification type
    limit: v.optional(v.number()), // page size
    cursor: v.optional(v.string()), // pagination cursor
  },
  handler: async (ctx, args) => {
    // Get the currently logged-in user
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      // If not logged in return empty results
      return {
        notifications: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    const limit = args.limit ?? 20; // default page size
    const userId = currentUser.externalId; // user identifier

    let notificationsQuery; // will hold the base query

    if (args.type) {
      // Query notifications by user and type if provided
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUserAndType', (q) =>
          q.eq('userId', userId).eq('type', args.type!)
        )
        .order('desc');
    } else {
      // Otherwise fetch by user only
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUser', (q) => q.eq('userId', userId))
        .order('desc');
    }

    // Use Convex pagination helper
    const notifications = await notificationsQuery.paginate({
      numItems: limit,
      cursor: args.cursor ?? null,
    });
    // Enrich each notification with trigger user details
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
/**
 * Mark a single notification as read.
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'), // ID of notification to update
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx); // require auth
    const notification = await ctx.db.get(args.notificationId); // fetch notification
    if (!notification) {
      throw new Error('notification not found');
    }
    if (notification.userId !== currentUser.externalId) {
      throw new Error('not authorized to update this notification');
    }
    await ctx.db.patch(args.notificationId, {
      read: true, // set read flag
    });

    return { success: true }; // indicate success
  },
});
/**
 * Mark all notifications (optionally by type) as read for the current user.
 */
export const markAllAsRead = mutation({
  args: {
    type: v.optional(
      v.union(
        v.literal('follow'),
        v.literal('rating'),
        v.literal('new_vibe'),
        v.literal('new_rating')
      )
    ), // optional filter by type
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx); // user must be logged in
    const userId = currentUser.externalId;

    let notificationsQuery; // base query definition

    if (args.type) {
      // If type specified, fetch unread notifications of that type
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUserAndType', (q) =>
          q.eq('userId', userId).eq('type', args.type!)
        )
        .filter((q) => q.eq(q.field('read'), false));
    } else {
      // Otherwise fetch all unread notifications for the user
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUserAndRead', (q) =>
          q.eq('userId', userId).eq('read', false)
        );
    }

    const unreadNotifications = await notificationsQuery.collect(); // get all unread
    const updatePromises = unreadNotifications.map((notification) =>
      ctx.db.patch(notification._id, { read: true })
    );

    await Promise.all(updatePromises); // mark each as read

    return {
      success: true,
      updatedCount: unreadNotifications.length,
    };
  },
});
/**
 * Count unread notifications for the current user.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx); // optional auth
    if (!currentUser) {
      return 0; // unauthenticated users have zero notifications
    }

    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('byUserAndRead', (q) =>
        q.eq('userId', currentUser.externalId).eq('read', false)
      )
      .collect();

    return unreadNotifications.length; // total unread count
  },
});
/**
 * Get unread notification counts broken down by type.
 */
export const getUnreadCountByType = query({
  args: {},
  handler: async (ctx) => {
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
    unreadNotifications.forEach((notification) => {
      counts[notification.type]++;
    });

    return counts;
  },
});
