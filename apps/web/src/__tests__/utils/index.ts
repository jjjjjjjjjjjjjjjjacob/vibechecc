/**
 * Centralized exports for test helpers so individual test files can import
 * everything from a single module. Each export line is documented to clarify
 * the kinds of utilities being surfaced.
 */

// Re-export core testing utilities for rendering components and asserting props
export * from './test-utils';
// Surface canned mock data generators for common entities
export * from './mock-data';
// Provide mock provider wrappers like Clerk and router contexts
export * from './mock-providers';

// Common test patterns for easy import
export {
  testComponentExports, // verifies a component exposes expected members
  testComponentProps, // ensures prop passthrough works correctly
  createGlobalTestSetup, // bootstraps shared providers for test environments
  renderWithProviders, // renders components with typical wrappers
} from './test-utils';

export {
  createMockUser, // utility for generating a fake user
  createMockVibe, // stub vibe for feed tests
  createMockEmojiRating, // sample rating data
  mockUsers, // collection of users for bulk scenarios
  mockVibes, // collection of vibes
  mockEmojis, // list of emoji metadata
  createMockSearchResults, // sample search response shape
} from './mock-data';

export {
  createMockClerkProvider, // wraps children with a mock Clerk provider
  createMockRouter, // test router instance for navigation
  createMockThemeProvider, // provider to control theme in tests
  setupComprehensiveMocks, // initializes all mocks at once
  TestWrapper, // convenience component composing common providers
} from './mock-providers';
