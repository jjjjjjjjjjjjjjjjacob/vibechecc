export * from '../../vitest.setup';

// Export Convex modules for testing
// Use import.meta.glob to include all Convex functions and the _generated directory
export const modules = import.meta.glob([
  './convex/**/*.ts',
  './convex/_generated/**/*.ts',
  './convex/_generated/**/*.js',
]);
