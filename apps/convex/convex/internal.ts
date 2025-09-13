import { internalMutation } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { v } from 'convex/values';
import {
  userByExternalId,
  createUserIfNotExistsInternal,
} from './internal/userMutations';

// User mutation wrappers to avoid circular dependencies when actions call internal functions
export const updateProfileInternal = internalMutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    image_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    themeColor: v.optional(v.string()), // Legacy field
    primaryColor: v.optional(v.string()), // Primary gradient color
    secondaryColor: v.optional(v.string()), // Secondary gradient color
    interests: v.optional(v.array(v.string())), // User interests
    socials: v.optional(
      v.object({
        twitter: v.optional(v.string()),
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId);
    if (!user) {
      throw new Error('User not found');
    }

    const updates: Partial<Doc<'users'>> = {};

    if (args.username !== undefined) {
      updates.username = args.username;
    }
    if (args.first_name !== undefined) {
      updates.first_name = args.first_name;
    }
    if (args.last_name !== undefined) {
      updates.last_name = args.last_name;
    }
    if (args.image_url !== undefined) {
      updates.image_url = args.image_url;
      updates.profile_image_url = args.image_url; // Keep both fields synced
    }
    if (args.bio !== undefined) {
      updates.bio = args.bio;
    }
    if (args.themeColor !== undefined) {
      updates.themeColor = args.themeColor;
    }
    if (args.primaryColor !== undefined) {
      updates.primaryColor = args.primaryColor;
    }
    if (args.secondaryColor !== undefined) {
      updates.secondaryColor = args.secondaryColor;
    }
    if (args.interests !== undefined) {
      updates.interests = args.interests;
    }
    if (args.socials !== undefined) {
      updates.socials = args.socials;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return await ctx.db.get(user._id);
  },
});

export const completeOnboardingInternal = internalMutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await userByExternalId(ctx, args.externalId);

    // If user doesn't exist, create them first
    if (!user) {
      user = await createUserIfNotExistsInternal(ctx, args.externalId);
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    const updates: Partial<Doc<'users'>> = {
      onboardingCompleted: true,
    };

    if (args.username !== undefined) {
      updates.username = args.username;
    }
    if (args.interests !== undefined) {
      updates.interests = args.interests;
    }
    if (args.image_url !== undefined) {
      updates.image_url = args.image_url;
      updates.profile_image_url = args.image_url; // Keep both fields synced
    }

    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});

export const updateOnboardingDataInternal = internalMutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await userByExternalId(ctx, args.externalId);

    // If user doesn't exist, create them first
    if (!user) {
      user = await createUserIfNotExistsInternal(ctx, args.externalId);
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    const updates: Partial<Doc<'users'>> = {};

    if (args.username !== undefined) {
      updates.username = args.username;
    }
    if (args.first_name !== undefined) {
      updates.first_name = args.first_name;
    }
    if (args.last_name !== undefined) {
      updates.last_name = args.last_name;
    }
    if (args.interests !== undefined) {
      updates.interests = args.interests;
    }
    if (args.image_url !== undefined) {
      updates.image_url = args.image_url;
      updates.profile_image_url = args.image_url; // Keep both fields synced
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return await ctx.db.get(user._id);
  },
});

// PERFORMANCE OPTIMIZED: Batch notification creation to reduce N+1 queries
export const createBatchNotifications = internalMutation({
  args: {
    notifications: v.array(
      v.object({
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
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.notifications.length === 0) {
      return [];
    }

    const now = Date.now();

    // Get all unique user IDs to batch validate users exist
    const allUserIds = new Set<string>();
    args.notifications.forEach((notif) => {
      allUserIds.add(notif.userId);
      allUserIds.add(notif.triggerUserId);
    });

    // Batch query to check all users exist - MAJOR PERFORMANCE IMPROVEMENT
    const existingUsers = await ctx.db
      .query('users')
      .filter((q) =>
        q.or(
          ...Array.from(allUserIds).map((id) => q.eq(q.field('externalId'), id))
        )
      )
      .collect();

    const existingUserIds = new Set(existingUsers.map((u) => u.externalId));

    // Filter out notifications where users don't exist or self-notifications
    const validNotifications = args.notifications.filter(
      (notif) =>
        notif.userId !== notif.triggerUserId &&
        existingUserIds.has(notif.userId) &&
        existingUserIds.has(notif.triggerUserId)
    );

    // Batch insert all valid notifications
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
