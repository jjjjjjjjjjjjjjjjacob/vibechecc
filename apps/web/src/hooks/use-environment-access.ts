import { useEffect, useState } from 'react';
import { usePostHog } from './usePostHog';
import {
  getEnvironmentInfo,
  canAccessCurrentEnvironment,
  hasDevEnvironmentAccess,
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
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [hasDevAccess, setHasDevAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isInitialized } = usePostHog();

  useEffect(() => {
    if (!isInitialized) {
      setIsLoading(true);
      return;
    }

    const checkAccess = () => {
      const access = canAccessCurrentEnvironment();
      const devAccess = hasDevEnvironmentAccess();

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
