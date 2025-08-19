/// <reference lib="dom" />

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnvironmentAccessGuard } from './environment-access-guard';
import * as clerkReact from '@clerk/tanstack-react-start';
import * as posthogReact from 'posthog-js/react';
import * as themeStore from '@/stores/theme-store';

// Mock all external dependencies
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: vi.fn(),
  SignInButton: vi.fn(({ children }) => <div>{children}</div>),
}));

vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: vi.fn(),
  useFeatureFlagPayload: vi.fn(),
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

describe('EnvironmentAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('renders without crashing', () => {
      vi.mocked(themeStore.useThemeStore).mockReturnValue({
        isInitialized: true,
        initialize: vi.fn(),
        applyThemeToDocument: vi.fn(),
      });
      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(true);
      vi.mocked(posthogReact.useFeatureFlagPayload).mockReturnValue(true);
      vi.mocked(clerkReact.useUser).mockReturnValue({
        isLoaded: true,
        user: null,
        isSignedIn: false,
      });

      expect(() => {
        render(
          <EnvironmentAccessGuard>
            <div>Content</div>
          </EnvironmentAccessGuard>
        );
      }).not.toThrow();
    });

    it('shows loading animation', () => {
      vi.mocked(themeStore.useThemeStore).mockReturnValue({
        isInitialized: false,
        initialize: vi.fn(),
        applyThemeToDocument: vi.fn(),
      });
      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(undefined);
      vi.mocked(posthogReact.useFeatureFlagPayload).mockReturnValue(undefined);
      vi.mocked(clerkReact.useUser).mockReturnValue({
        isLoaded: false,
        user: null,
        isSignedIn: false,
      });

      const { container } = render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Should show loading animation (individual letters)
      const appNameLetters = container.querySelectorAll('.animate-pulse-text');
      expect(appNameLetters.length).toBeGreaterThan(0);
      expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
    });
  });

  describe('theme integration', () => {
    it('initializes theme when user is loaded', () => {
      const mockInitialize = vi.fn();
      const mockApplyTheme = vi.fn();

      vi.mocked(themeStore.useThemeStore).mockReturnValue({
        isInitialized: false,
        initialize: mockInitialize,
        applyThemeToDocument: mockApplyTheme,
      });
      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(true);
      vi.mocked(posthogReact.useFeatureFlagPayload).mockReturnValue(true);
      vi.mocked(clerkReact.useUser).mockReturnValue({
        isLoaded: true,
        user: {
          id: 'user_123',
          publicMetadata: {
            theme: 'dark',
            colorTheme: 'purple',
            secondaryColorTheme: 'blue',
          },
        },
        isSignedIn: true,
      });

      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      expect(mockInitialize).toHaveBeenCalledWith({
        isSignedIn: true,
        userTheme: 'dark',
        userColorTheme: 'purple',
        userSecondaryColorTheme: 'blue',
      });
      expect(mockApplyTheme).toHaveBeenCalled();
    });
  });
});
