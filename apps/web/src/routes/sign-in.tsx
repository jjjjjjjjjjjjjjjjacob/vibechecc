import { SignIn } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import { usePageTracking } from '@/hooks/use-enhanced-analytics';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  // Performance tracking
  usePageTracking('sign_in', {
    section: 'authentication',
    auth_method: 'clerk',
    funnel_step: 'signin',
  });

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}

export default SignInPage;
