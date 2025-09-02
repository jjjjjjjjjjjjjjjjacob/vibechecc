import { AuthenticateWithRedirectCallback } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up/sso-callback')({
  component: SSOCallback,
});

function SSOCallback() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}

export default SSOCallback;
