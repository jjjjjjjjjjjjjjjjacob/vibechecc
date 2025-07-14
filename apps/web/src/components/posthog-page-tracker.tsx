'use client';

import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { usePostHog } from '@/hooks/usePostHog';

interface PostHogPageTrackerProps {
  title?: string;
}

export function PostHogPageTracker({ title }: PostHogPageTrackerProps) {
  const router = useRouter();
  const { capturePageView, trackEvents } = usePostHog();

  useEffect(() => {
    const currentPath = router.state.location.pathname;

    // Track page view
    capturePageView(currentPath);

    // Also use our custom tracking event
    trackEvents.pageViewed(currentPath, title || document.title);
  }, [router.state.location.pathname, capturePageView, trackEvents, title]);

  return null; // This component doesn't render anything
}
