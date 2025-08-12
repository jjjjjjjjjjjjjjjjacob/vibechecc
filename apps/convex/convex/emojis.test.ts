/**
 * Tests for emoji import and search utilities.
 * Confirms batch imports avoid duplicates and search returns expected sets.
 */
import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import schema from './schema';
import { modules } from '../vitest.setup';
import { api } from './_generated/api';

// Validate emoji import and search helpers
describe('emojis', () => {
  describe('importBatch', () => {
    it('should import new emojis', async () => {
      const t = convexTest(schema, modules);

      const emojisToImport = [
        {
          emoji: '🔥',
          name: 'fire',
          keywords: ['hot', 'flame', 'lit'],
          category: 'objects',
        },
        {
          emoji: '😍',
          name: 'heart eyes',
          keywords: ['love', 'crush', 'hearts'],
          category: 'smileys',
        },
      ];

      const result = await t.mutation(api.emojis.importBatch, {
        emojis: emojisToImport,
      });
      expect(result.count).toBe(2);

      // Verify emojis were inserted
      const emojisResult = await t.query(api.emojis.getByEmojis, {
        emojis: ['🔥'],
      });
      expect(emojisResult).toHaveLength(1);
      expect(emojisResult[0].emoji).toBe('🔥');
      expect(emojisResult[0].name).toBe('fire');
      expect(emojisResult[0].category).toBe('objects');
      expect(emojisResult[0].color).toBeDefined();
      expect(emojisResult[0].sentiment).toBeDefined();
    });

    it('should not duplicate existing emojis', async () => {
      const t = convexTest(schema, modules);

      const emoji = {
        emoji: '🔥',
        name: 'fire',
        keywords: ['hot', 'flame'],
        category: 'objects',
      };

      // Import once
      const result1 = await t.mutation(api.emojis.importBatch, {
        emojis: [emoji],
      });
      expect(result1.count).toBe(1);

      // Import again
      const result2 = await t.mutation(api.emojis.importBatch, {
        emojis: [emoji],
      });
      expect(result2.count).toBe(0);
    });
  });

  describe('search', () => {
    it('should return all emojis when no search term', async () => {
      const t = convexTest(schema, modules);

      // Import test emojis
      await t.mutation(api.emojis.importBatch, {
        emojis: [
          { emoji: '🔥', name: 'fire', keywords: ['hot'], category: 'objects' },
          {
            emoji: '😍',
            name: 'heart eyes',
            keywords: ['love'],
            category: 'smileys',
          },
          {
            emoji: '💯',
            name: '100',
            keywords: ['perfect'],
            category: 'symbols',
          },
        ],
      });

      const result = await t.query(api.emojis.search, {});
      expect(result.emojis).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by search term', async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.emojis.importBatch, {
        emojis: [
          {
            emoji: '🔥',
            name: 'fire',
            keywords: ['hot', 'flame'],
            category: 'objects',
          },
          {
            emoji: '❄️',
            name: 'snowflake',
            keywords: ['cold', 'ice'],
            category: 'nature',
          },
          {
            emoji: '🔴',
            name: 'red circle',
            keywords: ['red', 'circle'],
            category: 'symbols',
          },
        ],
      });

      const result = await t.query(api.emojis.search, { searchTerm: 'fire' });
      expect(result.emojis).toHaveLength(1);
      expect(result.emojis[0].emoji).toBe('🔥');
    });

    it('should search in keywords and tags', async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.emojis.importBatch, {
        emojis: [
          {
            emoji: '🔥',
            name: 'fire',
            keywords: ['hot', 'flame'],
            category: 'objects',
          },
          {
            emoji: '🌶️',
            name: 'hot pepper',
            keywords: ['spicy', 'chili'],
            category: 'food',
          },
        ],
      });

      const result = await t.query(api.emojis.search, { searchTerm: 'hot' });
      expect(result.emojis).toHaveLength(2);
      expect(result.emojis.map((e: any) => e.emoji)).toContain('🔥');
      expect(result.emojis.map((e: any) => e.emoji)).toContain('🌶️');
    });

    it('should filter by category', async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.emojis.importBatch, {
        emojis: [
          {
            emoji: '😀',
            name: 'grinning',
            keywords: ['smile'],
            category: 'smileys',
          },
          {
            emoji: '😃',
            name: 'smiley',
            keywords: ['happy'],
            category: 'smileys',
          },
          { emoji: '🍎', name: 'apple', keywords: ['fruit'], category: 'food' },
        ],
      });

      const result = await t.query(api.emojis.search, { category: 'smileys' });
      expect(result.emojis).toHaveLength(2);
      expect(result.emojis.every((e: any) => e.category === 'smileys')).toBe(
        true
      );
    });

    it('should paginate results', async () => {
      const t = convexTest(schema, modules);

      // Import many emojis
      const emojis = Array.from({ length: 10 }, (_, i) => ({
        emoji: String.fromCodePoint(0x1f600 + i),
        name: `emoji${i}`,
        keywords: ['test'],
        category: 'test',
      }));

      await t.mutation(api.emojis.importBatch, { emojis });

      // First page
      const page1 = await t.query(api.emojis.search, { page: 0, pageSize: 5 });
      expect(page1.emojis).toHaveLength(5);
      expect(page1.hasMore).toBe(true);
      expect(page1.page).toBe(0);

      // Second page
      const page2 = await t.query(api.emojis.search, { page: 1, pageSize: 5 });
      expect(page2.emojis).toHaveLength(5);
      expect(page2.hasMore).toBe(false);
      expect(page2.page).toBe(1);

      // Ensure no duplicates
      const allEmojis = [...page1.emojis, ...page2.emojis];
      const uniqueEmojis = new Set(allEmojis.map((e: any) => e.emoji));
      expect(uniqueEmojis.size).toBe(10);
    });
  });

  describe('getByEmojis', () => {
    it('should return emoji metadata for requested emojis', async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.emojis.importBatch, {
        emojis: [
          { emoji: '🔥', name: 'fire', keywords: ['hot'], category: 'objects' },
          {
            emoji: '😍',
            name: 'heart eyes',
            keywords: ['love'],
            category: 'smileys',
          },
          {
            emoji: '💯',
            name: '100',
            keywords: ['perfect'],
            category: 'symbols',
          },
        ],
      });

      const result = await t.query(api.emojis.getByEmojis, {
        emojis: ['🔥', '💯'],
      });
      expect(result).toHaveLength(2);
      expect(result.find((e: any) => e.emoji === '🔥')?.name).toBe('fire');
      expect(result.find((e: any) => e.emoji === '💯')?.name).toBe('100');
      expect(result.find((e: any) => e.emoji === '😍')).toBeUndefined();
    });

    it('should handle non-existent emojis', async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(api.emojis.getByEmojis, {
        emojis: ['🦄', '🌈'],
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('getPopular', () => {
    it('should return popular emojis up to limit', async () => {
      const t = convexTest(schema, modules);

      // Import the popular emojis
      const popularEmojis = [
        '🔥',
        '😍',
        '💯',
        '😂',
        '🤩',
        '😎',
        '🥺',
        '😭',
        '💀',
        '👀',
        '❤️',
        '✨',
      ];

      await t.mutation(api.emojis.importBatch, {
        emojis: popularEmojis.map((emoji) => ({
          emoji,
          name: `emoji_${emoji}`,
          keywords: ['popular'],
          category: 'popular',
        })),
      });

      const result = await t.query(api.emojis.getPopular, { limit: 5 });
      expect(result).toHaveLength(5);
      expect(result.every((e: any) => popularEmojis.includes(e.emoji))).toBe(
        true
      );
    });

    it('should return default number of emojis when no limit', async () => {
      const t = convexTest(schema, modules);

      const popularEmojis = [
        '🔥',
        '😍',
        '💯',
        '😂',
        '🤩',
        '😎',
        '🥺',
        '😭',
        '💀',
        '👀',
        '❤️',
        '✨',
      ];

      await t.mutation(api.emojis.importBatch, {
        emojis: popularEmojis.map((emoji) => ({
          emoji,
          name: `emoji_${emoji}`,
          keywords: ['popular'],
          category: 'popular',
        })),
      });

      const result = await t.query(api.emojis.getPopular, {});
      expect(result.length).toBeLessThanOrEqual(20); // default limit
    });
  });

  describe('getCategories', () => {
    it('should return unique sorted categories', async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.emojis.importBatch, {
        emojis: [
          {
            emoji: '😀',
            name: 'grinning',
            keywords: ['smile'],
            category: 'smileys',
          },
          { emoji: '🍎', name: 'apple', keywords: ['fruit'], category: 'food' },
          {
            emoji: '😃',
            name: 'smiley',
            keywords: ['happy'],
            category: 'smileys',
          },
          {
            emoji: '🚗',
            name: 'car',
            keywords: ['vehicle'],
            category: 'travel',
          },
          {
            emoji: '🍕',
            name: 'pizza',
            keywords: ['italian'],
            category: 'food',
          },
        ],
      });

      const categories = await t.query(api.emojis.getCategories, {});
      expect(categories).toEqual(['food', 'smileys', 'travel']);
    });

    it('should return empty array when no emojis', async () => {
      const t = convexTest(schema, modules);

      const categories = await t.query(api.emojis.getCategories, {});
      expect(categories).toEqual([]);
    });
  });
});
