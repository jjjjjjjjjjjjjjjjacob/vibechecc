/**
 * tests environment access helpers with localhost edge cases
 * these tests mock window.location to simulate various hostnames
 * and ensure the environment helpers behave correctly
 */
/// <reference lib="dom" />

// vitest provides the testing primitives for structuring assertions
import { describe, it, expect, beforeEach, vi } from 'vitest';
// functions under test: read environment and gating rules
import {
  getEnvironmentInfo,
  canAccessCurrentEnvironment,
} from '@/lib/environment-access';

// helper: replace window.location with a custom hostname
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
    // reset mocks so tests don't bleed state
    vi.clearAllMocks();
  });

  describe('localhost development access', () => {
    it('should allow access for localhost:3000', () => {
      // simulate the dev server hostname
      mockLocation('localhost:3000');
      // expectation: localhost is always accessible
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('should allow access for 127.0.0.1:3000', () => {
      // simulate numeric loopback
      mockLocation('127.0.0.1:3000');
      // expectation: treated the same as localhost
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('should allow access for localhost', () => {
      // cover bare localhost with no port
      mockLocation('localhost');
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('should not require dev access for localhost', () => {
      // when running locally the helper should mark env as normal
      mockLocation('localhost:3000');
      const envInfo = getEnvironmentInfo();

      // verify all environment flags are unset
      expect(envInfo.subdomain).toBeNull();
      expect(envInfo.requiresDevAccess).toBe(false);
      expect(envInfo.isDevEnvironment).toBe(false);
      expect(envInfo.isEphemeralEnvironment).toBe(false);
    });
  });

  describe('production environment access', () => {
    it('should allow access to production domain', () => {
      // production domain must always be accessible
      mockLocation('viberatr.io');
      expect(canAccessCurrentEnvironment()).toBe(true);
    });

    it('should restrict access to dev subdomain when feature flag is off', () => {
      // point location at a dev subdomain
      mockLocation('dev.viberatr.io');

      // mock posthog to signal flag disabled
      vi.doMock('@/lib/posthog', () => ({
        analytics: {
          isInitialized: vi.fn().mockReturnValue(true),
          isFeatureEnabled: vi.fn().mockReturnValue(false),
        },
      }));

      // expect helper to require dev access and mark env correctly
      const envInfo = getEnvironmentInfo();
      expect(envInfo.requiresDevAccess).toBe(true);
      expect(envInfo.isDevEnvironment).toBe(true);
    });
  });
});
