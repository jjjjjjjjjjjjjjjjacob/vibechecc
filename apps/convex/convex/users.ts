import {
  mutation,
  query,
  internalMutation,
  internalQuery,
  action,
  internalAction,
  QueryCtx,
  MutationCtx,
} from './_generated/server';
import { v, Validator } from 'convex/values';
import type { UserJSON } from '@clerk/backend';
import { internal } from './_generated/api';
import { AuthUtils, SecurityValidators } from './lib/securityValidators';

// PostHog configuration for server-side tracking
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://app.posthog.com';

// Helper function to get user by externalId
export async function userByExternalId(
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

// Note: createUserIfNotExistsInternal has been moved to internal/userMutations.ts

// Get all users - RESTRICTED: Only for authenticated admin users
export const getAll = query({
  handler: async (ctx) => {
    // SECURITY: Require admin privileges for user list access
    await AuthUtils.requireAdmin(ctx);

    // SECURITY: Only return limited public profile data
    const users = await ctx.db.query('users').collect();
    return users.map((user) => ({
      _id: user._id,
      externalId: user.externalId,
      username: user.username,
      image_url: user.image_url,
      profile_image_url: user.profile_image_url,
      created_at: user.created_at,
      // Do not expose sensitive fields like email, interests, etc.
    }));
  },
});

// Get a user by externalId (Clerk user ID) - SECURITY ENHANCED
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await userByExternalId(ctx, args.id);

    if (!user) {
      return null;
    }

    // SECURITY: Only return full data if accessing own profile or authenticated
    const isOwnProfile = identity?.subject === args.id;

    if (isOwnProfile) {
      // Return full profile data for own profile
      return user;
    } else {
      // Return limited public data for other users
      return {
        _id: user._id,
        externalId: user.externalId,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        image_url: user.image_url,
        profile_image_url: user.profile_image_url,
        bio: user.bio,
        created_at: user.created_at,
        // Do not expose private fields like interests, socials, etc.
      };
    }
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('byUsername', (q) => q.eq('username', args.username))
      .first();
  },
});

// Get most interacted-with user (for onboarding demo)
export const getMostFollowedUser = query({
  handler: async (ctx) => {
    // Get users with completed onboarding
    const users = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('onboardingCompleted'), true))
      .order('desc')
      .take(200);

    if (users.length === 0) {
      return null;
    }

    // Calculate interaction score for each user (followers + total vibe interactions)
    const usersWithInteractionScore = await Promise.all(
      users.map(async (user) => {
        // Get user's vibes
        const vibes = await ctx.db
          .query('vibes')
          .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
          .collect();

        // Get total ratings on user's vibes
        let totalVibeInteractions = 0;
        for (const vibe of vibes) {
          const ratings = await ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .collect();

          totalVibeInteractions += ratings.length;
        }

        // Calculate total interaction score: followers + vibe interactions
        const totalInteractionScore =
          (user.followerCount ?? 0) + totalVibeInteractions;

        return {
          ...user,
          vibesCount: vibes.length,
          totalVibeInteractions,
          totalInteractionScore,
        };
      })
    );

    // Sort by total interaction score to find the most interacted-with
    const sortedUsers = usersWithInteractionScore.sort(
      (a, b) => b.totalInteractionScore - a.totalInteractionScore
    );

    return sortedUsers[0];
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

// Update a user by externalId (Clerk user ID) - SECURITY ENHANCED
export const update = mutation({
  args: {
    externalId: v.string(),
    username: v.optional(v.string()),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Authentication required to update user');
    }

    // SECURITY: Only allow users to update their own profile
    if (identity.subject !== args.externalId) {
      throw new Error('You can only update your own profile');
    }

    const user = await userByExternalId(ctx, args.externalId);

    if (!user) {
      throw new Error(`User with externalId ${args.externalId} not found`);
    }

    const updates: Record<string, string | number> = {};

    if (args.username !== undefined) {
      // SECURITY: Validate username format using centralized validator
      const validatedUsername = SecurityValidators.validateUsername(
        args.username
      );
      if (validatedUsername === null) {
        throw new Error('Invalid username provided');
      }
      updates.username = args.username;
    }

    if (args.image_url !== undefined) {
      updates.image_url = args.image_url;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = Date.now();
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
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    // Call the internal mutation to avoid circular dependency
    // @ts-expect-error - Type instantiation is excessively deep - Convex circular reference workaround
    return await ctx.runMutation(internal.internal.updateProfileInternal, {
      externalId: identity.subject,
      ...args,
    });
  },
});

// Note: internalUpdateProfile has been moved to internal/userMutations.ts

// ONBOARDING ACTIONS (updated to sync with Clerk)

// Complete onboarding process ACTION (simplified - only updates Convex)
export const completeOnboarding = action({
  args: {
    username: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    // Call the internal mutation to avoid circular dependency
    return await ctx.runMutation(internal.internal.completeOnboardingInternal, {
      externalId: identity.subject,
      ...args,
    });
  },
});

// Note: completeOnboardingInternal has been moved to internal/userMutations.ts

// Update onboarding step data ACTION (simplified - only updates Convex)
export const updateOnboardingData = action({
  args: {
    username: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    // Call the internal mutation to avoid circular dependency
    return await ctx.runMutation(
      internal.internal.updateOnboardingDataInternal,
      {
        externalId: identity.subject,
        ...args,
      }
    );
  },
});

// Note: updateOnboardingDataInternal has been moved to internal/userMutations.ts

// SECURITY: Debug authentication - RESTRICTED TO DEVELOPMENT ONLY
export const debugAuth = query({
  handler: async (ctx) => {
    // SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Debug functions are not available in production');
    }

    // Allow debug access with or without authentication for testing
    const identity = await ctx.auth.getUserIdentity();

    try {
      return {
        hasAuth: !!ctx.auth,
        hasIdentity: !!identity,
        hasToken: false, // Not available in queries
        // SECURITY: Limited identity info only
        identity: identity
          ? {
              subject: identity.subject,
              tokenIdentifier:
                identity.tokenIdentifier?.substring(0, 10) + '...', // Truncated
              hasEmail: !!identity.hasEmail,
              environment: process.env.NODE_ENV || 'unknown',
            }
          : null,
      };
    } catch {
      return {
        hasAuth: !!ctx.auth,
        hasIdentity: false,
        hasToken: false,
        error: 'Debug error occurred',
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

// Internal query to list all users - for testing purposes only
export const listAll = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

// WEBHOOK MUTATIONS FOR CLERK INTEGRATION

// Internal mutation for webhook upsert events (user.created, user.updated)
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const existingUser = await userByExternalId(ctx, data.id);
    const isNewUser = existingUser === null;

    // Log new user signup
    if (isNewUser) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] New signup processed: ${data.id}`);
    }

    // SECURITY: Validate username from Clerk to ensure consistency
    let validatedUsername = data.username || undefined;
    if (validatedUsername) {
      try {
        validatedUsername =
          SecurityValidators.validateUsername(validatedUsername) || undefined;
      } catch (error) {
        // Log validation error but don't fail the webhook - use undefined instead
        // eslint-disable-next-line no-console
        console.warn(
          `Clerk username validation failed for user ${data.id}:`,
          error
        );
        validatedUsername = undefined;
      }
    }

    const userAttributes = {
      externalId: data.id,
      username: validatedUsername,
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

    if (isNewUser) {
      await ctx.db.insert('users', userAttributes);
    } else {
      await ctx.db.patch(existingUser._id, userAttributes);
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

/**
 * Track session events (sign-in/sign-out) to PostHog via server-side HTTP API
 * This ensures reliable session tracking from Clerk webhooks
 */
export const trackSessionEvent = internalAction({
  args: {
    userId: v.string(),
    eventType: v.union(
      v.literal('session_created'),
      v.literal('session_ended')
    ),
    timestamp: v.number(),
    metadata: v.optional(
      v.object({
        sessionId: v.optional(v.string()),
        clientId: v.optional(v.string()),
        status: v.optional(v.string()),
        abandonedAt: v.optional(v.number()),
        endedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { userId, eventType, timestamp, metadata }) => {
    if (!POSTHOG_API_KEY) {
      // eslint-disable-next-line no-console
      console.warn(
        'PostHog API key not configured, skipping server-side session tracking'
      );
      return { success: false, reason: 'no_api_key' };
    }

    try {
      // Map event type to PostHog event name
      const posthogEventName =
        eventType === 'session_created' ? 'user_signed_in' : 'user_signed_out';

      // Track the session event
      const sessionPayload = {
        api_key: POSTHOG_API_KEY,
        event: posthogEventName,
        distinct_id: userId,
        properties: {
          session_id: metadata?.sessionId,
          client_id: metadata?.clientId,
          status: metadata?.status,
          abandoned_at: metadata?.abandonedAt
            ? new Date(metadata.abandonedAt).toISOString()
            : undefined,
          ended_at: metadata?.endedAt
            ? new Date(metadata.endedAt).toISOString()
            : undefined,
          timestamp: new Date(timestamp).toISOString(),
          source: 'server_webhook',
          $lib: 'convex-server',
          $lib_version: '1.0.0',
        },
      };

      const response = await fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionPayload),
      });

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to track ${eventType} to PostHog:`,
          response.status,
          response.statusText
        );
        return {
          success: false,
          reason: 'http_error',
          status: response.status,
        };
      }

      // eslint-disable-next-line no-console
      console.log(
        `Successfully tracked ${eventType} for user ${userId} to PostHog`
      );
      return { success: true, userId, eventType };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error tracking ${eventType} to PostHog:`, error);
      return { success: false, reason: 'network_error', error: String(error) };
    }
  },
});

// Create user for seeding purposes (bypasses authentication) - SECURED
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
    // SECURITY: Strict environment and authentication checks
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Seed functions are not available in production environment'
      );
    }

    // SECURITY: Additional check for test/development environment
    if (!process.env.VITEST && process.env.NODE_ENV !== 'development') {
      throw new Error(
        'Seed functions only available in test or development environments'
      );
    }

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

/**
 * Track user signup event to PostHog via server-side HTTP API
 * This ensures 100% reliable signup tracking from Clerk webhooks
 */
export const trackUserSignup = internalAction({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    signupMethod: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (
    ctx,
    {
      userId,
      email,
      username,
      firstName,
      lastName,
      signupMethod = 'clerk',
      createdAt,
    }
  ) => {
    if (!POSTHOG_API_KEY) {
      // eslint-disable-next-line no-console
      console.warn(
        'PostHog API key not configured, skipping server-side signup tracking'
      );
      return { success: false, reason: 'no_api_key' };
    }

    try {
      // Track the signup event
      const signupPayload = {
        api_key: POSTHOG_API_KEY,
        event: 'user_signed_up',
        distinct_id: userId,
        properties: {
          email,
          username,
          first_name: firstName,
          last_name: lastName,
          method: signupMethod,
          source: 'server_webhook',
          created_at: createdAt
            ? new Date(createdAt).toISOString()
            : new Date().toISOString(),
          $lib: 'convex-server',
          $lib_version: '1.0.0',
        },
      };

      const signupResponse = await fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupPayload),
      });

      if (!signupResponse.ok) {
        // eslint-disable-next-line no-console
        console.error(
          'Failed to track signup to PostHog:',
          signupResponse.status,
          signupResponse.statusText
        );
        return {
          success: false,
          reason: 'http_error',
          status: signupResponse.status,
        };
      }

      // Set user properties for better targeting
      const identifyPayload = {
        api_key: POSTHOG_API_KEY,
        event: '$identify',
        distinct_id: userId,
        properties: {
          $set: {
            email,
            username,
            first_name: firstName,
            last_name: lastName,
            signup_method: signupMethod,
            signup_date: createdAt
              ? new Date(createdAt).toISOString()
              : new Date().toISOString(),
            is_new_user: true,
            user_source: 'server_webhook',
          },
        },
      };

      const identifyResponse = await fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(identifyPayload),
      });

      if (!identifyResponse.ok) {
        // eslint-disable-next-line no-console
        console.warn(
          'Failed to set user properties in PostHog:',
          identifyResponse.status
        );
        // Don't fail the whole operation for this
      }

      // eslint-disable-next-line no-console
      console.log(`Successfully tracked signup for user ${userId} to PostHog`);
      return { success: true, userId, email };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error tracking signup to PostHog:', error);
      return { success: false, reason: 'network_error', error: String(error) };
    }
  },
});
