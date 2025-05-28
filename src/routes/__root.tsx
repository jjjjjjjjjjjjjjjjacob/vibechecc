import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production'
import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { Toaster } from 'react-hot-toast'
import type { QueryClient } from '@tanstack/react-query'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import { Header } from '~/components/header'
import { ThemeProvider } from '~/components/theme-provider'
import appCss from '~/styles/app.css?url'
import { seo } from '~/utils/seo'
import { Loader } from '~/components/Loader'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
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
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
      }
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <LoadingIndicator />
            
            <main className="flex-1">
              {children}
            </main>
            
            <footer className="border-t bg-background py-6">
              <div className="container mx-auto px-4">
                <p className="text-center text-muted-foreground text-sm">
                  © {new Date().getFullYear()} vibecheck. all rights reserved.
                </p>
              </div>
            </footer>
            <Toaster />
          </div>
        </ThemeProvider>
        <ReactQueryDevtools />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

function LoadingIndicator() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  return (
    <div
      className={`fixed top-16 left-0 right-0 h-1 z-50 transition-all duration-300 ${
        isLoading ? `opacity-100 delay-300` : `opacity-0 delay-0`
      }`}
    >
      <div className="h-full bg-gradient-to-r from-pink-500 to-orange-500 animate-pulse" />
    </div>
  )
}
