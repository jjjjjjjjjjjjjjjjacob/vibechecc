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

// Lighter type for current user ratings (matches backend response)
export interface CurrentUserRating {
  _id?: string; // Convex document ID for compatibility
  id?: string;
  emoji: string;
  value: number;
  review: string;
  createdAt: string;
  updatedAt?: string;
  user?: User | null; // User who created the rating
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
  emojiRatings: Array<{
    emoji: string;
    averageValue: number;
    count: number;
    totalValue: number;
  }>;
  tags?: string[];
  viewCount?: number;
  visibility?: 'public' | 'deleted'; // From Convex schema
  shareCount?: number; // Number of times this vibe has been shared
  lastSharedAt?: number; // Timestamp of most recent share
  
  // Color gradient fields for custom vibe appearance
  gradientFrom?: string; // Starting color for gradient (hex or color name)
  gradientTo?: string; // Ending color for gradient (hex or color name)  
  gradientDirection?: string; // Gradient direction (e.g., 'to-br', 'to-r', 'to-b')
  
  // Text contrast mode for ensuring readability
  textContrastMode?: 'light' | 'dark' | 'auto'; // Text contrast mode based on background
  
  // Boost/dampen system fields
  boostScore?: number; // Current boost score (can be negative for dampens)
  totalBoosts?: number; // Total number of boosts received
  totalDampens?: number; // Total number of dampens received
  
  // Current authenticated user's ratings for this vibe (only populated when authenticated)
  currentUserRatings?: CurrentUserRating[];
  
  // Pre-computed rating data to avoid N+1 queries
  topEmojiRatings?: Array<{
    emoji: string;
    averageValue: number;
    count: number;
    tags: string[];
    category?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>;
  mostInteractedEmoji?: {
    emoji: string;
    value: number;
    count: number;
  };
  resolvedImageUrl?: string; // Pre-resolved image URL (from storage ID or legacy URL)
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
