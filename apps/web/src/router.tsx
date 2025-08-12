import { createRouter as createTanStackRouter } from '@tanstack/react-router';
// react-query provides caching and request deduplication
import {
  MutationCache,
  QueryClient,
  notifyManager,
} from '@tanstack/react-query';
// convex client bridges browser to backend database
import { ConvexReactClient } from 'convex/react';
import { ConvexQueryClient } from '@convex-dev/react-query';
// helper to bind router and query client together
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import toast from '@/utils/toast';
import { routeTree } from './routeTree.gen';
import { DefaultCatchBoundary } from './components/default-catch-boundary';
import { NotFound } from './components/not-found';

/**
 * Creates a fully configured TanStack router instance.
 *
 * The router wires up Convex and React Query clients, registers default error
 * boundaries, and enables scroll restoration. A mutation cache displays toast
 * messages for failures.
 */
export function createRouter() {
  // in the browser, align react-query notifications with the paint cycle
  if (typeof document !== 'undefined') {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }

  // pull Convex deployment URL from environment configuration
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    // eslint-disable-next-line no-console
    console.error('missing envar CONVEX_URL');
  }
  // convex client used by hooks throughout the app
  const convexClient = new ConvexReactClient(CONVEX_URL);
  // adapter allowing react-query to talk to Convex
  const convexQueryClient = new ConvexQueryClient(convexClient);

  // create the shared react-query client with Convex-specific defaults
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // hash and fetch functions ensure queries map to Convex APIs
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
    mutationCache: new MutationCache({
      // surface any mutation failures via a toast message
      onError: (error) => {
        toast(error.message, { className: 'bg-red-500 text-white' });
      },
    }),
  });

  // keep react-query and Convex query client in sync
  convexQueryClient.connect(queryClient);

  // build router and attach the query client context
  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      context: { queryClient, convexClient, convexQueryClient },
      scrollRestoration: true,
    }),
    queryClient
  );

  // expose the configured router to callers
  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
