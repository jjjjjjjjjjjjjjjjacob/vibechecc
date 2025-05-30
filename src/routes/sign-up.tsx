import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
} 