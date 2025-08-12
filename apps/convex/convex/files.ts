import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Generate a signed upload URL and enforce authentication.
 * @returns A temporary URL for uploading a file to Convex storage.
 */
export const generateUploadUrl = mutation({
  // Main request handler for the mutation
  handler: async (ctx) => {
    // Check if user is authenticated before allowing uploads
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Abort if the user is not logged in
      throw new Error('You must be logged in to upload files');
    }

    // Generate and return a signed upload URL from Convex storage
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Retrieve a public URL for a file stored in Convex.
 * @param storageId Optional storage ID referencing the file.
 * @returns A public URL string or null if no ID was provided.
 */
export const getUrl = query({
  // Declare accepted arguments with Convex validators
  args: { storageId: v.optional(v.id('_storage')) },
  handler: async (ctx, args) => {
    // Immediately return null when no storage ID was supplied
    if (!args.storageId) {
      return null;
    }

    // Resolve and return the file's public URL from storage
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Delete a file from Convex storage by its ID.
 * @param storageId The identifier of the file in Convex storage.
 */
export const deleteFile = mutation({
  // Validate that a storage ID is provided
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    // Ensure the caller is authenticated before deletion
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Reject unauthorized delete attempts
      throw new Error('You must be logged in to delete files');
    }

    try {
      // Attempt to remove the file from storage
      await ctx.storage.delete(args.storageId);
    } catch {
      // Convert storage errors into a friendly message
      throw new Error('File not found or cannot be deleted');
    }
  },
});
