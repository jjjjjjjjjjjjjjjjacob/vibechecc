import { convexTest } from 'convex-test';
import { expect, test, describe } from 'vitest';
import schema from './schema';
import { api } from './_generated/api';
import { modules } from '../vitest.setup';

describe('emoji ratings', () => {
  describe('createOrUpdateEmojiRating', () => {
    test('should create a new rating with emoji', async () => {
      const t = convexTest(schema, modules);

      // Create vibe creator
      const creatorId = 'vibe-creator-123';
      const creatorIdentity = {
        subject: creatorId,
        tokenIdentifier: `test|${creatorId}`,
        issuer: 'test',
      };

      await t.mutation(api.users.create, {
        externalId: creatorId,
        username: 'vibecreator',
      });

      // Create vibe
      const vibeId = await t
        .withIdentity(creatorIdentity)
        .mutation(api.vibes.create, {
          title: 'Test Vibe',
          description: 'Test vibe content',
          tags: ['test'],
        });

      // Create rater (different user)
      const raterId = 'rater-456';
      const raterIdentity = {
        subject: raterId,
        tokenIdentifier: `test|${raterId}`,
        issuer: 'test',
      };

      await t.mutation(api.users.create, {
        externalId: raterId,
        username: 'rater',
      });

      const result = await t
        .withIdentity(raterIdentity)
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          value: 4,
          review: 'This vibe is mind-blowing!',
          emoji: '🤯',
        });

      expect(result).toBeDefined();
    });

    test('should validate rating values', async () => {
      const t = convexTest(schema, modules);

      const userId = 'test-user-123';
      const mockIdentity = {
        subject: userId,
        tokenIdentifier: `test|${userId}`,
        issuer: 'test',
      };

      // Test invalid numeric rating
      await expect(
        t
          .withIdentity(mockIdentity)
          .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
            vibeId: 'test-vibe-123',
            value: 6, // Invalid
            review: 'Invalid rating',
            emoji: '🤯',
          })
      ).rejects.toThrow('Rating value must be between 1 and 5');

      // Test invalid emoji rating value
      await expect(
        t
          .withIdentity(mockIdentity)
          .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
            vibeId: 'test-vibe-123',
            value: 0, // Invalid
            review: 'Invalid value',
            emoji: '🤯',
          })
      ).rejects.toThrow('Rating value must be between 1 and 5');
    });

    test('should update existing rating', async () => {
      const t = convexTest(schema, modules);

      // Create vibe creator
      const creatorId = 'vibe-creator-update-123';
      const creatorIdentity = {
        subject: creatorId,
        tokenIdentifier: `test|${creatorId}`,
        issuer: 'test',
      };

      await t.mutation(api.users.create, {
        externalId: creatorId,
        username: 'vibecreatorupdate',
      });

      // Create vibe
      const vibeId = await t
        .withIdentity(creatorIdentity)
        .mutation(api.vibes.create, {
          title: 'Test Update Vibe',
          description: 'Test vibe content for update',
          tags: ['test'],
        });

      // Create rater (different user)
      const raterId = 'rater-update-456';
      const raterIdentity = {
        subject: raterId,
        tokenIdentifier: `test|${raterId}`,
        issuer: 'test',
      };

      await t.mutation(api.users.create, {
        externalId: raterId,
        username: 'raterupdate',
      });

      // Create initial rating
      await t
        .withIdentity(raterIdentity)
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          value: 3,
          review: 'Initial review',
          emoji: '😊',
        });

      // Update with same emoji rating
      await t
        .withIdentity(raterIdentity)
        .mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId,
          value: 5,
          review: 'Updated review - amazing!',
          emoji: '😊',
        });

      // Check that only one rating exists
      await t.run(async (ctx) => {
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibeAndUser', (q) =>
            q.eq('vibeId', vibeId).eq('userId', raterId)
          )
          .collect();

        expect(ratings).toHaveLength(1);
        expect(ratings[0].value).toBe(5);
        expect(ratings[0].review).toBe('Updated review - amazing!');
        expect(ratings[0].emoji).toBe('😊');
      });
    });

    test('should require authentication', async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.emojiRatings.createOrUpdateEmojiRating, {
          vibeId: 'test-vibe-123',
          value: 4,
          review: 'Test review',
          emoji: '😊',
        })
      ).rejects.toThrow('You must be logged in to rate a vibe');
    });
  });

  describe('getTopEmojiRatings', () => {
    test('should return top emoji ratings sorted by count', async () => {
      const t = convexTest(schema, modules);

      const vibeId = 'test-vibe-123';

      // Insert test ratings
      await t.run(async (ctx) => {
        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user1',
          emoji: '😍',
          value: 5,
          review: 'Love it!',
          createdAt: new Date().toISOString(),
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user2',
          emoji: '😍',
          value: 4,
          review: 'Really love it!',
          createdAt: new Date().toISOString(),
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user3',
          emoji: '🤯',
          value: 4,
          review: 'Mind blown!',
          createdAt: new Date().toISOString(),
        });
      });

      const topEmojis = await t.query(api.emojiRatings.getTopEmojiRatings, {
        vibeId,
        limit: 2,
      });

      expect(topEmojis).toHaveLength(2);
      expect(topEmojis[0].emoji).toBe('😍');
      expect(topEmojis[0].count).toBe(2);
      expect(topEmojis[0].averageValue).toBe(4.5);
      expect(topEmojis[1].emoji).toBe('🤯');
      expect(topEmojis[1].count).toBe(1);
    });
  });

  describe('getMostInteractedEmoji', () => {
    test('should return emoji ratings with highest count', async () => {
      const t = convexTest(schema, modules);

      const vibeId = 'test-vibe-123';

      // Add emoji ratings
      await t.run(async (ctx) => {
        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user1',
          emoji: '😍',
          value: 5,
          review: 'Love it!',
          createdAt: new Date().toISOString(),
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user2',
          emoji: '😍',
          value: 4,
          review: 'Really love it!',
          createdAt: new Date().toISOString(),
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user3',
          emoji: '🤯',
          value: 4,
          review: 'Mind blown!',
          createdAt: new Date().toISOString(),
        });
      });

      const mostInteracted = await t.query(
        api.emojiRatings.getMostInteractedEmoji,
        { vibeId }
      );

      expect(mostInteracted?.emoji).toBe('😍');
      expect(mostInteracted?.averageValue).toBe(4.5);
      expect(mostInteracted?.count).toBe(2);
    });

    test('should return null when no emoji ratings exist', async () => {
      const t = convexTest(schema, modules);

      const vibeId = 'test-vibe-123';

      const mostInteracted = await t.query(
        api.emojiRatings.getMostInteractedEmoji,
        { vibeId }
      );

      expect(mostInteracted).toBeNull();
    });
  });

  describe('getEmojiRatingStats', () => {
    test('should calculate correct statistics', async () => {
      const t = convexTest(schema, modules);

      const vibeId = 'test-vibe-123';

      // Add test ratings with different values
      await t.run(async (ctx) => {
        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user1',
          emoji: '😍',
          value: 5,
          review: 'Love it!',
          createdAt: new Date().toISOString(),
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user2',
          emoji: '😍',
          value: 4,
          review: 'Really nice!',
          createdAt: new Date().toISOString(),
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user3',
          emoji: '😍',
          value: 3,
          review: 'Good vibes!',
          createdAt: new Date().toISOString(),
        });
      });

      const stats = await t.query(api.emojiRatings.getEmojiRatingStats, {
        vibeId,
      });

      expect(stats).toHaveLength(1);
      expect(stats[0].emoji).toBe('😍');
      expect(stats[0].count).toBe(3);
      expect(stats[0].average).toBe(4);
      expect(stats[0].median).toBe(4);
      expect(stats[0].distribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 1,
        5: 1,
      });
    });
  });
});
