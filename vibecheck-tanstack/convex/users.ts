import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Get all users
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})

// Get a user by ID
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first()
  },
})

// Create a new user
export const create = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, args) => {
    const joinDate = new Date().toISOString()
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first()
    
    if (existingUser) {
      return existingUser
    }

    return await ctx.db.insert('users', {
      id: args.id,
      name: args.name,
      avatar: args.avatar,
      joinDate,
    })
  },
})

// Update a user
export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first()
    
    if (!user) {
      throw new Error(`User with ID ${args.id} not found`)
    }

    const updates: Record<string, string> = {}
    
    if (args.name !== undefined) {
      updates.name = args.name
    }
    
    if (args.avatar !== undefined) {
      updates.avatar = args.avatar
    }

    if (Object.keys(updates).length > 0) {
      return await ctx.db.patch(user._id, updates)
    }

    return user
  },
})

// Get the current user's vibes
export const getCurrentUserVibes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('createdById'), args.userId))
      .collect()
  },
})

// Seed a demo user if none exists
export const seedDemoUser = mutation({
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query('users').collect()
    
    if (existingUsers.length === 0) {
      // Create a demo user
      const userId = 'demo-user'
      await ctx.db.insert('users', {
        id: userId,
        name: 'Demo User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        joinDate: new Date().toISOString(),
      })
      
      // Create some demo vibes
      const vibe1Id = 'demo-vibe-1'
      await ctx.db.insert('vibes', {
        id: vibe1Id,
        title: 'Morning Coffee Vibe',
        description: 'Perfect for starting your day with a calm, focused energy',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
        createdById: userId,
        createdAt: new Date().toISOString(),
        tags: ['morning', 'calm', 'focus'],
      })
      
      const vibe2Id = 'demo-vibe-2'
      await ctx.db.insert('vibes', {
        id: vibe2Id,
        title: 'Summer Beach Sunset',
        description: 'Relaxing beach vibes with golden hour lighting',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        createdById: userId,
        createdAt: new Date().toISOString(),
        tags: ['summer', 'beach', 'sunset', 'relaxing'],
      })
      
      // Add some ratings
      await ctx.db.insert('ratings', {
        vibeId: vibe1Id,
        userId,
        rating: 4,
        review: 'Really helps me get into the right mindset in the morning!',
        date: new Date().toISOString(),
      })
      
      // Add emoji reactions
      await ctx.db.insert('reactions', {
        vibeId: vibe1Id,
        emoji: '☕',
        userId,
      })
      
      await ctx.db.insert('reactions', {
        vibeId: vibe2Id,
        emoji: '🌅',
        userId,
      })
      
      return {
        success: true,
        message: 'Demo user and data created successfully',
      }
    }
    
    return {
      success: false,
      message: 'Users already exist, skipping seed',
    }
  },
}) 