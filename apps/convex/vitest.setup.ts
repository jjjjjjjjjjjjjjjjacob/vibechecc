// Re-use the root Vitest setup to share globals across packages
export * from '../../vitest.setup';

/**
 * Module map required by `convex-test` to dynamically import server code
 * during tests. Each entry mirrors a Convex module path and returns a
 * promise that resolves to the module implementation.
 */
export const modules = {
  'convex/users.ts': () => import('./convex/users'),
  'convex/vibes.ts': () => import('./convex/vibes'),
  'convex/seed.ts': () => import('./convex/seed'),
  'convex/search.ts': () => import('./convex/search'),
  'convex/emojiRatings.ts': () => import('./convex/emojiRatings'),
  'convex/emojis.ts': () => import('./convex/emojis'),
  'convex/tags.ts': () => import('./convex/tags'),
  'convex/follows.ts': () => import('./convex/follows'),
  'convex/files.ts': () => import('./convex/files'),
  'convex/notifications.ts': () => import('./convex/notifications'),
  'convex/_generated/api.js': () => import('./convex/_generated/api'),
  'convex/_generated/server.js': () => import('./convex/_generated/server'),
};
