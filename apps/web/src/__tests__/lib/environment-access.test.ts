/// <reference lib="dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentSubdomain,
  getEnvironmentInfo,
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

const _mockAnalytics = analytics as any;

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
      mockLocation('vibechecc.com');
      expect(getCurrentSubdomain()).toBeNull();
    });

    it('returns null for www.vibechecc.com (www is not a subdomain)', () => {
      mockLocation('www.vibechecc.com');
      expect(getCurrentSubdomain()).toBeNull();
    });

    it('returns subdomain for dev environment', () => {
      mockLocation('dev.vibechecc.com');
      expect(getCurrentSubdomain()).toBe('dev');
    });

    it('returns subdomain for PR environment', () => {
      mockLocation('pr-123.vibechecc.com');
      expect(getCurrentSubdomain()).toBe('pr-123');
    });
  });

  describe('getEnvironmentInfo', () => {
    it('identifies dev environment correctly', () => {
      mockLocation('dev.vibechecc.com');
      const info = getEnvironmentInfo();

      expect(info.subdomain).toBe('dev');
      expect(info.isDevEnvironment).toBe(true);
      expect(info.isEphemeralEnvironment).toBe(false);
      expect(info.requiresDevAccess).toBe(true);
    });

    it('identifies ephemeral environment correctly', () => {
      mockLocation('pr-456.vibechecc.com');
      const info = getEnvironmentInfo();

      expect(info.subdomain).toBe('pr-456');
      expect(info.isDevEnvironment).toBe(false);
      expect(info.isEphemeralEnvironment).toBe(true);
      expect(info.requiresDevAccess).toBe(true);
    });

    it('identifies production environment correctly', () => {
      mockLocation('vibechecc.com');
      const info = getEnvironmentInfo();

      expect(info.subdomain).toBeNull();
      expect(info.isDevEnvironment).toBe(false);
      expect(info.isEphemeralEnvironment).toBe(false);
      expect(info.requiresDevAccess).toBe(false);
    });
  });

  // Note: hasDevEnvironmentAccess and canAccessCurrentEnvironment have been moved
  // to the useEnvironmentAccess React hook for better reactivity

  describe('getAccessDenialMessage', () => {
    it('returns dev environment message', () => {
      mockLocation('dev.vibechecc.com');
      const message = getAccessDenialMessage();
      expect(message).toContain('development environment');
    });

    it('returns ephemeral environment message', () => {
      mockLocation('pr-123.vibechecc.com');
      const message = getAccessDenialMessage();
      expect(message).toContain('preview environment');
    });
  });
});
