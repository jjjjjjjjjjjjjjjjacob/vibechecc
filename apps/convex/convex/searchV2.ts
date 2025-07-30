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

// Helper to check if a string contains search terms (case-insensitive partial match)
function containsSearchTerms(text: string, searchTerms: string[]): boolean {
  const lowerText = text.toLowerCase();
  return searchTerms.some(term => lowerText.includes(term.toLowerCase()));
}

// Main search function with proper filtering
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

    // Parse the query for search terms
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchTerms = parsedQuery.terms.concat(parsedQuery.exactPhrases);
    const hasSearchTerms = searchTerms.length > 0;

    // Initialize results
    const allResults = {
      vibes: [] as VibeSearchResult[],
      users: [] as UserSearchResult[],
      tags: [] as TagSearchResult[],
      actions: [] as ActionSearchResult[],
      reviews: [] as ReviewSearchResult[],
    };

    // Determine if we have filters that require fetching all results
    const hasFilters = !!(
      filters?.tags?.length ||
      filters?.minRating !== undefined ||
      filters?.maxRating !== undefined ||
      filters?.emojiRatings?.emojis?.length ||
      filters?.emojiRatings?.minValue !== undefined ||
      filters?.dateRange ||
      filters?.creators?.length
    );

    // For filtered searches or when we need total count, we need to fetch all matching results
    const needsAllResults = hasFilters || !hasSearchTerms;

    // Search VIBES
    if (!includeTypes || includeTypes.includes('vibe')) {
      const vibes = needsAllResults
        ? await ctx.db.query('vibes').collect()
        : await ctx.db.query('vibes').take(100); // Limit for performance when just searching

      for (const vibe of vibes) {
        // Check text match
        if (hasSearchTerms) {
          const matchesText = containsSearchTerms(
            `${vibe.title} ${vibe.description} ${(vibe.tags || []).join(' ')}`,
            searchTerms
          );
          if (!matchesText) continue;
        }

        // Apply filters (only for vibes)
        let passesFilters = true;

        // Tag filter
        if (filters?.tags?.length && passesFilters) {
          const hasMatchingTag = vibe.tags?.some(tag => filters.tags!.includes(tag));
          if (!hasMatchingTag) passesFilters = false;
        }

        // Date filter
        if (filters?.dateRange && passesFilters) {
          const vibeDate = new Date(vibe.createdAt);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          if (vibeDate < startDate || vibeDate > endDate) passesFilters = false;
        }

        // Creator filter
        if (filters?.creators?.length && passesFilters) {
          if (!filters.creators.includes(vibe.createdById)) passesFilters = false;
        }

        // Rating filters
        if ((filters?.minRating !== undefined || filters?.maxRating !== undefined || filters?.emojiRatings) && passesFilters) {
          // Get all ratings for this vibe
          const ratings = await ctx.db
            .query('ratings')
            .withIndex('vibe', q => q.eq('vibeId', vibe.id))
            .collect();

          // Check general rating filter
          if (filters?.minRating !== undefined || filters?.maxRating !== undefined) {
            const avgRating = ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
              : 0;
            
            if (filters?.minRating !== undefined && avgRating < filters.minRating) {
              passesFilters = false;
            }
            if (filters?.maxRating !== undefined && avgRating > filters.maxRating) {
              passesFilters = false;
            }
          }

          // Check emoji rating filter
          if (filters?.emojiRatings && passesFilters) {
            const { emojis, minValue } = filters.emojiRatings;
            
            if (emojis && emojis.length > 0) {
              const hasMatchingEmojiRating = ratings.some(
                rating => emojis.includes(rating.emoji) && 
                         (minValue === undefined || rating.value >= minValue)
              );
              if (!hasMatchingEmojiRating) passesFilters = false;
            }
          }
        }

        if (!passesFilters) continue;

        // Get creator info
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', q => q.eq('externalId', vibe.createdById))
          .first();

        // Get rating info for display
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', q => q.eq('vibeId', vibe.id))
          .collect();

        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
          : undefined;

        allResults.vibes.push({
          id: vibe.id,
          type: 'vibe',
          title: vibe.title,
          subtitle: creator?.username || 'Unknown creator',
          image: vibe.image,
          description: vibe.description,
          rating: avgRating,
          ratingCount: ratings.length,
          tags: vibe.tags,
          score: hasSearchTerms ? scoreVibe(
            {
              title: vibe.title,
              description: vibe.description,
              tags: vibe.tags,
              createdAt: vibe.createdAt,
              rating: avgRating,
              ratingCount: ratings.length,
            },
            searchTerms.join(' ')
          ) : 1,
          createdBy: creator
            ? {
                id: creator.externalId,
                name: creator.username || 'Unknown',
                avatar: creator.image_url,
              }
            : undefined,
        });
      }
    }

    // Search USERS
    if (!includeTypes || includeTypes.includes('user')) {
      const users = await ctx.db.query('users').take(100);

      for (const user of users) {
        if (hasSearchTerms) {
          const matchesText = containsSearchTerms(
            `${user.username || ''} ${user.first_name || ''} ${user.last_name || ''} ${user.bio || ''}`,
            searchTerms
          );
          if (!matchesText) continue;
        }

        // No filters apply to users
        const vibeCount = await ctx.db
          .query('vibes')
          .withIndex('createdBy', q => q.eq('createdById', user.externalId))
          .collect()
          .then(vibes => vibes.length);

        allResults.users.push({
          id: user.externalId,
          type: 'user',
          title: user.username || 'Unknown user',
          subtitle: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined,
          image: user.image_url,
          username: user.username || 'unknown',
          vibeCount,
          score: hasSearchTerms ? scoreUser(
            {
              username: user.username || '',
              fullName: `${user.first_name || ''} ${user.last_name || ''}`,
              bio: user.bio || '',
              vibeCount,
            },
            searchTerms.join(' ')
          ) : 1,
        });
      }
    }

    // Search REVIEWS
    if (!includeTypes || includeTypes.includes('review')) {
      const reviews = await ctx.db.query('ratings').take(200);

      for (const rating of reviews) {
        if (!rating.review) continue;

        // Check text match
        if (hasSearchTerms) {
          const matchesText = containsSearchTerms(rating.review, searchTerms);
          if (!matchesText) continue;
        }

        // Apply filters to reviews (same as vibes)
        let passesFilters = true;

        // Get the vibe this review is for
        const vibe = await ctx.db
          .query('vibes')
          .filter(q => q.eq(q.field('id'), rating.vibeId))
          .first();

        if (!vibe) continue;

        // Tag filter (based on vibe's tags)
        if (filters?.tags?.length && passesFilters) {
          const hasMatchingTag = vibe.tags?.some(tag => filters.tags!.includes(tag));
          if (!hasMatchingTag) passesFilters = false;
        }

        // Rating filter
        if (filters?.minRating !== undefined && rating.value < filters.minRating) {
          passesFilters = false;
        }
        if (filters?.maxRating !== undefined && rating.value > filters.maxRating) {
          passesFilters = false;
        }

        // Emoji rating filter
        if (filters?.emojiRatings && passesFilters) {
          const { emojis, minValue } = filters.emojiRatings;
          
          if (emojis && emojis.length > 0) {
            const matchesEmoji = emojis.includes(rating.emoji) && 
                               (minValue === undefined || rating.value >= minValue);
            if (!matchesEmoji) passesFilters = false;
          }
        }

        if (!passesFilters) continue;

        // Get reviewer info
        const reviewer = await ctx.db
          .query('users')
          .withIndex('byExternalId', q => q.eq('externalId', rating.userId))
          .first();

        allResults.reviews.push({
          id: rating._id,
          type: 'review',
          title: rating.review.length > 50
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
          score: hasSearchTerms ? fuzzyMatch(rating.review, searchTerms.join(' ')) ? 0.8 : 0.3 : 1,
        });
      }
    }

    // Search TAGS
    if (!includeTypes || includeTypes.includes('tag')) {
      const tags = await ctx.db.query('tags').take(100);

      for (const tag of tags) {
        if (hasSearchTerms) {
          const matchesText = containsSearchTerms(tag.name, searchTerms);
          if (!matchesText) continue;
        }

        // No filters apply to tags
        allResults.tags.push({
          id: tag.name,
          type: 'tag',
          title: tag.name,
          subtitle: `${tag.count} vibe${tag.count !== 1 ? 's' : ''}`,
          count: tag.count,
          score: hasSearchTerms ? scoreTag(
            { name: tag.name, count: tag.count },
            searchTerms.join(' ')
          ) : 1,
        });
      }
    }

    // Add action suggestions
    if (!includeTypes || includeTypes.includes('action')) {
      addActionSuggestions(searchQuery, allResults);
    }

    // Apply sorting
    const sortOption = filters?.sort || 'relevance';
    applySorting(allResults, sortOption);

    // Calculate total count BEFORE pagination
    const totalCount = 
      allResults.vibes.length +
      allResults.users.length +
      allResults.tags.length +
      allResults.actions.length +
      allResults.reviews.length;

    // Apply pagination
    const pageSize = Math.min(
      paginationOpts.numItems || DEFAULT_RESULTS_PER_PAGE,
      MAX_RESULTS_PER_PAGE
    );
    
    const startIndex = paginationOpts.cursor ? parseInt(paginationOpts.cursor) : 0;
    const endIndex = startIndex + pageSize;

    // Paginate results
    const paginatedResults = {
      vibes: allResults.vibes.slice(startIndex, endIndex),
      users: allResults.users.slice(startIndex, endIndex),
      tags: allResults.tags.slice(startIndex, endIndex),
      actions: allResults.actions.slice(startIndex, endIndex),
      reviews: allResults.reviews.slice(startIndex, endIndex),
      totalCount,
      nextCursor: endIndex < totalCount ? endIndex.toString() : null,
    };

    return paginatedResults;
  },
});

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
      results.reviews.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'rating_asc':
      results.vibes.sort((a: any, b: any) => (a.rating || 0) - (b.rating || 0));
      results.reviews.sort((a: any, b: any) => (a.rating || 0) - (b.rating || 0));
      break;
    case 'most_rated':
      results.vibes.sort((a: any, b: any) => (b.ratingCount || 0) - (a.ratingCount || 0));
      break;
    case 'name':
      results.vibes.sort((a: any, b: any) => a.title.localeCompare(b.title));
      results.users.sort((a: any, b: any) => a.title.localeCompare(b.title));
      results.tags.sort((a: any, b: any) => a.title.localeCompare(b.title));
      break;
  }
}

// Keep the other queries from the original file
export { getSearchSuggestions, getTrendingSearches, trackSearch } from './search';