import { mutation, query, internalMutation, QueryCtx } from './_generated/server';
import { v, Validator } from 'convex/values';
import type { UserJSON } from "@clerk/backend";

// Get all users
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

// Get a user by ID (supports both legacy id and externalId)
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // First try by legacy id field
    const userByLegacyId = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first();
    
    if (userByLegacyId) {
      return userByLegacyId;
    }
    
    // Then try by externalId (Clerk user ID)
    return await userByExternalId(ctx, args.id);
  },
});

// Get current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Create a new user (legacy function - maintained for backward compatibility)
export const create = mutation({
  args: {
    id: v.string(),
    username: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, args) => {
    const joinDate = new Date().toISOString();

    // Check if user already exists by legacy id
    const existingUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first();

    if (existingUser) {
      return existingUser;
    }

    return await ctx.db.insert('users', {
      id: args.id,
      username: args.username,
      avatar: args.avatar,
      joinDate,
    });
  },
});

// Update a user (legacy function - updated to handle new schema)
export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first();

    if (!user) {
      throw new Error(`User with ID ${args.id} not found`);
    }

    const updates: Record<string, string> = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.avatar !== undefined) {
      updates.avatar = args.avatar;
    }

    if (Object.keys(updates).length > 0) {
      return await ctx.db.patch(user._id, updates);
    }

    return user;
  },
});

// Update user profile mutation for new schema
export const updateProfile = mutation({
  args: {
    username: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const updates: Record<string, string> = {};

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

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return await ctx.db.get(user._id);
  },
});

// WEBHOOK MUTATIONS FOR CLERK INTEGRATION

// Internal mutation for webhook upsert events (user.created, user.updated)
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      externalId: data.id,
      username: data.username || undefined,
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      image_url: data.image_url || undefined,
      profile_image_url: data.image_url || undefined,
      has_image: data.has_image || undefined,
      primary_email_address_id: data.primary_email_address_id || undefined,
      last_sign_in_at: data.last_sign_in_at || undefined,
      last_active_at: data.last_active_at || undefined,
      created_at: data.created_at || undefined,
      updated_at: data.updated_at || undefined,
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

// Internal mutation for webhook delete events (user.deleted)
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

// HELPER FUNCTIONS

// Get user by Clerk external ID using index
async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}

// Get current authenticated user from Clerk JWT
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

// Get current authenticated user or throw error
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) {
    throw new Error("Can't get current user");
  }
  return userRecord;
}

// LEGACY FUNCTIONS (maintained for backward compatibility)

// Get the current user's vibes
export const getCurrentUserVibes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('createdById'), args.userId))
      .collect();
  },
});

// Seed a demo user if none exists
export const seedDemoUser = mutation({
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query('users').collect();

    if (existingUsers.length === 0) {
      // Create a demo user
      const userId = 'demo-user';
      await ctx.db.insert('users', {
        id: userId,
        username: 'Demo User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        joinDate: new Date().toISOString(),
      });

      // Create some demo vibes
      const vibe1Id = 'demo-vibe-1';
      await ctx.db.insert('vibes', {
        id: vibe1Id,
        title: 'Morning Coffee Vibe',
        description:
          'Perfect for starting your day with a calm, focused energy',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
        createdById: userId,
        createdAt: new Date().toISOString(),
        tags: ['morning', 'calm', 'focus'],
      });

      const vibe2Id = 'demo-vibe-2';
      await ctx.db.insert('vibes', {
        id: vibe2Id,
        title: 'Summer Beach Sunset',
        description: 'Relaxing beach vibes with golden hour lighting',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        createdById: userId,
        createdAt: new Date().toISOString(),
        tags: ['summer', 'beach', 'sunset', 'relaxing'],
      });

      // Add some ratings
      await ctx.db.insert('ratings', {
        vibeId: vibe1Id,
        userId,
        rating: 4,
        review: 'Really helps me get into the right mindset in the morning!',
        date: new Date().toISOString(),
      });

      // Add emoji reactions
      await ctx.db.insert('reactions', {
        vibeId: vibe1Id,
        emoji: '☕',
        userId,
      });

      await ctx.db.insert('reactions', {
        vibeId: vibe2Id,
        emoji: '🌅',
        userId,
      });

      return {
        success: true,
        message: 'Demo user and data created successfully',
      };
    }

    return {
      success: false,
      message: 'Users already exist, skipping seed',
    };
  },
});
