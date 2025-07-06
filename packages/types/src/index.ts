// Core vibechecc types that can be shared across applications

export interface User {
  // Primary identifier (Clerk user ID stored as externalId in our DB)
  externalId: string;

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

export interface Rating {
  user: User | null;
  rating: number;
  review?: string;
  date: string;
}

export interface EmojiReaction {
  emoji: string;
  count: number;
  users: string[]; // Array of user IDs who reacted with this emoji
}

export interface Vibe {
  id: string;
  title: string;
  description: string;
  image?: string;
  createdBy: User | null;
  createdAt: string;
  ratings: Rating[];
  tags?: string[];
  reactions?: EmojiReaction[]; // New field for emoji reactions
}
