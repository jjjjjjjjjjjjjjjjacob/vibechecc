import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  // eslint-disable-next-line no-console
  console.error(error);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
      <ErrorComponent error={error} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
          }}
          className={`bg-muted text-muted-foreground rounded px-2 py-1 font-extrabold uppercase`}
        >
          Try Again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className={`bg-primary text-primary-foreground rounded px-2 py-1 font-extrabold uppercase`}
          >
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className={`bg-secondary text-secondary-foreground rounded px-2 py-1 font-extrabold uppercase`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            Go Back
          </Link>
        )}
      </div>
    </div>
  );
}
