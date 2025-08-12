import { query } from './_generated/server'; // import Convex helper to define server-side queries
import { v } from 'convex/values'; // runtime validators ensure arguments match expected types

/**
 * Fetch a rating document by its Convex document identifier.
 * This is primarily used by web clients to dereference ratings embedded
 * in other documents without performing a full query.
 */
export const getById = query({
  // every query should validate its arguments to avoid unexpected runtime errors
  args: {
    ratingId: v.string(), // caller must provide the rating's document id as a string
  },
  handler: async (ctx, args) => {
    try {
      // attempt to load the document; Convex throws if the id is malformed
      const doc = await ctx.db.get(args.ratingId as any);
      if (!doc) return null; // return early when the id does not exist

      // ensure the retrieved document actually looks like a rating since get()
      // may resolve any collection when given a valid id
      if (
        'vibeId' in doc && // the vibe being rated
        'userId' in doc && // who submitted the rating
        'emoji' in doc && // which emoji was used for the rating
        'value' in doc // numeric weight for the emoji
      ) {
        return doc as any; // cast to the rating type once validated
      }
    } catch (error) {
      // non-existent or malformed ids throw; log for debugging but don't crash
      console.error('invalid rating id format:', args.ratingId, error);
    }

    // if we reach here the id was invalid or not a rating document
    return null;
  },
});
