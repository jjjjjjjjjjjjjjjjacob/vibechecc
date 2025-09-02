import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { convexTest, type TestConvex } from 'convex-test';
import { api } from '../_generated/api';
import schema from '../schema';
import { modules } from '../../vitest.setup';

describe('Follows', () => {
  let t: TestConvex<typeof schema>;
  let consoleSpy: any;

  beforeEach(() => {
    t = convexTest(schema, modules);

    // Suppress console.error from scheduler failures in tests
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy?.mockRestore();
  });

  describe('follow', () => {
    it('should allow a user to follow another user', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Mock authentication for user1
      const tWithAuth = t.withIdentity({ subject: 'user1' });

      // User1 follows user2
      const result = await tWithAuth.mutation(api.follows.follow, {
        followingId: 'user2',
      });

      expect(result.success).toBe(true);
      expect(result.followId).toBeDefined();
    });

    it('should prevent self-follows', async () => {
      // Create test user
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Mock authentication
      const tWithAuth = t.withIdentity({ subject: 'user1' });

      // Try to follow self
      await expect(
        tWithAuth.mutation(api.follows.follow, {
          followingId: 'user1',
        })
      ).rejects.toThrow('You cannot follow yourself');
    });

    it('should prevent duplicate follows', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Mock authentication
      const tWithAuth = t.withIdentity({ subject: 'user1' });

      // First follow should succeed
      await tWithAuth.mutation(api.follows.follow, {
        followingId: 'user2',
      });

      // Second follow should fail
      await expect(
        tWithAuth.mutation(api.follows.follow, {
          followingId: 'user2',
        })
      ).rejects.toThrow('You are already following this user');
    });
  });

  describe('unfollow', () => {
    it('should allow a user to unfollow another user', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Mock authentication
      const tWithAuth = t.withIdentity({ subject: 'user1' });

      // First follow
      await tWithAuth.mutation(api.follows.follow, {
        followingId: 'user2',
      });

      // Then unfollow
      const result = await tWithAuth.mutation(api.follows.unfollow, {
        followingId: 'user2',
      });

      expect(result.success).toBe(true);
    });

    it('should handle unfollowing a user not being followed', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Mock authentication
      const tWithAuth = t.withIdentity({ subject: 'user1' });

      // Try to unfollow without following first
      await expect(
        tWithAuth.mutation(api.follows.unfollow, {
          followingId: 'user2',
        })
      ).rejects.toThrow('You are not following this user');
    });
  });

  describe('isFollowing', () => {
    it('should return true when user is following another', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Mock authentication
      const tWithAuth = t.withIdentity({ subject: 'user1' });

      // Follow user2
      await tWithAuth.mutation(api.follows.follow, {
        followingId: 'user2',
      });

      // Check if following
      const isFollowing = await t.query(api.follows.isFollowing, {
        followerId: 'user1',
        followingId: 'user2',
      });

      expect(isFollowing).toBe(true);
    });

    it('should return false when user is not following another', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Check if following (should be false)
      const isFollowing = await t.query(api.follows.isFollowing, {
        followerId: 'user1',
        followingId: 'user2',
      });

      expect(isFollowing).toBe(false);
    });
  });

  describe('getFollowStats', () => {
    it('should return correct follower and following counts', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      await t.mutation(api.users.create, {
        externalId: 'user3',
        username: 'testuser3',
      });

      // User1 follows user2
      await t.withIdentity({ subject: 'user1' }).mutation(api.follows.follow, {
        followingId: 'user2',
      });

      // User3 follows user2
      await t.withIdentity({ subject: 'user3' }).mutation(api.follows.follow, {
        followingId: 'user2',
      });

      // User2 follows user1
      await t.withIdentity({ subject: 'user2' }).mutation(api.follows.follow, {
        followingId: 'user1',
      });

      // Get stats for user2 (should have 2 followers, 1 following)
      const stats = await t.query(api.follows.getFollowStats, {
        userId: 'user2',
      });

      expect(stats.followers).toBe(2);
      expect(stats.following).toBe(1);
    });
  });

  describe('getUserFollowers', () => {
    it('should return list of followers with pagination', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      await t.mutation(api.users.create, {
        externalId: 'user3',
        username: 'testuser3',
      });

      // User1 and user3 follow user2
      await t.withIdentity({ subject: 'user1' }).mutation(api.follows.follow, {
        followingId: 'user2',
      });

      await t.withIdentity({ subject: 'user3' }).mutation(api.follows.follow, {
        followingId: 'user2',
      });

      // Get followers of user2
      const result = await t.query(api.follows.getUserFollowers, {
        userId: 'user2',
        limit: 10,
      });

      expect(result.followers).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(
        result.followers.some((f: any) => f.user?.externalId === 'user1')
      ).toBe(true);
      expect(
        result.followers.some((f: any) => f.user?.externalId === 'user3')
      ).toBe(true);
    });
  });

  describe('getUserFollowing', () => {
    it('should return list of users being followed with pagination', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      await t.mutation(api.users.create, {
        externalId: 'user3',
        username: 'testuser3',
      });

      // User1 follows user2 and user3
      const tWithAuth = t.withIdentity({ subject: 'user1' });
      await tWithAuth.mutation(api.follows.follow, {
        followingId: 'user2',
      });

      await tWithAuth.mutation(api.follows.follow, {
        followingId: 'user3',
      });

      // Get users that user1 follows
      const result = await t.query(api.follows.getUserFollowing, {
        userId: 'user1',
        limit: 10,
      });

      expect(result.following).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(
        result.following.some((f: any) => f.user?.externalId === 'user2')
      ).toBe(true);
      expect(
        result.following.some((f: any) => f.user?.externalId === 'user3')
      ).toBe(true);
    });
  });
});
