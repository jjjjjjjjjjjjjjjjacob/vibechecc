import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production';
import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  HeadContent,
  Scripts,
  useRouteContext,
  useNavigate,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';
import * as React from 'react';
import { Toaster } from '@/components/ui/sonner';
import type { QueryClient } from '@tanstack/react-query';
import { DefaultCatchBoundary } from '@/components/default-catch-boundary';
import { NotFound } from '@/components/not-found';
import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { PostHogProvider } from '@/components/posthog-provider';
import { PostHogPageTracker } from '@/components/posthog-page-tracker';
import { ClerkPostHogIntegration } from '@/features/auth/components/clerk-posthog-integration';
import appCss from '@/styles/app.css?url';
import { seo } from '@/utils/seo';
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { cn } from '@/utils';

// Server function to fetch Clerk auth and get Convex token
const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) {
    // During SSR, if no request, return empty auth
    return {
      userId: null,
      token: null,
    };
  }

  try {
    // Use getAuth with options to handle SSR properly
    const authResult = await getAuth(request);

    // Check if we got a Response object (handshake redirect)
    if (
      authResult &&
      typeof authResult === 'object' &&
      'status' in authResult &&
      'headers' in authResult
    ) {
      // This is a Response object for handshake, skip auth during SSR
      // Clerk handshake redirect detected during SSR, skipping auth
      return {
        userId: null,
        token: null,
      };
    }

    const auth = authResult;

    // Check if auth is valid and has userId
    if (
      !auth ||
      typeof auth !== 'object' ||
      !('userId' in auth) ||
      !auth.userId
    ) {
      return {
        userId: null,
        token: null,
      };
    }

    // Only try to get token if we have a userId
    let token = null;
    try {
      if ('getToken' in auth && typeof auth.getToken === 'function') {
        token = await auth.getToken({ template: 'convex' });
      }
    } catch {
      // Token generation might fail during SSR
      // Convex token generation skipped during SSR
    }

    return {
      userId: auth.userId as string,
      token,
    };
  } catch (error) {
    // Check if the error is a Response object (Clerk handshake redirect)
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'headers' in error
    ) {
      // Clerk handshake redirect during SSR
      return {
        userId: null,
        token: null,
      };
    }

    // Log other errors for debugging
    if (error instanceof Error) {
      // Auth error during SSR
    }

    // During SSR, authentication errors are expected
    return {
      userId: null,
      token: null,
    };
  }
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'viberater | share and discover vibes',
        description: `viberater is a platform for sharing and discovering vibes. rate, react, and share your favorite vibes with the world.`,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  beforeLoad: async (ctx) => {
    try {
      const auth = await fetchClerkAuth();
      const { userId, token } = auth;

      // During SSR, set the Clerk auth token for authenticated Convex requests
      if (token && ctx.context.convexQueryClient.serverHttpClient) {
        // Set auth on the convex client for server-side requests
        ctx.context.convexQueryClient.serverHttpClient.setAuth(token);
      }

      return {
        userId,
        token,
      };
    } catch {
      // Error in beforeLoad
      // Return empty auth state on error
      return {
        userId: null,
        token: null,
      };
    }
  },
  errorComponent: (props) => {
    return (
      <ClerkProviderWrapper>
        <RootDocument>
          <DefaultCatchBoundary {...props} />
        </RootDocument>
      </ClerkProviderWrapper>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        elements: {
          card: 'bg-card shadow-lg text-primary',
          buttonPrimary: 'bg-card text-primary hover:bg-card/90',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
      routerPush={(to) => navigate({ to })}
      routerReplace={(to) => navigate({ to, replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

function RootComponent() {
  const context = useRouteContext({ from: Route.id });
  return (
    <ClerkProviderWrapper>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ConvexProviderWithClerk>
    </ClerkProviderWrapper>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans')}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        <PostHogProvider>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <PostHogPageTracker />
              <ClerkPostHogIntegration />
              <Header />
              <LoadingIndicator />

              <main className="mb-4 flex-1">{children}</main>

              <footer className="bg-background border-t py-6">
                <div className="container mx-auto px-4">
                  <p className="text-muted-foreground text-center text-sm">
                    © {new Date().getFullYear()} viberater. all rights
                    reserved.
                  </p>
                </div>
              </footer>
              <Toaster />
            </div>
          </ThemeProvider>
        </PostHogProvider>
        <ReactQueryDevtools />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

function LoadingIndicator() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  return (
    <div
      className={`fixed top-16 right-0 left-0 z-50 h-1 transition-all duration-300 ${
        isLoading ? `opacity-100 delay-300` : `opacity-0 delay-0`
      }`}
    >
      <div className="h-full animate-pulse bg-gradient-to-r from-pink-500 to-orange-500" />
    </div>
  );
}
