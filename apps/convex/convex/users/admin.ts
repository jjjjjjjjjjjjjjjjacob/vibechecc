import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Internal mutation to update user admin status based on Clerk org role
 * This is called by the webhook handler when organization membership changes
 */
export const updateAdminStatus = internalMutation({
  args: {
    externalId: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', args.externalId))
      .first();

    if (!user) {
      console.warn(`User with externalId ${args.externalId} not found`);
      return { success: false, error: 'User not found' };
    }

    await ctx.db.patch(user._id, {
      isAdmin: args.isAdmin,
    });

    console.log(
      `Updated admin status for user ${user.username}: isAdmin=${args.isAdmin}`
    );

    return {
      success: true,
      userId: user._id,
      username: user.username,
      isAdmin: args.isAdmin,
    };
  },
});
