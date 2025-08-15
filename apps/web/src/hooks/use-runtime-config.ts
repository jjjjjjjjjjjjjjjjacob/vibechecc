import { useQuery } from '@tanstack/react-query';
import { fetchRuntimeConfig } from '@/lib/env/server-functions';
import type { PublicEnv } from '@/lib/env/runtime-config';
import { APP_CONFIG } from '@/config/app';

/**
 * React hook to access runtime configuration
 * This fetches the latest config from the server and caches it
 * Falls back to build-time values if server fetch fails
 */
export function useRuntimeConfig() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['runtime-config'],
    queryFn: fetchRuntimeConfig,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Use the fetched config if available, otherwise fall back to static config
  const config: PublicEnv = data?.config || APP_CONFIG.env;

  return {
    config,
    isLoading,
    error,
    // Convenience accessors
    appName: config.VITE_APP_NAME,
    appDomain: config.VITE_APP_DOMAIN,
    convexUrl: config.VITE_CONVEX_URL,
    clerkKey: config.VITE_CLERK_PUBLISHABLE_KEY,
    posthogKey: config.VITE_POSTHOG_API_KEY,
  };
}

/**
 * Hook to get the current app configuration
 * This uses the runtime config if available
 */
export function useAppConfig() {
  const { config } = useRuntimeConfig();

  const appName = config.VITE_APP_NAME;
  const appDomain = config.VITE_APP_DOMAIN;
  const appTwitterHandle = config.VITE_APP_TWITTER_HANDLE;

  return {
    name: appName,
    domain: appDomain,
    url: `https://${appDomain}`,
    twitterHandle: appTwitterHandle,
    displayName: appName,
    tagline: 'share and discover vibes',
    description: `${appName} is a platform for sharing and discovering vibes. rate, react, and share your favorite vibes with the world.`,
    seo: {
      defaultTitle: `${appName} | share and discover vibes`,
      titleTemplate: `%s | ${appName}`,
      defaultDescription: `${appName} is a platform for sharing and discovering vibes. rate, react, and share your favorite vibes with the world.`,
    },
    legal: {
      privacyTitle: `privacy policy | ${appName}`,
      privacyDescription: `privacy policy and data protection practices for ${appName} platform`,
      termsTitle: `terms of service | ${appName}`,
      termsDescription: `terms of service and usage guidelines for ${appName} platform`,
    },
  };
}
