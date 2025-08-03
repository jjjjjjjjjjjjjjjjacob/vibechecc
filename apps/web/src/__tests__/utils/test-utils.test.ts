/// <reference lib="dom" />
import { describe, it, expect } from 'vitest';
import {
  mockUser,
  mockVibe,
  mockEmojiRating,
  mockEmojis,
  createMockRouter,
  createMockTheme,
  createMockAuth,
  setupBrowserMocks,
  mockLocalStorage,
} from './test-utils';

import {
  createMockUser,
  createMockVibe,
  createMockUserList,
  createMockVibeList,
} from './mock-data';

describe('Test Utils', () => {
  describe('Mock Data', () => {
    it('should provide consistent mock user data', () => {
      expect(mockUser).toBeDefined();
      expect(mockUser.id).toBe('user_123');
      expect(mockUser.firstName).toBe('Test');
      expect(mockUser.lastName).toBe('User');
      expect(mockUser.email).toBe('test@example.com');
    });

    it('should provide consistent mock vibe data', () => {
      expect(mockVibe).toBeDefined();
      expect(mockVibe._id).toBe('vibe_123');
      expect(mockVibe.title).toBe('Test Vibe');
      expect(mockVibe.userId).toBe('user_123');
      expect(Array.isArray(mockVibe.tags)).toBe(true);
    });

    it('should provide consistent mock emoji rating data', () => {
      expect(mockEmojiRating).toBeDefined();
      expect(mockEmojiRating._id).toBe('rating_123');
      expect(mockEmojiRating.vibeId).toBe('vibe_123');
      expect(mockEmojiRating.emoji).toBe('🔥');
      expect(mockEmojiRating.rating).toBe(5);
    });
  });

  describe('Mock Factories', () => {
    it('should create mock users with overrides', () => {
      const customUser = createMockUser({ firstName: 'Custom' });
      expect(customUser.firstName).toBe('Custom');
      expect(customUser.lastName).toBe('User'); // default value
    });

    it('should create mock vibes with overrides', () => {
      const customVibe = createMockVibe({ title: 'Custom Vibe' });
      expect(customVibe.title).toBe('Custom Vibe');
      expect(customVibe.userId).toBe('user_123'); // default value
    });

    it('should create lists of mock data', () => {
      const users = createMockUserList(3);
      expect(users).toHaveLength(3);
      expect(users[0].firstName).toBe('User0');
      expect(users[1].firstName).toBe('User1');
      expect(users[2].firstName).toBe('User2');

      const vibes = createMockVibeList(2);
      expect(vibes).toHaveLength(2);
      expect(vibes[0].title).toBe('Test Vibe 0');
      expect(vibes[1].title).toBe('Test Vibe 1');
    });
  });

  describe('Mock Functions', () => {
    it('should create mock router with default values', () => {
      const router = createMockRouter();
      expect(router.location.pathname).toBe('/');
      expect(Array.isArray(router.matches)).toBe(true);
    });

    it('should create mock router with custom pathname', () => {
      const router = createMockRouter('/discover');
      expect(router.location.pathname).toBe('/discover');
    });

    it('should create mock theme with default values', () => {
      const theme = createMockTheme();
      expect(theme.resolvedTheme).toBe('light');
      expect(theme.colorTheme).toBe('purple-primary');
      expect(typeof theme.setTheme).toBe('function');
    });

    it('should create mock theme with custom values', () => {
      const theme = createMockTheme('dark', 'blue-primary');
      expect(theme.resolvedTheme).toBe('dark');
      expect(theme.colorTheme).toBe('blue-primary');
    });
  });

  describe('Browser Mocks', () => {
    it('should setup browser mocks correctly', () => {
      setupBrowserMocks();

      expect(mockLocalStorage.getItem).toBeDefined();
      expect(mockLocalStorage.setItem).toBeDefined();
      expect(mockLocalStorage.removeItem).toBeDefined();
      expect(window.localStorage).toBe(mockLocalStorage);
    });

    it('should setup matchMedia mock', () => {
      setupBrowserMocks();

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      expect(mediaQuery.matches).toBe(false);
      expect(typeof mediaQuery.addEventListener).toBe('function');
    });

    it('should setup matchMedia mock with dark preference', () => {
      setupBrowserMocks(true);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      expect(mediaQuery.matches).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should handle test component exports validation', () => {
      const MockComponent = () => null;

      expect(() => {
        expect(MockComponent).toBeDefined();
        expect(typeof MockComponent).toBe('function');
      }).not.toThrow();
    });

    it('should validate component props interface', () => {
      const MockComponent = ({ title: _title }: { title: string }) => null;

      expect(MockComponent).toBeDefined();
      expect(typeof MockComponent).toBe('function');
    });
  });

  describe('Helper Functions', () => {
    it('should provide mock emoji data', () => {
      expect(Array.isArray(mockEmojis)).toBe(true);
      expect(mockEmojis.length).toBeGreaterThan(0);
      expect(mockEmojis[0]).toHaveProperty('emoji');
      expect(mockEmojis[0]).toHaveProperty('name');
      expect(mockEmojis[0]).toHaveProperty('color');
      expect(mockEmojis[0]).toHaveProperty('keywords');
    });

    it('should create mock auth state', () => {
      const authMock = createMockAuth(true);
      expect(authMock.isSignedIn).toBe(true);
      expect(authMock.user).toBe(mockUser);
      expect(authMock.isLoaded).toBe(true);

      const signedOutMock = createMockAuth(false);
      expect(signedOutMock.isSignedIn).toBe(false);
      expect(signedOutMock.user).toBeNull();
    });
  });
});
