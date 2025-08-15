/// <reference lib="dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEnvironmentInfo } from '@/lib/environment-access';

// Mock window.location
const mockLocation = (hostname: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      hostname,
      href: `http://${hostname}/`,
    },
    writable: true,
  });
};

describe('environment access - localhost fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('localhost development access', () => {
    // Note: canAccessCurrentEnvironment has been moved to useEnvironmentAccess hook
    // These tests now verify that localhost doesn't require dev access
    it('should not require dev access for localhost:3000', () => {
      mockLocation('localhost:3000');
      const envInfo = getEnvironmentInfo();
      expect(envInfo.requiresDevAccess).toBe(false);
    });

    it('should not require dev access for 127.0.0.1:3000', () => {
      mockLocation('127.0.0.1:3000');
      const envInfo = getEnvironmentInfo();
      expect(envInfo.requiresDevAccess).toBe(false);
    });

    it('should not require dev access for localhost', () => {
      mockLocation('localhost');
      const envInfo = getEnvironmentInfo();
      expect(envInfo.requiresDevAccess).toBe(false);
    });

    it('should not require dev access for localhost', () => {
      mockLocation('localhost:3000');
      const envInfo = getEnvironmentInfo();

      expect(envInfo.subdomain).toBeNull();
      expect(envInfo.requiresDevAccess).toBe(false);
      expect(envInfo.isDevEnvironment).toBe(false);
      expect(envInfo.isEphemeralEnvironment).toBe(false);
    });
  });

  describe('production environment access', () => {
    it('should not require dev access for production domain', () => {
      mockLocation('vibechecc.com');
      const envInfo = getEnvironmentInfo();
      expect(envInfo.requiresDevAccess).toBe(false);
    });

    it('should restrict access to dev subdomain (when no feature flag)', () => {
      mockLocation('dev.vibechecc.com');

      // Mock PostHog to return false for the feature flag
      vi.doMock('@/lib/posthog', () => ({
        analytics: {
          isInitialized: vi.fn().mockReturnValue(true),
          isFeatureEnabled: vi.fn().mockReturnValue(false),
        },
      }));

      const envInfo = getEnvironmentInfo();
      expect(envInfo.requiresDevAccess).toBe(true);
      expect(envInfo.isDevEnvironment).toBe(true);
    });
  });
});
