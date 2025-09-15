/**
 * @vibechecc/app-core
 *
 * Shared business logic, hooks, stores, and utilities that work
 * across both web and mobile platforms.
 */

// Hooks
export * from './hooks/use-current-user';
export * from './hooks/use-vibes';
export * from './hooks/use-ratings';
export * from './hooks/use-auth';
export * from './hooks/use-notifications';
export * from './hooks/use-search';
export * from './hooks/use-follows';

// Stores
export * from './stores/auth-store';
export * from './stores/theme-store';
export * from './stores/navigation-store';
export * from './stores/search-store';
export * from './stores/storage';

// Services
export * from './services/convex-client';
export * from './services/auth-service';
export * from './services/notification-service';

// Utils
export * from './utils/validation';
export * from './utils/formatting';
export * from './utils/constants';
export * from './utils/use-debounced-value';

// Types
export * from './types';