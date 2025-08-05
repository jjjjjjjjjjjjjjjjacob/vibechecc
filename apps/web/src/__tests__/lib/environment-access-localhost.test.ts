/// <reference lib="dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEnvironmentInfo,
  canAccessCurrentEnvironment,
} from '@/lib/environment-access';

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
    it('should allow access for localhost:3000', () => {
      mockLocation('localhost:3000');
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('should allow access for 127.0.0.1:3000', () => {
      mockLocation('127.0.0.1:3000');
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('should allow access for localhost', () => {
      mockLocation('localhost');
      expect(canAccessCurrentEnvironment()).toBe(true);
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
    it('should allow access to production domain', () => {
      mockLocation('viberatr.io');
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('should restrict access to dev subdomain (when no feature flag)', () => {
      mockLocation('dev.viberatr.io');

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
