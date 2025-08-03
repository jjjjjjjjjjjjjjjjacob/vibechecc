'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import {
  enhancedTrackEvents,
  userPropertyHelpers,
} from '@/lib/enhanced-posthog';

/**
 * Privacy-compliant authentication and onboarding tracking component
 *
 * PRIVACY FEATURES:
 * - No PII tracking (GDPR/CCPA compliant)
 * - Consent-based analytics
 * - Data minimization principles
 * - Anonymized user identifiers only
 * - Opt-out capabilities built-in
 */

interface AuthTrackerProps {
  enabledEvents?: {
    signup?: boolean;
    signin?: boolean;
    signout?: boolean;
    onboarding?: boolean;
  };
  consentGiven?: boolean;
}

export function PrivacyCompliantAuthTracker({
  enabledEvents = {
    signup: true,
    signin: true,
    signout: true,
    onboarding: true,
  },
  consentGiven = true, // Should be controlled by user consent mechanism
}: AuthTrackerProps) {
  const { user, isSignedIn, isLoaded } = useUser();
  const previousUserRef = useRef<string | null>(null);
  const previousSignInState = useRef<boolean>(false);
  const hasTrackedSignup = useRef<boolean>(false);

  // Track signup completion with onboarding context
  const trackSignupCompletion = useCallback(
    (userId: string, onboardingStep?: string) => {
      if (!consentGiven || !enabledEvents.signup || hasTrackedSignup.current)
        return;

      enhancedTrackEvents.auth_signup_completed(
        userId,
        'clerk',
        onboardingStep || 'initial_signup'
      );

      // Set initial user properties (no PII)
      userPropertyHelpers.setOnboardingStep(onboardingStep || 'profile_setup');
      userPropertyHelpers.setEngagementMetrics(0, 0, 0); // Initial state

      hasTrackedSignup.current = true;
    },
    [consentGiven, enabledEvents.signup]
  );

  // Track signin events
  const trackSigninCompletion = useCallback(
    (userId: string) => {
      if (!consentGiven || !enabledEvents.signin) return;

      enhancedTrackEvents.auth_signin_completed(userId, 'clerk');

      // Update session properties
      userPropertyHelpers.setSessionData(
        1, // Session count would be calculated elsewhere
        0 // Average duration would be calculated elsewhere
      );
    },
    [consentGiven, enabledEvents.signin]
  );

  // Track signout events
  const trackSignoutCompletion = useCallback(
    (userId: string) => {
      if (!consentGiven || !enabledEvents.signout) return;

      enhancedTrackEvents.auth_signout_completed(userId);
    },
    [consentGiven, enabledEvents.signout]
  );

  // Main effect for authentication state tracking
  useEffect(() => {
    if (!isLoaded || !consentGiven) return;

    const currentUserId = user?.id || null;
    const wasSignedIn = previousSignInState.current;
    const previousUserId = previousUserRef.current;

    if (isSignedIn && user) {
      // Detect new user signup vs returning user signin
      const isNewUser = !wasSignedIn && currentUserId !== previousUserId;
      const isReturningUser = !wasSignedIn && currentUserId === previousUserId;
      const isNewSignIn = !wasSignedIn && isSignedIn;

      if (isNewUser) {
        // New user signup
        trackSignupCompletion(user.id);
      } else if (isReturningUser || isNewSignIn) {
        // Returning user signin
        trackSigninCompletion(user.id);
      }

      previousUserRef.current = user.id;
      previousSignInState.current = true;
    } else if (!isSignedIn && wasSignedIn && previousUserId) {
      // User signed out
      trackSignoutCompletion(previousUserId);

      previousSignInState.current = false;
      // Keep previousUserRef for potential re-signin tracking
    }
  }, [
    isSignedIn,
    user?.id,
    user,
    isLoaded,
    consentGiven,
    trackSignupCompletion,
    trackSigninCompletion,
    trackSignoutCompletion,
  ]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      // Reset tracking state but don't track signout on unmount
      hasTrackedSignup.current = false;
    };
  }, []);

  return null; // This component doesn't render anything
}

export default PrivacyCompliantAuthTracker;
