import type { User, Vibe, Rating } from '@vibechecc/types';

/**
 * Mock data generators for testing components and hooks
 */

// Mock users
export const mockUsers = {
  alice: {
    _id: 'user_alice' as const,
    externalId: 'user_123456',
    username: 'alice_wonderland',
    first_name: 'Alice',
    last_name: 'Wonderland',
    full_name: 'Alice Wonderland',
    bio: 'Curious explorer of wonderlands',
    image_url: 'https://example.com/avatars/alice.jpg',
    profile_image_url: 'https://example.com/avatars/alice.jpg',
    has_image: true,
    created_at: Date.now() - 86400000 * 30, // 30 days ago
    updated_at: Date.now() - 86400000 * 30,
    onboardingCompleted: true,
    interests: ['adventure', 'tea', 'reading'],
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    socials: {
      website: 'https://alice.wonderland',
    },
  } satisfies User,

  bob: {
    _id: 'user_bob' as const,
    externalId: 'user_789012',
    username: 'bob_builder',
    first_name: 'Bob',
    last_name: 'Builder',
    full_name: 'Bob Builder',
    bio: 'Can we fix it? Yes we can!',
    image_url: 'https://example.com/avatars/bob.jpg',
    profile_image_url: 'https://example.com/avatars/bob.jpg',
    has_image: true,
    created_at: Date.now() - 86400000 * 60, // 60 days ago
    updated_at: Date.now() - 86400000 * 60,
    onboardingCompleted: true,
    interests: ['construction', 'building', 'tools'],
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    socials: {
      website: 'https://bobbuilder.com',
    },
  } satisfies User,

  charlie: {
    _id: 'user_charlie' as const,
    externalId: 'user_345678',
    username: 'charlie_chocolate',
    first_name: 'Charlie',
    last_name: 'Bucket',
    full_name: 'Charlie Bucket',
    bio: 'Owner of the chocolate factory',
    image_url: 'https://example.com/avatars/charlie.jpg',
    profile_image_url: 'https://example.com/avatars/charlie.jpg',
    has_image: true,
    created_at: Date.now() - 86400000 * 90, // 90 days ago
    updated_at: Date.now() - 86400000 * 90,
    onboardingCompleted: true,
    interests: ['chocolate', 'candy', 'sweets'],
    primaryColor: '#8b4513',
    secondaryColor: '#daa520',
    socials: {},
  } satisfies User,
};

// Mock vibes
export const mockVibes = {
  wonderlandAdventure: {
    _id: 'vibe_wonderland' as const,
    id: 'vibe_wonderland',
    title: 'Wonderland Adventure',
    description:
      'Just fell down a rabbit hole and discovered the most amazing tea party! 🐰☕️',
    image: 'https://example.com/vibes/wonderland.jpg',
    tags: ['adventure', 'fantasy', 'tea', 'whimsical'],
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: mockUsers.alice,
    createdById: mockUsers.alice.externalId,
    ratings: [],
  } satisfies Vibe,

  buildingSomething: {
    _id: 'vibe_building' as const,
    id: 'vibe_building',
    title: 'Building Something',
    description:
      'Building a new playground for the kids in our neighborhood! 🏗️👶',
    image: 'https://example.com/vibes/playground.jpg',
    tags: ['construction', 'community', 'kids', 'building'],
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    createdBy: mockUsers.bob,
    createdById: mockUsers.bob.externalId,
    ratings: [],
  } satisfies Vibe,

  chocolateFactory: {
    _id: 'vibe_chocolate' as const,
    id: 'vibe_chocolate',
    title: 'Chocolate Factory',
    description:
      'New chocolate recipe is perfected! The golden ticket winners will love this 🍫✨',
    image: 'https://example.com/vibes/chocolate.jpg',
    tags: ['chocolate', 'sweet', 'factory', 'golden-ticket'],
    createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
    createdBy: mockUsers.charlie,
    createdById: mockUsers.charlie.externalId,
    ratings: [],
  } satisfies Vibe,
};

// Mock ratings
export const mockRatings = {
  aliceRatesWonderland: {
    _id: 'rating_alice_wonderland' as const,
    vibeId: mockVibes.wonderlandAdventure._id,
    userId: mockUsers.alice.externalId,
    user: mockUsers.alice,
    value: 5,
    review: 'This was an absolutely magical experience!',
    emoji: '🌟',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
  } satisfies Rating,

  bobRatesBuilding: {
    _id: 'rating_bob_building' as const,
    vibeId: mockVibes.buildingSomething._id,
    userId: mockUsers.bob.externalId,
    user: mockUsers.bob,
    value: 5,
    review: 'So proud of this community project!',
    emoji: '🏗️',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  } satisfies Rating,

  charlieRatesChocolate: {
    _id: 'rating_charlie_chocolate' as const,
    vibeId: mockVibes.chocolateFactory._id,
    userId: mockUsers.charlie.externalId,
    user: mockUsers.charlie,
    value: 5,
    review: 'Pure imagination made real!',
    emoji: '🍫',
    createdAt: new Date(Date.now() - 5400000).toISOString(), // 90 minutes ago
  } satisfies Rating,
};

// Utility functions for generating mock data
export function createMockUser(overrides: Partial<User> = {}): User {
  const baseUser: User = {
    _id: `user_${Math.random().toString(36).substr(2, 9)}` as const,
    externalId: `user_${Math.random().toString(36).substr(2, 9)}`,
    username: `user_${Math.random().toString(36).substr(2, 6)}`,
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    bio: 'A test user for testing purposes',
    image_url: undefined,
    profile_image_url: undefined,
    has_image: false,
    created_at: Date.now() - Math.random() * 86400000 * 30,
    updated_at: Date.now() - Math.random() * 86400000 * 30,
    onboardingCompleted: true,
    interests: ['testing'],
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    socials: {},
  };

  return { ...baseUser, ...overrides };
}

export function createMockVibe(overrides: Partial<Vibe> = {}): Vibe {
  const baseVibe: Vibe = {
    _id: `vibe_${Math.random().toString(36).substr(2, 9)}` as const,
    id: `vibe_${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Vibe',
    description: 'This is a test vibe for testing purposes',
    image: undefined,
    tags: ['test', 'mock'],
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    createdBy: createMockUser(),
    createdById: 'user_test',
    ratings: [],
  };

  return { ...baseVibe, ...overrides };
}

export function createMockRating(overrides: Partial<Rating> = {}): Rating {
  const baseRating: Rating = {
    _id: `rating_${Math.random().toString(36).substr(2, 9)}` as const,
    vibeId: `vibe_${Math.random().toString(36).substr(2, 9)}`,
    userId: 'user_test',
    user: createMockUser(),
    value: Math.floor(Math.random() * 5) + 1,
    review: 'This is a test review',
    emoji: '⭐',
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  };

  return { ...baseRating, ...overrides };
}

// Arrays of mock data for easy iteration in tests
export const mockUserList = Object.values(mockUsers);
export const mockVibeList = Object.values(mockVibes);
export const mockRatingList = Object.values(mockRatings);
