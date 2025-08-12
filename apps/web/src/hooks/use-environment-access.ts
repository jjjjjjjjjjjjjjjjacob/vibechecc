import { useEffect, useState } from 'react';
// Analytics integration provides feature flag gating for environments
import { usePostHog } from './use-posthog';
import {
  getEnvironmentInfo,
  canAccessCurrentEnvironment,
  hasDevEnvironmentAccess,
  type EnvironmentInfo,
} from '@/lib/environment-access';

/**
 * Shape of the object returned by {@link useEnvironmentAccess}.
 */
export interface UseEnvironmentAccessReturn {
  /** Information about the current environment (dev/prod/etc.) */
  environmentInfo: EnvironmentInfo;
  /** Whether the current user has access to this environment */
  hasAccess: boolean;
  /** Whether the user has explicit access to development features */
  hasDevAccess: boolean;
  /** Indicates when the permission check is still running */
  isLoading: boolean;
  /** Mirrors the initialization state of PostHog */
  isInitialized: boolean;
}

/**
 * Hook for checking environment access permissions.
 *
 * The logic is reactive to PostHog initialization and feature flag changes so
 * it can dynamically update as analytics state changes.
 */
export function useEnvironmentAccess(): UseEnvironmentAccessReturn {
  // Static info about the environment (e.g. "development" vs "production").
  const [environmentInfo] = useState(() => getEnvironmentInfo());
  // Whether the current user may access this environment.
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  // Whether the user has elevated access to development-only features.
  const [hasDevAccess, setHasDevAccess] = useState<boolean>(false);
  // Track whether we are still computing access rights.
  const [isLoading, setIsLoading] = useState(true);

  // PostHog controls feature flags that gate access; wait for it to load.
  const { isInitialized } = usePostHog();

  useEffect(() => {
    if (!isInitialized) {
      // If PostHog hasn't initialized yet, we can't know access; mark loading.
      setIsLoading(true);
      return;
    }

    const checkAccess = () => {
      // Compute both general and dev-only access flags from helpers.
      const access = canAccessCurrentEnvironment();
      const devAccess = hasDevEnvironmentAccess();

      // Update state with the results and clear the loading indicator.
      setHasAccess(access);
      setHasDevAccess(devAccess);
      setIsLoading(false);
    };

    checkAccess();
  }, [isInitialized]);

  return {
    environmentInfo,
    hasAccess,
    hasDevAccess,
    isLoading,
    isInitialized,
  };
}
