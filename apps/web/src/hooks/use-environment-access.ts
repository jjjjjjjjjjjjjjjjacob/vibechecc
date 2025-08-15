import { useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { usePostHog } from './use-posthog';
import {
  getEnvironmentInfo,
  type EnvironmentInfo,
} from '@/lib/environment-access';

export interface UseEnvironmentAccessReturn {
  environmentInfo: EnvironmentInfo;
  hasAccess: boolean;
  hasDevAccess: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

/**
 * Hook for checking environment access permissions
 * Reactive to PostHog initialization and feature flag changes
 */
export function useEnvironmentAccess(): UseEnvironmentAccessReturn {
  const [environmentInfo] = useState(() => getEnvironmentInfo());
  const { isInitialized } = usePostHog();

  // Use PostHog React hook for feature flag
  const devAccessFlag = useFeatureFlagEnabled('dev-environment-access');

  // Determine if user has access based on environment and feature flag
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1'));

  // Calculate access: localhost always allowed, otherwise check if environment needs access and if user has flag
  const hasAccess =
    isLocalhost || !environmentInfo.requiresDevAccess || devAccessFlag === true;
  const hasDevAccess = devAccessFlag === true;
  const isLoading = devAccessFlag === undefined && !isLocalhost;

  return {
    environmentInfo,
    hasAccess,
    hasDevAccess,
    isLoading,
    isInitialized,
  };
}
