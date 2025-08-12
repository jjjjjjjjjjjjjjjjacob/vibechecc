import { useQuery, useMutation } from '@tanstack/react-query';
// hooks for calling Convex queries/mutations via react-query
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
// Clerk hook to access current user state
import { useUser } from '@clerk/tanstack-react-start';

/**
 * Playground component that exercises authentication-related queries and
 * mutations. Useful for manual testing during development.
 */
export function AuthTest() {
  // Clerk provides basic auth info; `user` may be undefined when signed out
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  // Queries to verify backend auth helpers
  const debugAuth = useQuery({
    ...convexQuery(api.users.debugAuth, {}),
  });
  const onboardingStatus = useQuery({
    ...convexQuery(api.users.getOnboardingStatus, {}),
  });

  // Mutation for ensuring a Convex user document exists
  const ensureUserExists = useMutation({
    mutationFn: useConvexMutation(api.users.ensureUserExists),
  });

  // helper that triggers the mutation with an empty payload
  const handleEnsureUser = () => {
    ensureUserExists.mutate({});
  };

  return (
    <div className="space-y-4 rounded-lg bg-gray-100 p-4">
      <h2 className="text-xl font-bold">auth test panel</h2>

      {/* clerk status block */}
      <div className="space-y-2">
        <h3 className="font-semibold">clerk status:</h3>
        <p>loaded: {isLoaded ? 'yes' : 'no'}</p>
        <p>signed in: {isSignedIn ? 'yes' : 'no'}</p>
        <p>user id: {clerkUser?.id || 'none'}</p>
        <p>username: {clerkUser?.username || 'none'}</p>
      </div>

      {/* debug auth query block */}
      <div className="space-y-2">
        <h3 className="font-semibold">debug auth query:</h3>
        <p>status: {debugAuth.status}</p>
        <p>error: {debugAuth.error?.message || 'none'}</p>
        <pre className="overflow-auto rounded bg-white p-2 text-xs">
          {JSON.stringify(debugAuth.data, null, 2)}
        </pre>
      </div>

      {/* onboarding status query block */}
      <div className="space-y-2">
        <h3 className="font-semibold">onboarding status query:</h3>
        <p>status: {onboardingStatus.status}</p>
        <p>error: {onboardingStatus.error?.message || 'none'}</p>
        <pre className="overflow-auto rounded bg-white p-2 text-xs">
          {JSON.stringify(onboardingStatus.data, null, 2)}
        </pre>
      </div>

      {/* ensure user exists mutation block */}
      <div className="space-y-2">
        <h3 className="font-semibold">ensure user exists mutation:</h3>
        <button
          onClick={handleEnsureUser}
          disabled={ensureUserExists.isPending}
          className="rounded bg-blue-500 px-3 py-1 text-white disabled:bg-gray-400"
        >
          {ensureUserExists.isPending ? 'creating...' : 'ensure user exists'}
        </button>
        <p>status: {ensureUserExists.status}</p>
        <p>error: {ensureUserExists.error?.message || 'none'}</p>
        <pre className="overflow-auto rounded bg-white p-2 text-xs">
          {JSON.stringify(ensureUserExists.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default AuthTest;
