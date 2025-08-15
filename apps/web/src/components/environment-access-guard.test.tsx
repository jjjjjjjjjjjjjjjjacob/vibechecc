/// <reference lib="dom" />

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { EnvironmentAccessGuard } from './environment-access-guard';
import * as clerkReact from '@clerk/tanstack-react-start';
import * as posthogReact from 'posthog-js/react';
import * as usePostHogHook from '@/hooks/use-posthog';
import * as themeStore from '@/stores/theme-store';
import * as environmentAccess from '@/lib/environment-access';

// Mock all external dependencies
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: vi.fn(),
  SignInButton: vi.fn(({ children }) => <div>{children}</div>),
}));

vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: vi.fn(),
}));

vi.mock('@/hooks/use-posthog', () => ({
  usePostHog: vi.fn(),
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

vi.mock('@/lib/environment-access', () => ({
  getEnvironmentInfo: vi.fn(),
  getAccessDenialMessage: vi.fn(),
  trackEnvironmentAccess: vi.fn(),
  getReadinessState: vi.fn(),
}));

// Mock data
const mockEnvironmentInfo = {
  subdomain: null,
  isDevEnvironment: false,
  isEphemeralEnvironment: false,
  requiresDevAccess: false,
};

const mockThemeStore = {
  isThemeLoaded: true,
  isLocalStorageLoaded: true,
  getEffectiveColorTheme: vi.fn(() => 'purple'),
  getEffectiveSecondaryColorTheme: vi.fn(() => 'blue'),
  setUserSignedIn: vi.fn(),
  loadThemeFromLocalStorage: vi.fn(),
  syncUserThemePreferences: vi.fn(),
};

const mockUser = {
  id: 'user_123',
  publicMetadata: {
    theme: 'dark',
    colorTheme: 'purple',
    secondaryColorTheme: 'blue',
  },
};

describe('EnvironmentAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(environmentAccess.getEnvironmentInfo).mockReturnValue(
      mockEnvironmentInfo
    );
    vi.mocked(environmentAccess.getAccessDenialMessage).mockReturnValue(
      'Access restricted to this environment'
    );
    vi.mocked(environmentAccess.trackEnvironmentAccess).mockImplementation(
      () => {}
    );
    vi.mocked(environmentAccess.getReadinessState).mockReturnValue({
      isLocalStorageReady: true,
      isThemeReady: true,
      isUserReady: true,
      isPostHogReady: true,
      isFullyReady: true,
    });

    vi.mocked(themeStore.useThemeStore).mockReturnValue(mockThemeStore);
    vi.mocked(usePostHogHook.usePostHog).mockReturnValue({
      isInitialized: true,
    });
    vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(true);
    vi.mocked(clerkReact.useUser).mockReturnValue({
      isLoaded: true,
      user: mockUser,
      isSignedIn: true,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'vibechecc.com',
        href: 'https://vibechecc.com/',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('production environment', () => {
    it('renders children after animation in production', async () => {
      vi.useFakeTimers();

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Initially should show loading state
      expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();

      // Fast forward through all animation timers
      await act(async () => {
        vi.advanceTimersByTime(200); // Initial delay
        vi.advanceTimersByTime(2650); // Welcome display time
        vi.advanceTimersByTime(1300); // Fade out animation
      });

      // Content should be visible after animation
      expect(screen.getByTestId('app-content')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('shows welcome animation with app name', async () => {
      vi.useFakeTimers();

      const { container } = render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Should show vibechecc text
      expect(screen.getByText(/v/)).toBeInTheDocument();

      // Fast forward to show welcome message
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Welcome message should be visible
      const welcomeText = container.textContent?.toLowerCase() || '';
      expect(welcomeText).toContain('vibechecc');

      vi.useRealTimers();
    });
  });

  describe('localhost access', () => {
    it('allows access on localhost without checking feature flags', async () => {
      vi.useFakeTimers();

      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          href: 'http://localhost:3000/',
        },
        writable: true,
        configurable: true,
      });

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(false);

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward through animation
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('app-content')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('allows access on 127.0.0.1', async () => {
      vi.useFakeTimers();

      Object.defineProperty(window, 'location', {
        value: {
          hostname: '127.0.0.1',
          href: 'http://127.0.0.1:3000/',
        },
        writable: true,
        configurable: true,
      });

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward through animation
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('app-content')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('dev environment access', () => {
    beforeEach(() => {
      vi.mocked(environmentAccess.getEnvironmentInfo).mockReturnValue({
        subdomain: 'dev',
        isDevEnvironment: true,
        isEphemeralEnvironment: false,
        requiresDevAccess: true,
      });
    });

    it('allows access when dev feature flag is enabled', async () => {
      vi.useFakeTimers();

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(true);

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward through animation
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('app-content')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('denies access when dev feature flag is disabled', async () => {
      vi.useFakeTimers();

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(false);
      vi.mocked(environmentAccess.getAccessDenialMessage).mockReturnValue(
        'this is a development environment with restricted access'
      );

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward to show access denied
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
      expect(screen.getByText('access restricted')).toBeInTheDocument();
      expect(screen.getByText(/development environment/)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('shows custom fallback when access is denied', async () => {
      vi.useFakeTimers();

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(false);

      render(
        <EnvironmentAccessGuard
          fallback={<div data-testid="custom-fallback">Custom Fallback</div>}
        >
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward to show fallback
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('ephemeral environment access', () => {
    beforeEach(() => {
      vi.mocked(environmentAccess.getEnvironmentInfo).mockReturnValue({
        subdomain: 'pr-123',
        isDevEnvironment: false,
        isEphemeralEnvironment: true,
        requiresDevAccess: true,
      });
    });

    it('shows correct message for PR environments', async () => {
      vi.useFakeTimers();

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(false);
      vi.mocked(environmentAccess.getAccessDenialMessage).mockReturnValue(
        'this is a preview environment for testing pull requests'
      );

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward to show access denied
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText(/preview environment/)).toBeInTheDocument();
      expect(screen.getByText('pr-123')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('loading states', () => {
    it('shows loading animation when PostHog is not ready', async () => {
      vi.mocked(environmentAccess.getReadinessState).mockReturnValue({
        isLocalStorageReady: true,
        isThemeReady: true,
        isUserReady: true,
        isPostHogReady: false,
        isFullyReady: false,
      });

      const { container } = render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Should show loading state with pulsing dots
      const loadingDots = container.querySelectorAll('.animate-pulse-dot');
      expect(loadingDots.length).toBe(3);
      expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
    });

    it('shows loading when user is not loaded', async () => {
      vi.mocked(clerkReact.useUser).mockReturnValue({
        isLoaded: false,
        user: null,
        isSignedIn: false,
      });

      vi.mocked(environmentAccess.getReadinessState).mockReturnValue({
        isLocalStorageReady: true,
        isThemeReady: true,
        isUserReady: false,
        isPostHogReady: true,
        isFullyReady: false,
      });

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
    });

    it('handles timeout when services fail to initialize', async () => {
      vi.useFakeTimers();

      vi.mocked(environmentAccess.getReadinessState).mockReturnValue({
        isLocalStorageReady: true,
        isThemeReady: false,
        isUserReady: false,
        isPostHogReady: false,
        isFullyReady: false,
      });

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Content should not be visible initially
      expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();

      // Fast forward past timeout (10 seconds)
      await act(async () => {
        vi.advanceTimersByTime(11000);
      });

      // Should show content with warning after timeout
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(
        screen.getByText(/authentication service is taking longer/)
      ).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('theme integration', () => {
    it('loads theme from localStorage on mount', () => {
      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      expect(mockThemeStore.loadThemeFromLocalStorage).toHaveBeenCalled();
    });

    it('syncs user theme preferences when user is loaded', () => {
      const userWithTheme = {
        ...mockUser,
        publicMetadata: {
          theme: 'dark',
          colorTheme: 'purple',
          secondaryColorTheme: 'blue',
        },
      };

      vi.mocked(clerkReact.useUser).mockReturnValue({
        isLoaded: true,
        user: userWithTheme,
        isSignedIn: true,
      });

      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      expect(mockThemeStore.syncUserThemePreferences).toHaveBeenCalledWith(
        'dark',
        'purple',
        'blue'
      );
    });

    it('updates user signed-in state in theme store', () => {
      vi.mocked(clerkReact.useUser).mockReturnValue({
        isLoaded: true,
        user: mockUser,
        isSignedIn: true,
      });

      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      expect(mockThemeStore.setUserSignedIn).toHaveBeenCalledWith(true);
    });
  });

  describe('environment tracking', () => {
    it('tracks access attempts when PostHog is ready', () => {
      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(true);

      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      expect(environmentAccess.trackEnvironmentAccess).toHaveBeenCalledWith(
        true,
        mockEnvironmentInfo
      );
    });

    it('does not track when PostHog is not ready', () => {
      vi.mocked(usePostHogHook.usePostHog).mockReturnValue({
        isInitialized: false,
      });
      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(undefined);

      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      expect(environmentAccess.trackEnvironmentAccess).not.toHaveBeenCalled();
    });
  });

  describe('welcome animation', () => {
    it('displays app name with animation', async () => {
      vi.useFakeTimers();

      const { container } = render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Check for animated app name letters
      const appNameLetters = container.querySelectorAll('.animate-pulse-text');
      expect(appNameLetters.length).toBeGreaterThan(0);

      // Each letter should have a different animation delay
      const delays = Array.from(appNameLetters).map((el) => {
        const style = el.getAttribute('style') || '';
        const match = style.match(/animation-delay:\s*(\d+)ms/);
        return match ? match[1] : '0';
      });

      // Should have multiple unique delays
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);

      vi.useRealTimers();
    });

    it('shows tagline during welcome', async () => {
      vi.useFakeTimers();

      const { container } = render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward to show welcome
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Should contain one of the taglines
      const possibleTaglines = [
        'what am i doing here',
        'professional vibe checker',
        "careful don't vibe too hard",
        "it's a vibe",
        'no chill only vibes',
        'vibe now or vibe later',
        "it's a thing to do",
        'the nothing app',
        'who told you about this',
      ];

      const welcomeText = container.textContent?.toLowerCase() || '';
      const hasTagline = possibleTaglines.some((tagline) =>
        welcomeText.includes(tagline.replace(/'/g, ''))
      );
      expect(hasTagline).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('sign-in button', () => {
    it('shows sign-in button when access is denied', async () => {
      vi.useFakeTimers();

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(false);
      vi.mocked(environmentAccess.getEnvironmentInfo).mockReturnValue({
        subdomain: 'dev',
        isDevEnvironment: true,
        isEphemeralEnvironment: false,
        requiresDevAccess: true,
      });

      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward to show access denied
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('sign in to vibechecc')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('includes environment name in access denied screen', async () => {
      vi.useFakeTimers();

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(false);
      vi.mocked(environmentAccess.getEnvironmentInfo).mockReturnValue({
        subdomain: 'dev',
        isDevEnvironment: true,
        isEphemeralEnvironment: false,
        requiresDevAccess: true,
      });

      render(
        <EnvironmentAccessGuard>
          <div>Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward to show access denied
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('dev')).toBeInTheDocument();
      expect(screen.getByText(/environment:/)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('edge cases', () => {
    it('handles undefined feature flag gracefully', async () => {
      vi.useFakeTimers();

      vi.mocked(posthogReact.useFeatureFlagEnabled).mockReturnValue(undefined);

      render(
        <EnvironmentAccessGuard>
          <div data-testid="app-content">App Content</div>
        </EnvironmentAccessGuard>
      );

      // Fast forward through animations or timeout
      await act(async () => {
        vi.advanceTimersByTime(11000);
      });

      // Should eventually render content (defaults to allowed in production or timeout)
      expect(screen.getByTestId('app-content')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('handles missing user data gracefully', () => {
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

    it('throws error when getReadinessState fails', () => {
      // Mock console.error to suppress error output in test
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Simulate getReadinessState throwing an error
      vi.mocked(environmentAccess.getReadinessState).mockImplementation(() => {
        throw new Error('Failed to get readiness state');
      });

      // Component should throw the error
      expect(() => {
        render(
          <EnvironmentAccessGuard>
            <div data-testid="fallback-content">Fallback Content</div>
          </EnvironmentAccessGuard>
        );
      }).toThrow('Failed to get readiness state');

      consoleErrorSpy.mockRestore();
    });
  });
});
