import { defineSchema, defineTable } from 'convex/server';
import { type Infer, v } from 'convex/values';

const schema = defineSchema({
  users: defineTable({
    // Clerk User ID - primary identifier for linking with Clerk
    externalId: v.string(), // Required - stores Clerk's user.id

    // Core user identity fields (synced with Clerk)
    username: v.optional(v.string()), // Clerk: username (nullable)
    first_name: v.optional(v.string()), // Clerk: first_name (nullable)
    last_name: v.optional(v.string()), // Clerk: last_name (nullable)

    // Image/Avatar fields (UI-relevant, safe to cache)
    image_url: v.optional(v.string()), // Clerk: image_url
    profile_image_url: v.optional(v.string()), // Clerk: profile_image_url
    has_image: v.optional(v.boolean()), // Clerk: has_image

    // Email reference (PII-conscious - store ID reference, not actual email)
    primary_email_address_id: v.optional(v.string()), // Clerk: primary_email_address_id

    // Activity tracking (UI-relevant for showing user status)
    last_sign_in_at: v.optional(v.number()), // Clerk: last_sign_in_at (timestamp)
    last_active_at: v.optional(v.number()), // Clerk: last_active_at (timestamp)

    // Timestamps (1:1 with Clerk)
    created_at: v.optional(v.number()), // Clerk: created_at (timestamp)
    updated_at: v.optional(v.number()), // Clerk: updated_at (timestamp)

    // Onboarding fields
    onboardingCompleted: v.optional(v.boolean()), // Whether user completed onboarding
    interests: v.optional(v.array(v.string())), // User selected interests/tags

    // Profile customization fields
    bio: v.optional(v.string()), // User bio/description
    socials: v.optional(
      v.object({
        twitter: v.optional(v.string()),
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ), // Social media links
  }).index('byExternalId', ['externalId']), // Primary index for Clerk user lookups

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
    // New fields for emoji ratings
    emojiRating: v.optional(
      v.object({
        emoji: v.string(),
        value: v.number(), // 1-5 scale
      })
    ),
    tags: v.optional(v.array(v.string())), // Associated tags from emoji metadata
  })
    .index('vibe', ['vibeId'])
    .index('user', ['userId'])
    .index('vibeAndUser', ['vibeId', 'userId'])
    .index('vibeAndEmoji', ['vibeId', 'emojiRating.emoji']), // New index for emoji queries

  reactions: defineTable({
    vibeId: v.string(),
    emoji: v.string(),
    userId: v.string(),
    // New fields for emoji ratings
    ratingValue: v.optional(v.number()), // 1-5 if this is a rating reaction
    isRating: v.optional(v.boolean()), // true if this reaction is used as a rating
  })
    .index('vibe', ['vibeId'])
    .index('vibeAndEmoji', ['vibeId', 'emoji'])
    .index('userAndVibe', ['userId', 'vibeId'])
    .index('ratingReactions', ['isRating', 'vibeId']), // New index for rating reactions

  emojiRatingMetadata: defineTable({
    emoji: v.string(),
    tags: v.array(v.string()),
    category: v.string(), // e.g., "emotion", "reaction", "assessment"
    sentiment: v.union(
      v.literal('positive'),
      v.literal('negative'),
      v.literal('neutral')
    ),
  })
    .index('byEmoji', ['emoji'])
    .index('byCategory', ['category'])
    .index('byTag', ['tags']), // For tag-based queries

  searchHistory: defineTable({
    userId: v.string(),
    query: v.string(),
    timestamp: v.number(),
    resultCount: v.number(),
    clickedResults: v.optional(v.array(v.string())),
  })
    .index('byUser', ['userId', 'timestamp'])
    .index('byTimestamp', ['timestamp']),

  trendingSearches: defineTable({
    term: v.string(),
    count: v.number(),
    lastUpdated: v.number(),
    category: v.optional(v.string()), // 'vibe', 'user', 'tag'
  })
    .index('byCount', ['count'])
    .index('byTerm', ['term']),

  searchMetrics: defineTable({
    timestamp: v.number(),
    type: v.union(v.literal('search'), v.literal('click'), v.literal('error')),
    query: v.string(),
    userId: v.optional(v.string()),
    resultCount: v.optional(v.number()),
    clickedResultId: v.optional(v.string()),
    clickedResultType: v.optional(
      v.union(v.literal('vibe'), v.literal('user'), v.literal('tag'))
    ),
    clickPosition: v.optional(v.number()),
    responseTime: v.optional(v.number()),
    error: v.optional(v.string()),
    filters: v.optional(v.any()),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_user', ['userId', 'timestamp'])
    .index('by_query', ['query', 'timestamp']),
});
export default schema;

const _user = schema.tables.users.validator;
const vibe = schema.tables.vibes.validator;
const rating = schema.tables.ratings.validator;
const reaction = schema.tables.reactions.validator;
const emojiRatingMetadata = schema.tables.emojiRatingMetadata.validator;
const _searchHistory = schema.tables.searchHistory.validator;
const _trendingSearches = schema.tables.trendingSearches.validator;
const _searchMetrics = schema.tables.searchMetrics.validator;

export type User = Infer<typeof _user>;
export type Vibe = Infer<typeof vibe>;
export type Rating = Infer<typeof rating>;
export type Reaction = Infer<typeof reaction>;
export type EmojiRatingMetadata = Infer<typeof emojiRatingMetadata>;
export type SearchHistory = Infer<typeof _searchHistory>;
export type TrendingSearches = Infer<typeof _trendingSearches>;
export type SearchMetrics = Infer<typeof _searchMetrics>;

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
  emojiRating: v.optional(rating.fields.emojiRating),
  tags: v.optional(rating.fields.tags),
});

export const reactToVibeSchema = v.object({
  vibeId: reaction.fields.vibeId,
  emoji: reaction.fields.emoji,
  userId: reaction.fields.userId,
  ratingValue: v.optional(reaction.fields.ratingValue),
  isRating: v.optional(reaction.fields.isRating),
});
