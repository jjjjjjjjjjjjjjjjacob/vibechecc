import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import type {
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ActionSearchResult,
  ReviewSearchResult,
} from '@viberater/types';
import { fuzzyMatch } from './search/fuzzy_search';
import { scoreVibe, scoreUser, scoreTag } from './search/search_scorer';
import { parseSearchQuery } from './search/search_utils';

// Constants for pagination
const MAX_RESULTS_PER_PAGE = 50;
const DEFAULT_RESULTS_PER_PAGE = 20;

// Helper function to build filter expressions for search queries
function buildSearchFilter(parsedQuery: any, field: string) {
  const filters: any[] = [];

  // Add term filters
  if (parsedQuery.terms.length > 0) {
    filters.push((q: any) => {
      const termFilters = parsedQuery.terms.map((term: string) =>
        q.search(field, term)
      );
      return q.or(...termFilters);
    });
  }

  // Add exact phrase filters
  if (parsedQuery.exactPhrases.length > 0) {
    filters.push((q: any) => {
      const phraseFilters = parsedQuery.exactPhrases.map((phrase: string) =>
        q.search(field, phrase)
      );
      return q.and(...phraseFilters);
    });
  }

  return filters.length > 0
    ? (q: any) => q.and(...filters.map((f) => f(q)))
    : null;
}

// Main search function with optimized implementation
export const searchAll = query({
  args: {
    query: v.string(),
    filters: v.optional(
      v.object({
        tags: v.optional(v.array(v.string())),
        minRating: v.optional(v.number()),
        maxRating: v.optional(v.number()),
        dateRange: v.optional(
          v.object({
            start: v.string(),
            end: v.string(),
          })
        ),
        creators: v.optional(v.array(v.string())),
        sort: v.optional(
          v.union(
            v.literal('relevance'),
            v.literal('rating_desc'),
            v.literal('rating_asc'),
            v.literal('top_rated'),
            v.literal('most_rated'),
            v.literal('recent'),
            v.literal('oldest'),
            v.literal('name'),
            v.literal('creation_date'),
            v.literal('interaction_time')
          )
        ),
        emojiRatings: v.optional(
          v.object({
            emojis: v.optional(v.array(v.string())),
            minValue: v.optional(v.number()),
          })
        ),
      })
    ),
    paginationOpts: paginationOptsValidator,
    includeTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, filters, paginationOpts, includeTypes } = args;


    const results = {
      vibes: [] as VibeSearchResult[],
      users: [] as UserSearchResult[],
      tags: [] as TagSearchResult[],
      actions: [] as ActionSearchResult[],
      reviews: [] as ReviewSearchResult[],
      totalCount: 0,
      nextCursor: null as string | null,
    };

    // Allow empty query if we have filters
    if (!searchQuery.trim() && !filters) {
      return results;
    }

    // Parse the query for advanced operators
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchText = parsedQuery.terms
      .concat(parsedQuery.exactPhrases)
      .join(' ')
      .toLowerCase();

    // Merge parsed filters with provided filters
    const mergedFilters = {
      ...filters,
      tags: filters?.tags
        ? filters.tags.concat(parsedQuery.tags)
        : parsedQuery.tags,
      minRating: filters?.minRating || parsedQuery.filters.minRating,
      maxRating: filters?.maxRating || parsedQuery.filters.maxRating,
      dateRange:
        filters?.dateRange ||
        (parsedQuery.filters.dateAfter || parsedQuery.filters.dateBefore
          ? {
              start: parsedQuery.filters.dateAfter || '1970-01-01',
              end:
                parsedQuery.filters.dateBefore ||
                new Date().toISOString().split('T')[0],
            }
          : undefined),
      creators:
        filters?.creators ||
        (parsedQuery.filters.user
          ? new Array(parsedQuery.filters.user)
          : undefined),
    };

    // Limit page size to prevent excessive memory usage
    const pageSize = Math.min(
      paginationOpts.numItems || DEFAULT_RESULTS_PER_PAGE,
      MAX_RESULTS_PER_PAGE
    );

    // Search vibes using indexes
    if (!includeTypes || includeTypes.includes('vibe')) {
      let vibesQuery: any = ctx.db.query('vibes');

      // For emoji filter without search text, we need a different approach
      if (!searchText && mergedFilters.emojiRatings?.emojis?.length) {
        // We'll filter all vibes in memory since we can't use index for emoji ratings
        vibesQuery = ctx.db.query('vibes');
      } else if (searchText) {
        // Use search index if we have search terms
        vibesQuery = ctx.db
          .query('vibes')
          .withSearchIndex('searchTitle', (q) => q.search('title', searchText));
      }

      // Apply creator filter using index
      if (mergedFilters.creators && mergedFilters.creators.length > 0) {
        // For multiple creators, we need to fetch separately and merge
        const creatorResults = await Promise.all(
          mergedFilters.creators.map((creatorId) =>
            ctx.db
              .query('vibes')
              .withIndex('createdBy', (q) => q.eq('createdById', creatorId))
              .paginate(paginationOpts)
          )
        );

        // Merge and deduplicate results
        const allVibes = new Map();
        for (const result of creatorResults) {
          for (const vibe of result.page) {
            allVibes.set(vibe._id, vibe);
          }
        }

        // Process vibes with filters
        for (const vibe of allVibes.values()) {
          if (
            await processVibe(
              ctx,
              vibe,
              mergedFilters,
              searchText,
              parsedQuery,
              results
            )
          ) {
            if (results.vibes.length >= pageSize) break;
          }
        }
      } else {
        // Apply date range filter if specified
        if (mergedFilters.dateRange) {
          vibesQuery = vibesQuery.withIndex('byCreatedAt', (q: any) =>
            q
              .gte('createdAt', mergedFilters.dateRange!.start)
              .lte('createdAt', mergedFilters.dateRange!.end)
          );
        }

        // Paginate results
        const vibesPaginated = await vibesQuery.paginate(paginationOpts);

        // Process each vibe
        for (const vibe of vibesPaginated.page) {
          if (
            await processVibe(
              ctx,
              vibe,
              mergedFilters,
              searchText,
              parsedQuery,
              results
            )
          ) {
            if (results.vibes.length >= pageSize) break;
          }
        }

        results.nextCursor = vibesPaginated.continueCursor;
      }
    }

    // Search users using search indexes
    if (!includeTypes || includeTypes.includes('user')) {
      let usersQuery: any = ctx.db.query('users');

      // Use search index if we have search terms
      if (searchText) {
        usersQuery = ctx.db
          .query('users')
          .withSearchIndex('searchUsername', (q) =>
            q.search('username', searchText)
          );
      }

      const usersPaginated = await usersQuery.paginate(paginationOpts);

      for (const user of usersPaginated.page) {
        if (
          await processUser(
            ctx,
            user,
            mergedFilters,
            searchText,
            parsedQuery,
            results
          )
        ) {
          if (results.users.length >= pageSize) break;
        }
      }
    }

    // Search reviews using search index
    if (!includeTypes || includeTypes.includes('review')) {
      if (searchText) {
        const reviewsQuery = ctx.db
          .query('ratings')
          .withSearchIndex('searchReview', (q) =>
            q.search('review', searchText)
          );

        const reviewsPaginated = await reviewsQuery.paginate(paginationOpts);

        for (const rating of reviewsPaginated.page) {
          if (
            await processReview(
              ctx,
              rating,
              mergedFilters,
              searchText,
              parsedQuery,
              results
            )
          ) {
            if (results.reviews.length >= pageSize) break;
          }
        }
      }
    }

    // Search tags (still needs optimization with dedicated tags table)
    if (!includeTypes || includeTypes.includes('tag')) {
      const tagsQuery = ctx.db
        .query('tags')
        .withSearchIndex('search', (q) => q.search('name', searchText));

      const tagsPaginated = await tagsQuery.paginate(paginationOpts);

      for (const tag of tagsPaginated.page) {
        const score = scoreTag(
          {
            name: tag.name,
            count: tag.count,
          },
          searchText
        );

        results.tags.push({
          id: tag.name,
          type: 'tag',
          title: tag.name,
          subtitle: `${tag.count} vibe${tag.count !== 1 ? 's' : ''}`,
          count: tag.count,
          score,
        });

        if (results.tags.length >= pageSize) break;
      }
    }

    // Add action suggestions (no pagination needed)
    if (!includeTypes || includeTypes.includes('action')) {
      addActionSuggestions(searchQuery, results);
    }

    // Apply sorting
    const sortOption = mergedFilters.sort || 'relevance';
    applySorting(results, sortOption);

    // Calculate total count
    results.totalCount =
      results.vibes.length +
      results.users.length +
      results.tags.length +
      results.actions.length +
      results.reviews.length;

    return results;
  },
});

// Helper function to process a vibe with filters
async function processVibe(
  ctx: any,
  vibe: any,
  filters: any,
  searchText: string,
  parsedQuery: any,
  results: any
): Promise<boolean> {
  // Check tag filter
  if (filters.tags && filters.tags.length > 0) {
    const hasMatchingTag = vibe.tags?.some((tag: string) =>
      filters.tags!.includes(tag)
    );
    if (!hasMatchingTag) return false;
  }

  // Check for excluded terms
  const hasExcludedTerm = parsedQuery.excludedTerms.some(
    (term: string) =>
      vibe.title.toLowerCase().includes(term.toLowerCase()) ||
      vibe.description.toLowerCase().includes(term.toLowerCase()) ||
      vibe.tags?.some((tag: string) =>
        tag.toLowerCase().includes(term.toLowerCase())
      )
  );
  if (hasExcludedTerm) return false;

  // Get ratings for filtering
  let avgRating: number | undefined;
  let ratingCount = 0;

  if (
    filters.minRating !== undefined ||
    filters.maxRating !== undefined ||
    filters.emojiRatings
  ) {
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q: any) => q.eq('vibeId', vibe.id))
      .take(100); // Limit to first 100 ratings for performance

    ratingCount = ratings.length;
    if (ratingCount > 0) {
      avgRating =
        ratings.reduce((sum: number, r: any) => sum + r.value, 0) / ratingCount;
    }

    // Apply rating filters
    if (
      filters.minRating !== undefined &&
      (avgRating === undefined || avgRating < filters.minRating)
    ) {
      return false;
    }
    if (
      filters.maxRating !== undefined &&
      (avgRating === undefined || avgRating > filters.maxRating)
    ) {
      return false;
    }

    // Apply emoji rating filter
    if (filters.emojiRatings) {
      const { emojis, minValue } = filters.emojiRatings;

      if (emojis && emojis.length > 0) {
        // Get emoji ratings from the ratings table (not emojiRatings table)
        const emojiRatings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q: any) => q.eq('vibeId', vibe.id))
          .filter((q: any) => {
            const emojiFilters = emojis.map((emoji: string) =>
              q.eq(q.field('emoji'), emoji)
            );
            return q.or(...emojiFilters);
          })
          .collect();

        const hasMatchingEmoji = emojiRatings.some(
          (rating: any) =>
            emojis.includes(rating.emoji) &&
            (minValue === undefined || rating.value >= minValue)
        );
        if (!hasMatchingEmoji) return false;
      } else if (minValue !== undefined) {
        const hasHighRating = ratings.some(
          (rating: any) => rating.value >= minValue
        );
        if (!hasHighRating) return false;
      }
    }
  }

  // Get creator info
  const creator = await ctx.db
    .query('users')
    .withIndex('byExternalId', (q: any) => q.eq('externalId', vibe.createdById))
    .first();

  // Calculate score
  const score = scoreVibe(
    {
      title: vibe.title,
      description: vibe.description,
      tags: vibe.tags,
      createdAt: vibe.createdAt,
      rating: avgRating,
      ratingCount,
    },
    searchText
  );

  results.vibes.push({
    id: vibe.id,
    type: 'vibe',
    title: vibe.title,
    subtitle: creator?.username || 'Unknown creator',
    image: vibe.image,
    description: vibe.description,
    rating: avgRating,
    ratingCount,
    tags: vibe.tags,
    score,
    createdBy: creator
      ? {
          id: creator.externalId,
          name: creator.username || 'Unknown',
          avatar: creator.image_url,
        }
      : undefined,
  });

  return true;
}

// Helper function to process a user with filters
async function processUser(
  ctx: any,
  user: any,
  filters: any,
  searchText: string,
  parsedQuery: any,
  results: any
): Promise<boolean> {
  const username = user.username || '';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const bio = user.bio || '';

  // Check for excluded terms
  const hasExcludedTerm = parsedQuery.excludedTerms.some(
    (term: string) =>
      username.toLowerCase().includes(term.toLowerCase()) ||
      fullName.toLowerCase().includes(term.toLowerCase()) ||
      bio.toLowerCase().includes(term.toLowerCase())
  );
  if (hasExcludedTerm) return false;

  // Apply emoji rating filter to users
  if (filters.emojiRatings) {
    const { emojis, minValue } = filters.emojiRatings;

    if (emojis && emojis.length > 0) {
      // Use the byUserAndEmoji index to efficiently check if user has matching reviews
      const hasMatchingReview = await Promise.any(
        emojis.map(async (emoji: string) => {
          const rating = await ctx.db
            .query('ratings')
            .withIndex('byUserAndEmoji', (q: any) =>
              q.eq('userId', user.externalId).eq('emoji', emoji)
            )
            .filter(
              (q: any) =>
                minValue === undefined || q.gte(q.field('value'), minValue)
            )
            .first();
          return rating !== null;
        })
      ).catch(() => false);

      if (!hasMatchingReview) return false;
    }
  }

  // Get vibe count
  const vibeCount = await ctx.db
    .query('vibes')
    .withIndex('createdBy', (q: any) => q.eq('createdById', user.externalId))
    .collect()
    .then((vibes: any[]) => vibes.length);

  // Calculate score
  const score = scoreUser(
    {
      username,
      fullName,
      bio,
      vibeCount,
    },
    searchText
  );

  results.users.push({
    id: user.externalId,
    type: 'user',
    title: user.username || 'Unknown user',
    subtitle: fullName || undefined,
    image: user.image_url,
    username: user.username || 'unknown',
    vibeCount,
    score,
  });

  return true;
}

// Helper function to process a review with filters
async function processReview(
  ctx: any,
  rating: any,
  filters: any,
  searchText: string,
  parsedQuery: any,
  results: any
): Promise<boolean> {
  // Check for excluded terms
  const hasExcludedTerm = parsedQuery.excludedTerms.some((term: string) =>
    rating.review.toLowerCase().includes(term.toLowerCase())
  );
  if (hasExcludedTerm) return false;

  // Apply emoji rating filter
  if (filters.emojiRatings) {
    const { emojis, minValue } = filters.emojiRatings;

    if (emojis && emojis.length > 0) {
      const hasMatchingEmoji =
        emojis.includes(rating.emoji) &&
        (minValue === undefined || rating.value >= minValue);
      if (!hasMatchingEmoji) return false;
    } else if (minValue !== undefined && rating.value < minValue) {
      return false;
    }
  }

  // Get the vibe and reviewer info
  const [vibe, reviewer] = await Promise.all([
    ctx.db
      .query('vibes')
      .filter((q: any) => q.eq(q.field('id'), rating.vibeId))
      .first(),
    ctx.db
      .query('users')
      .withIndex('byExternalId', (q: any) => q.eq('externalId', rating.userId))
      .first(),
  ]);

  if (!vibe) return false;

  // Calculate score
  const score = fuzzyMatch(rating.review, searchText) ? 0.8 : 0.3;

  results.reviews.push({
    id: rating._id,
    type: 'review',
    title:
      rating.review.length > 50
        ? rating.review.substring(0, 50) + '...'
        : rating.review,
    subtitle: `${rating.emoji} ${rating.value}/5 on "${vibe.title || 'Unknown vibe'}"`,
    reviewText: rating.review,
    emoji: rating.emoji,
    rating: rating.value,
    vibeId: rating.vibeId,
    vibeTitle: vibe.title || 'Unknown vibe',
    reviewerId: rating.userId,
    reviewerName: reviewer?.username || 'Unknown',
    reviewerAvatar: reviewer?.image_url,
    createdAt: rating._creationTime,
    score,
  });

  return true;
}

// Helper function to add action suggestions
function addActionSuggestions(searchQuery: string, results: any) {
  const lowerQuery = searchQuery.toLowerCase();

  if (
    lowerQuery.includes('create') ||
    lowerQuery.includes('new') ||
    lowerQuery.includes('add')
  ) {
    results.actions.push({
      id: 'create-vibe',
      type: 'action',
      title: 'Create a new vibe',
      subtitle: 'Share your experience with the community',
      action: 'create',
      icon: 'plus',
      score: fuzzyMatch('create', lowerQuery) ? 0.9 : 0.5,
    });
  }

  if (
    lowerQuery.includes('profile') ||
    lowerQuery.includes('my') ||
    lowerQuery.includes('account')
  ) {
    results.actions.push({
      id: 'view-profile',
      type: 'action',
      title: 'View your profile',
      subtitle: 'See your vibes and stats',
      action: 'profile',
      icon: 'user',
      score: fuzzyMatch('profile', lowerQuery) ? 0.9 : 0.5,
    });
  }

  if (
    lowerQuery.includes('setting') ||
    lowerQuery.includes('preference') ||
    lowerQuery.includes('config')
  ) {
    results.actions.push({
      id: 'open-settings',
      type: 'action',
      title: 'Open settings',
      subtitle: 'Manage your account preferences',
      action: 'settings',
      icon: 'settings',
      score: fuzzyMatch('settings', lowerQuery) ? 0.9 : 0.5,
    });
  }
}

// Helper function to apply sorting
function applySorting(results: any, sortOption: string) {
  switch (sortOption) {
    case 'relevance':
      results.vibes.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      results.users.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      results.tags.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      results.actions.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      results.reviews.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      break;
    case 'rating_desc':
    case 'top_rated':
      results.vibes.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      results.reviews.sort(
        (a: any, b: any) => (b.rating || 0) - (a.rating || 0)
      );
      break;
    case 'rating_asc':
      results.vibes.sort((a: any, b: any) => (a.rating || 0) - (b.rating || 0));
      results.reviews.sort(
        (a: any, b: any) => (a.rating || 0) - (b.rating || 0)
      );
      break;
    case 'most_rated':
      results.vibes.sort(
        (a: any, b: any) => (b.ratingCount || 0) - (a.ratingCount || 0)
      );
      break;
    case 'name':
      results.vibes.sort((a: any, b: any) => a.title.localeCompare(b.title));
      results.users.sort((a: any, b: any) => a.title.localeCompare(b.title));
      results.tags.sort((a: any, b: any) => a.title.localeCompare(b.title));
      break;
  }
}

// Quick suggestions for command palette (optimized)
export const getSearchSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, limit = 10 } = args;
    const results = {
      vibes: [] as VibeSearchResult[],
      users: [] as UserSearchResult[],
      tags: [] as TagSearchResult[],
      actions: [] as ActionSearchResult[],
      reviews: [] as ReviewSearchResult[],
      recentSearches: [] as string[],
      trendingSearches: [] as string[],
      popularTags: [] as string[],
    };

    if (!searchQuery.trim()) {
      // Return recent searches and trending items when query is empty
      const currentUser = await ctx.auth.getUserIdentity();

      if (currentUser) {
        const recentSearchHistory = await ctx.db
          .query('searchHistory')
          .withIndex('byUser', (q: any) => q.eq('userId', currentUser.subject))
          .order('desc')
          .take(20); // Get more to ensure we have enough unique ones

        // Deduplicate recent searches by query
        const uniqueSearches = new Map<string, any>();
        for (const search of recentSearchHistory) {
          if (!uniqueSearches.has(search.query)) {
            uniqueSearches.set(search.query, search);
          }
        }

        // Take only the first 5 unique searches
        results.recentSearches = Array.from(uniqueSearches.values())
          .slice(0, 5)
          .map((search: any) => search.query);
          
        console.log('Recent searches for user:', { 
          userId: currentUser.subject,
          recentSearchHistory: recentSearchHistory.length,
          uniqueSearches: uniqueSearches.size,
          results: results.recentSearches 
        });
      }

      // Get trending searches
      const trendingSearches = await ctx.db
        .query('trendingSearches')
        .withIndex('byCount')
        .order('desc')
        .take(5);

      results.trendingSearches = trendingSearches.map((t: any) => t.term);

      // Get popular tags
      const popularTags = await ctx.db
        .query('tags')
        .withIndex('byCount')
        .order('desc')
        .take(8);

      results.popularTags = popularTags.map((t: any) => t.name);

      return results;
    }

    // Parse query
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchText = parsedQuery.terms
      .concat(parsedQuery.exactPhrases)
      .join(' ')
      .toLowerCase();

    // Search vibes using search index
    if (searchText) {
      const vibes = await ctx.db
        .query('vibes')
        .withSearchIndex('searchTitle', (q: any) =>
          q.search('title', searchText)
        )
        .take(5);

      for (const vibe of vibes) {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q: any) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        const ratingsCount = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q: any) => q.eq('vibeId', vibe.id))
          .collect()
          .then((ratings: any[]) => ratings.length);

        results.vibes.push({
          id: vibe.id,
          type: 'vibe',
          title: vibe.title,
          subtitle: creator?.username || 'Unknown creator',
          image: vibe.image,
          description: vibe.description,
          ratingCount: ratingsCount,
          tags: vibe.tags,
          createdBy: creator
            ? {
                id: creator.externalId,
                name: creator.username || 'Unknown',
                avatar: creator.image_url,
              }
            : undefined,
        });
      }

      // Search users using search index
      const users = await ctx.db
        .query('users')
        .withSearchIndex('searchUsername', (q: any) =>
          q.search('username', searchText)
        )
        .take(3);

      for (const user of users) {
        const vibeCount = await ctx.db
          .query('vibes')
          .withIndex('createdBy', (q: any) =>
            q.eq('createdById', user.externalId)
          )
          .collect()
          .then((vibes: any[]) => vibes.length);

        results.users.push({
          id: user.externalId,
          type: 'user',
          title: user.username || 'Unknown user',
          subtitle:
            `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
            undefined,
          image: user.image_url,
          username: user.username || 'unknown',
          vibeCount,
        });
      }

      // Search tags using search index
      const tags = await ctx.db
        .query('tags')
        .withSearchIndex('search', (q: any) => q.search('name', searchText))
        .take(5);

      for (const tag of tags) {
        results.tags.push({
          id: tag.name,
          type: 'tag',
          title: tag.name,
          subtitle: `${tag.count} vibe${tag.count !== 1 ? 's' : ''}`,
          count: tag.count,
        });
      }
    }

    // Add action suggestions
    addActionSuggestions(searchQuery, results);

    return results;
  },
});

// Get trending searches
export const getTrendingSearches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { limit = 10 } = args;

    const trending = await ctx.db
      .query('trendingSearches')
      .withIndex('byCount')
      .order('desc')
      .take(limit);

    return trending.map((item: any) => ({
      term: item.term,
      count: item.count,
      category: item.category,
    }));
  },
});

// Track search (mutation) - same as original
export const trackSearch = mutation({
  args: {
    query: v.string(),
    resultCount: v.number(),
    clickedResults: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { query, resultCount, clickedResults, category } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error('User must be authenticated to track searches');
    }

    console.log('trackSearch called:', { 
      userId: identity.subject, 
      query, 
      resultCount, 
      clickedResults,
      category 
    });

    // Find the most recent search entry for this user and query
    const existingSearch = await ctx.db
      .query('searchHistory')
      .withIndex('byUser', (q: any) => q.eq('userId', identity.subject))
      .order('desc')
      .filter((q) => q.eq(q.field('query'), query))
      .first();
    
    // If we have an existing search from within the last 5 minutes, update it
    // This handles cases where we track twice (once for search, once for result count)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (existingSearch && existingSearch.timestamp > fiveMinutesAgo) {
      console.log('Updating existing search history entry:', { 
        searchId: existingSearch._id,
        userId: identity.subject, 
        query,
        newResultCount: resultCount,
        newClickedResults: clickedResults
      });
      
      await ctx.db.patch(existingSearch._id, {
        resultCount: resultCount > 0 ? resultCount : existingSearch.resultCount,
        clickedResults: clickedResults && clickedResults.length > 0 ? clickedResults : existingSearch.clickedResults,
        timestamp: Date.now(), // Update timestamp to keep it recent
        category: category || existingSearch.category,
      });
    } else {
      console.log('Inserting new search history entry:', { 
        userId: identity.subject, 
        query, 
        resultCount,
        clickedResults,
        category,
        timestamp: Date.now() 
      });
      
      await ctx.db.insert('searchHistory', {
        userId: identity.subject,
        query,
        timestamp: Date.now(),
        resultCount,
        clickedResults,
        category,
      });
    }

    // Update trending searches
    const normalizedQuery = query.toLowerCase().trim();
    const existing = await ctx.db
      .query('trendingSearches')
      .withIndex('byTerm', (q: any) => q.eq('term', normalizedQuery))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        lastUpdated: Date.now(),
        category: category || existing.category,
      });
    } else {
      await ctx.db.insert('trendingSearches', {
        term: normalizedQuery,
        count: 1,
        lastUpdated: Date.now(),
        category,
      });
    }

    // Clean up old trending searches (keep top 100)
    const allTrending = await ctx.db
      .query('trendingSearches')
      .withIndex('byCount')
      .order('desc')
      .collect();

    if (allTrending.length > 100) {
      const toDelete = allTrending.slice(100);
      for (const item of toDelete) {
        await ctx.db.delete(item._id);
      }
    }
  },
});

