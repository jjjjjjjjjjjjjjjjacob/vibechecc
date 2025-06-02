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
        createdById: 'user_test_id_123',
        image: 'https://example.com/test-image.jpg',
        tags: ['test', 'convex'],
      };

      // Before calling the mutation, you might want to ensure the user exists
      // or mock the user creation if it's a prerequisite.
      // For simplicity, we assume createdById is valid or doesn't need prior creation for this test scope.

      const vibeId = await t.mutation(api.vibes.create, mockVibeData);

      expect(vibeId).toBeTypeOf('string'); // The mutation returns the new document's _id

      // Verify the vibe was created in the database
      // Note: The `id` field in the vibes table is the one we generate in the mutation,
      // not the `_id` from Convex. The `create` mutation returns the `_id`.
      // To query by the custom `id` we generate, we need to adjust or use `_id`.
      // Let's assume the `create` mutation returns the Convex `_id` which is typical.
      const newVibe = await t.query(api.vibes.getById, { id: vibeId }); // Assuming getById can fetch by _id or custom id

      // If getById fetches by the *custom* ID field (`id`) we set in the mutation,
      // and `api.vibes.create` returns that custom ID, then the above is fine.
      // If `api.vibes.create` returns the Convex `_id`, and `getById` expects the *custom* `id`,
      // we'd need to adjust how we fetch or what `create` returns.
      // The `create` mutation actually inserts a *custom* `id`. Let's adjust the expectation.
      // The `create` mutation in `vibes.ts` returns the Convex `_id` of the inserted document.
      // The `getById` query in `vibes.ts` filters by `q.eq(q.field('id'), args.id)`, where `args.id` refers to the *custom* ID.
      // This means we cannot directly use the returned `_id` from `create` with `getById` as written.

      // For a more direct test of creation, let's fetch all vibes by the creator
      // and check the last one, or query directly using the returned _id if possible via another helper or direct db access.

      // Simpler check: query the database directly for the vibe using the known data
      const allVibesByCreator = await t.query(api.vibes.getByUser, {
        userId: mockVibeData.createdById,
      });
      const createdVibe = allVibesByCreator.find(
        (v) =>
          v.title === mockVibeData.title &&
          v.description === mockVibeData.description &&
          v.createdById === mockVibeData.createdById
      );

      expect(createdVibe).toBeDefined();
      if (createdVibe) {
        expect(createdVibe.title).toBe(mockVibeData.title);
        expect(createdVibe.description).toBe(mockVibeData.description);
        expect(createdVibe.createdById).toBe(mockVibeData.createdById);
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
        createdById: 'user_test_id_456',
      };

      const vibeId = await t.mutation(api.vibes.create, mockVibeDataMinimal);
      expect(vibeId).toBeTypeOf('string');

      const allVibesByCreator = await t.query(api.vibes.getByUser, {
        userId: mockVibeDataMinimal.createdById,
      });
      const createdVibe = allVibesByCreator.find(
        (v) => v.title === mockVibeDataMinimal.title
      );

      expect(createdVibe).toBeDefined();
      if (createdVibe) {
        expect(createdVibe.title).toBe(mockVibeDataMinimal.title);
        expect(createdVibe.description).toBe(mockVibeDataMinimal.description);
        expect(createdVibe.createdById).toBe(mockVibeDataMinimal.createdById);
        expect(createdVibe.image).toBeUndefined();
        // The schema defines tags as optional(array), so if not provided, it defaults to [] in the mutation.
        expect(createdVibe.tags).toEqual([]);
      }
    });
  });
});
