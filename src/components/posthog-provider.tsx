'use client';

import { useEffect, type ReactNode } from 'react';
import { analytics, type PostHogConfig } from '@/lib/posthog';

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Initialize PostHog on the client side only
    if (typeof window !== 'undefined') {
      const config: PostHogConfig = {
        apiKey: import.meta.env.VITE_POSTHOG_API_KEY || '',
        apiHost:
          import.meta.env.VITE_POSTHOG_API_HOST || 'https://app.posthog.com',
        projectId: import.meta.env.VITE_POSTHOG_PROJECT_ID || '',
        region: import.meta.env.VITE_POSTHOG_REGION || 'us',
      };

      // Only initialize if we have the required API key
      if (config.apiKey) {
        analytics.init(config);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          'PostHog API key not found. Analytics will not be initialized.'
        );
      }
    }
  }, []);

  return <>{children}</>;
}
