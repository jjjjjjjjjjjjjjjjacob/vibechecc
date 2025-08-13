import { createFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import { HomeFeed } from '@/components/home-feed';
import { SignedIn, SignedOut } from '@clerk/tanstack-react-start';
import { useCurrentUser } from '@/queries';
import { useTheme } from '@/features/theming/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';

/**
 * Route definition for the homepage.
 *
 * TanStack Start maps this file to the `/` path and renders the {@link Home}
 * component when users visit the root of the site.
 */
export const Route = createFileRoute('/')({
  component: Home,
});

/**
 * Homepage component that welcomes users and shows the main feed.
 *
 * It also applies the current user's chosen theme colors so the hero section
 * and other components match their preferences.
 */
function Home() {
  // Get current user's theme data and theme setters
  const { data: currentUser } = useCurrentUser();
  const { setColorTheme, setSecondaryColorTheme } = useTheme();

  // Apply user's color themes when user data changes
  React.useEffect(() => {
    if (currentUser) {
      // Derive primary and secondary colors with sensible fallbacks
      const primaryColor =
        currentUser.primaryColor || currentUser.themeColor || 'pink';
      const secondaryColor = currentUser.secondaryColor || 'orange';

      // Update global theme variables
      setColorTheme(`${primaryColor}-primary` as any);
      setSecondaryColorTheme(`${secondaryColor}-secondary` as any);
    }
  }, [currentUser, setColorTheme, setSecondaryColorTheme]);

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div
          className="from-theme-primary to-theme-secondary animate-gradient-shift rounded-2xl bg-gradient-to-r p-8 text-white md:p-12"
          style={{ backgroundSize: '200% 200%' }}
        >
          <div className="max-w-2xl">
            {/* Site tagline */}
            <h1 className="mb-4 text-4xl font-bold lowercase md:text-5xl">
              we're vibing here
            </h1>
            {/* Short marketing blurb about the app */}
            <p className="mb-6 text-lg opacity-90 md:text-xl">
              welcome to <strong>viberatr</strong>, where you can discover,
              share, and rate vibes from around the world
            </p>
            <SignedIn>
              <div className="flex gap-3">
                {/* Button for creating a new vibe */}
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
                {/* Button for browsing existing vibes */}
                <Button
                  asChild
                  variant="outline"
                  className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                >
                  <Link to="/discover">
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
          </div>
        </div>
      </section>

      {/* Home Feed */}
      <HomeFeed />
    </>
  );
}

export default Home;
