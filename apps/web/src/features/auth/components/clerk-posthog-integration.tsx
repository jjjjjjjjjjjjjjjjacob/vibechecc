import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from 'posthog-js/react';
import { trackEvents } from '@/lib/track-events';
import { trackSurveyEvents } from '@/lib/survey-manager';

export function ClerkPostHogIntegration() {
  const { user, isSignedIn } = useUser();
  const posthog = usePostHog();
  const hasTriggeredSurvey = useRef(false);

  useEffect(() => {
    if (isSignedIn && user) {
      // Identify the user in PostHog using native hook
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      });

      // Set additional person properties using native hook
      posthog.setPersonProperties({
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        hasImage: !!user.imageUrl,
        emailVerified:
          user.primaryEmailAddress?.verification?.status === 'verified',
        phoneVerified:
          user.primaryPhoneNumber?.verification?.status === 'verified',
        twoFactorEnabled: user.twoFactorEnabled,
      });

      // Reload feature flags after identifying the user
      // This ensures feature flags are updated based on the new user identity
      posthog.reloadFeatureFlags();

      // Track sign in event (this will fire on every page load for signed-in users)
      // You might want to add additional logic to only track actual sign-in events
      trackEvents.userSignedIn(user.id, 'clerk');

      // Check if this is a new user and track signup (IMPROVED LOGIC)
      if (user.createdAt) {
        const userCreatedAt = new Date(user.createdAt);
        const now = new Date();
        const daysSinceSignup =
          (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Track signup for users who signed up within the last 7 days
        if (daysSinceSignup <= 7) {
          trackEvents.userSignedUp(user.id, 'clerk');

          // Also trigger survey for very recent signups (within 24 hours)
          if (daysSinceSignup <= 1 && !hasTriggeredSurvey.current) {
            hasTriggeredSurvey.current = true;
            trackSurveyEvents.triggerNewUserSurvey(
              user.id,
              user.primaryEmailAddress?.emailAddress
            );
          }
        }
      }
    } else if (!isSignedIn) {
      // Reset PostHog when user signs out using native hook
      posthog.reset();

      // Reload feature flags after reset to get anonymous user flags
      // Small delay to ensure reset completes first
      setTimeout(() => {
        posthog.reloadFeatureFlags();
      }, 100);
    }
  }, [isSignedIn, user, posthog]);

  return null; // This component doesn't render anything
}

export default ClerkPostHogIntegration;
