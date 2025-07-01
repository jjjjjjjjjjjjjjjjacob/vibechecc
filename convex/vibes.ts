import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';

// Simple get all vibes (for backwards compatibility)
export const getAllSimple = query({
  handler: async (ctx) => {
    // Just return basic vibe data without complex joins
    return await ctx.db.query('vibes').order('desc').take(50);
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
              .filter((q) => q.eq(q.field('externalId'), rating.userId))
              .first();
            return {
              user,
              rating: rating.rating,
              review: rating.review,
              date: rating.date,
            };
          })
        );

        // Limit reactions to avoid excessive reads
        const reactions = await ctx.db
          .query('reactions')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(50); // Limit to 50 reactions

        // Group reactions by emoji
        const emojiReactions = reactions.reduce(
          (acc, reaction) => {
            const existingReaction = acc.find(
              (r) => r.emoji === reaction.emoji
            );
            if (existingReaction) {
              existingReaction.users.push(reaction.userId);
              existingReaction.count++;
            } else {
              acc.push({
                emoji: reaction.emoji,
                count: 1,
                users: [reaction.userId],
              });
            }
            return acc;
          },
          [] as { emoji: string; count: number; users: string[] }[]
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          reactions: emojiReactions,
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
          .filter((q) => q.eq(q.field('externalId'), rating.userId))
          .first();
        return {
          user,
          rating: rating.rating,
          review: rating.review,
          date: rating.date,
        };
      })
    );

    const reactions = await ctx.db
      .query('reactions')
      .filter((q) => q.eq(q.field('vibeId'), vibe.id))
      .collect();

    // Group reactions by emoji
    const emojiReactions = reactions.reduce(
      (acc, reaction) => {
        const existingReaction = acc.find((r) => r.emoji === reaction.emoji);
        if (existingReaction) {
          existingReaction.users.push(reaction.userId);
          existingReaction.count++;
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.userId],
          });
        }
        return acc;
      },
      [] as { emoji: string; count: number; users: string[] }[]
    );

    return {
      ...vibe,
      createdBy: creator,
      ratings: ratingDetails,
      reactions: emojiReactions,
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
              .filter((q) => q.eq(q.field('externalId'), rating.userId))
              .first();
            return {
              user,
              rating: rating.rating,
              review: rating.review,
              date: rating.date,
            };
          })
        );

        const reactions = await ctx.db
          .query('reactions')
          .filter((q) => q.eq(q.field('vibeId'), vibe.id))
          .collect();

        // Group reactions by emoji
        const emojiReactions = reactions.reduce(
          (acc, reaction) => {
            const existingReaction = acc.find(
              (r) => r.emoji === reaction.emoji
            );
            if (existingReaction) {
              existingReaction.users.push(reaction.userId);
              existingReaction.count++;
            } else {
              acc.push({
                emoji: reaction.emoji,
                count: 1,
                users: [reaction.userId],
              });
            }
            return acc;
          },
          [] as { emoji: string; count: number; users: string[] }[]
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          reactions: emojiReactions,
        };
      })
    );
  },
});

// Get vibes that a user has reacted to
export const getUserReactedVibes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get all reactions by the user
    const userReactions = await ctx.db
      .query('reactions')
      .withIndex('userAndVibe', (q) => q.eq('userId', args.userId))
      .collect();

    // Get unique vibe IDs that the user has reacted to
    const reactedVibeIds = [...new Set(userReactions.map((r) => r.vibeId))];

    // Get the vibes for those IDs
    const vibes = await Promise.all(
      reactedVibeIds.map(async (vibeId) => {
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
              .filter((q) => q.eq(q.field('externalId'), rating.userId))
              .first();
            return {
              user,
              rating: rating.rating,
              review: rating.review,
              date: rating.date,
            };
          })
        );

        const reactions = await ctx.db
          .query('reactions')
          .filter((q) => q.eq(q.field('vibeId'), vibe.id))
          .collect();

        // Group reactions by emoji
        const emojiReactions = reactions.reduce(
          (acc, reaction) => {
            const existingReaction = acc.find(
              (r) => r.emoji === reaction.emoji
            );
            if (existingReaction) {
              existingReaction.users.push(reaction.userId);
              existingReaction.count++;
            } else {
              acc.push({
                emoji: reaction.emoji,
                count: 1,
                users: [reaction.userId],
              });
            }
            return acc;
          },
          [] as { emoji: string; count: number; users: string[] }[]
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          reactions: emojiReactions,
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

    // Generate a unique ID for the vibe
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    return await ctx.db.insert('vibes', {
      id,
      title: args.title,
      description: args.description,
      image: args.image,
      createdById: identity.subject, // Use the authenticated user's ID from JWT
      createdAt: now,
      tags: args.tags || [],
    });
  },
});

// Add a rating to a vibe
export const addRating = mutation({
  args: {
    vibeId: v.string(),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to rate a vibe');
    }

    const now = new Date().toISOString();

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .filter((q) =>
        q.and(
          q.eq(q.field('vibeId'), args.vibeId),
          q.eq(q.field('userId'), identity.subject)
        )
      )
      .first();

    if (existingRating) {
      // Update the existing rating
      return await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        review: args.review,
        date: now,
      });
    } else {
      // Create a new rating
      return await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: identity.subject, // Use the authenticated user's ID from JWT
        rating: args.rating,
        review: args.review,
        date: now,
      });
    }
  },
});

// React to a vibe with an emoji
export const reactToVibe = mutation({
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

    // Check if user already reacted with this emoji
    const existingReaction = await ctx.db
      .query('reactions')
      .filter((q) =>
        q.and(
          q.eq(q.field('vibeId'), args.vibeId),
          q.eq(q.field('userId'), identity.subject),
          q.eq(q.field('emoji'), args.emoji)
        )
      )
      .first();

    if (existingReaction) {
      // Remove the reaction (toggle)
      await ctx.db.delete(existingReaction._id);
      return { added: false };
    } else {
      // Add the reaction
      await ctx.db.insert('reactions', {
        vibeId: args.vibeId,
        emoji: args.emoji,
        userId: identity.subject, // Use the authenticated user's ID from JWT
      });
      return { added: true };
    }
  },
});

// Get vibes by tag
export const getByTag = query({
  args: { tag: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10; // Default limit for tag-based rows

    const allVibes = await ctx.db.query('vibes').order('desc').take(100); // Get recent vibes

    // Filter vibes that contain the specified tag
    const vibesWithTag = allVibes
      .filter((vibe) => vibe.tags && vibe.tags.includes(args.tag))
      .slice(0, limit);

    return await Promise.all(
      vibesWithTag.map(async (vibe) => {
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('externalId'), vibe.createdById))
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
              .filter((q) => q.eq(q.field('externalId'), rating.userId))
              .first();
            return {
              user,
              rating: rating.rating,
              review: rating.review,
              date: rating.date,
            };
          })
        );

        // Get limited reactions for performance
        const reactions = await ctx.db
          .query('reactions')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(20);

        // Group reactions by emoji
        const emojiReactions = reactions.reduce(
          (acc, reaction) => {
            const existingReaction = acc.find(
              (r) => r.emoji === reaction.emoji
            );
            if (existingReaction) {
              existingReaction.users.push(reaction.userId);
              existingReaction.count++;
            } else {
              acc.push({
                emoji: reaction.emoji,
                count: 1,
                users: [reaction.userId],
              });
            }
            return acc;
          },
          [] as { emoji: string; count: number; users: string[] }[]
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          reactions: emojiReactions,
        };
      })
    );
  },
});

// Get all available tags from vibes
export const getAllTags = query({
  handler: async (ctx) => {
    const vibes = await ctx.db.query('vibes').collect();

    // Extract all tags and count their usage
    const tagCounts = new Map<string, number>();

    vibes.forEach((vibe) => {
      if (vibe.tags) {
        vibe.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Convert to array and sort by usage count
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// Get top-rated vibes
export const getTopRated = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all vibes and calculate their average ratings
    const vibes = await ctx.db.query('vibes').order('desc').take(50);

    const vibesWithRatings = await Promise.all(
      vibes.map(async (vibe) => {
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
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

    return await Promise.all(
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
              .filter((q) => q.eq(q.field('externalId'), rating.userId))
              .first();
            return {
              user,
              rating: rating.rating,
              review: rating.review,
              date: rating.date,
            };
          })
        );

        const reactions = await ctx.db
          .query('reactions')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .take(20);

        const emojiReactions = reactions.reduce(
          (acc, reaction) => {
            const existingReaction = acc.find(
              (r) => r.emoji === reaction.emoji
            );
            if (existingReaction) {
              existingReaction.users.push(reaction.userId);
              existingReaction.count++;
            } else {
              acc.push({
                emoji: reaction.emoji,
                count: 1,
                users: [reaction.userId],
              });
            }
            return acc;
          },
          [] as { emoji: string; count: number; users: string[] }[]
        );

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          reactions: emojiReactions,
        };
      })
    );
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
      tags: args.tags || [],
    });
  },
});

export const addRatingForSeed = internalMutation({
  args: {
    vibeId: v.string(),
    rating: v.number(),
    review: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .filter((q) =>
        q.and(
          q.eq(q.field('vibeId'), args.vibeId),
          q.eq(q.field('userId'), args.userId)
        )
      )
      .first();

    if (existingRating) {
      // Update the existing rating
      return await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        review: args.review,
        date: now,
      });
    } else {
      // Create a new rating
      return await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: args.userId,
        rating: args.rating,
        review: args.review,
        date: now,
      });
    }
  },
});

export const reactToVibeForSeed = internalMutation({
  args: {
    vibeId: v.string(),
    emoji: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already reacted with this emoji
    const existingReaction = await ctx.db
      .query('reactions')
      .filter((q) =>
        q.and(
          q.eq(q.field('vibeId'), args.vibeId),
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('emoji'), args.emoji)
        )
      )
      .first();

    if (existingReaction) {
      // Remove the reaction (toggle)
      await ctx.db.delete(existingReaction._id);
      return { added: false };
    } else {
      // Add the reaction
      await ctx.db.insert('reactions', {
        vibeId: args.vibeId,
        emoji: args.emoji,
        userId: args.userId,
      });
      return { added: true };
    }
  },
});
