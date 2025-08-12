/**
 * Common TypeScript types used across the web app.
 * Re-exporting shared types keeps imports concise for consumers.
 */
export type { User, Vibe, Rating } from '@viberatr/types'; // core domain models

// Local types
export interface EmojiReaction {
  emoji: string; // emoji character representing the reaction
  count: number; // number of times the reaction was used
  users: string[]; // list of user IDs who reacted
}

export interface EmojiRating {
  emoji: string; // emoji representing the rating
  value: number; // numeric value associated with the rating
  count: number; // how many users selected this rating
  tags?: string[]; // optional tags describing the rating
}
