'use client';

import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
// leverage posthog hook for capturing page view events
import { usePostHog } from '@/hooks/use-posthog';

interface PostHogPageTrackerProps {
  // optional title to send with events
  title?: string;
}

/**
 * invisible helper component that reports client-side navigation events to
 * posthog. it tracks the current path and triggers a predefined page view
 * event on each change.
 */
export function PostHogPageTracker({ title }: PostHogPageTrackerProps) {
  // access router to read the current location path
  const router = useRouter();
  // pull page view and custom event trackers from the posthog wrapper
  const { capturePageView, trackEvents } = usePostHog();

  useEffect(() => {
    // derive the current path from router state
    const currentPath = router.state.location.pathname;

    // track the page view in posthog
    capturePageView(currentPath);

    // also fire our custom page viewed event with a title
    trackEvents.pageViewed(currentPath, title || document.title);
  }, [router.state.location.pathname, capturePageView, trackEvents, title]);

  // component does not render any visual output
  return null;
}
