import { query } from './_generated/server';

// Debug function to check search history
export const debugSearchHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { error: 'Not authenticated', userId: null, searchHistory: [] };
    }

    const searchHistory = await ctx.db
      .query('searchHistory')
      .withIndex('byUser', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(10);

    const allSearchHistory = await ctx.db
      .query('searchHistory')
      .order('desc')
      .take(20);

    return {
      userId: identity.subject,
      userSearchHistory: searchHistory,
      allSearchHistory: allSearchHistory,
      totalCount: searchHistory.length,
    };
  },
});

