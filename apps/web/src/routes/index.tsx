import { createFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import { HomeFeed } from '@/components/home-feed';
import { CreateVibeButton } from '@/components/create-vibe-button';
import { SignedIn, SignedOut } from '@clerk/tanstack-react-start';
import { useCurrentUser } from '@/queries';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  // Get current user's theme
  const { data: currentUser } = useCurrentUser();
  const { setColorTheme, setSecondaryColorTheme } = useTheme();

  // Apply user's color themes when user data changes
  React.useEffect(() => {
    if (currentUser) {
      const primaryColor =
        currentUser.primaryColor || currentUser.themeColor || 'pink';
      const secondaryColor = currentUser.secondaryColor || 'orange';

      setColorTheme(`${primaryColor}-primary` as any);
      setSecondaryColorTheme(`${secondaryColor}-secondary` as any);
    }
  }, [currentUser, setColorTheme, setSecondaryColorTheme]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div
          className="from-theme-primary to-theme-secondary animate-gradient-shift text-primary rounded-2xl bg-gradient-to-r p-8 md:p-12"
          style={{ backgroundSize: '200% 200%' }}
        >
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold lowercase md:text-5xl">
              discover and share vibes
            </h1>
            <p className="mb-6 text-lg opacity-90 md:text-xl">
              welcome to <strong>viberater</strong>, where you can discover,
              share, and rate vibes from around the world
            </p>
            <SignedIn>
              <div className="flex gap-3">
                <CreateVibeButton
                  variant="outline"
                  className="bg-secondary/20 text-primary hover:bg-secondary-foreground/20"
                />
                <Button
                  asChild
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
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
    </div>
  );
}
