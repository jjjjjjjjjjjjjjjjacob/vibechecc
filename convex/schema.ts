import { defineSchema, defineTable } from 'convex/server';
import { type Infer, v } from 'convex/values';

const schema = defineSchema({
  users: defineTable({
    id: v.string(),
    username: v.string(),
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
});
export default schema;

const user = schema.tables.users.validator;
const vibe = schema.tables.vibes.validator;
const rating = schema.tables.ratings.validator;
const reaction = schema.tables.reactions.validator;

export type User = Infer<typeof user>;
export type Vibe = Infer<typeof vibe>;
export type Rating = Infer<typeof rating>;
export type Reaction = Infer<typeof reaction>;

export const createVibeSchema = v.object({
  title: vibe.fields.title,
  description: vibe.fields.description,
  image: v.optional(vibe.fields.image),
  tags: v.optional(vibe.fields.tags),
  createdById: vibe.fields.createdById,
});

export const createRatingSchema = v.object({
  vibeId: rating.fields.vibeId,
  userId: rating.fields.userId,
  rating: rating.fields.rating,
  review: v.optional(rating.fields.review),
});

export const reactToVibeSchema = v.object({
  vibeId: reaction.fields.vibeId,
  emoji: reaction.fields.emoji,
  userId: reaction.fields.userId,
});
