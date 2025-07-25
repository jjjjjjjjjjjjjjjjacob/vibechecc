import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import {
  MutationCache,
  QueryClient,
  notifyManager,
} from '@tanstack/react-query';
import { ConvexReactClient } from 'convex/react';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import toast from '@/utils/toast';
import { routeTree } from './routeTree.gen';
import { DefaultCatchBoundary } from './components/default-catch-boundary';
import { NotFound } from './components/not-found';

export function createRouter() {
  if (typeof document !== 'undefined') {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }

  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    // eslint-disable-next-line no-console
    console.error('missing envar CONVEX_URL');
  }
  const convexClient = new ConvexReactClient(CONVEX_URL);
  const convexQueryClient = new ConvexQueryClient(convexClient);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast(error.message, { className: 'bg-red-500 text-white' });
      },
    }),
  });

  convexQueryClient.connect(queryClient);

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

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
