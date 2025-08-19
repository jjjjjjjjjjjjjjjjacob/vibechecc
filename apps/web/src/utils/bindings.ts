import { createServerFn } from '@tanstack/react-start';

// Development: Cache wrangler proxy for Cloudflare bindings
let devEnv: Record<string, string | undefined> | null = null;
let devEnvPromise: Promise<void> | null = null;

// Initialize dev environment once at startup (lazy initialization)
function initDevEnv() {
  if (!devEnvPromise && import.meta.env.DEV && typeof window === 'undefined') {
    devEnvPromise = (async () => {
      try {
        const { getPlatformProxy } = await import('wrangler');
        const proxy = await getPlatformProxy();
        devEnv = proxy.env as Record<string, string | undefined>;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to initialize Wrangler proxy:', error);
      }
    })();
  }
  return devEnvPromise;
}

/**
 * Get environment variables (server-side only)
 * In development: Uses Wrangler's getPlatformProxy
 * In production: Uses process.env (populated by Cloudflare)
 */
export function getEnv(): Record<string, string | undefined> {
  if (typeof window !== 'undefined') {
    // Client-side: Use Vite's import.meta.env
    return import.meta.env as Record<string, string | undefined>;
  }

  // Server-side: Initialize dev environment if needed
  if (import.meta.env.DEV) {
    // Trigger initialization (non-blocking)
    initDevEnv();
    // Return dev env if available, otherwise fall back to process.env
    if (devEnv) {
      return devEnv;
    }
  }

  return process.env as Record<string, string | undefined>;
}

/**
 * App configuration with defaults
 * This is the single source of truth for app configuration
 */
function createAppConfig() {
  // Use import.meta.env directly for client-safe values
  const env = typeof window !== 'undefined' ? import.meta.env : getEnv();

  const appName = String(env.VITE_APP_NAME || 'vibechecc');
  const appDomain = String(env.VITE_APP_DOMAIN || 'vibechecc.com');
  const appSubdomain = env.VITE_APP_SUBDOMAIN
    ? String(env.VITE_APP_SUBDOMAIN)
    : undefined;
  const appUrl = `https://${appSubdomain ? `${appSubdomain}.` : ''}${appDomain}`;
  const appTwitterHandle = String(env.VITE_APP_TWITTER_HANDLE || '@vibechecc');

  return {
    name: appName,
    domain: appDomain,
    subdomain: appSubdomain,
    url: appUrl,
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

    // Environment variables for direct access
    env: {
      VITE_APP_NAME: String(env.VITE_APP_NAME || 'vibechecc'),
      VITE_APP_DOMAIN: String(env.VITE_APP_DOMAIN || 'vibechecc.com'),
      VITE_APP_SUBDOMAIN: env.VITE_APP_SUBDOMAIN
        ? String(env.VITE_APP_SUBDOMAIN)
        : undefined,
      VITE_APP_TWITTER_HANDLE: String(
        env.VITE_APP_TWITTER_HANDLE || '@vibechecc'
      ),
      VITE_CONVEX_URL: String(env.VITE_CONVEX_URL || ''),
      VITE_CLERK_PUBLISHABLE_KEY: String(env.VITE_CLERK_PUBLISHABLE_KEY || ''),
      VITE_POSTHOG_API_KEY: String(env.VITE_POSTHOG_API_KEY || ''),
      VITE_POSTHOG_API_HOST: String(
        env.VITE_POSTHOG_API_HOST || 'https://us.i.posthog.com'
      ),
      VITE_POSTHOG_PROJECT_ID: env.VITE_POSTHOG_PROJECT_ID
        ? String(env.VITE_POSTHOG_PROJECT_ID)
        : undefined,
      VITE_POSTHOG_REGION: String(env.VITE_POSTHOG_REGION || 'US Cloud'),
    },
  } as const;
}

// Create the configuration
export const APP_CONFIG = createAppConfig();

// Export individual items for convenience
export const APP_NAME = APP_CONFIG.name;
export const APP_DOMAIN = APP_CONFIG.domain;
export const APP_SUBDOMAIN = APP_CONFIG.subdomain;
export const APP_URL = APP_CONFIG.url;
export const APP_TWITTER_HANDLE = APP_CONFIG.twitterHandle;

/**
 * Server function to get server-side environment variables
 * Only use this if you REALLY need server-side env access from the client
 */
export const getServerEnv = createServerFn({ method: 'GET' }).handler(
  async () => {
    const env = getEnv();

    // Only return VITE_ prefixed (public) variables for safety
    const publicEnv: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(env)) {
      if (key.startsWith('VITE_')) {
        publicEnv[key] = value;
      }
    }

    return publicEnv;
  }
);

/**
 * Server-only: Get all environment variables including secrets
 * NEVER expose the result of this function to the client
 */
export function getServerBindings() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerBindings() cannot be called from client code');
  }

  return getEnv();
}
