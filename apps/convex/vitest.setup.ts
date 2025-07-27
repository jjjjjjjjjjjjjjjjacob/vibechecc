export * from '../../vitest.setup';

// Export modules for convex-test
export const modules = {
  'convex/users.ts': () => import('./convex/users'),
  'convex/vibes.ts': () => import('./convex/vibes'),
  'convex/seed.ts': () => import('./convex/seed'),
  'convex/search.ts': () => import('./convex/search'),
  'convex/emojiRatings.ts': () => import('./convex/emojiRatings'),
  'convex/emojis.ts': () => import('./convex/emojis'),
  'convex/_generated/api.js': () => import('./convex/_generated/api'),
  'convex/_generated/server.js': () => import('./convex/_generated/server'),
};
