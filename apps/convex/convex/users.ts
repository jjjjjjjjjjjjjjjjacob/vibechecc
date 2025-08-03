import {
  mutation,
  query,
  internalMutation,
  action,
  QueryCtx,
  MutationCtx,
} from './_generated/server';
import { v, Validator } from 'convex/values';
import type { UserJSON } from '@clerk/backend';
import { internal } from './_generated/api';

// Helper function to get user by externalId
async function userByExternalId(
  ctx: QueryCtx | MutationCtx,
  externalId: string
) {
  return await ctx.db
    .query('users')
    .withIndex('byExternalId', (q) => q.eq('externalId', externalId))
    .first();
}

// Helper function to get current user
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

// Helper function to get current user or throw
export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// Helper function to get current user or create
export async function getCurrentUserOrCreate(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('User not authenticated');
  }

  let user = await userByExternalId(ctx, identity.subject);
  if (!user) {
    const userId = await ctx.db.insert('users', {
      externalId: identity.subject,
      first_name: identity.givenName || undefined,
      last_name: identity.familyName || undefined,
      image_url: identity.pictureUrl || undefined,
      profile_image_url: identity.pictureUrl || undefined,
      username: identity.nickname || undefined,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    user = await ctx.db.get(userId);
  }

  return user;
}

// Helper function to create user if not exists (internal)
async function createUserIfNotExistsInternal(
  ctx: MutationCtx,
  externalId: string
) {
  let user = await userByExternalId(ctx, externalId);
  if (!user) {
    const userId = await ctx.db.insert('users', {
      externalId,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    user = await ctx.db.get(userId);
  }
  return user;
}

// Get all users
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

// Get a user by externalId (Clerk user ID)
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Get user by externalId (Clerk user ID)
    return await userByExternalId(ctx, args.id);
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('username'), args.username))
      .first();
  },
});

// Get current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Create a new user (using externalId as Clerk user ID)
export const create = mutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by externalId
    const existingUser = await userByExternalId(ctx, args.externalId);

    if (existingUser) {
      return existingUser;
    }

    return await ctx.db.insert('users', {
      externalId: args.externalId,
      username: args.username,
      image_url: args.image_url,
      created_at: Date.now(),
    });
  },
});

// Update a user by externalId (Clerk user ID)
export const update = mutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId);

    if (!user) {
      throw new Error(`User with externalId ${args.externalId} not found`);
    }

    const updates: Record<string, string> = {};

    if (args.username !== undefined) {
      updates.username = args.username;
    }

    if (args.image_url !== undefined) {
      updates.image_url = args.image_url;
    }

    if (Object.keys(updates).length > 0) {
      return await ctx.db.patch(user._id, updates);
    }

    return user;
  },
});

// Update user profile ACTION (simplified - only updates Convex)
export const updateProfile = action({
  args: {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    // Update Convex only - Clerk will be updated from frontend
    return await ctx.runMutation(internal.users.updateProfileInternal, {
      externalId: identity.subject,
      ...args,
    });
  },
});

// Internal mutation for updating profile (called by action)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

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

// ONBOARDING ACTIONS (updated to sync with Clerk)

// Complete onboarding process ACTION (simplified - only updates Convex)
export const completeOnboarding = action({
  args: {
    username: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    image_url: v.optional(v.string()),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    // Update Convex only - Clerk will be updated from frontend
    return await ctx.runMutation(internal.users.completeOnboardingInternal, {
      externalId: identity.subject,
      ...args,
    });
  },
});

// Internal mutation for completing onboarding
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
      // console.log('User not found in completeOnboarding, creating...');
      user = await createUserIfNotExistsInternal(ctx, args.externalId);
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
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

// Update onboarding step data ACTION (simplified - only updates Convex)
export const updateOnboardingData = action({
  args: {
    username: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    image_url: v.optional(v.string()),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
    // console.log('updateOnboardingData called with args:', args);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    // console.log('Auth identity:', {
    //   subject: identity.subject,
    //   tokenIdentifier: identity.tokenIdentifier,
    //   givenName: identity.givenName,
    //   familyName: identity.familyName,
    // });

    // Update Convex only - Clerk will be updated from frontend
    return await ctx.runMutation(internal.users.updateOnboardingDataInternal, {
      externalId: identity.subject,
      ...args,
    });
  },
});

// Internal mutation for updating onboarding data
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
    // console.log(
    //   'User after getCurrentUser:',
    //   user ? { _id: user._id, externalId: user.externalId } : 'null'
    // );

    // If user doesn't exist, create them first
    if (!user) {
      // console.log('User not found, creating...');
      user = await createUserIfNotExistsInternal(ctx, args.externalId);
    }

    if (!user) {
      // eslint-disable-next-line no-console
      console.error('Failed to get or create user');
      throw new Error('User not authenticated');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

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

    // console.log('Updates to apply:', updates);

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
      // console.log('Updates applied successfully');
    }

    const updatedUser = await ctx.db.get(user._id);
    // console.log(
    //   'Final user state:',
    //   updatedUser
    //     ? {
    //         _id: updatedUser._id,
    //         externalId: updatedUser.externalId,
    //         username: updatedUser.username,
    //         onboardingCompleted: updatedUser.onboardingCompleted,
    //         interests: updatedUser.interests,
    //         image_url: updatedUser.image_url,
    //         profile_image_url: updatedUser.profile_image_url,
    //         bio: updatedUser.bio,
    //         socials: updatedUser.socials,
    //       }
    //     : 'null'
    // );

    return updatedUser;
  },
});

// Debug authentication (temporary)
export const debugAuth = query({
  handler: async (ctx) => {
    // console.log('debugAuth called');

    // Check if there's any auth context at all
    // console.log('ctx.auth exists:', !!ctx.auth);

    try {
      const identity = await ctx.auth.getUserIdentity();
      // console.log('Full identity object:', identity);

      // Note: Raw token access isn't available in Convex queries
      // console.log('Raw token access not available in queries');

      return {
        hasAuth: !!ctx.auth,
        hasIdentity: !!identity,
        hasToken: false, // Not available in queries
        identity: identity
          ? {
              subject: identity.subject,
              tokenIdentifier: identity.tokenIdentifier,
              givenName: identity.givenName,
              familyName: identity.familyName,
              nickname: identity.nickname,
              pictureUrl: identity.pictureUrl,
              email: identity.email,
            }
          : null,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in debugAuth:', error);
      return {
        hasAuth: !!ctx.auth,
        hasIdentity: false,
        hasToken: false,
        error: error instanceof Error ? error.message : String(error),
        identity: null,
      };
    }
  },
});

// Ensure user exists (mutation to create if needed)
export const ensureUserExists = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    let user = await userByExternalId(ctx, identity.subject);

    if (!user) {
      // console.log(`Creating user for Clerk ID: ${identity.subject}`);
      const userAttributes = {
        externalId: identity.subject,
        first_name: identity.givenName || undefined,
        last_name: identity.familyName || undefined,
        image_url: identity.pictureUrl || undefined,
        profile_image_url: identity.pictureUrl || undefined,
        username: identity.nickname || undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const userId = await ctx.db.insert('users', userAttributes);
      user = await ctx.db.get(userId);
      // console.log(`Created user with ID: ${userId}`);
    }

    return user;
  },
});

// Get user onboarding status
export const getOnboardingStatus = query({
  handler: async (ctx) => {
    // console.log('getOnboardingStatus called');

    // const identity = await ctx.auth.getUserIdentity();
    // console.log(
    //   'Auth identity in getOnboardingStatus:',
    //   identity
    //     ? {
    //         subject: identity.subject,
    //         tokenIdentifier: identity.tokenIdentifier,
    //       }
    //     : 'null'
    // );

    const user = await getCurrentUser(ctx);
    // console.log(
    //   'User in getOnboardingStatus:',
    //   user
    //     ? {
    //         _id: user._id,
    //         externalId: user.externalId,
    //         onboardingCompleted: user.onboardingCompleted,
    //       }
    //     : 'null'
    // );

    if (!user) {
      // console.log('No user found, returning needsOnboarding: true');
      return { completed: false, needsOnboarding: true, userExists: false };
    }

    const result = {
      completed: user.onboardingCompleted || false,
      needsOnboarding: !user.onboardingCompleted,
      userExists: true,
      user,
    };

    // console.log('getOnboardingStatus result:', {
    //   completed: result.completed,
    //   needsOnboarding: result.needsOnboarding,
    //   userId: result.user._id,
    // });

    return result;
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
      await ctx.db.insert('users', userAttributes);
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
      // eslint-disable-next-line no-console
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`
      );
    }
  },
});

// Create user for seeding purposes (bypasses authentication)
export const createForSeed = mutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
    image_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    created_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by externalId
    const existingUser = await userByExternalId(ctx, args.externalId);

    if (existingUser) {
      return existingUser;
    }

    return await ctx.db.insert('users', {
      externalId: args.externalId,
      username: args.username,
      image_url: args.image_url,
      bio: args.bio,
      interests: args.interests,
      created_at: args.created_at || Date.now(),
      updated_at: Date.now(),
      onboardingCompleted: true, // Set to true for seeded users
    });
  },
});

// Privacy-compliant authentication event tracking (internal mutation)
export const trackAuthEvent = internalMutation({
  args: {
    userId: v.string(),
    eventType: v.string(),
    method: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Store privacy-compliant auth event for analytics
    // This data contains no PII and follows data minimization principles
    await ctx.db.insert('authEvents', {
      userId: args.userId, // Clerk user ID (already anonymized)
      eventType: args.eventType,
      method: args.method,
      timestamp: args.timestamp,
      metadata: args.metadata || {},
      createdAt: Date.now(),
    });

    // Optional: Could trigger frontend analytics events via action
    // but this ensures we have server-side audit trail
  },
});
