import * as React from 'react';
import { useUser, useAuth } from '@clerk/tanstack-react-start';
import { useDebugAuth, useOnboardingStatus } from '@/queries';

/**
 * renders a floating panel with detailed authentication and onboarding
 * information for the current user. meant for developers to inspect clerk
 * state, convex auth, and onboarding progress.
 */
export function DebugAuth() {
  // get current clerk user and auth flags
  const { user, isSignedIn, isLoaded } = useUser();
  // helper to retrieve a convex-specific auth token from clerk
  const { getToken } = useAuth();
  // query convex for low-level auth information
  const {
    data: debugData,
    isLoading: debugLoading,
    error: debugError,
  } = useDebugAuth();
  // query onboarding status to show if user setup is complete
  const {
    data: onboardingData,
    isLoading: onboardingLoading,
    error: onboardingError,
  } = useOnboardingStatus();

  // store the clerk-issued token locally for display
  const [clerkToken, setClerkToken] = React.useState<string | null>(null);
  // track any errors retrieving the token
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  // once authenticated and loaded, fetch a convex token
  React.useEffect(() => {
    if (isSignedIn && isLoaded) {
      getToken({ template: 'convex' })
        .then((token) => {
          setClerkToken(token);
          setTokenError(null);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('error getting clerk token:', error);
          setTokenError(error.message);
        });
    }
  }, [isSignedIn, isLoaded, getToken]);

  if (!isLoaded) {
    return (
      <div className="bg-yellow-100 p-4 text-yellow-800">
        clerk not loaded yet...
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-h-96 max-w-md overflow-y-auto rounded-lg border bg-white p-4 text-xs shadow-lg dark:bg-gray-800">
      {/* section heading */}
      <h3 className="mb-2 font-bold">debug auth status</h3>

      <div className="space-y-2">
        {/* clerk user info */}
        <div>
          <strong>clerk:</strong>
          <ul className="ml-2">
            <li>is signed in: {String(isSignedIn)}</li>
            <li>is loaded: {String(isLoaded)}</li>
            <li>user id: {user?.id || 'null'}</li>
            <li>user first name: {user?.firstName || 'null'}</li>
          </ul>
        </div>

        {/* token retrieval status */}
        <div>
          <strong>clerk token:</strong>
          {tokenError ? (
            <div className="text-red-600">error: {tokenError}</div>
          ) : clerkToken ? (
            <div className="text-green-600">
              token exists ({clerkToken.slice(0, 20)}...)
            </div>
          ) : (
            <div className="text-yellow-600">no token yet</div>
          )}
        </div>

        {/* convex auth details */}
        <div>
          <strong>convex debug:</strong>
          {debugLoading ? (
            <div>loading...</div>
          ) : debugError ? (
            <div className="text-red-600">error: {String(debugError)}</div>
          ) : (
            <ul className="ml-2">
              <li>has auth: {String(debugData?.hasAuth)}</li>
              <li>has identity: {String(debugData?.hasIdentity)}</li>
              <li>subject: {debugData?.identity?.subject || 'null'}</li>
              <li>
                token identifier{' '}
                {(debugData?.identity as any)?.tokenIdentifier || 'null'}
              </li>
              <li>
                has email{' '}
                {String((debugData?.identity as any)?.hasEmail) || 'null'}
              </li>
            </ul>
          )}
        </div>

        {/* onboarding completion details */}
        <div>
          <strong>onboarding:</strong>
          {onboardingLoading ? (
            <div>loading...</div>
          ) : onboardingError ? (
            <div className="text-red-600">error: {String(onboardingError)}</div>
          ) : (
            <ul className="ml-2">
              <li>completed: {String(onboardingData?.completed)}</li>
              <li>
                needs onboarding: {String(onboardingData?.needsOnboarding)}
              </li>
              <li>
                user exists{' '}
                {String(
                  !!onboardingData &&
                    'user' in onboardingData &&
                    onboardingData.user
                )}
              </li>
              <li>
                user external id{' '}
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

export default DebugAuth;
