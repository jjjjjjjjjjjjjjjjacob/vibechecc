import { mutation } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Temporary mutation to remove admin status
 * For development/testing only
 */
export const removeUserAdmin = mutation({
  args: {
    username: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user;
    
    if (args.username) {
      user = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('username'), args.username))
        .first();
    } else if (args.externalId) {
      user = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', args.externalId))
        .first();
    }
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await ctx.db.patch(user._id, {
      isAdmin: false,
    });
    
    return { 
      success: true, 
      userId: user._id,
      username: user.username,
      externalId: user.externalId,
    };
  },
});

/**
 * Query to check admin users
 */
export const listAdminUsers = mutation({
  handler: async (ctx) => {
    const adminUsers = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('isAdmin'), true))
      .collect();
    
    return adminUsers.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    }));
  },
});