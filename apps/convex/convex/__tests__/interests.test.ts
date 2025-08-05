/// <reference lib="dom" />
import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../_generated/api';
import schema from '../schema';
import { modules } from '../../vitest.setup';

describe('User Interests from Ratings', () => {
  let t: any;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  describe('addRating', () => {
    it('should add vibe tags to user interests when rating a vibe', async () => {
      // Create test user
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Create test vibe with tags
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe with tags',
        tags: ['music', 'art', 'creativity'],
        createdById: 'user1',
      });

      // Create another user to rate the vibe
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Mock authentication for user2
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Get user2's initial interests (should be empty)
      const userBefore = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userBefore?.interests || []).toHaveLength(0);

      // Rate the vibe
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '😍',
        value: 5,
        review: 'Love this vibe!',
      });

      // Check that user's interests now include the vibe tags
      const userAfter = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfter?.interests).toEqual(
        expect.arrayContaining(['music', 'art', 'creativity'])
      );
      expect(userAfter?.interests).toHaveLength(3);
    });

    it('should not add duplicate tags to user interests', async () => {
      // Create test user with existing interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
        interests: ['music', 'technology'],
      });

      // Create test vibe with overlapping tags
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe with some overlapping tags',
        tags: ['music', 'art', 'technology'],
        createdById: 'user1',
      });

      // Create another user to rate the vibe
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
        interests: ['music', 'sports'],
      });

      // Mock authentication for user2
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Rate the vibe
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '👍',
        value: 4,
        review: 'Great content!',
      });

      // Check that user's interests include new tags but no duplicates
      const userAfter = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      const interests = userAfter?.interests || [];

      // Should contain all unique tags
      expect(interests).toEqual(
        expect.arrayContaining(['music', 'sports', 'art', 'technology'])
      );
      expect(interests).toHaveLength(4);

      // Check no duplicates
      const uniqueInterests = [...new Set(interests)];
      expect(interests).toHaveLength(uniqueInterests.length);
    });

    it('should preserve existing interests when adding new ones', async () => {
      // Create test user with existing interests (vibe creator)
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
        interests: ['cooking', 'travel'],
      });

      // Create rating user with existing interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
        interests: ['cooking', 'travel'],
      });

      // Create test vibe with different tags (created by user1)
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe with new tags',
        tags: ['music', 'fitness'],
        createdById: 'user1',
      });

      // Mock authentication for user2 (different from creator)
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Rate the vibe with user2
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '🔥',
        value: 5,
        review: 'Amazing!',
      });

      // Check that user2's interests include both old and new tags
      const userAfter = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfter?.interests).toEqual(
        expect.arrayContaining(['cooking', 'travel', 'music', 'fitness'])
      );
      expect(userAfter?.interests).toHaveLength(4);
    });

    it('should handle vibes with no tags gracefully', async () => {
      // Create vibe creator
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
        interests: ['existing'],
      });

      // Create rater with existing interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
        interests: ['existing'],
      });

      // Create test vibe without tags (created by user1)
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe without tags',
        createdById: 'user1',
      });

      // Mock authentication for user2 (different from creator)
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Rate the vibe with user2
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '😊',
        value: 3,
        review: 'Nice vibe',
      });

      // Check that user2's interests remain unchanged (no tags to add)
      const userAfter = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfter?.interests).toEqual(['existing']);
      expect(userAfter?.interests).toHaveLength(1);
    });

    it('should handle users with no existing interests', async () => {
      // Create vibe creator without interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Create rater without interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create test vibe with tags (created by user1)
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe with tags',
        tags: ['photography', 'nature'],
        createdById: 'user1',
      });

      // Mock authentication for user2 (different from creator)
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Rate the vibe with user2
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '📸',
        value: 4,
        review: 'Beautiful shots!',
      });

      // Check that user2's interests are now set
      const userAfter = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfter?.interests).toEqual(
        expect.arrayContaining(['photography', 'nature'])
      );
      expect(userAfter?.interests).toHaveLength(2);
    });
  });

  describe('quickReact', () => {
    it('should add vibe tags to user interests when quick reacting', async () => {
      // Create test user
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Create test vibe with tags
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe for quick reaction',
        tags: ['gaming', 'entertainment'],
        createdById: 'user1',
      });

      // Create another user to react to the vibe
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Mock authentication for user2
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Quick react to the vibe
      await tWithAuthUser2.mutation(api.vibes.quickReact, {
        vibeId,
        emoji: '🎮',
      });

      // Check that user's interests now include the vibe tags
      const userAfter = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfter?.interests).toEqual(
        expect.arrayContaining(['gaming', 'entertainment'])
      );
      expect(userAfter?.interests).toHaveLength(2);
    });

    it('should not duplicate existing interests when quick reacting', async () => {
      // Create test user with existing interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
        interests: ['gaming'],
      });

      // Create test vibe with overlapping tags
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe with overlapping tags',
        tags: ['gaming', 'competition'],
        createdById: 'user1',
      });

      // Mock authentication for user1
      const tWithAuthUser1 = t.withIdentity({ subject: 'user1' });

      // Quick react to the vibe
      await tWithAuthUser1.mutation(api.vibes.quickReact, {
        vibeId,
        emoji: '🏆',
      });

      // Check that user's interests include both old and new, no duplicates
      const userAfter = await tWithAuthUser1.query(api.users.getById, {
        id: 'user1',
      });
      expect(userAfter?.interests).toEqual(
        expect.arrayContaining(['gaming', 'competition'])
      );
      expect(userAfter?.interests).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid vibe ID gracefully', async () => {
      // Create test user
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
        interests: ['existing'],
      });

      // Mock authentication for user1
      const tWithAuthUser1 = t.withIdentity({ subject: 'user1' });

      // Try to rate non-existent vibe - should throw error
      await expect(
        tWithAuthUser1.mutation(api.vibes.addRating, {
          vibeId: 'nonexistent',
          emoji: '😕',
          value: 1,
          review: 'This should fail',
        })
      ).rejects.toThrow('Vibe not found');

      // Check that user's interests remain unchanged (rating failed)
      const userAfter = await tWithAuthUser1.query(api.users.getById, {
        id: 'user1',
      });
      expect(userAfter?.interests).toEqual(['existing']);
    });

    it('should handle rating updates (existing ratings)', async () => {
      // Create vibe creator
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
        interests: ['initial'],
      });

      // Create rater with initial interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
        interests: ['initial'],
      });

      // Create test vibe with tags (created by user1)
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe for rating updates',
        tags: ['first-tag'],
        createdById: 'user1',
      });

      // Mock authentication for user2 (different from creator)
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Rate the vibe first time
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '😊',
        value: 3,
        review: 'First rating',
      });

      // Check interests after first rating
      const userAfterFirst = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfterFirst?.interests).toEqual(
        expect.arrayContaining(['initial', 'first-tag'])
      );

      // Update the same rating
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '😍',
        value: 5,
        review: 'Updated rating',
      });

      // Check interests after update (should not duplicate)
      const userAfterUpdate = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfterUpdate?.interests).toEqual(
        expect.arrayContaining(['initial', 'first-tag'])
      );
      expect(userAfterUpdate?.interests).toHaveLength(2);
    });

    it('should handle empty tags array', async () => {
      // Create vibe creator
      await t.mutation(api.users.createForSeed, {
        externalId: 'user1',
        username: 'testuser1',
        interests: ['existing'],
      });

      // Create rater with existing interests
      await t.mutation(api.users.createForSeed, {
        externalId: 'user2',
        username: 'testuser2',
        interests: ['existing'],
      });

      // Create test vibe with empty tags array (created by user1)
      const vibeId = await t.mutation(api.vibes.createForSeed, {
        title: 'Test Vibe',
        description: 'A test vibe with empty tags',
        tags: [],
        createdById: 'user1',
      });

      // Mock authentication for user2 (different from creator)
      const tWithAuthUser2 = t.withIdentity({ subject: 'user2' });

      // Rate the vibe with user2
      await tWithAuthUser2.mutation(api.vibes.addRating, {
        vibeId,
        emoji: '👍',
        value: 4,
        review: 'Good vibe',
      });

      // Check that user2's interests remain unchanged
      const userAfter = await tWithAuthUser2.query(api.users.getById, {
        id: 'user2',
      });
      expect(userAfter?.interests).toEqual(['existing']);
      expect(userAfter?.interests).toHaveLength(1);
    });
  });
});
