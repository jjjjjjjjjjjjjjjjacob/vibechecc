import { mutation } from './_generated/server';

// One-time cleanup mutation to remove excessive duplicate search history entries
export const cleanupDuplicateSearchHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User must be authenticated');
    }

    // Get all search history for the current user
    const allSearchHistory = await ctx.db
      .query('searchHistory')
      .withIndex('byUser', (q: any) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();

    // Group by query and keep only the most recent entry for each unique query
    const uniqueSearches = new Map<string, any>();
    const duplicatesToDelete: string[] = [];

    for (const search of allSearchHistory) {
      const key = search.query.toLowerCase().trim();
      
      if (!uniqueSearches.has(key)) {
        // Keep the first (most recent) occurrence
        uniqueSearches.set(key, search);
      } else {
        // Mark duplicates for deletion
        duplicatesToDelete.push(search._id);
      }
    }

    // Delete all duplicates
    for (const id of duplicatesToDelete) {
      await ctx.db.delete(id);
    }

    return {
      totalSearches: allSearchHistory.length,
      uniqueSearches: uniqueSearches.size,
      duplicatesRemoved: duplicatesToDelete.length,
    };
  },
});