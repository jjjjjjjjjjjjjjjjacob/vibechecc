/// <reference lib="dom" />
/**
 * Helper factories and datasets for generating consistent mock objects in tests.
 */

// Type definitions for mock data
type MockId<T extends string> = `${T}_${string}`;

type UserId = MockId<'user'>;
type VibeId = MockId<'vibe'>;
type EmojiRatingId = MockId<'emoji_rating'>;
type StarRatingId = MockId<'star_rating'>;
type TagId = MockId<'tag'>;

// User mock data
export const createMockUser = (overrides = {}) => ({
  _id: 'user_123' as UserId,
  userId: 'user_clrk_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  profileImageUrl: 'https://example.com/avatar.jpg',
  primaryColor: 'purple',
  secondaryColor: 'blue',
  themeColor: 'purple',
  bio: 'Test user bio',
  _creationTime: Date.now(),
  ...overrides,
});

// Vibe mock data
export const createMockVibe = (overrides = {}) => ({
  _id: 'vibe_123' as VibeId,
  title: 'Amazing Test Vibe',
  description:
    'This is a comprehensive test vibe with rich content and multiple features to demonstrate the platform capabilities.',
  content:
    'This is the detailed content of the test vibe. It includes multiple paragraphs and rich text formatting.',
  userId: 'user_123' as UserId,
  userName: 'Test User',
  userEmail: 'test@example.com',
  userProfileImageUrl: 'https://example.com/avatar.jpg',
  tags: ['test', 'example', 'demo'],
  category: 'lifestyle',
  isPublic: true,
  location: 'San Francisco, CA',
  mood: 'excited',
  visibility: 'public' as const,
  _creationTime: Date.now() - 3600000, // 1 hour ago

  // Rating data
  starRating: 4.5,
  totalRatings: 15,
  averageEmojiRating: 4.2,
  totalEmojiRatings: 8,

  // Engagement metrics
  viewCount: 234,
  shareCount: 12,
  bookmarkCount: 8,

  ...overrides,
});

// Emoji rating mock data
export const createMockEmojiRating = (overrides = {}) => ({
  _id: 'emoji_rating_123' as EmojiRatingId,
  vibeId: 'vibe_123' as VibeId,
  userId: 'user_123' as UserId,
  userName: 'Test User',
  userEmail: 'test@example.com',
  userProfileImageUrl: 'https://example.com/avatar.jpg',
  emoji: '🔥',
  rating: 5,
  reviewText: 'This vibe is absolutely fire! Love the energy and creativity.',
  isPublic: true,
  _creationTime: Date.now() - 1800000, // 30 minutes ago
  ...overrides,
});

// Star rating mock data
export const createMockStarRating = (overrides = {}) => ({
  _id: 'star_rating_123' as StarRatingId,
  vibeId: 'vibe_123' as VibeId,
  userId: 'user_123' as UserId,
  userName: 'Test User',
  userEmail: 'test@example.com',
  rating: 4,
  reviewText: 'Great vibe overall, really enjoyed the content and style.',
  isPublic: true,
  _creationTime: Date.now() - 7200000, // 2 hours ago
  ...overrides,
});

// Tag mock data
export const createMockTag = (overrides = {}) => ({
  _id: 'tag_123' as TagId,
  name: 'lifestyle',
  description: 'Vibes related to lifestyle and daily experiences',
  color: '#FF6B6B',
  usageCount: 156,
  isSystem: false,
  _creationTime: Date.now() - 86400000, // 1 day ago
  ...overrides,
});

// Emoji metadata
export const createMockEmoji = (overrides = {}) => ({
  emoji: '🔥',
  name: 'fire',
  color: '#FF6B6B',
  keywords: ['hot', 'flame', 'lit', 'awesome'],
  category: 'activity',
  ...overrides,
});

// Collections of mock data
export const mockUsers = [
  createMockUser(),
  createMockUser({
    _id: 'user_456' as UserId,
    userId: 'user_clrk_456',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'janedoe',
    primaryColor: 'blue',
    secondaryColor: 'green',
  }),
  createMockUser({
    _id: 'user_789' as UserId,
    userId: 'user_clrk_789',
    email: 'bob@example.com',
    firstName: 'Bob',
    lastName: 'Smith',
    username: 'bobsmith',
    primaryColor: 'green',
    secondaryColor: 'orange',
  }),
];

export const mockVibes = [
  createMockVibe(),
  createMockVibe({
    _id: 'vibe_456' as VibeId,
    title: 'Chill Sunday Vibes',
    description: 'Relaxing day at home with good music and coffee',
    userId: 'user_456' as UserId,
    userName: 'Jane Doe',
    userEmail: 'jane@example.com',
    tags: ['chill', 'sunday', 'relaxation'],
    category: 'lifestyle',
    mood: 'relaxed',
    starRating: 4.8,
  }),
  createMockVibe({
    _id: 'vibe_789' as VibeId,
    title: 'Adventure Time!',
    description: 'Epic hiking trip in the mountains',
    userId: 'user_789' as UserId,
    userName: 'Bob Smith',
    userEmail: 'bob@example.com',
    tags: ['adventure', 'hiking', 'nature'],
    category: 'outdoor',
    mood: 'adventurous',
    starRating: 4.2,
  }),
];

export const mockEmojiRatings = [
  createMockEmojiRating(),
  createMockEmojiRating({
    _id: 'emoji_rating_456' as EmojiRatingId,
    vibeId: 'vibe_456' as VibeId,
    userId: 'user_456' as UserId,
    emoji: '😍',
    rating: 5,
    reviewText: 'Love this peaceful energy!',
  }),
  createMockEmojiRating({
    _id: 'emoji_rating_789' as EmojiRatingId,
    vibeId: 'vibe_789' as VibeId,
    userId: 'user_789' as UserId,
    emoji: '🏔️',
    rating: 4,
    reviewText: 'Beautiful mountain views!',
  }),
];

export const mockEmojis = [
  createMockEmoji(),
  createMockEmoji({
    emoji: '😍',
    name: 'heart eyes',
    color: '#FF6B9D',
    keywords: ['love', 'crush', 'amazing', 'wonderful'],
    category: 'people',
  }),
  createMockEmoji({
    emoji: '💯',
    name: '100',
    color: '#4ECDC4',
    keywords: ['perfect', 'score', 'excellent', 'top'],
    category: 'symbols',
  }),
  createMockEmoji({
    emoji: '🏔️',
    name: 'mountain',
    color: '#8B9DC3',
    keywords: ['nature', 'peak', 'hiking', 'adventure'],
    category: 'nature',
  }),
  createMockEmoji({
    emoji: '☕',
    name: 'coffee',
    color: '#8B4513',
    keywords: ['drink', 'caffeine', 'morning', 'energy'],
    category: 'food',
  }),
];

// Search result mock data
export const createMockSearchResults = (overrides = {}) => ({
  vibes: mockVibes.slice(0, 2),
  users: mockUsers.slice(0, 2),
  tags: ['lifestyle', 'adventure', 'chill'],
  actions: ['create vibe', 'search users', 'explore tags'],
  reviews: mockEmojiRatings.slice(0, 2),
  totalCount: 8,
  hasMore: false,
  page: 0,
  continueCursor: null,
  ...overrides,
});

// API response mock helpers
export const createSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
  error: null,
});

export const createErrorResponse = (
  message: string,
  code = 'UNKNOWN_ERROR'
) => ({
  success: false,
  data: null,
  error: {
    message,
    code,
  },
});

// Pagination mock helpers
export const createPaginatedResponse = <T>(
  items: T[],
  page = 0,
  pageSize = 10,
  hasMore = false
) => ({
  items: items.slice(page * pageSize, (page + 1) * pageSize),
  page,
  pageSize,
  totalCount: items.length,
  hasMore,
  continueCursor: hasMore ? `cursor_${page + 1}` : null,
});

// Time-based mock helpers
export const timeStamps = {
  now: Date.now(),
  oneHourAgo: Date.now() - 3600000,
  oneDayAgo: Date.now() - 86400000,
  oneWeekAgo: Date.now() - 604800000,
  oneMonthAgo: Date.now() - 2592000000,
};

// Factory functions for creating multiple items
export const createMockUserList = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockUser({
      _id: `user_${i}` as UserId,
      userId: `user_clrk_${i}`,
      email: `user${i}@example.com`,
      firstName: `User${i}`,
      lastName: 'Test',
      username: `user${i}`,
    })
  );

export const createMockVibeList = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockVibe({
      _id: `vibe_${i}` as VibeId,
      title: `Test Vibe ${i}`,
      description: `This is test vibe number ${i}`,
      userId: `user_${i % 3}` as UserId,
      userName: `User${i % 3}`,
      userEmail: `user${i % 3}@example.com`,
      tags: [`tag${i}`, `category${i % 5}`],
      _creationTime: Date.now() - i * 3600000, // Spread over hours
    })
  );

export const createMockEmojiRatingList = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockEmojiRating({
      _id: `emoji_rating_${i}` as EmojiRatingId,
      vibeId: `vibe_${i % 10}` as VibeId,
      userId: `user_${i % 5}` as UserId,
      emoji: mockEmojis[i % mockEmojis.length].emoji,
      rating: (i % 5) + 1,
      reviewText: `Test review ${i}`,
    })
  );
