// Environment access control utilities
// This module provides functionality to restrict access to dev and ephemeral environments

export interface EnvironmentInfo {
  subdomain?: string;
  hostname: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isEphemeral: boolean;
}

/**
 * Get current environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  if (typeof window === 'undefined') {
    return {
      hostname: 'localhost',
      isProduction: false,
      isDevelopment: true,
      isEphemeral: false,
    };
  }

  const hostname = window.location.hostname;
  const isProduction =
    hostname === 'viberatr.io' || hostname === 'www.viberatr.io';
  const isDevelopment =
    hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isEphemeral = !isProduction && !isDevelopment;

  let subdomain: string | undefined;
  if (isEphemeral) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  return {
    subdomain,
    hostname,
    isProduction,
    isDevelopment,
    isEphemeral,
  };
}

/**
 * Check if current user can access the current environment
 * For now, allow all access - this can be enhanced with PostHog feature flags
 */
export function canAccessCurrentEnvironment(): boolean {
  const env = getEnvironmentInfo();

  // Always allow access to production and development
  if (env.isProduction || env.isDevelopment) {
    return true;
  }

  // For ephemeral environments, allow access for now
  // This can be enhanced with PostHog cohort checks
  return true;
}

/**
 * Get access denial message based on environment
 */
export function getAccessDenialMessage(envInfo: EnvironmentInfo): string {
  if (envInfo.isEphemeral) {
    return `access to ${envInfo.subdomain || 'this'} environment is restricted. please sign in with an authorized account.`;
  }

  return 'access to this environment is restricted. please contact an administrator.';
}

/**
 * Track environment access attempt
 */
export function trackEnvironmentAccess(
  allowed: boolean,
  envInfo: EnvironmentInfo
): void {
  // PostHog tracking can be added here when needed
  console.log('Environment access:', { allowed, envInfo });
}
