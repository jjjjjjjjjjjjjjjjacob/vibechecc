// Core vibechecc types that can be shared across applications

// Re-export search types
export * from './search';

// Re-export Convex compatibility types
export * from './convex-compat';

export interface User {
  // Primary identifier (Clerk user ID stored as externalId in our DB)
  externalId: string;
  id?: string; // Alias for compatibility
  _id?: string; // Convex document ID for compatibility

  // Core user identity fields (synced with Clerk)
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;

  // Image/Avatar fields
  image_url?: string;
  profile_image_url?: string;
  has_image?: boolean;

  // Email reference (PII-conscious - store ID reference, not actual email)
  primary_email_address_id?: string;

  // Activity tracking
  last_sign_in_at?: number;
  last_active_at?: number;

  // Timestamps
  created_at?: number;
  updated_at?: number;
  _creationTime?: number; // Convex creation time for compatibility

  // Onboarding fields
  onboardingCompleted?: boolean;
  interests?: string[];

  // Profile customization fields (from Convex schema)
  bio?: string;
  themeColor?: string; // Legacy field
  primaryColor?: string;
  secondaryColor?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
}

export interface EmojiRating {
  emoji: string;
  value: number; // 1-5
  reviewText?: string; // Review text associated with the rating
  tags?: string[];
  count?: number; // For display purposes
}

export interface Rating {
  _id?: string; // Convex document ID for compatibility
  user: User | null;
  value: number;
  emoji: string;
  review: string;
  createdAt: string;
  updatedAt?: string;
  _creationTime?: number; // Convex creation time for compatibility
  tags?: string[];
  vibeId?: string;
  userId?: string;
  // Additional fields that might be populated
  vibe?: {
    id: string;
    title: string;
    description: string;
    image?: string;
    createdBy: { id: string; name: string; avatar?: string };
    createdAt: string;
  };
  rater?: {
    _id?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
}

export interface EmojiRatingMetadata {
  emoji: string;
  tags?: string[];
  category: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface Vibe {
  _id?: string; // Convex document ID for compatibility
  id: string;
  title: string;
  description: string;
  image?: string; // Legacy: URL string
  imageStorageId?: string; // New: Convex storage ID - using string for compatibility
  createdBy?: User | null;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
  _creationTime?: number; // Convex creation time for compatibility
  ratings: Rating[];
  tags?: string[];
  viewCount?: number;
  visibility?: 'public' | 'deleted'; // From Convex schema
  shareCount?: number; // Number of times this vibe has been shared
  lastSharedAt?: number; // Timestamp of most recent share
}

export interface Follow {
  _id?: string; // Convex document ID for compatibility
  followerId: string; // External ID of user doing the following
  followingId: string; // External ID of user being followed
  createdAt: number; // Timestamp when follow relationship was created
  _creationTime?: number; // Convex creation time for compatibility
}

export interface FollowStats {
  followers: number; // Number of users following this user
  following: number; // Number of users this user follows
}

export interface Notification {
  _id?: string; // Convex document ID for compatibility
  userId: string; // External ID of user receiving notification
  type: 'follow' | 'rating' | 'new_vibe' | 'new_rating';
  triggerUserId: string; // External ID of user who triggered notification
  targetId: string; // ID of the target - vibeId, ratingId, etc.
  title: string; // e.g., "John followed you"
  description: string; // e.g., "Check out their profile"
  metadata?: Record<string, unknown>; // Additional data like vibe title, rating emoji
  read: boolean; // Whether notification has been read
  createdAt: number; // Timestamp
  _creationTime?: number; // Convex creation time for compatibility
  triggerUser: User | null; // Populated user data for the user who triggered the notification (can be null if user deleted)
}

// Achievement System Types
export interface AchievementTier {
  threshold: number;
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  multiplier: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tiers: AchievementTier[];
}

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  RATING_MASTER: {
    id: 'RATING_MASTER',
    name: 'Rating Master',
    description: 'Give 50 high-quality ratings (4+ stars)',
    icon: '⭐',
    color: 'gold',
    tiers: [
      { threshold: 10, name: 'bronze', multiplier: 1.0 },
      { threshold: 25, name: 'silver', multiplier: 1.5 },
      { threshold: 50, name: 'gold', multiplier: 2.0 },
      { threshold: 100, name: 'platinum', multiplier: 3.0 },
    ],
  },
  COMMUNITY_BUILDER: {
    id: 'COMMUNITY_BUILDER',
    name: 'Community Builder',
    description: 'Help other users by giving thoughtful feedback',
    icon: '🤝',
    color: 'blue',
    tiers: [
      { threshold: 5, name: 'bronze', multiplier: 1.0 },
      { threshold: 15, name: 'silver', multiplier: 1.5 },
      { threshold: 30, name: 'gold', multiplier: 2.0 },
      { threshold: 60, name: 'platinum', multiplier: 3.0 },
    ],
  },
  TRENDSETTER: {
    id: 'TRENDSETTER',
    name: 'Trendsetter',
    description: 'Create vibes that get lots of engagement',
    icon: '🔥',
    color: 'orange',
    tiers: [
      { threshold: 3, name: 'bronze', multiplier: 1.0 },
      { threshold: 10, name: 'silver', multiplier: 1.5 },
      { threshold: 25, name: 'gold', multiplier: 2.0 },
      { threshold: 50, name: 'platinum', multiplier: 3.0 },
    ],
  },
  CONSISTENT_CONTRIBUTOR: {
    id: 'CONSISTENT_CONTRIBUTOR',
    name: 'Consistent Contributor',
    description: 'Maintain activity streaks',
    icon: '📅',
    color: 'green',
    tiers: [
      { threshold: 7, name: 'bronze', multiplier: 1.0 },
      { threshold: 21, name: 'silver', multiplier: 1.5 },
      { threshold: 50, name: 'gold', multiplier: 2.0 },
      { threshold: 100, name: 'platinum', multiplier: 3.0 },
    ],
  },
  SOCIAL_CONNECTOR: {
    id: 'SOCIAL_CONNECTOR',
    name: 'Social Connector',
    description: 'Build community connections',
    icon: '🌐',
    color: 'purple',
    tiers: [
      { threshold: 10, name: 'bronze', multiplier: 1.0 },
      { threshold: 25, name: 'silver', multiplier: 1.5 },
      { threshold: 50, name: 'gold', multiplier: 2.0 },
      { threshold: 100, name: 'platinum', multiplier: 3.0 },
    ],
  },
} as const;
