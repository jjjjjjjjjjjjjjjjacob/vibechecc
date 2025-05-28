import { defineSchema, defineTable } from 'convex/server'
import { type Infer, v } from 'convex/values'

const schema = defineSchema({
  boards: defineTable({
    id: v.string(),
    name: v.string(),
    color: v.string(),
  }).index('id', ['id']),

  columns: defineTable({
    id: v.string(),
    boardId: v.string(),
    name: v.string(),
    order: v.number(),
  })
    .index('id', ['id'])
    .index('board', ['boardId']),

  items: defineTable({
    id: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    order: v.number(),
    columnId: v.string(),
    boardId: v.string(),
  })
    .index('id', ['id'])
    .index('column', ['columnId'])
    .index('board', ['boardId']),

  users: defineTable({
    id: v.string(),
    name: v.string(),
    avatar: v.string(),
    joinDate: v.string(),
  }).index('id', ['id']),

  vibes: defineTable({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    createdById: v.string(),
    createdAt: v.string(),
    tags: v.optional(v.array(v.string())),
  })
    .index('id', ['id'])
    .index('createdBy', ['createdById']),

  ratings: defineTable({
    vibeId: v.string(),
    userId: v.string(),
    rating: v.number(),
    review: v.optional(v.string()),
    date: v.string(),
  })
    .index('vibe', ['vibeId'])
    .index('user', ['userId'])
    .index('vibeAndUser', ['vibeId', 'userId']),

  reactions: defineTable({
    vibeId: v.string(),
    emoji: v.string(),
    userId: v.string(),
  })
    .index('vibe', ['vibeId'])
    .index('vibeAndEmoji', ['vibeId', 'emoji'])
    .index('userAndVibe', ['userId', 'vibeId']),
})
export default schema

const board = schema.tables.boards.validator
const column = schema.tables.columns.validator
const item = schema.tables.items.validator

const user = schema.tables.users.validator
const vibe = schema.tables.vibes.validator
const rating = schema.tables.ratings.validator
const reaction = schema.tables.reactions.validator

export const updateBoardSchema = v.object({
  id: board.fields.id,
  name: v.optional(board.fields.name),
  color: v.optional(v.string()),
})

export const updateColumnSchema = v.object({
  id: column.fields.id,
  boardId: column.fields.boardId,
  name: v.optional(column.fields.name),
  order: v.optional(column.fields.order),
})

export const deleteItemSchema = v.object({
  id: item.fields.id,
  boardId: item.fields.boardId,
})
const { order, id, ...rest } = column.fields
export const newColumnsSchema = v.object(rest)
export const deleteColumnSchema = v.object({
  boardId: column.fields.boardId,
  id: column.fields.id,
})

export type Board = Infer<typeof board>
export type Column = Infer<typeof column>
export type Item = Infer<typeof item>

export type User = Infer<typeof user>
export type Vibe = Infer<typeof vibe>
export type Rating = Infer<typeof rating>
export type Reaction = Infer<typeof reaction>

export const createVibeSchema = v.object({
  title: vibe.fields.title,
  description: vibe.fields.description,
  image: v.optional(vibe.fields.image),
  tags: v.optional(vibe.fields.tags),
  createdById: vibe.fields.createdById,
})

export const createRatingSchema = v.object({
  vibeId: rating.fields.vibeId,
  userId: rating.fields.userId,
  rating: rating.fields.rating,
  review: v.optional(rating.fields.review),
})

export const reactToVibeSchema = v.object({
  vibeId: reaction.fields.vibeId,
  emoji: reaction.fields.emoji,
  userId: reaction.fields.userId,
})
