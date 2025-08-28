import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/tanstack-react-start';
import toast from '@/utils/toast';
import { AlertCircle, Shield, Info } from '@/components/ui/icons';

interface AppleIdErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * SECURITY: Apple ID Error Handler Component
 * Provides user-friendly error handling and privacy information for Apple ID authentication
 */
export function AppleIdErrorHandler({ children }: AppleIdErrorHandlerProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // SECURITY: Check if user has Apple ID authentication
    const hasAppleAuth = user.externalAccounts?.some((account: any) =>
      account.provider?.toLowerCase().includes('apple')
    );

    if (hasAppleAuth) {
      // PRIVACY: Inform user about Apple's privacy features
      const hasPrivateEmail = user.externalAccounts?.some((account: any) =>
        account.emailAddress?.includes('@privaterelay.appleid.com')
      );

      if (hasPrivateEmail) {
        toast.info(
          "apple privacy protection active - we're using your private relay email to protect your privacy"
        );
      }

      // SECURITY: Handle missing profile information gracefully
      const hasMissingInfo = !user.firstName && !user.lastName;
      if (hasMissingInfo) {
        toast.info(
          'complete your profile - add your name and interests to get the best experience'
        );
      }
    }
  }, [isLoaded, isSignedIn, user]);

  // SECURITY: Handle Apple ID authentication errors
  useEffect(() => {
    const handleAppleAuthError = (error: ErrorEvent) => {
      const message = error.message?.toLowerCase();

      if (message?.includes('apple') || message?.includes('oauth')) {
        // SECURITY: Don't expose internal error details to users
        toast.error(
          'sign in issue - there was a problem signing in with apple id. please try again.'
        );
      }
    };

    window.addEventListener('error', handleAppleAuthError);
    return () => window.removeEventListener('error', handleAppleAuthError);
  }, []);

  return <>{children}</>;
}

/**
 * SECURITY: Apple ID Status Display Component
 * Shows Apple ID connection status in user profile/settings
 */
export function AppleIdStatus() {
  const { user } = useUser();

  if (!user) return null;

  const appleAccount = user.externalAccounts?.find((account: any) =>
    account.provider?.toLowerCase().includes('apple')
  );

  if (!appleAccount) return null;

  const isPrivateRelay = appleAccount.emailAddress?.includes(
    '@privaterelay.appleid.com'
  );
  const verificationStatus = appleAccount.verification?.status;

  return (
    <div className="bg-muted/30 border-primary/20 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Shield className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-foreground font-medium">apple id connected</h3>
          <div className="text-muted-foreground mt-1 space-y-1 text-sm">
            {isPrivateRelay && (
              <p className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                private relay email protection active
              </p>
            )}
            {verificationStatus === 'verified' && (
              <p className="text-green-600">account verified</p>
            )}
            <p>secure authentication enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
