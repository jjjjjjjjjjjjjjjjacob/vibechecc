// Core viberater types that can be shared across applications

// Re-export search types
export * from './search';

export interface User {
  // Primary identifier (Clerk user ID stored as externalId in our DB)
  externalId: string;
  id?: string; // Alias for compatibility

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

  // Onboarding fields
  onboardingCompleted?: boolean;
  interests?: string[];
}

export interface EmojiRating {
  emoji: string;
  value: number; // 1-5
  tags?: string[];
  count?: number; // For display purposes
}

export interface Rating {
  user: User | null;
  value: number;
  emoji: string;
  review: string;
  createdAt: string;
  tags?: string[];
  vibeId?: string;
  userId?: string;
}

export interface EmojiRatingMetadata {
  emoji: string;
  tags?: string[];
  category: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface Vibe {
  id: string;
  title: string;
  description: string;
  image?: string;
  createdBy: User | null;
  createdById?: string;
  createdAt: string;
  ratings: Rating[];
  tags?: string[];
  viewCount?: number;
}
