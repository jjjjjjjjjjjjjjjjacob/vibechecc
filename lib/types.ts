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
  createdBy: User
  createdAt: string
  ratings: Rating[]
  tags?: string[]
  reactions?: EmojiReaction[] // New field for emoji reactions
}
