import * as React from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useOnboardingStatus, useEnsureUserExistsMutation } from '@/queries';
import { useUser } from '@clerk/tanstack-react-start';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();
  const { data: onboardingStatus, isLoading, error } = useOnboardingStatus();

  // Only initialize mutation when user is authenticated
  const { mutate: ensureUserExists } = useEnsureUserExistsMutation();

  React.useEffect(() => {
    // console.log('OnboardingGuard:', {
    //   isSignedIn,
    //   isLoaded,
    //   pathname: location.pathname,
    //   isLoading,
    //   onboardingStatus,
    //   error,
    // });

    // Only check onboarding for signed-in users
    if (!isLoaded || !isSignedIn) return;

    // Don't redirect if already on onboarding page
    if (location.pathname === '/onboarding') return;

    // Don't redirect if still loading
    if (isLoading) return;

    // Log error if there is one
    if (error) {
      // eslint-disable-next-line no-console
      console.error('OnboardingGuard error:', error);
      return;
    }

    // If user doesn't exist in Convex yet, create them
    if (onboardingStatus && !onboardingStatus.userExists) {
      // console.log('User exists in Clerk but not Convex, creating...');
      ensureUserExists({});
      return; // Wait for user creation before proceeding
    }

    // Redirect to onboarding if user needs it
    if (onboardingStatus?.needsOnboarding) {
      // console.log('Redirecting to onboarding');
      navigate({ to: '/onboarding' });
    }
  }, [
    isSignedIn,
    isLoaded,
    onboardingStatus,
    isLoading,
    location.pathname,
    navigate,
    error,
    ensureUserExists,
  ]);

  return <>{children}</>;
}
