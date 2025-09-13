import {
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from '../_generated/server';
import { v } from 'convex/values';

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

// Helper function to create user if not exists (internal)
export async function createUserIfNotExistsInternal(
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

// Internal mutation for updating profile (called by action)
export const internalUpdateProfile = internalMutation({
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

    const updates: Partial<{
      username: string;
      first_name: string;
      last_name: string;
      image_url: string;
      profile_image_url: string;
      bio: string;
      themeColor: string;
      primaryColor: string;
      secondaryColor: string;
      interests: string[];
      socials: {
        twitter?: string;
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
      };
    }> = {};

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

    const updates: {
      onboardingCompleted: boolean;
      username?: string;
      interests?: string[];
      image_url?: string;
      profile_image_url?: string;
    } = {
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

    const updates: Partial<{
      username: string;
      first_name: string;
      last_name: string;
      interests: string[];
      image_url: string;
      profile_image_url: string;
    }> = {};

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
