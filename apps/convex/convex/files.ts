import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Upload a file and return the file ID
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to upload files');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Get a file URL by file ID
export const getUrl = query({
  args: { storageId: v.optional(v.id('_storage')) },
  handler: async (ctx, args) => {
    if (!args.storageId) {
      return null;
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete a file by file ID
export const deleteFile = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to delete files');
    }

    await ctx.storage.delete(args.storageId);
  },
});
