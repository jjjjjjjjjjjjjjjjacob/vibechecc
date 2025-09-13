import {
  mutation,
  query,
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { SecurityValidators, AuthUtils } from './lib/securityValidators';
import { SchedulableFunctionReference } from 'convex/server';

// Helper function to safely call scheduler (works in both test and production)
async function safeSchedulerCall(
  ctx: MutationCtx,
  delay: number,
  fn: SchedulableFunctionReference,
  args: unknown
): Promise<void> {
  try {
    await ctx.scheduler.runAfter(delay, fn, args);
  } catch (error) {
    // If scheduler fails (e.g., in some test configurations), log but don't break the flow
    // eslint-disable-next-line no-console
    console.error('Scheduler call failed:', error);
    throw error; // Re-throw to let the test framework handle it properly
  }
}

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
            v.literal('creation_date')
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

    // Sort if needed (for rating-based sorts)
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
  },
  handler: async (ctx, args) => {
    // SECURITY: Check authentication and validate input
    const identity = await ctx.auth.getUserIdentity();
    const userId = AuthUtils.requireAuth(identity?.subject);

    // SECURITY: Rate limiting check
    await SecurityValidators.checkRateLimit(userId, 'create_vibe', 5, 300000); // 5 vibes per 5 minutes

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

    // Process image: if it's a storage ID, convert to URL
    let processedImage: string | undefined | null;
    if (args.image) {
      if (typeof args.image === 'string' && args.image.startsWith('http')) {
        // It's already a URL
        processedImage = args.image;
      } else if (typeof args.image !== 'string') {
        // It's a storage ID, convert to URL
        try {
          processedImage = await ctx.storage.getUrl(args.image);
        } catch {
          // If conversion fails, skip image
          processedImage = undefined;
        }
      }
    }

    // Create the vibe in the database
    await ctx.db.insert('vibes', {
      id,
      title: args.title,
      description: args.description,
      image: processedImage || undefined,
      imageStorageId: typeof args.image !== 'string' ? args.image : undefined,
      createdById: identity!.subject,
      createdAt: new Date().toISOString(),
      tags: args.tags || [],
      visibility: 'public',
    });

    // Update tag usage counts
    if (args.tags && args.tags.length > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep - Convex generated types
      await safeSchedulerCall(ctx, 0, internal.tags.updateTagCounts, {
        tagsToAdd: args.tags,
      });
    }

    // Create notifications for followers (skip in test environment)
    try {
      if (!identity) throw new Error('No identity found');

      const creatorDisplayName = computeUserDisplayName(user);

      // PERFORMANCE OPTIMIZED: Use batch notification system
      await safeSchedulerCall(
        ctx,
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
    const newTags = vibe.tags.filter((tag: string) => {
      if (!currentInterests.has(tag)) {
        currentInterests.add(tag);
        return true;
      }
      return false;
    });

    // Update user interests if we have new ones
    if (newTags.length > 0) {
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
          await safeSchedulerCall(
            ctx,
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
        await safeSchedulerCall(
          ctx,
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

    // Create the vibe in the database
    await ctx.db.insert('vibes', {
      id,
      title: args.title,
      description: args.description,
      image: args.image,
      imageStorageId: undefined,
      createdById: args.createdById,
      createdAt: new Date().toISOString(),
      tags: args.tags || [],
      visibility: 'public',
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

// Enhanced personalized feed with sophisticated recommendations and trending fallbacks
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
      // For anonymous users, return trending content
      return await getTrendingFallbackForFeed(ctx, limit);
    }

    // Get current user's data including interests and interaction history
    const currentUser = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', identity.subject))
      .first();

    if (!currentUser) {
      return await getTrendingFallbackForFeed(ctx, limit);
    }

    // Get user's interaction patterns to determine recommendation strategy
    const [userRatings, userEmojiRatings, followingList] = await Promise.all([
      ctx.db
        .query('ratings')
        .withIndex('user', (q) => q.eq('userId', identity.subject))
        .collect(),
      ctx.db
        .query('emojiRatings')
        .withIndex('byUser', (q) => q.eq('userId', identity.subject))
        .collect(),
      ctx.db
        .query('follows')
        .withIndex('byFollower', (q) => q.eq('followerId', identity.subject))
        .collect(),
    ]);

    const totalInteractions = userRatings.length + userEmojiRatings.length;
    const hasLimitedHistory = totalInteractions < 5 && followingList.length < 2;

    if (hasLimitedHistory) {
      // New user - blend personalized with trending (60/40 split)
      return await getNewUserFeedRecommendations(ctx, currentUser, limit, {
        ratings: userRatings,
        emojiRatings: userEmojiRatings,
        following: followingList,
      });
    }

    // Experienced user - full personalized recommendations
    return await getPersonalizedFeedRecommendations(ctx, currentUser, limit, {
      ratings: userRatings,
      emojiRatings: userEmojiRatings,
      following: followingList,
    });
  },
});

// Helper: Trending fallback for anonymous users
async function getTrendingFallbackForFeed(ctx: QueryCtx, limit: number) {
  // Get trending vibes with engagement scoring
  const timeWindowHours = 48; // Extended window for better coverage
  const timeWindowMs = timeWindowHours * 60 * 60 * 1000;
  const now = Date.now();
  const cutoffTime = now - timeWindowMs;

  const vibes = await ctx.db
    .query('vibes')
    .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
    .order('desc')
    .take(100);

  // Calculate trending scores
  const vibesWithScores = await Promise.all(
    vibes.map(async (vibe: Doc<'vibes'>) => {
      const [ratings, emojiRatings] = await Promise.all([
        ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect(),
        ctx.db
          .query('emojiRatings')
          .withIndex('byVibe', (q) => q.eq('vibeId', vibe.id))
          .collect(),
      ]);

      const recentRatings = ratings.filter(
        (r: Doc<'ratings'>) => new Date(r.createdAt).getTime() >= cutoffTime
      );
      const recentEmojiRatings = emojiRatings.filter(
        (r: Doc<'emojiRatings'>) =>
          new Date(r.createdAt).getTime() >= cutoffTime
      );

      const totalRatings = ratings.length + emojiRatings.length;
      const recentEngagement = recentRatings.length + recentEmojiRatings.length;
      const avgRating =
        totalRatings > 0
          ? [...ratings, ...emojiRatings].reduce(
              (sum: number, r: Doc<'ratings'> | Doc<'emojiRatings'>) =>
                sum + r.value,
              0
            ) / totalRatings
          : 3;

      const ageInHours =
        (now - new Date(vibe.createdAt).getTime()) / (60 * 60 * 1000);
      const recencyFactor = Math.exp(-ageInHours / (timeWindowHours * 2));

      const trendingScore =
        recentEngagement * 0.4 + avgRating * 0.3 + recencyFactor * 0.3;

      return { vibe, trendingScore };
    })
  );

  vibesWithScores.sort((a, b) => b.trendingScore - a.trendingScore);
  const topVibes = vibesWithScores.slice(0, limit);

  // Add creator details
  const vibesWithDetails = await Promise.all(
    topVibes.map(async ({ vibe }) => {
      const creator = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', vibe.createdById))
        .first();

      const ratings = await ctx.db
        .query('ratings')
        .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
        .take(5);

      const ratingDetails = await Promise.all(
        ratings.map(async (rating: Doc<'ratings'>) => {
          const user = await ctx.db
            .query('users')
            .withIndex('byExternalId', (q) => q.eq('externalId', rating.userId))
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

      return { ...vibe, createdBy: creator, ratings: ratingDetails };
    })
  );

  return {
    vibes: vibesWithDetails,
    continueCursor: null,
    isDone: true,
  };
}

// Helper: New user recommendations (blend personalized + trending)
async function getNewUserFeedRecommendations(
  ctx: QueryCtx,
  currentUser: Doc<'users'>,
  limit: number,
  userHistory: {
    ratings: Doc<'ratings'>[];
    emojiRatings: Doc<'emojiRatings'>[];
    following: Doc<'follows'>[];
  }
) {
  const personalizedLimit = Math.floor(limit * 0.6); // 60% personalized
  const trendingLimit = limit - personalizedLimit; // 40% trending

  const [personalizedResult, trendingResult] = await Promise.all([
    getPersonalizedFeedRecommendations(
      ctx,
      currentUser,
      personalizedLimit * 2,
      userHistory
    ),
    getTrendingFallbackForFeed(ctx, trendingLimit * 2),
  ]);

  // Merge and deduplicate
  const personalizedIds = new Set(
    personalizedResult.vibes.map((v: unknown) => (v as any).id) // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  const uniqueTrending = trendingResult.vibes.filter(
    (v: unknown) => !personalizedIds.has((v as any).id) // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  const combinedVibes = [
    ...personalizedResult.vibes.slice(0, personalizedLimit),
    ...uniqueTrending.slice(0, trendingLimit),
  ];

  return {
    vibes: combinedVibes.slice(0, limit),
    continueCursor: null,
    isDone: true,
  };
}

// Helper: Full personalized recommendations for experienced users
async function getPersonalizedFeedRecommendations(
  ctx: QueryCtx,
  currentUser: Doc<'users'>,
  limit: number,
  userHistory: {
    ratings: Doc<'ratings'>[];
    emojiRatings: Doc<'emojiRatings'>[];
    following: Doc<'follows'>[];
  }
) {
  const {
    ratings: userRatings,
    emojiRatings: userEmojiRatings,
    following: followingList,
  } = userHistory;

  // Build user interest profile
  const userInterests = new Set(currentUser.interests || []);
  const preferredTags = new Map<string, number>();
  const preferredEmojis = new Map<
    string,
    { count: number; avgRating: number }
  >();
  const followingIds = new Set(
    followingList.map((f: Doc<'follows'>) => f.followingId)
  );
  const ratedVibeIds = new Set([
    ...userRatings.map((r: Doc<'ratings'>) => r.vibeId),
    ...userEmojiRatings.map((r: Doc<'emojiRatings'>) => r.vibeId),
  ]);

  // Analyze emoji preferences
  userEmojiRatings.forEach((rating: Doc<'emojiRatings'>) => {
    const existing = preferredEmojis.get(rating.emoji) || {
      count: 0,
      avgRating: 0,
    };
    const newCount = existing.count + 1;
    const newAvg =
      (existing.avgRating * existing.count + rating.value) / newCount;
    preferredEmojis.set(rating.emoji, { count: newCount, avgRating: newAvg });
  });

  // Analyze tag preferences from highly rated vibes
  const highlyRatedVibeIds = [
    ...userRatings
      .filter((r: Doc<'ratings'>) => r.value >= 4)
      .map((r: Doc<'ratings'>) => r.vibeId),
    ...userEmojiRatings
      .filter((r: Doc<'emojiRatings'>) => r.value >= 4)
      .map((r: Doc<'emojiRatings'>) => r.vibeId),
  ];

  const highlyRatedVibes = await Promise.all(
    highlyRatedVibeIds.slice(0, 50).map((vibeId: string) =>
      ctx.db
        .query('vibes')
        .filter((q) => q.eq(q.field('id'), vibeId))
        .first()
    )
  );

  highlyRatedVibes.forEach((vibe: Doc<'vibes'> | null) => {
    if (vibe?.tags) {
      vibe.tags.forEach((tag: string) => {
        preferredTags.set(tag, (preferredTags.get(tag) || 0) + 1);
      });
    }
  });

  // Get candidate vibes
  const candidateVibes = await ctx.db
    .query('vibes')
    .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
    .filter((q) => q.neq(q.field('createdById'), currentUser.externalId))
    .take(250);

  // Score candidates
  const vibesWithScores = await Promise.all(
    candidateVibes
      .filter((vibe: Doc<'vibes'>) => !ratedVibeIds.has(vibe.id))
      .map(async (vibe: Doc<'vibes'>) => {
        let score = 0;

        // Social signal (strongest factor)
        if (followingIds.has(vibe.createdById)) {
          score += 4.0;
        }

        // Tag similarity
        if (vibe.tags && vibe.tags.length > 0) {
          const tagScore = vibe.tags.reduce((acc: number, tag: string) => {
            if (userInterests.has(tag)) {
              return acc + 2.0;
            }
            const preferenceCount = preferredTags.get(tag) || 0;
            return acc + Math.min(preferenceCount * 0.5, 1.5);
          }, 0);
          score += tagScore * 0.4;
        }

        // Emoji compatibility
        const vibeEmojiRatings = await ctx.db
          .query('emojiRatings')
          .withIndex('byVibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const emojiScore = vibeEmojiRatings.reduce(
          (acc: number, rating: Doc<'emojiRatings'>) => {
            const userPref = preferredEmojis.get(rating.emoji);
            if (userPref && userPref.avgRating >= 4) {
              return acc + 1.0;
            } else if (userPref && userPref.avgRating >= 3) {
              return acc + 0.5;
            }
            return acc;
          },
          0
        );
        score += emojiScore * 0.3;

        // Quality and recency factors
        const vibeRatings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const avgRating =
          vibeRatings.length > 0
            ? vibeRatings.reduce(
                (sum: number, r: Doc<'ratings'>) => sum + r.value,
                0
              ) / vibeRatings.length
            : 3.0;

        score += (avgRating - 3) * 0.5; // Quality bonus/penalty

        // Recency factor
        const ageInDays =
          (Date.now() - new Date(vibe.createdAt).getTime()) /
          (24 * 60 * 60 * 1000);
        const recencyBonus = Math.max(0, 1 - ageInDays / 14);
        score += recencyBonus * 0.2;

        return { vibe, score };
      })
  );

  // Sort and take top recommendations
  vibesWithScores.sort((a, b) => b.score - a.score);
  const topVibes = vibesWithScores.slice(0, limit);

  // Add vibe details
  const vibesWithDetails = await Promise.all(
    topVibes.map(async ({ vibe }) => {
      const creator = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', vibe.createdById))
        .first();

      const ratings = await ctx.db
        .query('ratings')
        .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
        .take(5);

      const ratingDetails = await Promise.all(
        ratings.map(async (rating: Doc<'ratings'>) => {
          const user = await ctx.db
            .query('users')
            .withIndex('byExternalId', (q) => q.eq('externalId', rating.userId))
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

      return { ...vibe, createdBy: creator, ratings: ratingDetails };
    })
  );

  return {
    vibes: vibesWithDetails,
    continueCursor: null,
    isDone: true,
  };
}

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
            v.literal('most_rated')
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

      // Apply rating-based sorting
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
        await safeSchedulerCall(ctx, 0, internal.tags.updateTagCounts, {
          tagsToAdd,
        });
      }

      if (tagsToRemove.length > 0) {
        await safeSchedulerCall(ctx, 0, internal.tags.updateTagCounts, {
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
      await safeSchedulerCall(ctx, 0, internal.tags.updateTagCounts, {
        tagsToRemove: vibe.tags,
      });
    }

    return vibe._id;
  },
});

// Enhanced trending algorithm with engagement scoring
export const getTrendingWithEngagement = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    timeWindowHours: v.optional(v.number()), // Time window for trending calculation
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const timeWindowHours = args.timeWindowHours ?? 24; // Default to 24 hours
    const timeWindowMs = timeWindowHours * 60 * 60 * 1000;
    const now = Date.now();
    const cutoffTime = now - timeWindowMs;

    // Get recent vibes (within time window for better trending detection)
    const vibesQuery = ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .order('desc');

    const vibes = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: Math.min(limit * 4, 200), // Get more to calculate trending from
    });

    // Calculate trending scores for each vibe
    const vibesWithTrendingScores = await Promise.all(
      vibes.page.map(async (vibe) => {
        const vibeCreatedAt = new Date(vibe.createdAt).getTime();

        // Get all ratings for this vibe
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        // Get emoji ratings for additional engagement data
        const emojiRatings = await ctx.db
          .query('emojiRatings')
          .withIndex('byVibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        // Calculate engagement metrics
        const totalRatings = ratings.length;
        const totalEmojiRatings = emojiRatings.length;
        const totalEngagement = totalRatings + totalEmojiRatings;
        const avgRating =
          totalRatings > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / totalRatings
            : 0;

        // Calculate recent engagement (ratings within time window)
        const recentRatings = ratings.filter((rating) => {
          const ratingTime = new Date(rating.createdAt).getTime();
          return ratingTime >= cutoffTime;
        });

        const recentEmojiRatings = emojiRatings.filter((rating) => {
          const ratingTime = new Date(rating.createdAt).getTime();
          return ratingTime >= cutoffTime;
        });

        // Calculate rating diversity (different users engaging)
        const uniqueRaters = new Set([
          ...ratings.map((r) => r.userId),
          ...emojiRatings.map((r) => r.userId),
        ]);
        const ratingDiversity = uniqueRaters.size;
        const diversityScore = Math.min(ratingDiversity / 5, 1.0); // Normalize to max 1.0

        // Calculate emoji diversity (variety of different emojis used)
        const uniqueEmojis = new Set([
          ...ratings.map((r) => r.emoji).filter(Boolean),
          ...emojiRatings.map((r) => r.emoji).filter(Boolean),
        ]);
        const emojiDiversity = uniqueEmojis.size;
        const emojiDiversityScore = Math.min(emojiDiversity / 8, 1.0); // Normalize to max 1.0

        // Calculate engagement quality (review length, engagement depth)
        const ratingsWithReviews = ratings.filter(
          (r) => r.review && r.review.length > 10
        );
        const avgReviewLength =
          ratingsWithReviews.length > 0
            ? ratingsWithReviews.reduce(
                (sum, r) => sum + (r.review?.length || 0),
                0
              ) / ratingsWithReviews.length
            : 0;
        const qualityEngagementScore = Math.min(avgReviewLength / 100, 1.0); // Normalize long reviews

        // Time decay factor (newer content gets higher score, but with improved curve)
        const ageInHours = (now - vibeCreatedAt) / (60 * 60 * 1000);
        const timeDecayFactor = Math.exp(-ageInHours / (timeWindowHours * 1.5)); // Slightly faster decay

        // Engagement velocity (rate of recent engagement with smoothing)
        const hoursActive = Math.max(
          0.5,
          (now - vibeCreatedAt) / (60 * 60 * 1000)
        );
        const engagementVelocity =
          (recentRatings.length + recentEmojiRatings.length) / hoursActive;
        const velocityScore = Math.sqrt(engagementVelocity) * 2.0; // Square root to reduce extreme values

        // Quality score (weighted average rating with better scaling)
        const qualityWeight = Math.min(totalEngagement, 15) / 15; // Increased cap and include emoji ratings
        const qualityScore = avgRating * qualityWeight;

        // Recency bonus for very new content (within 6 hours)
        const recencyBonus =
          ageInHours < 6
            ? Math.exp(-(ageInHours / 3)) * 0.5 // Exponential bonus for very fresh content
            : 0;

        // Calculate enhanced trending score with improved formula
        const engagementScore =
          recentRatings.length * 1.2 + recentEmojiRatings.length * 1.0;
        const qualityBoost = qualityScore * 0.8;
        const diversityBoost = diversityScore * 0.6 + emojiDiversityScore * 0.4;
        const engagementQualityBoost = qualityEngagementScore * 0.5;

        const trendingScore =
          engagementScore * 0.3 +
          velocityScore * 0.25 +
          qualityBoost * 0.2 +
          diversityBoost * 0.15 +
          timeDecayFactor * 0.05 +
          engagementQualityBoost * 0.03 +
          recencyBonus * 0.02;

        return {
          vibe,
          trendingScore,
          engagementScore,
          velocityScore: engagementVelocity,
          qualityScore,
          timeDecayFactor,
          totalRatings,
          totalEngagement,
          recentEngagement: recentRatings.length + recentEmojiRatings.length,
          avgRating,
          ratingDiversity,
          diversityScore,
          emojiDiversity,
          emojiDiversityScore,
          qualityEngagementScore,
          recencyBonus,
          ageInHours,
        };
      })
    );

    // Sort by trending score (descending)
    vibesWithTrendingScores.sort((a, b) => b.trendingScore - a.trendingScore);

    // Take top vibes and add creator details
    const topTrendingVibes = await Promise.all(
      vibesWithTrendingScores.slice(0, limit).map(async ({ vibe }) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
          .first();

        // Get recent ratings for display
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
      vibes: topTrendingVibes,
      continueCursor: vibes.continueCursor,
      isDone: vibes.isDone,
    };
  },
});

// Get personalized "For You" recommendations based on user behavior
export const getPersonalizedRecommendations = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get current user identity if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        // For anonymous users, fall back to top-rated content
        return {
          vibes: [],
          continueCursor: null,
          isDone: true,
        };
      }
      userId = identity.subject;
    }

    // Get user's interaction history
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', userId))
      .first();

    if (!user) {
      // Fallback to top-rated if user not found
      return {
        vibes: [],
        continueCursor: null,
        isDone: true,
      };
    }

    // Get user's rating history
    const userRatings = await ctx.db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', userId))
      .collect();

    // Get user's emoji rating history
    const userEmojiRatings = await ctx.db
      .query('emojiRatings')
      .withIndex('byUser', (q) => q.eq('userId', userId))
      .collect();

    // Extract user preferences
    const ratedVibeIds = new Set(userRatings.map((r) => r.vibeId));
    const preferredEmojis = new Map<
      string,
      { count: number; totalValue: number }
    >();
    const preferredTags = new Map<string, number>();

    // Analyze emoji preferences
    userEmojiRatings.forEach((rating) => {
      const emoji = rating.emoji;
      if (!preferredEmojis.has(emoji)) {
        preferredEmojis.set(emoji, { count: 0, totalValue: 0 });
      }
      const emojiData = preferredEmojis.get(emoji)!;
      emojiData.count++;
      emojiData.totalValue += rating.value;
    });

    // Analyze tag preferences from rated vibes
    const ratedVibes = await Promise.all(
      Array.from(ratedVibeIds)
        .slice(0, 50)
        .map((vibeId) =>
          ctx.db
            .query('vibes')
            .filter((q) => q.eq(q.field('id'), vibeId))
            .first()
        )
    );

    ratedVibes.forEach((vibe) => {
      if (vibe?.tags) {
        vibe.tags.forEach((tag) => {
          preferredTags.set(tag, (preferredTags.get(tag) || 0) + 1);
        });
      }
    });

    // Get following list for social signals
    const following = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', userId))
      .collect();

    const followingIds = new Set(following.map((f) => f.followingId));

    // Get candidate vibes (exclude already rated ones)
    const candidateVibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .filter((q) => q.neq(q.field('createdById'), userId)) // Don't recommend user's own vibes
      .take(200); // Get a large pool to score

    // Score vibes based on personalization factors
    const vibesWithScores = await Promise.all(
      candidateVibes
        .filter((vibe) => !ratedVibeIds.has(vibe.id)) // Exclude already rated
        .map(async (vibe) => {
          let personalizedScore = 0;

          // Social signal bonus (content from followed users)
          if (followingIds.has(vibe.createdById)) {
            personalizedScore += 3.0;
          }

          // Tag preference bonus
          if (vibe.tags) {
            const tagBonus = vibe.tags.reduce((bonus, tag) => {
              const tagCount = preferredTags.get(tag) || 0;
              return bonus + (tagCount > 0 ? Math.log(tagCount + 1) : 0);
            }, 0);
            personalizedScore += tagBonus * 0.5;
          }

          // Get vibe's emoji ratings for emoji preference matching
          const vibeEmojiRatings = await ctx.db
            .query('emojiRatings')
            .withIndex('byVibe', (q) => q.eq('vibeId', vibe.id))
            .collect();

          // Emoji preference bonus
          const emojiBonus = vibeEmojiRatings.reduce((bonus, rating) => {
            const userPref = preferredEmojis.get(rating.emoji);
            if (userPref) {
              const avgUserRating = userPref.totalValue / userPref.count;
              // Bonus for emojis the user likes and rates highly
              return bonus + (avgUserRating >= 4 ? 1.0 : 0.5);
            }
            return bonus;
          }, 0);
          personalizedScore += emojiBonus * 0.3;

          // Recency bonus (slight preference for newer content)
          const ageInDays =
            (Date.now() - new Date(vibe.createdAt).getTime()) /
            (24 * 60 * 60 * 1000);
          const recencyBonus = Math.max(0, 2 - ageInDays / 7); // Decreases over 2 weeks
          personalizedScore += recencyBonus * 0.2;

          // Quality signal from overall ratings
          const vibeRatings = await ctx.db
            .query('ratings')
            .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
            .collect();

          const avgRating =
            vibeRatings.length > 0
              ? vibeRatings.reduce((sum, r) => sum + r.value, 0) /
                vibeRatings.length
              : 3; // Default neutral rating

          const qualityBonus = (avgRating - 3) * 0.5; // Bonus/penalty based on deviation from neutral
          personalizedScore += qualityBonus;

          return {
            vibe,
            personalizedScore,
            socialSignal: followingIds.has(vibe.createdById),
            tagMatchCount: vibe.tags
              ? vibe.tags.filter((tag) => preferredTags.has(tag)).length
              : 0,
          };
        })
    );

    // Sort by personalized score (descending)
    vibesWithScores.sort((a, b) => b.personalizedScore - a.personalizedScore);

    // Take top recommendations and add creator details
    const recommendations = await Promise.all(
      vibesWithScores.slice(0, limit).map(async ({ vibe }) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) =>
            q.eq('externalId', vibe.createdById)
          )
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
      vibes: recommendations,
      continueCursor: null, // For simplicity, not implementing cursor-based pagination for personalized results
      isDone: true,
    };
  },
});
