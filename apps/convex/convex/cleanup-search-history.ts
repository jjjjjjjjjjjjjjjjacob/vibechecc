import { mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';

/**
 * Cleans up a user's search history by removing older duplicate entries.
 *
 * This mutation is intended as a one-off utility to shrink the searchHistory
 * table when users have thousands of repeated searches.  It keeps the most
 * recent record for each unique query and deletes the rest.
 */
export const cleanupDuplicateSearchHistory = mutation({
  // no arguments are required; the mutation always operates on the caller
  // identified through the auth context
  args: {},
  handler: async (ctx) => {
    // Look up the calling user; bail out if the request is unauthenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Convex best practice: throw an error when authentication fails
      throw new Error('User must be authenticated');
    }

    // Fetch all history rows for the user using the byUser index so the
    // scan remains efficient even on large datasets
    const allSearchHistory = await ctx.db
      .query('searchHistory')
      .withIndex('byUser', (q) => q.eq('userId', identity.subject))
      .order('desc') // ensure newest entries appear first
      .collect();

    // We'll track the first time we see each normalized query string and
    // accumulate ids of any subsequent duplicates that should be removed
    const uniqueSearches = new Map<string, (typeof allSearchHistory)[0]>();
    const duplicatesToDelete: Id<'searchHistory'>[] = [];

    for (const search of allSearchHistory) {
      // Normalize the query to make comparisons case-insensitive and ignore
      // extraneous whitespace
      const key = search.query.toLowerCase().trim();
      if (!uniqueSearches.has(key)) {
        // When we encounter a query for the first time, store it so later
        // duplicates can be identified
        uniqueSearches.set(key, search);
      } else {
        // Any subsequent instance of the same query is considered a duplicate
        // and marked for deletion
        duplicatesToDelete.push(search._id);
      }
    }

    // Remove every duplicate entry in a separate loop to avoid mutating the
    // table while iterating over the original result set
    for (const id of duplicatesToDelete) {
      await ctx.db.delete(id);
    }

    // Provide summary statistics so callers know how many rows were affected
    return {
      totalSearches: allSearchHistory.length,
      uniqueSearches: uniqueSearches.size,
      duplicatesRemoved: duplicatesToDelete.length,
    };
  },
});
