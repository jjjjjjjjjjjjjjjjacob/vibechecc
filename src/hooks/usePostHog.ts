import { useCallback } from 'react';
import { analytics, trackEvents } from '@/lib/posthog';

export function usePostHog() {
  const capture = useCallback(
    (event: string, properties?: Record<string, any>) => {
      analytics.capture(event, properties);
    },
    []
  );

  const identify = useCallback(
    (userId: string, properties?: Record<string, any>) => {
      analytics.identify(userId, properties);
    },
    []
  );

  const setPersonProperties = useCallback((properties: Record<string, any>) => {
    analytics.setPersonProperties(properties);
  }, []);

  const reset = useCallback(() => {
    analytics.reset();
  }, []);

  const capturePageView = useCallback((path?: string) => {
    analytics.capturePageView(path);
  }, []);

  const isFeatureEnabled = useCallback((flag: string): boolean => {
    return analytics.isFeatureEnabled(flag);
  }, []);

  const getFeatureFlag = useCallback(
    (flag: string): string | boolean | undefined => {
      return analytics.getFeatureFlag(flag);
    },
    []
  );

  return {
    // Core PostHog methods
    capture,
    identify,
    setPersonProperties,
    reset,
    capturePageView,
    isFeatureEnabled,
    getFeatureFlag,

    // Pre-defined event tracking methods
    trackEvents,

    // Utility methods
    isInitialized: analytics.isInitialized(),
    getInstance: analytics.getInstance,
  };
}
