'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from '@/hooks/usePostHog';

export function ClerkPostHogIntegration() {
  const { user, isSignedIn } = useUser();
  const { identify, setPersonProperties, reset, trackEvents } = usePostHog();

  useEffect(() => {
    if (isSignedIn && user) {
      // Identify the user in PostHog
      identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      });

      // Set additional person properties
      setPersonProperties({
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

      // Track sign in event (this will fire on every page load for signed-in users)
      // You might want to add additional logic to only track actual sign-in events
      trackEvents.userSignedIn(user.id, 'clerk');
    } else if (!isSignedIn) {
      // Reset PostHog when user signs out
      reset();
    }
  }, [isSignedIn, user, identify, setPersonProperties, reset, trackEvents]);

  return null; // This component doesn't render anything
}
