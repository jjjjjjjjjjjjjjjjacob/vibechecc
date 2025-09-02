import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useUser } from '@clerk/tanstack-react-start';
import { useEffect } from 'react';

export const Route = createFileRoute('/sign-up/sso-callback')({
  component: SSOCallbackPage,
});

function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Redirect to home page after successful SSO sign-up
      navigate({ to: '/' });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
        <p className="text-muted-foreground">welcome</p>
      </div>
    </div>
  );
}

export default SSOCallbackPage;
