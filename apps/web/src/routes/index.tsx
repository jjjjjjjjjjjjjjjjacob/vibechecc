import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { HomeFeed } from '@/components/home-feed';
import { CreateVibeButton } from '@/components/create-vibe-button';
import { SignedIn, SignedOut } from '@clerk/tanstack-react-start';
import { useCurrentUser } from '@/queries';
import {
  getThemeById,
  injectUserThemeCSS,
  getThemeGradientClasses,
  DEFAULT_USER_THEME,
  type UserTheme,
} from '@/utils/theme-colors';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  // Get current user's theme
  const { data: currentUser } = useCurrentUser();
  const userTheme: UserTheme = {
    primaryColor:
      currentUser?.primaryColor ||
      currentUser?.themeColor ||
      DEFAULT_USER_THEME.primaryColor,
    secondaryColor:
      currentUser?.secondaryColor || DEFAULT_USER_THEME.secondaryColor,
  };
  const themeClasses = getThemeGradientClasses();

  // Inject theme CSS when user theme changes
  React.useEffect(() => {
    injectUserThemeCSS(userTheme);
  }, [userTheme]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div
          className={`rounded-2xl ${themeClasses.button} p-8 text-white md:p-12`}
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
              <CreateVibeButton
                variant="outline"
                className="bg-secondary/20 text-primary hover:bg-secondary-foreground/20"
              />
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
