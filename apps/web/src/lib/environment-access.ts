import { analytics } from './posthog';

/**
 * Utility functions for environment-based access control
 */

export interface EnvironmentInfo {
  subdomain: string | null;
  isDevEnvironment: boolean;
  isEphemeralEnvironment: boolean;
  requiresDevAccess: boolean;
}

/**
 * Gets the current subdomain from the window location
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // For localhost development, subdomain might be in a different format
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return null; // No subdomain restrictions for localhost
  }

  // For production domains like dev.viberatr.io, pr-123.viberatr.io
  if (parts.length > 2) {
    return parts[0];
  }

  return null;
}

/**
 * Analyzes the current environment based on subdomain
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const subdomain = getCurrentSubdomain();

  const isDevEnvironment = subdomain === 'dev';
  const isEphemeralEnvironment = subdomain?.startsWith('pr-') ?? false;
  const requiresDevAccess = isDevEnvironment || isEphemeralEnvironment;

  return {
    subdomain,
    isDevEnvironment,
    isEphemeralEnvironment,
    requiresDevAccess,
  };
}

/**
 * Checks if the current user has access to dev environments
 * Uses PostHog feature flag: 'dev-environment-access'
 */
export function hasDevEnvironmentAccess(): boolean {
  if (!analytics.isInitialized()) {
    return false;
  }

  return analytics.isFeatureEnabled('dev-environment-access');
}

/**
 * Checks if the user should be allowed to access the current environment
 */
export function canAccessCurrentEnvironment(): boolean {
  // Always allow access for localhost development
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return true;
    }
  }

  const envInfo = getEnvironmentInfo();

  // If it's not a restricted environment, allow access
  if (!envInfo.requiresDevAccess) {
    return true;
  }

  // For dev/ephemeral environments, check the feature flag
  return hasDevEnvironmentAccess();
}

/**
 * Gets a user-friendly message for access denial
 */
export function getAccessDenialMessage(envInfo?: EnvironmentInfo): string {
  const env = envInfo || getEnvironmentInfo();

  if (env.isDevEnvironment) {
    return 'access to the development environment is restricted to authorized developers.';
  }

  if (env.isEphemeralEnvironment) {
    return 'access to this preview environment is restricted to authorized developers.';
  }

  return 'access to this environment is restricted.';
}

/**
 * Tracks access attempts for analytics
 */
export function trackEnvironmentAccess(
  allowed: boolean,
  envInfo?: EnvironmentInfo
) {
  const env = envInfo || getEnvironmentInfo();

  analytics.capture('environment_access_attempt', {
    subdomain: env.subdomain,
    is_dev_environment: env.isDevEnvironment,
    is_ephemeral_environment: env.isEphemeralEnvironment,
    requires_dev_access: env.requiresDevAccess,
    access_granted: allowed,
    has_feature_flag: hasDevEnvironmentAccess(),
  });
}
