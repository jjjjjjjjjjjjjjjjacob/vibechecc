import { createFileRoute } from '@tanstack/react-router';
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow';
import { useOnboardingStatus } from '@/queries';
import { SignedIn, SignedOut, useAuth } from '@clerk/tanstack-react-start';
import { useEffect } from 'react';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { data: _onboardingStatus, isLoading } = useOnboardingStatus();
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      // getToken().then(console.log);
    }
  }, [getToken, isLoaded]);

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
          <div className="mx-auto max-w-md space-y-4 px-4 text-center">
            <h1 className="text-foreground text-2xl font-bold">
              Sign In Required
            </h1>
            <p className="text-muted-foreground">
              You need to be signed in to complete the onboarding process.
            </p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <OnboardingFlow />
      </SignedIn>
    </>
  );
}
