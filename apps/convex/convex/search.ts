import { query, mutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type {
  SearchRequest,
  SearchResponse,
  SearchResult,
  VibeSearchResult,
  UserSearchResult,
  TagSearchResult,
  SearchSortOption,
} from '@vibechecc/types';
import { fuzzyMatch, fuzzyScore } from './search/fuzzy_search';
import {
  scoreVibe,
  scoreUser,
  scoreTag,
  rerankResults,
} from './search/search_scorer';
import { parseSearchQuery, matchesParsedQuery } from './search/search_utils';

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
      })
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    includeTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, filters, limit = 20, includeTypes } = args;
    const startTime = Date.now();
    const results: SearchResult[] = [];

    if (!searchQuery.trim()) {
      return {
        results: [],
        totalCount: 0,
        hasMore: false,
      } as SearchResponse;
    }

    // Parse the query for advanced operators
    const parsedQuery = parseSearchQuery(searchQuery);

    // Merge parsed filters with provided filters
    const mergedFilters = {
      ...filters,
      tags: [...(filters?.tags || []), ...parsedQuery.tags],
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
        (parsedQuery.filters.user ? [parsedQuery.filters.user] : undefined),
    };

    // Build search text from parsed query
    const searchText = [...parsedQuery.terms, ...parsedQuery.exactPhrases]
      .join(' ')
      .toLowerCase();

    // Search vibes
    if (!includeTypes || includeTypes.includes('vibe')) {
      // Limit initial query for performance
      const allVibes = await ctx.db.query('vibes').take(500);

      for (const vibe of allVibes) {
        // Check if vibe matches using fuzzy search
        const titleMatch = fuzzyMatch(vibe.title, searchText);
        const descriptionMatch = fuzzyMatch(vibe.description, searchText);
        const tagMatch =
          vibe.tags?.some((tag) => fuzzyMatch(tag, searchText)) || false;

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
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : undefined;

            // Apply rating filter
            if (mergedFilters.minRating && avgRating !== undefined) {
              passesFilters =
                passesFilters && avgRating >= mergedFilters.minRating;
            }
            if (mergedFilters.maxRating && avgRating !== undefined) {
              passesFilters =
                passesFilters && avgRating <= mergedFilters.maxRating;
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
              results.push(vibeResult);
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
          results.push(userResult);
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
          results.push(tagResult);
        }
      });
    }

    // Sort results
    const sortedResults = [...results];
    const sortOption = mergedFilters.sort || 'relevance';

    switch (sortOption) {
      case 'relevance':
        sortedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'rating_desc':
        sortedResults.sort((a, b) => {
          const aRating = (a as VibeSearchResult).rating || 0;
          const bRating = (b as VibeSearchResult).rating || 0;
          return bRating - aRating;
        });
        break;
      case 'rating_asc':
        sortedResults.sort((a, b) => {
          const aRating = (a as VibeSearchResult).rating || 0;
          const bRating = (b as VibeSearchResult).rating || 0;
          return aRating - bRating;
        });
        break;
      case 'recent':
      case 'oldest':
        // For now, we'll keep the original order
        // In a real implementation, we'd need timestamps on all entities
        break;
    }

    // Apply pagination
    const startIndex = 0; // For now, simple pagination
    const endIndex = Math.min(startIndex + limit, sortedResults.length);
    const paginatedResults = sortedResults.slice(startIndex, endIndex);

    // Note: Search metrics tracking would need to be handled in a separate mutation
    // since queries cannot schedule functions

    return {
      results: paginatedResults,
      totalCount: sortedResults.length,
      hasMore: endIndex < sortedResults.length,
      nextCursor:
        endIndex < sortedResults.length ? String(endIndex) : undefined,
    } as SearchResponse;
  },
});

// Quick suggestions for command palette
export const getSearchSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, limit = 10 } = args;
    const results: {
      vibes: VibeSearchResult[];
      users: UserSearchResult[];
      tags: TagSearchResult[];
    } = {
      vibes: [],
      users: [],
      tags: [],
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
      };
    }

    // Implement quick search for suggestions with fuzzy matching
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchText = [...parsedQuery.terms, ...parsedQuery.exactPhrases]
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
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
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
