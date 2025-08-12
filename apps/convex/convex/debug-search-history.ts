import { query } from './_generated/server';

/**
 * Debug-only query that returns the recent search history for the current user
 * along with a sample of global search history.
 *
 * This is intended for local diagnostics and is not exposed in production
 * builds. The handler mirrors normal authentication flows but surfaces raw
 * data to aid inspection of search logging behavior.
 */
export const debugSearchHistory = query({
  // no arguments required; the current user's identity is derived from auth
  args: {},
  handler: async (ctx) => {
    // retrieve the calling user's identity; unauthenticated users receive a
    // simple object noting the absence of credentials
    const identity = await ctx.auth.getUserIdentity();

    // abort early when unauthenticated to avoid leaking any history records
    if (!identity) {
      return { error: 'Not authenticated', userId: null, searchHistory: [] };
    }

    // fetch the 10 most recent entries for the current user using the indexed
    // "byUser" view to avoid a full table scan
    const searchHistory = await ctx.db
      .query('searchHistory')
      .withIndex('byUser', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(10);

    // also gather a global sample of the latest 20 searches to compare patterns
    const allSearchHistory = await ctx.db
      .query('searchHistory')
      .order('desc')
      .take(20);

    // package both the user-specific and global history along with counts for
    // quick inspection in development tools
    return {
      userId: identity.subject,
      userSearchHistory: searchHistory,
      allSearchHistory: allSearchHistory,
      totalCount: searchHistory.length,
    };
  },
});
