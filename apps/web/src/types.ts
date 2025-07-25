// Re-export shared types from @vibechecc/types
export type { User, Vibe, Rating } from '@vibechecc/types';

// Local types
export interface EmojiReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface EmojiRating {
  emoji: string;
  value: number;
  count: number;
  tags?: string[];
}
