import { createFileRoute } from '@tanstack/react-router';
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow';
import { useOnboardingStatus } from '@/queries';
import { SignedIn, SignedOut, useAuth } from '@clerk/tanstack-react-start';
import { useEffect } from 'react';

/**
 * Route configuration for the onboarding flow.
 * This page guides new users through profile setup after sign-up.
 */
export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

/**
 * Displays either a loading state, a prompt to sign in, or the actual
 * onboarding steps depending on authentication and onboarding status.
 */
function OnboardingPage() {
  // Query the backend for the user's onboarding completion flag
  const { data: _onboardingStatus, isLoading } = useOnboardingStatus();
  // Access Clerk utilities to fetch tokens if needed in future steps
  const { getToken, isLoaded } = useAuth();

  // Example effect that could fetch a token for API calls once Clerk loads
  useEffect(() => {
    if (isLoaded) {
      // getToken().then(console.log);
    }
  }, [getToken, isLoaded]);

  // Show a spinner while the onboarding status query is pending
  if (isLoading) {
    return (
      <div className="from-theme-primary/5 to-theme-secondary/5 dark:from-background dark:to-muted/50 flex min-h-screen items-center justify-center bg-gradient-to-br">
        <div className="space-y-4 text-center">
          <div className="border-theme-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground">loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* If the user is signed out, prompt them to authenticate */}
      <SignedOut>
        <div className="from-theme-primary/5 to-theme-secondary/5 dark:from-background dark:to-muted/50 flex min-h-screen items-center justify-center bg-gradient-to-br">
          <div className="mx-auto max-w-md space-y-4 px-4 text-center">
            <h1 className="text-foreground text-2xl font-bold">sign in required</h1>
            <p className="text-muted-foreground">
              you need to be signed in to complete the onboarding process.
            </p>
          </div>
        </div>
      </SignedOut>

      {/* Signed-in users see the interactive onboarding flow */}
      <SignedIn>
        <OnboardingFlow />
      </SignedIn>
    </>
  );
}

export default OnboardingPage;
