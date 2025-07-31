import { query } from './_generated/server';
import { v } from 'convex/values';
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
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Helper to check if text contains search terms (case-insensitive partial match)
function containsSearchTerms(text: string, searchTerms: string[]): boolean {
  if (searchTerms.length === 0) return true;
  const lowerText = text.toLowerCase();
  return searchTerms.some((term) => lowerText.includes(term.toLowerCase()));
}

// Improved search with proper pagination and total counts
export const searchAllImproved = query({
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
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    includeTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, filters, includeTypes } = args;
    const page = args.page ?? 1;
    const pageSize = Math.min(
      args.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    // Parse the query for search terms
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchTerms = parsedQuery.terms.concat(parsedQuery.exactPhrases);

    // Initialize accumulators for all results
    const allResults = {
      vibes: [] as VibeSearchResult[],
      users: [] as UserSearchResult[],
      tags: [] as TagSearchResult[],
      actions: [] as ActionSearchResult[],
      reviews: [] as ReviewSearchResult[],
    };

    // Search VIBES
    if (!includeTypes || includeTypes.includes('vibe')) {
      const allVibes = await ctx.db.query('vibes').collect();

      for (const vibe of allVibes) {
        // Check text match
        if (
          !containsSearchTerms(
            `${vibe.title} ${vibe.description} ${(vibe.tags || []).join(' ')}`,
            searchTerms
          )
        )
          continue;

        // Apply filters
        let passesFilters = true;

        // Tag filter
        if (filters?.tags?.length) {
          const hasMatchingTag = vibe.tags?.some((tag) =>
            filters.tags!.includes(tag)
          );
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
          if (!filters.creators.includes(vibe.createdById))
            passesFilters = false;
        }

        // Rating and emoji filters
        if (
          (filters?.minRating !== undefined ||
            filters?.maxRating !== undefined ||
            filters?.emojiRatings) &&
          passesFilters
        ) {
          const ratings = await ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .collect();

          // General rating filter
          if (
            filters?.minRating !== undefined ||
            filters?.maxRating !== undefined
          ) {
            const avgRating =
              ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
                : 0;

            if (
              filters?.minRating !== undefined &&
              avgRating < filters.minRating
            ) {
              passesFilters = false;
            }
            if (
              filters?.maxRating !== undefined &&
              avgRating > filters.maxRating
            ) {
              passesFilters = false;
            }
          }

          // Emoji rating filter
          if (filters?.emojiRatings && passesFilters) {
            const { emojis, minValue } = filters.emojiRatings;

            if (emojis && emojis.length > 0) {
              const hasMatchingEmojiRating = ratings.some(
                (rating) =>
                  emojis.includes(rating.emoji) &&
                  (minValue === undefined || rating.value >= minValue)
              );
              if (!hasMatchingEmojiRating) passesFilters = false;
            }
          }
        }

        if (!passesFilters) continue;

        // Get additional info for display
        const [creator, ratings] = await Promise.all([
          ctx.db
            .query('users')
            .withIndex('byExternalId', (q) =>
              q.eq('externalId', vibe.createdById)
            )
            .first(),
          ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .collect(),
        ]);

        const avgRating =
          ratings.length > 0
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
          score: scoreVibe(
            {
              title: vibe.title,
              description: vibe.description,
              tags: vibe.tags,
              createdAt: vibe.createdAt,
              rating: avgRating,
              ratingCount: ratings.length,
            },
            searchTerms.join(' ')
          ),
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

    // When there's no search query but filters, collect related user IDs from vibes
    const relatedUserIds = new Set<string>();
    const relatedTags = new Set<string>();
    const relatedVibeIds = new Set<string>();

    if (!searchTerms.length && filters) {
      // Collect all user IDs and tags from filtered vibes
      allResults.vibes.forEach((vibe) => {
        relatedVibeIds.add(vibe.id);
        if (vibe.createdBy?.id) {
          relatedUserIds.add(vibe.createdBy.id);
        }
        if (vibe.tags) {
          vibe.tags.forEach((tag) => relatedTags.add(tag));
        }
      });

      // Also collect user IDs from reviews of these vibes
      const vibeRatings = await ctx.db.query('ratings').collect();

      vibeRatings.forEach((rating) => {
        if (relatedVibeIds.has(rating.vibeId)) {
          relatedUserIds.add(rating.userId);
        }
      });
    }

    // Search USERS
    if (!includeTypes || includeTypes.includes('user')) {
      const allUsers = await ctx.db.query('users').collect();

      for (const user of allUsers) {
        // If no search query but filters exist, only include users related to filtered vibes
        if (!searchTerms.length && filters) {
          if (!relatedUserIds.has(user.externalId)) continue;
        } else if (searchTerms.length > 0) {
          // Normal search behavior when there's a query
          if (
            !containsSearchTerms(
              `${user.username || ''} ${user.first_name || ''} ${user.last_name || ''} ${user.bio || ''}`,
              searchTerms
            )
          )
            continue;
        }

        const vibeCount = await ctx.db
          .query('vibes')
          .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
          .collect()
          .then((vibes) => vibes.length);

        allResults.users.push({
          id: user.externalId,
          type: 'user',
          title: user.username || 'Unknown user',
          subtitle:
            `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
            undefined,
          image: user.image_url,
          username: user.username || 'unknown',
          vibeCount,
          score: scoreUser(
            {
              username: user.username || '',
              fullName: `${user.first_name || ''} ${user.last_name || ''}`,
              bio: user.bio || '',
              vibeCount,
            },
            searchTerms.join(' ')
          ),
        });
      }
    }

    // Search REVIEWS
    if (!includeTypes || includeTypes.includes('review')) {
      const allRatings = await ctx.db.query('ratings').collect();

      for (const rating of allRatings) {
        if (!rating.review) continue;

        // Get the vibe for filter checking
        const vibe = await ctx.db
          .query('vibes')
          .filter((q) => q.eq(q.field('id'), rating.vibeId))
          .first();

        if (!vibe) continue;

        // If no search query but filters exist, only include reviews for filtered vibes
        if (!searchTerms.length && filters) {
          if (!relatedVibeIds.has(vibe.id)) continue;
        } else if (searchTerms.length > 0) {
          // Normal search behavior when there's a query
          if (!containsSearchTerms(rating.review, searchTerms)) continue;
        }

        // Apply filters to reviews
        let passesFilters = true;

        // Tag filter (based on vibe's tags)
        if (filters?.tags?.length) {
          const hasMatchingTag = vibe.tags?.some((tag) =>
            filters.tags!.includes(tag)
          );
          if (!hasMatchingTag) passesFilters = false;
        }

        // Rating filter
        if (
          filters?.minRating !== undefined &&
          rating.value < filters.minRating
        ) {
          passesFilters = false;
        }
        if (
          filters?.maxRating !== undefined &&
          rating.value > filters.maxRating
        ) {
          passesFilters = false;
        }

        // Emoji rating filter
        if (filters?.emojiRatings && passesFilters) {
          const { emojis, minValue } = filters.emojiRatings;

          if (emojis && emojis.length > 0) {
            const matchesEmoji =
              emojis.includes(rating.emoji) &&
              (minValue === undefined || rating.value >= minValue);
            if (!matchesEmoji) passesFilters = false;
          }
        }

        if (!passesFilters) continue;

        const reviewer = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', rating.userId))
          .first();

        allResults.reviews.push({
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
          score: fuzzyMatch(rating.review, searchTerms.join(' ')) ? 0.8 : 0.3,
        });
      }
    }

    // Search TAGS
    if (!includeTypes || includeTypes.includes('tag')) {
      const allTags = await ctx.db.query('tags').collect();

      for (const tag of allTags) {
        // If no search query but filters exist, only include tags from filtered vibes
        if (!searchTerms.length && filters) {
          if (!relatedTags.has(tag.name)) continue;
        } else if (searchTerms.length > 0) {
          // Normal search behavior when there's a query
          if (!containsSearchTerms(tag.name, searchTerms)) continue;
        }

        // If filtering, update tag count to reflect filtered vibes only
        let displayCount = tag.count;
        if (!searchTerms.length && filters) {
          // Count how many filtered vibes have this tag
          displayCount = allResults.vibes.filter((vibe) =>
            vibe.tags?.includes(tag.name)
          ).length;
        }

        allResults.tags.push({
          id: tag.name,
          type: 'tag',
          title: tag.name,
          subtitle: `${displayCount} vibe${displayCount !== 1 ? 's' : ''}`,
          count: displayCount,
          score: scoreTag(
            { name: tag.name, count: displayCount },
            searchTerms.join(' ')
          ),
        });
      }
    }

    // Add action suggestions (only when there's a search query)
    if (
      searchTerms.length > 0 &&
      (!includeTypes || includeTypes.includes('action'))
    ) {
      addActionSuggestions(searchQuery, allResults);
    }

    // Apply sorting
    const sortOption = filters?.sort || 'relevance';
    applySorting(allResults, sortOption);

    // Calculate TOTAL counts before pagination
    const totalCounts = {
      vibes: allResults.vibes.length,
      users: allResults.users.length,
      tags: allResults.tags.length,
      actions: allResults.actions.length,
      reviews: allResults.reviews.length,
      total:
        allResults.vibes.length +
        allResults.users.length +
        allResults.tags.length +
        allResults.actions.length +
        allResults.reviews.length,
    };

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Return paginated results with total counts
    return {
      vibes: allResults.vibes.slice(startIndex, endIndex),
      users: allResults.users.slice(startIndex, endIndex),
      tags: allResults.tags.slice(startIndex, endIndex),
      actions: allResults.actions.slice(startIndex, endIndex),
      reviews: allResults.reviews.slice(startIndex, endIndex),
      totalCount: totalCounts.total,
      totalCounts, // Include breakdown by type
      page,
      pageSize,
      totalPages: Math.ceil(totalCounts.total / pageSize),
      hasNextPage: endIndex < totalCounts.total,
      hasPreviousPage: page > 1,
    };
  },
});

// Define types for the results object
type SearchResults = {
  vibes: VibeSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  actions: ActionSearchResult[];
  reviews: ReviewSearchResult[];
};

// Helper function to add action suggestions
function addActionSuggestions(
  searchQuery: string,
  results: SearchResults
): void {
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
function applySorting(results: SearchResults, sortOption: string): void {
  switch (sortOption) {
    case 'relevance':
      results.vibes.sort(
        (a: VibeSearchResult, b: VibeSearchResult) =>
          (b.score || 0) - (a.score || 0)
      );
      results.users.sort(
        (a: UserSearchResult, b: UserSearchResult) =>
          (b.score || 0) - (a.score || 0)
      );
      results.tags.sort(
        (a: TagSearchResult, b: TagSearchResult) =>
          (b.score || 0) - (a.score || 0)
      );
      results.actions.sort(
        (a: ActionSearchResult, b: ActionSearchResult) =>
          (b.score || 0) - (a.score || 0)
      );
      results.reviews.sort(
        (a: ReviewSearchResult, b: ReviewSearchResult) =>
          (b.score || 0) - (a.score || 0)
      );
      break;
    case 'rating_desc':
    case 'top_rated':
      results.vibes.sort(
        (a: VibeSearchResult, b: VibeSearchResult) =>
          (b.rating || 0) - (a.rating || 0)
      );
      results.reviews.sort(
        (a: ReviewSearchResult, b: ReviewSearchResult) =>
          (b.rating || 0) - (a.rating || 0)
      );
      break;
    case 'rating_asc':
      results.vibes.sort(
        (a: VibeSearchResult, b: VibeSearchResult) =>
          (a.rating || 0) - (b.rating || 0)
      );
      results.reviews.sort(
        (a: ReviewSearchResult, b: ReviewSearchResult) =>
          (a.rating || 0) - (b.rating || 0)
      );
      break;
    case 'most_rated':
      results.vibes.sort(
        (a: VibeSearchResult, b: VibeSearchResult) =>
          (b.ratingCount || 0) - (a.ratingCount || 0)
      );
      break;
    case 'recent':
    case 'creation_date':
      // Add proper date sorting if createdAt is available
      break;
    case 'name':
      results.vibes.sort((a: VibeSearchResult, b: VibeSearchResult) =>
        a.title.localeCompare(b.title)
      );
      results.users.sort((a: UserSearchResult, b: UserSearchResult) =>
        a.title.localeCompare(b.title)
      );
      results.tags.sort((a: TagSearchResult, b: TagSearchResult) =>
        a.title.localeCompare(b.title)
      );
      break;
  }
}

// Re-export other functions from the original search module
export {
  getSearchSuggestions,
  getTrendingSearches,
  trackSearch,
} from './search';
