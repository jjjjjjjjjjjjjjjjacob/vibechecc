/**
 * Experimental search variant emphasizing indexed queries and per-type caps.
 * Provides a basis for benchmarking against other search implementations.
 */
import { query } from './_generated/server';
import { v } from 'convex/values';
import type {
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ActionSearchResult,
  ReviewSearchResult,
} from '@viberatr/types';
import { fuzzyMatch } from './search/fuzzy-search';
import { scoreVibe, scoreUser, scoreTag } from './search/search_scorer';
import { parseSearchQuery } from './search/search-utils';

// Constants for pagination and limits
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_RESULTS_PER_TYPE = 100; // Limit results per type to prevent document overload

// Helper to check if text contains search terms (case-insensitive partial match)
function containsSearchTerms(text: string, searchTerms: string[]): boolean {
  if (searchTerms.length === 0) return true;
  const lowerText = text.toLowerCase();
  return searchTerms.some((term) => lowerText.includes(term.toLowerCase()));
}

// Optimized search with proper limits and indexed queries
export const searchAllOptimized = query({
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

    // Tracking for related entities when no search query but filters exist
    const relatedUserIds = new Set<string>();
    const relatedTags = new Set<string>();
    const relatedVibeIds = new Set<string>();

    // Search VIBES with limits
    if (!includeTypes || includeTypes.includes('vibe')) {
      // Use indexed queries when possible
      let vibes;
      if (filters?.creators?.length === 1) {
        // Use index when filtering by single creator
        vibes = await ctx.db
          .query('vibes')
          .withIndex('createdBy', (q) =>
            q.eq('createdById', filters.creators![0])
          )
          .take(MAX_RESULTS_PER_TYPE * 2);
      } else {
        // Use regular query
        vibes = await ctx.db.query('vibes').take(MAX_RESULTS_PER_TYPE * 2);
      }

      for (const vibe of vibes) {
        if (allResults.vibes.length >= MAX_RESULTS_PER_TYPE) break;

        // Check text match
        if (
          searchTerms.length > 0 &&
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

        // Creator filter (if multiple creators or not using index)
        if (
          filters?.creators?.length &&
          filters.creators.length > 1 &&
          passesFilters
        ) {
          if (!filters.creators.includes(vibe.createdById))
            passesFilters = false;
        }

        if (!passesFilters) continue;

        // For rating filters, check if we need to fetch ratings
        let avgRating: number | undefined;
        let ratingCount = 0;

        if (
          filters?.minRating !== undefined ||
          filters?.maxRating !== undefined ||
          filters?.emojiRatings
        ) {
          const ratings = await ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .take(100); // Limit ratings per vibe

          ratingCount = ratings.length;

          // General rating filter
          if (
            filters?.minRating !== undefined ||
            filters?.maxRating !== undefined
          ) {
            avgRating =
              ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
                : 0;

            if (
              filters?.minRating !== undefined &&
              avgRating < filters.minRating
            ) {
              continue;
            }
            if (
              filters?.maxRating !== undefined &&
              avgRating > filters.maxRating
            ) {
              continue;
            }
          }

          // Emoji rating filter
          if (filters?.emojiRatings) {
            const { emojis, minValue } = filters.emojiRatings;

            if (emojis && emojis.length > 0) {
              const hasMatchingEmojiRating = ratings.some(
                (rating) =>
                  emojis.includes(rating.emoji) &&
                  (minValue === undefined || rating.value >= minValue)
              );
              if (!hasMatchingEmojiRating) continue;
            }
          }
        } else {
          // If no rating filters, just get count for display
          const ratingCountResult = await ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .take(1);
          ratingCount = ratingCountResult.length; // This is limited, but good enough for display
        }

        // Get creator info
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        // Track related entities
        relatedVibeIds.add(vibe.id);
        if (creator) relatedUserIds.add(creator.externalId);
        if (vibe.tags) vibe.tags.forEach((tag) => relatedTags.add(tag));

        allResults.vibes.push({
          id: vibe.id,
          type: 'vibe',
          title: vibe.title,
          subtitle: creator?.username || 'Unknown creator',
          image: vibe.image,
          description: vibe.description,
          rating: avgRating,
          ratingCount,
          tags: vibe.tags,
          score: scoreVibe(
            {
              title: vibe.title,
              description: vibe.description,
              tags: vibe.tags,
              createdAt: vibe.createdAt,
              rating: avgRating,
              ratingCount,
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

    // Search USERS with limits
    if (!includeTypes || includeTypes.includes('user')) {
      const usersLimit =
        searchTerms.length > 0 || relatedUserIds.size === 0
          ? MAX_RESULTS_PER_TYPE
          : Math.min(relatedUserIds.size, MAX_RESULTS_PER_TYPE);

      const users = await ctx.db.query('users').take(usersLimit * 2); // Fetch more for filtering

      for (const user of users) {
        if (allResults.users.length >= MAX_RESULTS_PER_TYPE) break;

        // Apply search term filtering regardless of tab
        if (searchTerms.length > 0) {
          // Filter by search terms - include location in search
          if (
            !containsSearchTerms(
              `${user.username || ''} ${user.first_name || ''} ${user.last_name || ''} ${user.bio || ''}`,
              searchTerms
            )
          )
            continue;
        } else {
          // If no search terms, only include users if:
          // 1. We have other filters and they're related to vibes found
          // 2. OR we're doing a browsing query (no specific search context)
          if (filters && relatedUserIds.size > 0) {
            // Only include users related to filtered vibes if we have other filters
            if (!relatedUserIds.has(user.externalId)) continue;
          } else if (
            !filters &&
            (!includeTypes ||
              includeTypes.length !== 1 ||
              !includeTypes.includes('user'))
          ) {
            // If no search terms and no filters, don't include any users unless we're specifically browsing users
            continue;
          }
        }

        // Get vibe count using index
        const userVibes = await ctx.db
          .query('vibes')
          .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
          .collect();
        const vibeCount = userVibes.length;

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

    // Search REVIEWS with limits
    if (!includeTypes || includeTypes.includes('review')) {
      // If we have specific vibe filters, use them to limit the search
      const ratingsQuery = ctx.db.query('ratings');

      const ratings = await ratingsQuery.take(MAX_RESULTS_PER_TYPE * 2);

      for (const rating of ratings) {
        if (allResults.reviews.length >= MAX_RESULTS_PER_TYPE) break;
        if (!rating.review) continue;

        // Get the vibe for context first
        const vibe = await ctx.db
          .query('vibes')
          .filter((q) => q.eq(q.field('id'), rating.vibeId))
          .first();

        if (!vibe) continue;

        // If no search query, include all reviews when searching specifically for reviews
        if (!searchTerms.length) {
          // If we're searching for specific types and reviews is one of them, include all reviews
          if (
            includeTypes &&
            includeTypes.includes('review') &&
            includeTypes.length === 1
          ) {
            // Include all reviews when on reviews tab
          } else if (filters && relatedVibeIds.size > 0) {
            // Only filter by related vibes if we have filters AND we found related vibes
            if (!relatedVibeIds.has(rating.vibeId)) continue;
          }
          // Otherwise include all reviews
        } else if (searchTerms.length > 0) {
          // Normal search behavior when there's a query - search in review text, vibe title, and emoji
          const searchableText = `${rating.review} ${vibe.title || ''} ${rating.emoji}`;
          if (!containsSearchTerms(searchableText, searchTerms)) continue;
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
          vibeImage: vibe.image,
          reviewerId: rating.userId,
          reviewerName: reviewer?.username || 'Unknown',
          reviewerAvatar: reviewer?.image_url,
          createdAt: rating._creationTime,
          score: fuzzyMatch(rating.review, searchTerms.join(' ')) ? 0.8 : 0.3,
        });
      }
    }

    // Search TAGS with limits
    if (!includeTypes || includeTypes.includes('tag')) {
      const tagsLimit =
        searchTerms.length > 0 || relatedTags.size === 0
          ? MAX_RESULTS_PER_TYPE
          : Math.min(relatedTags.size, MAX_RESULTS_PER_TYPE);

      // Use search index when we have search terms, otherwise use count ordering
      const tags =
        searchTerms.length > 0
          ? await ctx.db
              .query('tags')
              .withSearchIndex('search', (q) =>
                q.search('name', searchTerms.join(' '))
              )
              .take(tagsLimit)
          : await ctx.db
              .query('tags')
              .withIndex('byCount')
              .order('desc')
              .take(tagsLimit);

      for (const tag of tags) {
        if (allResults.tags.length >= MAX_RESULTS_PER_TYPE) break;

        // Apply search term filtering regardless of tab
        if (searchTerms.length > 0) {
          // Filter by search terms - the search index should handle this, but double-check
          const matchesSearch =
            containsSearchTerms(tag.name, searchTerms) ||
            searchTerms.some(
              (term) =>
                tag.name.toLowerCase().includes(term.toLowerCase()) ||
                term.toLowerCase().includes(tag.name.toLowerCase())
            );
          if (!matchesSearch) continue;
        } else {
          // If no search terms, only include tags if:
          // 1. We have other filters and they're related to vibes found
          // 2. OR we're doing a browsing query (no specific search context)
          if (filters && relatedTags.size > 0) {
            // Only include tags related to filtered vibes if we have other filters
            if (!relatedTags.has(tag.name)) continue;
          } else if (
            !filters &&
            (!includeTypes ||
              includeTypes.length !== 1 ||
              !includeTypes.includes('tag'))
          ) {
            // If no search terms and no filters, don't include any tags unless we're specifically browsing tags
            continue;
          }
        }

        // Use the actual tag count from the database
        let displayCount = tag.count;

        // Only recalculate count if we have specific tag filters that might affect the display
        if (!searchTerms.length && filters?.tags?.length) {
          // If we're filtering by specific tags, show the original count
          // since the tag filtering happens at the vibe level
          displayCount = tag.count;
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

    // Apply pagination based on includeTypes
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // If searching for specific types, paginate only those types
    if (includeTypes && includeTypes.length === 1) {
      const singleType = includeTypes[0];
      const typeMap = {
        vibe: 'vibes',
        user: 'users',
        tag: 'tags',
        review: 'reviews',
        action: 'actions',
      } as const;

      const resultKey = typeMap[singleType as keyof typeof typeMap];
      const typeResults = allResults[resultKey];
      const paginatedResults = typeResults.slice(startIndex, endIndex);

      // Return only the requested type with proper pagination
      return {
        vibes: singleType === 'vibe' ? paginatedResults : [],
        users: singleType === 'user' ? paginatedResults : [],
        tags: singleType === 'tag' ? paginatedResults : [],
        actions: singleType === 'action' ? paginatedResults : [],
        reviews: singleType === 'review' ? paginatedResults : [],
        totalCount: typeResults.length,
        totalCounts, // Still include breakdown by all types for badges
        page,
        pageSize,
        totalPages: Math.ceil(typeResults.length / pageSize),
        hasNextPage: endIndex < typeResults.length,
        hasPreviousPage: page > 1,
      };
    }

    // For "all" tab or multiple types, use combined pagination
    // Combine all results into a single array for proper mixed pagination
    const allCombined = [
      ...allResults.vibes,
      ...allResults.users,
      ...allResults.tags,
      ...allResults.actions,
      ...allResults.reviews,
    ];

    // Sort the combined results by score for relevance
    if (sortOption === 'relevance') {
      allCombined.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    // Paginate the combined results
    const paginatedCombined = allCombined.slice(startIndex, endIndex);

    // Separate back into types
    const paginatedResults = {
      vibes: paginatedCombined.filter((r) => r.type === 'vibe'),
      users: paginatedCombined.filter((r) => r.type === 'user'),
      tags: paginatedCombined.filter((r) => r.type === 'tag'),
      actions: paginatedCombined.filter((r) => r.type === 'action'),
      reviews: paginatedCombined.filter((r) => r.type === 'review'),
    };

    // Return paginated results with total counts
    return {
      vibes: paginatedResults.vibes,
      users: paginatedResults.users,
      tags: paginatedResults.tags,
      actions: paginatedResults.actions,
      reviews: paginatedResults.reviews,
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
