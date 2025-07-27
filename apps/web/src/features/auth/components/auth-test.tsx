import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberater/convex';
import { useUser } from '@clerk/tanstack-react-start';

export function AuthTest() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  // Test queries
  const debugAuth = useQuery({
    ...convexQuery(api.users.debugAuth, {}),
  });
  const onboardingStatus = useQuery({
    ...convexQuery(api.users.getOnboardingStatus, {}),
  });

  // Test mutation
  const ensureUserExists = useMutation({
    mutationFn: useConvexMutation(api.users.ensureUserExists),
  });

  const handleEnsureUser = () => {
    ensureUserExists.mutate({});
  };

  return (
    <div className="space-y-4 rounded-lg bg-gray-100 p-4">
      <h2 className="text-xl font-bold">Auth Test Panel</h2>

      <div className="space-y-2">
        <h3 className="font-semibold">Clerk Status:</h3>
        <p>Loaded: {isLoaded ? 'Yes' : 'No'}</p>
        <p>Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
        <p>User ID: {clerkUser?.id || 'None'}</p>
        <p>Username: {clerkUser?.username || 'None'}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Debug Auth Query:</h3>
        <p>Status: {debugAuth.status}</p>
        <p>Error: {debugAuth.error?.message || 'None'}</p>
        <pre className="overflow-auto rounded bg-white p-2 text-xs">
          {JSON.stringify(debugAuth.data, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Onboarding Status Query:</h3>
        <p>Status: {onboardingStatus.status}</p>
        <p>Error: {onboardingStatus.error?.message || 'None'}</p>
        <pre className="overflow-auto rounded bg-white p-2 text-xs">
          {JSON.stringify(onboardingStatus.data, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Ensure User Exists Mutation:</h3>
        <button
          onClick={handleEnsureUser}
          disabled={ensureUserExists.isPending}
          className="rounded bg-blue-500 px-3 py-1 text-white disabled:bg-gray-400"
        >
          {ensureUserExists.isPending ? 'Creating...' : 'Ensure User Exists'}
        </button>
        <p>Status: {ensureUserExists.status}</p>
        <p>Error: {ensureUserExists.error?.message || 'None'}</p>
        <pre className="overflow-auto rounded bg-white p-2 text-xs">
          {JSON.stringify(ensureUserExists.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
