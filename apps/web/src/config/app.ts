/**
 * App configuration that can be customized via environment variables
 * This allows building the app with different names/branding
 */

import { getRuntimeConfig, type PublicEnv } from '@/lib/env/runtime-config';

/**
 * Get app configuration from runtime environment
 * Falls back to build-time values if runtime config not available
 */
function getAppConfig() {
  let config: PublicEnv;

  try {
    // Try to get runtime config (which may read from Worker env)
    config = getRuntimeConfig();
  } catch {
    // Fall back to static build-time values
    config = {
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'vibechecc',
      VITE_APP_DOMAIN: import.meta.env.VITE_APP_DOMAIN || 'vibechecc.com',
      VITE_APP_TWITTER_HANDLE:
        import.meta.env.VITE_APP_TWITTER_HANDLE || '@vibechecc',
      VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL || '',
      VITE_CLERK_PUBLISHABLE_KEY:
        import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
      VITE_POSTHOG_API_KEY: import.meta.env.VITE_POSTHOG_API_KEY || '',
      VITE_POSTHOG_API_HOST:
        import.meta.env.VITE_POSTHOG_API_HOST || 'https://us.i.posthog.com',
      VITE_POSTHOG_PROJECT_ID: import.meta.env.VITE_POSTHOG_PROJECT_ID,
      VITE_POSTHOG_REGION: import.meta.env.VITE_POSTHOG_REGION || 'US Cloud',
    };
  }

  const appName = config.VITE_APP_NAME;
  const appDomain = config.VITE_APP_DOMAIN;
  const appTwitterHandle = config.VITE_APP_TWITTER_HANDLE;

  return {
    name: appName,
    domain: appDomain,
    url: `https://${appDomain}`,
    twitterHandle: appTwitterHandle,

    // Display names
    displayName: appName,
    tagline: 'share and discover vibes',
    description: `${appName} is a platform for sharing and discovering vibes. rate, react, and share your favorite vibes with the world.`,

    // SEO defaults
    seo: {
      defaultTitle: `${appName} | share and discover vibes`,
      titleTemplate: `%s | ${appName}`,
      defaultDescription: `${appName} is a platform for sharing and discovering vibes. rate, react, and share your favorite vibes with the world.`,
    },

    // Legal/Policy pages
    legal: {
      privacyTitle: `privacy policy | ${appName}`,
      privacyDescription: `privacy policy and data protection practices for ${appName} platform`,
      termsTitle: `terms of service | ${appName}`,
      termsDescription: `terms of service and usage guidelines for ${appName} platform`,
    },

    // Include the raw config for other uses
    env: config,
  } as const;
}

// Create the configuration
export const APP_CONFIG = getAppConfig();

// Export individual items for convenience
export const APP_NAME = APP_CONFIG.name;
export const APP_DOMAIN = APP_CONFIG.domain;
export const APP_URL = APP_CONFIG.url;
export const APP_TWITTER_HANDLE = APP_CONFIG.twitterHandle;
