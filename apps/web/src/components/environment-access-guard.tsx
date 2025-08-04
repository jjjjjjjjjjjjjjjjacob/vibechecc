import { useEffect, useState, type ReactNode } from 'react';
import { SignInButton } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { usePostHog } from '@/hooks/usePostHog';
import {
  canAccessCurrentEnvironment,
  getEnvironmentInfo,
  getAccessDenialMessage,
  trackEnvironmentAccess,
} from '@/lib/environment-access';

interface EnvironmentAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that restricts access to dev and ephemeral environments
 * based on PostHog feature flags and user cohorts
 */
export function EnvironmentAccessGuard({
  children,
  fallback,
}: EnvironmentAccessGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isInitialized } = usePostHog();

  useEffect(() => {
    const checkAccess = () => {
      const envInfo = getEnvironmentInfo();
      const allowed = canAccessCurrentEnvironment();

      setHasAccess(allowed);
      setIsLoading(false);

      // Track the access attempt (only if PostHog is initialized)
      if (isInitialized) {
        trackEnvironmentAccess(allowed, envInfo);
      }
    };

    // For localhost development, don't wait for PostHog - check access immediately
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('127.0.0.1'))
    ) {
      checkAccess();
      return;
    }

    // For production environments, wait for PostHog to initialize
    if (!isInitialized) {
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('PostHog initialization timeout, allowing access');
        setHasAccess(true);
        setIsLoading(false);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }

    // Check access immediately if PostHog is ready
    checkAccess();
  }, [isInitialized]);

  // Show loading state while PostHog initializes
  if (isLoading || hasAccess === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <span className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
              viberatr
            </span>
            <div className="border-theme-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-muted-foreground">
              checking access permissions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied message if user doesn't have permission
  if (!hasAccess) {
    const envInfo = getEnvironmentInfo();
    const message = getAccessDenialMessage(envInfo);

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md space-y-8 p-6 text-center">
          <div className="space-y-4">
            <span className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
              viberatr
            </span>
            <div className="space-y-2">
              <h1 className="text-foreground text-2xl font-semibold">
                access restricted
              </h1>
              <p className="text-muted-foreground">{message}</p>
            </div>
          </div>

          <div className="space-y-4">
            <SignInButton mode="modal">
              <Button className="from-theme-primary to-theme-secondary h-12 w-full bg-gradient-to-r text-base font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg">
                <LogIn className="mr-2 h-5 w-5" />
                sign in to viberatr
              </Button>
            </SignInButton>
          </div>

          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              environment:{' '}
              <span className="font-mono">
                {envInfo.subdomain || 'production'}
              </span>
            </p>
            <p>
              if you believe this is an error, please contact{' '}
              <a
                href="mailto:admin@viberatr.io"
                className="text-theme-primary hover:text-theme-primary/80 underline transition-colors"
              >
                admin@viberatr.io
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}
