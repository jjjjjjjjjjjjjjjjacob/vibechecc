/// <reference lib="dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentSubdomain,
  getEnvironmentInfo,
  hasDevEnvironmentAccess,
  canAccessCurrentEnvironment,
  getAccessDenialMessage,
} from '@/lib/environment-access';
import { analytics } from '@/lib/posthog';

// Mock PostHog analytics
vi.mock('@/lib/posthog', () => ({
  analytics: {
    isInitialized: vi.fn(),
    isFeatureEnabled: vi.fn(),
  },
}));

const mockAnalytics = analytics as any;

// Mock window.location
const mockLocation = (hostname: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      hostname,
      href: `https://${hostname}/`,
    },
    writable: true,
  });
};

describe('environment access utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentSubdomain', () => {
    it('returns null for localhost', () => {
      mockLocation('localhost:3000');
      expect(getCurrentSubdomain()).toBeNull();
    });

    it('returns null for main domain', () => {
      mockLocation('vibechecc.io');
      expect(getCurrentSubdomain()).toBeNull();
    });

    it('returns subdomain for dev environment', () => {
      mockLocation('dev.vibechecc.io');
      expect(getCurrentSubdomain()).toBe('dev');
    });

    it('returns subdomain for PR environment', () => {
      mockLocation('pr-123.vibechecc.io');
      expect(getCurrentSubdomain()).toBe('pr-123');
    });
  });

  describe('getEnvironmentInfo', () => {
    it('identifies dev environment correctly', () => {
      mockLocation('dev.vibechecc.io');
      const info = getEnvironmentInfo();

      expect(info.subdomain).toBe('dev');
      expect(info.isDevEnvironment).toBe(true);
      expect(info.isEphemeralEnvironment).toBe(false);
      expect(info.requiresDevAccess).toBe(true);
    });

    it('identifies ephemeral environment correctly', () => {
      mockLocation('pr-456.vibechecc.io');
      const info = getEnvironmentInfo();

      expect(info.subdomain).toBe('pr-456');
      expect(info.isDevEnvironment).toBe(false);
      expect(info.isEphemeralEnvironment).toBe(true);
      expect(info.requiresDevAccess).toBe(true);
    });

    it('identifies production environment correctly', () => {
      mockLocation('vibechecc.io');
      const info = getEnvironmentInfo();

      expect(info.subdomain).toBeNull();
      expect(info.isDevEnvironment).toBe(false);
      expect(info.isEphemeralEnvironment).toBe(false);
      expect(info.requiresDevAccess).toBe(false);
    });
  });

  describe('hasDevEnvironmentAccess', () => {
    it('returns false when PostHog is not initialized', () => {
      mockAnalytics.isInitialized.mockReturnValue(false);
      expect(hasDevEnvironmentAccess()).toBe(false);
    });

    it('returns feature flag value when PostHog is initialized', () => {
      mockAnalytics.isInitialized.mockReturnValue(true);
      mockAnalytics.isFeatureEnabled.mockReturnValue(true);

      expect(hasDevEnvironmentAccess()).toBe(true);
      expect(mockAnalytics.isFeatureEnabled).toHaveBeenCalledWith(
        'dev-environment-access'
      );
    });
  });

  describe('canAccessCurrentEnvironment', () => {
    it('allows access to production environment', () => {
      mockLocation('vibechecc.io');
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('restricts access to dev environment without feature flag', () => {
      mockLocation('dev.vibechecc.io');
      mockAnalytics.isInitialized.mockReturnValue(true);
      mockAnalytics.isFeatureEnabled.mockReturnValue(false);

      expect(canAccessCurrentEnvironment()).toBe(false);
    });

    it('allows access to dev environment with feature flag', () => {
      mockLocation('dev.vibechecc.io');
      mockAnalytics.isInitialized.mockReturnValue(true);
      mockAnalytics.isFeatureEnabled.mockReturnValue(true);

      expect(canAccessCurrentEnvironment()).toBe(true);
    });
  });

  describe('getAccessDenialMessage', () => {
    it('returns dev environment message', () => {
      mockLocation('dev.vibechecc.io');
      const message = getAccessDenialMessage();
      expect(message).toContain('development environment');
    });

    it('returns ephemeral environment message', () => {
      mockLocation('pr-123.vibechecc.io');
      const message = getAccessDenialMessage();
      expect(message).toContain('preview environment');
    });
  });
});
