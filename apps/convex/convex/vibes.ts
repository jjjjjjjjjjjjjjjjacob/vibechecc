import {
  mutation,
  query,
  internalMutation,
  type MutationCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { SecurityValidators, AuthUtils } from './lib/securityValidators';

// Helper function to compute user display name (backend version)
function computeUserDisplayName(user: Doc<'users'> | null): string {
  if (!user) {
    return 'Someone';
  }

  // Priority 1: username
  if (user.username?.trim()) {
    return user.username.trim();
  }

  // Priority 2: first_name + last_name
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  // No legacy name field in Convex schema - skip this step

  // Fallback
  return 'Someone';
}

// Type definitions for extended vibe objects
type VibeWithEmojiData = Doc<'vibes'> & {
  avgEmojiRating: number;
  hasEmojiFilter: boolean;
};

// Simple get all vibes (for backwards compatibility)
export const getAllSimple = query({
  handler: async (ctx) => {
    // Just return basic vibe data without complex joins, filtering out deleted vibes
    return await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .order('desc')
      .take(50);
  },
});

// Get filtered vibes (paginated)
export const getFilteredVibes = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    filters: v.optional(
      v.object({
        emojis: v.optional(v.array(v.string())),
        minRating: v.optional(v.number()),
        maxRating: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        sort: v.optional(
          v.union(
            v.literal('recent'),
            v.literal('rating_desc'),
            v.literal('rating_asc'),
            v.literal('top_rated'),
            v.literal('most_rated'),
            v.literal('name'),
            v.literal('creation_date'),
            v.literal('hot'),
            v.literal('boosted'),
            v.literal('controversial')
          )
        ),
        minRatingCount: v.optional(v.number()),
        maxRatingCount: v.optional(v.number()),
        followingOnly: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const filters = args.filters || {};

    // If followingOnly is requested, get following user IDs
    let followingIds: string[] = [];
    if (filters.followingOnly) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return {
          vibes: [],
          continueCursor: null,
          isDone: true,
        };
      }

      const followingList = await ctx.db
        .query('follows')
        .withIndex('byFollower', (q) => q.eq('followerId', identity.subject))
        .collect();

      if (followingList.length === 0) {
        return {
          vibes: [],
          continueCursor: null,
          isDone: true,
        };
      }

      followingIds = followingList.map((follow) => follow.followingId);
    }

    // Start with base query and apply sorting
    let vibesQuery;
    switch (filters.sort) {
      case 'recent':
      case 'creation_date':
      default:
        vibesQuery = ctx.db.query('vibes').order('desc');
        break;
      case 'name':
        // Note: Convex doesn't support ordering by text fields directly
        vibesQuery = ctx.db.query('vibes').order('desc');
        break;
      case 'boosted':
        // Sort by boost score descending (highest boosted first)
        vibesQuery = ctx.db.query('vibes').withIndex('byBoostScore', (q) => q.gte('boostScore', 0)).order('desc');
        break;
      case 'hot':
      case 'controversial':
        // For hot and controversial, we need to fetch vibes and sort by computed scores
        // Use recent order first, then apply scoring algorithm
        vibesQuery = ctx.db.query('vibes').order('desc');
        break;
    }

    // Get paginated vibes
    const vibesPaginated = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit * 2, // Get extra to filter
    });

    // Filter vibes based on criteria
    let filteredVibes = vibesPaginated.page;

    // Filter by following users if requested
    if (filters.followingOnly && followingIds.length > 0) {
      filteredVibes = filteredVibes.filter((vibe) =>
        followingIds.includes(vibe.createdById)
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filteredVibes = filteredVibes.filter((vibe) =>
        vibe.tags?.some((tag) => filters.tags!.includes(tag))
      );
    }

    // Get emoji ratings if emoji filter is present - OPTIMIZED BATCH FETCH
    let vibesWithEmojiRatings = filteredVibes;
    if (filters.emojis && filters.emojis.length > 0) {
      // Batch fetch all ratings for all vibes in one go
      const vibeIds = filteredVibes.map((v) => v.id);
      const allRatings = await Promise.all(
        vibeIds.map((vibeId) =>
          ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibeId))
            .collect()
        )
      );

      // Create a map for O(1) lookup
      const ratingsMap = new Map<string, (typeof allRatings)[0]>();
      vibeIds.forEach((vibeId, index) => {
        ratingsMap.set(vibeId, allRatings[index]);
      });

      // Process vibes with pre-fetched ratings
      vibesWithEmojiRatings = filteredVibes.map((vibe) => {
        const emojiRatings = ratingsMap.get(vibe.id) || [];
        const relevantEmojiRatings = emojiRatings.filter((rating) =>
          filters.emojis!.includes(rating.emoji)
        );

        const avgEmojiRating =
          relevantEmojiRatings.length > 0
            ? relevantEmojiRatings.reduce((sum, r) => sum + r.value, 0) /
              relevantEmojiRatings.length
            : 0;

        return {
          ...vibe,
          avgEmojiRating,
          hasEmojiFilter: relevantEmojiRatings.length > 0,
        } as typeof vibe & {
          avgEmojiRating: number;
          hasEmojiFilter: boolean;
        };
      });

      // Filter out vibes without the required emoji ratings
      vibesWithEmojiRatings = vibesWithEmojiRatings.filter(
        (vibe): vibe is VibeWithEmojiData =>
          'hasEmojiFilter' in vibe && Boolean(vibe.hasEmojiFilter)
      );

      // Apply min rating filter for emojis
      if (filters.minRating) {
        vibesWithEmojiRatings = vibesWithEmojiRatings.filter(
          (vibe) =>
            'avgEmojiRating' in vibe &&
            typeof vibe.avgEmojiRating === 'number' &&
            vibe.avgEmojiRating >= filters.minRating!
        );
      }
    }

    // Apply general rating filters - OPTIMIZED BATCH FETCH
    if (!filters.emojis && (filters.minRating || filters.maxRating)) {
      // Batch fetch all ratings for all vibes
      const vibeIds = vibesWithEmojiRatings.map((v) => ('id' in v ? v.id : ''));
      const allRatings = await Promise.all(
        vibeIds.map((vibeId) =>
          ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibeId))
            .collect()
        )
      );

      // Create a map for O(1) lookup
      const ratingsMap = new Map<string, (typeof allRatings)[0]>();
      vibeIds.forEach((vibeId, index) => {
        ratingsMap.set(vibeId, allRatings[index]);
      });

      // Process vibes with pre-fetched ratings
      vibesWithEmojiRatings = vibesWithEmojiRatings.map((vibe) => {
        const ratings = ratingsMap.get('id' in vibe ? vibe.id : '') || [];
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : 0;

        return {
          ...vibe,
          rating: averageRating,
          ratingCount: ratings.length,
        } as typeof vibe & { rating: number; ratingCount: number };
      });

      vibesWithEmojiRatings = vibesWithEmojiRatings.filter((vibe) => {
        if (
          filters.minRating &&
          'rating' in vibe &&
          typeof vibe.rating === 'number' &&
          vibe.rating < filters.minRating
        )
          return false;
        if (
          filters.maxRating &&
          'rating' in vibe &&
          typeof vibe.rating === 'number' &&
          vibe.rating > filters.maxRating
        )
          return false;
        return true;
      });
    }

    // Filter by rating count if requested - OPTIMIZED BATCH FETCH
    if (
      filters.minRatingCount !== undefined ||
      filters.maxRatingCount !== undefined
    ) {
      // Only fetch if we haven't already fetched ratings
      if (!('ratingCount' in (vibesWithEmojiRatings[0] || {}))) {
        const vibeIds = vibesWithEmojiRatings.map((v) =>
          'id' in v ? v.id : ''
        );
        const allRatings = await Promise.all(
          vibeIds.map((vibeId) =>
            ctx.db
              .query('ratings')
              .withIndex('vibe', (q) => q.eq('vibeId', vibeId))
              .collect()
          )
        );

        // Create a map for O(1) lookup
        const ratingsMap = new Map<string, (typeof allRatings)[0]>();
        vibeIds.forEach((vibeId, index) => {
          ratingsMap.set(vibeId, allRatings[index]);
        });

        // Process vibes with pre-fetched ratings
        vibesWithEmojiRatings = vibesWithEmojiRatings.map((vibe) => {
          const ratings = ratingsMap.get('id' in vibe ? vibe.id : '') || [];
          return {
            ...vibe,
            ratingCount: ratings.length,
          } as typeof vibe & { ratingCount: number };
        });
      }

      vibesWithEmojiRatings = vibesWithEmojiRatings.filter((vibe) => {
        if ('ratingCount' in vibe && typeof vibe.ratingCount === 'number') {
          if (
            filters.minRatingCount !== undefined &&
            vibe.ratingCount < filters.minRatingCount
          ) {
            return false;
          }
          if (
            filters.maxRatingCount !== undefined &&
            vibe.ratingCount > filters.maxRatingCount
          ) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort if needed (for rating-based sorts and boost score sorts)
    if (filters.sort === 'rating_desc') {
      vibesWithEmojiRatings.sort(
        (a, b) =>
          (('rating' in a && typeof a.rating === 'number' ? a.rating : 0) ||
            0) -
          (('rating' in b && typeof b.rating === 'number' ? b.rating : 0) || 0)
      );
    } else if (filters.sort === 'rating_asc') {
      vibesWithEmojiRatings.sort(
        (a, b) =>
          (('rating' in a && typeof a.rating === 'number' ? a.rating : 0) ||
            0) -
          (('rating' in b && typeof b.rating === 'number' ? b.rating : 0) || 0)
      );
    } else if (filters.sort === 'most_rated') {
      vibesWithEmojiRatings.sort(
        (a, b) =>
          (('ratingCount' in b && typeof b.ratingCount === 'number'
            ? b.ratingCount
            : 0) || 0) -
          (('ratingCount' in a && typeof a.ratingCount === 'number'
            ? a.ratingCount
            : 0) || 0)
      );
    } else if (filters.sort === 'top_rated') {
      vibesWithEmojiRatings.sort((a, b) => {
        const scoreA =
          (('rating' in a && typeof a.rating === 'number' ? a.rating : 0) ||
            0) *
          Math.log1p(
            ('ratingCount' in a && typeof a.ratingCount === 'number'
              ? a.ratingCount
              : 0) || 0
          );
        const scoreB =
          (('rating' in b && typeof b.rating === 'number' ? b.rating : 0) ||
            0) *
          Math.log1p(
            ('ratingCount' in b && typeof b.ratingCount === 'number'
              ? b.ratingCount
              : 0) || 0
          );
        return scoreB - scoreA;
      });
    } else if (filters.sort === 'boosted') {
      // Sort by boost score descending (highest boost first)
      vibesWithEmojiRatings.sort((a, b) => {
        const boostA = a.boostScore || 0;
        const boostB = b.boostScore || 0;
        return boostB - boostA;
      });
    } else if (filters.sort === 'hot') {
      // Hot algorithm: combine boost score with recency and engagement
      // Reddit-style hot score algorithm
      vibesWithEmojiRatings.sort((a, b) => {
        const now = Date.now();
        const ageInHours = (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
        const ageInHoursB = (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);
        
        // Get engagement metrics
        const ratingCountA = ('ratingCount' in a && typeof a.ratingCount === 'number') ? a.ratingCount : 0;
        const ratingCountB = ('ratingCount' in b && typeof b.ratingCount === 'number') ? b.ratingCount : 0;
        const boostA = a.boostScore || 0;
        const boostB = b.boostScore || 0;
        
        // Hot score = (boosts + rating engagement) / (age + 2)^1.5
        // The +2 prevents division by zero and gives newer content a boost
        const hotScoreA = (boostA + ratingCountA) / Math.pow(ageInHours + 2, 1.5);
        const hotScoreB = (boostB + ratingCountB) / Math.pow(ageInHoursB + 2, 1.5);
        
        return hotScoreB - hotScoreA;
      });
    } else if (filters.sort === 'controversial') {
      // Controversial algorithm: high engagement with mixed boost/dampen scores
      vibesWithEmojiRatings.sort((a, b) => {
        const boostA = a.totalBoosts || 0;
        const dampenA = a.totalDampens || 0;
        const boostB = b.totalBoosts || 0;
        const dampenB = b.totalDampens || 0;
        
        // Controversial score: activity level * controversy ratio
        // High controversy = similar amounts of boosts and dampens
        const totalActivityA = boostA + dampenA;
        const totalActivityB = boostB + dampenB;
        
        if (totalActivityA === 0 && totalActivityB === 0) return 0;
        if (totalActivityA === 0) return 1;
        if (totalActivityB === 0) return -1;
        
        // Controversy ratio: closer to 0.5 = more controversial
        const controversyRatioA = Math.abs((boostA / totalActivityA) - 0.5);
        const controversyRatioB = Math.abs((boostB / totalActivityB) - 0.5);
        
        // Invert ratio so lower values (more controversial) rank higher
        const controversyScoreA = (0.5 - controversyRatioA) * totalActivityA;
        const controversyScoreB = (0.5 - controversyRatioB) * totalActivityB;
        
        return controversyScoreB - controversyScoreA;
      });
    }

    // Limit results
    const finalVibes = vibesWithEmojiRatings.slice(0, limit);

    // Get details for final vibes
    // OPTIMIZED: Batch fetch all users and ratings
    // Step 1: Collect all user IDs we need to fetch
    const creatorIds = [...new Set(finalVibes.map((v) => v.createdById))];

    // Step 2: Batch fetch all creators
    const creators = await Promise.all(
      creatorIds.map((id) =>
        ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', id))
          .first()
      )
    );
    const creatorMap = new Map(creatorIds.map((id, i) => [id, creators[i]]));

    // Step 3: Batch fetch ratings for all vibes
    const allRatings = await Promise.all(
      finalVibes.map((vibe) =>
        ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(10)
      )
    );

    // Step 4: Collect all rating user IDs
    const ratingUserIds = [...new Set(allRatings.flat().map((r) => r.userId))];

    // Step 5: Batch fetch all rating users
    const ratingUsers = await Promise.all(
      ratingUserIds.map((id) =>
        ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', id))
          .first()
      )
    );
    const ratingUserMap = new Map(
      ratingUserIds.map((id, i) => [id, ratingUsers[i]])
    );

    // Step 6: Assemble the final data structure
    const vibesWithDetails = finalVibes.map((vibe, index) => {
      const creator = creatorMap.get(vibe.createdById);
      const ratings = allRatings[index];

      const ratingDetails = ratings.map((rating) => ({
        user: ratingUserMap.get(rating.userId),
        emoji: rating.emoji,
        value: rating.value,
        review: rating.review,
        createdAt: rating.createdAt,
      }));

      return {
        ...vibe,
        createdBy: creator,
        ratings: ratingDetails,
      };
    });

    return {
      vibes: vibesWithDetails,
      continueCursor: vibesPaginated.continueCursor,
      isDone: vibesPaginated.isDone || finalVibes.length < limit,
    };
  },
});

// Get all vibes (paginated to avoid document read limits)
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20; // Default to 20 vibes to limit reads

    // Get vibes with pagination
    const vibesQuery = ctx.db.query('vibes').order('desc');
    const vibes = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit,
    });

    // OPTIMIZED: Batch fetch all users and ratings to eliminate N+1 queries
    // Step 1: Collect all creator IDs
    const creatorIds = [...new Set(vibes.page.map((v) => v.createdById))];

    // Step 2: Batch fetch all creators using indexed queries
    const creators = await Promise.all(
      creatorIds.map((id) =>
        ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', id))
          .first()
      )
    );
    const creatorMap = new Map(creatorIds.map((id, i) => [id, creators[i]]));

    // Step 3: Batch fetch ratings for all vibes
    const allRatings = await Promise.all(
      vibes.page.map(
        (vibe) =>
          ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .take(10) // Limit to 10 most recent ratings
      )
    );

    // Step 4: Collect all rating user IDs
    const ratingUserIds = [...new Set(allRatings.flat().map((r) => r.userId))];

    // Step 5: Batch fetch all rating users
    const ratingUsers = await Promise.all(
      ratingUserIds.map((id) =>
        ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', id))
          .first()
      )
    );
    const ratingUserMap = new Map(
      ratingUserIds.map((id, i) => [id, ratingUsers[i]])
    );

    // Step 6: Assemble the final data structure with O(1) lookups
    const vibesWithDetails = vibes.page.map((vibe, index) => {
      const creator = creatorMap.get(vibe.createdById);
      const ratings = allRatings[index];

      const ratingDetails = ratings.map((rating) => ({
        user: ratingUserMap.get(rating.userId),
        emoji: rating.emoji,
        value: rating.value,
        review: rating.review,
        createdAt: rating.createdAt,
      }));

      return {
        ...vibe,
        createdBy: creator,
        ratings: ratingDetails,
      };
    });

    return {
      vibes: vibesWithDetails,
      continueCursor: vibes.continueCursor,
      isDone: vibes.isDone,
    };
  },
});

// Get a single vibe by ID - SECURITY ENHANCED
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first();

    if (!vibe) {
      return null;
    }

    // SECURITY: For deleted vibes, only show to owner
    if (vibe.visibility === 'deleted') {
      const isOwner = identity?.subject === vibe.createdById;
      if (!isOwner) {
        return null; // Don't expose deleted vibes to non-owners
      }
      return {
        ...vibe,
        isDeleted: true,
        createdBy: null,
        ratings: [],
      };
    }

    // Note: All vibes are public or deleted - no private visibility

    const creator = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', vibe.createdById))
      .first();

    const ratings = await ctx.db
      .query('ratings')
      .filter((q) => q.eq(q.field('vibeId'), vibe.id))
      .collect();

    // PERFORMANCE OPTIMIZED: Batch user queries to eliminate N+1 pattern
    const uniqueUserIds = [...new Set(ratings.map((r) => r.userId))];
    const users = await ctx.db
      .query('users')
      .filter((q) =>
        q.or(...uniqueUserIds.map((id) => q.eq(q.field('externalId'), id)))
      )
      .collect();

    // Create lookup map for O(1) user access
    const userMap = new Map(users.map((user) => [user.externalId, user]));

    const ratingDetails = ratings.map((rating) => ({
      _id: rating._id,
      user: userMap.get(rating.userId) || null,
      emoji: rating.emoji,
      value: rating.value,
      review: rating.review,
      createdAt: rating.createdAt,
    }));

    return {
      ...vibe,
      isDeleted: false,
      createdBy: creator,
      ratings: ratingDetails,
    };
  },
});

// Get vibes by user ID - SECURITY ENHANCED
export const getByUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const isOwnProfile = identity?.subject === args.userId;

    // SECURITY: For non-own profiles, only show public vibes
    // For own profile, show all non-deleted vibes
    let query;
    if (isOwnProfile) {
      // Use index and then filter for non-deleted
      query = ctx.db
        .query('vibes')
        .withIndex('createdBy', (q) => q.eq('createdById', args.userId))
        .filter((q) => q.neq(q.field('visibility'), 'deleted'));
    } else {
      query = ctx.db
        .query('vibes')
        .withIndex('byCreatedByAndVisibility', (q) =>
          q.eq('createdById', args.userId).eq('visibility', 'public')
        );
    }

    const vibes = await query.take(args.limit ?? 20);

    // PERFORMANCE OPTIMIZED: Batch creator queries
    const uniqueCreatorIds = [...new Set(vibes.map((v) => v.createdById))];
    const creators = await ctx.db
      .query('users')
      .filter((q) =>
        q.or(...uniqueCreatorIds.map((id) => q.eq(q.field('externalId'), id)))
      )
      .collect();

    const creatorMap = new Map(creators.map((user) => [user.externalId, user]));

    // PERFORMANCE OPTIMIZED: Batch all ratings queries and user queries
    const allVibeIds = vibes.map((v) => v.id);
    const allRatings = await ctx.db
      .query('ratings')
      .filter((q) =>
        q.or(...allVibeIds.map((id) => q.eq(q.field('vibeId'), id)))
      )
      .collect();

    // Group ratings by vibeId for efficient lookup
    const ratingsByVibeId = new Map<string, typeof allRatings>();
    allRatings.forEach((rating) => {
      const existing = ratingsByVibeId.get(rating.vibeId) || [];
      existing.push(rating);
      ratingsByVibeId.set(rating.vibeId, existing);
    });

    // Get all unique rating user IDs for batch user query
    const uniqueRatingUserIds = [...new Set(allRatings.map((r) => r.userId))];
    const ratingUsers = await ctx.db
      .query('users')
      .filter((q) =>
        q.or(
          ...uniqueRatingUserIds.map((id) => q.eq(q.field('externalId'), id))
        )
      )
      .collect();

    const ratingUserMap = new Map(
      ratingUsers.map((user) => [user.externalId, user])
    );

    return vibes.map((vibe) => {
      const creator = creatorMap.get(vibe.createdById);
      const vibeRatings = ratingsByVibeId.get(vibe.id) || [];

      const ratingDetails = vibeRatings.map((rating) => ({
        user: ratingUserMap.get(rating.userId) || null,
        emoji: rating.emoji,
        value: rating.value,
        review: rating.review,
        createdAt: rating.createdAt,
      }));

      return {
        ...vibe,
        createdBy: creator,
        ratings: ratingDetails,
      };
    });
  },
});

// Get vibes that a user has rated
export const getUserRatedVibes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get all ratings by the user
    const userRatings = await ctx.db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', args.userId))
      .collect();

    // Get unique vibe IDs that the user has rated
    const ratedVibeIds = Array.from(new Set(userRatings.map((r) => r.vibeId)));

    // Get the vibes for those IDs
    const vibes = await Promise.all(
      ratedVibeIds.map(async (vibeId) => {
        const vibe = await ctx.db
          .query('vibes')
          .filter((q) => q.eq(q.field('id'), vibeId))
          .first();

        if (!vibe) return null;

        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('externalId'), vibe.createdById))
          .first();

        const ratings = await ctx.db
          .query('ratings')
          .filter((q) => q.eq(q.field('vibeId'), vibe.id))
          .collect();

        const ratingDetails = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', rating.userId)
              )
              .first();
            return {
              user,
              emoji: rating.emoji,
              value: rating.value,
              review: rating.review,
              createdAt: rating.createdAt,
            };
          })
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
        };
      })
    );

    // Filter out null values and return
    return vibes.filter((vibe) => vibe !== null);
  },
});

// Create a new vibe - SECURITY ENHANCED
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    image: v.optional(v.union(v.string(), v.id('_storage'))),
    tags: v.optional(v.array(v.string())),
    gradientFrom: v.optional(v.string()),
    gradientTo: v.optional(v.string()),
    gradientDirection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Check authentication and validate input
    const identity = await ctx.auth.getUserIdentity();
    const userId = AuthUtils.requireAuth(identity?.subject);

    // SECURITY: Rate limiting check
    await SecurityValidators.checkRateLimit(userId, 'create_vibe', 5, 300000); // 5 vibes per 5 minutes

    // SECURITY: Validate and sanitize inputs
    const title = SecurityValidators.validateVibeTitle(args.title);
    const description = SecurityValidators.validateVibeDescription(
      args.description
    );
    const tags = SecurityValidators.validateTags(args.tags);

    // Ensure user exists in our database
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', identity!.subject))
      .first();

    // If user doesn't exist, create them with basic info from Clerk
    if (!user) {
      await ctx.db.insert('users', {
        externalId: identity!.subject,
        username: undefined,
        first_name: undefined,
        last_name: undefined,
        image_url: undefined,
        profile_image_url: undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    // Generate a unique ID for the vibe
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    // SECURITY: Handle image validation and storage
    let imageValue: string | undefined;
    let imageStorageIdValue: Id<'_storage'> | undefined;

    if (args.image) {
      // Check if it looks like a storage ID (32 char alphanumeric string)
      const isStorageId =
        typeof args.image === 'string' && /^[a-z0-9]{32}$/.test(args.image);

      if (isStorageId) {
        // Treat as storage ID
        imageStorageIdValue = args.image as Id<'_storage'>;
        // Get URL for backward compatibility - storage URLs are trusted, no validation needed
        const imageUrl = await ctx.storage.getUrl(imageStorageIdValue);
        if (imageUrl) {
          imageValue = imageUrl;
        }
      } else if (typeof args.image === 'string') {
        // For string URLs, validate them
        // But be lenient - if validation fails, just skip the image rather than throwing
        try {
          imageValue = SecurityValidators.validateUrl(args.image) || undefined;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Image URL validation failed, skipping image:', error);
          // Don't throw - just don't set the image
          imageValue = undefined;
        }
      } else {
        // This shouldn't happen with current types, but handle it just in case
        imageStorageIdValue = args.image;
        const imageUrl = await ctx.storage.getUrl(args.image);
        if (imageUrl) {
          imageValue = imageUrl;
        }
      }
    }

    const _vibeId = await ctx.db.insert('vibes', {
      id,
      title,
      description,
      image: imageValue,
      imageStorageId: imageStorageIdValue,
      createdById: userId,
      createdAt: now,
      tags: tags || [],
      visibility: 'public', // Default to public visibility
      gradientFrom: args.gradientFrom,
      gradientTo: args.gradientTo,
      gradientDirection: args.gradientDirection,
    });

    // Update tag usage counts
    if (args.tags && args.tags.length > 0) {
      await (
        ctx.scheduler as unknown as {
          runAfter: (
            delay: number,
            fn: unknown,
            args: unknown
          ) => Promise<unknown>;
        }
      ).runAfter(0, internal.tags.updateTagCounts, {
        tagsToAdd: args.tags,
      });
    }

    // Create notifications for followers (skip in test environment)
    try {
      if (!identity) throw new Error('No identity found');

      const creatorDisplayName = computeUserDisplayName(user);

      // PERFORMANCE OPTIMIZED: Use batch notification system
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createFollowerNotifications,
        {
          triggerUserId: identity.subject,
          triggerUserDisplayName: creatorDisplayName,
          type: 'new_vibe',
          targetId: id, // Link to the new vibe
          title: `${creatorDisplayName} shared a new vibe`,
          description: 'check it out',
          metadata: {
            vibeTitle: args.title,
          },
          maxFollowers: 100, // Explicit limit for performance
        }
      );
    } catch (error) {
      // Don't fail the vibe creation if notification creation fails
      // eslint-disable-next-line no-console
      console.error('Failed to create new vibe notifications:', error);
    }

    // Award points for posting a vibe
    try {
      if (identity) {
        await ctx.scheduler.runAfter(0, internal.userPoints.awardPointsForVibe, {
          userId: identity.subject,
          vibeId: id,
        });
      }
    } catch (error) {
      // Don't fail the vibe creation if points award fails
      // eslint-disable-next-line no-console
      console.error('Failed to award points for vibe creation:', error);
    }

    return id;
  },
});

// Helper function to add vibe tags to user interests
const addInterestsFromVibe = async (
  ctx: MutationCtx,
  userId: string,
  vibeId: string
): Promise<void> => {
  try {
    // Get the vibe to extract its tags
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), vibeId))
      .first();

    // Return early if vibe doesn't exist or has no tags
    if (!vibe || !vibe.tags || vibe.tags.length === 0) {
      return;
    }

    // Get the user to get current interests
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', userId))
      .first();

    // Return early if user doesn't exist
    if (!user) {
      return;
    }

    // Get current interests (empty array if none exist)
    const currentInterests = new Set(user.interests || []);

    // Add new tags that aren't already in interests
    let hasNewInterests = false;
    const _newTags = vibe.tags.filter((tag: string) => {
      if (!currentInterests.has(tag)) {
        currentInterests.add(tag);
        hasNewInterests = true;
        return true;
      }
      return false;
    });

    // Update user interests if we have new ones
    if (hasNewInterests) {
      await ctx.db.patch(user._id, {
        interests: Array.from(currentInterests),
        updated_at: Date.now(),
      });
    }
  } catch {
    // Error adding interests from vibe - don't throw to avoid breaking the rating process
  }
};

// Add a rating to a vibe
// Get ratings given by a user (ratings they've left on vibes)
export const getUserRatings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', args.userId))
      .collect();

    // Get vibe details for each rating
    const ratingsWithVibes = await Promise.all(
      ratings.map(async (rating) => {
        const vibe = await ctx.db
          .query('vibes')
          .filter((q) => q.eq(q.field('id'), rating.vibeId))
          .first();

        if (!vibe) return null;

        // Get vibe creator
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('externalId'), vibe.createdById))
          .first();

        return {
          ...rating,
          vibe: {
            ...vibe,
            createdBy: creator,
          },
        };
      })
    );

    return ratingsWithVibes.filter(Boolean);
  },
});

// Get ratings received by a user (ratings on vibes they've created)
export const getUserReceivedRatings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // First get vibes created by this user
    const userVibes = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('createdById'), args.userId))
      .collect();

    // Get all ratings for these vibes
    const allRatings = await Promise.all(
      userVibes.map(async (vibe) => {
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        return ratings.map((rating) => ({
          ...rating,
          vibe: {
            id: vibe.id,
            title: vibe.title,
            image: vibe.image,
          },
        }));
      })
    );

    // Flatten the array and get rater details
    const flatRatings = allRatings.flat();
    const ratingsWithRaters = await Promise.all(
      flatRatings.map(async (rating) => {
        const rater = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', rating.userId))
          .first();

        return {
          ...rating,
          rater,
        };
      })
    );

    return ratingsWithRaters;
  },
});

export const addRating = mutation({
  args: {
    vibeId: v.string(),
    emoji: v.string(), // REQUIRED
    value: v.number(), // REQUIRED (1-5)
    review: v.string(), // REQUIRED
  },
  handler: async (ctx, args) => {
    // SECURITY: Authentication and input validation
    const identity = await ctx.auth.getUserIdentity();
    const userId = AuthUtils.requireAuth(identity?.subject);

    // SECURITY: Rate limiting for ratings
    await SecurityValidators.checkRateLimit(userId, 'add_rating', 20, 300000); // 20 ratings per 5 minutes

    // SECURITY: Validate inputs
    const rating = SecurityValidators.validateRating(args.value);
    const review = SecurityValidators.validateReview(args.review);
    const vibeId = SecurityValidators.validateString(args.vibeId, {
      required: true,
      minLength: 1,
      maxLength: 50,
      fieldName: 'Vibe ID',
    })!;
    const emoji = SecurityValidators.validateString(args.emoji, {
      required: true,
      minLength: 1,
      maxLength: 10,
      fieldName: 'Emoji',
    })!;

    // SECURITY: Verify vibe exists and is accessible
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), vibeId))
      .first();

    if (!vibe) {
      throw new Error('Vibe not found');
    }

    if (vibe.visibility === 'deleted') {
      throw new Error('Cannot rate a deleted vibe');
    }

    // Note: All vibes are public or deleted - no private visibility

    // SECURITY: Prevent self-rating
    if (vibe.createdById === userId) {
      throw new Error('You cannot rate your own vibe');
    }

    const now = new Date().toISOString();
    const tags: string[] = [];

    // Get emoji metadata for tags
    const _emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', emoji))
      .first();

    // Tags come from the rating, not from the emoji metadata

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', vibeId).eq('userId', userId)
      )
      .first();

    const ratingData = {
      emoji,
      value: rating,
      review,
      tags: tags.length > 0 ? tags : undefined,
      updatedAt: now,
    };

    let result;
    if (existingRating) {
      // Update the existing rating
      await ctx.db.patch(existingRating._id, ratingData);
      result = existingRating._id;
    } else {
      // Create a new rating
      result = await ctx.db.insert('ratings', {
        vibeId,
        userId,
        createdAt: now,
        ...ratingData,
      });
    }

    // Add vibe tags to user interests after successful rating
    await addInterestsFromVibe(ctx, userId, vibeId);

    // Create new rating notifications for users who follow the rater (skip in test environment)
    if (!existingRating) {
      // Only notify for new ratings, not updates
      try {
        if (!identity) throw new Error('No identity found');

        // Get the rater's user info and vibe info in parallel for efficiency
        const [raterUser, vibe] = await Promise.all([
          ctx.db
            .query('users')
            .withIndex('byExternalId', (q) =>
              q.eq('externalId', identity.subject)
            )
            .first(),
          ctx.db
            .query('vibes')
            .withIndex('id', (q) => q.eq('id', args.vibeId))
            .first(),
        ]);

        if (raterUser && vibe) {
          const raterDisplayName = computeUserDisplayName(raterUser);

          // Get vibe creator info
          const vibeCreator = await ctx.db
            .query('users')
            .withIndex('byExternalId', (q) =>
              q.eq('externalId', vibe.createdById)
            )
            .first();

          const vibeCreatorName = computeUserDisplayName(vibeCreator);

          // PERFORMANCE OPTIMIZED: Use batch notification system
          await ctx.scheduler.runAfter(
            0,
            internal.notifications.createFollowerNotifications,
            {
              triggerUserId: identity.subject,
              triggerUserDisplayName: raterDisplayName,
              type: 'new_rating',
              targetId: result ? result.toString() : '', // Link to the rating
              title: `${raterDisplayName} reviewed a vibe`,
              description: 'see their review',
              metadata: {
                vibeTitle: vibe.title,
                vibeCreator: vibeCreatorName,
                emoji: args.emoji,
                ratingValue: args.value,
              },
              maxFollowers: 50, // Explicit limit for performance
            }
          );
        }
      } catch (error) {
        // Don't fail the rating operation if notification creation fails
        // eslint-disable-next-line no-console
        console.error('Failed to create new rating notifications:', error);
      }
    }

    return result;
  },
});

// Quick react to a vibe (creates a rating with default review)
export const quickReact = mutation({
  args: {
    vibeId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to react to a vibe');
    }

    // Check if user already has a rating for this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', args.vibeId).eq('userId', identity.subject)
      )
      .first();

    if (existingRating) {
      // User already rated, can't quick react
      throw new Error(
        'You have already rated this vibe. Update your existing rating instead.'
      );
    }

    // Determine default value based on emoji sentiment
    let defaultValue = 3;
    const tags: string[] = [];
    const emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    if (emojiData && emojiData.sentiment) {
      if (emojiData.sentiment === 'positive') defaultValue = 4;
      else if (emojiData.sentiment === 'negative') defaultValue = 2;
    }

    // Create a quick rating
    const result = await ctx.db.insert('ratings', {
      vibeId: args.vibeId,
      userId: identity.subject,
      emoji: args.emoji,
      value: defaultValue,
      review: `Quick reaction: ${args.emoji}`,
      createdAt: new Date().toISOString(),
      tags: tags || [],
    });

    // Add vibe tags to user interests after successful quick reaction
    await addInterestsFromVibe(ctx, identity.subject, args.vibeId);

    // Create new rating notifications for users who follow the rater (skip in test environment)
    try {
      // Get the rater's user info and vibe info in parallel for efficiency
      const [raterUser, vibe] = await Promise.all([
        ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', identity.subject)
          )
          .first(),
        ctx.db
          .query('vibes')
          .withIndex('id', (q) => q.eq('id', args.vibeId))
          .first(),
      ]);

      if (raterUser && vibe) {
        const raterDisplayName = computeUserDisplayName(raterUser);

        // Get vibe creator info
        const vibeCreator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        const vibeCreatorName = computeUserDisplayName(vibeCreator);

        // PERFORMANCE OPTIMIZED: Use batch notification system
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.createFollowerNotifications,
          {
            triggerUserId: identity.subject,
            triggerUserDisplayName: raterDisplayName,
            type: 'new_rating',
            targetId: result ? result.toString() : '', // Link to the rating
            title: `${raterDisplayName} reviewed a vibe`,
            description: 'see their review',
            metadata: {
              vibeTitle: vibe.title,
              vibeCreator: vibeCreatorName,
              emoji: args.emoji,
              ratingValue: defaultValue,
            },
            maxFollowers: 50, // Explicit limit for performance
          }
        );
      }
    } catch (error) {
      // Don't fail the rating operation if notification creation fails
      // eslint-disable-next-line no-console
      console.error('Failed to create new rating notifications:', error);
    }

    return result;
  },
});

// Get vibes by tag
export const getByTag = query({
  args: { tag: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10; // Default limit for tag-based rows

    // Get recent vibes and filter by tag
    const vibesQuery = await ctx.db.query('vibes').order('desc').take(200); // Get recent vibes to search through

    // Filter vibes that contain the specified tag
    const vibesWithTag = vibesQuery
      .filter((vibe) => vibe.tags && vibe.tags.includes(args.tag))
      .slice(0, limit);

    return await Promise.all(
      vibesWithTag.map(async (vibe) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        // Get limited ratings for performance
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(5);

        const ratingDetails = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', rating.userId)
              )
              .first();
            return {
              user,
              emoji: rating.emoji,
              value: rating.value,
              review: rating.review,
              createdAt: rating.createdAt,
            };
          })
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
        };
      })
    );
  },
});

// Get all available tags from vibes
export const getAllTags = query({
  handler: async (ctx) => {
    // Use the tags table instead of collecting all vibes
    const tags = await ctx.db
      .query('tags')
      .withIndex('byCount')
      .order('desc')
      .take(50); // Limit to top 50 tags

    // Convert to the expected format
    return tags.map((tag) => ({
      tag: tag.name,
      count: tag.count,
    }));
  },
});

// Lightweight get all vibes for discover page (updated)
export const getAllLightweight = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get vibes with pagination
    const vibesQuery = ctx.db.query('vibes').order('desc');
    const vibes = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit,
    });

    // Get all creators in one query
    const creatorIds = Array.from(
      new Set(vibes.page.map((v) => v.createdById))
    );
    const allCreators = [];
    if (creatorIds.length > 0) {
      for (const creatorId of creatorIds) {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', creatorId))
          .first();
        if (creator) {
          allCreators.push(creator);
        }
      }
    }

    const creatorsMap = new Map(allCreators.map((c) => [c.externalId, c]));

    // Get ratings for all vibes
    const vibeIds = vibes.page.map((v) => v.id);
    const allRatings = [];
    if (vibeIds.length > 0) {
      for (const vibeId of vibeIds) {
        const vibeRatings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibeId))
          .collect();
        allRatings.push(...vibeRatings);
      }
    }

    // Group ratings by vibe
    const ratingsByVibe = new Map<string, Doc<'ratings'>[]>();
    for (const rating of allRatings) {
      if (!ratingsByVibe.has(rating.vibeId)) {
        ratingsByVibe.set(rating.vibeId, []);
      }
      ratingsByVibe.get(rating.vibeId)?.push(rating);
    }

    const vibesWithBasicInfo = vibes.page.map((vibe) => {
      const creator = creatorsMap.get(vibe.createdById);
      const vibeRatings = ratingsByVibe.get(vibe.id) || [];
      const ratingCount = vibeRatings.length;
      const averageRating =
        ratingCount > 0
          ? vibeRatings.reduce((sum, r) => sum + r.value, 0) / ratingCount
          : 0;

      return {
        _id: vibe._id,
        _creationTime: vibe._creationTime,
        id: vibe.id,
        title: vibe.title,
        description: vibe.description,
        image: vibe.image,
        imageUrl: vibe.image,
        createdById: vibe.createdById,
        createdAt: vibe.createdAt,
        tags: vibe.tags,
        createdBy: creator,
        ratingCount,
        averageRating,
      };
    });

    return {
      vibes: vibesWithBasicInfo,
      continueCursor: vibes.continueCursor,
      isDone: vibes.isDone,
    };
  },
});

// Get unrated vibes
export const getUnratedVibes = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get all vibes
    const vibesQuery = ctx.db.query('vibes').order('desc');
    const allVibes = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit * 2, // Get more to filter
    });

    // Get all vibe IDs
    const vibeIds = allVibes.page.map((v) => v.id);

    // Find which vibes have ratings
    const vibesWithRatings = new Set<string>();
    if (vibeIds.length > 0) {
      // Get just one rating per vibe to check if it has any ratings
      for (const vibeId of vibeIds) {
        const hasRating = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibeId))
          .first();

        if (hasRating) {
          vibesWithRatings.add(vibeId);
        }
      }
    }

    // Filter unrated vibes
    const unratedVibesData = allVibes.page
      .filter((v) => !vibesWithRatings.has(v.id))
      .slice(0, limit);

    // Get all creators in one query
    const creatorIds = Array.from(
      new Set(unratedVibesData.map((v) => v.createdById))
    );
    const allCreators = [];
    if (creatorIds.length > 0) {
      for (const creatorId of creatorIds) {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', creatorId))
          .first();
        if (creator) {
          allCreators.push(creator);
        }
      }
    }

    const creatorsMap = new Map(allCreators.map((c) => [c.externalId, c]));

    const unratedVibes = unratedVibesData.map((vibe) => {
      const creator = creatorsMap.get(vibe.createdById);

      return {
        _id: vibe._id,
        _creationTime: vibe._creationTime,
        id: vibe.id,
        title: vibe.title,
        description: vibe.description,
        image: vibe.image,
        imageUrl: vibe.image,
        createdById: vibe.createdById,
        createdAt: vibe.createdAt,
        tags: vibe.tags,
        createdBy: creator,
        ratingCount: 0,
        averageRating: 0,
      };
    });

    return {
      vibes: unratedVibes,
      continueCursor: allVibes.continueCursor,
      isDone: allVibes.isDone || unratedVibes.length < limit,
    };
  },
});

// Get top-rated vibes (lightweight)
export const getTopRatedLightweight = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get more vibes to find top-rated ones
    const vibesQuery = ctx.db.query('vibes').order('desc');
    const vibes = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: Math.min(limit * 5, 100), // Get more to have enough after filtering
    });

    // Get all ratings for these vibes
    const vibeIds = vibes.page.map((v) => v.id);
    const allRatings = [];
    if (vibeIds.length > 0) {
      for (const vibeId of vibeIds) {
        const vibeRatings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibeId))
          .collect();
        allRatings.push(...vibeRatings);
      }
    }

    // Group ratings by vibe and calculate averages
    const ratingsByVibe = new Map<string, Doc<'ratings'>[]>();
    for (const rating of allRatings) {
      if (!ratingsByVibe.has(rating.vibeId)) {
        ratingsByVibe.set(rating.vibeId, []);
      }
      ratingsByVibe.get(rating.vibeId)?.push(rating);
    }

    // Calculate averages and filter
    const vibesWithRatings = vibes.page
      .map((vibe) => {
        const vibeRatings = ratingsByVibe.get(vibe.id) || [];
        const ratingCount = vibeRatings.length;
        const averageRating =
          ratingCount > 0
            ? vibeRatings.reduce((sum, r) => sum + r.value, 0) / ratingCount
            : 0;

        return {
          vibe,
          ratingCount,
          averageRating,
        };
      })
      .filter((item) => item.ratingCount >= 2) // Minimum 2 ratings to qualify
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);

    // Get all creators
    const creatorIds = Array.from(
      new Set(vibesWithRatings.map((item) => item.vibe.createdById))
    );
    const allCreators = [];
    if (creatorIds.length > 0) {
      for (const creatorId of creatorIds) {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', creatorId))
          .first();
        if (creator) {
          allCreators.push(creator);
        }
      }
    }

    const creatorsMap = new Map(allCreators.map((c) => [c.externalId, c]));

    const topRatedVibes = vibesWithRatings.map(
      ({ vibe, ratingCount, averageRating }) => {
        const creator = creatorsMap.get(vibe.createdById);

        return {
          _id: vibe._id,
          _creationTime: vibe._creationTime,
          id: vibe.id,
          title: vibe.title,
          description: vibe.description,
          image: vibe.image,
          imageUrl: vibe.image,
          createdById: vibe.createdById,
          createdAt: vibe.createdAt,
          tags: vibe.tags,
          createdBy: creator,
          ratingCount,
          averageRating,
        };
      }
    );

    return {
      vibes: topRatedVibes,
      continueCursor: vibes.continueCursor,
      isDone: vibes.isDone,
    };
  },
});

// Get most interacted-with vibe (for onboarding demo)
export const getMostRatedVibe = query({
  handler: async (ctx) => {
    // Get public vibes
    const vibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .order('desc')
      .take(200);

    if (vibes.length === 0) {
      return null;
    }

    // Calculate total interactions for each vibe (ratings + emoji ratings)
    const vibesWithInteractionCount = await Promise.all(
      vibes.map(async (vibe) => {
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe._id))
          .collect();

        // Note: emojiRatings functionality is part of the ratings table
        // Calculate total interaction score
        const totalInteractions = ratings.length;

        return { ...vibe, totalRatings: ratings.length, totalInteractions };
      })
    );

    // Sort by total interactions to find the most interacted-with
    const sortedVibes = vibesWithInteractionCount.sort(
      (a, b) => b.totalInteractions - a.totalInteractions
    );

    const mostInteractedVibe = sortedVibes[0];

    // Get creator details
    const creator = mostInteractedVibe.createdById
      ? await ctx.db
          .query('users')
          .filter((q) =>
            q.eq(q.field('externalId'), mostInteractedVibe.createdById)
          )
          .first()
      : null;

    // Get ratings with emoji reactions
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('vibe', (q) => q.eq('vibeId', mostInteractedVibe.id))
      .order('desc')
      .collect();

    // Calculate average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
        : 0;

    // Calculate emoji aggregates from ratings that have emoji
    const emojiAggregates: Record<
      string,
      { emoji: string; count: number; totalValue: number }
    > = {};

    for (const rating of ratings) {
      if (rating.emoji) {
        if (!emojiAggregates[rating.emoji]) {
          emojiAggregates[rating.emoji] = {
            emoji: rating.emoji,
            count: 0,
            totalValue: 0,
          };
        }
        emojiAggregates[rating.emoji].count++;
        emojiAggregates[rating.emoji].totalValue += rating.value;
      }
    }

    const topEmojis = Object.values(emojiAggregates)
      .map((agg) => ({
        emoji: agg.emoji,
        value: agg.totalValue / agg.count,
        count: agg.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      ...mostInteractedVibe,
      createdBy: creator,
      emojiRatings: topEmojis,
      averageRating,
      totalRatings: mostInteractedVibe.totalRatings,
    };
  },
});

// Get top-rated vibes
export const getTopRated = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get vibes with pagination
    const vibesQuery = ctx.db.query('vibes').order('desc');
    const vibes = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: Math.min(limit * 3, 100), // Get more vibes to calculate ratings from
    });

    const vibesWithRatings = await Promise.all(
      vibes.page.map(async (vibe) => {
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : 0;

        return {
          vibe,
          averageRating,
          ratingCount: ratings.length,
        };
      })
    );

    // Sort by average rating (with minimum 2 ratings to qualify)
    const topRated = vibesWithRatings
      .filter((item) => item.ratingCount >= 2)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);

    const topRatedVibes = await Promise.all(
      topRated.map(async ({ vibe }) => {
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('externalId'), vibe.createdById))
          .first();

        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(5);

        const ratingDetails = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', rating.userId)
              )
              .first();
            return {
              user,
              emoji: rating.emoji,
              value: rating.value,
              review: rating.review,
              createdAt: rating.createdAt,
            };
          })
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
        };
      })
    );

    return {
      vibes: topRatedVibes,
      continueCursor: vibes.continueCursor,
      isDone: vibes.isDone,
    };
  },
});

// Get current authenticated user - SECURE
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Look up user in database
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('externalId'), identity.subject))
      .first();

    // SECURITY: Only return if user exists in database
    // Don't expose raw Clerk identity data
    return user || null;
  },
});

// Ensure rating has emoji (internal helper)
export const ensureRatingHasEmoji = internalMutation({
  args: { ratingId: v.id('ratings') },
  handler: async (ctx, { ratingId }) => {
    const rating = await ctx.db.get(ratingId);
    if (!rating) return;

    // Default emoji mappings based on value
    const valueToEmoji: Record<number, string> = {
      5: '🔥', // 5 = fire
      4: '😍', // 4 = heart eyes
      3: '😊', // 3 = smile
      2: '😕', // 2 = confused
      1: '😬', // 1 = grimacing
    };

    if (!rating.emoji || rating.emoji === '') {
      const value = Math.round(rating.value || 3);
      const emoji = valueToEmoji[value] || valueToEmoji[3];
      await ctx.db.patch(ratingId, { emoji });
    }
  },
});

// INTERNAL MUTATIONS FOR SEEDING (only used by seed script)
// These bypass authentication for seeding purposes only

export const createForSeed = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdById: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a unique ID for the vibe
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    const _vibeDocId = await ctx.db.insert('vibes', {
      id,
      title: args.title,
      description: args.description,
      image: args.image,
      createdById: args.createdById,
      createdAt: now,
      tags: args.tags ?? [],
      visibility: 'public', // Default to public for seed data
    });

    // Return the custom string ID instead of the document ID for easier testing
    return id;
  },
});

export const addRatingForSeed = internalMutation({
  args: {
    vibeId: v.string(),
    emoji: v.string(),
    value: v.number(),
    review: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const tags: string[] = [];

    // Get emoji metadata for tags
    const _emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    // Tags come from the rating, not from the emoji metadata

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', args.vibeId).eq('userId', args.userId)
      )
      .first();

    const ratingData = {
      emoji: args.emoji,
      value: args.value,
      review: args.review,
      tags: tags.length > 0 ? tags : undefined,
      updatedAt: now,
    };

    let result;
    if (existingRating) {
      // Update the existing rating
      result = await ctx.db.patch(existingRating._id, ratingData);
    } else {
      // Create a new rating
      result = await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: args.userId,
        createdAt: now,
        ...ratingData,
      });
    }

    // Add vibe tags to user interests after successful rating (for seed data)
    await addInterestsFromVibe(ctx, args.userId, args.vibeId);

    return result;
  },
});

// Deprecated: Use quickReact instead
export const reactToVibeForSeed = internalMutation({
  args: {
    vibeId: v.string(),
    emoji: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Convert to quick rating
    const emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    let defaultValue = 3;
    if (emojiData && emojiData.sentiment) {
      if (emojiData.sentiment === 'positive') defaultValue = 4;
      else if (emojiData.sentiment === 'negative') defaultValue = 2;
    }

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', args.vibeId).eq('userId', args.userId)
      )
      .first();

    if (existingRating) {
      // Remove the rating (toggle-like behavior)
      await ctx.db.delete(existingRating._id);
      return { added: false };
    } else {
      // Add quick rating
      await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: args.userId,
        emoji: args.emoji,
        value: defaultValue,
        review: `Quick reaction: ${args.emoji}`,
        createdAt: new Date().toISOString(),
      });

      // Add vibe tags to user interests after successful seed rating
      await addInterestsFromVibe(ctx, args.userId, args.vibeId);

      return { added: true };
    }
  },
});

// Get top-rated vibes by emoji
export const getTopRatedByEmoji = query({
  args: {
    emoji: v.string(),
    minValue: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get ratings with the specified emoji
    const emojiRatings = await ctx.db
      .query('ratings')
      .filter((q) =>
        q.and(
          q.eq(q.field('emoji'), args.emoji),
          q.gte(q.field('value'), args.minValue)
        )
      )
      .take(limit * 2); // Take more to account for potential duplicates

    // Get unique vibe IDs
    const vibeIds = [...new Set(emojiRatings.map((er) => er.vibeId))].slice(
      0,
      limit
    );

    // Fetch vibes with their details
    const vibes = await Promise.all(
      vibeIds.map(async (vibeId) => {
        const vibe = await ctx.db
          .query('vibes')
          .filter((q) => q.eq(q.field('id'), vibeId))
          .first();

        if (!vibe) return null;

        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('externalId'), vibe.createdById))
          .first();

        // Get average star rating
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : undefined;

        // Get emoji rating details for this vibe and emoji
        const vibeEmojiRatings = emojiRatings.filter(
          (er) => er.vibeId === vibeId
        );
        const avgEmojiValue =
          vibeEmojiRatings.length > 0
            ? vibeEmojiRatings.reduce((sum, er) => sum + er.value, 0) /
              vibeEmojiRatings.length
            : args.minValue;

        // Get limited ratings for performance
        const ratingDetails = await Promise.all(
          ratings.slice(0, 5).map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', rating.userId)
              )
              .first();
            return {
              user,
              emoji: rating.emoji,
              value: rating.value,
              review: rating.review,
              createdAt: rating.createdAt,
            };
          })
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          averageRating,
          emojiRating: {
            emoji: args.emoji,
            value: avgEmojiValue,
            count: vibeEmojiRatings.length,
          },
        };
      })
    );

    // Filter out nulls and return
    return vibes.filter((v) => v !== null);
  },
});

// Get vibes by emoji filters (for search page)
export const getVibesByEmojiFilters = query({
  args: {
    emojis: v.array(v.string()),
    minValue: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const minValue = args.minValue ?? 1;

    // Get all ratings with the specified emojis
    const allEmojiRatings = await Promise.all(
      args.emojis.map((emoji) =>
        ctx.db
          .query('ratings')
          .filter((q) =>
            q.and(
              q.eq(q.field('emoji'), emoji),
              q.gte(q.field('value'), minValue)
            )
          )
          .collect()
      )
    );

    // Flatten and get unique vibe IDs
    const allRatings = allEmojiRatings.flat();
    const vibeIds = [...new Set(allRatings.map((r) => r.vibeId))];

    // Apply cursor-based pagination
    const startIndex = args.cursor ? parseInt(args.cursor) : 0;
    const paginatedVibeIds = vibeIds.slice(startIndex, startIndex + limit);

    // Fetch vibes with their details
    const vibes = await Promise.all(
      paginatedVibeIds.map(async (vibeId) => {
        const vibe = await ctx.db
          .query('vibes')
          .filter((q) => q.eq(q.field('id'), vibeId))
          .first();

        if (!vibe) return null;

        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        // Get all ratings for this vibe
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : undefined;

        return {
          ...vibe,
          createdBy: creator,
          averageRating,
          ratingCount: ratings.length,
        };
      })
    );

    return {
      vibes: vibes.filter((v) => v !== null),
      totalCount: vibeIds.length,
      nextCursor:
        startIndex + limit < vibeIds.length
          ? (startIndex + limit).toString()
          : null,
    };
  },
});

// Get personalized feed for authenticated user (vibes from followed users and matching interests)
export const getForYouFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        vibes: [],
        continueCursor: null,
        isDone: true,
      };
    }

    // Get current user's data including interests
    const currentUser = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', identity!.subject))
      .first();

    const userInterests = new Set(currentUser?.interests || []);

    // Get users that current user follows
    const followingList = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', identity.subject))
      .collect();

    const followingIds = new Set(
      followingList.map((follow) => follow.followingId)
    );

    // Get recent vibes for engagement scoring (more vibes for better selection)
    const recentVibes = await ctx.db
      .query('vibes')
      .withIndex('byCreatedAt')
      .order('desc')
      .take(200); // Get more vibes to ensure we have a good pool

    // Batch fetch all ratings for all vibes to avoid N+1 query problem
    const allVibeIds = recentVibes.map((vibe) => vibe.id);
    const allRatings = await ctx.db
      .query('ratings')
      .filter((q) =>
        q.or(...allVibeIds.map((vibeId) => q.eq(q.field('vibeId'), vibeId)))
      )
      .collect();

    // Group ratings by vibeId for efficient lookup
    const ratingsByVibeId = new Map<string, typeof allRatings>();
    for (const rating of allRatings) {
      const existing = ratingsByVibeId.get(rating.vibeId) || [];
      existing.push(rating);
      ratingsByVibeId.set(rating.vibeId, existing);
    }

    // Calculate engagement scores for all vibes
    const vibesWithEngagement = await Promise.all(
      recentVibes.map(async (vibe) => {
        // Get pre-fetched ratings for this vibe
        const ratings = ratingsByVibeId.get(vibe.id) || [];

        // Check if vibe has tags matching user interests
        const hasMatchingInterests =
          vibe.tags?.some((tag) => userInterests.has(tag)) || false;

        if (
          ratings.length === 0 &&
          !followingIds.has(vibe.createdById) &&
          !hasMatchingInterests
        ) {
          // Skip vibes with no ratings unless they're from followed users or match interests
          return null;
        }

        // Calculate base engagement score
        const totalRatings = ratings.length;
        const averageRating =
          totalRatings > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : 0;
        const baseScore =
          totalRatings * (averageRating / 5) + totalRatings * 0.3;

        // Apply recency boost (newer vibes get higher scores)
        const createdAtMs = new Date(vibe.createdAt).getTime();
        const hoursOld = (Date.now() - createdAtMs) / (1000 * 60 * 60);
        const recencyMultiplier = Math.max(0.1, 1 - hoursOld / 168); // Decay over 1 week

        // Inflate score for followed users (3x multiplier)
        const followMultiplier = followingIds.has(vibe.createdById) ? 3.0 : 1.0;

        // Inflate score for vibes matching user interests (2x multiplier)
        const interestMultiplier = hasMatchingInterests ? 2.0 : 1.0;

        const finalScore =
          baseScore * recencyMultiplier * followMultiplier * interestMultiplier;

        return {
          vibe,
          engagementScore: finalScore,
          isFromFollowed: followingIds.has(vibe.createdById),
          hasMatchingInterests,
        };
      })
    );

    // Filter out null values and sort by engagement score (highest first)
    const sortedVibes = vibesWithEngagement
      .filter(
        (item) =>
          item !== null &&
          (item.engagementScore > 0 ||
            item.isFromFollowed ||
            item.hasMatchingInterests)
      )
      .sort((a, b) => (b?.engagementScore ?? 0) - (a?.engagementScore ?? 0))
      .slice(0, limit);

    // Get complete vibe details
    const vibesWithDetails = await Promise.all(
      sortedVibes.map(async (item) => {
        if (!item) return null;
        const vibe = item.vibe;
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(10);

        const ratingDetails = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', rating.userId)
              )
              .first();
            return {
              user,
              emoji: rating.emoji,
              value: rating.value,
              review: rating.review,
              createdAt: rating.createdAt,
            };
          })
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
        };
      })
    );

    return {
      vibes: vibesWithDetails,
      continueCursor: null, // Simplified pagination for engagement-based feed
      isDone: true,
    };
  },
});

// Get vibes from followed users with filtering options
export const getFollowingVibes = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    filters: v.optional(
      v.object({
        minRating: v.optional(v.number()),
        maxRating: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        dateFrom: v.optional(v.string()),
        dateTo: v.optional(v.string()),
        sort: v.optional(
          v.union(
            v.literal('recent'),
            v.literal('rating_desc'),
            v.literal('rating_asc'),
            v.literal('top_rated'),
            v.literal('most_rated'),
            v.literal('hot'),
            v.literal('boosted'),
            v.literal('controversial')
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const filters = args.filters || {};

    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        vibes: [],
        continueCursor: null,
        isDone: true,
      };
    }

    // Get users that current user follows
    const followingList = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', identity.subject))
      .collect();

    if (followingList.length === 0) {
      return {
        vibes: [],
        continueCursor: null,
        isDone: true,
      };
    }

    // Extract following user IDs
    const followingIds = followingList.map((follow) => follow.followingId);

    // Get vibes with sorting
    let vibesQuery;
    switch (filters.sort) {
      case 'recent':
      default:
        vibesQuery = ctx.db.query('vibes').order('desc');
        break;
    }

    const allVibes = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit * 3, // Get more to filter
    });

    // Filter vibes to only include those from followed users
    let filteredVibes = allVibes.page.filter((vibe) =>
      followingIds.includes(vibe.createdById)
    );

    // Apply tag filter
    if (filters.tags && filters.tags.length > 0) {
      filteredVibes = filteredVibes.filter((vibe) =>
        vibe.tags?.some((tag) => filters.tags!.includes(tag))
      );
    }

    // Apply date filters
    if (filters.dateFrom) {
      filteredVibes = filteredVibes.filter(
        (vibe) => vibe.createdAt >= filters.dateFrom!
      );
    }
    if (filters.dateTo) {
      filteredVibes = filteredVibes.filter(
        (vibe) => vibe.createdAt <= filters.dateTo!
      );
    }

    // Get ratings for rating-based filters and sorting
    if (
      filters.minRating ||
      filters.maxRating ||
      filters.sort?.includes('rating')
    ) {
      const vibesWithRatings = await Promise.all(
        filteredVibes.map(async (vibe) => {
          const ratings = await ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .collect();

          const averageRating =
            ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
              : 0;

          return {
            vibe,
            averageRating,
            ratingCount: ratings.length,
          };
        })
      );

      // Apply rating filters
      let ratingFilteredVibes = vibesWithRatings;
      if (filters.minRating) {
        ratingFilteredVibes = ratingFilteredVibes.filter(
          (item) => item.averageRating >= filters.minRating!
        );
      }
      if (filters.maxRating) {
        ratingFilteredVibes = ratingFilteredVibes.filter(
          (item) => item.averageRating <= filters.maxRating!
        );
      }

      // Apply rating-based sorting and boost score sorting
      if (filters.sort === 'rating_desc') {
        ratingFilteredVibes.sort((a, b) => b.averageRating - a.averageRating);
      } else if (filters.sort === 'rating_asc') {
        ratingFilteredVibes.sort((a, b) => a.averageRating - b.averageRating);
      } else if (filters.sort === 'most_rated') {
        ratingFilteredVibes.sort((a, b) => b.ratingCount - a.ratingCount);
      } else if (filters.sort === 'top_rated') {
        ratingFilteredVibes.sort((a, b) => {
          const scoreA = a.averageRating * Math.log1p(a.ratingCount);
          const scoreB = b.averageRating * Math.log1p(b.ratingCount);
          return scoreB - scoreA;
        });
      } else if (filters.sort === 'boosted') {
        // Sort by boost score descending
        ratingFilteredVibes.sort((a, b) => {
          const boostA = a.vibe.boostScore || 0;
          const boostB = b.vibe.boostScore || 0;
          return boostB - boostA;
        });
      } else if (filters.sort === 'hot') {
        // Hot algorithm: combine boost score with recency and engagement
        ratingFilteredVibes.sort((a, b) => {
          const now = Date.now();
          const ageInHours = (now - new Date(a.vibe.createdAt).getTime()) / (1000 * 60 * 60);
          const ageInHoursB = (now - new Date(b.vibe.createdAt).getTime()) / (1000 * 60 * 60);
          
          const boostA = a.vibe.boostScore || 0;
          const boostB = b.vibe.boostScore || 0;
          
          const hotScoreA = (boostA + a.ratingCount) / Math.pow(ageInHours + 2, 1.5);
          const hotScoreB = (boostB + b.ratingCount) / Math.pow(ageInHoursB + 2, 1.5);
          
          return hotScoreB - hotScoreA;
        });
      } else if (filters.sort === 'controversial') {
        // Controversial algorithm: high engagement with mixed boost/dampen scores
        ratingFilteredVibes.sort((a, b) => {
          const boostA = a.vibe.totalBoosts || 0;
          const dampenA = a.vibe.totalDampens || 0;
          const boostB = b.vibe.totalBoosts || 0;
          const dampenB = b.vibe.totalDampens || 0;
          
          const totalActivityA = boostA + dampenA;
          const totalActivityB = boostB + dampenB;
          
          if (totalActivityA === 0 && totalActivityB === 0) return 0;
          if (totalActivityA === 0) return 1;
          if (totalActivityB === 0) return -1;
          
          const controversyRatioA = Math.abs((boostA / totalActivityA) - 0.5);
          const controversyRatioB = Math.abs((boostB / totalActivityB) - 0.5);
          
          const controversyScoreA = (0.5 - controversyRatioA) * totalActivityA;
          const controversyScoreB = (0.5 - controversyRatioB) * totalActivityB;
          
          return controversyScoreB - controversyScoreA;
        });
      }

      filteredVibes = ratingFilteredVibes.map((item) => item.vibe);
    }

    // Limit results
    const finalVibes = filteredVibes.slice(0, limit);

    // Get complete vibe details
    const vibesWithDetails = await Promise.all(
      finalVibes.map(async (vibe) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(10);

        const ratingDetails = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .withIndex('byExternalId', (q) =>
                q.eq('externalId', rating.userId)
              )
              .first();
            return {
              user,
              emoji: rating.emoji,
              value: rating.value,
              review: rating.review,
              createdAt: rating.createdAt,
            };
          })
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
        };
      })
    );

    return {
      vibes: vibesWithDetails,
      continueCursor: allVibes.continueCursor,
      isDone: allVibes.isDone || finalVibes.length < limit,
    };
  },
});

// Get user interests derived from their vibe interactions
export const getUserDerivedInterests = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all tags from vibes the user created
    const userVibes = await ctx.db
      .query('vibes')
      .withIndex('createdBy', (q) => q.eq('createdById', args.userId))
      .collect();

    // Get all tags from vibes the user rated/reviewed
    const userRatings = await ctx.db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', args.userId))
      .collect();

    // Collect all tags from user's vibes
    const createdTags = new Set<string>();
    for (const vibe of userVibes) {
      if (vibe.tags) {
        vibe.tags.forEach((tag) => createdTags.add(tag));
      }
    }

    // Batch fetch all vibes for rated vibe IDs to avoid N+1 queries
    const ratedVibeIds = userRatings.map((rating) => rating.vibeId);
    const ratedVibes = await ctx.db
      .query('vibes')
      .filter((q) =>
        q.or(...ratedVibeIds.map((vibeId) => q.eq(q.field('id'), vibeId)))
      )
      .collect();

    // Create map of vibe ID to vibe object for O(1) lookup
    const vibeMap = new Map<string, (typeof ratedVibes)[0]>();
    for (const vibe of ratedVibes) {
      vibeMap.set(vibe.id, vibe);
    }

    // Collect all tags from vibes the user rated
    const ratedTags = new Set<string>();
    for (const rating of userRatings) {
      const vibe = vibeMap.get(rating.vibeId);
      if (vibe && vibe.tags) {
        vibe.tags.forEach((tag: string) => ratedTags.add(tag));
      }
    }

    // Combine and sort by frequency (prioritize created tags)
    const allTags: {
      tag: string;
      source: 'created' | 'rated';
      count: number;
    }[] = [];

    // Add created tags with higher weight
    Array.from(createdTags).forEach((tag) => {
      const createdCount = userVibes.filter((vibe) =>
        vibe.tags?.includes(tag)
      ).length;
      allTags.push({ tag, source: 'created', count: createdCount * 3 }); // Weight created tags higher
    });

    // Add rated tags (using pre-fetched vibe map for O(1) lookup)
    for (const tag of Array.from(ratedTags)) {
      if (!createdTags.has(tag)) {
        let ratedCount = 0;
        for (const rating of userRatings) {
          const vibe = vibeMap.get(rating.vibeId);
          if (vibe?.tags?.includes(tag)) {
            ratedCount++;
          }
        }
        allTags.push({ tag, source: 'rated', count: ratedCount });
      }
    }

    // Sort by count and return top interests
    return allTags
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map((item) => item.tag);
  },
});

// Update a vibe
export const updateVibe = mutation({
  args: {
    vibeId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.union(v.string(), v.id('_storage'))),
    tags: v.optional(v.array(v.string())),
    gradientFrom: v.optional(v.string()),
    gradientTo: v.optional(v.string()),
    gradientDirection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to update a vibe');
    }

    // Get the vibe to check ownership
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), args.vibeId))
      .first();

    if (!vibe) {
      throw new Error('Vibe not found');
    }

    // Check if user is the owner
    if (vibe.createdById !== identity.subject) {
      throw new Error('You can only edit your own vibes');
    }

    // Check if vibe is deleted
    if (vibe.visibility === 'deleted') {
      throw new Error('Cannot edit a deleted vibe');
    }

    // Prepare update data
    const updateData: Partial<Doc<'vibes'>> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
    };

    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.gradientFrom !== undefined) updateData.gradientFrom = args.gradientFrom;
    if (args.gradientTo !== undefined) updateData.gradientTo = args.gradientTo;
    if (args.gradientDirection !== undefined) updateData.gradientDirection = args.gradientDirection;

    // Handle image updates
    if (args.image !== undefined) {
      // Check if it looks like a storage ID (32 char alphanumeric string)
      const isStorageId =
        typeof args.image === 'string' && /^[a-z0-9]{32}$/.test(args.image);

      if (isStorageId) {
        // Treat as storage ID
        updateData.imageStorageId = args.image as Id<'_storage'>;
        const imageUrl = await ctx.storage.getUrl(updateData.imageStorageId);
        if (imageUrl) {
          updateData.image = imageUrl;
        }
      } else if (typeof args.image === 'string') {
        // Legacy string URL support
        updateData.image = args.image;
      } else {
        // Store storage ID directly and try to get URL for backward compatibility
        updateData.imageStorageId = args.image;
        const imageUrl = await ctx.storage.getUrl(args.image);
        if (imageUrl) {
          updateData.image = imageUrl;
        }
      }
    }

    // Update the vibe
    await ctx.db.patch(vibe._id, updateData);

    // Update tag usage counts if tags changed
    if (args.tags !== undefined) {
      const oldTags = vibe.tags || [];
      const newTags = args.tags || [];

      // Find tags to add and remove
      const tagsToAdd = newTags.filter((tag) => !oldTags.includes(tag));
      const tagsToRemove = oldTags.filter((tag) => !newTags.includes(tag));

      if (tagsToAdd.length > 0) {
        await (
          ctx.scheduler as unknown as {
            runAfter: (
              delay: number,
              fn: unknown,
              args: unknown
            ) => Promise<unknown>;
          }
        ).runAfter(0, internal.tags.updateTagCounts, {
          tagsToAdd,
        });
      }

      if (tagsToRemove.length > 0) {
        await (
          ctx.scheduler as unknown as {
            runAfter: (
              delay: number,
              fn: unknown,
              args: unknown
            ) => Promise<unknown>;
          }
        ).runAfter(0, internal.tags.updateTagCounts, {
          tagsToRemove,
        });
      }
    }

    return vibe._id;
  },
});

// Soft delete a vibe (set visibility to 'deleted')
export const deleteVibe = mutation({
  args: {
    vibeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to delete a vibe');
    }

    // Get the vibe to check ownership
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), args.vibeId))
      .first();

    if (!vibe) {
      throw new Error('Vibe not found');
    }

    // Check if user is the owner
    if (vibe.createdById !== identity.subject) {
      throw new Error('You can only delete your own vibes');
    }

    // Check if vibe is already deleted
    if (vibe.visibility === 'deleted') {
      throw new Error('Vibe is already deleted');
    }

    // Soft delete by setting visibility to 'deleted'
    await ctx.db.patch(vibe._id, {
      visibility: 'deleted',
      updatedAt: new Date().toISOString(),
    });

    // Remove tags from count (since the vibe is no longer visible)
    if (vibe.tags && vibe.tags.length > 0) {
      await (
        ctx.scheduler as unknown as {
          runAfter: (
            delay: number,
            fn: unknown,
            args: unknown
          ) => Promise<unknown>;
        }
      ).runAfter(0, internal.tags.updateTagCounts, {
        tagsToRemove: vibe.tags,
      });
    }

    return vibe._id;
  },
});
