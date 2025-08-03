// Test utilities and helpers
export * from './test-utils';
export * from './mock-data';
export * from './mock-providers';

// Common test patterns for easy import
export {
  testComponentExports,
  testComponentProps,
  createGlobalTestSetup,
  renderWithProviders,
} from './test-utils';

export {
  createMockUser,
  createMockVibe,
  createMockEmojiRating,
  mockUsers,
  mockVibes,
  mockEmojis,
  createMockSearchResults,
} from './mock-data';

export {
  createMockClerkProvider,
  createMockRouter,
  createMockThemeProvider,
  setupComprehensiveMocks,
  TestWrapper,
} from './mock-providers';
