'use client';

import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { usePostHog as usePostHogNative } from 'posthog-js/react';
import { usePostHog } from '@/hooks/use-posthog';

interface PostHogPageTrackerProps {
  title?: string;
}

export function PostHogPageTracker({ title }: PostHogPageTrackerProps) {
  const router = useRouter();
  const posthog = usePostHogNative();
  const { trackEvents } = usePostHog();

  useEffect(() => {
    const currentPath = router.state.location.pathname;

    // Track page view using native PostHog
    posthog?.capture('$pageview', {
      $current_url: window.location.href,
    });

    // Also use our custom tracking event
    trackEvents.pageViewed(currentPath, title || document.title);
  }, [router.state.location.pathname, posthog, trackEvents, title]);

  return null; // This component doesn't render anything
}
