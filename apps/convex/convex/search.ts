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
    const results: SearchResult[] = [];
    const normalizedQuery = searchQuery.toLowerCase().trim();

    if (!normalizedQuery) {
      return {
        results: [],
        totalCount: 0,
        hasMore: false,
      } as SearchResponse;
    }

    // Helper function to calculate relevance score
    const calculateScore = (text: string, query: string): number => {
      const normalizedText = text.toLowerCase();
      const normalizedQueryWords = query.toLowerCase().split(' ');
      let score = 0;

      // Exact match gets highest score
      if (normalizedText === query) {
        score += 100;
      }

      // Contains exact phrase
      if (normalizedText.includes(query)) {
        score += 50;
      }

      // Contains all words
      const containsAllWords = normalizedQueryWords.every(word =>
        normalizedText.includes(word)
      );
      if (containsAllWords) {
        score += 30;
      }

      // Word matches
      normalizedQueryWords.forEach(word => {
        if (normalizedText.includes(word)) {
          score += 10;
        }
      });

      return score;
    };

    // Search vibes
    if (!includeTypes || includeTypes.includes('vibe')) {
      const vibesQuery = ctx.db.query('vibes');
      const allVibes = await vibesQuery.collect();

      for (const vibe of allVibes) {
        // Calculate relevance score
        const titleScore = calculateScore(vibe.title, normalizedQuery);
        const descriptionScore = calculateScore(vibe.description, normalizedQuery);
        const tagScore = vibe.tags
          ? Math.max(
              ...vibe.tags.map(tag => calculateScore(tag, normalizedQuery))
            )
          : 0;

        const totalScore = titleScore * 2 + descriptionScore + tagScore;

        if (totalScore > 0) {
          // Apply filters
          let passesFilters = true;

          // Tag filter
          if (filters?.tags && filters.tags.length > 0) {
            passesFilters =
              passesFilters &&
              (vibe.tags?.some(tag => filters.tags!.includes(tag)) ?? false);
          }

          // Date range filter
          if (filters?.dateRange) {
            const vibeDate = new Date(vibe.createdAt).getTime();
            const startDate = new Date(filters.dateRange.start).getTime();
            const endDate = new Date(filters.dateRange.end).getTime();
            passesFilters =
              passesFilters && vibeDate >= startDate && vibeDate <= endDate;
          }

          // Creator filter
          if (filters?.creators && filters.creators.length > 0) {
            passesFilters =
              passesFilters && filters.creators.includes(vibe.createdById);
          }

          if (passesFilters) {
            // Get creator info
            const creator = await ctx.db
              .query('users')
              .withIndex('byExternalId', q =>
                q.eq('externalId', vibe.createdById)
              )
              .first();

            // Get average rating
            const ratings = await ctx.db
              .query('ratings')
              .withIndex('vibe', q => q.eq('vibeId', vibe.id))
              .collect();

            const avgRating =
              ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : undefined;

            // Apply rating filter
            if (filters?.minRating && avgRating !== undefined) {
              passesFilters = passesFilters && avgRating >= filters.minRating;
            }
            if (filters?.maxRating && avgRating !== undefined) {
              passesFilters = passesFilters && avgRating <= filters.maxRating;
            }

            if (passesFilters) {
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
                score: totalScore,
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
      const usersQuery = ctx.db.query('users');
      const allUsers = await usersQuery.collect();

      for (const user of allUsers) {
        const username = user.username || '';
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const bio = user.bio || '';

        const usernameScore = calculateScore(username, normalizedQuery);
        const nameScore = calculateScore(fullName, normalizedQuery);
        const bioScore = calculateScore(bio, normalizedQuery) * 0.5;

        const totalScore = usernameScore * 2 + nameScore + bioScore;

        if (totalScore > 0) {
          // Get vibe count
          const userVibes = await ctx.db
            .query('vibes')
            .withIndex('createdBy', q =>
              q.eq('createdById', user.externalId)
            )
            .collect();

          const userResult: UserSearchResult = {
            id: user.externalId,
            type: 'user',
            title: user.username || 'Unknown user',
            subtitle: fullName || undefined,
            image: user.image_url,
            username: user.username || 'unknown',
            vibeCount: userVibes.length,
            score: totalScore,
          };
          results.push(userResult);
        }
      }
    }

    // Search tags
    if (!includeTypes || includeTypes.includes('tag')) {
      const vibesWithTags = await ctx.db
        .query('vibes')
        .collect();

      const tagCounts = new Map<string, number>();
      vibesWithTags.forEach(vibe => {
        vibe.tags?.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      tagCounts.forEach((count, tag) => {
        const score = calculateScore(tag, normalizedQuery);
        if (score > 0) {
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
    let sortedResults = [...results];
    const sortOption = filters?.sort || 'relevance';

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

    return {
      results: paginatedResults,
      totalCount: sortedResults.length,
      hasMore: endIndex < sortedResults.length,
      nextCursor: endIndex < sortedResults.length ? String(endIndex) : undefined,
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
      // Return recent searches or trending items when query is empty
      const currentUser = await ctx.auth.getUserIdentity();
      if (currentUser) {
        const recentSearches = await ctx.db
          .query('searchHistory')
          .withIndex('byUser', q =>
            q.eq('userId', currentUser.subject)
          )
          .order('desc')
          .take(5);

        // Return formatted recent searches
        return {
          recentSearches: recentSearches.map(search => search.query),
          vibes: [],
          users: [],
          tags: [],
        };
      }
      return results;
    }

    // Implement quick search for suggestions
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // Search vibes (limit 5)
    const vibes = await ctx.db.query('vibes').take(20);
    for (const vibe of vibes) {
      if (results.vibes.length >= 5) break;
      
      const matches = vibe.title.toLowerCase().includes(normalizedQuery) ||
                     vibe.description.toLowerCase().includes(normalizedQuery) ||
                     vibe.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery));
      
      if (matches) {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', q => q.eq('externalId', vibe.createdById))
          .first();
          
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', q => q.eq('vibeId', vibe.id))
          .collect();
          
        const avgRating = ratings.length > 0
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
          createdBy: creator ? {
            id: creator.externalId,
            name: creator.username || 'Unknown',
            avatar: creator.image_url,
          } : undefined,
        });
      }
    }
    
    // Search users (limit 3)
    const users = await ctx.db.query('users').take(15);
    for (const user of users) {
      if (results.users.length >= 3) break;
      
      const username = user.username || '';
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      
      if (username.toLowerCase().includes(normalizedQuery) ||
          fullName.toLowerCase().includes(normalizedQuery)) {
        const userVibes = await ctx.db
          .query('vibes')
          .withIndex('createdBy', q => q.eq('createdById', user.externalId))
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
    vibesWithTags.forEach(vibe => {
      vibe.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(normalizedQuery) && results.tags.length < 5) {
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

    return trending.map(item => ({
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
      .withIndex('byTerm', q => q.eq('term', normalizedQuery))
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