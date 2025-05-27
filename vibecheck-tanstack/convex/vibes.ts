import { mutation, query } from './_generated/server'
import {
  createVibeSchema,
  createRatingSchema,
  reactToVibeSchema,
} from './schema'
import { v } from 'convex/values'

// Get all vibes
export const getAll = query({
  handler: async (ctx) => {
    const vibes = await ctx.db.query('vibes').collect()
    return await Promise.all(
      vibes.map(async (vibe) => {
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('id'), vibe.createdById))
          .first()
        
        const ratings = await ctx.db
          .query('ratings')
          .filter((q) => q.eq(q.field('vibeId'), vibe.id))
          .collect()

        const ratingDetails = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .filter((q) => q.eq(q.field('id'), rating.userId))
              .first()
            return {
              user,
              rating: rating.rating,
              review: rating.review,
              date: rating.date,
            }
          })
        )

        const reactions = await ctx.db
          .query('reactions')
          .filter((q) => q.eq(q.field('vibeId'), vibe.id))
          .collect()

        // Group reactions by emoji
        const emojiReactions = reactions.reduce((acc, reaction) => {
          const existingReaction = acc.find((r) => r.emoji === reaction.emoji)
          if (existingReaction) {
            existingReaction.users.push(reaction.userId)
            existingReaction.count++
          } else {
            acc.push({
              emoji: reaction.emoji,
              count: 1,
              users: [reaction.userId],
            })
          }
          return acc
        }, [] as { emoji: string; count: number; users: string[] }[])

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          reactions: emojiReactions,
        }
      })
    )
  },
})

// Get a single vibe by ID
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first()
    
    if (!vibe) {
      return null
    }

    const creator = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('id'), vibe.createdById))
      .first()
    
    const ratings = await ctx.db
      .query('ratings')
      .filter((q) => q.eq(q.field('vibeId'), vibe.id))
      .collect()

    const ratingDetails = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('id'), rating.userId))
          .first()
        return {
          user,
          rating: rating.rating,
          review: rating.review,
          date: rating.date,
        }
      })
    )

    const reactions = await ctx.db
      .query('reactions')
      .filter((q) => q.eq(q.field('vibeId'), vibe.id))
      .collect()

    // Group reactions by emoji
    const emojiReactions = reactions.reduce((acc, reaction) => {
      const existingReaction = acc.find((r) => r.emoji === reaction.emoji)
      if (existingReaction) {
        existingReaction.users.push(reaction.userId)
        existingReaction.count++
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.userId],
        })
      }
      return acc
    }, [] as { emoji: string; count: number; users: string[] }[])

    return {
      ...vibe,
      createdBy: creator,
      ratings: ratingDetails,
      reactions: emojiReactions,
    }
  },
})

// Get vibes by user ID
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const vibes = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('createdById'), args.userId))
      .collect()
    
    return await Promise.all(
      vibes.map(async (vibe) => {
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('id'), vibe.createdById))
          .first()
        
        const ratings = await ctx.db
          .query('ratings')
          .filter((q) => q.eq(q.field('vibeId'), vibe.id))
          .collect()

        const ratingDetails = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db
              .query('users')
              .filter((q) => q.eq(q.field('id'), rating.userId))
              .first()
            return {
              user,
              rating: rating.rating,
              review: rating.review,
              date: rating.date,
            }
          })
        )

        const reactions = await ctx.db
          .query('reactions')
          .filter((q) => q.eq(q.field('vibeId'), vibe.id))
          .collect()

        // Group reactions by emoji
        const emojiReactions = reactions.reduce((acc, reaction) => {
          const existingReaction = acc.find((r) => r.emoji === reaction.emoji)
          if (existingReaction) {
            existingReaction.users.push(reaction.userId)
            existingReaction.count++
          } else {
            acc.push({
              emoji: reaction.emoji,
              count: 1,
              users: [reaction.userId],
            })
          }
          return acc
        }, [] as { emoji: string; count: number; users: string[] }[])

        return {
          ...vibe,
          createdBy: creator,
          ratings: ratingDetails,
          reactions: emojiReactions,
        }
      })
    )
  },
})

// Create a new vibe
export const create = mutation({
  args: createVibeSchema,
  handler: async (ctx, args) => {
    // Generate a unique ID for the vibe
    const id = Math.random().toString(36).substring(2, 15)
    const now = new Date().toISOString()

    return await ctx.db.insert('vibes', {
      id,
      title: args.title,
      description: args.description,
      image: args.image,
      createdById: args.createdById,
      createdAt: now,
      tags: args.tags || [],
    })
  },
})

// Add a rating to a vibe
export const addRating = mutation({
  args: createRatingSchema,
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    
    // Check if user already rated this vibe
    const existingRating = await ctx.db
      .query('ratings')
      .filter((q) => q.and(
        q.eq(q.field('vibeId'), args.vibeId),
        q.eq(q.field('userId'), args.userId)
      ))
      .first()
    
    if (existingRating) {
      // Update the existing rating
      return await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        review: args.review,
        date: now,
      })
    } else {
      // Create a new rating
      return await ctx.db.insert('ratings', {
        vibeId: args.vibeId,
        userId: args.userId,
        rating: args.rating,
        review: args.review,
        date: now,
      })
    }
  },
})

// React to a vibe with an emoji
export const reactToVibe = mutation({
  args: reactToVibeSchema,
  handler: async (ctx, args) => {
    // Check if user already reacted with this emoji
    const existingReaction = await ctx.db
      .query('reactions')
      .filter((q) => q.and(
        q.eq(q.field('vibeId'), args.vibeId),
        q.eq(q.field('userId'), args.userId),
        q.eq(q.field('emoji'), args.emoji)
      ))
      .first()
    
    if (existingReaction) {
      // Remove the reaction (toggle)
      await ctx.db.delete(existingReaction._id)
      return { added: false }
    } else {
      // Add the reaction
      await ctx.db.insert('reactions', {
        vibeId: args.vibeId,
        emoji: args.emoji,
        userId: args.userId,
      })
      return { added: true }
    }
  },
}) 