/**
 * @deprecated Use PostHog's native React hooks instead:
 * - import { usePostHog } from 'posthog-js/react' - for capture, identify, reset, etc.
 * - import { useFeatureFlagEnabled } from 'posthog-js/react' - for feature flags
 * - import { useFeatureFlagPayload } from 'posthog-js/react' - for flag payloads
 *
 * For project-specific events, import directly:
 * - import { trackEvents } from '@/lib/track-events'
 *
 * This hook is kept temporarily for backward compatibility during migration.
 */

import { trackEvents } from '@/lib/track-events';

export function usePostHog() {
  // eslint-disable-next-line no-console
  console.warn(
    'usePostHog() is deprecated. Use native PostHog hooks from posthog-js/react instead.'
  );

  return {
    trackEvents,
  };
}
