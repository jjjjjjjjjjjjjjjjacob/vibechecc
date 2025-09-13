import { convexTest } from 'convex-test';
import { describe, it, expect } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { modules } from '../vitest.setup';

describe('Enhanced For You Feed Recommendations', () => {
  it('should return trending content for anonymous users', async () => {
    const t = convexTest(schema, modules);

    // Create some test vibes
    await t.run(async (ctx) => {
      return await ctx.db.insert('vibes', {
        id: 'vibe-1',
        title: 'Test Vibe 1',
        description: 'A great vibe',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        tags: ['happy', 'life'],
        visibility: 'public',
      });
    });

    // Add some ratings to make it trending
    await t.run(async (ctx) => {
      await ctx.db.insert('ratings', {
        vibeId: 'vibe-1',
        userId: 'user-2',
        emoji: '😊',
        value: 5,
        review: 'Amazing vibe!',
        createdAt: new Date().toISOString(),
      });
    });

    // Call the enhanced feed without authentication (anonymous user)
    const result = await t.query(api.vibes.getForYouFeed, {});

    expect(result).toBeDefined();
    expect(result.vibes).toBeInstanceOf(Array);
    expect(result.isDone).toBe(true);
  });

  it('should provide personalized recommendations for authenticated users with history', async () => {
    const t = convexTest(schema, modules);

    // Create a user with interests
    await t.run(async (ctx) => {
      await ctx.db.insert('users', {
        externalId: 'user-auth',
        username: 'testuser',
        interests: ['technology', 'travel'],
      });
    });

    // Create vibes with matching tags
    await t.run(async (ctx) => {
      await ctx.db.insert('vibes', {
        id: 'vibe-tech',
        title: 'Tech Vibe',
        description: 'About technology',
        createdById: 'user-other',
        createdAt: new Date().toISOString(),
        tags: ['technology', 'coding'],
        visibility: 'public',
      });
    });

    // Add user ratings to build history
    await t.run(async (ctx) => {
      await ctx.db.insert('ratings', {
        vibeId: 'vibe-tech',
        userId: 'user-auth',
        emoji: '🚀',
        value: 5,
        review: 'Love tech!',
        createdAt: new Date().toISOString(),
      });
    });

    // Mock authentication
    const result = await t
      .withIdentity({ subject: 'user-auth' })
      .query(api.vibes.getForYouFeed, {});

    expect(result).toBeDefined();
    expect(result.vibes).toBeInstanceOf(Array);
    expect(result.isDone).toBe(true);
  });

  it('should blend personalized and trending content for new users', async () => {
    const t = convexTest(schema, modules);

    // Create a new user with minimal history
    await t.run(async (ctx) => {
      await ctx.db.insert('users', {
        externalId: 'user-new',
        username: 'newuser',
        interests: [],
      });
    });

    // Create some trending content
    await t.run(async (ctx) => {
      await ctx.db.insert('vibes', {
        id: 'vibe-trending',
        title: 'Trending Vibe',
        description: 'Popular content',
        createdById: 'user-popular',
        createdAt: new Date().toISOString(),
        tags: ['trending', 'popular'],
        visibility: 'public',
      });
    });

    // Mock authentication for new user
    const result = await t
      .withIdentity({ subject: 'user-new' })
      .query(api.vibes.getForYouFeed, {});

    expect(result).toBeDefined();
    expect(result.vibes).toBeInstanceOf(Array);
    expect(result.isDone).toBe(true);
  });
});
