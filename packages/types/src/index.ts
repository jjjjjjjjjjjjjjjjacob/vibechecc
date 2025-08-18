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

  // Share tracking fields
  shareCount?: number; // Total number of times this vibe has been shared
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

export interface SocialConnection {
  _id?: string; // Convex document ID for compatibility
  userId: string; // External ID of user who owns this connection
  platform: 'twitter' | 'instagram' | 'tiktok'; // Social platform type
  platformUserId: string; // User ID on the social platform
  platformUsername?: string; // Username on the social platform
  accessToken?: string; // OAuth access token (encrypted)
  refreshToken?: string; // OAuth refresh token (encrypted)
  tokenExpiresAt?: number; // When the access token expires
  connectionStatus: 'connected' | 'disconnected' | 'expired' | 'error'; // Status of the connection
  connectedAt: number; // When the connection was established
  lastSyncAt?: number; // Last time data was synced from platform
  metadata?: Record<string, unknown>; // Additional platform-specific data
  lastError?: string; // Last error message if connection failed
  errorCount?: number; // Number of consecutive errors
  _creationTime?: number; // Convex creation time for compatibility
}

export interface ShareEvent {
  _id?: string; // Convex document ID for compatibility
  contentType: 'vibe' | 'profile'; // Type of content shared
  contentId: string; // ID of the content (vibeId or userId)
  userId?: string; // External ID of user who shared (optional for anonymous)
  platform: 'twitter' | 'instagram' | 'tiktok' | 'clipboard' | 'native'; // Platform shared to
  shareType: 'story' | 'feed' | 'direct' | 'copy'; // Type of share action

  // Tracking metadata
  sessionId?: string; // Session identifier for tracking
  referrer?: string; // Referrer URL
  userAgent?: string; // User agent string
  ipAddress?: string; // IP address (if tracked)

  // UTM tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  // Event metadata
  success: boolean; // Whether the share was successful
  errorMessage?: string; // Error message if share failed
  metadata?: Record<string, unknown>; // Additional event-specific data

  createdAt: number; // Timestamp of the share event
  _creationTime?: number; // Convex creation time for compatibility
}
