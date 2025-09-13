export * from '../../vitest.setup';

// Export Convex modules for testing
// Use dynamic imports for convex-test compatibility
export const modules = {
  'vibes.ts': () => import('./convex/vibes'),
  'users.ts': () => import('./convex/users'),
  'users/admin.ts': () => import('./convex/users/admin'),
  'ratings.ts': () => import('./convex/ratings'),
  'emojis.ts': () => import('./convex/emojis'),
  'emojiRatings.ts': () => import('./convex/emojiRatings'),
  'files.ts': () => import('./convex/files'),
  'follows.ts': () => import('./convex/follows'),
  'notifications.ts': () => import('./convex/notifications'),
  'search.ts': () => import('./convex/search'),
  'tags.ts': () => import('./convex/tags'),
  'http.ts': () => import('./convex/http'),
  'internal.ts': () => import('./convex/internal'), // Add internal module for scheduler calls
  'internal/userMutations.ts': () => import('./convex/internal/userMutations'),
  'schema.ts': () => import('./convex/schema'),
  'lib/securityValidators.ts': () => import('./convex/lib/securityValidators'),
  'lib/emojiColors.ts': () => import('./convex/lib/emojiColors'),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type instantiation is excessively deep - Convex generated types
  '_generated/api.js': () => import('./convex/_generated/api'),
  '_generated/server.js': () => import('./convex/_generated/server'),
};
