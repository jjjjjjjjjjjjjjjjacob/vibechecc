import { createFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import { HomeFeed } from '@/components/home-feed';
import { SignedIn, SignedOut, useUser } from '@clerk/tanstack-react-start';
import { useCurrentUser } from '@/queries';
import {
  useThemeStore,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from '@/stores/theme-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Sparkles } from '@/components/ui/icons';
import { APP_NAME } from '@/utils/bindings';

export const Route = createFileRoute('/')({
  component: Home,
});

function HeroButtonsSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-10 w-32 rounded-md bg-white/10" />
      <Skeleton className="h-10 w-36 rounded-md bg-white/10" />
    </div>
  );
}

function Home() {
  // Get current user's theme
  const { data: currentUser } = useCurrentUser();
  const { setColorTheme, setSecondaryColorTheme } = useThemeStore();
  const { isLoaded: isClerkLoaded } = useUser();
  const [hasMounted, setHasMounted] = React.useState(false);
  const [clerkTimedOut, setClerkTimedOut] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(false);
    const timeout = setTimeout(() => {
      setHasMounted(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Add a timeout specifically for Clerk loading on the home page
  React.useEffect(() => {
    if (!isClerkLoaded) {
      const timeoutId = setTimeout(() => {
        if (!isClerkLoaded) {
          // eslint-disable-next-line no-console
          console.warn('clerk loading timeout on home page - showing fallback');
          setClerkTimedOut(true);
        }
      }, 5000); // 5 second timeout for home page

      return () => clearTimeout(timeoutId);
    }
  }, [isClerkLoaded]);

  // Apply user's color themes when user data changes
  React.useEffect(() => {
    if (currentUser) {
      const primaryColor =
        currentUser.primaryColor || currentUser.themeColor || 'pink';
      const secondaryColor = currentUser.secondaryColor || 'orange';

      setColorTheme(`${primaryColor}-primary` as PrimaryColorTheme);
      setSecondaryColorTheme(
        `${secondaryColor}-secondary` as SecondaryColorTheme
      );
    }
  }, [currentUser, setColorTheme, setSecondaryColorTheme]);

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div
          data-has-mounted={hasMounted}
          className="from-theme-primary to-theme-secondary animate-gradient-shift rounded-2xl bg-gradient-to-r p-8 text-white transition delay-100 duration-500 data-[has-mounted=false]:opacity-0 data-[has-mounted=true]:opacity-100 md:p-12"
          style={{ backgroundSize: '200% 200%' }}
        >
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold lowercase md:text-5xl">
              we're vibing here
            </h1>
            <p className="mb-6 text-lg opacity-90 md:text-xl">
              welcome to <strong>{APP_NAME}</strong>, where you can discover,
              share, and rate vibes because that's a thing you can do
            </p>

            {/* Show skeleton while Clerk is loading, unless it times out */}
            {!isClerkLoaded && !clerkTimedOut ? (
              <HeroButtonsSkeleton />
            ) : (
              <>
                {clerkTimedOut && !isClerkLoaded ? (
                  // Fallback UI when Clerk fails to load
                  <div className="space-y-4">
                    <p className="text-lg opacity-75">
                      authentication service is currently unavailable
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                    >
                      <Link to="/discover" search={{}}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        browse vibes anyway
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <SignedIn>
                      <div className="flex gap-3">
                        <Button
                          asChild
                          variant="outline"
                          className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                        >
                          <Link to="/vibes/create">
                            <Plus className="mr-2 h-4 w-4" />
                            create vibe
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                        >
                          <Link to="/discover" search={{}}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            discover vibes
                          </Link>
                        </Button>
                      </div>
                    </SignedIn>
                    <SignedOut>
                      <p className="text-lg opacity-75">
                        sign in to start creating and sharing your own vibes
                      </p>
                    </SignedOut>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Home Feed */}
      <HomeFeed />
    </>
  );
}
