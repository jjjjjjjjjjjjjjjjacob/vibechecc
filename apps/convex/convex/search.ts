import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type {
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  ActionSearchResult,
} from '@vibechecc/types';
import { fuzzyMatch } from './search/fuzzy_search';
import { scoreVibe, scoreUser, scoreTag } from './search/search_scorer';
import { parseSearchQuery } from './search/search_utils';

// Main search function
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
            v.literal('recent'),
            v.literal('oldest')
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
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    includeTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, filters, limit = 20, includeTypes } = args;
    const _startTime = Date.now();
    const vibes: VibeSearchResult[] = [];
    const users: UserSearchResult[] = [];
    const tags: TagSearchResult[] = [];
    const actions: ActionSearchResult[] = [];

    if (!searchQuery.trim()) {
      return {
        vibes: [],
        users: [],
        tags: [],
        actions: [],
        totalCount: 0,
      };
    }

    // Parse the query for advanced operators
    const parsedQuery = parseSearchQuery(searchQuery);

    // If the query contains special characters but no operators, treat it as a literal search
    const hasSpecialChars = /[@#]/.test(searchQuery);
    const hasOperators =
      searchQuery.includes(':') ||
      searchQuery.includes('"') ||
      searchQuery.includes('-');

    let searchText: string;
    if (hasSpecialChars && !hasOperators) {
      // Treat as literal search
      searchText = searchQuery.toLowerCase();
      parsedQuery.terms = [searchQuery];
      parsedQuery.tags = [];
      parsedQuery.filters = {};
    } else {
      // Build search text from parsed query
      searchText = parsedQuery.terms
        .concat(parsedQuery.exactPhrases)
        .join(' ')
        .toLowerCase();
    }

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

    // Search vibes
    if (!includeTypes || includeTypes.includes('vibe')) {
      // Limit initial query for performance
      const allVibes = await ctx.db.query('vibes').take(500);

      for (const vibe of allVibes) {
        // Check if vibe matches using fuzzy search or exact phrase matching
        let titleMatch = false;
        let descriptionMatch = false;
        let tagMatch = false;

        // Check exact phrases first
        if (parsedQuery.exactPhrases.length > 0) {
          // For exact phrase search, ALL phrases must match
          let allPhrasesMatch = true;
          for (const phrase of parsedQuery.exactPhrases) {
            const phraseInTitle = vibe.title
              .toLowerCase()
              .includes(phrase.toLowerCase());
            const phraseInDesc = vibe.description
              .toLowerCase()
              .includes(phrase.toLowerCase());
            const phraseInTags =
              vibe.tags?.some((tag) =>
                tag.toLowerCase().includes(phrase.toLowerCase())
              ) || false;

            if (!phraseInTitle && !phraseInDesc && !phraseInTags) {
              allPhrasesMatch = false;
              break;
            }
          }

          if (allPhrasesMatch) {
            // Mark which fields matched for scoring
            for (const phrase of parsedQuery.exactPhrases) {
              if (vibe.title.toLowerCase().includes(phrase.toLowerCase())) {
                titleMatch = true;
              }
              if (
                vibe.description.toLowerCase().includes(phrase.toLowerCase())
              ) {
                descriptionMatch = true;
              }
              if (
                vibe.tags?.some((tag) =>
                  tag.toLowerCase().includes(phrase.toLowerCase())
                )
              ) {
                tagMatch = true;
              }
            }
          }
        } else {
          // If no exact phrases, use fuzzy matching
          titleMatch = fuzzyMatch(vibe.title, searchText);
          descriptionMatch = fuzzyMatch(vibe.description, searchText);
          tagMatch =
            vibe.tags?.some((tag) => fuzzyMatch(tag, searchText)) || false;
        }

        // Check for excluded terms
        const hasExcludedTerm = parsedQuery.excludedTerms.some(
          (term) =>
            vibe.title.toLowerCase().includes(term.toLowerCase()) ||
            vibe.description.toLowerCase().includes(term.toLowerCase()) ||
            vibe.tags?.some((tag) =>
              tag.toLowerCase().includes(term.toLowerCase())
            )
        );

        if (hasExcludedTerm) continue;

        if (titleMatch || descriptionMatch || tagMatch) {
          // Apply filters
          let passesFilters = true;

          // Tag filter
          if (mergedFilters.tags && mergedFilters.tags.length > 0) {
            passesFilters =
              passesFilters &&
              (vibe.tags?.some((tag) => mergedFilters.tags!.includes(tag)) ??
                false);
          }

          // Date range filter
          if (mergedFilters.dateRange) {
            const vibeDate = new Date(vibe.createdAt).getTime();
            const startDate = new Date(mergedFilters.dateRange.start).getTime();
            const endDate = new Date(mergedFilters.dateRange.end).getTime();
            passesFilters =
              passesFilters && vibeDate >= startDate && vibeDate <= endDate;
          }

          // Creator filter
          if (mergedFilters.creators && mergedFilters.creators.length > 0) {
            passesFilters =
              passesFilters &&
              mergedFilters.creators.includes(vibe.createdById);
          }

          if (passesFilters) {
            // Get creator info
            const creator = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', vibe.createdById)
              )
              .first();

            // Get average rating
            const ratings = await ctx.db
              .query('ratings')
              .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
              .collect();

            const avgRating =
              ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
                : undefined;

            // Apply rating filter
            if (
              mergedFilters.minRating !== undefined ||
              mergedFilters.maxRating !== undefined
            ) {
              if (avgRating === undefined) {
                // If no ratings and we have rating filters, skip this vibe
                passesFilters = false;
              } else {
                if (
                  mergedFilters.minRating !== undefined &&
                  avgRating < mergedFilters.minRating
                ) {
                  passesFilters = false;
                }
                if (
                  mergedFilters.maxRating !== undefined &&
                  avgRating > mergedFilters.maxRating
                ) {
                  passesFilters = false;
                }
              }
            }

            // Apply emoji rating filter
            if (mergedFilters.emojiRatings && passesFilters) {
              const { emojis, minValue } = mergedFilters.emojiRatings;

              if (emojis && emojis.length > 0) {
                // Get emoji ratings for this vibe
                const emojiRatings = await ctx.db
                  .query('ratings')
                  .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
                  .collect();

                // Check if vibe has any of the specified emojis
                const hasMatchingEmoji = emojiRatings.some(
                  (er) =>
                    emojis.includes(er.emoji) &&
                    (minValue === undefined || er.value >= minValue)
                );

                if (!hasMatchingEmoji) {
                  passesFilters = false;
                }
              } else if (minValue !== undefined) {
                // Just check if any emoji rating meets the minimum value
                const emojiRatings = await ctx.db
                  .query('ratings')
                  .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
                  .collect();

                const hasHighRating = emojiRatings.some(
                  (er) => er.value >= minValue
                );

                if (!hasHighRating) {
                  passesFilters = false;
                }
              }
            }

            if (passesFilters) {
              // Calculate advanced relevance score
              const score = scoreVibe(
                {
                  title: vibe.title,
                  description: vibe.description,
                  tags: vibe.tags,
                  createdAt: vibe.createdAt,
                  rating: avgRating,
                  ratingCount: ratings.length,
                },
                searchText
              );

              const vibeResult: VibeSearchResult = {
                id: vibe.id,
                type: 'vibe',
                title: vibe.title,
                subtitle: creator?.username || 'Unknown creator',
                image: vibe.image,
                description: vibe.description,
                rating: avgRating,
                ratingCount: ratings.length,
                tags: vibe.tags,
                score,
                createdBy: creator
                  ? {
                      id: creator.externalId,
                      name: creator.username || 'Unknown',
                      avatar: creator.image_url,
                    }
                  : undefined,
              };
              vibes.push(vibeResult);
            }
          }
        }
      }
    }

    // Search users
    if (!includeTypes || includeTypes.includes('user')) {
      // Limit initial query for performance
      const allUsers = await ctx.db.query('users').take(200);

      for (const user of allUsers) {
        const username = user.username || '';
        const fullName =
          `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const bio = user.bio || '';

        // Check fuzzy matching
        const usernameMatch = fuzzyMatch(username, searchText);
        const nameMatch = fuzzyMatch(fullName, searchText);
        const bioMatch = fuzzyMatch(bio, searchText);

        // Check for excluded terms
        const hasExcludedTerm = parsedQuery.excludedTerms.some(
          (term) =>
            username.toLowerCase().includes(term.toLowerCase()) ||
            fullName.toLowerCase().includes(term.toLowerCase()) ||
            bio.toLowerCase().includes(term.toLowerCase())
        );

        if (hasExcludedTerm) continue;

        if (usernameMatch || nameMatch || bioMatch) {
          // Apply creator filter if specified
          if (
            parsedQuery.filters.user &&
            username.toLowerCase() !== parsedQuery.filters.user.toLowerCase()
          ) {
            continue;
          }
          // Get vibe count
          const userVibes = await ctx.db
            .query('vibes')
            .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
            .collect();

          // Calculate advanced relevance score
          const score = scoreUser(
            {
              username,
              fullName,
              bio,
              vibeCount: userVibes.length,
            },
            searchText
          );

          const userResult: UserSearchResult = {
            id: user.externalId,
            type: 'user',
            title: user.username || 'Unknown user',
            subtitle: fullName || undefined,
            image: user.image_url,
            username: user.username || 'unknown',
            vibeCount: userVibes.length,
            score,
          };
          users.push(userResult);
        }
      }
    }

    // Search tags
    if (!includeTypes || includeTypes.includes('tag')) {
      // Limit for performance - tags are aggregated from vibes
      const vibesWithTags = await ctx.db.query('vibes').take(500);

      const tagCounts = new Map<string, number>();
      vibesWithTags.forEach((vibe) => {
        vibe.tags?.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      tagCounts.forEach((count, tag) => {
        // Check fuzzy matching
        const tagMatch = fuzzyMatch(tag, searchText);

        // Check for excluded terms
        const hasExcludedTerm = parsedQuery.excludedTerms.some((term) =>
          tag.toLowerCase().includes(term.toLowerCase())
        );

        if (hasExcludedTerm) return;

        if (tagMatch) {
          // Calculate advanced relevance score
          const score = scoreTag(
            {
              name: tag,
              count,
            },
            searchText
          );

          const tagResult: TagSearchResult = {
            id: tag,
            type: 'tag',
            title: tag,
            subtitle: `${count} vibe${count !== 1 ? 's' : ''}`,
            count,
            score,
          };
          tags.push(tagResult);
        }
      });
    }

    // Add action suggestions
    if (!includeTypes || includeTypes.includes('action')) {
      const lowerQuery = searchQuery.toLowerCase();

      // Check for "create" related queries
      if (
        lowerQuery.includes('create') ||
        lowerQuery.includes('new') ||
        lowerQuery.includes('add')
      ) {
        actions.push({
          id: 'create-vibe',
          type: 'action',
          title: 'Create a new vibe',
          subtitle: 'Share your experience with the community',
          action: 'create',
          icon: 'plus',
          score: fuzzyMatch('create', lowerQuery) ? 0.9 : 0.5,
        });
      }

      // Check for "profile" related queries
      if (
        lowerQuery.includes('profile') ||
        lowerQuery.includes('my') ||
        lowerQuery.includes('account')
      ) {
        actions.push({
          id: 'view-profile',
          type: 'action',
          title: 'View your profile',
          subtitle: 'See your vibes and stats',
          action: 'profile',
          icon: 'user',
          score: fuzzyMatch('profile', lowerQuery) ? 0.9 : 0.5,
        });
      }

      // Check for "settings" related queries
      if (
        lowerQuery.includes('setting') ||
        lowerQuery.includes('preference') ||
        lowerQuery.includes('config')
      ) {
        actions.push({
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

    // Apply sorting to each result type
    const sortOption = mergedFilters.sort || 'relevance';
    if (sortOption === 'relevance') {
      vibes.sort((a, b) => (b.score || 0) - (a.score || 0));
      users.sort((a, b) => (b.score || 0) - (a.score || 0));
      tags.sort((a, b) => (b.score || 0) - (a.score || 0));
      actions.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortOption === 'rating_desc') {
      vibes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOption === 'rating_asc') {
      vibes.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }

    // Apply limit - prioritize vibes for backward compatibility with tests
    let remainingLimit = limit;
    const paginatedVibes = vibes.slice(
      0,
      Math.min(vibes.length, remainingLimit)
    );
    remainingLimit -= paginatedVibes.length;

    const paginatedUsers =
      remainingLimit > 0
        ? users.slice(0, Math.min(users.length, remainingLimit))
        : [];
    remainingLimit -= paginatedUsers.length;

    const paginatedTags =
      remainingLimit > 0
        ? tags.slice(0, Math.min(tags.length, remainingLimit))
        : [];
    remainingLimit -= paginatedTags.length;

    const paginatedActions =
      remainingLimit > 0
        ? actions.slice(0, Math.min(actions.length, remainingLimit))
        : [];

    // For tests, when searching for specific content, return the actual count of filtered results
    const totalCount =
      vibes.length + users.length + tags.length + actions.length;

    // Note: Search metrics tracking would need to be handled in a separate mutation
    // since queries cannot schedule functions

    return {
      vibes: paginatedVibes,
      users: paginatedUsers,
      tags: paginatedTags,
      actions: paginatedActions,
      totalCount,
    };
  },
});

// Quick suggestions for command palette
export const getSearchSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery } = args;
    const results: {
      vibes: VibeSearchResult[];
      users: UserSearchResult[];
      tags: TagSearchResult[];
      actions: ActionSearchResult[];
    } = {
      vibes: [],
      users: [],
      tags: [],
      actions: [],
    };

    if (!searchQuery.trim()) {
      // Return recent searches and trending items when query is empty
      const currentUser = await ctx.auth.getUserIdentity();
      let recentSearches: string[] = [];

      if (currentUser) {
        const recentSearchHistory = await ctx.db
          .query('searchHistory')
          .withIndex('byUser', (q) => q.eq('userId', currentUser.subject))
          .order('desc')
          .take(5);

        recentSearches = recentSearchHistory.map((search) => search.query);
      }

      // Get trending searches
      const trendingSearches = await ctx.db
        .query('trendingSearches')
        .withIndex('byCount')
        .order('desc')
        .take(5);

      // Get popular tags as fallback suggestions
      const allVibes = await ctx.db.query('vibes').take(100);
      const tagCounts = new Map<string, number>();
      allVibes.forEach((vibe) => {
        vibe.tags?.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      const popularTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);

      return {
        recentSearches,
        trendingSearches: trendingSearches.map((t) => t.term),
        popularTags,
        vibes: [],
        users: [],
        tags: [],
        actions: [],
      };
    }

    // Implement quick search for suggestions with fuzzy matching
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchText = parsedQuery.terms
      .concat(parsedQuery.exactPhrases)
      .join(' ')
      .toLowerCase();

    // Search vibes (limit 5)
    const vibes = await ctx.db.query('vibes').take(20);
    for (const vibe of vibes) {
      if (results.vibes.length >= 5) break;

      const matches =
        fuzzyMatch(vibe.title, searchText) ||
        fuzzyMatch(vibe.description, searchText) ||
        vibe.tags?.some((tag) => fuzzyMatch(tag, searchText));

      if (matches) {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : undefined;

        results.vibes.push({
          id: vibe.id,
          type: 'vibe',
          title: vibe.title,
          subtitle: creator?.username || 'Unknown creator',
          image: vibe.image,
          description: vibe.description,
          rating: avgRating,
          ratingCount: ratings.length,
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
    }

    // Search users (limit 3)
    const users = await ctx.db.query('users').take(15);
    for (const user of users) {
      if (results.users.length >= 3) break;

      const username = user.username || '';
      const fullName =
        `${user.first_name || ''} ${user.last_name || ''}`.trim();

      if (
        fuzzyMatch(username, searchText) ||
        fuzzyMatch(fullName, searchText)
      ) {
        const userVibes = await ctx.db
          .query('vibes')
          .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
          .collect();

        results.users.push({
          id: user.externalId,
          type: 'user',
          title: user.username || 'Unknown user',
          subtitle: fullName || undefined,
          image: user.image_url,
          username: user.username || 'unknown',
          vibeCount: userVibes.length,
        });
      }
    }

    // Search tags (limit 5)
    const vibesWithTags = await ctx.db.query('vibes').collect();
    const tagCounts = new Map<string, number>();
    vibesWithTags.forEach((vibe) => {
      vibe.tags?.forEach((tag) => {
        if (fuzzyMatch(tag, searchText) && results.tags.length < 5) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });

    tagCounts.forEach((count, tag) => {
      if (results.tags.length < 5) {
        results.tags.push({
          id: tag,
          type: 'tag',
          title: tag,
          subtitle: `${count} vibe${count !== 1 ? 's' : ''}`,
          count,
        });
      }
    });

    // Add action suggestions (limit 3)
    const lowerQuery = searchQuery.toLowerCase();

    // Check for "create" related queries
    if (
      results.actions.length < 3 &&
      (lowerQuery.includes('create') ||
        lowerQuery.includes('new') ||
        lowerQuery.includes('add'))
    ) {
      results.actions.push({
        id: 'create-vibe',
        type: 'action',
        title: 'Create a new vibe',
        subtitle: 'Share your experience with the community',
        action: 'create',
        icon: 'plus',
      });
    }

    // Check for "profile" related queries
    if (
      results.actions.length < 3 &&
      (lowerQuery.includes('profile') ||
        lowerQuery.includes('my') ||
        lowerQuery.includes('account'))
    ) {
      results.actions.push({
        id: 'view-profile',
        type: 'action',
        title: 'View your profile',
        subtitle: 'See your vibes and stats',
        action: 'profile',
        icon: 'user',
      });
    }

    // Check for "settings" related queries
    if (
      results.actions.length < 3 &&
      (lowerQuery.includes('setting') ||
        lowerQuery.includes('preference') ||
        lowerQuery.includes('config'))
    ) {
      results.actions.push({
        id: 'open-settings',
        type: 'action',
        title: 'Open settings',
        subtitle: 'Manage your account preferences',
        action: 'settings',
        icon: 'settings',
      });
    }

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

    return trending.map((item) => ({
      term: item.term,
      count: item.count,
      category: item.category,
    }));
  },
});

// Track search (mutation)
export const trackSearch = mutation({
  args: {
    query: v.string(),
    resultCount: v.number(),
    clickedResults: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { query, resultCount, clickedResults } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error('User must be authenticated to track searches');
    }

    // Record search history
    await ctx.db.insert('searchHistory', {
      userId: identity.subject,
      query,
      timestamp: Date.now(),
      resultCount,
      clickedResults,
    });

    // Update trending searches
    const normalizedQuery = query.toLowerCase().trim();
    const existing = await ctx.db
      .query('trendingSearches')
      .withIndex('byTerm', (q) => q.eq('term', normalizedQuery))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert('trendingSearches', {
        term: normalizedQuery,
        count: 1,
        lastUpdated: Date.now(),
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
