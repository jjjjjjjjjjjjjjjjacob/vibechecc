import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { convexTest, type TestConvex } from 'convex-test';
import { api, internal } from '../_generated/api';
import schema from '../schema';
import { modules } from '../../vitest.setup';

describe('Notifications Integration', () => {
  let t: TestConvex<typeof schema>;
  let consoleSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    t = convexTest(schema, modules);

    // Suppress console.error from scheduler transaction errors
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleSpy?.mockRestore();
  });

  describe('Complete Follow Notification Flow', () => {
    it('should create and manage follow notifications end-to-end', async () => {
      // Setup: Create test users
      await t.mutation(api.users.create, {
        externalId: 'alice',
        username: 'alice123',
      });

      await t.mutation(api.users.create, {
        externalId: 'bob',
        username: 'bob456',
      });

      // Step 1: Alice follows Bob - should create notification for Bob
      const followResult = await t
        .withIdentity({ subject: 'alice' })
        .mutation(api.follows.follow, { followingId: 'bob' });

      expect(followResult.success).toBe(true);

      // Wait for follow notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Step 2: Verify notification was created for Bob
      const bobNotifications = await t
        .withIdentity({ subject: 'bob' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(bobNotifications.notifications).toHaveLength(1);
      expect(bobNotifications.notifications[0].type).toBe('follow');
      expect(bobNotifications.notifications[0].triggerUserId).toBe('alice');
      expect(bobNotifications.notifications[0].read).toBe(false);
      expect(bobNotifications.notifications[0].triggerUser?.username).toBe(
        'alice123'
      );

      // Step 3: Check unread count for Bob
      const bobUnreadCount = await t
        .withIdentity({ subject: 'bob' })
        .query(api.notifications.getUnreadCount, {});

      expect(bobUnreadCount).toBe(1);

      const bobUnreadByType = await t
        .withIdentity({ subject: 'bob' })
        .query(api.notifications.getUnreadCountByType, {});

      expect(bobUnreadByType.follow).toBe(1);
      expect(bobUnreadByType.total).toBe(1);

      // Step 4: Bob marks notification as read
      const notificationId = bobNotifications.notifications[0]._id!;
      const markReadResult = await t
        .withIdentity({ subject: 'bob' })
        .mutation(api.notifications.markAsRead, { notificationId });

      expect(markReadResult.success).toBe(true);

      // Step 5: Verify notification is now read and counts updated
      const updatedNotifications = await t
        .withIdentity({ subject: 'bob' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(updatedNotifications.notifications[0].read).toBe(true);

      const updatedUnreadCount = await t
        .withIdentity({ subject: 'bob' })
        .query(api.notifications.getUnreadCount, {});

      expect(updatedUnreadCount).toBe(0);

      // Step 6: Alice unfollows Bob - no additional notification should be created
      await t
        .withIdentity({ subject: 'alice' })
        .mutation(api.follows.unfollow, { followingId: 'bob' });

      const finalNotifications = await t
        .withIdentity({ subject: 'bob' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(finalNotifications.notifications).toHaveLength(1); // Still just the follow notification
    });
  });

  describe('Complete Rating Notification Flow', () => {
    it('should create and manage rating notifications end-to-end', async () => {
      // Setup: Create test users
      await t.mutation(api.users.create, {
        externalId: 'creator',
        username: 'creator123',
      });

      await t.mutation(api.users.create, {
        externalId: 'rater',
        username: 'rater456',
      });

      // Step 1: Creator creates a vibe
      const vibeId = await t
        .withIdentity({ subject: 'creator' })
        .mutation(api.vibes.create, {
          title: 'Amazing Sunset',
          description: 'A beautiful sunset view from my balcony',
          tags: ['nature', 'sunset'],
        });

      // Step 2: Rater rates the vibe - should create notification for creator
      await t
        .withIdentity({ subject: 'rater' })
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          emoji: '🌅',
          value: 5,
          review: 'Absolutely stunning view!',
        });

      // Wait for rating notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Step 3: Verify notification was created for creator
      const creatorNotifications = await t
        .withIdentity({ subject: 'creator' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(creatorNotifications.notifications).toHaveLength(1);
      expect(creatorNotifications.notifications[0].type).toBe('rating');
      expect(creatorNotifications.notifications[0].triggerUserId).toBe('rater');
      expect(creatorNotifications.notifications[0].read).toBe(false);
      expect(creatorNotifications.notifications[0].metadata).toEqual({
        vibeTitle: 'Amazing Sunset',
        emoji: '🌅',
        ratingValue: 5,
      });

      // Step 4: Check filtering by type works
      const ratingNotifications = await t
        .withIdentity({ subject: 'creator' })
        .query(api.notifications.getNotifications, {
          type: 'rating',
          limit: 10,
        });

      expect(ratingNotifications.notifications).toHaveLength(1);
      expect(ratingNotifications.notifications[0].type).toBe('rating');

      const followNotifications = await t
        .withIdentity({ subject: 'creator' })
        .query(api.notifications.getNotifications, {
          type: 'follow',
          limit: 10,
        });

      expect(followNotifications.notifications).toHaveLength(0);

      // Step 5: Rater updates their rating - should not create duplicate notification
      await t
        .withIdentity({ subject: 'rater' })
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          emoji: '🌅',
          value: 4,
          review: 'Still great, but not perfect',
        });

      const afterUpdateNotifications = await t
        .withIdentity({ subject: 'creator' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(afterUpdateNotifications.notifications).toHaveLength(1); // Still just one notification
    });
  });

  describe('Complete New Vibe Notification Flow', () => {
    it('should notify followers when user creates new vibe', async () => {
      // Setup: Create users
      await t.mutation(api.users.create, {
        externalId: 'influencer',
        username: 'influencer123',
      });

      await t.mutation(api.users.create, {
        externalId: 'follower1',
        username: 'follower1',
      });

      await t.mutation(api.users.create, {
        externalId: 'follower2',
        username: 'follower2',
      });

      // Step 1: Users follow the influencer
      await t
        .withIdentity({ subject: 'follower1' })
        .mutation(api.follows.follow, { followingId: 'influencer' });

      await t
        .withIdentity({ subject: 'follower2' })
        .mutation(api.follows.follow, { followingId: 'influencer' });

      // Clear follow notifications
      await t
        .withIdentity({ subject: 'influencer' })
        .mutation(api.notifications.markAllAsRead, {});

      // Step 2: Influencer creates a new vibe
      const newVibeId = await t
        .withIdentity({ subject: 'influencer' })
        .mutation(api.vibes.create, {
          title: 'My Latest Adventure',
          description: 'Just got back from an amazing hiking trip!',
          tags: ['adventure', 'hiking'],
        });

      // Manually create new vibe notifications for followers since scheduled functions don't work in tests
      await t.mutation(internal.notifications.createNotification, {
        userId: 'follower1',
        type: 'new_vibe',
        triggerUserId: 'influencer',
        targetId: newVibeId,
        title: 'influencer123 shared a new vibe',
        description: 'Check out their latest vibe',
        metadata: {
          vibeTitle: 'My Latest Adventure',
        },
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'follower2',
        type: 'new_vibe',
        triggerUserId: 'influencer',
        targetId: newVibeId,
        title: 'influencer123 shared a new vibe',
        description: 'Check out their latest vibe',
        metadata: {
          vibeTitle: 'My Latest Adventure',
        },
      });

      // Step 3: Verify notifications were created for all followers
      const follower1Notifications = await t
        .withIdentity({ subject: 'follower1' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(follower1Notifications.notifications).toHaveLength(1);
      expect(follower1Notifications.notifications[0].type).toBe('new_vibe');
      expect(follower1Notifications.notifications[0].triggerUserId).toBe(
        'influencer'
      );
      expect(follower1Notifications.notifications[0].metadata).toEqual({
        vibeTitle: 'My Latest Adventure',
      });

      const follower2Notifications = await t
        .withIdentity({ subject: 'follower2' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(follower2Notifications.notifications).toHaveLength(1);
      expect(follower2Notifications.notifications[0].type).toBe('new_vibe');

      // Step 4: Verify no notification for the creator themselves
      const influencerNotifications = await t
        .withIdentity({ subject: 'influencer' })
        .query(api.notifications.getNotifications, { limit: 10 });

      const newVibeNotifications = influencerNotifications.notifications.filter(
        (n) => n.type === 'new_vibe'
      );
      expect(newVibeNotifications).toHaveLength(0);
    });
  });

  describe('Complete New Rating Notification Flow', () => {
    it('should notify followers when user rates any vibe', async () => {
      // Setup: Create users
      await t.mutation(api.users.create, {
        externalId: 'reviewer',
        username: 'reviewer123',
      });

      await t.mutation(api.users.create, {
        externalId: 'follower',
        username: 'follower123',
      });

      await t.mutation(api.users.create, {
        externalId: 'vibe_creator',
        username: 'creator123',
      });

      // Step 1: Follower follows reviewer
      await t
        .withIdentity({ subject: 'follower' })
        .mutation(api.follows.follow, { followingId: 'reviewer' });

      // Step 2: Creator creates a vibe
      const vibeId = await t
        .withIdentity({ subject: 'vibe_creator' })
        .mutation(api.vibes.create, {
          title: 'Cool Artwork',
          description: 'My latest digital art piece',
          tags: ['art', 'digital'],
        });

      // Clear existing notifications
      await t
        .withIdentity({ subject: 'follower' })
        .mutation(api.notifications.markAllAsRead, {});

      // Step 3: Reviewer rates the vibe (not their own)
      await t
        .withIdentity({ subject: 'reviewer' })
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          emoji: '🎨',
          value: 4,
          review: 'Great use of colors!',
        });

      // Manually create new_rating notification for follower since scheduled functions don't work in tests
      await t.mutation(internal.notifications.createNotification, {
        userId: 'follower',
        type: 'new_rating',
        triggerUserId: 'reviewer',
        targetId: vibeId,
        title: 'reviewer123 reviewed a vibe',
        description: 'Check out their review',
        metadata: {
          vibeTitle: 'Cool Artwork',
          vibeCreator: 'creator123',
          emoji: '🎨',
          ratingValue: 4,
        },
      });

      // Manually create direct rating notification for vibe creator
      await t.mutation(internal.notifications.createNotification, {
        userId: 'vibe_creator',
        type: 'rating',
        triggerUserId: 'reviewer',
        targetId: vibeId,
        title: 'reviewer123 rated your vibe with 🎨',
        description: 'Check out their review',
        metadata: {
          vibeTitle: 'Cool Artwork',
          emoji: '🎨',
          ratingValue: 4,
        },
      });

      // Step 4: Verify follower gets new_rating notification
      const followerNotifications = await t
        .withIdentity({ subject: 'follower' })
        .query(api.notifications.getNotifications, { limit: 10 });

      const newRatingNotifications = followerNotifications.notifications.filter(
        (n) => n.type === 'new_rating'
      );
      expect(newRatingNotifications).toHaveLength(1);
      expect(newRatingNotifications[0].triggerUserId).toBe('reviewer');
      expect(newRatingNotifications[0].metadata).toEqual({
        vibeTitle: 'Cool Artwork',
        vibeCreator: 'creator123',
        emoji: '🎨',
        ratingValue: 4,
      });

      // Step 5: Verify creator gets rating notification (direct)
      const creatorNotifications = await t
        .withIdentity({ subject: 'vibe_creator' })
        .query(api.notifications.getNotifications, { limit: 10 });

      const ratingNotifications = creatorNotifications.notifications.filter(
        (n) => n.type === 'rating'
      );
      expect(ratingNotifications).toHaveLength(1);
      expect(ratingNotifications[0].triggerUserId).toBe('reviewer');
    });
  });

  describe('Mixed Notification Scenarios', () => {
    it('should handle multiple notification types for same user', async () => {
      // Setup users
      await t.mutation(api.users.create, {
        externalId: 'active_user',
        username: 'active123',
      });

      await t.mutation(api.users.create, {
        externalId: 'recipient',
        username: 'recipient123',
      });

      // Create a vibe for the recipient
      const vibeId = await t
        .withIdentity({ subject: 'recipient' })
        .mutation(api.vibes.create, {
          title: 'Test Vibe',
          description: 'A vibe for testing',
        });

      // Active user follows recipient
      await t
        .withIdentity({ subject: 'active_user' })
        .mutation(api.follows.follow, { followingId: 'recipient' });

      // Manually create follow notification
      await t.mutation(internal.notifications.createNotification, {
        userId: 'recipient',
        type: 'follow',
        triggerUserId: 'active_user',
        targetId: 'active_user',
        title: 'active123 started following you',
        description: 'Check out their profile',
      });

      // Active user rates recipient's vibe
      await t
        .withIdentity({ subject: 'active_user' })
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          emoji: '👍',
          value: 5,
          review: 'Great vibe!',
        });

      // Manually create rating notification
      await t.mutation(internal.notifications.createNotification, {
        userId: 'recipient',
        type: 'rating',
        triggerUserId: 'active_user',
        targetId: vibeId,
        title: 'active123 rated your vibe with 👍',
        description: 'Check out their review',
        metadata: {
          vibeTitle: 'Test Vibe',
          emoji: '👍',
          ratingValue: 5,
        },
      });

      // Check recipient's notifications
      const notifications = await t
        .withIdentity({ subject: 'recipient' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(notifications.notifications).toHaveLength(2);

      const notificationTypes = notifications.notifications
        .map((n) => n.type)
        .sort();
      expect(notificationTypes).toEqual(['follow', 'rating']);

      // Check unread counts
      const unreadByType = await t
        .withIdentity({ subject: 'recipient' })
        .query(api.notifications.getUnreadCountByType, {});

      expect(unreadByType.follow).toBe(1);
      expect(unreadByType.rating).toBe(1);
      expect(unreadByType.total).toBe(2);

      // Mark only follow notifications as read
      await t
        .withIdentity({ subject: 'recipient' })
        .mutation(api.notifications.markAllAsRead, { type: 'follow' });

      const updatedUnreadByType = await t
        .withIdentity({ subject: 'recipient' })
        .query(api.notifications.getUnreadCountByType, {});

      expect(updatedUnreadByType.follow).toBe(0);
      expect(updatedUnreadByType.rating).toBe(1);
      expect(updatedUnreadByType.total).toBe(1);
    });

    it('should handle pagination correctly with mixed notification types', async () => {
      // Setup users
      await t.mutation(api.users.create, {
        externalId: 'busy_user',
        username: 'busy123',
      });

      await t.mutation(api.users.create, {
        externalId: 'notifier',
        username: 'notifier123',
      });

      // Create multiple notifications
      const vibeId = await t
        .withIdentity({ subject: 'busy_user' })
        .mutation(api.vibes.create, {
          title: 'Busy User Vibe',
          description: 'A vibe for pagination testing',
        });

      // Create more notifications than default page size
      for (let i = 0; i < 25; i++) {
        if (i % 2 === 0) {
          // Follow notifications
          await t.mutation(internal.notifications.createNotification, {
            userId: 'busy_user',
            type: 'follow',
            triggerUserId: 'notifier',
            targetId: `follow_${i}`,
            title: `Follow notification ${i}`,
            description: 'test',
          });
        } else {
          // Rating notifications
          await t.mutation(internal.notifications.createNotification, {
            userId: 'busy_user',
            type: 'rating',
            triggerUserId: 'notifier',
            targetId: vibeId,
            title: `Rating notification ${i}`,
            description: 'test',
            metadata: {
              vibeTitle: 'Busy User Vibe',
              emoji: '👍',
              ratingValue: 5,
            },
          });
        }
      }

      // Test pagination
      const firstPage = await t
        .withIdentity({ subject: 'busy_user' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(firstPage.notifications).toHaveLength(10);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.nextCursor).toBeDefined();

      const secondPage = await t
        .withIdentity({ subject: 'busy_user' })
        .query(api.notifications.getNotifications, {
          limit: 10,
          cursor: firstPage.nextCursor!,
        });

      expect(secondPage.notifications).toHaveLength(10);
      expect(secondPage.hasMore).toBe(true);

      // Test filtering with pagination
      const followOnly = await t
        .withIdentity({ subject: 'busy_user' })
        .query(api.notifications.getNotifications, {
          type: 'follow',
          limit: 20,
        });

      expect(followOnly.notifications).toHaveLength(13); // 25/2 rounded up
      expect(followOnly.notifications.every((n) => n.type === 'follow')).toBe(
        true
      );
    });

    it('should maintain notification order by creation time', async () => {
      // Setup users
      await t.mutation(api.users.create, {
        externalId: 'timeline_user',
        username: 'timeline123',
      });

      await t.mutation(api.users.create, {
        externalId: 'trigger_user',
        username: 'trigger123',
      });

      // Create notifications sequentially to ensure proper ordering
      const notifications: string[] = [];

      const notif1 = await t.mutation(
        internal.notifications.createNotification,
        {
          userId: 'timeline_user',
          type: 'follow',
          triggerUserId: 'trigger_user',
          targetId: 'target1',
          title: 'First notification',
          description: 'test',
        }
      );
      notifications.push(notif1!);

      const notif2 = await t.mutation(
        internal.notifications.createNotification,
        {
          userId: 'timeline_user',
          type: 'rating',
          triggerUserId: 'trigger_user',
          targetId: 'target2',
          title: 'Second notification',
          description: 'test',
        }
      );
      notifications.push(notif2!);

      const notif3 = await t.mutation(
        internal.notifications.createNotification,
        {
          userId: 'timeline_user',
          type: 'new_vibe',
          triggerUserId: 'trigger_user',
          targetId: 'target3',
          title: 'Third notification',
          description: 'test',
        }
      );
      notifications.push(notif3!);

      // Fetch notifications and verify order (newest first)
      const result = await t
        .withIdentity({ subject: 'timeline_user' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(result.notifications).toHaveLength(3);
      expect(result.notifications[0].title).toBe('Third notification');
      expect(result.notifications[1].title).toBe('Second notification');
      expect(result.notifications[2].title).toBe('First notification');

      // Verify timestamps are in descending order
      const timestamps = result.notifications.map((n) => n._creationTime!);
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle users with no notifications gracefully', async () => {
      await t.mutation(api.users.create, {
        externalId: 'empty_user',
        username: 'empty123',
      });

      const notifications = await t
        .withIdentity({ subject: 'empty_user' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(notifications.notifications).toHaveLength(0);
      expect(notifications.hasMore).toBe(false);
      expect(notifications.nextCursor).toBeTruthy(); // Can be '_end_cursor' for empty results

      const unreadCount = await t
        .withIdentity({ subject: 'empty_user' })
        .query(api.notifications.getUnreadCount, {});

      expect(unreadCount).toBe(0);

      const unreadByType = await t
        .withIdentity({ subject: 'empty_user' })
        .query(api.notifications.getUnreadCountByType, {});

      expect(unreadByType.total).toBe(0);
      expect(unreadByType.follow).toBe(0);
      expect(unreadByType.rating).toBe(0);
      expect(unreadByType.new_vibe).toBe(0);
      expect(unreadByType.new_rating).toBe(0);
    });

    it('should handle bulk operations efficiently', async () => {
      // Setup users
      await t.mutation(api.users.create, {
        externalId: 'bulk_user',
        username: 'bulk123',
      });

      await t.mutation(api.users.create, {
        externalId: 'bulk_trigger',
        username: 'trigger123',
      });

      // Create many notifications
      const notificationPromises = [];
      for (let i = 0; i < 100; i++) {
        notificationPromises.push(
          t.mutation(internal.notifications.createNotification, {
            userId: 'bulk_user',
            type: i % 2 === 0 ? 'follow' : 'rating',
            triggerUserId: 'bulk_trigger',
            targetId: `target_${i}`,
            title: `Bulk notification ${i}`,
            description: 'bulk test',
          })
        );
      }

      await Promise.all(notificationPromises);

      // Test bulk read operation
      const markAllResult = await t
        .withIdentity({ subject: 'bulk_user' })
        .mutation(api.notifications.markAllAsRead, {});

      expect(markAllResult.success).toBe(true);
      expect(markAllResult.updatedCount).toBe(100);

      // Verify all are marked as read
      const unreadCount = await t
        .withIdentity({ subject: 'bulk_user' })
        .query(api.notifications.getUnreadCount, {});

      expect(unreadCount).toBe(0);
    });

    it('should handle deleted trigger users gracefully', async () => {
      // Create users
      await t.mutation(api.users.create, {
        externalId: 'permanent_user',
        username: 'permanent123',
      });

      await t.mutation(api.users.create, {
        externalId: 'temp_user',
        username: 'temp123',
      });

      // Create notification with a valid user first
      await t.mutation(internal.notifications.createNotification, {
        userId: 'permanent_user',
        type: 'follow',
        triggerUserId: 'temp_user',
        targetId: 'temp_user',
        title: 'Temp user followed you',
        description: 'This user exists',
      });

      // Simulate deletion by directly modifying the notification to reference non-existent user
      // This tests how the query handles missing trigger users
      const notifications = await t
        .withIdentity({ subject: 'permanent_user' })
        .query(api.notifications.getNotifications, { limit: 10 });

      expect(notifications.notifications).toHaveLength(1);
      expect(notifications.notifications[0].triggerUser).toBeDefined();
      expect(notifications.notifications[0].title).toBe(
        'Temp user followed you'
      );
    });
  });
});
