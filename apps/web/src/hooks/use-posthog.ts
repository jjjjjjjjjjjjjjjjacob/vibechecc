import { useCallback } from 'react'; // memoizes callback references between renders
import { analytics, trackEvents } from '@/lib/posthog'; // shared PostHog instance and prebuilt trackers

/**
 * Hook exposing a small facade over our PostHog analytics singleton.
 *
 * Each method is wrapped in {@link useCallback} so components can safely pass
 * them as props without triggering unnecessary re-renders.
 */
export function usePostHog() {
  // Capture an arbitrary event with optional metadata for richer reporting.
  const capture = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: string, properties?: Record<string, any>) => {
      // Forward event information to the PostHog client.
      analytics.capture(event, properties);
    },
    [] // no dependencies -> stable reference
  );

  // Tie subsequent events to a known user identifier for cross-session tracking.
  const identify = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (userId: string, properties?: Record<string, any>) => {
      // Inform PostHog which user is currently active.
      analytics.identify(userId, properties);
    },
    []
  );

  // Store custom traits on the current user record for segmentation queries.
  const setPersonProperties = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (properties: Record<string, any>) => {
      // Merge the provided traits into the user's profile.
      analytics.setPersonProperties(properties);
    },
    []
  );

  // Clear all locally stored analytics state and forget the current user.
  const reset = useCallback(() => {
    analytics.reset(); // PostHog provides a reset utility for logout flows
  }, []);

  // Log a pageview for either the supplied path or the current URL.
  const capturePageView = useCallback((path?: string) => {
    analytics.capturePageView(path); // delegates to PostHog's automatic page tracking
  }, []);

  // Determine if a feature flag is active for the current visitor.
  const isFeatureEnabled = useCallback((flag: string): boolean => {
    return analytics.isFeatureEnabled(flag); // boolean cast for clarity
  }, []);

  // Fetch the variant payload for a feature flag, if one has been assigned.
  const getFeatureFlag = useCallback(
    (flag: string): string | boolean | undefined => {
      return analytics.getFeatureFlag(flag); // may return string, boolean, or undefined
    },
    []
  );

  return {
    // expose raw PostHog wrappers
    capture,
    identify,
    setPersonProperties,
    reset,
    capturePageView,
    isFeatureEnabled,
    getFeatureFlag,

    // helper object for predefined tracking events used across the app
    trackEvents,

    // surface useful utilities from the underlying analytics instance
    isInitialized: analytics.isInitialized(),
    getInstance: analytics.getInstance,
  };
}
