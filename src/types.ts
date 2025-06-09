export interface RenderedItem {
  id: string;
  title: string;
  order: number;
  content?: string;
  columnId: string;
}

// VibeCheck types
export interface User {
  // Primary identifier (Clerk user ID stored as externalId in our DB)
  externalId: string;

  // Core user identity fields (synced with Clerk)
  username?: string;
  first_name?: string;
  last_name?: string;

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

export const CONTENT_TYPES = {
  card: 'application/app-card',
  column: 'application/app-column',
};

export const INTENTS = {
  updateColumnName: 'updateColumnName' as const,
  updateBoardName: 'updateBoardName' as const,
};

export const ItemMutationFields = {
  id: { type: String, name: 'id' },
  columnId: { type: String, name: 'columnId' },
  order: { type: Number, name: 'order' },
  title: { type: String, name: 'title' },
} as const;
