import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import {
  checkDevEnvironmentAccess,
  getUserFeatureFlags,
} from '@/lib/posthog-server';

/**
 * Server function to check environment access
 * This runs on the server and checks PostHog feature flags
 */
export const checkEnvironmentAccess = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    hasAccess: boolean;
    userId: string | null;
    isFeatureFlagLoaded: boolean;
    isProduction: boolean;
    timestamp: number;
  }> => {
    const request = getWebRequest();

    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';

    // In development, always allow access
    if (!isProduction) {
      return {
        hasAccess: true,
        userId: null,
        isFeatureFlagLoaded: true,
        isProduction: false,
        timestamp: Date.now(),
      };
    }

    if (!request) {
      return {
        hasAccess: false,
        userId: null,
        isFeatureFlagLoaded: false,
        isProduction,
        timestamp: Date.now(),
      };
    }

    try {
      // Check access via PostHog feature flag
      const accessData = await checkDevEnvironmentAccess(request);

      return {
        ...accessData,
        isProduction,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to check environment access:', error);

      // On error, deny access in production
      return {
        hasAccess: false,
        userId: null,
        isFeatureFlagLoaded: false,
        isProduction,
        timestamp: Date.now(),
      };
    }
  }
);

/**
 * Server function to get all feature flags for the current user
 * Useful for bootstrapping client-side feature flags
 */
export const getFeatureFlags = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    flags: Record<string, boolean | string>;
    userId: string | null;
    isLoaded: boolean;
    timestamp: number;
  }> => {
    const request = getWebRequest();

    if (!request) {
      return {
        flags: {},
        userId: null,
        isLoaded: false,
        timestamp: Date.now(),
      };
    }

    try {
      const flagData = await getUserFeatureFlags(request);

      return {
        ...flagData,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get feature flags:', error);

      return {
        flags: {},
        userId: null,
        isLoaded: false,
        timestamp: Date.now(),
      };
    }
  }
);
