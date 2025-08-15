import { trackEvents, analytics } from '@/lib/posthog';

/**
 * Custom hook for project-specific PostHog functionality.
 * 
 * For standard PostHog functionality, use the native hooks directly:
 * - import { usePostHog } from 'posthog-js/react' - for capture, identify, reset, etc.
 * - import { useFeatureFlagEnabled } from 'posthog-js/react' - for feature flags
 * - import { useFeatureFlagPayload } from 'posthog-js/react' - for flag payloads
 * 
 * This hook only provides:
 * - trackEvents: Project-specific event tracking helpers
 * - isInitialized: Check if PostHog is initialized (for SSR compatibility)
 */
export function usePostHog() {
  return {
    // Pre-defined project-specific event tracking methods
    trackEvents,
    
    // Utility for SSR compatibility checks
    isInitialized: analytics.isInitialized(),
    
    // Legacy methods - these are here for backward compatibility
    // but should be replaced with native PostHog hooks
    capture: analytics.capture.bind(analytics),
    identify: analytics.identify.bind(analytics),
    setPersonProperties: analytics.setPersonProperties.bind(analytics),
    reset: analytics.reset.bind(analytics),
  };
}