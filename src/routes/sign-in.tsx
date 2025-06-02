import { SignIn } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}
