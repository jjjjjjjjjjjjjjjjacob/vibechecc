import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';

// Simple get all vibes (for backwards compatibility)
export const getAllSimple = query({
  handler: async (ctx) => {
    // Just return basic vibe data without complex joins
    return await ctx.db.query('vibes').order('desc').take(50);
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const filters = args.filters || {};

    // Start with base query
    let vibesQuery = ctx.db.query('vibes');

    // Apply sorting
    switch (filters.sort) {
      case 'recent':
      case 'creation_date':
        vibesQuery = vibesQuery.order('desc');
        break;
      case 'name':
        // Note: Convex doesn't support ordering by text fields directly
        vibesQuery = vibesQuery.order('desc');
        break;
      default:
        vibesQuery = vibesQuery.order('desc');
    }

    // Get paginated vibes
    const vibesPaginated = await vibesQuery.paginate({
      cursor: args.cursor || null,
      numItems: limit * 2, // Get extra to filter
    });

    // Filter vibes based on criteria
    let filteredVibes = vibesPaginated.page;

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filteredVibes = filteredVibes.filter((vibe) =>
        vibe.tags?.some((tag) => filters.tags!.includes(tag))
      );
    }

    // Get emoji ratings if emoji filter is present
    let vibesWithEmojiRatings = filteredVibes;
    if (filters.emojis && filters.emojis.length > 0) {
      vibesWithEmojiRatings = await Promise.all(
        filteredVibes.map(async (vibe) => {
          const emojiRatings = await ctx.db
            .query('emojiRatings')
            .withIndex('by_vibe', (q) => q.eq('vibeId', vibe._id))
            .collect();

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
          };
        })
      );

      // Filter out vibes without the required emoji ratings
      vibesWithEmojiRatings = vibesWithEmojiRatings.filter(
        (vibe) => vibe.hasEmojiFilter
      );

      // Apply min rating filter for emojis
      if (filters.minRating) {
        vibesWithEmojiRatings = vibesWithEmojiRatings.filter(
          (vibe) => vibe.avgEmojiRating >= filters.minRating!
        );
      }
    }

    // Apply general rating filters
    if (!filters.emojis && (filters.minRating || filters.maxRating)) {
      vibesWithEmojiRatings = vibesWithEmojiRatings.filter((vibe) => {
        if (filters.minRating && vibe.rating < filters.minRating) return false;
        if (filters.maxRating && vibe.rating > filters.maxRating) return false;
        return true;
      });
    }

    // Sort if needed (for rating-based sorts)
    if (filters.sort === 'rating_desc') {
      vibesWithEmojiRatings.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sort === 'rating_asc') {
      vibesWithEmojiRatings.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (filters.sort === 'most_rated') {
      vibesWithEmojiRatings.sort(
        (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)
      );
    } else if (filters.sort === 'top_rated') {
      vibesWithEmojiRatings.sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log1p(a.ratingCount || 0);
        const scoreB = (b.rating || 0) * Math.log1p(b.ratingCount || 0);
        return scoreB - scoreA;
      });
    }

    // Limit results
    const finalVibes = vibesWithEmojiRatings.slice(0, limit);

    // Get details for final vibes
    const vibesWithDetails = await Promise.all(
      finalVibes.map(async (vibe) => {
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('externalId'), vibe.createdById))
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

    const vibesWithDetails = await Promise.all(
      vibes.page.map(async (vibe) => {
        // Use more efficient user lookup
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('externalId'), vibe.createdById))
          .first();

        // Limit ratings to avoid excessive reads
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(10); // Limit to 10 most recent ratings

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
      continueCursor: vibes.continueCursor,
      isDone: vibes.isDone,
    };
  },
});

// Get a single vibe by ID
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first();

    if (!vibe) {
      return null;
    }

    const creator = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', vibe.createdById))
      .first();

    const ratings = await ctx.db
      .query('ratings')
      .filter((q) => q.eq(q.field('vibeId'), vibe.id))
      .collect();

    const ratingDetails = await Promise.all(
      ratings.map(async (rating) => {
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

    return {
      ...vibe,
      createdBy: creator,
      ratings: ratingDetails,
    };
  },
});

// Get vibes by user ID
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const vibes = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('createdById'), args.userId))
      .collect();

    return await Promise.all(
      vibes.map(async (vibe) => {
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

// Create a new vibe
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to create a vibe');
    }

    // Ensure user exists in our database
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', identity.subject))
      .first();

    // If user doesn't exist, create them with basic info from Clerk
    if (!user) {
      await ctx.db.insert('users', {
        externalId: identity.subject,
        username: identity.nickname || undefined,
        first_name: identity.givenName || undefined,
        last_name: identity.familyName || undefined,
        image_url: identity.pictureUrl || undefined,
        profile_image_url: identity.pictureUrl || undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    // Generate a unique ID for the vibe
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    const vibeId = await ctx.db.insert('vibes', {
      id,
      title: args.title,
      description: args.description,
      image: args.image,
      createdById: identity.subject, // Use the authenticated user's ID from JWT
      createdAt: now,
      tags: args.tags ?? [],
    });

    // Update tag usage counts
    if (args.tags && args.tags.length > 0) {
      await ctx.scheduler.runAfter(0, internal.tags.updateTagCounts, {
        tagsToAdd: args.tags,
      });
    }

    return vibeId;
  },
});

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
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to rate a vibe');
    }

    // Validate value
    if (args.value < 1 || args.value > 5) {
      throw new Error('Rating value must be between 1 and 5');
    }

    // Validate review
    if (!args.review || args.review.trim().length === 0) {
      throw new Error('Review is required');
    }

    const now = new Date().toISOString();
    let tags: string[] = [];

    // Get emoji metadata for tags
    const emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    if (emojiData && emojiData.tags) {
      tags = emojiData.tags;
    }

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .withIndex('vibeAndUser', (q) =>
        q.eq('vibeId', args.vibeId).eq('userId', identity.subject)
      )
      .first();

    const ratingData = {
      emoji: args.emoji,
      value: args.value,
      review: args.review.trim(),
      tags: tags.length > 0 ? tags : undefined,
      updatedAt: now,
    };

    if (existingRating) {
      // Update the existing rating
      return await ctx.db.patch(existingRating._id, ratingData);
    } else {
      // Create a new rating
      return await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: identity.subject,
        createdAt: now,
        ...ratingData,
      });
    }
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
    const emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    if (emojiData && emojiData.sentiment) {
      if (emojiData.sentiment === 'positive') defaultValue = 4;
      else if (emojiData.sentiment === 'negative') defaultValue = 2;
    }

    // Create a quick rating
    return await ctx.db.insert('ratings', {
      vibeId: args.vibeId,
      userId: identity.subject,
      emoji: args.emoji,
      value: defaultValue,
      review: `Quick reaction: ${args.emoji}`,
      createdAt: new Date().toISOString(),
      tags: emojiData?.tags,
    });
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
    const ratingsByVibe = new Map<string, any[]>();
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
    const ratingsByVibe = new Map<string, any[]>();
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

// Get current authenticated user
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

    return (
      user || {
        externalId: identity.subject,
        email: identity.email,
        name: identity.name,
        // Add other fields as needed
      }
    );
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

export const createForSeed = internalMutation({
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

    return await ctx.db.insert('vibes', {
      id,
      title: args.title,
      description: args.description,
      image: args.image,
      createdById: args.createdById,
      createdAt: now,
      tags: args.tags ?? [],
    });
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
    let tags: string[] = [];

    // Get emoji metadata for tags
    const emojiData = await ctx.db
      .query('emojis')
      .withIndex('byEmoji', (q) => q.eq('emoji', args.emoji))
      .first();

    if (emojiData && emojiData.tags) {
      tags = emojiData.tags;
    }

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

    if (existingRating) {
      // Update the existing rating
      return await ctx.db.patch(existingRating._id, ratingData);
    } else {
      // Create a new rating
      return await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: args.userId,
        createdAt: now,
        ...ratingData,
      });
    }
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
        tags: emojiData?.tags,
      });
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
