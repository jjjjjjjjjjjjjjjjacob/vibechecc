import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from '@/utils/toast';

/**
 * Subscribe to React Query's online status and surface a small toast whenever
 * connectivity changes. The hook has no return value; it simply registers the
 * listener on mount and cleans it up automatically.
 */
export function useOfflineIndicator() {
  useEffect(() => {
    // `onlineManager.subscribe` returns an unsubscribe function which React will
    // call when the component using this hook unmounts.
    return onlineManager.subscribe(() => {
      if (onlineManager.isOnline()) {
        // Show a short "online" toast when we regain network connectivity.
        toast.success('online', {
          id: 'ReactQuery',
          duration: 2000,
        });
      } else {
        // Persist an "offline" toast to inform the user of lost connection.
        toast.error('offline', {
          id: 'ReactQuery',
          duration: Infinity,
        });
      }
    });
  }, []);
}
