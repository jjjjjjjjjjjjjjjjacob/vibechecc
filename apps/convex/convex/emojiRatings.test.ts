import { convexTest } from 'convex-test';
import { expect, test, describe } from 'vitest';
import schema from './schema';
import { api } from './_generated/api';

describe('emoji ratings', () => {
  describe('createOrUpdateEmojiRating', () => {
    test('should create a new rating with emoji', async () => {
      const t = convexTest(schema);

      // Mock authenticated user
      const userId = 'test-user-123';
      await t.run(async (ctx) => {
        ctx.auth.getUserIdentity = async () => ({ subject: userId });

        const result = await api.emojiRatings.createOrUpdateEmojiRating(ctx, {
          vibeId: 'test-vibe-123',
          rating: 4,
          review: 'This vibe is mind-blowing!',
          emoji: '🤯',
          emojiValue: 4,
        });

        expect(result).toBeDefined();
      });
    });

    test('should validate rating values', async () => {
      const t = convexTest(schema);

      const userId = 'test-user-123';
      await t.run(async (ctx) => {
        ctx.auth.getUserIdentity = async () => ({ subject: userId });

        // Test invalid numeric rating
        await expect(
          api.emojiRatings.createOrUpdateEmojiRating(ctx, {
            vibeId: 'test-vibe-123',
            rating: 6, // Invalid
            emoji: '🤯',
            emojiValue: 4,
          })
        ).rejects.toThrow('Rating must be between 1 and 5');

        // Test invalid emoji rating value
        await expect(
          api.emojiRatings.createOrUpdateEmojiRating(ctx, {
            vibeId: 'test-vibe-123',
            rating: 4,
            emoji: '🤯',
            emojiValue: 0, // Invalid
          })
        ).rejects.toThrow('Emoji rating value must be between 1 and 5');
      });
    });

    test('should update existing rating', async () => {
      const t = convexTest(schema);

      const userId = 'test-user-123';
      const vibeId = 'test-vibe-123';

      await t.run(async (ctx) => {
        ctx.auth.getUserIdentity = async () => ({ subject: userId });

        // Create initial rating
        await api.emojiRatings.createOrUpdateEmojiRating(ctx, {
          vibeId,
          rating: 3,
          review: 'Initial review',
        });

        // Update with emoji rating
        await api.emojiRatings.createOrUpdateEmojiRating(ctx, {
          vibeId,
          rating: 5,
          review: 'Updated review - amazing!',
          emoji: '😍',
          emojiValue: 5,
        });

        // Check that only one rating exists
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibeAndUser', (q) =>
            q.eq('vibeId', vibeId).eq('userId', userId)
          )
          .collect();

        expect(ratings).toHaveLength(1);
        expect(ratings[0].rating).toBe(5);
        expect(ratings[0].review).toBe('Updated review - amazing!');
        expect(ratings[0].emojiRating?.emoji).toBe('😍');
        expect(ratings[0].emojiRating?.value).toBe(5);
      });
    });

    test('should require authentication', async () => {
      const t = convexTest(schema);

      await t.run(async (ctx) => {
        ctx.auth.getUserIdentity = async () => null;

        await expect(
          api.emojiRatings.createOrUpdateEmojiRating(ctx, {
            vibeId: 'test-vibe-123',
            rating: 4,
          })
        ).rejects.toThrow('You must be logged in to rate a vibe');
      });
    });
  });

  describe('getTopEmojiRatings', () => {
    test('should return top emoji ratings sorted by count', async () => {
      const t = convexTest(schema);

      const vibeId = 'test-vibe-123';

      await t.run(async (ctx) => {
        // Insert test ratings
        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user1',
          rating: 5,
          date: new Date().toISOString(),
          emojiRating: { emoji: '😍', value: 5 },
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user2',
          rating: 5,
          date: new Date().toISOString(),
          emojiRating: { emoji: '😍', value: 4 },
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user3',
          rating: 4,
          date: new Date().toISOString(),
          emojiRating: { emoji: '🤯', value: 4 },
        });

        const topEmojis = await api.emojiRatings.getTopEmojiRatings(ctx, {
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
  });

  describe('getMostInteractedEmoji', () => {
    test('should prioritize emoji ratings over reactions', async () => {
      const t = convexTest(schema);

      const vibeId = 'test-vibe-123';

      await t.run(async (ctx) => {
        // Add emoji ratings
        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user1',
          rating: 5,
          date: new Date().toISOString(),
          emojiRating: { emoji: '😍', value: 5 },
        });

        // Add more reactions but of different emoji
        await ctx.db.insert('reactions', {
          vibeId,
          userId: 'user2',
          emoji: '👍',
          isRating: false,
        });

        await ctx.db.insert('reactions', {
          vibeId,
          userId: 'user3',
          emoji: '👍',
          isRating: false,
        });

        const mostInteracted = await api.emojiRatings.getMostInteractedEmoji(
          ctx,
          { vibeId }
        );

        expect(mostInteracted?.emoji).toBe('😍');
        expect(mostInteracted?.type).toBe('rating');
      });
    });

    test('should fall back to reactions when no emoji ratings', async () => {
      const t = convexTest(schema);

      const vibeId = 'test-vibe-123';

      await t.run(async (ctx) => {
        // Add only reactions
        await ctx.db.insert('reactions', {
          vibeId,
          userId: 'user1',
          emoji: '👍',
          isRating: false,
        });

        await ctx.db.insert('reactions', {
          vibeId,
          userId: 'user2',
          emoji: '👍',
          isRating: false,
        });

        await ctx.db.insert('reactions', {
          vibeId,
          userId: 'user3',
          emoji: '🔥',
          isRating: false,
        });

        const mostInteracted = await api.emojiRatings.getMostInteractedEmoji(
          ctx,
          { vibeId }
        );

        expect(mostInteracted?.emoji).toBe('👍');
        expect(mostInteracted?.type).toBe('reaction');
        expect(mostInteracted?.count).toBe(2);
      });
    });
  });

  describe('getEmojiRatingStats', () => {
    test('should calculate correct statistics', async () => {
      const t = convexTest(schema);

      const vibeId = 'test-vibe-123';

      await t.run(async (ctx) => {
        // Add test ratings with different values
        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user1',
          rating: 5,
          date: new Date().toISOString(),
          emojiRating: { emoji: '😍', value: 5 },
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user2',
          rating: 4,
          date: new Date().toISOString(),
          emojiRating: { emoji: '😍', value: 4 },
        });

        await ctx.db.insert('ratings', {
          vibeId,
          userId: 'user3',
          rating: 3,
          date: new Date().toISOString(),
          emojiRating: { emoji: '😍', value: 3 },
        });

        const stats = await api.emojiRatings.getEmojiRatingStats(ctx, {
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
});
