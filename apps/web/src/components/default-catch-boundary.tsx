import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router';

/**
 * Default error boundary shown when routes throw or reject.
 * Provides retry and navigation options for better UX.
 */
export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  // Access router instance to invalidate queries
  const router = useRouter();
  // Determine if the user is on the root route to adjust navigation
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  return (
    // Container centers the error message and actions
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
      {/* Render framework-provided error component */}
      <ErrorComponent error={error} />
      <div className="flex flex-wrap items-center gap-2">
        {/* Retry button forces router to refetch */}
        <button
          onClick={() => {
            router.invalidate(); // invalidate to trigger reload
          }}
          className={`rounded bg-gray-600 px-2 py-1 font-extrabold text-white dark:bg-gray-700`}
        >
          try again
        </button>
        {isRoot ? (
          // If we're on the root route, simply link home
          <Link
            to="/"
            className={`rounded bg-gray-600 px-2 py-1 font-extrabold text-white dark:bg-gray-700`}
          >
            home
          </Link>
        ) : (
          // Otherwise show a back link that respects browser history
          <Link
            to="/"
            className={`rounded bg-gray-600 px-2 py-1 font-extrabold text-white dark:bg-gray-700`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault(); // prevent navigation to root
              window.history.back(); // go to previous page
            }}
          >
            go back
          </Link>
        )}
      </div>
    </div>
  );
}
