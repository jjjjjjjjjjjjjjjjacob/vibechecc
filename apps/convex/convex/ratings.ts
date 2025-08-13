import { query } from './_generated/server';
import { v } from 'convex/values';

// Get a rating by its ID
export const getById = query({
  args: {
    ratingId: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find the rating by document ID in the ratings table
    try {
      const doc = await ctx.db.get(
        args.ratingId as Parameters<typeof ctx.db.get>[0]
      );
      if (!doc) return null;

      // Check if it's a rating by looking for rating-specific fields
      if (
        'vibeId' in doc &&
        'userId' in doc &&
        'emoji' in doc &&
        'value' in doc
      ) {
        return doc; // Return the rating document
      }
    } catch (error) {
      // Rating ID is not a valid document ID format
      // eslint-disable-next-line no-console
      console.error('Invalid rating ID format:', args.ratingId, error);
    }

    // If not found, return null
    return null;
  },
});
