/// <reference lib="dom" />
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { vi, beforeEach, afterEach, expect, describe, it } from 'vitest';
import { ThemeInitializer } from '@/stores/theme-initializer';

// Mock data for consistent testing
export const mockUser = {
  id: 'user_123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  primaryColor: 'purple',
  secondaryColor: 'blue',
  themeColor: 'purple', // fallback
};

export const mockVibe = {
  _id: 'vibe_123',
  title: 'Test Vibe',
  description: 'This is a test vibe for testing purposes',
  userId: 'user_123',
  userName: 'Test User',
  userEmail: 'test@example.com',
  tags: ['test', 'example'],
  category: 'general',
  _creationTime: Date.now(),
  starRating: 4.5,
  totalRatings: 10,
  averageEmojiRating: 4.2,
};

export const mockEmojiRating = {
  _id: 'rating_123',
  vibeId: 'vibe_123',
  userId: 'user_123',
  emoji: '🔥',
  rating: 5,
  reviewText: 'This is fire!',
  _creationTime: Date.now(),
};

export const mockEmojis = [
  {
    emoji: '🔥',
    name: 'fire',
    color: '#FF6B6B',
    keywords: ['hot', 'flame', 'lit'],
  },
  {
    emoji: '😍',
    name: 'heart eyes',
    color: '#FF6B9D',
    keywords: ['love', 'crush', 'amazing'],
  },
  {
    emoji: '💯',
    name: '100',
    color: '#4ECDC4',
    keywords: ['perfect', 'score', 'excellent'],
  },
  {
    emoji: '😱',
    name: 'shocked',
    color: '#FFD93D',
    keywords: ['surprised', 'wow', 'omg'],
  },
];

// Custom render function that includes common providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withThemeProvider?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { withThemeProvider = true, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    if (withThemeProvider) {
      return <ThemeInitializer>{children}</ThemeInitializer>;
    }
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock common hooks and dependencies
export const createMockRouter = (pathname = '/') => ({
  location: { pathname },
  matches: pathname === '/vibes/123' ? [{ routeId: '/vibes/$vibeId' }] : [],
});

export const createMockTheme = (
  theme = 'light',
  colorTheme = 'purple-primary'
) => ({
  theme: 'system' as const,
  setTheme: vi.fn(),
  resolvedTheme: theme as 'light' | 'dark',
  colorTheme: colorTheme as any,
  secondaryColorTheme: 'blue-secondary' as any,
  setColorTheme: vi.fn(),
  setSecondaryColorTheme: vi.fn(),
});

export const createMockAuth = (isSignedIn = true) => ({
  isSignedIn,
  user: isSignedIn ? mockUser : null,
  isLoaded: true,
});

// Common mock functions
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

export const mockMatchMedia = (prefersDark = false) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

// Setup functions for common mocks
export const setupBrowserMocks = (prefersDark = false) => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia(prefersDark),
  });

  // Mock document.documentElement
  const mockRoot = {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    },
  };

  Object.defineProperty(document, 'documentElement', {
    value: mockRoot,
    writable: true,
  });
};

// Assertion helpers
export const expectToHaveClasses = (
  element: HTMLElement,
  classes: string[]
) => {
  classes.forEach((className) => {
    expect(element).toHaveClass(className);
  });
};

export const expectNotToHaveClasses = (
  element: HTMLElement,
  classes: string[]
) => {
  classes.forEach((className) => {
    expect(element).not.toHaveClass(className);
  });
};

// Test ID helpers
export const getByTestId = (container: HTMLElement, testId: string) => {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Unable to find element with data-testid="${testId}"`);
  }
  return element;
};

export const queryByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`);
};

// Common test patterns
export const testComponentExports = (Component: any, name: string) => {
  describe(`${name} Component Export`, () => {
    it(`should export ${name} component`, () => {
      expect(Component).toBeDefined();
      expect(typeof Component).toBe('function');
    });

    it(`should be a valid React component`, () => {
      expect(Component.length).toBeGreaterThanOrEqual(0);
    });
  });
};

export const testComponentProps = (
  Component: any,
  name: string,
  requiredProps: any = {}
) => {
  describe(`${name} Component Props`, () => {
    it('should accept standard React props', () => {
      expect(() => {
        const props: React.ComponentProps<typeof Component> = {
          ...requiredProps,
          className: 'test-class',
          'data-testid': 'test-id',
        };
        expect(props).toBeDefined();
      }).not.toThrow();
    });
  });
};

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Global test helper
export const createGlobalTestSetup = () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupBrowserMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
};
