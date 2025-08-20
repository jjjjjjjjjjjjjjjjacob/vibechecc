'use client';

import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { trackEvents } from '@/lib/track-events';

interface PostHogPageTrackerProps {
  title?: string;
}

export function PostHogPageTracker({ title }: PostHogPageTrackerProps) {
  const router = useRouter();
  const posthog = usePostHog();

  useEffect(() => {
    const currentPath = router.state.location.pathname;

    // Track page view using native PostHog
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });

    // Also use our custom tracking event for additional metadata
    trackEvents.pageViewed(currentPath, title || document.title);
  }, [router.state.location.pathname, posthog, title]);

  return null; // This component doesn't render anything
}
