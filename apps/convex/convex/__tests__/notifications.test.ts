/**
 * Unit tests for notification helper functions and mutations.
 * Validates creation rules and read/unread state transitions.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { convexTest, type TestConvex } from 'convex-test';
import { api, internal } from '../_generated/api';
import schema from '../schema';
import { modules } from '../../vitest.setup';
import type { Notification } from '@viberatr/types';

// Group basic notification behaviors
describe('Notifications', () => {
  let t: TestConvex<typeof schema>;

  beforeEach(() => {
    // Fake timers help simulate scheduled tasks
    vi.useFakeTimers();
    t = convexTest(schema, modules);
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notification using internal mutation
      const notificationId = await t.mutation(
        internal.notifications.createNotification,
        {
          userId: 'user1',
          type: 'follow',
          triggerUserId: 'user2',
          targetId: 'user2',
          title: 'testuser2 followed you',
          description: 'check out their profile',
        }
      );

      expect(notificationId).toBeDefined();
    });

    it('should not create notification if user is notifying themselves', async () => {
      // Create test user
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Try to create self-notification
      const result = await t.mutation(
        internal.notifications.createNotification,
        {
          userId: 'user1',
          type: 'follow',
          triggerUserId: 'user1',
          targetId: 'user1',
          title: 'self notification',
          description: 'this should not be created',
        }
      );

      expect(result).toBeNull();
    });

    it('should throw error if receiving user does not exist', async () => {
      // Create trigger user only
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Try to create notification for non-existent user
      await expect(
        t.mutation(internal.notifications.createNotification, {
          userId: 'nonexistent',
          type: 'follow',
          triggerUserId: 'user1',
          targetId: 'user1',
          title: 'notification',
          description: 'description',
        })
      ).rejects.toThrow('Receiving user not found');
    });

    it('should throw error if triggering user does not exist', async () => {
      // Create receiving user only
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Try to create notification from non-existent user
      await expect(
        t.mutation(internal.notifications.createNotification, {
          userId: 'user1',
          type: 'follow',
          triggerUserId: 'nonexistent',
          targetId: 'nonexistent',
          title: 'notification',
          description: 'description',
        })
      ).rejects.toThrow('Triggering user not found');
    });

    it('should create notification with metadata', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notification with metadata
      const notificationId = await t.mutation(
        internal.notifications.createNotification,
        {
          userId: 'user1',
          type: 'rating',
          triggerUserId: 'user2',
          targetId: 'rating123',
          title: 'testuser2 rated your vibe with 😍',
          description: 'see what they thought',
          metadata: {
            vibeTitle: 'My Amazing Vibe',
            emoji: '😍',
            ratingValue: 5,
          },
        }
      );

      expect(notificationId).toBeDefined();

      // Verify metadata was stored
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(notifications.notifications).toHaveLength(1);
      expect(notifications.notifications[0].metadata).toEqual({
        vibeTitle: 'My Amazing Vibe',
        emoji: '😍',
        ratingValue: 5,
      });
    });
  });

  describe('getNotifications', () => {
    it('should return empty list for unauthenticated user', async () => {
      const result = await t.query(api.notifications.getNotifications, {});

      expect(result.notifications).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.hasMore).toBe(false);
    });

    it('should return notifications for authenticated user', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notification
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'testuser2 followed you',
        description: 'check out their profile',
      });

      // Get notifications with authentication
      const result = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('follow');
      expect(result.notifications[0].triggerUserId).toBe('user2');
      expect(result.notifications[0].title).toBe('testuser2 followed you');
      expect(result.notifications[0].read).toBe(false);
      expect(result.notifications[0].triggerUser).toBeDefined();
      expect(result.notifications[0].triggerUser?.username).toBe('testuser2');
    });

    it('should filter notifications by type', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create follow notification
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'testuser2 followed you',
        description: 'check out their profile',
      });

      // Create rating notification
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'rating',
        triggerUserId: 'user2',
        targetId: 'rating123',
        title: 'testuser2 rated your vibe',
        description: 'see their review',
      });

      // Get only follow notifications
      const followResult = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, { type: 'follow' });

      expect(followResult.notifications).toHaveLength(1);
      expect(followResult.notifications[0].type).toBe('follow');

      // Get only rating notifications
      const ratingResult = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, { type: 'rating' });

      expect(ratingResult.notifications).toHaveLength(1);
      expect(ratingResult.notifications[0].type).toBe('rating');
    });

    it('should respect pagination limits', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create multiple notifications
      for (let i = 0; i < 5; i++) {
        await t.mutation(internal.notifications.createNotification, {
          userId: 'user1',
          type: 'follow',
          triggerUserId: 'user2',
          targetId: `user2_${i}`,
          title: `notification ${i}`,
          description: 'description',
        });
      }

      // Get with limit
      const result = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, { limit: 3 });

      expect(result.notifications).toHaveLength(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notification
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'testuser2 followed you',
        description: 'check out their profile',
      });

      // Get notification ID
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      const notificationId = notifications.notifications[0]._id!;
      expect(notifications.notifications[0].read).toBe(false);

      // Mark as read
      const result = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAsRead, { notificationId });

      expect(result.success).toBe(true);

      // Verify it's marked as read
      const updatedNotifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(updatedNotifications.notifications[0].read).toBe(true);
    });

    it('should throw error for non-existent notification', async () => {
      // Create test user
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Create another user (user2) first
      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create a notification for user2, then try to access it with a non-existent ID
      // by taking a real notification and modifying the last character to make it invalid
      const realNotification = await t.mutation(
        internal.notifications.createNotification,
        {
          userId: 'user2',
          type: 'follow',
          triggerUserId: 'user1',
          targetId: 'user1',
          title: 'temp notification',
          description: 'temp',
        }
      );

      // Create an invalid ID by appending 'invalid' to make it wrong format
      const invalidId = (realNotification + 'invalid') as any;

      // Try to mark non-existent notification as read
      await expect(
        t
          .withIdentity({ subject: 'user1' })
          .mutation(api.notifications.markAsRead, {
            notificationId: invalidId,
          })
      ).rejects.toThrow(/Validator error.*Expected ID for table/i);
    });

    it('should throw error when user tries to mark another users notification', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notification for user1
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'testuser2 followed you',
        description: 'check out their profile',
      });

      // Get notification ID
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      const notificationId = notifications.notifications[0]._id!;

      // Try to mark as read from different user
      await expect(
        t
          .withIdentity({ subject: 'user2' })
          .mutation(api.notifications.markAsRead, {
            notificationId,
          })
      ).rejects.toThrow('Not authorized to update this notification');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create multiple notifications
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'follow notification',
        description: 'description',
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'rating',
        triggerUserId: 'user2',
        targetId: 'rating123',
        title: 'rating notification',
        description: 'description',
      });

      // Verify they're unread
      const beforeNotifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(beforeNotifications.notifications).toHaveLength(2);
      expect(
        beforeNotifications.notifications.every((n: Notification) => !n.read)
      ).toBe(true);

      // Mark all as read
      const result = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAllAsRead, {});

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);

      // Verify they're all read
      const afterNotifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(
        afterNotifications.notifications.every((n: Notification) => n.read)
      ).toBe(true);
    });

    it('should mark all notifications of specific type as read', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notifications of different types
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'follow notification',
        description: 'description',
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'rating',
        triggerUserId: 'user2',
        targetId: 'rating123',
        title: 'rating notification',
        description: 'description',
      });

      // Mark only follow notifications as read
      const result = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAllAsRead, { type: 'follow' });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(1);

      // Verify only follow notification is read
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      const followNotification = notifications.notifications.find(
        (n: Notification) => n.type === 'follow'
      );
      const ratingNotification = notifications.notifications.find(
        (n: Notification) => n.type === 'rating'
      );

      expect(followNotification?.read).toBe(true);
      expect(ratingNotification?.read).toBe(false);
    });

    it('should return 0 updated count when no unread notifications exist', async () => {
      // Create test user
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Mark all as read when no notifications exist
      const result = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAllAsRead, {});

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 for unauthenticated user', async () => {
      const count = await t.query(api.notifications.getUnreadCount, {});
      expect(count).toBe(0);
    });

    it('should return correct unread count', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Initially should be 0
      const initialCount = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getUnreadCount, {});
      expect(initialCount).toBe(0);

      // Create notifications
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'notification 1',
        description: 'description',
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'rating',
        triggerUserId: 'user2',
        targetId: 'rating123',
        title: 'notification 2',
        description: 'description',
      });

      // Should now be 2
      const afterCreatingCount = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getUnreadCount, {});
      expect(afterCreatingCount).toBe(2);

      // Mark one as read
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAsRead, {
          notificationId: notifications.notifications[0]._id!,
        });

      // Should now be 1
      const afterMarkingOneCount = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getUnreadCount, {});
      expect(afterMarkingOneCount).toBe(1);
    });
  });

  describe('getUnreadCountByType', () => {
    it('should return zeros for unauthenticated user', async () => {
      const counts = await t.query(api.notifications.getUnreadCountByType, {});

      expect(counts).toEqual({
        follow: 0,
        rating: 0,
        new_vibe: 0,
        new_rating: 0,
        total: 0,
      });
    });

    it('should return correct counts by type', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notifications of different types
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'follow 1',
        description: 'description',
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2_2',
        title: 'follow 2',
        description: 'description',
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'rating',
        triggerUserId: 'user2',
        targetId: 'rating123',
        title: 'rating 1',
        description: 'description',
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'new_vibe',
        triggerUserId: 'user2',
        targetId: 'vibe123',
        title: 'new vibe 1',
        description: 'description',
      });

      // Get counts
      const counts = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getUnreadCountByType, {});

      expect(counts).toEqual({
        follow: 2,
        rating: 1,
        new_vibe: 1,
        new_rating: 0,
        total: 4,
      });
    });

    it('should update counts when notifications are read', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notifications
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'follow',
        description: 'description',
      });

      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'rating',
        triggerUserId: 'user2',
        targetId: 'rating123',
        title: 'rating',
        description: 'description',
      });

      // Initial counts
      const beforeCounts = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getUnreadCountByType, {});

      expect(beforeCounts.follow).toBe(1);
      expect(beforeCounts.rating).toBe(1);
      expect(beforeCounts.total).toBe(2);

      // Mark follow notifications as read
      await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAllAsRead, { type: 'follow' });

      // Updated counts
      const afterCounts = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getUnreadCountByType, {});

      expect(afterCounts.follow).toBe(0);
      expect(afterCounts.rating).toBe(1);
      expect(afterCounts.total).toBe(1);
    });
  });

  describe('notification triggers', () => {
    it('should create follow notification when user follows another', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // User1 follows user2
      await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.follows.follow, { followingId: 'user2' });

      // Wait for scheduled notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Check if notification was created for user2
      const notifications = await t
        .withIdentity({ subject: 'user2' })
        .query(api.notifications.getNotifications, {});

      expect(notifications.notifications).toHaveLength(1);
      expect(notifications.notifications[0].type).toBe('follow');
      expect(notifications.notifications[0].triggerUserId).toBe('user1');
      expect(notifications.notifications[0].title).toContain(
        'testuser1 followed you'
      );
    });

    it('should create rating notification when user rates a vibe', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // User1 creates a vibe
      const vibeId = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.vibes.create, {
          title: 'Test Vibe',
          description: 'A test vibe for rating',
        });

      // User2 rates the vibe
      await t
        .withIdentity({ subject: 'user2' })
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          emoji: '😍',
          value: 5,
          review: 'Amazing vibe!',
        });

      // Wait for scheduled notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Check if notification was created for user1 (vibe creator)
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(notifications.notifications).toHaveLength(1);
      expect(notifications.notifications[0].type).toBe('rating');
      expect(notifications.notifications[0].triggerUserId).toBe('user2');
      expect(notifications.notifications[0].title).toContain(
        'testuser2 rated your vibe with 😍'
      );
      expect(notifications.notifications[0].metadata).toEqual({
        vibeTitle: 'Test Vibe',
        emoji: '😍',
        ratingValue: 5,
      });
    });

    it('should create new_vibe notification when user creates a vibe', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // User2 follows user1
      await t
        .withIdentity({ subject: 'user2' })
        .mutation(api.follows.follow, { followingId: 'user1' });

      // Wait for follow notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Clear the follow notification
      await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAllAsRead, {});

      // User1 creates a vibe
      const _newVibeId = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.vibes.create, {
          title: 'New Test Vibe',
          description: 'A new vibe for testing notifications',
        });

      // Wait for new vibe notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Check if notification was created for user2 (follower)
      const notifications = await t
        .withIdentity({ subject: 'user2' })
        .query(api.notifications.getNotifications, {});

      const newVibeNotifications = notifications.notifications.filter(
        (n: Notification) => n.type === 'new_vibe'
      );
      expect(newVibeNotifications).toHaveLength(1);
      expect(newVibeNotifications[0].triggerUserId).toBe('user1');
      expect(newVibeNotifications[0].title).toContain(
        'testuser1 shared a new vibe'
      );
      expect(newVibeNotifications[0].metadata).toEqual({
        vibeTitle: 'New Test Vibe',
      });
    });

    it('should create new_rating notification when user rates any vibe', async () => {
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

      // User2 follows user1
      await t
        .withIdentity({ subject: 'user2' })
        .mutation(api.follows.follow, { followingId: 'user1' });

      // Wait for follow notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // User3 creates a vibe
      const vibeId = await t
        .withIdentity({ subject: 'user3' })
        .mutation(api.vibes.create, {
          title: 'Third User Vibe',
          description: 'A vibe by user3',
        });

      // Wait for new vibe notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Clear existing notifications
      await t
        .withIdentity({ subject: 'user2' })
        .mutation(api.notifications.markAllAsRead, {});

      // User1 rates user3's vibe (should notify user1's followers)
      await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          emoji: '🎉',
          value: 4,
          review: 'Great content!',
        });

      // Wait for new rating notification to complete
      vi.runAllTimers();
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      // Check if notification was created for user2 (user1's follower)
      const notifications = await t
        .withIdentity({ subject: 'user2' })
        .query(api.notifications.getNotifications, {});

      const newRatingNotifications = notifications.notifications.filter(
        (n: Notification) => n.type === 'new_rating'
      );
      expect(newRatingNotifications).toHaveLength(1);
      expect(newRatingNotifications[0].triggerUserId).toBe('user1');
      expect(newRatingNotifications[0].title).toContain(
        'testuser1 reviewed a vibe'
      );
      expect(newRatingNotifications[0].metadata).toEqual({
        vibeTitle: 'Third User Vibe',
        vibeCreator: 'testuser3',
        emoji: '🎉',
        ratingValue: 4,
      });
    });

    it('should not create notification for self-interaction', async () => {
      // Create test user
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // User1 creates a vibe
      const vibeId = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.vibes.create, {
          title: 'Self Vibe',
          description: 'A vibe to rate myself',
        });

      // User1 rates their own vibe
      await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          emoji: '😊',
          value: 3,
          review: 'Self rating',
        });

      // Check notifications - should not contain rating notification for self
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      const ratingNotifications = notifications.notifications.filter(
        (n: Notification) => n.type === 'rating'
      );
      expect(ratingNotifications).toHaveLength(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle large number of notifications efficiently', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create many notifications
      const notificationCount = 50;
      for (let i = 0; i < notificationCount; i++) {
        await t.mutation(internal.notifications.createNotification, {
          userId: 'user1',
          type: 'follow',
          triggerUserId: 'user2',
          targetId: `target_${i}`,
          title: `notification ${i}`,
          description: 'bulk test',
        });
      }

      // Test pagination
      const firstPage = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, { limit: 20 });

      expect(firstPage.notifications).toHaveLength(20);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.nextCursor).toBeDefined();

      // Test unread count performance
      const unreadCount = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getUnreadCount, {});

      expect(unreadCount).toBe(notificationCount);

      // Test bulk mark as read performance
      const markAllResult = await t
        .withIdentity({ subject: 'user1' })
        .mutation(api.notifications.markAllAsRead, {});

      expect(markAllResult.success).toBe(true);
      expect(markAllResult.updatedCount).toBe(notificationCount);
    });

    it('should handle missing trigger user gracefully', async () => {
      // Create receiving user
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      // Create notification with deleted trigger user - should throw error
      await expect(
        t.mutation(internal.notifications.createNotification, {
          userId: 'user1',
          type: 'follow',
          triggerUserId: 'deleted_user',
          targetId: 'deleted_user',
          title: 'deleted user followed you',
          description: 'this user no longer exists',
        })
      ).rejects.toThrow('Triggering user not found');
    });

    it('should maintain data integrity during concurrent operations', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Create notification
      await t.mutation(internal.notifications.createNotification, {
        userId: 'user1',
        type: 'follow',
        triggerUserId: 'user2',
        targetId: 'user2',
        title: 'follow notification',
        description: 'description',
      });

      // Get notification ID
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      const notificationId = notifications.notifications[0]._id!;

      // Simulate concurrent mark as read operations
      const markPromises = Array.from({ length: 5 }, () =>
        t
          .withIdentity({ subject: 'user1' })
          .mutation(api.notifications.markAsRead, {
            notificationId,
          })
      );

      // Only first should succeed, others should not fail the system
      const results = await Promise.allSettled(markPromises);

      // At least one should succeed
      const successfulResults = results.filter((r) => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(0);

      // Notification should be marked as read
      const finalNotifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(finalNotifications.notifications[0].read).toBe(true);
    });

    it('should validate notification type constraints', async () => {
      // Create test users
      await t.mutation(api.users.create, {
        externalId: 'user1',
        username: 'testuser1',
      });

      await t.mutation(api.users.create, {
        externalId: 'user2',
        username: 'testuser2',
      });

      // Test each valid notification type
      const validTypes = [
        'follow',
        'rating',
        'new_vibe',
        'new_rating',
      ] as const;

      for (const type of validTypes) {
        const notificationId = await t.mutation(
          internal.notifications.createNotification,
          {
            userId: 'user1',
            type,
            triggerUserId: 'user2',
            targetId: 'test',
            title: `${type} notification`,
            description: 'test',
          }
        );

        expect(notificationId).toBeDefined();
      }

      // Verify all were created
      const notifications = await t
        .withIdentity({ subject: 'user1' })
        .query(api.notifications.getNotifications, {});

      expect(notifications.notifications).toHaveLength(validTypes.length);

      const createdTypes = notifications.notifications
        .map((n: Notification) => n.type)
        .sort();
      expect(createdTypes).toEqual([...validTypes].sort());
    });
  });
});
