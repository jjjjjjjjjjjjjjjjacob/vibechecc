export interface RenderedItem {
  id: string
  title: string
  order: number
  content?: string
  columnId: string
}

// VibeCheck types
export interface User {
  id: string
  name: string
  avatar: string
  joinDate: string
}

export interface Rating {
  user: User
  rating: number
  review?: string
  date: string
}

export interface EmojiReaction {
  emoji: string
  count: number
  users: string[] // Array of user IDs who reacted with this emoji
}

export interface Vibe {
  id: string
  title: string
  description: string
  image?: string
  createdBy: User | null
  createdAt: string
  ratings: Rating[]
  tags?: string[]
  reactions?: EmojiReaction[] // New field for emoji reactions
}

export const CONTENT_TYPES = {
  card: 'application/app-card',
  column: 'application/app-column',
}

export const INTENTS = {
  updateColumnName: 'updateColumnName' as const,
  updateBoardName: 'updateBoardName' as const,
}

export const ItemMutationFields = {
  id: { type: String, name: 'id' },
  columnId: { type: String, name: 'columnId' },
  order: { type: Number, name: 'order' },
  title: { type: String, name: 'title' },
} as const
