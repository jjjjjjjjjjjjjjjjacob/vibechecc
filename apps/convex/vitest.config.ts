/**
 * Re-export the root Vitest configuration so Convex tests inherit
 * the same settings as the rest of the repository. This keeps test
 * behavior consistent across packages while allowing Convex specific
 * overrides in the future if needed.
 */
export { default } from '../../vitest.config';
