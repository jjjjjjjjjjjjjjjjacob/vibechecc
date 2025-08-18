import { useEffect, useState } from 'react';
import { getFeatureFlags } from '@/lib/env/access-control';
import posthog from 'posthog-js';

interface FeatureFlagsState {
  flags: Record<string, boolean | string>;
  isLoaded: boolean;
  userId: string | null;
}

/**
 * Hook to fetch and bootstrap feature flags from the server
 * This ensures consistent feature flag state between server and client
 */
export function useServerFeatureFlags() {
  const [state, setState] = useState<FeatureFlagsState>({
    flags: {},
    isLoaded: false,
    userId: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchFlags() {
      try {
        const result = await getFeatureFlags();

        if (!cancelled) {
          setState({
            flags: result.flags,
            isLoaded: result.isLoaded,
            userId: result.userId,
          });

          // Bootstrap PostHog with server-side feature flags
          if (result.isLoaded && Object.keys(result.flags).length > 0) {
            // Override client-side feature flags with server values
            // PostHog will use these values until it fetches fresh flags
            if (posthog.featureFlags) {
              posthog.featureFlags.overrideFeatureFlags(result.flags);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, isLoaded: true }));
        }
      }
    }

    fetchFlags();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
