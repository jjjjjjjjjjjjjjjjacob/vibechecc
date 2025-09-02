import type { Vibe, User, Rating } from '@vibechecc/types';

// Define Id type locally to avoid import issues
type Id<T extends string> = string & { __tableName: T };

// Admin-specific vibe type with additional metadata
export interface AdminVibe extends Omit<Vibe, '_id'> {
  _id?: Id<'vibes'>;
  creator?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  } | null;
  ratingsCount?: number;
  detailedRatings?: Array<{
    _id?: Id<'ratings'>;
    userId: string;
    vibeId: string;
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
    createdAt: string;
    user?: {
      username?: string;
      first_name?: string;
      last_name?: string;
    } | null;
  }>;
  starRatings?: number;
  visibility?: 'public' | 'deleted';
  moderationReason?: string;
  moderatedAt?: string;
}

// Stats types for admin dashboard
export interface VibeStats {
  totalVibes: number;
  publicVibes: number;
  deletedVibes: number;
  newVibesToday: number;
  newVibesThisWeek: number;
  newVibesThisMonth: number;
  imageAttachmentRate: number;
  tagUsageRate: number;
  averageRating?: number;
  totalViews?: number;
}

export interface ReviewStats {
  totalReviews: number;
  flaggedReviews?: number;
  approvedReviews?: number;
  newReviewsToday?: number;
  averageRating?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers?: number;
  newUsersToday?: number;
  adminUsers?: number;
}

export interface TagStats {
  totalTags: number;
  activelyUsedTags?: number;
  unusedTags?: number;
}

export interface EmojiStats {
  totalEmojis: number;
  popularEmojis?: number;
  customEmojis?: number;
  enabledEmojis?: number;
  disabledEmojis?: number;
}

// Admin review type
export interface AdminReview extends Omit<Rating, 'vibe'> {
  vibe?: {
    id: string;
    title: string;
    description: string;
  };
  flagged?: boolean;
  approved?: boolean;
}

// Admin user type
export interface AdminUser extends User {
  _id?: Id<'users'>;
  isAdmin?: boolean;
  vibesCount?: number;
  ratingsCount?: number;
  followersCount?: number;
  followingCount?: number;
  lastActiveAt?: string;
}

// Admin tag type
export interface AdminTag {
  _id?: Id<'tags'>;
  name: string;
  category?: string;
  count: number;
  createdAt: string;
  updatedAt?: string;
}

// Admin emoji type
export interface AdminEmoji {
  _id?: Id<'emojis'>;
  emoji: string;
  name: string;
  category: string;
  keywords?: string[];
  tags?: string[];
  enabled?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  popularity?: number;
  version?: number;
  source?: string;
  shortcodes?: string[];
}

// API response types
export interface AdminPaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageCount: number;
}

// Dashboard activity item
export interface DashboardActivityItem {
  id: string;
  type: 'vibe' | 'rating' | 'user' | 'follow';
  action: string;
  timestamp: string;
  user?: {
    username?: string;
    image_url?: string;
  };
  metadata?: Record<string, unknown>;
}
