'use client';

import { useEffect, type ReactNode } from 'react';
import { analytics, type PostHogConfig } from '@/lib/posthog';

/** props for the posthog provider */
interface PostHogProviderProps {
  // children rendered within the analytics context
  children: ReactNode;
}

/**
 * component that initializes the posthog analytics library on the client
 * and exposes the configured instance to descendant components.
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // only run initialization in the browser
    if (typeof window !== 'undefined') {
      // build configuration from environment variables
      const config: PostHogConfig = {
        apiKey: import.meta.env.VITE_POSTHOG_API_KEY || '',
        apiHost:
          import.meta.env.VITE_POSTHOG_API_HOST || 'https://app.posthog.com',
        projectId: import.meta.env.VITE_POSTHOG_PROJECT_ID || '',
        region: import.meta.env.VITE_POSTHOG_REGION || 'us',
      };

      // only initialize if a key exists
      if (config.apiKey) {
        analytics.init(config);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          'posthog api key not found. analytics will not be initialized.'
        );
      }
    }
  }, []);

  // simply render descendants once initialized
  return <>{children}</>;
}
