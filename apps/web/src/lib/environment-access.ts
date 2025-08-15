import { analytics } from './posthog';
import { APP_DOMAIN } from '@/config/app';

/**
 * Utility functions for environment-based access control and theme loading management
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

  // For production domains like dev.example.com, pr-123.example.com
  // Extract subdomain based on the configured app domain
  // Normalize APP_DOMAIN by stripping protocol if present
  const baseDomain = APP_DOMAIN.replace(/^https?:\/\//, '');
  const baseDomainParts = baseDomain.split('.');

  // Check if hostname ends with base domain and has more parts
  if (hostname.endsWith(baseDomain)) {
    // Only return subdomain if there are more parts than base domain
    // and the first part is not "www" (treat "www" as main domain)
    if (parts.length > baseDomainParts.length) {
      const firstPart = parts[0];
      if (firstPart === 'www') {
        return null; // Treat www as main domain, not a subdomain
      }
      return firstPart;
    }
  }

  return null;
}

/**
 * Analyzes the current environment based on subdomain
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const subdomain = getCurrentSubdomain();

  const isDevEnvironment = subdomain === 'dev' || subdomain === null;
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
 * Note: Feature flag checking has been moved to React components using useFeatureFlagEnabled hook
 * This provides better reactivity and automatic updates when flags change
 */

/**
 * Gets a user-friendly message for access denial
 */
export function getAccessDenialMessage(envInfo?: EnvironmentInfo): string {
  const env = envInfo || getEnvironmentInfo();

  if (env.isDevEnvironment) {
    return 'Access to the development environment is restricted to authorized developers.';
  }

  if (env.isEphemeralEnvironment) {
    return 'Access to this preview environment is restricted to authorized developers.';
  }

  return 'Access to this environment is restricted.';
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
  });
}

/**
 * Simple readiness state tracking
 */
export interface ReadinessState {
  isThemeReady: boolean;
  isPostHogReady: boolean;
  isFullyReady: boolean;
}

/**
 * Determines if theme system is ready for rendering
 * Theme is ready when localStorage has been checked and user preferences synced
 */
export function isThemeReady(
  isLocalStorageLoaded: boolean,
  isThemeLoaded: boolean,
  isUserLoaded: boolean
): boolean {
  // Theme is ready when:
  // 1. localStorage has been checked
  // 2. User loading state is settled (logged in/out)
  // 3. Theme preferences have been loaded/synced
  return isLocalStorageLoaded && isThemeLoaded && isUserLoaded;
}

/**
 * Determines if PostHog access check is complete
 */
export function isPostHogReady(
  isPostHogInitialized: boolean,
  hasEnvironmentAccess: boolean | null
): boolean {
  // During SSR, return false to ensure consistent initial render
  if (typeof window === 'undefined') {
    return false;
  }

  // For localhost, PostHog still needs to be initialized
  // This ensures consistent state between server and client
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Even on localhost, respect the initialization state for consistency
    return isPostHogInitialized;
  }

  // For production environments, both PostHog and access check must be complete
  return isPostHogInitialized && hasEnvironmentAccess !== null;
}

/**
 * Gets overall readiness state
 */
export function getReadinessState(
  isLocalStorageLoaded: boolean,
  isThemeLoaded: boolean,
  isUserLoaded: boolean,
  isPostHogInitialized: boolean,
  hasEnvironmentAccess: boolean | null
): ReadinessState {
  const isThemeReady_ = isThemeReady(
    isLocalStorageLoaded,
    isThemeLoaded,
    isUserLoaded
  );
  const isPostHogReady_ = isPostHogReady(
    isPostHogInitialized,
    hasEnvironmentAccess
  );
  const isFullyReady = isThemeReady_ && isPostHogReady_;

  return {
    isThemeReady: isThemeReady_,
    isPostHogReady: isPostHogReady_,
    isFullyReady,
  };
}
