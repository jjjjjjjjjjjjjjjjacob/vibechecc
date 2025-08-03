import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import { usePageTracking } from '@/hooks/use-enhanced-analytics';

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  // Performance tracking
  usePageTracking('sign_up', {
    section: 'authentication',
    auth_method: 'clerk',
    funnel_step: 'signup',
  });

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}

export default SignUpPage;
