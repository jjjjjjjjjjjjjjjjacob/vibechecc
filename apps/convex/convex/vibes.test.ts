import { convexTest } from 'convex-test';
import { modules } from '../vitest.setup';
import { describe, it, expect } from 'vitest';
import schema from './schema'; // Your schema definition
import { api } from './_generated/api'; // Typed API methods

describe('Vibes Mutations', () => {
  describe('create', () => {
    it('should create a new vibe and store it in the database', async () => {
      const t = convexTest(schema, modules);

      const mockVibeData = {
        title: 'Test Vibe',
        description: 'This is a test vibe description.',
        image: 'https://example.com/test-image.jpg',
        tags: ['test', 'convex'],
      };

      // Mock an authenticated user
      const mockIdentity = {
        subject: 'user_test_id_123',
        tokenIdentifier: 'test_token_123',
        email: 'test@example.com',
        givenName: 'Test',
        familyName: 'User',
      };

      // Create the vibe using the real mutation with authentication
      const vibeId = await t
        .withIdentity(mockIdentity)
        .mutation(api.vibes.create, mockVibeData);

      expect(vibeId).toBeTypeOf('string'); // The mutation returns the new document's _id

      // Verify the vibe was created in the database by querying by creator
      const allVibesByCreator = await t.query(api.vibes.getByUser, {
        userId: mockIdentity.subject,
      });
      const createdVibe = allVibesByCreator.find(
        (v) =>
          v.title === mockVibeData.title &&
          v.description === mockVibeData.description &&
          v.createdById === mockIdentity.subject
      );

      expect(createdVibe).toBeDefined();
      if (createdVibe) {
        expect(createdVibe.title).toBe(mockVibeData.title);
        expect(createdVibe.description).toBe(mockVibeData.description);
        expect(createdVibe.createdById).toBe(mockIdentity.subject);
        expect(createdVibe.image).toBe(mockVibeData.image);
        expect(createdVibe.tags).toEqual(
          expect.arrayContaining(mockVibeData.tags)
        );
        expect(createdVibe.id).toBeTypeOf('string'); // The custom ID field
      }
    });

    it('should create a vibe without optional fields (image, tags)', async () => {
      const t = convexTest(schema, modules);

      const mockVibeDataMinimal = {
        title: 'Minimal Test Vibe',
        description: 'Minimal description.',
      };

      // Mock an authenticated user
      const mockIdentity = {
        subject: 'user_test_id_456',
        tokenIdentifier: 'test_token_456',
        email: 'minimal@example.com',
        givenName: 'Minimal',
        familyName: 'User',
      };

      const vibeId = await t
        .withIdentity(mockIdentity)
        .mutation(api.vibes.create, mockVibeDataMinimal);
      expect(vibeId).toBeTypeOf('string');

      const allVibesByCreator = await t.query(api.vibes.getByUser, {
        userId: mockIdentity.subject,
      });
      const createdVibe = allVibesByCreator.find(
        (v) => v.title === mockVibeDataMinimal.title
      );

      expect(createdVibe).toBeDefined();
      if (createdVibe) {
        expect(createdVibe.title).toBe(mockVibeDataMinimal.title);
        expect(createdVibe.description).toBe(mockVibeDataMinimal.description);
        expect(createdVibe.createdById).toBe(mockIdentity.subject);
        expect(createdVibe.image).toBeUndefined();
        // The schema defines tags as optional(array), so if not provided, it defaults to [] in the mutation.
        expect(createdVibe.tags).toEqual([]);
      }
    });

    it('should throw an error when not authenticated', async () => {
      const t = convexTest(schema, modules);

      const mockVibeData = {
        title: 'Test Vibe',
        description: 'This is a test vibe description.',
      };

      // Try to create a vibe without authentication using the auth-required mutation
      await expect(t.mutation(api.vibes.create, mockVibeData)).rejects.toThrow(
        'You must be logged in to create a vibe'
      );
    });
  });

  describe('addRating', () => {
    it('should allow users to rate a vibe', async () => {
      const t = convexTest(schema, modules);

      // Mock an authenticated user
      const mockIdentity = {
        subject: 'user_test_id_789',
        tokenIdentifier: 'test_token_789',
        email: 'rating@example.com',
        givenName: 'Rating',
        familyName: 'User',
      };

      // First create a vibe to rate
      const vibeData = {
        title: 'Vibe to Rate',
        description: 'This vibe will be rated.',
      };

      await t.withIdentity(mockIdentity).mutation(api.vibes.create, vibeData);

      // Get the created vibe to get its custom ID
      const createdVibes = await t.query(api.vibes.getByUser, {
        userId: mockIdentity.subject,
      });
      const createdVibe = createdVibes.find((v) => v.title === vibeData.title);

      expect(createdVibe).toBeDefined();

      if (createdVibe) {
        // Now rate the vibe using the real mutation with authentication
        const ratingData = {
          vibeId: createdVibe.id,
          rating: 5,
          review: 'Great vibe!',
        };

        const ratingId = await t
          .withIdentity(mockIdentity)
          .mutation(api.vibes.addRating, ratingData);

        expect(ratingId).toBeTypeOf('string');
      }
    });

    it('should throw an error when not authenticated', async () => {
      const t = convexTest(schema, modules);

      const ratingData = {
        vibeId: 'some-vibe-id',
        rating: 5,
        review: 'Great vibe!',
      };

      // Try to rate without authentication using the auth-required mutation
      await expect(t.mutation(api.vibes.addRating, ratingData)).rejects.toThrow(
        'You must be logged in to rate a vibe'
      );
    });
  });
});
