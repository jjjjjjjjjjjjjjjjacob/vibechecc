// Create modules object for convex-test
// This needs to match the pattern expected by convex-test
export const modules = {
  'convex/emojis.ts': () => import('./emojis'),
  'convex/emojiRatings.ts': () => import('./emojiRatings'),
  'convex/_generated/server.js': () => import('./_generated/server'),
};
