import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}
