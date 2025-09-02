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
    themeColor: v.optional(v.string()), // User's selected theme color ID (defaults to 'pink') - legacy field
    primaryColor: v.optional(v.string()), // Primary gradient color
    secondaryColor: v.optional(v.string()), // Secondary gradient color
    socials: v.optional(
      v.object({
        twitter: v.optional(v.string()),
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ), // Social media links

    // Follow count fields for efficient querying
    followerCount: v.optional(v.number()), // Number of users following this user
    followingCount: v.optional(v.number()), // Number of users this user follows

    // Admin moderation fields
    suspended: v.optional(v.boolean()), // Whether user is suspended
    suspensionReason: v.optional(v.string()), // Reason for suspension
    deleted: v.optional(v.boolean()), // Whether user is soft-deleted
    deletedAt: v.optional(v.number()), // Timestamp of deletion
    deletionReason: v.optional(v.string()), // Reason for deletion

    // Admin flag
    isAdmin: v.optional(v.boolean()), // Whether user has admin privileges
  })
    .index('byExternalId', ['externalId']) // Primary index for Clerk user lookups
    .index('byUsername', ['username']) // Index for username lookups
    .searchIndex('searchUsername', {
      searchField: 'username',
    })
    .searchIndex('searchBio', {
      searchField: 'bio',
    }),

  vibes: defineTable({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()), // Legacy: URL string
    imageStorageId: v.optional(v.id('_storage')), // New: Convex storage ID
    createdById: v.string(),
    createdAt: v.string(),
    tags: v.optional(v.array(v.string())),
    visibility: v.optional(v.union(v.literal('public'), v.literal('deleted'))), // Default 'public', 'deleted' for soft delete
    updatedAt: v.optional(v.string()), // Track when vibe was last updated

    // Color gradient fields for custom vibe appearance
    gradientFrom: v.optional(v.string()), // Starting color for gradient (hex or color name)
    gradientTo: v.optional(v.string()), // Ending color for gradient (hex or color name)
    gradientDirection: v.optional(v.string()), // Gradient direction (e.g., 'to-br', 'to-r', 'to-b')

    // Text contrast mode for ensuring readability
    textContrastMode: v.optional(
      v.union(
        v.literal('light'), // Use light mode text colors
        v.literal('dark'), // Use dark mode text colors
        v.literal('auto') // Let the system decide (default behavior)
      )
    ),

    // Share tracking fields
    shareCount: v.optional(v.number()), // Total number of times this vibe has been shared
    lastSharedAt: v.optional(v.number()), // Timestamp of most recent share

    // Boost/dampen system fields
    boostScore: v.optional(v.number()), // Current boost score (can be negative for dampens)
    totalBoosts: v.optional(v.number()), // Total number of boosts received
    totalDampens: v.optional(v.number()), // Total number of dampens received

    // Admin moderation fields
    moderationReason: v.optional(v.string()), // Reason for moderation action
    moderatedAt: v.optional(v.string()), // Timestamp of moderation
    deletionReason: v.optional(v.string()), // Reason for deletion
    deletedAt: v.optional(v.string()), // Timestamp of deletion
  })
    .index('id', ['id'])
    .index('createdBy', ['createdById'])
    .index('byCreatedAt', ['createdAt'])
    .index('byVisibility', ['visibility']) // Index for filtering by visibility
    .index('byCreatedByAndVisibility', ['createdById', 'visibility']) // Index for user's public vibes
    .index('byUpdatedAt', ['updatedAt']) // NEW: Index for recent content queries
    .index('byShareCount', ['shareCount']) // NEW: Index for sorting by share popularity
    .index('byLastSharedAt', ['lastSharedAt']) // NEW: Index for recently shared content
    .index('byBoostScore', ['boostScore']) // NEW: Index for sorting by boost score
    .index('byTotalBoosts', ['totalBoosts']) // NEW: Index for sorting by total boosts
    .searchIndex('searchTitle', {
      searchField: 'title',
      filterFields: ['createdById', 'tags', 'visibility'],
    })
    .searchIndex('searchDescription', {
      searchField: 'description',
      filterFields: ['createdById', 'tags', 'visibility'],
    }),

  ratings: defineTable({
    vibeId: v.string(),
    userId: v.string(),
    emoji: v.string(), // REQUIRED - the emoji used
    value: v.number(), // REQUIRED - 1-5 rating value
    review: v.string(), // REQUIRED - text review
    tags: v.optional(v.array(v.string())), // Associated tags from emoji metadata
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),

    // Boost/dampen system fields
    netScore: v.optional(v.number()), // Net score: boosts - dampens (can be negative)
    boostCount: v.optional(v.number()), // Total number of boosts received
    dampenCount: v.optional(v.number()), // Total number of dampens received

    // Admin moderation fields
    flagged: v.optional(v.boolean()), // Whether review is flagged
    moderationReason: v.optional(v.string()), // Reason for moderation
    moderatedAt: v.optional(v.string()), // Timestamp of moderation
  })
    .index('vibe', ['vibeId'])
    .index('user', ['userId'])
    .index('vibeAndUser', ['vibeId', 'userId'])
    .index('vibeAndEmoji', ['vibeId', 'emoji'])
    .index('vibeUserEmoji', ['vibeId', 'userId', 'emoji'])
    .index('byCreatedAt', ['createdAt'])
    .index('byUserAndEmoji', ['userId', 'emoji'])
    .index('byValue', ['value'])
    .index('byVibeAndValue', ['vibeId', 'value']) // NEW: Compound index for rating-based sorting
    .index('byValueAndVibe', ['value', 'vibeId']) // NEW: Index for filtering by rating value
    .index('byNetScore', ['netScore']) // NEW: Index for sorting by net score
    .index('byBoostCount', ['boostCount']) // NEW: Index for sorting by boost count
    .searchIndex('searchReview', {
      searchField: 'review',
      filterFields: ['vibeId', 'userId', 'emoji', 'value'],
    }),

  // Emojis table to store all available emojis with metadata
  emojis: defineTable({
    emoji: v.string(),
    unicode: v.optional(v.string()), // Normalized unicode representation (e.g., "U+1F600")
    name: v.string(),
    keywords: v.array(v.string()),
    category: v.string(),
    subcategory: v.optional(v.string()), // Emoji subcategory
    version: v.optional(v.string()), // Emoji version (e.g., "15.0")
    color: v.string(), // Hex color for UI theming
    sentiment: v.optional(
      v.union(
        v.literal('positive'),
        v.literal('negative'),
        v.literal('neutral')
      )
    ),
    tags: v.optional(v.array(v.string())), // Tags associated with the emoji
    // emoji-mart specific fields
    shortcodes: v.optional(v.array(v.string())), // Alternative shortcodes like :smile:
    emoticons: v.optional(v.array(v.string())), // Text emoticons like :) or :-D
    aliases: v.optional(v.array(v.string())), // Alternative names
    skins: v.optional(v.array(v.string())), // Skin tone variations
    // Admin management fields
    disabled: v.optional(v.boolean()), // Whether emoji is disabled
    usageCount: v.optional(v.number()), // Track popularity for sorting
    lastUsed: v.optional(v.number()), // Timestamp of last use
  })
    .index('byEmoji', ['emoji'])
    .index('byUnicode', ['unicode'])
    .index('byCategory', ['category'])
    .searchIndex('search', {
      searchField: 'name',
      filterFields: ['keywords'],
    }),

  // Deprecated - will be removed after migration
  // emojiRatingMetadata table is being replaced by emojis table

  searchHistory: defineTable({
    userId: v.string(),
    query: v.string(),
    timestamp: v.number(),
    resultCount: v.number(),
    clickedResults: v.optional(v.array(v.string())),
    category: v.optional(v.string()), // 'recent', 'trending', 'recommended', 'tag', 'search'
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

  // Migration tracking table
  migrations: defineTable({
    name: v.string(),
    completedAt: v.string(),
    status: v.union(v.literal('completed'), v.literal('failed')),
    error: v.optional(v.string()),
  }).index('byName', ['name']),

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

  // Tags table to track all unique tags
  tags: defineTable({
    name: v.string(), // The tag name (lowercase, normalized)
    count: v.number(), // Number of vibes using this tag
    createdAt: v.number(), // Timestamp when first created
    lastUsed: v.number(), // Timestamp when last used
    createdById: v.optional(v.string()), // User who created the tag (admin if not specified)
  })
    .index('byName', ['name'])
    .index('byCount', ['count'])
    .searchIndex('search', {
      searchField: 'name',
    }),

  // User follows table to track follow relationships
  follows: defineTable({
    followerId: v.string(), // External ID of user doing the following
    followingId: v.string(), // External ID of user being followed
    createdAt: v.number(), // Timestamp when follow relationship was created
  })
    .index('byFollower', ['followerId'])
    .index('byFollowing', ['followingId'])
    .index('byFollowerAndFollowing', ['followerId', 'followingId']),

  // Notifications table to track user notifications
  notifications: defineTable({
    userId: v.string(), // External ID of user receiving notification
    type: v.union(
      v.literal('follow'),
      v.literal('rating'),
      v.literal('new_vibe'),
      v.literal('new_rating')
    ),
    triggerUserId: v.string(), // External ID of user who triggered notification
    targetId: v.string(), // ID of the target - vibeId, ratingId, etc.
    title: v.string(), // e.g., "John followed you"
    description: v.string(), // e.g., "Check out their profile"
    metadata: v.optional(v.any()), // Additional data like vibe title, rating emoji
    read: v.boolean(), // Whether notification has been read
    createdAt: v.number(), // Timestamp
  })
    .index('byUser', ['userId', 'createdAt'])
    .index('byUserAndRead', ['userId', 'read', 'createdAt'])
    .index('byUserAndType', ['userId', 'type', 'createdAt']),

  // Social connections table to track OAuth connections with social platforms
  socialConnections: defineTable({
    userId: v.string(), // External ID of user who owns this connection
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok')
    ), // Social platform type
    platformUserId: v.string(), // User ID on the social platform
    platformUsername: v.optional(v.string()), // Username on the social platform
    accessToken: v.optional(v.string()), // OAuth access token (encrypted)
    refreshToken: v.optional(v.string()), // OAuth refresh token (encrypted)
    tokenExpiresAt: v.optional(v.number()), // When the access token expires
    connectionStatus: v.union(
      v.literal('connected'),
      v.literal('disconnected'),
      v.literal('expired'),
      v.literal('error')
    ), // Status of the connection
    connectedAt: v.number(), // When the connection was established
    lastSyncAt: v.optional(v.number()), // Last time data was synced from platform
    metadata: v.optional(v.any()), // Additional platform-specific data

    // Error tracking
    lastError: v.optional(v.string()), // Last error message if connection failed
    errorCount: v.optional(v.number()), // Number of consecutive errors
  })
    .index('byUser', ['userId'])
    .index('byUserAndPlatform', ['userId', 'platform'])
    .index('byPlatformUserId', ['platform', 'platformUserId'])
    .index('byStatus', ['connectionStatus'])
    .index('byConnectedAt', ['connectedAt']),

  // Share events table for tracking and analytics
  shareEvents: defineTable({
    contentType: v.union(v.literal('vibe'), v.literal('profile')), // Type of content shared
    contentId: v.string(), // ID of the content (vibeId or userId)
    userId: v.optional(v.string()), // External ID of user who shared (optional for anonymous)
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok'),
      v.literal('clipboard'),
      v.literal('native')
    ), // Platform shared to
    shareType: v.union(
      v.literal('story'),
      v.literal('feed'),
      v.literal('direct'),
      v.literal('copy')
    ), // Type of share action

    // Tracking metadata
    sessionId: v.optional(v.string()), // Session identifier for tracking
    referrer: v.optional(v.string()), // Referrer URL
    userAgent: v.optional(v.string()), // User agent string
    ipAddress: v.optional(v.string()), // IP address (if tracked)

    // UTM tracking
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),

    // Event metadata
    success: v.boolean(), // Whether the share was successful
    errorMessage: v.optional(v.string()), // Error message if share failed
    metadata: v.optional(v.any()), // Additional event-specific data

    createdAt: v.number(), // Timestamp of the share event
  })
    .index('byContent', ['contentType', 'contentId'])
    .index('byUser', ['userId', 'createdAt'])
    .index('byPlatform', ['platform', 'createdAt'])
    .index('byShareType', ['shareType', 'createdAt'])
    .index('bySuccess', ['success', 'createdAt'])
    .index('byCreatedAt', ['createdAt'])
    .index('byUserAndPlatform', ['userId', 'platform', 'createdAt'])
    .index('byContentAndPlatform', ['contentType', 'contentId', 'platform']),

  // Rating votes table to track user boost/dampen votes on emoji ratings
  ratingVotes: defineTable({
    ratingId: v.id('ratings'), // ID of the rating being voted on
    userId: v.string(), // External ID of user who voted
    voteType: v.union(v.literal('boost'), v.literal('dampen')), // Type of vote
    createdAt: v.number(), // Timestamp when vote was created
  })
    .index('byRating', ['ratingId'])
    .index('byUser', ['userId', 'createdAt'])
    .index('byRatingAndUser', ['ratingId', 'userId']), // Unique constraint index

  // Rating likes table to track user likes on emoji ratings (DEPRECATED - kept for migration)
  ratingLikes: defineTable({
    ratingId: v.id('ratings'), // ID of the rating being liked
    userId: v.string(), // External ID of user who liked the rating
    createdAt: v.number(), // Timestamp when like was created
  })
    .index('byRating', ['ratingId'])
    .index('byUser', ['userId', 'createdAt'])
    .index('byRatingAndUser', ['ratingId', 'userId']), // Unique constraint index

  // User points system for gamification
  userPoints: defineTable({
    userId: v.string(), // External ID of user
    totalPointsEarned: v.number(), // Lifetime points earned
    currentBalance: v.number(), // Current spendable points
    protectedPoints: v.optional(v.number()), // Points that can't be dampened (starter bonus, level-ups)
    dailyEarnedPoints: v.number(), // Points earned today
    dailyPostCount: v.number(), // Posts made today
    dailyReviewCount: v.number(), // Reviews written today
    dailyDampenCount: v.optional(v.number()), // Times user dampened content today
    lastResetDate: v.string(), // Date of last daily reset (YYYY-MM-DD)
    level: v.number(), // User level based on total points
    multiplier: v.number(), // Current multiplier for point earnings
    streakDays: v.number(), // Consecutive days of activity
    lastActivityDate: v.string(), // Date of last activity (YYYY-MM-DD)
    karmaScore: v.optional(v.number()), // Karma/reputation score for moderating dampen power
  })
    .index('byUserId', ['userId'])
    .index('byLevel', ['level'])
    .index('byTotalPoints', ['totalPointsEarned'])
    .index('byStreak', ['streakDays']),

  // Point transaction history for transparency and auditing
  pointTransactions: defineTable({
    userId: v.string(), // External ID of user
    type: v.union(
      v.literal('earned'),
      v.literal('spent'),
      v.literal('transfer')
    ), // Transaction type
    action: v.union(
      v.literal('post_vibe'),
      v.literal('write_review'),
      v.literal('receive_review'),
      v.literal('boost'),
      v.literal('dampen'),
      v.literal('daily_bonus'),
      v.literal('level_up'),
      v.literal('receive_boost'),
      v.literal('receive_dampen'),
      v.literal('transfer_boost'),
      v.literal('transfer_dampen')
    ), // Action that triggered the transaction
    targetId: v.optional(v.string()), // ID of target (vibeId, ratingId, etc.)
    fromUserId: v.optional(v.string()), // External ID of user who sent points (for transfers)
    toUserId: v.optional(v.string()), // External ID of user who received points (for transfers)
    amount: v.number(), // Points amount (positive for earned, negative for spent)
    multiplier: v.number(), // Multiplier applied at time of transaction
    balanceAfter: v.number(), // User's balance after this transaction
    timestamp: v.number(), // Transaction timestamp
    metadata: v.optional(v.any()), // Additional transaction data
  })
    .index('byUser', ['userId', 'timestamp'])
    .index('byTimestamp', ['timestamp'])
    .index('byUserAndType', ['userId', 'type', 'timestamp'])
    .index('byAction', ['action', 'timestamp']),

  // Daily points history for analytics and charts
  pointsHistory: defineTable({
    userId: v.string(), // External ID of user
    date: v.string(), // Date (YYYY-MM-DD)
    pointsEarned: v.number(), // Total points earned on this date
    pointsSpent: v.number(), // Total points spent on this date
    netChange: v.number(), // Net point change for the day
    endingBalance: v.number(), // Balance at end of day
    activityCount: v.number(), // Number of activities (posts + reviews)
  })
    .index('byUserAndDate', ['userId', 'date'])
    .index('byDate', ['date'])
    .index('byUserAndNetChange', ['userId', 'netChange']),

  // Anonymous actions storage for private mode token carryover
  anonymousActions: defineTable({
    sessionId: v.string(), // Anonymous session identifier
    actions: v.array(v.any()), // Array of actions performed before authentication
    createdAt: v.number(), // Timestamp when actions were stored
    expiresAt: v.number(), // Expiration timestamp (24 hours from creation)
    processedAt: v.optional(v.number()), // Timestamp when actions were processed
  })
    .index('bySessionId', ['sessionId'])
    .index('byExpiresAt', ['expiresAt']),
});
export default schema;

const _user = schema.tables.users.validator;
const vibe = schema.tables.vibes.validator;
const rating = schema.tables.ratings.validator;

const _emoji = schema.tables.emojis.validator;

const _searchHistory = schema.tables.searchHistory.validator;

const _trendingSearches = schema.tables.trendingSearches.validator;

const _searchMetrics = schema.tables.searchMetrics.validator;

const _follows = schema.tables.follows.validator;

const _notification = schema.tables.notifications.validator;

const _socialConnection = schema.tables.socialConnections.validator;

const _shareEvent = schema.tables.shareEvents.validator;

const _ratingVote = schema.tables.ratingVotes.validator;

const _ratingLike = schema.tables.ratingLikes.validator;

const _userPoints = schema.tables.userPoints.validator;

const _pointTransaction = schema.tables.pointTransactions.validator;

const _pointsHistory = schema.tables.pointsHistory.validator;

export type User = Infer<typeof _user>;
export type Vibe = Infer<typeof vibe>;
export type Rating = Infer<typeof rating>;
export type Emoji = Infer<typeof _emoji>;
export type SearchHistory = Infer<typeof _searchHistory>;
export type TrendingSearches = Infer<typeof _trendingSearches>;
export type SearchMetrics = Infer<typeof _searchMetrics>;
export type Follow = Infer<typeof _follows>;
export type Notification = Infer<typeof _notification>;
export type SocialConnection = Infer<typeof _socialConnection>;
export type ShareEvent = Infer<typeof _shareEvent>;
export type RatingVote = Infer<typeof _ratingVote>;
export type RatingLike = Infer<typeof _ratingLike>;
export type UserPoints = Infer<typeof _userPoints>;
export type PointTransaction = Infer<typeof _pointTransaction>;
export type PointsHistory = Infer<typeof _pointsHistory>;

export const createVibeSchema = v.object({
  title: vibe.fields.title,
  description: vibe.fields.description,
  image: v.optional(v.union(v.string(), v.id('_storage'))),
  tags: v.optional(vibe.fields.tags),
  createdById: vibe.fields.createdById,
  gradientFrom: v.optional(vibe.fields.gradientFrom),
  gradientTo: v.optional(vibe.fields.gradientTo),
  gradientDirection: v.optional(vibe.fields.gradientDirection),
});

export const createRatingSchema = v.object({
  vibeId: rating.fields.vibeId,
  userId: rating.fields.userId,
  emoji: rating.fields.emoji,
  value: rating.fields.value,
  review: rating.fields.review,
  tags: v.optional(rating.fields.tags),
});

// Deprecated - reactions are now part of ratings
// export const reactToVibeSchema = v.object({...})
