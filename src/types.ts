export interface RenderedItem {
  id: string;
  title: string;
  order: number;
  content?: string;
  columnId: string;
}

// VibeCheck types
export interface User {
  // Legacy fields (for backward compatibility)
  id?: string;
  name?: string;
  avatar?: string;
  joinDate?: string;
  
  // Clerk integration fields
  externalId?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  profile_image_url?: string;
  has_image?: boolean;
  primary_email_address_id?: string;
  last_sign_in_at?: number;
  last_active_at?: number;
  created_at?: number;
  updated_at?: number;
}

export interface Rating {
  user: User;
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
