import * as React from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderNative } from 'posthog-js/react';
import { APP_CONFIG } from '@/utils/bindings';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  React.useEffect(() => {
    if (APP_CONFIG.env.VITE_POSTHOG_API_KEY) {
      // Initialize PostHog only once on client-side
      posthog.init(APP_CONFIG.env.VITE_POSTHOG_API_KEY, {
        api_host: APP_CONFIG.env.VITE_POSTHOG_API_HOST,
        person_profiles: 'identified_only',
        capture_pageview: false, // We handle page views manually for better control
        capture_pageleave: true,
      });
    }
  }, []);

  // Use PostHog's native React provider
  return (
    <PostHogProviderNative client={posthog}>{children}</PostHogProviderNative>
  );
}
