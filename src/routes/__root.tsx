import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production';
import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import * as React from 'react';
import { Toaster } from 'react-hot-toast';
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
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';

const convexClient = new ConvexReactClient(
  (import.meta as any).env.VITE_CONVEX_URL!
);

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
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
        title: 'VibeCheck | Share and Discover Vibes',
        description: `VibeCheck is a platform for sharing and discovering vibes. Rate, react, and share your favorite vibes with the world.`,
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
      // Google Font for our app
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        elements: {
          card: 'bg-card shadow-lg text-primary',
          buttonPrimary: 'bg-card text-primary hover:bg-card/90',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
    >
      <ConvexProviderWithAuth client={convexClient} useAuth={useAuth as any}>
        <html lang="en">
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

                  <main className="flex-1">{children}</main>

                  <footer className="bg-background border-t py-6">
                    <div className="container mx-auto px-4">
                      <p className="text-muted-foreground text-center text-sm">
                        © {new Date().getFullYear()} vibecheck. all rights
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
      </ConvexProviderWithAuth>
    </ClerkProvider>
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
