import '@testing-library/jest-dom/vitest';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

// Export modules for convex-test
export const modules = {
  'convex/users.ts': () => import('./convex/users'),
  'convex/vibes.ts': () => import('./convex/vibes'),
  'convex/seed.ts': () => import('./convex/seed'),
  'convex/_generated/api.js': () => import('./convex/_generated/api'),
  'convex/_generated/server.js': () => import('./convex/_generated/server'),
};
