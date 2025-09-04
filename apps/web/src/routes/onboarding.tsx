import { createFileRoute } from '@tanstack/react-router';
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow';
import { useOnboardingStatus } from '@/queries';
import { SignedIn, SignedOut } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { isLoading } = useOnboardingStatus();

  // Show loading state while checking onboarding status
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
      <SignedOut>
        <div className="from-theme-primary/5 to-theme-secondary/5 dark:from-background dark:to-muted/50 flex min-h-screen items-center justify-center bg-gradient-to-br">
          <div className="mx-auto max-w-md space-y-4 px-4 text-center">
            <h1 className="text-foreground text-2xl font-bold">
              sign in required
            </h1>
            <p className="text-muted-foreground">
              you need to be signed in to complete the onboarding process.
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

export default OnboardingPage;
