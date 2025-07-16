import { describe, expect, it, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../schema';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

const modules = { search: api.search, users: api.users, vibes: api.vibes };

describe('Search Functions', () => {
  const setup = convexTest(schema, modules);

  beforeEach(async () => {
    // Clear all data before each test
    const t = setup();
    // Clean existing data if needed
  });

  describe('searchAll', () => {
    it('returns empty results for empty query', async () => {
      const t = setup();
      
      const result = await t.query(api.search.searchAll, {
        query: '',
        limit: 10,
      });

      expect(result).toEqual({
        vibes: [],
        users: [],
        tags: [],
        actions: [],
        totalCount: 0,
      });
    });

    it('searches vibes by content', async () => {
      const t = setup();
      
      // Create test user
      const userId = await t.mutation(api.users.createUser, {
        username: 'testuser',
        displayName: 'Test User',
      });

      // Create test vibes
      const vibe1 = await t.mutation(api.vibes.createVibe, {
        content: 'This is a funny story about cats',
        tags: ['funny', 'animals'],
      });

      const vibe2 = await t.mutation(api.vibes.createVibe, {
        content: 'A sad story about dogs',
        tags: ['sad', 'animals'],
      });

      // Search for "funny"
      const result = await t.query(api.search.searchAll, {
        query: 'funny',
        limit: 10,
      });

      expect(result.vibes).toHaveLength(1);
      expect(result.vibes[0].content).toContain('funny');
      expect(result.totalCount).toBe(1);
    });

    it('searches users by username', async () => {
      const t = setup();
      
      // Create test users
      await t.mutation(api.users.createUser, {
        username: 'alice123',
        displayName: 'Alice Smith',
      });

      await t.mutation(api.users.createUser, {
        username: 'bob456',
        displayName: 'Bob Johnson',
      });

      // Search for "alice"
      const result = await t.query(api.search.searchAll, {
        query: 'alice',
        limit: 10,
      });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe('alice123');
    });

    it('searches tags', async () => {
      const t = setup();
      
      // Create vibes with tags
      await t.mutation(api.vibes.createVibe, {
        content: 'Content 1',
        tags: ['funny', 'wholesome'],
      });

      await t.mutation(api.vibes.createVibe, {
        content: 'Content 2',
        tags: ['funny', 'random'],
      });

      await t.mutation(api.vibes.createVibe, {
        content: 'Content 3',
        tags: ['sad', 'emotional'],
      });

      // Search for "fun"
      const result = await t.query(api.search.searchAll, {
        query: 'fun',
        limit: 10,
      });

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('funny');
      expect(result.tags[0].count).toBe(2);
    });

    it('handles fuzzy matching for typos', async () => {
      const t = setup();
      
      // Create test data
      await t.mutation(api.vibes.createVibe, {
        content: 'amazing experience at the restaurant',
        tags: ['food'],
      });

      // Search with typo "amzing" (missing 'a')
      const result = await t.query(api.search.searchAll, {
        query: 'amzing',
        limit: 10,
      });

      expect(result.vibes).toHaveLength(1);
      expect(result.vibes[0].content).toContain('amazing');
    });

    it('applies filters correctly', async () => {
      const t = setup();
      
      // Create vibes with different ratings
      const vibe1 = await t.mutation(api.vibes.createVibe, {
        content: 'Great vibe',
        tags: ['happy'],
      });

      const vibe2 = await t.mutation(api.vibes.createVibe, {
        content: 'Okay vibe',
        tags: ['neutral'],
      });

      // Add ratings
      await t.mutation(api.vibes.rateVibe, {
        vibeId: vibe1,
        rating: 5,
      });

      await t.mutation(api.vibes.rateVibe, {
        vibeId: vibe2,
        rating: 2,
      });

      // Search with minRating filter
      const result = await t.query(api.search.searchAll, {
        query: 'vibe',
        filters: {
          minRating: 4,
        },
        limit: 10,
      });

      expect(result.vibes).toHaveLength(1);
      expect(result.vibes[0].content).toBe('Great vibe');
    });

    it('respects search operators', async () => {
      const t = setup();
      
      // Create test vibes
      await t.mutation(api.vibes.createVibe, {
        content: 'I love coding in TypeScript',
        tags: ['tech'],
      });

      await t.mutation(api.vibes.createVibe, {
        content: 'I love JavaScript but not TypeScript',
        tags: ['tech'],
      });

      // Search with quotes for exact match
      const exactResult = await t.query(api.search.searchAll, {
        query: '"love coding"',
        limit: 10,
      });

      expect(exactResult.vibes).toHaveLength(1);
      expect(exactResult.vibes[0].content).toContain('love coding');

      // Search with minus operator for exclusion
      const excludeResult = await t.query(api.search.searchAll, {
        query: 'love -TypeScript',
        limit: 10,
      });

      expect(excludeResult.vibes).toHaveLength(0); // Both contain TypeScript
    });

    it('sorts results by relevance', async () => {
      const t = setup();
      
      // Create vibes with different relevance
      await t.mutation(api.vibes.createVibe, {
        content: 'Python Python Python', // High relevance for "python"
        tags: ['programming'],
      });

      await t.mutation(api.vibes.createVibe, {
        content: 'I like Python', // Medium relevance
        tags: ['programming'],
      });

      await t.mutation(api.vibes.createVibe, {
        content: 'JavaScript and Python are great', // Lower relevance
        tags: ['programming'],
      });

      // Search for "python"
      const result = await t.query(api.search.searchAll, {
        query: 'python',
        limit: 10,
      });

      expect(result.vibes).toHaveLength(3);
      // First result should have highest relevance (most occurrences)
      expect(result.vibes[0].content).toBe('Python Python Python');
    });

    it('handles special characters in search', async () => {
      const t = setup();
      
      // Create vibes with special characters
      await t.mutation(api.vibes.createVibe, {
        content: 'C++ is a great language!',
        tags: ['programming'],
      });

      await t.mutation(api.vibes.createVibe, {
        content: 'I use @mentions and #hashtags',
        tags: ['social'],
      });

      // Search for C++
      const cppResult = await t.query(api.search.searchAll, {
        query: 'C++',
        limit: 10,
      });

      expect(cppResult.vibes).toHaveLength(1);
      expect(cppResult.vibes[0].content).toContain('C++');

      // Search for @mentions
      const mentionResult = await t.query(api.search.searchAll, {
        query: '@mentions',
        limit: 10,
      });

      expect(mentionResult.vibes).toHaveLength(1);
      expect(mentionResult.vibes[0].content).toContain('@mentions');
    });

    it('limits results correctly', async () => {
      const t = setup();
      
      // Create many vibes
      for (let i = 0; i < 10; i++) {
        await t.mutation(api.vibes.createVibe, {
          content: `Test vibe number ${i}`,
          tags: ['test'],
        });
      }

      // Search with limit
      const result = await t.query(api.search.searchAll, {
        query: 'test',
        limit: 5,
      });

      expect(result.vibes).toHaveLength(5);
      expect(result.totalCount).toBe(10);
    });

    it('includes action suggestions', async () => {
      const t = setup();
      
      // Search for "create"
      const result = await t.query(api.search.searchAll, {
        query: 'create',
        limit: 10,
      });

      // Should include action to create new vibe
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].action).toBe('create');
      expect(result.actions[0].title).toContain('Create');
    });
  });

  describe('getSearchSuggestions', () => {
    it('returns suggestions for partial queries', async () => {
      const t = setup();
      
      // Create test data
      await t.mutation(api.vibes.createVibe, {
        content: 'Amazing sunset photography',
        tags: ['photography', 'nature'],
      });

      await t.mutation(api.vibes.createVibe, {
        content: 'Amazing food experience',
        tags: ['food', 'amazing'],
      });

      // Get suggestions for "amaz"
      const result = await t.query(api.search.getSearchSuggestions, {
        query: 'amaz',
      });

      expect(result.vibes).toHaveLength(2);
      expect(result.vibes[0].content).toContain('Amazing');
    });

    it('returns recent searches when query is empty', async () => {
      const t = setup();
      
      // Track some searches
      await t.mutation(api.search.trackSearch, {
        query: 'sunset',
        resultCount: 5,
      });

      await t.mutation(api.search.trackSearch, {
        query: 'food',
        resultCount: 3,
      });

      // Get suggestions with empty query
      const result = await t.query(api.search.getSearchSuggestions, {
        query: '',
      });

      expect(result.recentSearches).toBeDefined();
      expect(result.recentSearches).toContain('sunset');
      expect(result.recentSearches).toContain('food');
    });
  });

  describe('getTrendingSearches', () => {
    it('returns most popular search terms', async () => {
      const t = setup();
      
      // Track searches with different frequencies
      for (let i = 0; i < 10; i++) {
        await t.mutation(api.search.trackSearch, {
          query: 'popular',
          resultCount: 5,
        });
      }

      for (let i = 0; i < 5; i++) {
        await t.mutation(api.search.trackSearch, {
          query: 'medium',
          resultCount: 3,
        });
      }

      await t.mutation(api.search.trackSearch, {
        query: 'rare',
        resultCount: 1,
      });

      // Get trending searches
      const result = await t.query(api.search.getTrendingSearches, {
        limit: 3,
      });

      expect(result).toHaveLength(3);
      expect(result[0].term).toBe('popular');
      expect(result[0].count).toBe(10);
      expect(result[1].term).toBe('medium');
      expect(result[1].count).toBe(5);
    });
  });

  describe('trackSearch', () => {
    it('tracks search queries and results', async () => {
      const t = setup();
      
      // Track a search
      await t.mutation(api.search.trackSearch, {
        query: 'test search',
        resultCount: 7,
      });

      // Verify it's tracked (would need to add a query to check)
      const trending = await t.query(api.search.getTrendingSearches, {
        limit: 10,
      });

      const tracked = trending.find(t => t.term === 'test search');
      expect(tracked).toBeDefined();
      expect(tracked?.count).toBe(1);
    });

    it('increments count for repeated searches', async () => {
      const t = setup();
      
      // Track same search multiple times
      await t.mutation(api.search.trackSearch, {
        query: 'repeated',
        resultCount: 5,
      });

      await t.mutation(api.search.trackSearch, {
        query: 'repeated',
        resultCount: 3,
      });

      // Check count
      const trending = await t.query(api.search.getTrendingSearches, {
        limit: 10,
      });

      const tracked = trending.find(t => t.term === 'repeated');
      expect(tracked?.count).toBe(2);
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      const t = setup();
      
      // Create many vibes
      for (let i = 0; i < 100; i++) {
        await t.mutation(api.vibes.createVibe, {
          content: `Vibe ${i} with some test content about ${i % 2 === 0 ? 'cats' : 'dogs'}`,
          tags: [`tag${i % 5}`],
        });
      }

      // Measure search time
      const startTime = Date.now();
      const result = await t.query(api.search.searchAll, {
        query: 'cats',
        limit: 20,
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200); // Should complete within 200ms
      expect(result.vibes.length).toBeGreaterThan(0);
    });
  });
});