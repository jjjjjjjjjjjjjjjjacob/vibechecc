export * from '../../vitest.setup';

// Export Convex modules for testing
// Use the standard pattern expected by convex-test
export const modules = import.meta.glob('./convex/**/*.{js,ts}');
