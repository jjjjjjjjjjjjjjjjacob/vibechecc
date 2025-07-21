import * as React from 'react';
import { useUser, useAuth } from '@clerk/tanstack-react-start';
import { useDebugAuth, useOnboardingStatus } from '@/queries';

export function DebugAuth() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const {
    data: debugData,
    isLoading: debugLoading,
    error: debugError,
  } = useDebugAuth();
  const {
    data: onboardingData,
    isLoading: onboardingLoading,
    error: onboardingError,
  } = useOnboardingStatus();

  const [clerkToken, setClerkToken] = React.useState<string | null>(null);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  // Get Clerk token for debugging
  React.useEffect(() => {
    if (isSignedIn && isLoaded) {
      getToken({ template: 'convex' })
        .then((token) => {
          setClerkToken(token);
          setTokenError(null);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error getting Clerk token:', error);
          setTokenError(error.message);
        });
    }
  }, [isSignedIn, isLoaded, getToken]);

  if (!isLoaded) {
    return (
      <div className="bg-yellow-100 p-4 text-yellow-800">
        Clerk not loaded yet...
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-h-96 max-w-md overflow-y-auto rounded-lg border bg-white p-4 text-xs shadow-lg dark:bg-gray-800">
      <h3 className="mb-2 font-bold">Debug Auth Status</h3>

      <div className="space-y-2">
        <div>
          <strong>Clerk:</strong>
          <ul className="ml-2">
            <li>isSignedIn: {String(isSignedIn)}</li>
            <li>isLoaded: {String(isLoaded)}</li>
            <li>user.id: {user?.id || 'null'}</li>
            <li>user.firstName: {user?.firstName || 'null'}</li>
          </ul>
        </div>

        <div>
          <strong>Clerk Token:</strong>
          {tokenError ? (
            <div className="text-red-600">Error: {tokenError}</div>
          ) : clerkToken ? (
            <div className="text-green-600">
              Token exists ({clerkToken.slice(0, 20)}...)
            </div>
          ) : (
            <div className="text-yellow-600">No token yet</div>
          )}
        </div>

        <div>
          <strong>Convex Debug:</strong>
          {debugLoading ? (
            <div>Loading...</div>
          ) : debugError ? (
            <div className="text-red-600">Error: {String(debugError)}</div>
          ) : (
            <ul className="ml-2">
              <li>hasAuth: {String(debugData?.hasAuth)}</li>
              <li>hasIdentity: {String(debugData?.hasIdentity)}</li>
              <li>subject: {debugData?.identity?.subject || 'null'}</li>
              <li>givenName: {debugData?.identity?.givenName || 'null'}</li>
              <li>email: {debugData?.identity?.email || 'null'}</li>
            </ul>
          )}
        </div>

        <div>
          <strong>Onboarding:</strong>
          {onboardingLoading ? (
            <div>Loading...</div>
          ) : onboardingError ? (
            <div className="text-red-600">Error: {String(onboardingError)}</div>
          ) : (
            <ul className="ml-2">
              <li>completed: {String(onboardingData?.completed)}</li>
              <li>
                needsOnboarding: {String(onboardingData?.needsOnboarding)}
              </li>
              <li>
                user exists:{' '}
                {String(
                  !!onboardingData &&
                    'user' in onboardingData &&
                    onboardingData.user
                )}
              </li>
              <li>
                user.externalId:{' '}
                {onboardingData && 'user' in onboardingData
                  ? onboardingData.user?.externalId || 'null'
                  : 'null'}
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
